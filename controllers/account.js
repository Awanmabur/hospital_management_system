// controllers/accountController.js

const User = require('../models/User');
const Appointment = require('../models/Appointment');
const Patient = require('../models/Patient');
const jwt = require('jsonwebtoken');
const jwtSecret = process.env.PRIVATE_KEY;

exports.doctor = async (req, res) => {
  try {
    const token = req.session.token;

    if (!token) {
      req.flash('error', 'You must be logged in');
      return res.redirect('/login');
    }

    const decoded = jwt.verify(token, 'jwtSecret');
    const userId = decoded.userId;

    // fetch doctor info
    const doctor = await User.findById(userId);
    if (!doctor) {
      req.flash('error', 'Doctor not found.');
      return res.redirect('/login');
    }

    // fetch doctor’s appointments
    const appointments = await Appointment.find({ doctor: userId })
      .populate('patient')
      .sort({ date: 1 });

    // fetch patients linked to this doctor
    const patients = await Patient.find({ doctor: userId });

    res.render('dashboard/doctor', {
      doctor,
      appointments,
      patients,
    });
  } catch (err) {
    console.error('Error loading doctor dashboard:', err);
    req.flash('error', 'Unable to load doctor dashboard.');
    res.redirect('/login');
  }
};
