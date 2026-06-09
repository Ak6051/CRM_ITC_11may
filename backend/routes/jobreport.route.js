const express = require('express');
const { protect } = require('../middleware/Hr.data.middleware');

const router = express.Router();
const {
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
  getFulfilledPositions,
  getFulfilledPositionById,
} = require('../controllers/jobreport.Controllers');

router.get('/', getAllSales);
router.post('/', createSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);

// Admin: Closed positions aur unke fulfilled candidates
router.get('/fulfilled', protect, getFulfilledPositions);
router.get('/fulfilled/:jobId', protect, getFulfilledPositionById);

module.exports = router;
