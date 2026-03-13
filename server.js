const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./lib/mongodb');

const app = express();

// ─── Connect to Database ─────────────────────────────────────────────────────
connectDB();

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(helmet({
    crossOriginEmbedderPolicy: false, // allow Power BI iframes
    contentSecurityPolicy: false,     // handled by Vite in production
}));

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
    process.env.FRONTEND_URL || 'http://localhost:5173',
    'http://localhost:5174',
    'http://localhost:4173', // vite preview
];
app.use(cors({
    origin: (origin, cb) => {
        // allow requests with no origin (e.g. curl, mobile apps)
        if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
        cb(new Error(`CORS: origin '${origin}' not allowed`));
    },
    credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 200,
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/stations', require('./routes/stations'));
app.use('/api/aqi', require('./routes/aqi'));
app.use('/api/health', require('./routes/health'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/measure', require('./routes/measure'));
app.use('/api/telemetry', require('./routes/telemetry'));

app.get('/', (req, res) => {
    res.json({ message: 'Zenab API (MongoDB) is running', version: '1.0.0' });
});

// ─── Power BI Status & Test ───────────────────────────────────────────────────
app.get('/api/powerbi/status', (req, res) => {
    const pushUrl = process.env.POWERBI_PUSH_URL;
    res.json({
        configured: !!(pushUrl && pushUrl.trim().length > 0),
        hint: 'Set POWERBI_PUSH_URL in Backend/.env to enable live streaming.',
    });
});

app.post('/api/powerbi/push', async (req, res, next) => {
    const pushUrl = process.env.POWERBI_PUSH_URL;
    if (!pushUrl || !pushUrl.trim()) {
        return res.status(400).json({ error: 'POWERBI_PUSH_URL is not configured in .env' });
    }

    const row = req.body.row || [{
        timestamp: new Date().toISOString(),
        pm25: 45.2,
        pm10: 78.5,
        aqi: 127,
        status: 'Unhealthy for Sensitive Groups',
        confidence: 0.87,
        simulated: true,
    }];

    try {
        await axios.post(pushUrl, Array.isArray(row) ? row : [row], {
            headers: { 'Content-Type': 'application/json' },
            timeout: 10000,
        });
        console.log('✅ Manual Power BI test push successful');
        res.json({ success: true, pushed: row });
    } catch (err) {
        next(err);
    }
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
    console.error('❌ Unhandled error:', err.message);
    const status = err.status || 500;
    res.status(status).json({
        error: status === 500 ? 'Internal server error' : err.message,
    });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
    res.status(404).json({ error: `Route '${req.path}' not found` });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

console.log('🔌 Power BI push:', process.env.POWERBI_PUSH_URL ? '✅ Configured' : '⚠️  Not configured (set POWERBI_PUSH_URL in .env)');
app.listen(PORT, () => console.log(`🚀 Server running on http://localhost:${PORT}`));
