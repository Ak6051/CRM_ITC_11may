const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const cors = require('cors');
const http = require('http');
const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');
require('dotenv').config();
const ChatBox = require('./models/chatbox.modal');

// Models   S
const Reminder = require('./models/reminder.model');
const Task = require('./models/task.modal');
const CandidateReminder = require('./models/candidate.reminder.model');
// Routes
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/logo.setting.route');
const profileRoutes = require('./routes/profile.route');
const hrRoutes = require('./routes/hr.route');
const fetchHrRoutes = require('./routes/fetch.hr.route');
const jobOpenningsRoutes = require('./routes/jobOpennings.route');
const jobreportRoutes = require('./routes/jobreport.route');
const jobassignRoutes = require('./routes/jobopenningassign.route');
const addCandidateRoutes = require('./routes/addCandidate.route');
const allJobPostRoutes = require('./routes/allJobPost.route');
const candidateRoutes = require('./routes/candidate.route');
const forgotpasswordRoutes = require('./routes/forgotpassword.route');
const HrReportRoutes = require('./routes/HrReport.route');
const salesPanelRoutes = require('./routes/salesPanel.routes');
const allTypeCandidateRoute = require('./routes/allTypeCandidate.route');
const interviewRecordRoutes = require('./routes/interviewRecord.router');
const userListRoutes = require('./routes/userList');
const chatboxRoutes = require('./routes/chatBox.route');
const matchingCandidateRoutes = require('./routes/matching.candidate.route');
const taskRoutes = require('./routes/task.route');
const dailyTaskRoutes = require('./routes/dailyTask.route');
const chatUsersRoutes = require('./routes/chatUsers.route');
const chatRoutes = require('./routes/chat.routes');
const masterCandidateRoutes = require('./routes/MasterCandidate.route');
const tlPermissionsRoutes = require('./routes/tlPermissions.route');
const manageUsersRoutes = require('./routes/manageUsers.route');
const candidateApplicationRoutes = require('./routes/candidateApplication.route');
const companyRoutes = require('./routes/company.route');
const companyRequestRoutes = require('./routes/companyRequest.route');
const leadRoutes = require('./routes/lead.route');
const masterDashboardRoutes = require('./routes/masterDashboard.route');
const securityRoutes = require('./routes/security.route');
const sendEmailRoutes = require('./routes/sendEmail.route');
const analyticsRoutes = require('./routes/analytics.route');

const app = express();
// const server = http.createServer(app);
// const io = new Server(server, {
//   cors: {
//     origin: process.env.FRONTEND_URL || 'http://localhost:4000',
//     methods: ['GET', 'POST'],
//     credentials: true
//   }
// });

// Connect to MongoDB
connectDB();

// Socket.IO connection - Server and io are defined later in the file
// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route Middleware
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', profileRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/sales', fetchHrRoutes);
app.use('/api/openning', jobOpenningsRoutes);
app.use('/api/job', jobreportRoutes);
app.use('/api/assignhr', jobassignRoutes);
app.use('/api/add', addCandidateRoutes);
app.use('/api/allType', allJobPostRoutes);
app.use('/api/userlist', userListRoutes);
app.use('/api/fetch', candidateRoutes);
app.use('/api/changepass', forgotpasswordRoutes);
app.use('/api/report', HrReportRoutes);
app.use('/api/panel', salesPanelRoutes);
app.use('/api/candidate', allTypeCandidateRoute);
app.use('/api/interview', interviewRecordRoutes);
app.use('/api/matching', matchingCandidateRoutes);
app.use('/api/applications', candidateApplicationRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/dailyTask', dailyTaskRoutes);
app.use('/api/chat', chatUsersRoutes);
app.use('/api/chat', chatboxRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/master', masterCandidateRoutes);
app.use('/api/tl', tlPermissionsRoutes);
app.use('/api', manageUsersRoutes);
app.use('/api/companies', companyRoutes);
app.use('/api/company-requests', companyRequestRoutes);
app.use('/api/leads', leadRoutes);
app.use('/api/dashboard', masterDashboardRoutes);
app.use('/api/security', securityRoutes);
app.use('/api/email', sendEmailRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api', [
  authRoutes,
  settingsRoutes,
  profileRoutes,
  hrRoutes,
  fetchHrRoutes,
  jobOpenningsRoutes,
  jobreportRoutes,
  jobassignRoutes,
  addCandidateRoutes,
  allJobPostRoutes,
  candidateRoutes,
  forgotpasswordRoutes,
  HrReportRoutes,
  salesPanelRoutes,
  allTypeCandidateRoute,
  interviewRecordRoutes,
  userListRoutes,
  chatRoutes,
  matchingCandidateRoutes,
  taskRoutes,
  dailyTaskRoutes,
  masterCandidateRoutes
]);
app.use('/api/dailyTask', dailyTaskRoutes);
//app.set('trust proxy', 1);


const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'], // Force websocket only (production best practice)
  pingTimeout: 60000,
  pingInterval: 25000,
});
global.io = io;

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  // Add user to online users
  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });

  // Handle new message
  socket.on('sendMessage', async ({ senderId, receiverId, message, role }) => {
    try {
      const chatMessage = new ChatBox({
        senderId,
        receiverId,
        role,
        message,
        isRead: false
      });
      
      const savedMessage = await chatMessage.save();
      
      // Emit to receiver if online
      if (onlineUsers.has(receiverId)) {
        io.to(onlineUsers.get(receiverId)).emit('getMessage', savedMessage);
      }
      
      // Emit back to sender
      io.to(socket.id).emit('getMessage', savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  // Handle message read
  socket.on('messageRead', async ({ messageId, userId }) => {
    try {
      await ChatBox.findByIdAndUpdate(messageId, { isRead: true });
      io.to(socket.id).emit('messageReadSuccess', { messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('Client disconnected');
    // Remove user from online users
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

// ✅ Socket.IO Middleware: Auth
io.use((socket, next) => {
  const token = socket.handshake.auth.token;
  if (!token) return next(new Error('Authentication error'));
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    socket.userId = decoded.userId;
    next();
  } catch (err) {
    next(new Error('Invalid token'));
  }
});

// ✅ Socket Events
io.on('connection', (socket) => {
  const userId = socket.userId;
  if (!userId) return;

  console.log(`🟢 Socket connected: ${socket.id} (userId: ${userId})`);
  socket.join(userId);

  sendInitialReminders(userId, socket);
  sendInitialCandidateReminders(userId, socket); // ✅ New for candidate

// Har 1 minute me reminder bhejna jab tak due na ho jaye
const reminderInterval = setInterval(() => {
  sendInitialReminders(userId, socket);
}, 60000); // 60,000 ms = 1 minute

socket.on('disconnect', () => {
  console.log(`🔴 Socket disconnected: ${socket.id}`);
  clearInterval(reminderInterval); // 👈 Clean up interval on disconnect
});



});

async function sendInitialReminders(userId, socket) {
  try {
    const now = new Date();
    console.log(`⏳ Checking reminders for user ${userId} at ${now.toISOString()}`);

    const reminders = await Reminder.find({
      user: userId,
      salesPanelId: { $exists: true },
      remindAt: { $lte: now },         // ✅ start showing
      remindUntil: { $gte: now },      // ✅ stop after this
      remindRepeat: true,
      isShown: false
    }).populate('salesPanelId');
    

    if (reminders.length > 0) {
      console.log(`📢 Sending ${reminders.length} reminders to user ${userId}`);
      socket.emit('initial-reminders', reminders);
    }
  } catch (err) {
    console.error('❌ Error sending reminders:', err.message);
  }
}


async function sendInitialCandidateReminders(userId, socket) {
  try {
    const now = new Date();

    const reminders = await CandidateReminder.find({
      user: userId,
      remindAt: { $lte: now },
      isShown: false
    });

    if (reminders.length > 0) {
      socket.emit('candidate-reminders', reminders);

      await CandidateReminder.updateMany(
        { _id: { $in: reminders.map(r => r._id) } },
        { $set: { isShown: true } }
      );
    }
  } catch (err) {
    console.error('❌ Error sending candidate reminders:', err.message);
  }
}


// ✅ Task Reminders Every Minute
let isProcessing = false;

async function processTaskReminders() {
  if (isProcessing) return;
  isProcessing = true;

  try {
    const now = new Date();
    const tasks = await Task.find({
      isCompleted: false,
      endDate: { $gte: now } // All future tasks
    }).lean();

    const tasksByUser = {};
    tasks.forEach(task => {
      const userId = task.userId?.toString();
      if (!userId) return;

      if (!tasksByUser[userId]) tasksByUser[userId] = [];
      tasksByUser[userId].push({
        taskId: task._id,
        taskName: task.taskName,
        endDate: task.endDate,
        timeLeft: Math.ceil((new Date(task.endDate) - now) / (60 * 1000))
      });
    });

    for (const [userId, userTasks] of Object.entries(tasksByUser)) {
      userTasks.forEach(task => {
        io.to(userId).emit('task-reminder', task);
        console.log(`📨 Sent reminder to ${userId} for task ${task.taskName}`);
      });
    }
  } catch (err) {
    console.error('❌ Error in task reminder:', err.message);
  } finally {
    isProcessing = false;
  }
}

setInterval(processTaskReminders, 1 * 60 * 1000); // every 1 minute
processTaskReminders();


// Start server
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
