const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Feedback = require('../models/Feedback');

// ─── GET /api/feedback ───────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const feedback = await Feedback.find().sort({ createdAt: -1 });
    res.json({ feedback });
  } catch (err) {
    console.error('Get feedback error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/feedback ──────────────────────────────────────────────────────
// Public submission endpoint (no auth) — for future donor/hospital portal forms.
router.post('/', async (req, res) => {
  try {
    const { type, name, email, role, subject, message, rating } = req.body;
    if (!name || !email || !subject || !message) {
      return res.status(400).json({ message: 'Name, email, subject, and message are required' });
    }
    const feedback = new Feedback({ type, name, email, role, subject, message, rating });
    await feedback.save();
    res.status(201).json({ message: 'Feedback submitted successfully', feedback });
  } catch (err) {
    console.error('Submit feedback error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/feedback/:id/read ───────────────────────────────────────────
router.patch('/:id/read', auth, async (req, res) => {
  try {
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });
    if (feedback.status === 'pending') {
      feedback.status = 'read';
      await feedback.save();
    }
    res.json({ message: 'Marked as read', feedback });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/feedback/:id/resolve ────────────────────────────────────────
router.patch('/:id/resolve', auth, async (req, res) => {
  try {
    const { reply } = req.body;
    const feedback = await Feedback.findById(req.params.id);
    if (!feedback) return res.status(404).json({ message: 'Feedback not found' });

    feedback.status = 'resolved';
    if (reply) {
      feedback.adminReply = reply;
      feedback.repliedAt = new Date();
    }
    await feedback.save();
    res.json({ message: 'Marked as resolved', feedback });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;