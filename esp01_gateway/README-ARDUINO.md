# HƯỚNG DẪN CÀI ĐẶT VÀ NẠP CODE CHO MẠCH ESP-01 (TỪ A - Z)

Để biên dịch và nạp đoạn code `esp01_gateway.ino`, bạn cần thiết lập phần mềm Arduino IDE đúng chuẩn cốt lõi lõi cấu trúc ESP8266. Hệ thống Gateway đã được nâng cấp với khả năng kết nối MQTT (TLS), Auto-rollback WiFi, và nạp code OTA.

---

## BƯỚC 1: Cài đặt Board ESP8266 cho Arduino IDE
Arduino IDE mặc định chỉ hỗ trợ các mạch Arduino (Uno, Nano...). Vì ESP-01 thuộc họ ESP8266, bạn cần tải driver board của nó.

1. Khởi động **Arduino IDE**.
2. Vào menu **File** -> **Preferences** (hoặc `Ctrl + ,`).
3. Chú ý dòng **Additional Boards Manager URLs**, copy link sau và dán vào đó:
   ```text
   http://arduino.esp8266.com/stable/package_esp8266com_index.json
   ```
4. Nhấn **OK**.
5. Tiếp tục vào menu **Tools** -> **Board** -> **Boards Manager...**
6. Gõ chữ `esp8266` vào thanh tìm kiếm. Bạn sẽ thấy ô kết quả ghi chữ "esp8266 by ESP8266 Community".
7. Bấm **Install** và đợi tải về.
8. Cài xong, vào lại **Tools** -> **Board** -> kéo xuống chọn dải **ESP8266 Boards** -> Click chọn mạch **"Generic ESP8266 Module"**.

---

## BƯỚC 2: Cài đặt các Thư viện (Libraries) bắt buộc
Mã nguồn của hệ thống SCADA có tích hợp MQTT, xử lý WiFi Captive Portal và JSON. Bạn phải cài đủ 3 thư viện sau từ Library Manager (`Ctrl + Shift + I`):

1. **`WiFiManager`**: Tác giả "tzapu".
2. **`PubSubClient`**: Tác giả "Nick O'Leary".
3. **`ArduinoJson`**: Tác giả "Benoit Blanchon" (Hỗ trợ mạnh nhất để đóng gói và giải nén chuỗi JSON IoT).

---

## BƯỚC 3: Sơ đồ phần cứng & Nạp Code Lần Đầu
ESP-01 không có sẵn chân MicroUSB, nên bạn cần một mạch chuyển đổi USB to TTL (ví dụ: CP2102 hoặc CH340).

Sơ đồ nối chân Nạp Code (Flash Mode) - **BẮT BUỘC**:
- **TX** (Mạch nạp) -> **RX** (ESP-01)
- **RX** (Mạch nạp) -> **TX** (ESP-01)
- **3.3V** (Mạch nạp) -> **VCC** (ESP-01) *(Tuyệt đối không dùng 5V)*
- **GND** (Mạch nạp) -> **GND** (ESP-01)
- **EN (CH_PD)** (ESP-01) -> Kéo lên 3.3V qua trở 10k (Hoặc đấu thẳng 3.3V nếu test nhanh).
- **GPIO0** (ESP-01) -> Bắt buộc nối với **GND** trước khi cấp điện để ép mạch vào chế độ BOOT nạp code.

**Nạp Code:**
1. Cắm bộ TTL vào máy tính.
2. Tại Arduino IDE, menu **Tools** -> **Port** -> Chọn cổng **COM** đang hiện.
3. Bấm **Upload** (Mũi tên chĩa sang phải ➡). Đợi Build và nạp đạt `100%`.
4. Rút cáp ra. **Tháo chân kết nối GPIO0 với GND đi**.
5. Cấp lại điện cho mạch để chạy chế độ bình thường.

---

## BƯỚC 4: Định Dạng Giao Tiếp JSON (Quan Trọng)
Gateway ESP-01 có nhiệm vụ chuyển tiếp chuỗi UART từ STM32 lên HiveMQ Cloud (Node.js Server) và nhận lệnh gửi ngược xuống.

### 1. Dữ liệu từ STM32 -> Server (Topic: `gateway/{deviceId}/telemetry`)
Bạn phải lập trình Firmware STM32 đẩy qua cổng Serial (UART) chuỗi JSON chuẩn xác như sau:
```json
{
  "node": 1,
  "so2": 4.5,
  "pm1": 12.0,
  "pm25": 20.5,
  "pm10": 45.2,
  "time": "2023-10-25T14:30:00Z"
}
```
*Lưu ý: Backend NodeJS sẽ tự động parse chuỗi `time` để đồng bộ lịch sử. Nếu `time` trống, Backend sẽ lấy thời gian server bù vào.*

### 2. Dữ liệu Lệnh từ Server -> STM32 (Topic: `gateway/{deviceId}/config/threshold`)
Khi có thay đổi ngưỡng cảnh báo từ Web Dashboard, ESP-01 sẽ nhận MQTT và in nguyên bản ra Serial kèm theo cú pháp `<CFG:...>` để STM32 dễ dàng tách bóc:
```text
<CFG:{"limit_so2": 5.0, "limit_pm": 50.0}>
```
STM32 có trách nhiệm quét chuỗi trong cặp `< >` để lấy ngưỡng cài đặt mới.

---

## BƯỚC 5: Hướng dẫn cấu hình hoạt động thực tế (Captive Portal)
1. Cấp nguồn bình thường cho ESP-01.
2. ESP-01 sẽ phát ra một mạng WiFi Tạm tên là **"Gateway_Setup"**.
3. Dùng điện thoại kết nối vào mạng trên. Một giao diện (Captive Portal) sẽ tự bật lên.
4. Chọn **"Configure WiFi"**, dò tên WiFi nhà/xưởng của bạn, điền Password và bấm Save.
5. Mạch tự động khởi động lại, tắt "Gateway_Setup" và ngầm vào mây!

---

## BƯỚC 6: Cập nhật Firware KHÔNG DÂY (OTA)
Sau khi mạch đã vào mạng, từ nay bạn có thể nạp code từ xa mà không cần cắm dây thủ công.
1. Đảm bảo Laptop và ESP-01 bắt chung một mạng Wi-Fi.
2. Vào **Tools** -> **Port** -> Chọn cổng mạng ghi "**Gateway-ESP01 at 192.168.x.x**".
3. Bấm **Upload** Code. Arduino IDE sẽ hỏi Password.
4. Gõ password (mặc định là **"scada123"**) và bấm OK. Firmware sẽ được đẩy không dây qua sóng Wi-Fi thẳng vào phần cứng.
