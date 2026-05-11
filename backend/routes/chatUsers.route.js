const express = require('express');
const router = express.Router();
const User = require('../models/User');
const {protect} = require('../middleware/Hr.data.middleware');

/**
 * @route   GET /api/chat/users/admin
 * @desc    Get all admin users for chat
 * @access  Private (HR, Admin, Sales)
 */
router.get('/admin', protect, async (req, res) => {
  try {
    const users = await User.find(
      { role: 'admin' },
      '_id firstName lastName email role'
    ).sort({ firstName: 1 });
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching admin users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/chat/users/hr
 * @desc    Get all HR users for chat (excluding current user)
 * @access  Private (HR, Admin, Sales)
 */
router.get('/hr', protect, async (req, res) => {
  try {
    const users = await User.find(
      { role: 'HR', _id: { $ne: req.user.id } },
      '_id firstName lastName email role'
    ).sort({ firstName: 1 });
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching HR users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/chat/users/sales
 * @desc    Get all Sales users for chat
 * @access  Private (HR, Admin, Sales)
 */
router.get('/sales', protect, async (req, res) => {
  try {
    const users = await User.find(
      { role: 'Sales' },
      '_id firstName lastName email role'
    ).sort({ firstName: 1 });
    
    res.json(users);
  } catch (err) {
    console.error('Error fetching sales users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @route   GET /api/chat/users/all
 * @desc    Get all users for chat (admin, hr, sales) in a single request
 * @access  Private (HR, Admin, Sales)
 */
router.get('/all',  protect, async (req, res) => {
  try {
    const [admins, hrs, sales] = await Promise.all([
      User.find(
        { role: 'admin' },
        '_id firstName lastName email role'
      ).sort({ firstName: 1 }),
      
      User.find(
        { role: 'HR', _id: { $ne: req.user.id } },
        '_id firstName lastName email role'
      ).sort({ firstName: 1 }),
      
      User.find(
        { role: 'Sales' },
        '_id firstName lastName email role'
      ).sort({ firstName: 1 })
    ]);
    
    res.json({
      admins,
      hrs,
      sales
    });
  } catch (err) {
    console.error('Error fetching all chat users:', err);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
