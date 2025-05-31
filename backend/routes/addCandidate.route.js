const express = require('express');
const { verifyToken } = require("../middleware/AddCandidates.middleware");
const { addMultipleCandidates } = require("../controllers/addCandidate.Controller");
const Job = require("../models/jobopennings.modal");
const Candidate = require("../models/candidateModal");
const { protect } = require('../middleware/Hr.data.middleware');
const { upload }= require("../middleware/gcsMulter"); // multer config
const Reschedule = require("../models/reschedule.model");

const router = express.Router();


router.post("/candidate", verifyToken,upload.any(), addMultipleCandidates);
router.post("/create", protect, async (req, res) => {
    try {
      const {
        companyName,
        companyAddress,
        contactName,
        email,
        phoneNumber,
        jobTitle,
        numberOfRequirements,
        keyResponsibility,
        requiredSkills,
        education,
        experience,
        salary,
        jobLocation,
        description
      } = req.body;
  
      const newJob = new JobOpenings({
        companyName,
        companyAddress,
        contactName,
        email,
        phoneNumber,
        jobTitle,
        numberOfRequirements,
        keyResponsibility,
        requiredSkills,
        education,
        experience,
        salary,
        jobLocation,
        description,
        createdBy: req.user._id  // Save who created the job (HR / Admin / Sales)
        // assignedHR will be added manually by admin later
      });
  
      await newJob.save();
      res.status(201).json({ message: "Job posted successfully", job: newJob });
    } catch (err) {
      console.error("Job creation error:", err);
      res.status(500).json({ message: "Server Error", error: err.message });
    }
  });
  

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
  
// Add new PUT endpoint for updating candidate details

router.get("/jobs/:jobId/candidates", protect, async (req, res) => {
  try {
    const job = await Job.findById(req.params.jobId);

    if (!job) {
      return res.status(404).json({ message: "Job not found" });
    }

    if (!job.assignedHR || job.assignedHR.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized access" });
    }

    // Get all candidates for the job
    const candidates = await Candidate.find({ jobId: job._id }).lean();

    // Get all reschedules for these candidates
    const candidateIds = candidates.map((c) => c._id);
    const reschedules = await Reschedule.find({ candidateId: { $in: candidateIds } })
      .sort({ createdAt: 1 }) // old to new for chronological order
      .lean();

    // Prepare combined list
    let combinedList = [];

    // First, add all candidates as separate entries (original candidate data)
    // First, add all candidates as separate entries (original candidate data)
// First, add all candidates as original entry
for (const candidate of candidates) {
  combinedList.push({
    type: "candidate", // original interview
    ...candidate,
    originalInterviewDate: candidate.interviewDate,
    rescheduleDate: null,
    reason: null,
    rescheduleCreatedAt: null
  });
}

// Add separate row for each reschedule
for (const reschedule of reschedules) {
  const candidate = candidates.find(c => c._id.toString() === reschedule.candidateId.toString());
  if (candidate) {
    combinedList.push({
      type: "reschedule", // reschedule entry
      ...candidate,
      originalInterviewDate: candidate.interviewDate,
      rescheduleDate: reschedule.newDate,
      reason: reschedule.reason,
      rescheduleCreatedAt: reschedule.createdAt,
    });
  }
}


    // Sort combined list by date (candidate date or reschedule date) if you want
    combinedList.sort((a, b) => new Date(a.rescheduleDate) - new Date(b.rescheduleDate));

    res.status(200).json({ job, candidates: combinedList });
  } catch (err) {
    console.error("Error fetching candidates with reschedules:", err);
    res.status(500).json({ message: "Server Error" });
  }
});

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

// Add new POST endpoint for rescheduling interview
// router.post("/candidates/:candidateId/reschedule", protect, async (req, res) => {
//   try {
//     const { candidateId } = req.params;
//     const { newDate, reason } = req.body;

//     if (!newDate) {
//       return res.status(400).json({ message: "New interview date is required" });
//     }

//     const candidate = await Candidate.findById(candidateId);
//     if (!candidate) {
//       return res.status(404).json({ message: "Candidate not found" });
//     }

//     // Check if this exact date and reason combination already exists
//     const isDuplicate = candidate.rescheduledDates.some(
//       (reschedule) => 
//         new Date(reschedule.date).getTime() === new Date(newDate).getTime() &&
//         reschedule.reason === reason
//     );

//     if (isDuplicate) {
//       return res.status(400).json({ 
//         message: "This reschedule date and reason combination already exists" 
//       });
//     }

//     // Add new rescheduled date to the array
//     candidate.rescheduledDates.push({
//       date: newDate,
//       reason: reason || ""
//     });

//     // Update the main interview date
//     candidate.interviewDate = newDate;

//     await candidate.save();
//     res.status(200).json({ 
//       message: "Interview rescheduled successfully", 
//       candidate,
//       rescheduledDates: candidate.rescheduledDates 
//     });
//   } catch (error) {
//     console.error("Error rescheduling interview:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// });

router.post("/candidates/:candidateId/reschedule", protect, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { newDate, reason } = req.body;

    if (!newDate) {
      return res.status(400).json({ message: "New interview date is required" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // ✅ Just create reschedule record — do NOT update candidate.interviewDate
    const newReschedule = await Reschedule.create({
      candidateId,
      newDate,
      reason,
      createdBy: req.user._id,
    });

    res.status(200).json({
      message: "Interview rescheduled successfully",
      reschedule: newReschedule,
      candidate,
    });
  } catch (error) {
    console.error("Error in rescheduling:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});



module.exports = router;
