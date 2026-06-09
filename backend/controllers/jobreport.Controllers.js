const JobOpenings = require('../models/jobopennings.modal');
const CandidateApplication = require('../models/CandidateApplication.model');
const Candidate = require('../models/candidateModal');

// Get all sales
const getAllSales = async (req, res) => {
  try {
    const salesData = await JobOpenings.find()
      .populate('assignedHR', 'firstName lastName') // yeh User model se data uthayega
      .sort({ date: -1 });

    const formattedSales = salesData.map((sale) => {
      const saleObj = sale.toObject();
      if (saleObj.assignedHR) {
        saleObj.hrName = `${saleObj.assignedHR.firstName} ${saleObj.assignedHR.lastName}`;
      } else {
        saleObj.hrName = null;
      }
      return saleObj;
    });

    res.status(200).json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales data:', error.message);
    res.status(500).json({ message: 'Server Error while fetching sales data' });
  }
};





// Create a new sale
const createSale = async (req, res) => {
  const sale = new JobOpenings(req.body);
  try {
    const newSale = await sale.save();
    res.status(201).json(newSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Update a sale
const updateSale = async (req, res) => {
  try {
    const updatedSale = await JobOpenings.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json(updatedSale);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// Delete a sale
const deleteSale = async (req, res) => {
  try {
    await JobOpenings.findByIdAndDelete(req.params.id);
    res.json({ message: 'Sale deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

/**
 * GET /api/jobreport/fulfilled
 * Admin ko dikhata hai: kaunsi positions fulfill hokar close hui hain
 * aur kaun se candidates ne un positions ko fill kiya
 */
const getFulfilledPositions = async (req, res) => {
  try {
    // Sirf 'Closed' jobs fetch karo
    const closedJobs = await JobOpenings.find({ jobStatus: 'Closed' })
      .populate('assignedHR', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .sort({ updatedAt: -1 })
      .lean();

    const result = [];

    for (const job of closedJobs) {
      // Is job ke liye jo candidates joined hain unhe fetch karo
      const applications = await CandidateApplication.find({ jobId: job._id })
        .populate('candidateId', 'candidateName candidatePhone candidateEmail currentCTC')
        .populate('createdBy', 'firstName lastName')
        .lean();

      // Sirf joined candidates count karo
      const joinedCandidates = applications.filter(
        (app) => app.hasJoined === 'Yes' || app.joiningDate != null
      );

      const totalRequired = job.numberOfRequirements || 0;
      const totalJoined   = joinedCandidates.length;
      const isFulfilled   = totalRequired > 0 && totalJoined >= totalRequired;

      result.push({
        // ── Job details ──────────────────────────────────────────────────────
        jobId:              job._id,
        companyName:        job.companyName,
        jobTitle:           job.jobTitle,
        jobLocation:        job.jobLocation,
        numberOfRequirements: totalRequired,
        jobStatus:          job.jobStatus,
        closedAt:           job.updatedAt,         // last update = close date
        completionDate:     job.completionDate || null,

        // ── HR assigned ──────────────────────────────────────────────────────
        assignedHR: Array.isArray(job.assignedHR)
          ? job.assignedHR.map((hr) => `${hr.firstName} ${hr.lastName}`)
          : [],
        createdBy: job.createdBy
          ? `${job.createdBy.firstName} ${job.createdBy.lastName}`
          : null,

        // ── Fulfillment summary ──────────────────────────────────────────────
        totalJoined,
        isFulfilled,
        fulfillmentNote: isFulfilled
          ? `Position fulfilled: ${totalJoined}/${totalRequired} candidates joined`
          : `Partially filled: ${totalJoined}/${totalRequired} candidates joined`,

        // ── Candidates who joined ────────────────────────────────────────────
        joinedCandidates: joinedCandidates.map((app) => ({
          applicationId:  app._id,
          candidateName:  app.candidateId?.candidateName  || '',
          candidatePhone: app.candidateId?.candidatePhone || '',
          candidateEmail: app.candidateId?.candidateEmail || '',
          currentCTC:     app.candidateId?.currentCTC     || null,
          offeredSalary:  app.offeredSalary               || '',
          joiningDate:    app.joiningDate                 || null,
          hasJoined:      app.hasJoined                   || '',
          assignedHR:     app.createdBy
            ? `${app.createdBy.firstName} ${app.createdBy.lastName}`
            : '',
        })),

        // ── All candidates summary (for admin visibility) ────────────────────
        totalApplied:  applications.length,
        selectedCount: applications.filter((a) => a.interviewStatus === 'Selected').length,
        rejectedCount: applications.filter((a) => a.interviewStatus === 'Rejected').length,
      });
    }

    // Pehle fulfilled positions dikhao, phir partial
    result.sort((a, b) => b.isFulfilled - a.isFulfilled);

    return res.status(200).json({
      total: result.length,
      fulfilledCount:  result.filter((r) => r.isFulfilled).length,
      partialCount:    result.filter((r) => !r.isFulfilled).length,
      data: result,
    });
  } catch (error) {
    console.error('getFulfilledPositions error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * GET /api/jobreport/fulfilled/:jobId
 * Ek specific closed position ki complete candidate fulfillment detail
 */
const getFulfilledPositionById = async (req, res) => {
  try {
    const { jobId } = req.params;

    const job = await JobOpenings.findById(jobId)
      .populate('assignedHR', 'firstName lastName')
      .populate('createdBy', 'firstName lastName')
      .lean();

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    if (job.jobStatus !== 'Closed') {
      return res.status(400).json({
        message: `This position is currently "${job.jobStatus}", not Closed.`,
      });
    }

    const applications = await CandidateApplication.find({ jobId })
      .populate('candidateId', 'candidateName candidatePhone candidateEmail currentCTC experience currentLocation')
      .populate('createdBy', 'firstName lastName')
      .sort({ joiningDate: -1 })
      .lean();

    const totalRequired   = job.numberOfRequirements || 0;
    const joinedCandidates = applications.filter(
      (app) => app.hasJoined === 'Yes' || app.joiningDate != null
    );

    return res.status(200).json({
      job: {
        jobId:                job._id,
        companyName:          job.companyName,
        jobTitle:             job.jobTitle,
        jobLocation:          job.jobLocation,
        salary:               job.salary,
        numberOfRequirements: totalRequired,
        jobStatus:            job.jobStatus,
        closedAt:             job.updatedAt,
        completionDate:       job.completionDate || null,
        assignedHR: Array.isArray(job.assignedHR)
          ? job.assignedHR.map((hr) => `${hr.firstName} ${hr.lastName}`)
          : [],
        createdBy: job.createdBy
          ? `${job.createdBy.firstName} ${job.createdBy.lastName}`
          : null,
      },
      fulfillment: {
        totalRequired,
        totalJoined:    joinedCandidates.length,
        isFulfilled:    totalRequired > 0 && joinedCandidates.length >= totalRequired,
        totalApplied:   applications.length,
        selectedCount:  applications.filter((a) => a.interviewStatus === 'Selected').length,
        rejectedCount:  applications.filter((a) => a.interviewStatus === 'Rejected').length,
      },
      joinedCandidates: joinedCandidates.map((app) => ({
        applicationId:  app._id,
        candidateName:  app.candidateId?.candidateName    || '',
        candidatePhone: app.candidateId?.candidatePhone   || '',
        candidateEmail: app.candidateId?.candidateEmail   || '',
        currentCTC:     app.candidateId?.currentCTC       || null,
        experience:     app.candidateId?.experience       || null,
        currentLocation:app.candidateId?.currentLocation  || '',
        offeredSalary:  app.offeredSalary                 || '',
        joiningDate:    app.joiningDate                   || null,
        hasJoined:      app.hasJoined                     || '',
        assignedHR:     app.createdBy
          ? `${app.createdBy.firstName} ${app.createdBy.lastName}`
          : '',
        billingAmount:  app.billingAmount  || '',
        paymentStatus:  app.paymentStatus  || '',
      })),
      allApplications: applications.map((app) => ({
        applicationId:   app._id,
        candidateName:   app.candidateId?.candidateName  || '',
        candidatePhone:  app.candidateId?.candidatePhone || '',
        interviewStatus: app.interviewStatus             || '',
        offeredStatus:   app.offeredStatus               || '',
        hasJoined:       app.hasJoined                   || '',
        joiningDate:     app.joiningDate                 || null,
        assignedHR:      app.createdBy
          ? `${app.createdBy.firstName} ${app.createdBy.lastName}`
          : '',
      })),
    });
  } catch (error) {
    console.error('getFulfilledPositionById error:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

module.exports = {
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
  getFulfilledPositions,
  getFulfilledPositionById,
};
