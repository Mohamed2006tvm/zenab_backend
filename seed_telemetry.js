const mongoose = require('mongoose');
require('dotenv').config();
const Telemetry = require('./models/Telemetry');

const sampleData = require('./hardware_sample.json');

async function seedTelemetry() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('✅ Connected to MongoDB');

    // Clear existing telemetry for this device to avoid duplicates during testing
    await Telemetry.deleteMany({ deviceId: 'ZENAB_TREE_01' });

    const formattedData = sampleData.map((item) => ({
      deviceId: item.device_id,
      timestamp: new Date(item.timestamp),
      aqi: item.aqi,
      pm25: item.pm25,
      temperature: item.temperature,
      humidity: item.humidity,
      oxygen: item.oxygen,
      location: {
        lat: item.latitude,
        lng: item.longitude,
      },
      power: item.power,
      status: item.status,
    }));

    await Telemetry.insertMany(formattedData);
    console.log(`✅ Seeded ${formattedData.length} hardware telemetry records`);

    process.exit(0);
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  }
}

seedTelemetry();
