const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const supabase = require('../lib/supabase');

router.get('/', async (req, res) => {
  const status = {
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      mongodb: 'unknown',
      supabase: 'unknown',
    },
  };

  // Check MongoDB
  try {
    const mongoState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting',
    };
    status.services.mongodb = states[mongoState] || 'unknown';
  } catch {
    status.services.mongodb = 'error';
  }

  // Check Supabase (simple ping)
  try {
    const { error } = await supabase.from('stations').select('id').limit(1);
    if (error) {
      const logger = require('../lib/logger');
      logger.error('Supabase health check error:', error);
      status.services.supabase = 'error';
    } else {
      status.services.supabase = 'connected';
    }
  } catch (err) {
    const logger = require('../lib/logger');
    logger.error('Supabase health check exception:', err);
    status.services.supabase = 'error';
  }

  const isHealthy =
    status.services.mongodb === 'connected' && status.services.supabase === 'connected';

  res.status(isHealthy ? 200 : 503).json(status);
});

module.exports = router;
