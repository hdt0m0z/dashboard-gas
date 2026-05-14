const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middlewares/authMiddleware');
const { changeWifi, getMyDevices, changeOTA, changeThreshold } = require('../controllers/deviceController');

router.get('/my-devices', verifyToken, getMyDevices);
router.post('/change-wifi', verifyToken, changeWifi);
router.post('/change-ota', verifyToken, changeOTA);
router.post('/change-threshold', verifyToken, changeThreshold);

module.exports = router;
