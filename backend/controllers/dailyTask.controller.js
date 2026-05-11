const DailyTask = require('../models/dailyTask.model.js');
const User = require('../models/User.js');
const SalesDailyTask = require('../models/SalesDailyTask.model.js');
const DailyTaskEditRequest = require('../models/DailyTaskEditRequest.model.js');

const createTask = async (req, res) => {
  try {
    const { hrId, companyName, position, totalCall, profilesShared, interviewsScheduled, revenueGenerated, TCEOD, PSEOD, ISEOD, RGEOD, remark } = req.body;

    // Find HR user by ID
    const hrUser = await User.findOne({ _id: hrId, role: 'HR' });

    if (!hrUser) {
      return res.status(400).json({ message: "HR user not found" });
    }

    const newTask = new DailyTask({
      hrId: hrUser._id,
      hrName: `${hrUser.firstName} ${hrUser.lastName}`,
      createdBy: req.user._id, // Admin who is creating the task
      companyName,
      position,
      totalCall: Number(totalCall) || 0,
      profilesShared: Number(profilesShared) || 0,
      interviewsScheduled: Number(interviewsScheduled) || 0,
      revenueGenerated: Number(revenueGenerated) || 0,
      TCEOD: TCEOD || '0',
      PSEOD: PSEOD || '0',
      ISEOD: ISEOD || '0',
      RGEOD: RGEOD || '0',
      remark: remark || '',
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ 
      message: "Error creating task", 
      error: error.message,
      details: error.errors 
    });
  }
};



const getAllTasks = async (req, res) => {
  try {
    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

    // 🗑 Delete old tasks (older than 3 months)
    await DailyTask.deleteMany({ createdAt: { $lt: threeMonthsAgo } });

    // ✅ Fetch only recent 3-month tasks
    const tasks = await DailyTask.find({ createdAt: { $gte: threeMonthsAgo } })
    .populate('createdBy', 'firstName lastName role')
    .sort({ createdAt: -1 }); // Sort by newest first

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};



const getHrTasks = async (req, res) => {
  try {
    const hrId = req.user.id; // Auth middleware se user ki ID
    
    // Get start and end of current day in IST
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    
    // Find tasks for today only and populate createdBy field
    const tasks = await DailyTask.find({
      hrId,
      createdAt: {
        $gte: startOfDay,
        $lt: endOfDay
      }
    })
    .populate('createdBy', 'firstName lastName role')
    .sort({ createdAt: -1 }); // Sort by newest first
    
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching HR tasks:', err);
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
};

// Get all tasks for an HR user (not just today's)
const getAllHrTasks = async (req, res) => {
  try {
    const hrId = req.user.id; // Get HR ID from auth token
    
    // Find all tasks for this HR, sorted by creation date (newest first)
    // and populate the createdBy field with user details
    const tasks = await DailyTask.find({ hrId })
      .populate('createdBy', 'firstName lastName role')
      .sort({ createdAt: -1 });
      
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching all HR tasks:', err);
    res.status(500).json({ error: 'Failed to fetch all tasks' });
  }
};



const updateTask = async (req, res) => {
  try {
    const task = await DailyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: "Only admin can update tasks" });
    }

    const {
      hrName, hrId, companyName, position, totalCall, profilesShared,
      interviewsScheduled, revenueGenerated, TCEOD,
      PSEOD, ISEOD, RGEOD, remark
    } = req.body;

    let hrUser;
    
    // First try to find by ID if provided
    if (hrId) {
      hrUser = await User.findById(hrId);
    }
    
    // If not found by ID, try by name/email
    if (!hrUser && hrName) {
      hrUser = await User.findOne({
        $or: [
          { firstName: hrName.split(' ')[0], lastName: hrName.split(' ').slice(1).join(' ') },
          { email: hrName }
        ],
        role: 'HR'
      });
    }

    if (!hrUser) {
      return res.status(400).json({ message: "HR user not found" });
    }

    // Now update all fields properly
    const updatedTask = await DailyTask.findByIdAndUpdate(
      req.params.id,
      {
        hrName: `${hrUser.firstName} ${hrUser.lastName}`,
        hrId: hrUser._id,
        companyName,
        position,
        totalCall: Number(totalCall) || 0,
        profilesShared: Number(profilesShared) || 0,
        interviewsScheduled: Number(interviewsScheduled) || 0,
        revenueGenerated: Number(revenueGenerated) || 0,
        TCEOD: TCEOD || '0',
        PSEOD: PSEOD || '0',
        ISEOD: ISEOD || '0',
        RGEOD: RGEOD || '0',
        remark: remark || '',
      },
      { new: true }
    );

    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteTask = async (req, res) => {
  try {
    const task = await DailyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: "Only admin can delete tasks" });
    }

    await DailyTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};




const getAllHRs = async (req, res) => {
  try {
    const hrs = await User.find({ role: 'HR' }, 'firstName lastName email'); // select only needed fields
    res.json(hrs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};


// Function for HR to create their own task
const createHrTask = async (req, res) => {
  try {
    const { companyName, position, totalCall, profilesShared, interviewsScheduled, revenueGenerated, TCEOD, PSEOD, ISEOD, RGEOD, remark } = req.body;
    
    // Get HR user from the request (added by auth middleware)
    const hrUser = req.user;

    const newTask = new DailyTask({
      hrId: hrUser._id,
      hrName: `${hrUser.firstName} ${hrUser.lastName}`,
      createdBy: hrUser._id, // HR is creating their own task
      companyName,
      position,
      totalCall: Number(totalCall) || 0,
      profilesShared: Number(profilesShared) || 0,
      interviewsScheduled: Number(interviewsScheduled) || 0,
      revenueGenerated: Number(revenueGenerated) || 0,
      TCEOD: TCEOD || '0',
      PSEOD: PSEOD || '0',
      ISEOD: ISEOD || '0',
      RGEOD: RGEOD || '0',
      remark: remark || '',
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createHrTask:", error);
    res.status(500).json({ 
      message: "Error creating HR task", 
      error: error.message,
      details: error.errors 
    });
  }
};

// ---------------------------------------------------------sales panel controller ----------------------------------------------------------------
const createSalesTask = async (req, res) => {
  try {
    const { TargetedLead, TargetedMeeting, TargetedAgreement, TargetedOpenings, remark } = req.body;
    
    // Get sales user from the request (added by auth middleware)
    const salesUser = req.user;

    const newTask = new SalesDailyTask({
      salesId: salesUser._id,
      salesName: `${salesUser.firstName} ${salesUser.lastName}`,
      createdBy: salesUser._id, // sales is creating their own task
      TargetedLead: TargetedLead || '0',
      TargetedMeeting: TargetedMeeting || '0',
      TargetedAgreement: TargetedAgreement || '0',
      TargetedOpenings: TargetedOpenings || '0',
      remark: remark || ''
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createSalesTask:", error);
    res.status(500).json({ 
      message: "Error creating sales task", 
      error: error.message,
      details: error.errors 
    });
  }
};

// Get all tasks for an sales user (not just today's)
const getAllSalesTasks = async (req, res) => {
  try {
    const salesId = req.user._id; // Changed from req.user.id to req.user._id
    
    // Find all tasks for this sales, sorted by creation date (newest first)
    // and populate the createdBy field with user details
    const tasks = await SalesDailyTask.find({ salesId })
      .populate('createdBy', 'firstName lastName role')
      .sort({ createdAt: -1 });
      
    res.json(tasks);
  } catch (err) {
    console.error('Error fetching all sales tasks:', err);
    res.status(500).json({ error: 'Failed to fetch all tasks', details: err.message });
  }
};

const getAllSales = async (req, res) => {
  try {
    const hrs = await User.find({ role: 'Sales' }, 'firstName lastName email'); // select only needed fields
    res.json(hrs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getSalesTasks = async (req, res) => {
  try {
    const currentDate = new Date();
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(currentDate.getMonth() - 3);

    // 🗑 Delete old tasks (older than 3 months)
    await SalesDailyTask.deleteMany({ createdAt: { $lt: threeMonthsAgo } });

    // ✅ Fetch only recent 3-month tasks
    const tasks = await SalesDailyTask.find({ createdAt: { $gte: threeMonthsAgo } })
    .populate('createdBy', 'firstName lastName role')
    .sort({ createdAt: -1 }); // Sort by newest first

    res.json(tasks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const SalesdeleteTask = async (req, res) => {
  try {
    const task = await SalesDailyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: "Only admin can delete tasks" });
    }

    await SalesDailyTask.findByIdAndDelete(req.params.id);
    res.json({ message: 'Task deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const SalesTaskCreate = async (req, res) => {
  try {
    const { salesId, TargetedLead, TargetedMeeting, TargetedAgreement, TargetedOpenings,TLEOD,TMEOD,TAEOD,TOEOD, remark } = req.body;

    // Find Sales user by ID
    const salesUser = await User.findOne({ _id: salesId, role: 'Sales' });

    if (!salesUser) {
      return res.status(400).json({ message: "Sales user not found" });
    }

    const newTask = new SalesDailyTask({
      salesId: salesUser._id,
      salesName: `${salesUser.firstName} ${salesUser.lastName}`,
      createdBy: req.user._id, // Admin who is creating the task
      TargetedLead : TargetedLead || '0',
      TargetedMeeting: TargetedMeeting || '0',
      TargetedAgreement: TargetedAgreement || '0',
      TargetedOpenings: TargetedOpenings || '0',
        TLEOD: TLEOD || '0',
      TMEOD: TMEOD || '0',
      TAEOD: TAEOD || '0',
      TOEOD: TOEOD || '0',
      remark: remark || '',
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error("Error in createTask:", error);
    res.status(500).json({ 
      message: "Error creating task", 
      error: error.message,
      details: error.errors 
    });
  }
};


const SalesupdateTask = async (req, res) => {
  try {
    const task = await SalesDailyTask.findById(req.params.id);
    if (!task) return res.status(404).json({ message: "Task not found" });

    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: "Only admin can update tasks" });
    }

    const {
      salesName, salesId, TargetedLead, TargetedMeeting, TargetedAgreement, TargetedOpenings, TLEOD,TMEOD,TAEOD,TOEOD, remark
    } = req.body;

    let salesUser;
    
    // First try to find by ID if provided
    if (salesId) {
      salesUser = await User.findById(salesId);
    }
    
    // If not found by ID, try by name/email
    if (!salesUser && salesName) {
      salesUser = await User.findOne({
        $or: [
          { firstName: salesName.split(' ')[0], lastName: salesName.split(' ').slice(1).join(' ') },
          { email: salesName }
        ],
        role: 'Sales'
      });
    }

    if (!salesUser) {
      return res.status(400).json({ message: "Sales user not found" });
    }

    // Now update all fields properly
    const updatedTask = await SalesDailyTask.findByIdAndUpdate(
      req.params.id,
      {
        salesName: `${salesUser.firstName} ${salesUser.lastName}`,
        salesId: salesUser._id,
        TargetedLead : TargetedLead || '0',
        TargetedMeeting: TargetedMeeting || '0',
        TargetedAgreement: TargetedAgreement || '0',
        TargetedOpenings: TargetedOpenings || '0',
        TLEOD : TLEOD || '0',
        TMEOD : TMEOD || '0',
        TAEOD : TAEOD || '0',
        TOEOD : TOEOD || '0',
        remark: remark || '',
      },
      { new: true }
    );

    res.json(updatedTask);
  } catch (err) {
    console.error("Error updating task:", err);
    res.status(500).json({ error: err.message });
  }
};

// -------------------------------------------------------
// HR Edit Request: HR submits a request to edit their task
// -------------------------------------------------------

/**
 * HR submits an edit request for one of their tasks.
 * The task itself is NOT modified until admin approves.
 */
const hrRequestTaskEdit = async (req, res) => {
  try {
    const { id } = req.params;
    const hrId = req.user._id;

    const task = await DailyTask.findById(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    // Only the HR who owns the task can request an edit
    if (task.hrId.toString() !== hrId.toString()) {
      return res.status(403).json({ message: 'You can only request edits for your own tasks' });
    }

    // Check if there is already a pending request for this task
    const existing = await DailyTaskEditRequest.findOne({ taskId: id, status: 'pending' });
    if (existing) {
      return res.status(400).json({ message: 'An edit request for this task is already pending approval' });
    }

    const {
      companyName, position, totalCall, profilesShared,
      interviewsScheduled, revenueGenerated,
      TCEOD, PSEOD, ISEOD, RGEOD, remark
    } = req.body;

    const editRequest = new DailyTaskEditRequest({
      taskId: id,
      requestedBy: hrId,
      proposedChanges: {
        companyName,
        position,
        totalCall: Number(totalCall) || 0,
        profilesShared: Number(profilesShared) || 0,
        interviewsScheduled: Number(interviewsScheduled) || 0,
        revenueGenerated: Number(revenueGenerated) || 0,
        TCEOD: TCEOD || '0',
        PSEOD: PSEOD || '0',
        ISEOD: ISEOD || '0',
        RGEOD: RGEOD || '0',
        remark: remark || ''
      },
      status: 'pending'
    });

    await editRequest.save();
    res.status(201).json({ message: 'Edit request submitted. Awaiting admin approval.', editRequest });
  } catch (err) {
    console.error('Error submitting edit request:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Admin: get all pending (or all) edit requests
 */
const getEditRequests = async (req, res) => {
  try {
    const { status } = req.query; // optional filter: pending | approved | rejected
    const filter = status ? { status } : {};

    const requests = await DailyTaskEditRequest.find(filter)
      .populate('taskId')
      .populate('requestedBy', 'firstName lastName email role')
      .populate('reviewedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Error fetching edit requests:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Admin: approve an edit request — applies proposed changes to the task
 */
const approveEditRequest = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: 'Only admin can approve edit requests' });
    }

    const editRequest = await DailyTaskEditRequest.findById(req.params.id);
    if (!editRequest) return res.status(404).json({ message: 'Edit request not found' });
    if (editRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${editRequest.status}` });
    }

    // Apply proposed changes to the original task
    const { proposedChanges } = editRequest;
    await DailyTask.findByIdAndUpdate(editRequest.taskId, proposedChanges, { new: true });

    editRequest.status = 'approved';
    editRequest.reviewedBy = req.user._id;
    editRequest.reviewNote = req.body.reviewNote || '';
    await editRequest.save();

    res.json({ message: 'Edit request approved and task updated.', editRequest });
  } catch (err) {
    console.error('Error approving edit request:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * Admin: reject an edit request
 */
const rejectEditRequest = async (req, res) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'teamleader') {
      return res.status(403).json({ message: 'Only admin can reject edit requests' });
    }

    const editRequest = await DailyTaskEditRequest.findById(req.params.id);
    if (!editRequest) return res.status(404).json({ message: 'Edit request not found' });
    if (editRequest.status !== 'pending') {
      return res.status(400).json({ message: `Request already ${editRequest.status}` });
    }

    editRequest.status = 'rejected';
    editRequest.reviewedBy = req.user._id;
    editRequest.reviewNote = req.body.reviewNote || '';
    await editRequest.save();

    res.json({ message: 'Edit request rejected.', editRequest });
  } catch (err) {
    console.error('Error rejecting edit request:', err);
    res.status(500).json({ error: err.message });
  }
};

/**
 * HR: get their own edit requests (to see status)
 */
const getMyEditRequests = async (req, res) => {
  try {
    const requests = await DailyTaskEditRequest.find({ requestedBy: req.user._id })
      .populate('taskId', 'companyName position hrName createdAt')
      .populate('reviewedBy', 'firstName lastName role')
      .sort({ createdAt: -1 });

    res.json(requests);
  } catch (err) {
    console.error('Error fetching HR edit requests:', err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
createTask,
createHrTask,
getAllTasks,
getHrTasks,
getAllHrTasks,
updateTask,
deleteTask,
getAllHRs,
createSalesTask,
getAllSalesTasks,
getAllSales,
getSalesTasks,
SalesdeleteTask,
SalesTaskCreate,
SalesupdateTask,
// Edit request
hrRequestTaskEdit,
getEditRequests,
approveEditRequest,
rejectEditRequest,
getMyEditRequests
};
