const express = require('express');
const router  = express.Router();
const { protect } = require('../middleware/Hr.data.middleware');
const {
  assignCandidates,
  getApplicationsByCandidate,
  getApplicationsByJob,
  updateApplication,
  deleteApplication,
} = require('../controllers/candidateApplication.controller');

// Assign candidates to a job (bulk)
router.post('/assign', protect, assignCandidates);

// Get all applications for a candidate (history view)
router.get('/candidate/:candidateId', protect, getApplicationsByCandidate);

// Get all candidates assigned to a job
router.get('/job/:jobId', protect, getApplicationsByJob);

// Update application (interview/billing/status)
router.put('/:applicationId', protect, updateApplication);

// Remove assignment
router.delete('/:applicationId', protect, deleteApplication);

module.exports = router;
