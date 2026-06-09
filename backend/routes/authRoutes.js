const express = require('express');
const { registerUser, loginUser, preLogin, verifyOtpAndLogin, logoutUser } = require('../controllers/authController');
const { ipWhitelistMiddleware } = require('../middleware/ipWhitelistMiddleware');
const router = express.Router();

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/pre-login', ipWhitelistMiddleware, preLogin);
router.post('/verify-otp', verifyOtpAndLogin);
router.post('/logout', logoutUser);

// ── Beacon logout — called by navigator.sendBeacon on tab/window close ──────
// Token is passed as a query param because sendBeacon body cannot set headers
router.post('/logout-beacon', logoutUser);

module.exports = router;
