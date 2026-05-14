import { LoginPage, RegisterPage, SidebarLayout, DashboardPage, BlankPage, SettingsPage, NetworkPage, DevicesPage } from './pages.js';

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
    currentRoom: null,
    chartInstance: null
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
            contentArea.innerHTML = BlankPage('🔗 Chia sẻ quyền', 'Khung nhập email để share quyền xem dashboard với Operator khác.');
            break;
        case '/network':
            contentArea.innerHTML = NetworkPage;
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
    // 1. Vẽ Biểu Đồ Config
    const ctx = document.getElementById('historyChart').getContext('2d');
    state.chartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: [],
            datasets: [
                { label: 'SO2 (ppm)', borderColor: '#4fc3f7', backgroundColor: '#4fc3f7', data: [], tension: 0.4 },
                { label: 'PM2.5 (µg/m³)', borderColor: '#ffb74d', backgroundColor: '#ffb74d', data: [], tension: 0.4 }
            ]
        },
        options: {
            responsive: true, maintainAspectRatio: false, color: '#fff',
            scales: {
                x: { ticks: { color: '#ccc' }, grid: { color: '#333' } },
                y: { ticks: { color: '#ccc' }, grid: { color: '#333' }, suggestedMax: 150 }
            },
            plugins: {
                title: { display: true, text: 'BIỂU ĐỒ SCADA THỜI GIAN THỰC', color: '#fff', font: { size: 16 } }
            }
        }
    });

    // 3. Cho phép Admin nhảy giữa các trạm để theo dõi ống khói khác nhau
    document.getElementById('btn-subscribe').addEventListener('click', () => {
        const targetId = document.getElementById('targetDeviceId').value.trim();
        if (!targetId) return;

        if (state.socket) {
            if (state.currentRoom) state.socket.emit('leave_device', state.currentRoom);
            state.socket.emit('join_device', targetId);
            state.currentRoom = targetId;
            showToast("Theo dõi Live: " + targetId);

            // Xóa chart khi đổi node
            state.chartInstance.data.labels = [];
            state.chartInstance.data.datasets.forEach(d => d.data = []);
            state.chartInstance.update();
        }
    });
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

        state.socket.on('connect_error', (err) => {
            showToast('Lỗi JWT Token hoặc Timeout: ' + err.message, true);
            const led = document.getElementById('gw-server-led');
            if (led) led.className = 'led-indicator led-offline';

            const text = document.getElementById('gw-server-text');
            if (text) {
                text.innerText = 'WebSocket Server: MẤT KẾT NỐI';
                text.style.color = 'var(--color-danger)';
            }
        });

        // Xử lý Lệnh Cập nhật Trạng thái Gateway
        state.socket.on('gateway_status', (data) => {
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

const updateDashboardUI = (data) => {
    const { SO2, PM2_5, timestamp, deviceId } = data;

    // Đảm bảo không render nhầm data node khác
    if (state.currentRoom !== deviceId) return;

    // Bảo vệ DOM nếu đang không nằm ở trang chứa Sensor UI
    if (!document.getElementById("param-so2-1")) return;

    document.getElementById("param-so2-1").innerText = "SO2: " + SO2 + " ppm";
    document.getElementById("param-pm25-1").innerText = "PM2.5: " + PM2_5 + " µg/m³";
    const timeFormatted = new Date(timestamp).toLocaleTimeString();
    document.getElementById("param-timestamp").innerText = "Cập nhật: " + timeFormatted;

    const pipe = document.getElementById('pipe-1');
    const base = document.getElementById('base-1');
    let color = 'var(--color-safe)';

    // Kiểm tra Cảnh báo: SO2 > 100, PM > 200 => Danger
    if (SO2 > 100 || PM2_5 > 200) {
        color = 'var(--color-danger)';
        showWarningAlert("⚠️ Lượng Khí Độc Nguy Hiểm! \nSO2: " + SO2 + ", PM: " + PM2_5);
    } else if (SO2 > 50 || PM2_5 > 100) {
        color = 'var(--color-warn)';
    }

    // Hiệu ứng Đổi màu ống khói
    pipe.style.borderColor = color;
    pipe.style.boxShadow = "0 0 15px " + color;
    base.style.borderColor = color;

    document.getElementById("param-so2-1").style.borderLeftColor = SO2 > 100 ? 'var(--color-danger)' : (SO2 > 50 ? 'var(--color-warn)' : 'var(--color-safe)');
    document.getElementById("param-pm25-1").style.borderLeftColor = PM2_5 > 200 ? 'var(--color-danger)' : (PM2_5 > 100 ? 'var(--color-warn)' : 'var(--color-safe)');

    // Cập nhật lên Graph (Giữ max 20 điểm)
    if (state.chartInstance) {
        if (state.chartInstance.data.labels.length > 20) {
            state.chartInstance.data.labels.shift();
            state.chartInstance.data.datasets[0].data.shift();
            state.chartInstance.data.datasets[1].data.shift();
        }
        state.chartInstance.data.labels.push(timeFormatted);
        state.chartInstance.data.datasets[0].data.push(SO2);
        state.chartInstance.data.datasets[1].data.push(PM2_5);
        state.chartInstance.update();
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
        const color = isOnline ? 'var(--color-safe)' : 'var(--color-danger)';
        const statusText = isOnline ? 'ONLINE' : 'OFFLINE';

        grid.innerHTML += `
        <div class="station-card" style="position:relative; display:flex; flex-direction:column; justify-content:space-between;" id="card-${d.deviceId}">
            <div>
                <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid #333; padding-bottom:10px; margin-bottom:15px;">
                    <h3 style="margin:0; color:#4fc3f7;">${d.name}</h3>
                    <div style="background:#222; padding:3px 8px; border-radius:12px; font-size:12px; border:1px solid ${color}; color:${color};" id="status-${d.deviceId}">
                        ● ${statusText}
                    </div>
                </div>
                
                <div style="color:#aaa; font-size:14px; margin-bottom:8px;">ID: <strong style="color:white;">${d.deviceId}</strong></div>
                <div style="color:#aaa; font-size:14px; margin-bottom:8px;" id="wifi-${d.deviceId}">
                    📶 Mạng: <strong style="color:white;">${d.currentWifiSsid || 'N/A'}</strong> 
                    <span style="font-size:12px; color:gray;">(${d.wifiRssi || 0} dBm)</span>
                </div>
                <div style="color:#aaa; font-size:14px; margin-bottom:8px;" id="lora-${d.deviceId}">📟 Số Node LoRa: <strong style="color:white;">${d.loraNodesCount || 0} Nodes</strong></div>
            </div>
            
            <div style="display:flex; gap:10px; margin-top:20px; border-top:1px solid #333; padding-top:15px;">
                <button class="btn-primary" style="flex:1; background:#333; font-size:13px; color:#fff;" onclick="showToast('Tính năng hiển thị tham số cài đặt thiết bị')">✏️ Sửa</button>
                <button class="btn-primary" style="flex:1; background:#333; font-size:13px; color:#fff;" onclick="navigate('/network')">📡 Wi-Fi</button>
                <button class="btn-primary" style="flex:1; background:#4a1c1c; font-size:13px; color:#ff4c4c;" onclick="showToast('Bạn không có quyền xóa Trạm chủ!')">🗑️ Xóa</button>
            </div>
        </div>
        `;

        // Tính năng mở room kết nối đã được thay thế bằng lệnh phát sóng WebSocket Toàn cầu (Global Broadcasts)
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
