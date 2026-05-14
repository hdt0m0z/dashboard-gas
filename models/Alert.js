const mongoose = require('mongoose');

const AlertSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true
  },
  nodeId: {
    type: Number,
    default: 1
  },
  type: {
    type: String,
    enum: ['threshold_breach', 'device_offline', 'connection'],
    required: true
  },
  message: {
    type: String,
    required: true
  },
  isResolved: {
    type: Boolean,
    default: false
  },
  resolvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

AlertSchema.index({ deviceId: 1, isResolved: 1 });

module.exports = mongoose.model('Alert', AlertSchema);
