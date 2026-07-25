const express = require('express');
const router = express.Router();
const { BrevoClient } = require('@getbrevo/brevo');
const auth = require('../middleware/auth');
const Notification = require('../models/Notification');
const NotificationTemplate = require('../models/NotificationTemplate');
const Donor = require('../models/Donor');

const brevoClient = process.env.BREVO_API_KEY
  ? new BrevoClient({ apiKey: process.env.BREVO_API_KEY })
  : null;

const SENDER = {
  email: process.env.BREVO_SENDER_EMAIL,
  name: 'BloodCare',
};

async function resolveRecipients(recipientGroup) {
  let query = { status: 'approved' };

  if (recipientGroup === 'All Donors') {
    // no extra filter
  } else if (recipientGroup === 'Eligible Donors') {
    query.isEligible = true;
  } else if (/Donors$/i.test(recipientGroup)) {
    const bloodGroup = recipientGroup.replace(/\s*Donors$/i, '').trim();
    query.bloodGroup = bloodGroup;
  }

  const donors = await Donor.find(query).select('fullName email');
  return donors.filter(d => d.email).map(d => ({ email: d.email, name: d.fullName }));
}

const DEFAULT_TEMPLATES = [
  { name: 'Blood Request Approved', type: 'Email', subject: 'Your blood request has been approved', body: 'Dear {{hospitalName}}, your blood request for {{bloodGroup}} ({{units}} units) has been approved and is being processed.', isDefault: true },
  { name: 'Blood Request Rejected', type: 'Email', subject: 'Blood request update', body: 'Dear {{hospitalName}}, unfortunately your blood request could not be fulfilled at this time. Reason: {{reason}}', isDefault: true },
  { name: 'Donation Reminder', type: 'Email', subject: 'You are eligible to donate again!', body: 'Dear {{donorName}}, it has been 90 days since your last donation. You are now eligible to donate blood again. Visit your nearest blood bank today!', isDefault: true },
  { name: 'Campaign Invitation', type: 'Email', subject: 'Join our upcoming blood donation campaign', body: 'Dear {{donorName}}, we invite you to join our upcoming campaign "{{campaignTitle}}" on {{date}} at {{venue}}.', isDefault: true },
  { name: 'Emergency Alert', type: 'Email', subject: '🚨 Urgent blood needed', body: 'URGENT: {{bloodGroup}} blood is urgently needed at {{hospitalName}}. If you are eligible, please contact us immediately.', isDefault: true },
  { name: 'Certificate Ready', type: 'Email', subject: 'Your donation certificate is ready', body: 'Dear {{donorName}}, thank you for your generous donation. Your certificate is now ready to download from your dashboard.', isDefault: true },
];

async function ensureDefaultTemplates() {
  const count = await NotificationTemplate.countDocuments();
  if (count > 0) return;
  await NotificationTemplate.insertMany(DEFAULT_TEMPLATES);
}

// ─── GET /api/notifications ───────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const notifications = await Notification.find().sort({ createdAt: -1 }).limit(100);
    res.json({ notifications });
  } catch (err) {
    console.error('Get notifications error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/notifications/send-email ───────────────────────────────────
router.post('/send-email', auth, async (req, res) => {
  try {
    const { title, message, recipientGroup } = req.body;
    if (!title || !message || !recipientGroup) {
      return res.status(400).json({ message: 'Title, message, and recipient group are required' });
    }
    if (!process.env.BREVO_API_KEY || !process.env.BREVO_SENDER_EMAIL) {
      return res.status(500).json({ message: 'Email service is not configured (missing Brevo credentials)' });
    }
    if (!brevoClient) {
      return res.status(500).json({ message: 'Email service failed to initialize. Check BREVO_API_KEY.' });
    }

    const recipients = await resolveRecipients(recipientGroup);

    if (recipients.length === 0) {
      const notif = await new Notification({
        type: 'Email', title, message, recipientGroup,
        recipientCount: 0, status: 'failed',
        errorMessage: 'No matching recipients found', sentBy: req.user.id,
      }).save();
      return res.status(400).json({ message: 'No matching recipients found for this group', notification: notif });
    }

    const CHUNK_SIZE = 50;
    let totalSent = 0;
    let lastError = null;

    for (let i = 0; i < recipients.length; i += CHUNK_SIZE) {
      const chunk = recipients.slice(i, i + CHUNK_SIZE);
      try {
        await brevoClient.transactionalEmails.sendTransacEmail({
          sender: SENDER,
          to: chunk.map(r => ({ email: r.email, name: r.name })),
          subject: title,
          htmlContent: `
            <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;">
              <div style="background:#C41E3A;padding:20px;border-radius:8px 8px 0 0;">
                <h2 style="color:#fff;margin:0;">🩸 BloodCare</h2>
              </div>
              <div style="padding:24px;background:#f8fafc;border-radius:0 0 8px 8px;">
                <p style="font-size:15px;color:#0f172a;line-height:1.6;">${message.replace(/\n/g, '<br/>')}</p>
              </div>
              <p style="font-size:11px;color:#94a3b8;margin-top:16px;text-align:center;">
                Sent via BloodCare — Sri Lanka National Blood Donation Platform
              </p>
            </div>
          `,
        });
        totalSent += chunk.length;
      } catch (chunkErr) {
        console.error('Brevo send error (chunk):', chunkErr.response?.data || chunkErr.message || chunkErr);
        lastError = chunkErr.response?.data?.message || chunkErr.message || 'Unknown error';
      }
    }

    const status = totalSent > 0 ? 'sent' : 'failed';
    const notif = await new Notification({
      type: 'Email', title, message, recipientGroup,
      recipientCount: totalSent, status,
      errorMessage: status === 'failed' ? lastError : undefined,
      sentBy: req.user.id,
    }).save();

    if (status === 'failed') {
      return res.status(500).json({ message: `Failed to send email: ${lastError}`, notification: notif });
    }

    res.status(201).json({
      message: `Email sent to ${totalSent} recipient${totalSent !== 1 ? 's' : ''}`,
      notification: notif,
    });
  } catch (err) {
    console.error('Send email error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/notifications/send-announcement ──────────────────────────────
// Real, in-app announcement — stored and visible in the admin log immediately.
// No external SMS/push service required.
router.post('/send-announcement', auth, async (req, res) => {
  try {
    const { title, message, recipientGroup } = req.body;
    if (!title || !message) {
      return res.status(400).json({ message: 'Title and message are required' });
    }

    const group = recipientGroup || 'All Donors';
    const recipients = await resolveRecipients(group);

    const notif = await new Notification({
      type: 'Announcement', title, message, recipientGroup: group,
      recipientCount: recipients.length, status: 'sent',
      sentBy: req.user.id,
    }).save();

    res.status(201).json({ message: `Announcement published (visible to ${recipients.length} recipient(s))`, notification: notif });
  } catch (err) {
    console.error('Send announcement error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/notifications/:id ──────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const notif = await Notification.findByIdAndDelete(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });
    res.json({ message: 'Notification deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// NOTIFICATION TEMPLATES
// ══════════════════════════════════════════════════════════════════════════
router.get('/templates', auth, async (req, res) => {
  try {
    await ensureDefaultTemplates();
    const templates = await NotificationTemplate.find().sort({ createdAt: 1 });
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.post('/templates', auth, async (req, res) => {
  try {
    const { name, type, subject, body } = req.body;
    if (!name || !body) return res.status(400).json({ message: 'Name and body are required.' });
    const template = new NotificationTemplate({ name, type, subject, body });
    await template.save();
    res.status(201).json({ message: 'Template created', template });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/templates/:id', auth, async (req, res) => {
  try {
    const template = await NotificationTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!template) return res.status(404).json({ message: 'Template not found' });
    res.json({ message: 'Updated', template });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.delete('/templates/:id', auth, async (req, res) => {
  try {
    const template = await NotificationTemplate.findById(req.params.id);
    if (!template) return res.status(404).json({ message: 'Template not found' });
    if (template.isDefault) return res.status(403).json({ message: 'Default templates cannot be deleted, only edited.' });
    await NotificationTemplate.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;