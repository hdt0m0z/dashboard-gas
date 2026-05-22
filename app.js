require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const passport = require('passport');
const http = require('http');

// Import App Routes
const authRoutes = require('./routes/authRoutes');
const userRoutes = require('./routes/userRoutes');
const deviceRoutes = require('./routes/deviceRoutes');

// Execute passport config
require('./config/passport');

// Import Real-time Services
const { initSocket } = require('./services/socketService');
const { initMqtt } = require('./services/mqttService');

const app = express();
// Bind express app to an HTTP server to enable Socket.IO integration
const server = http.createServer(app);

// Express JSON body parser middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize Passport
app.use(passport.initialize());

const telemetryRoutes = require('./routes/telemetryRoutes');

// Map Routes
app.use('/api/auth', authRoutes);
app.use('/api/user', userRoutes);
app.use('/api/device', deviceRoutes);
app.use('/api/telemetry', telemetryRoutes);

// Serve static files for SPA layout
app.use(express.static('public'));

app.get('/api/*', (req, res) => {
  res.status(404).json({ message: 'API Route Not Found' });
});

// Any non /api route loads the SPA (fallback)
app.get('*', (req, res) => {
  const path = require('path');
  res.sendFile(path.resolve(__dirname, 'public', 'index.html'));
});

// Initialize Socket.io and attach to server
initSocket(server);

// Start Server and Connect to MongoDB
const PORT = process.env.PORT || 3000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    
    // Initialize MQTT to start listening to telemetry, assuming DB is now ready
    initMqtt();

    // Use server.listen instead of app.listen
    server.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
    
    // --- HỆ THỐNG WATCHDOG KIỂM DIỆT ONLINE/OFFLINE THỜI GIAN THỰC ---
    const { broadcastToAll } = require('./services/socketService');
    const Device = require('./models/Device');
    const Alert = require('./models/Alert');
    
    // Global map to track node last active times: { 'deviceId:nodeId': timestamp }
    global.nodeActivityMap = global.nodeActivityMap || new Map();
    global.nodeStatusMap = global.nodeStatusMap || new Map(); // true = online, false = offline

    setInterval(async () => {
      try {
        const timeoutThreshold = new Date(Date.now() - 75000); 
        
        // 1. Check Gateway
        const deadDevices = await Device.find({ lastActive: { $lt: timeoutThreshold }, status: 'online' });
        for (let d of deadDevices) {
          d.status = 'offline';
          await d.save();
          broadcastToAll('gateway_status', { deviceId: d.deviceId, status: 'offline' });
          console.log(`[Watchdog] Thiết bị [${d.deviceId}] mất tín hiệu quá 75s!`);
          
          const alert = await Alert.create({
            deviceId: d.deviceId,
            nodeId: 0,
            type: 'connection',
            message: 'Mất kết nối đột ngột (Gateway)',
            isResolved: false
          });
          broadcastToAll('new_alert', alert);
        }

        // 2. Check Nodes
        for (let [key, lastActive] of global.nodeActivityMap.entries()) {
          const isOnline = global.nodeStatusMap.get(key) !== false;
          if (isOnline && lastActive < timeoutThreshold) {
            // Node is dead
            global.nodeStatusMap.set(key, false);
            const [deviceId, nodeId] = key.split(':');
            
            const alert = await Alert.create({
              deviceId,
              nodeId: parseInt(nodeId),
              type: 'connection',
              message: `Mất kết nối Node (Node ${nodeId})`,
              isResolved: false
            });
            broadcastToAll('new_alert', alert);
            console.log(`[Watchdog] Node [${key}] mất tín hiệu quá 75s!`);
          }
        }

      } catch (err) {
        console.error('Watchdog error:', err);
      }
    }, 15000); // Lặp quét trạm chết cứ 15 giây 1 lần

  })
  .catch((err) => {
    console.error('Database connection error:', err);
  });
