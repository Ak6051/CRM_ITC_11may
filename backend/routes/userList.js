// backend/routes/userList.js
const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Get all HR users
router.get('/hr', async (req, res) => {
  try {
    const hrUsers = await User.find({ role: 'HR' }, '_id firstName lastName email');
    res.json(hrUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});


// Get all Sales users
router.get('/sales', async (req, res) => {
  try {
    const salesUsers = await User.find({ role: 'Sales' }, '_id firstName lastName email');
    res.json(salesUsers);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
