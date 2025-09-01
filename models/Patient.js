// models/Patient.js
const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  date_of_birth: Date,
  gender: { type: String, enum: ["male", "female", "other"] },
  address: String,
  profile_image: String,
  emergency_contact: String,
  blood_group: String,
  allergies: [String],
  medical_history: String,
  insurance: { type: mongoose.Schema.Types.ObjectId, ref: "InsurancePolicy" }
}, { timestamps: true });

module.exports = mongoose.model("Patient", patientSchema);
