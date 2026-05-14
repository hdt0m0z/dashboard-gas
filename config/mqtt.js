const mqtt = require('mqtt');
require('dotenv').config();

const mqttOptions = {
  host: process.env.MQTT_HOST || 'cb305207255b4924b77b0ce88d8d68f2.s1.eu.hivemq.cloud',
  port: process.env.MQTT_PORT || 8883,
  protocol: 'mqtts', // TLS/SSL connection
  username: process.env.MQTT_USERNAME || 'hdt0z0m',
  password: process.env.MQTT_PASSWORD || 'Thaihuy9903',
  clientId: `mqtt_backend_${Math.random().toString(16).slice(3)}`,
  rejectUnauthorized: false // Sometimes needed for specific cloud brokers if not providing ca
};

let mqttClient = null;

const connectMQTT = () => {
  mqttClient = mqtt.connect(mqttOptions);

  mqttClient.on('connect', () => {
    console.log('✅ MQTT Connected to HiveMQ Cloud');
    // Subscribe to all gateway telemetry and status topics
    mqttClient.subscribe('gateway/+/status', (err) => {
      if (err) console.error('Failed to subscribe to gateway/+/status', err);
    });
    mqttClient.subscribe('gateway/+/telemetry', (err) => {
      if (err) console.error('Failed to subscribe to gateway/+/telemetry', err);
    });
  });

  mqttClient.on('error', (err) => {
    console.error('❌ MQTT Connection Error:', err);
  });

  return mqttClient;
};

const getMQTTClient = () => {
  if (!mqttClient) {
    throw new Error('MQTT Client has not been initialized');
  }
  return mqttClient;
};

module.exports = { connectMQTT, getMQTTClient };
