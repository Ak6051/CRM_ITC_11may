const express = require('express');
const router = express.Router();
const { upload, uploadToS3 } = require('../middleware/gcsMulter');
const auth = require('../middleware/authMiddleware');
const Lead = require('../models/Lead.model');

const leadUpload = upload.fields([
  { name: 'gstUpload',            maxCount: 1 },
  { name: 'agreementUpload',      maxCount: 1 },
]);

// ── GET all leads (with optional filters) ────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, excludeStatus, source, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (status)  filter.leadStatus  = status;
    if (excludeStatus) filter.leadStatus = { $ne: excludeStatus };
    if (source)  filter.leadSource  = source;
    if (search) {
      filter.$or = [
        { leadName:    { $regex: search, $options: 'i' } },
        { companyName: { $regex: search, $options: 'i' } },
        { mobileNumber:{ $regex: search, $options: 'i' } },
        { email:       { $regex: search, $options: 'i' } },
      ];
    }

    const total = await Lead.countDocuments(filter);
    const leads = await Lead.find(filter)
      .populate('createdBy', 'firstName lastName role')
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(Number(limit));

    res.json({ success: true, data: leads, total });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET lead status counts ──────────────────────────────────────────────────
router.get('/status-counts', auth, async (req, res) => {
  try {
    const counts = await Lead.aggregate([
      {
        $group: {
          _id: '$leadStatus',
          count: { $sum: 1 }
        }
      }
    ]);
    const result = { All: 0, New: 0, Contacted: 0, Interested: 0, 'Not Interested': 0, Converted: 0, Lost: 0 };
    let totalActive = 0;
    counts.forEach(c => {
      if (result[c._id] !== undefined) {
        result[c._id] = c.count;
      }
      if (c._id !== 'Converted') {
        totalActive += c.count;
      }
    });
    result['All'] = totalActive; // Total count of active (non-converted) leads
    res.json({ success: true, data: result });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── GET single lead ───────────────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id).populate('createdBy', 'firstName lastName');
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── POST create lead ──────────────────────────────────────────────────────────
router.post('/', auth, leadUpload, async (req, res) => {
  try {
    const { leadName, companyName, mobileNumber, email, leadSource } = req.body;
    if (!leadName || !companyName || !mobileNumber || !email || !leadSource) {
      return res.status(400).json({ success: false, message: 'leadName, companyName, mobileNumber, email and leadSource are required' });
    }

    let gstUpload = '';
    let agreementUpload = '';

    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      gstUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.agreementUpload?.[0]) {
      const f = req.files.agreementUpload[0];
      agreementUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }

    const lead = new Lead({
      ...req.body,
      gstUpload,
      agreementUpload,
      createdBy: req.user?._id
    });
    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT update lead ───────────────────────────────────────────────────────────
router.put('/:id', auth, leadUpload, async (req, res) => {
  try {
    const updateData = { ...req.body };

    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      updateData.gstUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }
    if (req.files?.agreementUpload?.[0]) {
      const f = req.files.agreementUpload[0];
      updateData.agreementUpload = await uploadToS3(f.buffer, f.originalname, f.mimetype);
    }

    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },
      { new: true, runValidators: true }
    ).populate('createdBy', 'firstName lastName');

    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── DELETE lead ───────────────────────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndDelete(req.params.id);
    if (!lead) return res.status(404).json({ success: false, message: 'Lead not found' });
    res.json({ success: true, message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;
