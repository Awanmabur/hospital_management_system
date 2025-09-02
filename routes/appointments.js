const express = require('express');
const router = express.Router();
const appointmentController = require('../controllers/appointmentController');
const { isAuthenticated } = require('../middleware/authMiddleware');

// List appointments
router.get('/', isAuthenticated, async (req, res) => {
  const Appointment = require('../models/Appointment');
  const appointments = await Appointment.find().populate('patient doctor').sort({ date: -1 });
  res.render('./appointments/index', { appointments });
});

// Create Appointment
router.post('/store', isAuthenticated, appointmentController.store);

// Edit Appointment Form
router.get('/:id/edit', isAuthenticated, appointmentController.edit);

// Update Appointment
router.post('/:id/update', isAuthenticated, appointmentController.update);

// Delete Appointment
router.post('/:id/delete', isAuthenticated, appointmentController.destroy);

module.exports = router;
