const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  userType: { type: String, enum: ['graduate', 'investor', 'admin'], default: 'graduate' },
  profileImage: { type: String },
  bio: { type: String },
  skills: { type: Array, default: [] },
  university: { type: String },
  graduationYear: { type: Number },
  degreeCertificate: { type: String },
  companyName: { type: String },
  companyWebsite: { type: String },
  country: { type: String },
  city: { type: String },
  gmailAccessToken: { type: String },
  gmailRefreshToken: { type: String },
  isActive: { type: Boolean, default: true },
  isVerified: { type: Boolean, default: false },
  lastLogin: { type: Date }
}, { timestamps: true });

UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  try {
    const hash = await bcrypt.hash(this.password, 10);
    this.password = hash;
    next();
  } catch (err) {
    next(err);
  }
});

UserSchema.methods.comparePassword = async function (candidate) {
  return await bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.models.User || mongoose.model('User', UserSchema);
