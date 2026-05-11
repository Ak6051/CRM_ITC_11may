const express = require('express');
const router = express.Router();

const User = require('../models/User');
const { protect } = require('../middleware/Hr.data.middleware');
const {upload} = require("../middleware/gcsMulter"); // multer config
const salesPanel = require('../models/SalesPanel.model');
const Job = require("../models/convertOpening.model");
const Candidate = require("../models/convertSourceData.model");
const Company = require("../models/company.model");
const { verifyToken } = require("../middleware/AddCandidates.middleware");
const {
  createJobOpening,
  getMySales,
  updateJobOpening,
  saveConvertedJob,
  getConvertedJobs,
  getAssignedjob,
  addMultipleCandidates,
  createReschedule,
  getTodaysAndUpcomingReminders,
  deleteJobOpening,
  getLeadsBySalesId
} = require('../controllers/salePanel.controller');

router.get('/all-sales', protect, getMySales);
router.post('/create-sale',protect,upload.fields([ { name: 'agreementSigned', maxCount: 1 }, { name: 'descriptionFile', maxCount: 1 }]),createJobOpening);

router.put('/update-sale/:id',protect,upload.fields([{ name: 'agreementSigned', maxCount: 1 },{ name: 'descriptionFile', maxCount: 1 }]), updateJobOpening);
router.post('/sales-convert', protect , saveConvertedJob   )
router.get('/converted-jobs',protect, getConvertedJobs);
router.get('/assignsales', protect, getAssignedjob);
router.post("/candidate", upload.any() ,verifyToken, addMultipleCandidates);
router.post('/reschedule', protect, createReschedule);
router.get('/reminders', protect, getTodaysAndUpcomingReminders);
router.delete('/delete-sale/:id', protect, deleteJobOpening);
router.get('/leads/:id', protect, getLeadsBySalesId);

router.get('/hr-users', protect,async (req, res) => {
    try {
        const hrUsers = await User.find({ role: 'HR' });
        res.json(hrUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching HR users', error });
    }
});

router.get('/sales-users', protect,async (req, res) => {
    try {
        const salesUsers = await User.find({ role: 'Sales' });
        res.json(salesUsers);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching Sales users', error });
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


router.post('/sales-import', protect, async (req, res) => {
  try {
    const jobs = req.body.jobs;

    // Get the current max companyId
    const lastCompany = await Company.findOne().sort({ companyId: -1 });
    let currentCompanyId = lastCompany ? lastCompany.companyId + 1 : 10001;

    const companyMap = {}; // to avoid duplicate inserts within this batch

    const jobsWithCompanyId = await Promise.all(jobs.map(async (job) => {
      const companyName = job.companyName?.trim();

      if (!companyName) throw new Error("Missing companyName in job entry.");

      let company = await Company.findOne({ companyName });

      if (!company && !companyMap[companyName]) {
        // Create a new company with a unique companyId
        company = new Company({
          companyName,
          companyId: currentCompanyId++
        });
        await company.save();
        companyMap[companyName] = company.companyId;
      }

      return {
        ...job,
        companyId: company ? company.companyId : companyMap[companyName],
        createdBy: req.user._id
      };
    }));

    // const inserted = await salesPanel.insertMany(jobsWithCompanyId);
    const inserted = await salesPanel.insertMany(jobsWithCompanyId, { ordered: false });
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.', details: err.message });
  }
});


// router.get("/jobs", protect, async (req, res) => {
//     try {
//       // Only show jobs assigned to this HR
//       const jobs = await Job.find({ assignedHR: req.user._id });
  
//       const jobsWithCount = await Promise.all(
//         jobs.map(async (job) => {
//           const count = await Candidate.countDocuments({ jobId: job._id });
//           return { ...job.toObject(), candidateCount: count };
//         })
//       );
  
//       res.status(200).json(jobsWithCount);
//     } catch (error) {
//       console.error("Error fetching jobs with count:", error);
//       res.status(500).json({ message: "Failed to fetch jobs", error: error.message });
//     }
//   });
  
  
// router.get("/jobs/:jobId/candidates", protect, async (req, res) => {
//     try {
//       const job = await Job.findById(req.params.jobId);
  
//       if (!job) {
//         return res.status(404).json({ message: "Job not found" });
//       }
  
//       // Ensure assignedHR exists before accessing it
//       if (!job.assignedHR || job.assignedHR.toString() !== req.user._id.toString()) {
//         return res.status(403).json({ message: "Unauthorized access" });
//       }
  
//       const candidates = await Candidate.find({ jobId: job._id });
//     res.status(200).json({ job, candidates });  // Return both job and candidates
//     } catch (err) {
//       console.error("Error fetching candidates:", err);
//       res.status(500).json({ message: "Server Error" });
//     }
//   });
  
// // Add new PUT endpoint for updating candidate details
// router.put("/candidates/:candidateId", protect, async (req, res) => {
//   try {
//     const { candidateId } = req.params;
//     const { interviewDate, lineupStatus, joiningDate, candidateRemarks } = req.body;

//     const candidate = await Candidate.findById(candidateId);
//     if (!candidate) {
//       return res.status(404).json({ message: "Candidate not found" });
//     }

//     // Update only the allowed fields
//     if (interviewDate) candidate.interviewDate = interviewDate;
//     if (lineupStatus) candidate.lineupStatus = lineupStatus;
//     if (joiningDate) candidate.joiningDate = joiningDate;
//     if (candidateRemarks) candidate.candidateRemarks = candidateRemarks;

//     await candidate.save();
//     res.status(200).json({ message: "Candidate updated successfully", candidate });
//   } catch (error) {
//     console.error("Error updating candidate:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// });






module.exports = router;
