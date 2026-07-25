// server/routes/security.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const LoginLog = require('../models/LoginLog');

// ─── GET /api/security/login-logs?page=1&limit=20&status=all&search= ───────
router.get('/login-logs', auth, async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { status, search } = req.query;

    const query = {};
    if (status && status !== 'all') query.status = status;
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { ip: { $regex: search, $options: 'i' } },
      ];
    }

    const [logs, total, successCount, failedCount] = await Promise.all([
      LoginLog.find(query).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit),
      LoginLog.countDocuments(query),
      LoginLog.countDocuments({ status: 'success' }),
      LoginLog.countDocuments({ status: 'failed' }),
    ]);

    res.json({
      logs,
      total,
      page,
      totalPages: Math.ceil(total / limit) || 1,
      summary: { successCount, failedCount, total: successCount + failedCount },
    });
  } catch (err) {
    console.error('Login logs error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;