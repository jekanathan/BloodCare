// server/routes/donorCertificates.js
const express = require('express');
const router = express.Router();
const PDFDocument = require('pdfkit');
const QRCode = require('qrcode');
const auth = require('../middleware/auth');
const Donor = require('../models/Donor');
const DonorCertificate = require('../models/DonorCertificate');

const BRAND_RED = '#C41E3A';
const SLATE = '#475569';

async function generateCertNumber() {
  const year = new Date().getFullYear();
  const count = await DonorCertificate.countDocuments({ certificateNumber: new RegExp(`^BC-CERT-${year}-`) });
  const seq = String(count + 1).padStart(6, '0');
  return `BC-CERT-${year}-${seq}`;
}

// ─── POST /api/donor-certificates/generate/:donorId ─────────────────────────
router.post('/generate/:donorId', auth, async (req, res) => {
  try {
    const donor = await Donor.findById(req.params.donorId);
    if (!donor) return res.status(404).json({ message: 'Donor not found' });
    if (donor.status !== 'approved') {
      return res.status(400).json({ message: 'Only approved donors can receive a certificate.' });
    }

    const certificateNumber = await generateCertNumber();
    const cert = new DonorCertificate({
      certificateNumber,
      donor: donor._id,
      donorName: donor.fullName,
      bloodGroup: donor.bloodGroup,
      totalDonationsAtIssue: donor.totalDonations || 0,
      issuedBy: req.user.id,
    });
    await cert.save();

    res.status(201).json({ message: 'Certificate generated successfully', certificate: cert });
  } catch (err) {
    console.error('Generate certificate error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donor-certificates ─────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const certificates = await DonorCertificate.find().populate('donor', 'fullName bloodGroup district').sort({ createdAt: -1 });
    res.json({ certificates });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donor-certificates/:id/download ────────────────────────────────
// Streams a PDF certificate with an embedded QR code linking to the public
// verification endpoint below.
router.get('/:id/download', auth, async (req, res) => {
  try {
    const cert = await DonorCertificate.findById(req.params.id).populate('donor', 'fullName bloodGroup district');
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });

    const verifyUrl = `${req.protocol}://${req.get('host')}/api/donor-certificates/verify/${cert.certificateNumber}`;
    const qrDataUrl = await QRCode.toDataURL(verifyUrl, { margin: 1, width: 200 });
    const qrBuffer = Buffer.from(qrDataUrl.split(',')[1], 'base64');

    const doc = new PDFDocument({ size: 'A4', margin: 0 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="Certificate-${cert.certificateNumber}.pdf"`);
    doc.pipe(res);

    // Header band
    doc.rect(0, 0, doc.page.width, 110).fill(BRAND_RED);
    doc.fillColor('#fff').fontSize(24).font('Helvetica-Bold').text('BloodCare', 0, 32, { align: 'center' });
    doc.fontSize(11).font('Helvetica').text('Certificate of Blood Donation', 0, 64, { align: 'center' });

    doc.fillColor('#0F172A').fontSize(20).font('Helvetica-Bold')
      .text('CERTIFICATE OF APPRECIATION', 0, 160, { align: 'center' });

    doc.fontSize(12).font('Helvetica').fillColor(SLATE)
      .text('This is to certify that', 0, 210, { align: 'center' });

    doc.fontSize(26).font('Helvetica-Bold').fillColor(BRAND_RED)
      .text(cert.donorName, 0, 235, { align: 'center' });

    doc.fontSize(12).font('Helvetica').fillColor(SLATE)
      .text(`Blood Group ${cert.bloodGroup} — has generously donated blood through the BloodCare network,`, 60, 285, { align: 'center', width: doc.page.width - 120 })
      .text('helping save lives in the community.', { align: 'center' });

    doc.fontSize(11).fillColor(SLATE)
      .text(`Total Donations Recorded: ${cert.totalDonationsAtIssue}`, 0, 330, { align: 'center' });

    // QR + details block
    doc.image(qrBuffer, doc.page.width / 2 - 60, 380, { width: 120 });
    doc.fontSize(9).fillColor('#94A3B8').text('Scan to verify authenticity', 0, 505, { align: 'center' });

    doc.fontSize(10).fillColor(SLATE)
      .text(`Certificate No: ${cert.certificateNumber}`, 60, 540)
      .text(`Issued: ${new Date(cert.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 60, 555);

    doc.fontSize(8).fillColor('#94A3B8')
      .text('This certificate is digitally issued by BloodCare and can be verified via the QR code above.', 60, doc.page.height - 60, { width: doc.page.width - 120, align: 'center' });

    doc.end();
  } catch (err) {
    console.error('Download certificate error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

// ─── GET /api/donor-certificates/verify/:certificateNumber ──────────────────
// Public — no auth. This is what the QR code links to.
router.get('/verify/:certificateNumber', async (req, res) => {
  try {
    const cert = await DonorCertificate.findOne({ certificateNumber: req.params.certificateNumber }).populate('donor', 'fullName bloodGroup');
    if (!cert) return res.status(404).json({ valid: false, message: 'Certificate not found' });

    res.json({
      valid: cert.status === 'valid',
      certificateNumber: cert.certificateNumber,
      donorName: cert.donorName,
      bloodGroup: cert.bloodGroup,
      totalDonations: cert.totalDonationsAtIssue,
      issuedDate: cert.createdAt,
      bloodBankName: cert.bloodBankName,
    });
  } catch (err) {
    res.status(500).json({ valid: false, message: 'Server error' });
  }
});

// ─── PATCH /api/donor-certificates/:id/revoke ────────────────────────────────
router.patch('/:id/revoke', auth, async (req, res) => {
  try {
    const cert = await DonorCertificate.findByIdAndUpdate(req.params.id, { status: 'revoked' }, { new: true });
    if (!cert) return res.status(404).json({ message: 'Certificate not found' });
    res.json({ message: 'Certificate revoked', certificate: cert });
  } catch (err) {
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

module.exports = router;