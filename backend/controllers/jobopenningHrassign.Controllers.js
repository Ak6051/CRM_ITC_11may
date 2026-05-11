

const JobOpenings = require('../models/jobopennings.modal'); // Model ko import karna

exports.getAssignedjob = async (req, res) => {
  try {
    const hrId = req.user._id;

    // Only show Open jobs assigned to this HR
    const assignedSales = await JobOpenings.find({ 
      assignedHR: hrId,
      jobStatus: 'Open',
    }).sort({ createdAt: -1 });


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
