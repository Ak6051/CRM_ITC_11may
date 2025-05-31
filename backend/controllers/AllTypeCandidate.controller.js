const { uploadToGCS } = require('../middleware/gcsMulter');
const allcandidate = require('../models/AllTypeCandidate.model');


const createCandidates = async (req, res) => {
    try {
      const allowedRoles = ['admin', 'Sales', 'HR'];
      if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ message: 'You are not allowed to create job openings.' });
      }
  
      const jobData = {
        ...req.body,
        createdBy: req.user._id,
      };
  
      if (req.file) {
        // Generate unique filename for GCS
        const filename = `candidates_resume/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
  
        // Upload to GCS and get public URL
        const publicUrl = await uploadToGCS(req.file.buffer, filename, req.file.mimetype);
  
        jobData.resumeUpload = publicUrl; // Save the GCS URL in description
      }
  
      const newJob = new allcandidate(jobData);
      await newJob.save();
  
      res.status(201).json({ message: 'Job opening created successfully', job: newJob });
    } catch (error) {
      res.status(500).json({ message: 'Something went wrong', error: error.message });
    }
  };


const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;

    const updatedData = { ...req.body };

    if (req.file) {
      const filename = `candidates_resume/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      const publicUrl = await uploadToGCS(req.file.buffer, filename, req.file.mimetype);
      updatedData.resumeUpload = publicUrl;
    }

    const updatedCandidate = await allcandidate.findByIdAndUpdate(id, updatedData, { new: true });
    res.status(200).json(updatedCandidate);
  } catch (error) {
    res.status(500).json({ message: "Failed to update candidate", error: error.message });
  }
};

const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    await allcandidate.findByIdAndDelete(id);
    res.status(200).json({ message: "Candidate deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Failed to delete candidate", error: error.message });
  }
};



  // const getMyCandidate = async (req, res) => {
  //   try {
  //     const jobs = await allcandidate.find({ createdBy: req.user._id });
  //     res.status(200).json(jobs);
  //   } catch (error) {
  //     res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
  //   }
  // };
  
  const getMyCandidate = async (req, res) => {
  try {
    let jobs;

    if (req.user.role === 'admin') {
      // Admin: fetch all candidates with createdBy's firstName and lastName
      jobs = await allcandidate
        .find({})
        .populate('createdBy', 'firstName lastName');
    } else {
      // HR: fetch only own candidates
      jobs = await allcandidate.find({ createdBy: req.user._id });
    }
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
  }
};

  

module.exports = {
  createCandidates,
  getMyCandidate,
  updateCandidate,
  deleteCandidate
};
