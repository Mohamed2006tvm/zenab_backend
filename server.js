const express = require('express');
const cors = require('cors');
const axios = require('axios');
const helmet = require('helmet');
const morgan = require('morgan');
const compression = require('compression');
const rateLimit = require('express-rate-limit');
require('dotenv').config();
const connectDB = require('./lib/mongodb');
const logger = require('./lib/logger');
const requestID = require('./middleware/requestID');

// ─── Environment Validation ──────────────────────────────────────────────────
const requiredEnv = ['MONGODB_URI', 'SUPABASE_URL', 'SUPABASE_ANON_KEY'];
const missingEnv = requiredEnv.filter((env) => !process.env[env]);

if (missingEnv.length > 0) {
  logger.error(`❌ Missing required environment variables: ${missingEnv.join(', ')}`);
  process.exit(1);
}

const app = express();

// ─── Middleware ──────────────────────────────────────────────────────────────
app.use(requestID);
app.use(compression());

// ─── Connect to Database ─────────────────────────────────────────────────────
connectDB();

// ─── Logging ─────────────────────────────────────────────────────────────────
app.use(morgan('combined', { stream: { write: (message) => logger.info(message.trim()) } }));

// ─── Security Headers ────────────────────────────────────────────────────────
app.use(
  helmet({
    crossOriginEmbedderPolicy: false, // allow Power BI iframes
    contentSecurityPolicy: false, // handled by Vite in production
  })
);

// ─── CORS ────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:4173',
  process.env.FRONTEND_URL,
].filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (like mobile apps or curl requests)
      if (!origin) return callback(null, true);
      
      const isAllowed = allowedOrigins.some(allowed => origin.startsWith(allowed)) || 
                        origin.endsWith('.vercel.app');
                        
      if (isAllowed) {
        callback(null, true);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-request-id'],
  })
);

// ─── Rate Limiting ────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

const path = require('path');

// ─── Body Parser ──────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Static Files (Frontend Build) ───────────────────────────────────────────
const frontendDist = path.join(__dirname, '../Zenab_Frontend/dist');
app.use(express.static(frontendDist));

// ─── Routes ───────────────────────────────────────────────────────────────────
app.use('/api/stations', require('./routes/stations'));
app.use('/api/aqi', require('./routes/aqi'));
app.use('/api/health', require('./routes/health'));
app.use('/api/reports', require('./routes/reports'));
app.use('/api/measure', require('./routes/measure'));
app.use('/api/telemetry', require('./routes/telemetry'));
app.use('/api/status', require('./routes/status'));

app.get('/api', (req, res) => {
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

  const row = req.body.row || [
    {
      timestamp: new Date().toISOString(),
      pm25: 45.2,
      pm10: 78.5,
      aqi: 127,
      status: 'Unhealthy for Sensitive Groups',
      confidence: 0.87,
      simulated: true,
    },
  ];

  try {
    await axios.post(pushUrl, Array.isArray(row) ? row : [row], {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000,
    });
    logger.info('✅ Manual Power BI test push successful');
    res.json({ success: true, pushed: row });
  } catch (err) {
    next(err);
  }
});

// ─── Catch-all for Frontend (SPA) ─────────────────────────────────────────────
app.get(/.*/, (req, res, next) => {
    // If it's an API route that wasn't matched, let it fall through to 404
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path.join(frontendDist, 'index.html'));
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
 
app.use((err, req, res, _next) => {
  logger.error(`❌ Error: ${err.message}`, { stack: err.stack });
  const status = err.status || 500;
  res.status(status).json({
    error:
      process.env.NODE_ENV === 'production' && status === 500
        ? 'Internal server error'
        : err.message,
  });
});

// ─── 404 handler ─────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ error: `Route '${req.path}' not found` });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

logger.info(
  `🔌 Power BI push: ${process.env.POWERBI_PUSH_URL ? '✅ Configured' : '⚠️  Not configured'}`
);
const server = app.listen(PORT, () =>
  logger.info(
    `🚀 Server running on http://localhost:${PORT} in ${process.env.NODE_ENV || 'development'} mode`
  )
);

// ─── Process Handlers & Graceful Shutdown ─────────────────────────────────────
process.on('uncaughtException', (err) => {
  logger.error('❌ UNCAUGHT EXCEPTION! Shutting down...', { error: err.message, stack: err.stack });
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  logger.error('❌ UNHANDLED REJECTION! Shutting down...', {
    error: err.message,
    stack: err.stack,
  });
  server.close(() => process.exit(1));
});

process.on('SIGTERM', () => {
  logger.info('👋 SIGTERM received. Shutting down gracefully...');
  server.close(() => {
    logger.info('Process terminated!');
    process.exit(0);
  });
});
