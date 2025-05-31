// routes/jobRoutes.js or reportRoutes.js

const express = require('express');
const router = express.Router();
const JobOpenings = require('../models/jobopennings.modal');
const Candidate = require('../models/candidateModal');

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

module.exports = router;
