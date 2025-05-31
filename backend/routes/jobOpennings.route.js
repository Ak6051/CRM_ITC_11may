
const express = require('express');
const { createjobopenning } = require ('../controllers/jobopennings.Controllers');
const { protect } = require('../middleware/Hr.data.middleware');

const router = express.Router();

router.post('/job', protect,createjobopenning);

module.exports = router;
