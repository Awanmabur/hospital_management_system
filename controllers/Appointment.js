const jwt = require('jsonwebtoken');
const Appointment = require('../models/Appointment');
const User = require('../models/User');

// Create Appointment
exports.store = async (req, res) => {
  const token = req.session.token;
  if (!token) return res.redirect('/login');

  try {
    const decoded = jwt.verify(token, 'jwtSecret');
    const user = await User.findById(decoded.userId);

    const { patient, doctor, date, time, reason, status } = req.body;

    const appointment = new Appointment({
      patient,
      doctor,
      date: new Date(`${date}T${time}`),
      reason,
      status: status || 'scheduled',
      created_by: user._id
    });

    await appointment.save();
    req.flash('success', 'Appointment created successfully.');
    res.redirect('/appointments');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error creating appointment.');
    res.redirect('/appointments');
  }
};

// Edit Appointment (form)
exports.edit = async (req, res) => {
  try {
    const appointment = await Appointment.findById(req.params.id).populate('patient doctor');
    if (!appointment) {
      req.flash('error', 'Appointment not found.');
      return res.redirect('/appointments');
    }
    res.render('./appointments/edit', { appointment });
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error loading appointment.');
    res.redirect('/appointments');
  }
};

// Update Appointment
exports.update = async (req, res) => {
  try {
    const { date, time, reason, status } = req.body;
    const appointment = await Appointment.findById(req.params.id);

    if (!appointment) {
      req.flash('error', 'Appointment not found.');
      return res.redirect('/appointments');
    }

    appointment.date = new Date(`${date}T${time}`);
    appointment.reason = reason;
    appointment.status = status;

    await appointment.save();
    req.flash('success', 'Appointment updated successfully.');
    res.redirect('/appointments');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error updating appointment.');
    res.redirect('/appointments');
  }
};

// Delete Appointment
exports.destroy = async (req, res) => {
  try {
    await Appointment.findByIdAndDelete(req.params.id);
    req.flash('success', 'Appointment deleted successfully.');
    res.redirect('/appointments');
  } catch (err) {
    console.error(err);
    req.flash('error', 'Error deleting appointment.');
    res.redirect('/appointments');
  }
};
