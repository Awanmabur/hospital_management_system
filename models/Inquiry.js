const InquirySchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String, required: true },
  phone: { type: String },
  message: { type: String, required: true },
  recipient: {  // 👈 NEW: who the inquiry is sent to (vendor or organizer)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    // required: true
  },
  user: { // sender (optional if guest)
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

module.exports = mongoose.model('Inquiry', InquirySchema);
