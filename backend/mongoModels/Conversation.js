const mongoose = require('mongoose');

const ConversationSchema = new mongoose.Schema({
  user1Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  user2Id: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }
}, { timestamps: true });

ConversationSchema.index({ user1Id: 1, user2Id: 1 }, { unique: true });

module.exports = mongoose.models.Conversation || mongoose.model('Conversation', ConversationSchema);
