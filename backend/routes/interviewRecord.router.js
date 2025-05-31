// routes/hrDashboardRoutes.js
const express = require('express');
const router = express.Router();
const { getHRCompanyCandidateReport } = require('../controllers/interviewRecord.controller');

router.get('/hr-company-candidates', getHRCompanyCandidateReport);

module.exports = router;
