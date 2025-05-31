const express = require('express');
const router = express.Router();
const { getAllCandidates, deleteCandidate } = require('../controllers/candidate.controller');
const { protect } = require('../middleware/Hr.data.middleware');
const Candidate = require("../models/candidateModal");

// Get all candidates
router.get('/candidates', protect, getAllCandidates);

// Delete a candidate
router.delete('/candidates/:id', protect, deleteCandidate);

router.put('/lineup/:id', async (req, res) => {
    try {
      const updatedCandidate = await Candidate.findByIdAndUpdate(
        req.params.id,
        {
          billingDate: req.body.billingDate,
          billingAmount: req.body.billingAmount,
          paymentStatus: req.body.paymentStatus,
          paymentDate: req.body.paymentDate,
        },
        { new: true }
      );
      res.json(updatedCandidate);
    } catch (err) {
      res.status(500).json({ message: err.message });
    }
  });
  

module.exports = router; 