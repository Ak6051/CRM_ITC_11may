const express = require('express');
const router = express.Router();
const User = require('../models/User');
const bcrypt = require('bcryptjs');
const authMiddleware = require('../middleware/authMiddleware');
const { upload, uploadToS3 } = require('../middleware/gcsMulter');

// Admin only middleware
const adminOnly = (req, res, next) => {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied. Admins only.' });
  }
  next();
};

// Document upload fields
const profileUpload = upload.fields([
  { name: 'docAadhaar',           maxCount: 1 },
  { name: 'docPAN',               maxCount: 1 },
  { name: 'docResume',            maxCount: 1 },
  { name: 'docEducationalCerts',  maxCount: 1 },
  { name: 'docExperienceLetters', maxCount: 1 },
  { name: 'docPassportPhoto',     maxCount: 1 },
]);

// GET all users (HR, Sales, teamleader)
router.get('/manage-users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const users = await User.find(
      { role: { $in: ['HR', 'Sales', 'teamleader'] } },
      '-password -otp -otpExpiresAt -authorizedDevices'
    ).sort({ createdAt: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST create new user
router.post('/manage-users', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, email, password, mobileNo, address, gender, role } = req.body;

    const existing = await User.findOne({ email });
    if (existing) return res.status(400).json({ error: 'Email already exists' });

    const user = new User({ firstName, lastName, email, password, mobileNo, address, gender, role });
    await user.save();

    const saved = user.toObject();
    delete saved.password;
    res.status(201).json(saved);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update user (basic fields)
router.put('/manage-users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { password, ...rest } = req.body;
    const update = { ...rest };

    if (password) {
      const salt = await bcrypt.genSalt(10);
      update.password = await bcrypt.hash(password, salt);
    }

    // Check if name is being changed — warn admin about historical data impact
    const existingUser = await User.findById(req.params.id).select('firstName lastName role isActive');
    if (!existingUser) return res.status(404).json({ error: 'User not found' });

    const nameChanging =
      (rest.firstName && rest.firstName !== existingUser.firstName) ||
      (rest.lastName  && rest.lastName  !== existingUser.lastName);

    // If name is changing, this is a different person reusing the account.
    // Block this — admin should deactivate old user and create a new one.
    if (nameChanging && existingUser.isActive) {
      return res.status(400).json({
        error: 'NAME_CHANGE_BLOCKED',
        message:
          'Changing the name of an active user will corrupt historical data. ' +
          'To assign this account to a new person: (1) Deactivate this user, ' +
          '(2) Create a new user with the new person\'s details.',
      });
    }

    const user = await User.findByIdAndUpdate(req.params.id, update, { new: true })
      .select('-password -otp -otpExpiresAt -authorizedDevices');

    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT update employee profile (all 9 sections + file uploads)
router.put('/manage-users/:id/profile', authMiddleware, adminOnly, profileUpload, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    // Scalar fields
    const scalarFields = [
      'fatherHusbandName','dateOfBirth','maritalStatus','nationality',
      'alternateNumber','currentAddress','permanentAddress',
      'position','department','dateOfJoining','workLocation','reportingManager',
      'currentCTC','offeredCTC','paymentMode',
      'bankName','accountHolderName','accountNumber','ifscCode','bankBranch',
      'emergencyName','emergencyRelation','emergencyContact',
    ];
    scalarFields.forEach(f => {
      if (req.body[f] !== undefined) user[f] = req.body[f] || (f.includes('Date') ? null : '');
    });

    // Array fields (JSON stringified from frontend)
    if (req.body.education) {
      try { user.education = JSON.parse(req.body.education); } catch {}
    }
    if (req.body.workExperience) {
      try { user.workExperience = JSON.parse(req.body.workExperience); } catch {}
    }

    // File uploads → S3
    const docFields = ['docAadhaar','docPAN','docResume','docEducationalCerts','docExperienceLetters','docPassportPhoto'];
    for (const field of docFields) {
      if (req.files?.[field]?.[0]) {
        const f = req.files[field][0];
        user[field] = await uploadToS3(f.buffer, `employee_docs/${Date.now()}_${f.originalname.replace(/\s+/g,'_')}`, f.mimetype);
      }
    }

    await user.save();
    const result = user.toObject();
    delete result.password;
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH toggle active status
router.patch('/manage-users/:id/toggle-active', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    user.isActive = !user.isActive;
    await user.save();
    res.json({ isActive: user.isActive });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PATCH reassign account to a new person (deactivated accounts only)
// This is the correct flow when same email/password is reused for a new HR.
// It starts a fresh tenure so old data stays under the previous person's name.
router.patch('/manage-users/:id/reassign', authMiddleware, adminOnly, async (req, res) => {
  try {
    const { firstName, lastName, mobileNo, address, password } = req.body;

    if (!firstName || !lastName || !mobileNo || !address) {
      return res.status(400).json({ error: 'firstName, lastName, mobileNo, and address are required' });
    }

    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    if (user.isActive) {
      return res.status(400).json({
        error: 'MUST_DEACTIVATE_FIRST',
        message: 'Deactivate the user before reassigning the account to a new person.',
      });
    }

    const now = new Date();

    // Helper to extract current profile data for snapshot
    const getProfileSnapshot = (u) => ({
      firstName: u.firstName,
      lastName: u.lastName,
      mobileNo: u.mobileNo,
      address: u.address,
      gender: u.gender,
      fatherHusbandName: u.fatherHusbandName,
      dateOfBirth: u.dateOfBirth,
      maritalStatus: u.maritalStatus,
      nationality: u.nationality,
      alternateNumber: u.alternateNumber,
      currentAddress: u.currentAddress,
      permanentAddress: u.permanentAddress,
      position: u.position,
      department: u.department,
      dateOfJoining: u.dateOfJoining,
      workLocation: u.workLocation,
      reportingManager: u.reportingManager,
      education: u.education,
      workExperience: u.workExperience,
      currentCTC: u.currentCTC,
      offeredCTC: u.offeredCTC,
      paymentMode: u.paymentMode,
      bankName: u.bankName,
      accountHolderName: u.accountHolderName,
      accountNumber: u.accountNumber,
      ifscCode: u.ifscCode,
      bankBranch: u.bankBranch,
      docAadhaar: u.docAadhaar,
      docPAN: u.docPAN,
      docResume: u.docResume,
      docEducationalCerts: u.docEducationalCerts,
      docExperienceLetters: u.docExperienceLetters,
      docPassportPhoto: u.docPassportPhoto,
      emergencyName: u.emergencyName,
      emergencyRelation: u.emergencyRelation,
      emergencyContact: u.emergencyContact,
    });

    // Save previous tenure to history
    if (user.tenureStartedAt) {
      user.tenureHistory.push({
        name:            `${user.firstName} ${user.lastName}`.trim(),
        startedAt:       user.tenureStartedAt,
        endedAt:         now,
        profileSnapshot: getProfileSnapshot(user),
      });
    } else {
      user.tenureHistory.push({
        name:            `${user.firstName} ${user.lastName}`.trim(),
        startedAt:       user.createdAt,
        endedAt:         now,
        profileSnapshot: getProfileSnapshot(user),
      });
    }

    // Update to new person's details
    user.firstName       = firstName;
    user.lastName        = lastName;
    user.mobileNo        = mobileNo;
    user.address         = address;
    user.tenureStartedAt = now;
    user.isActive        = true;

    // ── CLEAR EMPLOYEE PROFILE FOR NEW TENURE ────────────────────────────────
    user.fatherHusbandName = '';
    user.dateOfBirth       = null;
    user.maritalStatus     = '';
    user.nationality       = '';
    user.alternateNumber   = '';
    user.currentAddress    = '';
    user.permanentAddress  = '';
    user.position          = '';
    user.department        = '';
    user.dateOfJoining     = null;
    user.workLocation      = '';
    user.reportingManager  = '';
    user.education         = [];
    user.workExperience    = [];
    user.currentCTC        = '';
    user.offeredCTC        = '';
    user.paymentMode       = '';
    user.bankName          = '';
    user.accountHolderName = '';
    user.accountNumber     = '';
    user.ifscCode          = '';
    user.bankBranch        = '';
    user.docAadhaar        = '';
    user.docPAN            = '';
    user.docResume         = '';
    user.docEducationalCerts  = '';
    user.docExperienceLetters = '';
    user.docPassportPhoto     = '';
    user.emergencyName     = '';
    user.emergencyRelation = '';
    user.emergencyContact  = '';

    // Optionally update password
    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    await user.save();

    const result = user.toObject();
    delete result.password;
    res.json({ message: 'Account reassigned successfully. New tenure started.', user: result });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE user
router.delete('/manage-users/:id', authMiddleware, adminOnly, async (req, res) => {
  try {
    const user = await User.findByIdAndDelete(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
