const Telemetry = require('../models/Telemetry');
const Alert = require('../models/Alert');

exports.getStats = async (req, res) => {
    try {
        const { deviceId, nodeId, timeRange, statType } = req.query;
        if (!deviceId) return res.status(400).json({ message: 'deviceId is required' });

        const nId = parseInt(nodeId) || 1;
        let startDate = new Date();
        const now = new Date();
        
        let labels = [];
        let so2Data = [];
        let pm25Data = [];
        
        // Build buckets in Javascript for safety and exact matching
        let buckets = [];
        let stepMs = 0;
        
        if (timeRange === 'day') {
            // Last 24 hours in 4-hour buckets
            stepMs = 4 * 60 * 60 * 1000;
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
            for(let i=0; i<6; i++) {
                let d = new Date(startDate.getTime() + i*stepMs);
                buckets.push({ start: d, end: new Date(d.getTime() + stepMs), so2: [], pm25: [], label: d.getHours() + 'h' });
            }
        } else if (timeRange === 'month') {
            // Last 4 weeks
            stepMs = 7 * 24 * 60 * 60 * 1000;
            startDate = new Date(now.getTime() - 28 * 24 * 60 * 60 * 1000);
            for(let i=0; i<4; i++) {
                let d = new Date(startDate.getTime() + i*stepMs);
                buckets.push({ start: d, end: new Date(d.getTime() + stepMs), so2: [], pm25: [], label: 'Tuần ' + (i+1) });
            }
        } else if (timeRange === 'year') {
            // Last 12 months
            startDate.setFullYear(now.getFullYear() - 1);
            for(let i=0; i<12; i++) {
                let d = new Date(startDate);
                d.setMonth(d.getMonth() + i);
                let e = new Date(d);
                e.setMonth(e.getMonth() + 1);
                buckets.push({ start: d, end: e, so2: [], pm25: [], label: 'T' + (d.getMonth() + 1) });
            }
        } else {
            // week (default) - Last 7 days
            stepMs = 24 * 60 * 60 * 1000;
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
            const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
            for(let i=0; i<7; i++) {
                let d = new Date(startDate.getTime() + i*stepMs);
                buckets.push({ start: d, end: new Date(d.getTime() + stepMs), so2: [], pm25: [], label: days[d.getDay()] });
            }
        }

        const data = await Telemetry.find({
            'metadata.deviceId': deviceId,
            'metadata.nodeId': nId,
            timestamp: { $gte: startDate }
        }).sort({ timestamp: 1 }).lean();

        // Put data into buckets
        data.forEach(row => {
            const t = row.timestamp.getTime();
            const b = buckets.find(bk => t >= bk.start.getTime() && t < bk.end.getTime());
            if (b) {
                b.so2.push(row.so2);
                b.pm25.push(row.pm25);
            }
        });

        // Aggregate
        buckets.forEach(b => {
            labels.push(b.label);
            if (b.so2.length === 0) {
                so2Data.push(0);
                pm25Data.push(0);
            } else {
                if (statType === 'max') {
                    so2Data.push(Math.max(...b.so2));
                    pm25Data.push(Math.max(...b.pm25));
                } else if (statType === 'min') {
                    so2Data.push(Math.min(...b.so2));
                    pm25Data.push(Math.min(...b.pm25));
                } else {
                    // avg
                    so2Data.push(b.so2.reduce((a,v)=>a+v,0) / b.so2.length);
                    pm25Data.push(b.pm25.reduce((a,v)=>a+v,0) / b.pm25.length);
                }
            }
        });

        // Format floats
        so2Data = so2Data.map(v => parseFloat(v.toFixed(1)));
        pm25Data = pm25Data.map(v => parseFloat(v.toFixed(1)));

        res.json({ labels, so2: so2Data, pm25: pm25Data });

    } catch (err) {
        console.error('Stats Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getAlerts = async (req, res) => {
    try {
        const { deviceId } = req.query;
        if (!deviceId) return res.status(400).json({ message: 'deviceId is required' });

        const alerts = await Alert.find({ deviceId })
            .sort({ timestamp: -1 })
            .limit(50)
            .lean();
            
        res.json(alerts);
    } catch (err) {
        console.error('Alerts Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};

exports.getUptime = async (req, res) => {
    try {
        const { deviceId, timeRange } = req.query;
        if (!deviceId) return res.status(400).json({ message: 'deviceId is required' });

        let startDate = new Date();
        const now = new Date();

        if (timeRange === 'day') {
            startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000);
        } else if (timeRange === 'month') {
            startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        } else if (timeRange === 'year') {
            startDate.setFullYear(now.getFullYear() - 1);
        } else {
            // week (default)
            startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        }

        // Count only "device_offline" or connection errors (Mất kết nối)
        const incidents = await Alert.find({
            deviceId,
            timestamp: { $gte: startDate },
            type: { $in: ['connection', 'device_offline'] },
            isResolved: false // 'Mất kết nối' is isResolved: false, 'Đã kết nối lại' is isResolved: true
        }).lean();

        let gwIncidents = 0;
        let node1Incidents = 0;
        let node2Incidents = 0;

        incidents.forEach(inc => {
            if (inc.message.includes('Gateway')) gwIncidents++;
            else if (inc.message.includes('Node 1') || inc.nodeId === 1) node1Incidents++;
            else if (inc.message.includes('Node 2') || inc.nodeId === 2) node2Incidents++;
        });

        res.json({
            gateway: gwIncidents,
            node1: node1Incidents,
            node2: node2Incidents
        });

    } catch (err) {
        console.error('Uptime Error:', err);
        res.status(500).json({ message: 'Server error' });
    }
};
