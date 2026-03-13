const mongoose = require('mongoose');

const healthAssessmentSchema = new mongoose.Schema({
    user_id: { type: mongoose.Schema.Types.UUID },
    age: { type: Number, required: true },
    conditions: { type: [String], default: [] },
    activity_level: { type: String, required: true },
    current_aqi: { type: Number },
    risk_level: { type: String },
    recommendation: { type: String },
    tips: { type: [String], default: [] },
    created_at: { type: Date, default: Date.now }
});

module.exports = mongoose.model('HealthAssessment', healthAssessmentSchema);
