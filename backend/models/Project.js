const mongoose = require("mongoose");

const ProjectSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    graduateId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    category: { type: String, default: "" },
    impactArea: { type: String, default: "" },
    technologies: { type: [String], default: [] },
    images: { type: [String], default: [] },
    videos: { type: [String], default: [] },
    documents: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["draft", "pending", "active", "completed", "rejected", "published"],
      default: "draft",
    },
    fundingGoal: { type: Number, default: 0 },
    currentFunding: { type: Number, default: 0 },
    demoUrl: { type: String, default: "" },
    repoUrl: { type: String, default: "" },
    featured: { type: Boolean, default: false },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// Text index for search
ProjectSchema.index({ title: "text", description: "text", category: "text" });
ProjectSchema.index({ graduateId: 1 });
ProjectSchema.index({ status: 1 });

module.exports = mongoose.models.Project || mongoose.model("Project", ProjectSchema);