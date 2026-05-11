const JobOpenings = require('../models/jobopennings.modal');
const Candidate = require('../models/candidateModal');

// Utility to escape RegExp special characters
function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

const findMatchingCandidates = async (req, res) => {
  try {
    const jobId = req.params.jobId;
    const job = await JobOpenings.findById(jobId);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    // Split job title into keywords (words longer than 2 chars)
    const keywords = job.jobTitle?.split(' ').filter(word => word.length > 2) || [];

    if (keywords.length === 0) {
      return res.status(200).json({ success: true, candidates: [] });
    }

    // Build $or regex array against positionName
    const regexArray = keywords.map(word => ({
      positionName: { $regex: new RegExp(escapeRegExp(word), 'i') },
    }));

    // Single model query
    const candidates = await Candidate.find({ $or: regexArray });

    res.status(200).json({ success: true, candidates });
  } catch (error) {
    console.error('findMatchingCandidates error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { findMatchingCandidates };
