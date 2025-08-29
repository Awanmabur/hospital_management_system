// routes/inquiryRoutes.js
const express = require('express');
const router = express.Router();
const Inquiry = require('../models/Inquiry');
const Listing = require('../models/Listing');
const { isAuthenticated } = require('../middleware/auth');

// GET all inquiries for a vendor
router.get('/vendor/:vendorId', isAuthenticated, async (req, res) => {
  try {
    const inquiries = await Inquiry.find({ vendor: req.params.vendorId })
      .populate('listing', 'title')
      .sort({ createdAt: -1 });
    res.render('inquiries', { inquiries });
  } catch (err) {
    console.error(err);
    res.status(500).send('Error loading inquiries');
  }
});

// POST new inquiry
router.post('/inquiry', async (req, res) => {
  try {
  let user = null;
  const token = req.session.token;

  // If logged in, get user from session
  if (token) {
    const decoded = jwt.verify(token, 'jwtSecret');
    user = await User.findById(decoded.userId);
  }

  const { name, email, phone, message, eventId, serviceId } = req.body;

  // Validate at least one target: event or service
  if (!eventId && !serviceId) {
    req.flash('error', 'Missing target (event or service) for inquiry.');
    return res.redirect('back');
  }

  const inquiryData = {
    name: user ? user.name : name,
    email: user ? user.email : email,
    phone: user ? user.phone : phone,
    message,
    user: user ? user._id : null
  };

  // Add target reference
  if (eventId) {
    const event = await Event.findById(eventId);
    if (!event) {
      req.flash('error', 'Event not found.');
      return res.redirect('back');
    }
    inquiryData.event = eventId;
  }

  if (serviceId) {
    const service = await Service.findById(serviceId);
    if (!service) {
      req.flash('error', 'Service not found.');
      return res.redirect('back');
    }
    inquiryData.service = serviceId;
  }

  await Inquiry.create(inquiryData);
  req.flash('success', 'Inquiry submitted successfully.');
  res.redirect('back');
} catch (err) {
  console.error(err);
  req.flash('error', 'Failed to submit inquiry.');
  res.redirect('back');
}
});

module.exports = router;
