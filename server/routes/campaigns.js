const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Campaign = require('../models/Campaign');
const Volunteer = require('../models/Volunteer');

const TYPE_COLORS = { National:'#C41E3A', Regional:'#3B82F6', Institution:'#22C55E', Corporate:'#8B5CF6' };
const TYPE_ICONS  = { National:'🩸', Regional:'🏔️', Institution:'🎓', Corporate:'📱' };

function formatCampaign(c) {
  return {
    _id: c._id,
    title: c.title,
    type: c.type,
    district: c.district,
    venue: c.venue,
    date: c.startDate ? new Date(c.startDate).toISOString().split('T')[0] : '',
    endDate: c.endDate ? new Date(c.endDate).toISOString().split('T')[0] : '',
    time: c.time,
    target: c.targetRegistrations,
    registered: c.registeredCount,
    donated: c.collectedUnits,
    volunteers: c.volunteerCount,
    status: c.status,
    organizer: c.organizer,
    description: c.description,
    image: TYPE_ICONS[c.type] || '🩸',
    color: TYPE_COLORS[c.type] || '#C41E3A',
  };
}

// ─── GET /api/campaigns ─────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const campaigns = await Campaign.find().sort({ startDate: -1 });
    res.json({ campaigns: campaigns.map(formatCampaign) });
  } catch (err) {
    console.error('Get campaigns error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/campaigns ────────────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  try {
    const { title, type, district, venue, organizer, startDate, endDate, time, targetRegistrations, description } = req.body;
    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, start date, and end date are required' });
    }

    const campaign = new Campaign({
      title, type, district, venue, organizer,
      startDate, endDate, time,
      targetRegistrations: targetRegistrations ? parseInt(targetRegistrations) : 0,
      description,
      createdBy: req.user.id,
      status: new Date(startDate) > new Date() ? 'upcoming' : 'active',
    });
    await campaign.save();
    res.status(201).json({ message: 'Campaign created', campaign: formatCampaign(campaign) });
  } catch (err) {
    console.error('Create campaign error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/campaigns/:id ──────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const { title, type, district, venue, organizer, startDate, endDate, time, targetRegistrations, description, status } = req.body;
    const campaign = await Campaign.findByIdAndUpdate(
      req.params.id,
      { title, type, district, venue, organizer, startDate, endDate, time,
        targetRegistrations: targetRegistrations ? parseInt(targetRegistrations) : undefined,
        description, status },
      { new: true }
    );
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign updated', campaign: formatCampaign(campaign) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/campaigns/:id ────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const campaign = await Campaign.findByIdAndDelete(req.params.id);
    if (!campaign) return res.status(404).json({ message: 'Campaign not found' });
    res.json({ message: 'Campaign deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/campaigns/volunteers ───────────────────────────────────────────
router.get('/volunteers', auth, async (req, res) => {
  try {
    const volunteers = await Volunteer.find().sort({ createdAt: -1 });
    res.json({
      volunteers: volunteers.map(v => ({
        _id: v._id, name: v.name, email: v.email, phone: v.phone,
        district: v.district, skills: v.skills, status: v.status,
        campaigns: v.campaigns?.length || 0,
      })),
    });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/campaigns/volunteers ──────────────────────────────────────────
router.post('/volunteers', auth, async (req, res) => {
  try {
    const { name, email, phone, district, skills } = req.body;
    if (!name || !email) return res.status(400).json({ message: 'Name and email are required' });

    const volunteer = new Volunteer({ name, email, phone, district, skills });
    await volunteer.save();
    res.status(201).json({ message: 'Volunteer added', volunteer });
  } catch (err) {
    console.error('Add volunteer error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/campaigns/volunteers/:id ────────────────────────────────────
router.delete('/volunteers/:id', auth, async (req, res) => {
  try {
    const volunteer = await Volunteer.findByIdAndDelete(req.params.id);
    if (!volunteer) return res.status(404).json({ message: 'Volunteer not found' });
    res.json({ message: 'Volunteer removed' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;