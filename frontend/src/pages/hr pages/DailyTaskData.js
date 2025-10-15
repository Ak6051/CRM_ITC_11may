
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
  Alert
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import AddIcon from '@mui/icons-material/Add';
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
    remark: ''
  });
  
  const [formErrors, setFormErrors] = useState({});
  const navigate = useNavigate();

  useEffect(() => {
    fetchTasks();
  
    const now = new Date();
    const msUntilMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 1) - now;
  
    const timer = setTimeout(() => {
      fetchTasks(); // Refresh at midnight
    }, msUntilMidnight);
  
    return () => clearTimeout(timer);
  }, []);
  

  const token = sessionStorage.getItem('token');
  const config = {
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json'
    }
  };

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const validateField = (name, value) => {
    let error = '';
    
    if (['companyName', 'position'].includes(name) && !value.trim()) {
      error = 'This field is required';
    } else if (['totalCall', 'profilesShared', 'interviewsScheduled'].includes(name)) {
      if (!value && value !== 0) {
        error = 'This field is required';
      } else if (isNaN(value) || value < 0) {
        error = 'Please enter a valid number';
      }
    } else if (name === 'revenueGenerated') {
      if (value && (isNaN(value) || value < 0)) {
        error = 'Please enter a valid amount';
      }
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = ['totalCall', 'profilesShared', 'interviewsScheduled', 'revenueGenerated'].includes(name) 
      ? (value === '' ? '' : Number(value))
      : value;
      
    setFormData(prev => ({
      ...prev,
      [name]: newValue
    }));
    
    // Clear error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;
    
    // Validate required fields
    const requiredFields = ['companyName', 'position', 'totalCall', 'profilesShared', 'interviewsScheduled'];
    requiredFields.forEach(field => {
      const value = formData[field];
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });
    
    // Validate revenue if provided
    if (formData.revenueGenerated !== '') {
      const error = validateField('revenueGenerated', formData.revenueGenerated);
      if (error) {
        errors.revenueGenerated = error;
        isValid = false;
      }
    }
    
    setFormErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    try {
      const response = await axios.post(
        `${API_BASE_URL}/dailyTask/hr/create`,
        formData,
        config
      );
      
      setSnackbar({
        open: true,
        message: 'Task created successfully!',
        severity: 'success'
      });
      
      setOpen(false);
      fetchTasks();
      // Reset form and errors
      setFormData({
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
        remark: ''
      });
      setFormErrors({});
    } catch (error) {
      console.error('Error creating task:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to create task',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar(prev => ({ ...prev, open: false }));
  };

  const fetchTasks = async (showAll = false) => {
    try {
      setLoading(true);
      let url = showAll ? `${API_BASE_URL}/dailyTask/hr/all` : `${API_BASE_URL}/dailyTask/hr`;
      const res = await axios.get(url, config);
      
      if (showAll) {
        setTasks(res.data);
      } else {
        const today = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
        const todayTasks = res.data.filter(task => {
          const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
          return taskDate === today;
        });
        setTasks(todayTasks);
      }
    } catch (err) {
      console.error('Error fetching tasks:', err);
      setSnackbar({
        open: true,
        message: 'Failed to fetch tasks',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };
  
  

  useEffect(() => {
    fetchTasks(showAllTasks);
  }, [showAllTasks]);

  const columns = [
    { 
      field: 'createdBy', 
      headerName: 'Created By', 
      width: 200,
      renderCell: (params) => {
        const creator = params.row.createdBy;
        if (!creator) return 'N/A';
        const name = `${creator.firstName} ${creator.lastName}`;
        return `${name} (${creator.role})`;
      }
    },
    { field: 'hrName', headerName: 'HR Name', width: 150 },
    { field: 'companyName', headerName: 'Company Name', width: 150 },
    { field: 'position', headerName: 'Position', width: 150 },
    { field: 'totalCall', headerName: 'Total Calls', width: 120 },
    { field: 'profilesShared', headerName: 'Profiles Shared', width: 150 },
    { field: 'interviewsScheduled', headerName: 'Interviews', width: 120 },
    { field: 'revenueGenerated', headerName: 'Revenue', width: 120 },
    { field: 'remark', headerName: 'Remarks', width: 200 },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 180,
      renderCell: (params) => {
        const date = new Date(params.value);
        return date.toLocaleString('en-IN', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true
        });
      }
    },
  ];

  const rows = tasks.map((task, index) => ({
    id: task._id || index,
    ...task,
    revenueGenerated: task.revenueGenerated ? `₹${task.revenueGenerated}` : 'N/A'
  }));

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '250px',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        <Navbar />
        <Box m={2}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Box>
              <Typography variant="h5" gutterBottom>
                {showAllTasks ? 'All Tasks' : "Today's Task Report"} - {new Date().toLocaleDateString('en-IN', {
                  weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
                })}
              </Typography>
              <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<AddIcon />}
                  onClick={handleOpen}
                >
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
            </Box>

            {/* 🔁 Refresh Icon Button */}
            <Box display="flex" alignItems="center" sx={{ cursor: 'pointer' }} onClick={fetchTasks}>
  <Typography
    variant="body2"
    sx={{
      color: '#1976d2',
      fontWeight: 500,
      marginRight: '8px',
      transition: 'color 0.3s',
      '&:hover': {
        color: '#004ba0',
        textDecoration: 'underline',
      },
    }}
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
            height: 'calc(100vh - 200px)',
            width: '100%',
            overflow: 'auto',
            backgroundColor: '#fff',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <DataGrid
              rows={rows}
              columns={columns}
              loading={loading}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              style={{
                minWidth: '1000px',
                height: '100%'
              }}
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

      {/* Create Task Dialog */}
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            <TextField
              autoFocus
              margin="dense"
              name="companyName"
              label="Company Name *"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.companyName}
              onChange={handleChange}
              error={!!formErrors.companyName}
              helperText={formErrors.companyName || ' '}
              required
              sx={{ mb: 2 }}
              onBlur={(e) => {
                const error = validateField('companyName', e.target.value);
                setFormErrors(prev => ({ ...prev, companyName: error }));
              }}
            />
            <TextField
              margin="dense"
              name="position"
              label="Position *"
              type="text"
              fullWidth
              variant="outlined"
              value={formData.position}
              onChange={handleChange}
              error={!!formErrors.position}
              helperText={formErrors.position || ' '}
              required
              sx={{ mb: 2 }}
              onBlur={(e) => {
                const error = validateField('position', e.target.value);
                setFormErrors(prev => ({ ...prev, position: error }));
              }}
            />
            <Box display="flex" gap={2} mb={2}>
              <TextField
                margin="dense"
                name="totalCall"
                label=" Target Total Calls *"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.totalCall}
                onChange={handleChange}
                error={!!formErrors.totalCall}
                helperText={formErrors.totalCall || ' '}
                required
                inputProps={{ min: 0 }}
                onBlur={(e) => {
                  const error = validateField('totalCall', e.target.value);
                  setFormErrors(prev => ({ ...prev, totalCall: error }));
                }}
              />
              <TextField
                margin="dense"
                name="profilesShared"
                label="Target Profiles Share *"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.profilesShared}
                onChange={handleChange}
                error={!!formErrors.profilesShared}
                helperText={formErrors.profilesShared || ' '}
                required
                inputProps={{ min: 0 }}
                onBlur={(e) => {
                  const error = validateField('profilesShared', e.target.value);
                  setFormErrors(prev => ({ ...prev, profilesShared: error }));
                }}
              />
            </Box>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                margin="dense"
                name="interviewsScheduled"
                label="Target Interviews Schedule *"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.interviewsScheduled}
                onChange={handleChange}
                error={!!formErrors.interviewsScheduled}
                helperText={formErrors.interviewsScheduled || ' '}
                required
                inputProps={{ min: 0 }}
                onBlur={(e) => {
                  const error = validateField('interviewsScheduled', e.target.value);
                  setFormErrors(prev => ({ ...prev, interviewsScheduled: error }));
                }}
              />
              <TextField
                margin="dense"
                name="revenueGenerated"
                label="Target Revenue Generate (₹)"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.revenueGenerated}
                onChange={handleChange}
                error={!!formErrors.revenueGenerated}
                helperText={formErrors.revenueGenerated || ' '}
                inputProps={{ min: 0, step: '0.01' }}
                onBlur={(e) => {
                  const error = validateField('revenueGenerated', e.target.value);
                  setFormErrors(prev => ({ ...prev, revenueGenerated: error }));
                }}
              />
            </Box>
            <TextField
              margin="dense"
              name="remark"
              label="Remarks"
              type="text"
              fullWidth
              variant="outlined"
              multiline
              rows={3}
              value={formData.remark}
              onChange={handleChange}
              sx={{ mb: 2 }}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={handleClose} color="primary">
              Cancel
            </Button>
            <Button type="submit" color="primary" variant="contained">
              Submit
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default DailyTaskData;
