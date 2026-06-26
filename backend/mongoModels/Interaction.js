const mongoose = require('mongoose');

const InteractionSchema = new mongoose.Schema({
  type: { type: String, enum: ['like','view','contact','favorite'], required: true },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  targetId: { type: mongoose.Schema.Types.ObjectId, required: true },
  targetType: { type: String, enum: ['project','user'], required: true },
  message: { type: String },
  status: { type: String }
}, { timestamps: true });

module.exports = mongoose.models.Interaction || mongoose.model('Interaction', InteractionSchema);
