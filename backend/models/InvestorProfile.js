const mongoose = require("mongoose");

const InvestorProfileSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, unique: true },
    investmentFocus: { type: [String], default: [] },
    investmentRange: { type: String, default: "" },
    portfolio: { type: [String], default: [] },
    linkedinUrl: { type: String, default: "" },
    companyWebsite: { type: String, default: "" },
    company: { type: String, default: "" },
    position: { type: String, default: "" },
    verified: { type: Boolean, default: false },
  },
  { timestamps: true }
);

module.exports = mongoose.models.InvestorProfile || mongoose.model("InvestorProfile", InvestorProfileSchema);