import React, { useState, useEffect } from 'react';
import {
  Typography, Box, Button, Paper, Divider, FormGroup, FormControlLabel,
  Checkbox, Avatar, Chip, CircularProgress, Alert, Snackbar,
  Accordion, AccordionSummary, AccordionDetails,
  Select, MenuItem, OutlinedInput, ListItemText, FormControl, InputLabel,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import PersonIcon from '@mui/icons-material/Person';
import SecurityIcon from '@mui/icons-material/Security';
import SaveIcon from '@mui/icons-material/Save';
import LockIcon from '@mui/icons-material/Lock';
import LockOpenIcon from '@mui/icons-material/LockOpen';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';
import GroupAddIcon from '@mui/icons-material/GroupAdd';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

const TL_PERMISSION_TREE = [
  {
    pageKey: 'tl-job-report',
    pageLabel: 'Dashboard (Job Report)',
    actions: [
      { key: 'tl-job-report:post-new',          label: 'Post New Opening' },
      { key: 'tl-job-report:edit',               label: 'Edit Job' },
      { key: 'tl-job-report:delete',             label: 'Delete Job' },
      { key: 'tl-job-report:find-candidates',    label: 'Find Candidates' },
      { key: 'tl-job-report:export',             label: 'Export to Excel' },
      { key: 'tl-job-report:import',             label: 'Import Excel' },
      { key: 'tl-job-report:download-template',  label: 'Download Template' },
    ],
  },
  {
    pageKey: 'tl-hr-report',
    pageLabel: 'Placement Report',
    actions: [
      { key: 'tl-hr-report:edit',              label: 'Edit Candidate' },
      { key: 'tl-hr-report:delete',            label: 'Delete Candidate' },
      { key: 'tl-hr-report:backout',           label: 'Mark Backout' },
      { key: 'tl-hr-report:view-backout-list', label: 'View Backout Candidates' },
      { key: 'tl-hr-report:export',            label: 'Export to Excel' },
    ],
  },
  {
    pageKey: 'tl-can-rep',
    pageLabel: 'All Candidates Details',
    actions: [
      { key: 'tl-can-rep:view-detail', label: 'View Candidate Detail' },
    ],
  },
  {
    pageKey: 'tl-candidate-form',
    pageLabel: 'Candidates Form',
    actions: [
      { key: 'tl-candidate-form:submit',            label: 'Submit Candidate' },
      { key: 'tl-candidate-form:bulk-upload',       label: 'Bulk Import (Excel)' },
      { key: 'tl-candidate-form:download-template', label: 'Download Template' },
    ],
  },
  {
    pageKey: 'tl-candidate-details',
    pageLabel: 'TL Candidates Details',
    actions: [
      { key: 'tl-candidate-details:edit',   label: 'Edit Candidate' },
      { key: 'tl-candidate-details:delete', label: 'Delete Candidate' },
    ],
  },
  {
    pageKey: 'tl-interview-repo',
    pageLabel: 'Interview Details',
    actions: [
      { key: 'tl-interview-repo:filter', label: 'Filter by Date' },
      { key: 'tl-interview-repo:export', label: 'Export to Excel' },
    ],
  },
  {
    pageKey: 'tl-assigned-tasks',
    pageLabel: 'Assigned Tasks',
    actions: [
      { key: 'tl-assigned-tasks:add',      label: 'Add Task' },
      { key: 'tl-assigned-tasks:complete', label: 'Mark Complete' },
    ],
  },
  {
    pageKey: 'tl-hr-assigned-tasks',
    pageLabel: 'HR Assigned Tasks',
    actions: [
      { key: 'tl-hr-assigned-tasks:assign', label: 'Assign Task to HR' },
    ],
  },
  {
    pageKey: 'tl-daily-task-report',
    pageLabel: 'Daily Task Report',
    actions: [
      { key: 'tl-daily-task-report:create',    label: 'Create Task' },
      { key: 'tl-daily-task-report:edit',      label: 'Edit Task' },
      { key: 'tl-daily-task-report:delete',    label: 'Delete Task' },
      { key: 'tl-daily-task-report:duplicate', label: 'Duplicate Task' },
      { key: 'tl-daily-task-report:export',    label: 'Export CSV' },
    ],
  },
  {
    pageKey: 'tl-sales-daily-task-report',
    pageLabel: 'Sales Daily Task Report',
    actions: [
      { key: 'tl-sales-daily-task-report:create',    label: 'Create Task' },
      { key: 'tl-sales-daily-task-report:edit',      label: 'Edit Task' },
      { key: 'tl-sales-daily-task-report:delete',    label: 'Delete Task' },
      { key: 'tl-sales-daily-task-report:duplicate', label: 'Duplicate Task' },
      { key: 'tl-sales-daily-task-report:export',    label: 'Export CSV' },
    ],
  },
  {
    pageKey: 'tl-master-sheet',
    pageLabel: 'Master Sheet',
    actions: [
      { key: 'tl-master-sheet:create',            label: 'Create New Entry' },
      { key: 'tl-master-sheet:edit',              label: 'Edit Entry' },
      { key: 'tl-master-sheet:delete',            label: 'Delete Entry' },
      { key: 'tl-master-sheet:export',            label: 'Export CSV' },
      { key: 'tl-master-sheet:import',            label: 'Import Excel' },
      { key: 'tl-master-sheet:download-template', label: 'Download Template' },
    ],
  },
  {
    pageKey: 'tl-hr-dropdown',
    pageLabel: "All HR's (Sidebar Dropdown)",
    actions: [],
  },
  {
    pageKey: 'tl-sales-dropdown',
    pageLabel: 'Sales (Sidebar Dropdown)',
    actions: [],
  },
  {
    pageKey: 'tl-settings',
    pageLabel: 'Settings',
    actions: [
      { key: 'tl-settings:save', label: 'Save Settings' },
    ],
  },
  {
    pageKey: 'tl-profile',
    pageLabel: 'My Profile',
    actions: [
      { key: 'tl-profile:update-profile',  label: 'Update Profile' },
      { key: 'tl-profile:change-password', label: 'Change Password' },
    ],
  },
];

const ALL_KEYS = TL_PERMISSION_TREE.flatMap(p => [p.pageKey, ...p.actions.map(a => a.key)]);

// Page icon colors for visual variety
const PAGE_COLORS = [
  '#6366f1','#8b5cf6','#ec4899','#f59e0b','#10b981',
  '#3b82f6','#ef4444','#14b8a6','#f97316','#06b6d4',
  '#84cc16','#a855f7','#e11d48','#0ea5e9','#22c55e',
];

const TLPermissions = () => {
  const [tlUsers, setTlUsers] = useState([]);
  const [loadingTL, setLoadingTL] = useState(false);
  const [savingId, setSavingId] = useState(null);
  const [savingHRId, setSavingHRId] = useState(null); // for HR assignment save
  const [allHrUsers, setAllHrUsers] = useState([]);   // all HR users for dropdown
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchTLUsers = async () => {
      setLoadingTL(true);
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/tl/tl-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setTlUsers(res.data.map(u => ({
          ...u,
          permissions: u.permissions || [],
          assignedHRs: (u.assignedHRs || []).map(hr => hr._id || hr), // keep as ID array for Select
          assignedHRObjects: u.assignedHRs || [],                      // keep full objects for display
        })));
      } catch (err) {
        console.error('Error fetching TL users:', err);
      } finally {
        setLoadingTL(false);
      }
    };

    const fetchAllHRs = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/tl/all-hr-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAllHrUsers(res.data || []);
      } catch (err) {
        console.error('Error fetching HR users:', err);
      }
    };

    fetchTLUsers();
    fetchAllHRs();
  }, []);

  const isBlocked = (userId, key) => tlUsers.find(u => u._id === userId)?.permissions.includes(key) || false;

  const handleToggle = (userId, key) => {
    setTlUsers(prev => prev.map(u => {
      if (u._id !== userId) return u;
      const has = u.permissions.includes(key);
      return { ...u, permissions: has ? u.permissions.filter(p => p !== key) : [...u.permissions, key] };
    }));
  };

  const handlePageToggle = (userId, page) => {
    const allKeys = [page.pageKey, ...page.actions.map(a => a.key)];
    const user = tlUsers.find(u => u._id === userId);
    const allBlocked = allKeys.every(k => user.permissions.includes(k));
    setTlUsers(prev => prev.map(u => {
      if (u._id !== userId) return u;
      if (allBlocked) return { ...u, permissions: u.permissions.filter(p => !allKeys.includes(p)) };
      return { ...u, permissions: [...new Set([...u.permissions, ...allKeys])] };
    }));
  };

  const handleSelectAll = (userId, blockAll) => {
    setTlUsers(prev => prev.map(u => {
      if (u._id !== userId) return u;
      return { ...u, permissions: blockAll ? [...ALL_KEYS] : [] };
    }));
  };

  const handleHRAssignChange = (userId, selectedIds) => {
    setTlUsers(prev => prev.map(u =>
      u._id !== userId ? u : { ...u, assignedHRs: selectedIds }
    ));
  };

  const handleSaveHRAssignment = async (userId) => {
    setSavingHRId(userId);
    try {
      const token = sessionStorage.getItem('token');
      const user = tlUsers.find(u => u._id === userId);
      await axios.put(
        `${API_BASE_URL}/tl/tl-users/${userId}/assign-hrs`,
        { hrIds: user.assignedHRs },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: `HRs assigned to ${user.firstName} ${user.lastName}`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save HR assignment.', severity: 'error' });
    } finally {
      setSavingHRId(null);
    }
  };

  const handleSavePermissions = async (userId) => {
    setSavingId(userId);
    try {
      const token = sessionStorage.getItem('token');
      const user = tlUsers.find(u => u._id === userId);
      await axios.put(
        `${API_BASE_URL}/tl/tl-users/${userId}/permissions`,
        { permissions: user.permissions },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: `Permissions saved for ${user.firstName} ${user.lastName}`, severity: 'success' });
    } catch (err) {
      setSnackbar({ open: true, message: 'Failed to save permissions.', severity: 'error' });
    } finally {
      setSavingId(null);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f0f2f8' }}>
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#1e1e2f' }}>
        <Sidebar />
      </div>

      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flex: 1, overflowY: 'auto', p: 3, background: 'linear-gradient(135deg, #f0f2f8 0%, #e8eaf6 100%)' }}>

          {/* Header Card */}
          <Paper
            elevation={0}
            sx={{
              p: 3, mb: 3, borderRadius: 3,
              background: 'linear-gradient(135deg, #1e1e2f 0%, #3730a3 100%)',
              color: '#fff',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* decorative circles */}
            <Box sx={{ position: 'absolute', top: -30, right: -30, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }} />
            <Box sx={{ position: 'absolute', bottom: -20, right: 80, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.07)' }} />

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, position: 'relative' }}>
              <Box sx={{
                width: 52, height: 52, borderRadius: 2,
                background: 'rgba(255,255,255,0.15)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                backdropFilter: 'blur(10px)',
              }}>
                <SecurityIcon sx={{ fontSize: 28, color: '#fff' }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: '-0.3px' }}>
                  Team Leader Permissions
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.75, mt: 0.3 }}>
                  Check items to <strong>hide / block</strong> from the Team Leader. Unchecked = visible & allowed.
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Content */}
          {loadingTL ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', py: 10, gap: 2 }}>
              <CircularProgress size={48} thickness={4} sx={{ color: '#3730a3' }} />
              <Typography color="text.secondary" variant="body2">Loading Team Leaders…</Typography>
            </Box>
          ) : tlUsers.length === 0 ? (
            <Paper elevation={0} sx={{ p: 4, borderRadius: 3, textAlign: 'center', border: '1px dashed #c7d2fe' }}>
              <SecurityIcon sx={{ fontSize: 48, color: '#c7d2fe', mb: 1 }} />
              <Typography fontWeight={600} color="text.secondary">No Team Leader users found.</Typography>
              <Typography variant="body2" color="text.secondary">Register a user with role "teamleader" first.</Typography>
            </Paper>
          ) : (
            tlUsers.map((user) => {
              const blockedCount = user.permissions.length;
              const isFullAccess = blockedCount === 0;
              const isFullBlocked = blockedCount >= ALL_KEYS.length;

              return (
                <Accordion
                  key={user._id}
                  elevation={0}
                  sx={{
                    mb: 2.5, borderRadius: '16px !important',
                    border: '1px solid',
                    borderColor: isFullBlocked ? '#fecaca' : isFullAccess ? '#bbf7d0' : '#e0e7ff',
                    overflow: 'hidden',
                    '&:before': { display: 'none' },
                    transition: 'box-shadow 0.2s',
                    '&:hover': { boxShadow: '0 8px 32px rgba(55,48,163,0.10)' },
                  }}
                >
                  <AccordionSummary
                    expandIcon={<ExpandMoreIcon sx={{ color: '#6366f1' }} />}
                    sx={{
                      px: 3, py: 1.5,
                      background: isFullBlocked
                        ? 'linear-gradient(90deg,#fff5f5,#fff)'
                        : isFullAccess
                        ? 'linear-gradient(90deg,#f0fdf4,#fff)'
                        : 'linear-gradient(90deg,#eef2ff,#fff)',
                      '&.Mui-expanded': { minHeight: 64 },
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                      <Avatar
                        sx={{
                          width: 44, height: 44,
                          background: 'linear-gradient(135deg,#6366f1,#8b5cf6)',
                          fontWeight: 700, fontSize: 16,
                          boxShadow: '0 4px 12px rgba(99,102,241,0.3)',
                        }}
                      >
                        {user.firstName?.[0]?.toUpperCase() || <PersonIcon fontSize="small" />}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={700} sx={{ fontSize: 15, color: '#1e1e2f' }}>
                          {user.firstName} {user.lastName}
                        </Typography>
                        <Typography sx={{ fontSize: 12, color: '#6b7280', mt: 0.2 }}>{user.email}</Typography>
                      </Box>
                      <Chip
                        icon={isFullAccess ? <CheckCircleOutlineIcon sx={{ fontSize: '14px !important' }} /> : isFullBlocked ? <LockIcon sx={{ fontSize: '14px !important' }} /> : <LockOpenIcon sx={{ fontSize: '14px !important' }} />}
                        label={isFullAccess ? 'Full Access' : isFullBlocked ? 'All Blocked' : `${blockedCount} blocked`}
                        size="small"
                        sx={{
                          fontWeight: 600, fontSize: 11, height: 26,
                          bgcolor: isFullAccess ? '#dcfce7' : isFullBlocked ? '#fee2e2' : '#e0e7ff',
                          color: isFullAccess ? '#16a34a' : isFullBlocked ? '#dc2626' : '#4338ca',
                          border: 'none',
                          '& .MuiChip-icon': { color: 'inherit' },
                        }}
                      />
                    </Box>
                  </AccordionSummary>

                  <AccordionDetails sx={{ p: 3, bgcolor: '#fff' }}>

                    {/* Global action buttons */}
                    <Box sx={{ display: 'flex', gap: 1.5, mb: 3, flexWrap: 'wrap' }}>
                      <Button
                        size="small"
                        startIcon={<LockIcon sx={{ fontSize: 15 }} />}
                        onClick={() => handleSelectAll(user._id, true)}
                        sx={{
                          borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 12,
                          px: 2, py: 0.8,
                          bgcolor: '#fee2e2', color: '#dc2626',
                          '&:hover': { bgcolor: '#fecaca' },
                        }}
                      >
                        Block All
                      </Button>
                      <Button
                        size="small"
                        startIcon={<LockOpenIcon sx={{ fontSize: 15 }} />}
                        onClick={() => handleSelectAll(user._id, false)}
                        sx={{
                          borderRadius: 2, textTransform: 'none', fontWeight: 600, fontSize: 12,
                          px: 2, py: 0.8,
                          bgcolor: '#dcfce7', color: '#16a34a',
                          '&:hover': { bgcolor: '#bbf7d0' },
                        }}
                      >
                        Allow All
                      </Button>
                    </Box>

                    {/* ── Assign HRs Section ── */}
                    <Box sx={{
                      mb: 3, p: 2.5, borderRadius: 2.5,
                      border: '1px solid #e0e7ff',
                      background: 'linear-gradient(135deg, #eef2ff, #f8faff)',
                    }}>
                      <Box display="flex" alignItems="center" gap={1} mb={1.5}>
                        <GroupAddIcon sx={{ color: '#6366f1', fontSize: 20 }} />
                        <Typography fontWeight={700} fontSize={14} color="#1e1e2f">
                          Assign HRs Under This TL
                        </Typography>
                        {user.assignedHRs?.length > 0 && (
                          <Chip
                            label={`${user.assignedHRs.length} HR${user.assignedHRs.length > 1 ? 's' : ''} assigned`}
                            size="small"
                            sx={{ bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 700, fontSize: 11, height: 22 }}
                          />
                        )}
                      </Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1.5 }}>
                        Selected HRs will appear in this TL's sidebar dropdown. TL can view their data.
                      </Typography>

                      <Box display="flex" alignItems="flex-start" gap={2} flexWrap="wrap">
                        <FormControl size="small" sx={{ minWidth: 320, flex: 1 }}>
                          <InputLabel sx={{ fontSize: 13 }}>Select HRs to assign</InputLabel>
                          <Select
                            multiple
                            value={user.assignedHRs || []}
                            onChange={e => handleHRAssignChange(user._id, typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value)}
                            input={<OutlinedInput label="Select HRs to assign" />}
                            renderValue={(selected) => (
                              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map(id => {
                                  const hr = allHrUsers.find(h => h._id === id);
                                  return hr ? (
                                    <Chip key={id} label={`${hr.firstName} ${hr.lastName}`} size="small"
                                      sx={{ height: 22, fontSize: 11, bgcolor: '#e0e7ff', color: '#4338ca', fontWeight: 600 }} />
                                  ) : null;
                                })}
                              </Box>
                            )}
                            sx={{ borderRadius: 2, bgcolor: '#fff', fontSize: 13 }}
                            MenuProps={{ PaperProps: { sx: { maxHeight: 280 } } }}
                          >
                            {allHrUsers.length === 0 && (
                              <MenuItem disabled><em>No HR users found</em></MenuItem>
                            )}
                            {allHrUsers.map(hr => (
                              <MenuItem key={hr._id} value={hr._id} sx={{ fontSize: 13 }}>
                                <Checkbox
                                  checked={(user.assignedHRs || []).includes(hr._id)}
                                  size="small"
                                  sx={{ p: 0.5, mr: 1, '&.Mui-checked': { color: '#6366f1' } }}
                                />
                                <ListItemText
                                  primary={`${hr.firstName} ${hr.lastName}`}
                                  secondary={hr.email}
                                  primaryTypographyProps={{ fontSize: 13, fontWeight: 600 }}
                                  secondaryTypographyProps={{ fontSize: 11 }}
                                />
                              </MenuItem>
                            ))}
                          </Select>
                        </FormControl>

                        <Button
                          variant="contained"
                          size="small"
                          startIcon={savingHRId === user._id ? <CircularProgress size={13} color="inherit" /> : <GroupAddIcon sx={{ fontSize: 15 }} />}
                          onClick={() => handleSaveHRAssignment(user._id)}
                          disabled={savingHRId === user._id}
                          sx={{
                            borderRadius: 2, textTransform: 'none', fontWeight: 700, fontSize: 13,
                            px: 2.5, py: 1, height: 40, alignSelf: 'flex-start', mt: 0.5,
                            background: 'linear-gradient(135deg, #6366f1, #4f46e5)',
                            boxShadow: '0 4px 12px rgba(99,102,241,0.35)',
                            '&:hover': { background: 'linear-gradient(135deg, #4f46e5, #3730a3)' },
                            '&:disabled': { background: '#e0e7ff', color: '#a5b4fc', boxShadow: 'none' },
                          }}
                        >
                          {savingHRId === user._id ? 'Saving…' : 'Save HR Assignment'}
                        </Button>
                      </Box>

                      {/* Show currently assigned HRs as chips */}
                      {(user.assignedHRs || []).length > 0 && (
                        <Box mt={1.5} display="flex" flexWrap="wrap" gap={0.8}>
                          <Typography variant="caption" color="text.secondary" sx={{ width: '100%', fontWeight: 600 }}>
                            Currently assigned:
                          </Typography>
                          {(user.assignedHRs || []).map(id => {
                            const hr = allHrUsers.find(h => h._id === id);
                            return hr ? (
                              <Chip key={id}
                                avatar={<Avatar sx={{ width: 18, height: 18, fontSize: 10, bgcolor: '#6366f1' }}>{hr.firstName[0]}</Avatar>}
                                label={`${hr.firstName} ${hr.lastName}`}
                                size="small"
                                onDelete={() => handleHRAssignChange(user._id, (user.assignedHRs || []).filter(i => i !== id))}
                                sx={{ height: 24, fontSize: 12, bgcolor: '#e0e7ff', color: '#3730a3', fontWeight: 600 }}
                              />
                            ) : null;
                          })}
                        </Box>
                      )}
                    </Box>

                    <Divider sx={{ mb: 2.5, borderColor: '#e0e7ff' }} />

                    {/* Permission grid */}
                    <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 2 }}>
                      {TL_PERMISSION_TREE.map((page, idx) => {
                        const allPageKeys = [page.pageKey, ...page.actions.map(a => a.key)];
                        const allBlocked = allPageKeys.every(k => user.permissions.includes(k));
                        const someBlocked = allPageKeys.some(k => user.permissions.includes(k)) && !allBlocked;
                        const accentColor = PAGE_COLORS[idx % PAGE_COLORS.length];

                        return (
                          <Box
                            key={page.pageKey}
                            sx={{
                              borderRadius: 2.5,
                              border: '1px solid',
                              borderColor: allBlocked ? '#fecaca' : someBlocked ? '#fde68a' : '#e0e7ff',
                              overflow: 'hidden',
                              transition: 'box-shadow 0.15s',
                              '&:hover': { boxShadow: '0 4px 16px rgba(0,0,0,0.08)' },
                            }}
                          >
                            {/* Card header strip */}
                            <Box
                              sx={{
                                px: 2, py: 1.5,
                                display: 'flex', alignItems: 'center', gap: 1.5,
                                background: allBlocked
                                  ? 'linear-gradient(90deg,#fee2e2,#fff5f5)'
                                  : someBlocked
                                  ? 'linear-gradient(90deg,#fef9c3,#fffbeb)'
                                  : `linear-gradient(90deg,${accentColor}22,#f8faff)`,
                                borderBottom: '1px solid',
                                borderColor: allBlocked ? '#fecaca' : someBlocked ? '#fde68a' : '#e0e7ff',
                              }}
                            >
                              {/* color dot */}
                              <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: allBlocked ? '#ef4444' : someBlocked ? '#f59e0b' : accentColor, flexShrink: 0 }} />

                              <FormControlLabel
                                sx={{ m: 0, flex: 1 }}
                                control={
                                  <Checkbox
                                    checked={allBlocked}
                                    indeterminate={someBlocked}
                                    onChange={() => handlePageToggle(user._id, page)}
                                    size="small"
                                    sx={{
                                      p: 0.5, mr: 0.5,
                                      color: allBlocked ? '#ef4444' : someBlocked ? '#f59e0b' : accentColor,
                                      '&.Mui-checked': { color: '#ef4444' },
                                      '&.MuiCheckbox-indeterminate': { color: '#f59e0b' },
                                    }}
                                  />
                                }
                                label={
                                  <Typography fontWeight={700} sx={{ color: '#111827', fontSize: 14, lineHeight: 1.3 }}>
                                    {page.pageLabel}
                                  </Typography>
                                }
                              />

                              {allBlocked && (
                                <Chip label="Hidden" size="small" sx={{ height: 20, fontSize: 11, fontWeight: 700, bgcolor: '#fee2e2', color: '#dc2626', flexShrink: 0 }} />
                              )}
                            </Box>

                            {/* Action checkboxes */}
                            {page.actions.length > 0 && (
                              <FormGroup sx={{ px: 2, py: 1.5, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 0.5 }}>
                                {page.actions.map((action) => (
                                  <FormControlLabel
                                    key={action.key}
                                    sx={{ m: 0, py: 0.4, alignItems: 'center' }}
                                    control={
                                      <Checkbox
                                        checked={isBlocked(user._id, action.key)}
                                        onChange={() => handleToggle(user._id, action.key)}
                                        size="small"
                                        sx={{
                                          p: 0.5, mr: 0.8,
                                          color: '#9ca3af',
                                          '&.Mui-checked': { color: '#f59e0b' },
                                        }}
                                      />
                                    }
                                    label={
                                      <Typography sx={{
                                        fontSize: 13,
                                        color: isBlocked(user._id, action.key) ? '#92400e' : '#374151',
                                        fontWeight: isBlocked(user._id, action.key) ? 600 : 500,
                                        lineHeight: 1.4,
                                      }}>
                                        {action.label}
                                      </Typography>
                                    }
                                  />
                                ))}
                              </FormGroup>
                            )}

                            {page.actions.length === 0 && (
                              <Box sx={{ px: 2, py: 1.2 }}>
                                <Typography sx={{ fontSize: 12, color: '#9ca3af', fontStyle: 'italic' }}>Page-level access only</Typography>
                              </Box>
                            )}
                          </Box>
                        );
                      })}
                    </Box>

                    {/* Save button */}
                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <Button
                        variant="contained"
                        startIcon={savingId === user._id ? <CircularProgress size={15} color="inherit" /> : <SaveIcon sx={{ fontSize: 17 }} />}
                        onClick={() => handleSavePermissions(user._id)}
                        disabled={savingId === user._id}
                        sx={{
                          borderRadius: 2.5, textTransform: 'none', fontWeight: 700,
                          px: 3.5, py: 1.1, fontSize: 14,
                          background: 'linear-gradient(135deg,#6366f1,#4f46e5)',
                          boxShadow: '0 4px 14px rgba(99,102,241,0.4)',
                          '&:hover': { background: 'linear-gradient(135deg,#4f46e5,#3730a3)', boxShadow: '0 6px 20px rgba(99,102,241,0.5)' },
                          '&:disabled': { background: '#e0e7ff', color: '#a5b4fc', boxShadow: 'none' },
                        }}
                      >
                        {savingId === user._id ? 'Saving…' : 'Save Permissions'}
                      </Button>
                    </Box>
                  </AccordionDetails>
                </Accordion>
              );
            })
          )}
        </Box>
      </Box>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          severity={snackbar.severity}
          onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ borderRadius: 2.5, fontWeight: 600, boxShadow: '0 8px 24px rgba(0,0,0,0.12)' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default TLPermissions;
