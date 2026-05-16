// routes/jobRoutes.js or reportRoutes.js

const express = require('express');
const router = express.Router();
const JobOpenings = require('../models/jobopennings.modal');
const Candidate = require('../models/candidateModal');
const CandidateApplication = require('../models/CandidateApplication.model');

router.get('/job-report/:jobId', async (req, res) => {
  try {
    const jobId = req.params.jobId;

    const job = await JobOpenings.findById(jobId).populate('assignedHR', 'firstName lastName email');
    const candidates = await Candidate.find({ jobId });

    res.status(200).json({ job, candidates });
  } catch (error) {
    console.error('Error fetching job report:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

// Fetch candidates for HR report
router.get('/fetch/candidates', async (req, res) => {
  try {
    const { startDate, endDate } = req.query;
    
    // Build date filter for selectionDate
    let dateFilter = {};
    if (startDate || endDate) {
      dateFilter.selectionDate = {};
      if (startDate) {
        dateFilter.selectionDate.$gte = new Date(startDate);
      }
      if (endDate) {
        dateFilter.selectionDate.$lte = new Date(endDate);
      }
    }

    // Fetch candidate applications with all required data
    const candidates = await CandidateApplication.find(dateFilter)
      .populate('candidateId', 'candidateName candidateEmail candidatePhone qualification currentLocation currentPosition currentCTC expectedCTC noticePeriod reasonforLeaving currentCompany experience')
      .populate('createdBy', 'firstName lastName email')
      .populate('jobId', 'companyName companyAddress phoneNumber jobTitle jobLocation jobTiming')
      .populate('interviewByWhom', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Flatten candidate data for frontend
    const flattenedCandidates = candidates.map(app => ({
      ...app.toObject(),
      // Flatten candidate details
      candidateName: app.candidateId?.candidateName || '',
      candidateEmail: app.candidateId?.candidateEmail || '',
      candidatePhone: app.candidateId?.candidatePhone || '',
      qualification: app.candidateId?.qualification || '',
      currentLocation: app.candidateId?.currentLocation || '',
      currentPosition: app.candidateId?.currentPosition || '',
      currentCTC: app.candidateId?.currentCTC || '',
      expectedCTC: app.candidateId?.expectedCTC || '',
      noticePeriod: app.candidateId?.noticePeriod || '',
      reasonforLeaving: app.candidateId?.reasonforLeaving || '',
      currentCompany: app.candidateId?.currentCompany || '',
      experience: app.candidateId?.experience || '',
      // Keep original fields
      createdBy: app.createdBy,
      jobId: app.jobId,
      interviewByWhom: app.interviewByWhom,
      _id: app._id,
      createdAt: app.createdAt,
      updatedAt: app.updatedAt
    }));

    res.status(200).json(flattenedCandidates);
  } catch (error) {
    console.error('Error fetching candidates for HR report:', error);
    res.status(500).json({ error: 'Internal Server Error', message: error.message });
  }
});

module.exports = router;
