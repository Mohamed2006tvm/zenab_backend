const express = require('express');
const router = express.Router();
const Station = require('../models/Station');

// GET all stations
router.get('/', async (req, res) => {
    try {
        const stations = await Station.find().sort({ aqi: -1 });
        res.json(stations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET station by ID
router.get('/:id', async (req, res) => {
    try {
        const station = await Station.findById(req.params.id);
        if (!station) return res.status(404).json({ error: 'Station not found' });
        res.json(station);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

// GET stations by city
router.get('/city/:city', async (req, res) => {
    try {
        const stations = await Station.find({
            city: { $regex: req.params.city, $options: 'i' }
        });
        res.json(stations);
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;
