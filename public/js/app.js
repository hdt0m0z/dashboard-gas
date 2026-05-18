import { LoginPage, RegisterPage, SidebarLayout, DashboardPage, BlankPage, SettingsPage, NetworkPage, DevicesPage,AccessControlPage,ReportPage } from './pages.js';

// --- SYSTEM STATE ---
// Bắt dữ liệu JWT Token nếu Google OAuth trả về qua link redirection
const urlParams = new URLSearchParams(window.location.search);
const loginToken = urlParams.get('token');
if (loginToken) {
    localStorage.setItem('scada_token', loginToken);
    // Xóa Token khỏi thanh URL cho đẹp và bảo mật
    window.history.replaceState({}, document.title, window.location.pathname);
}

const state = {
token: localStorage.getItem('scada_token') || null,
    socket: null,
    currentRoom: null, // Vẫn giữ cho tính năng chọn Gateway
    dashboard: {
        charts: { so2: null, pm10: null, pm25: null, pm1: null },
        maxDataPoints: 20 // Giới hạn số điểm trên biểu đồ live
    },
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
    
    // Xóa form và ẩn modal
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

    // 2. Wrap HTML inside the layout content-area
    root.innerHTML = SidebarLayout;
    setupSidebarEvents(path);

    // Core Socket initialization must inject outside Dashboard component scope
    if (!state.socket) {
        setupSocket();
    }

    const contentArea = document.getElementById('content-area');

    switch (path) {
        case '/dashboard':
            contentArea.innerHTML = DashboardPage;
            initSCADADashboard();
            break;
        case '/devices':
            contentArea.innerHTML = DevicesPage;
            loadDevicesData();
            break;
        case '/share':
            contentArea.innerHTML = AccessControlPage;
            break;
        case '/network':
            contentArea.innerHTML = NetworkPage;
            loadNetworkData();
            break;
        case '/report':
            contentArea.innerHTML = ReportPage;
            loadNetworkData();
            break;
        case '/settings':
            contentArea.innerHTML = SettingsPage;
            loadSettingsData();
            break;
        default:
            contentArea.innerHTML = BlankPage('404 Not Found', 'Không tìm thấy trang yêu cầu.');
            break;
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
    const regForm = document.getElementById('registerForm');
    if (!regForm) return;

    const pwdInput = document.getElementById('regPassword');
    const confInput = document.getElementById('regConfirm');
    const matchError = document.getElementById('matchError');
    const btnSubmit = document.getElementById('btnRegisterSubmit');

    const ruleLength = document.getElementById('ruleLength');
    const ruleUpper = document.getElementById('ruleUpper');
    const ruleLower = document.getElementById('ruleLower');
    const ruleNumber = document.getElementById('ruleNumber');
    const ruleSpecial = document.getElementById('ruleSpecial');

    // Icon Show/Hide Password Toggle
    const setupEye = (eyeId, inputId) => {
        document.getElementById(eyeId).addEventListener('click', function () {
            const el = document.getElementById(inputId);
            if (el.type === 'password') {
                el.type = 'text';
                this.innerText = '🙈';
            } else {
                el.type = 'password';
                this.innerText = '👁️';
            }
        });
    };
    setupEye('eyePassword', 'regPassword');
    setupEye('eyeConfirm', 'regConfirm');

    let isPwdOk = false;
    let isMatchOk = false;

    const validateForm = () => {
        if (isPwdOk && isMatchOk) {
            btnSubmit.disabled = false;
            btnSubmit.style.background = 'var(--color-safe)';
            btnSubmit.style.cursor = 'pointer';
        } else {
            btnSubmit.disabled = true;
            btnSubmit.style.background = '#555';
            btnSubmit.style.cursor = 'not-allowed';
        }
    };

    const updateRuleUI = (element, isValid) => {
        if (isValid) {
            element.style.color = 'var(--color-safe)';
            element.innerText = '✔ ' + element.innerText.substring(2);
        } else {
            element.style.color = 'gray';
            element.innerText = '○ ' + element.innerText.substring(2);
        }
    };

    // Real-Time Evaluation
    pwdInput.addEventListener('input', () => {
        const val = pwdInput.value;
        const c1 = val.length >= 8;
        const c2 = /[A-Z]/.test(val);
        const c3 = /[a-z]/.test(val);
        const c4 = /[0-9]/.test(val);
        const c5 = /[!@#$%^&*(),.?":{}|<>]/.test(val);

        updateRuleUI(ruleLength, c1);
        updateRuleUI(ruleUpper, c2);
        updateRuleUI(ruleLower, c3);
        updateRuleUI(ruleNumber, c4);
        updateRuleUI(ruleSpecial, c5);

        isPwdOk = c1 && c2 && c3 && c4 && c5;

        if (confInput.value) checkMatch();
        validateForm();
    });

    const checkMatch = () => {
        if (confInput.value === pwdInput.value) {
            matchError.style.display = 'none';
            isMatchOk = true;
        } else {
            matchError.style.display = 'block';
            isMatchOk = false;
        }
    };

    confInput.addEventListener('input', () => {
        checkMatch();
        validateForm();
    });

    // Form Submission Trigger
    regForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        if (!isPwdOk || !isMatchOk) return;

        const email = document.getElementById('regEmail').value;
        const password = pwdInput.value;
        const name = document.getElementById('regName').value;
        const phone = document.getElementById('regPhone').value;
        const department = document.getElementById('regDept').value;

        btnSubmit.innerText = "ĐANG ĐĂNG KÝ...";
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, name, phone, department })
            });
            const data = await res.json();

            if (res.ok) {
                showToast('Đăng ký thành công! Đang vào Dashboard...');
                localStorage.setItem('scada_token', data.token);
                setTimeout(() => {
                    navigate('/dashboard');
                    window.location.reload();
                }, 1000);
            } else {
                showToast(data.message || 'Lỗi đăng ký, Email đã tồn tại!', true);
            }
        } catch (err) {
            showToast('Lỗi gửi request', true);
        } finally {
            btnSubmit.innerText = "ĐĂNG KÝ";
        }
    });
};

const setupSidebarEvents = (currentPath) => {
    document.querySelectorAll('.nav-item').forEach(el => {
        if (el.getAttribute('data-route') === currentPath) el.classList.add('active');
        el.addEventListener('click', () => navigate(el.getAttribute('data-route')));
    });

    document.getElementById('btn-logout').addEventListener('click', () => {
        localStorage.removeItem('scada_token');
        state.token = null;
        if (state.socket) {
            state.socket.disconnect();
            state.socket = null;
        }
        navigate('/');
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
                    { label: `${label} Zone A`, data: [], borderColor: '#22d3ee', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3 },
                    { label: `${label} Zone B`, data: [], borderColor: '#fbbf24', backgroundColor: 'transparent', borderWidth: 2, tension: 0.3 }
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
    window.setTimeRange = (chartId, points, btnElement) => {
        state.dashboard.maxDataPoints = points;
        // Đổi UI nút bấm
        const container = btnElement.parentElement;
        container.querySelectorAll('.time-btn').forEach(btn => btn.classList.remove('active'));
        btnElement.classList.add('active');
        showToast(`Đã chuyển sang chế độ hiển thị ${btnElement.innerText}`);
    };

    window.applyZoneFilter = (zone) => {
        // Mở rộng sau: Ẩn/hiện dataset tương ứng trong Chart dựa vào value 'all', 'z1', 'z2'
        showToast(`Đang lọc hiển thị: ${zone}`);
    };

    window.applyAlertFilter = () => { /* Logic lọc bảng nhật ký */ };
    window.updateStatsChart = () => { /* Logic cập nhật biểu đồ thống kê lưu lượng */ };
    window.updateUptimeChart = () => { /* Logic biểu đồ độ ổn định */ };

    // Mặc định ép cả 2 trạm thành Offline lúc vừa mở trang
    setZoneOffline(1);
    setZoneOffline(2);
};

const setupSocket = () => {
    if (!state.socket) {
        state.socket = io(window.location.origin, {
            auth: { token: state.token } // Authentication JWT requirement
        });

        state.socket.on('connect', () => {
            const led = document.getElementById('gw-server-led');
            if (led) led.className = 'led-indicator led-online';

            const text = document.getElementById('gw-server-text');
            if (text) {
                text.innerText = 'WebSocket Server: ĐÃ KẾT NỐI';
                text.style.color = 'var(--color-safe)';
            }

            const targetInput = document.getElementById('targetDeviceId');
            if (targetInput) {
                const targetId = targetInput.value.trim();
                state.socket.emit('join_device', targetId);
                state.currentRoom = targetId;
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
        state.socket.on('connect_error', (err) => {
            showToast('Lỗi JWT Token hoặc Timeout: ' + err.message, true);
            const led = document.getElementById('gw-server-led');
            if (led) led.className = 'led-indicator led-offline';

            const text = document.getElementById('gw-server-text');
            if (text) {
                text.innerText = 'WebSocket Server: MẤT KẾT NỐI';
                text.style.color = 'var(--color-danger)';
            }
            if (document.getElementById('pipe-1')) {
                setZoneOffline(1);
                setZoneOffline(2);
            }
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

            const statusEl = document.getElementById(`status-${data.deviceId}`);
            if (statusEl) {
                console.log(`[CLIENT-DEBUG] Đã tìm thấy DOM Element: status-${data.deviceId}. Triển khai vẽ màu Xanh...`);
                const isOnline = data.status === 'online';
                const color = isOnline ? 'var(--color-safe)' : 'var(--color-danger)';
                const statusText = isOnline ? 'ONLINE' : 'OFFLINE';

                statusEl.style.color = color;
                statusEl.style.borderColor = color;
                statusEl.innerText = `● ${statusText}`;

                if (!isOnline) {
                    document.getElementById(`wifi-${data.deviceId}`).innerHTML = `📶 Mạng: <strong style="color:gray;">Mất tín hiệu</strong>`;
                    document.getElementById(`lora-${data.deviceId}`).innerHTML = `📟 Số Node LoRa: <strong style="color:gray;">N/A</strong>`;
                    return;
                }

                document.getElementById(`wifi-${data.deviceId}`).innerHTML = `📶 Mạng: <strong style="color:white;">${data.wifi_ssid || 'N/A'}</strong> <span style="font-size:12px; color:gray;">(${data.wifi_rssi || 0} dBm)</span>`;
                document.getElementById(`lora-${data.deviceId}`).innerHTML = `📟 Số Node LoRa: <strong style="color:white;">${data.lora_nodes_count || 0} Nodes</strong>`;
            } else {
                console.warn(`[CLIENT-DEBUG] Lỗi Lệch Khuôn: Máy chủ giao lệnh render id=status-${data.deviceId} nhưng ID này không tìm thấy trên màn hình Grid!`);
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

    // 4. (Tùy chọn) Chuyển dữ liệu về -- nếu muốn
    // document.getElementById(`val-so2-${zId}`).innerText = '--';
    // document.getElementById(`val-pm25-${zId}`).innerText = '--';
};
const updateDashboardUI = (data) => {
    // Dữ liệu giả định từ payload MQTT/Socket
    const { SO2, PM2_5, PM10, PM1, timestamp, node } = data; 
    
    // Node 1 là Zone A, Node 2 là Zone B
    const zId = (node === 1 || node === 'A') ? 1 : 2;

    // Bảo vệ DOM: Kiểm tra xem user có đang ở trang Dashboard không
    if (!document.getElementById(`val-so2-${zId}`)) return;
    // Khi có data tới, chuyển status thành ONLINE màu xanh
    const statusEl = document.getElementById(`status-${zId}`);
    if (statusEl) {
        statusEl.innerText = '● CONNECTED';
        statusEl.style.color = 'var(--safe-glow)';
    }
    // 1. Cập nhật Số liệu Text
    document.getElementById(`val-so2-${zId}`).innerText = SO2.toFixed(1);
    document.getElementById(`val-pm25-${zId}`).innerText = PM2_5.toFixed(1);
    document.getElementById(`val-pm10-${zId}`).innerText = (PM10 || 0).toFixed(1);
    document.getElementById(`val-pm1-${zId}`).innerText = (PM1 || 0).toFixed(1);
    
    const timeFormatted = new Date(timestamp).toLocaleTimeString();
    document.getElementById(`time-${zId}`).innerText = timeFormatted;

    // 2. Logic Cảnh báo & Đổi màu ống khói
    const pipe = document.getElementById(`pipe-${zId}`);
    const base = document.getElementById(`base-${zId}`);
    const cellSo2 = document.getElementById(`cell-so2-${zId}`);
    const cellPm25 = document.getElementById(`cell-pm25-${zId}`);
    
    let isDanger = false;
    let isWarn = false;

    // Reset màu về Safe
    pipe.style.borderColor = 'var(--safe-glow)';
    pipe.style.boxShadow = 'none';
    base.style.borderColor = 'var(--safe-glow)';
    cellSo2.style.borderLeftColor = 'var(--safe-glow)';
    cellPm25.style.borderLeftColor = 'var(--safe-glow)';

    // Đánh giá SO2
    if (SO2 > 100) {
        isDanger = true;
        cellSo2.style.borderLeftColor = 'var(--danger-glow)';
    } else if (SO2 > 50) {
        isWarn = true;
        cellSo2.style.borderLeftColor = 'var(--warn-glow)';
    }

    // Đánh giá PM2.5
    if (PM2_5 > 250) {
        isDanger = true;
        cellPm25.style.borderLeftColor = 'var(--danger-glow)';
    } else if (PM2_5 > 100) {
        isWarn = true;
        cellPm25.style.borderLeftColor = 'var(--warn-glow)';
    }

    // Áp dụng màu cho Ống khói
    if (isDanger) {
        pipe.style.borderColor = 'var(--danger-glow)';
        pipe.style.boxShadow = '0 0 15px var(--danger-glow)';
        base.style.borderColor = 'var(--danger-glow)';
    } else if (isWarn) {
        pipe.style.borderColor = 'var(--warn-glow)';
        pipe.style.boxShadow = '0 0 10px var(--warn-glow)';
        base.style.borderColor = 'var(--warn-glow)';
    }

    // 3. Đẩy dữ liệu vào 4 Biểu đồ
    updateChartData(state.dashboard.charts.so2, timeFormatted, SO2, zId);
    updateChartData(state.dashboard.charts.pm10, timeFormatted, PM10 || 0, zId);
    updateChartData(state.dashboard.charts.pm25, timeFormatted, PM2_5, zId);
    updateChartData(state.dashboard.charts.pm1, timeFormatted, PM1 || 0, zId);
    

};

// Hàm phụ trợ để push data vào Chart
const updateChartData = (chart, timeLabel, value, zId) => {
    if (!chart) return;
    
    const datasetIndex = zId - 1; // 0 cho Zone A, 1 cho Zone B

    // Cập nhật nhãn thời gian (chỉ lấy theo dataset của Zone A làm chuẩn)
    if (zId === 1 && chart.data.labels[chart.data.labels.length - 1] !== timeLabel) {
        chart.data.labels.push(timeLabel);
    }

    // Cập nhật giá trị
    chart.data.datasets[datasetIndex].data.push(value);

    // Cắt bớt mảng nếu vượt quá giới hạn hiển thị
    if (chart.data.labels.length > state.dashboard.maxDataPoints) {
        chart.data.labels.shift();
        chart.data.datasets[0].data.shift();
        chart.data.datasets[1].data.shift();
    }

    chart.update('none'); // Update nhẹ nhàng, không xài animation nặng
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
    } catch (e) {
        showToast('Lỗi tải danh sách thiết bị', true);
    }
};

const renderDevicesGrid = (devices) => {
    const grid = document.getElementById('devicesGrid');
    if (!grid) return;
    grid.innerHTML = '';

    if (devices.length === 0) {
        grid.innerHTML = '<div style="color:gray;">Trạm trống. Vui lòng bấm vào nút thêm trạm mới.</div>';
        return;
    }

    devices.forEach(d => {
        const isOnline = d.status === 'online';
        const statusClass = isOnline ? 'status-online' : 'status-offline';
        const statusText = isOnline ? '● ONLINE' : '○ OFFLINE';
        const wifiSsid = d.currentWifiSsid || d.wifi_ssid || 'N/A';
        const wifiRssi = d.wifiRssi || d.wifi_rssi || 0;
        const loraNodes = d.loraNodesCount || d.lora_nodes_count || 0;

        grid.innerHTML += `
        <div class="gw-card" id="card-${d.deviceId}">
            <div class="card-header">
                <div class="gw-title">
                    <div class="gw-name">🏭 ${d.name || 'Gateway Không Tên'}</div>
                    <div class="gw-id-badge">ID: ${d.deviceId} | MAC: N/A</div>
                </div>
                <div class="status-pill ${statusClass}" id="status-${d.deviceId}">${statusText}</div>
            </div>
            
            <div class="card-body">
                <div class="info-col">
                    <div class="info-label">Thông tin Mạng</div>
                    <div class="info-item" id="wifi-${d.deviceId}"><span class="info-icon">📡</span> <span class="info-val">${wifiSsid}</span></div>
                    <div class="info-item"><span class="info-icon">📶</span> <span class="info-val">${wifiRssi} dBm (Good)</span></div>
                    <div class="info-item"><span class="info-icon">🌐</span> <span class="info-val">192.168.10.250</span></div>
                    <div class="info-item"><span class="info-icon">⏱️</span> <span class="info-val">34h 16m</span></div>
                </div>
                <div class="info-col">
                    <div class="info-label">Trạng thái LoRa Nodes (2/2)</div>
                    <div class="info-item"><span class="node-dot bg-ok"></span> <span class="info-val">Zone A (Trạm 1)</span></div>
                    <div class="info-item"><span class="node-dot bg-ok"></span> <span class="info-val">Zone B (Trạm 2)</span></div>
                    <div class="info-item" style="margin-top: 15px;"><span class="info-icon">☁️</span> <span class="info-val" style="color:var(--text-dim); font-weight:normal;">MQTT: ${isOnline ? 'Connected (TLS)' : 'Disconnected'}</span></div>
                </div>
            </div>

            <div class="threshold-section">
                <div class="section-title">⚙️ CẤU HÌNH NGƯỠNG CẢNH BÁO (THRESHOLD)</div>
                <div class="input-group">
                    <div class="input-wrapper">
                        <label>Ngưỡng SO2</label>
                        <div class="input-box"><input type="number" id="limit-so2-${d.deviceId}" value="100.0" step="0.1" ${!isOnline ? 'disabled' : ''}><span>ppm</span></div>
                    </div>
                    <div class="input-wrapper">
                        <label>Ngưỡng Bụi (PM)</label>
                        <div class="input-box"><input type="number" id="limit-pm-${d.deviceId}" value="250" ${!isOnline ? 'disabled' : ''}><span>µg/m³</span></div>
                    </div>
                </div>
                <button class="btn-apply ${!isOnline ? 'btn-disabled' : ''}" onclick="applyThreshold('${d.deviceId}')" ${!isOnline ? 'disabled' : ''}>Áp dụng Cấu hình xuống Gateway</button>
            </div>

            <div class="card-actions">
                <button class="btn-action" onclick="showToast('Tính năng sửa thông tin')">✏️ Đổi tên</button>
                <button class="btn-action btn-wifi" onclick="navigate('/network')">🔄 Đặt lại WiFi</button>
                <button class="btn-action btn-danger" onclick="showToast('Tính năng xóa trạm')">🗑️ Xóa</button>
            </div>
        </div>
        `;
    });
};

const loadNetworkData = async () => {
    try {
        const res = await fetch('/api/device/my-devices', {
            headers: { 'Authorization': 'Bearer ' + state.token }
        });
        if (res.ok) {
            const devices = await res.json();
            const select = document.getElementById('netDeviceId');
            const otaSelect = document.getElementById('otaDeviceId');
            const placeholder = '<option value="">-- Chọn Gateway --</option>';
            select.innerHTML = placeholder;
            otaSelect.innerHTML = placeholder;
            devices.forEach(d => {
                const optStr = `<option value="${d.deviceId}">${d.name} (${d.deviceId})</option>`;
                select.innerHTML += optStr;
                otaSelect.innerHTML += optStr;
            });
        }
    } catch (err) {
        showToast('Lỗi tải danh sách thiết bị', true);
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
            btnSubmit.innerText = "GỬI CẤU HÌNH XUỐNG THIẾT BỊ";
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
                showToast(data.message || 'Lỗi xử lý OTA từ Broker', true);
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
            if (user.department) document.getElementById('profileDept').value = user.department;
        } else if (res.status === 401) {
            localStorage.removeItem('scada_token');
            navigate('/');
            return showToast('JWT Hết hạn!', true);
        }
    } catch (err) {
        showToast('Lỗi tải cấu hình: Server Offline', true);
    }

    document.getElementById('profileForm').addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = document.getElementById('btnUpdateProfile');
        btn.innerText = "ĐANG TẢI...";
        const newName = document.getElementById('profileName').value;
        const newPhone = document.getElementById('profilePhone').value;
        const newDept = document.getElementById('profileDept').value;
        try {
            const res = await fetch('/api/user/profile', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json', 'Authorization': "Bearer " + state.token },
                body: JSON.stringify({ name: newName, phone: newPhone, department: newDept })
            });
            if (res.ok) {
                showToast('Cập nhật thông tin thành công!');
            } else {
                showToast('Cập nhật thất bại', true);
            }
        } catch (e) {
            showToast('Lỗi gửi request', true);
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
            showToast('Lỗi gửi request', true);
        } finally {
            btn.innerText = "ĐỔI MẬT KHẨU";
        }
    });
};

window.addEventListener('hashchange', handleRoute);
handleRoute();
