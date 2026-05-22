const JobOpenings = require('../models/jobopennings.modal');

exports.createjobopenning = async (req, res) => {
  try {
    const {
      companyName,
      companyAddress,
      contactName,
      email,
      phoneNumber,
      jobTitle,
      numberOfRequirements,
      keyResponsibility,
      requiredSkills,
      education,
      experience,
      salary,
      jobLocation,
      description,
      Area
    } = req.body;

    const job = new JobOpenings({
      companyName,
      companyAddress,
      contactName,
      email,
      phoneNumber,
      jobTitle,
      numberOfRequirements,
      keyResponsibility,
      requiredSkills,
      education,
      experience,
      salary,
      jobLocation,
      description,
      Area,
      createdBy: req.user._id 
    });

    await job.save();
    res.status(201).json({ message: 'Job opening created successfully!', job });
  } catch (error) {
    res.status(500).json({ message: 'Error creating job opening', error: error.message });
  }
};
