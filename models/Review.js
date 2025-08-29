
const mongoose = require('mongoose');

const RatingSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  event: { type: mongoose.Schema.Types.ObjectId, ref: 'Event' },
  service: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  rating: { type: Number, min: 1, max: 5 },
  comment: String,
});

module.exports = mongoose.model('Rating', RatingSchema);
