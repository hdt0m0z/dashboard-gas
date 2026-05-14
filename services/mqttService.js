const mqtt = require('mqtt');
const Telemetry = require('../models/Telemetry');
const Device = require('../models/Device');
const socketService = require('./socketService');

let client;

const initMqtt = () => {
  // Vì là bảo mật TLS, bắt buộc phải dùng tiền tố mqtts:// và cung cấp đầy đủ port
  const brokerUrl = 'mqtts://cb305207255b4924b77b0ce88d8d68f2.s1.eu.hivemq.cloud:8883';
  console.log(`[MQTT] Connecting to broker: ${brokerUrl}`);
  
  // Khởi tạo Client bằng broker url kết hợp options cấp quyền auth
  client = mqtt.connect(brokerUrl, {
    username: 'hdt0z0m',
    password: 'Thaihuy9903'
  });

  client.on('connect', () => {
    console.log('[MQTT] Connected to HiveMQ Broker.');
    
    // Subscribe to topic -> gateway/+/telemetry (+ acts as a single-level wildcard for any device ID)
    const topic = 'gateway/+/telemetry';
    client.subscribe(topic, (err) => {
      if (!err) console.log(`[MQTT] Subscribed to topic: ${topic}`);
    });
    client.subscribe('gateway/+/status', (err) => {
      if (!err) console.log(`[MQTT] Subscribed to topic: gateway/+/status`);
    });
  });

  // Message Handler Setup
  client.on('message', async (topic, message) => {
    try {
      // Parse topic structure => e.g., gateway/device123/telemetry
      const topicParts = topic.split('/');
      const deviceId = topicParts[1];
      const topicType = topicParts[2]; // Có thể là 'telemetry' hoặc 'status'
      
      const payloadString = message.toString();
      const data = JSON.parse(payloadString);
      
      if (data.type === 'ota_error') {
        console.warn(`[MQTT] Lỗi OTA từ thiết bị ${deviceId}: ${data.message}`);
        socketService.broadcastToRoom(deviceId, 'gateway_error', {
          deviceId,
          message: data.message
        });
        return; // Bỏ qua ghi Mongoose cho lỗi này
      }
      
      // ---> XỬ LÝ LƯU TRẠNG THÁI (STATUS)
      if (topicType === 'status') {
        console.log(`\n[DEBUG] 1. MQTT Nhận được bản tin STATUS từ Gateway: ${deviceId}`);
        console.log(`[DEBUG] Payload:`, data);
        
        const updatedDoc = await Device.findOneAndUpdate(
          { deviceId: deviceId },
          {
            status: data.status || 'online',
            currentWifiSsid: data.wifi_ssid || '',
            wifiRssi: data.wifi_rssi || 0,
            loraNodesCount: data.lora_nodes_count || 0,
            lastActive: Date.now()
          },
          { new: true, upsert: false }
        );
        
        console.log(`[DEBUG] 2. MongoDB Update Result cho DeviceID [${deviceId}]:`, updatedDoc ? 'THÀNH CÔNG (Đã lưu bản ghi)' : 'THẤT BẠI (Không tìm thấy ID trong DB, bỏ lỡ lưu trữ nhưng vẫn sẽ phát qua Web)');
        
        if (updatedDoc && updatedDoc.status === 'online') {
          const limitSo2 = updatedDoc.settings?.thresholds?.limit_so2 || 100.0;
          const limitPm = updatedDoc.settings?.thresholds?.limit_pm || 250.0;
          const configTopic = `gateway/${deviceId}/config/threshold`;
          const configPayload = JSON.stringify({
            limit_so2: limitSo2,
            limit_pm: limitPm
          });
          client.publish(configTopic, configPayload, { qos: 1 });
          console.log(`[DEBUG] 2.5 Auto-synced thresholds to ${deviceId}: SO2=${limitSo2}, PM=${limitPm}`);
        }
        console.log(`[DEBUG] 3. Phát sóng sự kiện 'gateway_status' TOÀN CẦU để các WEB CLIENT update...\n`);

        socketService.broadcastToAll('gateway_status', {
          deviceId,
          ...data
        });
        return;
      }

      // ---> XỬ LÝ LƯU DỮ LIỆU CẢM BIẾN (TELEMETRY)
      const rawSo2 = data.SO2 ?? data.so2;
      const rawPm25 = data['PM2.5'] ?? data.pm25 ?? data.PM2_5;

      if (rawSo2 === null || rawSo2 === undefined || rawPm25 === null || rawPm25 === undefined) {
        console.warn(`[MQTT] Invalid payload format received on ${topic}:`, data);
        return;
      }

      const so2 = parseFloat(rawSo2) || 0;
      const pm1 = parseFloat(data.pm1) || 0;
      const pm25 = parseFloat(rawPm25) || 0;
      const pm10 = parseFloat(data.pm10) || 0;
      
      let nodeId = 1;
      if (data.node !== undefined && data.node !== null) {
        nodeId = Number(data.node) || 1;
      }
      
      let timestamp = new Date();
      const timeVal = data.time || data.Timestamp || data.timestamp;
      if (timeVal) {
        // Kiểm tra xem timeVal có phải là số (Unix timestamp) không
        const numTime = Number(timeVal);
        if (!isNaN(numTime)) {
          const isSeconds = numTime < 10000000000;
          timestamp = new Date(isSeconds ? numTime * 1000 : numTime);
        } else {
          // Bắt các định dạng từ STM32: "DD MM YYYY HH:MM:SS" hoặc "DD/MM/YYYY HH:MM:SS"
          const regex = /^(\d{1,2})[\s\/](\d{1,2})[\s\/](\d{4})\s+(\d{1,2}):(\d{1,2}):?(\d{1,2})?$/;
          const match = String(timeVal).trim().match(regex);
          
          if (match) {
            const d = parseInt(match[1], 10);
            const m = parseInt(match[2], 10) - 1; // Month in JS is 0-indexed
            const y = parseInt(match[3], 10);
            const hh = parseInt(match[4], 10);
            const mm = parseInt(match[5], 10);
            const ss = match[6] ? parseInt(match[6], 10) : 0;
            
            // Ép thành múi giờ local của Server
            const parsedTime = new Date(y, m, d, hh, mm, ss);
            if (!isNaN(parsedTime.getTime())) timestamp = parsedTime;
          } else {
            // Fallback cho chuẩn chuỗi ISO 8601 ("YYYY-MM-DDTHH:mm:ssZ")
            const parsedTime = new Date(timeVal);
            if (!isNaN(parsedTime.getTime())) {
              timestamp = parsedTime;
            }
          }
        }
      }

      // 1. Store via Mongoose Telemetry Schema
      const newTelemetry = new Telemetry({
        metadata: { deviceId, nodeId },
        so2: so2,
        pm1: pm1,
        pm25: pm25,
        pm10: pm10,
        timestamp
      });
      await newTelemetry.save();

      // 2. Broadcast data directly to interested web clients immediately
      console.log(`\n[MQTT] 📡 Nhận Dữ liệu Cảm biến (TELEMETRY) từ Gateway: ${deviceId} - Node: ${nodeId}`);
      console.log(`   ├─ SO2   : ${so2} ppm`);
      console.log(`   ├─ PM1.0 : ${pm1} µg/m³`);
      console.log(`   ├─ PM2.5 : ${pm25} µg/m³`);
      console.log(`   ├─ PM10  : ${pm10} µg/m³`);
      console.log(`   └─ Time  : ${timestamp.toLocaleString()}`);
      console.log(`[DB] 💾 Đã lưu bản ghi vào Database (bảng Telemetry) thành công!\n`);
      socketService.broadcastToRoom(deviceId, 'telemetry_data', {
        deviceId,
        nodeId: nodeId,
        SO2: so2,
        PM2_5: pm25,
        pm1: pm1,
        pm10: pm10,
        timestamp: newTelemetry.timestamp
      });
      
      // 3. Cập nhật loraNodesCount và kiểm tra ngưỡng cảnh báo (Thresholds)
      const Alert = require('../models/Alert');
      const device = await Device.findOne({ deviceId });
      
      if (device && !device.activeNodes.includes(nodeId)) {
        device.activeNodes.push(nodeId);
        device.loraNodesCount = device.activeNodes.length;
        await device.save();
      }

      if (device && device.settings && device.settings.thresholds) {
        const { limit_so2, limit_pm } = device.settings.thresholds;
        let breached = false;
        let alertMessage = [];

        if (so2 > limit_so2) {
          breached = true;
          alertMessage.push(`SO2 (${so2} ppm) vượt ngưỡng ${limit_so2} ppm.`);
        }
        
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
          console.log(`[ALERT] ⚠️ Cảnh báo tạo cho ${deviceId}: ${alert.message}`);
          
          socketService.broadcastToRoom(deviceId, 'gateway_error', {
            deviceId,
            message: `[CẢNH BÁO] ${alert.message}`
          });
        }
      }
      
    } catch (err) {
      console.error('[MQTT] Message parsing or saving failed:', err);
    }
  });

  client.on('error', (err) => {
    console.error('[MQTT] Connection Error:', err);
  });
};

const publishCommand = (deviceId, payload) => {
  if (client && client.connected) {
    const topic = `gateway/${deviceId}/command`;
    client.publish(topic, JSON.stringify(payload));
    console.log(`[MQTT] Published command to ${topic}`);
    return true;
  }
  return false;
};

const updateThresholds = async (deviceId, newSo2, newPm) => {
  try {
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

    if (client && client.connected) {
      const topic = `gateway/${deviceId}/config/threshold`;
      const payload = JSON.stringify({
        limit_so2: newSo2,
        limit_pm: newPm
      });
      client.publish(topic, payload, { qos: 1 }, (err) => {
        if (err) console.error(`❌ Failed to publish thresholds to ${deviceId}:`, err);
        else console.log(`✅ Published new thresholds to ${deviceId}`);
      });
    }

    return device;
  } catch (error) {
    console.error('❌ Error updating thresholds:', error.message);
    throw error;
  }
};

module.exports = { initMqtt, publishCommand, updateThresholds };

