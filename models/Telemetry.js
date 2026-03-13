const mongoose = require('mongoose');

const telemetrySchema = new mongoose.Schema({
    deviceId: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    aqi: { type: Number, required: true },
    pm25: { type: Number },
    temperature: { type: Number },
    humidity: { type: Number },
    oxygen: { type: Number },
    location: {
        lat: { type: Number },
        lng: { type: Number }
    },
    power: { type: String },
    status: { type: String },
    receivedAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Telemetry', telemetrySchema);
