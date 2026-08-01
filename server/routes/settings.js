// server/routes/settings.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Settings = require('../models/Settings');

// Ensures a settings document always exists (creates default on first access)
async function getOrCreateSettings() {
  let settings = await Settings.findOne({ key: 'main' });
  if (!settings) settings = await Settings.create({ key: 'main' });
  return settings;
}

// ─── GET /api/settings ───────────────────────────────────────────────────────
// Admin panel — full settings
router.get('/', auth, async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({ settings });
  } catch (err) {
    console.error('Get settings error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/settings ───────────────────────────────────────────────────────
// Admin panel — save settings
router.put('/', auth, async (req, res) => {
  try {
    const {
      siteName, siteUrl, adminEmail, emergencyHotline, address,
      maintenanceMode, registrationOpen, autoApprove,
    } = req.body;

    const settings = await Settings.findOneAndUpdate(
      { key: 'main' },
      {
        $set: {
          ...(siteName !== undefined && { siteName }),
          ...(siteUrl !== undefined && { siteUrl }),
          ...(adminEmail !== undefined && { adminEmail }),
          ...(emergencyHotline !== undefined && { emergencyHotline }),
          ...(address !== undefined && { address }),
          ...(maintenanceMode !== undefined && { maintenanceMode }),
          ...(registrationOpen !== undefined && { registrationOpen }),
          ...(autoApprove !== undefined && { autoApprove }),
          updatedBy: req.user.id,
        },
      },
      { new: true, upsert: true }
    );

    res.json({ message: 'Settings saved successfully', settings });
  } catch (err) {
    console.error('Update settings error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/settings/public ────────────────────────────────────────────────
// No auth — Donor/Hospital/BloodBank portals call this to check maintenance
// mode and registration status before showing their pages.
router.get('/public', async (req, res) => {
  try {
    const settings = await getOrCreateSettings();
    res.json({
      maintenanceMode: settings.maintenanceMode,
      registrationOpen: settings.registrationOpen,
      siteName: settings.siteName,
      emergencyHotline: settings.emergencyHotline,
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;