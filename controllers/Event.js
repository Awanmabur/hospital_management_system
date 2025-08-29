// eventController.js
const Event = require('../models/Event');
const Service = require('../models/Service');
const Promotion = require('../models/Promotion');
const Blog  = require('../models/Blog');
const Share = require('../models/Share');
const User = require('../models/User');
const Review = require('../models/Review');
const { generateEventJSONLD } = require("./Seo");

const jwt = require('jsonwebtoken');
const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;


// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});


function shuffleArray(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}


exports.generateEventJSONLDEndpoint = async (req, res) => {
  try {
    const event = await Event.findById(req.params.id);
    if (!event) return res.status(404).json({ error: "Event not found" });

    const jsonld = generateEventJSONLD(event);
    res.json(jsonld);
  } catch (err) {
    console.error("Error generating JSON-LD:", err);
    res.status(500).json({ error: "Server error" });
  }
};



exports.index = async (req, res) => {
  try {
    const userId = req.user;
    const isUserLogin = await User.findById(userId);
    const services = await Service.find({});
    const events = await Event.find({});
    const promotions = await Promotion.find({
      type: { $in: ['service', 'event'] },
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const eventIds = promotions.map(p => p.itemId);
    const promotedServices = await Service.find({ _id: { $in: eventIds } });
    const eventsPromoted = await Event.find({ _id: { $in: eventIds } });
    const promotedEvents = [...promotedServices, ...eventsPromoted];
    const shuffledPosts = shuffleArray([...promotedServices, ...eventsPromoted, ...events ]);
    const blogs = await Blog.find({});
    const topPromoter = await User.find({ role: 'promoter' }).sort({ views: -1 });
    const topOrganizer = await User.find({ role: 'organizer' }).sort({ views: -1 });
    const popularEvents = await Event.find().sort({ views: -1 });

    res.render('./events/index', { events, blogs, popularEvents,
    promotedEvents,
    services, topPromoter, topOrganizer, userId, isUserLogin });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Could not load events.');
    res.redirect('/');
  }
};


exports.featured = async (req, res) => {
  try {
    const userId = req.user;
    const isUserLogin = await User.findById(userId);
    const services = await Service.find({});
    const events = await Event.find({});
    const promotions = await Promotion.find({
      type: { $in: ['service', 'event'] },
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const eventIds = promotions.map(p => p.itemId);
    const promotedServices = await Service.find({ _id: { $in: eventIds } });
    const eventsPromoted = await Event.find({ _id: { $in: eventIds } });
    const promotedEvents = [...promotedServices, ...eventsPromoted];
    const ratedEventIds = await Review.aggregate([
      {
        $group: {
          _id: "$event",
          totalRating: { $sum: "$rating" },
        },
      },
      {
        $match: {
          totalRating: { $gte: 10 }
        },
      },
    ]);

    const highRatedEventIds = ratedEventIds.map(r => r._id);

    const featuredEvents = await Event.find({
      $or: [
        { _id: { $in: highRatedEventIds } },
        { _id: { $in: promotedEvents } }
      ]
    });

    res.render('./events/featuredEvents', { events,
    promotedEvents, featuredEvents,
    services, userId, isUserLogin });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Could not load events.');
    res.redirect('/');
  }
};


exports.online = async (req, res) => {
  try {
    const userId = req.user;
    const isUserLogin = await User.findById(userId);
    const services = await Service.find({});
    const events = await Event.find({});
    const promotions = await Promotion.find({
      type: { $in: ['service', 'event'] },
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const eventIds = promotions.map(p => p.itemId);
    const promotedServices = await Service.find({ _id: { $in: eventIds } });
    const eventsPromoted = await Event.find({ _id: { $in: eventIds } });
    const promotedEvents = [...promotedServices, ...eventsPromoted];
    const onlineEvents = await Event.find({ event_mode: 'online' });

    res.render('./events/onlineEvents', { events,
    promotedEvents, onlineEvents,
    services, userId, isUserLogin });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Could not load events.');
    res.redirect('/');
  }
};


exports.trendings = async (req, res) => {
  try {
    const userId = req.user;
    const isUserLogin = await User.findById(userId);
    const services = await Service.find({});
    const events = await Event.find({});
    const promotions = await Promotion.find({
      type: { $in: ['service', 'event'] },
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const eventIds = promotions.map(p => p.itemId);
    const promotedServices = await Service.find({ _id: { $in: eventIds } });
    const eventsPromoted = await Event.find({ _id: { $in: eventIds } });
    const promotedEvents = [...promotedServices, ...eventsPromoted];
    const trendingsEvents = await Event.find({ views: { $gte: 5 } }).sort({ views: -1 });

    res.render('./events/trendingsEvents', { events,
    promotedEvents, trendingsEvents,
    services, userId, isUserLogin });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Could not load events.');
    res.redirect('/');
  }
};


exports.popular = async (req, res) => {
  try {
    const userId = req.user;
    const isUserLogin = await User.findById(userId);
    const services = await Service.find({});
    const events = await Event.find({});
    const promotions = await Promotion.find({
      type: { $in: ['service', 'event'] },
      status: 'active',
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    const eventIds = promotions.map(p => p.itemId);
    const promotedServices = await Service.find({ _id: { $in: eventIds } });
    const eventsPromoted = await Event.find({ _id: { $in: eventIds } });
    const promotedEvents = [...promotedServices, ...eventsPromoted];
    const popularEvents = await Event.find().sort({ views: -1 });

    res.render('./events/popularEvents', { events,
    promotedEvents, popularEvents,
    services, userId, isUserLogin });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Could not load events.');
    res.redirect('/');
  }
};


exports.show = async (req, res) => {
  try {
    const userId = req.user;

    const isUserLogin = await User.findById(userId);

    const user = req.user ? await User.findById(req.user) : null;

    const { eventId, id, type } = req.params;


    const event = await Event.findById(id)
    .populate('created_by')
    .populate('promoted_by');

    const organizerId = event.created_by?._id;
    const otherEventsByOrganizer = await Event.find({
      created_by: organizerId,
      _id: { $ne: id } // exclude the current event
    });

    if (!event) {
     req.flash('error', 'Event not found');
     return res.redirect('/');
    }

    const events = await Event.find({});

    const services = await Service.find({});

    const totalEvents = await Event.countDocuments({ created_by: event.created_by._id });
    const totalEventShared = await Event.countDocuments({ promoted_by: event.promoted_by });

    // Fetch share info for this event
    const promoters = await Share.find({ eventId: event })
      .populate('promoted_by', 'username role')
      .sort({ createdAt: -1 });

    // Fetch JSON-LD from your own API endpoint
    const jsonld = generateEventJSONLD(event);

    // Fetch share info for this event
    const shares = await Share.find({ eventId: event })


    let shareCount = await Share.countDocuments({ eventId: event });

    let item = null;

    if (type === 'event') {
      item = await Event.findById(id);
    } else {
      req.flash('error', 'Event type is invalid.');
      return res.redirect('/');
    }

    let rating = null;
    let reviews = [];

    if (userId) {
      // Only find personal rating and reviews if logged in
      rating = await Review.findOne({ event: event._id, userId: userId._id });
      reviews = await Review.find({ event: event._id }).populate('user');
    } else {
      // Fetch public reviews only
      reviews = await Review.find({ event: event._id }).populate('user');
    }

    // Calculate average rating
    const averageRating = reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;

    // Format reviews for EJS
    const formattedReviews = reviews.map((review) => ({
      userName: review.user?.username || 'Anonymous',
      comment: review.comment,
      rating: review.rating
    }));

    // Increment views count
    event.views += 1;
    await event.save();

    // Render page for both logged in and not logged in
    res.render('events/show', {
      event,
      eventId,
      jsonld,
      existingRating: rating,
      averageRating,
      reviews: formattedReviews,
      totalEvents,
      totalEventShared,
      user,
      item,
      type,
      promoters,
      shares,
      shareCount,
      isUserLogin,
      events,
      services,
      otherEventsByOrganizer
    });
  } catch (error) {
    console.log(error);
    req.flash('error', 'Event not found.');
    res.redirect('/');
  }
};

// Create or update a rating
exports.rating = async (req, res) => {
     const token = req.session.token;
  try {

    if (!token) {
      req.flash('error', 'Session expired. Please log in.');
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const { id } = req.params;
    const { rating, comment } = req.body;

    const eventId = req.params.id;

    // Check if service exists
    const event = await  Event.findOne({ _id: id });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    // Check if user has already rated this service
    let existingRating = await Review.findOne({ user: user._id, event: event });

    if (existingRating) {
      // Update existing rating
      existingRating.rating = rating;
      existingRating.comment = comment;
      await existingRating.save();
    } else {
      // Create new rating
      const newRating = new Review({
        user: user._id,
        event: event,
        rating,
        comment
      });
      await newRating.save();
    }

    req.flash('success', 'Event updated successfully.');
    res.redirect(`/show/${eventId}`);
  } catch (error) {
    console.log(error);
    req.flash('error', 'Error updating event.');
    res.redirect('/adminProfile');
  }
};





// exports.store = async (req, res) => {
//   const token = req.session.token;
//
//   if (!token) {
//     req.flash('error', 'Session expired. Please log in.');
//     return res.redirect('/login');
//   }
//
//   try {
//     const decoded = jwt.verify(token, 'jwtSecret');
//     const user = await User.findById(decoded.userId);
//
//     const {
//       title,
//       description,
//       category,
//       date,
//       time,
//       event_mode,
//       type,
//       location,
//       is_free,
//       ordinary_price,
//       vip_price,
//       table_price,
//       ordinary_total,
//       vip_total,
//       table_total
//     } = req.body;
//
//     let imageUrl = null;
//
//     // Image upload to Cloudinary
//     if (req.file) {
//       const buffer = await sharp(req.file.buffer)
//         .resize(800)
//         .jpeg({ quality: 80 })
//         .toBuffer();
//
//       const result = await new Promise((resolve, reject) => {
//         cloudinary.uploader.upload_stream(
//           { folder: 'Event_Images' },
//           (error, result) => {
//             if (error) reject(error);
//             else resolve(result);
//           }
//         ).end(buffer);
//       });
//
//       imageUrl = result.secure_url;
//     }
//
//     const isFreeEvent = is_free === 'on' || is_free === true;
//
//     const ticket_types = [];
//
//     if (!isFreeEvent) {
//       if (ordinary_price) {
//         ticket_types.push({
//           type: 'ordinary',
//           initial_price: Number(ordinary_price),
//           current_price: Number(ordinary_price),
//           total_available: Number(ordinary_total || 100)
//         });
//       }
//
//       if (vip_price) {
//         ticket_types.push({
//           type: 'vip',
//           initial_price: Number(vip_price),
//           current_price: Number(vip_price),
//           total_available: Number(vip_total || 50)
//         });
//       }
//
//       if (table_price) {
//         ticket_types.push({
//           type: 'table',
//           initial_price: Number(table_price),
//           current_price: Number(table_price),
//           total_available: Number(table_total || 10)
//         });
//       }
//     }
//
//     const event = new Event({
//       title,
//       description,
//       category,
//       date: new Date(`${date}T${time}`),
//       location,
//       type: "event",
//       event_mode,
//       image: imageUrl,
//       is_free: isFreeEvent,
//       ticket_types,
//       created_by: user._id
//     });
//
//     await event.save();
//
//     req.flash('success', 'Event created successfully.');
//     res.redirect(`/organiserDashboard/${user._id}`);
//   } catch (error) {
//     req.flash('error', 'Error creating event.');
//     res.redirect(`/organiserDashboard/${user._id}`);
//   }
// };



// Helper: normalize checkbox/boolean
const asBool = v => v === true || v === 'true' || v === 'on' || v === '1';

// Helper: number or null
const asNum = v => (v === undefined || v === null || v === '' ? null : Number(v));

// Helper: parse date/time into JS Date (simple, server TZ). If you use moment/luxon, swap here.
function toDateTime(dateStr, timeStr) {
  if (!dateStr) return null;
  if (!timeStr) return new Date(dateStr);
  // Accept "HH:mm" or "HH:mm:ss"
  return new Date(`${dateStr}T${timeStr}`);
}

// Helper: clean comma-separated tags -> array
function parseTags(input) {
  if (!input) return [];
  if (Array.isArray(input)) return input.map(t => String(t).trim()).filter(Boolean);
  return String(input)
    .split(',')
    .map(t => t.trim())
    .filter(Boolean);
}

// Build a ticket object per schema
function buildTicket({ code, label, price, total, currency = 'USD', sales_start, sales_end, min_per_order, max_per_order }) {
  const initial = asNum(price) ?? 0;
  const totalAvail = Math.max(0, Number(total || 0));
  return {
    code,
    label,
    description: `${label} ticket`,
    ticket_status: 'unpaid',
    initial_price: initial,
    current_price: initial,
    currency,
    sales_start: sales_start ? new Date(sales_start) : undefined,
    sales_end: sales_end ? new Date(sales_end) : undefined,
    min_per_order: Math.max(1, Number(min_per_order || 1)),
    max_per_order: Math.max(1, Number(max_per_order || 10)),
    total_available: totalAvail,
    sold: 0,
    reserved: 0,
    is_hidden: false,
    fees_included: true,
  };
}

exports.store = async (req, res) => {
  const token = req.session?.token;

  if (!token) {
    req.flash('error', 'Session expired. Please log in.');
    return res.redirect('/login');
  }

  let user;
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'jwtSecret');
    user = await User.findById(decoded.userId);
    if (!user) {
      req.flash('error', 'User not found. Please log in again.');
      return res.redirect('/login');
    }
  } catch (err) {
    console.error('JWT verification failed:', err);
    req.flash('error', 'Invalid session. Please log in again.');
    return res.redirect('/login');
  }

  try {
    // Body fields expected from your form
    const {
      // Core
      title,
      description,
      category,
      tags,
      // Scheduling
      date,        // e.g. "2025-09-30"
      time,        // e.g. "18:30"
      end_date,    // optional
      end_time,    // optional
      timezone,    // optional (string)
      // Mode / venue
      event_mode,  // 'online' | 'offline' | 'hybrid'
      location,    // free-text venue name (maps to venue.name)
      addressLine1,
      addressLine2,
      city,
      state,
      country,
      postalCode,
      // For online
      online_link,
      // Monetization / currency
      is_free,
      currency,
      // Tickets (ordinary, vip, table)
      ordinary_price,
      vip_price,
      table_price,
      ordinary_total,
      vip_total,
      table_total,
      ordinary_sales_start,
      ordinary_sales_end,
      vip_sales_start,
      vip_sales_end,
      table_sales_start,
      table_sales_end,
      ordinary_min,
      ordinary_max,
      vip_min,
      vip_max,
      table_min,
      table_max,
      // Promotions (optional inputs; states will activate when *_Expires is in future)
      isPromoted,
      promotionExpires,
      isFeatured,
      featuredExpires,
    } = req.body;

    if (!title || !category || !event_mode || !date) {
      req.flash('error', 'Title, category, event mode, and date are required.');
      return res.redirect('back');
    }

    // Dates
    const start_time = toDateTime(date, time);
    const end_time_dt = (end_date || end_time) ? toDateTime(end_date || date, end_time || time) : null;

    if (!start_time || isNaN(start_time.getTime())) {
      req.flash('error', 'Invalid start date/time.');
      return res.redirect('back');
    }
    if (end_time_dt && end_time_dt <= start_time) {
      req.flash('error', 'End time must be after start time.');
      return res.redirect('back');
    }

    // Upload images
    // Support single cover (req.file) and optional gallery (req.files?.gallery[])
    let cover_image = null;
    const gallery = [];

    // Single cover image
    if (req.file) {
      const buffer = await sharp(req.file.buffer)
        .resize(1200, 675, { fit: 'cover' })
        .jpeg({ quality: 82 })
        .toBuffer();

      const uploaded = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'Event_Images' },
          (error, result) => (error ? reject(error) : resolve(result))
        ).end(buffer);
      });

      cover_image = uploaded.secure_url;
    }

    // Multiple gallery images (if your middleware populates req.files.gallery)
    if (req.files?.gallery && Array.isArray(req.files.gallery)) {
      for (const f of req.files.gallery) {
        try {
          const buf = await sharp(f.buffer)
            .resize(1600, 900, { fit: 'cover' })
            .jpeg({ quality: 80 })
            .toBuffer();

          const up = await new Promise((resolve, reject) => {
            cloudinary.uploader.upload_stream(
              { folder: 'Event_Images/Gallery' },
              (error, result) => (error ? reject(error) : resolve(result))
            ).end(buf);
          });

          gallery.push(up.secure_url);
        } catch (gErr) {
          console.error('Gallery upload failed:', gErr?.message || gErr);
        }
      }
    }

    // Tickets
    const isFreeEvent = asBool(is_free);
    const ticket_types = [];

    const cur = (currency && /^[A-Z]{3}$/.test(currency)) ? currency : 'USD';
    if (!isFreeEvent) {
      if (ordinary_price) {
        ticket_types.push(buildTicket({
          code: 'ordinary',
          label: 'Ordinary',
          price: ordinary_price,
          total: ordinary_total || 100,
          currency: cur,
          sales_start: ordinary_sales_start,
          sales_end: ordinary_sales_end,
          min_per_order: ordinary_min,
          max_per_order: ordinary_max,
        }));
      }
      if (vip_price) {
        ticket_types.push(buildTicket({
          code: 'vip',
          label: 'VIP',
          price: vip_price,
          total: vip_total || 50,
          currency: cur,
          sales_start: vip_sales_start,
          sales_end: vip_sales_end,
          min_per_order: vip_min,
          max_per_order: vip_max,
        }));
      }
      if (table_price) {
        ticket_types.push(buildTicket({
          code: 'table',
          label: 'Table',
          price: table_price,
          total: table_total || 10,
          currency: cur,
          sales_start: table_sales_start,
          sales_end: table_sales_end,
          min_per_order: table_min,
          max_per_order: table_max,
        }));
      }

      // Ensure unique codes
      const codes = ticket_types.map(t => t.code);
      if (new Set(codes).size !== codes.length) {
        req.flash('error', 'Ticket type codes must be unique.');
        return res.redirect('back');
      }
    }

    // Venue structure (map free-text "location" to venue.name if other fields missing)
    const venue = {
      name: location || undefined,
      addressLine1: addressLine1 || undefined,
      addressLine2: addressLine2 || undefined,
      city: city || undefined,
      state: state || undefined,
      country: country || undefined,
      postalCode: postalCode || undefined,
      // location.coordinates can be added later via admin UI/geocoder
    };

    // Build event payload per schema
    const event = new Event({
      title,
      description,
      category,
      tags: parseTags(tags),
      seo: {
        metaTitle: title?.slice(0, 70),
        metaDescription: (description || '').slice(0, 160),
      },
      start_time,
      end_time: end_time_dt || undefined,
      timezone: timezone || 'Africa/Juba',
      event_mode,
      venue: event_mode === 'online' ? undefined : venue,
      online_link: event_mode !== 'offline' ? (online_link || undefined) : undefined,
      cover_image,
      gallery,
      visibility: 'public',
      status: 'pending_review',
      is_deleted: false,
      is_free: isFreeEvent,
      currency: cur,
      ticket_types,
      // Promotions default off; expires dates optional (activate when in future)
      isPromoted: asBool(isPromoted),
      promotionExpires: promotionExpires ? new Date(promotionExpires) : undefined,
      isFeatured: asBool(isFeatured),
      featuredExpires: featuredExpires ? new Date(featuredExpires) : undefined,
      is_approved: false,
      created_by: user._id,
      updated_by: user._id,
    });

    // Auto-generate the 10-day price ramp schedule (per your schema’s helper)
    // Will only matter for paid tickets
    if (!isFreeEvent && typeof event.generateDefaultPriceSchedule === 'function') {
      event.generateDefaultPriceSchedule();
    }

    // Save (slug is auto-generated in schema pre-validate hook)
    await event.save();

    req.flash('success', 'Event created successfully and submitted for review.');
    return res.redirect(`/organiserDashboard/${user._id}`);
  } catch (err) {
    console.error('Event creation error:', err);
    req.flash('error', 'Error creating event. Please try again.');
    return res.redirect(`/organiserDashboard/${user?._id || ''}`);
  }
};



// Get Event for Edit
exports.edit = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash('error', 'Session expired. Please log in again.');
    return res.redirect('/login');
  }

  try {
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    const eventId = req.params.id;

    const isUserLogin = await User.findById(userId);


    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/profile');
    }

    const ordinary = event.ticket_types.find(t => t.type === 'ordinary');
    const vip = event.ticket_types.find(t => t.type === 'vip');
    const table = event.ticket_types.find(t => t.type === 'table');

    res.render('./events/edit', { event, ordinary, vip, table, userId, isUserLogin });

  } catch (err) {
    console.error('Error retrieving event:', err);
    req.flash('error', 'Error retrieving event.');
    res.redirect(`/organiserDashboard/${user._id}`);
  }
};

// Edit Event
exports.update = async (req, res) => {
  const token = req.session.token;

  if (!token) {
    req.flash('error', 'Session expired. Please log in.');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const eventId = req.params.id;
    const existingEvent = await Event.findById(eventId);

    if (!existingEvent || !existingEvent.created_by.equals(user._id)) {
      req.flash('error', 'Unauthorized or event not found.');
      return res.redirect('/adminProfile');
    }

    const {
      title,
      description,
      category,
      date,
      time,
      location,
      is_free,
      event_mode,
      ordinary_price,
      vip_price,
      table_price,
      ordinary_total,
      vip_total,
      table_total
    } = req.body;

    let imageUrl = existingEvent.image;

    // If a new file is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (existingEvent.image) {
        const publicId = existingEvent.image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`Event_Images/${publicId}`);
      }

      const buffer = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();

      const result = await new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          { folder: 'Event_Images' },
          (error, result) => {
            if (error) reject(error);
            else resolve(result);
          }
        ).end(buffer);
      });

      imageUrl = result.secure_url;
    }

    const isFreeEvent = is_free === 'on' || is_free === true;

    const ticket_types = [];

    if (!isFreeEvent) {
      if (ordinary_price) {
        ticket_types.push({
          type: 'ordinary',
          initial_price: Number(ordinary_price),
          current_price: Number(ordinary_price),
          total_available: Number(ordinary_total || 100)
        });
      }
      if (vip_price) {
        ticket_types.push({
          type: 'vip',
          initial_price: Number(vip_price),
          current_price: Number(vip_price),
          total_available: Number(vip_total || 50)
        });
      }
      if (table_price) {
        ticket_types.push({
          type: 'table',
          initial_price: Number(table_price),
          current_price: Number(table_price),
          total_available: Number(table_total || 10)
        });
      }
    }

    existingEvent.title = title;
    existingEvent.description = description;
    existingEvent.category = category;
    existingEvent.date = new Date(`${date}T${time}`);
    existingEvent.location = location;
    existingEvent.image = imageUrl;
    existingEvent.is_free = isFreeEvent;
    existingEvent.event_mode = event_mode;
    existingEvent.ticket_types = ticket_types;

    await existingEvent.save();

    req.flash('success', 'Event updated successfully.');
    res.redirect(`/show/event/${eventId}`);
  } catch (error) {
    console.error(error);
    req.flash('error', 'Error updating event.');
    res.redirect('/adminProfile');
  }
};

// Delete Event
exports.destroy = async (req, res) => {
  const token = req.session.token;
  if (!token) {
    req.flash('error', 'Session expired. Please log in again.');
    return res.redirect('/login');
  }

  try {
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    const eventId = req.params.eventId;

    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('/profile');
    }

    if (event.image) {
      const publicId = event.image.split('/').pop().split('.')[0];
      await cloudinary.uploader.destroy(`Event_Images/${publicId}`);
    }

    await event.deleteOne({ _id: eventId });
    req.flash('success', 'Event deleted successfully.');
    res.redirect('/profile');
  } catch (err) {
    console.error('Error deleting event:', err);
    req.flash('error', 'Error deleting event.');
    res.redirect('/');
  }
};
