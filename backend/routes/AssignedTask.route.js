const express = require('express');
const router = express.Router();
const AssignedTask = require('../models/AssignedTask.model');
const User = require('../models/User');
const { protect } = require('../middleware/Hr.data.middleware');

// Admin: Assign Task
router.post('/assign', protect, async (req, res) => {
  try {
    const { assignedTo, taskName, endDate } = req.body;

    // Check if user is admin
    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: 'Access denied' });
    }

    const task = new AssignedTask({ assignedTo, taskName, endDate });
    await task.save();

    res.status(201).json({ message: 'Task assigned successfully', task });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

// HR: Mark Task as Completed
router.post('/complete/:id', protect, async (req, res) => {
  try {
    const task = await AssignedTask.findById(req.params.id);

    // Check if task exists and is assigned to the logged-in HR
    if (!task || task.assignedTo.toString() !== req.user._id.toString()) {
      return res.status(404).json({ message: 'Task not found' });
    }

    task.isCompleted = true;
    await task.save();

    res.status(200).json({ message: 'Task marked as completed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error' });
  }
});

 router.get('/my-tasks', protect, async (req, res) => {
    try {
      if (req.user.role !== 'HR') {
        return res.status(403).json({ message: 'Only HR can view this route' });
      }
  
      const tasks = await AssignedTask.find({ assignedTo: req.user._id });
      res.status(200).json(tasks);
    } catch (error) {
      console.error('Fetch HR tasks error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });

  router.get('/me', protect, async (req, res) => {
    try {
      res.status(200).json(req.user); // user info already milti hai middleware se
    } catch (err) {
      res.status(500).json({ error: 'Something went wrong' });
    }
  });

  // GET all assigned tasks with HR details
router.get('/', protect, async (req, res) => {
    try {
      const tasks = await AssignedTask.find()
        .populate('assignedTo', 'firstName lastName role');
      res.status(200).json(tasks);
    } catch (err) {
      res.status(500).json({ error: err.message });
    }
  });
  
  

module.exports = router;
