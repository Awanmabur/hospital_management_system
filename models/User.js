
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  profile_image: String,
  location: String,
  bio: String,

  role: { type: String, enum: ["super-admin", "doctor", "nurse", "patient", "staff", "lab", "pharmacist", "accountant"], required: true },
  status: { type: String, enum: ["active", "inactive"], default: "active" },


}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);
