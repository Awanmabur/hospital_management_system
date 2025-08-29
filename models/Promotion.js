// models/Promotion.js
const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  itemId: { type: mongoose.Schema.Types.ObjectId, required: true, refPath: 'type' },
  type: { type: String, enum: ['event', 'service'], required: true },
  package: { type: String, enum: ['silver', 'gold', 'platinum'], required: true },
  price: { type: Number, required: true },
  startDate: { type: Date, default: Date.now },
  endDate: { type: Date, required: true },
  status: { type: String, enum: ['active', 'expired'], default: 'active' },
  payment_method: { type: String },
});

module.exports = mongoose.model('Promotion', promotionSchema);
