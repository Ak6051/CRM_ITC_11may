const express = require('express');
const { forwardCVs,getForwardedCVs } = require('../controllers/forwardcv.Controllers');

const router = express.Router();

// Forward Selected CVs
router.post('/forward', forwardCVs);
router.get('/fetch-forwarded-cvs', getForwardedCVs);


module.exports = router;
