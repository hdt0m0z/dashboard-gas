# Kiến Trúc Frontend & Giao Tiếp API - SCADA Dashboard

Tài liệu này tóm tắt cấu trúc giao diện người dùng (UI), các công nghệ được sử dụng và cách Frontend giao tiếp với Backend NodeJS.

## 1. Công Nghệ Trình Diễn (Frontend Stack)
Hệ thống Frontend được xây dựng theo kiến trúc **SPA (Single Page Application)** thuần túy để đảm bảo tốc độ phản hồi siêu nhanh mà không cần tải lại trang.

- **Cốt lõi**: Vanilla JavaScript (ES6 Modules), HTML5, Vanilla CSS3 (Dark Theme + Glassmorphism).
- **Thư viện đồ họa**: `Chart.js` để vẽ đa dạng biểu đồ (Radar, Line History, Doughnut, Bar).
- **Kết nối Real-time**: `Socket.io-client` để nhận dữ liệu đẩy từ Server theo thời gian thực.
- **Đa ngôn ngữ**: `i18next` hỗ trợ chuyển đổi Anh - Việt ngay lập tức.
- **Cảnh báo (Toast)**: `Toastify` để hiển thị các popup nhỏ góc màn hình khi có lỗi hoặc thành công.

## 2. Cấu Trúc Các Trang (Pages/Views)
Hệ thống Router được tự lập trình thông qua sự thay đổi của `window.location.hash` (`#`), phân chia làm các view chính nằm trong `public/js/pages.js`:

- **`/` (LoginPage)** & **`/register` (RegisterPage)**: Màn hình đăng nhập/đăng ký. Tích hợp thanh đánh giá Rule bắt lỗi mật khẩu (chữ hoa, số, ký tự đặc biệt) ngay trên lúc gõ, cùng nút Đăng nhập siêu tốc qua Google OAuth.
- **`/dashboard` (DashboardPage)**: Màn hình SCADA giám sát tổng quan chia làm 3 cột rõ rệt:
  - *Cột trái*: Biểu đồ Hạn mức xả thải (Doughnut) và Phân bổ chất ô nhiễm (Radar).
  - *Cột giữa*: Trái tim của giao diện với Hình ảnh Mô hình nhà máy và 2 tấm kính theo dõi hiển thị giá trị SO2, PM2.5, AQI nhấp nháy bằng WebSockets. Đi kèm bảng Nhật ký cảnh báo.
  - *Cột phải*: Biểu đồ Lịch sử (Line Chart) tự động cuộn qua trái theo thời gian và Thống kê lưu lượng (Bar Chart).
- **`/devices` (DevicesPage)**: Liệt kê các Trạm thu (Gateway) đang sở hữu. Hiển thị thông số Sóng WiFi, Trạng thái hoạt động (Online/Offline) và số lượng Node LoRa kết nối.
- **`/network` (NetworkPage)** & **Cấu hình OTA**: Form để nhập tên/mật khẩu mạng WiFi hoặc mật khẩu OTA mới. Sau đó hệ thống sẽ truyền MQTT xuống vi điều khiển để ép khởi động lại.

## 3. Cơ Chế Giao Tiếp API & WebSockets (Logic trong `app.js`)

### 3.1. Dòng chảy REST API (HTTP Request)
Dùng `fetch()` truyền tệp JSON kèm theo `Authorization: Bearer <Token>` để bảo mật gửi lệnh về Server:
- `POST /api/auth/login`, `POST /api/auth/register`: Cấp phát thẻ xác thực JWT (sau đó lưu bí mật vào trình duyệt qua biến `localStorage('scada_token')`).
- `GET /api/device/my-devices`: Kéo danh sách cấu hình Gateway về.
- `POST /api/device/change-wifi`, `POST /api/device/change-ota`: Chuyển yêu cầu giao thức HTTP thành giao thức MQTT trên Backend để bắn xuống lại cho mạch ESP-01.

### 3.2. Dòng chảy WebSockets (Socket.IO Real-time)
Đây là công nghệ cốt lõi giúp giao diện "sống động", dữ liệu tự trôi về Client liên tục vài giây một lần mà không cần Request mới:

- **Gửi Yêu Cầu Theo Dõi Trạm (`emit 'join_device'`)**: Khi người dùng gõ mã ID của Trạm vào ô textbox và nhấn nút "THEO DÕI TRẠM", Backend sẽ ghép kết nối của người dùng vào đúng Room của trạm đó để lọc bớt dữ liệu các trạm nhà máy khác, tối ưu băng thông đường truyền.
- **Lắng nghe Lệnh Trạng Thái (`on 'gateway_status'`)**: 
  - Bất kỳ khi nào thiết bị Offline, Online do đứt mạch, đổi mạng WiFi hay Tín hiệu thay đổi... UI lập tức đổi màu bóng đèn từ Đỏ sang Xanh.
  - Hiển thị Cường độ sóng Wi-Fi (-60 dBm, -70 dBm...) linh động.
- **Lắng nghe Lệnh Cảm biến (`on 'telemetry_data'`)**: 
  - Ghi đè vào các DOM `#so2-1`, `#pm25-1` ngay trên tấm bảng kính theo dõi Ống khói nhà máy.
  - Tự động thay đổi màu chữ các tham số (Xanh, Vàng, Đỏ) tùy định mức nguy hiểm. Ví dụ: `SO2 > 100` đổi lớp class CSS sang `param-danger`.
  - Nạp (Push) mảng giá trị `time`, `so2`, `pm2.5` vào Data set của `Chart.js` để đường Line liên tục nhích lên xuống theo biến thiên thực tế.
  - Nếu chỉ số độc hại, nháy mép tấm bảng kính đỏ rực lên và gọi hàm Toast kích hoạt chuông cảnh báo ở góc trái màn hình.
