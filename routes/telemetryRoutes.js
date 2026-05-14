const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { getStats, getAlerts, getUptime } = require('../controllers/telemetryController');

router.get('/stats', verifyToken, getStats);
router.get('/alerts', verifyToken, getAlerts);
router.get('/uptime', verifyToken, getUptime);

module.exports = router;
