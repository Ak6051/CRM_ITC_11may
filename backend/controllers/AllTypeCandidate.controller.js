const { uploadToS3 } = require('../middleware/gcsMulter');
const Candidate = require('../models/candidateModal');
const mongoose = require('mongoose');

// ── Experience Format Converter ────────────────────────────────────────────
// Converts user-friendly format to compact format (e.g., "2 Years" → "2y")
const convertExperienceFormat = (experience) => {
  if (!experience || typeof experience !== 'string') return experience;
  
  const exp = experience.trim();
  
  // Already in compact format
  if (/^\d+y(\s+\d+m)?$|^\d+-\d+y$|^\d+\+y$|^\d+-?\d*m$|^Fresher$/i.test(exp)) {
    return exp;
  }
  
  // Convert "Fresher" (case insensitive)
  if (/^fresher$/i.test(exp)) return 'Fresher';
  
  // Convert "X+ Years" → "X+y"
  const plusYearsMatch = exp.match(/^(\d+)\+?\s*Years?$/i);
  if (plusYearsMatch) return `${plusYearsMatch[1]}+y`;
  
  // Convert "X-Y Years" → "X-Yy"
  const rangeYearsMatch = exp.match(/^(\d+)\s*-\s*(\d+)\s*Years?$/i);
  if (rangeYearsMatch) return `${rangeYearsMatch[1]}-${rangeYearsMatch[2]}y`;
  
  // Convert "X Year(s) Y Month(s)" → "Xy Ym"
  const yearMonthMatch = exp.match(/^(\d+)\s*Years?\s+(\d+)\s*Months?$/i);
  if (yearMonthMatch) return `${yearMonthMatch[1]}y ${yearMonthMatch[2]}m`;
  
  // Convert "X Year(s)" → "Xy"
  const yearsMatch = exp.match(/^(\d+)\s*Years?$/i);
  if (yearsMatch) return `${yearsMatch[1]}y`;
  
  // Convert "X Month(s)" → "Xm"
  const monthsMatch = exp.match(/^(\d+)\s*Months?$/i);
  if (monthsMatch) return `${monthsMatch[1]}m`;
  
  // Convert "X-Y Months" → "X-Ym"
  const rangeMonthsMatch = exp.match(/^(\d+)\s*-\s*(\d+)\s*Months?$/i);
  if (rangeMonthsMatch) return `${rangeMonthsMatch[1]}-${rangeMonthsMatch[2]}m`;
  
  // Return as-is if no pattern matches
  return exp;
};

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
      candidateName:  typeof req.body.name === 'string' ? req.body.name.trim() : String(req.body.name || '').trim(),
      candidateEmail: typeof req.body.email === 'string' ? req.body.email.trim() : String(req.body.email || '').trim(),
      candidatePhone: phoneNumber,
      positionName:    req.body.positionName    || '',
      qualification:   req.body.qualification   || '',
      experience:      convertExperienceFormat(req.body.experience) || '',
      currentLocation: req.body.currentLocation || '',
      preferredLocation: req.body.preferredLocation || '',
      currentPosition: req.body.currentPosition || '',
      currentCTC:      req.body.currentCTC      || '',
      expectedCTC:     req.body.expectedCTC     || '',
      noticePeriod:    req.body.noticePeriod    || '',
      reasonforLeaving:req.body.reasonforLeaving|| '',
      currentCompany:  req.body.currentCompany  || '',
      remark:          req.body.remark          || '',
      createdBy:       req.user._id,
    };

    if (req.file) {
      const filename = `candidates_resume/${Date.now()}-${req.file.originalname.replace(/\s+/g, '_')}`;
      jobData.resumeLink = await uploadToS3(req.file.buffer, filename, req.file.mimetype);
    }

    const newCandidate = new Candidate(jobData);
    await newCandidate.save();

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

    // Normalize phone numbers from incoming data
    const incomingPhoneNumbers = candidates
      .map(c => typeof c.phoneNumber === 'string' ? c.phoneNumber.trim() : String(c.phoneNumber || '').trim())
      .filter(Boolean);

    // Check existing by candidatePhone
    const existingCandidates = await Candidate.find({
      candidatePhone: { $in: incomingPhoneNumbers },
    }).select('candidatePhone');

    const existingPhoneSet = new Set(existingCandidates.map(c => c.candidatePhone.trim()));

    const skippedPhoneNumbers = [];
    const newCandidates = [];

    for (let c of candidates) {
      const phone = typeof c.phoneNumber === 'string' ? c.phoneNumber.trim() : String(c.phoneNumber || '').trim();
      if (!phone || existingPhoneSet.has(phone)) {
        skippedPhoneNumbers.push(phone);
        continue;
      }

      newCandidates.push({
        candidateName:   typeof c.name === 'string' ? c.name.trim() : String(c.name || '').trim(),
        candidateEmail:  typeof c.email === 'string' ? c.email.trim() : String(c.email || '').trim(),
        candidatePhone:  phone,
        positionName:    c.positionName    || '',
        qualification:   c.qualification   || '',
        experience:      convertExperienceFormat(c.experience) || '',
        currentLocation: c.currentLocation || '',
        preferredLocation: c.preferredLocation || '',
        currentPosition: c.currentPosition || '',
        currentCTC:      c.currentCTC      || '',
        expectedCTC:     c.expectedCTC     || '',
        noticePeriod:    c.noticePeriod    || '',
        reasonforLeaving:c.reasonforLeaving|| '',
        currentCompany:  c.currentCompany  || '',
        remark:          c.remark          || '',
        createdBy:       userId,
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
      name:        c.candidateName  || '',
      email:       c.candidateEmail || '',
      phoneNumber: c.candidatePhone || '',
      resumeLink:  c.resumeLink     || '',
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

    const page  = Math.max(1, parseInt(req.query.page)  || 1);
    const limit = Math.min(200, Math.max(1, parseInt(req.query.limit) || 50));
    const skip  = (page - 1) * limit;

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

    if (name)            filterQuery.candidateName   = { $regex: name,            $options: 'i' };
    if (location)        filterQuery.currentLocation = { $regex: location,        $options: 'i' };
    if (position)        filterQuery.positionName    = { $regex: position,        $options: 'i' };
    if (currentPosition) filterQuery.currentPosition = { $regex: currentPosition, $options: 'i' };
    if (industry)        filterQuery.industry        = { $regex: industry,        $options: 'i' };
    if (phone)           filterQuery.candidatePhone  = { $regex: phone,           $options: 'i' };
    if (gender)          filterQuery.gender          = { $regex: `^${gender.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, $options: 'i' };
    if (startDate || endDate) {
      filterQuery.createdAt = {};
      if (startDate) filterQuery.createdAt.$gte = new Date(startDate);
      if (endDate)   filterQuery.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
    }

    // ── Helper: extract leading number from a string ────────────────────────
    // "2 Years" → 2, "6 Months" → 0.5, "Fresher" → 0, "3-5 Years" → 3,
    // "1 Year 6 Months" → 1.5, "2.40 LPA" → 2.40, "0-6 Months" → 0
    const parseExpToYears = (fieldRef) => ({
      $let: {
        vars: {
          raw: { $toLower: { $ifNull: [fieldRef, ''] } },
        },
        in: {
          $switch: {
            branches: [
              // "fresher" → 0
              { case: { $regexMatch: { input: '$$raw', regex: /^fresher$/i } }, then: 0 },
              // "X Year(s) Y Month(s)" → X + Y/12
              {
                case: { $regexMatch: { input: '$$raw', regex: /(\d+)\s*year.*?(\d+)\s*month/i } },
                then: {
                  $add: [
                    { $convert: { input: { $arrayElemAt: [{ $regexFind: { input: '$$raw', regex: /(\d+)\s*year/i } }, 0] }, to: 'double', onError: 0, onNull: 0 } },
                    { $divide: [{ $convert: { input: { $arrayElemAt: [{ $regexFind: { input: '$$raw', regex: /(\d+)\s*month/i } }, 0] }, to: 'double', onError: 0, onNull: 0 } }, 12] },
                  ],
                },
              },
              // "X-Y Years" → X (lower bound)
              { case: { $regexMatch: { input: '$$raw', regex: /(\d+)\s*-\s*\d+\s*year/i } }, then: { $convert: { input: { $arrayElemAt: [{ $split: ['$$raw', '-'] }, 0] }, to: 'double', onError: 0, onNull: 0 } } },
              // "X+ Years" or "X Years" → X
              { case: { $regexMatch: { input: '$$raw', regex: /(\d+).*year/i } }, then: { $convert: { input: { $arrayElemAt: [{ $regexFind: { input: '$$raw', regex: /\d+/ } }, 0] }, to: 'double', onError: 0, onNull: 0 } } },
              // "X-Y Months" → X/12
              { case: { $regexMatch: { input: '$$raw', regex: /(\d+)\s*-\s*\d+\s*month/i } }, then: { $divide: [{ $convert: { input: { $arrayElemAt: [{ $split: ['$$raw', '-'] }, 0] }, to: 'double', onError: 0, onNull: 0 } }, 12] } },
              // "X Months" → X/12
              { case: { $regexMatch: { input: '$$raw', regex: /(\d+)\s*month/i } }, then: { $divide: [{ $convert: { input: { $arrayElemAt: [{ $regexFind: { input: '$$raw', regex: /\d+/ } }, 0] }, to: 'double', onError: 0, onNull: 0 } }, 12] } },
            ],
            // fallback: try extracting leading number directly
            default: { $convert: { input: { $ifNull: [{ $getField: { field: 'match', input: { $regexFind: { input: '$$raw', regex: /[\d.]+/ } } } }, '0'] }, to: 'double', onError: 0, onNull: 0 } },
          },
        },
      },
    });

    // Helper: extract leading number from CTC strings ("2.40 LPA" → 2.40, "₹20000" → 20000)
    const parseCTCToNum = (fieldRef) => ({
      $convert: {
        input: { $ifNull: [{ $getField: { field: 'match', input: { $regexFind: { input: { $ifNull: [fieldRef, '0'] }, regex: /[\d.]+/ } } } }, '0'] },
        to: 'double', onError: 0, onNull: 0,
      },
    });

    // Numeric filters (applied after $project via $expr)
    const numericFilters = [];
    if (minExp) numericFilters.push({ $gte: [parseExpToYears('$experience'), parseFloat(minExp)] });
    if (maxExp) numericFilters.push({ $lte: [parseExpToYears('$experience'), parseFloat(maxExp)] });
    if (minCtc) numericFilters.push({ $gte: [parseCTCToNum('$currentCTC'), parseFloat(minCtc)] });
    if (maxCtc) numericFilters.push({ $lte: [parseCTCToNum('$currentCTC'), parseFloat(maxCtc)] });
    // noticePeriod filter — extract leading number from strings like "30 Days", "Immediate" (=0), "1 Week" (=7)
    if (maxNotice) {
      const maxN = parseInt(maxNotice);
      // Use $and to safely combine with existing filterQuery without overwriting $or
      const noticeCondition = {
        $or: [
          { noticePeriod: { $regex: /^immediate$/i } },
          {
            $expr: {
              $lte: [
                {
                  $convert: {
                    input: { $arrayElemAt: [{ $split: [{ $ifNull: ['$noticePeriod', '0'] }, ' '] }, 0] },
                    to: 'double',
                    onError: 999,
                    onNull: 999,
                  },
                },
                maxN,
              ],
            },
          },
        ],
      };
      if (filterQuery.$and) {
        filterQuery.$and.push(noticeCondition);
      } else {
        filterQuery.$and = [noticeCondition];
      }
    }

    const pipeline = [
      { $match: filterQuery },
      {
        $project: {
          _id: 1, createdBy: 1, createdAt: 1,
          name:            { $ifNull: ['$candidateName',   ''] },
          phoneNumber:     { $ifNull: ['$candidatePhone',  ''] },
          email:           { $ifNull: ['$candidateEmail',  ''] },
          gender:          { $ifNull: ['$gender',          ''] },
          positionName:    { $ifNull: ['$positionName',    ''] },
          experience:      { $ifNull: ['$experience',      ''] },
          currentLocation: { $ifNull: ['$currentLocation', ''] },
          preferredLocation: { $ifNull: ['$preferredLocation', ''] },
          currentPosition: { $ifNull: ['$currentPosition', ''] },
          currentCTC:      { $ifNull: ['$currentCTC',      ''] },
          expectedCTC:     { $ifNull: ['$expectedCTC',     ''] },
          noticePeriod:    { $ifNull: ['$noticePeriod',    ''] },
          reasonforLeaving:{ $ifNull: ['$reasonforLeaving',''] },
          currentCompany:  { $ifNull: ['$currentCompany',  ''] },
          industry:        { $ifNull: ['$industry',        ''] },
          remark:          { $ifNull: ['$remark',          ''] },
          resumeUpload:    { $ifNull: ['$resumeLink',      ''] },
          qualification:   { $ifNull: ['$qualification',   ''] },
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
    const data  = result.data.map(row => ({
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
