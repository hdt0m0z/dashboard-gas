export const DevicesPage = `
<div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
        <h2 style="margin: 0; color: #E0E0E0;">QUẢN LÝ THIẾT BỊ (EDGE GATEWAY)</h2>
    </div>
    <div class="toolbar-actions">
        <input type="text" class="search-box" placeholder="🔍 Tìm kiếm Gateway, SSID...">
        <button class="btn-add" onclick="document.getElementById('addGatewayModal').style.display='flex'">➕ Thêm Gateway Mới</button>
    </div>
</div>

<div class="gateway-grid" id="devicesGrid">
    <!-- Rendered via JS -->
</div>

<!-- Modal Thêm Gateway Mới -->
<div id="addGatewayModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>➕ Thêm Gateway Mới</h3>
            <button class="btn-close" onclick="document.getElementById('addGatewayModal').style.display='none'">✖</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>ID Gateway (Mã thiết bị)</label>
                <input type="text" id="newGwId" placeholder="Nhập ID, vd: GW001" class="modal-input">
            </div>
            <div class="form-group">
                <label>Mật khẩu Gateway</label>
                <input type="password" id="newGwPassword" placeholder="Nhập mật khẩu" class="modal-input">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-cancel" onclick="document.getElementById('addGatewayModal').style.display='none'">Hủy</button>
            <button class="btn-submit" onclick="submitAddGateway()">Xác nhận</button>
        </div>
    </div>
</div>
`;

export const SettingsPage = `
    <div class="header" style="border-bottom:none; margin-bottom: 0;">
        <h2 style="color: #E0E0E0;">CÀI ĐẶT TÀI KHOẢN</h2>
    </div>
    <div class="stations-container" style="display:flex; gap:20px; flex-wrap:wrap; margin-top:20px;">
        <div class="station-card" style="flex:1; min-width:300px; display:block;">
            <h3 style="color:#4fc3f7; border-bottom:1px solid var(--border-color); padding-bottom:10px;">THÔNG TIN CÁ NHÂN</h3>
            <form id="profileForm" style="margin-top:20px;">
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Địa chỉ Email</label>
                    <input type="email" id="profileEmail" disabled style="width:100%; padding:10px; background:#111; color:#888; border:1px solid #333; border-radius:4px; box-sizing:border-box; cursor: not-allowed;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Họ và Tên (*)</label>
                    <input type="text" id="profileName" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Số điện thoại</label>
                    <input type="tel" id="profilePhone" style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Bộ phận quản lý</label>
                    <select id="profileDept" style="width: 100%; padding: 10px; background: #2a2a2a; border: 1px solid #555; color: white; border-radius: 4px; box-sizing: border-box;">
                        <option value="">Chưa có dữ liệu</option>
                        <option value="Phòng Môi trường">Phòng Môi trường</option>
                        <option value="Xưởng Vận hành">Xưởng Vận hành</option>
                        <option value="Ban Giám đốc">Ban Giám đốc</option>
                    </select>
                </div>
                <button type="submit" class="btn-primary" id="btnUpdateProfile" style="margin-top: 10px;">CẬP NHẬT THÔNG TIN</button>
            </form>
        </div>

        <div class="station-card" style="flex:1; min-width:300px; display:block;">
            <h3 style="color:#FFC107; border-bottom:1px solid var(--border-color); padding-bottom:10px;">ĐỔI MẬT KHẨU</h3>
            <form id="passwordForm" style="margin-top:20px;">
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Mật khẩu hiện tại</label>
                    <input type="password" id="oldPassword" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Mật khẩu mới</label>
                    <input type="password" id="newPassword" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Xác nhận mật khẩu mới</label>
                    <input type="password" id="confirmPassword" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <button type="submit" class="btn-primary" id="btnUpdatePassword" style="background:#FFC107; color:#000; margin-top: 10px;">ĐỔI MẬT KHẨU</button>
            </form>
        </div>
    </div>
`;

export const NetworkPage = `
    <div class="header" style="border-bottom:none; margin-bottom: 0;">
        <h2 style="color: #E0E0E0;">CẤU HÌNH MẠNG WI-FI TỪ XA</h2>
    </div>
    
    <div class="station-card" style="max-width: 600px; margin: 20px auto; display: block;">
        <h3 style="color:#4fc3f7; border-bottom:1px solid #333; padding-bottom:10px;">THÔNG TIN WI-FI MỚI</h3>
        
        <form id="networkForm" style="margin-top:20px;">
            <div style="margin-bottom:15px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Chọn Thiết Bị Gateway (*)</label>
                <select id="netDeviceId" required style="width:100%; padding:12px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px;">
                    <option value="">Đang tải thiết bị...</option>
                </select>
            </div>

            <div style="margin-bottom:15px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Tên Wi-Fi (SSID) mới (*)</label>
                <input type="text" id="netSSID" required placeholder="Nhập tên mạng" style="width:100%; padding:12px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
            </div>

            <div style="position: relative; margin-bottom:20px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Mật khẩu Wi-Fi mới</label>
                <input type="password" id="netPass" placeholder="Nhập mật khẩu (Nút mắt nhấp nháy)" style="width:100%; padding:12px; padding-right: 40px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                <span id="eyeNetPass" style="position: absolute; right: 10px; top: 38px; cursor: pointer; user-select: none;">👁️</span>
            </div>

            <button type="submit" id="btnSubmitNetwork" class="btn-primary" style="background:#FF9800; color:#000;">GỬI CẤU HÌNH XUỐNG THIẾT BỊ</button>
        </form>
    </div>

    <!-- CẤU HÌNH OTA -->
    <div class="station-card" style="max-width: 600px; margin: 20px auto; display: block;">
        <h3 style="color:#FFC107; border-bottom:1px solid #333; padding-bottom:10px;">CẤU HÌNH CẬP NHẬT TỪ XA (OTA)</h3>
        
        <form id="otaForm" style="margin-top:20px;">
            <div style="margin-bottom:15px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Chọn Thiết Bị OTA (*)</label>
                <select id="otaDeviceId" required style="width:100%; padding:12px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px;">
                    <option value="">Đang tải thiết bị...</option>
                </select>
            </div>

            <div style="margin-bottom:15px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">OTA Hostname Mới (*)</label>
                <input type="text" id="otaHostname" required value="Gateway-ESP01" style="width:100%; padding:12px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
            </div>

            <div style="position: relative; margin-bottom:20px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Mật khẩu OTA (*)</label>
                <input type="password" id="otaPass" required placeholder="Nhập pass OTA" style="width:100%; padding:12px; padding-right: 40px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                <span id="eyeOtaPass" style="position: absolute; right: 10px; top: 38px; cursor: pointer; user-select: none;">👁️</span>
            </div>

            <button type="submit" id="btnSubmitOta" class="btn-primary" style="background:#FFC107; color:#000;">GỬI LỆNH ĐỔI OTA XUỐNG THIẾT BỊ</button>
        </form>
    </div>

    <!-- Dialog Confirmation -->
    <div id="confirmModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center;">
        <div style="background:#1e1e1e; border:1px solid #444; border-radius:8px; padding:25px; width:400px; text-align:center;">
            <h3 style="color:#F44336; margin-top:0;">⚠️ XÁC NHẬN ĐỔI MẠNG</h3>
            <p style="color:#ccc; font-size:15px; margin: 15px 0 25px 0;">
                Bạn có chắc chắn muốn đổi mạng cho thiết bị này? Nếu nhập sai mật khẩu, thiết bị sẽ tự động khôi phục mạng cũ sau 15 giây.
            </p>
            <div style="display:flex; justify-content:space-between; gap:15px;">
                <button type="button" id="btnCancelModal" style="flex:1; padding:10px; background:#555; color:white; border:none; border-radius:4px; cursor:pointer;">Hủy Bỏ</button>
                <button type="button" id="btnConfirmModal" style="flex:1; padding:10px; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer;">Tôi Chắc Chắn</button>
            </div>
        </div>
    </div>
`;

export const RegisterPage = `
  <div class="login-screen">
    <div class="login-container" style="width: 450px;">
        <h2>ĐĂNG KÝ TÀI KHOẢN</h2>
        <form class="login-form" id="registerForm">
            <input type="text" id="regName" placeholder="Họ và tên (*)" required />
            <input type="email" id="regEmail" placeholder="Email (*)" required />
            <input type="tel" id="regPhone" placeholder="Số điện thoại" />
            <select id="regDept" required style="width: 100%; padding: 12px; margin-bottom: 15px; background: #2a2a2a; border: 1px solid #444; color: white; border-radius: 4px;">
                <option value="">Chọn bộ phận (*)</option>
                <option value="Phòng Môi trường">Phòng Môi trường</option>
                <option value="Xưởng Vận hành">Xưởng Vận hành</option>
                <option value="Ban Giám đốc">Ban Giám đốc</option>
            </select>

            <div style="position: relative;">
              <input type="password" id="regPassword" placeholder="Mật khẩu (*)" required style="padding-right: 40px;" />
              <span id="eyePassword" style="position: absolute; right: 10px; top: 12px; cursor: pointer; user-select: none;">👁️</span>
            </div>
            
            <!-- Real-time Password Rules UX -->
            <ul style="list-style: none; padding: 0; text-align: left; font-size: 13px; color: gray; margin-top: -5px; margin-bottom: 10px;" id="pwdPolicy">
                <li id="ruleLength">○ Tối thiểu 8 ký tự</li>
                <li id="ruleUpper">○ Ít nhất 1 chữ hoa (A-Z)</li>
                <li id="ruleLower">○ Ít nhất 1 chữ thường (a-z)</li>
                <li id="ruleNumber">○ Ít nhất 1 chữ số (0-9)</li>
                <li id="ruleSpecial">○ Khuyên dùng 1 ký tự đặc biệt</li>
            </ul>

            <div style="position: relative;">
               <input type="password" id="regConfirm" placeholder="Xác nhận mật khẩu (*)" required style="padding-right: 40px;" />
               <span id="eyeConfirm" style="position: absolute; right: 10px; top: 12px; cursor: pointer; user-select: none;">👁️</span>
            </div>
            <div id="matchError" style="color: var(--color-danger); font-size: 13px; display: none; text-align: left; margin-top: -10px; margin-bottom: 10px;">❌ Mật khẩu xác nhận không khớp</div>

            <button type="submit" id="btnRegisterSubmit" class="btn-primary" disabled style="background:#555; cursor:not-allowed;">ĐĂNG KÝ</button>
        </form>
        <div class="divider">HOẶC</div>
        <a href="/api/auth/google"><button class="btn-google">ĐĂNG KÝ NHANH BẰNG GOOGLE</button></a>
        
        <div style="margin-top:20px;">
           <span style="color:#aaa;">Đã có tài khoản?</span> 
           <a href="#/" style="color:#4fc3f7; text-decoration:none; font-weight: bold;">Đăng nhập tại đây</a>
        </div>
    </div>
  </div>
`;

export const LoginPage = `
  <div class="login-screen">
    <div class="login-container">
        <h2>Exhaust Gas Monitoring Station</h2>
        <form class="login-form" id="loginForm">
            <input type="email" id="email" placeholder="Email" required />
            <input type="password" id="password" placeholder="Mật khẩu" required />
            <button type="submit" class="btn-primary">ĐĂNG NHẬP</button>
        </form>
        <div class="divider">HOẶC</div>
        <a href="/api/auth/google"><button id="btn-google" class="btn-google">ĐĂNG NHẬP VỚI GOOGLE</button></a>
        
        <div style="margin-top:20px;">
           <span style="color:#aaa;">Chưa có tài khoản?</span> 
           <a href="#/register" style="color:#4fc3f7; text-decoration:none; font-weight: bold;">Đăng ký tại đây</a>
        </div>
    </div>
  </div>
`;

export const SidebarLayout = `
  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">Exhaust Gas Monitoring Station</div>
      <nav class="sidebar-nav">
        <a class="nav-item" data-route="/dashboard">📊 Dashboard</a>
        <a class="nav-item" data-route="/devices">⚙️ Quản lý thiết bị</a>
        <a class="nav-item" data-route="/share">🔗 Chia sẻ thiết bị</a>
        <a class="nav-item" data-route="/report">📈 Báo cáo & Thống kê</a>
        <a class="nav-item" data-route="/network">📡 Cấu hình mạng</a>
        <a class="nav-item" data-route="/settings">👤 Cài đặt tài khoản</a>
      </nav>
      <div class="sidebar-footer">
        <button id="btn-logout" class="btn-logout">🚪 Đăng xuất</button>
      </div>
    </aside>
    <main class="content-area" id="content-area">
        <!-- Route Content goes here -->
    </main>
  </div>
`;

export const DashboardPage = `
<div class="dashboard-page">
    <div class="panel">
        <div class="panel-header">
            <div class="header-title">
                <span class="main-title">TRẠM QUAN TRẮC 1 (ZONE A)</span>
                <span class="sub-title">Cập nhật lúc: <span id="time-1" style="color: var(--text-main);">--:--:-- --/--</span></span>
            </div>
            <span style="font-size: 0.7rem; color: var(--safe-glow);" id="status-1">● CONNECTED</span>
        </div>
        <div class="station-content">
            <div class="chimney-graphic" id="chimney-1">
                <div class="smoke-simulation" id="smoke-1">☁️</div>
                <div class="chimney-pipe" id="pipe-1"></div>
                <div class="chimney-base" id="base-1"></div>
            </div>
            <div class="data-grid">
                <div class="data-cell" id="cell-so2-1"><span class="label">Nồng độ SO2</span><div><span class="value" id="val-so2-1">0.0</span> <span class="unit">ppm</span></div></div>
                <div class="data-cell" id="cell-pm25-1"><span class="label">Bụi mịn PM2.5</span><div><span class="value" id="val-pm25-1">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm10-1"><span class="label">Bụi PM10</span><div><span class="value" id="val-pm10-1">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm1-1"><span class="label">Bụi PM1.0</span><div><span class="value" id="val-pm1-1">0.0</span> <span class="unit">µg/m³</span></div></div>
            </div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <div class="header-title">
                <span class="main-title">TRẠM QUAN TRẮC 2 (ZONE B)</span>
                <span class="sub-title">Cập nhật lúc: <span id="time-2" style="color: var(--text-main);">--:--:-- --/--</span></span>
            </div>
            <span style="font-size: 0.7rem; color: var(--safe-glow);" id="status-2">● CONNECTED</span>
        </div>
        <div class="station-content">
            <div class="chimney-graphic" id="chimney-2">
                <div class="chimney-pipe" id="pipe-2"></div>
                <div class="chimney-base" id="base-2"></div>
                <div class="smoke-simulation" id="smoke-2">☁️</div>
            </div>
            <div class="data-grid">
                <div class="data-cell" id="cell-so2-2"><span class="label">Nồng độ SO2</span><div><span class="value" id="val-so2-2">0.0</span> <span class="unit">ppm</span></div></div>
                <div class="data-cell" id="cell-pm25-2"><span class="label">Bụi mịn PM2.5</span><div><span class="value" id="val-pm25-2">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm10-2"><span class="label">Bụi PM10</span><div><span class="value" id="val-pm10-2">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm1-2"><span class="label">Bụi PM1.0</span><div><span class="value" id="val-pm1-2">0.0</span> <span class="unit">µg/m³</span></div></div>
            </div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <span style="color: #60a5fa;">🌐 THÔNG TIN & CẤU HÌNH GATEWAY</span>
            <span style="font-size: 0.7rem; color: var(--text-dim);">ESP-01 / STM32</span>
        </div>
        <div class="gw-grid">
            <div class="gw-card alert-card"><span class="label">Ngưỡng cảnh báo SO2</span><span class="value" id="gw-limit-so2">100.0 ppm</span></div>
            <div class="gw-card alert-card"><span class="label">Ngưỡng cảnh báo Bụi (PM)</span><span class="value" id="gw-limit-pm">250 µg/m³</span></div>
            <div class="gw-card"><span class="label">Mạng kết nối (SSID)</span><span class="value" id="gw-ssid">SCADA_Factory_5G</span></div>
            <div class="gw-card"><span class="label">Cường độ WiFi (RSSI)</span><span class="value" id="gw-rssi">-65 dBm</span></div>
            <div class="gw-card"><span class="label">Máy chủ MQTT</span><span class="value" style="font-size: 0.95rem;">HiveMQ Cloud (TLS)</span></div>
            <div class="gw-card"><span class="label">Cổng giao tiếp (Port)</span><span class="value">8883</span></div>
            <div class="gw-card"><span class="label">Chu kỳ Heartbeat</span><span class="value">60 giây</span></div>
            <div class="gw-card"><span class="label">Tên thiết bị (OTA)</span><span class="value">Gateway-ESP01</span></div>
        </div>
    </div>

    <div class="panel trend-panel">
        <div class="panel-header">
            <div style="display:flex; gap:15px; align-items:center;">
                <span>📈 BIỂU ĐỒ XU HƯỚNG THỜI GIAN THỰC</span>
                <select class="custom-select" id="zone-filter" onchange="applyZoneFilter(this.value)">
                    <option value="all">Hiển thị: Cả 2 Zone</option>
                    <option value="z1">Chỉ hiển thị Zone A</option>
                    <option value="z2">Chỉ hiển thị Zone B</option>
                </select>
            </div>
            <div style="display:flex; gap:15px; font-size:0.8rem; font-family:var(--font-data);">
                <span style="color: #22d3ee;">■ Zone A</span>
                <span style="color: #fbbf24;">■ Zone B</span>
            </div>
        </div>
        <div class="charts-grid">
            <div class="chart-box">
                <div class="chart-top-bar"><span class="chart-title">SO2 (ppm)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-so2', 300, this)">15M</button><button class="time-btn" onclick="setTimeRange('chart-so2', 100, this)">5M</button><button class="time-btn" onclick="setTimeRange('chart-so2', 20, this)">1M</button><button class="time-btn active" onclick="setTimeRange('chart-so2', 10, this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-so2"></canvas></div>
            </div>
            <div class="chart-box">
                <div class="chart-top-bar"><span class="chart-title">PM10 (µg/m³)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-pm10', 300, this)">15M</button><button class="time-btn" onclick="setTimeRange('chart-pm10', 100, this)">5M</button><button class="time-btn" onclick="setTimeRange('chart-pm10', 20, this)">1M</button><button class="time-btn active" onclick="setTimeRange('chart-pm10', 10, this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-pm10"></canvas></div>
            </div>
            <div class="chart-box">
                <div class="chart-top-bar"><span class="chart-title">PM2.5 (µg/m³)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-pm25', 300, this)">15M</button><button class="time-btn" onclick="setTimeRange('chart-pm25', 100, this)">5M</button><button class="time-btn" onclick="setTimeRange('chart-pm25', 20, this)">1M</button><button class="time-btn active" onclick="setTimeRange('chart-pm25', 10, this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-pm25"></canvas></div>
            </div>
            <div class="chart-box">
                <div class="chart-top-bar"><span class="chart-title">PM1.0 (µg/m³)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-pm1', 300, this)">15M</button><button class="time-btn" onclick="setTimeRange('chart-pm1', 100, this)">5M</button><button class="time-btn" onclick="setTimeRange('chart-pm1', 20, this)">1M</button><button class="time-btn active" onclick="setTimeRange('chart-pm1', 10, this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-pm1"></canvas></div>
            </div>
        </div>
    </div>

    <div class="panel bottom-log">
        <div class="panel-header">
            <span style="color: #fcd34d;">⚠️ NHẬT KÝ SỰ KIỆN</span>
            <select class="custom-select" id="alert-filter" onchange="applyAlertFilter()" style="max-width: 130px;">
                <option value="all">Tất cả</option>
                <option value="threshold">Vượt ngưỡng</option>
                <option value="connection">Kết nối</option>
            </select>
        </div>
        <div class="alert-table-container">
            <table>
                <thead><tr><th>Thời gian</th><th>Nguồn</th><th>Chi tiết</th></tr></thead>
                <tbody id="alert-tbody">
                    <tr data-type="threshold"><td style="font-family: var(--font-data);">08:15:20</td><td>Zone A</td><td class="level-high">SO2 vượt ngưỡng</td></tr>
                    <tr data-type="connection"><td style="font-family: var(--font-data);">07:30:00</td><td>Hệ thống</td><td class="level-low">Khôi phục WebSocket</td></tr>
                </tbody>
            </table>
        </div>
    </div>

    <div class="panel bottom-flow">
        <div class="panel-header">
            <span>📊 THỐNG KÊ LƯU LƯỢNG</span>
            <div style="display:flex; gap:5px;">
                <select class="custom-select" id="stat-time-filter" onchange="updateStatsChart()">
                    <option value="day">Ngày</option>
                    <option value="week" selected>Tuần</option>
                    <option value="month">Tháng</option>
                    <option value="year">Năm</option>
                </select>
                <select class="custom-select" id="stat-type-filter" onchange="updateStatsChart()">
                    <option value="avg">Avg</option>
                    <option value="max">Max</option>
                    <option value="min">Min</option>
                </select>
            </div>
        </div>
        <div class="violation-stats">
            <span class="v-label">Cảnh báo vượt:</span>
            <span>SO2: <span class="v-so2" id="v-count-so2">0</span></span>
            <span>BỤI: <span class="v-pm" id="v-count-pm">0</span></span>
        </div>
        <div class="chart-wrapper" style="padding: 10px;">
            <canvas id="statsChart"></canvas>
        </div>
    </div>

    <div class="panel bottom-conn">
        <div class="panel-header">
            <span>📡 THỐNG KÊ ĐỘ ỔN ĐỊNH</span>
            <select class="custom-select" id="uptime-time-filter" onchange="updateUptimeChart()">
                <option value="live" selected>Hôm nay (Live)</option>
                <option value="week">Trong tuần</option>
                <option value="month">Trong tháng</option>
                <option value="year">Trong năm</option>
            </select>
        </div>
        <div style="display:flex; flex-direction:column; height: 100%; padding: 15px;">
            <div class="chart-wrapper" style="flex-grow: 1; position: relative;">
                <canvas id="uptimeChart"></canvas>
            </div>
            <div class="violation-stats" style="border:none; margin-top: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; padding: 10px; gap: 0;">
                <div style="text-align:center; flex: 1;">
                    <div style="color:var(--text-dim); font-size:0.7rem;">Gateway</div>
                    <div id="up-gw-pct" style="color:var(--safe-glow); font-size:1rem; font-weight:bold; font-family:var(--font-data);">100%</div>
                    <div style="color:var(--danger-glow); font-size:0.75rem;"><span id="drop-gw">0</span> sự cố</div>
                </div>
                <div style="text-align:center; flex: 1; border-left: 1px solid var(--glass-border); border-right: 1px solid var(--glass-border);">
                    <div style="color:var(--text-dim); font-size:0.7rem;">Zone A (N1)</div>
                    <div id="up-n1-pct" style="color:var(--safe-glow); font-size:1rem; font-weight:bold; font-family:var(--font-data);">100%</div>
                    <div style="color:var(--danger-glow); font-size:0.75rem;"><span id="drop-n1">0</span> sự cố</div>
                </div>
                <div style="text-align:center; flex: 1;">
                    <div style="color:var(--text-dim); font-size:0.7rem;">Zone B (N2)</div>
                    <div id="up-n2-pct" style="color:var(--safe-glow); font-size:1rem; font-weight:bold; font-family:var(--font-data);">100%</div>
                    <div style="color:var(--danger-glow); font-size:0.75rem;"><span id="drop-n2">0</span> sự cố</div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
export const AccessControlPage=`
   <h2>QUẢN LÝ QUYỀN TRUY CẬP (ACCESS CONTROL)</h2>
<main>
    <div class="panel">
        <div class="panel-header">
            <span>✉️ THÊM NGƯỜI DÙNG MỚI</span>
        </div>
        <div class="share-form">
            <div class="form-group">
                <label class="group-title">1. Thông tin người nhận</label>
                <input type="email" id="invite-email" class="input-email" placeholder="Nhập địa chỉ Email (VD: kythuat@factory.com)...">
            </div>

            <div class="form-group">
                <label class="group-title">2. Quyền xem dữ liệu trạm (View Access)</label>
                
                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">Zone A (Node 1)</span>
                        <span class="perm-desc">Cho phép xem số liệu SO2, Bụi của ống khói 1</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-z1" checked><span class="slider"></span></label>
                </div>
                
                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">Zone B (Node 2)</span>
                        <span class="perm-desc">Cho phép xem số liệu SO2, Bụi của ống khói 2</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-z2" checked><span class="slider"></span></label>
                </div>
            </div>

            <div class="form-group">
                <label class="group-title">3. Quyền quản trị hệ thống (Admin Access)</label>
                
                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">Chỉnh sửa Ngưỡng cảnh báo</span>
                        <span class="perm-desc">Cho phép thay đổi giới hạn SO2 và Bụi (Publish MQTT)</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-thresh"><span class="slider"></span></label>
                </div>

                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">Xem thông tin Gateway</span>
                        <span class="perm-desc">Xem IP, RSSI, MQTT Status, Uptime của thiết bị tổng</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-gwinfo"><span class="slider"></span></label>
                </div>

                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title" style="color: #fca5a5;">Cấu hình WiFi</span>
                        <span class="perm-desc">Quyền gửi lệnh Reset cấu hình mạng ESP-01</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-wifi"><span class="slider"></span></label>
                </div>
            </div>

            <button class="btn-submit" onclick="sendInvite()">Gửi lời mời & Cấp quyền</button>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <span>👥 DANH SÁCH TÀI KHOẢN ĐÃ ĐƯỢC CHIA SẺ</span>
            <span style="font-weight:normal; font-size:0.8rem; color:var(--text-dim);" id="user-count">Tổng: 2 người</span>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Tài khoản Email</th>
                        <th>Khu vực giám sát (Nodes)</th>
                        <th>Quyền quản trị mở rộng</th>
                        <th style="text-align: right;">Hành động</th>
                    </tr>
                </thead>
                <tbody id="shared-list">
                    <tr>
                        <td style="font-weight:bold;">nguyen.van.a@factory.com</td>
                        <td>
                            <span class="badge badge-node">Zone A</span>
                            <span class="badge badge-node">Zone B</span>
                        </td>
                        <td>
                            <span class="badge badge-admin">Sửa Ngưỡng</span>
                            <span class="badge badge-admin">Xem GW Info</span>
                        </td>
                        <td style="text-align: right;">
                            <button class="btn-revoke" onclick="revokeAccess(this)">Thu hồi</button>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">giam.sat.kho@factory.com</td>
                        <td>
                            <span class="badge badge-node">Zone B</span>
                        </td>
                        <td>
                            <span class="badge badge-none">Chỉ xem</span>
                        </td>
                        <td style="text-align: right;">
                            <button class="btn-revoke" onclick="revokeAccess(this)">Thu hồi</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
`;
export const ReportPage=`
<div class="toolbar">
    <h2>
        PHÂN TÍCH DỮ LIỆU
        <select id="nodeFilter" class="custom-select" onchange="applyFilter()" disabled>
            <option value="all">Hiển thị: Tất cả Trạm</option>
            <option value="1">Chỉ hiện Zone A (N1)</option>
            <option value="2">Chỉ hiện Zone B (N2)</option>
        </select>
    </h2>
    <div class="toolbar-actions">
        <label for="logFileInput" class="btn btn-primary">
            📂 Nhập file Log (.txt)
        </label>
        <input type="file" id="logFileInput" accept=".txt" onchange="handleFileUpload(event)">
        
        <button id="exportBtn" class="btn btn-success" onclick="exportToCSV()" disabled style="opacity: 0.5; cursor: not-allowed;">
            📥 Xuất CSV (Bản đang xem)
        </button>
    </div>
</div>

<main>
    <div class="panel">
        <div class="panel-header">
            <span>📋 BÁO CÁO THỐNG KÊ TỔNG QUAN (SUMMARY)</span>
            <span id="file-status" style="color: var(--text-dim); font-size: 0.8rem; font-weight: normal;">Chưa có dữ liệu</span>
        </div>
        
        <div class="advanced-stats">
            <div class="stat-card">
                <div class="stat-card-title">📦 Thông tin Dữ liệu</div>
                <div class="stat-row"><span>Tổng số bản ghi:</span> <span class="stat-val" id="stat-total">0</span></div>
                <div class="stat-row"><span>Bản ghi Zone A:</span> <span class="stat-val" id="stat-z1">0</span></div>
                <div class="stat-row"><span>Bản ghi Zone B:</span> <span class="stat-val" id="stat-z2">0</span></div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-title" style="color: #22d3ee;">☁️ Nồng độ SO2 (ppm)</div>
                <div class="stat-row"><span>Trung bình (Avg):</span> <span class="stat-val" id="so2-avg">0.0</span></div>
                <div class="stat-row"><span>Thấp nhất (Min):</span> <span class="stat-val" id="so2-min">0.0</span></div>
                <div class="stat-row"><span>Cao nhất (Max):</span> <span class="stat-val" id="so2-max">0.0</span></div>
                <div class="stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                    <span>Vượt ngưỡng (>100):</span> <span class="stat-val stat-violation" id="so2-viol">0 lần</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-card-title" style="color: #fbbf24;">🌫️ Bụi mịn PM2.5 (µg/m³)</div>
                <div class="stat-row"><span>Trung bình (Avg):</span> <span class="stat-val" id="pm25-avg">0.0</span></div>
                <div class="stat-row"><span>Thấp nhất (Min):</span> <span class="stat-val" id="pm25-min">0.0</span></div>
                <div class="stat-row"><span>Cao nhất (Max):</span> <span class="stat-val" id="pm25-max">0.0</span></div>
                <div class="stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                    <span>Vượt ngưỡng (>250):</span> <span class="stat-val stat-violation" id="pm25-viol">0 lần</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-card-title" style="color: #10b981;">💨 Bụi PM10 (µg/m³)</div>
                <div class="stat-row"><span>Trung bình (Avg):</span> <span class="stat-val" id="pm10-avg">0.0</span></div>
                <div class="stat-row"><span>Thấp nhất (Min):</span> <span class="stat-val" id="pm10-min">0.0</span></div>
                <div class="stat-row"><span>Cao nhất (Max):</span> <span class="stat-val" id="pm10-max">0.0</span></div>
            </div>
        </div>

        <div class="charts-row">
            <div class="chart-box">
                <canvas id="chartSO2"></canvas>
            </div>
            <div class="chart-box">
                <canvas id="chartPM"></canvas>
            </div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <span>🗄️ DỮ LIỆU CẢM BIẾN CHI TIẾT (RAW DATA)</span>
        </div>
        <div class="table-container">
            <table id="dataTable">
                <thead>
                    <tr>
                        <th>STT</th>
                        <th>Thời gian</th>
                        <th>Trạm (Zone)</th>
                        <th>SO2 (ppm)</th>
                        <th>PM1.0 (µg/m³)</th>
                        <th>PM2.5 (µg/m³)</th>
                        <th>PM10 (µg/m³)</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <tr>
                        <td colspan="7" style="text-align:center; padding: 40px; color: var(--text-dim);">
                            Chưa có dữ liệu. Vui lòng nhấn "Nhập file Log" để bắt đầu phân tích.
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
</main>
`;
export const BlankPage = (title, description) => `
    <div class="blank-page">
        <h2>${title}</h2>
        <p>${description}</p>
        <p style="margin-top: 20px; color:#555">Tính năng này đang trong quá trình phát triển UI. Chú trọng module Dashboard (Socket) trước.</p>
    </div>
`;
