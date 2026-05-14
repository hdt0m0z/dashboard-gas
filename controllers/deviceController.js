const { publishCommand, updateThresholds } = require('../services/mqttService');
const Device = require('../models/Device');

// @desc    Lấy danh sách gateway
// @route   GET /api/device/my-devices
const getMyDevices = async (req, res) => {
    try {
        let devices = await Device.find({ ownerId: req.user.id });
        
        // Nếu user này mới toanh chưa có thiết bị, tự động tiêm thiết bị mẫu vào Database luôn!
        if(devices.length === 0) {
            const demoGw = new Device({
                deviceId: '001',
                ownerId: req.user.id,
                name: 'Gateway Ống Khói Xưởng 1',
                status: 'offline',
                lastActive: Date.now()
            });
            await demoGw.save();
            devices = [demoGw]; // Gán lại mảng
        }
        
        // Cập nhật trạng thái hiển thị trực tiếp trước khi trả mảng về
        const now = Date.now();
        const updatedDevices = devices.map(d => {
            if (d.status === 'online' && (now - new Date(d.lastActive).getTime()) > 75000) {
                d.status = 'offline';
                d.save();
            }
            return d;
        });

        res.status(200).json(updatedDevices);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi Server CSDL' });
    }
};

// @desc    Gửi lệnh MQTT sửa mạng Wi-Fi
// @route   POST /api/device/change-wifi
const changeWifi = async (req, res) => {
    try {
        const { deviceId, ssid, password } = req.body;

        if (!deviceId || !ssid) {
            return res.status(400).json({ message: 'Vui lòng nhập DeviceID và Tên mạng' });
        }
        
        const payload = { 
            cmd: "change_wifi", 
            ssid: ssid, 
            pass: password || "" 
        };

        const success = publishCommand(deviceId, payload);

        if (success) {
            res.status(200).json({ message: 'Đã gửi lệnh cấu hình mạng xuống thiết bị thành công.' });
        } else {
            res.status(503).json({ message: 'Lỗi MQTT: Không thể phát thông điệp tới Gateway' });
        }

    } catch (err) {
        res.status(500).json({ message: 'Lỗi Server', error: err.message });
    }
};

const changeOTA = async (req, res) => {
    try {
        const { deviceId, hostname, password } = req.body;

        if (!deviceId || !hostname) {
            return res.status(400).json({ message: 'Vui lòng nhập DeviceID và Hostname.' });
        }
        
        const payload = { 
            cmd: "change_ota", 
            hostname: hostname, 
            password: password || "" 
        };

        const success = publishCommand(deviceId, payload);

        if (success) {
            res.status(200).json({ message: 'Đã gửi lệnh cập nhật OTA xuống thiết bị.' });
        } else {
            res.status(503).json({ message: 'Lỗi MQTT: Không thể phát lệnh OTA.' });
        }

    } catch (err) {
        res.status(500).json({ message: 'Lỗi Server', error: err.message });
    }
};

const changeThreshold = async (req, res) => {
    try {
        const { deviceId, limit_so2, limit_pm } = req.body;

        if (!deviceId || limit_so2 === undefined || limit_pm === undefined) {
            return res.status(400).json({ message: 'Thiếu tham số cấu hình ngưỡng.' });
        }

        const device = await Device.findOne({ deviceId });
        if (!device) {
            return res.status(404).json({ message: 'Không tìm thấy thiết bị.' });
        }

        if (device.status !== 'online') {
            return res.status(400).json({ message: 'Thiết bị đang ngoại tuyến, không thể điều chỉnh ngưỡng.' });
        }

        await updateThresholds(deviceId, parseFloat(limit_so2), parseFloat(limit_pm));
        res.status(200).json({ message: 'Đã lưu và áp dụng cấu hình ngưỡng mới.' });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi Server', error: err.message });
    }
};

module.exports = {
    getMyDevices,
    changeWifi,
    changeOTA,
    changeThreshold
};
