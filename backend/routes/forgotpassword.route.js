const express = require('express');
const { sendOtp, verifyOtpAndReset } = require('../controllers/forgetpassword.controller');

const router = express.Router();

router.post('/send-otp', sendOtp);
router.post('/verify-otp', verifyOtpAndReset);

module.exports = router;