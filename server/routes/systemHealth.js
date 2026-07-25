// server/routes/systemHealth.js
const express = require('express');
const router = express.Router();
const os = require('os');
const mongoose = require('mongoose');
const auth = require('../middleware/auth');
const LoginLog = require('../models/LoginLog');

function requireAdmin(req, res, next) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ message: 'Super Admin access only' });
  }
  next();
}

function formatUptime(seconds) {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

const DB_STATE_LABELS = { 0: 'Disconnected', 1: 'Connected', 2: 'Connecting', 3: 'Disconnecting' };

router.get('/overview', auth, requireAdmin, async (req, res) => {
  const start = process.hrtime.bigint();

  try {
    const totalMem = os.totalmem();
    const freeMem = os.freemem();
    const usedMemPercent = Math.round(((totalMem - freeMem) / totalMem) * 100);

    const server = {
      status: 'online',
      uptimeSeconds: Math.floor(process.uptime()),
      uptimeFormatted: formatUptime(process.uptime()),
      platform: os.platform(),
      nodeVersion: process.version,
      cpuCores: os.cpus().length,
      cpuLoadAvg1m: os.loadavg()[0].toFixed(2),
      totalMemMB: Math.round(totalMem / 1024 / 1024),
      freeMemMB: Math.round(freeMem / 1024 / 1024),
      usedMemPercent,
      note: os.platform() === 'win32' ? 'CPU load average is not meaningful on Windows (always shows 0).' : null,
    };

    let database = { status: DB_STATE_LABELS[mongoose.connection.readyState] || 'Unknown' };
    if (mongoose.connection.readyState === 1) {
      database.name = mongoose.connection.name;
      database.host = mongoose.connection.host;
      try {
        const stats = await mongoose.connection.db.stats();
        database.collections = stats.collections;
        database.dataSizeMB = (stats.dataSize / 1024 / 1024).toFixed(2);
        database.storageSizeMB = (stats.storageSize / 1024 / 1024).toFixed(2);
      } catch (e) {
        database.statsError = 'Could not fetch detailed DB stats (insufficient permissions on this cluster).';
      }
    }

    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const recentSuccessfulLogins = await LoginLog.countDocuments({ status: 'success', createdAt: { $gte: oneHourAgo } });
    const auth_ = { status: 'online', recentLogins1h: recentSuccessfulLogins };

    const smsConfigured = !!(process.env.SENDLK_API_TOKEN && process.env.SENDLK_SENDER_ID);
    const pushConfigured = !!(process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY);

    const externalServices = {
      email: {
        configured: !!(process.env.BREVO_API_KEY),
        label: process.env.BREVO_API_KEY ? 'Configured (Brevo)' : 'Not configured',
      },
      sms: {
        configured: smsConfigured,
        label: smsConfigured ? 'Configured (Send.lk)' : 'Not integrated',
      },
      push: {
        configured: pushConfigured,
        label: pushConfigured ? 'Configured (Firebase Cloud Messaging)' : 'Not configured',
      },
      maps: { configured: true, label: 'Active — free OpenStreetMap tiles, no API key required' },
      ai: {
        configured: !!(process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY),
        label: (process.env.ANTHROPIC_API_KEY || process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY) ? 'Configured' : 'Not configured',
      },
    };

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const failedLogins24h = await LoginLog.countDocuments({ status: 'failed', createdAt: { $gte: oneDayAgo } });

    const responseTimeMs = Number(process.hrtime.bigint() - start) / 1e6;

    res.json({
      server,
      database,
      api: { status: 'online', responseTimeMs: responseTimeMs.toFixed(1) },
      auth: auth_,
      externalServices,
      alerts: { failedLogins24h },
      checkedAt: new Date(),
    });
  } catch (err) {
    console.error('System health error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;