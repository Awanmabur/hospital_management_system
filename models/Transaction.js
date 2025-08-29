const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const TransactionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  amount: { type: Number, required: true },
  method: { type: String, enum: ['Bank', 'Mobile', 'PayPal'], required: true },
  status: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  date: { type: Date, default: Date.now },
  reference: { type: String, unique: true }
}, { timestamps: true });

// Auto-generate booking_reference before saving
TransactionSchema.pre('save', function(next) {
  if (!this.reference) {
    this.reference = 'TRANSACT-' + uuidv4().split('-')[0].toUpperCase(); // e.g., BOOK-A1B2C3D4
  }
  next();
});

module.exports = mongoose.model('Transaction', TransactionSchema);
