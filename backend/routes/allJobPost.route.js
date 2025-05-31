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
  getUniqueIndustries 
} = require('../controllers/allJobPost.controller');
const JobOpenings = require('../models/jobopennings.modal');
const Candidate = require("../models/candidateModal");
const Company = require("../models/company.model");
const SalesPanel = require('../models/SalesPanel.model'); // import salesPanel model


const {upload} = require("../middleware/gcsMulter"); // multer config


router.post('/create',protect,upload.fields([ { name: 'agreementSigned', maxCount: 1 }, { name: 'descriptionFile', maxCount: 1 }]),createJobOpening);
router.get('/all', protect, getAllJobOpenings);                // Admin: All Jobs
router.get('/my-jobs', protect, getMyJobs);                    // View own jobs
router.put('/edit/:id',protect,upload.fields([{ name: 'agreementSigned', maxCount: 1 },{ name: 'descriptionFile', maxCount: 1 }]), updateJobOpening);
router.delete('/delete/:id', protect, deleteJobOpening);       // Delete job by id
router.get('/sales', protect, getAllSales);
router.put('/:id/toggle-status', protect, toggleJobStatus);
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

    const inserted = await JobOpenings.insertMany(jobsWithCompanyId);
    res.status(201).json(inserted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Something went wrong.', details: err.message });
  }
});

router.get('/company-names', async (req, res) => {
  try {
    const companies = await JobOpenings.distinct('companyName');
    res.json(companies);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching company names' });
  }
});






router.get('/companies', async (req, res) => {
  try {
    const query = req.query.query;

    const queryNumber = !isNaN(query) ? parseInt(query) : null;

    // Parallel fetch from JobOpenings, Company, and SalesPanel
    const [jobOpenings, companies, salesPanels] = await Promise.all([
      JobOpenings.find({
        $or: [
          { companyName: { $regex: query, $options: 'i' } },
          ...(queryNumber ? [{ companyId: queryNumber }] : []),
        ],
      })
        .select('companyName companyId companyAddress contactName email phoneNumber')
        .limit(10),

      Company.find({
        $or: [
          { companyName: { $regex: query, $options: 'i' } },
          ...(queryNumber ? [{ companyId: queryNumber }] : []),
        ],
      })
        .select('companyName companyId')
        .limit(10),

      SalesPanel.find({
        $or: [
          { companyName: { $regex: query, $options: 'i' } },
          ...(queryNumber ? [{ companyId: queryNumber }] : []),
        ],
      })
        .select('companyName companyId companyAddress contactName email phoneNumber')
        .limit(10),
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
          source, // optional field to identify where the result came from
          _id: c._id,
        });
      }
    };

    jobOpenings.forEach((c) => addIfUnique(c, 'JobOpenings'));
    salesPanels.forEach((c) => addIfUnique(c, 'SalesPanel'));
    companies.forEach((c) => addIfUnique(c, 'Company'));

    res.json(uniqueResults);
  } catch (err) {
    console.error('Error fetching suggestions:', err);
    res.status(500).json({ message: 'Error fetching suggestions' });
  }
});


router.get('/hr/:hrId/assigned-data', protect, async (req, res) => {
  try {
    const hrId = req.params.hrId;

    // Get JobOpenings assigned to this HR
    const jobOpenings = await JobOpenings.find({ assignedHR: hrId });

    // Get all jobOpening IDs
    const jobOpeningIds = jobOpenings.map((job) => job._id);

    // Find candidates linked to JobOpenings
    const candidates = await Candidate.find({ jobId: { $in: jobOpeningIds } });

    res.json({ jobOpenings, candidates }); // Removed convertedJobs and convertedCandidates
  } catch (error) {
    console.error('Error fetching HR assigned data:', error);
    res.status(500).json({ message: 'Server Error' });
  }
});





// Update company details route
router.get('/companies/:id', async (req, res) => {
  try {
    // First try to find in JobOpenings
    let company = await JobOpenings.findById(req.params.id);
    
    // If not found in JobOpenings, try Company collection
    if (!company) {
      company = await Company.findById(req.params.id);
    }

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
        'remarks',
        'description',
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


module.exports = router;
