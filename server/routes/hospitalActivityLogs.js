const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const ActivityLog = require('../models/ActivityLog');

// ─── GET /api/hospital-activity-logs?module=patient&limit=100 ──────────────
router.get('/', auth, async (req, res) => {
  try {
    const { module, limit } = req.query;
    const filter = { hospital: req.user.id };
    if (module) filter.module = module;

    const logs = await ActivityLog.find(filter)
      .sort({ createdAt: -1 })
      .limit(Math.min(parseInt(limit) || 100, 300));

    res.json({ logs });
  } catch (err) {
    console.error('Get activity logs error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;