# Bản Đồ Mã Nguồn Hệ Thống SCADA IoT

## Cấu Trúc Thư Mục & File
```text
c:\program1\dashboard-gas\
├── app.js                          # Core khởi tạo Server Express, định tuyến API và nạp Socket/MQTT
├── CODE_MAP.md                     # Bản đồ cấu trúc và lưu trữ quy tắc AI (Bạn đang xem)
├── package.json                    # Quản lý dependencies (express, mongoose, mqtt, socket.io...)
├── .env                            # Chứa biến môi trường bảo mật (MongoDB URI, JWT Secret...)
├── config/
│   └── passport.js                 # Cấu hình xác thực thư viện Passport.js cho Google OAuth 2.0
├── controllers/
│   ├── authController.js           # Xử lý Logic đăng ký, đăng nhập Local & Google
│   ├── deviceController.js         # API Quản lý Gateway (Fetch, Phát lệnh cấu hình Wi-Fi/OTA xa)
│   └── userController.js           # API Quản lý hồ sơ và đổi mật khẩu của User
├── middlewares/
│   └── authMiddleware.js           # Xác minh, phân rã JWT chặn đứng Request vô danh
├── models/
│   ├── Device.js                   # Mongoose Schema lưu trữ Cấu hình, ID, Trạng thái Heartbeat của Gateway
│   ├── Telemetry.js                # Schema lưu lịch sử dữ liệu cảm biến dạng Timeseries
│   └── User.js                     # Schema định danh thông tin Người dùng
├── public/                         # Lưu trữ giao diện Web Frontend (Vanilla JS SPA)
│   ├── index.html                  # Giao diện lõi của SPA chia khung Canvas
│   ├── css/
│   │   └── style.css               # Phong cách SCADA Dark Theme và CSS Layout chung
│   └── js/
│       ├── app.js                  # Router SPA xử lý Event HTML, API Fetch, Socket & Chart.js đồ thị
│       └── pages.js                # Lưu trữ các mảng khung Template HTML tĩnh (Component views)
├── routes/
│   ├── authRoutes.js               # Các endpoint URL định tuyến Đăng ký/Login
│   ├── deviceRoutes.js             # Các endpoint URL điều khiển Thiết bị
│   └── userRoutes.js               # Các endpoint URL hồ sơ con người
├── services/
│   ├── mqttService.js              # Kết nối Broker HiveMQ, lọc JSON Telemetry/Status, đẩy vào DB Mongoose
│   └── socketService.js            # Khởi tạo WebSocket Server, quản lý JWT Socket và Global Broadcast
└── esp01_gateway/
    ├── esp01_gateway.ino           # Firmware C++ cho con chip ESP-01 quản lý Wi-Fi và MQTT
    └── README-ARDUINO.md           # Sách hướng dẫn Flash code phần cứng nhúng
```

## Chi tiết các hàm cốt lõi (Controllers, Services, MQTT Handlers)

### 1. authController.js
- **register**: Đăng ký User mới bằng email/pass kèm xử lý mã hoá lưu lượng BCRYPT.
  - **Input**: `req.body { name, email, password, phone, department }`
  - **Output**: `JSON { token, message }` (Mã HTTP 201 hoặc 400).
  - **Được gọi từ**: endpoint `POST /api/auth/register` trong file `authRoutes.js`.

- **login**: Kiểm tra xác thực (Authentication) tài khoản Local.
  - **Input**: `req.body { email, password }`
  - **Output**: `JSON { token }` dựa trên Secret Token của Passport.
  - **Được gọi từ**: endpoint `POST /api/auth/login` trong file `authRoutes.js`.

### 2. deviceController.js
- **getMyDevices**: Truy vấn DB MongoDB lấy danh sách Gateway sở hữu, tự động nhồi Device '001' Model Demo nếu chưa có, và đánh dấu hiển thị lại mảng Device thành Offline nếu trễ Heartbeat 75s.
  - **Input**: `req.user.id` (Bóc tách từ JWT Token qua authMiddleware)
  - **Output**: Mảng các `Array [Device Objects]` thời gian thực.
  - **Được gọi từ**: endpoint `GET /api/device/my-devices` trong file `deviceRoutes.js`.

- **changeWifi**: Phát lệnh Topic đổi SSID/Mật khẩu xuống Gateway qua cầu MQTT.
  - **Input**: `req.body { deviceId, ssid, password }`
  - **Output**: `JSON { message }` hoặc HTTP 503 nếu lỗi Broker.
  - **Được gọi từ**: endpoint `POST /api/device/change-wifi` trong file `deviceRoutes.js`.

- **changeOTA**: Phát lệnh cập nhật tham số cập nhật bằng mây OTA xuống Flash EEPROM của mạch ESP.
  - **Input**: `req.body { deviceId, hostname, password }`
  - **Output**: `JSON { message }` và HTTP Confirm 200.
  - **Được gọi từ**: endpoint `POST /api/device/change-ota` trong file `deviceRoutes.js`.

### 3. mqttService.js (MQTT Handlers)
- **initMqtt**: Khởi tạo kết nối HiveMQ bằng giao thức Socket TLS bảo mật `mqtts://`, lắng nghe kênh Wildcard `gateway/+/telemetry` và theo dõi Heartbeat `gateway/+/status`. Payload từ ESP được giải nén lưu thẳng vào Mongoose Telemetry hoặc xử lý logic Timeout Device.
  - **Input**: Gọi hàm trống. Dùng hằng số TLS có sẵn `cb305...` và User/Pass.
  - **Output**: `void` (Treo Worker Listner Callback `client.on('message')`).
  - **Được gọi từ**: `app.js` khởi tạo một lần khi Node kết nối MongoDB thành công.

- **publishCommand**: Pub chuỗi JSON lệnh điều khiển xuống tận Hardware theo kênh DeviceID tương ứng.
  - **Input**: `deviceId (String)`, `payload (Object JSON Format)`
  - **Output**: `Boolean` (Thành công/Thất bại nảy sự kiện)
  - **Được gọi từ**: `deviceController.js` (từ con ngõ gọi `changeWifi` hoặc `changeOTA`).

### 4. socketService.js
- **initSocket**: Gói thọc Websocket (Wrapper) gắn middleware bảo vệ bắt JWT token qua handshake để cho phép trình duyệt truy cập tài nguyên.
  - **Input**: `HTTP Server Express Object` instance.
  - **Output**: `void`
  - **Được gọi từ**: Server Root tại `app.js`.

- **broadcastToAll**: Bộc phát sự kiện Cập nhật giao diện tới toàn bộ Màn hình Web Client Admin đang bật bằng chuẩn Socket Global Emit.
  - **Input**: `eventName (String)`, `data (Object JSON Cảm biến/Trạng thái)`
  - **Output**: `void` 
  - **Được gọi từ**: `WatchDog Timer Loop` của `app.js` và `Client Handler` của `mqttService.js`.

---

## Các Topic MQTT Quan Trọng Đang Sử Dụng

1. **`gateway/+/telemetry`** (Backend Lắng nghe - Phía trạm ESP Publish)
   - Chức năng: Nhận dữ liệu đo đạc Cảm Biến định kỳ. Dấu `+` đại diện bắt Wildcard Device ID. Payload là khung JSON chứa `SO2`, `PM2.5` và `Timestamp`.
   
2. **`gateway/+/status`** (Backend Lắng nghe - Phía trạm ESP Publish)
   - Chức năng: Bắt nhịp luồng Heartbeat chu kỳ 60s để hiển thị trạng thái `Online`, sóng `wifi_rssi` và `wifi_ssid`. Trái tim của Hệ thống WatchDog.
   
3. **`gateway/+/command`** (ESP Lắng nghe - Phía Backend Node.js Publish)
   - Chức năng: Phương tiện truyền tải mệnh lệnh điều khiển xuống Trạm. 
   - Các Payload hỗ trợ:
     - `{"cmd": "change_wifi", "ssid": "...", "pass": "..."}`: ESP đón và khởi động quá trình thay đổi Wi-Fi (Tích hợp luồng Rollback khôi phục sao lưu nếu sập pass 15s).
     - `{"cmd": "change_ota", "hostname": "...", "password": "..."}`: ESP phân tách, lưu bộ chìa khoá mật khẩu nạp không dây vào dải EEPROM vật lý rồi Restart áp dụng.
