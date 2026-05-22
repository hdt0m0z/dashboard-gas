export const DevicesPage = `
<div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
        <h2 style="margin: 0; color: #E0E0E0;">DEVICE MANAGEMENT (EDGE GATEWAY)</h2>
    </div>
    <div class="toolbar-actions">
        <input type="text" class="search-box" placeholder="🔍 Search Gateway, SSID...">
        <button class="btn-add" onclick="document.getElementById('addGatewayModal').style.display='flex'">➕ Add New Gateway</button>
    </div>
</div>

<div class="gateway-grid" id="devicesGrid">
    <!-- Rendered via JS -->
</div>

<!-- MQTT Log Terminal -->
<div class="panel" style="margin-top: 20px;">
    <div class="panel-header" style="background: #1a1a1a; border-bottom: 1px solid #333;">
        <span style="color: #4ade80; font-family: 'Courier New', Courier, monospace;">>_ MQTT PROTOCOL MONITORING & CONTROL STATION (REAL-TIME)</span>
    </div>
    <div id="mqtt-terminal" style="background: #000; color: #a3a3a3; font-family: 'Consolas', 'Courier New', monospace; font-size: 13px; height: 350px; overflow-y: auto; padding: 15px; border: 1px solid #333; border-radius: 0 0 8px 8px;">
        <div style="color: #666; font-style: italic; margin-bottom: 10px;">Initializing monitoring connection...</div>
        <!-- Logs will be inserted here -->
    </div>
</div>

<!-- Modal Thêm Gateway Mới -->
<div id="addGatewayModal" class="modal-overlay" style="display: none;">
    <div class="modal-content">
        <div class="modal-header">
            <h3>➕ Add New Gateway</h3>
            <button class="btn-close" onclick="document.getElementById('addGatewayModal').style.display='none'">✖</button>
        </div>
        <div class="modal-body">
            <div class="form-group">
                <label>Gateway ID (Device Code)</label>
                <input type="text" id="newGwId" placeholder="Enter ID, e.g.: GW001" class="modal-input">
            </div>
            <div class="form-group">
                <label>Gateway Password</label>
                <input type="password" id="newGwPassword" placeholder="Enter password" class="modal-input">
            </div>
        </div>
        <div class="modal-footer">
            <button class="btn-cancel" onclick="document.getElementById('addGatewayModal').style.display='none'">Cancel</button>
            <button class="btn-submit" onclick="submitAddGateway()">Confirm</button>
        </div>
    </div>
</div>
`;

export const SettingsPage = `
    <div class="header" style="border-bottom:none; margin-bottom: 0;">
        <h2 style="color: #E0E0E0;">ACCOUNT SETTINGS</h2>
    </div>
    <div class="stations-container" style="display:flex; gap:20px; flex-wrap:wrap; margin-top:20px;">
        <div class="station-card" style="flex:1; min-width:300px; display:block;">
            <h3 style="color:#4fc3f7; border-bottom:1px solid var(--border-color); padding-bottom:10px;">PERSONAL INFORMATION</h3>
            <form id="profileForm" style="margin-top:20px;">
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Email Address</label>
                    <input type="email" id="profileEmail" disabled style="width:100%; padding:10px; background:#111; color:#888; border:1px solid #333; border-radius:4px; box-sizing:border-box; cursor: not-allowed;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Full Name (*)</label>
                    <input type="text" id="profileName" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Phone Number</label>
                    <input type="tel" id="profilePhone" style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>

                <button type="submit" class="btn-primary" id="btnUpdateProfile" style="margin-top: 10px;">UPDATE INFORMATION</button>
            </form>
        </div>

        <div class="station-card" style="flex:1; min-width:300px; display:block;">
            <h3 style="color:#FFC107; border-bottom:1px solid var(--border-color); padding-bottom:10px;">CHANGE PASSWORD</h3>
            <form id="passwordForm" style="margin-top:20px;">
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Current Password</label>
                    <input type="password" id="oldPassword" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">New Password</label>
                    <input type="password" id="newPassword" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <div style="margin-bottom:15px;">
                    <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Confirm mật khẩu mới</label>
                    <input type="password" id="confirmPassword" required style="width:100%; padding:10px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                </div>
                <button type="submit" class="btn-primary" id="btnUpdatePassword" style="background:#FFC107; color:#000; margin-top: 10px;">CHANGE PASSWORD</button>
            </form>
        </div>
    </div>
`;

export const NetworkPage = `
    <div class="header" style="border-bottom:none; margin-bottom: 0;">
        <h2 style="color: #E0E0E0;">REMOTE WI-FI NETWORK CONFIGURATION</h2>
    </div>
    
    <div class="station-card" style="max-width: 600px; margin: 20px auto; display: block;">
        <h3 style="color:#4fc3f7; border-bottom:1px solid #333; padding-bottom:10px;"> WI-FI Configuration</h3>
        
        <form id="networkForm" style="margin-top:20px;">
            <div style="margin-bottom:15px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Select Gateway Device (*)</label>
                <select id="netDeviceId" required style="width:100%; padding:12px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px;">
                    <option value="">Loading devices...</option>
                </select>
            </div>

            <div style="margin-bottom:15px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">New Wi-Fi Name (SSID) (*)</label>
                <input type="text" id="netSSID" required placeholder="Enter network name" style="width:100%; padding:12px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
            </div>

            <div style="position: relative; margin-bottom:20px;">
                <label style="color:#aaa; font-size:14px; display:block; margin-bottom:5px;">Mật khẩu Wi-Fi mới</label>
                <input type="password" id="netPass" placeholder="Enter password" style="width:100%; padding:12px; padding-right: 40px; background:#2a2a2a; color:#fff; border:1px solid #555; border-radius:4px; box-sizing:border-box;">
                <span id="eyeNetPass" style="position: absolute; right: 10px; top: 38px; cursor: pointer; user-select: none;">👁️</span>
            </div>

            <button type="submit" id="btnSubmitNetwork" class="btn-primary" style="background:#FF9800; color:#000;">SEND CONFIG TO DEVICE</button>
        </form>
    </div>


    <!-- Dialog Confirmation -->
    <div id="confirmModal" style="display:none; position:fixed; top:0; left:0; right:0; bottom:0; background:rgba(0,0,0,0.8); z-index:9999; justify-content:center; align-items:center;">
        <div style="background:#1e1e1e; border:1px solid #444; border-radius:8px; padding:25px; width:400px; text-align:center;">
            <h3 style="color:#F44336; margin-top:0;">⚠️ CONFIRM NETWORK CHANGE</h3>
            <p style="color:#ccc; font-size:15px; margin: 15px 0 25px 0;">
                Are you sure you want to change the network for this device? If the password is wrong, it will automatically revert to the old network after 15 seconds.
            </p>
            <div style="display:flex; justify-content:space-between; gap:15px;">
                <button type="button" id="btnCancelModal" style="flex:1; padding:10px; background:#555; color:white; border:none; border-radius:4px; cursor:pointer;">Cancel</button>
                <button type="button" id="btnConfirmModal" style="flex:1; padding:10px; background:#4CAF50; color:white; border:none; border-radius:4px; cursor:pointer;">I Am Sure</button>
            </div>
        </div>
    </div>
`;

export const RegisterPage = `
  <div class="login-screen">
    <div class="login-container">
        <h2>Registration is locked</h2>
        <p style="color: gray; margin-bottom: 20px;">Please contact the Administrator for an account.</p>
        <a href="#/" style="color:#4fc3f7; text-decoration:none; font-weight: bold;">⬅ Back to Login</a>
    </div>
  </div>
`;

export const LoginPage = `
  <div class="login-screen">
    <div class="login-container">
        <h2>Exhaust Gas Monitoring Station</h2>
        <form class="login-form" id="loginForm">
            <input type="email" id="email" placeholder="Email" required />
            <input type="password" id="password" placeholder="Password" required />
            <button type="submit" class="btn-primary">LOGIN</button>
        </form>
        <div class="divider">OR</div>
        <a href="/api/auth/google"><button id="btn-google" class="btn-google">LOGIN WITH GOOGLE</button></a>
        
    </div>
  </div>
`;

export const SidebarLayout = `
  <div class="app-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-header">
        Exhaust Gas Monitoring Station
        <div style="margin-top: 15px; display: flex; flex-direction: column; align-items: center; background: rgba(0, 0, 0, 0.2); padding: 8px; border-radius: 6px; border: 1px solid var(--glass-border);">
            <span style="font-size: 0.65rem; color: var(--text-dim); text-transform: uppercase; margin-bottom: 3px;">INTERNET TIME</span>
            <span id="server-clock" style="font-family: var(--font-data); font-size: 1.1rem; color: var(--safe-glow); font-weight: bold; letter-spacing: 1px;">Syncing...</span>
        </div>
      </div>
      <nav class="sidebar-nav">
        <a class="nav-item" data-route="/dashboard">📊 Dashboard</a>
        <a class="nav-item" id="nav-devices" data-route="/devices" style="display:none;">⚙️ Device Management</a>
        <!-- <a class="nav-item" data-route="/share">🔗 Chia sẻ thiết bị</a> -->
        <!-- <a class="nav-item" data-route="/report">📈 Báo cáo & Thống kê</a> -->
        <a class="nav-item" id="nav-network" data-route="/network" style="display:none;">📡 Network Configuration</a>
        <a class="nav-item" id="nav-users" data-route="/users" style="display:none;">👥 User Management</a>
        <a class="nav-item" data-route="/settings">👤 Account Settings</a>
      </nav>
      <div class="sidebar-footer">
        <button id="btn-logout" class="btn-logout">🚪 Logout</button>
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
                <span class="main-title">MONITORING STATION 1 (Node 1)</span>
                <span class="sub-title">Last updated: <span id="time-1" style="color: var(--text-main);">--:--:-- --/--</span></span>
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
                <div class="data-cell" id="cell-so2-1"><span class="label">SO2 Concentration</span><div><span class="value" id="val-so2-1">0.0</span> <span class="unit">ppm</span></div></div>
                <div class="data-cell" id="cell-pm25-1"><span class="label">PM2.5 Fine Dust</span><div><span class="value" id="val-pm25-1">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm10-1"><span class="label">PM10 Dust</span><div><span class="value" id="val-pm10-1">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm1-1"><span class="label">PM1.0 Dust</span><div><span class="value" id="val-pm1-1">0.0</span> <span class="unit">µg/m³</span></div></div>
            </div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <div class="header-title">
                <span class="main-title">MONITORING STATION 2 (Node 2)</span>
                <span class="sub-title">Last updated: <span id="time-2" style="color: var(--text-main);">--:--:-- --/--</span></span>
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
                <div class="data-cell" id="cell-so2-2"><span class="label">SO2 Concentration</span><div><span class="value" id="val-so2-2">0.0</span> <span class="unit">ppm</span></div></div>
                <div class="data-cell" id="cell-pm25-2"><span class="label">PM2.5 Fine Dust</span><div><span class="value" id="val-pm25-2">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm10-2"><span class="label">PM10 Dust</span><div><span class="value" id="val-pm10-2">0.0</span> <span class="unit">µg/m³</span></div></div>
                <div class="data-cell" id="cell-pm1-2"><span class="label">PM1.0 Dust</span><div><span class="value" id="val-pm1-2">0.0</span> <span class="unit">µg/m³</span></div></div>
            </div>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <span style="color: #60a5fa;">🌐 GATEWAY INFO & CONFIGURATION</span>
            <span style="font-size: 0.7rem; color: var(--text-dim);">ESP-01 / STM32</span>
        </div>
        <div class="gw-grid">
            <div class="gw-card"><span class="label">Connection Status</span><span class="value" id="gw-status" style="color: var(--text-dim);">○ OFFLINE</span></div>
            <div class="gw-card alert-card"><span class="label">SO2 Warning Threshold</span><span class="value" id="gw-limit-so2">100.0 ppm</span></div>
            <div class="gw-card alert-card"><span class="label">Dust (PM) Warning Threshold</span><span class="value" id="gw-limit-pm">250 µg/m³</span></div>
            <div class="gw-card"><span class="label">Connected Network (SSID)</span><span class="value" id="gw-ssid">N/A</span></div>
            <div class="gw-card"><span class="label">WiFi Signal Strength (RSSI)</span><span class="value" id="gw-rssi">0 dBm</span></div>
            <div class="gw-card"><span class="label">MQTT Server</span><span class="value" style="font-size: 0.95rem;">HiveMQ Cloud (TLS)</span></div>
            <div class="gw-card"><span class="label">Communication Port</span><span class="value">8883</span></div>
            <div class="gw-card"><span class="label">Heartbeat Interval</span><span class="value">60 giây</span></div>
            <div class="gw-card"><span class="label">Device Name (OTA)</span><span class="value">Gateway-ESP01</span></div>
        </div>
    </div>

    <div class="panel trend-panel">
        <div class="panel-header">
            <div style="display:flex; gap:15px; align-items:center;">
                <span>📈 REAL-TIME TREND CHARTS</span>
                <select class="custom-select" id="zone-filter" onchange="applyZoneFilter(this.value)">
                    <option value="all">Display: Both Zones</option>
                    <option value="z1">Display Node 1 Only</option>
                    <option value="z2">Display Node 2 Only</option>
                </select>
            </div>
            <div style="display:flex; gap:15px; font-size:0.8rem; font-family:var(--font-data);">
                <span style="color: #22d3ee;">■ Node 1</span>
                <span style="color: #fbbf24;">■ Node 2</span>
            </div>
        </div>
        <div class="charts-grid" style="display: flex; overflow-x: auto; flex-wrap: nowrap; gap: 15px; padding-bottom: 10px;">
            <div class="chart-box" style="flex: 0 0 auto; min-width: 450px; width: 450px; min-height: 0;">
                <div class="chart-top-bar"><span class="chart-title">SO2 (ppm)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-so2', '1h', this)">1h</button><button class="time-btn" onclick="setTimeRange('chart-so2', '15m', this)">15m</button><button class="time-btn" onclick="setTimeRange('chart-so2', '5m', this)">5m</button><button class="time-btn active" onclick="setTimeRange('chart-so2', 'live', this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-so2"></canvas></div>
            </div>
            <div class="chart-box" style="flex: 0 0 auto; min-width: 450px; width: 450px; min-height: 0;">
                <div class="chart-top-bar"><span class="chart-title">PM10 (µg/m³)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-pm10', '1h', this)">1h</button><button class="time-btn" onclick="setTimeRange('chart-pm10', '15m', this)">15m</button><button class="time-btn" onclick="setTimeRange('chart-pm10', '5m', this)">5m</button><button class="time-btn active" onclick="setTimeRange('chart-pm10', 'live', this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-pm10"></canvas></div>
            </div>
            <div class="chart-box" style="flex: 0 0 auto; min-width: 450px; width: 450px; min-height: 0;">
                <div class="chart-top-bar"><span class="chart-title">PM2.5 (µg/m³)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-pm25', '1h', this)">1h</button><button class="time-btn" onclick="setTimeRange('chart-pm25', '15m', this)">15m</button><button class="time-btn" onclick="setTimeRange('chart-pm25', '5m', this)">5m</button><button class="time-btn active" onclick="setTimeRange('chart-pm25', 'live', this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-pm25"></canvas></div>
            </div>
            <div class="chart-box" style="flex: 0 0 auto; min-width: 450px; width: 450px; min-height: 0;">
                <div class="chart-top-bar"><span class="chart-title">PM1.0 (µg/m³)</span>
                    <div class="time-controls"><button class="time-btn" onclick="setTimeRange('chart-pm1', '1h', this)">1h</button><button class="time-btn" onclick="setTimeRange('chart-pm1', '15m', this)">15m</button><button class="time-btn" onclick="setTimeRange('chart-pm1', '5m', this)">5m</button><button class="time-btn active" onclick="setTimeRange('chart-pm1', 'live', this)">LIVE</button></div>
                </div><div class="chart-wrapper"><canvas id="chart-pm1"></canvas></div>
            </div>
        </div>
    </div>

    <div class="panel bottom-log">
        <div class="panel-header">
            <span style="color: #fcd34d;">⚠️ EVENT LOG</span>
            <select class="custom-select" id="alert-filter" onchange="applyAlertFilter()" style="max-width: 130px;">
                <option value="all">All</option>
                <option value="threshold">Threshold Exceeded</option>
                <option value="connection">Connection</option>
            </select>
        </div>
        <div class="alert-table-container">
            <table>
                <thead><tr><th>Time</th><th>Source</th><th>Details</th></tr></thead>
                <tbody id="alert-tbody">
                    <tr data-type="threshold"><td style="font-family: var(--font-data);">08:15:20</td><td>Node 1</td><td class="level-high">SO2 exceeded threshold</td></tr>
                    <tr data-type="connection"><td style="font-family: var(--font-data);">07:30:00</td><td>Hệ thống</td><td class="level-low">WebSocket Restored</td></tr>
                </tbody>
            </table>
        </div>
    </div>


    <div class="panel bottom-conn">
        <div class="panel-header">
            <span>📡 STABILITY STATISTICS</span>
            <select class="custom-select" id="uptime-time-filter" onchange="updateUptimeChart()">
                <option value="live" selected>Today (Live)</option>
                <option value="week">This Week</option>
                <option value="month">This Month</option>
                <option value="year">This Year</option>
            </select>
        </div>
        <div style="display:flex; flex-direction:column; height: 100%; padding: 15px;">
            <div class="chart-wrapper" style="flex-grow: 1; position: relative;">
                <canvas id="uptimeChart"></canvas>
            </div>
            <div class="violation-stats" style="border:none; margin-top: 10px; background: rgba(0,0,0,0.3); border-radius: 6px; padding: 10px; gap: 0;">
                <div style="text-align:center; flex: 1;">
                    <div style="color:var(--text-dim); font-size:0.75rem; margin-bottom: 5px;">Gateway</div>
                    <div style="color:var(--danger-glow); font-size:1.2rem; font-weight:bold;"><span id="drop-gw">0</span></div>
                    <div style="color:gray; font-size:0.7rem;">incidents</div>
                </div>
                <div style="text-align:center; flex: 1; border-left: 1px solid var(--glass-border); border-right: 1px solid var(--glass-border);">
                    <div style="color:var(--text-dim); font-size:0.75rem; margin-bottom: 5px;">Node 1 (N1)</div>
                    <div style="color:var(--danger-glow); font-size:1.2rem; font-weight:bold;"><span id="drop-n1">0</span></div>
                    <div style="color:gray; font-size:0.7rem;">incidents</div>
                </div>
                <div style="text-align:center; flex: 1;">
                    <div style="color:var(--text-dim); font-size:0.75rem; margin-bottom: 5px;">Node 2 (N2)</div>
                    <div style="color:var(--danger-glow); font-size:1.2rem; font-weight:bold;"><span id="drop-n2">0</span></div>
                    <div style="color:gray; font-size:0.7rem;">incidents</div>
                </div>
            </div>
        </div>
    </div>
</div>
`;
export const AccessControlPage = `
   <h2>ACCESS CONTROL MANAGEMENT</h2>
<main>
    <div class="panel">
        <div class="panel-header">
            <span>✉️ ADD NEW USER</span>
        </div>
        <div class="share-form">
            <div class="form-group">
                <label class="group-title">1. Recipient Information</label>
                <input type="email" id="invite-email" class="input-email" placeholder="Enter Email address (e.g. tech@factory.com)...">
            </div>

            <div class="form-group">
                <label class="group-title">2. Station Data View Access</label>
                
                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">Node 1 (Node 1)</span>
                        <span class="perm-desc">Allow viewing SO2 and Dust data of chimney 1</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-z1" checked><span class="slider"></span></label>
                </div>
                
                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">Node 2 (Node 2)</span>
                        <span class="perm-desc">Allow viewing SO2 and Dust data of chimney 2</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-z2" checked><span class="slider"></span></label>
                </div>
            </div>

            <div class="form-group">
                <label class="group-title">3. System Admin Access</label>
                
                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">Edit Warning Thresholds</span>
                        <span class="perm-desc">Allow changing SO2 and Dust limits (Publish MQTT)</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-thresh"><span class="slider"></span></label>
                </div>

                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title">View Gateway Information</span>
                        <span class="perm-desc">View IP, RSSI, MQTT Status, Uptime of main device</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-gwinfo"><span class="slider"></span></label>
                </div>

                <div class="perm-row">
                    <div class="perm-info">
                        <span class="perm-title" style="color: #fca5a5;">WiFi Configuration</span>
                        <span class="perm-desc">Permission to send Reset network config command to ESP-01</span>
                    </div>
                    <label class="switch"><input type="checkbox" id="perm-wifi"><span class="slider"></span></label>
                </div>
            </div>

            <button class="btn-submit" onclick="sendInvite()">Send Invite & Grant Access</button>
        </div>
    </div>

    <div class="panel">
        <div class="panel-header">
            <span>👥 LIST OF SHARED ACCOUNTS</span>
            <span style="font-weight:normal; font-size:0.8rem; color:var(--text-dim);" id="user-count">Total: 2 people</span>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Email Account</th>
                        <th>Monitored Areas (Nodes)</th>
                        <th>Extended Admin Rights</th>
                        <th style="text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody id="shared-list">
                    <tr>
                        <td style="font-weight:bold;">nguyen.van.a@factory.com</td>
                        <td>
                            <span class="badge badge-node">Node 1</span>
                            <span class="badge badge-node">Node 2</span>
                        </td>
                        <td>
                            <span class="badge badge-admin">Edit Thresholds</span>
                            <span class="badge badge-admin">Xem GW Info</span>
                        </td>
                        <td style="text-align: right;">
                            <button class="btn-revoke" onclick="revokeAccess(this)">Revoke</button>
                        </td>
                    </tr>
                    <tr>
                        <td style="font-weight:bold;">giam.sat.kho@factory.com</td>
                        <td>
                            <span class="badge badge-node">Node 2</span>
                        </td>
                        <td>
                            <span class="badge badge-none">View Only</span>
                        </td>
                        <td style="text-align: right;">
                            <button class="btn-revoke" onclick="revokeAccess(this)">Revoke</button>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>
    </div>
`;
export const ReportPage = `
<div class="toolbar">
    <h2>
        DATA ANALYSIS
        <select id="nodeFilter" class="custom-select" onchange="applyFilter()" disabled>
            <option value="all">Display: All Stations</option>
            <option value="1">Display Node 1 (N1) Only</option>
            <option value="2">Display Node 2 (N2) Only</option>
        </select>
    </h2>
    <div class="toolbar-actions">
        <label for="logFileInput" class="btn btn-primary">
            📂 Import Log file (.txt)
        </label>
        <input type="file" id="logFileInput" accept=".txt" onchange="handleFileUpload(event)">
        
        <button id="exportBtn" class="btn btn-success" onclick="exportToCSV()" disabled style="opacity: 0.5; cursor: not-allowed;">
            📥 Export CSV (Current View)
        </button>
    </div>
</div>

<main>
    <div class="panel">
        <div class="panel-header">
            <span>📋 OVERVIEW STATISTICAL REPORT (SUMMARY)</span>
            <span id="file-status" style="color: var(--text-dim); font-size: 0.8rem; font-weight: normal;">No data yet</span>
        </div>
        
        <div class="advanced-stats">
            <div class="stat-card">
                <div class="stat-card-title">📦 Data Information</div>
                <div class="stat-row"><span>Total records:</span> <span class="stat-val" id="stat-total">0</span></div>
                <div class="stat-row"><span>Node 1 records:</span> <span class="stat-val" id="stat-z1">0</span></div>
                <div class="stat-row"><span>Node 2 records:</span> <span class="stat-val" id="stat-z2">0</span></div>
            </div>
            
            <div class="stat-card">
                <div class="stat-card-title" style="color: #22d3ee;">☁️ SO2 Concentration (ppm)</div>
                <div class="stat-row"><span>Average (Avg):</span> <span class="stat-val" id="so2-avg">0.0</span></div>
                <div class="stat-row"><span>Minimum (Min):</span> <span class="stat-val" id="so2-min">0.0</span></div>
                <div class="stat-row"><span>Maximum (Max):</span> <span class="stat-val" id="so2-max">0.0</span></div>
                <div class="stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                    <span>Threshold Exceeded (>100):</span> <span class="stat-val stat-violation" id="so2-viol">0 times</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-card-title" style="color: #fbbf24;">🌫️ PM2.5 Fine Dust (µg/m³)</div>
                <div class="stat-row"><span>Average (Avg):</span> <span class="stat-val" id="pm25-avg">0.0</span></div>
                <div class="stat-row"><span>Minimum (Min):</span> <span class="stat-val" id="pm25-min">0.0</span></div>
                <div class="stat-row"><span>Maximum (Max):</span> <span class="stat-val" id="pm25-max">0.0</span></div>
                <div class="stat-row" style="margin-top:5px; border-top:1px dashed #444; padding-top:5px;">
                    <span>Threshold Exceeded (>250):</span> <span class="stat-val stat-violation" id="pm25-viol">0 times</span>
                </div>
            </div>

            <div class="stat-card">
                <div class="stat-card-title" style="color: #10b981;">💨 PM10 Dust (µg/m³)</div>
                <div class="stat-row"><span>Average (Avg):</span> <span class="stat-val" id="pm10-avg">0.0</span></div>
                <div class="stat-row"><span>Minimum (Min):</span> <span class="stat-val" id="pm10-min">0.0</span></div>
                <div class="stat-row"><span>Maximum (Max):</span> <span class="stat-val" id="pm10-max">0.0</span></div>
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
            <span>🗄️ DETAILED SENSOR DATA (RAW DATA)</span>
        </div>
        <div class="table-container">
            <table id="dataTable">
                <thead>
                    <tr>
                        <th>No.</th>
                        <th>Time</th>
                        <th>Station (Zone)</th>
                        <th>SO2 (ppm)</th>
                        <th>PM1.0 (µg/m³)</th>
                        <th>PM2.5 (µg/m³)</th>
                        <th>PM10 (µg/m³)</th>
                    </tr>
                </thead>
                <tbody id="tableBody">
                    <tr>
                        <td colspan="7" style="text-align:center; padding: 40px; color: var(--text-dim);">
                            No data yet. Vui lòng nhấn "Nhập file Log" để bắt đầu phân tích.
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
        <p style="margin-top: 20px; color:#555">This feature is under UI development. Focusing on Dashboard module (Socket) first.</p>
    </div>
`;

export const UserManagementPage = `
<div class="toolbar">
    <div style="display: flex; align-items: center; gap: 10px;">
        <h2 style="margin: 0; color: #E0E0E0;">USER MANAGEMENT (ADMIN ONLY)</h2>
    </div>
</div>
<main>
    <div class="panel" style="margin-bottom: 20px;">
        <div class="panel-header">
            <span>➕ CREATE NEW ACCOUNT</span>
        </div>
        <form id="adminCreateUserForm" style="display:flex; gap: 10px; align-items: flex-end; padding: 15px;">
            <div style="flex:1;">
                <label style="font-size: 13px; color: gray;">Employee Name</label>
                <input type="text" id="adminNewName" class="modal-input" required placeholder="Nguyễn Văn A">
            </div>
            <div style="flex:1;">
                <label style="font-size: 13px; color: gray;">Email</label>
                <input type="email" id="adminNewEmail" class="modal-input" required placeholder="nhanvien@factory.com">
            </div>
            <div style="flex:1; position: relative;">
                <label style="font-size: 13px; color: gray;">Initial Password</label>
                <input type="password" id="adminNewPassword" class="modal-input" required placeholder="Mật khẩu..." style="padding-right: 40px; width: 100%; box-sizing: border-box;">
                <span id="adminEyePassword" style="position: absolute; right: 10px; top: 38px; cursor: pointer; user-select: none;">👁️</span>
            </div>
            <div style="flex:1;">
                <label style="font-size: 13px; color: gray;">Role</label>
                <select id="adminNewRole" class="modal-input" style="width: 100%;">
                    <option value="user">Employee (User)</option>
                    <option value="admin">Administrator (Admin)</option>
                </select>
            </div>
            <div>
                <button type="submit" class="btn-primary" style="height: 42px;">Create Account</button>
            </div>
        </form>
    </div>

    <div class="panel">
        <div class="panel-header">
            <span>📋 LIST OF ACCOUNTS IN THE SYSTEM</span>
        </div>
        <div class="table-container">
            <table>
                <thead>
                    <tr>
                        <th>Name</th>
                        <th>Email</th>
                        <th>Role</th>
                        <th>Created Date</th>
                        <th style="text-align: right;">Action</th>
                    </tr>
                </thead>
                <tbody id="userListBody">
                    <tr><td colspan="5" style="text-align:center;">Loading data...</td></tr>
                </tbody>
            </table>
        </div>
    </div>
</main>
`;
