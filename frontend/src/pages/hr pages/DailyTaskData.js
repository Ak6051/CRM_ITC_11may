import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  IconButton,
  Tooltip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Snackbar,
  Alert,
  Chip,
  Grid,
  Autocomplete
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/AddCircleOutline';
import RemoveIcon from '@mui/icons-material/RemoveCircleOutline';
import EditIcon from '@mui/icons-material/Edit';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import Sidebar from '../../components/hr components/HrSidebar';
import Navbar from '../../components/hr components/HrNavbar';

const DailyTaskData = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // Assigned jobs (company + position) for this HR
  const [assignedJobs, setAssignedJobs] = useState([]);
  const [positionOptions, setPositionOptions] = useState([]);

  // Edit request state
  const [editRequestOpen, setEditRequestOpen] = useState(false);
  const [editRequestTask, setEditRequestTask] = useState(null);
  const [editRequestData, setEditRequestData] = useState({});
  const [editRequestErrors, setEditRequestErrors] = useState({});
  const [editRequestSubmitting, setEditRequestSubmitting] = useState(false);
  const [myEditRequests, setMyEditRequests] = useState([]);

  const [formData, setFormData] = useState({
    companyName: '',
    position: '',
    totalCall: '',
    profilesShared: '',
    interviewsScheduled: '',
    revenueGenerated: '',
    TCEOD: '0',
    PSEOD: '0',
    ISEOD: '0',
    RGEOD: '0',
    remarks: ['']
  });

  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  // Filter state
  const [companyFilter, setCompanyFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');
  const [tceodBreakdown, setTceodBreakdown] = useState(null); // { newCandidates, calledExisting }

  const token = sessionStorage.getItem('token');
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchMyEditRequests();
    fetchAssignedJobs();

    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1) - now;

    const timer = setTimeout(() => {
      fetchTasks();
    }, msUntilMidnight);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    fetchTasks(showAllTasks);
  }, [showAllTasks]);

  const handleOpen = () => setOpen(true);
  const handleClose = () => { setOpen(false); setPositionOptions([]); };

  // ─── Fetch helpers ────────────────────────────────────────────────────────

  const fetchTasks = async (showAll = false) => {
    try {
      setLoading(true);
      const url = showAll
        ? `${API_BASE_URL}/dailyTask/hr/all`
        : `${API_BASE_URL}/dailyTask/hr`;
      const res = await axios.get(url, config);

      if (showAll) {
        setTasks(res.data);
      } else {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = res.data.filter(task => {
          const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
          return taskDate === today;
        });
        setTasks(todayTasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setSnackbar({ open: true, message: 'Failed to fetch tasks', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMyEditRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/dailyTask/hr/edit-requests/my`, config);
      setMyEditRequests(res.data);
    } catch (err) {
      console.error('Error fetching edit requests:', err);
    }
  };

  // Fetch jobs assigned to this HR (for company + position dropdowns)
  const fetchAssignedJobs = async () => {
    try {
      const hrId = sessionStorage.getItem('userId');
      if (!hrId) return;
      const res = await axios.get(`${API_BASE_URL}/fetch/hr/${hrId}/positions`, config);
      setAssignedJobs(res.data || []);
    } catch (err) {
      console.error('Error fetching assigned jobs:', err);
    }
  };

  // Unique company names from assigned jobs
  const companyOptions = [...new Map(
    assignedJobs.map(j => [j.companyName?.trim().toLowerCase(), j.companyName?.trim()])
  ).values()].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // ─── Create task ──────────────────────────────────────────────────────────

  const validateField = (name, value) => {
    let error = '';
    if (['companyName', 'position'].includes(name) && !value.toString().trim()) {
      error = 'This field is required';
    } else if (['totalCall', 'profilesShared', 'interviewsScheduled'].includes(name)) {
      if (!value && value !== 0) error = 'This field is required';
      else if (isNaN(value) || value < 0) error = 'Please enter a valid number';
    } else if (name === 'revenueGenerated') {
      if (value && (isNaN(value) || value < 0)) error = 'Please enter a valid amount';
    }
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = ['totalCall', 'profilesShared', 'interviewsScheduled', 'revenueGenerated'].includes(name)
      ? (value === '' ? '' : Number(value))
      : value;
    setFormData(prev => ({ ...prev, [name]: newValue }));
    if (formErrors[name]) setFormErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleRemarkChange = (index, value) => {
    const newRemarks = [...(formData.remarks || [''])];
    newRemarks[index] = value;
    setFormData(prev => ({ ...prev, remarks: newRemarks }));
  };

  const addRemarkField = () => {
    setFormData(prev => ({ ...prev, remarks: [...(prev.remarks || ['']), ''] }));
  };

  const removeRemarkField = (index) => {
    const newRemarks = (formData.remarks || ['']).filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, remarks: newRemarks.length > 0 ? newRemarks : [''] }));
  };

  const handleEditRemarkChange = (index, value) => {
    const newRemarks = [...(editRequestData.remarks || [''])];
    newRemarks[index] = value;
    setEditRequestData(prev => ({ ...prev, remarks: newRemarks }));
  };

  const addEditRemarkField = () => {
    setEditRequestData(prev => ({ ...prev, remarks: [...(prev.remarks || ['']), ''] }));
  };

  const removeEditRemarkField = (index) => {
    const newRemarks = (editRequestData.remarks || ['']).filter((_, i) => i !== index);
    setEditRequestData(prev => ({ ...prev, remarks: newRemarks.length > 0 ? newRemarks : [''] }));
  };

  // When company is selected from dropdown, filter positions for that company
  const handleCompanySelect = (companyName) => {
    const positions = assignedJobs
      .filter(j => j.companyName?.trim().toLowerCase() === companyName?.trim().toLowerCase())
      .map(j => j.jobTitle?.trim())
      .filter(Boolean);
    // Deduplicate
    const unique = [...new Set(positions)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    setPositionOptions(unique);
    setFormData(prev => ({ ...prev, companyName: companyName || '', position: '', revenueGenerated: '' }));
    if (formErrors.companyName) setFormErrors(prev => ({ ...prev, companyName: '' }));
  };

  // When position is selected, auto-fill revenueGenerated from job salary + auto-fetch TCEOD
  const handlePositionSelect = async (positionName) => {
    setFormData(prev => ({ ...prev, position: positionName || '' }));
    if (formErrors.position) setFormErrors(prev => ({ ...prev, position: '' }));

    if (!positionName) return;

    // Find the matching job for current company + position
    const job = assignedJobs.find(
      j =>
        j.companyName?.trim().toLowerCase() === formData.companyName?.trim().toLowerCase() &&
        j.jobTitle?.trim().toLowerCase() === positionName.trim().toLowerCase()
    );

    if (job?.salary) {
      const raw = String(job.salary).replace(/,/g, '').trim();
      const lpaMatch = raw.match(/([\d.]+)\s*lpa/i);
      if (lpaMatch) {
        const annual = parseFloat(lpaMatch[1]) * 100000;
        const monthly = Math.round(annual / 12);
        setFormData(prev => ({ ...prev, position: positionName, revenueGenerated: monthly }));
      } else {
        const num = parseFloat(raw);
        if (!isNaN(num)) {
          setFormData(prev => ({ ...prev, position: positionName, revenueGenerated: num }));
        }
      }
    }

    // Auto-fetch TCEOD — new candidates + called existing for this position today
    const hrId = sessionStorage.getItem('userId');
    if (hrId && positionName) {
      try {
        const today = new Date().toISOString().split('T')[0];
        const res = await axios.get(`${API_BASE_URL}/dailyTask/hr-candidate-count`, {
          headers: config.headers,
          params: { hrId, position: positionName, date: today },
        });
        setFormData(prev => ({ ...prev, TCEOD: String(res.data.count ?? prev.TCEOD) }));
        if (res.data.breakdown) setTceodBreakdown(res.data.breakdown);
      } catch (err) {
        console.error('Could not fetch TCEOD candidate count:', err);
      }
    }
  };  const validateForm = () => {
    const errors = {};
    let isValid = true;
    ['companyName', 'position', 'totalCall', 'profilesShared', 'interviewsScheduled'].forEach(field => {
      const error = validateField(field, formData[field]);
      if (error) { errors[field] = error; isValid = false; }
    });
    if (formData.revenueGenerated !== '') {
      const error = validateField('revenueGenerated', formData.revenueGenerated);
      if (error) { errors.revenueGenerated = error; isValid = false; }
    }
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      await axios.post(`${API_BASE_URL}/dailyTask/hr/create`, formData, config);
      setSnackbar({ open: true, message: 'Task created successfully!', severity: 'success' });
      setOpen(false);
      fetchTasks(showAllTasks);
      setFormData({
        companyName: '', position: '', totalCall: '', profilesShared: '',
        interviewsScheduled: '', revenueGenerated: '',
        TCEOD: '0', PSEOD: '0', ISEOD: '0', RGEOD: '0', remarks: ['']
      });
      setFormErrors({});
      setPositionOptions([]);
      // Fire custom event — sidebar listens and unlocks immediately without page reload
      window.dispatchEvent(new Event('hr-task-created'));
    } catch (error) {
      console.error('Error creating task:', error);
      setSnackbar({ open: true, message: error.response?.data?.message || 'Failed to create task', severity: 'error' });
    }
  };

  // ─── Edit Request ─────────────────────────────────────────────────────────

  const handleEditRequestOpen = async (task) => {
    // Check if there's already a pending request for this task
    const pending = myEditRequests.find(
      r => r.taskId?._id === task._id && r.status === 'pending'
    );
    if (pending) {
      setSnackbar({ open: true, message: 'An edit request for this task is already pending admin approval.', severity: 'warning' });
      return;
    }

    // Find the matching job from assignedJobs by company + position
    const matchedJob = assignedJobs.find(
      j =>
        j.companyName?.trim().toLowerCase() === task.companyName?.trim().toLowerCase() &&
        j.jobTitle?.trim().toLowerCase() === task.position?.trim().toLowerCase()
    );

    // Fetch today's candidate count for this HR + position (auto-fill TCEOD)
    let todayCandidateCount = task.TCEOD || '0';
    const hrId = sessionStorage.getItem('userId');
    if (hrId && task.position) {
      try {
        const taskDate = task.createdAt
          ? new Date(task.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];
        const res = await axios.get(`${API_BASE_URL}/dailyTask/hr-candidate-count`, {
          headers: config.headers,
          params: { hrId, position: task.position, date: taskDate },
        });
        todayCandidateCount = String(res.data.count ?? todayCandidateCount);
        if (res.data.breakdown) setTceodBreakdown(res.data.breakdown);
      } catch (err) {
        console.error('Error fetching today candidate count:', err);
      }
    }

    setEditRequestTask(task);
    setEditRequestData({
      companyName: task.companyName || '',
      position: task.position || '',
      totalCall: task.totalCall || 0,
      profilesShared: task.profilesShared || 0,
      interviewsScheduled: task.interviewsScheduled || 0,
      revenueGenerated: task.revenueGenerated || 0,
      TCEOD: todayCandidateCount,
      PSEOD: task.PSEOD || '0',
      ISEOD: task.ISEOD || '0',
      RGEOD: task.RGEOD || '0',
      remarks: Array.isArray(task.remarks) ? (task.remarks.length > 0 ? task.remarks : ['']) : (task.remark ? [task.remark] : [''])
    });
    setEditRequestErrors({});
    setEditRequestOpen(true);
  };

  const handleEditRequestChange = (e) => {
    const { name, value } = e.target;
    setEditRequestData(prev => ({ ...prev, [name]: value }));
    if (editRequestErrors[name]) setEditRequestErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleEditRequestSubmit = async () => {
    // Basic validation
    const errors = {};
    if (!editRequestData.companyName?.trim()) errors.companyName = 'Required';
    if (!editRequestData.position?.trim()) errors.position = 'Required';
    if (Object.keys(errors).length > 0) {
      setEditRequestErrors(errors);
      return;
    }

    setEditRequestSubmitting(true);
    try {
      await axios.post(
        `${API_BASE_URL}/dailyTask/hr/edit-request/${editRequestTask._id}`,
        editRequestData,
        config
      );
      setSnackbar({ open: true, message: 'Edit request submitted! Awaiting admin approval.', severity: 'success' });
      setEditRequestOpen(false);
      fetchMyEditRequests();
    } catch (err) {
      console.error('Error submitting edit request:', err);
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to submit edit request', severity: 'error' });
    } finally {
      setEditRequestSubmitting(false);
    }
  };

  // Helper: get edit request status badge for a task
  const getEditRequestStatus = (taskId) => {
    const req = myEditRequests.find(r => r.taskId?._id === taskId);
    if (!req) return null;
    return req.status;
  };

  const statusColor = { pending: 'warning', approved: 'success', rejected: 'error' };

  // ─── Columns ──────────────────────────────────────────────────────────────

  const columns = [
    {
      field: 'editAction',
      headerName: 'Edit',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const status = getEditRequestStatus(params.row._id);
        if (status === 'pending') {
          return <Chip label="Pending" color="warning" size="small" />;
        }
        return (
          <Tooltip title="Request Edit (requires admin approval)">
            <IconButton
              color="primary"
              size="small"
              onClick={() => handleEditRequestOpen(params.row)}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        );
      }
    },
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 200,
      renderCell: (params) => {
        const creator = params.row.createdBy;
        if (!creator) return 'N/A';
        return `${creator.firstName} ${creator.lastName} (${creator.role})`;
      }
    },
    { field: 'hrName', headerName: 'HR Name', width: 150 },
    { field: 'companyName', headerName: 'Company Name', width: 150 },
    { field: 'position', headerName: 'Position', width: 150 },
    { field: 'totalCall', headerName: 'Total Calls', width: 120 },
    { field: 'profilesShared', headerName: 'Profiles Shared', width: 150 },
    { field: 'interviewsScheduled', headerName: 'Interviews', width: 120 },
    { field: 'revenueGenerated', headerName: 'Revenue', width: 120 },
    {
      field: 'remarks',
      headerName: 'Remarks',
      width: 250,
      renderCell: (params) => {
        const remarks = params.row.remarks || (params.row.remark ? [params.row.remark] : []);
        if (!remarks || remarks.length === 0) return 'N/A';
        return (
          <Box sx={{ py: 1 }}>
            {remarks.map((r, i) => (
              <Typography key={i} variant="caption" display="block" sx={{ lineHeight: 1.2, mb: 0.5 }}>
                • {r}
              </Typography>
            ))}
          </Box>
        );
      }
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      renderCell: (params) => {
        const date = new Date(params.value);
        return date.toLocaleString('en-IN', {
          day: '2-digit', month: 'short', year: 'numeric',
          hour: '2-digit', minute: '2-digit', hour12: true
        });
      }
    },
  ];

  const filteredTasks = tasks.filter(task => {
    if (companyFilter && (task.companyName || '').trim().toLowerCase() !== companyFilter.trim().toLowerCase()) return false;
    if (positionFilter && (task.position || '').trim().toLowerCase() !== positionFilter.trim().toLowerCase()) return false;
    return true;
  });

  const rows = filteredTasks.map((task, index) => ({
    id: task._id || index,
    ...task,
    revenueGenerated: task.revenueGenerated ? `₹${task.revenueGenerated}` : 'N/A'
  }));

  // ─── Render ───────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <Box m={2}>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {showAllTasks ? 'All Tasks' : "Today's Task Report"} -{' '}
                {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </Typography>
              {/* Row 1: action buttons */}
              <Box sx={{ display: 'flex', gap: 1, mt: 1, flexWrap: 'wrap' }}>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleOpen}>
                  Create New Task
                </Button>
                <Button
                  variant={showAllTasks ? "outlined" : "contained"}
                  color="secondary"
                  onClick={() => setShowAllTasks(false)}
                  disabled={!showAllTasks}
                >
                  Today's Tasks
                </Button>
                <Button
                  variant={showAllTasks ? "contained" : "outlined"}
                  color="secondary"
                  onClick={() => setShowAllTasks(true)}
                  disabled={showAllTasks}
                >
                  All Tasks
                </Button>
              </Box>
              {/* Row 2: filters */}
              <Box sx={{ display: 'flex', gap: 1.5, mt: 1.5, flexWrap: 'wrap', alignItems: 'center' }}>
                <Autocomplete
                  options={Array.from(
                    new Map(
                      tasks.map(t => t.companyName).filter(Boolean)
                        .map(name => [name.trim().toLowerCase(), name.trim()])
                    ).values()
                  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))}
                  value={companyFilter || null}
                  onChange={(_, v) => setCompanyFilter(v || '')}
                  size="small"
                  sx={{ minWidth: 200 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Company Name" placeholder="Search company..." />
                  )}
                  clearOnEscape
                  isOptionEqualToValue={(o, v) => o.toLowerCase() === v.toLowerCase()}
                />
                <Autocomplete
                  options={Array.from(
                    new Map(
                      tasks.map(t => t.position).filter(Boolean)
                        .map(pos => [pos.trim().toLowerCase(), pos.trim()])
                    ).values()
                  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))}
                  value={positionFilter || null}
                  onChange={(_, v) => setPositionFilter(v || '')}
                  size="small"
                  sx={{ minWidth: 200 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Position" placeholder="Search position..." />
                  )}
                  clearOnEscape
                  isOptionEqualToValue={(o, v) => o.toLowerCase() === v.toLowerCase()}
                />
                {(companyFilter || positionFilter) && (
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => { setCompanyFilter(''); setPositionFilter(''); }}
                  >
                    Clear Filters
                  </Button>
                )}
              </Box>
            </Box>

            <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={() => { fetchTasks(showAllTasks); fetchMyEditRequests(); }}>
              <Typography
                variant="body2"
                sx={{ color: '#1976d2', fontWeight: 500, marginRight: '8px', '&:hover': { color: '#004ba0', textDecoration: 'underline' } }}
              >
                Click here to refresh tasks
              </Typography>
              <Tooltip title="Refresh">
                <IconButton color="primary">
                  <RefreshIcon />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          <Box mt={2} style={{
            height: 'calc(100vh - 240px)', width: '100%', overflow: 'auto',
            backgroundColor: '#fff', borderRadius: '4px', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              style={{ minWidth: '1100px', height: '100%' }}
              components={{
                NoRowsOverlay: () => (
                  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
                    {loading ? 'Loading...' : 'No tasks found for today'}
                  </div>
                ),
              }}
              disableSelectionOnClick
            />
          </Box>
        </Box>
      </Box>

      {/* ── Create Task Dialog ── */}
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)'
          }
        }}
      >
        {/* ── Header ── */}
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            background: 'linear-gradient(90deg, #2e7d32 0%, #388e3c 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0
            }}
          >
            ➕
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Create New Task
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              Fill in the details to create a new daily task
            </Typography>
          </Box>
        </DialogTitle>

        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>

              {/* ── Row 1: Company + Position ── */}
              <Grid container spacing={2} sx={{ mb: 2 }}>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={companyOptions}
                    value={formData.companyName || null}
                    onChange={(_, v) => handleCompanySelect(v || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        autoFocus
                        label="Company Name *"
                        size="small"
                        error={!!formErrors.companyName}
                        helperText={formErrors.companyName || 'Select from assigned companies'}
                        required
                      />
                    )}
                    clearOnEscape
                    isOptionEqualToValue={(o, v) => o.toLowerCase() === v?.toLowerCase()}
                  />
                </Grid>
                <Grid item xs={12} md={6}>
                  <Autocomplete
                    options={positionOptions}
                    value={formData.position || null}
                    disabled={!formData.companyName}
                    onChange={(_, v) => handlePositionSelect(v || '')}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Position *"
                        size="small"
                        error={!!formErrors.position}
                        helperText={
                          formErrors.position ||
                          (!formData.companyName ? 'Select a company first' : 'Select from assigned positions')
                        }
                        required
                      />
                    )}
                    clearOnEscape
                    isOptionEqualToValue={(o, v) => o.toLowerCase() === v?.toLowerCase()}
                  />
                </Grid>
              </Grid>

              {/* ── Main Body: Metrics (left) + Remarks (right) ── */}
              <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>

                {/* ── Top: Metrics Panel ── */}
                <Grid item xs={12}>
                  <Box
                    sx={{
                      border: '1px solid #e3eaf5',
                      borderRadius: 2,
                      overflow: 'hidden',
                      height: '100%'
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        backgroundColor: '#f0f4ff',
                        borderBottom: '1px solid #e3eaf5',
                        display: 'flex',
                        alignItems: 'center'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        📊 Performance Metrics (Targets)
                      </Typography>
                    </Box>

                    <Box sx={{ p: 2 }}>
                      <Grid container spacing={2}>
                        {[
                          { name: 'totalCall', label: 'Total Calls', icon: '📞', step: '1', required: true },
                          { name: 'profilesShared', label: 'Profiles Shared', icon: '👤', step: '1', required: true },
                          { name: 'interviewsScheduled', label: 'Interviews Scheduled', icon: '📅', step: '1', required: true },
                          { name: 'revenueGenerated', label: 'Revenue Generated (₹)', icon: '💰', step: '0.01', required: false }
                        ].map(({ name, label, icon, step, required }) => (
                          <Grid item xs={12} sm={6} md={3} key={name}>
                            <Box sx={{
                              p: 1.5,
                              border: '1px solid #eef2f6',
                              borderRadius: 1.5,
                              backgroundColor: '#fcfdff',
                              height: '100%'
                            }}>
                              <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 700, display: 'block', mb: 1.5, textAlign: 'center', borderBottom: '1px solid #eef2f6', pb: 0.5 }}>
                                {icon} {label}{required ? ' *' : ''}
                              </Typography>
                              <TextField
                                name={name}
                                label="Target"
                                fullWidth
                                size="small"
                                value={formData[name]}
                                onChange={handleChange}
                                error={!!formErrors[name]}
                                type="number"
                                inputProps={{ min: 0, step }}
                                InputLabelProps={{ shrink: true }}
                                required={required}
                                onBlur={(e) => setFormErrors(prev => ({ ...prev, [name]: validateField(name, e.target.value) }))}
                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                              />
                            </Box>
                          </Grid>
                        ))}
                      </Grid>

                      {/* TCEOD auto-count info — shown after position is selected */}
                      {formData.position && (
                        <Box sx={{
                          mt: 2, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1.5,
                          border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                        }}>
                          <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>
                            📊 TCEOD (auto-calculated): <strong>{formData.TCEOD}</strong>
                          </Typography>
                          {tceodBreakdown && (
                            <>
                              <Typography variant="caption" sx={{ color: '#15803d' }}>
                                🆕 New candidates: <strong>{tceodBreakdown.newCandidates}</strong>
                              </Typography>
                              <Typography variant="caption" sx={{ color: '#15803d' }}>
                                📞 Called existing: <strong>{tceodBreakdown.calledExisting}</strong>
                              </Typography>
                            </>
                          )}
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>

                {/* ── Bottom: Remarks Panel ── */}
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Box
                    sx={{
                      border: '1px solid #e3eaf5',
                      borderRadius: 2,
                      overflow: 'hidden',
                      height: '100%',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                  >
                    <Box
                      sx={{
                        px: 2,
                        py: 1,
                        backgroundColor: '#f0f4ff',
                        borderBottom: '1px solid #e3eaf5'
                      }}
                    >
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                        📝 Remarks
                      </Typography>
                    </Box>
                    <Box sx={{ p: 2, flex: 1 }}>
                      <Grid container spacing={2}>
                        {(formData.remarks || ['']).map((rem, index) => (
                          <Grid item xs={12} md={6} key={index}>
                            <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                              <TextField
                                label={`Remark ${index + 1}`}
                                fullWidth
                                size="small"
                                value={rem}
                                onChange={(e) => handleRemarkChange(index, e.target.value)}
                                multiline
                                rows={12}
                                placeholder="Enter detailed remark..."
                                sx={{
                                  '& .MuiOutlinedInput-root': {
                                    backgroundColor: '#fafcff'
                                  }
                                }}
                              />
                              <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                                <IconButton size="small" color="primary" onClick={addRemarkField}>
                                  <AddIcon fontSize="small" />
                                </IconButton>
                                {formData.remarks?.length > 1 && (
                                  <IconButton size="small" color="error" onClick={() => removeRemarkField(index)}>
                                    <RemoveIcon fontSize="small" />
                                  </IconButton>
                                )}
                              </Box>
                            </Box>
                          </Grid>
                        ))}
                      </Grid>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Box>

            {/* ── Footer Actions ── */}
            <Box
              sx={{
                px: 3,
                py: 2,
                borderTop: '1px solid #e3eaf5',
                backgroundColor: '#f8faff',
                display: 'flex',
                justifyContent: 'flex-end',
                gap: 1.5,
                flexShrink: 0
              }}
            >
              <Button
                variant="outlined"
                onClick={handleClose}
                sx={{ minWidth: 100 }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                variant="contained"
                sx={{
                  minWidth: 140,
                  fontWeight: 600,
                  background: 'linear-gradient(90deg, #2e7d32 0%, #388e3c 100%)',
                  '&:hover': {
                    background: 'linear-gradient(90deg, #1b5e20 0%, #2e7d32 100%)'
                  }
                }}
              >
                ➕ Create Task
              </Button>
            </Box>
          </DialogContent>
        </form>
      </Dialog>

      {/* ── Edit Request Dialog ── */}
      <Dialog
        open={editRequestOpen}
        onClose={() => setEditRequestOpen(false)}
        maxWidth="lg"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 2,
            maxHeight: '90vh',
            background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)'
          }
        }}
      >
        {/* ── Header ── */}
        <DialogTitle
          sx={{
            px: 3,
            py: 2,
            background: 'linear-gradient(90deg, #e65100 0%, #f57c00 100%)',
            color: '#fff',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5
          }}
        >
          <Box
            sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: 'rgba(255,255,255,0.2)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.1rem',
              flexShrink: 0
            }}
          >
            ✏️
          </Box>
          <Box>
            <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
              Request Task Edit
            </Typography>
            <Typography variant="caption" sx={{ opacity: 0.85 }}>
              {editRequestTask
                ? `${editRequestTask.companyName} — ${editRequestTask.position}`
                : 'Your changes will be sent to admin for approval before being applied.'}
            </Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>

            {/* ── Row 1: Company + Position ── */}
            <Grid container spacing={2} sx={{ mb: 2 }}>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={companyOptions}
                  value={editRequestData.companyName || null}
                  onChange={(_, v) => {
                    const positions = assignedJobs
                      .filter(j => j.companyName?.trim().toLowerCase() === v?.trim().toLowerCase())
                      .map(j => j.jobTitle?.trim())
                      .filter(Boolean);
                    setEditRequestData(prev => ({ ...prev, companyName: v || '', position: '' }));
                    if (editRequestErrors.companyName) setEditRequestErrors(prev => ({ ...prev, companyName: '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Company Name *"
                      size="small"
                      error={!!editRequestErrors.companyName}
                      helperText={editRequestErrors.companyName || 'Select from assigned companies'}
                      required
                    />
                  )}
                  clearOnEscape
                  isOptionEqualToValue={(o, v) => o.toLowerCase() === v?.toLowerCase()}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <Autocomplete
                  options={
                    editRequestData.companyName
                      ? [...new Set(
                          assignedJobs
                            .filter(j => j.companyName?.trim().toLowerCase() === editRequestData.companyName?.trim().toLowerCase())
                            .map(j => j.jobTitle?.trim())
                            .filter(Boolean)
                        )].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }))
                      : []
                  }
                  value={editRequestData.position || null}
                  disabled={!editRequestData.companyName}
                  onChange={(_, v) => {
                    setEditRequestData(prev => ({ ...prev, position: v || '' }));
                    if (editRequestErrors.position) setEditRequestErrors(prev => ({ ...prev, position: '' }));
                  }}
                  renderInput={(params) => (
                    <TextField
                      {...params}
                      label="Position *"
                      size="small"
                      error={!!editRequestErrors.position}
                      helperText={
                        editRequestErrors.position ||
                        (!editRequestData.companyName ? 'Select a company first' : 'Select from assigned positions')
                      }
                      required
                    />
                  )}
                  clearOnEscape
                  isOptionEqualToValue={(o, v) => o.toLowerCase() === v?.toLowerCase()}
                />
              </Grid>
            </Grid>

            {/* ── Main Body: Metrics (left) + Remarks (right) ── */}
            <Grid container spacing={2} sx={{ alignItems: 'stretch' }}>

              {/* ── Top: Metrics Panel ── */}
              <Grid item xs={12}>
                <Box
                  sx={{
                    border: '1px solid #e3eaf5',
                    borderRadius: 2,
                    overflow: 'hidden',
                    height: '100%'
                  }}
                >
                  {/* Panel header */}
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      backgroundColor: '#f0f4ff',
                      borderBottom: '1px solid #e3eaf5',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 1
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      📊 Performance Metrics
                    </Typography>
                  </Box>

                  <Box sx={{ p: 2 }}>
                    <Grid container spacing={2}>
                      {[
                        { name: 'totalCall', label: 'Total Calls', eod: 'TCEOD', icon: '📞', step: '1' },
                        { name: 'profilesShared', label: 'Profiles Shared', eod: 'PSEOD', icon: '👤', step: '1' },
                        { name: 'interviewsScheduled', label: 'Interviews Scheduled', eod: 'ISEOD', icon: '📅', step: '1' },
                        { name: 'revenueGenerated', label: 'Revenue Generated (₹)', eod: 'RGEOD', icon: '💰', step: '0.01' }
                      ].map(({ name, label, eod, icon, step }) => (
                        <Grid item xs={12} sm={6} md={3} key={name}>
                          <Box sx={{
                            p: 1.5,
                            border: '1px solid #eef2f6',
                            borderRadius: 1.5,
                            backgroundColor: '#fcfdff',
                            height: '100%'
                          }}>
                            <Typography variant="caption" sx={{ color: '#1565c0', fontWeight: 700, display: 'block', mb: 1.5, textAlign: 'center', borderBottom: '1px solid #eef2f6', pb: 0.5 }}>
                              {icon} {label}
                            </Typography>

                            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                              <TextField
                                name={name}
                                label="Target"
                                fullWidth
                                size="small"
                                value={editRequestData[name] ?? ''}
                                onChange={handleEditRequestChange}
                                type="number"
                                inputProps={{ min: 0, step }}
                                InputLabelProps={{ shrink: true }}
                                sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                              />

                              <TextField
                                name={eod}
                                label="EOD Achieved"
                                fullWidth
                                size="small"
                                value={editRequestData[eod] ?? ''}
                                onChange={handleEditRequestChange}
                                type="number"
                                inputProps={{ min: 0, step }}
                                InputLabelProps={{ shrink: true }}
                                sx={{
                                  '& .MuiOutlinedInput-root': { backgroundColor: '#f1faf2' },
                                  '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a5d6a7' }
                                }}
                              />
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>

                    {/* TCEOD breakdown info in edit request dialog */}
                    {tceodBreakdown && editRequestData.position && (
                      <Box sx={{
                        mt: 2, p: 1.5, bgcolor: '#f0fdf4', borderRadius: 1.5,
                        border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap',
                      }}>
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#166534' }}>
                          📊 TCEOD (auto-calculated): <strong>{editRequestData.TCEOD}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#15803d' }}>
                          🆕 New candidates: <strong>{tceodBreakdown.newCandidates}</strong>
                        </Typography>
                        <Typography variant="caption" sx={{ color: '#15803d' }}>
                          📞 Called existing: <strong>{tceodBreakdown.calledExisting}</strong>
                        </Typography>
                      </Box>
                    )}
                  </Box>
                </Box>
              </Grid>

              {/* ── Bottom: Remarks Panel ── */}
              <Grid item xs={12} sx={{ mt: 1 }}>
                <Box
                  sx={{
                    border: '1px solid #e3eaf5',
                    borderRadius: 2,
                    overflow: 'hidden'
                  }}
                >
                  <Box
                    sx={{
                      px: 2,
                      py: 1,
                      backgroundColor: '#f0f4ff',
                      borderBottom: '1px solid #e3eaf5'
                    }}
                  >
                    <Typography variant="caption" sx={{ fontWeight: 700, color: '#1565c0', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                      📝 Remarks
                    </Typography>
                  </Box>
                  <Box sx={{ p: 2, flex: 1 }}>
                    <Grid container spacing={2}>
                      {(editRequestData.remarks || ['']).map((rem, index) => (
                        <Grid item xs={12} md={6} key={index}>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <TextField
                              label={`Remark ${index + 1}`}
                              fullWidth
                              size="small"
                              value={rem}
                              onChange={(e) => handleEditRemarkChange(index, e.target.value)}
                              multiline
                              rows={12}
                              placeholder="Enter detailed remark..."
                              sx={{
                                '& .MuiOutlinedInput-root': {
                                  backgroundColor: '#fafcff'
                                }
                              }}
                            />
                            <Box sx={{ display: 'flex', flexDirection: 'column' }}>
                              <IconButton size="small" color="primary" onClick={addEditRemarkField}>
                                <AddIcon fontSize="small" />
                              </IconButton>
                              {editRequestData.remarks?.length > 1 && (
                                <IconButton size="small" color="error" onClick={() => removeEditRemarkField(index)}>
                                  <RemoveIcon fontSize="small" />
                                </IconButton>
                              )}
                            </Box>
                          </Box>
                        </Grid>
                      ))}
                    </Grid>
                  </Box>
                </Box>
              </Grid>
            </Grid>
          </Box>

          {/* ── Footer Actions ── */}
          <Box
            sx={{
              px: 3,
              py: 2,
              borderTop: '1px solid #e3eaf5',
              backgroundColor: '#f8faff',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 1.5,
              flexShrink: 0
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setEditRequestOpen(false)}
              sx={{ minWidth: 100 }}
            >
              Cancel
            </Button>
            <Button
              variant="contained"
              onClick={handleEditRequestSubmit}
              disabled={editRequestSubmitting}
              sx={{
                minWidth: 180,
                fontWeight: 600,
                background: 'linear-gradient(90deg, #e65100 0%, #f57c00 100%)',
                '&:hover': {
                  background: 'linear-gradient(90deg, #bf360c 0%, #e65100 100%)'
                }
              }}
            >
              {editRequestSubmitting ? 'Submitting...' : '📨 Submit for Approval'}
            </Button>
          </Box>
        </DialogContent>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbar.open} autoHideDuration={6000} onClose={() => setSnackbar(prev => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={() => setSnackbar(prev => ({ ...prev, open: false }))} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DailyTaskData;
