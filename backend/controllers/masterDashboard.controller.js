const CandidateApplication = require('../models/CandidateApplication.model');
const Candidate = require('../models/candidateModal');
const JobOpening = require('../models/jobopennings.modal');
const SalesPanel = require('../models/SalesPanel.model');
const User = require('../models/User');

// Get Admin Master Dashboard Data
exports.getAdminDashboardData = async (req, res) => {
  try {
    const { timeFilter = 'week', fromDate, toDate } = req.query;

    // Calculate date range based on filter
    let dateFilter = {};
    const now = new Date();
    
    if (timeFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } };
    } else if (timeFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (timeFilter === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0);
      const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfTomorrow, $lte: endOfTomorrow } };
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
    } else if (timeFilter === 'dateRange' && fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }

    // Fetch all candidates with date filter
    const allCandidates = await CandidateApplication.find(dateFilter)
      .populate('candidateId', 'candidateName candidateEmail candidatePhone qualification currentLocation')
      .populate('interviewByWhom', 'firstName lastName')
      .populate('jobId', 'jobTitle companyName')
      .populate('createdBy', 'firstName lastName')
      .lean();

    // Fetch all job openings
    const allJobs = await JobOpening.find()
      .populate('assignedHR', 'firstName lastName')
      .lean();

    // Calculate recruitment analytics
    const internalInterviewLineup = allCandidates.filter(c => 
      c.lineupStatus === 'Internal Interview' || 
      c.lineupStatus === 'Shortlisted' ||
      (c.internalInterviewDate && c.interviewByWhom) // Include candidates who have conducted internal interviews
    );

    const employerInterview = allCandidates.filter(c => 
      c.lineupStatus === 'Employer Interview' || 
      c.lineupStatus === 'Client Interview' ||
      (c.interviewRounds && c.interviewRounds.length > 0 && c.interviewRounds.some(r => {
        // Handle both string and Date formats for roundDate
        const roundDate = r.roundDate;
        return roundDate && (
          (typeof roundDate === 'string' && roundDate.length > 0) ||
          (roundDate instanceof Date && !isNaN(roundDate.getTime())) ||
          (typeof roundDate === 'object' && roundDate !== null)
        );
      }))
    );

    const joiningsScheduled = allCandidates.filter(c => 
      c.lineupStatus === 'Joining Scheduled' || 
      (c.joiningDateStatus === 'Confirmed' && c.joiningDate) // Include candidates with confirmed joining dates
    );

    // Calculate current status
    const decisionPending = allCandidates.filter(c => 
      c.interviewStatus === 'Decision Pending'
    );

    const offerAcceptancePending = allCandidates.filter(c => 
      c.offeredSalary && c.offeredStatus === 'Pending' // Only include candidates with pending offers
    );

    const joiningDatePending = allCandidates.filter(c => 
      c.lineupStatus === 'Selected' && !c.joiningDate
    );

    const selectedCandidates = allCandidates.filter(c => 
      c.lineupStatus === 'Selected' || 
      c.lineupStatus === 'Joined' ||
      c.hasJoined === 'Yes' // Include candidates marked as joined
    );

    // New metrics based on workflow model
    const resumesShared = allCandidates.filter(c => c.resumeSubmitDate);
    const offerAccepted = allCandidates.filter(c => c.offeredStatus === 'Accepted');
    const offerRejected = allCandidates.filter(c => c.offeredStatus === 'Rejected');
    const selectionAccepted = allCandidates.filter(c => c.selectionStatus === 'Accepted');
    const selectionRejected = allCandidates.filter(c => c.selectionStatus === 'Rejected');
    const actualJoined = allCandidates.filter(c => c.hasJoined === 'Yes');
    const notJoined = allCandidates.filter(c => c.joiningDateStatus === 'Not Joined');

    // Interview status cards
    const onDiscussion = allCandidates.filter(c => c.interviewStatus === 'On Discussion');
    const onHold = allCandidates.filter(c => c.interviewStatus === 'On Hold');
    const trail = allCandidates.filter(c => c.interviewStatus === 'Trail');
    const interviewSelected = allCandidates.filter(c => c.interviewStatus === 'Selected');
    const interviewRejected = allCandidates.filter(c => c.interviewStatus === 'Rejected');

    // Calculate job openings stats
    const assignedJobs = allJobs.filter(j => 
      j.assignedHR && (Array.isArray(j.assignedHR) ? j.assignedHR.length > 0 : !!j.assignedHR)
    );

    const activeJobs = allJobs.filter(j => {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      return new Date(j.createdAt) >= thirtyDaysAgo;
    });

    // Job openings this month and this week
    const jobMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const jobWeekAgo = new Date();
    jobWeekAgo.setDate(jobWeekAgo.getDate() - 7);

    const thisMonthJobs = await JobOpening.countDocuments({ createdAt: { $gte: jobMonthStart } });
    const thisWeekJobs = await JobOpening.countDocuments({ createdAt: { $gte: jobWeekAgo } });

    // Get total candidates count from Candidate model (without date filter)
    const totalCandidates = await Candidate.countDocuments();
    
    // Get this month candidates
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthCandidates = await Candidate.countDocuments({
      createdAt: { $gte: monthStart }
    });

    // Get this week candidates
    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekCandidates = await Candidate.countDocuments({
      createdAt: { $gte: weekAgo }
    });

    // Calculate trends (compare with previous period)
    const previousPeriodFilter = getPreviousPeriodFilter(timeFilter, fromDate, toDate);
    const previousCandidates = await CandidateApplication.find(previousPeriodFilter).lean();

    const calculateTrend = (current, previous) => {
      if (previous.length === 0) return 0;
      return Math.round(((current.length - previous.length) / previous.length) * 100);
    };

    const response = {
      recruitmentAnalytics: {
        internalInterviewLineup: {
          count: internalInterviewLineup.length,
          trend: calculateTrend(
            internalInterviewLineup,
            previousCandidates.filter(c => 
              c.lineupStatus === 'Internal Interview' || 
              c.lineupStatus === 'Shortlisted' ||
              (c.internalInterviewDate && c.interviewByWhom)
            )
          ),
          candidates: internalInterviewLineup.slice(0, 10), // Top 10
        },
        employerInterview: {
          count: employerInterview.length,
          trend: calculateTrend(
            employerInterview,
            previousCandidates.filter(c => 
              c.lineupStatus === 'Employer Interview' || 
              c.lineupStatus === 'Client Interview' ||
              (c.interviewRounds && c.interviewRounds.length > 0 && c.interviewRounds.some(r => r.roundDate))
            )
          ),
          candidates: employerInterview.slice(0, 10),
        },
        joiningsScheduled: {
          count: joiningsScheduled.length,
          trend: calculateTrend(
            joiningsScheduled,
            previousCandidates.filter(c => 
              c.lineupStatus === 'Joining Scheduled' || 
              (c.joiningDateStatus === 'Confirmed' && c.joiningDate)
            )
          ),
          candidates: joiningsScheduled.slice(0, 10),
        },
      },
      currentStatus: {
        decisionPending: {
          count: decisionPending.length,
          trend: calculateTrend(
            decisionPending,
            previousCandidates.filter(c => c.interviewStatus === 'Decision Pending')
          ),
          candidates: decisionPending.slice(0, 10),
        },
        offerAcceptancePending: {
          count: offerAcceptancePending.length,
          trend: calculateTrend(
            offerAcceptancePending,
            previousCandidates.filter(c => c.offeredSalary && c.offeredStatus === 'Pending')
          ),
          candidates: offerAcceptancePending.slice(0, 10),
        },
        joiningDatePending: {
          count: joiningDatePending.length,
          trend: calculateTrend(
            joiningDatePending,
            previousCandidates.filter(c => c.lineupStatus === 'Selected' && !c.joiningDate)
          ),
          candidates: joiningDatePending.slice(0, 10),
        },
        selectedCandidates: {
          count: selectedCandidates.length,
          trend: calculateTrend(
            selectedCandidates,
            previousCandidates.filter(c => 
              c.lineupStatus === 'Selected' || 
              c.lineupStatus === 'Joined' ||
              c.hasJoined === 'Yes'
            )
          ),
          candidates: selectedCandidates.slice(0, 10),
        },
      },
      interviewStatus: {
        onDiscussion: {
          count: onDiscussion.length,
          trend: calculateTrend(
            onDiscussion,
            previousCandidates.filter(c => c.interviewStatus === 'On Discussion')
          ),
          candidates: onDiscussion.slice(0, 50),
        },
        onHold: {
          count: onHold.length,
          trend: calculateTrend(
            onHold,
            previousCandidates.filter(c => c.interviewStatus === 'On Hold')
          ),
          candidates: onHold.slice(0, 50),
        },
        trail: {
          count: trail.length,
          trend: calculateTrend(
            trail,
            previousCandidates.filter(c => c.interviewStatus === 'Trail')
          ),
          candidates: trail.slice(0, 50),
        },
        selected: {
          count: interviewSelected.length,
          trend: calculateTrend(
            interviewSelected,
            previousCandidates.filter(c => c.interviewStatus === 'Selected')
          ),
          candidates: interviewSelected.slice(0, 50),
        },
        rejected: {
          count: interviewRejected.length,
          trend: calculateTrend(
            interviewRejected,
            previousCandidates.filter(c => c.interviewStatus === 'Rejected')
          ),
          candidates: interviewRejected.slice(0, 50),
        },
      },
      jobOpenings: {
        total: allJobs.length,
        assigned: assignedJobs.length,
        unassigned: allJobs.length - assignedJobs.length,
        active: activeJobs.length,
        thisMonth: thisMonthJobs,
        thisWeek: thisWeekJobs,
      },
      candidates: {
        total: totalCandidates,
        thisMonth: thisMonthCandidates,
        thisWeek: thisWeekCandidates,
      },
      workflowMetrics: {
        resumesShared: {
          count: resumesShared.length,
          trend: calculateTrend(resumesShared, previousCandidates.filter(c => c.resumeSubmitDate)),
          candidates: resumesShared.slice(0, 50),
        },
        offerAccepted: {
          count: offerAccepted.length,
          trend: calculateTrend(offerAccepted, previousCandidates.filter(c => c.offeredStatus === 'Accepted')),
          candidates: offerAccepted.slice(0, 50),
        },
        offerRejected: {
          count: offerRejected.length,
          trend: calculateTrend(offerRejected, previousCandidates.filter(c => c.offeredStatus === 'Rejected')),
          candidates: offerRejected.slice(0, 50),
        },
        selectionAccepted: {
          count: selectionAccepted.length,
          trend: calculateTrend(selectionAccepted, previousCandidates.filter(c => c.selectionStatus === 'Accepted')),
          candidates: selectionAccepted.slice(0, 50),
        },
        selectionRejected: {
          count: selectionRejected.length,
          trend: calculateTrend(selectionRejected, previousCandidates.filter(c => c.selectionStatus === 'Rejected')),
          candidates: selectionRejected.slice(0, 50),
        },
        actualJoined: {
          count: actualJoined.length,
          trend: calculateTrend(actualJoined, previousCandidates.filter(c => c.hasJoined === 'Yes')),
          candidates: actualJoined.slice(0, 50),
        },
        notJoined: {
          count: notJoined.length,
          trend: calculateTrend(notJoined, previousCandidates.filter(c => c.joiningDateStatus === 'Not Joined')),
          candidates: notJoined.slice(0, 50),
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching admin dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

// Get HR Master Dashboard Data
exports.getHRDashboardData = async (req, res) => {
  try {
    const { timeFilter = 'week', fromDate, toDate } = req.query;
    const userId = req.user._id;

    // Tenure filter — only data from current tenure start
    const tenureStart = req.user.tenureStartedAt ? new Date(req.user.tenureStartedAt) : null;

    // Calculate date range based on filter
    let dateFilter = {};
    const now = new Date();
    
    if (timeFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    } else if (timeFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (timeFilter === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const startOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0);
      const endOfTomorrow = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfTomorrow, $lte: endOfTomorrow } };
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
    } else if (timeFilter === 'dateRange' && fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }

    // Merge tenure constraint into dateFilter
    // If tenureStart exists, createdAt must be >= tenureStart AND >= any timeFilter lower bound
    if (tenureStart) {
      const existing = dateFilter.createdAt || {};
      const lowerBound = existing.$gte
        ? (tenureStart > existing.$gte ? tenureStart : existing.$gte)
        : tenureStart;
      dateFilter = {
        createdAt: { ...existing, $gte: lowerBound },
      };
    }

    // Fetch HR's assigned jobs (jobs don't have tenure — show all assigned)
    const myJobs = await JobOpening.find({
      $or: [
        { assignedHR: userId },
        { 'assignedHR._id': userId }
      ]
    }).lean();

    // Fetch HR's candidates with date + tenure filter
    const myCandidates = await CandidateApplication.find({
      ...dateFilter,
      createdBy: userId,
    })
    .populate('candidateId', 'candidateName candidateEmail candidatePhone qualification currentLocation')
    .populate('interviewByWhom', 'firstName lastName')
    .populate('jobId', 'jobTitle companyName')
    .populate('createdBy', 'firstName lastName')
    .lean();

    // Calculate recruitment analytics
    const internalInterviewLineup = myCandidates.filter(c => 
      c.lineupStatus === 'Internal Interview' || 
      c.lineupStatus === 'Shortlisted' ||
      (c.internalInterviewDate && c.interviewByWhom) // Include candidates who have conducted internal interviews
    );

    const employerInterview = myCandidates.filter(c => 
      c.lineupStatus === 'Employer Interview' || 
      c.lineupStatus === 'Client Interview' ||
      (c.interviewRounds && c.interviewRounds.length > 0 && c.interviewRounds.some(r => {
        // Handle both string and Date formats for roundDate
        const roundDate = r.roundDate;
        return roundDate && (
          (typeof roundDate === 'string' && roundDate.length > 0) ||
          (roundDate instanceof Date && !isNaN(roundDate.getTime())) ||
          (typeof roundDate === 'object' && roundDate !== null)
        );
      }))
    );

    const joiningsScheduled = myCandidates.filter(c => 
      c.lineupStatus === 'Joining Scheduled' || 
      (c.joiningDateStatus === 'Confirmed' && c.joiningDate) // Include candidates with confirmed joining dates
    );

    // Calculate current status
    const decisionPending = myCandidates.filter(c => 
      c.interviewStatus === 'Decision Pending'
    );

    const offerAcceptancePending = myCandidates.filter(c => 
      c.offeredSalary && c.offeredStatus === 'Pending' // Only include candidates with pending offers
    );

    const joiningDatePending = myCandidates.filter(c => 
      c.lineupStatus === 'Selected' && !c.joiningDate
    );

    const selectedCandidates = myCandidates.filter(c => 
      c.lineupStatus === 'Selected' || 
      c.lineupStatus === 'Joined' ||
      c.hasJoined === 'Yes' // Include candidates marked as joined
    );

    // New metrics based on workflow model for HR
    const resumesShared = myCandidates.filter(c => c.resumeSubmitDate);
    const offerAccepted = myCandidates.filter(c => c.offeredStatus === 'Accepted');
    const offerRejected = myCandidates.filter(c => c.offeredStatus === 'Rejected');
    const selectionAccepted = myCandidates.filter(c => c.selectionStatus === 'Accepted');
    const selectionRejected = myCandidates.filter(c => c.selectionStatus === 'Rejected');
    const actualJoined = myCandidates.filter(c => c.hasJoined === 'Yes');
    const notJoined = myCandidates.filter(c => c.joiningDateStatus === 'Not Joined');

    // Interview status cards for HR
    const onDiscussion = myCandidates.filter(c => c.interviewStatus === 'On Discussion');
    const onHold = myCandidates.filter(c => c.interviewStatus === 'On Hold');
    const trail = myCandidates.filter(c => c.interviewStatus === 'Trail');
    const interviewSelected = myCandidates.filter(c => c.interviewStatus === 'Selected');
    const interviewRejected = myCandidates.filter(c => c.interviewStatus === 'Rejected');

    // Get total counts — scoped to current tenure
    const tenureQuery = tenureStart ? { createdAt: { $gte: tenureStart } } : {};

    const totalMyCandidates = await Candidate.countDocuments({
      createdBy: userId,
      ...tenureQuery,
    });

    const totalMySelections = await CandidateApplication.countDocuments({
      createdBy: userId,
      lineupStatus: { $in: ['Selected', 'Joined'] },
      ...tenureQuery,
    });

    const response = {
      recruitmentAnalytics: {
        internalInterviewLineup: {
          count: internalInterviewLineup.length,
          candidates: internalInterviewLineup.slice(0, 10),
        },
        employerInterview: {
          count: employerInterview.length,
          candidates: employerInterview.slice(0, 10),
        },
        joiningsScheduled: {
          count: joiningsScheduled.length,
          candidates: joiningsScheduled.slice(0, 10),
        },
      },
      currentStatus: {
        decisionPending: {
          count: decisionPending.length,
          candidates: decisionPending.slice(0, 10),
        },
        offerAcceptancePending: {
          count: offerAcceptancePending.length,
          candidates: offerAcceptancePending.slice(0, 10),
        },
        joiningDatePending: {
          count: joiningDatePending.length,
          candidates: joiningDatePending.slice(0, 10),
        },
        selectedCandidates: {
          count: selectedCandidates.length,
          candidates: selectedCandidates.slice(0, 10),
        },
      },
      interviewStatus: {
        onDiscussion: {
          count: onDiscussion.length,
          candidates: onDiscussion.slice(0, 50),
        },
        onHold: {
          count: onHold.length,
          candidates: onHold.slice(0, 50),
        },
        trail: {
          count: trail.length,
          candidates: trail.slice(0, 50),
        },
        selected: {
          count: interviewSelected.length,
          candidates: interviewSelected.slice(0, 50),
        },
        rejected: {
          count: interviewRejected.length,
          candidates: interviewRejected.slice(0, 50),
        },
      },
      myStats: {
        assignedJobs: myJobs.length,
        myCandidates: totalMyCandidates,
        mySelections: totalMySelections,
      },
      workflowMetrics: {
        resumesShared: {
          count: resumesShared.length,
          candidates: resumesShared.slice(0, 50),
        },
        offerAccepted: {
          count: offerAccepted.length,
          candidates: offerAccepted.slice(0, 50),
        },
        offerRejected: {
          count: offerRejected.length,
          candidates: offerRejected.slice(0, 50),
        },
        selectionAccepted: {
          count: selectionAccepted.length,
          candidates: selectionAccepted.slice(0, 50),
        },
        selectionRejected: {
          count: selectionRejected.length,
          candidates: selectionRejected.slice(0, 50),
        },
        actualJoined: {
          count: actualJoined.length,
          candidates: actualJoined.slice(0, 50),
        },
        notJoined: {
          count: notJoined.length,
          candidates: notJoined.slice(0, 50),
        },
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching HR dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

// Get Sales Master Dashboard Data
exports.getSalesDashboardData = async (req, res) => {
  try {
    const { timeFilter = 'all' } = req.query;
    const userId = req.user._id;

    // Calculate date range based on filter
    let dateFilter = {};
    const now = new Date();
    
    if (timeFilter === 'today') {
      const startOfDay = new Date(now.setHours(0, 0, 0, 0));
      const endOfDay = new Date(now.setHours(23, 59, 59, 999));
      dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
    }

    // Fetch sales person's job openings
    const myJobs = await SalesPanel.find({
      ...dateFilter,
      createdBy: userId
    }).lean();

    // Get total counts without date filter
    const totalMyJobs = await SalesPanel.countDocuments({ createdBy: userId });
    const convertedJobs = await SalesPanel.countDocuments({ createdBy: userId, isConverted: true });
    const pendingJobs = await SalesPanel.countDocuments({ createdBy: userId, isConverted: { $ne: true } });

    // Get this month jobs
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    const thisMonthJobs = await SalesPanel.countDocuments({
      createdBy: userId,
      createdAt: { $gte: monthStart }
    });

    // Get companies count (from JobOpening model as companies are created there)
    const totalCompanies = await JobOpening.distinct('companyName').then(names => names.length);
    
    const thisMonthCompanies = await JobOpening.distinct('companyName', {
      createdAt: { $gte: monthStart }
    }).then(names => names.length);

    const weekAgo = new Date();
    weekAgo.setDate(weekAgo.getDate() - 7);
    const thisWeekCompanies = await JobOpening.distinct('companyName', {
      createdAt: { $gte: weekAgo }
    }).then(names => names.length);

    const response = {
      myJobOpenings: {
        total: totalMyJobs,
        converted: convertedJobs,
        pending: pendingJobs,
        thisMonth: thisMonthJobs,
      },
      companies: {
        total: totalCompanies,
        thisMonth: thisMonthCompanies,
        thisWeek: thisWeekCompanies,
      },
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching sales dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};


// Get Team Leader Master Dashboard Data
exports.getTLDashboardData = async (req, res) => {
  try {
    const { timeFilter = 'week', fromDate, toDate } = req.query;
    const tlId = req.user._id;

    // Fetch TL details with assigned HRs
    const tl = await User.findById(tlId).populate('assignedHRs', 'firstName lastName email mobileNo tenureStartedAt isActive').lean();
    if (!tl) return res.status(404).json({ message: 'Team Leader not found' });

    const hrIds = tl.assignedHRs ? tl.assignedHRs.map(hr => hr._id) : [];

    // Calculate date range based on filter
    let dateFilter = {};
    const now = new Date();
    
    if (timeFilter === 'yesterday') {
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);
      const start = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
      const end = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    } else if (timeFilter === 'today') {
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
      const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: startOfDay, $lte: endOfDay } };
    } else if (timeFilter === 'tomorrow') {
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const start = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 0, 0, 0, 0);
      const end = new Date(tomorrow.getFullYear(), tomorrow.getMonth(), tomorrow.getDate(), 23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    } else if (timeFilter === 'week') {
      const weekAgo = new Date(now);
      weekAgo.setDate(weekAgo.getDate() - 7);
      dateFilter = { createdAt: { $gte: weekAgo } };
    } else if (timeFilter === 'month') {
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      dateFilter = { createdAt: { $gte: monthStart } };
    } else if (timeFilter === 'dateRange' && fromDate && toDate) {
      const start = new Date(fromDate);
      start.setHours(0, 0, 0, 0);
      const end = new Date(toDate);
      end.setHours(23, 59, 59, 999);
      dateFilter = { createdAt: { $gte: start, $lte: end } };
    }

    // Fetch all candidates belonging to either the TL or any of their HRs
    const allRelevantCandidates = await CandidateApplication.find({
      ...dateFilter,
      $or: [
        { createdBy: tlId },
        { createdBy: { $in: hrIds } }
      ]
    })
    .populate('candidateId', 'candidateName candidateEmail candidatePhone qualification currentLocation')
    .populate('interviewByWhom', 'firstName lastName')
    .populate('jobId', 'jobTitle companyName')
    .populate('createdBy', 'firstName lastName')
    .lean();

    // Calculate aggregated metrics
    const internalInterviewLineup = allRelevantCandidates.filter(c => 
      c.lineupStatus === 'Internal Interview' || c.lineupStatus === 'Shortlisted' || (c.internalInterviewDate && c.interviewByWhom)
    );

    const employerInterview = allRelevantCandidates.filter(c => 
      c.lineupStatus === 'Employer Interview' || c.lineupStatus === 'Client Interview' || (c.interviewRounds && c.interviewRounds.length > 0)
    );

    const joiningsScheduled = allRelevantCandidates.filter(c => 
      c.lineupStatus === 'Joining Scheduled' || (c.joiningDateStatus === 'Confirmed' && c.joiningDate)
    );

    const selectedCandidates = allRelevantCandidates.filter(c => 
      c.lineupStatus === 'Selected' || c.lineupStatus === 'Joined' || c.hasJoined === 'Yes'
    );

    // Workflow metrics
    const resumesShared = allRelevantCandidates.filter(c => c.resumeSubmitDate);
    const offerAccepted = allRelevantCandidates.filter(c => c.offeredStatus === 'Accepted');
    const actualJoined = allRelevantCandidates.filter(c => c.hasJoined === 'Yes');

    // Fetch jobs assigned to TL or their HRs
    const teamJobs = await JobOpening.find({
      $or: [
        { assignedTL: tlId },
        { assignedHR: { $in: hrIds } }
      ]
    }).lean();

    // Calculate per-HR stats for "Team Performance"
    const hrPerformance = await Promise.all(tl.assignedHRs.map(async (hr) => {
      const hrCandidates = allRelevantCandidates.filter(c => String(c.createdBy) === String(hr._id));
      const hrJoined = hrCandidates.filter(c => c.hasJoined === 'Yes').length;
      const hrSelections = hrCandidates.filter(c => c.lineupStatus === 'Selected' || c.lineupStatus === 'Joined').length;
      
      return {
        hrId: hr._id,
        hrName: `${hr.firstName} ${hr.lastName}`,
        isActive: hr.isActive,
        totalCandidates: hrCandidates.length,
        selections: hrSelections,
        joined: hrJoined,
        resumes: hrCandidates.filter(c => c.resumeSubmitDate).length,
      };
    }));

    const response = {
      teamStats: {
        totalHRs: tl.assignedHRs.length,
        activeHRs: tl.assignedHRs.filter(h => h.isActive).length,
        totalJobs: teamJobs.length,
      },
      recruitmentAnalytics: {
        internalInterviewLineup: { count: internalInterviewLineup.length, candidates: internalInterviewLineup.slice(0, 10) },
        employerInterview: { count: employerInterview.length, candidates: employerInterview.slice(0, 10) },
        joiningsScheduled: { count: joiningsScheduled.length, candidates: joiningsScheduled.slice(0, 10) },
      },
      currentStatus: {
        selectedCandidates: { count: selectedCandidates.length, candidates: selectedCandidates.slice(0, 10) },
      },
      workflowMetrics: {
        resumesShared: { count: resumesShared.length, candidates: resumesShared.slice(0, 50) },
        offerAccepted: { count: offerAccepted.length, candidates: offerAccepted.slice(0, 50) },
        actualJoined: { count: actualJoined.length, candidates: actualJoined.slice(0, 50) },
      },
      hrPerformance,
    };

    res.status(200).json(response);
  } catch (error) {
    console.error('Error fetching TL dashboard data:', error);
    res.status(500).json({ message: 'Error fetching dashboard data', error: error.message });
  }
};

// Helper function to get previous period filter
function getPreviousPeriodFilter(timeFilter, fromDate, toDate) {
  const now = new Date();
  let filter = {};

  if (timeFilter === 'yesterday') {
    const dayBeforeYesterday = new Date(now);
    dayBeforeYesterday.setDate(dayBeforeYesterday.getDate() - 2);
    const start = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate(), 0, 0, 0, 0);
    const end = new Date(dayBeforeYesterday.getFullYear(), dayBeforeYesterday.getMonth(), dayBeforeYesterday.getDate(), 23, 59, 59, 999);
    filter = { createdAt: { $gte: start, $lte: end } };
  } else if (timeFilter === 'today') {
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);
    const startOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0, 0);
    const endOfYesterday = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59, 999);
    filter = { createdAt: { $gte: startOfYesterday, $lte: endOfYesterday } };
  } else if (timeFilter === 'tomorrow') {
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0, 0);
    const endOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    filter = { createdAt: { $gte: startOfToday, $lte: endOfToday } };
  } else if (timeFilter === 'week') {
    const twoWeeksAgo = new Date(now);
    twoWeeksAgo.setDate(twoWeeksAgo.getDate() - 14);
    const oneWeekAgo = new Date(now);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    filter = { createdAt: { $gte: twoWeeksAgo, $lt: oneWeekAgo } };
  } else if (timeFilter === 'month') {
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    filter = { createdAt: { $gte: lastMonthStart, $lte: lastMonthEnd } };
  } else if (timeFilter === 'dateRange' && fromDate && toDate) {
    // Previous period = same duration before fromDate
    const from = new Date(fromDate);
    const to = new Date(toDate);
    const durationMs = to.getTime() - from.getTime();
    const prevEnd = new Date(from.getTime() - 1);
    const prevStart = new Date(prevEnd.getTime() - durationMs);
    prevStart.setHours(0, 0, 0, 0);
    prevEnd.setHours(23, 59, 59, 999);
    filter = { createdAt: { $gte: prevStart, $lte: prevEnd } };
  }

  return filter;
}
