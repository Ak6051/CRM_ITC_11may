// // controllers/salesController.js
// const Sale = require('../models/Sale');

// const getAssignedSales = async (req, res) => {
//   try {
//     // Ensure only users with 'HR' role can access this
//     if (req.user.role !== 'HR') {
//       return res.status(403).json({ msg: 'Access denied' });
//     }

//     // Find sales assigned to the logged-in HR (using req.user.userId)
//     const assignedSales = await Sale.find({ assignedHR: req.user.userId });

//     res.json(assignedSales);
//   } catch (error) {
//     console.error(error.message);
//     res.status(500).send('Server error');
//   }
// };

// module.exports = { getAssignedSales };

const Sale = require('../models/Sale'); // Model ko import karna
const User = require('../models/User'); // User model import for any user validation if needed

// Route to fetch sales assigned to logged-in HR
exports.getAssignedSales = async (req, res) => {
  try {
    // Currently logged-in HR user id
    const hrId = req.user._id;

    // Fetch sales where assignedHR matches logged-in HR's id
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
// exports.updateJobStatus = async (req, res) => {
//   const { saleId } = req.params;
//   try {
//     const sale = await Sale.findByIdAndUpdate(
//       saleId,
//       {
//         jobStatus: 'Closed',
//         endDate: new Date(), // Update end date
//       },
//       { new: true }
//     );
//     if (!sale) {
//       return res.status(404).json({ success: false, message: 'Sale not found' });
//     }
//     res.status(200).json({ success: true, data: sale });
//   } catch (error) {
//     res.status(500).json({ success: false, message: 'Error updating job status', error });
//   }
// };

// salesController.js
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
