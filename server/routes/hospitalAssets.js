// server/routes/hospitalAssets.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Hospital = require('../models/Hospital');
const BloodRequest = require('../models/BloodRequest');

// ══════════════════════════════════════════════════════════════════════════
// HOSPITAL BLOOD REQUESTS — per-hospital breakdown of existing BloodRequest data
// ══════════════════════════════════════════════════════════════════════════
router.get('/blood-requests', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ status: 'approved' }).select('hospitalName district');

    const requests = await BloodRequest.find().populate('hospital', 'hospitalName district').sort({ createdAt: -1 });

    const byHospital = hospitals.map(h => {
      const hospitalRequests = requests.filter(r => r.hospital?._id?.toString() === h._id.toString());
      return {
        hospitalId: h._id,
        hospitalName: h.hospitalName,
        district: h.district,
        totalRequests: hospitalRequests.length,
        pending: hospitalRequests.filter(r => r.status === 'pending').length,
        approved: hospitalRequests.filter(r => ['approved', 'processing'].includes(r.status)).length,
        completed: hospitalRequests.filter(r => r.status === 'delivered').length,
        emergency: hospitalRequests.filter(r => r.priority === 'Emergency').length,
        recentRequests: hospitalRequests.slice(0, 5).map(r => ({
          _id: r._id, bloodGroup: r.bloodGroup, units: r.unitsRequired, status: r.status,
          priority: r.priority, createdAt: r.createdAt,
        })),
      };
    });

    res.json({ hospitals: byHospital });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// HOSPITAL LICENSES — real data reused from the Hospital model
// ══════════════════════════════════════════════════════════════════════════
router.get('/licenses', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ status: 'approved' })
      .select('hospitalName licenseNumber licenseExpiry documents district registrationNumber');

    const today = new Date();
    const licenses = hospitals.map(h => {
      let daysToExpiry = null;
      let status = 'No Expiry Set';
      if (h.licenseExpiry) {
        daysToExpiry = Math.ceil((new Date(h.licenseExpiry) - today) / (1000 * 60 * 60 * 24));
        status = daysToExpiry < 0 ? 'Expired' : daysToExpiry <= 30 ? 'Expiring Soon' : 'Valid';
      }
      return {
        _id: h._id,
        hospitalName: h.hospitalName,
        district: h.district,
        licenseNumber: h.licenseNumber || '—',
        registrationNumber: h.registrationNumber,
        licenseExpiry: h.licenseExpiry,
        daysToExpiry,
        status,
        licenseDocUrl: h.documents?.hospitalLicense?.fileUrl || null,
      };
    });

    res.json({ licenses });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// CONTACT PERSONS — real data reused from the Hospital model
// ══════════════════════════════════════════════════════════════════════════
router.get('/contacts', auth, async (req, res) => {
  try {
    const hospitals = await Hospital.find({ status: 'approved' })
      .select('hospitalName contactPerson designation email phone district');

    const contacts = hospitals.map(h => ({
      _id: h._id,
      hospitalName: h.hospitalName,
      district: h.district,
      contactPerson: h.contactPerson,
      designation: h.designation,
      email: h.email,
      phone: h.phone,
    }));

    res.json({ contacts });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ══════════════════════════════════════════════════════════════════════════
// ACTIVITY LOGS — real events from hospital registrations + blood requests
// ══════════════════════════════════════════════════════════════════════════
router.get('/activity-logs', auth, async (req, res) => {
  try {
    const limit = parseInt(req.query.limit) || 50;

    const [hospitals, requests] = await Promise.all([
      Hospital.find().sort({ createdAt: -1 }).limit(limit).select('hospitalName status createdAt approvedAt'),
      BloodRequest.find().populate('hospital', 'hospitalName').sort({ updatedAt: -1 }).limit(limit),
    ]);

    const items = [];
    hospitals.forEach(h => {
      items.push({ id: `hosp-${h._id}`, icon: '🏥', text: `${h.hospitalName} registered (${h.status})`, date: h.createdAt });
      if (h.approvedAt) items.push({ id: `hosp-appr-${h._id}`, icon: '✅', text: `${h.hospitalName} approved`, date: h.approvedAt });
    });
    requests.forEach(r => {
      items.push({
        id: `req-${r._id}`, icon: r.status === 'delivered' ? '✅' : r.status === 'dispatched' ? '🚑' : '📋',
        text: `${r.hospital?.hospitalName || 'Hospital'} — blood request (${r.bloodGroup}) ${r.status}`,
        date: r.updatedAt,
      });
    });

    items.sort((a, b) => new Date(b.date) - new Date(a.date));
    res.json({ logs: items.slice(0, limit) });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;