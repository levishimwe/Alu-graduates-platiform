const mongoose = require('mongoose');

const EmailMessageSchema = new mongoose.Schema({
  senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  recipientEmail: { type: String, required: true },
  subject: { type: String, required: true },
  content: { type: String, required: true },
  status: { type: String, enum: ['pending','sent','failed'], default: 'sent' },
  sentAt: { type: Date }
}, { timestamps: true });

module.exports = mongoose.models.EmailMessage || mongoose.model('EmailMessage', EmailMessageSchema);
