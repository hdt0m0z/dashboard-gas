const { publishCommand, updateThresholds } = require('../services/mqttService');
const Device = require('../models/Device');
const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');
const MqttLog = require('../models/MqttLog');

// @desc    Lấy danh sách gateway
// @route   GET /api/device/my-devices
const getMyDevices = async (req, res) => {
    try {
        // Trong hệ thống SCADA, tất cả nhân viên (user/admin) đều giám sát chung thiết bị
        let devices = await Device.find();

        // Nếu hệ thống hoàn toàn chưa có thiết bị nào, tạo một thiết bị mẫu
        if (devices.length === 0) {
            const demoGw = new Device({
                deviceId: 'Gateway-ESP01',
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

const getTelemetry = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { range } = req.query; // '1h', '15m', '5m', 'live'

        // Tần suất 30s/lần cho 2 Node. Tức là 1 phút có 4 bản ghi.
        let limit = 40; // Mặc định live (20 điểm mỗi node)
        if (range === '1h') limit = 240; // 60 phút * 4 = 240
        else if (range === '15m') limit = 60; // 15 phút * 4 = 60
        else if (range === '5m') limit = 20; // 5 phút * 4 = 20

        const data = await Telemetry.find({ 'metadata.deviceId': deviceId })
            .sort({ timestamp: -1 })
            .limit(limit);

        // Đảo ngược mảng để trả về thứ tự thời gian cũ -> mới
        data.reverse();
        res.status(200).json(data);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi Server khi truy xuất lịch sử đo', error: err.message });
    }
};

const getDeviceAlerts = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const alerts = await Alert.find({ deviceId })
            .sort({ timestamp: -1 })
            .limit(50);
        res.status(200).json(alerts);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi Server khi truy xuất lịch sử cảnh báo', error: err.message });
    }
};

const getStabilityStats = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const { range } = req.query;

        let startTime = new Date();
        if (range === 'week') {
            startTime.setDate(startTime.getDate() - 7);
        } else if (range === 'month') {
            startTime.setMonth(startTime.getMonth() - 1);
        } else if (range === 'year') {
            startTime.setFullYear(startTime.getFullYear() - 1);
        } else {
            startTime.setHours(0, 0, 0, 0);
        }

        const query = {
            deviceId,
            type: 'connection',
            isResolved: false,
            timestamp: { $gte: startTime }
        };

        const dropsGw = await Alert.countDocuments({
            ...query,
            $or: [{ nodeId: 0 }, { nodeId: 1, message: /Gateway/i }]
        });
        const dropsN1 = await Alert.countDocuments({
            ...query,
            nodeId: 1,
            message: { $not: /Gateway/i }
        });
        const dropsN2 = await Alert.countDocuments({ ...query, nodeId: 2 });

        res.status(200).json({ dropsGw, dropsN1, dropsN2 });
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy thống kê', error: err.message });
    }
};

const getMqttLogs = async (req, res) => {
    try {
        const logs = await MqttLog.find()
            .sort({ timestamp: -1 })
            .limit(100);
        res.status(200).json(logs);
    } catch (err) {
        res.status(500).json({ message: 'Lỗi lấy lịch sử MQTT', error: err.message });
    }
};

const renameDevice = async (req, res) => {
    try {
        const { name } = req.body;
        if (!name) return res.status(400).json({ message: 'Tên thiết bị không được để trống' });
        
        const device = await Device.findOne({ deviceId: req.params.deviceId });
        if (!device) return res.status(404).json({ message: 'Không tìm thấy thiết bị' });

        device.name = name;
        await device.save();
        res.status(200).json({ message: 'Đổi tên thành công', device });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

module.exports = {
    getMyDevices,
    changeWifi,
    changeOTA,
    changeThreshold,
    getTelemetry,
    getDeviceAlerts,
    getStabilityStats,
    getMqttLogs,
    renameDevice
};
