// server/routes/hospitalVerification.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const BloodBag = require('../models/BloodBag');
const BagVerification = require('../models/BagVerification');

router.post('/verify', auth, async (req, res) => {
  try {
    const { bagId, verifiedBy, notes } = req.body;
    if (!bagId) return res.status(400).json({ message: 'Bag ID is required.' });

    const bag = await BloodBag.findOne({ bagId: bagId.trim() }).populate('bloodBank', 'bankName');

    let result, log;
    if (!bag) {
      result = 'Invalid';
      log = await new BagVerification({ hospital: req.user.id, bagId, bagStatusAtVerification: 'Not Found', result, verifiedBy, notes }).save();
      return res.status(404).json({ message: 'Bag ID not found in the system. This bag may be counterfeit or mistyped.', result, log });
    }

    result = bag.status === 'Safe' || bag.status === 'Reserved' || bag.status === 'Issued' ? 'Valid' : 'Unsafe';

    log = await new BagVerification({
      hospital: req.user.id, bloodBag: bag._id, bagId: bag.bagId,
      bagStatusAtVerification: bag.status, result, verifiedBy, notes,
    }).save();

    res.json({ message: `Bag ${result}`, result, bag, log });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.get('/history', auth, async (req, res) => {
  try {
    const history = await BagVerification.find({ hospital: req.user.id }).sort({ createdAt: -1 }).limit(200);
    res.json({ history });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;