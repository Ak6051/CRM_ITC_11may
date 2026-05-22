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

// Models
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
const callLogRoutes = require('./routes/callLog.route');
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

// Connect to MongoDB
connectDB();

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
app.use('/api/calllog', callLogRoutes);
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

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    methods: ['GET', 'POST'],
    credentials: true,
  },
  transports: ['websocket'],
  pingTimeout: 60000,
  pingInterval: 25000,
});
global.io = io;

const onlineUsers = new Map();

io.on('connection', (socket) => {
  console.log('New client connected');

  socket.on('addUser', (userId) => {
    onlineUsers.set(userId, socket.id);
    io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
  });

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
      if (onlineUsers.has(receiverId)) {
        io.to(onlineUsers.get(receiverId)).emit('getMessage', savedMessage);
      }
      io.to(socket.id).emit('getMessage', savedMessage);
    } catch (error) {
      console.error('Error sending message:', error);
    }
  });

  socket.on('messageRead', async ({ messageId, userId }) => {
    try {
      await ChatBox.findByIdAndUpdate(messageId, { isRead: true });
      io.to(socket.id).emit('messageReadSuccess', { messageId });
    } catch (error) {
      console.error('Error marking message as read:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    for (const [userId, socketId] of onlineUsers.entries()) {
      if (socketId === socket.id) {
        onlineUsers.delete(userId);
        io.emit('getOnlineUsers', Array.from(onlineUsers.keys()));
        break;
      }
    }
  });
});

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

io.on('connection', (socket) => {
  const userId = socket.userId;
  if (!userId) return;
  console.log(`🟢 Socket connected: ${socket.id} (userId: ${userId})`);
  socket.join(userId);
  socket.on('disconnect', () => {
    console.log(`🔴 Socket disconnected: ${socket.id}`);
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
