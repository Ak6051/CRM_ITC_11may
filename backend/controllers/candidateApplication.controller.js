const CandidateApplication = require('../models/CandidateApplication.model');
const Candidate            = require('../models/candidateModal');
const JobOpenings          = require('../models/jobopennings.modal');
const User                 = require('../models/User');

/**
 * POST /api/applications/assign
 * Assign one or more candidates to a job position.
 * Body: { candidateIds: [...], jobId: "..." }
 */
const assignCandidates = async (req, res) => {
  try {
    const { candidateIds, jobId } = req.body;

    if (!Array.isArray(candidateIds) || candidateIds.length === 0) {
      return res.status(400).json({ message: 'candidateIds array is required' });
    }
    if (!jobId) {
      return res.status(400).json({ message: 'jobId is required' });
    }

    // Verify job exists
    const job = await JobOpenings.findById(jobId).lean();
    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    const results = {
      assigned: [],
      alreadyAssigned: [],
      notFound: [],
    };

    for (const candidateId of candidateIds) {
      // Check candidate exists
      const candidate = await Candidate.findById(candidateId).lean();
      if (!candidate) {
        results.notFound.push(candidateId);
        continue;
      }

      // Check if already assigned to this job
      const existing = await CandidateApplication.findOne({ candidateId, jobId });
      if (existing) {
        // If assigned by someone else, transfer ownership to the current HR
        if (existing.createdBy.toString() !== req.user._id.toString()) {
          existing.createdBy = req.user._id;
          existing.createdByName = `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim();
          existing.assignedBy = req.user._id;
          existing.assignedAt = new Date();
          await existing.save();

          // ── Update candidateModal so new HR's list shows this candidate ──
          await Candidate.findByIdAndUpdate(candidateId, {
            $set: {
              jobId,
              createdBy:        req.user._id,
              assignedTo:       req.user._id,
              assignedPosition: jobId,
              assignedBy:       req.user._id,
              assignedAt:       new Date(),
            },
          });
          results.assigned.push(candidateId);
        } else {
          // Already assigned by the same HR
          results.alreadyAssigned.push(candidateId);
        }
        continue;
      }

      // Create application record
      const app = new CandidateApplication({
        candidateId,
        jobId,
        positionName:  job.jobTitle || '',
        createdBy:     req.user._id,
        createdByName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
        assignedBy:    req.user._id,
        assignedAt:    new Date(),
        paymentStatus: 'Pending',
      });
      await app.save();

      // ── Also update candidateModal so HR's JobListWithCandidates shows this candidate ──
      await Candidate.findByIdAndUpdate(candidateId, {
        $set: {
          jobId,
          createdBy:        req.user._id,
          assignedTo:       req.user._id,
          assignedPosition: jobId,
          assignedBy:       req.user._id,
          assignedAt:       new Date(),
        },
      });

      results.assigned.push(candidateId);
    }

    return res.status(201).json({
      message: `Assigned ${results.assigned.length} candidate(s)`,
      ...results,
    });
  } catch (error) {
    console.error('assignCandidates error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/applications/candidate/:candidateId
 * Get all job applications for a specific candidate (full history).
 */
const getApplicationsByCandidate = async (req, res) => {
  try {
    const { candidateId } = req.params;

    const applications = await CandidateApplication.find({ candidateId })
      .populate('jobId', 'companyName jobTitle jobLocation jobTiming companyAddress phoneNumber')
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Also get candidate profile
    const candidate = await Candidate.findById(candidateId)
      .populate('createdBy', 'firstName lastName')
      .lean();

    if (!candidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.status(200).json({
      candidate: {
        ...candidate,
        name:        candidate.candidateName  || '',
        phoneNumber: candidate.candidatePhone || '',
        email:       candidate.candidateEmail || '',
        resumeLink:  candidate.resumeLink     || '',
      },
      applications,
      totalApplications: applications.length,
    });
  } catch (error) {
    console.error('getApplicationsByCandidate error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/applications/job/:jobId
 * Get all candidates assigned to a specific job.
 */
const getApplicationsByJob = async (req, res) => {
  try {
    const { jobId } = req.params;

    const applications = await CandidateApplication.find({ jobId })
      .populate({
        path: 'candidateId',
        select: 'candidateName candidatePhone candidateEmail resumeLink experience currentCTC positionName currentLocation',
      })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    // Normalize field names for frontend
    const data = applications.map((app) => {
      const appObj = app.toObject();
      if (appObj.candidateId) {
        appObj.candidateId.name        = appObj.candidateId.candidateName  || '';
        appObj.candidateId.phoneNumber = appObj.candidateId.candidatePhone || '';
        appObj.candidateId.email       = appObj.candidateId.candidateEmail || '';
      }
      return appObj;
    });

    res.status(200).json({ data, total: data.length });
  } catch (error) {
    console.error('getApplicationsByJob error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * PUT /api/applications/:applicationId
 * Update an application record (interview date, lineup status, billing, etc.)
 */
const updateApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;
    const updates = { ...req.body };

    const updated = await CandidateApplication.findByIdAndUpdate(
      applicationId,
      { $set: updates },
      { new: true, runValidators: true }
    )
      .populate('jobId', 'companyName jobTitle jobLocation')
      .populate('candidateId', 'candidateName candidatePhone candidateEmail resumeLink');

    if (!updated) {
      return res.status(404).json({ message: 'Application not found' });
    }

    res.status(200).json(updated);
  } catch (error) {
    console.error('updateApplication error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * DELETE /api/applications/:applicationId
 * Remove a candidate from a job assignment.
 * Only the HR who assigned the candidate can remove them.
 */
const deleteApplication = async (req, res) => {
  try {
    const { applicationId } = req.params;

    const application = await CandidateApplication.findById(applicationId);
    if (!application) {
      return res.status(404).json({ message: 'Application not found' });
    }

    // Only the HR who assigned this candidate (or admin) can remove
    const requesterId = req.user._id.toString();
    const assignedById = application.assignedBy?.toString() || application.createdBy?.toString();
    const isAdmin = req.user.role === 'admin';

    if (!isAdmin && requesterId !== assignedById) {
      return res.status(403).json({ message: 'You can only remove candidates that you assigned.' });
    }

    await CandidateApplication.findByIdAndDelete(applicationId);

    res.status(200).json({ message: 'Candidate removed from this position successfully.' });
  } catch (error) {
    console.error('deleteApplication error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  assignCandidates,
  getApplicationsByCandidate,
  getApplicationsByJob,
  updateApplication,
  deleteApplication,
};
