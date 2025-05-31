const Candidate = require("../models/candidateModal");
const User = require("../models/User");

const getAllCandidates = async (req, res) => {
  try {
    const { createdByName } = req.query;

    const filter = { lineupStatus: "Completed" };

    if (createdByName) {
      const regex = new RegExp(createdByName, 'i'); // case-insensitive match
      const users = await User.find({
        $or: [
          { firstName: regex },
          { lastName: regex },
        ],
      }).select('_id');

      const userIds = users.map(user => user._id);
      filter.createdBy = { $in: userIds };
    }

    const candidates = await Candidate.find(filter)
      .populate({
        path: 'jobId',
        model: 'JobOpenings',
        select: 'jobTitle companyName',
      })
      .populate({
        path: 'createdBy',
        model: 'User',
        select: 'firstName lastName role',
      })
      .sort({ createdAt: -1 });

    res.status(200).json(candidates);
  } catch (error) {
    console.error("Error fetching candidates:", error);
    res.status(500).json({
      message: "Server Error",
      error: error.message,
      details: "Error occurred while fetching candidates. Please check if all models are properly registered."
    });
  }
};



const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if candidate exists
    const candidate = await Candidate.findById(id);
    if (!candidate) {
      return res.status(404).json({ message: "Candidate not found" });
    }

    // Delete the candidate
    await Candidate.findByIdAndDelete(id);

    res.status(200).json({ 
      message: "Candidate deleted successfully",
      deletedCandidate: candidate
    });
  } catch (error) {
    console.error("Error deleting candidate:", error);
    res.status(500).json({ 
      message: "Server Error", 
      error: error.message 
    });
  }
};

module.exports = {
  getAllCandidates,
  deleteCandidate
}; 