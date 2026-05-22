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
import BusinessCenterIcon from '@mui/icons-material/BusinessCenter';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import ThumbUpIcon from '@mui/icons-material/ThumbUp';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import GroupsIcon from '@mui/icons-material/Groups';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import dayjs from 'dayjs';

const MasterDashboard = () => {
  const navigate = useNavigate();
  const [timeFilter, setTimeFilter] = useState('week');
  const [countdown, setCountdown] = useState(10);
  const [dateRange, setDateRange] = useState({ from: null, to: null });
  const [dateRangeAnchor, setDateRangeAnchor] = useState(null);
  const [hrAnalytics, setHrAnalytics] = useState([]);
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
    interviewStatus: {
      onDiscussion: { count: 0, candidates: [], trend: 0 },
      onHold: { count: 0, candidates: [], trend: 0 },
      trail: { count: 0, candidates: [], trend: 0 },
      selected: { count: 0, candidates: [], trend: 0 },
      rejected: { count: 0, candidates: [], trend: 0 },
    },
    jobOpenings: {
      total: 0,
      assigned: 0,
      unassigned: 0,
      active: 0,
      thisMonth: 0,
      thisWeek: 0,
    },
    candidates: {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
    },
    workflowMetrics: {
      resumesShared: { count: 0, candidates: [], trend: 0 },
      offerAccepted: { count: 0, candidates: [], trend: 0 },
      offerRejected: { count: 0, candidates: [], trend: 0 },
      selectionAccepted: { count: 0, candidates: [], trend: 0 },
      selectionRejected: { count: 0, candidates: [], trend: 0 },
      actualJoined: { count: 0, candidates: [], trend: 0 },
      notJoined: { count: 0, candidates: [], trend: 0 },
    },
  });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');

  useEffect(() => {
    fetchDashboardData();
    fetchHrAnalytics();

    // Auto-refresh every 10 seconds
    const interval = setInterval(() => {
      fetchDashboardData();
      fetchHrAnalytics();
      setCountdown(10);
    }, 10000);

    // Countdown timer
    const countdownInterval = setInterval(() => {
      setCountdown(prev => (prev <= 1 ? 10 : prev - 1));
    }, 1000);

    // Listen for global dashboard refresh events
    const handleDashboardUpdate = () => {
      fetchDashboardData();
      fetchHrAnalytics();
      setCountdown(10);
    };
    window.addEventListener('dashboardDataUpdated', handleDashboardUpdate);

    return () => {
      clearInterval(interval);
      clearInterval(countdownInterval);
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
        params.toDate = dayjs(dateRange.to).format('YYYY-MM-DD');
      }

      const response = await axios.get(`${API_BASE_URL}/dashboard/admin`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchHrAnalytics = async () => {
    try {
      const token = sessionStorage.getItem('token');
      // Build date params matching the current timeFilter
      const params = {};
      const now = dayjs();
      if (timeFilter === 'today') {
        params.from = now.format('YYYY-MM-DD');
        params.to = now.format('YYYY-MM-DD');
      } else if (timeFilter === 'yesterday') {
        const y = now.subtract(1, 'day').format('YYYY-MM-DD');
        params.from = y; params.to = y;
      } else if (timeFilter === 'tomorrow') {
        const t = now.add(1, 'day').format('YYYY-MM-DD');
        params.from = t; params.to = t;
      } else if (timeFilter === 'week') {
        params.from = now.subtract(7, 'day').format('YYYY-MM-DD');
        params.to = now.format('YYYY-MM-DD');
      } else if (timeFilter === 'month') {
        params.from = now.startOf('month').format('YYYY-MM-DD');
        params.to = now.format('YYYY-MM-DD');
      } else if (timeFilter === 'dateRange' && dateRange.from && dateRange.to) {
        params.from = dayjs(dateRange.from).format('YYYY-MM-DD');
        params.to = dayjs(dateRange.to).format('YYYY-MM-DD');
      }

      const res = await axios.get(`${API_BASE_URL}/analytics/hr-position`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      if (res.data?.success) {
        // Aggregate per HR: sum all positions
        const hrMap = {};
        res.data.data.forEach(row => {
          const key = row.hrId || row.hrName;
          if (!hrMap[key]) {
            hrMap[key] = {
              hrId: row.hrId,
              hrName: row.hrName || 'Unknown',
              sourced: 0, selected: 0, rejected: 0,
              joined: 0, onHold: 0, backout: 0,
            };
          }
          hrMap[key].sourced += row.sourced || 0;
          hrMap[key].selected += row.selected || 0;
          hrMap[key].rejected += row.rejected || 0;
          hrMap[key].joined += row.joined || 0;
          hrMap[key].onHold += row.onHold || 0;
          hrMap[key].backout += row.backout || 0;
        });

        const hrList = Object.values(hrMap)
          .map(hr => ({
            ...hr,
            selectionRate: hr.sourced > 0
              ? Math.round((hr.selected / hr.sourced) * 100)
              : 0,
          }))
          .sort((a, b) => b.sourced - a.sourced);

        setHrAnalytics(hrList);
      }
    } catch (err) {
      console.error('Error fetching HR analytics:', err);
    }
  };

  const handleViewDetails = (candidates, title) => {
    setSelectedCandidates(candidates);
    setDialogTitle(title);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCandidates([]);
    setDialogTitle('');
  };

  const MetricCard = ({ title, count, icon, bgGradient, trend, subtitle, borderColor, candidates }) => (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        borderRadius: '20px',
        border: `2px solid ${borderColor}`,
        background: '#fff',
        position: 'relative',
        overflow: 'hidden',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        '&:hover': {
          transform: 'translateY(-8px)',
          boxShadow: `0 12px 24px ${borderColor}40`,
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          right: 0,
          width: '120px',
          height: '120px',
          background: bgGradient,
          borderRadius: '0 20px 0 100%',
          opacity: 0.1,
        },
      }}
    >
      <Box sx={{ position: 'relative', zIndex: 1 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Avatar
            sx={{
              width: 50,
              height: 50,
              background: bgGradient,
              boxShadow: `0 4px 12px ${borderColor}40`,
            }}
          >
            {icon}
          </Avatar>
          {trend !== undefined && (
            <Chip
              icon={trend >= 0 ? <TrendingUpIcon sx={{ fontSize: 16 }} /> : <TrendingDownIcon sx={{ fontSize: 16 }} />}
              label={`${trend >= 0 ? '+' : ''}${trend}%`}
              size="small"
              sx={{
                bgcolor: trend >= 0 ? '#d1fae5' : '#fee2e2',
                color: trend >= 0 ? '#065f46' : '#991b1b',
                fontWeight: 700,
                fontSize: '0.75rem',
                height: 26,
              }}
            />
          )}
        </Box>

        <Typography
          variant="h3"
          sx={{
            fontWeight: 900,
            background: bgGradient,
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            mb: 0.5,
            fontSize: '3rem',
          }}
        >
          {count}
        </Typography>

        <Typography variant="body1" sx={{ color: '#64748b', fontWeight: 700, mb: 0.5, fontSize: '1.55rem' }}>
          {title}
        </Typography>

        {subtitle && (
          <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.82rem' }}>
            {subtitle}
          </Typography>
        )}

        <Button
          fullWidth
          size="small"
          onClick={() => handleViewDetails(candidates, title)}
          sx={{
            mt: 2,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: borderColor,
            borderRadius: '10px',
            bgcolor: `${borderColor}15`,
            '&:hover': {
              bgcolor: `${borderColor}25`,
            },
          }}
        >
          View Details ({candidates?.length || 0})
        </Button>
      </Box>
    </Paper>
  );

  const StatusCard = ({ title, count, icon, color, trend, candidates }) => (
    <Card
      sx={{
        borderRadius: '16px',
        border: 'none',
        background: `linear-gradient(135deg, ${color}08 0%, ${color}18 100%)`,
        boxShadow: 'none',
        transition: 'all 0.3s',
        '&:hover': {
          boxShadow: `0 8px 24px ${color}30`,
          transform: 'scale(1.02)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1.5 }}>
          <Box
            sx={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              bgcolor: `${color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {icon}
          </Box>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1, fontSize: '2rem' }}>
              {count}
            </Typography>
          </Box>
        </Box>

        <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, display: 'block', mb: 1, fontSize: '1.05rem' }}>
          {title}
        </Typography>

        {trend !== undefined && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
            {trend >= 0 ? (
              <TrendingUpIcon sx={{ fontSize: 16, color: '#10b981' }} />
            ) : (
              <TrendingDownIcon sx={{ fontSize: 16, color: '#ef4444' }} />
            )}
            <Typography
              variant="caption"
              sx={{
                color: trend >= 0 ? '#10b981' : '#ef4444',
                fontWeight: 700,
                fontSize: '0.78rem',
              }}
            >
              {trend >= 0 ? '+' : ''}{trend}% vs last period
            </Typography>
          </Box>
        )}

        <Button
          fullWidth
          size="small"
          onClick={() => handleViewDetails(candidates, title)}
          sx={{
            mt: 1.5,
            textTransform: 'none',
            fontWeight: 700,
            fontSize: '0.85rem',
            color: color,
            borderRadius: '8px',
            bgcolor: `${color}15`,
            '&:hover': {
              bgcolor: `${color}25`,
            },
          }}
        >
          View Details ({candidates?.length || 0})
        </Button>
      </CardContent>
    </Card>
  );

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white', zIndex: 1000 }}>
        <Sidebar />
      </div>

      <Box sx={{
        flexGrow: 1,
        display: 'flex',
        flexDirection: 'column',
        ml: '250px',
        minHeight: '100vh',
      }}>
        <Box sx={{ position: 'fixed', top: 0, left: '250px', right: 0, zIndex: 999, bgcolor: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Navbar />
        </Box>

        <Box sx={{ p: 4, mt: '64px' }}>
          {/* Modern Header with Glassmorphism */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '24px',
              p: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.1)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Box>
                <Typography variant="h3" sx={{ fontWeight: 900, color: '#fff', mb: 1, letterSpacing: '-1px', fontSize: '2.4rem' }}>
                  Master Dashboard
                </Typography>
                <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.9)', mb: 0.5, fontSize: '1.05rem' }}>
                  Complete recruitment analytics & performance insights
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>
                  📅 Last updated: {dayjs().format('DD MMM YYYY, hh:mm A')}
                </Typography>

              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 1.5 }}>
                {/* Filter Dropdown */}
                <FormControl
                  size="small"
                  sx={{
                    minWidth: 180,
                    bgcolor: 'rgba(255,255,255,0.2)',
                    borderRadius: '12px',
                    backdropFilter: 'blur(10px)',
                  }}
                >
                  <Select
                    value={timeFilter}
                    onChange={(e) => {
                      const val = e.target.value;
                      setTimeFilter(val);
                      if (val === 'dateRange') {
                        setDateRangeAnchor(document.getElementById('date-range-btn'));
                      }
                    }}
                    sx={{
                      color: '#fff',
                      fontWeight: 600,
                      '.MuiOutlinedInput-notchedOutline': { border: 'none' },
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
                          bgcolor: '#fff',
                          color: '#667eea',
                          '&:hover': { bgcolor: '#f0f0ff' },
                          '&:disabled': { bgcolor: 'rgba(255,255,255,0.4)', color: 'rgba(255,255,255,0.7)' },
                          whiteSpace: 'nowrap',
                          px: 2,
                        }}
                      >
                        Apply
                      </Button>
                    </Box>
                  </LocalizationProvider>
                )}
              </Box>
            </Box>
          </Paper>



          {/* Recruitment Analytics - Modern Cards */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <AssignmentIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1, fontSize: '1.6rem' }}>
                  Recruitment Analytics
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {timeFilter === 'yesterday' ? 'Yesterday' : timeFilter === 'today' ? 'Today' : timeFilter === 'tomorrow' ? 'Tomorrow' : timeFilter === 'week' ? 'This Week' : timeFilter === 'month' ? 'This Month' : timeFilter === 'dateRange' && dateRange.from && dateRange.to ? `${dayjs(dateRange.from).format('DD MMM')} – ${dayjs(dateRange.to).format('DD MMM YYYY')}` : 'All Time'} Performance
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={3}>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Internal Interview Lineup"
                  count={dashboardData.recruitmentAnalytics.internalInterviewLineup.count}
                  subtitle="Shortlisted candidates ready for review"
                  icon={<PersonAddIcon sx={{ fontSize: 26, color: '#fff' }} />}
                  bgGradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
                  borderColor="#667eea"
                  trend={dashboardData.recruitmentAnalytics.internalInterviewLineup.trend}
                  candidates={dashboardData.recruitmentAnalytics.internalInterviewLineup.candidates}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Client Side Interview"
                  count={dashboardData.recruitmentAnalytics.employerInterview.count}
                  subtitle="Active interview rounds in progress"
                  icon={<BusinessCenterIcon sx={{ fontSize: 26, color: '#fff' }} />}
                  bgGradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
                  borderColor="#f093fb"
                  trend={dashboardData.recruitmentAnalytics.employerInterview.trend}
                  candidates={dashboardData.recruitmentAnalytics.employerInterview.candidates}
                />
              </Grid>
              <Grid item xs={12} md={4}>
                <MetricCard
                  title="Joinings Scheduled"
                  count={dashboardData.recruitmentAnalytics.joiningsScheduled.count}
                  subtitle="Confirmed joining dates set"
                  icon={<EventIcon sx={{ fontSize: 26, color: '#fff' }} />}
                  bgGradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
                  borderColor="#4facfe"
                  trend={dashboardData.recruitmentAnalytics.joiningsScheduled.trend}
                  candidates={dashboardData.recruitmentAnalytics.joiningsScheduled.candidates}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Current Status - Compact Cards */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <PendingIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1, fontSize: '1.6rem' }}>
                  Current Status Overview
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Real-time candidate pipeline status
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Decision Pending"
                  count={dashboardData.currentStatus.decisionPending.count}
                  icon={<HourglassEmptyIcon sx={{ fontSize: 24, color: '#f59e0b' }} />}
                  color="#f59e0b"
                  trend={dashboardData.currentStatus.decisionPending.trend}
                  candidates={dashboardData.currentStatus.decisionPending.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Offer Acceptance Pending"
                  count={dashboardData.currentStatus.offerAcceptancePending.count}
                  icon={<AssignmentIcon sx={{ fontSize: 24, color: '#ef4444' }} />}
                  color="#ef4444"
                  trend={dashboardData.currentStatus.offerAcceptancePending.trend}
                  candidates={dashboardData.currentStatus.offerAcceptancePending.candidates}
                />
              </Grid>

              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Selected Candidates"
                  count={dashboardData.currentStatus.selectedCandidates.count}
                  icon={<ThumbUpIcon sx={{ fontSize: 24, color: '#10b981' }} />}
                  color="#10b981"
                  trend={dashboardData.currentStatus.selectedCandidates.trend}
                  candidates={dashboardData.currentStatus.selectedCandidates.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Joining Date Pending"
                  count={dashboardData.currentStatus.joiningDatePending.count}
                  icon={<EventIcon sx={{ fontSize: 24, color: '#8b5cf6' }} />}
                  color="#8b5cf6"
                  trend={dashboardData.currentStatus.joiningDatePending.trend}
                  candidates={dashboardData.currentStatus.joiningDatePending.candidates}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Interview Status - New Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <CheckCircleIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1, fontSize: '1.6rem' }}>
                  Interview Status Tracking
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Monitor candidate interview progress
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatusCard
                  title="On Discussion"
                  count={dashboardData.interviewStatus.onDiscussion.count}
                  icon={<HourglassEmptyIcon sx={{ fontSize: 24, color: '#3b82f6' }} />}
                  color="#3b82f6"
                  trend={dashboardData.interviewStatus.onDiscussion.trend}
                  candidates={dashboardData.interviewStatus.onDiscussion.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatusCard
                  title="On Hold"
                  count={dashboardData.interviewStatus.onHold.count}
                  icon={<PendingIcon sx={{ fontSize: 24, color: '#f97316' }} />}
                  color="#f97316"
                  trend={dashboardData.interviewStatus.onHold.trend}
                  candidates={dashboardData.interviewStatus.onHold.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatusCard
                  title="Trail"
                  count={dashboardData.interviewStatus.trail.count}
                  icon={<EventIcon sx={{ fontSize: 24, color: '#06b6d4' }} />}
                  color="#06b6d4"
                  trend={dashboardData.interviewStatus.trail.trend}
                  candidates={dashboardData.interviewStatus.trail.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatusCard
                  title="Selected"
                  count={dashboardData.interviewStatus.selected.count}
                  icon={<ThumbUpIcon sx={{ fontSize: 24, color: '#10b981' }} />}
                  color="#10b981"
                  trend={dashboardData.interviewStatus.selected.trend}
                  candidates={dashboardData.interviewStatus.selected.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={2.4}>
                <StatusCard
                  title="Rejected"
                  count={dashboardData.interviewStatus.rejected.count}
                  icon={<CloseIcon sx={{ fontSize: 24, color: '#ef4444' }} />}
                  color="#ef4444"
                  trend={dashboardData.interviewStatus.rejected.trend}
                  candidates={dashboardData.interviewStatus.rejected.candidates}
                />
              </Grid>
            </Grid>
          </Box>

          {/* Workflow Analytics - Offer, Selection & Joining */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
              <Box
                sx={{
                  width: 40,
                  height: 40,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #FF512F 0%, #DD2476 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <TrendingUpIcon sx={{ color: '#fff', fontSize: 22 }} />
              </Box>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1, fontSize: '1.6rem' }}>
                  Workflow Pipeline Analytics
                </Typography>
                <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                  Detailed metrics for Resume, Offer, Selection and Joining
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Resumes Shared"
                  count={dashboardData.workflowMetrics.resumesShared.count}
                  icon={<AssignmentIcon sx={{ fontSize: 24, color: '#6366f1' }} />}
                  color="#6366f1"
                  trend={dashboardData.workflowMetrics.resumesShared.trend}
                  candidates={dashboardData.workflowMetrics.resumesShared.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Offer Accepted"
                  count={dashboardData.workflowMetrics.offerAccepted.count}
                  icon={<CheckCircleIcon sx={{ fontSize: 24, color: '#10b981' }} />}
                  color="#10b981"
                  trend={dashboardData.workflowMetrics.offerAccepted.trend}
                  candidates={dashboardData.workflowMetrics.offerAccepted.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Offer Rejected"
                  count={dashboardData.workflowMetrics.offerRejected.count}
                  icon={<CloseIcon sx={{ fontSize: 24, color: '#ef4444' }} />}
                  color="#ef4444"
                  trend={dashboardData.workflowMetrics.offerRejected.trend}
                  candidates={dashboardData.workflowMetrics.offerRejected.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Actual Joined"
                  count={dashboardData.workflowMetrics.actualJoined.count}
                  icon={<GroupsIcon sx={{ fontSize: 24, color: '#8b5cf6' }} />}
                  color="#8b5cf6"
                  trend={dashboardData.workflowMetrics.actualJoined.trend}
                  candidates={dashboardData.workflowMetrics.actualJoined.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Selection Accepted"
                  count={dashboardData.workflowMetrics.selectionAccepted.count}
                  icon={<ThumbUpIcon sx={{ fontSize: 24, color: '#10b981' }} />}
                  color="#10b981"
                  trend={dashboardData.workflowMetrics.selectionAccepted.trend}
                  candidates={dashboardData.workflowMetrics.selectionAccepted.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Selection Rejected"
                  count={dashboardData.workflowMetrics.selectionRejected.count}
                  icon={<TrendingDownIcon sx={{ fontSize: 24, color: '#ef4444' }} />}
                  color="#ef4444"
                  trend={dashboardData.workflowMetrics.selectionRejected.trend}
                  candidates={dashboardData.workflowMetrics.selectionRejected.candidates}
                />
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <StatusCard
                  title="Not Joined"
                  count={dashboardData.workflowMetrics.notJoined.count}
                  icon={<PersonAddIcon sx={{ fontSize: 24, color: '#64748b' }} />}
                  color="#64748b"
                  trend={dashboardData.workflowMetrics.notJoined.trend}
                  candidates={dashboardData.workflowMetrics.notJoined.candidates}
                />
              </Grid>
            </Grid>
          </Box>

          {/* HR Analytics Section */}
          <Box sx={{ mb: 4 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <Box
                  sx={{
                    width: 40, height: 40, borderRadius: '10px',
                    background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}
                >
                  <GroupsIcon sx={{ color: '#fff', fontSize: 22 }} />
                </Box>
                <Box>
                  <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e293b', lineHeight: 1, fontSize: '1.6rem' }}>
                    HR Analytics
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                    Per-HR performance — sourced, selected, joined
                  </Typography>
                </Box>
              </Box>
              <Button
                variant="contained"
                endIcon={<OpenInNewIcon />}
                onClick={() => navigate('/hr-analytics')}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '12px',
                  background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
                  color: '#fff',
                  px: 3,
                  boxShadow: '0 4px 12px rgba(17,153,142,0.35)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #0d7a72 0%, #2dd468 100%)',
                    boxShadow: '0 6px 16px rgba(17,153,142,0.45)',
                  },
                }}
              >
                View Full Analytics
              </Button>
            </Box>

            {hrAnalytics.length === 0 ? (
              <Paper elevation={0} sx={{ borderRadius: '16px', p: 4, textAlign: 'center', border: '2px dashed #e2e8f0' }}>
                <GroupsIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                <Typography variant="body1" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                  No HR activity for this period
                </Typography>
              </Paper>
            ) : (
              <Grid container spacing={2}>
                {hrAnalytics.map((hr, idx) => {
                  const rateColor = hr.selectionRate >= 50 ? '#10b981' : hr.selectionRate >= 25 ? '#f59e0b' : '#ef4444';
                  const rateBg = hr.selectionRate >= 50 ? '#d1fae5' : hr.selectionRate >= 25 ? '#fef3c7' : '#fee2e2';
                  const avatarColors = [
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    'linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)',
                    'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
                    'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                  ];
                  return (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={hr.hrId || idx}>
                      <Tooltip title="Click to view full HR analytics" arrow>
                        <Paper
                          elevation={0}
                          onClick={() => navigate('/hr-analytics')}
                          sx={{
                            borderRadius: '18px',
                            border: '2px solid #e2e8f0',
                            p: 2.5,
                            cursor: 'pointer',
                            transition: 'all 0.25s cubic-bezier(0.4,0,0.2,1)',
                            '&:hover': {
                              transform: 'translateY(-6px)',
                              boxShadow: '0 12px 28px rgba(17,153,142,0.18)',
                              borderColor: '#11998e',
                            },
                          }}
                        >
                          {/* HR Name + Avatar */}
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                            <Avatar
                              sx={{
                                width: 44, height: 44,
                                background: avatarColors[idx % avatarColors.length],
                                fontWeight: 800, fontSize: '1rem',
                              }}
                            >
                              {hr.hrName.trim().charAt(0).toUpperCase()}
                            </Avatar>
                            <Box sx={{ flex: 1, minWidth: 0 }}>
                              <Typography
                                variant="body1"
                                sx={{ fontWeight: 800, color: '#1e293b', fontSize: '0.95rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}
                              >
                                {hr.hrName.trim() || 'Unknown HR'}
                              </Typography>
                              <Chip
                                label={`${hr.selectionRate}% selection`}
                                size="small"
                                sx={{ bgcolor: rateBg, color: rateColor, fontWeight: 700, fontSize: '0.7rem', height: 20, mt: 0.3 }}
                              />
                            </Box>
                          </Box>

                          <Divider sx={{ mb: 1.5 }} />

                          {/* Stats Grid */}
                          <Grid container spacing={1}>
                            {[
                              { label: 'Sourced', value: hr.sourced, color: '#3b82f6', bg: '#eff6ff' },
                              { label: 'Selected', value: hr.selected, color: '#10b981', bg: '#f0fdf4' },
                              { label: 'Joined', value: hr.joined, color: '#8b5cf6', bg: '#f5f3ff' },
                              { label: 'Rejected', value: hr.rejected, color: '#ef4444', bg: '#fef2f2' },
                              { label: 'On Hold', value: hr.onHold, color: '#f59e0b', bg: '#fffbeb' },
                              { label: 'Backout', value: hr.backout, color: '#64748b', bg: '#f8fafc' },
                            ].map(stat => (
                              <Grid item xs={4} key={stat.label}>
                                <Box sx={{ textAlign: 'center', p: 0.8, bgcolor: stat.bg, borderRadius: '10px' }}>
                                  <Typography variant="h6" sx={{ fontWeight: 900, color: stat.color, fontSize: '1.1rem', lineHeight: 1 }}>
                                    {stat.value}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.65rem', fontWeight: 600 }}>
                                    {stat.label}
                                  </Typography>
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Paper>
                      </Tooltip>
                    </Grid>
                  );
                })}
              </Grid>
            )}
          </Box>

          {/* Quick Stats - Side by Side */}
          <Grid container spacing={3}>
            {/* Job Openings */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  p: 3,
                  border: '2px solid #e0e7ff',
                  background: '#fff',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    }}
                  >
                    <WorkIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.4rem' }}>
                      Job Openings
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                      Complete overview of all positions
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Grid container spacing={2}>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0f9ff', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#0284c7', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.jobOpenings.total}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        Total Jobs
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#f0fdf4', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#16a34a', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.jobOpenings.assigned}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        Assigned
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#ca8a04', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.jobOpenings.unassigned}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        Unassigned
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fae8ff', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#a855f7', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.jobOpenings.active}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        Active (30d)
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#ecfdf5', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#059669', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.jobOpenings.thisMonth}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        This Month
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={4}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#dbeafe', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#1d4ed8', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.jobOpenings.thisWeek}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        This Week
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>

            {/* Candidates Overview */}
            <Grid item xs={12} md={6}>
              <Paper
                elevation={0}
                sx={{
                  borderRadius: '20px',
                  p: 3,
                  border: '2px solid #fce7f3',
                  background: '#fff',
                }}
              >
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                  <Avatar
                    sx={{
                      width: 48,
                      height: 48,
                      background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    }}
                  >
                    <PeopleIcon />
                  </Avatar>
                  <Box>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b', fontSize: '1.4rem' }}>
                      Candidates Database
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.88rem' }}>
                      Total talent pool overview
                    </Typography>
                  </Box>
                </Box>

                <Divider sx={{ mb: 2 }} />

                <Box
                  sx={{
                    textAlign: 'center',
                    p: 3,
                    borderRadius: '16px',
                    background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                    mb: 2,
                  }}
                >
                  <PeopleIcon sx={{ fontSize: 48, color: '#fff', mb: 1 }} />
                  <Typography variant="h2" sx={{ fontWeight: 900, color: '#fff', mb: 0.5, fontSize: '3rem' }}>
                    {dashboardData.candidates.total}
                  </Typography>
                  <Typography variant="body1" sx={{ color: 'rgba(255,255,255,0.95)', fontWeight: 700, fontSize: '1rem' }}>
                    Total Candidates
                  </Typography>
                </Box>

                <Grid container spacing={2}>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#fef3c7', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#ca8a04', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.candidates.thisMonth}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        This Month
                      </Typography>
                    </Box>
                  </Grid>
                  <Grid item xs={6}>
                    <Box sx={{ textAlign: 'center', p: 2, bgcolor: '#dbeafe', borderRadius: '16px' }}>
                      <Typography variant="h3" sx={{ fontWeight: 900, color: '#0284c7', mb: 0.5, fontSize: '2.2rem' }}>
                        {dashboardData.candidates.thisWeek}
                      </Typography>
                      <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 700, fontSize: '0.9rem' }}>
                        This Week
                      </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            </Grid>
          </Grid>
        </Box>
      </Box>

      {/* Candidate Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            maxHeight: '90vh',
          },
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              {dialogTitle}
            </Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Total: {selectedCandidates.length} candidates
            </Typography>
          </Box>
          <IconButton onClick={handleCloseDialog} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedCandidates.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Candidate</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Company</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>HR Name</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Location</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Interview Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Internal Interview</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Interview Rounds</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.95rem' }}>Joining Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCandidates.map((candidate, index) => (
                    <TableRow
                      key={index}
                      sx={{
                        '&:hover': { bgcolor: '#f8fafc' },
                        transition: 'all 0.2s',
                      }}
                    >
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar
                            sx={{
                              width: 40,
                              height: 40,
                              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                              fontWeight: 700,
                            }}
                          >
                            {candidate.candidateId?.candidateName?.charAt(0) || 'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                              {candidate.candidateId?.candidateName || 'N/A'}
                            </Typography>
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                              {candidate.candidateId?.qualification || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                            <EmailIcon sx={{ fontSize: 15, color: '#64748b' }} />
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                              {candidate.candidateId?.candidateEmail || 'N/A'}
                            </Typography>
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                            <PhoneIcon sx={{ fontSize: 15, color: '#64748b' }} />
                            <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.85rem' }}>
                              {candidate.candidateId?.candidatePhone || 'N/A'}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      {/* Company Name */}
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                          {candidate.jobId?.companyName || '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 700, color: '#1e293b', fontSize: '0.92rem' }}>
                          {candidate.positionName || candidate.candidateId?.positionName || 'N/A'}
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
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <LocationOnIcon sx={{ fontSize: 16, color: '#64748b' }} />
                          <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.92rem' }}>
                            {candidate.candidateId?.currentLocation || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={candidate.lineupStatus || 'N/A'}
                          size="small"
                          sx={{
                            bgcolor: candidate.lineupStatus === 'Selected' ? '#d1fae5' :
                              candidate.lineupStatus === 'Rejected' ? '#fee2e2' : '#e0e7ff',
                            color: candidate.lineupStatus === 'Selected' ? '#065f46' :
                              candidate.lineupStatus === 'Rejected' ? '#991b1b' : '#3730a3',
                            fontWeight: 600,
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        {candidate.interviewStatus ? (
                          <Box>
                            <Chip
                              label={candidate.interviewStatus}
                              size="small"
                              sx={{
                                bgcolor:
                                  candidate.interviewStatus === 'On Discussion' ? '#dbeafe' :
                                    candidate.interviewStatus === 'On Hold' ? '#ffedd5' :
                                      candidate.interviewStatus === 'Trail' ? '#cffafe' :
                                        candidate.interviewStatus === 'Selected' ? '#d1fae5' :
                                          candidate.interviewStatus === 'Rejected' ? '#fee2e2' : '#f1f5f9',
                                color:
                                  candidate.interviewStatus === 'On Discussion' ? '#1d4ed8' :
                                    candidate.interviewStatus === 'On Hold' ? '#c2410c' :
                                      candidate.interviewStatus === 'Trail' ? '#0e7490' :
                                        candidate.interviewStatus === 'Selected' ? '#065f46' :
                                          candidate.interviewStatus === 'Rejected' ? '#991b1b' : '#475569',
                                fontWeight: 600,
                              }}
                            />
                            {candidate.interviewStatus === 'Trail' && candidate.trailDays && (
                              <Typography variant="body2" sx={{ display: 'block', color: '#64748b', mt: 0.5, fontSize: '0.85rem' }}>
                                {candidate.trailDays} day(s)
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                        )}
                      </TableCell>
                      <TableCell>
                        <Box>
                          {candidate.internalInterviewDate ? (
                            <Box>
                              <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.92rem', fontWeight: 600 }}>
                                {dayjs(candidate.internalInterviewDate).format('DD MMM YYYY')}
                              </Typography>
                              {candidate.interviewByWhom?.firstName && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                  By: {candidate.interviewByWhom.firstName} {candidate.interviewByWhom.lastName}
                                </Typography>
                              )}
                              {candidate.candidateReview && (
                                <Typography variant="caption" sx={{ color: '#94a3b8', fontSize: '0.75rem' }}>
                                  Review: {candidate.candidateReview}
                                </Typography>
                              )}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box>
                          {candidate.interviewRounds && candidate.interviewRounds.length > 0 ? (
                            <Box>
                              {candidate.interviewRounds.map((round, idx) => (
                                <Box key={idx} sx={{ mb: 1, p: 1, bgcolor: '#f8fafc', borderRadius: '4px' }}>
                                  <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b', fontSize: '0.85rem' }}>
                                    {round.roundName}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    Date: {round.roundDate ? dayjs(round.roundDate).format('DD MMM YYYY') : 'Not set'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    Time: {round.roundTime || 'Not set'}
                                  </Typography>
                                  <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                    Mode: {round.interviewMode || 'Not set'}
                                  </Typography>
                                  {round.interviewedByWhom && (
                                    <Typography variant="caption" sx={{ color: '#64748b', fontSize: '0.75rem' }}>
                                      By: {round.interviewedByWhom}
                                    </Typography>
                                  )}
                                </Box>
                              ))}
                            </Box>
                          ) : (
                            <Typography variant="body2" sx={{ color: '#94a3b8' }}>—</Typography>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#64748b', fontSize: '0.92rem' }}>
                          {candidate.joiningDate
                            ? dayjs(candidate.joiningDate).format('DD MMM YYYY')
                            : 'N/A'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ p: 6, textAlign: 'center' }}>
              <PeopleIcon sx={{ fontSize: 64, color: '#cbd5e1', mb: 2 }} />
              <Typography variant="h6" sx={{ color: '#64748b', mb: 1 }}>
                No Candidates Found
              </Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8' }}>
                There are no candidates in this category yet.
              </Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ p: 2, bgcolor: '#f8fafc' }}>
          <Button
            onClick={handleCloseDialog}
            variant="contained"
            sx={{
              textTransform: 'none',
              fontWeight: 600,
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
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

export default MasterDashboard;
