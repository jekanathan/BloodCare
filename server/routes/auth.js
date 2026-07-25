const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const LoginLog = require('../models/LoginLog');
const auth = require('../middleware/auth');

// Helper — records one login attempt (success or failed)
async function logLoginAttempt({ user, email, status, reason, req }) {
  try {
    await LoginLog.create({
      user: user?._id,
      name: user?.name || '-',
      email,
      role: user?.role || '-',
      status,
      reason,
      ip: req.headers['x-forwarded-for']?.split(',')[0] || req.socket?.remoteAddress || req.ip,
      userAgent: req.headers['user-agent'] || '-',
    });
  } catch (err) {
    console.error('Login log error:', err.message);
  }
}

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      await logLoginAttempt({ email, status: 'failed', reason: 'Invalid email', req });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      await logLoginAttempt({ user, email, status: 'failed', reason: 'Invalid password', req });
      return res.status(400).json({ message: 'Invalid credentials' });
    }

    if (user.role !== 'admin') {
      await logLoginAttempt({ user, email, status: 'failed', reason: 'Non-admin access attempt', req });
      return res.status(403).json({ message: 'Admin access only' });
    }

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'bloodcare_secret',
      { expiresIn: '24h' }
    );
    user.lastLogin = new Date();
    await user.save();

    await logLoginAttempt({ user, email, status: 'success', req });

    res.json({
      token,
      user: { id: user._id, name: user.name, email: user.email, role: user.role }
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/register-admin', async (req, res) => {
  try {
    const { name, email, password, setupKey } = req.body;
    if (setupKey !== 'BLOODCARE_SETUP_2024') {
      return res.status(403).json({ message: 'Invalid setup key' });
    }
    const existing = await User.findOne({ role: 'admin' });
    if (existing) return res.status(400).json({ message: 'Admin already exists' });
    const user = new User({ name, email, password, role: 'admin', status: 'approved' });
    await user.save();
    res.json({ message: 'Admin created successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/me', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('-password');
    res.json(user);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

module.exports = router;