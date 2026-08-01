// server/routes/bloodBankAssets.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const StorageFacility = require('../models/StorageFacility');
const CollectionCenter = require('../models/CollectionCenter');
const Equipment = require('../models/Equipment');
const BloodBank = require('../models/BloodBank');
const StockHistory = require('../models/StockHistory');

// ══════════════════════════════════════════════════════════════════════════
// STORAGE FACILITIES
// ══════════════════════════════════════════════════════════════════════════
router.get('/storage', auth, async (req, res) => {
  try {
    const items = await StorageFacility.find().populate('bloodBank', 'bankName').sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/storage', auth, async (req, res) => {
  try {
    const item = new StorageFacility(req.body);
    await item.save();
    res.status(201).json({ message: 'Storage facility added', item });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/storage/:id', auth, async (req, res) => {
  try {
    const item = await StorageFacility.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', item });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/storage/:id', auth, async (req, res) => {
  try {
    await StorageFacility.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// COLLECTION CENTERS
// ══════════════════════════════════════════════════════════════════════════
router.get('/collection-centers', auth, async (req, res) => {
  try {
    const items = await CollectionCenter.find().populate('bloodBank', 'bankName').sort({ scheduledDate: -1 });
    res.json({ items });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/collection-centers', auth, async (req, res) => {
  try {
    const item = new CollectionCenter(req.body);
    await item.save();
    res.status(201).json({ message: 'Collection center added', item });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/collection-centers/:id', auth, async (req, res) => {
  try {
    const item = await CollectionCenter.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', item });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/collection-centers/:id', auth, async (req, res) => {
  try {
    await CollectionCenter.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// EQUIPMENT
// ══════════════════════════════════════════════════════════════════════════
router.get('/equipment', auth, async (req, res) => {
  try {
    const items = await Equipment.find().populate('bloodBank', 'bankName').sort({ createdAt: -1 });
    res.json({ items });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/equipment', auth, async (req, res) => {
  try {
    const item = new Equipment(req.body);
    await item.save();
    res.status(201).json({ message: 'Equipment added', item });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/equipment/:id', auth, async (req, res) => {
  try {
    const item = await Equipment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ message: 'Not found' });
    res.json({ message: 'Updated', item });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/equipment/:id', auth, async (req, res) => {
  try {
    await Equipment.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// LICENSES — real data, reused from the BloodBank model (no new model needed)
// ══════════════════════════════════════════════════════════════════════════
router.get('/licenses', auth, async (req, res) => {
  try {
    const banks = await BloodBank.find({ status: 'approved' })
      .select('bankName licenseNumber licenseExpiry documents district registrationNumber');

    const today = new Date();
    const licenses = banks.map(b => {
      let daysToExpiry = null;
      let status = 'No Expiry Set';
      if (b.licenseExpiry) {
        daysToExpiry = Math.ceil((new Date(b.licenseExpiry) - today) / (1000 * 60 * 60 * 24));
        status = daysToExpiry < 0 ? 'Expired' : daysToExpiry <= 30 ? 'Expiring Soon' : 'Valid';
      }
      return {
        _id: b._id,
        bankName: b.bankName,
        district: b.district,
        licenseNumber: b.licenseNumber || '—',
        registrationNumber: b.registrationNumber,
        licenseExpiry: b.licenseExpiry,
        daysToExpiry,
        status,
        licenseDocUrl: b.documents?.bloodBankLicense || null,
      };
    });

    res.json({ licenses });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS — real data, reused from StockHistory (no fabricated events)
// ══════════════════════════════════════════════════════════════════════════
router.get('/activity-logs', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;
    const history = await StockHistory.find().sort({ date: -1 }).limit(limit);

    const logs = history.map(h => ({
      id: h._id,
      icon: h.type === 'IN' ? '🩸' : h.type === 'OUT' ? '🚑' : h.type === 'TRANSFER' ? '🔄' : '⚠️',
      text: `${h.bloodBankName || 'Blood Bank'}: ${h.type} ${h.units} units (${h.bloodGroup})${h.reason ? ' — ' + h.reason : ''}`,
      by: h.by || 'System',
      date: h.date,
    }));

    res.json({ logs });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;