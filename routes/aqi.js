const express = require('express');
const router = express.Router();
const Station = require('../models/Station');

// GET aggregate AQI summary stats
router.get('/summary', async (req, res) => {
    try {
        const stations = await Station.find();

        const total = stations.length;
        if (total === 0) {
            return res.json({ total: 0, avgAqi: 0, hazardous: 0, safe: 0, requireAttention: 0, topPolluted: [] });
        }

        const avgAqi = Math.round(stations.reduce((sum, s) => sum + s.aqi, 0) / total);
        const hazardous = stations.filter((s) => s.status === 'Hazardous' || s.status === 'Very Unhealthy').length;
        const safe = stations.filter((s) => s.status === 'Good' || s.status === 'Moderate').length;
        const requireAttention = stations.filter(
            (s) => s.status === 'Unhealthy' || s.status === 'Unhealthy for Sensitive Groups'
        ).length;

        const topPolluted = stations
            .sort((a, b) => b.aqi - a.aqi)
            .slice(0, 5)
            .map((s) => ({ city: s.city, state: s.state, aqi: s.aqi, status: s.status }));

        res.json({ total, avgAqi, hazardous, safe, requireAttention, topPolluted });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET 7-day trend data (simulated from station trend arrays)
router.get('/trend', async (req, res) => {
    try {
        const stations = await Station.find().select('aqi trend').limit(5);

        if (stations.length === 0) return res.json([]);

        const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
        const trend = days.map((day, i) => {
            const avgAqi = Math.round(
                stations.reduce((sum, s) => {
                    const t = s.trend && s.trend[i] ? s.trend[i].aqi : s.aqi;
                    return sum + t;
                }, 0) / stations.length
            );
            return { day, avgAqi };
        });
        res.json(trend);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
