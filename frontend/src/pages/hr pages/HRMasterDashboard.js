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
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import dayjs from 'dayjs';

const HRMasterDashboard = () => {
  const [timeFilter, setTimeFilter] = useState('today');
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
  });
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidates, setSelectedCandidates] = useState([]);
  const [dialogTitle, setDialogTitle] = useState('');

  useEffect(() => {
    fetchDashboardData();
  }, [timeFilter]);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      
      // Fetch dashboard data from backend API
      const response = await axios.get(`${API_BASE_URL}/dashboard/hr`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { timeFilter }
      });

      setDashboardData(response.data);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, count, icon, color, trend, subtitle, candidates }) => (
    <Card sx={{
      height: '100%',
      borderRadius: '16px',
      border: '1px solid #e8eaf6',
      boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
      transition: 'all 0.3s',
      '&:hover': {
        boxShadow: '0 6px 24px rgba(63,81,181,0.15)',
        transform: 'translateY(-4px)',
      },
    }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Box>
            <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.08em' }}>
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
          onClick={() => { setSelectedCandidates(candidates || []); setDialogTitle(title); setOpenDialog(true); }}
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
                  <MenuItem value="today">Today</MenuItem>
                  <MenuItem value="week">This Week</MenuItem>
                  <MenuItem value="month">This Month</MenuItem>
                  <MenuItem value="all">All Time</MenuItem>
                </Select>
              </FormControl>
            </Box>
          </Box>

          {loading && <LinearProgress sx={{ mb: 2 }} />}

          {/* My Stats */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#8b5cf6', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                🎯 My Stats
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '16px', border: '1px solid #e8eaf6', boxShadow: '0 2px 12px rgba(63,81,181,0.08)' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <WorkIcon sx={{ fontSize: 48, color: '#3f51b5', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.myStats.assignedJobs}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      Assigned Jobs
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '16px', border: '1px solid #e8eaf6', boxShadow: '0 2px 12px rgba(63,81,181,0.08)' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <PeopleIcon sx={{ fontSize: 48, color: '#f59e0b', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.myStats.myCandidates}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      My Candidates
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '16px', border: '1px solid #e8eaf6', boxShadow: '0 2px 12px rgba(63,81,181,0.08)' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <CheckCircleIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.myStats.mySelections}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
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
                />
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>

      {/* Candidate Details Dialog */}
      <Dialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setSelectedCandidates([]); setDialogTitle(''); }}
        maxWidth="lg"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px', maxHeight: '90vh' } }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 3,
          }}
        >
          <Box>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>{dialogTitle}</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
              Total: {selectedCandidates.length} candidates
            </Typography>
          </Box>
          <IconButton onClick={() => { setOpenDialog(false); setSelectedCandidates([]); setDialogTitle(''); }} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0 }}>
          {selectedCandidates.length > 0 ? (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ bgcolor: '#f8fafc' }}>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Candidate</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Contact</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Position</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Status</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Interview Date</TableCell>
                    <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Joining Date</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {selectedCandidates.map((candidate, index) => (
                    <TableRow key={index} sx={{ '&:hover': { bgcolor: '#f8fafc' } }}>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Avatar sx={{ width: 40, height: 40, background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)', fontWeight: 700 }}>
                            {candidate.candidateId?.candidateName?.charAt(0) || 'C'}
                          </Avatar>
                          <Box>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {candidate.candidateId?.candidateName || candidate.candidateId?.name || 'N/A'}
                            </Typography>
                            <Typography variant="caption" sx={{ color: '#64748b' }}>
                              {candidate.candidateId?.qualification || ''}
                            </Typography>
                          </Box>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {candidate.candidateId?.email || 'N/A'}
                          </Typography>
                        </Box>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: '#64748b' }} />
                          <Typography variant="caption" sx={{ color: '#64748b' }}>
                            {candidate.candidateId?.phoneNumber || 'N/A'}
                          </Typography>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                          {candidate.jobId?.jobTitle || 'N/A'}
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          {candidate.jobId?.companyName || ''}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={candidate.lineupStatus || candidate.selectionStatus || 'N/A'}
                          size="small"
                          sx={{
                            bgcolor: '#e8eaf6',
                            color: '#3f51b5',
                            fontWeight: 600,
                            fontSize: '0.75rem',
                          }}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#1e293b' }}>
                          {candidate.interviewDate ? dayjs(candidate.interviewDate).format('DD MMM YYYY') : '—'}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" sx={{ color: '#1e293b' }}>
                          {candidate.joiningDate ? dayjs(candidate.joiningDate).format('DD MMM YYYY') : '—'}
                        </Typography>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          ) : (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Typography variant="h6" sx={{ color: '#64748b', fontWeight: 600 }}>No candidates found</Typography>
              <Typography variant="body2" sx={{ color: '#94a3b8', mt: 1 }}>No data available for this category</Typography>
            </Box>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6' }}>
          <Button
            onClick={() => { setOpenDialog(false); setSelectedCandidates([]); setDialogTitle(''); }}
            variant="outlined"
            sx={{ borderRadius: '10px', textTransform: 'none', fontWeight: 600, borderColor: '#3f51b5', color: '#3f51b5' }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default HRMasterDashboard;
