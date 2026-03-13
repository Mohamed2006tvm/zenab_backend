const express = require('express');
const router = express.Router();
const Telemetry = require('../models/Telemetry');

// @route   POST /api/telemetry
// @desc    Receive telemetry data from hardware
// @access  Public (Hardware usually sends with a token or simple key)
router.post('/', async (req, res) => {
    try {
        const data = req.body;
        
        // Handle both single object and array of objects
        if (Array.isArray(data)) {
            const formattedData = data.map(item => ({
                deviceId: item.device_id,
                timestamp: item.timestamp,
                aqi: item.aqi,
                pm25: item.pm25,
                temperature: item.temperature,
                humidity: item.humidity,
                oxygen: item.oxygen,
                location: {
                    lat: item.latitude,
                    lng: item.longitude
                },
                power: item.power,
                status: item.status
            }));
            await Telemetry.insertMany(formattedData);
        } else {
            const telemetry = new Telemetry({
                deviceId: data.device_id,
                timestamp: data.timestamp,
                aqi: data.aqi,
                pm25: data.pm25,
                temperature: data.temperature,
                humidity: data.humidity,
                oxygen: data.oxygen,
                location: {
                    lat: data.latitude,
                    lng: data.longitude
                },
                power: data.power,
                status: data.status
            });
            await telemetry.save();
        }

        res.status(201).json({ success: true, message: 'Telemetry received' });
    } catch (err) {
        console.error('Telemetry Error:', err.message);
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

// @route   GET /api/telemetry/:deviceId
// @desc    Get telemetry history for a device
// @access  Public (or protected)
router.get('/:deviceId', async (req, res) => {
    try {
        const history = await Telemetry.find({ deviceId: req.params.deviceId })
            .sort({ timestamp: -1 })
            .limit(100);
        res.json(history);
    } catch (err) {
        res.status(500).json({ success: false, error: 'Server error' });
    }
});

module.exports = router;
