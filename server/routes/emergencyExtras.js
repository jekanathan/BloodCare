// server/routes/emergencyExtras.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const EmergencyContact = require('../models/EmergencyContact');
const BloodBag = require('../models/BloodBag');

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];

async function ensureDefaultContacts() {
  const count = await EmergencyContact.countDocuments();
  if (count > 0) return;
  await EmergencyContact.insertMany([
    { label: 'Emergency Hotline', category: 'Other', number: '1919', isDefault: true },
    { label: 'National Hospital', category: 'Hospital', number: '0112691111', isDefault: true },
    { label: 'National Blood Bank', category: 'Blood Bank', number: '0112693633', isDefault: true },
    { label: 'Ambulance Service', category: 'Ambulance', number: '110', isDefault: true },
    { label: 'Police Emergency', category: 'Police', number: '119', isDefault: true },
  ]);
}

// ══════════════════════════════════════════════════════════════════════════
// EMERGENCY CONTACTS
// ══════════════════════════════════════════════════════════════════════════
router.get('/contacts', auth, async (req, res) => {
  try {
    await ensureDefaultContacts();
    const contacts = await EmergencyContact.find().sort({ createdAt: 1 });
    res.json({ contacts });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.post('/contacts', auth, async (req, res) => {
  try {
    const { label, category, number, notes } = req.body;
    if (!label || !number) return res.status(400).json({ message: 'Label and number are required.' });
    const contact = new EmergencyContact({ label, category, number, notes });
    await contact.save();
    res.status(201).json({ message: 'Contact added', contact });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.put('/contacts/:id', auth, async (req, res) => {
  try {
    const contact = await EmergencyContact.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    res.json({ message: 'Updated', contact });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

router.delete('/contacts/:id', auth, async (req, res) => {
  try {
    const contact = await EmergencyContact.findById(req.params.id);
    if (!contact) return res.status(404).json({ message: 'Contact not found' });
    if (contact.isDefault) return res.status(403).json({ message: 'Default contacts cannot be deleted, only edited.' });
    await EmergencyContact.findByIdAndDelete(req.params.id);
    res.json({ message: 'Deleted' });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

// ══════════════════════════════════════════════════════════════════════════
// BLOOD AVAILABILITY — real-time Safe bag counts from the Blood Bags system
// ══════════════════════════════════════════════════════════════════════════
router.get('/blood-availability', auth, async (req, res) => {
  try {
    const safeBags = await BloodBag.find({ status: 'Safe' }).populate('bloodBank', 'bankName district');

    const byGroup = {};
    BLOOD_GROUPS.forEach(g => { byGroup[g] = { bloodGroup: g, count: 0, banks: {} }; });

    safeBags.forEach(bag => {
      if (!byGroup[bag.bloodGroup]) return;
      byGroup[bag.bloodGroup].count += 1;
      const bankName = bag.bloodBank?.bankName || 'Unknown';
      byGroup[bag.bloodGroup].banks[bankName] = (byGroup[bag.bloodGroup].banks[bankName] || 0) + 1;
    });

    const availability = BLOOD_GROUPS.map(g => {
      const count = byGroup[g].count;
      const level = count < 5 ? 'Critical' : count < 15 ? 'Low' : 'Normal';
      return {
        bloodGroup: g,
        count,
        level,
        byBloodBank: Object.entries(byGroup[g].banks).map(([bankName, c]) => ({ bankName, count: c })),
      };
    });

    res.json({ availability, checkedAt: new Date() });
  } catch (err) { res.status(500).json({ message: 'Server error', error: err.message }); }
});

module.exports = router;