const express = require('express');
const router = express.Router();
const masterDashboardController = require('../controllers/masterDashboard.controller');
const authMiddleware = require('../middleware/authMiddleware');

// Admin Master Dashboard
router.get('/admin', authMiddleware, masterDashboardController.getAdminDashboardData);

// HR Master Dashboard
router.get('/hr', authMiddleware, masterDashboardController.getHRDashboardData);

// Sales Master Dashboard
router.get('/sales', authMiddleware, masterDashboardController.getSalesDashboardData);

// TL Master Dashboard
router.get('/tl', authMiddleware, masterDashboardController.getTLDashboardData);

module.exports = router;
