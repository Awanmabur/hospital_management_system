// bookingController.js;
const jwt = require('jsonwebtoken');
const QRCode = require('qrcode');

const Event = require('../models/Event');
const Service = require('../models/Service');
const Booking = require('../models/Booking');
const User = require('../models/User')
const Payment = require('../models/Payment');


exports.show = async (req, res) => {
  try {

    const token = req.session.token;
    if (!token) {
      req.flash('error', 'Please login to view your ticket.');
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;

    const isUserLogin = await User.findById(userId);

    const ticketId = req.params.id;

    const booking = await Booking.findById(req.params.id).lean();

    if (booking.for_type === 'event') {
      booking.item = await Event.findById(booking.item).populate('created_by').lean();
    } else if (booking.for_type === 'service') {
      booking.item = await Service.findById(booking.item).populate('created_by').lean();
    }

    if (!booking) {
      req.flash('error', 'Ticket not found or access denied.');
      return res.redirect('/my-tickets');
    }

    res.render('bookings/ticket', { booking, userId, isUserLogin });
  } catch (error) {
    console.error('Ticket view error:', error);
    req.flash('error', 'Failed to load ticket.');
    res.redirect('/my-tickets');
  }
};


exports.create = async (req, res) => {
  try {
    const { type, id } = req.params;

    const userId = req.user;

    const isUserLogin = await User.findById(userId);

    // Attribution from session (set earlier when following share link)
    const attribution = req.session.shareAttribution || {};
    let { shareRef, promoterRef } = attribution;

    const token = req.session.token;
    if (!token) {
      req.flash('error', 'Please log in or sign up in order to book your ticket.');
      return res.redirect('/login');
    }

    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtSecret');
    } catch (err) {
      req.flash('error', 'Please log in or sign up in order to book your ticket.');
      return res.redirect('/login');
    }

    const user = await User.findById(decoded.userId);
    if (!user) {
      req.flash('error', 'User not found. Please log in again.');
      return res.redirect('/login');
    }

    let item = null;

    if (type === 'event') {
      item = await Event.findById(id);
    } else if (type === 'service') {
      item = await Service.findById(id);
    } else {
      req.flash('error', 'Invalid booking type.');
      return res.redirect('/');
    }

    if (!item) {
      req.flash('error', 'Item not found.');
      return res.redirect('/');
    }

    res.render('bookings/create', { type, item, user, shareRef, promoterRef, userId, isUserLogin });
  } catch (error) {
    console.error(error);
    req.flash('error', 'An error occurred while processing your booking.');
    return res.redirect('/');
  }
};


exports.store = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash('error', 'Please log in or sign up in order to book your ticket.');
    return res.redirect('/login');
  }

  try {
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    const {
      for_type, // 'event' or 'service'
      itemId,
      full_name,
      email,
      phone,
      ticket_types,
      quantity,
      total_paid,
      platformCutPercent,
      promoterCutPercent,
      ownerCutPercent,
      paymentMethod,
      booking_reference
    } = req.body;

    // Attribution from session (set earlier when following share link)
    const attribution = req.session.shareAttribution || {};
    let { shareRef, promoterRef } = attribution;

    // Prevent self-referral: if promoterRef equals buyer
    if (promoterRef && promoterRef.toString() === userId.toString()) {
      promoterRef = null;
      shareRef = null;
    }

    const Model = for_type === 'event' ? Event : Service;

    let item;
    try {
      item = await Model.findById(itemId);
    } catch (e) {
      req.flash('error', 'Invalid booking type.');
      return res.redirect('/');
    }

    if (!item) {
      req.flash('error', 'Item not found in database.');
      return res.redirect('/');
    }

    function applyDynamicPricing(item, isEvent) {
    if (!isEvent || !item.price_change_schedule || !item.ticket_types) return item;

    const now = new Date();
    const eventDate = new Date(item.date); // Adjust field if it's called something else
    const daysBefore = Math.ceil((eventDate - now) / (1000 * 60 * 60 * 24));

    for (const schedule of item.price_change_schedule) {
      if (daysBefore <= schedule.days_before_event) {
        item.ticket_types = item.ticket_types.map(tt => {
          const newPrice = schedule.new_prices[tt.type];
          return {
            ...tt,
            current_price: newPrice !== undefined ? newPrice : tt.current_price
          };
        });
        break;
      }
    }

    return item;
  }

  // Dynamic pricing

  let totalPrice = 0;

  // 1. Fetch the item
  if (for_type === 'event') {
    item = await Event.findById(itemId).populate('promoted_by');
    if (!item) {
      req.flash('error', 'Item not found in database.');
      return res.redirect('/');
    }

    const selectedTicket = item.ticket_types.find(t => t.type === ticket_types);

    const unitPrice = selectedTicket.current_price;
    totalPrice = unitPrice * quantity;

    // Update ticket count
    selectedTicket.sold += quantity;
    await item.save();

  } else if (for_type === 'service') {
    item = await Service.findById(itemId);
    if (!item) {
      req.flash('error', 'Item not service in database.');
      return res.redirect('/');
    }

    // 2. Set price based on service category
    if (item.category === 'hotel') {
      totalPrice = parseFloat(item.price_per_night) || 0;

    } else if (item.category === 'car') {
      totalPrice = item.rent_per_day || 0;

    } else if (item.category === 'eventhall') {
      totalPrice = item.price_per_day || 0;

    } else if (item.category === 'dj') {
      totalPrice = item.dj_price || 0;

    } else if (item.category === 'photographer') {
      totalPrice = item.photographer_price || 0;

    } else if (item.category === 'caterer') {
      totalPrice = item.price_per_plate || 0;

    } else if (item.category === 'decorator') {
      totalPrice = item.decorator_price || 0;

    } else if (item.category === 'makeup_artist') {
      totalPrice = item.makeup_price || 0;

    } else if (item.category === 'others') {
      totalPrice = item.price_range?.min || 0;
    }
  }


  // Commission splits
  const promoterCut = promoterRef ? totalPrice * 0.05 : 0;
  const platformCut = totalPrice * 0.10;
  const ownerCut = totalPrice - platformCut - promoterCut;

  // Create Booking
  const booking = await Booking.create({
    userId,
    for_type,
    item: itemId,
    full_name,
    email,
    phone,
    ticket_types,
    quantity,
    total_paid: totalPrice,
    shareRef,
    promoterRef,
    platformCut,
    promoterCut,
    ownerCut,
    platformCutPercent,
    promoterCutPercent,
    ownerCutPercent,
    status: 'confirmed'
  });

  // Create Payment
  const payment = await Payment.create({
    userId,
    bookingId: booking._id,
    for_type,
    item: itemId,
    type: for_type === 'event' ? 'ticket' : 'service',
    amount: totalPrice,
    method: paymentMethod,
    status: 'completed',
    paid_at: new Date(),
    promoterCut,
    platformCut,
    ownerCut
  });

  // After booking and payment are created:
  const ticketData = {
    booking_reference:booking.booking_reference
  };

  const qrCode = await QRCode.toDataURL(booking.booking_reference);

  // Save it to the booking
  booking.qr_code = qrCode;
  await booking.save();

  await Booking.findByIdAndUpdate(payment.bookingId, {
    status: 'confirmed',
    ticket_status: 'active'
  });

  req.flash('success', 'You have successfully booked your ticket');
  res.redirect(`/myticket/${booking._id}`);

} catch (error) {
  console.log(error);
  req.flash('error', 'There is problem booking this ticket.');
  return res.redirect('/');
}
};
