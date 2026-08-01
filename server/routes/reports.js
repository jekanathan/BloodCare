const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const auth = require('../middleware/auth');
const Donor = require('../models/Donor');
const Hospital = require('../models/Hospital');
const BloodBank = require('../models/BloodBank');
const BloodRequest = require('../models/BloodRequest');
const Inventory = require('../models/Inventory');

const BLOOD_GROUPS = ['A+','A-','B+','B-','AB+','AB-','O+','O-'];
const BRAND_RED = '#C41E3A';
const SLATE = '#475569';
const SLATE_LIGHT = '#94A3B8';

// ── Shared PDF header/footer helpers ────────────────────────────────────────
function addHeader(doc, title, subtitle) {
  doc.rect(0, 0, doc.page.width, 90).fill(BRAND_RED);
  doc.fillColor('#fff').fontSize(20).font('Helvetica-Bold').text('BloodCare', 40, 28);
  doc.fontSize(10).font('Helvetica').text('Sri Lanka National Blood Donation Platform', 40, 52);
  doc.fontSize(9).text(new Date().toLocaleDateString('en-GB', { day:'2-digit', month:'long', year:'numeric' }), doc.page.width - 160, 28, { width: 120, align: 'right' });
  doc.fontSize(9).text(new Date().toLocaleTimeString('en-GB'), doc.page.width - 160, 44, { width: 120, align: 'right' });

  doc.moveDown(4);
  doc.fillColor('#0F172A').fontSize(18).font('Helvetica-Bold').text(title, 40, 110);
  if (subtitle) {
    doc.fontSize(10).font('Helvetica').fillColor(SLATE).text(subtitle, 40, 134);
  }
  doc.moveDown(2);
  return 165; // y position to continue from
}

function addFooter(doc, pageNum) {
  const bottom = doc.page.height - 50;
  doc.fontSize(8).fillColor(SLATE_LIGHT)
    .text('© BloodCare.lk — Confidential Report', 40, bottom, { width: 300 })
    .text(`Page ${pageNum}`, doc.page.width - 100, bottom, { width: 60, align: 'right' });
}

function sectionTitle(doc, text, y) {
  doc.fillColor(BRAND_RED).fontSize(13).font('Helvetica-Bold').text(text, 40, y);
  doc.moveTo(40, y + 18).lineTo(doc.page.width - 40, y + 18).strokeColor('#E2E8F0').lineWidth(1).stroke();
  return y + 30;
}

function statRow(doc, label, value, y) {
  doc.fontSize(10).font('Helvetica').fillColor(SLATE).text(label, 40, y, { width: 250 });
  doc.font('Helvetica-Bold').fillColor('#0F172A').text(String(value), 300, y);
  return y + 18;
}

// ─── GET /api/reports/dashboard-summary ─────────────────────────────────────
// Full dashboard snapshot: totals, blood group inventory, recent requests.
router.get('/dashboard-summary', auth, async (req, res) => {
  try {
    const [
      totalDonors, pendingDonors,
      totalHospitals, pendingHospitals,
      totalBloodBanks, pendingBloodBanks,
      totalRequests, pendingRequests, fulfilledRequests,
      inventoryRaw, recentRequests,
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
      Inventory.aggregate([{ $group: { _id: '$bloodGroup', totalUnits: { $sum: '$units' } } }]),
      BloodRequest.find().populate('hospital', 'hospitalName').sort({ createdAt: -1 }).limit(10),
    ]);

    const inventoryMap = {};
    inventoryRaw.forEach(i => { inventoryMap[i._id] = i.totalUnits; });
    const totalUnits = BLOOD_GROUPS.reduce((sum, g) => sum + (inventoryMap[g] || 0), 0);

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="BloodCare-Dashboard-Summary.pdf"');
    doc.pipe(res);

    let y = addHeader(doc, 'Dashboard Summary Report', 'System-wide overview of donors, hospitals, blood banks, and inventory');

    y = sectionTitle(doc, 'Overview Statistics', y);
    y = statRow(doc, 'Total Approved Donors', totalDonors, y);
    y = statRow(doc, 'Pending Donor Approvals', pendingDonors, y);
    y = statRow(doc, 'Total Approved Hospitals', totalHospitals, y);
    y = statRow(doc, 'Pending Hospital Approvals', pendingHospitals, y);
    y = statRow(doc, 'Total Approved Blood Banks', totalBloodBanks, y);
    y = statRow(doc, 'Pending Blood Bank Approvals', pendingBloodBanks, y);
    y = statRow(doc, 'Total Blood Requests', totalRequests, y);
    y = statRow(doc, 'Pending Requests', pendingRequests, y);
    y = statRow(doc, 'Fulfilled Requests', fulfilledRequests, y);
    y = statRow(doc, 'Total Blood Units in Stock', totalUnits, y);
    y += 15;

    y = sectionTitle(doc, 'Blood Inventory by Group', y);
    BLOOD_GROUPS.forEach(g => {
      y = statRow(doc, g, `${inventoryMap[g] || 0} units`, y);
    });
    y += 15;

    if (y > doc.page.height - 150) { doc.addPage(); y = 60; }
    y = sectionTitle(doc, 'Recent Blood Requests', y);
    recentRequests.forEach(r => {
      const line = `${r.hospital?.hospitalName || 'Unknown'} — ${r.bloodGroup} (${r.unitsRequired} units) — ${r.status} — ${new Date(r.createdAt).toLocaleDateString('en-GB')}`;
      doc.fontSize(9).font('Helvetica').fillColor(SLATE).text(line, 40, y, { width: doc.page.width - 80 });
      y += 16;
      if (y > doc.page.height - 80) { addFooter(doc, 1); doc.addPage(); y = 60; }
    });

    addFooter(doc, doc.bufferedPageRange().count);
    doc.end();
  } catch (err) {
    console.error('Dashboard summary report error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/reports/donors ─────────────────────────────────────────────────
// Full donor list with key fields, as a PDF table.
router.get('/donors', auth, async (req, res) => {
  try {
    const donors = await Donor.find().sort({ createdAt: -1 });

    const doc = new PDFDocument({ size: 'A4', margin: 0, layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="BloodCare-Donors-Report.pdf"');
    doc.pipe(res);

    let y = addHeader(doc, 'Donors Report', `Total donors: ${donors.length}`);

    // Table header
    const cols = [
      { label: 'Name', x: 40, w: 140 },
      { label: 'Blood', x: 180, w: 50 },
      { label: 'Phone', x: 230, w: 100 },
      { label: 'District', x: 330, w: 100 },
      { label: 'Status', x: 430, w: 80 },
      { label: 'Donations', x: 510, w: 70 },
      { label: 'Registered', x: 580, w: 100 },
    ];
    function drawTableHeader(yy) {
      doc.rect(40, yy, doc.page.width - 80, 22).fill('#F1F5F9');
      cols.forEach(c => {
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(c.label, c.x, yy + 6, { width: c.w });
      });
      return yy + 26;
    }

    y = drawTableHeader(y);
    donors.forEach((d, i) => {
      if (y > doc.page.height - 60) {
        addFooter(doc, doc.bufferedPageRange().count);
        doc.addPage();
        y = 60;
        y = drawTableHeader(y);
      }
      if (i % 2 === 0) doc.rect(40, y - 4, doc.page.width - 80, 18).fill('#FAFAFA');
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica');
      doc.text(d.fullName || '—', cols[0].x, y, { width: cols[0].w });
      doc.text(d.bloodGroup || '—', cols[1].x, y, { width: cols[1].w });
      doc.text(d.phone || '—', cols[2].x, y, { width: cols[2].w });
      doc.text(d.district || '—', cols[3].x, y, { width: cols[3].w });
      doc.text(d.status || '—', cols[4].x, y, { width: cols[4].w });
      doc.text(String(d.totalDonations || 0), cols[5].x, y, { width: cols[5].w });
      doc.text(d.createdAt ? new Date(d.createdAt).toLocaleDateString('en-GB') : '—', cols[6].x, y, { width: cols[6].w });
      y += 18;
    });

    addFooter(doc, doc.bufferedPageRange().count);
    doc.end();
  } catch (err) {
    console.error('Donors report error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/reports/blood-requests ─────────────────────────────────────────
// Full blood request history with hospital, group, units, status.
router.get('/blood-requests', auth, async (req, res) => {
  try {
    const requests = await BloodRequest.find().populate('hospital', 'hospitalName').sort({ createdAt: -1 });

    const doc = new PDFDocument({ size: 'A4', margin: 0, layout: 'landscape' });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="BloodCare-Blood-Requests-Report.pdf"');
    doc.pipe(res);

    let y = addHeader(doc, 'Blood Requests Report', `Total requests: ${requests.length}`);

    const cols = [
      { label: 'Hospital', x: 40, w: 180 },
      { label: 'Blood Group', x: 230, w: 70 },
      { label: 'Units', x: 310, w: 50 },
      { label: 'Priority', x: 370, w: 80 },
      { label: 'Status', x: 460, w: 90 },
      { label: 'Requested On', x: 560, w: 120 },
    ];
    function drawTableHeader(yy) {
      doc.rect(40, yy, doc.page.width - 80, 22).fill('#F1F5F9');
      cols.forEach(c => {
        doc.fillColor('#0F172A').fontSize(9).font('Helvetica-Bold').text(c.label, c.x, yy + 6, { width: c.w });
      });
      return yy + 26;
    }

    y = drawTableHeader(y);
    requests.forEach((r, i) => {
      if (y > doc.page.height - 60) {
        addFooter(doc, doc.bufferedPageRange().count);
        doc.addPage();
        y = 60;
        y = drawTableHeader(y);
      }
      if (i % 2 === 0) doc.rect(40, y - 4, doc.page.width - 80, 18).fill('#FAFAFA');
      doc.fillColor('#0F172A').fontSize(8).font('Helvetica');
      doc.text(r.hospital?.hospitalName || 'Unknown', cols[0].x, y, { width: cols[0].w });
      doc.text(r.bloodGroup || '—', cols[1].x, y, { width: cols[1].w });
      doc.text(String(r.unitsRequired || 0), cols[2].x, y, { width: cols[2].w });
      doc.text(r.priority || '—', cols[3].x, y, { width: cols[3].w });
      doc.text(r.status || '—', cols[4].x, y, { width: cols[4].w });
      doc.text(r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-GB') : '—', cols[5].x, y, { width: cols[5].w });
      y += 18;
    });

    addFooter(doc, doc.bufferedPageRange().count);
    doc.end();
  } catch (err) {
    console.error('Blood requests report error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;