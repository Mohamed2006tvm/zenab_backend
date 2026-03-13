const express = require('express');
const router = express.Router();
const Station = require('../models/Station');
const { protect } = require('../middleware/authMiddleware');

// Apply protection to all report routes
router.use(protect);

// GET daily report - all cities with AQI data
router.get('/daily', async (req, res) => {
  try {
    const stations = await Station.find().sort({ aqi: -1 });

    const report = stations.map((s) => ({
      city: s.city,
      state: s.state,
      aqi: s.aqi,
      pm25: s.pm25,
      pm10: s.pm10,
      no2: s.no2,
      o3: s.o3,
      status: s.status,
      date: new Date().toISOString().split('T')[0],
    }));
    res.json(report);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET top 10 most polluted cities
router.get('/top-polluted', async (req, res) => {
  try {
    const stations = await Station.find().sort({ aqi: -1 }).limit(10);

    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET cleanest cities
router.get('/cleanest', async (req, res) => {
  try {
    const stations = await Station.find().sort({ aqi: 1 }).limit(10);

    res.json(stations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
