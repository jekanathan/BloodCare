// server/routes/hospitalTransfusions.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Transfusion = require('../models/Transfusion');
const BloodRequest = require('../models/BloodRequest');

router.get('/', auth, async (req, res) => {
  try {
    const transfusions = await Transfusion.find({ hospital: req.user.id }).sort({ scheduledDate: -1 });
    res.json({ transfusions });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.get('/eligible-requests', auth, async (req, res) => {
  try {
    const scheduled = await Transfusion.find({ hospital: req.user.id }).select('bloodRequest');
    const scheduledIds = scheduled.map(t => t.bloodRequest.toString());

    const requests = await BloodRequest.find({ hospital: req.user.id, status: 'delivered' })
      .select('patient patientName bloodGroup unitsRequired');

    const eligible = requests.filter(r => !scheduledIds.includes(r._id.toString()));
    res.json({ requests: eligible });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/', auth, async (req, res) => {
  try {
    const { bloodRequestId, patientId, patientName, bloodGroup, units, scheduledDate } = req.body;
    if (!bloodRequestId || !bloodGroup || !units || !scheduledDate) {
      return res.status(400).json({ message: 'Blood request, blood group, units, and scheduled date are required.' });
    }
    const transfusion = new Transfusion({
      hospital: req.user.id, bloodRequest: bloodRequestId, patient: patientId || undefined,
      patientName, bloodGroup, units, scheduledDate, status: 'Scheduled',
    });
    await transfusion.save();
    res.status(201).json({ message: 'Transfusion scheduled', transfusion });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/start', auth, async (req, res) => {
  try {
    const { vitalsBefore, administeredBy } = req.body;
    const t = await Transfusion.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.id },
      { status: 'Ongoing', startedAt: new Date(), vitalsBefore, administeredBy },
      { new: true }
    );
    if (!t) return res.status(404).json({ message: 'Transfusion not found' });
    res.json({ message: 'Transfusion started', transfusion: t });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/complete', auth, async (req, res) => {
  try {
    const { vitalsAfter, notes } = req.body;
    const t = await Transfusion.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.id },
      { status: 'Completed', completedAt: new Date(), vitalsAfter, notes },
      { new: true }
    );
    if (!t) return res.status(404).json({ message: 'Transfusion not found' });
    res.json({ message: 'Transfusion completed', transfusion: t });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/adverse-reaction', auth, async (req, res) => {
  try {
    const { type, severity, actionTaken } = req.body;
    const t = await Transfusion.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!t) return res.status(404).json({ message: 'Transfusion not found' });
    t.adverseReaction = { occurred: true, type, severity, actionTaken, reportedAt: new Date() };
    await t.save();
    res.json({ message: 'Adverse reaction recorded', transfusion: t });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/follow-up', auth, async (req, res) => {
  try {
    const { required, notes, followUpDate, completed } = req.body;
    const t = await Transfusion.findOne({ _id: req.params.id, hospital: req.user.id });
    if (!t) return res.status(404).json({ message: 'Transfusion not found' });
    t.followUp = { required, notes, followUpDate, completed: !!completed };
    await t.save();
    res.json({ message: 'Follow-up updated', transfusion: t });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.patch('/:id/cancel', auth, async (req, res) => {
  try {
    const t = await Transfusion.findOneAndUpdate(
      { _id: req.params.id, hospital: req.user.id },
      { status: 'Cancelled' },
      { new: true }
    );
    if (!t) return res.status(404).json({ message: 'Transfusion not found' });
    res.json({ message: 'Transfusion cancelled', transfusion: t });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;