const { uploadToS3 } = require('../middleware/gcsMulter');
const salesPanel = require('../models/SalesPanel.model');
const ConvertedJob = require('../models/convertOpening.model');
const mongoose = require('mongoose')
const convertSourceData = require("../models/convertSourceData.model");

const JobOpenings = require('../models/jobopennings.modal');

const CompanyCreate = require('../models/companycreate.model');
const RescheduledMeeting = require('../models/rescheduleMeeting.modal');





const getMySales = async (req, res) => {
  try {
    let salesQuery = ['admin', 'teamleader'].includes(req.user.role) ? {} : { createdBy: req.user._id };

    const [sales, reschedules] = await Promise.all([
      salesPanel.find(salesQuery).populate('createdBy', 'firstName lastName'),
      RescheduledMeeting.find(salesQuery).populate('salesId').populate('createdBy', 'firstName lastName')
    ]);

    // Merge original sales and reschedules into one array
    const formattedReschedules = reschedules
    .filter(r => r.salesId) // only include if salesId is populated
    .map(r => ({
      ...r.salesId.toObject(),
      _id: r._id, // use reschedule id
      createdAt: r.createdAt,
      rescheduledDate: r.newDate,
      rescheduleReason: r.reason,
      isRescheduled: true
    }));
  

    const allRows = [...sales, ...formattedReschedules];

    res.status(200).json(allRows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch sales', error: error.message });
  }
};

// POST /api/sales/reschedule

const createReschedule = async (req, res) => {
  try {
    const { salesId, newDate, reason } = req.body;

    const reschedule = new RescheduledMeeting({
      salesId,
      newDate,
      reason,
      createdBy: req.user._id,
    });

    await reschedule.save();

    res.status(201).json({ message: 'Meeting rescheduled successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to reschedule meeting', error: error.message });
  }
};









const createJobOpening = async (req, res) => {
  try {
    const allowedRoles = ['admin', 'teamleader', 'Sales', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to create job openings.' });
    }

    let { companyName, companyId, branchId, branchName } = req.body;

    if (!companyName) return res.status(400).json({ message: 'companyName is required' });
    if (!companyId)   return res.status(400).json({ message: 'companyId is required' });

    // Validate company exists in CompanyCreate
    const company = await CompanyCreate.findOne({ companyId: Number(companyId) });
    if (!company) return res.status(404).json({ message: `Company with ID ${companyId} not found` });

    const jobData = {
      ...req.body,
      companyName: company.companyName,
      companyId:   company.companyId,
      branchId:    branchId   || '',
      branchName:  branchName || '',
      createdBy:   req.user._id,
    };

    if (req.files) {
      if (req.files.agreementSigned?.[0]) {
        const file = req.files.agreementSigned[0];
        const url = await uploadToS3(file.buffer, `agreement_signed/${Date.now()}-${file.originalname.replace(/\s+/g,'_')}`, file.mimetype);
        jobData.agreementSigned = url;
      }
      if (req.files.descriptionFile?.[0]) {
        const file = req.files.descriptionFile[0];
        const url = await uploadToS3(file.buffer, `description_files/${Date.now()}-${file.originalname.replace(/\s+/g,'_')}`, file.mimetype);
        jobData.descriptionFile = url;
      }
    }

    const newJob = new salesPanel(jobData);
    await newJob.save();



    res.status(201).json({ message: 'Job opening created successfully', job: newJob });
  } catch (error) {
    console.error('Error in createJobOpening:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};



// UPDATE JOB OPENING
const updateJobOpening = async (req, res) => {
  try {
    const job = await salesPanel.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: 'You are not allowed to edit this job' });
    }

    let updateData = { ...req.body };

    if (req.files) {
      if (req.files.agreementSigned?.[0]) {
        const file = req.files.agreementSigned[0];
        const filename = `agreement_signed/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToS3(file.buffer, filename, file.mimetype);
        updateData.agreementSigned = url;
      }

      if (req.files.descriptionFile?.[0]) {
        const file = req.files.descriptionFile[0];
        const filename = `description_files/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToS3(file.buffer, filename, file.mimetype);
        updateData.descriptionFile = url;
      }
    }

    if (!updateData.description) {
      delete updateData.description;
    }

    const updatedJob = await salesPanel.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });



    res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    console.error('Error in updateJobOpening:', error);
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
      jobTiming,
      gender,
      remarks,
      agreementSigned,
      //description,
      descriptionFile,
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
      jobTiming,
      gender,
      remarks,
      agreementSigned,
      //description,
      descriptionFile,
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

    if (req.user.role === 'admin' || req.user.role === 'teamleader') {
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



// DELETE JOB OPENING
const deleteJobOpening = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if user has permission
    const allowedRoles = ['admin', 'teamleader', 'Sales', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to delete job openings.' });
    }

    // Check if the job exists
    const job = await salesPanel.findById(id);
    if (!job) {
      return res.status(404).json({ message: 'Job opening not found' });
    }

    // Check if the user is the creator or admin
    if (req.user.role !== 'admin' && req.user.role !== 'teamleader' && job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own job openings' });
    }

    // Delete the job
    await salesPanel.findByIdAndDelete(id);
    
    res.status(200).json({ message: 'Job opening deleted successfully' });
  } catch (error) {
    console.error('Error deleting job opening:', error);
    res.status(500).json({ message: 'Error deleting job opening', error: error.message });
  }
};


const getLeadsBySalesId = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Check if ID exists
    if (!id || id === 'undefined') {
      return res.status(400).json({ message: 'Sales user ID is required' });
    }

    // Convert to ObjectId
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(id);
    } catch (e) {
      return res.status(400).json({ message: 'Invalid sales user ID format' });
    }

    // Find leads
    const leads = await salesPanel.find({ createdBy: objectId });
    res.status(200).json(leads);
    
  } catch (error) {
    console.error('Error in getLeadsBySalesId:', error);
    res.status(500).json({ 
      message: 'Error fetching leads', 
      error: error.message 
    });
  }
};

module.exports = {
  createJobOpening,
  deleteJobOpening,
  getMySales,
  updateJobOpening,
  saveConvertedJob,
  getConvertedJobs,
  getAssignedjob,
  addMultipleCandidates,
  createReschedule,
  getLeadsBySalesId
};
