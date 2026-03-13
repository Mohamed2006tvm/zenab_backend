const mongoose = require('mongoose');

const stationSchema = new mongoose.Schema({
    city: { type: String, required: true },
    state: { type: String, required: true },
    lat: { type: Number, required: true },
    lng: { type: Number, required: true },
    aqi: { type: Number, required: true },
    pm25: { type: Number },
    pm10: { type: Number },
    o3: { type: Number },
    no2: { type: Number },
    so2: { type: Number },
    co: { type: Number },
    status: { type: String, required: true },
    trend: { type: [mongoose.Schema.Types.Mixed], default: [] },
    updated_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Station', stationSchema);
