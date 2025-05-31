// controllers/jobController.js

const JobOpenings = require('../models/jobopennings.modal');
const { uploadToGCS } = require('../middleware/gcsMulter');
const Company = require('../models/company.model');






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
    let company = await Company.findOne({ companyName });

    // 2. If company does not exist, create new with incremented companyId
    if (!company) {
      // Find last companyId
      const lastCompany = await Company.findOne({}).sort({ companyId: -1 }).limit(1);
      let newCompanyId = 10001; // default start

      if (lastCompany && lastCompany.companyId) {
        newCompanyId = lastCompany.companyId + 1;
      }

      company = new Company({
        companyName,
        companyId: newCompanyId,
      });

      await company.save();
    }

    // 3. Use company.companyId to create job
    const jobData = {
      ...req.body,
      companyId: company.companyId,
      createdBy: req.user._id,
    };

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

    const newJob = new JobOpenings(jobData);
    await newJob.save();

    res.status(201).json({ message: 'Job opening created successfully', job: newJob });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

const updateJobOpening = async (req, res) => {
  try {
    const job = await JobOpenings.findById(req.params.id);
    if (!job) return res.status(404).json({ message: 'Job not found' });

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allowed to edit this job' });
    }

    let updateData = { ...req.body };
    if (!updateData.assignedHR) updateData.assignedHR = null;

    // ✅ File uploads logic from updateJobSales
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

    // Description file overwrite prevention
    if (!updateData.description) {
      delete updateData.description;
    }

    // ✅ HR assignment logic this section is for hr assingment logic
    const isHRAssignedFirstTime = !job.assignedHR && updateData.assignedHR;
    const isHRChanged = updateData.assignedHR && job.assignedHR && updateData.assignedHR.toString() !== job.assignedHR.toString();

    if (isHRAssignedFirstTime || isHRChanged) {
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(startDate.getDate() + 10);

      updateData.startDate = startDate;
      updateData.endDate = endDate;
    }

    // ✅ Late by days calculation days section in which calculation of days is done 
    if (updateData.completionDate) {
      const completionDate = new Date(updateData.completionDate);
      const expectedEndDate = job.endDate || new Date(job.startDate.getTime() + 10 * 86400000);
      const diffInMs = completionDate - expectedEndDate;
      const lateByDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
      updateData.lateByDays = lateByDays > 0 ? lateByDays : 0;
    }

    // ✅ Final update
    const updatedJob = await JobOpenings.findByIdAndUpdate(req.params.id, updateData, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job', error: error.message });
  }
};



// controllers/jobController.js

const getAllJobOpenings = async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admin can view all job openings' });
    }

    const jobs = await JobOpenings.find()
      .populate('createdBy', 'firstName lastName email role')
      .populate('assignedHR', 'firstName lastName email role')
      .sort({ createdAt: -1 });

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};





// controllers/jobController.js

const getMyJobs = async (req, res) => {
  try {
    const jobs = await JobOpenings.find({ createdBy: req.user._id });
    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch jobs', error: error.message });
  }
};





// const updateJobOpening = async (req, res) => {
//   try {
//     const job = await JobOpenings.findById(req.params.id);

//     if (!job) {
//       return res.status(404).json({ message: 'Job not found' });
//     }

//     if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'You are not allowed to edit this job' });
//     }

//     const { assignedHR } = req.body;

// if (!assignedHR) {
//   req.body.assignedHR = null;
// }

//     let updateData = { ...req.body };

//     if (req.file) {
//       const filePath = `/uploads/job_pdfs/${req.file.filename}`;
//       updateData.description = filePath; // Replace old description with new file path
//     } else if (updateData.description) {
//       // If description exists in body (text input), remove it when no PDF is uploaded
//       delete updateData.description;
//     }



//     // ✅ HR change detect karo
//    // Check if HR is being assigned or changed
// const isHRAssignedFirstTime = !job.assignedHR && updateData.assignedHR;
// const isHRChanged = updateData.assignedHR && job.assignedHR && updateData.assignedHR.toString() !== job.assignedHR.toString();

// if (isHRAssignedFirstTime || isHRChanged) {
//   const startDate = new Date();
//   const endDate = new Date();
//   endDate.setDate(startDate.getDate() + 10);

//   updateData.startDate = startDate;
//   updateData.endDate = endDate;
// }


//     // ✅ completionDate update par lateByDays calculate karo
//     if (updateData.completionDate) {
//       const completionDate = new Date(updateData.completionDate);
//       const expectedEndDate = job.endDate || new Date(job.startDate.getTime() + 10 * 86400000);

//       const diffInMs = completionDate - expectedEndDate;
//       const lateByDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));

//       updateData.lateByDays = lateByDays > 0 ? lateByDays : 0;
//     }

//     const updatedJob = await JobOpenings.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update job', error: error.message });
//   }
// };

// const updateJobOpening = async (req, res) => {
//   try {
//     const job = await JobOpenings.findById(req.params.id);
//     if (!job) return res.status(404).json({ message: 'Job not found' });

//     if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
//       return res.status(403).json({ message: 'You are not allowed to edit this job' });
//     }

//     let updateData = { ...req.body };
//     if (!updateData.assignedHR) updateData.assignedHR = null;

//     if (req.file) {
//       // Upload new file to GCS
//       const filename = `job_pdfs/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
//       const publicUrl = await uploadToGCS(req.file.buffer, filename, req.file.mimetype);
//       updateData.description = publicUrl; // Update description with new GCS URL
//     } else if (updateData.description) {
//       // Agar description form se aaya ho aur file nahi, toh remove it to avoid overwrite
//       delete updateData.description;
//     }

//     // HR assignment logic, dates, lateByDays calculation remain same
//     const isHRAssignedFirstTime = !job.assignedHR && updateData.assignedHR;
//     const isHRChanged = updateData.assignedHR && job.assignedHR && updateData.assignedHR.toString() !== job.assignedHR.toString();

//     if (isHRAssignedFirstTime || isHRChanged) {
//       const startDate = new Date();
//       const endDate = new Date();
//       endDate.setDate(startDate.getDate() + 10);

//       updateData.startDate = startDate;
//       updateData.endDate = endDate;
//     }

//     if (updateData.completionDate) {
//       const completionDate = new Date(updateData.completionDate);
//       const expectedEndDate = job.endDate || new Date(job.startDate.getTime() + 10 * 86400000);
//       const diffInMs = completionDate - expectedEndDate;
//       const lateByDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
//       updateData.lateByDays = lateByDays > 0 ? lateByDays : 0;
//     }

//     const updatedJob = await JobOpenings.findByIdAndUpdate(req.params.id, updateData, {
//       new: true,
//       runValidators: true,
//     });

//     res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
//   } catch (error) {
//     res.status(500).json({ message: 'Failed to update job', error: error.message });
//   }
// };


const getAllSales = async (req, res) => {
  try {
    const salesData = await JobOpenings.find()
      .populate('assignedHR', 'firstName lastName') // yeh User model se data uthayega
      .sort({ date: -1 });

    const formattedSales = salesData.map((sale) => {
      const saleObj = sale.toObject();
      if (saleObj.assignedHR) {
        saleObj.hrName = `${saleObj.assignedHR.firstName} ${saleObj.assignedHR.lastName}`;
      } else {
        saleObj.hrName = null;
      }
      return saleObj;
    });

    res.status(200).json(formattedSales);
  } catch (error) {
    console.error('Error fetching sales data:', error.message);
    res.status(500).json({ message: 'Server Error while fetching sales data' });
  }
};



const deleteJobOpening = async (req, res) => {
  try {
    const job = await JobOpenings.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only creator or admin can delete
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allowed to delete this job' });
    }

    await JobOpenings.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Job deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete job', error: error.message });
  }
};


const toggleJobStatus = async (req, res) => {
  try {
    const job = await JobOpenings.findById(req.params.id);

    if (!job) {
      return res.status(404).json({ message: 'Job not found' });
    }

    // Only creator or admin can toggle status
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({ message: 'You are not allowed to change this job status' });
    }

    // Toggle between Open and Closed this section is for form toggle so that it will not close by clicking any where
    const newStatus = job.jobStatus === 'Open' ? 'Closed' : 'Open';

    const updatedJob = await JobOpenings.findByIdAndUpdate(
      req.params.id,
      { jobStatus: newStatus },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: `Job status updated to ${newStatus} successfully`,
      job: updatedJob
    });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job status', error: error.message });
  }
};

const getUniqueIndustries = async (req, res) => {
  try {
    const industries = await JobOpenings.distinct('industries');
    const filteredIndustries = industries.filter(ind => ind && ind.trim() !== ''); // Remove empty/null
    res.status(200).json(filteredIndustries);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching industries', error });
  }
};

module.exports = {
  createJobOpening,
  getAllJobOpenings,
  getMyJobs,
  getAllSales,
  updateJobOpening,
  deleteJobOpening,
  toggleJobStatus,
  getUniqueIndustries
};