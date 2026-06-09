const express = require('express');
const router = express.Router();

const { protect } = require('../middleware/Hr.data.middleware');
const {
  createCandidates,
  getMyCandidate,
  updateCandidate,
  deleteCandidate,
  getCombinedCandidates,
  bulkUploadCandidates,
} = require('../controllers/AllTypeCandidate.controller');
const { upload } = require('../middleware/gcsMulter');
const Candidate = require('../models/candidateModal');

// Create single candidate
router.post('/create-all', protect, upload.single('resumeUpload'), createCandidates);

// Get candidates for a specific HR
router.get('/all-candidates/:hrId', protect, getMyCandidate);

// Update candidate
router.put('/update/:id', protect, upload.single('resumeUpload'), updateCandidate);

// Delete candidate
router.delete('/delete/:id', protect, deleteCandidate);

// Get all candidates (paginated + filtered) — used by AllCandidateData page
router.get('/hr-candidates', protect, getCombinedCandidates);

// Bulk upload
router.post('/bulk-upload', protect, bulkUploadCandidates);

// ── Phone duplicate check (used by CandidatesForm / AdminCandidateForm) ──────
// GET /api/candidate/check-phone?phone=9876543210
// Returns: { exists: true, id, name } or { exists: false }
router.get('/check-phone', protect, async (req, res) => {
  try {
    const phone = (req.query.phone || '').trim();
    if (!phone || phone.length !== 10) {
      return res.json({ exists: false });
    }
    const candidate = await Candidate.findOne({ candidatePhone: phone })
      .select('_id candidateName')
      .lean();
    if (candidate) {
      return res.json({ exists: true, id: candidate._id, name: candidate.candidateName || '' });
    }
    return res.json({ exists: false });
  } catch (err) {
    console.error('Phone check error:', err);
    res.status(500).json({ exists: false });
  }
});

// Position search (used by CandidatesForm autocomplete)
router.get('/', async (req, res) => {
  try {
    const search = req.query.search ? req.query.search.trim() : '';
    const query = search ? { positionName: { $regex: search, $options: 'i' } } : {};
    const positions = await Candidate.find(query).distinct('positionName');
    const unique = [...new Set(positions.filter(Boolean))];
    res.json({ success: true, positions: unique });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Experience ranges (used by CandidatesForm autocomplete)
router.get('/experience-ranges', async (req, res) => {
  try {
    const { position } = req.query;
    
    // Predefined standard experience ranges (user-friendly format)
    const standardRanges = [
      'Fresher',
      '0-6 Months',
      '6 Months',
      '1 Year',
      '1 Year 3 Months',
      '1 Year 6 Months',
      '2 Years',
      '2 Years 3 Months',
      '2 Years 6 Months',
      '3 Years',
      '3-5 Years',
      '5 Years',
      '5-7 Years',
      '7-10 Years',
      '10+ Years',
      '15+ Years'
    ];
    
    // Get existing experiences from database
    const query = { experience: { $exists: true, $ne: '' } };
    if (position) query.positionName = position;

    const expRanges = await Candidate.find(query).distinct('experience');
    const dbExperiences = expRanges.filter(Boolean);
    
    // Combine standard ranges with database values (remove duplicates)
    const allExperiences = [...new Set([...standardRanges, ...dbExperiences])];
    
    // Sort by numeric value
    const sorted = allExperiences.sort((a, b) => {
      const getYears = exp => {
        // Handle "Fresher" first
        if (/fresher/i.test(exp)) return -1;
        
        // Extract first number from experience string
        const match = exp.match(/(\d+(\.\d+)?)/);
        return match ? parseFloat(match[0]) : 999;
      };
      return getYears(a) - getYears(b);
    });

    res.json({ success: true, experiences: sorted });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

module.exports = router;
