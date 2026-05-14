export const DevicesPage = `
    <div class="header" style="border-bottom:none; margin-bottom: 0;">
        <h2 style="color: #E0E0E0;">QUẢN LÝ THIẾT BỊ (GATEWAY)</h2>
        <button id="btnAddDevice" class="btn-primary" style="padding: 8px 15px; font-size: 13px; float: right; margin-top: -35px; min-width: 140px; background: #4CAF50;">+ THÊM GATEWAY</button>
    </div>
    
    <div id="devicesGrid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap: 20px; padding-top: 20px;">
        <!-- Card Injection Here -->
        <div style="color:gray;">Đang kết nối Server...</div>
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
        <h2>SCADA LÂM THAO</h2>
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
      <div class="sidebar-header">SCADA O&M</div>
      <nav class="sidebar-nav">
        <a class="nav-item" data-route="/dashboard">📊 Tổng quan (Dashboard)</a>
        <a class="nav-item" data-route="/devices">⚙️ Quản lý thiết bị</a>
        <a class="nav-item" data-route="/share">🔗 Chia sẻ thiết bị</a>
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
    <div class="header">
        <h1>HỆ THỐNG SCADA QUAN TRẮC KHÍ THẢI NHÀ MÁY LÂM THAO</h1>
        <div class="global-status">
            <span class="led-indicator led-online" id="gw-server-led"></span>
            <span id="gw-server-text" style="color: var(--color-safe);">WebSocket Server: ĐÃ KẾT NỐI</span>
        </div>
    </div>

    <div class="stations-container">
        <div class="station-card" id="card-node-1">
            <div class="chimney-graphic" id="chimney-1">
                <div style="color: gray; font-size: 20px; animation: slideUp 2s infinite;" id="smoke-1">☁️</div>
                <div class="chimney-pipe" id="pipe-1"></div>
                <div class="chimney-base" id="base-1"></div>
            </div>
            <div class="data-panel">
                <h2>TRẠM ỐNG KHÓI REAL-TIME</h2>
                <div class="node-status">
                    <span class="led-indicator led-online" id="node-gw-led-1"></span>
                    <span id="node-gw-text-1">Dữ liệu từ HiveMQ (MQTT) ➔ API ➔ Web Client</span>
                </div>

                <div class="param" id="param-so2-1">SO2: 0.00 ppm</div>
                <div class="param" id="param-pm25-1">PM2.5: 0.00 µg/m³</div>
                <div class="param" id="param-timestamp">Cập nhật: ---</div>
                
                <div class="control-panel">
                    <input type="text" id="targetDeviceId" placeholder="Nhập Device ID (Vd: 001)" value="001" style="padding: 10px; background: #333; color: white; border: 1px solid #555; width: 220px; border-radius: 4px;">
                    <button class="btn-fan" id="btn-subscribe" style="background:#4CAF50;">✅ THEO DÕI TRẠM NÀY</button>
                </div>
            </div>
        </div>
    </div>

    <div class="chart-container">
        <canvas id="historyChart"></canvas>
    </div>
`;

export const BlankPage = (title, description) => `
    <div class="blank-page">
        <h2>${title}</h2>
        <p>${description}</p>
        <p style="margin-top: 20px; color:#555">Tính năng này đang trong quá trình phát triển UI. Chú trọng module Dashboard (Socket) trước.</p>
    </div>
`;
