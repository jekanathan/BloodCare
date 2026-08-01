const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Inventory = require('../models/Inventory');
const Campaign = require('../models/Campaign');

const MONTH_NAMES = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const PROVINCE_COLORS = {
  'Western':'#C41E3A','Central':'#3B82F6','Southern':'#22C55E','Northern':'#F59E0B',
  'Eastern':'#8B5CF6','North Western':'#14B8A6','North Central':'#F97316','Uva':'#EC4899','Sabaragamuwa':'#06B6D4',
};
const DISTRICT_COLORS = [
  '#C41E3A','#E85D75','#F97316','#3B82F6','#60A5FA','#93C5FD','#22C55E','#4ADE80','#86EFAC',
  '#F59E0B','#FCD34D','#FDE68A','#8B5CF6','#A78BFA','#14B8A6','#2DD4BF','#5EEAD4','#EC4899',
  '#F472B6','#06B6D4','#22D3EE','#84CC16','#A3E635','#EAB308','#CA8A04',
];

// Map district -> province (Sri Lanka)
const DISTRICT_PROVINCE = {
  Colombo:'Western', Gampaha:'Western', Kalutara:'Western',
  Kandy:'Central', Matale:'Central', 'Nuwara Eliya':'Central',
  Galle:'Southern', Matara:'Southern', Hambantota:'Southern',
  Jaffna:'Northern', Kilinochchi:'Northern', Mannar:'Northern', Vavuniya:'Northern', Mullaitivu:'Northern',
  Batticaloa:'Eastern', Ampara:'Eastern', Trincomalee:'Eastern',
  Kurunegala:'North Western', Puttalam:'North Western',
  Anuradhapura:'North Central', Polonnaruwa:'North Central',
  Badulla:'Uva', Monaragala:'Uva',
  Ratnapura:'Sabaragamuwa', Kegalle:'Sabaragamuwa',
};

// GET /api/dashboard/stats
router.get('/stats', auth, async (req, res) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfYesterday = new Date(startOfToday); startOfYesterday.setDate(startOfYesterday.getDate() - 1);

    const [
      totalDonors, pendingDonors,
      totalHospitals, pendingHospitals,
      totalBloodBanks, pendingBloodBanks,
      totalRequests, pendingRequests, fulfilledRequests,
      activeCampaigns,
      donationsToday, donationsYesterday,
      requestsToday, requestsYesterday,
    ] = await Promise.all([
      Donor.countDocuments({ status: 'approved' }),
      Donor.countDocuments({ status: 'pending' }),
      Hospital.countDocuments({ status: 'approved' }),
      Hospital.countDocuments({ status: 'pending' }),
      BloodBank.countDocuments({ status: 'approved' }),
      BloodBank.countDocuments({ status: 'pending' }),
      BloodRequest.countDocuments(),
      BloodRequest.countDocuments({ status: 'pending' }),
      BloodRequest.countDocuments({ status: 'fulfilled' }),
      Campaign.countDocuments({ status: 'active' }),
      Donor.countDocuments({ status: 'approved', updatedAt: { $gte: startOfToday } }),
      Donor.countDocuments({ status: 'approved', updatedAt: { $gte: startOfYesterday, $lt: startOfToday } }),
      BloodRequest.countDocuments({ createdAt: { $gte: startOfToday } }),
      BloodRequest.countDocuments({ createdAt: { $gte: startOfYesterday, $lt: startOfToday } }),
    ]);

    // ── Blood group inventory summary ──────────────────────────────────────
    const inventoryRaw = await Inventory.aggregate([
      { $group: { _id: '$bloodGroup', totalUnits: { $sum: '$units' } } },
    ]);
    // Ensure all 8 groups appear, even with 0 units
    const inventoryMap = {};
    inventoryRaw.forEach(i => { inventoryMap[i._id] = i.totalUnits; });
    const inventory = BLOOD_GROUPS.map(g => ({ _id: g, totalUnits: inventoryMap[g] || 0 }));
    const totalUnits = inventory.reduce((a, b) => a + b.totalUnits, 0);

    // Blood group distribution as percentages (for pie chart)
    const bloodGroupPie = totalUnits > 0
      ? inventory.map(i => ({ name: i._id, value: Math.round((i.totalUnits / totalUnits) * 100) }))
      : BLOOD_GROUPS.map(g => ({ name: g, value: 0 }));

    // ── Recent requests (latest 5) ───────────────────────────────────────────
    const recentRequests = await BloodRequest.find()
      .populate('hospital', 'hospitalName district')
      .sort({ createdAt: -1 })
      .limit(5);

    // ── Top donors (by totalDonations) ───────────────────────────────────────
    const topDonorsRaw = await Donor.find({ status: 'approved' })
      .sort({ totalDonations: -1 })
      .limit(5)
      .select('fullName bloodGroup totalDonations lastDonationDate');
    const topDonors = topDonorsRaw.map(d => ({
      name: d.fullName,
      blood: d.bloodGroup,
      donations: d.totalDonations || 0,
      date: d.lastDonationDate
        ? new Date(d.lastDonationDate).toLocaleDateString('en-GB', { month: 'short', day: 'numeric', year: 'numeric' })
        : 'No donations yet',
    }));

    // ── Monthly trend data (calendar year: Jan-Dec of current year) ─────────
    const currentYear = now.getFullYear();
    const startOfYear = new Date(currentYear, 0, 1);

    const [monthlyDonorsRaw, monthlyRequestsRaw] = await Promise.all([
      Donor.aggregate([
        { $match: { status: 'approved', createdAt: { $gte: startOfYear } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
      BloodRequest.aggregate([
        { $match: { createdAt: { $gte: startOfYear } } },
        { $group: { _id: { year: { $year: '$createdAt' }, month: { $month: '$createdAt' } }, count: { $sum: 1 } } },
        { $sort: { '_id.year': 1, '_id.month': 1 } },
      ]),
    ]);

    // Build a full Jan-Dec timeline for the current year (fills in zero months)
    const monthBuckets = [];
    for (let m = 0; m < 12; m++) {
      monthBuckets.push({ year: currentYear, month: m + 1, label: MONTH_NAMES[m] });
    }
    const donorMap = {};
    monthlyDonorsRaw.forEach(m => { donorMap[`${m._id.year}-${m._id.month}`] = m.count; });
    const requestMap = {};
    monthlyRequestsRaw.forEach(m => { requestMap[`${m._id.year}-${m._id.month}`] = m.count; });

    const chartData = monthBuckets.map(b => ({
      month: b.label,
      donors: donorMap[`${b.year}-${b.month}`] || 0,
      requests: requestMap[`${b.year}-${b.month}`] || 0,
    }));

    // ── This month's total donations/requests (sum of units, for headline cards) ──
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const [donationsThisMonthAgg, requestsThisMonthAgg] = await Promise.all([
      Donor.countDocuments({ status: 'approved', createdAt: { $gte: startOfMonth } }),
      BloodRequest.aggregate([
        { $match: { createdAt: { $gte: startOfMonth } } },
        { $group: { _id: null, totalUnits: { $sum: '$unitsRequired' } } },
      ]),
    ]);
    const requestUnitsThisMonth = requestsThisMonthAgg[0]?.totalUnits || 0;

    // ── Province & District wise donations (based on approved donor districts) ──
    const districtAgg = await Donor.aggregate([
      { $match: { status: 'approved', district: { $ne: null } } },
      { $group: { _id: '$district', count: { $sum: 1 } } },
    ]);
    const districtCountMap = {};
    districtAgg.forEach(d => { districtCountMap[d._id] = d.count; });

    const districtData = Object.keys(DISTRICT_PROVINCE).map((district, i) => ({
      district,
      donations: districtCountMap[district] || 0,
      fill: DISTRICT_COLORS[i % DISTRICT_COLORS.length],
    }));

    const provinceCountMap = {};
    districtData.forEach(d => {
      const province = DISTRICT_PROVINCE[d.district];
      provinceCountMap[province] = (provinceCountMap[province] || 0) + d.donations;
    });
    const provinceData = Object.keys(PROVINCE_COLORS).map(province => ({
      province,
      donations: provinceCountMap[province] || 0,
      fill: PROVINCE_COLORS[province],
    }));

    // ── Pending approvals breakdown ──────────────────────────────────────────
    const pendingApprovalsTotal = pendingDonors + pendingHospitals + pendingBloodBanks;

    res.json({
      stats: {
        totalDonors, pendingDonors,
        totalHospitals, pendingHospitals,
        totalBloodBanks, pendingBloodBanks,
        totalRequests, pendingRequests, fulfilledRequests,
        activeCampaigns,
        totalUnits,
        pendingApprovalsTotal,
        donationsToday, donationsYesterday,
        requestsToday, requestsYesterday,
        donationsThisMonth: donationsThisMonthAgg,
        requestUnitsThisMonth,
      },
      inventory,
      bloodGroupPie,
      recentRequests,
      topDonors,
      chartData,
      provinceData,
      districtData,
    });
  } catch (err) {
    console.error('Dashboard stats error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ── GET /api/dashboard/map-locations ─────────────────────────────────────────
// Real hospital/bloodbank locations for the dashboard map.
// NOTE: Hospital/BloodBank models currently store district, not lat/lng.
// This endpoint returns what's available; lat/lng will be approximate
// (district centroid) until a geocoding step is added to registration.
router.get('/map-locations', auth, async (req, res) => {
  try {
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

    const [hospitals, bloodBanks] = await Promise.all([
      Hospital.find({ status: 'approved' }).select('hospitalName district phone'),
      BloodBank.find({ status: 'approved' }).select('bankName district phone'),
    ]);

    const hospitalLocations = hospitals.map(h => {
      const coords = DISTRICT_COORDS[h.district] || DISTRICT_COORDS['Colombo'];
      return {
        id: h._id, type: 'hospital', name: h.hospitalName,
        lat: coords[0], lng: coords[1], status: 'Normal', phone: h.phone,
      };
    });
    const bloodBankLocations = bloodBanks.map(b => {
      const coords = DISTRICT_COORDS[b.district] || DISTRICT_COORDS['Colombo'];
      return {
        id: b._id, type: 'bloodbank', name: b.bankName,
        lat: coords[0], lng: coords[1], status: 'Active', phone: b.phone,
      };
    });

    res.json({ locations: [...hospitalLocations, ...bloodBankLocations] });
  } catch (err) {
    console.error('Map locations error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});


// ── GET /api/dashboard/blood-forecast ────────────────────────────────────────
// 10-year (2026-2035) blood demand vs supply forecast, based on real request
// history. Method: simple linear trend projection.
//   1. Pull yearly totals of blood requested (demand) from BloodRequest history.
//   2. Pull yearly totals of blood added to Inventory (supply) by year.
//   3. Compute year-over-year growth rate from whatever real history exists.
//   4. Project forward to fill out 2026-2035, using the growth rate (capped
//      to reasonable bounds) so the chart doesn't show wild extrapolation
//      from very little data.
router.get('/blood-forecast', auth, async (req, res) => {
  try {
    const FORECAST_START_YEAR = 2026;
    const FORECAST_END_YEAR = 2035;

    // ── Historical demand: total units requested, grouped by year ───────────
    const demandHistory = await BloodRequest.aggregate([
      { $group: { _id: { $year: '$createdAt' }, totalUnits: { $sum: '$unitsRequired' } } },
      { $sort: { _id: 1 } },
    ]);

    // ── Historical supply: total units added to inventory, grouped by year ──
    const supplyHistory = await Inventory.aggregate([
      { $group: { _id: { $year: '$createdAt' }, totalUnits: { $sum: '$units' } } },
      { $sort: { _id: 1 } },
    ]);

    const demandMap = {};
    demandHistory.forEach(d => { demandMap[d._id] = d.totalUnits; });

    // Current total stock (latest known supply baseline)
    const currentStockAgg = await Inventory.aggregate([
      { $group: { _id: null, total: { $sum: '$units' } } },
    ]);
    const currentStock = currentStockAgg[0]?.total || 0;

    // Current year's actual demand (sum of units requested this calendar year)
    const thisYear = new Date().getFullYear();
    const currentYearDemand = demandMap[thisYear] || 0;

    // ── Compute a simple growth rate from available history ─────────────────
    // If we have 2+ years of real demand data, use actual year-over-year growth.
    // Otherwise, default to a conservative 5% annual growth assumption —
    // real data is too sparse yet to extrapolate confidently.
    const demandYears = Object.keys(demandMap).map(Number).sort((a, b) => a - b);
    let growthRate = 0.05; // 5% default fallback
    if (demandYears.length >= 2) {
      const first = demandMap[demandYears[0]];
      const last = demandMap[demandYears[demandYears.length - 1]];
      const span = demandYears[demandYears.length - 1] - demandYears[0];
      if (first > 0 && span > 0) {
        growthRate = Math.pow(last / first, 1 / span) - 1;
        growthRate = Math.max(-0.15, Math.min(0.25, growthRate));
      }
    }

    // ── Build the forecast series ─────────────────────────────────────────────
    const baselineDemand = currentYearDemand > 0 ? currentYearDemand : Math.max(currentStock, 100);
    const baselineSupply = currentStock > 0 ? currentStock : Math.max(currentYearDemand, 100);

    const forecast = [];
    for (let year = FORECAST_START_YEAR; year <= FORECAST_END_YEAR; year++) {
      const yearsFromNow = year - thisYear;
      const projectedDemand = Math.round(baselineDemand * Math.pow(1 + growthRate, Math.max(0, yearsFromNow)));
      const projectedSupply = Math.round(baselineSupply * Math.pow(1 + growthRate * 0.6, Math.max(0, yearsFromNow)));
      forecast.push({
        year,
        demand: projectedDemand,
        supply: projectedSupply,
        gap: projectedDemand - projectedSupply,
        isProjected: year > thisYear,
      });
    }

    // ── Blood group-wise demand vs supply summary (current snapshot) ────────
    const [demandByGroupAgg, supplyByGroupAgg] = await Promise.all([
      BloodRequest.aggregate([
        { $group: { _id: '$bloodGroup', totalUnits: { $sum: '$unitsRequired' } } },
      ]),
      Inventory.aggregate([
        { $group: { _id: '$bloodGroup', totalUnits: { $sum: '$units' } } },
      ]),
    ]);
    const demandByGroupMap = {};
    demandByGroupAgg.forEach(d => { demandByGroupMap[d._id] = d.totalUnits; });
    const supplyByGroupMap = {};
    supplyByGroupAgg.forEach(s => { supplyByGroupMap[s._id] = s.totalUnits; });

    const bloodGroupSummary = ['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(group => {
      const demand = demandByGroupMap[group] || 0;
      const supply = supplyByGroupMap[group] || 0;
      return { group, demand, supply, gap: demand - supply };
    });

    res.json({
      forecast,
      bloodGroupSummary,
      growthRatePercent: Math.round(growthRate * 1000) / 10,
      dataQuality: demandYears.length >= 2 ? 'historical' : 'estimated',
    });
  } catch (err) {
    console.error('Blood forecast error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;