const mongoose = require('mongoose');

const InvestorProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  investmentFocus: { type: [String], default: [] },
  investmentRange: { type: String },
  portfolio: { type: [String], default: [] },
  linkedinProfile: { type: String },
  verified: { type: Boolean, default: false },
  company: { type: String },
  position: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.InvestorProfile || mongoose.model('InvestorProfile', InvestorProfileSchema);
