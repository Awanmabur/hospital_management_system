const express = require('express');
const router = express.Router();
const moment = require('moment');
const User = require("../models/User");
const bcrypt = require("bcrypt");
const jwt = require('jsonwebtoken');
const Booking = require('../models/Booking');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');
const path = require('path');
const fs = require("fs")
const Service = require('../models/Service');
const jwtSecret = process.env.PRIVATE_KEY;
// const BlogPost = require('../models/BlogPost');
// const Review = require('../models/review');
const Subscriber = require('../models/subscribers');
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const Event = require('../models/Event');
const Blog = require('../models/Blog');

const sharp = require('sharp');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, // Your Cloudinary cloud name
  api_key: process.env.CLOUDINARY_API_KEY,       // Your Cloudinary API key
  api_secret: process.env.CLOUDINARY_API_SECRET, // Your Cloudinary API secret
});


// ***transporter***
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USERNAME,
    pass: process.env.EMAIL_PASSWORD,
  },
});


exports.subscribe = async (req, res, next) => {
  const { email } = req.body;
  try {
    const existingEmail = await Subscriber.findOne({ email });

    if (existingEmail) {
      req.flash('error', 'email already exists in the database');
      return res.redirect('/');
  } else {
    const subscriber = new Subscriber({ email });
    await subscriber.save();

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USERNAME,
      to: email,
      subject: 'Thank you for subscribing to our newsletter.',
      text: 'You have successfully subscribed to our newsletter, stay tuned for any tech update or business blogs.'
    };

    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        req.flash('error', 'there is problem some where please try again later');
        return res.redirect('/');
      } else {
        req.flash('success', 'You have successfully subscribe to our newsletter thanks.');
        res.redirect('/');
      }
    });

    }
  } catch (error) {
    req.flash('error', 'there is problem some where please try again later');
    return res.redirect('/');
  }
};



exports.organizer = async (req, res) => {
  try {
    const token = req.session.token;

    if (!token) {
      req.flash('error', 'You must be logged in');
      return res.redirect('/login');
    }

    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5);

    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;

    const isUserLogin = await User.findById(userId);

    const user = await User.findById(userId);
    if (!user || user.role !== 'organizer') return res.status(404).send('Organizer not found');

    const signupDate = moment(user.createdAt).startOf('month');
    const currentMonth = moment().startOf('month');

    // Calculate sliding window: 3 past + current + 2 future
    const months = [];
    const startMonth = moment(currentMonth).subtract(3, 'months');

    for (let i = 0; i < 6; i++) {
      const month = moment(startMonth).add(i, 'months');
      if (month.isSameOrAfter(signupDate)) {
        months.push(month);
      }
    }

    // Prepare empty revenue map
    const monthlyRevenue = {}; // Key = 'YYYY-MM', Value = revenue
    months.forEach(m => {
      monthlyRevenue[m.format('YYYY-MM')] = 0;
    });

    const events = await Event.find({ created_by: user._id });

    const eventIds = events.map(event => event._id);

    const bookings = await Booking.find({
      for_type: 'event',
      item: { $in: eventIds }
    })
    .populate('userId', 'username email role full_name')
    .populate('item', 'title');

    // 2. Get bookings for each event
    const eventBookings = await Promise.all(events.map(async (event) => {
      const bookings = await Booking.find({
        for_type: 'event',
        item: event._id
      }).populate('userId', 'username email role full_name phone status createdAt booking_reference ticket_status');

      return {
        event,
        bookings
      };
    }));

    const users = bookings.map(b => ({
      name: b.userId.username,
      email: b.userId.email,
      event: b.item?.title || 'Unknown Event',
      attendeeEmail: b.email,
      attendeeName: b.full_name,
      attendeePhone: b.phone,
      status: b.status,
      createdAt: b.createdAt,
      ticket_status: b.ticket_status,
      booking_reference: b.booking_reference
    }));

    // Revenue after cuts
    const today = moment().startOf('day').toDate();
    const promotionCut = 0.10;
    const platformCut = 0.05;
    const cutRate = 1 - (promotionCut + platformCut);

    // Initialize revenue counters
    let totalRevenue = 0;
    let tableRevenue = 0;
    let vipRevenue = 0;
    let ordinaryRevenue = 0;

    // Loop through bookings
    for (const booking of bookings) {
      const price = booking.ticket_price || 0;
      const net = price * cutRate;

      totalRevenue += net;

      if (booking.ticket_type === 'table') {
        tableRevenue += net;
      } else if (booking.ticket_type === 'vip') {
        vipRevenue += net;
      } else if (booking.ticket_type === 'ordinary') {
        ordinaryRevenue += net;
      }
    }


    for (const event of events) {
      const eventMonth = moment(event.createdAt).format('YYYY-MM');

      if (monthlyRevenue.hasOwnProperty(eventMonth)) {
        for (const ticket of event.ticket_types) {
          const revenue = (ticket.current_price || 0) * (ticket.sold || 0) * cutRate;
          monthlyRevenue[eventMonth] += revenue;
          totalRevenue += revenue;

          if (ticket.type === 'table') tableRevenue += revenue;
          if (ticket.type === 'vip') vipRevenue += revenue;
          if (ticket.type === 'ordinary') ordinaryRevenue += revenue;
        }
      }
    }


    const chartLabels = months.map(m => m.format('MMM YYYY'));
    const revenueData = months.map(m => Math.round(monthlyRevenue[m.format('YYYY-MM')]));


    // 2. Upcoming events
    const upcomingCount = await Event.countDocuments({
      created_by: user._id,
      date: { $gte: today }
    });

    // 3. Tickets sold & revenue
    let totalTicketsSold = 0;

    for (const event of events) {
      for (const ticket of event.ticket_types) {
        const sold = ticket.sold || 0;
        totalTicketsSold += sold;
        totalRevenue += sold * (ticket.current_price || 0) * cutRate;
      }
    }

    const attended = bookings.filter(b => b.ticket_status === 'used').length;
    const confirmed = bookings.filter(b =>
      b.ticket_status === 'used' || b.ticket_status === 'active'
    ).length;

    const attendanceRate = confirmed > 0
      ? Math.round((attended / confirmed) * 100)
      : 0;

    const walletBalance = totalRevenue;

    // Example recent transactions (from a Transaction model)
    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(10);

    // Balance is total revenue minus paid transactions
    const paidOut = transactions
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + tx.amount, 0);

    res.render('organisers/dashboard', {
    user,
    users,
    events,
    bookings,
    userId,
    isUserLogin,
    totalRevenue,
    tableRevenue,
    vipRevenue,
    ordinaryRevenue,
    upcomingCount,
    totalTicketsSold,
    walletBalance,
    transactions,
    attendanceRate,
    eventBookings,
    notifications,
    chartLabels: JSON.stringify(chartLabels),
    revenueData: JSON.stringify(revenueData),
    totalEvents: events.length });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load your dashboard.');
    res.redirect('/');
  }
};



exports.vendor = async (req, res) => {
  try {
    const token = req.session.token;

    if (!token) {
      req.flash('error', 'You must be logged in');
      return res.redirect('/login');
    }

    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5);

    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;

    const isUserLogin = await User.findById(userId);

    const user = await User.findById(userId);
    if (!user || user.role !== 'vendor') return res.status(404).send('Organizer not found');

    const services = await Service.find({ created_by: user._id });

    // 1. Total Listings
    const totalListings = await Service.countDocuments({ created_by: user._id });

    // 2. Total Views (sum views from all listings)
    const listings = await Service.find({ created_by: user._id });
    const totalViews = listings.reduce((sum, service) => sum + (service.views || 0), 0);

    // 3. Total Inquiries
    const totalInquiries = await Service.countDocuments({ created_by: user._id });


    res.render('vendors/dashboard', {
    user,
    services,
    userId,
    isUserLogin,
    totalListings,
    listings,
    totalViews,
    totalInquiries,
    notifications,
    // chartLabels: JSON.stringify(chartLabels),
    // revenueData: JSON.stringify(revenueData),
    totalservices: services.length });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load your dashboard.');
    res.redirect('/');
  }
};



exports.promoter = async (req, res) => {
  try {
    const token = req.session.token;
    if (!token) {
      req.flash('error', 'You must be logged in');
      return res.redirect('/login');
    }

    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5);
    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;

    const user = await User.findById(userId);
    if (!user || user.role !== 'promoter') {
      return res.status(404).send('Promoter not found');
    }

    const signupDate = moment(user.createdAt).startOf('month');
    const currentMonth = moment().startOf('month');
    const startMonth = moment(currentMonth).subtract(3, 'months');
    const months = [];

    for (let i = 0; i < 6; i++) {
      const m = moment(startMonth).add(i, 'months');
      if (m.isSameOrAfter(signupDate)) {
        months.push(m.clone());
      }
    }

    const monthlyRevenueMap = {};
    months.forEach(m => {
      monthlyRevenueMap[m.format('YYYY-MM')] = 0;
    });

    const chartLabels = months.map(m => m.format('MMM YYYY'));

    const events = await Event.find({ promoted_by: userId });
    const eventIds = events.map(e => e._id);

    const bookings = await Booking.find({
      item: { $in: eventIds },
      ticket_status: { $in: ['active', 'used'] },
      promoterRef: userId
    }).lean();

    let totalPromoterRevenue = 0;
    let vipRevenue = 0;
    let tableRevenue = 0;
    let ordinaryRevenue = 0;

    for (const booking of bookings) {
      if (typeof booking.total_paid !== 'number' || booking.total_paid <= 0) continue;

      // const promoterShare = booking.promoterCut || booking.total_paid * PROMOTER_CUT_RATE;
      const promoterShare = booking.promoterCut || 0;
      totalPromoterRevenue += promoterShare;

      const bType = (booking.ticket_types || '').toLowerCase();
      if (bType === 'vip') vipRevenue += promoterShare;
      else if (bType === 'table') tableRevenue += promoterShare;
      else ordinaryRevenue += promoterShare;

      const bookingMonthKey = moment(booking.createdAt).startOf('month').format('YYYY-MM');
      if (monthlyRevenueMap.hasOwnProperty(bookingMonthKey)) {
        monthlyRevenueMap[bookingMonthKey] += promoterShare;
      }
    }

    const revenueData = months.map(m =>
      Math.round((monthlyRevenueMap[m.format('YYYY-MM')] + Number.EPSILON) * 100) / 100
    );

    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(10);
    const paidOut = transactions
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + (tx.amount || 0), 0);

    const walletBalance = totalPromoterRevenue - paidOut;

    res.render('promoters/dashboard', {
      user,
      events,
      bookings,
      userId,
      isUserLogin: user,
      totalPromoterRevenue: Math.round(totalPromoterRevenue * 100) / 100,
      promoterVipRevenue: Math.round(vipRevenue * 100) / 100,
      promoterTableRevenue: Math.round(tableRevenue * 100) / 100,
      promoterOrdinaryRevenue: Math.round(ordinaryRevenue * 100) / 100,
      walletBalance: Math.round(walletBalance * 100) / 100,
      transactions,
      notifications,
      chartLabels: JSON.stringify(chartLabels),
      revenueData: JSON.stringify(revenueData),
      totalEvents: events.length,
    });
  } catch (error) {
    console.error('Promoter dashboard error:', error);
    req.flash('error', 'Failed to load your dashboard.');
    res.redirect('/');
  }
};


exports.admin = async (req, res, next) => {
  try {
    const token = req.session.token;

    if (!token) {
      req.flash('error', 'You must be logged in');
      return res.redirect('/login');
    }

    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(5);

    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;

    const isUserLogin = await User.findById(userId);

    const user = await User.findById(userId);
    if (!user || user.role !== 'super-admin') return res.status(404).send('promoter not found');

    const signupDate = moment(user.createdAt).startOf('month');
    const currentMonth = moment().startOf('month');

    // Calculate sliding window: 3 past + current + 2 future
    const months = [];
    const startMonth = moment(currentMonth).subtract(3, 'months');

    for (let i = 0; i < 6; i++) {
      const month = moment(startMonth).add(i, 'months');
      if (month.isSameOrAfter(signupDate)) {
        months.push(month);
      }
    }

    // Prepare empty revenue map
    const monthlyRevenue = {}; // Key = 'YYYY-MM', Value = revenue
    months.forEach(m => {
      monthlyRevenue[m.format('YYYY-MM')] = 0;
    });

    const chartLabels = months.map(m => m.format('MMM YYYY'));
    const revenueData = months.map(m => Math.round(monthlyRevenue[m.format('YYYY-MM')]));

    const promotionCut = 0.10;
    const platformCut = 0.05;
    const cutRate = 1 - (promotionCut + platformCut);

    const events = await Event.find({});

    const blogs = await Blog.find({});

    const services = await Service.find({});

    const users = await User.find({role: "user"});

    const vendors = await User.find({role: "vendor"});

    const promoters = await User.find({role: "promoter"});

    const organizers = await User.find({role: "organizer"});

    const admins = await User.find({role: "admin"});


    const eventIds = events.map(event => event._id); // extract ids

    const bookings = await Booking.find({
      item: { $in: eventIds } // corrected field
      // Add filters like ticket_status or status only if needed
    });

    // Initialize revenue counters
    let totalRevenue = 0;
    let vipRevenue = 0;
    let tableRevenue = 0;
    let ordinaryRevenue = 0;

    for (let booking of bookings) {
      const amount = booking.total_paid * cutRate;
      totalRevenue += amount;

      const type = booking.ticket_types?.toLowerCase();
      if (type === 'vip') vipRevenue += amount;
      else if (type === 'table') tableRevenue += amount;
      else ordinaryRevenue += amount;
    }

    const transactions = await Transaction.find({ userId }).sort({ date: -1 }).limit(10);
    const paidOut = transactions
      .filter(tx => tx.status === 'Paid')
      .reduce((sum, tx) => sum + tx.amount, 0);

    const walletBalance = totalRevenue - paidOut;

    res.render('superAdmin/dashboard', {
    user,
    moment,
    users,
    vendors,
    promoters,
    organizers,
    admins,
    events,
    bookings,
    userId,
    isUserLogin,
    totalRevenue,
    tableRevenue,
    vipRevenue,
    ordinaryRevenue,
    walletBalance,
    transactions,
    notifications,
    blogs,
    services,
    chartLabels: JSON.stringify(chartLabels),
    revenueData: JSON.stringify(revenueData),
    totalEvents: events.length });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load your dashboard.');
    res.redirect('/');
  }
};


exports.user = async (req, res) => {
  try {
    const token = req.session.token;

    if (!token) {
      req.flash('error', 'You must be logged in');
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;
    const user = await User.findById(userId);

    res.render('attendees/dashboard', { user });
  } catch (error) {
    console.error(error);
    req.flash('error', 'Failed to load your dashboard.');
    res.redirect('/');
  }
};




// ***edit report route***
exports.edit = async (req, res, next) => {
  const token = req.session.token;
  if (!token) {
    req.flash('error', 'Session expired. Please log in again.');
    return res.redirect('/login');
  }
  try {
    const { id } = req.params;
    const decodedToken = jwt.verify(token, 'jwtSecret');
    const userId = decodedToken.userId;
    const isUserLogin = await User.findById(userId);
    const user = await User.findOne({ _id: id });
    if (!user) {
      req.flash('error', 'User not found.');
      return res.redirect('/profile');
    }

    res.render('./superAdmin/edit_profile', { user, userId, isUserLogin });
  } catch (error) {
    console.log(error);
    req.flash('error', 'Error loading edit form.');
    res.redirect('/profile');
  }
};


// Update user profile
exports.update = async (req, res) => {
  const token = req.session.token;

  const {
    username,
    email,
    phone,
    location,
    bio,
    facebook,
    instagram,
    website,
  } = req.body;


  if (!token) {
    req.flash('error', 'Session expired. Please log in again.');
    return res.redirect('/login');
  }

  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const { id } = req.params;
    const existingUserInfo = await User.findById({ _id: id });

    if (!existingUserInfo) {
      req.flash('error', 'Unauthorized or User Info not found.');
      return res.redirect('/userDashboard/:id');
    }



    // Upload profile image if new one is provided
    let imageUrl = user.profile_image;

    // If a new file is uploaded
    if (req.file) {
      // Delete old image from Cloudinary
      if (user.profile_image) {
        const publicId = user.profile_image.split('/').pop().split('.')[0];
        await cloudinary.uploader.destroy(`Profile_Images/${publicId}`);
      }

      const buffer = await sharp(req.file.buffer)
        .resize(800)
        .jpeg({ quality: 80 })
        .toBuffer();


        const result = await new Promise((resolve, reject) => {
          cloudinary.uploader.upload_stream(
            { folder: 'Profile_Images' },
            (error, result) => {
              if (error) reject(error);
              else resolve(result);
            }
          ).end(buffer);
        });

        imageUrl = result.secure_url;
      }

      existingUserInfo.username = username;
      existingUserInfo.email = email;
      existingUserInfo.phone = phone;
      existingUserInfo.location = location;
      existingUserInfo.bio = bio;
      existingUserInfo.facebook = facebook;
      existingUserInfo.website = website;
      existingUserInfo.instagram = instagram;
      existingUserInfo.profile_image = imageUrl;

    await existingUserInfo.save();
    req.flash('success', 'Profile updated successfully.');
    res.redirect('/userDashboard/:id');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Failed to update profile.');
    res.redirect('/userDashboard/:id');
  }
};



// // ***edit update route***
// exports.update = async (req, res, next) => {
// try {
//   const { id } = req.params;
//   const { bios, fname, lname } = req.body;
//   // Check if an image was uploaded
//   let imageUrl;
//   if (req.file) {
//     imageUrl = req.file.filename;
//   }
//
//   if (req.fileValidationError) {
//     return res.status(400).json({ error: req.fileValidationError });
//   }
//   // Check the size of the uploaded image
//   if (imageUrl && req.file.size > 5 * 1024 * 1024) {
//     fs.unlinkSync(req.file.path);
//     req.flash('error', 'Image size exceeds the limit (2MB).');
//     return res.redirect('/profile');
//   }
//
//   // Find the existing blog post by ID
//   const existingPost = await User.findById({ _id: id });
//         if (!existingPost) {
//           req.flash('error', 'This post is not available')
//           return res.redirect('/profile');
//         }
//
//   // // Delete the old image if a new image was uploaded
//   // if (imageUrl && existingPost.image) {
//   //   const imagePath = path.join(__dirname, '../public/uploads', existingPost.image);
//   //   fs.unlinkSync(imagePath); // Delete the old image file
//   // }
//
//   // Update the blog post with the new data
//   existingPost.bios = bios;
//   existingPost.fname = fname;
//   existingPost.lname = lname;
//   existingPost.image = imageUrl || existingPost.image; // Use the new image URL or keep the existing one
//
//   // Save the updated blog post
//   await existingPost.save();
//   req.flash('success', 'You have successfully updated your profile.');
//   res.redirect('/profile');
//
// } catch (error) {
//   req.flash('error', 'there is problem updating your post');
//   return res.redirect('/profile');
// }
// };
