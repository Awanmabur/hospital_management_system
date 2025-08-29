const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const PaymentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking' },
  for_type: { type: String, enum: ['event', 'service'], required: false },
  item: { type: mongoose.Schema.Types.ObjectId, required: false }, // eventId or serviceId
  type: { type: String, enum: ['ticket', 'service', 'promotion', 'subscription'], default: 'ticket' },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' }, // or 'SSP', 'UGX', etc.
  method: String, // e.g. 'Flutterwave', 'PayPal', 'MTN Momo', etc.
  transactionId: { type: String, unique: true }, // provided by payment processor
  payment_reference: { type: String, unique: true }, // internal reference (custom)
  status: { type: String, enum: ['pending', 'completed', 'failed', 'refunded'], default: 'pending' },
  paid_at: Date,

  // Revenue shares
  platformCut: { type: Number, default: 0 },
  promoterCut: { type: Number, default: 0 },
  ownerCut: { type: Number, default: 0 },

  // Optional fields
  promo_code: String,
  notes: String,
  refunded_at: Date,
  refund_reason: String,
}, { timestamps: true });

// Auto-generate payment_reference before save
PaymentSchema.pre('save', function (next) {
  if (!this.payment_reference) {
    this.payment_reference = 'PAY-' + uuidv4().split('-')[0].toUpperCase(); // e.g., PAY-ABC123
  }
  next();
});

module.exports = mongoose.model('Payment', PaymentSchema);











// const mongoose = require('mongoose');
//
// const PaymentSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: false },
//   for_type: { type: String, enum: ['event', 'service'], required: false },
//   item: { type: mongoose.Schema.Types.ObjectId, required: false },
//   type: { type: String, enum: ['ticket', 'promotion'], default: 'ticket' },
//   amount: Number,
//   method: String,
//   transactionId: String,
//   status: { type: String, enum: ['pending', 'completed', 'failed'], default: 'pending' },
//   paid_at: Date,
//   platformCut: Number,
//   promoterCut: Number,
//   ownerCut: Number
// }, { timestamps: true });
//
// module.exports = mongoose.model('Payment', PaymentSchema);
