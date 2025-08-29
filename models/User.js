
const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: String,
  email: { type: String, unique: true },
  phone: String,
  password: String,
  profile_image: String,
  location: String,
  bio: String,

  role: {
    type: String,
    enum: ['patient', 'admin', 'super-admin', 'nurse', 'doctor', 'pharmacist'],
    default: 'user'
  },


}, { timestamps: true });

module.exports = mongoose.model('User', UserSchema);

 

// const mongoose = require('mongoose');
// const slugify = require('slugify');
//
// /**
//  * User - Production-ready schema covering:
//  * - SEO/search fields (slug, bio keywords)
//  * - Roles & permissions with lifecycle (verified, banned, deleted)
//  * - Engagement (views, followers, ratings)
//  * - Organizer/promoter/vendor profile fields
//  * - Security best practices (password hash, login tracking)
//  */
//
// const { Schema, Types } = mongoose;
//
// const UserSchema = new Schema(
//   {
//     // Core identity
//     username: { type: String, required: true, trim: true },
//     email: { type: String, unique: true, lowercase: true, required: true, trim: true },
//     phone: { type: String, trim: true },
//     password: { type: String, required: true, select: false },
//     profile_image: String,
//     cover_image: String,
//     bio: { type: String, maxlength: 500 },
//     location: String,
//
//     // SEO / URL identity
//     slug: { type: String, index: true },
//
//     // Social links
//     facebook: String,
//     instagram: String,
//     twitter: String,
//     tiktok: String,
//     youtube: String,
//     website: String,
//
//     // Status & lifecycle
//     verified: { type: Boolean, default: false },
//     is_deleted: { type: Boolean, default: false },
//     is_banned: { type: Boolean, default: false },
//     banned_at: Date,
//     ban_reason: String,
//
//     // Role-based access
//     role: {
//       type: String,
//       enum: ['user', 'admin', 'super-admin', 'organizer', 'promoter', 'vendor'],
//       default: 'user',
//       index: true,
//     },
//
//     // Permissions (fine-grained overrides)
//     permissions: {
//       can_manage_users: { type: Boolean, default: false },
//       can_approve_events: { type: Boolean, default: false },
//       can_manage_ads: { type: Boolean, default: false },
//       can_manage_admins: { type: Boolean, default: false },
//     },
//
//     // Relations
//     events: [{ type: Types.ObjectId, ref: 'Event' }], // created events
//     booked_events: [{ type: Types.ObjectId, ref: 'Event' }],
//     wishlist: [{ type: Types.ObjectId, ref: 'Event' }],
//     blogs: [{ type: Types.ObjectId, ref: 'Blog' }],
//
//     // Organizer/promoter/vendor specific
//     organization_name: String,
//     organization_logo: String,
//     organization_bio: String,
//
//     // Engagement & social metrics
//     views: { type: Number, default: 0 },
//     followers: [{ type: Types.ObjectId, ref: 'User' }],
//     following: [{ type: Types.ObjectId, ref: 'User' }],
//     followers_count: { type: Number, default: 0 },
//     following_count: { type: Number, default: 0 },
//
//     likes_count: { type: Number, default: 0 },
//     shares_count: { type: Number, default: 0 },
//     rating_average: { type: Number, min: 0, max: 5, default: 0 },
//     rating_count: { type: Number, min: 0, default: 0 },
//
//     // Security & auth tracking
//     last_login: Date,
//     login_attempts: { type: Number, default: 0 },
//     lock_until: Date,
//     resetPasswordToken: String,
//     resetPasswordExpires: Date,
//   },
//   {
//     timestamps: true,
//     toJSON: { virtuals: true },
//     toObject: { virtuals: true },
//     versionKey: false,
//   }
// );
//
// // --- Indexes ---
// UserSchema.index({ username: 'text', bio: 'text', organization_name: 'text' });
// UserSchema.index({ email: 1 });
// UserSchema.index({ role: 1 });
// UserSchema.index({ slug: 1 }, { unique: true, sparse: true });
//
// // --- Slug generator ---
// function buildUserSlug(username) {
//   return slugify(String(username || ''), { lower: true, strict: true, trim: true })
//     .replace(/(^-|-$)/g, '')
//     .slice(0, 80);
// }
//
// UserSchema.pre('validate', async function (next) {
//   if (!this.slug && this.username) this.slug = buildUserSlug(this.username);
//
//   if (!this.isModified('slug') || !this.slug) return next();
//
//   const base = buildUserSlug(this.slug);
//   let candidate = base;
//   let i = 0;
//
//   while (await this.constructor.findOne({ slug: candidate, _id: { $ne: this._id } }).select('_id').lean()) {
//     i += 1;
//     candidate = `${base}-${i}`;
//   }
//
//   this.slug = candidate;
//   next();
// });
//
// // --- Virtuals ---
// UserSchema.virtual('isLocked').get(function () {
//   return !!(this.lock_until && this.lock_until > Date.now());
// });
//
// UserSchema.virtual('profileUrl').get(function () {
//   return `/users/${this.slug || this._id}`;
// });
//
// // --- Helpers ---
// UserSchema.methods.toPublicJSON = function () {
//   const obj = this.toJSON({ virtuals: true });
//   delete obj.password;
//   delete obj.resetPasswordToken;
//   delete obj.resetPasswordExpires;
//   delete obj.login_attempts;
//   delete obj.lock_until;
//   return obj;
// };
//
// module.exports = mongoose.model('User', UserSchema);
