const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const CallLog = require('../models/CallLog.model');
const Candidate = require('../models/candidateModal');
const { protect } = require('../middleware/Hr.data.middleware');

// ── POST /api/calllog  — HR marks a candidate as called ──────────────────────
router.post('/', protect, async (req, res) => {
  try {
    const hrId = req.user._id;
    const { candidateId, position } = req.body;

    if (!candidateId || !position) {
      return res.status(400).json({ message: 'candidateId and position are required' });
    }

    // Validate candidate exists
    const candidate = await Candidate.findById(candidateId).select('candidateName candidatePhone');
    if (!candidate) return res.status(404).json({ message: 'Candidate not found' });

    // Check if already logged today for same HR + candidate + position
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    const existing = await CallLog.findOne({
      hrId,
      candidateId,
      position: { $regex: new RegExp(`^\\s*${position.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i') },
      calledAt: { $gte: todayStart, $lte: todayEnd },
    });

    if (existing) {
      return res.status(200).json({
        message: 'Already marked as called today',
        callLog: existing,
        alreadyLogged: true,
      });
    }

    const callLog = await CallLog.create({ hrId, candidateId, position: position.trim(), calledAt: new Date() });

    res.status(201).json({ message: 'Marked as called', callLog, alreadyLogged: false });
  } catch (err) {
    console.error('[callLog POST] error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/calllog/count  — count calls for HR + position + date (for TCEOD) ──
router.get('/count', protect, async (req, res) => {
  try {
    const { hrId: queryHrId, position, date } = req.query;

    // Use queried hrId (admin view) or logged-in HR's id
    const hrId = queryHrId || req.user._id;

    if (!position) return res.status(400).json({ message: 'position is required' });

    let startOfDay, endOfDay;
    if (date) {
      const d = new Date(date);
      startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      endOfDay   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const positionRegex = new RegExp(
      `^\\s*${position.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'
    );

    const count = await CallLog.countDocuments({
      hrId: new mongoose.Types.ObjectId(hrId.toString()),
      position: positionRegex,
      calledAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ count });
  } catch (err) {
    console.error('[callLog GET /count] error:', err);
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/calllog/today  — list today's call logs for the logged-in HR ────
router.get('/today', protect, async (req, res) => {
  try {
    const hrId = req.user._id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);

    const logs = await CallLog.find({
      hrId,
      calledAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('candidateId', 'candidateName candidatePhone positionName')
      .sort({ calledAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── GET /api/calllog/details  — admin: list call logs for HR + position + date ──
router.get('/details', protect, async (req, res) => {
  try {
    const { hrId, position, date } = req.query;
    if (!hrId || !position) return res.status(400).json({ message: 'hrId and position are required' });

    let startOfDay, endOfDay;
    if (date) {
      const d = new Date(date);
      startOfDay = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
      endOfDay   = new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    const positionRegex = new RegExp(
      `^\\s*${position.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}\\s*$`, 'i'
    );

    const logs = await CallLog.find({
      hrId: new mongoose.Types.ObjectId(hrId),
      position: positionRegex,
      calledAt: { $gte: startOfDay, $lte: endOfDay },
    })
      .populate('candidateId', 'candidateName candidatePhone positionName')
      .sort({ calledAt: -1 });

    res.json(logs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
