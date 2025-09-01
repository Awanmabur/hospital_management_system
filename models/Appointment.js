// models/Appointment.js
const mongoose = require("mongoose");

const appointmentSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  doctor: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
  appointment_date: { type: Date, required: true },
  status: { type: String, enum: ["scheduled", "completed", "cancelled", "no-show"], default: "scheduled" },
  consultation_type: { type: String, enum: ["in-person", "telemedicine"], default: "in-person" }
}, { timestamps: true });

module.exports = mongoose.model("Appointment", appointmentSchema);
