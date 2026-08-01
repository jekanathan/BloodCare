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
const Campaign = require('../models/Campaign');
const auth = require('../middleware/auth');
const { districtDistanceKm } = require('../utils/districtDistance');

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

// ─── PUT /api/donor/profile ───────────────────────────────────────────────
// Lets the logged-in donor update their own editable profile fields.
router.put('/profile', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const EDITABLE_FIELDS = [
      'fullName', 'nic', 'dateOfBirth', 'gender', 'bloodGroup',
      'phone', 'email', 'address', 'district', 'medicalInfo',
    ];

    EDITABLE_FIELDS.forEach((field) => {
      if (req.body[field] !== undefined) donor[field] = req.body[field];
    });

    await donor.save();
    res.json(donor);
  } catch (err) {
    console.error('Donor profile update error:', err);
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || 'field';
      return res.status(400).json({ message: `This ${field} is already in use.` });
    }
    res.status(500).json({ message: 'Server error', error: err.message });
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

    // Points are a transparent function of real activity — not a stored
    // fake number: 50 per completed donation, +10 while currently eligible.
    const donorPoints = (donor.totalDonations || 0) * 50 + (donor.isEligible ? 10 : 0);

    // Last-12-months donation counts, built from real BloodBag history.
    const now = new Date();
    const chartData = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthLabel = d.toLocaleString('en', { month: 'short' });
      const count = history.filter(h => {
        const hd = new Date(h.collectionDate);
        return hd.getFullYear() === d.getFullYear() && hd.getMonth() === d.getMonth();
      }).length;
      chartData.push({ month: monthLabel, count });
    }

    const topEmergencyRequest = activeRequests.find(r => r.priority === 'Emergency') || activeRequests[0] || null;

    res.json({
      donor: {
        fullName: donor.fullName,
        bloodGroup: donor.bloodGroup,
        district: donor.district,
        isEligible: donor.isEligible,
        totalDonations: donor.totalDonations,
        lastDonationDate: lastDonation,
        daysUntilEligible,
        nextEligibleDate,
        badge: badgeForCount(donor.totalDonations || 0),
        livesImpacted: (donor.totalDonations || 0) * 3,
        monthsSinceLast,
        points: donorPoints,
      },
      chartData,
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
      topEmergencyRequest,
    });
  } catch (err) {
    console.error('Donor dashboard error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donor/requests ───────────────────────────────────────────────
// All open blood requests matching the donor's blood group (not capped at 5
// like the dashboard summary), including this donor's own accept/decline
// response if they've already responded.
router.get('/requests', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const requests = await BloodRequest.find({
      bloodGroup: donor.bloodGroup,
      status: { $in: ['pending', 'approved', 'processing'] },
    })
      .populate('hospital', 'hospitalName district');

    const withDistance = requests.map(r => {
      const myResponse = r.donorResponses.find(dr => String(dr.donor) === String(donor._id));
      return {
        _id: r._id,
        hospital: {
          hospitalName: r.hospital?.hospitalName || 'Hospital',
          district: r.hospital?.district || '',
        },
        bloodGroup: r.bloodGroup,
        unitsRequired: r.unitsRequired,
        priority: r.priority,
        patientAge: r.patientAge,
        patientCondition: r.patientCondition || null,
        createdAt: r.createdAt,
        myResponse: myResponse ? myResponse.response : null,
        distanceKm: districtDistanceKm(donor.district, r.hospital?.district),
      };
    });

    // Nearest first within the same priority tier — closer requests are
    // usually the ones a donor can realistically respond to.
    const PRIORITY_RANK = { Emergency: 0, Urgent: 1, Normal: 2 };
    withDistance.sort((a, b) => {
      const pr = (PRIORITY_RANK[a.priority] ?? 3) - (PRIORITY_RANK[b.priority] ?? 3);
      if (pr !== 0) return pr;
      if (a.distanceKm === null) return 1;
      if (b.distanceKm === null) return -1;
      return a.distanceKm - b.distanceKm;
    });

    res.json({
      bloodGroup: donor.bloodGroup,
      requests: withDistance,
    });
  } catch (err) {
    console.error('Get donor requests error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donor/donations ───────────────────────────────────────────────
// Full donation history (not capped at 10 like the dashboard summary),
// with real bag/testing details for the history page's expanded view.
router.get('/donations', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const bags = await BloodBag.find({ donor: donor._id })
      .sort({ collectionDate: -1 })
      .populate('bloodBank', 'bankName address');

    const totalMl = bags.reduce((s, b) => s + (b.quantityMl || 0), 0);

    res.json({
      donations: bags.map(b => ({
        _id: b._id,
        bagId: b.bagId,
        date: b.collectionDate,
        location: b.bloodBank?.bankName || 'BloodCare Facility',
        address: b.bloodBank?.address || '',
        bloodGroup: b.bloodGroup,
        component: b.component,
        units: b.quantityMl,
        status: b.status,
        testResults: b.testResults,
        testedAt: b.testedAt || null,
        expiryDate: b.expiryDate,
      })),
      summary: {
        totalDonations: bags.length,
        totalMl,
        livesImpacted: bags.length * 3,
        badge: badgeForCount(bags.length),
      },
    });
  } catch (err) {
    console.error('Donor donations error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donor/notifications-feed ──────────────────────────────────────
// Unified, real-data notification feed for the donor: broadcast
// announcements (persisted read/unread), plus live blood-request,
// appointment and campaign activity relevant to this donor.
router.get('/notifications-feed', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const [announcements, requests, appointments, campaigns] = await Promise.all([
      Notification.find({
        status: 'sent',
        recipientGroup: {
          $in: ['All Donors', `${donor.bloodGroup} Donors`, ...(donor.isEligible ? ['Eligible Donors'] : [])],
        },
      }).sort({ sentAt: -1 }).limit(20),

      BloodRequest.find({
        bloodGroup: donor.bloodGroup,
        status: { $in: ['pending', 'approved', 'processing'] },
      }).sort({ createdAt: -1 }).limit(10).populate('hospital', 'hospitalName'),

      Appointment.find({ donor: donor._id }).sort({ updatedAt: -1 }).limit(10)
        .populate('bloodBank', 'bankName'),

      Campaign.find({
        status: { $in: ['upcoming', 'active'] },
        $or: [
          { targetBloodGroups: 'All' },
          { targetBloodGroups: donor.bloodGroup },
          { district: donor.district },
        ],
      }).sort({ startDate: 1 }).limit(10),
    ]);

    const items = [
      ...announcements.map(n => ({
        _id: n._id,
        source: 'notification',
        type: 'system',
        category: 'system',
        icon: n.type === 'Announcement' ? '📣' : n.type === 'SMS' ? '💬' : n.type === 'Email' ? '✉️' : '🔔',
        title: n.title,
        desc: n.message,
        time: n.sentAt,
        unread: !n.readBy?.some(id => id.toString() === req.user.id),
      })),
      ...requests.map(r => ({
        _id: r._id,
        source: 'request',
        type: r.priority === 'Emergency' ? 'emergency' : 'hospital',
        category: 'requests',
        icon: r.priority === 'Emergency' ? '🚨' : '🏥',
        title: r.priority === 'Emergency' ? 'Emergency Blood Request' : 'Hospital Blood Request',
        desc: `${r.hospital?.hospitalName || 'A hospital'} needs ${r.bloodGroup} blood. ${r.unitsRequired} unit${r.unitsRequired !== 1 ? 's' : ''} required.`,
        time: r.createdAt,
        unread: false, // derived, not a persisted-read item
      })),
      ...appointments.map(a => ({
        _id: a._id,
        source: 'appointment',
        type: 'appointment',
        category: 'appointments',
        icon: a.status === 'cancelled' ? '❌' : '📅',
        title: a.status === 'cancelled' ? 'Appointment Cancelled' : 'Appointment Reminder',
        desc: a.status === 'cancelled'
          ? `Your appointment at ${a.bloodBank?.bankName || 'the blood bank'} was cancelled.`
          : `You have a donation appointment on ${new Date(a.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })} at ${a.time}, ${a.bloodBank?.bankName || 'the blood bank'}.`,
        time: a.updatedAt,
        unread: false,
      })),
      ...campaigns.map(c => ({
        _id: c._id,
        source: 'campaign',
        type: 'campaign',
        category: 'campaigns',
        icon: '📢',
        title: 'New Donation Campaign',
        desc: `${c.title} — ${c.venue || c.district || ''}, ${new Date(c.startDate).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}${c.time ? ` (${c.time})` : ''}. Register now!`,
        time: c.createdAt,
        unread: false,
      })),
    ].sort((a, b) => new Date(b.time) - new Date(a.time));

    res.json({ items });
  } catch (err) {
    console.error('Donor notifications feed error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/donor/notifications-feed/:id/read ───────────────────────────
router.patch('/notifications-feed/:id/read', auth, async (req, res) => {
  try {
    const notif = await Notification.findById(req.params.id);
    if (!notif) return res.status(404).json({ message: 'Notification not found' });

    const alreadyRead = notif.readBy?.some(id => id.toString() === req.user.id);
    if (!alreadyRead) {
      notif.readBy.push(req.user.id);
      notif.openedCount = (notif.openedCount || 0) + 1;
      await notif.save();
    }
    res.json({ message: 'Marked as read' });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── PATCH /api/donor/notifications-feed/mark-all-read ──────────────────────
router.patch('/notifications-feed/mark-all-read', auth, async (req, res) => {
  try {
    const donor = await Donor.findOne({ user: req.user.id });
    if (!donor) return res.status(404).json({ message: 'Donor profile not found' });

    const notifs = await Notification.find({
      status: 'sent',
      recipientGroup: {
        $in: ['All Donors', `${donor.bloodGroup} Donors`, ...(donor.isEligible ? ['Eligible Donors'] : [])],
      },
      readBy: { $ne: req.user.id },
    });

    await Promise.all(notifs.map(n => {
      n.readBy.push(req.user.id);
      n.openedCount = (n.openedCount || 0) + 1;
      return n.save();
    }));

    res.json({ message: 'All marked as read' });
  } catch (err) {
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

// ─── PATCH /api/donor/change-password ───────────────────────────────────────
router.patch('/change-password', auth, async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      return res.status(400).json({ message: 'Current and new password are required' });
    }
    if (newPassword.length < 6) {
      return res.status(400).json({ message: 'New password must be at least 6 characters' });
    }

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) return res.status(400).json({ message: 'Current password is incorrect' });

    user.password = newPassword; // pre-save hook re-hashes
    await user.save();

    res.json({ message: 'Password updated successfully' });
  } catch (err) {
    console.error('Change password error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;