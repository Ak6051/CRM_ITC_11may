const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/authMiddleware');
const { sendCandidateEmail } = require('../controllers/sendEmail.controller');

router.post('/send-candidate-email', authMiddleware, sendCandidateEmail);

module.exports = router;
