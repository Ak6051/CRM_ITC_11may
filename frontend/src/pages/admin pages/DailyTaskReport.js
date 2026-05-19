
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
  Grid,
  Tabs,
  Tab,
  Chip,
  Typography,
  Badge,
  Tooltip,
  DialogActions,
  Autocomplete
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ContentCopy as ContentCopyIcon,
  FileDownload as FileDownloadIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  AddCircleOutline as AddIcon,
  RemoveCircleOutline as RemoveIcon
} from '@mui/icons-material';

// Component Imports
import Sidebar from '../../components/admin components/AdminSidebar';
import Navbar from '../../components/admin components/AdminNavbar';

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
    ISEOD: '0',
    RGEOD: '0',
    remarks: [''],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [showAllTasks, setShowAllTasks] = useState(false);
  const [hrFilter, setHrFilter] = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [positionFilter, setPositionFilter] = useState('');

  // Jobs assigned to the selected HR (for company + position dropdowns in create/edit form)
  const [hrJobs, setHrJobs] = useState([]);
  const [hrPositionOptions, setHrPositionOptions] = useState([]);
  const [allCompanies, setAllCompanies] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(),
    endDate: new Date()
  });

  // Tab state: 0 = Tasks, 1 = Edit Requests
  const [activeTab, setActiveTab] = useState(0);

  // Edit requests state
  const [editRequests, setEditRequests] = useState([]);
  const [editRequestsLoading, setEditRequestsLoading] = useState(false);
  const [reviewDialog, setReviewDialog] = useState({ open: false, request: null, action: null });
  const [reviewNote, setReviewNote] = useState('');



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

  const fetchEditRequests = async () => {
    try {
      setEditRequestsLoading(true);
      const res = await axios.get(`${API_BASE_URL}/dailyTask/edit-requests`, config);
      setEditRequests(res.data);
    } catch (err) {
      console.error("Failed to load edit requests", err);
    } finally {
      setEditRequestsLoading(false);
    }
  };

  const handleReviewAction = (request, action) => {
    setReviewDialog({ open: true, request, action });
    setReviewNote('');
  };

  // Fetch jobs assigned to a specific HR (for company + position dropdowns)
  const fetchHrJobs = async (hrId, currentCompany = null) => {
    if (!hrId) { setHrJobs([]); setHrPositionOptions([]); return; }
    try {
      const res = await axios.get(`${API_BASE_URL}/fetch/hr/${hrId}/positions`, config);
      const jobs = res.data || [];
      setHrJobs(jobs);

      // If a company is already selected, update the position options for it
      const company = currentCompany || formData.companyName;
      if (company) {
        const positions = jobs
          .filter(j => j.companyName?.trim().toLowerCase() === company.trim().toLowerCase())
          .map(j => j.jobTitle?.trim())
          .filter(Boolean);
        setHrPositionOptions([...new Set(positions)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' })));
      } else {
        setHrPositionOptions([]);
      }
    } catch (err) {
      console.error('Error fetching HR jobs:', err);
      setHrJobs([]);
      setHrPositionOptions([]);
    }
  };

  const fetchAllCompanies = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/companies`, config);
      if (res.data && res.data.success) {
        setAllCompanies(res.data.data || []);
      }
    } catch (error) {
      console.error("Failed to load companies from CompanyCreate model", error);
    }
  };

  // Unique company names from allCompanies (CompanyCreate model)
  const hrCompanyOptions = [...new Map(
    allCompanies.map(c => [c.companyName?.trim().toLowerCase(), c.companyName?.trim()])
  ).values()].filter(Boolean).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));

  // When HR is selected in the form
  const handleHrSelect = (hrId) => {
    const selectedHr = hrList.find(hr => hr._id === hrId);
    setFormData(prev => ({
      ...prev,
      hrId,
      hrName: selectedHr ? `${selectedHr.firstName} ${selectedHr.lastName}` : '',
    }));
    if (formErrors.hrId) setFormErrors(prev => ({ ...prev, hrId: '' }));
    fetchHrJobs(hrId);
  };

  // When company is selected in the form
  const handleFormCompanySelect = (companyName) => {
    const positions = hrJobs
      .filter(j => j.companyName?.trim().toLowerCase() === companyName?.trim().toLowerCase())
      .map(j => j.jobTitle?.trim())
      .filter(Boolean);
    const unique = [...new Set(positions)].sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
    setHrPositionOptions(unique);
    setFormData(prev => ({ ...prev, companyName: companyName || '', position: '', revenueGenerated: '' }));
    if (formErrors.companyName) setFormErrors(prev => ({ ...prev, companyName: '' }));
  };

  // When position is selected — auto-fill revenueGenerated from job salary
  // AND auto-fetch TCEOD (candidate count for this HR + position today)
  const handleFormPositionSelect = async (positionName) => {
    if (formErrors.position) setFormErrors(prev => ({ ...prev, position: '' }));

    // Find matching job for current company + position
    const job = hrJobs.find(
      j =>
        j.companyName?.trim().toLowerCase() === formData.companyName?.trim().toLowerCase() &&
        j.jobTitle?.trim().toLowerCase() === positionName?.trim().toLowerCase()
    );

    let revenue = '';
    if (job?.salary) {
      const raw = String(job.salary).replace(/,/g, '').trim();
      const lpaMatch = raw.match(/([\d.]+)\s*lpa/i);
      if (lpaMatch) {
        const monthly = Math.round((parseFloat(lpaMatch[1]) * 100000) / 12);
        revenue = monthly;
      } else {
        const num = parseFloat(raw);
        if (!isNaN(num)) revenue = num;
      }
    }

    setFormData(prev => ({ ...prev, position: positionName || '', revenueGenerated: revenue }));

    // Auto-fetch candidate count for TCEOD
    const hrId = (formData.hrId || editData?.hrId)?.toString();
    if (hrId && positionName) {
      try {
        // Use task date if editing, else today
        const taskDate = editData?.createdAt
          ? new Date(editData.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        const res = await axios.get(`${API_BASE_URL}/dailyTask/hr-candidate-count`, {
          headers: config.headers,
          params: { hrId, position: positionName, date: taskDate },
        });
        const liveCount = res.data.count;
        if (typeof liveCount === 'number') {
          setFormData(prev => ({ ...prev, TCEOD: String(liveCount) }));
        }
      } catch (err) {
        console.error('Could not fetch candidate count for TCEOD:', err);
      }
    }
  };

  const handleReviewSubmit = async () => {
    const { request, action } = reviewDialog;
    const endpoint = action === 'approve'
      ? `${API_BASE_URL}/dailyTask/edit-requests/${request._id}/approve`
      : `${API_BASE_URL}/dailyTask/edit-requests/${request._id}/reject`;
    try {
      await axios.put(endpoint, { reviewNote }, config);
      toast.success(`Edit request ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
      setReviewDialog({ open: false, request: null, action: null });
      fetchEditRequests();
      fetchTasks(); // refresh tasks in case an approval changed data
    } catch (err) {
      console.error("Error reviewing request:", err);
      toast.error(err.response?.data?.message || 'Failed to process request');
    }
  };

  useEffect(() => {
    fetchTasks();
    fetchEditRequests();
    fetchHRs();
    fetchAllCompanies();

    // Auto-refresh every 30 seconds so admin sees new HR tasks without manual reload
    const interval = setInterval(() => {
      fetchTasks();
      fetchEditRequests();
      fetchHRs();
      fetchAllCompanies();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (openForm) {
      fetchHRs();
      fetchAllCompanies();
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
        remarks: [''],
      });
    }
  }, [openForm, editData]);

  const handleEdit = async (task) => {
    // Auto-fetch candidate count for TCEOD FIRST, then set editData
    // (so useEffect doesn't overwrite the fetched TCEOD)
    let fetchedTCEOD = task.TCEOD ?? '';

    if (task.hrId && task.position) {
      try {
        const taskDate = task.createdAt
          ? new Date(task.createdAt).toISOString().split('T')[0]
          : new Date().toISOString().split('T')[0];

        const countRes = await axios.get(`${API_BASE_URL}/dailyTask/hr-candidate-count`, {
          headers: config.headers,
          params: { hrId: task.hrId.toString(), position: task.position, date: taskDate },
        });
        const liveCount = countRes.data.count;
        if (typeof liveCount === 'number') {
          fetchedTCEOD = String(liveCount);
        }
      } catch (err) {
        console.error('Could not auto-fetch TCEOD candidate count:', err);
      }
    }

    // Build fd with fetched TCEOD — set editData to this so useEffect uses updated value
    const fd = {
      _id: task._id,
      hrName: task.hrName,
      hrId: task.hrId,
      companyName: task.companyName ?? '',
      position: task.position ?? '',
      totalCall: task.totalCall ?? '',
      profilesShared: task.profilesShared ?? '',
      interviewsScheduled: task.interviewsScheduled ?? '',
      revenueGenerated: task.revenueGenerated ?? '',
      TCEOD: fetchedTCEOD,
      // Show empty string if EOD value is "0" or 0 — so admin can enter actual value
      PSEOD: (task.PSEOD === '0' || task.PSEOD === 0) ? '' : (task.PSEOD ?? ''),
      ISEOD: (task.ISEOD === '0' || task.ISEOD === 0) ? '' : (task.ISEOD ?? ''),
      RGEOD: (task.RGEOD === '0' || task.RGEOD === 0) ? '' : (task.RGEOD ?? ''),
      remarks: Array.isArray(task.remarks) ? (task.remarks.length > 0 ? task.remarks : ['']) : (task.remark ? [task.remark] : [''])
    };

    setEditData(fd);  // useEffect will call setFormData(fd) with correct TCEOD
    sessionStorage.setItem('dailyTaskFormData', JSON.stringify(fd));

    // Pre-load jobs for this HR so company/position dropdowns work
    if (task.hrId) {
      fetchHrJobs(task.hrId.toString(), task.companyName);
    }

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

    // Handle number fields — allow empty string, remove leading zeros only when value is non-empty
    const numberFields = ['totalCall', 'profilesShared', 'interviewsScheduled', 'revenueGenerated', 'TCEOD', 'PSEOD', 'ISEOD', 'RGEOD'];

    let processedValue = value;
    if (numberFields.includes(name)) {
      if (value === '' || value === null || value === undefined) {
        processedValue = '';
      } else {
        // Remove leading zeros but keep the value as string
        const num = Number(value);
        processedValue = isNaN(num) ? value : String(num);
      }
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

  const handleRemarkChange = (index, value) => {
    const newRemarks = [...(formData.remarks || [''])];
    newRemarks[index] = value;
    const updatedFormData = { ...formData, remarks: newRemarks };
    setFormData(updatedFormData);
    sessionStorage.setItem('dailyTaskFormData', JSON.stringify(updatedFormData));
  };

  const addRemarkField = () => {
    const updatedFormData = { ...formData, remarks: [...(formData.remarks || ['']), ''] };
    setFormData(updatedFormData);
    sessionStorage.setItem('dailyTaskFormData', JSON.stringify(updatedFormData));
  };

  const removeRemarkField = (index) => {
    const newRemarks = (formData.remarks || ['']).filter((_, i) => i !== index);
    const updatedFormData = { ...formData, remarks: newRemarks.length > 0 ? newRemarks : [''] };
    setFormData(updatedFormData);
    sessionStorage.setItem('dailyTaskFormData', JSON.stringify(updatedFormData));
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
        remarks: Array.isArray(task.remarks) ? (task.remarks.length > 0 ? task.remarks : ['']) : (task.remark ? [task.remark] : [''])
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
        remarks: (formData.remarks || []).map(r => r.trim()).filter(r => r !== '')
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
        remarks: ['']
      };

      console.log('Resetting form data...');
      setFormData(resetForm);

      // Close the form and reset edit data
      setOpenForm(false);
      setEditData(null);
      setHrJobs([]);
      setHrPositionOptions([]);

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

    // Apply company filter (dropdown)
    if (companyFilter) {
      filteredTasks = filteredTasks.filter(task =>
        (task.companyName || '').trim().toLowerCase() === companyFilter.trim().toLowerCase()
      );
    }

    // Apply position filter (dropdown)
    if (positionFilter) {
      filteredTasks = filteredTasks.filter(task =>
        (task.position || '').trim().toLowerCase() === positionFilter.trim().toLowerCase()
      );
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
    setCompanyFilter('');
    setPositionFilter('');
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
        <Box sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '250px',
          height: '100vh',
          overflowY: 'auto', // Added vertical scroll
          backgroundColor: '#f5f5f5'
        }}>
          <Navbar />
          <Box m={2}>

            {/* ── Tabs ── */}
            {/* ── Header Line (Tabs + Filters) ── */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 2,
              borderBottom: 1,
              borderColor: 'divider',
              backgroundColor: '#fff',
              borderRadius: '8px 8px 0 0',
              px: 2
            }}>
              <Tabs
                value={activeTab}
                onChange={(_, v) => { setActiveTab(v); if (v === 1) fetchEditRequests(); }}
                sx={{ minHeight: '48px' }}
              >
                <Tab label="Daily Tasks" sx={{ fontWeight: 700, textTransform: 'none' }} />
                <Tab
                  sx={{ fontWeight: 700, textTransform: 'none' }}
                  label={
                    <Badge
                      badgeContent={editRequests.filter(r => r.status === 'pending').length}
                      color="error"
                      max={99}
                    >
                      <Box sx={{ pr: editRequests.filter(r => r.status === 'pending').length > 0 ? 2 : 0 }}>
                        Edit Requests
                      </Box>
                    </Badge>
                  }
                />
              </Tabs>

              {/* Contextual Filters on the right side of Tabs */}
              <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', py: 1 }}>
                {activeTab === 0 ? (
                  <>
                    <Button variant="contained" size="small" onClick={() => { setEditData(null); setOpenForm(true); }} sx={{ textTransform: 'none', ml: 1, minWidth: '85px' }}>+ Create</Button>
                    <Autocomplete
                      options={Array.from(new Set(hrList.map(h => `${h.firstName} ${h.lastName}`))).sort()}
                      value={hrFilter || null}
                      onChange={(_, newValue) => setHrFilter(newValue || '')}
                      size="small"
                      sx={{ minWidth: 160 }}
                      renderInput={(params) => <TextField {...params} label="HR" size="small" />}
                    />
                    <Autocomplete
                      options={Array.from(new Map(tasks.map(t => (t.companyName || '').trim()).filter(Boolean).map(n => [n.toLowerCase(), n])).values()).sort()}
                      value={companyFilter || null}
                      onChange={(_, newValue) => setCompanyFilter(newValue || '')}
                      size="small"
                      sx={{ minWidth: 180 }}
                      renderInput={(params) => <TextField {...params} label="Company" size="small" />}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <DatePicker
                          label="Start"
                          value={dateRange.startDate}
                          onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ width: 135 }} />}
                        />
                        <DatePicker
                          label="End"
                          value={dateRange.endDate}
                          onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ width: 135 }} />}
                        />
                      </Box>
                    </LocalizationProvider>
                    <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ textTransform: 'none' }}>Clear</Button>
                    <Button variant="contained" size="small" startIcon={<FileDownloadIcon />} onClick={handleExport} sx={{ textTransform: 'none' }}>CSV</Button>
                  </>
                ) : (
                  <>
                    <Autocomplete
                      options={Array.from(new Set(hrList.map(h => `${h.firstName} ${h.lastName}`))).sort()}
                      value={hrFilter || null}
                      onChange={(_, newValue) => setHrFilter(newValue || '')}
                      size="small"
                      sx={{ minWidth: 180 }}
                      renderInput={(params) => <TextField {...params} label="Filter by HR" size="small" />}
                    />
                    <LocalizationProvider dateAdapter={AdapterDateFns}>
                      <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
                        <DatePicker
                          label="Start"
                          value={dateRange.startDate}
                          onChange={(date) => setDateRange(prev => ({ ...prev, startDate: date }))}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ width: 135 }} />}
                        />
                        <DatePicker
                          label="End"
                          value={dateRange.endDate}
                          onChange={(date) => setDateRange(prev => ({ ...prev, endDate: date }))}
                          renderInput={(params) => <TextField {...params} size="small" sx={{ width: 135 }} />}
                        />
                      </Box>
                    </LocalizationProvider>
                    <Button variant="outlined" size="small" onClick={handleResetFilters} sx={{ textTransform: 'none' }}>Reset</Button>
                    <Button variant="outlined" size="small" onClick={fetchEditRequests} sx={{ textTransform: 'none' }}>Refresh</Button>
                  </>
                )}
              </Box>
            </Box>

            {/* ── Tab 0: Daily Tasks ── */}
            {activeTab === 0 && (
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
                      if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                        setOpenForm(false);
                      }
                    }}
                    maxWidth="lg"
                    fullWidth
                    PaperProps={{
                      sx: {
                        borderRadius: 2,
                        maxHeight: '100vh',
                        background: 'linear-gradient(135deg, #f8faff 0%, #ffffff 100%)'
                      }
                    }}
                  >
                    {/* ── Dialog Header ── */}
                    <DialogTitle
                      sx={{
                        px: 3,
                        py: 2,
                        background: editData
                          ? 'linear-gradient(90deg, #1565c0 0%, #1976d2 100%)'
                          : 'linear-gradient(90deg, #2e7d32 0%, #388e3c 100%)',
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
                          fontSize: '1.1rem'
                        }}
                      >
                        {editData ? '✏️' : '➕'}
                      </Box>
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
                          {editData ? 'Edit Task' : 'Create HR Task'}
                        </Typography>
                        <Typography variant="caption" sx={{ opacity: 0.85 }}>
                          {editData
                            ? `Editing: ${editData.companyName} — ${editData.position}`
                            : 'Fill in the details to create a new daily task'}
                        </Typography>
                      </Box>
                    </DialogTitle>

                    <DialogContent sx={{ p: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
                      <Box sx={{ p: 3, overflowY: 'auto', flex: 1 }}>

                        {/* ── Row 1: HR + Company + Position ── */}
                        <Grid container spacing={2} sx={{ mb: 2 }}>
                          <Grid item xs={12} md={4}>
                            <Autocomplete
                              options={[...hrList].sort((a, b) => `${a.firstName} ${a.lastName}`.localeCompare(`${b.firstName} ${b.lastName}`, undefined, { sensitivity: 'base' }))}
                              getOptionLabel={(hr) => hr ? `${hr.firstName} ${hr.lastName}` : ''}
                              value={hrList.find(hr => hr._id === formData.hrId) || null}
                              onChange={(_, val) => handleHrSelect(val?._id || '')}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Assign to HR *"
                                  size="small"
                                  error={!!formErrors.hrId}
                                  helperText={formErrors.hrId || ''}
                                  required
                                />
                              )}
                              isOptionEqualToValue={(opt, val) => opt._id === val?._id}
                              clearOnEscape
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Autocomplete
                              options={hrCompanyOptions}
                              value={formData.companyName || null}
                              disabled={!formData.hrId}
                              onChange={(_, v) => handleFormCompanySelect(v || '')}
                              renderInput={(params) => (
                                <TextField
                                  {...params}
                                  label="Company Name *"
                                  size="small"
                                  error={!!formErrors.companyName}
                                  helperText={
                                    formErrors.companyName ||
                                    (!formData.hrId ? 'Select an HR first' : 'Select from assigned companies')
                                  }
                                  required
                                />
                              )}
                              clearOnEscape
                              isOptionEqualToValue={(o, v) => o.toLowerCase() === v?.toLowerCase()}
                            />
                          </Grid>
                          <Grid item xs={12} md={4}>
                            <Autocomplete
                              options={hrPositionOptions}
                              value={formData.position || null}
                              disabled={!formData.companyName}
                              onChange={(_, v) => handleFormPositionSelect(v || '')}
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

                        {/* ── Main Body: Metrics (left) + Remark (right) ── */}
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
                                    { name: 'totalCall', label: 'Total Calls', eod: 'TCEOD', icon: '📞' },
                                    { name: 'profilesShared', label: 'Profiles Shared', eod: 'PSEOD', icon: '👤' },
                                    { name: 'interviewsScheduled', label: 'Interviews Scheduled', eod: 'ISEOD', icon: '📅' },
                                    { name: 'revenueGenerated', label: 'Revenue Generated', eod: 'RGEOD', icon: '💰' }
                                  ].map(({ name, label, eod, icon }) => (
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
                                            value={formData[name] || ''}
                                            onChange={handleChange}
                                            error={!!formErrors[name]}
                                            type="number"
                                            inputProps={{ min: 0, step: name === 'revenueGenerated' ? '0.01' : '1' }}
                                            InputLabelProps={{ shrink: true }}
                                            sx={{ '& .MuiOutlinedInput-root': { backgroundColor: '#fff' } }}
                                          />

                                          {editData && (
                                            <TextField
                                              name={eod}
                                              label="EOD Achieved"
                                              fullWidth
                                              size="small"
                                              value={formData[eod] ?? ''}
                                              onChange={handleChange}
                                              type="number"
                                              inputProps={{ min: 0, step: eod === 'RGEOD' ? '0.01' : '1' }}
                                              InputLabelProps={{ shrink: true }}
                                              sx={{
                                                '& .MuiOutlinedInput-root': { backgroundColor: '#f1faf2' },
                                                '& .MuiOutlinedInput-notchedOutline': { borderColor: '#a5d6a7' }
                                              }}
                                            />
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

                        {/* ── Bottom: Remark Panel (always visible) ── */}
                        <Grid container spacing={2} sx={{ mt: 1 }}>
                          <Grid item xs={12}>
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
                                  borderBottom: '1px solid #e3eaf5',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
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
                                            '& .MuiInputBase-root': {
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
                          onClick={() => { setOpenForm(false); setFormErrors({}); setHrJobs([]); setHrPositionOptions([]); }}
                          sx={{ minWidth: 100 }}
                        >
                          Cancel
                        </Button>
                        <Button
                          variant="contained"
                          color={editData ? 'primary' : 'success'}
                          onClick={handleSubmit}
                          disabled={isSubmitting}
                          sx={{ minWidth: 140, fontWeight: 600 }}
                        >
                          {isSubmitting ? 'Saving...' : editData ? '✓ Update Task' : '➕ Create Task'}
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
                            onChange={(e) => setDuplicateData({ ...duplicateData, hrName: e.target.value })}
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
                              onChange={(e) => setDuplicateData({ ...duplicateData, [field]: e.target.value })}
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
            )} {/* end Tab 0 */}

            {/* ── Tab 1: Edit Requests ── */}
            {activeTab === 1 && (
              <Box sx={{ p: 2, backgroundColor: '#fff', borderRadius: 2, boxShadow: 2 }}>

                <DataGrid
                  loading={editRequestsLoading}
                  rows={editRequests
                    .filter(r => {
                      if (hrFilter) {
                        const name = `${r.requestedBy?.firstName} ${r.requestedBy?.lastName}`;
                        if (name !== hrFilter) return false;
                      }
                      if (dateRange.startDate || dateRange.endDate) {
                        const d = new Date(r.createdAt);
                        if (dateRange.startDate && d < new Date(dateRange.startDate).setHours(0, 0, 0, 0)) return false;
                        if (dateRange.endDate && d > new Date(dateRange.endDate).setHours(23, 59, 59, 999)) return false;
                      }
                      return true;
                    })
                    .map(r => ({ id: r._id, ...r }))}
                  autoHeight
                  pageSize={10}
                  rowsPerPageOptions={[10, 25, 50]}
                  disableSelectionOnClick
                  columns={[
                    {
                      field: 'reviewActions',
                      headerName: 'Actions',
                      width: 130,
                      sortable: false,
                      renderCell: (params) => {
                        if (params.row.status !== 'pending') return null;
                        return (
                          <>
                            <Tooltip title="Approve">
                              <IconButton color="success" size="small" onClick={() => handleReviewAction(params.row, 'approve')}>
                                <CheckCircleIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                            <Tooltip title="Reject">
                              <IconButton color="error" size="small" onClick={() => handleReviewAction(params.row, 'reject')}>
                                <CancelIcon fontSize="small" />
                              </IconButton>
                            </Tooltip>
                          </>
                        );
                      }
                    },
                    {
                      field: 'status',
                      headerName: 'Status',
                      width: 110,
                      renderCell: (params) => {
                        const colorMap = { pending: 'warning', approved: 'success', rejected: 'error' };
                        return <Chip label={params.value} color={colorMap[params.value] || 'default'} size="small" />;
                      }
                    },
                    {
                      field: 'requestedBy',
                      headerName: 'Requested By',
                      width: 180,
                      renderCell: (params) => {
                        const u = params.row.requestedBy;
                        if (!u) return 'N/A';
                        return `${u.firstName} ${u.lastName} (${u.role})`;
                      }
                    },
                    {
                      field: 'taskInfo',
                      headerName: 'Original Task',
                      width: 200,
                      renderCell: (params) => {
                        const t = params.row.taskId;
                        if (!t) return 'N/A';
                        return `${t.companyName} — ${t.position}`;
                      }
                    },
                    {
                      field: 'proposedChanges',
                      headerName: 'Proposed Changes',
                      width: 300,
                      renderCell: (params) => {
                        const c = params.row.proposedChanges;
                        if (!c) return 'N/A';
                        return `${c.companyName} | ${c.position} | Calls:${c.totalCall} | Profiles:${c.profilesShared} | Interviews:${c.interviewsScheduled}`;
                      }
                    },
                    {
                      field: 'reviewNote',
                      headerName: 'Review Note',
                      width: 180
                    },
                    {
                      field: 'reviewedBy',
                      headerName: 'Reviewed By',
                      width: 160,
                      renderCell: (params) => {
                        const u = params.row.reviewedBy;
                        if (!u) return '—';
                        return `${u.firstName} ${u.lastName}`;
                      }
                    },
                    {
                      field: 'createdAt',
                      headerName: 'Requested At',
                      width: 180,
                      renderCell: (params) => new Date(params.value).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit', hour12: true
                      })
                    }
                  ]}
                />
              </Box>
            )}

            {/* ── Review Confirm Dialog ── */}
            <Dialog open={reviewDialog.open} onClose={() => setReviewDialog({ open: false, request: null, action: null })} maxWidth="md" fullWidth>
              <DialogTitle>
                {reviewDialog.action === 'approve' ? 'Approve Edit Request' : 'Reject Edit Request'}
              </DialogTitle>
              <DialogContent>
                {reviewDialog.request && (
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Requested by: <strong>{reviewDialog.request.requestedBy?.firstName} {reviewDialog.request.requestedBy?.lastName}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary" gutterBottom>
                      Task: <strong>{reviewDialog.request.taskId?.companyName} — {reviewDialog.request.taskId?.position}</strong>
                    </Typography>

                    {reviewDialog.request.proposedChanges && (() => {
                      const c = reviewDialog.request.proposedChanges;
                      return (
                        <Box sx={{ mt: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: 'block', mb: 1.5 }}>
                            Proposed Changes
                          </Typography>

                          {/* Company & Position */}
                          <Grid container spacing={2} sx={{ mb: 1 }}>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Company Name</Typography>
                              <Typography variant="body2" fontWeight={600}>{c.companyName || '—'}</Typography>
                            </Grid>
                            <Grid item xs={6}>
                              <Typography variant="caption" color="text.secondary">Position</Typography>
                              <Typography variant="body2" fontWeight={600}>{c.position || '—'}</Typography>
                            </Grid>
                          </Grid>

                          {/* Paired rows: Target | EOD */}
                          {[
                            { label: 'Total Call', target: c.totalCall, eodLabel: 'TCEOD', eod: c.TCEOD },
                            { label: 'Profiles Shared', target: c.profilesShared, eodLabel: 'PSEOD', eod: c.PSEOD },
                            { label: 'Interviews Scheduled', target: c.interviewsScheduled, eodLabel: 'ISEOD', eod: c.ISEOD },
                            { label: 'Revenue Generated', target: c.revenueGenerated, eodLabel: 'RGEOD', eod: c.RGEOD },
                          ].map(({ label, target, eodLabel, eod }) => (
                            <Grid container spacing={2} key={label} sx={{ mb: 1 }}>
                              <Grid item xs={6}>
                                <Box sx={{ p: 1, backgroundColor: '#fff', borderRadius: 1, border: '1px solid #e0e0e0' }}>
                                  <Typography variant="caption" color="text.secondary">{label}</Typography>
                                  <Typography variant="body2" fontWeight={600}>{target ?? '—'}</Typography>
                                </Box>
                              </Grid>
                              <Grid item xs={6}>
                                <Box sx={{ p: 1, backgroundColor: '#e8f5e9', borderRadius: 1, border: '1px solid #c8e6c9' }}>
                                  <Typography variant="caption" color="text.secondary">{eodLabel} (EOD)</Typography>
                                  <Typography variant="body2" fontWeight={600}>{eod ?? '—'}</Typography>
                                </Box>
                              </Grid>
                            </Grid>
                          ))}

                          {/* Remark */}
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption" color="text.secondary">Remark</Typography>
                            <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>{c.remark || '—'}</Typography>
                          </Box>
                        </Box>
                      );
                    })()}
                  </Box>
                )}
                <TextField
                  label="Review Note (optional)"
                  fullWidth
                  multiline
                  rows={2}
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Add a note for the HR..."
                  sx={{ mt: 1 }}
                />
              </DialogContent>
              <DialogActions>
                <Button onClick={() => setReviewDialog({ open: false, request: null, action: null })}>Cancel</Button>
                <Button
                  variant="contained"
                  color={reviewDialog.action === 'approve' ? 'success' : 'error'}
                  onClick={handleReviewSubmit}
                >
                  {reviewDialog.action === 'approve' ? 'Approve' : 'Reject'}
                </Button>
              </DialogActions>
            </Dialog>

          </Box>
        </Box>
      </div>
    </ThemeProvider>
  );
};

export default DailyTaskReport;
