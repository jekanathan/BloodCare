// server/routes/analytics.js
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donor = require('../models/Donor');
const StockHistory = require('../models/StockHistory');

const BLOOD_GROUPS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-'];

// Sri Lanka district → province mapping
const PROVINCE_MAP = {
  Colombo: 'Western', Gampaha: 'Western', Kalutara: 'Western',
  Kandy: 'Central', Matale: 'Central', 'Nuwara Eliya': 'Central',
  Galle: 'Southern', Matara: 'Southern', Hambantota: 'Southern',
  Jaffna: 'Northern', Kilinochchi: 'Northern', Mannar: 'Northern',
  Vavuniya: 'Northern', Mullaitivu: 'Northern',
  Batticaloa: 'Eastern', Ampara: 'Eastern', Trincomalee: 'Eastern',
  Kurunegala: 'North Western', Puttalam: 'North Western',
  Anuradhapura: 'North Central', Polonnaruwa: 'North Central',
  Badulla: 'Uva', Monaragala: 'Uva',
  Ratnapura: 'Sabaragamuwa', Kegalle: 'Sabaragamuwa',
};

const MONTH_LABELS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];

// Build an array of the last N months as {year, month, label} — oldest first
function lastNMonths(n) {
  const out = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    out.push({ year: d.getFullYear(), month: d.getMonth() + 1, label: MONTH_LABELS[d.getMonth()] });
  }
  return out;
}

// ─── GET /api/analytics/donation-trends?months=6 ────────────────────────────
// Monthly total units collected (StockHistory type=IN) — real donation intake trend
router.get('/donation-trends', auth, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const range = lastNMonths(months);
    const startDate = new Date(range[0].year, range[0].month - 1, 1);

    const raw = await StockHistory.aggregate([
      { $match: { type: 'IN', date: { $gte: startDate } } },
      {
        $group: {
          _id: { year: { $year: '$date' }, month: { $month: '$date' } },
          totalUnits: { $sum: '$units' },
          count: { $sum: 1 },
        },
      },
    ]);

    const map = {};
    raw.forEach(r => { map[`${r._id.year}-${r._id.month}`] = { totalUnits: r.totalUnits, count: r.count }; });

    const data = range.map(m => ({
      month: m.label,
      units: map[`${m.year}-${m.month}`]?.totalUnits || 0,
      donations: map[`${m.year}-${m.month}`]?.count || 0,
    }));

    res.json({ data });
  } catch (err) {
    console.error('Donation trends error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/analytics/blood-usage?months=6 ────────────────────────────────
// Blood-group-wise units issued (StockHistory type=OUT)
router.get('/blood-usage', auth, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const range = lastNMonths(months);
    const startDate = new Date(range[0].year, range[0].month - 1, 1);

    const raw = await StockHistory.aggregate([
      { $match: { type: 'OUT', date: { $gte: startDate } } },
      { $group: { _id: '$bloodGroup', totalUnits: { $sum: '$units' } } },
    ]);

    const map = {};
    raw.forEach(r => { map[r._id] = r.totalUnits; });

    const data = BLOOD_GROUPS.map(g => ({ bloodGroup: g, units: map[g] || 0 }));

    res.json({ data });
  } catch (err) {
    console.error('Blood usage error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/analytics/province-stats ──────────────────────────────────────
// Approved donor count grouped by province (derived from district)
router.get('/province-stats', auth, async (req, res) => {
  try {
    const raw = await Donor.aggregate([
      { $match: { status: 'approved' } },
      { $group: { _id: '$district', count: { $sum: 1 } } },
    ]);

    const provinceMap = {};
    raw.forEach(r => {
      const province = PROVINCE_MAP[r._id] || 'Other';
      provinceMap[province] = (provinceMap[province] || 0) + r.count;
    });

    const data = Object.entries(provinceMap)
      .map(([province, count]) => ({ province, count }))
      .sort((a, b) => b.count - a.count);

    res.json({ data });
  } catch (err) {
    console.error('Province stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/analytics/monthly-growth?months=6 ─────────────────────────────
// New donor registrations per month + cumulative total donor base
router.get('/monthly-growth', auth, async (req, res) => {
  try {
    const months = parseInt(req.query.months) || 6;
    const range = lastNMonths(months);
    const startDate = new Date(range[0].year, range[0].month - 1, 1);

    const [raw, baseCountBefore] = await Promise.all([
      Donor.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } },
            newDonors: { $sum: 1 },
          },
        },
      ]),
      Donor.countDocuments({ createdAt: { $lt: startDate } }),
    ]);

    const map = {};
    raw.forEach(r => { map[`${r._id.year}-${r._id.month}`] = r.newDonors; });

    let cumulative = baseCountBefore;
    const data = range.map(m => {
      const newDonors = map[`${m.year}-${m.month}`] || 0;
      cumulative += newDonors;
      return { month: m.label, newDonors, cumulative };
    });

    res.json({ data });
  } catch (err) {
    console.error('Monthly growth error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;