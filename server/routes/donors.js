const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Donor = require('../models/Donor');
const auth = require('../middleware/auth');

// ─── GET /api/donors ─────────────────────────────────────────────────────
// Admin: list all donors (joins User status into Donor data)
router.get('/', async (req, res) => {
  try {
    const donors = await Donor.find().populate('user', 'email status name').sort({ createdAt: -1 });

    const formatted = donors.map(d => ({
      _id:          d._id,
      name:         d.fullName,
      nic:          d.nic,
      email:        d.email || d.user?.email,
      phone:        d.phone,
      bloodGroup:   d.bloodGroup,
      district:     d.district,
      status:       d.user?.status || d.status,
      donations:    d.totalDonations || 0,
      lastDonation: d.lastDonationDate || null,
      createdAt:    d.createdAt,
      gender:       d.gender,
      dob:          d.dateOfBirth,
      weight:       d.weight || null,
      eligible:     d.isEligible,
      userId:       d.user?._id,
      address:      d.address,
      medicalInfo:  d.medicalInfo,
      testingStatus:  d.testingStatus,
      testingBooking: d.testingBooking || null,
      testingResult:  d.testingResult || null,
    }));

    res.json({ donors: formatted });
  } catch (err) {
    console.error('Get donors error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/donors ─────────────────────────────────────────────────────
// Admin manually adds a donor — created as 'approved' immediately since the
// admin is directly entering verified information (no separate approval step).
router.post('/', auth, async (req, res) => {
  try {
    const { name, nic, phone, email, bloodGroup, district, address, dob, gender, weight, password } = req.body;

    if (!name || !email || !bloodGroup || !password) {
      return res.status(400).json({ message: 'Name, email, blood group and password are required.' });
    }
    if (password.length < 8) {
      return res.status(400).json({ message: 'Password must be at least 8 characters.' });
    }

    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: 'Email already registered' });
    }
    if (nic) {
      const existingNic = await Donor.findOne({ nic });
      if (existingNic) {
        return res.status(400).json({ message: 'NIC already registered' });
      }
    }

    const user = new User({
      name,
      email: email.toLowerCase(),
      password,
      role: 'donor',
      status: 'approved', // admin-added → active immediately
    });
    await user.save();

    try {
      const donor = new Donor({
        user: user._id,
        fullName: name,
        nic,
        phone,
        email: email.toLowerCase(),
        bloodGroup,
        district,
        address,
        dateOfBirth: dob || undefined,
        gender,
        weight: weight || undefined,
        status: 'approved',
        testingStatus: 'testing_pending',
        approvedAt: new Date(),
        approvedBy: req.user.id,
      });
      await donor.save();

      res.status(201).json({ message: 'Donor added successfully', donor });
    } catch (donorErr) {
      await User.findByIdAndDelete(user._id);
      throw donorErr;
    }
  } catch (err) {
    console.error('Add donor error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `This ${field} is already registered.` });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donors/:id ──────────────────────────────────────────────────
router.get('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id).populate('user', 'email status name');
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── PATCH /api/donors/:id/approve ────────────────────────────────────────
router.patch('/:id/approve', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    donor.status = 'approved';
    donor.testingStatus = 'testing_pending';
    donor.approvedBy = req.user?.id;
    donor.approvedAt = new Date();
    await donor.save();

    await User.findByIdAndUpdate(donor.user, { status: 'approved' });

    const io = req.app.get('io');
    if (io) {
      io.to(`donor:${donor.user}`).emit('account_approved', {
        message: '🎉 Your account is approved! Please book a blood testing appointment.',
      });
    }

    res.json({ message: 'Donor approved successfully', donor });
  } catch (err) {
    console.error('Approve donor error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/donors/:id/reject ─────────────────────────────────────────
router.patch('/:id/reject', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    donor.status = 'rejected';
    await donor.save();
    await User.findByIdAndUpdate(donor.user, { status: 'rejected' });

    res.json({ message: 'Donor rejected', donor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/donors/:id/blacklist ──────────────────────────────────────
router.patch('/:id/blacklist', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    donor.status = 'suspended';
    donor.isEligible = false;
    await donor.save();
    await User.findByIdAndUpdate(donor.user, { status: 'suspended' });

    res.json({ message: 'Donor blacklisted', donor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PUT /api/donors/:id ───────────────────────────────────────────────────
// Edit donor profile
router.put('/:id', async (req, res) => {
  try {
    const { fullName, name, nic, phone, email, bloodGroup, district, address, dateOfBirth, dob, gender, medicalInfo, weight } = req.body;
    const donor = await Donor.findByIdAndUpdate(
      req.params.id,
      {
        fullName: fullName || name,
        nic, phone, email, bloodGroup, district, address,
        dateOfBirth: dateOfBirth || dob,
        gender, medicalInfo, weight,
      },
      { new: true }
    );
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    res.json({ message: 'Donor updated', donor });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── DELETE /api/donors/:id ────────────────────────────────────────────────
router.delete('/:id', async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.id);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    await User.findByIdAndDelete(donor.user);
    await Donor.findByIdAndDelete(req.params.id);

    res.json({ message: 'Donor deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;