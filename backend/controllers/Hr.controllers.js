

const Sale = require('../models/Sale'); // Model ko import karna
const User = require('../models/User'); // User model import for any user validation if needed
exports.getAssignedSales = async (req, res) => {
  try {
    const hrId = req.user._id;

    const assignedSales = await Sale.find({ assignedHR: hrId });

    res.status(200).json({
      success: true,
      data: assignedSales,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};

exports.updateJobStatus = async (req, res) => {
  const { saleId } = req.params;
  const { jobStatus } = req.body; // Expecting 'Closed' or 'Open'

  try {
    const updateFields = { jobStatus };

    if (jobStatus === 'Closed') {
      updateFields.endDate = new Date(); // Set end date for closed jobs
    } else if (jobStatus === 'Open') {
      updateFields.startDate = new Date(); // Set new start date for reopened jobs
      updateFields.endDate = null; // Clear end date when reopening
    }

    const sale = await Sale.findByIdAndUpdate(
      saleId,
      updateFields,
      { new: true }
    );
    

    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }

    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating job status', error });
  }
};


exports.updatePaymentStatus = async (req, res) => {
  const { saleId } = req.params;
  const { paymentStatus } = req.body;
  
  try {
    const sale = await Sale.findByIdAndUpdate(
      saleId,
      { paymentStatus },
      { new: true }
    );
    if (!sale) {
      return res.status(404).json({ success: false, message: 'Sale not found' });
    }
    res.status(200).json({ success: true, data: sale });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error updating payment status', error });
  }
};
