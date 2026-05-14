#include <ESP8266WiFi.h>
#include <WiFiClientSecure.h>
#include <PubSubClient.h>
#include <WiFiManager.h>
#include <ArduinoOTA.h>
#include <ArduinoJson.h>
#include <EEPROM.h>

// --- CẤU HÌNH OTA ---
struct OTAConfig {
  char magic[8];
  char hostname[32];
  char password[32];
};
OTAConfig otaCfg;

// --- THÔNG SỐ MQTT (HIVEMQ CLOUD TLS) ---
const char* mqtt_server = "cb305207255b4924b77b0ce88d8d68f2.s1.eu.hivemq.cloud"; 
const int mqtt_port = 8883; 
const char* mqtt_user = "hdt0z0m"; 
const char* mqtt_pass = "Thaihuy9903"; 

// --- KHAI BÁO CÁC TOPIC MQTT ---
const char* topic_telemetry = "gateway/001/telemetry";               // Gửi dữ liệu cảm biến lên
const char* topic_status = "gateway/001/status";                     // Gửi trạng thái sống (heartbeat)
const char* topic_command = "gateway/001/command";                   // Nhận lệnh cấu hình mạng/OTA
const char* topic_config_threshold = "gateway/001/config/threshold"; // Nhận lệnh đổi ngưỡng cảm biến

// --- KHỞI TẠO ĐỐI TƯỢNG ---
WiFiClientSecure espClient;
PubSubClient client(espClient);
WiFiManager wifiManager;

// --- BIẾN QUẢN LÝ ---
unsigned long lastMqttReconnectAttempt = 0;
const unsigned long mqttReconnectInterval = 5000; 

bool isTestingNewWifi = false;
unsigned long wifiTestStartTime = 0;
String backupSSID = "";
String backupPASS = "";

String uartBuffer = "";

unsigned long lastStatusTime = 0;
const unsigned long statusInterval = 60000; // 60s gửi heartbeat 1 lần

unsigned long lastWifiReportTime = 0;
int previousWifiState = -1;

// --- KHAI BÁO NGUYÊN MẪU HÀM ---
void setupWiFi();
void setupOTA();
void setupMQTT();
void reconnectMQTT();
void mqttCallback(char* topic, byte* payload, unsigned int length);
void handleUART();
void handleWiFiRollbackLogic();
void reportWifiStatusToSTM32();

/* =======================================
 * HÀM SETUP
 * ======================================= */
void setup() {
  Serial.begin(115200);   // Giao tiếp với STM32 (Baudrate phải khớp)
  delay(1000);
  
  Serial.println("\n--- Khoi dong ESP-01 Gateway ---");
  
  // Khởi tạo EEPROM cho OTA
  EEPROM.begin(512);
  EEPROM.get(0, otaCfg);
  if (strcmp(otaCfg.magic, "SCADA") != 0) {
    strcpy(otaCfg.magic, "SCADA");
    strcpy(otaCfg.hostname, "Gateway-ESP01");
    strcpy(otaCfg.password, "scada123");
    EEPROM.put(0, otaCfg);
    EEPROM.commit();
  }

  setupWiFi();            
  setupOTA();             
  setupMQTT();            
}

/* =======================================
 * VÒNG LẶP CHÍNH
 * ======================================= */
void loop() {
  ArduinoOTA.handle();
  handleWiFiRollbackLogic();
  reportWifiStatusToSTM32(); // Báo trạng thái mạng & SSID về cho LCD STM32

  if (WiFi.status() == WL_CONNECTED && !isTestingNewWifi) {
    if (!client.connected()) {
      reconnectMQTT();
    } else {
      client.loop();
      
      // Bắn trạng thái Heartbeat lên Web
      unsigned long currentMillis = millis();
      if (currentMillis - lastStatusTime >= statusInterval) {
        lastStatusTime = currentMillis;
        StaticJsonDocument<200> docStatus;
        docStatus["status"] = "online";
        docStatus["wifi_ssid"] = WiFi.SSID();
        docStatus["wifi_rssi"] = WiFi.RSSI();
        
        char statusBuffer[256];
        serializeJson(docStatus, statusBuffer);
        client.publish(topic_status, statusBuffer);
      }
    }
  }
  
  // Liên tục đọc UART từ STM32
  handleUART();
}

/* =======================================
 * CHI TIẾT CÁC HÀM XỬ LÝ
 * ======================================= */

// --- 1. SETUP WIFI ---
void setupWiFi() {
  const char* default_ap_name = "Gateway_Setup";
  const char* default_ap_pass = "12345678"; 
  
  if (!wifiManager.autoConnect(default_ap_name, default_ap_pass)) {
    delay(3000);
    ESP.restart(); 
  }
}

// --- 2. SETUP OTA ---
void setupOTA() {
  ArduinoOTA.setHostname(otaCfg.hostname);
  ArduinoOTA.setPassword(otaCfg.password);
  ArduinoOTA.begin();
}

// --- 3. SETUP MQTT ---
void setupMQTT() {
  espClient.setInsecure(); // Bỏ qua xác thực SSL để kết nối HiveMQ Cloud
  client.setServer(mqtt_server, mqtt_port);
  client.setCallback(mqttCallback);
}

// --- 4. RECONNECT MQTT ---
void reconnectMQTT() {
  unsigned long now = millis();
  if (now - lastMqttReconnectAttempt > mqttReconnectInterval) {
    lastMqttReconnectAttempt = now;
    
    String clientId = "Gateway-ESP01-" + String(ESP.getChipId(), HEX);
    
    if (client.connect(clientId.c_str(), mqtt_user, mqtt_pass)) {
      client.subscribe(topic_command);
      client.subscribe(topic_config_threshold); // Nghe lệnh đổi ngưỡng cảm biến
      lastMqttReconnectAttempt = 0; 
    } 
  }
}

// --- 5. NHẬN LỆNH TỪ MQTT (WEB -> ESP -> STM32) ---
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  String msg = "";
  for (unsigned int i = 0; i < length; i++) {
    msg += (char)payload[i];
  }

  // NẾU NHẬN LỆNH ĐỔI NGƯỠNG CẢNH BÁO -> ĐẨY XUỐNG STM32
  if (strcmp(topic, topic_config_threshold) == 0) {
    // Bọc dữ liệu vào chuẩn <CFG:...> để STM32 dễ phân tích
    Serial.print("<CFG:"); 
    Serial.print(msg); 
    Serial.println(">");
    return; // Đẩy xong thì thoát
  }

  // NẾU NHẬN LỆNH QUẢN LÝ THIẾT BỊ
  StaticJsonDocument<256> doc;
  DeserializationError error = deserializeJson(doc, msg);
  if (error) return;

  String cmd = doc["cmd"] | "";

  if (cmd == "reset_wifi") {
    wifiManager.resetSettings();
    delay(1000);
    ESP.restart();
  }
  else if (cmd == "change_wifi") {
    String ssid = doc["ssid"] | "";
    String pass = doc["pass"] | "";
    if (ssid != "") {
      backupSSID = WiFi.SSID();
      backupPASS = WiFi.psk();
      isTestingNewWifi = true;
      wifiTestStartTime = millis();
      WiFi.disconnect();
      WiFi.persistent(true); 
      WiFi.begin(ssid.c_str(), pass.c_str());
    }
  }
  else if (cmd == "change_ota") {
    String hName = doc["hostname"] | "";
    String pWord = doc["password"] | "";
    if (hName != "") {
      strcpy(otaCfg.hostname, hName.c_str());
      strcpy(otaCfg.password, pWord.c_str());
      EEPROM.put(0, otaCfg);
      EEPROM.commit();
      delay(1000);
      ESP.restart();
    }
  }
}

// --- 6. LOGIC ROLLBACK WIFI KHI NHẬP SAI MẬT KHẨU ---
void handleWiFiRollbackLogic() {
  if (isTestingNewWifi) {
    if (WiFi.status() == WL_CONNECTED) {
      isTestingNewWifi = false; 
    } 
    else if (millis() - wifiTestStartTime > 15000) {
      WiFi.disconnect();
      WiFi.persistent(true); 
      WiFi.begin(backupSSID.c_str(), backupPASS.c_str());
      isTestingNewWifi = false;
    }
  }
}

// --- 7. ĐỌC SERIAL TỪ STM32 (STM32 -> ESP -> WEB) ---
void handleUART() {
  while (Serial.available() > 0) {
    char c = Serial.read();
    
    if (c == '\n' || c == '\r') {
      if (uartBuffer.length() > 0) {
        
        // 1. STM32 yêu cầu Reset WiFi từ Menu LCD
        if (uartBuffer == "RESET_WIFI") {
           wifiManager.resetSettings();
           delay(500);
           ESP.restart();
        } 
        // 2. STM32 gửi dữ liệu cảm biến (JSON)
        else if (client.connected()) {
           client.publish(topic_telemetry, uartBuffer.c_str());
        }
        
        uartBuffer = ""; // Xóa bộ đệm sau khi xử lý xong
      }
    } else {
      uartBuffer += c; 
    }
  }
}

// --- 8. BÁO CÁO TRẠNG THÁI WIFI & SSID CHO LCD STM32 ---
void reportWifiStatusToSTM32() {
  if (millis() - lastWifiReportTime > 3000) {
    lastWifiReportTime = millis();
    
    int currentState = (WiFi.status() == WL_CONNECTED) ? 1 : 0;
    
    // Nếu đang phát Access Point (Setup Mode)
    if (WiFi.getMode() == WIFI_AP || WiFi.getMode() == WIFI_AP_STA) {
      if (WiFi.softAPgetStationNum() == 0) currentState = 2; 
    }

    // Gửi liên tục mỗi 3s định dạng: <WIFI:TrạngThái,TênWiFi,RSSI>
    Serial.print("<WIFI:");
    Serial.print(currentState);
    Serial.print(","); 
       
    if (currentState == 1) {
       Serial.print(WiFi.SSID());
       Serial.print(",");
       Serial.print(WiFi.RSSI()); // Gửi thêm thông số cường độ sóng
    }
    else if (currentState == 2) {
       Serial.print("Gateway_Setup");
       Serial.print(",0");
    }
    else {
       Serial.print("None");
       Serial.print(",0");
    }
       
    Serial.println(">"); 
    previousWifiState = currentState;
  }
}