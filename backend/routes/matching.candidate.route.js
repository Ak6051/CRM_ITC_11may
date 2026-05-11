// routes/job.route.js
const express = require('express');
const router = express.Router();
const { findMatchingCandidates } = require('../controllers/matching.candidate.controller');

router.get('/jobs/:jobId/matching-candidates', findMatchingCandidates);

module.exports = router;
