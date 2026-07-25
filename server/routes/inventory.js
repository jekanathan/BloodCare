const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const StockHistory = require('../models/StockHistory');
const BloodBank = require('../models/BloodBank');

const getDaysToExpiry = (expiryDate) => {
  if (!expiryDate) return null;
  return Math.ceil((new Date(expiryDate) - new Date()) / (1000*60*60*24));
};

// ─── GET /api/inventory ─────────────────────────────────────────────────────
// All inventory batch records, with blood bank name populated.
router.get('/', auth, async (req, res) => {
  try {
    const items = await Inventory.find()
      .populate('bloodBank', 'bankName')
      .sort({ createdAt: -1 });

    res.json({
      inventory: items.map(i => ({
        _id: i._id,
        bloodGroup: i.bloodGroup,
        component: i.component,
        units: i.units,
        reserved: i.reserved,
        expired: i.expired,
        bloodBank: i.bloodBank?.bankName || 'Unknown',
        bloodBankId: i.bloodBank?._id,
        collectedDate: i.collectedDate,
        expiryDate: i.expiryDate,
        donorReference: i.donorReference,
      })),
    });
  } catch (err) {
    console.error('Get inventory error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/inventory/blood-banks ─────────────────────────────────────────
// Approved blood banks, for populating the Add Stock / Transfer dropdowns.
router.get('/blood-banks', auth, async (req, res) => {
  try {
    const banks = await BloodBank.find({ status: 'approved' }).select('bankName');
    res.json({ bloodBanks: banks.map(b => ({ _id: b._id, name: b.bankName })) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/inventory/history ─────────────────────────────────────────────
router.get('/history', auth, async (req, res) => {
  try {
    const history = await StockHistory.find().sort({ date: -1 }).limit(100);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/inventory ────────────────────────────────────────────────────
// Add new blood stock — creates an Inventory batch record + an IN history entry.
router.post('/', auth, async (req, res) => {
  try {
    const { bloodGroup, component, bloodBankId, units, collectedDate, expiryDate, donorReference } = req.body;

    if (!bloodGroup || !bloodBankId || !units) {
      return res.status(400).json({ message: 'Blood group, blood bank, and units are required' });
    }

    const bank = await BloodBank.findById(bloodBankId);
    if (!bank) return res.status(404).json({ message: 'Blood bank not found' });

    const item = new Inventory({
      bloodGroup, component: component || 'Whole Blood',
      bloodBank: bloodBankId,
      units: parseInt(units), reserved: 0, expired: 0,
      collectedDate: collectedDate || undefined,
      expiryDate: expiryDate || undefined,
      donorReference,
      updatedBy: req.user.id,
    });
    await item.save();

    await new StockHistory({
      type: 'IN', bloodGroup, component: component || 'Whole Blood',
      units: parseInt(units),
      bloodBank: bloodBankId, bloodBankName: bank.bankName,
      by: req.user.name || 'Admin',
    }).save();

    res.status(201).json({ message: 'Stock added successfully', item });
  } catch (err) {
    console.error('Add stock error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/inventory/transfer ───────────────────────────────────────────
// Transfers units between two blood banks for a given blood group/component.
// Decrements an existing batch at the source bank, creates/increments a batch
// at the destination bank, and logs a TRANSFER history entry.
router.post('/transfer', auth, async (req, res) => {
  try {
    const { bloodGroup, component, fromBloodBankId, toBloodBankId, units, reason } = req.body;

    if (!bloodGroup || !fromBloodBankId || !toBloodBankId || !units) {
      return res.status(400).json({ message: 'Blood group, source/destination banks, and units are required' });
    }
    if (fromBloodBankId === toBloodBankId) {
      return res.status(400).json({ message: 'Source and destination blood banks must be different' });
    }

    const transferUnits = parseInt(units);
    const [fromBank, toBank] = await Promise.all([
      BloodBank.findById(fromBloodBankId),
      BloodBank.findById(toBloodBankId),
    ]);
    if (!fromBank || !toBank) return res.status(404).json({ message: 'Blood bank not found' });

    // Find available stock at the source bank
    const sourceItem = await Inventory.findOne({
      bloodBank: fromBloodBankId, bloodGroup, component: component || 'Whole Blood', units: { $gte: transferUnits },
    }).sort({ createdAt: 1 });

    if (!sourceItem) {
      return res.status(400).json({ message: `Not enough ${bloodGroup} ${component || 'Whole Blood'} stock at ${fromBank.bankName} to transfer ${transferUnits} units` });
    }

    sourceItem.units -= transferUnits;
    await sourceItem.save();

    // Add (or top up) a matching batch at the destination bank
    let destItem = await Inventory.findOne({ bloodBank: toBloodBankId, bloodGroup, component: component || 'Whole Blood' });
    if (destItem) {
      destItem.units += transferUnits;
      await destItem.save();
    } else {
      destItem = await new Inventory({
        bloodGroup, component: component || 'Whole Blood',
        bloodBank: toBloodBankId, units: transferUnits,
        expiryDate: sourceItem.expiryDate, updatedBy: req.user.id,
      }).save();
    }

    await new StockHistory({
      type: 'TRANSFER', bloodGroup, component: component || 'Whole Blood',
      units: transferUnits,
      bloodBank: fromBloodBankId, bloodBankName: fromBank.bankName,
      toBloodBank: toBloodBankId, toBloodBankName: toBank.bankName,
      reason, by: req.user.name || 'Admin',
    }).save();

    res.json({ message: 'Stock transferred successfully' });
  } catch (err) {
    console.error('Transfer stock error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/inventory/:id ──────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const item = await Inventory.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ message: 'Inventory record not found' });
    res.json({ message: 'Inventory record deleted' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;