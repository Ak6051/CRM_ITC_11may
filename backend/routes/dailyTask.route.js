const express = require('express');
const { 
  createTask, 
  createHrTask, 
  getAllTasks, 
  updateTask, 
  deleteTask, 
  getHrTasks, 
  getAllHRs, 
  getAllHrTasks,
  createSalesTask,
  getAllSalesTasks,
  getAllSales,
  getSalesTasks,
  SalesdeleteTask,
  SalesTaskCreate,
  SalesupdateTask,
  hrRequestTaskEdit,
  getEditRequests,
  approveEditRequest,
  rejectEditRequest,
  getMyEditRequests
} = require('../controllers/dailyTask.controller');
const { protect } = require('../middleware/Hr.data.middleware');

const router = express.Router();

// Admin routes
router.post('/create', protect, createTask); // Admin creates task for any HR
router.get('/all', protect, getAllTasks);
router.put('/update/:id', protect, updateTask);
router.delete('/delete/:id', protect, deleteTask);
router.get('/assignHr', protect, getAllHRs);

// HR routes
router.post('/hr/create', protect, createHrTask); // HR creates their own task
router.get('/hr', protect, getHrTasks); // HR views today's tasks
router.get('/hr/all', protect, getAllHrTasks); // HR views all their tasks
router.get('/hr/today-check', protect, async (req, res) => {
  // Returns whether the logged-in HR has already created a task today
  try {
    const hrId = req.user._id || req.user.id;
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const count = await require('../models/dailyTask.model.js').countDocuments({
      hrId,
      createdAt: { $gte: startOfDay, $lt: endOfDay },
    });
    res.json({ hasTask: count > 0 });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// HR Edit Request routes
router.post('/hr/edit-request/:id', protect, hrRequestTaskEdit);   // HR submits edit request
router.get('/hr/edit-requests/my', protect, getMyEditRequests);    // HR views their own requests

// Candidate count for a specific HR + position (used in admin edit form for TCEOD auto-fill)
router.get('/hr-candidate-count', protect, async (req, res) => {
  try {
    const { hrId, position, date } = req.query;
    if (!hrId || !position) {
      return res.status(400).json({ error: 'hrId and position are required' });
    }

    const mongoose = require('mongoose');
    const Candidate = require('../models/candidateModal');

    // Date range: if date provided use that day, else use today
    const targetDate = date ? new Date(date) : new Date();
    const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
    const endOfDay   = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);

    // Escape special regex characters (e.g. parentheses, &, +, etc.)
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const positionRegex = new RegExp(`^${escapeRegex(position.trim())}$`, 'i');

    // hrId can be ObjectId or string — handle both
    let hrObjectId;
    try {
      hrObjectId = new mongoose.Types.ObjectId(hrId);
    } catch {
      return res.status(400).json({ error: 'Invalid hrId format' });
    }

    // Count candidates created by this HR with matching positionName on the given date
    const count = await Candidate.countDocuments({
      createdBy:    hrObjectId,
      positionName: positionRegex,
      createdAt:    { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ count });
  } catch (err) {
    console.error('[hr-candidate-count] error:', err);
    res.status(500).json({ error: err.message });
  }
});

// Admin Edit Request routes
router.get('/edit-requests', protect, getEditRequests);                    // Admin views all requests
router.put('/edit-requests/:id/approve', protect, approveEditRequest);     // Admin approves
router.put('/edit-requests/:id/reject', protect, rejectEditRequest);       // Admin rejects

//sales routes
router.post('/sales/create', protect, createSalesTask); // sales creates their own task
 router.get('/sales/all', protect, getAllSalesTasks); // sales views all their tasks
router.get('/assignSales', protect, getAllSales); // sales views all their tasks
router.get('/sales', protect, getSalesTasks); // sales views today's tasks
router.delete('/sales/delete/:id', protect, SalesdeleteTask); // sales views today's tasks
router.post('/sales/task/create', protect, SalesTaskCreate); // sales creates their own task
router.put('/sales/update/:id', protect, SalesupdateTask); // sales views today's tasks
module.exports = router;
