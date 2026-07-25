// server/routes/bloodBags.js
const express = require('express');
const router = express.Router();
const QRCode = require('qrcode');
const auth = require('../middleware/auth');
const BloodBag = require('../models/BloodBag');

async function generateBagId() {
  const year = new Date().getFullYear();
  const count = await BloodBag.countDocuments({ bagId: new RegExp(`^BB-${year}-`) });
  return `BB-${year}-${String(count + 1).padStart(6, '0')}`;
}

// Recompute overall status from the 5 test results
function computeStatus(testResults) {
  const values = Object.values(testResults);
  if (values.some(v => v === 'Positive')) return 'Unsafe';
  if (values.every(v => v === 'Negative')) return 'Safe';
  return 'Under Testing';
}

// ─── GET /api/blood-bags ─────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, bloodGroup, bloodBank, search } = req.query;
    const query = {};
    if (status) query.status = status;
    if (bloodGroup) query.bloodGroup = bloodGroup;
    if (bloodBank) query.bloodBank = bloodBank;
    if (search) query.bagId = { $regex: search, $options: 'i' };

    const bags = await BloodBag.find(query).populate('bloodBank', 'bankName').populate('donor', 'fullName').sort({ createdAt: -1 });
    res.json({ bags });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/blood-bags ─────────────────────────────────────────────────
// Register a new blood bag (collected from a donor)
router.post('/', auth, async (req, res) => {
  try {
    const { bloodBank, donor, donorName, bloodGroup, component, quantityMl, collectionDate, expiryDate, storageLocation } = req.body;
    if (!bloodBank || !bloodGroup || !collectionDate || !expiryDate) {
      return res.status(400).json({ message: 'Blood bank, blood group, collection date and expiry date are required.' });
    }

    const bagId = await generateBagId();
    const bag = new BloodBag({
      bagId, bloodBank, donor: donor || undefined, donorName,
      bloodGroup, component, quantityMl, collectionDate, expiryDate, storageLocation,
      status: 'Collected',
    });
    await bag.save();
    res.status(201).json({ message: 'Blood bag registered', bag });
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Bag ID collision, please try again.' });
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/blood-bags/:id ───────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const bag = await BloodBag.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!bag) return res.status(404).json({ message: 'Blood bag not found' });
    res.json({ message: 'Updated', bag });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-bags/:id/testing ──────────────────────────────────────
// Submit lab test results — auto-computes overall status
router.patch('/:id/testing', auth, async (req, res) => {
  try {
    const { hiv, hepatitisB, hepatitisC, syphilis, malaria, testedBy } = req.body;
    const bag = await BloodBag.findById(req.params.id);
    if (!bag) return res.status(404).json({ message: 'Blood bag not found' });

    bag.testResults = {
      hiv: hiv || bag.testResults.hiv,
      hepatitisB: hepatitisB || bag.testResults.hepatitisB,
      hepatitisC: hepatitisC || bag.testResults.hepatitisC,
      syphilis: syphilis || bag.testResults.syphilis,
      malaria: malaria || bag.testResults.malaria,
    };
    bag.testedBy = testedBy || bag.testedBy;
    bag.testedAt = new Date();
    bag.status = computeStatus(bag.testResults);

    await bag.save();
    res.json({ message: `Test results saved — bag marked as ${bag.status}`, bag });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-bags/:id/dispose ──────────────────────────────────────
router.patch('/:id/dispose', auth, async (req, res) => {
  try {
    const { reason } = req.body;
    const bag = await BloodBag.findByIdAndUpdate(
      req.params.id,
      { status: 'Disposed', disposalReason: reason, disposalDate: new Date(), disposedBy: req.user.id },
      { new: true }
    );
    if (!bag) return res.status(404).json({ message: 'Blood bag not found' });
    res.json({ message: 'Blood bag disposed', bag });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/blood-bags/:id/status ───────────────────────────────────────
// Manual status change (e.g. mark Reserved/Issued/Quarantined)
router.patch('/:id/status', auth, async (req, res) => {
  try {
    const { status } = req.body;
    const bag = await BloodBag.findById(req.params.id);
    if (!bag) return res.status(404).json({ message: 'Blood bag not found' });

    if (status === 'Issued' && bag.status !== 'Safe') {
      return res.status(400).json({ message: 'Only Safe (tested & negative) blood bags can be issued.' });
    }

    bag.status = status;
    await bag.save();
    res.json({ message: 'Status updated', bag });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/blood-bags/:id/qr ─────────────────────────────────────────────
router.get('/:id/qr', auth, async (req, res) => {
  try {
    const bag = await BloodBag.findById(req.params.id);
    if (!bag) return res.status(404).json({ message: 'Blood bag not found' });

    const qrDataUrl = await QRCode.toDataURL(bag.bagId, { margin: 1, width: 250 });
    res.json({ bagId: bag.bagId, qrDataUrl });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/blood-bags/:id ─────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    await BloodBag.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;