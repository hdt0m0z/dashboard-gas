const mongoose = require('mongoose');

const MqttLogSchema = new mongoose.Schema({
  direction: { 
    type: String, 
    enum: ['IN', 'OUT'], 
    required: true,
    description: 'Hướng gói tin: IN (Từ thiết bị tới Server), OUT (Từ Server tới thiết bị)'
  },
  topic: { 
    type: String, 
    required: true 
  },
  payload: { 
    type: String,
    description: 'Nội dung gói tin (JSON String hoặc Plain Text)'
  },
  timestamp: { 
    type: Date, 
    default: Date.now,
    index: true // Đánh index để truy vấn theo thời gian nhanh hơn
  }
});

module.exports = mongoose.model('MqttLog', MqttLogSchema);
