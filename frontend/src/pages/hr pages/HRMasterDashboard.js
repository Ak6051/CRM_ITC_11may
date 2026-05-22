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
  Avatar,
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
} from '@mui/material';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import PeopleIcon from '@mui/icons-material/People';
import WorkIcon from '@mui/icons-material/Work';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import EventIcon from '@mui/icons-material/Event';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import dayjs from 'dayjs';
import Popover from '@mui/material/Popover';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import LocationOnIcon from '@mui/icons-material/LocationOn';

const HRMasterDashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('week');
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [dateRangeAnchor, setDateRangeAnchor] = useState(null);
  const [dashboardData, setDashboardData] = useState({
    recruitmentAnalytics: {
      internalInterviewLineup: { count: 0, candidates: [], trend: 0 },
      employerInterview: { count: 0, candidates: [], trend: 0 },
      joiningsScheduled: { count: 0, candidates: [], trend: 0 },
    },
    currentStatus: {
      decisionPending: { count: 0, candidates: [], trend: 0 },
      offerAcceptancePending: { count: 0, candidates: [], trend: 0 },
      joiningDatePending: { count: 0, candidates: [], trend: 0 },
      selectedCandidates: { count: 0, candidates: [], trend: 0 },
    },
    myStats: {
      assignedJobs: 0,
      myCandidates: 0,
      mySelections: 0,
    },
    workflowMetrics: {
      resumesShared: { count: 0, candidates: [] },
      offerAccepted: { count: 0, candidates: [] },
      offerRejected: { count: 0, candidates: [] },
      selectionAccepted: { count: 0, candidates: [] },
      selectionRejected: { count: 0, candidates: [] },
      actualJoined: { count: 0, candidates: [] },
      notJoined: { count: 0, candidates: [] },
    },
  });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');

  useEffect(() => {
    fetchDashboardData();

    // Listen for global dashboard refresh events
    const handleDashboardUpdate = () => {
      fetchDashboardData();
    };
    window.addEventListener('dashboardDataUpdated', handleDashboardUpdate);

    return () => {
      window.removeEventListener('dashboardDataUpdated', handleDashboardUpdate);
    };
  }, [timeFilter, dateRange]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      
      const params = { timeFilter };
      if (timeFilter === 'dateRange' && dateRange.from && dateRange.to) {
        params.fromDate = dayjs(dateRange.from).format('YYYY-MM-DD');
        params.toDate   = dayjs(dateRange.to).format('YYYY-MM-DD');
      }

      // Fetch dashboard data from backend API
      const response = await axios.get(`${API_BASE_URL}/dashboard/hr`, {
        headers: { Authorization: `Bearer ${token}` },
        params
      });

      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateRangeClick = (event) => {
    setDateRangeAnchor(event.currentTarget);
  };

  const handleDateRangeClose = () => {
    setDateRangeAnchor(null);
  };

  const handleApplyDateRange = (newRange) => {
    setDateRange(newRange);
    handleDateRangeClose();
    setTimeFilter('dateRange');
  };

  const StatCard = ({ title, count, icon, color, trend, subtitle, candidates, path }) => (
    <Card sx={{
      height: '100%',
      borderRadius: '16px',
      border: '1px solid #e8eaf6',
      boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
      transition: 'all 0.3s',
      cursor: path ? 'pointer' : 'default',
      '&:hover': {
        boxShadow: '0 6px 24px rgba(63,81,181,0.15)',
        transform: 'translateY(-4px)',
        borderColor: path ? color : '#e8eaf6',
      },
    }}
    onClick={() => path && navigate(path)}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography 
              variant="caption" 
              sx={{ 
                color: '#9fa8da', 
                fontWeight: 700, 
                textTransform: 'uppercase', 
                letterSpacing: '0.08em',
                cursor: path ? 'pointer' : 'default',
                '&:hover': { color: path ? color : '#9fa8da' }
              }}
            >
              {title}
            </Typography>
            <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b', mt: 1, lineHeight: 1 }}>
              {count}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: '#64748b', mt: 0.5, display: 'block' }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box sx={{
            width: 56,
            height: 56,
            borderRadius: '14px',
            background: `linear-gradient(135deg, ${color}15, ${color}25)`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}>
            {icon}
          </Box>
        </Box>

        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
            {trend > 0 ? (
              <>
                <TrendingUpIcon sx={{ fontSize: 18, color: '#10b981' }} />
                <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 600 }}>
                  +{trend}%
                </Typography>
              </>
            ) : trend < 0 ? (
              <>
                <TrendingDownIcon sx={{ fontSize: 18, color: '#ef4444' }} />
                <Typography variant="caption" sx={{ color: '#ef4444', fontWeight: 600 }}>
                  {trend}%
                </Typography>
              </>
            ) : (
              <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                No change
              </Typography>
            )}
          </Box>
        )}

        <Button
          fullWidth
          variant="outlined"
          size="small"
          onClick={(e) => { e.stopPropagation(); setSelectedCandidates(candidates || []); setDialogTitle(title); setOpenDialog(true); }}
          sx={{
            mt: 2,
            borderRadius: '8px',
            textTransform: 'none',
            fontWeight: 600,
            borderColor: color,
            color: color,
            '&:hover': {
              borderColor: color,
              bgcolor: `${color}10`,
            },
          }}
        >
          View Details ({candidates?.length || 0})
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f8' }}>
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#1e1e2f', zIndex: 1000 }}>
        <Sidebar />
      </div>

      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        ml: '250px',
        minHeight: '100vh',
      }}>
        <Box sx={{ position: 'fixed', top: 0, left: '250px', right: 0, zIndex: 999, bgcolor: '#fff', boxShadow: '0 1px 4px rgba(63,81,181,0.12)' }}>
          <Navbar />
        </Box>

        <Box sx={{ p: 3, mt: '64px' }}>
          <Box sx={{
            bgcolor: '#fff',
            borderRadius: '16px',
            p: 3,
            mb: 3,
            boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
            background: 'linear-gradient(135deg, #1e1e2f 0%, #2d2d44 60%, #3a3a5a 100%)',
          }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.5px' }}>
                  My Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                  Your recruitment analytics & insights
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)', mt: 1, display: 'block' }}>
                  Last updated: {dayjs().format('DD MMM YYYY, hh:mm A')}
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                <FormControl size="small" sx={{ minWidth: 150, bgcolor: 'rgba(255,255,255,0.15)', borderRadius: '8px' }}>
                  <Select
                    value={timeFilter}
                    onChange={(e) => setTimeFilter(e.target.value)}
                    sx={{
                      color: '#fff',
                      '.MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.3)' },
                      '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(255,255,255,0.5)' },
                      '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#fff' },
                      '.MuiSvgIcon-root': { color: '#fff' },
                    }}
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

                {/* Date Range Picker — shown when dateRange selected */}
                {timeFilter === 'dateRange' && (
                  <LocalizationProvider dateAdapter={AdapterDayjs}>
                    <Box
                      sx={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                        bgcolor: 'rgba(255,255,255,0.15)',
                        borderRadius: '12px',
                        p: 1.5,
                        backdropFilter: 'blur(10px)',
                      }}
                    >
                      <DatePicker
                        label="From"
                        value={dateRange.from}
                        onChange={(val) => setDateRange(prev => ({ ...prev, from: val }))}
                        maxDate={dateRange.to || undefined}
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: {
                              width: 150,
                              '& .MuiInputBase-root': {
                                bgcolor: 'rgba(255,255,255,0.9)',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                              },
                              '& .MuiInputLabel-root': { fontSize: '0.82rem' },
                            },
                          },
                        }}
                      />
                      <Typography sx={{ color: '#fff', fontWeight: 700 }}>—</Typography>
                      <DatePicker
                        label="To"
                        value={dateRange.to}
                        onChange={(val) => setDateRange(prev => ({ ...prev, to: val }))}
                        minDate={dateRange.from || undefined}
                        slotProps={{
                          textField: {
                            size: 'small',
                            sx: {
                              width: 150,
                              '& .MuiInputBase-root': {
                                bgcolor: 'rgba(255,255,255,0.9)',
                                borderRadius: '8px',
                                fontSize: '0.85rem',
                              },
                              '& .MuiInputLabel-root': { fontSize: '0.82rem' },
                            },
                          },
                        }}
                      />
                      <Button
                        variant="contained"
                        size="small"
                        disabled={!dateRange.from || !dateRange.to}
                        onClick={() => fetchDashboardData()}
                        sx={{
                          textTransform: 'none',
                          fontWeight: 700,
                          borderRadius: '8px',
                          background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                          color: '#fff',
                        }}
                      >
                        Apply
                      </Button>
                    </Box>
                  </LocalizationProvider>
                )}
              </Box>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#8b5cf6', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                🎯 My Stats
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card 
                  onClick={() => navigate('/Hr-dashboard')}
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e8eaf6', 
                    boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 6px 24px rgba(63,81,181,0.15)',
                      transform: 'translateY(-4px)',
                      borderColor: '#3f51b5'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <WorkIcon sx={{ fontSize: 48, color: '#3f51b5', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.myStats.assignedJobs}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1, fontWeight: 700 }}>
                      Assigned Jobs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  onClick={() => navigate('/my-sourced-data')}
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e8eaf6', 
                    boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 6px 24px rgba(63,81,181,0.15)',
                      transform: 'translateY(-4px)',
                      borderColor: '#f59e0b'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.myStats.myCandidates}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1, fontWeight: 700 }}>
                      My Candidates
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card 
                  onClick={() => navigate('/placed-candidate-list')}
                  sx={{ 
                    borderRadius: '16px', 
                    border: '1px solid #e8eaf6', 
                    boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
                    cursor: 'pointer',
                    transition: 'all 0.3s',
                    '&:hover': {
                      boxShadow: '0 6px 24px rgba(63,81,181,0.15)',
                      transform: 'translateY(-4px)',
                      borderColor: '#10b981'
                    }
                  }}
                >
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.myStats.mySelections}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1, fontWeight: 700 }}>
                      My Selections
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>

          {/* Recruitment Analytics */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#3f51b5', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                📊 Recruitment Analytics
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Internal Interview Lineup"
                  count={dashboardData.recruitmentAnalytics.internalInterviewLineup.count}
                  subtitle="Candidates with shortlisted status"
                  icon={<AssignmentIcon sx={{ fontSize: 28, color: '#3f51b5' }} />}
                  color="#3f51b5"
                  trend={dashboardData.recruitmentAnalytics.internalInterviewLineup.trend}
                  candidates={dashboardData.recruitmentAnalytics.internalInterviewLineup.candidates}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Employer Interview"
                  count={dashboardData.recruitmentAnalytics.employerInterview.count}
                  subtitle="Total interview rounds conducted"
                  icon={<PeopleIcon sx={{ fontSize: 28, color: '#f59e0b' }} />}
                  color="#f59e0b"
                  trend={dashboardData.recruitmentAnalytics.employerInterview.trend}
                  candidates={dashboardData.recruitmentAnalytics.employerInterview.candidates}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <StatCard
                  title="Joinings Scheduled"
                  count={dashboardData.recruitmentAnalytics.joiningsScheduled.count}
                  subtitle="Candidates with confirmed joining dates"
                  icon={<EventIcon sx={{ fontSize: 28, color: '#06b6d4' }} />}
                  color="#06b6d4"
                  trend={dashboardData.recruitmentAnalytics.joiningsScheduled.trend}
                  candidates={dashboardData.recruitmentAnalytics.joiningsScheduled.candidates}
                  path="/placed-candidate-list"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Current Status */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#10b981', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                📈 Current Status Overview
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Decision Pending"
                  count={dashboardData.currentStatus.decisionPending.count}
                  subtitle="Awaiting hiring decision"
                  icon={<PendingIcon sx={{ fontSize: 28, color: '#f59e0b' }} />}
                  color="#f59e0b"
                  trend={dashboardData.currentStatus.decisionPending.trend}
                  candidates={dashboardData.currentStatus.decisionPending.candidates}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Offer Acceptance Pending"
                  count={dashboardData.currentStatus.offerAcceptancePending.count}
                  subtitle="Awaiting candidate response"
                  icon={<AssignmentIcon sx={{ fontSize: 28, color: '#ef4444' }} />}
                  color="#ef4444"
                  trend={dashboardData.currentStatus.offerAcceptancePending.trend}
                  candidates={dashboardData.currentStatus.offerAcceptancePending.candidates}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Joining Date Pending"
                  count={dashboardData.currentStatus.joiningDatePending.count}
                  subtitle="Awaiting joining date"
                  icon={<EventIcon sx={{ fontSize: 28, color: '#f97316' }} />}
                  color="#f97316"
                  trend={dashboardData.currentStatus.joiningDatePending.trend}
                  candidates={dashboardData.currentStatus.joiningDatePending.candidates}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Selected Candidates"
                  count={dashboardData.currentStatus.selectedCandidates.count}
                  subtitle="Successfully placed"
                  icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#10b981' }} />}
                  color="#10b981"
                  trend={dashboardData.currentStatus.selectedCandidates.trend}
                  candidates={dashboardData.currentStatus.selectedCandidates.candidates}
                  path="/placed-candidate-list"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Workflow Analytics */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#FF512F', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                📈 Workflow Pipeline Analytics
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Resumes Shared"
                  count={dashboardData.workflowMetrics?.resumesShared?.count || 0}
                  subtitle="Total resumes submitted"
                  icon={<AssignmentIcon sx={{ fontSize: 28, color: '#6366f1' }} />}
                  color="#6366f1"
                  candidates={dashboardData.workflowMetrics?.resumesShared?.candidates || []}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Offer Accepted"
                  count={dashboardData.workflowMetrics?.offerAccepted?.count || 0}
                  subtitle="Candidates who accepted offer"
                  icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#10b981' }} />}
                  color="#10b981"
                  candidates={dashboardData.workflowMetrics?.offerAccepted?.candidates || []}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Offer Rejected"
                  count={dashboardData.workflowMetrics?.offerRejected?.count || 0}
                  subtitle="Candidates who rejected offer"
                  icon={<CloseIcon sx={{ fontSize: 28, color: '#ef4444' }} />}
                  color="#ef4444"
                  candidates={dashboardData.workflowMetrics?.offerRejected?.candidates || []}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Actual Joined"
                  count={dashboardData.workflowMetrics?.actualJoined?.count || 0}
                  subtitle="Successfully joined candidates"
                  icon={<PeopleIcon sx={{ fontSize: 28, color: '#8b5cf6' }} />}
                  color="#8b5cf6"
                  candidates={dashboardData.workflowMetrics?.actualJoined?.candidates || []}
                  path="/placed-candidate-list"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Selection Accepted"
                  count={dashboardData.workflowMetrics?.selectionAccepted?.count || 0}
                  subtitle="Candidates who accepted selection"
                  icon={<ThumbUpIcon sx={{ fontSize: 28, color: '#10b981' }} />}
                  color="#10b981"
                  candidates={dashboardData.workflowMetrics?.selectionAccepted?.candidates || []}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Selection Rejected"
                  count={dashboardData.workflowMetrics?.selectionRejected?.count || 0}
                  subtitle="Candidates who rejected selection"
                  icon={<TrendingDownIcon sx={{ fontSize: 28, color: '#ef4444' }} />}
                  color="#ef4444"
                  candidates={dashboardData.workflowMetrics?.selectionRejected?.candidates || []}
                  path="/hr-candidates"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Not Joined"
                  count={dashboardData.workflowMetrics?.notJoined?.count || 0}
                  subtitle="Selected but didn't join"
                  icon={<PeopleIcon sx={{ fontSize: 28, color: '#64748b' }} />}
                  color="#64748b"
                  candidates={dashboardData.workflowMetrics?.notJoined?.candidates || []}
                  path="/hr-candidates"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Interview Status Tracking */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#8b5cf6', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                📊 Interview Status Tracking
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                  title="On Discussion"
                  count={dashboardData.interviewStatus?.onDiscussion?.count || 0}
                  subtitle="Candidates in discussion"
                  icon={<HourglassEmptyIcon sx={{ fontSize: 28, color: '#3b82f6' }} />}
                  color="#3b82f6"
                  trend={dashboardData.interviewStatus?.onDiscussion?.trend || 0}
                  candidates={dashboardData.interviewStatus?.onDiscussion?.candidates || []}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                  title="On Hold"
                  count={dashboardData.interviewStatus?.onHold?.count || 0}
                  subtitle="Candidates on hold"
                  icon={<PendingIcon sx={{ fontSize: 28, color: '#f97316' }} />}
                  color="#f97316"
                  trend={dashboardData.interviewStatus?.onHold?.trend || 0}
                  candidates={dashboardData.interviewStatus?.onHold?.candidates || []}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                  title="Trail"
                  count={dashboardData.interviewStatus?.trail?.count || 0}
                  subtitle="Candidates on trail"
                  icon={<EventIcon sx={{ fontSize: 28, color: '#06b6d4' }} />}
                  color="#06b6d4"
                  trend={dashboardData.interviewStatus?.trail?.trend || 0}
                  candidates={dashboardData.interviewStatus?.trail?.candidates || []}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                  title="Selected"
                  count={dashboardData.interviewStatus?.selected?.count || 0}
                  subtitle="Candidates selected"
                  icon={<ThumbUpIcon sx={{ fontSize: 28, color: '#10b981' }} />}
                  color="#10b981"
                  trend={dashboardData.interviewStatus?.selected?.trend || 0}
                  candidates={dashboardData.interviewStatus?.selected?.candidates || []}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatCard
                  title="Rejected"
                  count={dashboardData.interviewStatus?.rejected?.count || 0}
                  subtitle="Candidates rejected"
                  icon={<CloseIcon sx={{ fontSize: 28, color: '#ef4444' }} />}
                  color="#ef4444"
                  trend={dashboardData.interviewStatus?.rejected?.trend || 0}
                  candidates={dashboardData.interviewStatus?.rejected?.candidates || []}
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Candidate Details Dialog */}
  
      <Dialog
  open={openDialog}
  onClose={() => {
    setOpenDialog(false);
    setSelectedCandidates([]);
    setDialogTitle("");
  }}
  maxWidth="xl"
  fullWidth
  PaperProps={{
    sx: {
      borderRadius: "20px",
      maxHeight: "90vh",
      overflow: "hidden",
    },
  }}
>
  {/* Header */}
  <DialogTitle
    sx={{
      background:
        "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)",
      color: "#fff",
      display: "flex",
      justifyContent: "space-between",
      alignItems: "center",
      p: 3,
    }}
  >
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 800 }}>
        {dialogTitle}
      </Typography>

      <Typography
        variant="caption"
        sx={{ color: "rgba(255,255,255,0.9)" }}
      >
        Total: {selectedCandidates.length} candidates
      </Typography>
    </Box>

    <IconButton
      onClick={() => {
        setOpenDialog(false);
        setSelectedCandidates([]);
        setDialogTitle("");
      }}
      sx={{ color: "#fff" }}
    >
      <CloseIcon />
    </IconButton>
  </DialogTitle>

  {/* Content */}
  <DialogContent sx={{ p: 0 }}>
    {selectedCandidates.length > 0 ? (
      <TableContainer
        sx={{
          maxHeight: "70vh",
          overflow: "auto",
        }}
      >
        <Table stickyHeader>
          {/* Table Header */}
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8fafc" }}>
              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 220, bgcolor: "#f8fafc" }}
              >
                Candidate
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 220, bgcolor: "#f8fafc" }}
              >
                Contact
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 160, bgcolor: "#f8fafc" }}
              >
                Company
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 180, bgcolor: "#f8fafc" }}
              >
                Position
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 150, bgcolor: "#f8fafc" }}
              >
                HR Name
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 140, bgcolor: "#f8fafc" }}
              >
                Status
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 220, bgcolor: "#f8fafc" }}
              >
                Internal Interview
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 300, bgcolor: "#f8fafc" }}
              >
                Interview Rounds
              </TableCell>

              <TableCell
                sx={{ fontWeight: 700, color: "#1e293b", minWidth: 150, bgcolor: "#f8fafc" }}
              >
                Joining Date
              </TableCell>
            </TableRow>
          </TableHead>

          {/* Table Body */}
          <TableBody>
  {selectedCandidates.map((candidate, index) => (
    <TableRow
      key={index}
      hover
      sx={{
        verticalAlign: "top",
        "&:hover": {
          bgcolor: "#f8fafc",
        },
      }}
    >
      {/* Candidate */}
      <TableCell>
        <Box
          sx={{
            display: "flex",
            alignItems: "flex-start",
            gap: 1.5,
          }}
        >
          <Avatar
            sx={{
              width: 42,
              height: 42,
              background:
                "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
              fontWeight: 700,
            }}
          >
            {candidate.candidateId?.candidateName?.charAt(0) ||
              "C"}
          </Avatar>

          <Box>
            <Typography
              variant="body2"
              sx={{
                fontWeight: 700,
                color: "#1e293b",
              }}
            >
              {candidate.candidateId?.candidateName || "N/A"}
            </Typography>

            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
              }}
            >
              {candidate.candidateId?.qualification || ""}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      {/* Contact */}
      <TableCell>
        <Box>
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
              mb: 0.5,
            }}
          >
            <EmailIcon
              sx={{
                fontSize: 14,
                color: "#64748b",
              }}
            />

            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
              }}
            >
              {candidate.candidateId?.candidateEmail || "N/A"}
            </Typography>
          </Box>

          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 0.5,
            }}
          >
            <PhoneIcon
              sx={{
                fontSize: 14,
                color: "#64748b",
              }}
            />

            <Typography
              variant="caption"
              sx={{
                color: "#64748b",
              }}
            >
              {candidate.candidateId?.candidatePhone || "N/A"}
            </Typography>
          </Box>
        </Box>
      </TableCell>

      {/* Company */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}
        >
          {candidate.jobId?.companyName || '—'}
        </Typography>
      </TableCell>

      {/* Position */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            fontWeight: 700,
            color: "#1e293b",
          }}
        >
          {candidate.jobId?.jobTitle || "N/A"}
        </Typography>
      </TableCell>

      {/* HR Name */}
      <TableCell>
        {(() => {
          const hrName = candidate.createdBy
            ? `${candidate.createdBy.firstName || ''} ${candidate.createdBy.lastName || ''}`.trim()
            : candidate.createdByName || '';
          return hrName ? (
            <Chip
              label={hrName}
              size="small"
              sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 700, fontSize: '0.78rem' }}
            />
          ) : (
            <Typography variant="body2" sx={{ color: '#94a3b8', fontSize: '0.85rem' }}>—</Typography>
          );
        })()}
      </TableCell>

      {/* Status */}
      <TableCell>
        <Chip
          label={
            candidate.lineupStatus ||
            candidate.selectionStatus ||
            "N/A"
          }
          size="small"
          sx={{
            bgcolor: "#e8eaf6",
            color: "#3f51b5",
            fontWeight: 700,
            fontSize: "0.75rem",
          }}
        />
      </TableCell>

      {/* Internal Interview */}
      <TableCell>
        {candidate.internalInterviewDate ? (
          <Box>
            <Typography
              variant="body2"
              sx={{
                color: "#1e293b",
                fontWeight: 700,
                fontSize: "0.85rem",
              }}
            >
              {dayjs(candidate.internalInterviewDate).format(
                "DD MMM YYYY"
              )}
            </Typography>

            {candidate.interviewByWhom?.firstName && (
              <Typography
                display="block"
                variant="caption"
                sx={{
                  color: "#64748b",
                }}
              >
                By: {candidate.interviewByWhom.firstName}
              </Typography>
            )}

            {candidate.candidateReview && (
              <Typography
                display="block"
                variant="caption"
                sx={{
                  color: "#64748b",
                }}
              >
                Review: {candidate.candidateReview}
              </Typography>
            )}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8" }}
          >
            —
          </Typography>
        )}
      </TableCell>

      {/* Interview Rounds */}
      <TableCell>
        {candidate.interviewRounds &&
        candidate.interviewRounds.length > 0 ? (
          <Box>
            {candidate.interviewRounds.map((round, idx) => (
              <Box
                key={idx}
                sx={{
                  mb: 1,
                  p: 1,
                  bgcolor: "#f8fafc",
                  borderRadius: "6px",
                  border: "1px solid #e2e8f0",
                }}
              >
                <Typography
                  variant="body2"
                  sx={{
                    fontWeight: 700,
                    color: "#1e293b",
                    fontSize: "0.8rem",
                  }}
                >
                  {round.roundName}
                </Typography>

                <Typography
                  display="block"
                  variant="caption"
                  sx={{
                    color: "#64748b",
                  }}
                >
                  Date:{" "}
                  {round.roundDate
                    ? dayjs(round.roundDate).format(
                        "DD MMM YYYY"
                      )
                    : "Not set"}
                </Typography>

                <Typography
                  display="block"
                  variant="caption"
                  sx={{
                    color: "#64748b",
                  }}
                >
                  Mode: {round.interviewMode || "Not set"}
                </Typography>
              </Box>
            ))}
          </Box>
        ) : (
          <Typography
            variant="body2"
            sx={{ color: "#94a3b8" }}
          >
            —
          </Typography>
        )}
      </TableCell>

      {/* Joining Date */}
      <TableCell>
        <Typography
          variant="body2"
          sx={{
            color: "#1e293b",
            fontWeight: 600,
          }}
        >
          {candidate.joiningDate
            ? dayjs(candidate.joiningDate).format(
                "DD MMM YYYY"
              )
            : "—"}
        </Typography>
      </TableCell>
    </TableRow>
  ))}
</TableBody>
        </Table>
      </TableContainer>
    ) : (
      <Box sx={{ textAlign: "center", py: 8 }}>
        <Typography
          variant="h6"
          sx={{
            color: "#64748b",
            fontWeight: 700,
          }}
        >
          No candidates found
        </Typography>

        <Typography
          variant="body2"
          sx={{
            color: "#94a3b8",
            mt: 1,
          }}
        >
          No data available for this category
        </Typography>
      </Box>
    )}
  </DialogContent>

  {/* Footer */}
  <DialogActions
    sx={{
      px: 3,
      py: 2,
      borderTop: "1px solid #e8eaf6",
      bgcolor: "#fff",
    }}
  >
    <Button
      onClick={() => {
        setOpenDialog(false);
        setSelectedCandidates([]);
        setDialogTitle("");
      }}
      variant="outlined"
      sx={{
        borderRadius: "10px",
        textTransform: "none",
        fontWeight: 700,
        borderColor: "#3f51b5",
        color: "#3f51b5",
        px: 3,
      }}
    >
      Close
    </Button>
  </DialogActions>
</Dialog>
    </div>
  );
};

export default HRMasterDashboard;
