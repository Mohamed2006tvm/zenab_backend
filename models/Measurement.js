const mongoose = require('mongoose');

const measurementSchema = new mongoose.Schema({
  pm25: { type: Number, required: true },
  pm10: { type: Number, required: true },
  aqi: { type: Number, required: true },
  status: { type: String, required: true },
  confidence: { type: Number },
  detections: { type: Number },
  image_file: { type: String },
  simulated: { type: Boolean, default: false },
  zenab_id: { type: String },
  created_at: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Measurement', measurementSchema);
