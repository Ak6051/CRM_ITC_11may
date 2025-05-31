const { uploadToGCS } = require('../middleware/gcsMulter');
const salesPanel = require('../models/SalesPanel.model');
const ConvertedJob = require('../models/convertOpening.model');
const mongoose = require('mongoose')
const convertSourceData = require("../models/convertSourceData.model");
const JobOpenings = require('../models/jobopennings.modal');
const Company = require('../models/company.model');



const getMySales = async (req, res) => {
  try {
    let sales;

    if (req.user.role === 'admin') {
      // Admin: fetch all sales with createdBy's firstName and lastName
      sales = await salesPanel
        .find({})
        .populate('createdBy', 'firstName lastName');
    } else {
      // Non-admin: fetch only own sales
      sales = await salesPanel.find({ createdBy: req.user._id });
    }

    res.status(200).json(sales);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales', error: error.message });
  }
};




const createJobOpening = async (req, res) => {
  try {
    const allowedRoles = ['admin', 'Sales', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to create job openings.' });
    }

    let { assignedHR, companyName } = req.body;
    if (!assignedHR) assignedHR = null;
    if (!companyName) return res.status(400).json({ message: "companyName is required" });

    companyName = companyName.trim();

    // 1. Check if company already exists in Company collection
    let company = await Company.findOne({ companyName: { $regex: new RegExp(`^${companyName}$`, 'i') } });

    // 2. If company does not exist, create new with incremented companyId
    if (!company) {
      try {
        // Find the last company with highest companyId
        const lastCompany = await Company.findOne({})
          .sort({ companyId: -1 }) // Sort in descending order
          .limit(1);

        let newCompanyId;
        if (lastCompany && lastCompany.companyId) {
          // If companies exist, increment the last ID
          newCompanyId = lastCompany.companyId + 1;
        } else {
          // If no companies exist, start with 10001
          newCompanyId = 10001;
        }

        // Create new company with incremented ID
        company = new Company({
          companyName,
          companyId: newCompanyId,
        });

        await company.save();
      } catch (error) {
        console.error('Error creating new company:', error);
        return res.status(500).json({ message: 'Error creating company', error: error.message });
      }
    } else {
    }

    // 3. Create job data with company ID and name from the found/created company
    const jobData = {
      companyId: company.companyId,
      companyName: company.companyName, // Use the company name from the database
      ...req.body,
      createdBy: req.user._id,
    };

    // Validate that companyId is set
    if (!jobData.companyId) {
      console.error('Company ID is missing from job data:', jobData);
      return res.status(500).json({ message: 'Company ID is required' });
    }

    console.log('Creating job with data:', {
      ...jobData,
      companyId: jobData.companyId,
      companyName: jobData.companyName
    });

    // File upload logic remains same
    if (req.files) {
      if (req.files.agreementSigned && req.files.agreementSigned[0]) {
        const file = req.files.agreementSigned[0];
        const filename = `agreement_signed/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToGCS(file.buffer, filename, file.mimetype);
        jobData.agreementSigned = url;
      }

      if (req.files.descriptionFile && req.files.descriptionFile[0]) {
        const file = req.files.descriptionFile[0];
        const filename = `description_files/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToGCS(file.buffer, filename, file.mimetype);
        jobData.descriptionFile = url;
      }
    }

    // Create new job with validated data
    const newJob = new salesPanel(jobData);

    await newJob.save();

    res.status(201).json({ message: 'Job opening created successfully', job: newJob });
  } catch (error) {
    console.error('Error in createJobOpening:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};



const updateJobOpening = async (req, res) => {
  try {
    const job = await salesPanel.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allowed to edit this job' });
    }

    let updateData = { ...req.body };

    if (req.files) {
      if (req.files.agreementSigned && req.files.agreementSigned[0]) {
        const file = req.files.agreementSigned[0];
        const filename = `agreement_signed/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToGCS(file.buffer, filename, file.mimetype);
        updateData.agreementSigned = url;
      }

      if (req.files.descriptionFile && req.files.descriptionFile[0]) {
        const file = req.files.descriptionFile[0];
        const filename = `description_files/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToGCS(file.buffer, filename, file.mimetype);
        updateData.descriptionFile = url;
      }
    }

    // Optional: prevent overwriting description if not sent in form
    if (!updateData.description) {
      delete updateData.description;
    }

    const updatedJob = await salesPanel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job', error: error.message });
  }
};



const saveConvertedJob = async (req, res) => {
  try {
    const {
      _id, // original job ID
        industries,
      companyName,
      companyAddress,
      contactName,
      email,
      phoneNumber,
      response,
      jobTitle,
      benefits,
      numberOfRequirements,
      websiteURL,
      keyResponsibility,
      requiredSkills,
      education,
      experience,
      salary,
      jobLocation,
      remarks,
      agreementSigned,
      description,
      companyId, // ✅ include this
      convertedAt,
    } = req.body;

    // Check if this job is already converted
    const alreadyConverted = await JobOpenings.findOne({ originalJobId: _id });

    if (alreadyConverted) {
      return res.status(400).json({ message: 'This job has already been converted.' });
    }

    const newConversion = new JobOpenings({
      originalJobId: _id,
      industries,
      companyName,
      companyAddress,
      contactName,
      email,
      phoneNumber,
      response,
      jobTitle,
      benefits,
      numberOfRequirements,
      websiteURL,
      keyResponsibility,
      requiredSkills,
      education,
      experience,
      salary,
      jobLocation,
      remarks,
      agreementSigned,
      description,
      convertedAt,
      companyId, // ✅ include this
      createdBy: req.user._id,
    });

    await newConversion.save();

    res.status(201).json({ message: 'Conversion successful', data: newConversion });
  } catch (error) {
    console.error('Conversion error:', error);
    res.status(500).json({ message: 'Server Error' });
  }
};


const getConvertedJobs = async (req, res) => {
  try {
    let jobs;

    if (req.user.role === 'admin') {
      // Admin: fetch all converted jobs with createdBy's and assignedHR's names
      jobs = await JobOpenings
        .find({})
        .populate('createdBy', 'firstName lastName')
        .populate('assignedHR', 'firstName lastName');
    } else {
      // Non-admin: fetch only own converted jobs, populate assignedHR as well
      jobs = await JobOpenings
        .find({ createdBy: req.user._id })
        .populate('assignedHR', 'firstName lastName');
    }

    res.status(200).json(jobs);
  } catch (error) {
    console.error('Error fetching converted jobs:', error);
    res.status(500).json({ message: 'Server Error', error: error.message });
  }
};


const getAssignedjob = async (req, res) => {
  try {
    const hrId = new mongoose.Types.ObjectId(req.user._id); // ensure ObjectId

    const assignedJobs = await ConvertedJob.find({ 
      assignedHR: hrId 
    })
    .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      data: assignedJobs,
    });
  } catch (error) {
    console.error("Error in getAssignedjob:", error);
    res.status(500).json({
      success: false,
      message: 'Server Error',
    });
  }
};


const addMultipleCandidates = async (req, res) => {
  try {
    const { jobId } = req.body;
    const candidatesData = JSON.parse(req.body.candidates);
    const uploadedFiles = req.files || [];

    if (!Array.isArray(candidatesData) || candidatesData.length === 0) {
      return res.status(400).json({ message: "No candidates provided" });
    }

    const candidatesWithFiles = await Promise.all(
  candidatesData.map(async (candidate, index) => {
    const file = uploadedFiles.find((f) => f.fieldname === `resume-${index}`);
    let resumeLink = "No Resume";

    if (file) {
      console.log(`✅ Found file for resume-${index}`);
      const cleanedOriginalName = file.originalname.replace(/\s+/g, "_");
      const uniqueName = `${Date.now()}-${cleanedOriginalName}`;
      try {
        resumeLink = await uploadToGCS(file.buffer, uniqueName, file.mimetype);
        console.log(`✅ Uploaded to GCS: ${resumeLink}`);
      } catch (err) {
        console.error(`❌ GCS upload failed: ${err.message}`);
      }
    } else {
      console.log(`❌ No file found for resume-${index}`);
    }

    return {
      ...candidate,
      jobId,
      resumeLink,
    };
  })
);


    const savedCandidates = await convertSourceData.insertMany(candidatesWithFiles);
    res.status(201).json({ success: true, data: savedCandidates });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to add candidates",
      error: error.message,
    });
  }
};



module.exports = {
  createJobOpening,
  getMySales,
  updateJobOpening,
  saveConvertedJob,
  getConvertedJobs,
  getAssignedjob,
  addMultipleCandidates
};
