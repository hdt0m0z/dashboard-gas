# HƯỚNG DẪN CHẠY DỰ ÁN SCADA KHÍ THẢI (BẰNG CMD)

Vì bạn đang dùng hệ điều hành Windows và có thể gặp lỗi "Execution Policies" chặn các file script (PS1) của PowerShell khi chạy lệnh npm, cách tốt nhất là sử dụng **Command Prompt (CMD)** mặc định.

Vui lòng làm theo trình tự dưới đây:

## BƯỚC 1: Mở Command Prompt
1. Nhấn tổ hợp phím **Windows + R**.
2. Gõ **`cmd`** và nhấn Enter.
3. Trong cửa sổ đen hiện ra, hãy trỏ đường dẫn tới tận thư mục chứa source code của bạn:
   ```cmd
   cd c:\program1\dashboard-gas
   ```

## BƯỚC 2: Cài Đặt Các Gói Thư Viện (npm install)
Do dự án tích hợp hệ thống MQTT và Socket.IO nên bạn cần cài đặt các thư viện vào thư mục `node_modules` trước khi chạy lần đầu tiên. Chạy lệnh:
```cmd
npm install
```
*(Đợi một lúc để CMD tải xong toàn bộ các gói vào bộ nhớ máy).*

## BƯỚC 3: Khởi Động Máy Chủ (Server)
Sau khi cài đặt xong, gõ lệnh sau để chạy Backend Node.js lên:
```cmd
node app.js
```

**Biểu hiện chạy thành công:**
Trên CMD sẽ lần lượt in ra các thông báo báo hiệu các service đã kết nối thành công:
> Server is running on port 3000
> Connected to MongoDB
> [MQTT] Connecting to broker: mqtt://broker.hivemq.com
> [MQTT] Connected to HiveMQ Broker.

## BƯỚC 4: Truy Cập Giao Diện SCADA Frontend
Hãy mở trình duyệt bất kỳ (Google Chrome, Edge...) và gõ vào thanh địa chỉ:
**http://localhost:3000/**

*Lưu ý: Ngay tại màn hình Đăng nhập (Mặc định), bạn vui lòng cứ điền email và pass tùy ý vào Form Đăng Nhập, hệ thống sẽ tự động đăng kí thông tin đó và cấp quyền cho bạn vào Dashboard quan sát Luồng Dữ Liệu IoT.*
