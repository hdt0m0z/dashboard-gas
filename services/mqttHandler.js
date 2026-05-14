const Device = require('../models/Device');
const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');
const { getMQTTClient } = require('../config/mqtt');

const handleMQTTMessage = async (topic, message) => {
  try {
    const topicParts = topic.split('/');
    if (topicParts[0] !== 'gateway' || (topicParts.length !== 3 && topicParts.length !== 4)) return;

    const deviceId = topicParts[1];
    const messageType = topicParts[2]; // 'status', 'telemetry', or 'config'
    const payload = JSON.parse(message.toString());

    if (messageType === 'status') {
      await handleStatusUpdate(deviceId, payload);
    } else if (messageType === 'telemetry') {
      await handleTelemetryUpdate(deviceId, payload);
    } else if (messageType === 'config' && topicParts.length === 4 && topicParts[3] === 'threshold') {
      await handleThresholdUpdate(deviceId, payload);
    }
  } catch (error) {
    console.error('❌ Error handling MQTT message:', error.message);
  }
};

const handleStatusUpdate = async (deviceId, payload) => {
  const { status, wifi_ssid, wifi_rssi } = payload;
  
  const device = await Device.findOneAndUpdate(
    { deviceId },
    {
      status: status || 'online',
      currentWifiSsid: wifi_ssid || '',
      wifiRssi: wifi_rssi || 0,
      lastActive: new Date()
    },
    { new: false, upsert: false }
  );

  if (device && device.status === 'offline' && (status || 'online') === 'online') {
    await Alert.create({
      deviceId,
      type: 'connection',
      message: 'Đã kết nối lại (Gateway)',
      isResolved: true
    });
  }
  console.log(`✅ Updated status for device ${deviceId}`);
};

const handleTelemetryUpdate = async (deviceId, payload) => {
  const { so2, pm1, pm25, pm10, node } = payload;
  const nodeId = node || 1;

  // Track Node Activity
  const key = `${deviceId}:${nodeId}`;
  if (global.nodeActivityMap) {
    global.nodeActivityMap.set(key, new Date());
    if (global.nodeStatusMap.get(key) === false) {
      // Reconnected
      global.nodeStatusMap.set(key, true);
      await Alert.create({
        deviceId,
        nodeId: parseInt(nodeId),
        type: 'connection',
        message: `Đã kết nối lại (Zone ${nodeId === 1 || nodeId === '1' ? 'A' : 'B'})`,
        isResolved: true
      });
    } else {
      global.nodeStatusMap.set(key, true);
    }
  }

  // 1. Lưu dữ liệu đo đạc vào collection Telemetry
  const telemetry = new Telemetry({
    metadata: { deviceId, nodeId },
    so2,
    pm1,
    pm25,
    pm10,
    timestamp: new Date()
  });
  await telemetry.save();

  // 2. Kiểm tra ngưỡng cảnh báo (Thresholds)
  const device = await Device.findOne({ deviceId });
  if (device && device.settings && device.settings.thresholds) {
    const { limit_so2, limit_pm } = device.settings.thresholds;
    let breached = false;
    let alertMessage = [];

    if (so2 > limit_so2) {
      breached = true;
      alertMessage.push(`SO2 (${so2} ppm) vượt ngưỡng ${limit_so2} ppm.`);
    }
    
    // Kiểm tra bất kỳ bụi mịn nào vượt ngưỡng
    if (pm1 > limit_pm || pm25 > limit_pm || pm10 > limit_pm) {
      breached = true;
      alertMessage.push(`Nồng độ bụi PM vượt ngưỡng ${limit_pm} µg/m³.`);
    }

    if (breached) {
      const alert = new Alert({
        deviceId,
        nodeId,
        type: 'threshold_breach',
        message: alertMessage.join(' '),
      });
      await alert.save();
      console.log(`⚠️ Alert created for device ${deviceId}: ${alert.message}`);
    }
  }
};

const handleThresholdUpdate = async (deviceId, payload) => {
  const { limit_so2, limit_pm } = payload;
  if (limit_so2 === undefined || limit_pm === undefined) return;
  
  try {
    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        'settings.thresholds.limit_so2': limit_so2,
        'settings.thresholds.limit_pm': limit_pm
      },
      { new: true }
    );
    if (device) {
      const { broadcastToAll } = require('./socketService');
      broadcastToAll('threshold_update', {
        deviceId,
        limit_so2,
        limit_pm
      });
      console.log(`✅ Received & Updated Threshold via MQTT for ${deviceId}: SO2=${limit_so2}, PM=${limit_pm}`);
    }
  } catch (err) {
    console.error('Failed to update threshold from MQTT:', err);
  }
};

const updateThresholds = async (deviceId, newSo2, newPm) => {
  try {
    // Cập nhật ngưỡng vào MongoDB
    const device = await Device.findOneAndUpdate(
      { deviceId },
      {
        'settings.thresholds.limit_so2': newSo2,
        'settings.thresholds.limit_pm': newPm
      },
      { new: true }
    );

    if (!device) {
      throw new Error(`Device ${deviceId} not found`);
    }

    // Publish JSON cấu hình ngược lại cho Gateway
    const mqttClient = getMQTTClient();
    const topic = `gateway/${deviceId}/config/threshold`;
    const payload = JSON.stringify({
      limit_so2: newSo2,
      limit_pm: newPm
    });

    mqttClient.publish(topic, payload, { qos: 1 }, (err) => {
      if (err) {
        console.error(`❌ Failed to publish thresholds to ${deviceId}:`, err);
      } else {
        console.log(`✅ Published new thresholds to ${deviceId}`);
      }
    });

    return device;
  } catch (error) {
    console.error('❌ Error updating thresholds:', error.message);
    throw error;
  }
};

const initMQTTHandler = () => {
  const mqttClient = getMQTTClient();
  mqttClient.on('message', handleMQTTMessage);
};

module.exports = {
  initMQTTHandler,
  updateThresholds
};
