
import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { toast } from 'react-toastify';

// Material-UI Imports
import { createTheme, ThemeProvider } from '@mui/material/styles';
import {
  Button,
  Box,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  TextField,
  MenuItem,
  Grid
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  FileDownload as FileDownloadIcon
} from '@mui/icons-material';

// Component Imports
import Sidebar from '../../components/team leader components/TeamLeaderSidebar';
import Navbar from '../../components/team leader components/TeamLeaderNavbar';
import useTLPermissions from '../../hooks/useTLPermissions';

// Create a theme to style the DataGrid
const theme = createTheme({
  components: {
    MuiDataGrid: {
      styleOverrides: {
        root: {
          '& .old-task-row': {
            backgroundColor: 'rgba(236, 21, 21, 0.1)',
            '&:hover': {
              backgroundColor: 'rgba(248, 13, 13, 0.15)'
            },
            '&.Mui-selected': {
              backgroundColor: 'rgba(248, 24, 24, 0.2)',
              '&:hover': {
                backgroundColor: 'rgba(240, 7, 7, 0.25)'
              }
            }
          }
        }
      }
    }
  }
});


const DailyTaskReport = () => {
  const { canDo } = useTLPermissions();

  const [tasks, setTasks] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);
  const [hrList, setHrList] = useState([]);
  const [formData, setFormData] = useState({
    hrName: '',
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
    remark: '',
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [hrFilter, setHrFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });



  const token = sessionStorage.getItem("token");
  const config = {
    headers: { Authorization: `Bearer ${token}` }
  };

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/dailyTask/all`, config);
      // Sort tasks by createdAt date in descending order (newest first)
      const sortedTasks = [...res.data].sort((a, b) => {
        return new Date(b.createdAt) - new Date(a.createdAt);
      });
      setTasks(sortedTasks);
    } catch (err) {
      console.error("Error fetching tasks", err);
    }
  };

  const fetchHRs = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/dailyTask/assignHr`, config);
      setHrList(res.data);
    } catch (error) {
      console.error("Failed to load HRs", error);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  useEffect(() => {
    if (openForm) {
      fetchHRs();
    }

    if (editData) {
      setFormData(editData);
    } else {
      setFormData({
        hrName: '',
        companyName: '',
        position: '',
        totalCall: '',
        profilesShared: '',
        interviewsScheduled: '',
        revenueGenerated: '',
        TCEOD: '',
        PSEOD: '',
        ISEOD: '',
        RGEOD: '',
        remark: '',
      });
    }
  }, [openForm, editData]);

  const handleEdit = (task) => {
    setEditData(task);
    const formData = {
      hrName: task.hrName,
      hrId: task.hrId, // Include the HR ID
      companyName: task.companyName || '',
      position: task.position || '',
      totalCall: task.totalCall || '',
      profilesShared: task.profilesShared || '',
      interviewsScheduled: task.interviewsScheduled || '',
      revenueGenerated: task.revenueGenerated || '',
      TCEOD: task.TCEOD || '0',
      PSEOD: task.PSEOD || '0',
      ISEOD: task.ISEOD || '0',
      RGEOD: task.RGEOD || '0',
      remark: task.remark || ''
    };
    setFormData(formData);
    // Save to session storage when editing
    sessionStorage.setItem('dailyTaskFormData', JSON.stringify(formData));
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`${API_BASE_URL}/dailyTask/delete/${id}`, config);
        fetchTasks();
      } catch (err) {
        console.error("Error deleting task", err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle number fields to remove leading zeros
    const numberFields = ['totalCall', 'profilesShared', 'interviewsScheduled', 'revenueGenerated', 'TCEOD', 'PSEOD', 'ISEOD', 'RGEOD'];
    
    let processedValue = value;
    if (numberFields.includes(name)) {
      // Remove leading zeros and convert to number, but keep as string in state
      processedValue = value === '' ? '' : String(Number(value));
    }
    
    const updatedFormData = { ...formData, [name]: processedValue };
    setFormData(updatedFormData);
    
    // Save form data to session storage
    sessionStorage.setItem('dailyTaskFormData', JSON.stringify(updatedFormData));
    
    // Clear error for the field being edited
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: null
      });
    }
  };
  
  const validateForm = () => {
    const errors = {};
    const requiredFields = ['hrId', 'companyName', 'position'];
    
    requiredFields.forEach(field => {
      if (!formData[field]?.trim()) {
        errors[field] = 'This field is required';
      }
    });
    
    // Validate numeric fields
    const numericFields = ['totalCall', 'profilesShared', 'interviewsScheduled', 'revenueGenerated'];
    numericFields.forEach(field => {
      if (formData[field] && isNaN(Number(formData[field]))) {
        errors[field] = 'Must be a number';
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDuplicateClick = async (task) => {
    try {
      // Fetch the latest HR list
      const res = await axios.get(`${API_BASE_URL}/dailyTask/assignHr`, config);
      setHrList(res.data);
      
      // Set only the fields we want to pre-fill in the duplicate dialog
      setDuplicateData({
        companyName: task.companyName || '',
        position: task.position || '',
        totalCall: task.totalCall || 0,
        profilesShared: task.profilesShared || 0,
        interviewsScheduled: task.interviewsScheduled || 0,
        revenueGenerated: task.revenueGenerated || 0,
        remark: task.remark || ''
      });
      setOpenDuplicateDialog(true);
    } catch (error) {
      console.error("Error fetching HR list:", error);
      toast.error("Failed to load HR list");
    }
  };

  const handleDuplicateSubmit = async () => {
    if (!duplicateData.hrName) {
      toast.warning("Please select an HR");
      return;
    }

    try {
      const taskToCreate = {
        ...duplicateData,
        TCEOD: '0',
        PSEOD: '0',
        ISEOD: '0',
        RGEOD: '0'
      };
      
      await axios.post(`${API_BASE_URL}/dailyTask/create`, taskToCreate, config);
      toast.success("Task duplicated successfully");
      setOpenDuplicateDialog(false);
      fetchTasks();
    } catch (error) {
      console.error("Error duplicating task:", error);
      toast.error("Failed to duplicate task");
    }
  };

  const handleSubmit = async () => {
    // Prevent multiple submissions
    if (isSubmitting) {
      console.warn('Submission already in progress');
      return;
    }

    // Show loading state
    const loadingToast = toast.loading(editData ? "Updating task..." : "Creating task...");
    
    try {
      if (!validateForm()) {
        toast.update(loadingToast, {
          render: "Please fix form errors",
          type: "error",
          isLoading: false,
          autoClose: 3000
        });
        setIsSubmitting(false); // ✅ ensure reset
        return;
      }

      console.log('Starting form submission...');
      setIsSubmitting(true);
      
      // Create a copy of form data to avoid state mutation
      const submissionData = {
        hrName: formData.hrName.trim(),
        hrId: formData.hrId || (editData?.hrId || ''),
        companyName: (formData.companyName || '').trim(),
        position: (formData.position || '').trim(),
        totalCall: Number(formData.totalCall) || 0,
        profilesShared: Number(formData.profilesShared) || 0,
        interviewsScheduled: Number(formData.interviewsScheduled) || 0,
        revenueGenerated: Number(formData.revenueGenerated) || 0,
        TCEOD: formData.TCEOD || '0',
        PSEOD: formData.PSEOD || '0',
        ISEOD: formData.ISEOD || '0',
        RGEOD: formData.RGEOD || '0',
        remark: (formData.remark || '').trim()
      };

      console.log('Submitting data:', submissionData);
      
      // Make the API call
      if (editData) {
        await axios.put(`${API_BASE_URL}/dailyTask/update/${editData._id}`, submissionData, config);
        toast.update(loadingToast, {
          render: "Task updated successfully",
          type: "success",
          isLoading: false,
          autoClose: 3000
        });
      } else {
        await axios.post(`${API_BASE_URL}/dailyTask/create`, submissionData, config);
        toast.update(loadingToast, {
          render: "Task created successfully",
          type: "success",
          isLoading: false,
          autoClose: 3000
        });
      }

      // Clear any saved form data from session storage
      sessionStorage.removeItem('dailyTaskFormData');
      
      // Reset form
      const resetForm = {
        hrName: '',
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
      };
      
      console.log('Resetting form data...');
      setFormData(resetForm);
      
      // Close the form and reset edit data
      setOpenForm(false);
      setEditData(null);
      
      // Fetch updated tasks
      console.log('Fetching updated tasks...');
      await fetchTasks();
      
    } catch (error) {
      console.error("Error in form submission:", {
        error: error.message,
        response: error.response?.data,
        stack: error.stack
      });

      const errorMessage = error.response?.data?.message || 
                          error.message || 
                          "An error occurred. Please try again.";
      
      toast.update(loadingToast, {
        render: errorMessage,
        type: "error",
        isLoading: false,
        autoClose: 5000
      });

      // If it's an HR not found error, refresh the HR list
      if (error.response?.data?.message?.includes("HR user not found")) {
        console.log('HR not found, refreshing HR list...');
        try {
          await fetchHRs();
        } catch (hrError) {
          console.error('Error refreshing HR list:', hrError);
        }
      }
    } finally {
      console.log('Resetting isSubmitting state');
      setIsSubmitting(false);
    }
  };

  const filterTasks = (tasks) => {
    let filteredTasks = [...tasks];
    
    // Apply HR filter if selected
    if (hrFilter) {
      filteredTasks = filteredTasks.filter(task => task.hrName === hrFilter);
    }
    
    // Apply date range filter if not showing all tasks or if dates are selected
    if (!showAllTasks || (dateRange.startDate || dateRange.endDate)) {
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
      
      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);
      
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        const afterStart = !startDate || taskDate >= startDate;
        const beforeEnd = !endDate || taskDate <= endDate;
        
        return afterStart && beforeEnd;
      });
    }
    
    // Calculate totals for the filtered tasks
    const totals = filteredTasks.reduce((acc, task) => ({
      totalCall: acc.totalCall + (parseInt(task.totalCall) || 0),
      profilesShared: acc.profilesShared + (parseInt(task.profilesShared) || 0),
      interviewsScheduled: acc.interviewsScheduled + (parseInt(task.interviewsScheduled) || 0),
      TCEOD: acc.TCEOD + (parseInt(task.TCEOD) || 0),
      PSEOD: acc.PSEOD + (parseInt(task.PSEOD) || 0),
      ISEOD: acc.ISEOD + (parseInt(task.ISEOD) || 0)
    }), {
      totalCall: 0,
      profilesShared: 0,
      interviewsScheduled: 0,
      TCEOD: 0,
      PSEOD: 0,
      ISEOD: 0
    });
    
    return { filteredTasks, totals };
  };

  const { filteredTasks, totals } = filterTasks(tasks);

  // Function to check if a task is older than 3 days
  const isOlderThan3Days = (taskDate) => {
    const threeDaysAgo = new Date();
    threeDaysAgo.setDate(threeDaysAgo.getDate() - 3);
    return new Date(taskDate) < threeDaysAgo;
  };

  const columns = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 160,
      sortable: false,
      renderCell: (params) => (
        <>
          <IconButton onClick={() => handleEdit(params.row)} color="primary">
            <EditIcon />
          </IconButton>
          <IconButton onClick={() => handleDelete(params.row.id)} color="error">
            <DeleteIcon />
          </IconButton>
          <IconButton 
            onClick={() => handleDuplicateClick(params.row)} 
            color="primary"
            title="Duplicate Task"
          >
            <ContentCopyIcon fontSize="small" />
          </IconButton>
        </>
      )
    },
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

    { field: 'totalCall', headerName: 'Total Call', width: 130 },
    { field: 'TCEOD', headerName: 'TCEOD', width: 160 },
    { field: 'profilesShared', headerName: 'Profiles Shared', width: 150 },
    { field: 'PSEOD', headerName: 'PSEOD', width: 160 },
    { field: 'interviewsScheduled', headerName: 'Interviews Scheduled', width: 180 },
    { field: 'ISEOD', headerName: 'ISEOD', width: 160 },
    { field: 'revenueGenerated', headerName: 'Revenue Generated', width: 160 },
    { field: 'RGEOD', headerName: 'RGEOD', width: 160 },
    { field: 'remark', headerName: 'Remark', width: 200 },

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

  const handleResetFilters = () => {
    setHrFilter('');
    setDateRange({
      startDate: new Date(),
      endDate: new Date()
    });
    setShowAllTasks(false);
  };
  
  // Clear saved form data when component unmounts or form is submitted successfully
  useEffect(() => {
    return () => {
      sessionStorage.removeItem('dailyTaskFormData');
    };
  }, []);

  const handleExport = () => {
    // Prepare CSV content
    const headers = [
      'HR Name', 'Company Name', 'Position', 'Total Call', 
      'Profiles Shared', 'Interviews Scheduled', 'Revenue Generated',
      'TCEOD', 'PSEOD', 'ISEOD', 'RGEOD', 'Remark', 'Created At'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...filteredTasks.map(row => {
        return [
          `"${row.hrName || ''}"`,
          `"${row.companyName || ''}"`,
          `"${row.position || ''}"`,
          `"${row.totalCall || ''}"`,
          `"${row.profilesShared || ''}"`,
          `"${row.interviewsScheduled || ''}"`,
          `"${row.revenueGenerated || ''}"`,
          `"${row.TCEOD || ''}"`,
          `"${row.PSEOD || ''}"`,
          `"${row.ISEOD || ''}"`,
          `"${row.RGEOD || ''}"`,
          `"${row.remark || ''}"`,
          `"${new Date(row.createdAt).toLocaleString()}"`
        ].join(',');
      })
    ].join('\n');

    // Create download link
    const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `daily_tasks_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <ThemeProvider theme={theme}>
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <Box m={2}>
        <Box
  sx={{
    p: 3,
    backgroundColor: '#fff',
    borderRadius: 2,
    boxShadow: 2,
    display: 'flex',
    flexDirection: 'column',
    gap: 2,
    mb: 2
  }}
>
  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
    <Button variant="contained" onClick={() => { setEditData(null); setOpenForm(true); }} disabled={!canDo('tl-daily-task-report:create')}>
      + Create Task
    </Button>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          select
          label="Filter by HR"
          value={hrFilter}
          onChange={(e) => setHrFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All HRs</MenuItem>
          {Array.from(new Set(tasks.map(task => task.hrName))).map((hrName, index) => (
            <MenuItem key={index} value={hrName}>{hrName}</MenuItem>
          ))}
        </TextField>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={dateRange.startDate}
            onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
            maxDate={new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <DatePicker
            label="End Date"
            value={dateRange.endDate}
            onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
            minDate={dateRange.startDate}
            maxDate={new Date()}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <Button 
            variant={showAllTasks ? "contained" : "outlined"} 
            onClick={() => {
              setShowAllTasks(!showAllTasks);
              if (!showAllTasks) {
                // Clear date filter when showing all tasks
                setDateRange({
                  startDate: null,
                  endDate: null
                });
              } else {
                // Set to today's date when switching to today's tasks
                const today = new Date();
                setDateRange({
                  startDate: today,
                  endDate: today
                });
              }
            }}
            color="primary"
          >
            {showAllTasks ? "Show Today's Tasks" : "Show All Tasks"}
          </Button>
          <Button 
            variant="outlined" 
            onClick={() => {
              setHrFilter('');
              setDateRange({
                startDate: null,
                endDate: null
              });
              setShowAllTasks(true);
            }}
          >
            Clear Filters
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<FileDownloadIcon />}
            onClick={handleExport} disabled={!canDo('tl-daily-task-report:export')}
            disabled={filteredTasks.length === 0}
          >
            Export CSV
          </Button>
      </LocalizationProvider>
    </Box> 
  </Box>
  
  {/* Main Content Container with Scroll */}
  <Box sx={{ 
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 200px)',
    overflow: 'hidden',
    mt: 2
  }}>
    {/* Totals Section */}
    <Box sx={{ 
      backgroundColor: '#f5f5f5', 
      p: 2, 
      borderRadius: '4px',
      flexShrink: 0
    }}>
      {/* Column Names */}
      <Box sx={{ display: 'flex', mb: 1, color: '#666', fontSize: '0.875rem' }}>
        <Box sx={{ width: 150 }}>Total Type</Box>
        <Box sx={{ width: 130 }}>Total Calls</Box>
        <Box sx={{ width: 150 }}>Profiles Shared</Box>
        <Box sx={{ width: 180 }}>Interviews Scheduled</Box>
        <Box sx={{ width: 160 }}>TCEOD</Box>
        <Box sx={{ width: 160 }}>PSEOD</Box>
        <Box sx={{ width: 160 }}>ISEOD</Box>
      </Box>
      {/* Total Values */}
      <Box sx={{ display: 'flex', alignItems: 'center', '& > *': { fontWeight: 'bold' } }}>
        <Box sx={{ width: 150 }}>Total:</Box>
        <Box sx={{ width: 130 }}>{totals.totalCall}</Box>
        <Box sx={{ width: 150 }}>{totals.profilesShared}</Box>
        <Box sx={{ width: 180 }}>{totals.interviewsScheduled}</Box>
        <Box sx={{ width: 160 }}>{totals.TCEOD}</Box>
        <Box sx={{ width: 160 }}>{totals.PSEOD}</Box>
        <Box sx={{ width: 160 }}>{totals.ISEOD}</Box>
      </Box>
    </Box>

    {/* DataGrid Container */}
    <Box sx={{ 
      flex: 1,
      backgroundColor: '#fff',
      borderRadius: '4px',
      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
      overflow: 'hidden',
      mt: 2
    }}>
            <DataGrid
              rows={filteredTasks.map(task => ({ id: task._id, ...task }))}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              style={{ minWidth: '1200px', height: '100%' }}
              disableSelectionOnClick
              getRowClassName={(params) => {
                return isOlderThan3Days(params.row.createdAt) ? 'old-task-row' : '';
              }}
            />
          </Box>

          <Dialog
  open={openForm}
  onClose={(event, reason) => {
    // Prevent closing when clicking outside or pressing ESC
    if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
      setOpenForm(false);
    }
  }}
  maxWidth="md"
  fullWidth
>
      <DialogTitle>{editData ? "Edit Task" : "Create HR Task"}</DialogTitle>
      <DialogContent>
        {/* HR Name */}
        <TextField
  select
  name="hrId"
  label="Assign to HR *"
  fullWidth
  margin="dense"
  value={formData.hrId}
  onChange={(e) => {
    const selectedHr = hrList.find(hr => hr._id === e.target.value);
    setFormData({
      ...formData,
      hrId: e.target.value,
      hrName: `${selectedHr.firstName} ${selectedHr.lastName}`
    });
  }}
  error={!!formErrors.hrId}
  helperText={formErrors.hrId || ' '}
  required
>
  <MenuItem value="">
    <em>Select HR</em>
  </MenuItem>
  {hrList.map((hr) => (
    <MenuItem key={hr._id} value={hr._id}>
      {hr.firstName} {hr.lastName}
    </MenuItem>
  ))}
</TextField>

        
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              name="companyName"
              label="Company Name *"
              fullWidth
              margin="dense"
              value={formData.companyName || ''}
              onChange={handleChange}
              error={!!formErrors.companyName}
              helperText={formErrors.companyName || ' '}
              required
            />
          </Grid>

          <Grid item xs={12} md={6}>
            <TextField
              name="position"
              label="Position *"
              fullWidth
              margin="dense"
              value={formData.position || ''}
              onChange={handleChange}
              error={!!formErrors.position}
              helperText={formErrors.position || ' '}
              required
            />
          </Grid>
        </Grid>

        {/* Other fields + EOD side by side */}
        <Grid container spacing={2}>
          {[
            { name: 'totalCall', label: 'Target Total Call', eod: 'TCEOD', eodLabel: 'Total Call EOD' },
            { name: 'profilesShared', label: 'Target Profiles Share', eod: 'PSEOD', eodLabel: 'Profiles Shared EOD' },
            { name: 'interviewsScheduled', label: 'Target Interviews Schedule', eod: 'ISEOD', eodLabel: 'Interviews Scheduled EOD' },
            { name: 'revenueGenerated', label: 'Target Revenue Generate', eod: 'RGEOD', eodLabel: 'Revenue Generated EOD' }
          ].map(({ name, label, eod, eodLabel }) => (
            <React.Fragment key={name}>
              <Grid item xs={12} md={6}>
                <TextField
                  name={name}
                  label={label}
                  fullWidth
                  margin="dense"
                  value={formData[name] || ''}
                  onChange={handleChange}
                  error={!!formErrors[name]}
                  helperText={formErrors[name] || ' '}
                  type="number"
                  inputProps={{ 
                    min: 0,
                    step: name === 'revenueGenerated' ? '0.01' : '1'
                  }}
                  InputLabelProps={{
                    shrink: true,
                  }}
                />
              </Grid>
              {editData && (
                <Grid item xs={12} md={6}>
                  <TextField
                    name={eod}
                    label={eodLabel}
                    fullWidth
                    margin="dense"
                    value={formData[eod] || '0'}
                    onChange={handleChange}
                    type="number"
                    inputProps={{ 
                      min: 0,
                      step: eod === 'RGEOD' ? '0.01' : '1'
                    }}
                    InputLabelProps={{
                      shrink: true,
                    }}
                  />
                </Grid>
              )}
            </React.Fragment>
          ))}
        </Grid>

        {/* Remark Field */}
        <TextField
          name="remark"
          label="Remarks"
          fullWidth
          margin="dense"
          value={formData.remark || ''}
          onChange={handleChange}
          multiline
          rows={3}
          sx={{ mt: 2 }}
          placeholder="Enter any additional notes or comments"
        />

        {/* Form Actions */}


        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
        <Button
  variant="outlined"
  onClick={() => {
    setOpenForm(false);
    setFormErrors({});
  }}
>
  Cancel
</Button>

          <Button
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            disabled={isSubmitting}
            sx={{ minWidth: 120, mt: 3 }}
            fullWidth
          >
            {editData ? "Update" : "Submit"}
          </Button>
        </Box>
      </DialogContent>
    </Dialog>

    {/* Duplicate Task Dialog */}
    <Dialog open={openDuplicateDialog} onClose={() => setOpenDuplicateDialog(false)} maxWidth="md" fullWidth>
      <DialogTitle>Duplicate Task</DialogTitle>
      <DialogContent>
        <Grid container spacing={2}>
          <Grid item xs={12}>
            <TextField
              select
              name="hrName"
              label="Assign to HR"
              fullWidth
              margin="dense"
              value={duplicateData?.hrName || ''}
              onChange={(e) => setDuplicateData({...duplicateData, hrName: e.target.value})}
              required
            >
              {hrList.map((hr) => (
                <MenuItem key={hr._id} value={`${hr.firstName} ${hr.lastName}`}>
                  {hr.firstName} {hr.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
          {['companyName', 'position', 'totalCall', 'profilesShared', 'interviewsScheduled', 'revenueGenerated', 'remark'].map((field) => (
            <Grid item xs={6} key={field}>
              <TextField
                name={field}
                label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                fullWidth
                margin="dense"
                value={duplicateData?.[field] || ''}
                onChange={(e) => setDuplicateData({...duplicateData, [field]: e.target.value})}
                type={['totalCall', 'profilesShared', 'interviewsScheduled', 'revenueGenerated'].includes(field) ? 'number' : 'text'}
                multiline={field === 'remark'}
                rows={field === 'remark' ? 4 : 1}
              />
            </Grid>
          ))}
        </Grid>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3, gap: 2 }}>
          <Button variant="outlined" onClick={() => setOpenDuplicateDialog(false)}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleDuplicateSubmit} color="primary">
            Duplicate Task
          </Button>
        </Box>
      </DialogContent>
    </Dialog>
        </Box>
      </Box>
    </Box>
    </Box>
      </div>
    </ThemeProvider>
  );
};

export default DailyTaskReport;
