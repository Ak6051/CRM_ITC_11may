const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/Hr.data.middleware');
const {
  createJobOpening,
  getAllJobOpenings,
  getMyJobs,
  updateJobOpening,
  deleteJobOpening,
  getAllSales,
  toggleJobStatus,
  getUniqueIndustries,
  updateApprovalStatus,
} = require('../controllers/allJobPost.controller');
const JobOpenings = require('../models/jobopennings.modal');
const Candidate = require("../models/candidateModal");
const CompanyCreate = require("../models/companycreate.model");
const SalesPanel = require('../models/SalesPanel.model'); // import salesPanel model
const User = require('../models/User'); // import user model

const {upload} = require("../middleware/gcsMulter"); // multer config


router.post('/create',protect,upload.fields([ { name: 'agreementSigned', maxCount: 1 }, { name: 'descriptionFile', maxCount: 1 }, { name: 'gstUpload', maxCount: 1 }]),createJobOpening);
router.get('/all', protect, getAllJobOpenings);                // Admin: All Jobs
router.get('/my-jobs', protect, getMyJobs);                    // View own jobs
router.put('/edit/:id',protect,upload.fields([{ name: 'agreementSigned', maxCount: 1 },{ name: 'descriptionFile', maxCount: 1 }, { name: 'gstUpload', maxCount: 1 }]), updateJobOpening);
router.delete('/delete/:id', protect, deleteJobOpening);       // Delete job by id
router.get('/sales', protect, getAllSales);
router.put('/:id/toggle-status', protect, toggleJobStatus);
router.put('/update-approval/:id', protect, updateApprovalStatus);
router.get('/industries', getUniqueIndustries);


// ... existing code ...
// router.post('/import', protect, async (req, res) => {
//   try {
//     const jobs = req.body.jobs;
//     // Add createdBy field to each job
//     const jobsWithCreator = jobs.map(job => ({
//       ...job,
//       createdBy: req.user._id
//     }));
//     const inserted = await JobOpenings.insertMany(jobsWithCreator);
//     res.status(201).json(inserted);
//   } catch (err) {
//     console.error(err);
//     res.status(500).json({ error: 'Something went wrong.' });
//   }
// });

router.post('/import', protect, async (req, res) => {
  try {
    const jobs = req.body.jobs;
    const CompanyCreate = require('../models/companycreate.model');

    // 1. Get all unique company names from the Excel data
    const uniqueCompanyNames = [...new Set(jobs.map(j => j.companyName?.trim()).filter(Boolean))];

    // 2. Check which companies exist in CompanyCreate
    const existingCompanies = await CompanyCreate.find({
      companyName: { $in: uniqueCompanyNames.map(name => new RegExp(`^${name}$`, 'i')) }
    });

    const existingCompanyMap = {};
    existingCompanies.forEach(c => {
      existingCompanyMap[c.companyName.toLowerCase()] = c.companyId;
    });

    // 3. Find missing companies
    const missingCompanies = uniqueCompanyNames.filter(name => !existingCompanyMap[name.toLowerCase()]);

    if (missingCompanies.length > 0) {
      return res.status(400).json({
        error: 'Validation Failed',
        message: `The following companies are not registered in the system: ${missingCompanies.join(', ')}. Please create these companies first before importing jobs.`,
        missingCompanies
      });
    }

    // 4. Map jobs with existing companyIds
    const jobsWithCompanyId = jobs.map(job => ({
      ...job,
      companyId: existingCompanyMap[job.companyName.trim().toLowerCase()],
      createdBy: req.user._id
    }));

    const inserted = await JobOpenings.insertMany(jobsWithCompanyId, { ordered: false });
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.', details: err.message });
  }
});

router.get('/company-names', async (req, res) => {
  try {
    const companies = await JobOpenings.aggregate([
      // Only include documents that have a non-empty companyName
      { $match: { companyName: { $exists: true, $ne: null, $ne: '' } } },
      {
        // Group purely by normalized (lowercase + trimmed) company name
        // This eliminates duplicates regardless of companyId differences
        $group: {
          _id: { $trim: { input: { $toLower: '$companyName' } } },
          originalName: { $first: '$companyName' }
        }
      },
      {
        $project: {
          _id: 0,
          companyName: '$originalName',
        }
      },
      { $sort: { companyName: 1 } }
    ]);

    const companyNames = companies.map(c => c.companyName);
    res.json(companyNames);
  } catch (error) {
    console.error('Error fetching company names:', error);
    res.status(500).json({ message: 'Error fetching company names', error: error.message });
  }
});


router.get('/jobTitle-names', async (req, res) => {
  try {
    const jobTitles = await JobOpenings.distinct('jobTitle');
    res.json(jobTitles);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching job title names' });
  }
});

// ── Fetch open jobs matching a job title (for WhatsApp dialog dropdown) ──────
router.get('/by-title', protect, async (req, res) => {
  try {
    const { title } = req.query;
    if (!title) return res.json([]);
    const jobs = await JobOpenings.find({
      jobTitle: { $regex: title, $options: 'i' },
      jobStatus: 'Open',
    })
      .select('jobTitle companyName jobLocation salary experience phoneNumber contactName')
      .sort({ createdAt: -1 })
      .limit(20);
    res.json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching jobs by title' });
  }
});

router.get('/salary-names', async (req, res) => {
  try {
    const salaries = await JobOpenings.distinct('salary');
    res.json(salaries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching salary names' });
  }
});




router.get('/companies', async (req, res) => {
  try {
    const query = req.query.query;

    const queryNumber = !isNaN(query) ? parseInt(query) : null;

    // Parallel fetch from JobOpenings, Company, and SalesPanel
    const [jobOpenings, salesPanels] = await Promise.all([
      JobOpenings.find({
        $or: [
          { companyName: { $regex: query, $options: 'i' } },
          ...(queryNumber ? [{ companyId: queryNumber }] : []),
        ],
      })
        .select('companyName companyId companyAddress contactName email phoneNumber websiteURL industries agreementSigned gstUpload')
        // Remove limit when query is empty to show all companies
        .limit(query === '' ? 0 : 10),
    
    ]);
    

    // Combine and deduplicate results
    const uniqueResults = [];
    const seen = new Set();

    const addIfUnique = (c, source) => {
      const key = `${c.companyName}_${c.companyId}`;
      if (!seen.has(key)) {
        seen.add(key);
        uniqueResults.push({
          companyName: c.companyName,
          companyId: c.companyId,
          companyAddress: c.companyAddress || '',
          contactName: c.contactName || '',
          email: c.email || '',
          phoneNumber: c.phoneNumber || '',
          websiteURL: c.websiteURL || '',
          industries: c.industries || '',
          agreementSigned: c.agreementSigned || '',
          gstUpload: c.gstUpload || '',
          source,
          _id: c._id,
        });
      }
    };

    jobOpenings.forEach((c) => addIfUnique(c, 'JobOpenings'));
    // salesPanels.forEach((c) => addIfUnique(c, 'SalesPanel'));
    // companies.forEach((c) => addIfUnique(c, 'Company'));

    res.json(uniqueResults);
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
});


// router.get('/hr/:hrId/assigned-data', protect, async (req, res) => {
//   try {
//     const hrId = req.params.hrId;

//     // Get JobOpenings assigned to this HR
//     const jobOpenings = await JobOpenings.find({ assignedHR: hrId });

//     // Get all jobOpening IDs
//     const jobOpeningIds = jobOpenings.map((job) => job._id);

//     // Find candidates linked to JobOpenings
//     const candidates = await Candidate.find({ jobId: { $in: jobOpeningIds } });

//     res.json({ jobOpenings, candidates }); // Removed convertedJobs and convertedCandidates
//   } catch (error) {
//     console.error('Error fetching HR assigned data:', error);
//     res.status(500).json({ message: 'Server Error' });
//   }
// });

router.get('/hr/:hrId/assigned-data', protect, async (req, res) => {
  try {
    const hrId = req.params.hrId;
    const mongoose = require('mongoose');
    const CandidateApplication = require('../models/CandidateApplication.model');

    // Get HR info
    const hr = await User.findById(hrId).select('firstName lastName email mobileNo role');
    if (!hr) return res.status(404).json({ message: 'HR not found' });

    // Get JobOpenings assigned to this HR
    const jobOpenings = await JobOpenings.find({ assignedHR: hrId })
      .populate('createdBy', 'firstName lastName')
      .lean();

    const jobOpeningIds = jobOpenings.map(j => j._id);

    // Get all CandidateApplications for these jobs that were created by this HR
    const applications = await CandidateApplication.find({
      jobId: { $in: jobOpeningIds },
      createdBy: hrId,
    })
      .populate('candidateId', 'candidateName candidatePhone candidateEmail positionName experience currentLocation currentCTC expectedCTC noticePeriod currentCompany qualification resumeLink remark')
      .populate('jobId', 'companyName jobTitle numberOfRequirements salary jobLocation')
      .lean();

    // Build per-job stats
    const jobStatsMap = {};
    applications.forEach(app => {
      const jid = app.jobId?._id?.toString() || app.jobId?.toString();
      if (!jid) return;
      if (!jobStatsMap[jid]) {
        jobStatsMap[jid] = { sourced: 0, selected: 0, rejected: 0, onHold: 0, joined: 0, backout: 0, offerAccepted: 0 };
      }
      jobStatsMap[jid].sourced++;
      if (app.interviewStatus === 'Selected')   jobStatsMap[jid].selected++;
      if (app.interviewStatus === 'Rejected')   jobStatsMap[jid].rejected++;
      if (app.interviewStatus === 'On Hold')    jobStatsMap[jid].onHold++;
      if (app.hasJoined === 'Yes')              jobStatsMap[jid].joined++;
      if (app.hasJoined === 'Backout')          jobStatsMap[jid].backout++;
      if (app.offeredStatus === 'Accepted')     jobStatsMap[jid].offerAccepted++;
    });

    // Attach stats to each job
    const jobsWithStats = jobOpenings.map(j => ({
      ...j,
      stats: jobStatsMap[j._id.toString()] || { sourced: 0, selected: 0, rejected: 0, onHold: 0, joined: 0, backout: 0, offerAccepted: 0 },
    }));

    // Overall summary
    const summary = {
      totalJobs: jobOpenings.length,
      totalSourced: applications.length,
      totalSelected: applications.filter(a => a.interviewStatus === 'Selected').length,
      totalRejected: applications.filter(a => a.interviewStatus === 'Rejected').length,
      totalJoined: applications.filter(a => a.hasJoined === 'Yes').length,
      totalBackout: applications.filter(a => a.hasJoined === 'Backout').length,
      totalOfferAccepted: applications.filter(a => a.offeredStatus === 'Accepted').length,
    };

    res.json({ hr, jobOpenings: jobsWithStats, applications, summary });
  } catch (error) {
    console.error('Error fetching HR assigned data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});




// Update company details route
router.get('/companies/:id', async (req, res) => {
  try {
    let company = await JobOpenings.findById(req.params.id);
    
    // If not found in JobOpenings, try Company collection
    // if (!company) {
    //   company = await Company.findById(req.params.id);
    // }

    if (company) {
      res.json(company);
    } else {
      res.status(404).json({ message: 'Company not found' });
    }
  } catch (err) {
    console.error('Error fetching company details:', err);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/export-data',protect,  async (req, res) => {
  try {
    const jobs = await JobOpenings.find()
      .populate('assignedHR', 'firstName lastName')
      .populate('createdBy', 'firstName lastName role')
      .select([
        'industries',
        'companyName',
        'companyId',
        'companyAddress',
        'contactName',
        'email',
        'phoneNumber',
        'response',
        'jobTitle',
        'benefits',
        'numberOfRequirements',
        'websiteURL',
        'keyResponsibility',
        'requiredSkills',
        'education',
        'experience',
        'salary',
        'jobLocation',
        'jobTiming',
        'gender',
        'remarks',
        // 'description',
        'assignedHR',
        'createdBy',
        'createdAt'
      ]);

    res.json(jobs);
  } catch (error) {
    console.error('Export error:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

router.get('/userlist/hr-admin', protect, async (req, res) => {
  try {
    const users = await User.find({ role: { $in: ['HR', 'admin'] } }).select('firstName lastName _id role');
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});


// Add new route for verifying assignments

module.exports = router;
