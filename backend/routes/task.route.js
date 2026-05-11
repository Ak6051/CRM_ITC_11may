const express = require('express');
const router = express.Router();
const Task = require('../models/task.modal');
const {protect} = require('../middleware/Hr.data.middleware');

router.post('/', protect, async (req, res) => {
  try {
    const task = new Task({
      userId: req.user.id,
      taskName: req.body.taskName,
      endDate: req.body.endDate
    });
    await task.save();
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.put('/complete/:id', protect, async (req, res) => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task || task.userId.toString() !== req.user.id)
      return res.status(403).json({ message: 'Unauthorized' });

    task.isCompleted = true;
    await task.save();
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/', protect, async (req, res) => {
  try {
    const tasks = await Task.find({ userId: req.user.id });
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



module.exports = router;
