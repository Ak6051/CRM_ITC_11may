const express = require('express');
const Sale = require('../models/Sale');
const { getAssignedSales,updateJobStatus , updatePaymentStatus } = require('../controllers/Hr.controllers');
const { protect } = require('../middleware/Hr.data.middleware');

const router = express.Router();

// Protected route for fetching assigned sales
router.get('/assigned-sales', protect, getAssignedSales);

router.put('/update-job-status/:saleId', updateJobStatus);
router.put('/update-payment-status/:saleId', updatePaymentStatus);

router.put('/:id', async (req, res) => {
    try {
      const updatedPayment = await Sale.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!updatedPayment) return res.status(404).json({ message: 'Payment not found' });
      res.status(200).json(updatedPayment);
    } catch (error) {
      res.status(400).json({ message: error.message });
    }
  });
  
  // Delete a payment record by ID
  router.delete('/:id', async (req, res) => {
    try {
      const deletedPayment = await Sale.findByIdAndDelete(req.params.id);
      if (!deletedPayment) return res.status(404).json({ message: 'Payment not found' });
      res.status(200).json({ message: 'Payment deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  });
  


module.exports = router;
