// models/Medicine.js
const mongoose = require("mongoose");

const medicineSchema = new mongoose.Schema({
  name: { type: String, required: true },
  brand: String,
  batch_number: String,
  expiry_date: Date,
  quantity_in_stock: Number,
  unit_price: Number,
  supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" }
}, { timestamps: true });

module.exports = mongoose.model("Medicine", medicineSchema);
