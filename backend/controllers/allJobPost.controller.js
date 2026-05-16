// controllers/jobController.js
const JobOpenings = require('../models/jobopennings.modal');
const { uploadToS3 } = require('../middleware/gcsMulter');

const mongoose = require('mongoose');






const createJobOpening = async (req, res) => {
  try {
    const allowedRoles = ['admin', 'teamleader', 'Sales', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to create job openings.' });
    }

    let { assignedHR, companyName, companyId } = req.body;

    if (!companyName) return res.status(400).json({ message: 'companyName is required' });
    if (!companyId) return res.status(400).json({ message: 'companyId is required' });

    // Handle assignedHR
    if (assignedHR) {
      try {
        if (typeof assignedHR === 'string') {
          assignedHR = assignedHR.startsWith('[') || assignedHR.startsWith('{')
            ? JSON.parse(assignedHR)
            : [assignedHR];
        }
        if (!Array.isArray(assignedHR)) assignedHR = [assignedHR];
        assignedHR = assignedHR.map(hr => {
          if (typeof hr === 'string' && /^[0-9a-fA-F]{24}$/.test(hr)) return new mongoose.Types.ObjectId(hr);
          if (hr && typeof hr === 'object' && hr._id) return new mongoose.Types.ObjectId(hr._id);
          return null;
        }).filter(Boolean);
        if (assignedHR.length === 0) assignedHR = undefined;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid assignedHR format' });
      }
    }

    // Handle assignedTL
    let { assignedTL } = req.body;
    if (assignedTL) {
      try {
        if (typeof assignedTL === 'string') {
          assignedTL = assignedTL.startsWith('[') || assignedTL.startsWith('{')
            ? JSON.parse(assignedTL)
            : [assignedTL];
        }
        if (!Array.isArray(assignedTL)) assignedTL = [assignedTL];
        assignedTL = assignedTL.map(tl => {
          if (typeof tl === 'string' && /^[0-9a-fA-F]{24}$/.test(tl)) return new mongoose.Types.ObjectId(tl);
          if (tl && typeof tl === 'object' && tl._id) return new mongoose.Types.ObjectId(tl._id);
          return null;
        }).filter(Boolean);
        if (assignedTL.length === 0) assignedTL = undefined;
      } catch (err) {
        return res.status(400).json({ message: 'Invalid assignedTL format' });
      }
    }

    // Build job data — companyId comes directly from CompanyCreate model selection
    const jobData = {
      ...req.body,
      assignedHR,
      assignedTL,
      companyName: companyName.trim(),
      companyId: Number(companyId),
    };

    // Set createdBy
    if (req.user?._id) {
      jobData.createdBy = req.user._id.toString();
    }

    // File uploads
    if (req.files?.descriptionFile?.[0]) {
      const f = req.files.descriptionFile[0];
      jobData.descriptionFile = await uploadToS3(f.buffer, `description_files/${Date.now()}-${f.originalname.replace(/\s+/g, '_')}`, f.mimetype);
    }
    if (req.files?.agreementSigned?.[0]) {
      const f = req.files.agreementSigned[0];
      jobData.agreementSigned = await uploadToS3(f.buffer, `agreement_signed/${Date.now()}-${f.originalname.replace(/\s+/g, '_')}`, f.mimetype);
    }
    if (req.files?.gstUpload?.[0]) {
      const f = req.files.gstUpload[0];
      jobData.gstUpload = await uploadToS3(f.buffer, `gst_uploads/${Date.now()}-${f.originalname.replace(/\s+/g, '_')}`, f.mimetype);
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

    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: 'You are not allowed to edit this job' });
    }

    let updateData = { ...req.body };

    // Handle createdBy field - ensure it's always a string ID or not modified
    if (req.body.createdBy) {
      try {
        let createdByValue = req.body.createdBy;
        console.log('Processing createdBy value:', createdByValue); // Debug log

        // If it's an object with _id, use that
        if (createdByValue && typeof createdByValue === 'object' && createdByValue._id) {
          // Only allow admin to change createdBy
          if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
            console.log('Non-admin attempt to modify createdBy'); // Debug log
            return res.status(403).json({ message: 'Only admin can modify createdBy field' });
          }
          updateData.createdBy = createdByValue._id.toString();
          console.log('Set createdBy from object._id:', updateData.createdBy); // Debug log
        }
        // If it's a string that looks like a JSON object, parse it
        else if (typeof createdByValue === 'string' && createdByValue.startsWith('{')) {
          try {
            createdByValue = JSON.parse(createdByValue);
            if (createdByValue && createdByValue._id) {
              // Only allow admin to change createdBy
              if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
                console.log('Non-admin attempt to modify createdBy (parsed JSON)'); // Debug log
                return res.status(403).json({ message: 'Only admin can modify createdBy field' });
              }
              updateData.createdBy = createdByValue._id.toString();
              console.log('Set createdBy from parsed JSON:', updateData.createdBy); // Debug log
            }
          } catch (parseErr) {
            console.warn('Error parsing createdBy JSON:', parseErr);
            delete updateData.createdBy;
          }
        }
        // If it's a valid ObjectId string
        else if (typeof createdByValue === 'string' && /^[0-9a-fA-F]{24}$/.test(createdByValue)) {
          // Only allow admin to change createdBy
          if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
            console.log('Non-admin attempt to modify createdBy (string ID)'); // Debug log
            return res.status(403).json({ message: 'Only admin can modify createdBy field' });
          }
          updateData.createdBy = createdByValue; // Store as string
          console.log('Set createdBy from string ID:', updateData.createdBy); // Debug log
        }
        // If it's an empty string or null/undefined, remove it from update data
        else if (!createdByValue) {
          console.log('Removing empty createdBy value'); // Debug log
          delete updateData.createdBy;
        }
        // If it's some other format, log it but don't fail
        else {
          console.warn('Unexpected createdBy format, preserving existing value:', createdByValue);
          delete updateData.createdBy;
        }
      } catch (err) {
        console.warn('Error processing createdBy, preserving existing value:', err);
        delete updateData.createdBy;
      }
    } else {
      // Ensure createdBy is not modified if not explicitly provided
      delete updateData.createdBy;
    }



    // Handle assignedHR - accept single HR, array of HRs, or null
    if (req.body.assignedHR !== undefined) {
      try {
        let assignedHR = req.body.assignedHR;

        // If it's a string, try to parse it as JSON first
        if (typeof assignedHR === 'string') {
          if (assignedHR.startsWith('{') || assignedHR.startsWith('[')) {
            try {
              assignedHR = JSON.parse(assignedHR);
            } catch (err) {
              console.error('Error parsing assignedHR JSON:', err);
              return res.status(400).json({ message: 'Invalid assignedHR format' });
            }
          } else {
            // If it's a single ID string, convert to array with one element
            assignedHR = [assignedHR];
          }
        }

        // Handle null/empty cases
        if (assignedHR === null || assignedHR === 'none' || assignedHR === '') {
          updateData.assignedHR = [];
        }
        // Handle array of HRs
        else if (Array.isArray(assignedHR)) {
          // Convert all elements to ObjectId
          updateData.assignedHR = assignedHR.map(hr => {
            if (typeof hr === 'string' && /^[0-9a-fA-F]{24}$/.test(hr)) {
              return new mongoose.Types.ObjectId(hr);
            } else if (hr && typeof hr === 'object' && hr._id) {
              return new mongoose.Types.ObjectId(hr._id);
            }
            return null;
          }).filter(Boolean); // Remove any null/undefined values

          // If no valid HRs were found, set to empty array
          if (updateData.assignedHR.length === 0) {
            updateData.assignedHR = [];
          }
        }
        // Handle single HR object
        else if (typeof assignedHR === 'object' && assignedHR._id) {
          updateData.assignedHR = [new mongoose.Types.ObjectId(assignedHR._id)];
        }
        // Handle single HR string ID
        else if (typeof assignedHR === 'string' && /^[0-9a-fA-F]{24}$/.test(assignedHR)) {
          updateData.assignedHR = [new mongoose.Types.ObjectId(assignedHR)];
        }
        else {
          return res.status(400).json({
            message: 'Invalid assignedHR format. Must be a valid user ID, array of user IDs, or null'
          });
        }
      } catch (err) {
        console.error('Error processing assignedHR:', err);
        return res.status(400).json({ message: 'Invalid assignedHR format' });
      }
    }

    // Handle assignedTL - accept single TL, array of TLs, or null
    if (req.body.assignedTL !== undefined) {
      try {
        let assignedTL = req.body.assignedTL;

        // If it's a string, try to parse it as JSON first
        if (typeof assignedTL === 'string') {
          if (assignedTL.startsWith('{') || assignedTL.startsWith('[')) {
            try {
              assignedTL = JSON.parse(assignedTL);
            } catch (err) {
              console.error('Error parsing assignedTL JSON:', err);
              return res.status(400).json({ message: 'Invalid assignedTL format' });
            }
          } else {
            // If it's a single ID string, convert to array with one element
            assignedTL = [assignedTL];
          }
        }

        // Handle null/empty cases
        if (assignedTL === null || assignedTL === 'none' || assignedTL === '') {
          updateData.assignedTL = [];
        }
        // Handle array of TLs
        else if (Array.isArray(assignedTL)) {
          // Convert all elements to ObjectId
          updateData.assignedTL = assignedTL.map(tl => {
            if (typeof tl === 'string' && /^[0-9a-fA-F]{24}$/.test(tl)) {
              return new mongoose.Types.ObjectId(tl);
            } else if (tl && typeof tl === 'object' && tl._id) {
              return new mongoose.Types.ObjectId(tl._id);
            }
            return null;
          }).filter(Boolean); // Remove any null/undefined values

          // If no valid TLs were found, set to empty array
          if (updateData.assignedTL.length === 0) {
            updateData.assignedTL = [];
          }
        }
        // Handle single TL object
        else if (typeof assignedTL === 'object' && assignedTL._id) {
          updateData.assignedTL = [new mongoose.Types.ObjectId(assignedTL._id)];
        }
        // Handle single TL string ID
        else if (typeof assignedTL === 'string' && /^[0-9a-fA-F]{24}$/.test(assignedTL)) {
          updateData.assignedTL = [new mongoose.Types.ObjectId(assignedTL)];
        }
        else {
          return res.status(400).json({
            message: 'Invalid assignedTL format. Must be a valid user ID, array of user IDs, or null'
          });
        }
      } catch (err) {
        console.error('Error processing assignedTL:', err);
        return res.status(400).json({ message: 'Invalid assignedTL format' });
      }
    }


    // ✅ File uploads logic from updateJobSales
    if (req.files) {
      if (req.files.agreementSigned && req.files.agreementSigned[0]) {
        const file = req.files.agreementSigned[0];
        const filename = `agreement_signed/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToS3(file.buffer, filename, file.mimetype);
        updateData.agreementSigned = url;
      }

      if (req.files.descriptionFile && req.files.descriptionFile[0]) {
        const file = req.files.descriptionFile[0];
        const filename = `description_files/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToS3(file.buffer, filename, file.mimetype);
        updateData.descriptionFile = url;
      }
    }

    if (req.files) {
      if (req.files.gstUpload && req.files.gstUpload[0]) {
        const file = req.files.gstUpload[0];
        const filename = `gst_uploads/${Date.now()}-${file.originalname.replace(/\s+/g, '_')}`;
        const url = await uploadToS3(file.buffer, filename, file.mimetype);
        updateData.gstUpload = url;
      }
    }

    // Description file overwrite prevention
    if (!updateData.description) {
      delete updateData.description;
    }

    // HR assignment logic - update dates when HR is assigned or changed
    if (updateData.assignedHR !== undefined) {
      const isHRAssignedFirstTime = !job.assignedHR && updateData.assignedHR;
      const isHRChanged = updateData.assignedHR &&
        job.assignedHR &&
        updateData.assignedHR.toString() !== job.assignedHR.toString();
      const isHRRemoved = !updateData.assignedHR && job.assignedHR;

      if (isHRAssignedFirstTime || isHRChanged) {
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(startDate.getDate() + 10);

        updateData.startDate = startDate;
        updateData.endDate = endDate;
      } else if (isHRRemoved) {
        // Clear the dates if HR is removed
        updateData.startDate = null;
        updateData.endDate = null;
      }
    }

    // ✅ Late by days calculation days section in which calculation of days is done 
    if (updateData.completionDate) {
      const completionDate = new Date(updateData.completionDate);
      const expectedEndDate = job.endDate || new Date(job.startDate.getTime() + 10 * 86400000);
      const diffInMs = completionDate - expectedEndDate;
      const lateByDays = Math.ceil(diffInMs / (1000 * 60 * 60 * 24));
      updateData.lateByDays = lateByDays > 0 ? lateByDays : 0;
    }

    // ✅ Auto-reopen job if requirements are increased
    if (updateData.numberOfRequirements !== undefined) {
      const newReq = Number(updateData.numberOfRequirements);
      const oldReq = Number(job.numberOfRequirements || 0);
      if (newReq > oldReq && job.jobStatus === 'Closed') {
        updateData.jobStatus = 'Open';
        // Clear hold reason if it was set
        updateData.holdReason = '';
      }
    }

    // ✅ Final update
    // const updatedJob = await JobOpenings.findByIdAndUpdate(req.params.id, updateData, {
    //   new: true,
    //   runValidators: true,
    // });

    const updatedJob = await JobOpenings.findByIdAndUpdate(
      req.params.id,
      { $set: updateData },  // ✅ `$set` will **replace** the assignedHR array
      {
        new: true,
        runValidators: true,
      }
    );


    res.status(200).json({ message: 'Job updated successfully', job: updatedJob });
  } catch (error) {
    res.status(500).json({ message: 'Failed to update job', error: error.message });
  }
};





// controllers/jobController.js

const getAllJobOpenings = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: 'Only admin or team leader can view all job openings' });
    }

    // Aggregate: join CompanyCreate by companyId, flatten company + branch fields
    const jobs = await JobOpenings.aggregate([
      { $sort: { createdAt: -1 } },

      // ── Lookup CompanyCreate by companyId ──────────────────────────────────
      {
        $lookup: {
          from: 'companycreates',          // MongoDB collection name (model 'CompanyCreate')
          localField: 'companyId',
          foreignField: 'companyId',
          as: '_companyData',
        },
      },
      {
        $addFields: {
          _company: { $arrayElemAt: ['$_companyData', 0] },
        },
      },

      // ── Flatten company fields (prefer stored job fields for old data) ─────
      {
        $addFields: {
          // Company-level fields — use CompanyCreate value if job field is empty
          co_industries: { $ifNull: ['$_company.industries', '$industries'] },
          co_companyAddress: { $ifNull: ['$_company.companyAddress', '$companyAddress'] },
          co_area: { $ifNull: ['$_company.area', '$Area'] },
          co_city: { $ifNull: ['$_company.city', ''] },
          co_contactPerson: { $ifNull: ['$_company.contactPerson', '$contactName'] },
          co_contactNumber2: { $ifNull: ['$_company.contactNumber2', ''] },
          co_email: { $ifNull: ['$_company.email', '$email'] },
          co_websiteUrl: { $ifNull: ['$_company.websiteUrl', '$websiteURL'] },
          co_gpsLocation: { $ifNull: ['$_company.gpsLocation', ''] },
          co_gstUpload: { $ifNull: ['$_company.gstUpload', '$gstUpload'] },
          co_agreementUpload: { $ifNull: ['$_company.agreementUpload', '$agreementSigned'] },
          co_tokenAmount: { $ifNull: ['$_company.tokenAmount', null] },

          // Branch — find the matching branch subdoc by branchId
          _branch: {
            $cond: {
              if: { $and: [{ $ne: ['$branchId', null] }, { $ne: ['$branchId', ''] }] },
              then: {
                $arrayElemAt: [
                  {
                    $filter: {
                      input: { $ifNull: ['$_company.branches', []] },
                      as: 'b',
                      cond: { $eq: [{ $toString: '$$b._id' }, '$branchId'] },
                    },
                  },
                  0,
                ],
              },
              else: null,
            },
          },
        },
      },

      // ── Flatten branch fields ──────────────────────────────────────────────
      {
        $addFields: {
          br_branchName: { $ifNull: ['$_branch.branchName', '$branchName'] },
          br_branchAddress: { $ifNull: ['$_branch.branchAddress', ''] },
          br_city: { $ifNull: ['$_branch.city', ''] },
          br_area: { $ifNull: ['$_branch.area', ''] },
          br_contactPerson: { $ifNull: ['$_branch.contactPerson', ''] },
          br_contactNumber: { $ifNull: ['$_branch.contactNumber', ''] },
          br_email: { $ifNull: ['$_branch.email', ''] },
          br_gpsLocation: { $ifNull: ['$_branch.gpsLocation', ''] },
        },
      },

      // ── Clean up temp fields ───────────────────────────────────────────────
      { $unset: ['_companyData', '_company', '_branch'] },

      // ── Populate assignedHR and createdBy ──────────────────────────────────
      {
        $lookup: {
          from: 'users',
          localField: 'assignedHR',
          foreignField: '_id',
          as: 'assignedHR',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1, role: 1 } }],
        },
      },
      {
        $lookup: {
          from: 'users',
          localField: 'createdBy',
          foreignField: '_id',
          as: '_createdByArr',
          pipeline: [{ $project: { firstName: 1, lastName: 1, email: 1, role: 1 } }],
        },
      },
      {
        $addFields: {
          createdBy: { $arrayElemAt: ['$_createdByArr', 0] },
        },
      },
      { $unset: '_createdByArr' },

      // ── Fulfilled count: candidates with selectionDate set ─────────────────
      {
        $lookup: {
          from: 'candidateapplications',
          let: { jobId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $and: [
                    { $eq: ['$jobId', '$$jobId'] },
                    { $ne: ['$selectionDate', null] },
                    { $gt: ['$selectionDate', new Date('1970-01-01')] },
                  ],
                },
              },
            },
            { $count: 'total' },
          ],
          as: '_fulfilledArr',
        },
      },
      {
        $addFields: {
          fulfilledCount: {
            $ifNull: [{ $arrayElemAt: ['$_fulfilledArr.total', 0] }, 0],
          },
        },
      },
      { $unset: '_fulfilledArr' },
    ]);

    // ── Auto-close stale jobs: Open jobs whose requirements are fully met ────
    const staleOpenJobs = jobs.filter(
      (j) =>
        j.jobStatus === 'Open' &&
        j.numberOfRequirements > 0 &&
        j.fulfilledCount >= j.numberOfRequirements
    );

    if (staleOpenJobs.length > 0) {
      const staleIds = staleOpenJobs.map((j) => j._id);
      await JobOpenings.updateMany(
        { _id: { $in: staleIds } },
        { $set: { jobStatus: 'Closed' } }
      );
      // Also update the in-memory response so the frontend gets the correct status
      for (const job of jobs) {
        if (staleIds.some((id) => id.toString() === job._id.toString())) {
          job.jobStatus = 'Closed';
        }
      }
      console.log(`✅ Auto-closed ${staleOpenJobs.length} stale job(s):`, staleIds);
    }

    res.status(200).json(jobs);
  } catch (error) {
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};





// controllers/jobController.js

const getMyJobs = async (req, res) => {
  try {
    // Tenure filter — only show jobs created during current tenure
    const tenureFilter = req.user.tenureStartedAt
      ? { createdAt: { $gte: new Date(req.user.tenureStartedAt) } }
      : {};

    const jobs = await JobOpenings.find({
      createdBy: req.user._id,
      jobStatus: 'Open',
      ...tenureFilter,
    }).sort({ createdAt: -1 });
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

//     if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'teamleader') {
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

//     if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'teamleader') {
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
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'teamleader') {
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

    // Only creator or admin can change status
    if (job.createdBy.toString() !== req.user._id.toString() && req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: 'You are not allowed to change this job status' });
    }

    // If a target status is provided in body, use it; otherwise toggle Open <-> Closed
    const allowed = ['Open', 'Closed', 'OnHold'];
    let newStatus;
    if (req.body?.status && allowed.includes(req.body.status)) {
      newStatus = req.body.status;
    } else {
      // legacy toggle: Open -> Closed, anything else -> Open
      newStatus = job.jobStatus === 'Open' ? 'Closed' : 'Open';
    }

    const updateFields = { jobStatus: newStatus };
    // Save hold reason when putting on hold; clear it when reopening
    if (newStatus === 'OnHold') {
      updateFields.holdReason = req.body?.holdReason || '';
    } else if (newStatus === 'Open') {
      updateFields.holdReason = '';
    }

    const updatedJob = await JobOpenings.findByIdAndUpdate(
      req.params.id,
      { $set: updateFields },
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
  getUniqueIndustries,

};