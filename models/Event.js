// // models/Event.js
// const mongoose = require('mongoose');
// const { Schema } = mongoose;
// const slugify = require('slugify');
//
// // ---------- Sub-schemas ----------
//
// // Geolocation & venue
// const VenueSchema = new Schema({
//   name: { type: String, trim: true, maxlength: 120 },
//   addressLine1: { type: String, trim: true, maxlength: 150 },
//   addressLine2: { type: String, trim: true, maxlength: 150 },
//   city: { type: String, trim: true, maxlength: 100 },
//   state: { type: String, trim: true, maxlength: 100 },
//   country: { type: String, trim: true, maxlength: 100 },
//   postalCode: { type: String, trim: true, maxlength: 20 },
//   location: {
//     type: {
//       type: String,
//       enum: ['Point'],
//       default: 'Point'
//     },
//     coordinates: {
//       type: [Number], // [lng, lat]
//       index: '2dsphere'
//     }
//   }
// }, { _id: false });
//
// // SEO / social metadata
// const SEOSchema = new Schema({
//   metaTitle: { type: String, maxlength: 70 },
//   metaDescription: { type: String, maxlength: 160 },
//   canonicalUrl: { type: String, trim: true },
//   ogImage: String,
//   ogTitle: String,
//   ogDescription: String,
//   twitterCard: { type: String, enum: ['summary', 'summary_large_image'], default: 'summary_large_image' },
//   schemaType: { type: String, default: 'Event' }
// }, { _id: false });
//
// // Dynamic price changes
// const PriceChangeRuleSchema = new Schema({
//   days_before_event: { type: Number, min: 0, required: true },
//   new_prices: {
//     ordinary: { type: Number, min: 0 },
//     vip: { type: Number, min: 0 },
//     table: { type: Number, min: 0 }
//   }
// }, { _id: false });
//
// // Ticket type
// const TicketTypeSchema = new Schema({
//   code: { type: String, required: true, trim: true, lowercase: true }, // e.g. "vip"
//   label: { type: String, required: true, maxlength: 50 },
//   description: { type: String, maxlength: 200 },
//   ticket_status: { type: String, enum: ['unpaid', 'active', 'used', 'cancelled'], default: 'unpaid' },
//   initial_price: { type: Number, min: 0, required: true },
//   current_price: { type: Number, min: 0, required: true },
//   currency: { type: String, match: /^[A-Z]{3}$/, default: 'USD' },
//   sales_start: Date,
//   sales_end: Date,
//   min_per_order: { type: Number, default: 1, min: 1 },
//   max_per_order: { type: Number, default: 10, min: 1 },
//   total_available: { type: Number, min: 0, required: true },
//   sold: { type: Number, default: 0, min: 0 },
//   reserved: { type: Number, default: 0, min: 0 },
//   is_hidden: { type: Boolean, default: false },
//   fees_included: { type: Boolean, default: true }
// }, { _id: false });
//
// TicketTypeSchema.virtual('remaining').get(function () {
//   return Math.max(0, (this.total_available || 0) - (this.sold || 0) - (this.reserved || 0));
// });
//
// // ---------- Main schema ----------
//
// const EventSchema = new Schema({
//   // Identity / SEO
//   title: { type: String, required: true, trim: true, maxlength: 140 },
//   slug: { type: String, unique: true, index: true, maxlength: 160 },
//   description: { type: String, maxlength: 2000 },
//   tags: [{ type: String, trim: true, index: true }],
//   seo: SEOSchema,
//
//   // Categorization
//   category: {
//     type: String,
//     enum: ['music', 'fashion', 'sports', 'business', 'education', 'religion', 'others'],
//     default: 'others',
//     index: true
//   },
//
//   // Scheduling
//   start_time: { type: Date, required: true, index: true },
//   end_time: { type: Date },
//   timezone: { type: String, default: 'Africa/Juba' },
//
//   // Mode / location
//   event_mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'offline', index: true },
//   venue: VenueSchema,
//   online_link: String,
//
//   // Media
//   image: String,
//   gallery: [String],
//
//   // Visibility & lifecycle
//   visibility: { type: String, enum: ['public', 'unlisted', 'private'], default: 'public', index: true },
//   status: {
//     type: String,
//     enum: ['draft', 'pending_review', 'approved', 'scheduled', 'live', 'completed', 'cancelled', 'archived'],
//     default: 'pending_review',
//     index: true
//   },
//   is_deleted: { type: Boolean, default: false, index: true },
//
//   // Monetization
//   is_free: { type: Boolean, default: false, index: true },
//   currency: { type: String, match: /^[A-Z]{3}$/, default: 'USD' },
//
//   // Tickets & dynamic pricing
//   ticket_types: [TicketTypeSchema],
//   price_change_schedule: [PriceChangeRuleSchema],
//
//   // Engagement
//   views: { type: Number, default: 0, min: 0 },
//   likes: { type: Number, default: 0, min: 0 },
//   bookmarks: { type: Number, default: 0, min: 0 },
//   shares: { type: Number, default: 0, min: 0 },
//   comments_count: { type: Number, default: 0, min: 0 },
//
//   // Promotion
//   isPromoted: { type: Boolean, default: false, index: true },
//   promotionExpires: { type: Date, index: true },
//   isFeatured: { type: Boolean, default: false, index: true },
//   featuredExpires: { type: Date, index: true },
//
//   // Approval
//   is_approved: { type: Boolean, default: false, index: true },
//   approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
//   approved_at: Date,
//
//   // Ownership / auditing
//   created_by: { type: Schema.Types.ObjectId, ref: 'User', index: true },
//   promoted_by: { type: Schema.Types.ObjectId, ref: 'User' },
//   updated_by: { type: Schema.Types.ObjectId, ref: 'User' },
//   published_at: Date,
// }, { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } });
//
// // ---------- Helpers & methods ----------
//
// // Generate slug
// EventSchema.pre('validate', async function () {
//   if (!this.isModified('title') && this.slug) return;
//   if (!this.title) return;
//
//   const base = slugify(this.title, { lower: true, strict: true });
//   let candidate = base || 'event';
//   let i = 0;
//
//   while (await mongoose.models.Event.exists({ slug: candidate, _id: { $ne: this._id } })) {
//     i += 1;
//     candidate = `${base}-${i}`;
//   }
//   this.slug = candidate;
// });
//
// // Auto-derive status from time
// EventSchema.pre('save', function () {
//   const now = new Date();
//   if (this.is_approved && this.start_time && this.end_time) {
//     if (now < this.start_time && this.status === 'approved') this.status = 'scheduled';
//     if (now >= this.start_time && now <= this.end_time) this.status = 'live';
//     if (this.end_time < now && ['live', 'scheduled', 'approved'].includes(this.status)) this.status = 'completed';
//   }
// });
//
// // Compute current prices
// EventSchema.methods.getCurrentPrices = function () {
//   const prices = {};
//   this.ticket_types?.forEach(t => {
//     prices[t.code] = t.current_price ?? t.initial_price ?? null;
//   });
//
//   if (!Array.isArray(this.price_change_schedule) || !this.start_time) return prices;
//
//   const now = new Date();
//   const daysToStart = Math.max(0, Math.ceil((this.start_time - now) / 86400000));
//
//   const applicable = this.price_change_schedule
//     .filter(r => daysToStart <= r.days_before_event)
//     .sort((a, b) => a.days_before_event - b.days_before_event);
//
//   if (applicable.length) {
//     const r = applicable[0];
//     ['ordinary', 'vip', 'table'].forEach(k => {
//       if (r.new_prices && typeof r.new_prices[k] === 'number') {
//         prices[k] = r.new_prices[k];
//       }
//     });
//   }
//   return prices;
// };
//
// // Auto-generate 10-day incremental price ramp
// EventSchema.methods.generateDefaultPriceSchedule = function () {
//   if (!this.ticket_types?.length) return [];
//   const rules = [];
//   for (let d = 10; d >= 1; d--) {
//     const new_prices = {};
//     this.ticket_types.forEach(t => {
//       new_prices[t.code] = +(t.initial_price * (1 + (11 - d) / 100)).toFixed(2);
//     });
//     rules.push({ days_before_event: d, new_prices });
//   }
//   this.price_change_schedule = rules;
//   return rules;
// };
//
// module.exports = mongoose.model('Event', EventSchema);
//
//
//




// const mongoose = require('mongoose');
// const { Schema } = mongoose;
//
// // ---------------- Ticket Schema ----------------
// const TicketTypeSchema = new Schema({
//   code: { type: String, required: true, lowercase: true }, // ordinary, vip, table
//   label: { type: String, required: true },
//   description: String,
//   initial_price: { type: Number, min: 0, required: true },
//   current_price: { type: Number, min: 0, required: true },
//   currency: { type: String, default: 'USD' },
//   service_fee: { type: Number, default: 0 }, // platform fee %
//   tax_rate: { type: Number, default: 0 }, // VAT %
//   total_available: { type: Number, min: 0, required: true },
//   sold: { type: Number, default: 0, min: 0 },
// }, { _id: false });
//
// TicketTypeSchema.virtual('remaining').get(function () {
//   return Math.max(0, (this.total_available || 0) - (this.sold || 0));
// });
//
// // ---------------- Sponsor Schema ----------------
// const SponsorSchema = new Schema({
//   name: String,
//   logo: String,
//   url: String,
//   contribution: Number
// }, { _id: false });
//
// // ---------------- Main Event Schema ----------------
// const EventSchema = new Schema({
//   // Basic Info
//   title: { type: String, required: true, trim: true },
//   slug: { type: String, required: true, unique: true, lowercase: true, index: true },
//   description: { type: String },
//   category: {
//     type: String,
//     enum: ['music', 'fashion', 'sports', 'business', 'education', 'religion', 'others'],
//     default: 'others',
//     index: true
//   },
//   tags: [{ type: String, trim: true, lowercase: true }],
//
//   // SEO
//   meta_title: String,
//   meta_description: String,
//   meta_keywords: [String],
//   canonical_url: String,
//   og_image: String,
//
//   // Timing
//   start_time: { type: Date, required: true, index: true },
//   end_time: { type: Date },
//   timezone: { type: String, default: 'UTC' },
//
//   // Location
//   event_mode: { type: String, enum: ['online', 'offline', 'hybrid'], default: 'offline' },
//   location: { type: String },
//   address: { type: String },
//   geo: {
//     type: { type: String, enum: ['Point'], default: 'Point' },
//     coordinates: { type: [Number], index: '2dsphere' } // [lng, lat]
//   },
//
//   // Media
//   image: String,
//   gallery: [String],
//   video_url: String,
//
//   // Promotion
//   isPromoted: { type: Boolean, default: false },
//   promotionExpires: Date,
//   isFeatured: { type: Boolean, default: false },
//   featuredExpires: Date,
//   boosted_until: Date,
//
//   // Engagement
//   views: { type: Number, default: 0 },
//   likes: { type: Number, default: 0 },
//   shares: { type: Number, default: 0 },
//   bookmarks: [{ type: Schema.Types.ObjectId, ref: 'User' }],
//   followers: [{ type: Schema.Types.ObjectId, ref: 'User' }],
//   rating: { type: Number, min: 0, max: 5, default: 0 },
//   rating_count: { type: Number, default: 0 },
//
//   // Tickets
//   is_free: { type: Boolean, default: false },
//   ticket_types: [TicketTypeSchema],
//
//   // Sponsors & Revenue
//   sponsors: [SponsorSchema],
//   revenue: {
//     total_sales: { type: Number, default: 0 },
//     total_refunds: { type: Number, default: 0 },
//     payout_status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
//   },
//
//   // Lifecycle
//   status: {
//     type: String,
//     enum: ['draft', 'pending', 'published', 'ended', 'cancelled'],
//     default: 'draft',
//     index: true
//   },
//   is_approved: { type: Boolean, default: false },
//   approved_at: Date,
//   cancelled_at: Date,
//
//   // Ownership & Audit
//   created_by: { type: Schema.Types.ObjectId, ref: 'User', required: true },
//   promoted_by: { type: Schema.Types.ObjectId, ref: 'User' },
//   approved_by: { type: Schema.Types.ObjectId, ref: 'User' },
//   audit_logs: [{
//     action: String,
//     performed_by: { type: Schema.Types.ObjectId, ref: 'User' },
//     timestamp: { type: Date, default: Date.now }
//   }],
//
//   // Soft Delete
//   is_deleted: { type: Boolean, default: false },
//   deleted_at: Date
//
// }, { timestamps: true });
//
// // ---------------- Countdown Pricing ----------------
// function calculateCountdownPrice(initialPrice, daysToStart) {
//   if (daysToStart > 10 || daysToStart < 1) return initialPrice;
//   const percentageIncrease = (11 - daysToStart) / 100; // day10=+1%, day1=+10%
//   return Math.round(initialPrice * (1 + percentageIncrease) * 100) / 100;
// }
//
// EventSchema.methods.applyCountdownPricing = function () {
//   if (!this.start_time || !this.ticket_types?.length) return;
//   const now = new Date();
//   const daysToStart = Math.ceil((this.start_time - now) / (1000 * 60 * 60 * 24));
//   this.ticket_types.forEach(t => {
//     if (t.initial_price != null) {
//       t.current_price = calculateCountdownPrice(t.initial_price, daysToStart);
//     }
//   });
// };
//
// EventSchema.virtual('livePrices').get(function () {
//   if (!this.start_time || !this.ticket_types?.length) return [];
//   const now = new Date();
//   const daysToStart = Math.ceil((this.start_time - now) / (1000 * 60 * 60 * 24));
//   return this.ticket_types.map(t => ({
//     type: t.code,
//     label: t.label,
//     original: t.initial_price,
//     current: calculateCountdownPrice(t.initial_price, daysToStart)
//   }));
// });
//
// EventSchema.pre('save', function (next) {
//   this.applyCountdownPricing();
//   next();
// });
//
// // ---------------- Indexes ----------------
// EventSchema.index({ title: 'text', description: 'text', tags: 'text' });
// EventSchema.index({ start_time: 1, end_time: 1 });
// EventSchema.index({ category: 1 });
// EventSchema.index({ isFeatured: 1, featuredExpires: 1 });
// EventSchema.index({ isPromoted: 1, promotionExpires: 1 });
// EventSchema.index({ 'revenue.payout_status': 1 });
//
// module.exports = mongoose.model('Event', EventSchema);
//





const mongoose = require('mongoose');

const EventSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: String,
  category: { type: String, enum: ['music', 'fashion', 'sports', 'business', 'education', 'religion', 'others'], default: 'others' },
  date: { type: Date, required: true },
  location: String,
  image: String,
  type: String,
  event_mode: String,
  isPromoted: { type: Boolean, default: false },
  promotionExpires: Date,
  isFeatured: { type: Boolean, default: false },
  featuredExpires: Date,
  views: {
    type: Number,
    default: 0
  },

  likes: {
    type: Number,
    default: 0
  },

  is_free: { type: Boolean, default: false },

  ticket_types: [{
    type: { type: String, enum: ['ordinary', 'vip', 'table'], required: true },
    ticket_status: { type: String, enum: ['unpaid', 'active', 'used', 'cancelled'], default: 'unpaid' },
    initial_price: Number,
    current_price: Number,
    total_available: Number,
    sold: { type: Number, default: 0 }
  }],

  price_change_schedule: [{
    days_before_event: Number,
    new_prices: {
      ordinary: Number,
      vip: Number,
      table: Number
    }
  }],

  is_approved: { type: Boolean, default: false },
  created_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  promoted_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_by: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  approved_at: Date
}, { timestamps: true });

module.exports = mongoose.model('Event', EventSchema);
