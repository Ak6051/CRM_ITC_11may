

const JobOpenings = require('../models/jobopennings.modal'); // Model ko import karna

exports.getAssignedjob = async (req, res) => {
  try {
    const hrId = req.user._id;

    // Find all jobs assigned to this HR, regardless of end date
    const assignedSales = await JobOpenings.find({ 
      assignedHR: hrId,
      // Remove any date-based filtering if it exists
    }).sort({ createdAt: -1 }); // Sort by newest first


    res.status(200).json({
      success: true,
      data: assignedSales,
    });
  } catch (error) {
    console.error("Error in getAssignedjob:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};
