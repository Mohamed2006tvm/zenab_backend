const mongoose = require('mongoose');
const Station = require('./models/Station');
const connectDB = require('./lib/mongodb');
require('dotenv').config();

const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
function genTrend(baseAqi) {
    return days.map((day) => ({
        day,
        aqi: Math.max(10, baseAqi + Math.round((Math.random() - 0.5) * 40)),
    }));
}

function getStatus(aqi) {
    if (aqi <= 50) return 'Good';
    if (aqi <= 100) return 'Moderate';
    if (aqi <= 150) return 'Unhealthy for Sensitive Groups';
    if (aqi <= 200) return 'Unhealthy';
    if (aqi <= 300) return 'Very Unhealthy';
    return 'Hazardous';
}

const cities = [
    { city: 'Delhi', state: 'Delhi', lat: 28.6139, lng: 77.209, aqi: 285, pm25: 189, pm10: 242, o3: 42, no2: 78, so2: 25, co: 9.5 },
    { city: 'Mumbai', state: 'Maharashtra', lat: 19.076, lng: 72.8777, aqi: 142, pm25: 68, pm10: 95, o3: 55, no2: 52, so2: 18, co: 5.2 },
    { city: 'Kolkata', state: 'West Bengal', lat: 22.5726, lng: 88.3639, aqi: 198, pm25: 112, pm10: 156, o3: 38, no2: 68, so2: 22, co: 7.1 },
    { city: 'Chennai', state: 'Tamil Nadu', lat: 13.0827, lng: 80.2707, aqi: 85, pm25: 32, pm10: 58, o3: 48, no2: 35, so2: 12, co: 3.8 },
    { city: 'Bengaluru', state: 'Karnataka', lat: 12.9716, lng: 77.5946, aqi: 78, pm25: 28, pm10: 52, o3: 44, no2: 32, so2: 10, co: 3.2 },
    { city: 'Hyderabad', state: 'Telangana', lat: 17.385, lng: 78.4867, aqi: 98, pm25: 42, pm10: 68, o3: 52, no2: 38, so2: 14, co: 4.1 },
    { city: 'Pune', state: 'Maharashtra', lat: 18.5204, lng: 73.8567, aqi: 110, pm25: 52, pm10: 78, o3: 50, no2: 42, so2: 15, co: 4.5 },
    { city: 'Ahmedabad', state: 'Gujarat', lat: 23.0225, lng: 72.5714, aqi: 155, pm25: 75, pm10: 102, o3: 46, no2: 55, so2: 20, co: 5.8 },
    { city: 'Jaipur', state: 'Rajasthan', lat: 26.9124, lng: 75.7873, aqi: 172, pm25: 88, pm10: 118, o3: 43, no2: 62, so2: 22, co: 6.3 },
    { city: 'Lucknow', state: 'Uttar Pradesh', lat: 26.8467, lng: 80.9462, aqi: 232, pm25: 145, pm10: 198, o3: 39, no2: 72, so2: 28, co: 8.5 },
    { city: 'Kanpur', state: 'Uttar Pradesh', lat: 26.4499, lng: 80.3319, aqi: 248, pm25: 162, pm10: 215, o3: 37, no2: 76, so2: 30, co: 9.1 },
    { city: 'Nagpur', state: 'Maharashtra', lat: 21.1458, lng: 79.0882, aqi: 120, pm25: 58, pm10: 85, o3: 49, no2: 44, so2: 16, co: 4.8 },
    { city: 'Surat', state: 'Gujarat', lat: 21.1702, lng: 72.8311, aqi: 138, pm25: 65, pm10: 92, o3: 47, no2: 50, so2: 19, co: 5.1 },
    { city: 'Patna', state: 'Bihar', lat: 25.5941, lng: 85.1376, aqi: 208, pm25: 128, pm10: 172, o3: 40, no2: 68, so2: 26, co: 7.8 },
    { city: 'Indore', state: 'Madhya Pradesh', lat: 22.7196, lng: 75.8577, aqi: 118, pm25: 55, pm10: 82, o3: 50, no2: 43, so2: 15, co: 4.6 },
    { city: 'Bhopal', state: 'Madhya Pradesh', lat: 23.2599, lng: 77.4126, aqi: 95, pm25: 40, pm10: 65, o3: 51, no2: 37, so2: 13, co: 3.9 },
    { city: 'Visakhapatnam', state: 'Andhra Pradesh', lat: 17.6868, lng: 83.2185, aqi: 72, pm25: 25, pm10: 48, o3: 46, no2: 30, so2: 11, co: 3.0 },
    { city: 'Varanasi', state: 'Uttar Pradesh', lat: 25.3176, lng: 82.9739, aqi: 225, pm25: 140, pm10: 188, o3: 41, no2: 70, so2: 27, co: 8.2 },
    { city: 'Agra', state: 'Uttar Pradesh', lat: 27.1767, lng: 78.0081, aqi: 215, pm25: 132, pm10: 178, o3: 40, no2: 69, so2: 26, co: 7.9 },
    { city: 'Meerut', state: 'Uttar Pradesh', lat: 28.9845, lng: 77.7064, aqi: 265, pm25: 175, pm10: 225, o3: 38, no2: 75, so2: 29, co: 9.3 },
    { city: 'Guwahati', state: 'Assam', lat: 26.1445, lng: 91.7362, aqi: 62, pm25: 20, pm10: 40, o3: 44, no2: 28, so2: 9, co: 2.5 },
    { city: 'Coimbatore', state: 'Tamil Nadu', lat: 11.0168, lng: 76.9558, aqi: 68, pm25: 22, pm10: 44, o3: 45, no2: 29, so2: 10, co: 2.8 },
    { city: 'Kochi', state: 'Kerala', lat: 9.9312, lng: 76.2673, aqi: 45, pm25: 14, pm10: 28, o3: 42, no2: 22, so2: 7, co: 1.9 },
    { city: 'Chandigarh', state: 'Chandigarh', lat: 30.7333, lng: 76.7794, aqi: 158, pm25: 78, pm10: 105, o3: 44, no2: 56, so2: 20, co: 5.9 },
    { city: 'Amritsar', state: 'Punjab', lat: 31.634, lng: 74.8723, aqi: 185, pm25: 98, pm10: 135, o3: 42, no2: 64, so2: 24, co: 6.8 },
    { city: 'Ludhiana', state: 'Punjab', lat: 30.901, lng: 75.8573, aqi: 195, pm25: 108, pm10: 148, o3: 41, no2: 66, so2: 25, co: 7.2 },
    { city: 'Srinagar', state: 'Jammu & Kashmir', lat: 34.0837, lng: 74.7973, aqi: 55, pm25: 17, pm10: 34, o3: 40, no2: 24, so2: 8, co: 2.1 },
    { city: 'Dehradun', state: 'Uttarakhand', lat: 30.3165, lng: 78.0322, aqi: 88, pm25: 35, pm10: 60, o3: 47, no2: 33, so2: 11, co: 3.5 },
    { city: 'Raipur', state: 'Chhattisgarh', lat: 21.2514, lng: 81.6296, aqi: 132, pm25: 62, pm10: 88, o3: 48, no2: 48, so2: 17, co: 5.0 },
    { city: 'Bhubaneswar', state: 'Odisha', lat: 20.2961, lng: 85.8245, aqi: 105, pm25: 48, pm10: 72, o3: 50, no2: 40, so2: 14, co: 4.2 },
];

async function seed() {
    try {
        console.log('🚀 Starting MongoDB Seeding...');
        await connectDB();

        // Clear existing stations
        await Station.deleteMany({});
        console.log('🗑️  Cleared existing stations');

        const stationsWithStatus = cities.map((c) => ({
            ...c,
            status: getStatus(c.aqi),
            trend: genTrend(c.aqi),
            updated_at: new Date(),
        }));

        await Station.insertMany(stationsWithStatus);
        console.log(`✅ Seeded ${stationsWithStatus.length} stations into MongoDB`);

        process.exit(0);
    } catch (err) {
        console.error('❌ Seed error:', err.message);
        process.exit(1);
    }
}

seed();
