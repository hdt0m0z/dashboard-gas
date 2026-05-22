const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { verifyAdmin } = require('../middlewares/adminMiddleware');
const { changeWifi, getMyDevices, changeOTA, changeThreshold, getTelemetry, getDeviceAlerts, getStabilityStats, getMqttLogs } = require('../controllers/deviceController');

router.get('/my-devices', verifyToken, getMyDevices);
router.post('/change-wifi', verifyToken, verifyAdmin, changeWifi);
router.post('/change-ota', verifyToken, verifyAdmin, changeOTA);
router.post('/change-threshold', verifyToken, verifyAdmin, changeThreshold);
router.put('/:deviceId/rename', verifyToken, verifyAdmin, require('../controllers/deviceController').renameDevice);
router.get('/telemetry/:deviceId', verifyToken, getTelemetry);
router.get('/alerts/:deviceId', verifyToken, getDeviceAlerts);
router.get('/stability/:deviceId', verifyToken, getStabilityStats);
router.get('/mqtt-logs', verifyToken, getMqttLogs);

module.exports = router;
