const mongoose = require("mongoose");

const EmailMessageSchema = new mongoose.Schema(
  {
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    recipientEmail: { type: String, required: true, lowercase: true, trim: true },
    subject: { type: String, required: true },
    content: { type: String, required: true },
    status: { type: String, enum: ["pending", "sent", "failed"], default: "pending" },
    sentAt: { type: Date },
  },
  { timestamps: true }
);

EmailMessageSchema.index({ senderId: 1, sentAt: -1 });

module.exports = mongoose.models.EmailMessage || mongoose.model("EmailMessage", EmailMessageSchema);