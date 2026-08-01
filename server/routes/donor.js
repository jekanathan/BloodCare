const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const Donor = require('../models/Donor');
const Settings = require('../models/Settings');
const BloodBag = require('../models/BloodBag');
const BloodRequest = require('../models/BloodRequest');
const Notification = require('../models/Notification');
const Appointment = require('../models/Appointment');
const auth = require('../middleware/auth');

const BADGE_TIERS = [
  { min: 100, name: 'Legend' },
  { min: 50,  name: 'Life Saver' },
  { min: 25,  name: 'Diamond Hero' },
  { min: 10,  name: 'Gold Hero' },
  { min: 5,   name: 'Star Donor' },
  { min: 1,   name: 'First Drop' },
];
const badgeForCount = (count) => (BADGE_TIERS.find(t => count >= t.min) || { name: 'New Donor' }).name;

// ─── POST /api/donor/register ──────────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const {
      fullName, nic, dateOfBirth, gender, bloodGroup,
      phone, email, password, address, district, medicalInfo
    } = req.body;

    if (!fullName || !email || !password || !bloodGroup) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Check system settings — block new registrations if admin turned it off
    const settings = await Settings.findOne({ key: 'main' });
    if (settings && settings.registrationOpen === false) {
      return res.status(403).json({ message: 'Donor registration is currently closed. Please try again later.' });
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

    // If Auto-Approve Donors is ON, skip pending admin approval
    const autoApprove = settings?.autoApprove === true;

    const user = new User({
      name: fullName,
      email: email.toLowerCase(),
      password,
      role: 'donor',
      status: autoApprove ? 'approved' : 'pending',
    });
    await user.save();

    try {
      const donor = new Donor({
        user: user._id,
        fullName,
        nic,
        dateOfBirth,
        gender,
        bloodGroup,
        phone,
        email: email.toLowerCase(),
        address,
        district,
        medicalInfo,
        status: autoApprove ? 'approved' : 'pending',
        testingStatus: autoApprove ? 'testing_pending' : 'pending',
        ...(autoApprove && { approvedAt: new Date() }),
      });
      await donor.save();

      res.status(201).json({
        message: autoApprove
          ? 'Registration successful! Your account has been auto-approved — please book a blood testing appointment.'
          : 'Registration successful. Your account is pending admin approval.',
        userId: user._id,
        donorId: donor._id,
        autoApproved: autoApprove,
      });
    } catch (donorErr) {
      await User.findByIdAndDelete(user._id);
      throw donorErr;
    }

  } catch (err) {
    console.error('Donor register error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `This ${field} is already registered.` });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/donor/login ──────────────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email: email?.toLowerCase(), role: 'donor' });
    if (!user) return res.status(400).json({ message: 'Invalid credentials' });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

    if (user.status === 'pending') {
      return res.status(403).json({ message: 'Your account is pending admin approval.' });
    }
    if (user.status === 'rejected') {
      return res.status(403).json({ message: 'Your account has been rejected.' });
    }
    if (user.status === 'suspended') {
      return res.status(403).json({ message: 'Your account has been suspended.' });
    }

    const donor = await Donor.findOne({ user: user._id });

    const token = jwt.sign(
      { id: user._id, role: user.role },
      process.env.JWT_SECRET || 'bloodcare_secret',
      { expiresIn: '24h' }
    );

    user.lastLogin = new Date();
    await user.save();

    // testingStatus tells the donor portal what screen to show:
    // testing_pending → show "book a testing appointment" screen
    // testing_booked  → show "waiting for hospital/bloodbank review" screen
    // active          → full dashboard access
    // testing_rejected → show rejection screen
    res.json({ token, donor });

  } catch (err) {
    console.error('Donor login error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donor/me ───────────────────────────────────────────────────────
router.get('/me', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    res.json(donor);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
});

// ─── GET /api/donor/dashboard ─────────────────────────────────────────────
// Aggregates everything the donor dashboard needs in one call — all figures
// are computed live from the database (no hardcoded/mock values).
router.get('/dashboard', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const [history, activeRequests, notifications, nextAppointment] = await Promise.all([
      BloodBag.find({ donor: donor._id })
        .sort({ collectionDate: -1 })
        .limit(10)
        .populate('bloodBank', 'bankName'),

      BloodRequest.find({
        bloodGroup: donor.bloodGroup,
        status: { $in: ['pending', 'approved', 'processing'] },
      })
        .sort({ priority: -1, createdAt: -1 })
        .limit(5)
        .populate('hospital', 'hospitalName'),

      Notification.find({
        status: 'sent',
        recipientGroup: {
          $in: ['All Donors', `${donor.bloodGroup} Donors`, ...(donor.isEligible ? ['Eligible Donors'] : [])],
        },
      })
        .sort({ sentAt: -1 })
        .limit(5),

      Appointment.findOne({ donor: donor._id, status: 'confirmed', date: { $gte: new Date() } })
        .sort({ date: 1 })
        .populate('bloodBank', 'bankName address'),
    ]);

    // Months since last donation (based on the donor's own record, falling
    // back to the most recent BloodBag entry if lastDonationDate isn't set).
    const lastDonation = donor.lastDonationDate || history[0]?.collectionDate || null;
    const monthsSinceLast = lastDonation
      ? Math.floor((Date.now() - new Date(lastDonation).getTime()) / (30 * 86400000))
      : null;

    // Next eligible date, informational only — actual eligibility is driven
    // by donor.isEligible, which hospitals/blood banks set after screening.
    const nextEligibleDate = !donor.isEligible && lastDonation
      ? new Date(new Date(lastDonation).getTime() + 90 * 86400000)
      : null;
    const daysUntilEligible = nextEligibleDate
      ? Math.max(0, Math.ceil((nextEligibleDate.getTime() - Date.now()) / 86400000))
      : 0;

    res.json({
      donor: {
        fullName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        district: donor.district,
        isEligible: donor.isEligible,
        totalDonations: donor.totalDonations,
        lastDonationDate: lastDonation,
        daysUntilEligible,
        badge: badgeForCount(donor.totalDonations || 0),
        livesImpacted: (donor.totalDonations || 0) * 3,
        monthsSinceLast,
      },
      history: history.map(h => ({
        _id: h._id,
        date: h.collectionDate,
        location: h.bloodBank?.bankName || 'BloodCare Facility',
        units: h.quantityMl,
        status: h.status,
      })),
      activeRequests: activeRequests.map(r => ({
        _id: r._id,
        hospitalName: r.hospital?.hospitalName || 'Hospital',
        bloodGroup: r.bloodGroup,
        unitsRequired: r.unitsRequired,
        priority: r.priority,
        createdAt: r.createdAt,
      })),
      notifications: notifications.map(n => ({
        _id: n._id,
        title: n.title,
        message: n.message,
        type: n.type,
        sentAt: n.sentAt,
      })),
      nextAppointment: nextAppointment ? {
        _id: nextAppointment._id,
        bank: nextAppointment.bloodBank?.bankName || nextAppointment.bloodBankName || 'Blood Bank',
        address: nextAppointment.bloodBank?.address || nextAppointment.bloodBankAddress || '',
        date: nextAppointment.date,
        time: nextAppointment.time,
      } : null,
    });
  } catch (err) {
    console.error('Donor dashboard error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── POST /api/donor/book-testing ─────────────────────────────────────────
// Donor books a blood testing appointment at a hospital or blood bank.
// Moves testingStatus from 'testing_pending' → 'testing_booked'.
router.post('/book-testing', auth, async (req, res) => {
  try {
    const { facilityType, facilityId, facilityName, appointmentDate, notes } = req.body;

    if (!facilityType || !facilityId || !appointmentDate) {
      return res.status(400).json({ message: 'Missing required booking fields' });
    }

    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor not found' });

    console.log('🔍 DEBUG book-testing — donor.testingStatus is:', JSON.stringify(donor.testingStatus));

    if (donor.testingStatus !== 'testing_pending') {
      return res.status(400).json({ message: `Testing appointment cannot be booked at this stage (current: ${donor.testingStatus})` });
    }

    donor.testingBooking = {
      facilityType,
      facilityId,
      facilityName,
      appointmentDate,
      notes,
      bookedAt: new Date(),
    };
    donor.testingStatus = 'testing_booked';
    await donor.save();

    // Notify the chosen facility in real-time (hospital/bloodbank dashboards)
    const io = req.app.get('io');
    if (io) {
      io.to(`${facilityType}:${facilityId}`).emit('new_testing_booking', {
        donorId:   donor._id,
        donorName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        appointmentDate,
        message: `🩸 New blood testing appointment from ${donor.fullName}`,
      });
    }

    res.json({ message: 'Testing appointment booked successfully', donor });
  } catch (err) {
    console.error('Book testing error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;