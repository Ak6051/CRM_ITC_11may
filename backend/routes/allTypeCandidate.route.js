
const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/Hr.data.middleware');
const {
    createCandidates,
    getMyCandidate,
    updateCandidate,
    deleteCandidate
} = require('../controllers/AllTypeCandidate.controller');
const JobOpenings = require('../models/jobopennings.modal');
const {upload} = require("../middleware/gcsMulter"); // multer config


router.post('/create-all', protect, upload.single('resumeUpload'), createCandidates);
router.get('/all-candidates', protect, getMyCandidate);                // Admin: All Jobs
router.put('/update/:id', protect, upload.single('resumeUpload'), updateCandidate);
router.delete('/delete/:id', protect, deleteCandidate);


            
module.exports = router;