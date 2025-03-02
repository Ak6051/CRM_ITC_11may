// saleRoutes.js
const express = require('express');
const { updatePaymentStatus } = require('../controllers/payment.controllers');
const router = express.Router();

router.put('/update-payment', updatePaymentStatus);

module.exports = router;
