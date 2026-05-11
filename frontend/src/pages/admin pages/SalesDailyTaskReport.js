
import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Button, Box, IconButton, Dialog, DialogTitle,
  DialogContent, TextField, MenuItem
} from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, ContentCopy as ContentCopyIcon, FileDownload as FileDownloadIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import Sidebar from '../../components/admin components/AdminSidebar';
import Navbar from '../../components/admin components/AdminNavbar';
import { toast } from "react-toastify";
import { Grid } from '@mui/material';


const SalesDailyTaskReport = () => {

  const [tasks, setTasks] = useState([]);
  const [openForm, setOpenForm] = useState(false);
  const [openDuplicateDialog, setOpenDuplicateDialog] = useState(false);
  const [editData, setEditData] = useState(null);
  const [duplicateData, setDuplicateData] = useState(null);
  const [hrList, setHrList] = useState([]);
  const [formData, setFormData] = useState({
    salesName: '',
   TargetedLead: '',
    TargetedMeeting: '',
    TargetedAgreement: '',
    TargetedOpenings: '',
    TLEOD: '',
    TMEOD: '',
    TAEOD: '',
    TOEOD: '',
    remark: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [formErrors, setFormErrors] = useState({});
  
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [salesFilter, setSalesFilter] = useState('');
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
      const res = await axios.get(`${API_BASE_URL}/dailyTask/sales`, config);
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
      const res = await axios.get(`${API_BASE_URL}/dailyTask/assignSales`, config);
      setHrList(res.data);
    } catch (error) {
      console.error("Failed to load HRs", error);
    }
  };

  useEffect(() => {
    fetchTasks();

    // Auto-refresh every 30 seconds
    const interval = setInterval(() => {
      fetchTasks();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (openForm) {
      fetchHRs();
    }

    if (editData) {
      setFormData(editData);
    } else {
      setFormData({
         salesName: '',
   TargetedLead: '',
    TargetedMeeting: '',
    TargetedAgreement: '',
    TargetedOpenings: '',
       TLEOD: '',
    TMEOD: '',
    TAEOD: '',
    TOEOD: '',
    remark: ''
      });
    }
  }, [openForm, editData]);

  const handleEdit = (task) => {
    setEditData(task);
    const formData = {
      salesName: task.salesName,
      salesId: task.salesId, // Include the HR ID
      TargetedLead: task.TargetedLead,
      TargetedMeeting: task.TargetedMeeting,
      TargetedAgreement: task.TargetedAgreement,
      TargetedOpenings: task.TargetedOpenings,
       TLEOD: task.TLEOD || '0',
      TMEOD: task.TMEOD || '0',
      TAEOD: task.TAEOD || '0',
      TOEOD: task.TOEOD || '0',
      remark: task.remark || ''
    };
    setFormData(formData);
    // Save to session storage when editing
    sessionStorage.setItem('SalesdailyTaskFormData', JSON.stringify(formData));
    setOpenForm(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await axios.delete(`${API_BASE_URL}/dailyTask/sales/delete/${id}`, config);
        fetchTasks();
      } catch (err) {
        console.error("Error deleting task", err);
      }
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Handle number fields to remove leading zeros
    const numberFields = ['TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings','TLEOD','TMEOD','TAEOD','TOEOD'];
    let processedValue = value;
    if (numberFields.includes(name)) {
      // Remove leading zeros and convert to number, but keep as string in state
      processedValue = value === '' ? '' : String(Number(value));
    }
    
    const updatedFormData = { ...formData, [name]: processedValue };
    setFormData(updatedFormData);
    
    // Save form data to session storage
    sessionStorage.setItem('SalesdailyTaskFormData', JSON.stringify(updatedFormData));
    
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
    const requiredFields = ['salesId', 'TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings'];
    
    // Check required fields
    requiredFields.forEach(field => {
      const value = formData[field];
      if (value === undefined || value === null || value === '') {
        errors[field] = 'This field is required';
      } else if (typeof value === 'string' && !value.trim()) {
        errors[field] = 'This field cannot be empty';
      }
    });
    
    // Validate numeric fields
    const numericFields = ['TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings'];
    numericFields.forEach(field => {
      const value = formData[field];
      if (value !== undefined && value !== null && value !== '') {
        const numValue = Number(value);
        if (isNaN(numValue)) {
          errors[field] = 'Must be a number';
        } else if (numValue < 0) {
          errors[field] = 'Cannot be negative';
        }
      }
    });
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleDuplicateClick = async (task) => {
    try {
      // Fetch the latest HR list
      const res = await axios.get(`${API_BASE_URL}/dailyTask/assignSales`, config);
      setHrList(res.data);
      
      // Set only the fields we want to pre-fill in the duplicate dialog
      setDuplicateData({
        salesName: task.salesName || '',
        salesId: task.salesId || '', // Include the HR ID
        TargetedLead: task.TargetedLead || '',
        TargetedMeeting: task.TargetedMeeting || '',
        TargetedAgreement: task.TargetedAgreement || '',
        TargetedOpenings: task.TargetedOpenings || '',
        remark: task.remark || ''
      });
      setOpenDuplicateDialog(true);
    } catch (error) {
      console.error("Error fetching HR list:", error);
      toast.error("Failed to load HR list");
    }
  };

  const handleDuplicateSubmit = async () => {
    if (!duplicateData.salesName) {
      toast.warning("Please select an sales");
      return;
    }

    try {
      const taskToCreate = {
        ...duplicateData,
         TLEOD: '0',
        TMEOD: '0',
        TAEOD: '0',
        TOEOD: '0'
      };
      
      await axios.post(`${API_BASE_URL}/dailyTask/sales/task/create`, taskToCreate, config);
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
        salesName: formData.salesName.trim(),
        salesId: formData.salesId || (editData?.salesId || ''),
        TargetedLead: Number(formData.TargetedLead) || 0,
        TargetedMeeting: Number (formData.TargetedMeeting) || 0,
        TargetedAgreement: Number(formData.TargetedAgreement) || 0,
        TargetedOpenings: Number(formData.TargetedOpenings) || 0,
        TLEOD: formData.TLEOD || '0',
        TMEOD: formData.TMEOD || '0',
        TAEOD: formData.TAEOD || '0',
        TOEOD: formData.TOEOD || '0',
        remark: (formData.remark || '').trim()
      };

      console.log('Submitting data:', submissionData);
      
      // Make the API call
      if (editData) {
        await axios.put(`${API_BASE_URL}/dailyTask/sales/update/${editData._id}`, submissionData, config);
        toast.update(loadingToast, {
          render: "Task updated successfully",
          type: "success",
          isLoading: false,
          autoClose: 3000
        });
      } else {
        await axios.post(`${API_BASE_URL}/dailyTask/sales/task/create`, submissionData, config);
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
        salesName: '',
        salesId: '',
        TargetedLead: '',
        TargetedMeeting: '',
        TargetedAgreement: '',
        TargetedOpenings: '',
        TLEOD: '',
        TMEOD: '',
        TAEOD: '',
        TOEOD: '',
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
    
    // Apply sales filter if selected
    if (salesFilter) {
      filteredTasks = filteredTasks.filter(task => task.salesName === salesFilter);
    }
    
    // Apply date range filter if not showing all tasks or if dates are selected
    if (!showAllTasks || (dateRange.startDate || dateRange.endDate)) {
      filteredTasks = filteredTasks.filter(task => {
        const taskDate = new Date(task.createdAt);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);
        
        const afterStart = !startDate || taskDate >= startDate;
        const beforeEnd = !endDate || taskDate <= endDate;
        
        return afterStart && beforeEnd;
      });
    }
    
    return filteredTasks;
  };

  const filteredRows = filterTasks(tasks);

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
    { field: 'salesName', headerName: 'Sales Name', width: 150 },
    { field: 'TargetedLead', headerName: 'Targeted Lead', width: 150 },
    { field: 'TLEOD', headerName: 'TLEOD', width: 150 },
    { field: 'TargetedMeeting', headerName: 'Targeted Meeting', width: 150 },
    { field: 'TMEOD', headerName: 'TMEOD', width: 150 },
    { field: 'TargetedAgreement', headerName: 'Targeted Agreement', width: 150 },
    { field: 'TAEOD', headerName: 'TAEOD', width: 150 },
    { field: 'TargetedOpenings', headerName: 'Targeted Openings', width: 150 },
    { field: 'TOEOD', headerName: 'TOEOD', width: 150 },
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
    setSalesFilter('');
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
      'Sales Name', 'Targeted Lead', 'Targeted Meeting', 'Targeted Agreement', 'Targeted Openings','TLEOD','TMEOD','TAEOD','TOEOD','Remark', 'Created At'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...filteredRows.map(row => {
        return [
          `"${row.salesName || ''}"`,
          `"${row.TargetedLead || ''}"`,
          `"${row.TargetedMeeting || ''}"`,
          `"${row.TargetedAgreement || ''}"`,
          `"${row.TargetedOpenings || ''}"`,
          `"${row.TLEOD || ''}"`,
          `"${row.TMEOD || ''}"`,
          `"${row.TAEOD || ''}"`,
          `"${row.TOEOD || ''}"`,
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
    <Button variant="contained" onClick={() => { setEditData(null); setOpenForm(true); }}>
      + Create Task
    </Button>

      <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
        <TextField
          select
          label="Filter by Sales"
          value={salesFilter}
          onChange={(e) => setSalesFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 200 }}
        >
          <MenuItem value="">All Sales</MenuItem>
          {Array.from(new Set(tasks.map(task => task.salesName))).map((salesName, index) => (
            <MenuItem key={index} value={salesName}>{salesName}</MenuItem>
          ))}
        </TextField>
        <LocalizationProvider dateAdapter={AdapterDateFns}>
          <DatePicker
            label="Start Date"
            value={dateRange.startDate}
            onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
            renderInput={(params) => <TextField {...params} size="small" />}
          />
          <DatePicker
            label="End Date"
            value={dateRange.endDate}
            onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
            minDate={dateRange.startDate}
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
              setSalesFilter('');
              setDateRange({
                startDate: new Date(),
                endDate: new Date()
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
            onClick={handleExport}
            disabled={filteredRows.length === 0}
          >
            Export CSV
          </Button>
      </LocalizationProvider>
    </Box>
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
              rows={filteredRows.map(task => ({ id: task._id, ...task }))}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              style={{ minWidth: '1200px', height: '100%' }}
              disableSelectionOnClick
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
      <DialogTitle>{editData ? "Edit Sales Task" : "Create Sales Task"}</DialogTitle>
      <DialogContent>
        {/* Sales Person Selection */}
        <TextField
          select
          name="salesId"
          label="Select Sales Person *"
          fullWidth
          margin="dense"
          value={formData.salesId || ''}
          onChange={(e) => {
            const selectedSales = hrList.find(sales => sales._id === e.target.value);
            setFormData({
              ...formData,
              salesId: e.target.value,
              salesName: selectedSales ? `${selectedSales.firstName} ${selectedSales.lastName}` : ''
            });
          }}
          error={!!formErrors.salesId}
          helperText={formErrors.salesId || ' '}
          required
        >
          <MenuItem value="">
            <em>Select Sales Person</em>
          </MenuItem>
          {hrList.map((sales) => (
            <MenuItem key={sales._id} value={sales._id}>
              {sales.firstName} {sales.lastName}
            </MenuItem>
          ))}
        </TextField>

        {/* Target Fields */}
        <Grid container spacing={2}>
          {[
            { name: 'TargetedLead', label: 'Targeted Lead' ,eod: 'TLEOD', eodLabel: 'Targeted Lead EOD' },
            { name: 'TargetedMeeting', label: 'Targeted Meeting' ,eod: 'TMEOD', eodLabel: 'Targeted Meeting EOD' },
            { name: 'TargetedAgreement', label: 'Targeted Agreement' ,eod: 'TAEOD', eodLabel: 'Targeted Agreement EOD' },
            { name: 'TargetedOpenings', label: 'Targeted Openings' ,eod: 'TOEOD', eodLabel: 'Targeted Openings EOD' }
          ].map(({ name, label, eod, eodLabel }) => (
                        <React.Fragment key={name}>
            <Grid item xs={12} md={6} >
              <TextField
                name={name}
                label={`${label} *`}
                fullWidth
                margin="dense"
                value={formData[name] || ''}
                onChange={handleChange}
                error={!!formErrors[name]}
                helperText={formErrors[name] || ' '}
                type="number"
                inputProps={{ 
                  min: 0,
                  step: 1
                }}
                required
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
              name="salesId"
              label="Assign to Sales"
              fullWidth
              margin="dense"
              value={duplicateData?.salesId || ''}
              onChange={(e) => setDuplicateData({...duplicateData, salesId: e.target.value})}
              required
            >
              {hrList.map((sales) => (
                <MenuItem key={sales._id} value={`${sales.firstName} ${sales.lastName}`}>
                  {sales.firstName} {sales.lastName}
                </MenuItem>
              ))}
            </TextField>
          </Grid>
          
             {['TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings', 'remark'].map((field) => (
            <Grid item xs={6} key={field}>
              <TextField
                name={field}
                label={field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                fullWidth
                margin="dense"
                value={duplicateData?.[field] || ''}
                onChange={(e) => setDuplicateData({...duplicateData, [field]: e.target.value})}
                type={['TargetedLead', 'TargetedMeeting', 'TargetedAgreement', 'TargetedOpenings'].includes(field) ? 'number' : 'text'}
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
    </div>
  );
};

export default SalesDailyTaskReport;
