import { LoginPage, RegisterPage, SidebarLayout, DashboardPage, BlankPage, SettingsPage, NetworkPage, DevicesPage, AccessControlPage, ReportPage, UserManagementPage } from './pages.js';

// --- SYSTEM STATE ---
// Bắt dữ liệu JWT Token nếu Google OAuth trả về qua link redirection
const urlParams = new URLSearchParams(window.location.search);
const loginToken = urlParams.get('token');
if (loginToken) {
    localStorage.setItem('scada_token', loginToken);
    // Delete Token khỏi thanh URL cho đẹp và bảo mật
    window.history.replaceState({}, document.title, window.location.pathname);
}

const state = {
    token: localStorage.getItem('scada_token') || null,
    socket: null,
    currentRoom: null, // Vẫn giữ cho tính năng chọn Gateway
    dashboard: {
        charts: { so2: null, pm10: null, pm25: null, pm1: null }
    },
    nodeTimeouts: {} // Lưu trữ timer Watchdog cho từng node
};

// --- DOM ROOT ---
const root = document.getElementById('root');

// --- UTILS ---
const showToast = (msg, isError = false) => {
    Toastify({
        text: msg, duration: 3000, gravity: "top", position: "right",
        style: { background: isError ? "var(--color-danger)" : "var(--color-safe)" }
    }).showToast();
};

const showWarningAlert = (msg) => {
    Toastify({
        text: msg, duration: 5000, close: true, gravity: "top", position: "center",
        style: { background: "var(--color-danger)", fontSize: "16px", padding: "15px" }
    }).showToast();
}

// --- ROUTER ---
const navigate = (path) => {
    window.location.hash = path;
};

// Bind to window for inline HTML onclick handlers since app.js is an ES6 module
window.navigate = navigate;
window.showToast = showToast;

window.submitAddGateway = () => {
    const gwId = document.getElementById('newGwId').value.trim();
    const pwd = document.getElementById('newGwPassword').value.trim();

    if (!gwId || !pwd) {
        showToast('Vui lòng nhập đầy đủ ID và Mật khẩu Gateway');
        return;
    }

    // Giả lập xử lý thành công
    showToast(`Đã gửi yêu cầu thêm Gateway: ${gwId}`);

    // Delete form và ẩn modal
    document.getElementById('newGwId').value = '';
    document.getElementById('newGwPassword').value = '';
    document.getElementById('addGatewayModal').style.display = 'none';
};

const handleRoute = () => {
    const path = window.location.hash.replace('#', '') || '/';

    // JWT Guard: đá ra nếu chưa có token mà không phải trang / hoặc trang /register 
    if (!state.token && path !== '/' && path !== '/register') {
        showToast('Vui lòng đăng nhập', true);
        return navigate('/');
    }

    if (state.token && (path === '/' || path === '/register')) {
        return navigate('/dashboard');
    }

    renderRoute(path);
};

const renderRoute = (path) => {
    // 1. Nhanh chóng nạp Auth Views
    if (path === '/') {
        root.innerHTML = LoginPage;
        setupLoginEvents();
        return;
    }

    if (path === '/register') {
        root.innerHTML = RegisterPage;
        setupRegisterEvents();
        return;
    }

    // 2. DOM Caching & Layout Injection
    if (!document.getElementById('content-area')) {
        root.innerHTML = SidebarLayout;
        setupSidebarEvents();
        if (state.user && state.user.role === 'admin') {
            const navUsers = document.getElementById('nav-users');
            if (navUsers) navUsers.style.display = 'flex';
            const navDevices = document.getElementById('nav-devices');
            if (navDevices) navDevices.style.display = 'flex';
            const navNetwork = document.getElementById('nav-network');
            if (navNetwork) navNetwork.style.display = 'flex';
        }
    }
    
    // Bảo vệ các Route của Admin khỏi User thường
    if (state.user && state.user.role !== 'admin') {
        if (path === '/devices' || path === '/network' || path === '/users') {
            return navigate('/dashboard');
        }
    }
    
    updateSidebarActive(path);

    // Core Socket initialization must inject outside Dashboard component scope
    if (!state.socket) {
        setupSocket();
    }

    const contentArea = document.getElementById('content-area');

    // Ẩn tất cả các trang
    const pages = contentArea.querySelectorAll('.page-container');
    pages.forEach(page => page.style.display = 'none');

    // Tìm hoặc tạo trang tương ứng
    const pageId = `page-${path.replace('/', '')}`;
    let pageEl = document.getElementById(pageId);

    if (!pageEl) {
        pageEl = document.createElement('div');
        pageEl.id = pageId;
        pageEl.className = 'page-container';
        pageEl.style.display = 'block';
        contentArea.appendChild(pageEl);

        // Nạp HTML và khởi tạo lần đầu
        switch (path) {
            case '/dashboard':
                pageEl.innerHTML = DashboardPage;
                initSCADADashboard();
                break;
            case '/devices':
                pageEl.innerHTML = DevicesPage;
                loadDevicesData();
                break;
            case '/share':
                pageEl.innerHTML = AccessControlPage;
                break;
            case '/network':
                pageEl.innerHTML = NetworkPage;
                loadNetworkData();
                break;
            case '/report':
                pageEl.innerHTML = ReportPage;
                loadNetworkData();
                break;
            case '/settings':
                pageEl.innerHTML = SettingsPage;
                loadSettingsData();
                break;
            case '/users':
                pageEl.innerHTML = UserManagementPage;
                loadUsersData();
                break;
            default:
                pageEl.innerHTML = BlankPage('404 Not Found', 'Không tìm thấy trang yêu cầu.');
                break;
        }
    } else {
        // Chỉ hiển thị lại và làm mới dữ liệu nếu cần
        pageEl.style.display = 'block';
        if (path === '/devices') loadDevicesData();
        if (path === '/dashboard' && state.currentRoom) {
            window.loadAlertHistory(state.currentRoom);
            window.updateUptimeChart();
        }
    }
};

// --- CONTROLLERS ---
const setupLoginEvents = () => {
    const loginForm = document.getElementById('loginForm');
    if (loginForm) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const email = document.getElementById('email').value;
            const password = document.getElementById('password').value;

            try {
                let res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ email, password })
                });

                const data = await res.json();

                if (res.ok) {
                    showToast('Đăng nhập Hệ thống thành công!');
                    state.token = data.token;
                    localStorage.setItem('scada_token', state.token);
                    
                    // Fetch user profile ngay sau login để có quyền hạn
                    const profileRes = await fetch('/api/user/profile', {
                        headers: { 'Authorization': "Bearer " + state.token }
                    });
                    if (profileRes.ok) state.user = await profileRes.json();
                    
                    navigate('/dashboard');
                } else {
                    showToast(data.message || 'Sai thông tin tài khoản hoặc mật khẩu', true);
                }

            } catch (err) {
                showToast('API Offline', true);
            }
        });
    }
};

const setupRegisterEvents = () => {
    // Đã khóa tính năng tự đăng ký
};
const setupSidebarEvents = () => {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.addEventListener('click', () => navigate(el.getAttribute('data-route')));
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('scada_token');
        state.token = null;
        state.user = null;
        if (state.socket) {
            state.socket.disconnect();
            state.socket = null;
        }
        navigate('/');
    });
};

const updateSidebarActive = (currentPath) => {
    document.querySelectorAll('.nav-item').forEach(el => {
        el.classList.remove('active');
        if (el.getAttribute('data-route') === currentPath) {
            el.classList.add('active');
        }
    });
};

// --- SCADA MAIN LOGIC ---
const initSCADADashboard = () => {
    Chart.defaults.color = '#9ca3af';
    Chart.defaults.font.family = "'Consolas', monospace";

    const createChart = (canvasId, label, color) => {
        const ctx = document.getElementById(canvasId).getContext('2d');
        return new Chart(ctx, {
            type: 'line',
            data: {
                labels: [],
                datasets: [
                    { label: `${label} Node 1`, data: [], borderColor: '#22d3ee', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3 },
                    { label: `${label} Node 2`, data: [], borderColor: '#fbbf24', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3 }
                ]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: { legend: { display: false } }, // Ẩn legend vì đã có chú thích ở trên panel
                scales: {
                    x: { grid: { color: 'rgba(255,255,255,0.05)' }, ticks: { maxTicksLimit: 5 } },
                    y: { grid: { color: 'rgba(255,255,255,0.05)' } }
                }
            }
        });
    };

    // Khởi tạo 4 biểu đồ
    state.dashboard.charts.so2 = createChart('chart-so2', 'SO2', '#22d3ee');
    state.dashboard.charts.pm10 = createChart('chart-pm10', 'PM10', '#10b981');
    state.dashboard.charts.pm25 = createChart('chart-pm25', 'PM2.5', '#fbbf24');
    state.dashboard.charts.pm1 = createChart('chart-pm1', 'PM1.0', '#9ca3af');

    // --- ĐỊNH NGHĨA CÁC HÀM TỪ GIAO DIỆN HTML ---
    window.setTimeRange = async (chartId, range, btnElement) => {
        // Đổi UI nút bấm
        const container = btnElement.parentElement;
        container.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
        // showToast(`Đang tải dữ liệu lịch sử cho ${range}...`); // Đã ẩn theo yêu cầu

        let points = 40;
        if (range === '1h') points = 240;
        else if (range === '15m') points = 60;
        else if (range === '5m') points = 20;
        else if (range === 'live') points = 40;

        // Xác định chart key tương ứng
        const chartKey = chartId.replace('chart-', '');
        const chart = state.dashboard.charts[chartKey];
        if (!chart) return;

        // Lưu max points riêng cho biểu đồ này
        chart.customMaxPoints = points;

        if (!state.currentRoom) return; // Nếu chưa kết nối Gateway

        try {
            const res = await fetch(`/api/device/telemetry/${state.currentRoom}?range=${range}`, {
                headers: { 'Authorization': "Bearer " + state.token }
            });
            if (res.ok) {
                const historyData = await res.json();

                // Xoá trắng mảng của biểu đồ hiện tại
                chart.data.labels = [];
                chart.data.datasets[0].data = [];
                chart.data.datasets[1].data = [];

                // Đổ dữ liệu lịch sử vào chart
                historyData.forEach(item => {
                    const timeLabel = new Date(item.timestamp).toLocaleString('vi-VN');
                    const zId = (item.metadata.nodeId === 1 || item.metadata.nodeId === 'A') ? 1 : 2;
                    let value = 0;
                    if (chartKey === 'so2') value = item.so2;
                    else if (chartKey === 'pm10') value = item.pm10 ?? item.PM10 ?? 0;
                    else if (chartKey === 'pm25') value = item.pm25 ?? item.PM2_5 ?? 0;
                    else if (chartKey === 'pm1') value = item.pm1 ?? item.pm1_0 ?? item.PM1 ?? 0;

                    updateChartData(chart, timeLabel, value || 0, zId, true); // isBatch = true
                });

                chart.update('none');
                // showToast(`Đã cập nhật biểu đồ ${chartKey.toUpperCase()} (${range})`); // Đã ẩn theo yêu cầu
            }
        } catch (err) {
            console.error('History load error:', err);
            showToast('History data load error', true);
        }
    };

    window.applyZoneFilter = (zone) => {
        const charts = [state.dashboard.charts.so2, state.dashboard.charts.pm10, state.dashboard.charts.pm25, state.dashboard.charts.pm1];

        charts.forEach(chart => {
            if (!chart) return;

            if (zone === 'all') {
                chart.setDatasetVisibility(0, true);
                chart.setDatasetVisibility(1, true);
            } else if (zone === 'z1') {
                chart.setDatasetVisibility(0, true);
                chart.setDatasetVisibility(1, false);
            } else if (zone === 'z2') {
                chart.setDatasetVisibility(0, false);
                chart.setDatasetVisibility(1, true);
            }
            chart.update('none');
        });

        let msg = 'Both Zones';
        if (zone === 'z1') msg = 'Node 1';
        if (zone === 'z2') msg = 'Node 2';
        showToast(`Display filtered: ${msg}`);
    };

    window.loadAlertHistory = async (deviceId) => {
        try {
            const res = await fetch(`/api/device/alerts/${deviceId}`, {
                headers: { 'Authorization': "Bearer " + state.token }
            });
            if (res.ok) {
                const alerts = await res.json();
                const tbody = document.getElementById('alert-tbody');
                if (tbody) tbody.innerHTML = '';

                // Trả về từ mới tới cũ, nên ta reverse để insert theo thứ tự (addAlertLog dùng prepend)
                alerts.reverse().forEach(a => {
                    let level = a.type === 'connection' ? (a.isResolved ? 'low' : 'high') : 'high';
                    if (a.message.includes('vượt ngưỡng') && a.type === 'threshold_breach') level = 'warn';

                    let zId = a.nodeId;
                    if (a.message.includes('Gateway')) zId = 0; // Tương thích ngược với log cũ

                    addAlertLog(a.message, zId, level, a.timestamp, a.type);
                });
            }
        } catch (e) {
            console.error('Error tải lịch sử cảnh báo:', e);
        }
    };

    window.applyAlertFilter = () => {
        const filter = document.getElementById('alert-filter')?.value || 'all';
        const rows = document.querySelectorAll('#alert-tbody tr');
        rows.forEach(row => {
            const rowType = row.getAttribute('data-type');
            if (filter === 'all') {
                row.style.display = '';
            } else if (filter === 'connection' && rowType === 'connection') {
                row.style.display = '';
            } else if (filter === 'threshold' && rowType === 'threshold_breach') {
                row.style.display = '';
            } else {
                row.style.display = 'none';
            }
        });
    };
    window.updateUptimeChart = async () => {
        if (!state.currentRoom) return;
        const filter = document.getElementById('uptime-time-filter')?.value || 'live';
        try {
            const res = await fetch(`/api/device/stability/${state.currentRoom}?range=${filter}`, {
                headers: { 'Authorization': "Bearer " + state.token }
            });
            if (res.ok) {
                const data = await res.json();
                // Cập nhật giao diện số liệu (Text)
                const dGw = document.getElementById('drop-gw');
                const dN1 = document.getElementById('drop-n1');
                const dN2 = document.getElementById('drop-n2');
                if (dGw) dGw.innerText = data.dropsGw;
                if (dN1) dN1.innerText = data.dropsN1;
                if (dN2) dN2.innerText = data.dropsN2;

                // Cập nhật biểu đồ (Bar Chart)
                const ctx = document.getElementById('uptimeChart');
                if (ctx) {
                    if (state.dashboard.uptimeChartInstance) {
                        state.dashboard.uptimeChartInstance.destroy();
                    }
                    state.dashboard.uptimeChartInstance = new Chart(ctx, {
                        type: 'bar',
                        data: {
                            labels: ['Gateway', 'Node 1', 'Node 2'],
                            datasets: [{
                                label: 'Disconnections',
                                data: [data.dropsGw, data.dropsN1, data.dropsN2],
                                backgroundColor: [
                                    'rgba(156, 163, 175, 0.6)', // gray
                                    'rgba(34, 211, 238, 0.6)',  // cyan
                                    'rgba(251, 191, 36, 0.6)'   // yellow
                                ],
                                borderColor: [
                                    '#9ca3af',
                                    '#22d3ee',
                                    '#fbbf24'
                                ],
                                borderWidth: 1,
                                borderRadius: 4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            plugins: {
                                legend: { display: false },
                                title: { display: true, text: 'Total incidents by device', color: '#9ca3af' }
                            },
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    ticks: { color: '#9ca3af', stepSize: 1 }
                                },
                                x: {
                                    ticks: { color: '#9ca3af' }
                                }
                            }
                        }
                    });
                }
            }
        } catch (e) {
            console.error('Error tải thống kê kết nối:', e);
        }
    };

    // Đồng bộ giá trị cấu hình ngưỡng hiển thị từ Database khi vừa khởi tạo tab Dashboard
    (async () => {
        try {
            const res = await fetch('/api/device/my-devices', { headers: { 'Authorization': "Bearer " + state.token } });
            if (res.ok) {
                const devices = await res.json();
                if (devices && devices.length > 0) {
                    const limitSo2 = devices[0].settings?.thresholds?.limit_so2 ?? 100.0;
                    const limitPm = devices[0].settings?.thresholds?.limit_pm ?? 250;
                    const gwLimitSo2 = document.getElementById('gw-limit-so2');
                    const gwLimitPm = document.getElementById('gw-limit-pm');
                    if (gwLimitSo2) gwLimitSo2.innerText = `${parseFloat(limitSo2).toFixed(1)} ppm`;
                    if (gwLimitPm) gwLimitPm.innerText = `${limitPm} µg/m³`;

                    // Đồng bộ trạng thái Gateway
                    const dev = devices[0];
                    const isOnline = dev.status === 'online';
                    const gwSsidEl = document.getElementById('gw-ssid');
                    const gwRssiEl = document.getElementById('gw-rssi');
                    const gwStatusEl = document.getElementById('gw-status');

                    if (gwSsidEl && gwRssiEl && gwStatusEl) {
                        if (isOnline) {
                            gwStatusEl.innerText = '● ONLINE';
                            gwStatusEl.style.color = 'var(--color-safe)';
                            gwSsidEl.innerText = dev.currentWifiSsid || dev.wifi_ssid || 'N/A';
                            gwSsidEl.style.color = 'white';
                            gwRssiEl.innerText = `${dev.wifiRssi || dev.wifi_rssi || 0} dBm`;
                            gwRssiEl.style.color = 'white';
                        } else {
                            gwStatusEl.innerText = '○ OFFLINE';
                            gwStatusEl.style.color = 'var(--text-dim)';
                            gwSsidEl.innerText = 'Mất tín hiệu';
                            gwSsidEl.style.color = 'var(--text-dim)';
                            gwRssiEl.innerText = 'N/A';
                            gwRssiEl.style.color = 'var(--text-dim)';
                        }
                    }
                }
            }
        } catch (error) { }
    })();

    // Nếu đã có kết nối và xác định được phòng (thiết bị) hiện tại, tải lại lịch sử sự kiện & thống kê
    if (state.currentRoom) {
        window.loadAlertHistory(state.currentRoom);
        window.updateUptimeChart();

        // Tự động tải dữ liệu cho các biểu đồ (click vào nút Time Filter đang active)
        setTimeout(() => {
            const liveBtns = document.querySelectorAll('.chart-box .time-controls .time-btn.active');
            liveBtns.forEach(btn => btn.click());
        }, 100);
    }

    // Mặc định ép cả 2 trạm thành Offline lúc vừa mở trang
    setZoneOffline(1);
    setZoneOffline(2);
};

const setupSocket = () => {
    if (!state.socket) {
        state.socket = io(window.location.origin, {
            auth: { token: state.token } // Authentication JWT requirement
        });

        state.socket.on('connect', async () => {
            // Tự động lấy danh sách Gateway và Join vào Gateway đầu tiên
            try {
                const res = await fetch('/api/device/my-devices', {
                    headers: { 'Authorization': "Bearer " + state.token }
                });
                if (res.ok) {
                    const devices = await res.json();
                    if (devices && devices.length > 0) {
                        const targetId = devices[0].deviceId;
                        state.socket.emit('join_device', targetId);
                        state.currentRoom = targetId;
                        console.log(`[CLIENT-DEBUG] Đã tự động tham gia phòng thiết bị: ${targetId}`);

                        // Khởi tạo ngưỡng cho Dashboard từ thiết bị đầu tiên
                        const limitSo2 = devices[0].settings?.thresholds?.limit_so2 ?? 100.0;
                        const limitPm = devices[0].settings?.thresholds?.limit_pm ?? 250;
                        const gwLimitSo2 = document.getElementById('gw-limit-so2');
                        const gwLimitPm = document.getElementById('gw-limit-pm');
                        if (gwLimitSo2) gwLimitSo2.innerText = `${parseFloat(limitSo2).toFixed(1)} ppm`;
                        if (gwLimitPm) gwLimitPm.innerText = `${limitPm} µg/m³`;

                        // Tải lịch sử cảnh báo và biểu đồ thống kê ngay khi vào phòng
                        window.loadAlertHistory(targetId);
                        window.updateUptimeChart();

                        // Tự động tải dữ liệu cho các biểu đồ nếu chúng đã được render
                        setTimeout(() => {
                            const liveBtns = document.querySelectorAll('.chart-box .time-controls .time-btn.active');
                            liveBtns.forEach(btn => btn.click());
                        }, 100);
                    }
                }
            } catch (error) {
                console.error('Error lấy thiết bị để join room:', error);
            }
        });
        state.socket.on('disconnect', () => {
            showToast('Mất kết nối tới Server!', true);
            // Ép cả 2 trạm trên Dashboard thành Offline
            if (document.getElementById('pipe-1')) {
                setZoneOffline(1);
                setZoneOffline(2);
            }
        });

        // Lắng nghe sự kiện MQTT Log thời gian thực
        state.socket.on('new_mqtt_log', (log) => {
            if (window.appendMqttLog) {
                window.appendMqttLog(log);
            }
        });
        state.socket.on('connect_error', (err) => {
            showToast('Error JWT Token hoặc Timeout: ' + err.message, true);
            if (document.getElementById('pipe-1')) {
                setZoneOffline(1);
                setZoneOffline(2);
            }
        });

        // Xử lý sự kiện nhận Cảnh báo mới từ Database
        state.socket.on('new_alert', (alert) => {
            let level = alert.type === 'connection' ? (alert.isResolved ? 'low' : 'high') : 'high';
            if (alert.message.includes('vượt ngưỡng') && alert.type === 'threshold_breach') level = 'warn';

            let zId = alert.nodeId;
            if (alert.message.includes('Gateway')) zId = 0; // Fix cho các log cũ chưa có nodeId=0

            addAlertLog(alert.message, zId, level, alert.timestamp, alert.type);
        });

        // Xử lý Lệnh Cập nhật Trạng thái Gateway
        state.socket.on('gateway_status', (data) => {
            if (data.status === 'offline') {
                if (document.getElementById('pipe-1')) {
                    setZoneOffline(1);
                    setZoneOffline(2);
                }
            }
            console.log(`[CLIENT-DEBUG] Nhận được 'gateway_status' tiếp sức từ Server cho phòng: ${data.deviceId}`, data);
            const isOnline = data.status === 'online';

            // Cập nhật cho trang Devices (Quản lý thiết bị)
            const statusEl = document.getElementById(`status-${data.deviceId}`);
            if (statusEl) {
                const color = isOnline ? 'var(--color-safe)' : 'var(--color-danger)';
                const statusText = isOnline ? 'ONLINE' : 'OFFLINE';
                statusEl.style.color = color;
                statusEl.style.borderColor = color;
                statusEl.innerText = `● ${statusText}`;

                const wifiEl = document.getElementById(`wifi-${data.deviceId}`);
                const loraEl = document.getElementById(`lora-${data.deviceId}`);

                if (!isOnline) {
                    if (wifiEl) wifiEl.innerHTML = `📶 Mạng: <strong style="color:gray;">Mất tín hiệu</strong>`;
                } else {
                    if (wifiEl) wifiEl.innerHTML = `📶 Mạng: <strong style="color:white;">${data.wifi_ssid || 'N/A'}</strong> <span style="font-size:12px; color:gray;">(${data.wifi_rssi || 0} dBm)</span>`;
                }

                // Tự động bật/tắt ô nhập và nút bấm cấu hình ngưỡng khi gateway online/offline
                const limitSo2Input = document.getElementById(`limit-so2-${data.deviceId}`);
                const limitPmInput = document.getElementById(`limit-pm-${data.deviceId}`);
                const btnApply = document.querySelector(`#card-${data.deviceId} .btn-apply`);

                if (limitSo2Input) limitSo2Input.disabled = !isOnline;
                if (limitPmInput) limitPmInput.disabled = !isOnline;
                if (btnApply) {
                    btnApply.disabled = !isOnline;
                    if (isOnline) {
                        btnApply.classList.remove('btn-disabled');
                    } else {
                        btnApply.classList.add('btn-disabled');
                    }
                }
            }

            // Cập nhật cho trang Dashboard (Thông tin Gateway Panel)
            const gwSsidEl = document.getElementById('gw-ssid');
            if (gwSsidEl) { // Xác nhận đang ở trang Dashboard
                const gwRssiEl = document.getElementById('gw-rssi');
                const gwStatusEl = document.getElementById('gw-status');

                if (isOnline) {
                    if (gwStatusEl) {
                        gwStatusEl.innerText = '● ONLINE';
                        gwStatusEl.style.color = 'var(--color-safe)';
                    }
                    gwSsidEl.innerText = data.wifi_ssid || 'N/A';
                    gwSsidEl.style.color = 'white';
                    gwRssiEl.innerText = `${data.wifi_rssi || 0} dBm`;
                    gwRssiEl.style.color = 'white';
                } else {
                    if (gwStatusEl) {
                        gwStatusEl.innerText = '○ OFFLINE';
                        gwStatusEl.style.color = 'var(--text-dim)';
                    }
                    gwSsidEl.innerText = 'Mất tín hiệu';
                    gwSsidEl.style.color = 'var(--text-dim)';
                    gwRssiEl.innerText = 'N/A';
                    gwRssiEl.style.color = 'var(--text-dim)';
                }
            }
        });

        // Xử lý Gói tin Data trả từ MQTT Broker
        state.socket.on('telemetry_data', (data) => {
            updateDashboardUI(data);
        });
    }
};
// Hàm chuyển giao diện của 1 Zone về trạng thái Offline (Màu xám)
const setZoneOffline = (zId) => {
    // 1. Đổi chữ trạng thái
    const statusEl = document.getElementById(`status-${zId}`);
    if (statusEl) {
        statusEl.innerText = '○ OFFLINE';
        statusEl.style.color = 'var(--text-dim)'; // Màu xám
    }

    // 2. Đổi màu ống khói thành xám và tắt hiệu ứng phát sáng
    const pipe = document.getElementById(`pipe-${zId}`);
    const base = document.getElementById(`base-${zId}`);
    if (pipe) {
        pipe.style.borderColor = 'var(--text-dim)';
        pipe.style.boxShadow = 'none';
    }
    if (base) {
        base.style.borderColor = 'var(--text-dim)';
    }

    // 3. Đổi màu viền của các ô dữ liệu thành xám
    ['so2', 'pm25', 'pm10', 'pm1'].forEach(param => {
        const cell = document.getElementById(`cell-${param}-${zId}`);
        if (cell) cell.style.borderLeftColor = 'var(--glass-border)';
    });

    // 4. Ẩn hiệu ứng khói (smoke simulation)
    const smoke = document.getElementById(`smoke-${zId}`);
    if (smoke) {
        smoke.style.display = 'none';
    }

    // 5. Chủ động đẩy điểm null vào biểu đồ để làm đứt gãy đường vẽ (báo lỗi mất kết nối)
    Object.values(state.dashboard.charts).forEach(chart => {
        if (!chart) return;
        const timeLabel = new Date().toLocaleString('vi-VN');
        if (chart.data.labels[chart.data.labels.length - 1] !== timeLabel) {
            chart.data.labels.push(timeLabel);
            const lastA = chart.data.datasets[0].data.length > 0 ? chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1] : null;
            const lastB = chart.data.datasets[1].data.length > 0 ? chart.data.datasets[1].data[chart.data.datasets[1].data.length - 1] : null;
            chart.data.datasets[0].data.push(lastA);
            chart.data.datasets[1].data.push(lastB);
        }
        chart.data.datasets[zId - 1].data[chart.data.labels.length - 1] = null;
        chart.update('none');
    });
};

window.applyThreshold = async (deviceId) => {
    const limitSo2 = document.getElementById(`limit-so2-${deviceId}`)?.value;
    const limitPm = document.getElementById(`limit-pm-${deviceId}`)?.value;

    const btn = document.querySelector(`#card-${deviceId} .btn-apply`);
    if (btn) {
        btn.innerText = 'ĐANG TRUYỀN LỆNH...';
        btn.disabled = true;
    }

    try {
        const res = await fetch('/api/device/change-threshold', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + state.token
            },
            body: JSON.stringify({ deviceId, limit_so2: limitSo2, limit_pm: limitPm })
        });

        const data = await res.json();
        if (res.ok) {
            showToast('Đã gửi ngưỡng mới xuống Gateway thành công!');
            // Update Dashboard UI dynamically if we are editing the currently viewed room
            if (state.currentRoom === deviceId) {
                const gwLimitSo2 = document.getElementById('gw-limit-so2');
                const gwLimitPm = document.getElementById('gw-limit-pm');
                if (gwLimitSo2) gwLimitSo2.innerText = `${parseFloat(limitSo2).toFixed(1)} ppm`;
                if (gwLimitPm) gwLimitPm.innerText = `${limitPm} µg/m³`;
            }
        } else {
            showToast(data.message || 'Error cập nhật ngưỡng', true);
        }
    } catch (err) {
        showToast('API Offline, không thể gửi yêu cầu', true);
    } finally {
        if (btn) {
            btn.innerText = 'Apply Config to Gateway';
            btn.disabled = false;
        }
    }
};

const addAlertLog = (msg, zId, level, timestamp = null, alertType = 'threshold_breach') => {
    const tbody = document.getElementById('alert-tbody');
    if (!tbody) return;

    const timeObj = timestamp ? new Date(timestamp) : new Date();
    // Chuyển format thời gian từ vi-VN sang dạng cơ bản (để đồng nhất với UI tiếng Anh)
    const timeStr = timeObj.toLocaleString('en-GB');

    let zoneName = 'System';
    if (zId === 1) zoneName = 'Node 1';
    else if (zId === 2) zoneName = 'Node 2';
    else if (zId === 0) zoneName = 'Gateway';

    // Dịch các câu thông báo cứng từ database
    const translateMap = {
        'Mất kết nối đột ngột (Gateway)': 'Sudden disconnection (Gateway)',
        'Mất tín hiệu (Gateway)': 'Signal lost (Gateway)',
        'Khôi phục kết nối (Gateway)': 'Connection restored (Gateway)',
        'Mất kết nối đột ngột (Node 1)': 'Sudden disconnection (Node 1)',
        'Mất kết nối đột ngột (Node 2)': 'Sudden disconnection (Node 2)',
        'Khôi phục kết nối (Node 1)': 'Connection restored (Node 1)',
        'Khôi phục kết nối (Node 2)': 'Connection restored (Node 2)',
        'Khôi phục WebSocket': 'WebSocket Restored',
        'Mất tín hiệu': 'Signal lost',
        'SO2 vượt ngưỡng': 'SO2 exceeded threshold',
        'Bụi PM vượt ngưỡng': 'PM dust exceeded threshold',
        'Nồng độ bụi PM': 'PM dust concentration',
        'Nồng độ SO2': 'SO2 concentration',
        'vượt ngưỡng': 'exceeded threshold'
    };
    
    let translatedMsg = msg;
    for (const [vn, en] of Object.entries(translateMap)) {
        if (translatedMsg.includes(vn)) {
            translatedMsg = translatedMsg.split(vn).join(en); // Replace all occurrences
        }
    }

    const tr = document.createElement('tr');
    tr.setAttribute('data-type', alertType);

    tr.innerHTML = `
        <td style="font-family: var(--font-data);">${timeStr}</td>
        <td>${zoneName}</td>
        <td class="${level === 'high' ? 'level-high' : 'level-low'}" style="${level === 'warn' ? 'color: #fbbf24;' : ''}">${translatedMsg}</td>
    `;

    // Thêm vào đầu bảng
    tbody.prepend(tr);

    // Giới hạn bảng tối đa 50 dòng
    if (tbody.children.length > 50) {
        tbody.removeChild(tbody.lastChild);
    }
};
const updateDashboardUI = (data) => {
    // Dữ liệu giả định từ payload MQTT/Socket
    const { SO2, PM2_5, timestamp, node } = data;
    const PM10 = data.PM10 ?? data.pm10 ?? 0;
    const PM1 = data.PM1 ?? data.pm1_0 ?? data.pm1 ?? 0;

    // Node 1 là Node 1, Node 2 là Node 2
    const zId = (node === 1 || node === 'A') ? 1 : 2;

    // --- WatchDog Timer (Tính năng 2 phút Offline) ---
    if (state.nodeTimeouts[zId]) {
        clearTimeout(state.nodeTimeouts[zId]);
    }
    state.nodeTimeouts[zId] = setTimeout(() => {
        showToast(`Trạm Quan Trắc ${zId} mất tín hiệu sau 2 phút.`, true);
        setZoneOffline(zId);
    }, 120000); // 120,000 ms = 2 phút
    // -------------------------------------------------

    // Bảo vệ DOM: Kiểm tra xem user có đang ở trang Dashboard không
    if (!document.getElementById(`val-so2-${zId}`)) return;
    // Khi có data tới, chuyển status thành ONLINE màu xanh
    const statusEl = document.getElementById(`status-${zId}`);
    if (statusEl) {
        statusEl.innerText = '● CONNECTED';
        statusEl.style.color = 'var(--safe-glow)';
    }
    // 1. Cập nhật Số liệu Text
    document.getElementById(`val-so2-${zId}`).innerText = (SO2 || 0).toFixed(1);
    document.getElementById(`val-pm25-${zId}`).innerText = (PM2_5 || 0).toFixed(1);
    document.getElementById(`val-pm10-${zId}`).innerText = (PM10 || 0).toFixed(1);
    document.getElementById(`val-pm1-${zId}`).innerText = (PM1 || 0).toFixed(1);

    const timeFormatted = new Date(timestamp).toLocaleString('vi-VN');
    document.getElementById(`time-${zId}`).innerText = timeFormatted;

    // Hiện lại hiệu ứng khói khi có dữ liệu
    const smoke = document.getElementById(`smoke-${zId}`);
    if (smoke) {
        smoke.style.display = 'block';
        smoke.style.opacity = '1';
    }

    // 2. Logic Cảnh báo & Đổi màu ống khói
    const pipe = document.getElementById(`pipe-${zId}`);
    const base = document.getElementById(`base-${zId}`);
    const cellSo2 = document.getElementById(`cell-so2-${zId}`);
    const cellPm25 = document.getElementById(`cell-pm25-${zId}`);
    const cellPm10 = document.getElementById(`cell-pm10-${zId}`);
    const cellPm1 = document.getElementById(`cell-pm1-${zId}`);

    // Lấy ngưỡng động từ giao diện (fallback 100 và 250 nếu chưa có)
    const limitSo2 = parseFloat(document.getElementById('gw-limit-so2')?.innerText) || 100;
    const limitPm = parseFloat(document.getElementById('gw-limit-pm')?.innerText) || 250;

    let isAboveThreshold = false;
    let alertMessages = [];

    // Reset màu về Safe (Xanh) cho ống khói và viền số đo
    if (pipe) {
        pipe.style.borderColor = 'var(--safe-glow)';
        pipe.style.boxShadow = 'none';
    }
    if (base) base.style.borderColor = 'var(--safe-glow)';
    if (cellSo2) cellSo2.style.borderLeftColor = 'var(--safe-glow)';
    if (cellPm25) cellPm25.style.borderLeftColor = 'var(--safe-glow)';
    if (cellPm10) cellPm10.style.borderLeftColor = 'var(--safe-glow)';
    if (cellPm1) cellPm1.style.borderLeftColor = 'var(--safe-glow)';

    // Đánh giá SO2
    if (SO2 > limitSo2) {
        isAboveThreshold = true;
        if (cellSo2) cellSo2.style.borderLeftColor = 'var(--warn-glow)';
        alertMessages.push({ msg: `SO2 vượt ngưỡng (${SO2.toFixed(1)} ppm)`, level: 'warn' });
    }

    // Đánh giá PM10
    if (PM10 > limitPm) {
        isAboveThreshold = true;
        if (cellPm10) cellPm10.style.borderLeftColor = 'var(--warn-glow)';
        alertMessages.push({ msg: `PM10 vượt ngưỡng (${PM10.toFixed(1)})`, level: 'warn' });
    }

    // Đánh giá PM2.5
    if (PM2_5 > limitPm) {
        isAboveThreshold = true;
        if (cellPm25) cellPm25.style.borderLeftColor = 'var(--warn-glow)';
        alertMessages.push({ msg: `PM2.5 vượt ngưỡng (${PM2_5.toFixed(1)})`, level: 'warn' });
    }

    // Đánh giá PM1.0
    if (PM1 > limitPm) {
        isAboveThreshold = true;
        if (cellPm1) cellPm1.style.borderLeftColor = 'var(--warn-glow)';
        alertMessages.push({ msg: `PM1.0 vượt ngưỡng (${PM1.toFixed(1)})`, level: 'warn' });
    }

    // Áp dụng màu Vàng cho Ống khói nếu có bất kỳ chỉ số nào vượt
    if (isAboveThreshold) {
        if (pipe) {
            pipe.style.borderColor = 'var(--warn-glow)';
            pipe.style.boxShadow = '0 0 10px var(--warn-glow)';
        }
        if (base) base.style.borderColor = 'var(--warn-glow)';
    }

    // Ghi log vào bảng Nhật ký - Đã chuyển về Backend qua sự kiện new_alert
    // alertMessages.forEach(alert => addAlertLog(alert.msg, zId, alert.level));

    // 3. Đẩy dữ liệu vào 4 Biểu đồ
    updateChartData(state.dashboard.charts.so2, timeFormatted, SO2 || 0, zId);
    updateChartData(state.dashboard.charts.pm10, timeFormatted, PM10 || 0, zId);
    updateChartData(state.dashboard.charts.pm25, timeFormatted, PM2_5 || 0, zId);
    updateChartData(state.dashboard.charts.pm1, timeFormatted, PM1 || 0, zId);


};

// Hàm phụ trợ để push data vào Chart
const updateChartData = (chart, timeLabel, value, zId, isBatch = false) => {
    if (!chart) return;

    const datasetIndex = zId - 1; // 0 cho Node 1, 1 cho Node 2
    const maxPoints = chart.customMaxPoints || 20;

    // Nếu nhãn thời gian chưa tồn tại trong mảng labels, thêm mới
    if (chart.data.labels[chart.data.labels.length - 1] !== timeLabel) {
        chart.data.labels.push(timeLabel);

        // Copy tiếp giá trị gần nhất của cả 2 mảng để tránh đứt gãy do bất đồng bộ
        const lastA = chart.data.datasets[0].data.length > 0 ? chart.data.datasets[0].data[chart.data.datasets[0].data.length - 1] : null;
        const lastB = chart.data.datasets[1].data.length > 0 ? chart.data.datasets[1].data[chart.data.datasets[1].data.length - 1] : null;

        chart.data.datasets[0].data.push(lastA);
        chart.data.datasets[1].data.push(lastB);
    }

    // Cập nhật giá trị tại index cuối cùng
    chart.data.datasets[datasetIndex].data[chart.data.labels.length - 1] = value;

    // Cắt bớt mảng nếu vượt quá giới hạn hiển thị
    if (chart.data.labels.length > maxPoints) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }

    if (!isBatch) {
        chart.update('none'); // Update nhẹ nhàng, không xài animation nặng
    }
};

const loadDevicesData = async () => {
    try {
        const res = await fetch('/api/device/my-devices', {
            headers: { 'Authorization': "Bearer " + state.token }
        });
        if (res.ok) {
            const devices = await res.json();
            renderDevicesGrid(devices);
        }

        // Tải MQTT Logs cho Terminal
        if (window.loadMqttLogs) {
            window.loadMqttLogs();
        }
    } catch (e) {
        showToast('Error loading device list', true);
    }
};

window.loadMqttLogs = async () => {
    const terminal = document.getElementById('mqtt-terminal');
    if (!terminal) return;
    try {
        const res = await fetch('/api/device/mqtt-logs', {
            headers: { 'Authorization': "Bearer " + state.token }
        });
        if (res.ok) {
            const logs = await res.json();
            terminal.innerHTML = '';
            // API trả về mới nhất ở đầu. Vì hàm appendMqttLog dùng prepend (chèn lên trên), 
            // ta phải đảo ngược mảng để thằng mới nhất được chèn vào CÙNG, từ đó nó sẽ nằm trên ĐỈNH.
            logs.reverse().forEach(log => window.appendMqttLog(log, terminal, false));
            terminal.scrollTop = 0;
        }
    } catch (e) {
        console.error('Error tải MQTT Logs:', e);
    }
};

window.appendMqttLog = (log, containerElement = null, autoScroll = true) => {
    const terminal = containerElement || document.getElementById('mqtt-terminal');
    if (!terminal) return;

    // Nếu terminal đang hiển thị placeholder khởi tạo, xóa nó đi
    if (terminal.innerHTML.includes('Đang khởi tạo kết nối')) {
        terminal.innerHTML = '';
    }

    const timeStr = new Date(log.timestamp).toLocaleTimeString('vi-VN', { hour12: false });

    let directionStr = '';
    let color = '#a3a3a3';
    if (log.direction === 'IN') {
        directionStr = '[IN] ';
        color = '#4ade80'; // Green
    } else {
        directionStr = '[OUT]';
        color = '#facc15'; // Yellow
    }

    const logLine = document.createElement('div');
    logLine.style.marginBottom = '4px';
    logLine.style.lineHeight = '1.4';
    logLine.innerHTML = `<span style="color: #666;">${timeStr}</span> <span style="color: ${color}; font-weight: bold;">${directionStr}</span> <span style="color: #60a5fa;">${log.topic}</span> <span style="color: #d4d4d8;">${log.payload}</span>`;

    // Chèn lên trên cùng
    terminal.prepend(logLine);

    // Giữ tối đa 200 dòng để không bị nặng trình duyệt
    while (terminal.children.length > 200) {
        terminal.removeChild(terminal.lastChild); // Delete dòng cũ nhất ở dưới cùng
    }

    if (autoScroll) {
        terminal.scrollTop = 0; // Luôn giữ cuộn ở trên cùng
    }
};

const renderDevicesGrid = (devices) => {
    const grid = document.getElementById('devicesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (devices.length === 0) {
        grid.innerHTML = '<div style="color:gray;">Empty station. Please click to add new station.</div>';
        return;
    }

    devices.forEach(d => {
        const isOnline = d.status === 'online';
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const statusText = isOnline ? '● ONLINE' : '○ OFFLINE';
        const wifiSsid = d.currentWifiSsid || d.wifi_ssid || 'N/A';
        const wifiRssi = d.wifiRssi || d.wifi_rssi || 0;
        const loraNodes = d.loraNodesCount || d.lora_nodes_count || 0;
        const limitSo2 = d.settings?.thresholds?.limit_so2 ?? 100.0;
        const limitPm = d.settings?.thresholds?.limit_pm ?? 250;



        grid.innerHTML += `
        <div class="gw-card" id="card-${d.deviceId}">
            <div class="card-header">
                <div class="gw-title">
                    <div class="gw-name">🏭 ${d.name || 'Unnamed Gateway'}</div>
                    <div class="gw-id-badge">ID: ${d.deviceId}</div>
                </div>
                <div class="status-pill ${statusClass}" id="status-${d.deviceId}">${statusText}</div>
            </div>
            
            <div class="card-body">
                <div class="info-col">
                    <div class="info-label">Network Information</div>
                    <div class="info-item" id="wifi-${d.deviceId}"><span class="info-icon">📡</span> <span class="info-val">${wifiSsid}</span></div>
                    <div class="info-item"><span class="info-icon">📶</span> <span class="info-val">${wifiRssi} dBm</span></div>
                    <div class="info-item" style="margin-top: 15px;"><span class="info-icon">☁️</span> <span class="info-val" style="color:var(--text-dim); font-weight:normal;">MQTT: ${isOnline ? 'Connected (TLS)' : 'Disconnected'}</span></div>
                </div>
            </div>

            <div class="threshold-section">
                <div class="section-title">⚙️ WARNING THRESHOLD CONFIGURATION (THRESHOLD)</div>
                <div class="input-group">
                    <div class="input-wrapper">
                        <label>SO2 Threshold</label>
                        <div class="input-box"><input type="number" id="limit-so2-${d.deviceId}" value="${limitSo2}" step="0.1" ${!isOnline ? 'disabled' : ''}><span>ppm</span></div>
                    </div>
                    <div class="input-wrapper">
                        <label>Dust Threshold (PM)</label>
                        <div class="input-box"><input type="number" id="limit-pm-${d.deviceId}" value="${limitPm}" ${!isOnline ? 'disabled' : ''}><span>µg/m³</span></div>
                    </div>
                </div>
                <button class="btn-apply ${!isOnline ? 'btn-disabled' : ''}" onclick="applyThreshold('${d.deviceId}')" ${!isOnline ? 'disabled' : ''}>Apply Config to Gateway</button>
            </div>

            <div class="card-actions">
                <button class="btn-action" onclick="window.renameDevice('${d.deviceId}', '${d.name || ''}')">✏️ Rename</button>
                <button class="btn-action btn-wifi" onclick="navigate('/network')">🔄 Reset WiFi</button>
            </div>
        </div>
        `;
    });
};

window.renameDevice = async (deviceId, currentName) => {
    const newName = prompt('Enter new name for device:', currentName);
    if (!newName || newName.trim() === '' || newName === currentName) return;

    try {
        const res = await fetch('/api/device/' + deviceId + '/rename', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + state.token
            },
            body: JSON.stringify({ name: newName.trim() })
        });
        
        if (res.ok) {
            showToast('Rename thiết bị thành công!');
            // Load lại danh sách devices
            loadDevicesData();
        } else {
            const err = await res.json();
            showToast(err.message || 'Error renaming device', true);
        }
    } catch (e) {
        showToast('Error kết nối mạng', true);
    }
};

const loadNetworkData = async () => {
    try {
        const res = await fetch('/api/device/my-devices', {
            headers: { 'Authorization': 'Bearer ' + state.token }
        });
        if (res.ok) {
            const devices = await res.json();
            const select = document.getElementById('netDeviceId');
            const placeholder = '<option value="">-- Select Gateway --</option>';
            if (select) {
                select.innerHTML = placeholder;
                devices.forEach(d => {
                    const statusStr = d.status === 'online' ? '🟢 Online' : '🔴 Offline';
                    const optStr = `<option value="${d.deviceId}" data-status="${d.status}">${d.name} (${d.deviceId}) - ${statusStr}</option>`;
                    select.innerHTML += optStr;
                });

                select.addEventListener('change', function() {
                    const selectedOption = this.options[this.selectedIndex];
                    if (!selectedOption || !selectedOption.value) return;
                    
                    const status = selectedOption.getAttribute('data-status');
                    const ssidInput = document.getElementById('netSSID');
                    const passInput = document.getElementById('netPass');
                    const btnSubmit = document.getElementById('btnSubmitNetwork');

                    if (status === 'offline') {
                        if (ssidInput) ssidInput.disabled = true;
                        if (passInput) passInput.disabled = true;
                        if (btnSubmit) {
                            btnSubmit.disabled = true;
                            btnSubmit.style.opacity = '0.5';
                            btnSubmit.innerText = 'GATEWAY IS OFFLINE';
                        }
                    } else {
                        if (ssidInput) ssidInput.disabled = false;
                        if (passInput) passInput.disabled = false;
                        if (btnSubmit) {
                            btnSubmit.disabled = false;
                            btnSubmit.style.opacity = '1';
                            btnSubmit.innerText = 'SEND CONFIG TO DEVICE';
                        }
                    }
                });
            }
        }
    } catch (err) {
        showToast('Error loading device list', true);
    }

    document.getElementById('eyeNetPass').addEventListener('click', function () {
        const el = document.getElementById('netPass');
        if (el.type === 'password') {
            el.type = 'text';
            this.innerText = '🙈';
        } else {
            el.type = 'password';
            this.innerText = '👁️';
        }
    });

    const networkForm = document.getElementById('networkForm');
    const confirmModal = document.getElementById('confirmModal');
    const btnCancelModal = document.getElementById('btnCancelModal');
    const btnConfirmModal = document.getElementById('btnConfirmModal');

    networkForm.addEventListener('submit', (e) => {
        e.preventDefault();
        confirmModal.style.display = 'flex';
    });

    btnCancelModal.addEventListener('click', () => {
        confirmModal.style.display = 'none';
    });

    btnConfirmModal.addEventListener('click', async () => {
        confirmModal.style.display = 'none';
        const deviceId = document.getElementById('netDeviceId').value;
        const ssid = document.getElementById('netSSID').value;
        const password = document.getElementById('netPass').value;

        const btnSubmit = document.getElementById('btnSubmitNetwork');
        btnSubmit.innerText = "ĐANG TRUYỀN LỆNH MQTT...";
        try {
            const res = await fetch('/api/device/change-wifi', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
                body: JSON.stringify({ deviceId, ssid, password })
            });
            const data = await res.json();

            if (res.ok) {
                showToast(data.message || 'Gửi lệnh cấu hình mạng thành công!');
                networkForm.reset();
            } else {
                showToast(data.message || 'Có lỗi xảy ra', true);
            }
        } catch (err) {
            showToast('API / MQTT Offline', true);
        } finally {
            btnSubmit.innerText = "SEND CONFIG TO DEVICE";
        }
    });

    // --- LOGIC GỬI CẤU HÌNH OTA ---
    document.getElementById('eyeOtaPass').addEventListener('click', function () {
        const el = document.getElementById('otaPass');
        if (el.type === 'password') {
            el.type = 'text';
            this.innerText = '🙈';
        } else {
            el.type = 'password';
            this.innerText = '👁️';
        }
    });

    const otaForm = document.getElementById('otaForm');
    otaForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        const deviceId = document.getElementById('otaDeviceId').value;
        const hostname = document.getElementById('otaHostname').value;
        const password = document.getElementById('otaPass').value;

        const btnSubmit = document.getElementById('btnSubmitOta');
        btnSubmit.innerText = "ĐANG TRUYỀN LỆNH MQTT...";
        try {
            const res = await fetch('/api/device/change-ota', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + state.token },
                body: JSON.stringify({ deviceId, hostname, password })
            });
            const data = await res.json();

            if (res.ok) {
                showToast(data.message || 'Cập nhật phân quyền OTA xuống chip thành công!');
                otaForm.reset();
            } else {
                showToast(data.message || 'Error xử lý OTA từ Broker', true);
            }
        } catch (err) {
            showToast('API / MQTT Offline', true);
        } finally {
            btnSubmit.innerText = "GỬI LỆNH ĐỔI OTA XUỐNG THIẾT BỊ";
        }
    });
};

const loadSettingsData = async () => {
    try {
        const res = await fetch('/api/user/profile', {
            headers: { 'Authorization': "Bearer " + state.token }
        });
        const user = await res.json();
        if (res.ok) {
            document.getElementById('profileEmail').value = user.email;
            document.getElementById('profileName').value = user.name;
            if (user.phone) document.getElementById('profilePhone').value = user.phone;

            // Hiện các menu của Admin
            if (user.role === 'admin') {
                const navUsers = document.getElementById('nav-users');
                if (navUsers) navUsers.style.display = 'flex';
                const navDevices = document.getElementById('nav-devices');
                if (navDevices) navDevices.style.display = 'flex';
                const navNetwork = document.getElementById('nav-network');
                if (navNetwork) navNetwork.style.display = 'flex';
            }
        } else if (res.status === 401) {
            localStorage.removeItem('scada_token');
            navigate('/');
            return showToast('JWT Expired!', true);
        }
    } catch (err) {
        showToast('Error loading config: Server Offline', true);
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnUpdateProfile');
        btn.innerText = "ĐANG TẢI...";
        const newName = document.getElementById('profileName').value;
        const newPhone = document.getElementById('profilePhone').value;
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + state.token },
                body: JSON.stringify({ name: newName, phone: newPhone })
            });
            if (res.ok) {
                showToast('Information updated successfully!');
            } else {
                showToast('Cập nhật thất bại', true);
            }
        } catch (e) {
            showToast('Error gửi request', true);
        } finally {
            btn.innerText = "CẬP NHẬT THÔNG TIN";
        }
    });

    document.getElementById('passwordForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const oldPassword = document.getElementById('oldPassword').value;
        const newPassword = document.getElementById('newPassword').value;
        const confirmPassword = document.getElementById('confirmPassword').value;

        if (newPassword !== confirmPassword) {
            return showToast('Mật khẩu mới không khớp!', true);
        }

        const btn = document.getElementById('btnUpdatePassword');
        btn.innerText = "ĐANG ĐỔI...";
        try {
            const res = await fetch('/api/user/change-password', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + state.token },
                body: JSON.stringify({ oldPassword, newPassword })
            });
            const data = await res.json();
            if (res.ok) {
                showToast('Đổi mật khẩu thành công!');
                document.getElementById('passwordForm').reset();
            } else {
                showToast(data.message || 'Sai mật khẩu hiện tại', true);
            }
        } catch (e) {
            showToast('Error gửi request', true);
        } finally {
            btn.innerText = "ĐỔI MẬT KHẨU";
        }
    });
};

const loadUsersData = () => {
    fetchUsersList();

    const form = document.getElementById('adminCreateUserForm');
    if (form) {
        form.addEventListener('submit', async (e) => {
            e.preventDefault();
            const btn = form.querySelector('button');
            btn.innerText = "ĐANG TẠO...";
            const name = document.getElementById('adminNewName').value;
            const email = document.getElementById('adminNewEmail').value;
            const password = document.getElementById('adminNewPassword').value;
            const role = document.getElementById('adminNewRole') ? document.getElementById('adminNewRole').value : 'user';

            try {
                const res = await fetch('/api/auth/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + state.token },
                    body: JSON.stringify({ name, email, password, role })
                });
                if (res.ok) {
                    showToast('Tạo tài khoản thành công!');
                    form.reset();
                    fetchUsersList();
                } else {
                    const err = await res.json();
                    showToast(err.message || 'Error tạo tài khoản', true);
                }
            } catch (error) {
                showToast('Error kết nối Server', true);
            }
            btn.innerText = "Tạo Tài Khoản";
        });
    }
};

const fetchUsersList = async () => {
    try {
        const res = await fetch('/api/user', {
            headers: { 'Authorization': "Bearer " + state.token }
        });
        if (res.ok) {
            const users = await res.json();
            const tbody = document.getElementById('userListBody');
            if (tbody) {
                tbody.innerHTML = '';
                users.forEach(u => {
                    const tr = document.createElement('tr');
                    tr.innerHTML = `
                        <td style="color: #fff;">${u.name}</td>
                        <td style="color: #93c5fd;">${u.email}</td>
                        <td><span style="color: ${u.role === 'admin' ? '#fbbf24' : '#4ade80'}">${u.role.toUpperCase()}</span></td>
                        <td style="color: gray;">${new Date(u.createdAt).toLocaleDateString('vi-VN')}</td>
                        <td style="text-align: right;">
                            <button class="btn-primary" onclick="resetUserPassword('${u._id}', '${u.name}')" style="padding: 5px 10px; background: #3b82f6; border: none; color: white; border-radius: 4px; cursor: pointer; margin-right: 5px;">Đổi MK</button>
                            <button class="btn-danger" onclick="deleteUser('${u._id}')" style="padding: 5px 10px; background: #dc2626; border: none; color: white; border-radius: 4px; cursor: pointer;">Delete</button>
                        </td>
                    `;
                    tbody.appendChild(tr);
                });
            }
        }
    } catch (e) {
        console.error(e);
    }
};

window.deleteUser = async (id) => {
    if (!confirm('Bạn có chắc chắn muốn xóa tài khoản này?')) return;
    try {
        const res = await fetch('/api/user/' + id, {
            method: 'DELETE',
            headers: { 'Authorization': "Bearer " + state.token }
        });
        if (res.ok) {
            showToast('Account deleted!');
            fetchUsersList();
        } else {
            const err = await res.json();
            showToast(err.message || 'Error khi xóa', true);
        }
    } catch (e) {
        showToast('Network error', true);
    }
};

window.resetUserPassword = async (id, name) => {
    const newPassword = prompt(`Nhập mật khẩu mới cho nhân viên ${name}:\n(Mật khẩu sẽ hiển thị rõ khi bạn gõ ở đây)`);
    if (!newPassword) return; // Cancelled or empty
    if (newPassword.length < 6) return showToast('Mật khẩu phải từ 6 ký tự trở lên', true);

    try {
        const res = await fetch('/api/user/' + id + '/reset-password', {
            method: 'PUT',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': "Bearer " + state.token 
            },
            body: JSON.stringify({ newPassword })
        });
        if (res.ok) {
            showToast(`Đã đặt lại MK cho ${name} thành: ${newPassword}`);
        } else {
            const err = await res.json();
            showToast(err.message || 'Error khi đặt lại mật khẩu', true);
        }
    } catch(e) {
        showToast('Network error', true);
    }
};

// Khởi tạo app
const initApp = async () => {
    window.addEventListener('hashchange', handleRoute);
    
    // --- Tính năng Đồng bộ thời gian thực chuẩn mạng ---
    let timeOffset = 0;
    const syncNetworkTime = async () => {
        try {
            const res = await fetch('http://worldtimeapi.org/api/timezone/Asia/Ho_Chi_Minh');
            if (res.ok) {
                const data = await res.json();
                const serverTime = new Date(data.datetime).getTime();
                const localTime = Date.now();
                timeOffset = serverTime - localTime;
            }
        } catch (e) {
            console.warn('Cannot sync network time, using local time');
        }
    };
    
    // Gọi đồng bộ ngay lúc tải trang
    syncNetworkTime();
    
    // Bắt đầu nhịp tim đồng hồ
    setInterval(() => {
        const clockEl = document.getElementById('server-clock');
        if (clockEl) {
            const currentTime = new Date(Date.now() + timeOffset);
            clockEl.innerText = currentTime.toLocaleTimeString('en-GB');
        }
    }, 1000);
    // ----------------------------------------------------
    
    if (state.token) {
        try {
            const res = await fetch('/api/user/profile', {
                headers: { 'Authorization': "Bearer " + state.token }
            });
            if (res.ok) {
                state.user = await res.json();
                if (state.user.role === 'admin') {
                    const navUsers = document.getElementById('nav-users');
                    if (navUsers) navUsers.style.display = 'flex';
                    const navDevices = document.getElementById('nav-devices');
                    if (navDevices) navDevices.style.display = 'flex';
                    const navNetwork = document.getElementById('nav-network');
                    if (navNetwork) navNetwork.style.display = 'flex';
                }
            } else if (res.status === 401) {
                localStorage.removeItem('scada_token');
                state.token = null;
            }
        } catch (e) { }
    }
    
    handleRoute(); // Inject DOM sau khi đã fetch xong Profile
};

initApp();
