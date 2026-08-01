// server/routes/locations.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const StockHistory = require('../models/StockHistory');

const DISTRICT_COORDS = {
  Colombo:[6.9271,79.8612], Gampaha:[7.0917,79.9999], Kalutara:[6.5854,79.9607],
  Kandy:[7.2906,80.6337], Matale:[7.4675,80.6234], 'Nuwara Eliya':[6.9497,80.7891],
  Galle:[6.0535,80.2210], Matara:[5.9485,80.5353], Hambantota:[6.1241,81.1185],
  Jaffna:[9.6615,80.0255], Kilinochchi:[9.3961,80.3982], Mannar:[8.9810,79.9044],
  Vavuniya:[8.7514,80.4971], Mullaitivu:[9.2671,80.8142],
  Batticaloa:[7.7170,81.6924], Ampara:[7.2975,81.6747], Trincomalee:[8.5874,81.2152],
  Kurunegala:[7.4818,80.3609], Puttalam:[8.0362,79.8283],
  Anuradhapura:[8.3114,80.4037], Polonnaruwa:[7.9403,81.0188],
  Badulla:[6.9934,81.0550], Monaragala:[6.8714,81.3507],
  Ratnapura:[6.6828,80.3992], Kegalle:[7.2513,80.3464],
};

// Small deterministic offset so multiple pins in the same district don't stack exactly
function jitter(id, lat, lng) {
  const seed = String(id).split('').reduce((a, c) => a + c.charCodeAt(0), 0);
  const dLat = ((seed % 10) - 5) * 0.012;
  const dLng = (((seed * 3) % 10) - 5) * 0.012;
  return [lat + dLat, lng + dLng];
}

function coordsFor(district, id) {
  const base = DISTRICT_COORDS[district] || DISTRICT_COORDS['Colombo'];
  return jitter(id, base[0], base[1]);
}

// ─── GET /api/locations/overview ────────────────────────────────────────────
router.get('/overview', auth, async (req, res) => {
  try {
    const startOfToday = new Date(); startOfToday.setHours(0, 0, 0, 0);

    const [
      activeDonors, emergencyRequests, vehiclesMoving, bloodBanksOnline,
      completedToday, deliveredForETA,
      donors, hospitals, bloodBanks, emergencyList,
    ] = await Promise.all([
      Donor.countDocuments({ status: 'approved', testingStatus: 'active' }),
      BloodRequest.countDocuments({ priority: 'Emergency', status: { $nin: ['delivered', 'rejected', 'cancelled'] } }),
      BloodRequest.countDocuments({ status: 'dispatched' }),
      BloodBank.countDocuments({ status: 'approved' }),
      BloodRequest.countDocuments({ status: 'delivered', deliveredAt: { $gte: startOfToday } }),
      BloodRequest.find({ status: 'delivered', dispatchedAt: { $ne: null }, deliveredAt: { $ne: null } })
        .sort({ deliveredAt: -1 }).limit(20).select('dispatchedAt deliveredAt'),
      Donor.find({ status: 'approved', testingStatus: 'active' }).select('fullName bloodGroup phone district').limit(100),
      Hospital.find({ status: 'approved' }).select('hospitalName phone district').limit(100),
      BloodBank.find({ status: 'approved' }).select('bankName name phone district').limit(100),
      BloodRequest.find({ priority: 'Emergency', status: { $nin: ['delivered', 'rejected', 'cancelled'] } })
        .populate('hospital', 'hospitalName district phone').limit(50),
    ]);

    // Average ETA in minutes from real dispatch→deliver durations
    let avgETA = '-';
    if (deliveredForETA.length > 0) {
      const totalMins = deliveredForETA.reduce((sum, r) => {
        return sum + (new Date(r.deliveredAt) - new Date(r.dispatchedAt)) / 60000;
      }, 0);
      avgETA = `${Math.round(totalMins / deliveredForETA.length)}m`;
    }

    const stats = [
      { label: 'Active Donors', value: String(activeDonors), icon: '👤', color: '#C41E3A' },
      { label: 'Emergency Requests', value: String(emergencyRequests), icon: '🚨', color: '#F59E0B' },
      { label: 'Vehicles Moving', value: String(vehiclesMoving), icon: '🚑', color: '#16A34A' },
      { label: 'Blood Banks Online', value: String(bloodBanksOnline), icon: '🏦', color: '#7C3AED' },
      { label: 'Average ETA', value: avgETA, icon: '⏱️', color: '#2563EB' },
      { label: 'Completed Today', value: String(completedToday), icon: '✅', color: '#16A34A' },
    ];

    const markers = [];
    donors.forEach(d => {
      const [lat, lng] = coordsFor(d.district, d._id);
      markers.push({ id: d._id, type: 'donor', name: d.fullName, lat, lng, blood: d.bloodGroup, status: 'Active', phone: d.phone || '-', address: d.district || '-' });
    });
    hospitals.forEach(h => {
      const [lat, lng] = coordsFor(h.district, h._id);
      markers.push({ id: h._id, type: 'hospital', name: h.hospitalName, lat, lng, blood: 'All', status: 'Normal', phone: h.phone || '-', address: h.district || '-' });
    });
    bloodBanks.forEach(b => {
      const [lat, lng] = coordsFor(b.district, b._id);
      markers.push({ id: b._id, type: 'bloodbank', name: b.bankName || b.name, lat, lng, blood: 'All', status: 'Active', phone: b.phone || '-', address: b.district || '-' });
    });
    emergencyList.forEach(r => {
      const district = r.hospital?.district;
      const [lat, lng] = coordsFor(district, r._id);
      markers.push({ id: r._id, type: 'emergency', name: `Emergency — ${r.hospital?.hospitalName || 'Hospital'}`, lat, lng, blood: r.bloodGroup, status: r.status === 'dispatched' ? 'Moving' : 'Critical', phone: r.hospital?.phone || '-', address: district || '-' });
    });

    res.json({ stats, markers });
  } catch (err) {
    console.error('Locations overview error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/locations/timeline ────────────────────────────────────────────
// Timeline of the most recent active emergency request (real timestamps)
router.get('/timeline', auth, async (req, res) => {
  try {
    const request = await BloodRequest.findOne({ priority: 'Emergency' })
      .sort({ createdAt: -1 })
      .populate('hospital', 'hospitalName');

    if (!request) return res.json({ requestId: null, steps: [] });

    const steps = [
      { label: 'Request Created', done: !!request.requestedAt || !!request.createdAt },
      { label: 'Admin Approved', done: !!request.approvedAt },
      { label: 'Donor Assigned', done: ['processing', 'dispatched', 'delivered'].includes(request.status) },
      { label: 'Donor Accepted', done: ['processing', 'dispatched', 'delivered'].includes(request.status) },
      { label: 'Cross-Match / Testing', done: request.crossMatch === 'passed' },
      { label: 'Dispatched', done: !!request.dispatchedAt },
      { label: 'Delivered', done: !!request.deliveredAt },
      { label: 'Completed', done: request.status === 'delivered' },
    ];

    // Mark the first not-done step as "active"
    let markedActive = false;
    const finalSteps = steps.map(s => {
      if (!s.done && !markedActive) { markedActive = true; return { ...s, active: true }; }
      return { ...s, active: false };
    });

    res.json({
      requestId: request._id,
      hospital: request.hospital?.hospitalName || '-',
      status: request.status,
      steps: finalSteps,
    });
  } catch (err) {
    console.error('Locations timeline error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/locations/activity ────────────────────────────────────────────
// Recent activity feed built from real StockHistory + BloodRequest events
router.get('/activity', auth, async (req, res) => {
  try {
    const [stock, requests] = await Promise.all([
      StockHistory.find().sort({ date: -1 }).limit(8),
      BloodRequest.find().sort({ updatedAt: -1 }).limit(8).populate('hospital', 'hospitalName'),
    ]);

    const items = [];
    stock.forEach(s => {
      items.push({
        id: `stock-${s._id}`,
        icon: s.type === 'IN' ? '🩸' : s.type === 'OUT' ? '🚑' : s.type === 'TRANSFER' ? '🔄' : '⚠️',
        text: `${s.bloodBankName || 'Blood Bank'}: ${s.type} ${s.units} units (${s.bloodGroup})`,
        time: s.date,
      });
    });
    requests.forEach(r => {
      items.push({
        id: `req-${r._id}`,
        icon: r.status === 'delivered' ? '✅' : r.status === 'dispatched' ? '🚑' : r.status === 'approved' ? '👍' : '📋',
        text: `${r.hospital?.hospitalName || 'Hospital'} request (${r.bloodGroup}) — ${r.status}`,
        time: r.updatedAt,
      });
    });

    items.sort((a, b) => new Date(b.time) - new Date(a.time));
    res.json({ activity: items.slice(0, 10) });
  } catch (err) {
    console.error('Locations activity error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;