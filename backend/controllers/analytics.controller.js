const CandidateApplication = require('../models/CandidateApplication.model');
const JobOpening           = require('../models/jobopennings.modal');

// ─────────────────────────────────────────────────────────────────────────────
// Helper: build a date-range filter from query params { from, to }
// ─────────────────────────────────────────────────────────────────────────────
function buildDateFilter(query) {
  const { from, to } = query;
  if (!from && !to) return {};
  const filter = {};
  if (from) filter.$gte = new Date(from);
  if (to) {
    const end = new Date(to);
    end.setHours(23, 59, 59, 999);
    filter.$lte = end;
  }
  return { createdAt: filter };
}

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/company-hr
//
// Returns: for each company → for each HR who sourced candidates for that
//          company's jobs → total sourced, selected, rejected, joined counts.
//
// Query params: from, to (optional date range)
// ─────────────────────────────────────────────────────────────────────────────
exports.getCompanyHrStats = async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query);

    const rows = await CandidateApplication.aggregate([
      // 1. Apply date filter on application creation
      { $match: dateFilter },

      // 2. Join job to get companyName, jobTitle
      {
        $lookup: {
          from:         'jobopenings',
          localField:   'jobId',
          foreignField: '_id',
          as:           'job',
        },
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: false } },

      // 3. Join creator (HR who sourced the candidate)
      {
        $lookup: {
          from:         'users',
          localField:   'createdBy',
          foreignField: '_id',
          as:           'hr',
        },
      },
      { $unwind: { path: '$hr', preserveNullAndEmptyArrays: true } },

      // 4. Group by company + HR
      {
        $group: {
          _id: {
            companyName: '$job.companyName',
            companyId:   '$job.companyId',
            hrId:        '$hr._id',
            hrName:      {
              $cond: {
                if: { $gt: ['$hr._id', null] },
                then: {
                  $concat: [
                    { $ifNull: ['$hr.firstName', ''] },
                    ' ',
                    { $ifNull: ['$hr.lastName', ''] },
                  ],
                },
                // User deleted — fall back to the snapshot stored at creation time
                else: { $ifNull: ['$createdByName', 'Unknown HR'] },
              },
            },
          },
          sourced: { $sum: 1 },
          selected: {
            $sum: {
              $cond: [{ $eq: ['$interviewStatus', 'Selected'] }, 1, 0],
            },
          },
          rejected: {
            $sum: {
              $cond: [{ $eq: ['$interviewStatus', 'Rejected'] }, 1, 0],
            },
          },
          onHold: {
            $sum: {
              $cond: [{ $eq: ['$interviewStatus', 'On Hold'] }, 1, 0],
            },
          },
          joined: {
            $sum: {
              $cond: [{ $eq: ['$hasJoined', 'Yes'] }, 1, 0],
            },
          },
          backout: {
            $sum: {
              $cond: [{ $eq: ['$hasJoined', 'Backout'] }, 1, 0],
            },
          },
          offerAccepted: {
            $sum: {
              $cond: [{ $eq: ['$offeredStatus', 'Accepted'] }, 1, 0],
            },
          },
          offerRejected: {
            $sum: {
              $cond: [{ $eq: ['$offeredStatus', 'Rejected'] }, 1, 0],
            },
          },
        },
      },

      // 5. Sort by company then HR name
      {
        $sort: {
          '_id.companyName': 1,
          '_id.hrName':      1,
        },
      },

      // 6. Shape output
      {
        $project: {
          _id:          0,
          companyName:  '$_id.companyName',
          companyId:    '$_id.companyId',
          hrId:         '$_id.hrId',
          hrName:       '$_id.hrName',
          sourced:      1,
          selected:     1,
          rejected:     1,
          onHold:       1,
          joined:       1,
          backout:      1,
          offerAccepted:1,
          offerRejected:1,
          selectionRate: {
            $cond: [
              { $gt: ['$sourced', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$selected', '$sourced'] }, 100] },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getCompanyHrStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// GET /api/analytics/hr-position
//
// Returns: for each HR → for each position (jobTitle) they sourced candidates
//          for → total sourced, selected, rejected, joined counts.
//
// Query params: from, to (optional date range), hrId (optional filter by HR)
// ─────────────────────────────────────────────────────────────────────────────
exports.getHrPositionStats = async (req, res) => {
  try {
    const dateFilter = buildDateFilter(req.query);
    const matchStage = { ...dateFilter };

    // Optional: filter by a specific HR
    if (req.query.hrId) {
      const mongoose = require('mongoose');
      matchStage.createdBy = new mongoose.Types.ObjectId(req.query.hrId);
    }

    const rows = await CandidateApplication.aggregate([
      { $match: matchStage },

      // Join job to get jobTitle + companyName
      {
        $lookup: {
          from:         'jobopenings',
          localField:   'jobId',
          foreignField: '_id',
          as:           'job',
        },
      },
      { $unwind: { path: '$job', preserveNullAndEmptyArrays: false } },

      // Join HR user
      {
        $lookup: {
          from:         'users',
          localField:   'createdBy',
          foreignField: '_id',
          as:           'hr',
        },
      },
      { $unwind: { path: '$hr', preserveNullAndEmptyArrays: true } },

      // Group by HR + position (jobTitle)
      {
        $group: {
          _id: {
            hrId:   '$hr._id',
            hrName: {
              $cond: {
                if: { $gt: ['$hr._id', null] },
                then: {
                  $concat: [
                    { $ifNull: ['$hr.firstName', ''] },
                    ' ',
                    { $ifNull: ['$hr.lastName', ''] },
                  ],
                },
                // User deleted — fall back to snapshot
                else: { $ifNull: ['$createdByName', 'Unknown HR'] },
              },
            },
            jobTitle:    '$job.jobTitle',
            companyName: '$job.companyName',
          },
          sourced: { $sum: 1 },
          selected: {
            $sum: { $cond: [{ $eq: ['$interviewStatus', 'Selected'] }, 1, 0] },
          },
          rejected: {
            $sum: { $cond: [{ $eq: ['$interviewStatus', 'Rejected'] }, 1, 0] },
          },
          onHold: {
            $sum: { $cond: [{ $eq: ['$interviewStatus', 'On Hold'] }, 1, 0] },
          },
          joined: {
            $sum: { $cond: [{ $eq: ['$hasJoined', 'Yes'] }, 1, 0] },
          },
          backout: {
            $sum: { $cond: [{ $eq: ['$hasJoined', 'Backout'] }, 1, 0] },
          },
          offerAccepted: {
            $sum: { $cond: [{ $eq: ['$offeredStatus', 'Accepted'] }, 1, 0] },
          },
          offerRejected: {
            $sum: { $cond: [{ $eq: ['$offeredStatus', 'Rejected'] }, 1, 0] },
          },
          // Collect unique joining dates for reference
          joiningDates: {
            $push: {
              $cond: [{ $ne: ['$joiningDate', null] }, '$joiningDate', '$$REMOVE'],
            },
          },
        },
      },

      { $sort: { '_id.hrName': 1, '_id.jobTitle': 1 } },

      {
        $project: {
          _id:          0,
          hrId:         '$_id.hrId',
          hrName:       '$_id.hrName',
          jobTitle:     '$_id.jobTitle',
          companyName:  '$_id.companyName',
          sourced:      1,
          selected:     1,
          rejected:     1,
          onHold:       1,
          joined:       1,
          backout:      1,
          offerAccepted:1,
          offerRejected:1,
          joiningDates: 1,
          selectionRate: {
            $cond: [
              { $gt: ['$sourced', 0] },
              {
                $round: [
                  { $multiply: [{ $divide: ['$selected', '$sourced'] }, 100] },
                  1,
                ],
              },
              0,
            ],
          },
        },
      },
    ]);

    res.json({ success: true, data: rows });
  } catch (err) {
    console.error('getHrPositionStats error:', err);
    res.status(500).json({ success: false, message: err.message });
  }
};
