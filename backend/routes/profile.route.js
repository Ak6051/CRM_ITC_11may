const express = require('express');
const { getUserProfile, updateUserProfile,changeUserPassword  } = require('../controllers/profile.controllers');
const { authenticate } = require('../middleware/profile.middleware'); // Middleware for token verification
const router = express.Router();

// Route to fetch user profile
router.get('/profile', authenticate, getUserProfile);

// Route to update user profile
router.put('/profile', authenticate, updateUserProfile);
router.put('/change-password', authenticate, changeUserPassword);


module.exports = router;
