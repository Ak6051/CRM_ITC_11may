const express = require('express');
const router = express.Router();
const { upload, uploadToS3 } = require('../middleware/gcsMulter');
const auth = require('../middleware/authMiddleware');
const CompanyRequest = require('../models/CompanyRequest.model');
const CompanyCreate = require('../models/companycreate.model');
const Lead = require('../models/Lead.model');

const requestUpload = upload.fields([
  { name: 'gstUpload',            maxCount: 1 },
  { name: 'agreementUpload',      maxCount: 1 },
  { name: 'tokenUpload',          maxCount: 1 },
  { name: 'otherDocumentUpload',  maxCount: 1 },
]);

// ── Sales: Submit company request ────────────────────────────────────────────
router.post('/', auth, requestUpload, async (req, res) => {
  try {
    const { companyName, industries, companyAddress, area, city,
            state, country, pincode,
            contactPerson, contactPersonDesignation, contactNumber,
            email, websiteUrl, gpsLocation,
            contactPerson2, contactPerson2Designation, contactNumber2, email2,
            agreementStartDate, agreementEndDate,
            invoiceNumber, paymentMode, paymentRemark, tokenAmount,
            leadId } = req.body;

    if (!companyName) return res.status(400).json({ success: false, message: 'Company name is required' });

    let gstUpload = req.body.gstUpload || '';
    let agreementUpload = req.body.agreementUpload || '';
    let tokenUpload = req.body.tokenUpload || '';
    let otherDocumentUpload = req.body.otherDocumentUpload || '';

    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      gstUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.agreementUpload?.[0]) {
      const f = req.files.agreementUpload[0];
      agreementUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.tokenUpload?.[0]) {
      const f = req.files.tokenUpload[0];
      tokenUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.otherDocumentUpload?.[0]) {
      const f = req.files.otherDocumentUpload[0];
      otherDocumentUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }

    const request = new CompanyRequest({
      companyName, industries, companyAddress, area, city,
      state, country, pincode,
      contactPerson, contactPersonDesignation, contactNumber, email,
      contactPerson2, contactPerson2Designation, contactNumber2, email2,
      websiteUrl, gpsLocation,
      agreementStartDate: agreementStartDate || null,
      agreementEndDate:   agreementEndDate   || null,
      invoiceNumber, paymentMode, paymentRemark,
      tokenAmount: tokenAmount !== '' && tokenAmount !== undefined ? Number(tokenAmount) : null,
      gstUpload, agreementUpload, tokenUpload, otherDocumentUpload,
      requestedBy: req.user._id,
      status: 'Pending',
      leadId: leadId || null,
    });

    await request.save();

    if (leadId) {
      await Lead.findByIdAndUpdate(leadId, { leadStatus: 'Converted' });
    }

    res.status(201).json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Sales: Get own requests ──────────────────────────────────────────────────
router.get('/my-requests', auth, async (req, res) => {
  try {
    const requests = await CompanyRequest.find({ requestedBy: req.user._id })
      .populate('reviewedBy', 'firstName lastName')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: Get all pending requests ──────────────────────────────────────────
router.get('/pending', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });
    const requests = await CompanyRequest.find({ status: 'Pending' })
      .populate('requestedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: requests });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: Approve request (creates CompanyCreate) ───────────────────────────
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const request = await CompanyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ success: false, message: 'Already reviewed' });

    // Use admin-edited form data if provided, otherwise fall back to request data
    const data = req.body || {};
    const finalName = (data.companyName || request.companyName || '').trim();

    // ── Duplicate check ───────────────────────────────────────────────────────
    const existing = await CompanyCreate.findOne({
      companyName: { $regex: `^${finalName}$`, $options: 'i' },
    });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `Company "${finalName}" already exists (ID: ${existing.companyId}). Cannot approve duplicate.`,
        existingId: existing.companyId,
      });
    }

    const company = new CompanyCreate({
      companyName:    finalName,
      industries:     data.industries     || request.industries,
      companyAddress: data.companyAddress || request.companyAddress,
      area:           data.area           || request.area,
      city:           data.city           || request.city,
      state:          data.state          || request.state,
      country:        data.country        || request.country,
      pincode:        data.pincode        || request.pincode,
      contactPerson:  data.contactPerson  || request.contactPerson,
      contactPersonDesignation: data.contactPersonDesignation || request.contactPersonDesignation,
      contactNumber:  data.contactNumber  || request.contactNumber,
      email:          data.email          || request.email,
      contactPerson2: data.contactPerson2 || request.contactPerson2,
      contactPerson2Designation: data.contactPerson2Designation || request.contactPerson2Designation,
      contactNumber2: data.contactNumber2 || request.contactNumber2,
      email2:         data.email2         || request.email2,
      websiteUrl:     data.websiteUrl     || request.websiteUrl,
      gpsLocation:    data.gpsLocation    || request.gpsLocation,
      agreementStartDate: data.agreementStartDate || request.agreementStartDate || null,
      agreementEndDate:   data.agreementEndDate   || request.agreementEndDate   || null,
      invoiceNumber:  data.invoiceNumber  || request.invoiceNumber,
      paymentMode:    data.paymentMode    || request.paymentMode,
      paymentRemark:  data.paymentRemark  || request.paymentRemark,
      tokenAmount:    data.tokenAmount != null && data.tokenAmount !== ''
        ? Number(data.tokenAmount)
        : request.tokenAmount,
      gstUpload:           request.gstUpload,
      agreementUpload:     request.agreementUpload,
      otherDocumentUpload: request.otherDocumentUpload,
      tokenUpload:         request.tokenUpload,
      createdBy:      request.requestedBy,
    });
    await company.save();

    request.status = 'Approved';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.createdCompanyId = company._id;
    await request.save();

    res.json({ success: true, data: request, company });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── Admin: Reject request ────────────────────────────────────────────────────
router.post('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ success: false, message: 'Admin only' });

    const request = await CompanyRequest.findById(req.params.id);
    if (!request) return res.status(404).json({ success: false, message: 'Request not found' });
    if (request.status !== 'Pending') return res.status(400).json({ success: false, message: 'Already reviewed' });

    request.status = 'Rejected';
    request.reviewedBy = req.user._id;
    request.reviewedAt = new Date();
    request.rejectReason = req.body.reason || '';
    await request.save();

    res.json({ success: true, data: request });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
