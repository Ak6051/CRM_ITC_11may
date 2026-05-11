const express = require('express');
const { verifyToken } = require("../middleware/AddCandidates.middleware");
const { 
  addMultipleCandidates, 
} = require("../controllers/addCandidate.Controller");
const Job = require("../models/jobopennings.modal");
const Candidate = require("../models/candidateModal");
const { protect } = require('../middleware/Hr.data.middleware');
const {uploadToS3, upload } = require("../middleware/gcsMulter"); // multer config
const Reschedule = require("../models/reschedule.model");
const CandidateReminder = require('../models/candidate.reminder.model'); // Add this import at top

const router = express.Router();


// Add candidates
router.post("/candidate", verifyToken, upload.any(), addMultipleCandidates);

// Update single candidate

// Update multiple candidates
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
    // Only show Open jobs assigned to this HR
    const jobs = await Job.find({
      assignedHR: req.user._id,
      jobStatus: 'Open',
    }).sort({ createdAt: -1 });

    const jobsWithCount = await Promise.all(
      jobs.map(async (job) => {
        const CandidateApplication = require('../models/CandidateApplication.model');
        // Count only applications created by this HR for this job
        const count = await CandidateApplication.countDocuments({
          jobId:     job._id,
          createdBy: req.user._id,
        });
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
    if (!job) return res.status(404).json({ message: "Job not found" });

    const isAuthorized = job.assignedHR.some(hr =>
      hr && hr.toString() === req.user._id.toString()
    );
    if (!isAuthorized) return res.status(403).json({ message: "Unauthorized access" });

    // ── Fetch from CandidateApplication (single source of truth) ──────────────
    const CandidateApplication = require('../models/CandidateApplication.model');

    const applications = await CandidateApplication.find({
      jobId:     job._id,
      createdBy: req.user._id,   // only this HR's applications
    })
      .populate('candidateId')
      .populate('assignedBy', 'firstName lastName role')
      .lean();

    // Flatten: merge candidate profile + application tracking fields
    const candidateIds = applications.map(a => a.candidateId?._id).filter(Boolean);
    const reschedules  = await Reschedule.find({ candidateId: { $in: candidateIds } })
      .sort({ createdAt: -1 }).lean();

    let combinedList = [];

    for (const app of applications) {
      const candidate = app.candidateId;
      if (!candidate) continue;

      const originalDate = app.interviewDate || candidate.interviewDate || candidate.originalInterviewDate;

      combinedList.push({
        type: "candidate",
        // candidate profile fields
        ...candidate,
        // application tracking fields (CandidateApplication is source of truth)
        interviewDate:         app.interviewDate,
        originalInterviewDate: app.originalInterviewDate || originalDate,
        lineupStatus:          app.lineupStatus,
        selectionStatus:       app.selectionStatus,
        selectionDate:         app.selectionDate,
        salaryOffered:         app.salaryOffered,
        offerLetter:           app.offerLetter,
        offerStatus:           app.offerStatus,
        joiningDate:           app.joiningDate,
        candidateRemarks:      app.candidateRemarks,
        candidateAgreement:    app.candidateAgreement    || candidate.candidateAgreement,
        // new tracking fields
        internalInterviewDate: app.internalInterviewDate,
        interviewByWhom:       app.interviewByWhom,
        candidateReview:       app.candidateReview,
        candidateRemark:       app.candidateRemark,
        resumeSubmitDate:      app.resumeSubmitDate,
        remarks1:              app.remarks1,
        interviewRounds:       app.interviewRounds,
        interviewStatus:       app.interviewStatus,
        trailDays:             app.trailDays,
        remarks2:              app.remarks2,
        offeredSalary:         app.offeredSalary,
        offeredStatus:         app.offeredStatus,
        remarks3:              app.remarks3,
        joiningDateStatus:     app.joiningDateStatus,
        hasJoined:             app.hasJoined,
        // assignment info
        assignedBy:  app.assignedBy,
        assignedAt:  app.assignedAt,
        // application id for updates
        applicationId: app._id,
        rescheduleDate: null,
        reason: null,
        rescheduleCreatedAt: null,
        rescheduleId: null,
        isRescheduleEntry: false,
      });
    }

    // Add reschedule entries
    for (const reschedule of reschedules) {
      const entry = combinedList.find(c => c._id?.toString() === reschedule.candidateId?.toString());
      if (entry) {
        combinedList.push({
          ...entry,
          originalInterviewDate: entry.originalInterviewDate || entry.interviewDate,
          rescheduleDate:        reschedule.newDate,
          reason:                reschedule.reason,
          rescheduleCreatedAt:   reschedule.createdAt,
          rescheduleId:          reschedule._id,
          timestamp:             reschedule.timestamp,
          type:                  "reschedule",
          isRescheduleEntry:     true,
          uniqueEntryId:         `${entry._id?.toString()}_${reschedule._id.toString()}`,
        });
      }
    }

    combinedList.sort((a, b) => {
      if (a.type === "candidate" && b.type !== "candidate") return -1;
      if (a.type !== "candidate" && b.type === "candidate") return 1;
      if (a.type === "reschedule" && b.type === "reschedule")
        return new Date(b.rescheduleCreatedAt) - new Date(a.rescheduleCreatedAt);
      return 0;
    });

    res.status(200).json({ job, candidates: combinedList });
  } catch (err) {
    console.error("Error fetching candidates with reschedules:", err);
    res.status(500).json({ message: "Server Error" });
  }
});


const parseReminderDate = (remarks) => {
  const now = new Date();

  // 1. after X days
  const daysMatch = remarks.match(/after (\d+) days?/i);
  if (daysMatch) {
    const days = parseInt(daysMatch[1]);
    return new Date(now.getTime() + days * 24 * 60 * 60 * 1000);
  }

  // 2. after X hours
  const hoursMatch = remarks.match(/after (\d+) hours?/i);
  if (hoursMatch) {
    const hours = parseInt(hoursMatch[1]);
    return new Date(now.getTime() + hours * 60 * 60 * 1000);
  }

  // 3. on dd/mm/yyyy
  const ddmmyyyyMatch = remarks.match(/on (\d{1,2})\/(\d{1,2})\/(\d{4})/i);
  if (ddmmyyyyMatch) {
    const [_, day, month, year] = ddmmyyyyMatch;
    const parsed = new Date(`${year}-${month}-${day}`);
    if (!isNaN(parsed)) return parsed;
  }

  // 4. on dd Month yyyy
  const fullDateMatch = remarks.match(/on (\d{1,2}) (\w+) (\d{4})/i);
  if (fullDateMatch) {
    const [_, day, monthName, year] = fullDateMatch;
    const parsed = new Date(`${day} ${monthName} ${year}`);
    if (!isNaN(parsed)) return parsed;
  }

  // 5. on dd Month (assume current year)
  const shortDateMatch = remarks.match(/on (\d{1,2}) (\w+)/i);
  if (shortDateMatch) {
    const [_, day, monthName] = shortDateMatch;
    const parsed = new Date(`${day} ${monthName} ${now.getFullYear()}`);
    if (!isNaN(parsed)) return parsed;
  }

  // 6. after 5pm or 10 am
  const timeMatch = remarks.match(/after (\d{1,2})\s*(am|pm)/i);
  if (timeMatch) {
    const hour = parseInt(timeMatch[1]);
    const period = timeMatch[2].toLowerCase();
    const future = new Date(now);
    future.setHours(period === 'pm' ? hour + 12 : hour, 0, 0, 0);
    return future;
  }

  // 7. tomorrow
  if (remarks.toLowerCase().includes("tomorrow")) {
    const tomorrow = new Date(now);
    tomorrow.setDate(now.getDate() + 1);
    return tomorrow;
  }

  // 8. next week
  if (remarks.toLowerCase().includes("next week")) {
    const nextWeek = new Date(now);
    nextWeek.setDate(now.getDate() + 7);
    return nextWeek;
  }


  // 0. after X minutes
const minutesMatch = remarks.match(/after (\d+) minutes?/i);
if (minutesMatch) {
  const minutes = parseInt(minutesMatch[1]);
  return new Date(now.getTime() + minutes * 60 * 1000);
}

  // 9. on Monday, Tuesday, etc.
  const weekdays = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
  const weekdayMatch = remarks.toLowerCase().match(/on (\w+)/);
  if (weekdayMatch) {
    const targetDay = weekdayMatch[1].toLowerCase();
    const targetIndex = weekdays.indexOf(targetDay);
    if (targetIndex !== -1) {
      const currentIndex = now.getDay();
      let diff = targetIndex - currentIndex;
      if (diff <= 0) diff += 7; // next occurrence
      const targetDate = new Date(now);
      targetDate.setDate(now.getDate() + diff);
      return targetDate;
    }
  }

  return null; // No valid date found
};


router.put("/candidates/:candidateId", protect, upload.fields([{ name: 'offerLetter', maxCount: 1 }]), async (req, res) => {
  try {
    const { candidateId } = req.params;

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // ── Handle offer letter upload ──────────────────────────────────────────
    let offerLetterUrl = null;
    if (req.files?.offerLetter?.[0]) {
      const file = req.files.offerLetter[0];
      const filename = `offer_letters/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
      offerLetterUrl = await uploadToS3(file.buffer, filename, file.mimetype);
    }

    // ── Build update object for CandidateApplication ────────────────────────
    const {
      interviewDate, lineupStatus, selectionStatus, selectionDate,
      salaryOffered, offerStatus, joiningDate, candidateRemarks,
      internalInterviewDate, interviewByWhom, candidateReview, candidateRemark,
      resumeSubmitDate, remarks1, interviewRounds,
      interviewStatus, trailDays,
      remarks2, offeredSalary, offeredStatus, remarks3,
      joiningDateStatus, hasJoined,
    } = req.body;

    const updates = {};

    if (interviewDate    !== undefined) updates.interviewDate    = interviewDate    || null;
    if (lineupStatus     !== undefined) updates.lineupStatus     = lineupStatus;
    if (selectionStatus  !== undefined) updates.selectionStatus  = selectionStatus;
    if (selectionDate    !== undefined) updates.selectionDate    = selectionDate    || null;
    if (salaryOffered    !== undefined) updates.salaryOffered    = salaryOffered;
    if (offerLetterUrl)                 updates.offerLetter      = offerLetterUrl;
    if (offerStatus      !== undefined) updates.offerStatus      = offerStatus;
    if (joiningDate      !== undefined) updates.joiningDate      = joiningDate      || null;
    if (candidateRemarks !== undefined) updates.candidateRemarks = candidateRemarks;

    if (internalInterviewDate !== undefined) updates.internalInterviewDate = internalInterviewDate || null;
    if (interviewByWhom       !== undefined) updates.interviewByWhom       = interviewByWhom       || null;
    if (candidateReview       !== undefined) updates.candidateReview       = candidateReview;
    if (candidateRemark       !== undefined) updates.candidateRemark       = candidateRemark;
    if (resumeSubmitDate      !== undefined) updates.resumeSubmitDate      = resumeSubmitDate      || null;
    if (remarks1              !== undefined) updates.remarks1              = remarks1;
    if (interviewRounds       !== undefined) {
      try {
        updates.interviewRounds = typeof interviewRounds === 'string'
          ? JSON.parse(interviewRounds) : interviewRounds;
      } catch { /* ignore */ }
    }
    if (interviewStatus   !== undefined) updates.interviewStatus   = interviewStatus;
    if (trailDays         !== undefined) updates.trailDays         = trailDays !== '' ? Number(trailDays) : null;
    if (remarks2          !== undefined) updates.remarks2          = remarks2;
    if (offeredSalary     !== undefined) updates.offeredSalary     = offeredSalary;
    if (offeredStatus     !== undefined) updates.offeredStatus     = offeredStatus;
    if (remarks3          !== undefined) updates.remarks3          = remarks3;
    if (joiningDateStatus !== undefined) updates.joiningDateStatus = joiningDateStatus;
    if (hasJoined         !== undefined) updates.hasJoined         = hasJoined;

    // ── Update CandidateApplication (single source of truth) ───────────────
    const CandidateApplication = require('../models/CandidateApplication.model');
    // Prefer jobId from request body (when candidate is on multiple jobs),
    // fallback to candidate.jobId for backward compat
    const jobId = req.body.jobId || candidate.jobId;
    if (jobId) {
      await CandidateApplication.findOneAndUpdate(
        { candidateId, jobId },
        { $set: updates },
        { new: true, upsert: true }
      );
    }

    // ── Reminder logic ──────────────────────────────────────────────────────
    if (candidateRemarks && candidateRemarks.toLowerCase().includes('reminder:')) {
      const remindAt = parseReminderDate(candidateRemarks);
      if (remindAt) {
        const message = candidateRemarks.split('reminder:')[1].split('on')[0].trim();
        await CandidateReminder.deleteMany({ candidateId: candidate._id, user: req.user._id });
        const reminder = new CandidateReminder({
          user: req.user._id,
          candidateId: candidate._id,
          message,
          remindAt,
        });
        await reminder.save();
      }
    }

    res.status(200).json({ message: "Candidate updated successfully" });

  } catch (error) {
    console.error("Error updating candidate:", error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});





// router.put("/candidates/:candidateId", protect, async (req, res) => {
//   try {
//     const { candidateId } = req.params;
//     const { interviewDate, lineupStatus, selectionStatus, selectionDate, salaryOffered, offerStatus, joiningDate, candidateRemarks } = req.body;

//     const candidate = await Candidate.findById(candidateId);
//     if (!candidate) {
//       return res.status(404).json({ message: "Candidate not found" });
//     }

//     // Update only the allowed fields
//     if (interviewDate) candidate.interviewDate = interviewDate;
//     if (lineupStatus) candidate.lineupStatus = lineupStatus;
//     if (selectionStatus) candidate.selectionStatus = selectionStatus;
//     if (selectionDate) candidate.selectionDate = selectionDate;
//     if (salaryOffered) candidate.salaryOffered = salaryOffered;
//     if (offerStatus) candidate.offerStatus = offerStatus;
//     if (joiningDate) candidate.joiningDate = joiningDate;
//     if (candidateRemarks) candidate.candidateRemarks = candidateRemarks;

//     await candidate.save();
//     res.status(200).json({ message: "Candidate updated successfully", candidate });
//   } catch (error) {
//     console.error("Error updating candidate:", error);
//     res.status(500).json({ message: "Server Error", error: error.message });
//   }
// });

// controllers/reminderController.js


router.get("/candidate-reminders", protect, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Start of today

    const reminders = await Reminder.find({
      user: req.user._id,
      candidateId: { $ne: null },          // Only those with candidateId
      salesPanelId: null,                 // Make sure salesPanelId is null
      remindAt: { $gte: today },
      isShown: false
    })
      .populate('candidateId')            // Populate candidate details if needed
      .sort({ remindAt: 1 });

    res.status(200).json(reminders);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch candidate reminders', error: error.message });
  }
});





router.post("/candidates/:candidateId/reschedule", protect, async (req, res) => {
  try {
    const { candidateId } = req.params;
    const { newDate, reason, preserveOriginalDate, timestamp } = req.body;

    if (!newDate) {
      return res.status(400).json({ message: "New interview date is required" });
    }

    const candidate = await Candidate.findById(candidateId);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Store the original interview date if it's not already stored
    if (preserveOriginalDate && !candidate.originalInterviewDate && candidate.interviewDate) {
      // Only set originalInterviewDate if it doesn't exist yet
      candidate.originalInterviewDate = candidate.interviewDate;
      await candidate.save();
    }

    // Create a new reschedule record with timestamp to ensure uniqueness
    const newReschedule = await Reschedule.create({
      candidateId,
      newDate,
      reason,
      createdBy: req.user._id,
      timestamp: timestamp || new Date().toISOString() // Use provided timestamp or create a new one
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

// ── GET today's candidate count created by this HR for a specific job ─────────
// Query params: jobId (required)
// Returns: { count: Number }
router.get("/today-candidate-count", protect, async (req, res) => {
  try {
    const { jobId } = req.query;
    if (!jobId) return res.status(400).json({ message: "jobId is required" });

    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const CandidateApplication = require('../models/CandidateApplication.model');

    const count = await CandidateApplication.countDocuments({
      jobId,
      createdBy: req.user._id,
      createdAt: { $gte: startOfDay, $lte: endOfDay },
    });

    res.json({ count });
  } catch (err) {
    console.error("Error counting today's candidates:", err);
    res.status(500).json({ message: err.message });
  }
});


module.exports = router;
