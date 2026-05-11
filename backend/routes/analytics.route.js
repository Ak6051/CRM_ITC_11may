const express = require('express');
const router  = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const {
  getCompanyHrStats,
  getHrPositionStats,
} = require('../controllers/analytics.controller');

// Company → HR breakdown
router.get('/company-hr', authMiddleware, getCompanyHrStats);

// HR → Position breakdown
router.get('/hr-position', authMiddleware, getHrPositionStats);

module.exports = router;
