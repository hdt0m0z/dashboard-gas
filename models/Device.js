const mongoose = require('mongoose');

const DeviceSchema = new mongoose.Schema({
  deviceId: {
    type: String,
    required: true,
    unique: true
  },
  ownerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  status: { type: String, default: 'offline' },
  currentWifiSsid: { type: String, default: '' },
  wifiRssi: { type: Number, default: 0 },
  activeNodes: { type: [Number], default: [] },
  loraNodesCount: { type: Number, default: 0 },
  lastActive: { type: Date, default: Date.now },
  settings: {
    thresholds: {
      limit_so2: { type: Number, default: 100.0 }, // ppm
      limit_pm: { type: Number, default: 250.0 } // µg/m³
    },
    ota: {
      hostname: { type: String, default: "Gateway-ESP01" },
      password: { type: String, default: "scada123" }
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Device', DeviceSchema);
