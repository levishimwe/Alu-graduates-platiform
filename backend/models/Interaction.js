const mongoose = require("mongoose");

const InteractionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["like", "view", "contact", "favorite", "bookmark", "interest"],
      required: true,
    },
    investorId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    message: { type: String, default: "" },
    status: { type: String, default: "active" },
  },
  { timestamps: true }
);

InteractionSchema.index({ investorId: 1, projectId: 1, type: 1 });

module.exports = mongoose.models.Interaction || mongoose.model("Interaction", InteractionSchema);