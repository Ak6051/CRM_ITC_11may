const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const settingsRoutes = require('./routes/logo.setting.route');
const profileRoutes = require('./routes/profile.route');
const hrRoutes = require('./routes/hr.route');
const fetchHrRoutes = require('./routes/fetch.hr.route');
const jobOpenningsRoutes = require ('./routes/jobOpennings.route');
const jobreportRoutes = require ('./routes/jobreport.route')
const jobassignRoutes = require ('./routes/jobopenningassign.route')
const addCandidateRoutes = require('./routes/addCandidate.route')
const allJobPostRoutes = require('./routes/allJobPost.route')
const candidateRoutes = require('./routes/candidate.route')
const forgotpasswordRoutes = require('./routes/forgotpassword.route')
const HrReportRoutes = require('./routes/HrReport.route')
const salesPanelRoutes = require('./routes/salesPanel.routes')
const allTypeCandidateRoute = require('./routes/allTypeCandidate.route')
const interviewRecordRoutes = require('./routes/interviewRecord.router')
// Import routes

const cors = require('cors');
require('dotenv').config();

const app = express();

// Connect to database
connectDB();

// Middleware
app.use(express.json());
app.use(cors());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', profileRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/sales', fetchHrRoutes);
app.use('/api/openning', jobOpenningsRoutes);
app.use('/api/job', jobreportRoutes);
app.use('/api/assignhr', jobassignRoutes);
app.use('/api/add',addCandidateRoutes)
app.use('/api/allType', allJobPostRoutes)
app.use('/api/fetch', candidateRoutes)
app.use('/api/changepass',forgotpasswordRoutes )
app.use('/api/report', HrReportRoutes)
app.use('/api/panel', salesPanelRoutes)
app.use('/api/candidate', allTypeCandidateRoute)
app.use('/api/interview', interviewRecordRoutes)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
