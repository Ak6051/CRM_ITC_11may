const express = require('express');
const router = express.Router();
const auth = require('../middleware/authMiddleware');
const Lead = require('../models/Lead.model');

// ── GET all leads (with optional filters) ────────────────────────────────────
router.get('/', auth, async (req, res) => {
  try {
    const { status, source, search, page = 1, limit = 100 } = req.query;
    const filter = {};

    if (status)  filter.leadStatus  = status;
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
router.post('/', auth, async (req, res) => {
  try {
    const { leadName, companyName, mobileNumber, email, leadSource } = req.body;
    if (!leadName || !companyName || !mobileNumber || !email || !leadSource) {
      return res.status(400).json({ success: false, message: 'leadName, companyName, mobileNumber, email and leadSource are required' });
    }

    const lead = new Lead({ ...req.body, createdBy: req.user?._id });
    await lead.save();
    res.status(201).json({ success: true, data: lead });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
});

// ── PUT update lead ───────────────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
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
