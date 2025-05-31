const express = require('express');
const JobOpenings = require('../models/jobopennings.modal');

const router = express.Router();
const {
  getAllSales,
  createSale,
  updateSale,
  deleteSale,
} = require('../controllers/jobreport.Controllers');

router.get('/', getAllSales);
router.post('/', createSale);
router.put('/:id', updateSale);
router.delete('/:id', deleteSale);



module.exports = router;
