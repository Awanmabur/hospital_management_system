const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const BookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  for_type: { type: String, enum: ['event', 'service'], required: true },
  item: { type: mongoose.Schema.Types.ObjectId, required: true }, // eventId or serviceId
  full_name: String,
  email: String,
  phone: String,
  ticket_types: String,
  ticket_status: { type: String, enum: ['unpaid', 'active', 'used', 'cancelled'], default: 'unpaid' },
  used_at: { type: Date },
  quantity: Number,
  total_paid: Number,
  payment_method: String,
  payment_status: { type: String, enum: ['paid', 'pending', 'failed'], default: 'pending' },
  booking_reference: { type: String, unique: true },
  notes: String,
  event_date: Date,
  refund_status: { type: String, enum: ['requested', 'processing', 'completed', 'rejected', null], default: null },
  booking_type: { type: String, enum: ['regular', 'vip', 'premium'], default: 'regular' },
  location: String,
  attendees: [{ type: String }],
  shareRef: String,
  qr_code: String,
  promoterRef: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  // Revenue split (in absolute value, e.g., USD)
  platformCut: { type: Number, default: 0 },
  promoterCut: { type: Number, default: 0 },
  ownerCut: { type: Number, default: 0 },

  // Optional: store percentages if needed for audit
  platformCutPercent: { type: Number, default: 0.05 },
  promoterCutPercent: { type: Number, default: 0.10 },
  ownerCutPercent: { type: Number, default: 0.85 },

  status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
}, { timestamps: true });

// Auto-generate booking_reference before saving
BookingSchema.pre('save', function(next) {
  if (!this.booking_reference) {
    this.booking_reference = 'BOOK-' + uuidv4().split('-')[0].toUpperCase(); // e.g., BOOK-A1B2C3D4
  }
  next();
});

module.exports = mongoose.model('Booking', BookingSchema);







// const mongoose = require('mongoose');
//
// const BookingSchema = new mongoose.Schema({
//   userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   for_type: { type: String, enum: ['event', 'service'], required: true },
//   item: { type: mongoose.Schema.Types.ObjectId, required: true },
//   full_name: String,
//   email: String,
//   phone: String,
//   ticket_types: String,
//   quantity: Number,
//   total_paid: Number,
//   qr_code: String,
//   promoterId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   commission: Number,
//   status: { type: String, enum: ['pending', 'confirmed', 'cancelled'], default: 'pending' }
// }, { timestamps: true });
//
// module.exports = mongoose.model('Booking', BookingSchema);
