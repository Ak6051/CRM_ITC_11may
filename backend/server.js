const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const connectDB = require('./config/db');
const authRoutes = require('./routes/authRoutes');
const salesRoutes = require('./routes/salesRoutes');
const saleReportRoutes = require('./routes/sale.report.route');
const settingsRoutes = require('./routes/logo.setting.route');
const profileRoutes = require('./routes/profile.route');
const hrRoutes = require('./routes/hr.route');
const fetchHrRoutes = require('./routes/fetch.hr.route');
const employeeRoutes = require('./routes/employee.route');
const jobOpenningsRoutes = require ('./routes/jobOpennings.route');
const jobreportRoutes = require ('./routes/jobreport.route')
const jobassignRoutes = require ('./routes/jobopenningassign.route')
const hrformRoutes = require ('./routes/hrform.route')
const forwardcv = require('./routes/forwardcv.route');
const paymentRoutes = require('./routes/payment.route')

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
app.use('/api', salesRoutes);
app.use('/api/report', saleReportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/user', profileRoutes);
app.use('/api/hr', hrRoutes);
app.use('/api/sales', fetchHrRoutes);
app.use('/api/form', employeeRoutes);
app.use('/api/openning', jobOpenningsRoutes);
app.use('/api/job', jobreportRoutes);
app.use('/api/assignhr', jobassignRoutes);
app.use('/api/hrform',hrformRoutes)
app.use('/api/form', forwardcv);
app.use('api/status',paymentRoutes)


const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
