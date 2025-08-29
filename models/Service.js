// models/Service.js
const mongoose = require('mongoose');

const ServiceSchema = new mongoose.Schema({
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  category: {
    type: String,
    enum: [
      'hotel', 'car', 'eventhall', 'photographer', 'decorator',
      'caterer', 'dj', 'makeup_artist', 'others'
    ],
    required: true
  },
  name: { type: String, required: true },
  description: String,
  images: [String],
  location: String,
  type: String,
  availability: {
    type: String,
    enum: ['available', 'booked', 'unavailable'],
    default: 'available'
  },
  isPromoted: { type: Boolean, default: false },
  promotionExpires: Date,
  isFeatured: { type: Boolean, default: false },
  featuredExpires: Date,
  views: {
    type: Number,
    default: 0
  },
   
  is_approved: { type: Boolean, default: false },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: Date
}, { timestamps: true });

const Service = mongoose.model('Service', ServiceSchema);

// Hotel
Service.discriminator('hotel', new mongoose.Schema({
  price_per_night: String,
  amenities: [String],
  check_in_time: String,
  check_out_time: String,
}));

// Car
Service.discriminator('car', new mongoose.Schema({
  brand: String,
  model: String,
  seating_capacity: Number,
  rent_per_day: Number,
  fuel_type: String,
  transmission: String,
  features: [String],
  air_conditioning: String,
}));



// Event Hall
Service.discriminator('eventhall', new mongoose.Schema({
  capacity: Number,
  price_per_day: Number,
  facilities: [String],
}));

// DJ
Service.discriminator('dj', new mongoose.Schema({
  dj_genres: [String],
  dj_years: Number,
  dj_price: Number,
  dj_equipment: Boolean,
  dj_link: String,
}));

// Photographer
Service.discriminator('photographer', new mongoose.Schema({
  photographer_years: Number,
  photographer_price: Number,
  photographer_specialties: [String],
  photographer_portfolio: String,
}));

// Caterer
Service.discriminator('caterer', new mongoose.Schema({
  menu_items: String,
  price_per_plate: Number,
  packages: [ String ],
  cuisine_types: [String],
  minimum_order: Number,
  vegetarian_options: { type: Boolean, default: false },
  halal_options: { type: Boolean, default: false },
}));

// Decorator
Service.discriminator('decorator', new mongoose.Schema({
  decorator_years: Number,
  portfolio: String,
  decorator_price: Number,
  services_offered: [String],
}));

// Makeup Artist
Service.discriminator('makeup_artist', new mongoose.Schema({
  makeup_specialties: [String],
  makeup_packages: String,
  makeup_years: Number,
  makeup_price: Number,
  makeup_link: String
}));

// Others
Service.discriminator('others', new mongoose.Schema({
  category: String,
  description: String,
  price_range: { min: Number, max: Number },
}));

module.exports = Service;










// const mongoose = require('mongoose');
//
// const options = {
//   discriminatorKey: 'category',
//   timestamps: true
// };
//
// const BaseServiceSchema = new mongoose.Schema({
//   created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
//
//   name: { type: String, required: true },
//   description: String,
//   image: String,
//   location: String,
//   contact: {
//     phone: String,
//     email: String,
//   },
//
//   availability: {
//     type: String,
//     enum: ['available', 'booked', 'unavailable'],
//     default: 'available'
//   },
//
//   rating: { type: Number, default: 0 },
//   reviews: [{
//     user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//     comment: String,
//     rating: Number,
//     created_at: { type: Date, default: Date.now }
//   }],
//
//   is_approved: { type: Boolean, default: false },
//   approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
//   approved_at: Date
// },{ timestamps: true }, options);
//
// module.exports = mongoose.model('Service', BaseServiceSchema);
