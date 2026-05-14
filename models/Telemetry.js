const mongoose = require('mongoose');

const TelemetrySchema = new mongoose.Schema({
  metadata: {
    deviceId: { type: String, required: true },
    nodeId: { type: Number, default: 1 }
  },
  so2: { type: Number, required: true },
  pm1: { type: Number, required: true },
  pm25: { type: Number, required: true },
  pm10: { type: Number, required: true },
  timestamp: { type: Date, default: Date.now }
}, {
  // Leverage MongoDB Native Time-Series features
  timeseries: {
    timeField: 'timestamp',
    metaField: 'metadata',
    granularity: 'seconds'
  }
});

module.exports = mongoose.model('Telemetry', TelemetrySchema);
