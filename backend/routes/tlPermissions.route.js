const express = require('express');
const router = express.Router();
const User = require('../models/User');
const { protect } = require('../middleware/Hr.data.middleware');

// GET all teamleader users with their permissions
router.get('/tl-users', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this' });
    }
    const tlUsers = await User.find({ role: 'teamleader' })
      .select('firstName lastName email permissions assignedHRs')
      .populate('assignedHRs', 'firstName lastName email');
    res.json(tlUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT update permissions for a specific TL user
router.put('/tl-users/:id/permissions', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can update permissions' });
    }
    const { permissions } = req.body;
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { permissions },
      { new: true }
    ).select('firstName lastName email permissions assignedHRs');

    if (!user) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'Permissions updated successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT assign HRs under a TL
router.put('/tl-users/:id/assign-hrs', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can assign HRs' });
    }
    const { hrIds } = req.body; // array of HR user IDs
    const user = await User.findByIdAndUpdate(
      req.params.id,
      { assignedHRs: hrIds || [] },
      { new: true }
    )
      .select('firstName lastName email permissions assignedHRs')
      .populate('assignedHRs', 'firstName lastName email');

    if (!user) return res.status(404).json({ message: 'TL user not found' });
    res.json({ message: 'HRs assigned successfully', user });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET all HR users (for admin dropdown when assigning)
router.get('/all-hr-users', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can access this' });
    }
    const hrUsers = await User.find({ role: 'HR' }).select('firstName lastName email');
    res.json(hrUsers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET HRs assigned to the logged-in TL (used by TL sidebar)
router.get('/my-assigned-hrs', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('assignedHRs')
      .populate('assignedHRs', 'firstName lastName email _id');
    res.json({ assignedHRs: user?.assignedHRs || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET permissions for logged-in TL user (used by TL sidebar)
router.get('/my-permissions', protect, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('permissions');
    res.json({ permissions: user?.permissions || [] });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
