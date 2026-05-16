const express = require('express');
const User = require('../models/User');
const router = express.Router();
const { authenticate } = require('../middleware/profile.middleware');
const { updateUserProfile, getUserProfile, changeUserPassword } = require('../controllers/profile.controllers');

// Fetch all HR users
router.get('/hr-users', async (req, res) => {
    try {
        const hrUsers = await User.find({ role: 'HR', isActive: true });
        res.json(hrUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching HR users', error });
    }
});

// Fetch all Team Leader users
router.get('/tl-users', async (req, res) => {
    try {
        const tlUsers = await User.find({ role: 'teamleader', isActive: true });
        res.json(tlUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching TL users', error });
    }
});

router.get('/hr-admins', async (req, res) => {
  try {
    // Fetch users whose role is either 'HR' or 'Admin'
    const hrAndAdminUsers = await User.find({ role: { $in: ['HR', 'admin'] }, isActive: true });
    res.json(hrAndAdminUsers);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching HR and Admin users', error });
  }
});


// Get HR profile
router.get('/profile', authenticate, getUserProfile);

// Update HR profile
router.put('/profile', authenticate, updateUserProfile);

// Change password
router.post('/change-password', authenticate, changeUserPassword);

module.exports = router;
