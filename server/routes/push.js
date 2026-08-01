// server/routes/push.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const PushToken = require('../models/PushToken');
const Notification = require('../models/Notification');
const { initFirebaseAdmin } = require('../config/firebaseAdmin');

// ─── POST /api/push/register-token ─────────────────────────────────────────
router.post('/register-token', async (req, res) => {
  try {
    const { token, portal, ownerEmail, ownerName, bloodGroup } = req.body;
    if (!token || !portal || !ownerEmail) {
      return res.status(400).json({ message: 'token, portal, and ownerEmail are required.' });
    }

    await PushToken.findOneAndUpdate(
      { token },
      { portal, ownerEmail: ownerEmail.toLowerCase(), ownerName, bloodGroup, lastActiveAt: new Date() },
      { upsert: true, new: true }
    );

    res.status(201).json({ message: 'Push token registered' });
  } catch (err) {
    console.error('Register push token error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/push/unregister-token ─────────────────────────────────────
router.delete('/unregister-token', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) return res.status(400).json({ message: 'token is required.' });
    await PushToken.findOneAndDelete({ token });
    res.json({ message: 'Push token removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/push/send ────────────────────────────────────────────────────
router.post('/send', auth, async (req, res) => {
  try {
    const admin = initFirebaseAdmin();
    if (!admin) {
      return res.status(500).json({ message: 'Push service is not configured (missing Firebase credentials on the server).' });
    }

    const { title, message, recipientGroup } = req.body;
    if (!title || !message || !recipientGroup) {
      return res.status(400).json({ message: 'Title, message, and recipient group are required' });
    }

    const query = {};
    if (recipientGroup === 'All Donors') query.portal = 'donor';
    else if (recipientGroup === 'Eligible Donors') query.portal = 'donor';
    else if (recipientGroup === 'All Hospitals') query.portal = 'hospital';
    else if (recipientGroup === 'All Blood Banks') query.portal = 'bloodbank';
    else if (/Donors$/i.test(recipientGroup)) {
      query.portal = 'donor';
      query.bloodGroup = recipientGroup.replace(/\s*Donors$/i, '').trim();
    }

    const tokens = await PushToken.find(query).select('token');
    const tokenList = tokens.map(t => t.token);

    if (tokenList.length === 0) {
      const notif = await new Notification({
        type: 'Push', title, message, recipientGroup,
        recipientCount: 0, status: 'failed',
        errorMessage: 'No registered devices found for this group', sentBy: req.user.id,
      }).save();
      return res.status(400).json({ message: 'No registered devices found for this group', notification: notif });
    }

    const CHUNK_SIZE = 500;
    let successCount = 0;
    const deadTokens = [];

    for (let i = 0; i < tokenList.length; i += CHUNK_SIZE) {
      const chunk = tokenList.slice(i, i + CHUNK_SIZE);
      const response = await admin.messaging().sendEachForMulticast({
        tokens: chunk,
        notification: { title, body: message },
        webpush: { fcmOptions: { link: '/' } },
      });
      successCount += response.successCount;
      response.responses.forEach((r, idx) => {
        if (!r.success) deadTokens.push(chunk[idx]);
      });
    }

    if (deadTokens.length > 0) {
      await PushToken.deleteMany({ token: { $in: deadTokens } });
    }

    const status = successCount > 0 ? 'sent' : 'failed';
    const notif = await new Notification({
      type: 'Push', title, message, recipientGroup,
      recipientCount: successCount, status,
      errorMessage: status === 'failed' ? 'All devices failed to receive the push' : undefined,
      sentBy: req.user.id,
    }).save();

    res.status(201).json({ message: `Push sent to ${successCount} device(s)`, notification: notif });
  } catch (err) {
    console.error('Send push error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/push/stats ────────────────────────────────────────────────────
router.get('/stats', auth, async (req, res) => {
  try {
    const total = await PushToken.countDocuments();
    const byPortal = await PushToken.aggregate([{ $group: { _id: '$portal', count: { $sum: 1 } } }]);
    res.json({ total, byPortal });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;