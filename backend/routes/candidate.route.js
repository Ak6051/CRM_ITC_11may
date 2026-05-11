const express = require('express');
const router = express.Router();
const { 
  getAllCandidates, 
  getHRCandidates,
  deleteCandidate, 
  markCandidateAsBackout,
  updateCandidate 
} = require('../controllers/candidate.controller');
const { protect } = require('../middleware/Hr.data.middleware');
const Candidate = require("../models/candidateModal");
const JobOpenings = require('../models/jobopennings.modal');
const Company = require('../models/company.model');
const {upload} = require('../middleware/gcsMulter');

// Get all candidates (admin only)
router.get('/candidates', protect, getAllCandidates);

// Get HR's own candidates
router.get('/hr/candidates', protect, getHRCandidates);

router.put('/candidate/:id', protect, upload.fields([
  { name: 'resume', maxCount: 1 },
  { name: 'candidateAgreement', maxCount: 1 }
]), updateCandidate);
// Delete a candidate
router.delete('/candidates/:id', protect, deleteCandidate);

// Mark candidate as backout
router.put('/candidates/:id/backout', protect, markCandidateAsBackout);

// ── Account Department: candidates who have joined ────────────────────────
router.get('/candidates/joined', protect, async (req, res) => {
  try {
    const CandidateApplication = require('../models/CandidateApplication.model');
    const applications = await CandidateApplication.find({
      hasJoined: 'Yes',
      joiningDate: { $exists: true, $ne: null },
    })
      .populate({ path: 'candidateId', model: 'Candidate', select: 'candidateName candidateEmail candidatePhone qualification positionName experience currentLocation currentPosition currentCTC expectedCTC noticePeriod reasonforLeaving currentCompany remark resumeLink' })
      .populate({ path: 'jobId', model: 'JobOpenings', select: 'companyName companyAddress phoneNumber jobTitle jobLocation jobTiming' })
      .populate({ path: 'createdBy', model: 'User', select: 'firstName lastName role' })
      .sort({ joiningDate: -1 });

    const result = applications.map(app => {
      const c = app.candidateId || {};
      const obj = app.toObject();
      return {
        _id:             app._id,
        candidateName:   c.candidateName   || '',
        candidateEmail:  c.candidateEmail  || '',
        candidatePhone:  c.candidatePhone  || '',
        qualification:   c.qualification   || '',
        positionName:    obj.positionName  || c.positionName || '',
        experience:      c.experience      || '',
        currentLocation: c.currentLocation || '',
        jobId:           obj.jobId,
        createdBy:       obj.createdBy,
        joiningDate:     obj.joiningDate,
        hasJoined:       obj.hasJoined     || '',
        salaryOffered:   obj.salaryOffered || obj.offeredSalary || '',
        billingDate:     obj.billingDate,
        billingAmount:   obj.billingAmount  || '',
        paymentStatus:   obj.paymentStatus  || 'Pending',
        paymentDate:     obj.paymentDate,
        paymentMode:     obj.paymentMode    || '',
        paymentRemark:   obj.paymentRemark  || '',
        selectionDate:   obj.selectionDate,
        selectionStatus: obj.selectionStatus || '',
        createdAt:       obj.createdAt,
      };
    });

    res.status(200).json(result);
  } catch (err) {
    console.error('Error fetching joined candidates:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
});

router.put('/lineup/:id', async (req, res) => {
    try {
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        req.params.id,
        {
          billingDate: req.body.billingDate,
          billingAmount: req.body.billingAmount,
          paymentStatus: req.body.paymentStatus,
          paymentDate: req.body.paymentDate,
          paymentMode: req.body.paymentMode,
          paymentRemark: req.body.paymentRemark,
        },
        { new: true }
      );
      res.json(updatedCandidate);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });



  

// Get all candidates created by a specific HR, with company details
router.get('/candidates/by-hr/:hrId', protect, async (req, res) => {
  try {
    const hrId = req.params.hrId;
    // Find all candidates created by this HR
    const candidates = await Candidate.find({ createdBy: hrId })
      .populate({
        path: 'jobId',
        model: 'JobOpenings',
        select: 'companyName companyAddress phoneNumber jobTitle jobLocation jobTiming companyId',
      });
    res.status(200).json(candidates);
  } catch (error) {
    console.error('Error fetching candidates by HR:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

// ── GET positions assigned to a specific HR ──────────────────────────────────
router.get('/hr/:hrId/positions', protect, async (req, res) => {
  try {
    const jobs = await JobOpenings.find({ assignedHR: req.params.hrId })
      .select('_id jobTitle companyName companyId salary')
      .sort({ createdAt: -1 });
    res.json(jobs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// ── POST assign candidate(s) to HR + position ─────────────────────────────────
router.post('/assign', protect, async (req, res) => {
  try {
    const { candidateIds, hrId, jobId } = req.body;
    if (!candidateIds?.length || !hrId || !jobId) {
      return res.status(400).json({ message: 'candidateIds, hrId and jobId are required' });
    }

    const CandidateApplication = require('../models/CandidateApplication.model');
    const job = await JobOpenings.findById(jobId).lean();
    if (!job) return res.status(404).json({ message: 'Job not found' });

    const now = new Date();
    const assigned = [];
    const alreadyAssigned = [];

    for (const candidateId of candidateIds) {
      // Upsert CandidateApplication — single source of truth
      const existing = await CandidateApplication.findOne({ candidateId, jobId });
      if (existing) {
        alreadyAssigned.push(candidateId);
        continue;
      }

      await CandidateApplication.create({
        candidateId,
        jobId,
        positionName:  job.jobTitle || '',
        createdBy:     hrId,          // HR who "owns" this application
        assignedBy:    req.user._id,  // Admin who assigned
        assignedAt:    now,
        paymentStatus: 'Pending',
      });

      // Also update candidateModal so HR's filter (createdBy) works
      await Candidate.findByIdAndUpdate(candidateId, {
        $set: {
          jobId,
          createdBy:        hrId,
          assignedTo:       hrId,
          assignedPosition: jobId,
          assignedBy:       req.user._id,
          assignedAt:       now,
        },
      });

      assigned.push(candidateId);
    }

    res.json({
      message: `${assigned.length} candidate(s) assigned successfully`,
      assigned,
      alreadyAssigned,
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;