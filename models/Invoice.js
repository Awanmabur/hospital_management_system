// models/Invoice.js
const mongoose = require("mongoose");

const invoiceSchema = new mongoose.Schema({
  patient: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
  items: [{
    description: String,
    amount: Number
  }],
  total_amount: Number,
  discounts: Number,
  insurance_cover: Number,
  amount_due: Number,
  status: { type: String, enum: ["paid", "pending", "partial"], default: "pending" }
}, { timestamps: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
