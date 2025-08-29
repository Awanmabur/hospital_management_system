const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Payment = require('../models/Payment');

exports.index = async (req, res) => {
  try {
    const token = req.session.token;
    if (!token) {
      req.flash('error', 'Session expired. Please log in again.');
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;

    const bookings = await Booking.find({ user: userId }).select('_id');
    const bookingIds = bookings.map(b => b._id);

    const payments = await Payment.find({ })
      // .sort({ createdAt: -1 })
      // .populate({
      //   path: 'booking',
      //   populate: {
      //     path: 'item',
      //     select: 'title name', // Event or service name
      //   }
      // });

    res.render('bookings/payment', { payments });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load your payment history.');
    res.redirect('/');
  }
};
