import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Grid,
  Button,
  Chip,
  LinearProgress,
  MenuItem,
  Select,
  FormControl,
  Paper,
  Avatar,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import EventIcon from '@mui/icons-material/Event';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import GroupsIcon from '@mui/icons-material/Groups';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CloseIcon from '@mui/icons-material/Close';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import AssessmentIcon from '@mui/icons-material/Assessment';
import axios from 'axios';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config/api.config';
import TeamLeaderNavbar from '../../components/team leader components/TeamLeaderNavbar';
import TeamLeaderSidebar from '../../components/team leader components/TeamLeaderSidebar';

const TLDashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('week');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState({
    teamStats: { totalHRs: 0, activeHRs: 0, totalJobs: 0 },
    recruitmentAnalytics: {
      internalInterviewLineup: { count: 0, candidates: [] },
      employerInterview: { count: 0, candidates: [] },
      joiningsScheduled: { count: 0, candidates: [] },
    },
    currentStatus: {
      selectedCandidates: { count: 0, candidates: [] },
    },
    workflowMetrics: {
      resumesShared: { count: 0, candidates: [] },
      offerAccepted: { count: 0, candidates: [] },
      actualJoined: { count: 0, candidates: [] },
    },
    hrPerformance: [],
  });

  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const params = { timeFilter };
      if (timeFilter === 'dateRange' && dateRange.from && dateRange.to) {
        params.fromDate = dayjs(dateRange.from).format('YYYY-MM-DD');
        params.toDate = dayjs(dateRange.to).format('YYYY-MM-DD');
      }

      const response = await axios.get(`${API_BASE_URL}/dashboard/tl`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching TL dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCandidates([]);
  };

  const StatCard = ({ title, count, icon, color, subtitle, candidates, path }) => (
    <Card sx={{
      height: '100%',
      borderRadius: '20px',
      border: '1px solid #e2e8f0',
      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      cursor: path ? 'pointer' : 'default',
      '&:hover': {
        boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)',
        transform: 'translateY(-4px)',
        borderColor: path ? color : '#e2e8f0',
      }
    }}
    onClick={() => path && navigate(path)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
          <Box>
            <Typography variant="overline" sx={{ color: '#64748b', fontWeight: 700, letterSpacing: '0.1em' }}>
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b', mt: 0.5 }}>
              {count}
            </Typography>
          </Box>
          <Avatar sx={{ bgcolor: `${color}15`, color: color, width: 56, height: 56, borderRadius: '12px' }}>
            {icon}
          </Avatar>
        </Box>
        {subtitle && (
          <Typography variant="body2" sx={{ color: '#64748b', mb: 2 }}>
            {subtitle}
          </Typography>
        )}
        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCandidates(candidates || []);
            setDialogTitle(title);
            setOpenDialog(true);
          }}
          sx={{
            mt: 1,
            borderRadius: '10px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: '#e2e8f0',
            color: '#475569',
            '&:hover': { bgcolor: '#f8fafc', borderColor: color, color: color }
          }}
        >
          View Candidates ({candidates?.length || 0})
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <Box sx={{ width: 250, position: 'fixed', height: '100vh', zIndex: 1000 }}>
        <TeamLeaderSidebar />
      </Box>
      
      <Box sx={{ flexGrow: 1, ml: '250px', display: 'flex', flexDirection: 'column' }}>
        <TeamLeaderNavbar />
        
        <Box sx={{ p: 4, mt: '64px' }}>
          {/* Header & Filter */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4 }}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b' }}>
                TL Master Dashboard
              </Typography>
              <Typography variant="body1" sx={{ color: '#64748b', mt: 0.5 }}>
                Monitoring team performance and recruitment pipeline
              </Typography>
            </Box>
            
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 200 }}>
                <Select
                  value={timeFilter}
                  onChange={(e) => setTimeFilter(e.target.value)}
                  sx={{ borderRadius: '12px', bgcolor: '#fff', fontWeight: 600 }}
                >
                  <MenuItem value="yesterday">⏮️ Yesterday</MenuItem>
                  <MenuItem value="today">📆 Today</MenuItem>
                  <MenuItem value="tomorrow">⏭️ Tomorrow</MenuItem>
                  <MenuItem value="week">📅 This Week</MenuItem>
                  <MenuItem value="month">🗓️ This Month</MenuItem>
                  <MenuItem value="all">🌐 All Time</MenuItem>
                  <MenuItem value="dateRange">📊 Date Range</MenuItem>
                </Select>
              </FormControl>

              {timeFilter === 'dateRange' && (
                <LocalizationProvider dateAdapter={AdapterDayjs}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center', bgcolor: '#fff', p: 1.5, borderRadius: '12px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
                    <DatePicker
                      label="From"
                      value={dateRange.from}
                      onChange={(val) => setDateRange(p => ({ ...p, from: val }))}
                      slotProps={{ textField: { size: 'small', sx: { width: 140 } } }}
                    />
                    <Typography sx={{ fontWeight: 700 }}>-</Typography>
                    <DatePicker
                      label="To"
                      value={dateRange.to}
                      onChange={(val) => setDateRange(p => ({ ...p, to: val }))}
                      slotProps={{ textField: { size: 'small', sx: { width: 140 } } }}
                    />
                    <Button variant="contained" size="small" onClick={fetchDashboardData} sx={{ borderRadius: '8px' }}>Apply</Button>
                  </Box>
                </LocalizationProvider>
              )}
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 3, borderRadius: 2 }} />}

          {/* Quick Stats */}
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}><GroupsIcon sx={{ fontSize: 32 }} /></Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{dashboardData.teamStats.totalHRs}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>Total HRs Under You</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}><PersonAddIcon sx={{ fontSize: 32 }} /></Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{dashboardData.teamStats.activeHRs}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>Currently Active HRs</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
            <Grid item xs={12} md={4}>
              <Paper sx={{ p: 3, borderRadius: '20px', background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)', color: '#fff' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 60, height: 60 }}><WorkIcon sx={{ fontSize: 32 }} /></Avatar>
                  <Box>
                    <Typography variant="h3" sx={{ fontWeight: 800 }}>{dashboardData.teamStats.totalJobs}</Typography>
                    <Typography variant="body2" sx={{ opacity: 0.8, fontWeight: 600 }}>Total Team Assigned Jobs</Typography>
                  </Box>
                </Box>
              </Paper>
            </Grid>
          </Grid>

          {/* Action Center - Workflow Oriented */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            🚀 Workflow Action Center
          </Typography>
          <Grid container spacing={3} sx={{ mb: 4 }}>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                onClick={() => navigate('/tl-can-rep')}
                sx={{ 
                  p: 2.5, borderRadius: '16px', cursor: 'pointer', transition: '0.3s', height: '100%',
                  border: '1px solid #e2e8f0', '&:hover': { transform: 'translateY(-5px)', borderColor: '#6366f1', boxShadow: '0 10px 20px rgba(99, 102, 241, 0.1)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#eef2ff', color: '#6366f1' }}><PendingIcon /></Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Review Lineups</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Check candidates waiting for review.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                onClick={() => navigate('/tl-interview-repo')}
                sx={{ 
                  p: 2.5, borderRadius: '16px', cursor: 'pointer', transition: '0.3s', height: '100%',
                  border: '1px solid #e2e8f0', '&:hover': { transform: 'translateY(-5px)', borderColor: '#f59e0b', boxShadow: '0 10px 20px rgba(245, 158, 11, 0.1)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#fffbeb', color: '#f59e0b' }}><EventIcon /></Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Track Interviews</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Monitor ongoing client interviews.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                onClick={() => navigate('/tl-job-report')}
                sx={{ 
                  p: 2.5, borderRadius: '16px', cursor: 'pointer', transition: '0.3s', height: '100%',
                  border: '1px solid #e2e8f0', '&:hover': { transform: 'translateY(-5px)', borderColor: '#10b981', boxShadow: '0 10px 20px rgba(16, 185, 129, 0.1)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#ecfdf5', color: '#10b981' }}><WorkIcon /></Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Manage Jobs</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Allocate jobs to your HR team.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                onClick={() => navigate('/tl-daily-task-report')}
                sx={{ 
                  p: 2.5, borderRadius: '16px', cursor: 'pointer', transition: '0.3s', height: '100%',
                  border: '1px solid #e2e8f0', '&:hover': { transform: 'translateY(-5px)', borderColor: '#8b5cf6', boxShadow: '0 10px 20px rgba(139, 92, 246, 0.1)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#f5f3ff', color: '#8b5cf6' }}><AssessmentIcon /></Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Daily Reports</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Review today's activity logs.</Typography>
              </Paper>
            </Grid>
            <Grid item xs={12} sm={6} md={2.4}>
              <Paper 
                onClick={() => navigate('/tl-daily-task-report?tab=edit-requests')}
                sx={{ 
                  p: 2.5, borderRadius: '16px', cursor: 'pointer', transition: '0.3s', height: '100%',
                  border: '1px solid #e2e8f0', '&:hover': { transform: 'translateY(-5px)', borderColor: '#ff6b6b', boxShadow: '0 10px 20px rgba(255, 107, 107, 0.1)' }
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
                  <Avatar sx={{ bgcolor: '#fff5f5', color: '#ff6b6b' }}><PendingIcon /></Avatar>
                  <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#1e293b' }}>Edit Requests</Typography>
                </Box>
                <Typography variant="body2" sx={{ color: '#64748b' }}>Approve or reject task edit requests.</Typography>
              </Paper>
            </Grid>
          </Grid>

          {/* Team Performance Table */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            👥 Team Performance Overview
          </Typography>
          <TableContainer component={Paper} sx={{ borderRadius: '20px', border: '1px solid #e2e8f0', boxShadow: 'none', mb: 4, overflow: 'hidden' }}>
            <Table>
              <TableHead sx={{ bgcolor: '#f8fafc' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700 }}>HR Name</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Candidates Sourced</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Resumes Shared</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Selections</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Actual Joined</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="center">Status</TableCell>
                  <TableCell sx={{ fontWeight: 700 }} align="right">Action</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {dashboardData.hrPerformance.map((hr) => (
                  <TableRow key={hr.hrId} sx={{ '&:hover': { bgcolor: '#f1f5f9' } }}>
                    <TableCell sx={{ fontWeight: 600 }}>{hr.hrName}</TableCell>
                    <TableCell align="center">{hr.totalCandidates}</TableCell>
                    <TableCell align="center">{hr.resumes}</TableCell>
                    <TableCell align="center">
                      <Chip label={hr.selections} size="small" sx={{ bgcolor: '#dcfce7', color: '#166534', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip label={hr.joined} size="small" sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 700 }} />
                    </TableCell>
                    <TableCell align="center">
                      <Chip 
                        label={hr.isActive ? 'Active' : 'Inactive'} 
                        size="small" 
                        color={hr.isActive ? 'success' : 'default'}
                        variant="outlined"
                        sx={{ fontWeight: 600 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <Button 
                        size="small" 
                        variant="text" 
                        startIcon={<OpenInNewIcon />}
                        onClick={() => navigate(`/tl-hr/${hr.hrId}`)}
                        sx={{ textTransform: 'none', fontWeight: 600 }}
                      >
                        Details
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Workflow Pipeline */}
          <Typography variant="h6" sx={{ fontWeight: 700, mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            📈 Workflow Pipeline Analytics (Aggregate)
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Resumes Shared"
                count={dashboardData.workflowMetrics.resumesShared.count}
                subtitle="Total team submissions"
                icon={<AssignmentIcon />}
                color="#6366f1"
                candidates={dashboardData.workflowMetrics.resumesShared.candidates}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Offer Accepted"
                count={dashboardData.workflowMetrics.offerAccepted.count}
                subtitle="Successful negotiations"
                icon={<CheckCircleIcon />}
                color="#10b981"
                candidates={dashboardData.workflowMetrics.offerAccepted.candidates}
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <StatCard
                title="Actual Joined"
                count={dashboardData.workflowMetrics.actualJoined.count}
                subtitle="Revenue generating hires"
                icon={<ThumbUpIcon />}
                color="#8b5cf6"
                candidates={dashboardData.workflowMetrics.actualJoined.candidates}
              />
            </Grid>
          </Grid>
        </Box>

        <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="lg" fullWidth>
          <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {dialogTitle} - Candidates
            <IconButton onClick={handleCloseDialog}><CloseIcon /></IconButton>
          </DialogTitle>
          <Divider />
          <DialogContent>
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 700 }}>Candidate Name</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Job Title</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCandidates.map((c, i) => (
                    <TableRow key={i}>
                      <TableCell>{c.candidateId?.candidateName || 'N/A'}</TableCell>
                      <TableCell>{c.jobId?.jobTitle || 'N/A'}</TableCell>
                      <TableCell>{c.candidateId?.currentLocation || 'N/A'}</TableCell>
                      <TableCell><Chip label={c.lineupStatus} size="small" /></TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Close</Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Box>
  );
};

export default TLDashboard;
