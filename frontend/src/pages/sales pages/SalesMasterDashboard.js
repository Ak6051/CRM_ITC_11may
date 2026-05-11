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
import WorkIcon from '@mui/icons-material/Work';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import PendingIcon from '@mui/icons-material/Pending';
import BusinessIcon from '@mui/icons-material/Business';
import CloseIcon from '@mui/icons-material/Close';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import dayjs from 'dayjs';

const SalesMasterDashboard = () => {
  const [timeFilter, setTimeFilter] = useState('today');
  const [dashboardData, setDashboardData] = useState({
    myJobOpenings: {
      total: 0,
      converted: 0,
      pending: 0,
      thisMonth: 0,
    },
    companies: {
      total: 0,
      thisMonth: 0,
      thisWeek: 0,
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
      const response = await axios.get(`${API_BASE_URL}/dashboard/sales`, {
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

  const StatCard = ({ title, count, icon, color, subtitle }) => (
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

        <Button
          fullWidth
          variant="outlined"
          size="small"
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
          View Details
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
                  Sales Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)', mt: 0.5 }}>
                  Your job openings & company analytics
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

          {/* My Job Openings */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#3f51b5', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                💼 My Job Openings
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Total Job Openings"
                  count={dashboardData.myJobOpenings.total}
                  subtitle="All job openings created by you"
                  icon={<WorkIcon sx={{ fontSize: 28, color: '#3f51b5' }} />}
                  color="#3f51b5"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Converted to Admin"
                  count={dashboardData.myJobOpenings.converted}
                  subtitle="Successfully converted jobs"
                  icon={<CheckCircleIcon sx={{ fontSize: 28, color: '#10b981' }} />}
                  color="#10b981"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="Pending Conversion"
                  count={dashboardData.myJobOpenings.pending}
                  subtitle="Awaiting conversion"
                  icon={<PendingIcon sx={{ fontSize: 28, color: '#f59e0b' }} />}
                  color="#f59e0b"
                />
              </Grid>
              <Grid item xs={12} md={3}>
                <StatCard
                  title="This Month"
                  count={dashboardData.myJobOpenings.thisMonth}
                  subtitle="Jobs created this month"
                  icon={<TrendingUpIcon sx={{ fontSize: 28, color: '#06b6d4' }} />}
                  color="#06b6d4"
                />
              </Grid>
            </Grid>
          </Box>

          {/* Companies Overview */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Box sx={{ width: 4, height: 24, bgcolor: '#8b5cf6', borderRadius: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#1e293b' }}>
                🏢 Companies Overview
              </Typography>
            </Box>
            <Grid container spacing={2}>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '16px', border: '1px solid #e8eaf6', boxShadow: '0 2px 12px rgba(63,81,181,0.08)' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <BusinessIcon sx={{ fontSize: 48, color: '#8b5cf6', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.companies.total}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      Total Companies
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '16px', border: '1px solid #e8eaf6', boxShadow: '0 2px 12px rgba(63,81,181,0.08)' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: '#10b981', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.companies.thisMonth}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      Added This Month
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
              <Grid item xs={12} md={4}>
                <Card sx={{ borderRadius: '16px', border: '1px solid #e8eaf6', boxShadow: '0 2px 12px rgba(63,81,181,0.08)' }}>
                  <CardContent sx={{ p: 3, textAlign: 'center' }}>
                    <TrendingUpIcon sx={{ fontSize: 48, color: '#06b6d4', mb: 2 }} />
                    <Typography variant="h3" sx={{ fontWeight: 800, color: '#1e293b' }}>
                      {dashboardData.companies.thisWeek}
                    </Typography>
                    <Typography variant="body2" sx={{ color: '#64748b', mt: 1 }}>
                      Added This Week
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default SalesMasterDashboard;
