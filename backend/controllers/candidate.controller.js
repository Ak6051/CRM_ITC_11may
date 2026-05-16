const Candidate = require("../models/candidateModal");
const CandidateApplication = require("../models/CandidateApplication.model");
const User = require("../models/User");
const CompanyCreate = require("../models/companycreate.model");
const { uploadToS3 } = require("../middleware/gcsMulter");



// Get all candidates for HR Report (admin only)
// Source: CandidateApplication model — selectionStatus Accepted/Yes + selectionDate set
const getAllCandidates = async (req, res) => {
  try {
    const { createdByName, startDate, endDate } = req.query;

    // ── Base filter ───────────────────────────────────────────────────────
    const filter = {
      selectionStatus: { $in: ['Accepted', 'Yes'] },
      selectionDate: { $exists: true, $ne: null },
    };

    // ── Filter by HR name (createdBy) ─────────────────────────────────────
    if (createdByName) {
      const regex = new RegExp(createdByName, 'i');
      const users = await User.find({
        $or: [{ firstName: regex }, { lastName: regex }],
      }).select('_id');
      filter.createdBy = { $in: users.map(u => u._id) };
    }

    // ── Filter by selectionDate range ─────────────────────────────────────
    if (startDate || endDate) {
      filter.selectionDate = { $exists: true, $ne: null };
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.selectionDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.selectionDate.$lte = end;
      }
    }

    // ── Fetch from CandidateApplication ───────────────────────────────────
    const applications = await CandidateApplication.find(filter)
      .populate({
        path: 'candidateId',
        model: 'Candidate',
        select: 'candidateName candidateEmail candidatePhone qualification positionName experience currentLocation currentPosition currentCTC expectedCTC noticePeriod reasonforLeaving currentCompany remark resumeLink candidateAgreement isBackout backoutReason backoutAt',
      })
      .populate({
        path: 'jobId',
        model: 'JobOpenings',
        select: 'companyName companyId companyAddress phoneNumber jobTitle jobLocation jobTiming industries Area contactName email websiteURL agreementSigned gstUpload education experience salary gender weekOff numberOfRequirements requiredSkills keyResponsibility benefits remarks',
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: 'firstName lastName role',
      })
      .sort({ createdAt: -1 });

    // ── Collect unique companyIds to fetch full company details ───────────
    const companyIds = [...new Set(
      applications
        .map(app => app.jobId?.companyId)
        .filter(Boolean)
    )];
    const companies = await CompanyCreate.find(
      { companyId: { $in: companyIds } },
      'companyId companyName industries companyAddress area city state country pincode contactPerson contactPersonDesignation contactNumber email contactPerson2 contactPerson2Designation contactNumber2 email2 websiteUrl gpsLocation gstUpload agreementUpload agreementStartDate agreementEndDate otherDocumentUpload invoiceNumber paymentMode paymentRemark tokenAmount'
    ).lean();
    const companyMap = {};
    companies.forEach(c => { companyMap[c.companyId] = c; });

    // ── Flatten: merge candidate profile + application tracking fields ─────
    const result = applications.map(app => {
      const c = app.candidateId || {};
      const obj = app.toObject();
      const fullCompany = obj.jobId?.companyId ? (companyMap[obj.jobId.companyId] || null) : null;
      return {
        _id: app._id,
        // candidate profile
        candidateName: c.candidateName || '',
        candidateEmail: c.candidateEmail || '',
        candidatePhone: c.candidatePhone || '',
        qualification: c.qualification || '',
        positionName: obj.positionName || c.positionName || '',
        experience: c.experience || '',
        currentLocation: c.currentLocation || '',
        currentPosition: c.currentPosition || '',
        currentCTC: c.currentCTC || '',
        expectedCTC: c.expectedCTC || '',
        noticePeriod: c.noticePeriod || '',
        reasonforLeaving: c.reasonforLeaving || '',
        currentCompany: c.currentCompany || '',
        remark: c.remark || '',
        resumeLink: c.resumeLink || '',
        isBackout: c.isBackout || false,
        backoutReason: c.backoutReason || '',
        backoutAt: c.backoutAt || null,
        // job info
        jobId: obj.jobId,
        // full company details from CompanyCreate
        companyDetails: fullCompany,
        // HR who owns this application
        createdBy: obj.createdBy,
        // application tracking fields (from CandidateApplication)
        interviewDate: obj.interviewDate,
        selectionStatus: obj.selectionStatus,
        selectionDate: obj.selectionDate,
        salaryOffered: obj.salaryOffered || obj.offeredSalary || '',
        offerStatus: obj.offerStatus || obj.offeredStatus || '',
        joiningDate: obj.joiningDate,
        hasJoined: obj.hasJoined || '',
        candidateRemarks: obj.candidateRemarks || obj.candidateRemark || '',
        lineupStatus: obj.lineupStatus || '',
        // billing
        billingDate: obj.billingDate,
        billingAmount: obj.billingAmount || '',
        paymentStatus: obj.paymentStatus || 'Pending',
        paymentDate: obj.paymentDate,
        paymentMode: obj.paymentMode || '',
        paymentRemark: obj.paymentRemark || '',
        // timestamps
        createdAt: obj.createdAt,
        updatedAt: obj.updatedAt,
      };
    });

    res.status(200).json(result);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
    });
  }
};



const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if candidate exists
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Delete the candidate
    await Candidate.findByIdAndDelete(id);

    res.status(200).json({
      message: "Candidate deleted successfully",
      deletedCandidate: candidate
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message
    });
  }
};

const markCandidateAsBackout = async (req, res) => {
  try {
    const { id } = req.params;
    const { backoutReason } = req.body;

    if (!backoutReason || backoutReason.trim() === '') {
      return res.status(400).json({
        success: false,
        message: 'Backout reason is required'
      });
    }

    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({
        success: false,
        message: 'Candidate not found'
      });
    }

    // Update candidate with backout information
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      {
        isBackout: true,
        backoutReason: backoutReason.trim(),
        backoutAt: new Date()
      },
      { new: true }
    )
      .populate({
        path: 'jobId',
        model: 'JobOpenings',
        select: 'companyName companyAddress phoneNumber jobTitle jobLocation jobTiming',
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: 'firstName lastName role',
      });

    res.status(200).json({
      success: true,
      message: 'Candidate marked as backout successfully',
      candidate: updatedCandidate
    });
  } catch (error) {
    console.error('Error marking candidate as backout:', error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
      error: error.message
    });
  }
};


const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    // Find the candidate first to check permissions
    const candidate = await Candidate.findById(id);

    if (!candidate) {
      return res.status(404).json({ success: false, message: 'Candidate not found' });
    }

    // Check permissions
    const isAdmin = req.user.role === 'admin' || req.user.role === 'teamleader';
    const isOwner = candidate.createdBy.toString() === req.user._id.toString();

    if (!isAdmin && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this candidate'
      });
    }

    // Handle resume file upload if present
    if (req.files && req.files['resume']) {
      const file = req.files['resume'][0];
      const cleanedOriginalName = file.originalname.replace(/\s+/g, "_");
      const uniqueName = `${Date.now()}-${cleanedOriginalName}`;
      try {
        updates.resumeLink = await uploadToS3(file.buffer, uniqueName, file.mimetype);
      } catch (err) {
        console.error(`❌ S3 upload failed for resume: ${err.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload resume'
        });
      }
    }

    // Handle candidate agreement file upload if present
    if (req.files && req.files['candidateAgreement']) {
      const file = req.files['candidateAgreement'][0];
      const cleanedOriginalName = file.originalname.replace(/\s+/g, "_");
      const uniqueName = `agreement-${Date.now()}-${cleanedOriginalName}`;
      try {
        updates.candidateAgreement = await uploadToS3(file.buffer, uniqueName, file.mimetype);
      } catch (err) {
        console.error(`❌ S3 upload failed for agreement: ${err.message}`);
        return res.status(500).json({
          success: false,
          message: 'Failed to upload candidate agreement'
        });
      }
    }

    // Update candidate
    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      { $set: updates },
      { new: true, runValidators: true }
    );

    // Add the type field to match the frontend expectations
    const candidateWithType = {
      type: "candidate",
      ...updatedCandidate.toObject(),
      rescheduleDate: null,
      reason: null,
      rescheduleCreatedAt: null,
      rescheduleId: null,
      isRescheduleEntry: false
    };

    res.status(200).json({
      success: true,
      data: candidateWithType
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Failed to update candidate',
      error: error.message,
    });
  }
};

// Get candidates for logged-in HR (only their own lineups)
const getHRCandidates = async (req, res) => {
  try {
    const userId = req.user._id;
    // Tenure filter — only show data created during current tenure
    const tenureFilter = req.user.tenureStartedAt
      ? { createdAt: { $gte: new Date(req.user.tenureStartedAt) } }
      : {};

    const filter = {
      createdBy: userId,
      lineupStatus: "Completed",
      ...tenureFilter,
    };

    const candidates = await Candidate.find(filter)
      .populate({
        path: 'jobId',
        model: 'JobOpenings',
        select: 'companyName companyAddress phoneNumber jobTitle jobLocation jobTiming',
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: 'firstName lastName email',
      })
      .sort({ createdAt: -1 });

    res.status(200).json(candidates);
  } catch (error) {
    console.error('Error fetching HR candidates:', error);
    res.status(500).json({ message: 'Error fetching candidates', error: error.message });
  }
};


module.exports = {
  getAllCandidates,
  getHRCandidates,
  deleteCandidate,
  markCandidateAsBackout,
  updateCandidate
};
