// models/Share.js
const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

function makeShareRef() {
  return uuidv4().replace(/-/g, '').slice(0, 12); // ~48 bits entropy, short
}

const shareSchema = new mongoose.Schema({
  eventId: { type: mongoose.Schema.Types.ObjectId, ref: 'Event', required: true },
  promoted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  timestamp: { type: Date, default: Date.now },
  ip: String,
  userAgent: String,
  shares: {
    type: Number,
    default: 0,
  },
  shareRef: { type: String, required: true, unique: true, index: true },
});

// Ensure shareRef exists before validation/save (covers any missing or legacy cases)
shareSchema.pre('validate', async function (next) {
  if (!this.shareRef) {
    let candidate;
    let exists;
    do {
      candidate = makeShareRef();
      exists = await this.constructor.findOne({ shareRef: candidate });
    } while (exists);
    this.shareRef = candidate;
  }
  next();
});

module.exports = mongoose.model('Share', shareSchema);
