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
// TCEOD = new candidates created by HR for this position today
//       + existing candidates "marked as called" by HR for this position today
router.get('/hr-candidate-count', protect, async (req, res) => {
  try {
    const { hrId, position, date } = req.query;
    if (!hrId || !position) {
      return res.status(400).json({ error: 'hrId and position are required' });
    }

    const mongoose = require('mongoose');
    const Candidate = require('../models/candidateModal');
    const JobOpenings = require('../models/jobopennings.modal');
    const CandidateApplication = require('../models/CandidateApplication.model');
    const CallLog = require('../models/CallLog.model');

    // Date range: resilient to local and UTC timezones
    let startOfDay, endOfDay;
    if (date) {
      const dateStr = String(date).trim();
      if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
        startOfDay = new Date(`${dateStr}T00:00:00.000Z`);
        endOfDay   = new Date(`${dateStr}T23:59:59.999Z`);
      } else {
        const targetDate = new Date(date);
        startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 0, 0, 0, 0);
        endOfDay   = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999);
      }
    } else {
      const now = new Date();
      startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    }

    // Escape special regex characters and allow optional leading/trailing spaces
    const escapeRegex = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const positionRegex = new RegExp(`^\\s*${escapeRegex(position.trim())}\\s*$`, 'i');

    let hrObjectId;
    try {
      hrObjectId = new mongoose.Types.ObjectId(hrId);
    } catch {
      return res.status(400).json({ error: 'Invalid hrId format' });
    }

    // Find all job IDs that match the position title
    const matchingJobs = await JobOpenings.find({ jobTitle: positionRegex }).select('_id');
    const matchingJobIds = matchingJobs.map(j => j._id);

    // 1. New candidates created by this HR for this position today
    const directCandidateIds = await Candidate.find({
      createdBy: hrObjectId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { positionName: positionRegex },
        { jobId: { $in: matchingJobIds } },
        { assignedPosition: { $in: matchingJobIds } }
      ]
    }).distinct('_id');

    const applicationCandidateIds = await CandidateApplication.find({
      createdBy: hrObjectId,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
      $or: [
        { positionName: positionRegex },
        { jobId: { $in: matchingJobIds } }
      ]
    }).distinct('candidateId');

    // 2. Existing candidates "marked as called" by this HR for this position today
    const calledCandidateIds = await CallLog.find({
      hrId: hrObjectId,
      position: positionRegex,
      calledAt: { $gte: startOfDay, $lte: endOfDay },
    }).distinct('candidateId');

    // Union of all three sets — unique candidate count
    const combinedSet = new Set([
      ...directCandidateIds.map(id => id.toString()),
      ...applicationCandidateIds.map(id => id.toString()),
      ...calledCandidateIds.map(id => id.toString()),
    ]);

    res.json({
      count: combinedSet.size,
      breakdown: {
        newCandidates: new Set([
          ...directCandidateIds.map(id => id.toString()),
          ...applicationCandidateIds.map(id => id.toString()),
        ]).size,
        calledExisting: calledCandidateIds.length,
      }
    });
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
