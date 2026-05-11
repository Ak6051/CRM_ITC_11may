
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
import Sidebar from '../../components/sales components/Sidebar';
import Navbar from '../../components/sales components/SalesNavbar';

const DailyTasks = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [formData, setFormData] = useState({
    TargetedLead: '',
    TargetedMeeting: '',
    TargetedAgreement: '',
    TargetedOpenings: '',
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
    
    if (['TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings'].includes(name)) {
      if (!value && value !== 0) {
        error = 'This field is required';
      } else if (isNaN(value) || value < 0) {
        error = 'Please enter a valid number';
      }
    }
    
    return error;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    const newValue = ['TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings'].includes(name) 
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
    const requiredFields = ['TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings'];
    requiredFields.forEach(field => {
      const value = formData[field];
      const error = validateField(field, value);
      if (error) {
        errors[field] = error;
        isValid = false;
      }
    });
    
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
        `${API_BASE_URL}/dailyTask/sales/create`,
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
        TargetedLead: '',
        TargetedMeeting: '',
        TargetedAgreement: '',
        TargetedOpenings: '',
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
      const url = `${API_BASE_URL}/dailyTask/sales/all`;
      const res = await axios.get(url, config);
      
      // Transform the data to match what the DataGrid expects
      const formattedTasks = res.data.map(task => ({
        ...task,
        id: task._id,
        // Handle the createdBy field whether it's populated or not
        createdBy: task.createdBy && typeof task.createdBy === 'object' 
          ? task.createdBy 
          : { firstName: 'Unknown', lastName: 'User', role: 'N/A' }
      }));
      
      if (!showAll) {
        const today = new Date().toISOString().split('T')[0];
        const todayTasks = formattedTasks.filter(task => {
          const taskDate = new Date(task.createdAt).toISOString().split('T')[0];
          return taskDate === today;
        });
        setTasks(todayTasks);
      } else {
        setTasks(formattedTasks);
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
        if (!creator || typeof creator !== 'object') return 'N/A';
        const name = `${creator.firstName || ''} ${creator.lastName || ''}`.trim();
        return name ? `${name} (${creator.role || 'N/A'})` : 'N/A';
      }
    },
    { 
      field: 'salesName', 
      headerName: 'Sales Name', 
      width: 150 
    },
    { 
      field: 'TargetedLead', 
      headerName: 'Targeted Lead', 
      width: 130 
    },
    {
      field:'TLEOD',
      headerName:'Targeted Lead EOD',
      width:130
    },
    { 
      field: 'TargetedMeeting', 
      headerName: 'Targeted Meeting', 
      width: 150 
    },
    {
      field:'TMEOD',
      headerName:'Targeted Meeting EOD',
      width:130
    },
    { 
      field: 'TargetedAgreement', 
      headerName: 'Targeted Agreement', 
      width: 160 
    },
    {
      field:'TAEOD',
      headerName:'Targeted Agreement EOD',
      width:130
    },
    { 
      field: 'TargetedOpenings', 
      headerName: 'Targeted Openings', 
      width: 160 
    },
    {
      field:'TOEOD',
      headerName:'Targeted Openings EOD',
      width:130
    },
    { 
      field: 'remark', 
      headerName: 'Remarks', 
      width: 200 
    },
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

  // Use tasks directly as they're already formatted in fetchTasks
  const rows = tasks;

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
              getRowId={(row) => row._id}
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
            <Box display="flex" gap={2} mb={2}>
              <TextField
                autoFocus
                margin="dense"
                name="TargetedLead"
                label="Targeted Lead *"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.TargetedLead}
                onChange={handleChange}
                error={!!formErrors.TargetedLead}
                helperText={formErrors.TargetedLead || ' '}
                required
                inputProps={{ min: 0 }}
                onBlur={(e) => {
                  const error = validateField('TargetedLead', e.target.value);
                  setFormErrors(prev => ({ ...prev, TargetedLead: error }));
                }}
              />
              <TextField
                margin="dense"
                name="TargetedMeeting"
                label="Targeted Meeting *"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.TargetedMeeting}
                onChange={handleChange}
                error={!!formErrors.TargetedMeeting}
                helperText={formErrors.TargetedMeeting || ' '}
                required
                inputProps={{ min: 0 }}
                onBlur={(e) => {
                  const error = validateField('TargetedMeeting', e.target.value);
                  setFormErrors(prev => ({ ...prev, TargetedMeeting: error }));
                }}
              />
            </Box>
            <Box display="flex" gap={2} mb={2}>
              <TextField
                margin="dense"
                name="TargetedAgreement"
                label="Targeted Agreement *"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.TargetedAgreement}
                onChange={handleChange}
                error={!!formErrors.TargetedAgreement}
                helperText={formErrors.TargetedAgreement || ' '}
                required
                inputProps={{ min: 0 }}
                onBlur={(e) => {
                  const error = validateField('TargetedAgreement', e.target.value);
                  setFormErrors(prev => ({ ...prev, TargetedAgreement: error }));
                }}
              />
              <TextField
                margin="dense"
                name="TargetedOpenings"
                label="Targeted Openings *"
                type="number"
                fullWidth
                variant="outlined"
                value={formData.TargetedOpenings}
                onChange={handleChange}
                error={!!formErrors.TargetedOpenings}
                helperText={formErrors.TargetedOpenings || ' '}
                required
                inputProps={{ min: 0 }}
                onBlur={(e) => {
                  const error = validateField('TargetedOpenings', e.target.value);
                  setFormErrors(prev => ({ ...prev, TargetedOpenings: error }));
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

export default DailyTasks;
