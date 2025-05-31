const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { protect } = require('../middleware/Hr.data.middleware');
const {upload} = require("../middleware/gcsMulter"); // multer config
const salesPanel = require('../models/SalesPanel.model');
const Job = require("../models/convertOpening.model");
const Candidate = require("../models/convertSourceData.model");
const { verifyToken } = require("../middleware/AddCandidates.middleware");
const {
  createJobOpening,
  getMySales,
  updateJobOpening,
 saveConvertedJob,
 getConvertedJobs,
 getAssignedjob,
 addMultipleCandidates
} = require('../controllers/salePanel.controller');

router.get('/all-sales', protect, getMySales);
router.post('/create-sale',protect,upload.fields([ { name: 'agreementSigned', maxCount: 1 }, { name: 'descriptionFile', maxCount: 1 }]),createJobOpening);

router.put('/update-sale/:id',protect,upload.fields([{ name: 'agreementSigned', maxCount: 1 },{ name: 'descriptionFile', maxCount: 1 }]), updateJobOpening);
router.post('/sales-convert', protect , saveConvertedJob   )
router.get('/converted-jobs',protect, getConvertedJobs);
router.get('/assignsales', protect, getAssignedjob);
router.post("/candidate", upload.any() ,verifyToken, addMultipleCandidates);



router.get('/hr-users', protect,async (req, res) => {
    try {
        const hrUsers = await User.find({ role: 'HR' });
        res.json(hrUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching HR users', error });
    }
});


// router.post('/sales-import', protect, async (req, res) => {
//   try {
//     const jobs = req.body.jobs;
//     // Add createdBy field to each job
//     const jobsWithCreator = jobs.map(job => {
//       // console.log('Processing job:', job);
//       return {
//         ...job,
//         createdBy: req.user._id
//       };
//     });
//     const inserted = await salesPanel.insertMany(jobsWithCreator);
//     res.status(201).json(inserted);
//   } catch (err) {
//     console.error('Error details:', err);
//     res.status(500).json({ error: 'Something went wrong.' });
//   }
// });

router.get("/jobs", protect, async (req, res) => {
    try {
      // Only show jobs assigned to this HR
      const jobs = await Job.find({ assignedHR: req.user._id });
  
      const jobsWithCount = await Promise.all(
        jobs.map(async (job) => {
          const count = await Candidate.countDocuments({ jobId: job._id });
          return { ...job.toObject(), candidateCount: count };
        })
      );
  
      res.status(200).json(jobsWithCount);
    } catch (error) {
      console.error("Error fetching jobs with count:", error);
      res.status(500).json({ message: "Failed to fetch jobs", error: error.message });
    }
  });
  
  
router.get("/jobs/:jobId/candidates", protect, async (req, res) => {
    try {
      const job = await Job.findById(req.params.jobId);
  
      if (!job) {
        return res.status(404).json({ message: "Job not found" });
      }
  
      // Ensure assignedHR exists before accessing it
      if (!job.assignedHR || job.assignedHR.toString() !== req.user._id.toString()) {
        return res.status(403).json({ message: "Unauthorized access" });
      }
  
      const candidates = await Candidate.find({ jobId: job._id });
    res.status(200).json({ job, candidates });  // Return both job and candidates
    } catch (err) {
      console.error("Error fetching candidates:", err);
      res.status(500).json({ message: "Server Error" });
    }
  });
  
// Add new PUT endpoint for updating candidate details
router.put("/candidates/:candidateId", protect, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { interviewDate, lineupStatus, joiningDate, candidateRemarks } = req.body;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Update only the allowed fields
    if (interviewDate) candidate.interviewDate = interviewDate;
    if (lineupStatus) candidate.lineupStatus = lineupStatus;
    if (joiningDate) candidate.joiningDate = joiningDate;
    if (candidateRemarks) candidate.candidateRemarks = candidateRemarks;

    await candidate.save();
    res.status(200).json({ message: "Candidate updated successfully", candidate });
  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});






module.exports = router;
