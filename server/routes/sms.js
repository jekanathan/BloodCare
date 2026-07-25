// server/routes/sms.js
const express = require('express');
const router = express.Router();
const axios = require('axios');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const Donor = require('../models/Donor');

const SEND_LK_ENDPOINT = 'https://sms.send.lk/api/v3/sms/send';

async function resolveRecipientPhones(recipientGroup) {
  let query = { status: 'approved' };

  if (recipientGroup === 'All Donors') {
    // no extra filter
  } else if (recipientGroup === 'Eligible Donors') {
    query.isEligible = true;
  } else if (/Donors$/i.test(recipientGroup)) {
    const bloodGroup = recipientGroup.replace(/\s*Donors$/i, '').trim();
    query.bloodGroup = bloodGroup;
  }

  const donors = await Donor.find(query).select('fullName phone');
  return donors
    .filter(d => d.phone)
    .map(d => ({ phone: normalizePhone(d.phone), name: d.fullName }));
}

// Send.lk expects international format without a leading +, e.g. 94771234567
function normalizePhone(phone) {
  let p = phone.replace(/\D/g, '');
  if (p.startsWith('0')) p = '94' + p.slice(1);
  if (!p.startsWith('94')) p = '94' + p;
  return p;
}

// ─── POST /api/sms/send ──────────────────────────────────────────────────
router.post('/send', auth, async (req, res) => {
  try {
    const { title, message, recipientGroup } = req.body;
    if (!message || !recipientGroup) {
      return res.status(400).json({ message: 'Message and recipient group are required' });
    }
    if (!process.env.SENDLK_API_TOKEN || !process.env.SENDLK_SENDER_ID) {
      return res.status(500).json({ message: 'SMS service is not configured (missing Send.lk credentials on the server).' });
    }

    const recipients = await resolveRecipientPhones(recipientGroup);

    if (recipients.length === 0) {
      const notif = await new Notification({
        type: 'SMS', title: title || 'SMS', message, recipientGroup,
        recipientCount: 0, status: 'failed',
        errorMessage: 'No matching recipients found', sentBy: req.user.id,
      }).save();
      return res.status(400).json({ message: 'No matching recipients found for this group', notification: notif });
    }

    let successCount = 0;
    let lastError = null;

    for (const r of recipients) {
      try {
        await axios.post(SEND_LK_ENDPOINT, {
          recipient: r.phone,
          sender_id: process.env.SENDLK_SENDER_ID,
          type: 'plain',
          message,
        }, {
          headers: {
            Authorization: `Bearer ${process.env.SENDLK_API_TOKEN}`,
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        });
        successCount += 1;
      } catch (smsErr) {
        console.error('Send.lk error:', smsErr.response?.data || smsErr.message);
        lastError = smsErr.response?.data?.message || smsErr.message;
      }
    }

    const status = successCount > 0 ? 'sent' : 'failed';
    const notif = await new Notification({
      type: 'SMS', title: title || 'SMS', message, recipientGroup,
      recipientCount: successCount, status,
      errorMessage: status === 'failed' ? lastError : undefined,
      sentBy: req.user.id,
    }).save();

    if (status === 'failed') {
      return res.status(500).json({ message: `Failed to send SMS: ${lastError}`, notification: notif });
    }

    res.status(201).json({ message: `SMS sent to ${successCount} recipient${successCount !== 1 ? 's' : ''}`, notification: notif });
  } catch (err) {
    console.error('Send SMS error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;