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

    const [salesRaw, jobOpeningsRaw, reschedulesRaw, companies] = await Promise.all([
      salesPanel.find(salesQuery).populate('createdBy', 'firstName lastName'),
      // Also fetch jobs created by this Sales user from JobOpenings model
      JobOpenings.find(salesQuery).populate('createdBy', 'firstName lastName role'),
      RescheduledMeeting.find(salesQuery).populate('salesId').populate('createdBy', 'firstName lastName'),
      CompanyCreate.find({})
    ]);

    // Create a map of companies by companyId for fast lookup
    const companyMap = new Map();
    companies.forEach(co => {
      if (co.companyId) {
        companyMap.set(Number(co.companyId), co);
      }
    });

    const enrichWithCompanyDetails = (saleObj) => {
      if (!saleObj.companyId) return saleObj;
      const co = companyMap.get(Number(saleObj.companyId));
      if (!co) return saleObj;

      // Map company-level fields (prefer CompanyCreate, fallback to sale fields)
      saleObj.co_industries = co.industries || saleObj.industries || '';
      saleObj.co_companyAddress = co.companyAddress || saleObj.companyAddress || '';
      saleObj.co_area = co.area || saleObj.Area || '';
      saleObj.co_city = co.city || '';
      saleObj.co_contactPerson = co.contactPerson || saleObj.contactName || '';
      saleObj.co_contactNumber2 = co.contactNumber2 || '';
      saleObj.co_email = co.email || saleObj.email || '';
      saleObj.co_websiteUrl = co.websiteUrl || saleObj.websiteURL || '';
      saleObj.co_gpsLocation = co.gpsLocation || '';
      saleObj.co_gstUpload = co.gstUpload || saleObj.gstUpload || '';
      saleObj.co_agreementUpload = co.agreementUpload || saleObj.agreementSigned || '';
      saleObj.co_tokenAmount = co.tokenAmount || null;

      // Map branch-level fields
      if (saleObj.branchId) {
        const br = co.branches?.find(b => b._id.toString() === saleObj.branchId.toString());
        if (br) {
          saleObj.br_branchName = br.branchName || saleObj.branchName || '';
          saleObj.br_branchAddress = br.branchAddress || '';
          saleObj.br_city = br.city || '';
          saleObj.br_area = br.area || '';
          saleObj.br_contactPerson = br.contactPerson || '';
          saleObj.br_contactNumber = br.contactNumber || '';
          saleObj.br_email = br.email || '';
          saleObj.br_gpsLocation = br.gpsLocation || '';
        } else {
          saleObj.br_branchName = saleObj.branchName || '';
          saleObj.br_branchAddress = '';
          saleObj.br_city = '';
          saleObj.br_area = '';
          saleObj.br_contactPerson = '';
          saleObj.br_contactNumber = '';
          saleObj.br_email = '';
          saleObj.br_gpsLocation = '';
        }
      } else {
        saleObj.br_branchName = saleObj.branchName || '';
        saleObj.br_branchAddress = '';
        saleObj.br_city = '';
        saleObj.br_area = '';
        saleObj.br_contactPerson = '';
        saleObj.br_contactNumber = '';
        saleObj.br_email = '';
        saleObj.br_gpsLocation = '';
      }

      return saleObj;
    };

    const sales = salesRaw.map(s => enrichWithCompanyDetails(s.toObject()));

    // Enrich JobOpenings data (new Sales-created jobs) with company details
    const jobOpenings = jobOpeningsRaw
      .filter(j => j.createdBy?.role === 'Sales') // Only Sales-created jobs from JobOpenings
      .map(j => {
        const obj = enrichWithCompanyDetails(j.toObject());
        obj._source = 'jobOpenings'; // Mark source for update/delete routing
        return obj;
      });

    // Merge original sales and reschedules into one array
    const formattedReschedules = reschedulesRaw
    .filter(r => r.salesId) // only include if salesId is populated
    .map(r => {
      const saleObj = enrichWithCompanyDetails(r.salesId.toObject());
      return {
        ...saleObj,
        _id: r._id, // use reschedule id
        createdAt: r.createdAt,
        rescheduledDate: r.newDate,
        rescheduleReason: r.reason,
        isRescheduled: true
      };
    });

    const allRows = [...sales, ...jobOpenings, ...formattedReschedules];

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

    if (!req.files || !req.files.descriptionFile?.[0]) {
      return res.status(400).json({ message: 'Job Description PDF is required' });
    }

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
      approvalStatus: 'Pending', // Sales jobs always start as Pending
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

    // Save directly to JobOpenings model (Admin will approve/reject)
    const newJob = new JobOpenings(jobData);
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
    let job = await salesPanel.findById(req.params.id);
    let isJobOpeningModel = false;
    if (!job) {
      job = await JobOpenings.findById(req.params.id);
      if (!job) return res.status(404).json({ message: 'Job not found' });
      isJobOpeningModel = true;
    }

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

    let updatedJob;
    if (isJobOpeningModel) {
      updatedJob = await JobOpenings.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
    } else {
      updatedJob = await salesPanel.findByIdAndUpdate(req.params.id, updateData, {
        new: true,
        runValidators: true,
      });
    }



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
    let job = await salesPanel.findById(id);
    let isJobOpeningModel = false;
    if (!job) {
      job = await JobOpenings.findById(id);
      if (!job) {
        return res.status(404).json({ message: 'Job opening not found' });
      }
      isJobOpeningModel = true;
    }

    // Check if the user is the creator or admin
    if (req.user.role !== 'admin' && req.user.role !== 'teamleader' && job.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'You can only delete your own job openings' });
    }

    // Delete the job
    if (isJobOpeningModel) {
      await JobOpenings.findByIdAndDelete(id);
    } else {
      await salesPanel.findByIdAndDelete(id);
    }
    
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
