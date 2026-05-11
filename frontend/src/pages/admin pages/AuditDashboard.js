import React, { useState, useEffect, useCallback } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Chip,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  Pagination,
  Tooltip,
  IconButton,
  Stack,
  Tab,
  Tabs,
  Badge,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import AssessmentIcon from '@mui/icons-material/Assessment';
import LogoutIcon from '@mui/icons-material/Logout';
import FilterListIcon from '@mui/icons-material/FilterList';
import PersonIcon from '@mui/icons-material/Person';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import RefreshIcon from '@mui/icons-material/Refresh';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import dayjs from 'dayjs';

const STATUS_OPTIONS = [
  { value: '', label: 'All Statuses' },
  { value: 'success', label: 'Success' },
  { value: 'blocked', label: 'Blocked' },
  { value: 'failed', label: 'Failed' },
  { value: 'force_logout', label: 'Force Logout' },
  { value: 'logout', label: 'Logout' },
];

const STATUS_COLORS = {
  success: { bg: '#dcfce7', color: '#16a34a' },
  blocked: { bg: '#fee2e2', color: '#dc2626' },
  failed: { bg: '#fef9c3', color: '#ca8a04' },
  force_logout: { bg: '#ede9fe', color: '#7c3aed' },
  logout: { bg: '#f1f5f9', color: '#475569' },
};

const AuditDashboard = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  // Filters
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [statusFilter, setStatusFilter] = useState('');
  const [userFilter, setUserFilter] = useState('');

  // HR users derived from log data for the user selector
  const [hrUsers, setHrUsers] = useState([]);

  // Force logout state
  const [forceLogoutLoading, setForceLogoutLoading] = useState({});
  const [forceLogoutMessages, setForceLogoutMessages] = useState({});

  // Active sessions
  const [activeSessions, setActiveSessions] = useState([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);
  const [sessionsError, setSessionsError] = useState('');

  // General error
  const [fetchError, setFetchError] = useState('');

  const fetchLogs = useCallback(
    async (currentPage = 1) => {
      setLoading(true);
      setFetchError('');
      try {
        const token = sessionStorage.getItem('token');
        const params = { page: currentPage };
        if (startDate) params.startDate = startDate.toISOString();
        if (endDate) params.endDate = endDate.toISOString();
        if (statusFilter) params.status = statusFilter;
        if (userFilter) params.userId = userFilter;

        const response = await axios.get(`${API_BASE_URL}/security/audit-logs`, {
          headers: { Authorization: `Bearer ${token}` },
          params,
        });

        const { logs: fetchedLogs, total: fetchedTotal, totalPages: fetchedTotalPages } =
          response.data;

        setLogs(fetchedLogs || []);
        setTotal(fetchedTotal || 0);
        setTotalPages(fetchedTotalPages || 1);

        // Build HR user list from log data (unique users with userId)
        setHrUsers((prev) => {
          const existing = new Map(prev.map((u) => [u._id, u]));
          (fetchedLogs || []).forEach((log) => {
            if (log.userId && log.userId._id) {
              existing.set(log.userId._id, {
                _id: log.userId._id,
                name:
                  log.userId.firstName && log.userId.lastName
                    ? `${log.userId.firstName} ${log.userId.lastName}`
                    : log.email,
                email: log.email,
              });
            }
          });
          return Array.from(existing.values());
        });
      } catch (error) {
        console.error('Error fetching audit logs:', error);
        setFetchError(
          error.response?.data?.message || 'Failed to load audit logs. Please try again.'
        );
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    [startDate, endDate, statusFilter, userFilter]
  );

  // Initial load
  useEffect(() => {
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch when filters change (reset to page 1)
  useEffect(() => {
    setPage(1);
    fetchLogs(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [startDate, endDate, statusFilter, userFilter]);

  // ── Active sessions fetch ──────────────────────────────────────────────────
  const fetchActiveSessions = useCallback(async () => {
    setSessionsLoading(true);
    setSessionsError('');
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/security/active-sessions`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setActiveSessions(res.data.activeSessions || []);
    } catch (err) {
      setSessionsError(err.response?.data?.message || 'Failed to load active sessions.');
    } finally {
      setSessionsLoading(false);
    }
  }, []);

  // Load active sessions when tab switches to it, and auto-refresh every 30s
  useEffect(() => {
    if (activeTab === 1) {
      fetchActiveSessions();
      const interval = setInterval(fetchActiveSessions, 30000);
      return () => clearInterval(interval);
    }
  }, [activeTab, fetchActiveSessions]);

  const handlePageChange = (_event, value) => {
    setPage(value);
    fetchLogs(value);
  };

  const handleForceLogout = async (userId, logId) => {
    const key = logId;
    setForceLogoutLoading((prev) => ({ ...prev, [key]: true }));
    setForceLogoutMessages((prev) => ({ ...prev, [key]: null }));
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(
        `${API_BASE_URL}/security/force-logout/${userId}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setForceLogoutMessages((prev) => ({
        ...prev,
        [key]: { type: 'success', text: 'User has been logged out successfully.' },
      }));
      // Refresh active sessions after force logout
      setTimeout(fetchActiveSessions, 800);
    } catch (error) {
      setForceLogoutMessages((prev) => ({
        ...prev,
        [key]: {
          type: 'error',
          text: error.response?.data?.message || 'Force logout failed. Please try again.',
        },
      }));
    } finally {
      setForceLogoutLoading((prev) => ({ ...prev, [key]: false }));
    }
  };

  const formatTimestamp = (ts) => {
    if (!ts) return '—';
    return dayjs(ts).format('YYYY-MM-DD HH:mm:ss');
  };

  const getStatusChip = (status) => {
    const colors = STATUS_COLORS[status] || { bg: '#f1f5f9', color: '#64748b' };
    return (
      <Chip
        label={status || '—'}
        size="small"
        sx={{
          bgcolor: colors.bg,
          color: colors.color,
          fontWeight: 700,
          fontSize: '0.72rem',
          textTransform: 'capitalize',
        }}
      />
    );
  };

  const getUserFullName = (log) => {
    if (log.userId?.firstName && log.userId?.lastName) {
      return `${log.userId.firstName} ${log.userId.lastName}`;
    }
    if (log.userId?.firstName) return log.userId.firstName;
    return '—';
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div
        style={{
          position: 'fixed',
          height: '100vh',
          width: '250px',
          backgroundColor: '#3f51b5',
          color: 'white',
          zIndex: 1000,
        }}
      >
        <Sidebar />
      </div>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: '250px',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: '250px',
            right: 0,
            zIndex: 999,
            bgcolor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Navbar />
        </Box>

        <Box sx={{ p: 4, mt: '64px' }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '24px',
              p: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
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
                background: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <AssessmentIcon sx={{ fontSize: 30, color: '#fff' }} />
              </Avatar>
              <Box>
                <Typography
                  variant="h4"
                  sx={{ fontWeight: 900, color: '#fff', mb: 0.5, letterSpacing: '-0.5px' }}
                >
                  Login Audit Dashboard
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Monitor HR login activity, filter by date, status, or user, and manage active sessions
                </Typography>
              </Box>
              <Box sx={{ ml: 'auto' }}>
                <Chip
                  label={`${total} total record${total !== 1 ? 's' : ''}`}
                  sx={{
                    bgcolor: 'rgba(255,255,255,0.2)',
                    color: '#fff',
                    fontWeight: 700,
                    backdropFilter: 'blur(10px)',
                  }}
                />
              </Box>
            </Box>
          </Paper>

          {/* Tabs */}
          <Box sx={{ mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                bgcolor: '#fff', borderRadius: '16px', border: '1px solid #e0e7ff',
                px: 2, minHeight: 52,
                '& .MuiTab-root': { fontWeight: 700, textTransform: 'none', fontSize: '0.9rem', minHeight: 52 },
                '& .MuiTabs-indicator': { background: 'linear-gradient(135deg, #3949ab, #1a237e)', height: 3, borderRadius: 2 },
                '& .Mui-selected': { color: '#1a237e !important' },
              }}
            >
              <Tab label="📋 Login History" />
              <Tab
                label={
                  <Box display="flex" alignItems="center" gap={1}>
                    <FiberManualRecordIcon sx={{ fontSize: 10, color: activeSessions.length > 0 ? '#16a34a' : '#94a3b8' }} />
                    Active Sessions
                    {activeSessions.length > 0 && (
                      <Chip label={activeSessions.length} size="small"
                        sx={{ height: 18, fontSize: 11, fontWeight: 700, bgcolor: '#dcfce7', color: '#15803d', ml: 0.5 }} />
                    )}
                  </Box>
                }
              />
            </Tabs>
          </Box>

          {/* ── Active Sessions Tab ── */}
          {activeTab === 1 && (
            <Paper elevation={0} sx={{ borderRadius: '20px', border: '2px solid #e0e7ff', bgcolor: '#fff', overflow: 'hidden' }}>
              <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
                <Avatar sx={{ width: 44, height: 44, background: 'linear-gradient(135deg, #16a34a, #15803d)' }}>
                  <FiberManualRecordIcon sx={{ color: '#fff', fontSize: 20 }} />
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" fontWeight={800} color="#1e293b">Currently Logged In</Typography>
                  <Typography variant="caption" color="#64748b">
                    Users with active sessions in the last 10 hours · auto-refreshes every 30s
                  </Typography>
                </Box>
                <Tooltip title="Refresh now">
                  <IconButton onClick={fetchActiveSessions} disabled={sessionsLoading}
                    sx={{ bgcolor: '#f0fdf4', color: '#16a34a', '&:hover': { bgcolor: '#dcfce7' } }}>
                    {sessionsLoading ? <CircularProgress size={18} sx={{ color: '#16a34a' }} /> : <RefreshIcon />}
                  </IconButton>
                </Tooltip>
              </Box>
              <Divider />

              {sessionsError && (
                <Box sx={{ p: 2 }}>
                  <Alert severity="error" sx={{ borderRadius: '10px' }}>{sessionsError}</Alert>
                </Box>
              )}

              {sessionsLoading && activeSessions.length === 0 ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
                  <CircularProgress sx={{ color: '#3949ab' }} />
                </Box>
              ) : activeSessions.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 8 }}>
                  <FiberManualRecordIcon sx={{ fontSize: 48, color: '#cbd5e1', mb: 1 }} />
                  <Typography variant="h6" color="#94a3b8" fontWeight={600}>No active sessions</Typography>
                  <Typography variant="body2" color="#cbd5e1">No users logged in within the last 10 hours.</Typography>
                </Box>
              ) : (
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f0fdf4' }}>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>User</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Role</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>IP Address</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Device</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Logged In</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Session Age</TableCell>
                        <TableCell sx={{ fontWeight: 700, color: '#1e293b' }} align="center">Force Logout</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {activeSessions.map((session) => {
                        const uid = session.userId?._id || session.userId;
                        const key = session.logId;
                        const name = session.userId?.firstName
                          ? `${session.userId.firstName} ${session.userId.lastName}`
                          : session.email;
                        const hrs = Math.floor(session.minutesAgo / 60);
                        const mins = session.minutesAgo % 60;
                        const ageLabel = hrs > 0 ? `${hrs}h ${mins}m ago` : `${mins}m ago`;
                        const isStale = session.minutesAgo > 480; // >8h = stale

                        return (
                          <React.Fragment key={key}>
                            <TableRow sx={{ '&:hover': { bgcolor: '#f0fdf4' } }}>
                              <TableCell>
                                <Box display="flex" alignItems="center" gap={1.5}>
                                  <Avatar sx={{ width: 34, height: 34, bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: 14 }}>
                                    {name?.[0]?.toUpperCase() || '?'}
                                  </Avatar>
                                  <Box>
                                    <Typography variant="body2" fontWeight={700} color="#1e293b">{name}</Typography>
                                    <Typography variant="caption" color="#64748b">{session.email}</Typography>
                                  </Box>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  label={session.userId?.role || '—'}
                                  size="small"
                                  sx={{ bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 700, fontSize: 11 }}
                                />
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#475569' }}>
                                  {session.ip || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Tooltip title={session.deviceInfo || ''}>
                                  <Typography variant="body2" color="#475569"
                                    sx={{ maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {session.deviceInfo || '—'}
                                  </Typography>
                                </Tooltip>
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" sx={{ fontFamily: 'monospace', color: '#475569' }}>
                                  {formatTimestamp(session.loginAt)}
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={<FiberManualRecordIcon sx={{ fontSize: '10px !important', color: isStale ? '#f59e0b !important' : '#16a34a !important' }} />}
                                  label={ageLabel}
                                  size="small"
                                  sx={{
                                    bgcolor: isStale ? '#fef9c3' : '#dcfce7',
                                    color: isStale ? '#a16207' : '#15803d',
                                    fontWeight: 700, fontSize: 11,
                                  }}
                                />
                              </TableCell>
                              <TableCell align="center">
                                <Tooltip title="Force logout this user immediately">
                                  <span>
                                    <IconButton size="small"
                                      disabled={forceLogoutLoading[key]}
                                      onClick={() => handleForceLogout(uid, key)}
                                      sx={{
                                        color: '#ef4444', bgcolor: '#fee2e2', borderRadius: '8px',
                                        '&:hover': { bgcolor: '#fecaca' },
                                        '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' },
                                      }}>
                                      {forceLogoutLoading[key]
                                        ? <CircularProgress size={16} sx={{ color: '#ef4444' }} />
                                        : <LogoutIcon fontSize="small" />}
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                            {forceLogoutMessages[key] && (
                              <TableRow>
                                <TableCell colSpan={7} sx={{ py: 0, border: 0 }}>
                                  <Alert severity={forceLogoutMessages[key].type}
                                    sx={{ borderRadius: '8px', mb: 1 }}
                                    onClose={() => setForceLogoutMessages(p => ({ ...p, [key]: null }))}>
                                    {forceLogoutMessages[key].text}
                                  </Alert>
                                </TableCell>
                              </TableRow>
                            )}
                          </React.Fragment>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Paper>
          )}

          {/* ── Login History Tab ── */}
          {activeTab === 0 && (<>
          <Paper
            elevation={0}
            sx={{
              borderRadius: '20px',
              p: 3,
              mb: 4,
              border: '2px solid #e0e7ff',
              background: '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
                }}
              >
                <FilterListIcon sx={{ color: '#fff' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  Filter Logs
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Narrow results by date range, status, or HR user
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Stack
                direction={{ xs: 'column', sm: 'row' }}
                spacing={2}
                flexWrap="wrap"
                useFlexGap
              >
                <DatePicker
                  label="Start Date"
                  value={startDate}
                  onChange={(val) => setStartDate(val)}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 180 },
                    },
                  }}
                />
                <DatePicker
                  label="End Date"
                  value={endDate}
                  onChange={(val) => setEndDate(val)}
                  minDate={startDate || undefined}
                  slotProps={{
                    textField: {
                      size: 'small',
                      sx: { minWidth: 180 },
                    },
                  }}
                />

                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={statusFilter}
                    label="Status"
                    onChange={(e) => setStatusFilter(e.target.value)}
                    inputProps={{ 'data-testid': 'status-filter' }}
                  >
                    {STATUS_OPTIONS.map((opt) => (
                      <MenuItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 200 }}>
                  <InputLabel>HR User</InputLabel>
                  <Select
                    value={userFilter}
                    label="HR User"
                    onChange={(e) => setUserFilter(e.target.value)}
                  >
                    <MenuItem value="">All Users</MenuItem>
                    {hrUsers.map((user) => (
                      <MenuItem key={user._id} value={user._id}>
                        {user.name} ({user.email})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {(startDate || endDate || statusFilter || userFilter) && (
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => {
                      setStartDate(null);
                      setEndDate(null);
                      setStatusFilter('');
                      setUserFilter('');
                    }}
                    sx={{
                      textTransform: 'none',
                      fontWeight: 600,
                      borderRadius: '10px',
                      borderColor: '#e0e7ff',
                      color: '#3949ab',
                      alignSelf: 'center',
                    }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Stack>
            </LocalizationProvider>
          </Paper>

          {/* Audit Log Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '20px',
              border: '2px solid #e0e7ff',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
                }}
              >
                <PersonIcon sx={{ color: '#fff' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  Login Records
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Showing page {page} of {totalPages} — {total} total{' '}
                  {total === 1 ? 'entry' : 'entries'}
                </Typography>
              </Box>
            </Box>

            <Divider />

            {fetchError && (
              <Box sx={{ p: 2 }}>
                <Alert severity="error" sx={{ borderRadius: '10px' }}>
                  {fetchError}
                </Alert>
              </Box>
            )}

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 8 }}>
                <CircularProgress sx={{ color: '#3949ab' }} />
              </Box>
            ) : logs.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <AssessmentIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                  No login records found
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                  Try adjusting your filters or check back later.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Full Name</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Email</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>IP Address</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Device Info</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Login Time</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Logout Time</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Status</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }} align="center">
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {logs.map((log) => (
                      <React.Fragment key={log._id}>
                        <TableRow
                          sx={{
                            '&:hover': { bgcolor: '#f8fafc' },
                            transition: 'background 0.2s',
                          }}
                        >
                          <TableCell>
                            <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e293b' }}>
                              {getUserFullName(log)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                              {log.email || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography
                              variant="body2"
                              sx={{ color: '#475569', fontFamily: 'monospace' }}
                            >
                              {log.ip || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Tooltip title={log.deviceInfo || ''} placement="top">
                              <Typography
                                variant="body2"
                                sx={{
                                  color: '#475569',
                                  maxWidth: 200,
                                  overflow: 'hidden',
                                  textOverflow: 'ellipsis',
                                  whiteSpace: 'nowrap',
                                }}
                              >
                                {log.deviceInfo || '—'}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#475569', fontFamily: 'monospace' }}>
                              {formatTimestamp(log.createdAt)}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#475569', fontFamily: 'monospace' }}>
                              {log.logoutAt ? formatTimestamp(log.logoutAt) : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>{getStatusChip(log.status)}</TableCell>
                          <TableCell align="center">
                            {log.userId?._id && log.status !== 'logout' && log.status !== 'force_logout' ? (
                              <IconButton
                                size="small"
                                disabled={forceLogoutLoading[log._id]}
                                onClick={() => handleForceLogout(log.userId._id, log._id)}
                                sx={{
                                  color: '#ef4444',
                                  bgcolor: '#fee2e2',
                                  borderRadius: '8px',
                                  '&:hover': { bgcolor: '#fecaca' },
                                  '&.Mui-disabled': { bgcolor: '#f1f5f9', color: '#94a3b8' },
                                }}
                                title="Force Logout"
                                aria-label="Force Logout"
                              >
                                {forceLogoutLoading[log._id] ? (
                                  <CircularProgress size={16} sx={{ color: '#ef4444' }} />
                                ) : (
                                  <LogoutIcon fontSize="small" />
                                )}
                              </IconButton>
                            ) : (
                              <Typography variant="caption" sx={{ color: '#cbd5e1' }}>
                                —
                              </Typography>
                            )}
                          </TableCell>
                        </TableRow>

                        {/* Inline force logout feedback */}
                        {forceLogoutMessages[log._id] && (
                          <TableRow>
                            <TableCell colSpan={8} sx={{ py: 0, border: 0 }}>
                              <Alert
                                severity={forceLogoutMessages[log._id].type}
                                sx={{ borderRadius: '8px', mb: 1 }}
                                onClose={() =>
                                  setForceLogoutMessages((prev) => ({
                                    ...prev,
                                    [log._id]: null,
                                  }))
                                }
                              >
                                {forceLogoutMessages[log._id].text}
                              </Alert>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}

            {/* Pagination */}
            {!loading && totalPages > 1 && (
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  py: 3,
                  borderTop: '1px solid #e0e7ff',
                }}
              >
                <Pagination
                  count={totalPages}
                  page={page}
                  onChange={handlePageChange}
                  color="primary"
                  shape="rounded"
                  sx={{
                    '& .MuiPaginationItem-root': { fontWeight: 600 },
                    '& .Mui-selected': {
                      background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%) !important',
                      color: '#fff',
                    },
                  }}
                />
              </Box>
            )}
          </Paper>
          </>)}
        </Box>
      </Box>
    </div>
  );
};

export default AuditDashboard;
