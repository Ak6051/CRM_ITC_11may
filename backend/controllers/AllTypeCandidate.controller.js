const { uploadToS3 } = require('../middleware/gcsMulter');
const Candidate = require('../models/candidateModal');
const CandidateApplication = require('../models/CandidateApplication.model');
const JobOpenings = require('../models/jobopennings.modal');
const mongoose = require('mongoose');


// Create single candidate — saves to Candidate model
const createCandidates = async (req, res) => {
  try {
    const allowedRoles = ['admin', 'teamleader', 'Sales', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to create candidates.' });
    }

    const phoneNumber = typeof req.body.phoneNumber === 'string'
      ? req.body.phoneNumber.trim()
      : String(req.body.phoneNumber || '').trim();

    if (!phoneNumber) {
      return res.status(400).json({ message: 'Phone number is required.' });
    }

    // Duplicate check by phone
    const existing = await Candidate.findOne({ candidatePhone: phoneNumber });
    if (existing) {
      return res.status(409).json({ message: 'Candidate already exists with this phone number.' });
    }

    const jobData = {
      candidateName: typeof req.body.name === 'string' ? req.body.name.trim() : String(req.body.name || '').trim(),
      candidateEmail: typeof req.body.email === 'string' ? req.body.email.trim() : String(req.body.email || '').trim(),
      candidatePhone: phoneNumber,
      positionName: req.body.positionName || '',
      qualification: req.body.qualification || '',
      experience: Number(req.body.experience) || 0,
      currentLocation: req.body.currentLocation || '',
      preferredLocation: req.body.preferredLocation || '',
      currentPosition: req.body.currentPosition || '',
      currentCTC: Number(req.body.currentCTC) || 0,
      expectedCTC: Number(req.body.expectedCTC) || 0,
      noticePeriod: Number(req.body.noticePeriod) || 0,
      reasonforLeaving: req.body.reasonforLeaving || '',
      currentCompany: req.body.currentCompany || '',
      industry: req.body.industry || '',
      gender: req.body.gender || '',
      remark: req.body.remark || '',
      createdBy: req.user._id,
    };

    if (req.file) {
      const filename = `candidates_resume/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      jobData.resumeLink = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
    }

    const newCandidate = new Candidate(jobData);
    await newCandidate.save();

    // ── Handle direct assignment if assignedJobId is provided ──
    if (req.body.assignedJobId) {
      const job = await JobOpenings.findById(req.body.assignedJobId).lean();
      if (job) {
        const app = new CandidateApplication({
          candidateId: newCandidate._id,
          jobId: job._id,
          positionName: job.jobTitle || '',
          createdBy: req.user._id,
          createdByName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
          assignedBy: req.user._id,
          assignedAt: new Date(),
          paymentStatus: 'Pending',
        });
        await app.save();

        // Update the candidate's assignment info
        await Candidate.findByIdAndUpdate(newCandidate._id, {
          $set: {
            jobId: job._id,
            assignedTo: req.user._id,
            assignedPosition: job._id,
            assignedBy: req.user._id,
            assignedAt: new Date(),
          },
        });
      }
    }

    res.status(201).json({ message: 'Candidate created successfully', job: newCandidate });
  } catch (error) {
    console.error('Create Candidate Error:', error);
    res.status(500).json({ message: 'Something went wrong', error: error.message });
  }
};

// Bulk upload candidates — saves to Candidate model
const bulkUploadCandidates = async (req, res) => {
  try {
    const allowedRoles = ['admin', 'teamleader', 'Sales', 'HR'];
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'You are not allowed to perform bulk upload.' });
    }

    const { candidates } = req.body;
    if (!Array.isArray(candidates) || candidates.length === 0) {
      return res.status(400).json({ message: 'No candidate data provided' });
    }

    const userId = req.user._id;

    // We will track skipped phone numbers (both DB duplicates and Excel file duplicates)
    const skippedPhoneNumbers = [];
    const processedCandidatesMap = new Map(); // normalizedPhone -> candidate data

    for (let c of candidates) {
      const rawPhone = typeof c.phoneNumber === 'string' ? c.phoneNumber : String(c.phoneNumber || '');
      const cleanedPhone = rawPhone.replace(/\D/g, '').slice(-10);

      if (!cleanedPhone || cleanedPhone.length !== 10) {
        skippedPhoneNumbers.push(rawPhone || 'invalid');
        continue;
      }

      // Check if this phone number is already present in this Excel upload (self-duplication)
      if (processedCandidatesMap.has(cleanedPhone)) {
        skippedPhoneNumbers.push(rawPhone);
        continue;
      }

      processedCandidatesMap.set(cleanedPhone, c);
    }

    const uniqueIncomingPhones = Array.from(processedCandidatesMap.keys());

    // Check existing by candidatePhone in DB
    const existingCandidates = await Candidate.find({
      candidatePhone: { $in: uniqueIncomingPhones },
    }).select('candidatePhone');

    const existingPhoneSet = new Set(existingCandidates.map(c => c.candidatePhone.trim()));

    const newCandidates = [];

    for (const [cleanedPhone, c] of processedCandidatesMap.entries()) {
      if (existingPhoneSet.has(cleanedPhone)) {
        // Find the original phone number format to return in skipped list
        const rawPhone = typeof c.phoneNumber === 'string' ? c.phoneNumber : String(c.phoneNumber || '');
        skippedPhoneNumbers.push(rawPhone);
        continue;
      }

      newCandidates.push({
        candidateName: typeof c.name === 'string' ? c.name.trim() : String(c.name || '').trim(),
        candidateEmail: typeof c.email === 'string' ? c.email.trim() : String(c.email || '').trim(),
        candidatePhone: cleanedPhone,
        positionName: c.positionName || '',
        qualification: c.qualification || '',
        experience: Number(c.experience) || 0,
        currentLocation: c.currentLocation || '',
        preferredLocation: c.preferredLocation || '',
        currentPosition: c.currentPosition || '',
        currentCTC: Number(c.currentCTC) || 0,
        expectedCTC: Number(c.expectedCTC) || 0,
        noticePeriod: Number(c.noticePeriod) || 0,
        reasonforLeaving: c.reasonforLeaving || '',
        currentCompany: c.currentCompany || '',
        industry: c.industry || '',
        gender: c.gender || '',
        remark: c.remark || '',
        createdBy: userId,
      });
    }

    if (newCandidates.length === 0) {
      return res.status(200).json({
        message: 'All candidates already exist. Skipped import.',
        insertedCount: 0,
        duplicateCount: skippedPhoneNumbers.length,
        skippedPhoneNumbers,
      });
    }

    await Candidate.insertMany(newCandidates);

    return res.status(201).json({
      message: 'Bulk upload completed',
      insertedCount: newCandidates.length,
      duplicateCount: skippedPhoneNumbers.length,
      skippedPhoneNumbers,
    });
  } catch (error) {
    console.error('Bulk upload error:', error);
    res.status(500).json({ message: 'Bulk upload failed', error: error.message });
  }
};

// Update candidate — single Candidate model
const updateCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = { ...req.body };

    // Remove helper fields
    delete updatedData.modelType;
    delete updatedData.createdBy;

    const sanitizeObjectIdField = (field) => {
      if (updatedData[field]) {
        if (typeof updatedData[field] === 'object') {
          delete updatedData[field];
        } else if (typeof updatedData[field] === 'string' && updatedData[field].length !== 24) {
          delete updatedData[field];
        }
      }
    };

    sanitizeObjectIdField('assignedTo');
    sanitizeObjectIdField('assignedPosition');
    sanitizeObjectIdField('assignedBy');
    sanitizeObjectIdField('jobId');

    // Map incoming name/email/phoneNumber → candidateModal field names
    if (updatedData.name !== undefined) {
      updatedData.candidateName = updatedData.name;
      delete updatedData.name;
    }
    if (updatedData.email !== undefined) {
      updatedData.candidateEmail = updatedData.email;
      delete updatedData.email;
    }
    if (updatedData.phoneNumber !== undefined) {
      updatedData.candidatePhone = updatedData.phoneNumber;
      delete updatedData.phoneNumber;
    }

    // Handle resume upload
    if (req.file) {
      const filename = `candidates_resume/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      updatedData.resumeLink = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
    }

    const updatedCandidate = await Candidate.findByIdAndUpdate(
      id,
      { $set: updatedData },
      { new: true }
    );

    if (!updatedCandidate) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    // ── Handle direct assignment if assignedJobId is provided ──
    if (req.body.assignedJobId) {
      const job = await JobOpenings.findById(req.body.assignedJobId).lean();
      if (job) {
        // Check if application already exists
        const existingApp = await CandidateApplication.findOne({
          candidateId: updatedCandidate._id,
          jobId: job._id,
        });

        if (!existingApp) {
          const app = new CandidateApplication({
            candidateId: updatedCandidate._id,
            jobId: job._id,
            positionName: job.jobTitle || '',
            createdBy: req.user._id,
            createdByName: `${req.user.firstName || ''} ${req.user.lastName || ''}`.trim(),
            assignedBy: req.user._id,
            assignedAt: new Date(),
            paymentStatus: 'Pending',
          });
          await app.save();

          // Update the candidate's assignment info
          await Candidate.findByIdAndUpdate(updatedCandidate._id, {
            $set: {
              jobId: job._id,
              assignedTo: req.user._id,
              assignedPosition: job._id,
              assignedBy: req.user._id,
              assignedAt: new Date(),
            },
          });
        }
      }
    }

    res.status(200).json(updatedCandidate);
  } catch (error) {
    console.error('Error updating candidate:', error);
    res.status(500).json({ message: 'Failed to update candidate', error: error.message });
  }
};

// Delete candidate
const deleteCandidate = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Candidate.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: 'Candidate not found' });
    }

    res.status(200).json({ message: 'Candidate deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete candidate', error: error.message });
  }
};

// Get candidates for a specific HR (by hrId param)
const getMyCandidate = async (req, res) => {
  try {
    const hrId = req.params.hrId;

    // Fetch HR user to get their tenureStartedAt
    const hrUser = await mongoose.model('User').findById(hrId).select('tenureStartedAt').lean();
    const tenureFilter = hrUser?.tenureStartedAt
      ? { createdAt: { $gte: new Date(hrUser.tenureStartedAt) } }
      : {};

    const candidates = await Candidate.find({ createdBy: hrId, ...tenureFilter })
      .populate('createdBy', 'firstName lastName')
      .sort({ createdAt: -1 });

    const mapped = candidates.map(c => ({
      ...c._doc,
      name: c.candidateName || '',
      email: c.candidateEmail || '',
      phoneNumber: c.candidatePhone || '',
      resumeLink: c.resumeLink || '',
    }));

    res.status(200).json(mapped);
  } catch (error) {
    console.error('Error fetching candidates by HR:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all candidates (paginated, filtered) — single Candidate model
const getCombinedCandidates = async (req, res) => {
  try {
    if (!['HR', 'admin', 'teamleader'].includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip = (page - 1) * limit;

    const { name, location, createdBy, position, currentPosition, industry, startDate, endDate, minExp, maxExp, minCtc, maxCtc, maxNotice, phone, gender } = req.query;

    // Resolve createdBy filter to user IDs
    let createdByIds = null;
    if (createdBy) {
      const names = createdBy.split(',').map(n => n.trim()).filter(Boolean);
      const orConditions = names.flatMap(n => {
        const parts = n.split(' ');
        if (parts.length >= 2) {
          return [
            { firstName: { $regex: parts[0], $options: 'i' }, lastName: { $regex: parts.slice(1).join(' '), $options: 'i' } },
            { firstName: { $regex: n, $options: 'i' } },
          ];
        }
        return [{ firstName: { $regex: n, $options: 'i' } }, { lastName: { $regex: n, $options: 'i' } }];
      });
      const users = await mongoose.model('User').find({ $or: orConditions }).select('_id').lean();
      createdByIds = users.map(u => u._id);
      if (createdByIds.length === 0) {
        return res.status(200).json({ data: [], total: 0, page, limit });
      }
    }

    // Fetch ALL users for name display (no role restriction — Sales/HR/admin/TL all included)
    const allUsers = await mongoose.model('User')
      .find({})
      .select('_id firstName lastName role')
      .lean();

    const userMap = {};
    allUsers.forEach(u => {
      userMap[u._id.toString()] = `${u.firstName || ''} ${u.lastName || ''}`.trim();
    });

    // effectiveCreatedByIds: if createdBy filter given use those IDs, else no restriction (fetch all)
    const effectiveCreatedByIds = createdByIds || null;

    // Build filter query — no createdBy restriction unless filter is applied
    const filterQuery = {};
    if (effectiveCreatedByIds) {
      filterQuery.createdBy = { $in: effectiveCreatedByIds };
    }

    if (name) filterQuery.candidateName = { $regex: name, $options: 'i' };
    if (location) filterQuery.currentLocation = { $regex: location, $options: 'i' };
    if (position) filterQuery.positionName = { $regex: position, $options: 'i' };
    if (currentPosition) filterQuery.currentPosition = { $regex: currentPosition, $options: 'i' };
    if (industry) filterQuery.industry = { $regex: industry, $options: 'i' };
    if (phone) filterQuery.candidatePhone = { $regex: phone, $options: 'i' };
    if (gender) filterQuery.gender = { $regex: `^${gender.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
    if (startDate || endDate) {
      filterQuery.createdAt = {};
      if (startDate) {
        filterQuery.createdAt.$gte = new Date(startDate);
      }
      if (endDate) {
        // Add 23h 59m 59s 999ms in UTC to cover the full local day represented by the ISO string
        const endLimit = new Date(endDate);
        endLimit.setUTCHours(
          endLimit.getUTCHours() + 23,
          endLimit.getUTCMinutes() + 59,
          endLimit.getUTCSeconds() + 59,
          endLimit.getUTCMilliseconds() + 999
        );
        filterQuery.createdAt.$lte = endLimit;
      }
    }

    // Numeric filters (applied directly since fields are now Numbers)
    const numericFilters = [];
    if (minExp) numericFilters.push({ $gte: ["$experience", parseFloat(minExp)] });
    if (maxExp) numericFilters.push({ $lte: ["$experience", parseFloat(maxExp)] });
    if (minCtc) numericFilters.push({ $gte: ["$currentCTC", parseFloat(minCtc)] });
    if (maxCtc) numericFilters.push({ $lte: ["$currentCTC", parseFloat(maxCtc)] });
    if (maxNotice) numericFilters.push({ $lte: ["$noticePeriod", parseFloat(maxNotice)] });

    const pipeline = [
      { $match: filterQuery },
      {
        $project: {
          _id: 1, createdBy: 1, createdAt: 1,
          name: { $ifNull: ['$candidateName', ''] },
          phoneNumber: { $ifNull: ['$candidatePhone', ''] },
          email: { $ifNull: ['$candidateEmail', ''] },
          gender: { $ifNull: ['$gender', ''] },
          positionName: { $ifNull: ['$positionName', ''] },
          experience: { $ifNull: ['$experience', ''] },
          currentLocation: { $ifNull: ['$currentLocation', ''] },
          preferredLocation: { $ifNull: ['$preferredLocation', ''] },
          currentPosition: { $ifNull: ['$currentPosition', ''] },
          currentCTC: { $ifNull: ['$currentCTC', ''] },
          expectedCTC: { $ifNull: ['$expectedCTC', ''] },
          noticePeriod: { $ifNull: ['$noticePeriod', ''] },
          reasonforLeaving: { $ifNull: ['$reasonforLeaving', ''] },
          currentCompany: { $ifNull: ['$currentCompany', ''] },
          industry: { $ifNull: ['$industry', ''] },
          remark: { $ifNull: ['$remark', ''] },
          resumeUpload: { $ifNull: ['$resumeLink', ''] },
          qualification: { $ifNull: ['$qualification', ''] },
        },
      },
    ];

    if (numericFilters.length) {
      pipeline.push({ $match: { $expr: { $and: numericFilters } } });
    }

    // Sort + paginate inside $facet so MongoDB can use allowDiskUse efficiently
    pipeline.push({
      $facet: {
        metadata: [{ $count: 'total' }],
        data: [
          { $sort: { createdAt: -1 } },
          { $skip: skip },
          { $limit: limit },
        ],
      },
    });

    const [result] = await Candidate.aggregate(pipeline, { allowDiskUse: true });

    const total = result.metadata[0]?.total || 0;
    const data = result.data.map(row => ({
      ...row,
      id: row._id,
      createdBy: userMap[row.createdBy?.toString()] || '',
    }));

    res.status(200).json({ data, total, page, limit });
  } catch (error) {
    console.error('getCombinedCandidates error:', error);
    res.status(500).json({ message: 'Error fetching candidate data', error: error.message });
  }
};

module.exports = {
  createCandidates,
  getMyCandidate,
  updateCandidate,
  deleteCandidate,
  getCombinedCandidates,
  bulkUploadCandidates,
};
