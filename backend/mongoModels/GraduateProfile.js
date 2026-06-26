const mongoose = require('mongoose');

const GraduateProfileSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  graduationYear: { type: Number },
  major: { type: String },
  skills: { type: [String], default: [] },
  projects: { type: [mongoose.Schema.Types.ObjectId], ref: 'Project', default: [] },
  experience: { type: String },
  achievements: { type: [String], default: [] },
  portfolio: { type: String },
  linkedinUrl: { type: String },
  githubUrl: { type: String },
  availability: { type: String, enum: ['available','busy','not_available'], default: 'available' }
}, { timestamps: true });

module.exports = mongoose.models.GraduateProfile || mongoose.model('GraduateProfile', GraduateProfileSchema);
