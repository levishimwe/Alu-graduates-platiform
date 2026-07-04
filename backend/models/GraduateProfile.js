const mongoose = require("mongoose");

const GraduateProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    graduationYear: { type: Number },
    major: { type: String, default: "" },
    skills: { type: [String], default: [] },
    experience: { type: String, default: "" },
    achievements: { type: [String], default: [] },
    portfolioUrl: { type: String, default: "" },
    linkedinUrl: { type: String, default: "" },
    githubUrl: { type: String, default: "" },
    degreeCertificate: { type: String, default: null },
    availability: {
      type: String,
      enum: ["available", "busy", "not_available"],
      default: "available",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.models.GraduateProfile || mongoose.model("GraduateProfile", GraduateProfileSchema);