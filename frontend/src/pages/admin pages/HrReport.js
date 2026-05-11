import React, { useEffect, useState } from 'react';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  Chip,
  MenuItem,
  Checkbox,
  ListItemText,
  OutlinedInput,
  Autocomplete,
  Paper,
  IconButton,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Snackbar,
  Alert,
  TextField,
  Grid,
  InputAdornment,
  Card,
  CardContent,
  CardHeader,
  Divider,
  alpha,
  useTheme,
  DialogContentText,
  Drawer,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import EventIcon from '@mui/icons-material/Event';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import RefreshIcon from '@mui/icons-material/Refresh';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { API_BASE_URL } from '../../config/api.config';
import * as XLSX from 'xlsx/xlsx.mjs';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ListIcon from '@mui/icons-material/List';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import WorkIcon from '@mui/icons-material/Work';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';

// Styled Components
const StyledCard = styled(Card)(({ theme }) => ({
  borderRadius: '12px',
  boxShadow: '0 4px 20px 0 rgba(0,0,0,0.05)',
  transition: 'transform 0.3s ease-in-out, box-shadow 0.3s ease-in-out',
  '&:hover': {
    transform: 'translateY(-4px)',
    boxShadow: '0 8px 30px 0 rgba(0,0,0,0.1)'
  }
}));

const StyledButton = styled(Button)(({ theme }) => ({
  textTransform: 'none',
  borderRadius: '8px',
  fontWeight: 600,
  padding: '8px 16px',
  boxShadow: 'none',
  '&:hover': {
    boxShadow: '0 4px 12px rgba(0,0,0,0.1)'
  }
}));

const SearchField = styled(TextField)(({ theme }) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '8px',
    backgroundColor: theme.palette.background.paper,
    '&:hover .MuiOutlinedInput-notchedOutline': {
      borderColor: theme.palette.primary.main,
    },
    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
      borderWidth: '1px',
    },
  },
}));

const StatusChip = styled(Chip)(({ theme, status }) => ({
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: status === 'Active'
    ? alpha(theme.palette.success.main, 0.1)
    : alpha(theme.palette.error.main, 0.1),
  color: status === 'Active'
    ? theme.palette.success.dark
    : theme.palette.error.dark,
}));

const HrReport = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [backoutDialogOpen, setBackoutDialogOpen] = useState(false);
  const [backoutCandidatesDialogOpen, setBackoutCandidatesDialogOpen] = useState(false);
  const [backoutReason, setBackoutReason] = useState('');
  const [backoutCandidates, setBackoutCandidates] = useState([]);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [selectedHRs, setSelectedHRs] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null,
  });

  const [editFormData, setEditFormData] = useState({
    candidateName: '',
    candidateEmail: '',
    candidatePhone: '',
    qualification: '',
    positionName: '',
    experience: '',
    currentLocation: '',
    currentPosition: '',
    currentCTC: '',
    expectedCTC: '',
    noticePeriod: '',
    reasonforLeaving: '',
    currentCompany: '',
    remark: '',
    interviewDate: '',
    originalInterviewDate: '',
    selectionStatus: '',
    selectionDate: '',
    salaryOffered: '',
    offerStatus: '',
    joiningDate: '',
    candidateRemarks: '',
    billingDate: '',
    billingAmount: '',
    paymentStatus: '',
    paymentDate: '',
    paymentMode: '',
    paymentRemark: '',
  });
  const [totalSalary, setTotalSalary] = useState(0);

  // ── Detail drawers ────────────────────────────────────────────────────────
  const [companyDrawer, setCompanyDrawer] = useState({ open: false, row: null });
  const [candidateDrawer, setCandidateDrawer] = useState({ open: false, row: null });
  const [jobDrawer, setJobDrawer] = useState({ open: false, row: null });
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchCandidates();
  }, [dateRange]);

  const handleToggleStatus = async (jobId) => {
    if (!jobId) {
      setSnackbar({
        open: true,
        message: 'No job ID provided',
        severity: 'error'
      });
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.put(
        `${API_BASE_URL}/allType/${jobId}/toggle-status`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      if (response.data) {
        setSnackbar({
          open: true,
          message: response.data.message || 'Status updated successfully',
          severity: 'success'
        });
        // Refresh candidates list
        fetchCandidates();
      }
    } catch (error) {
      console.error('Error toggling job status:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update job status',
        severity: 'error'
      });
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const fetchCandidates = async () => {
    try {
      const token = sessionStorage.getItem('token');

      // Build query params — send selectionDate range to backend
      const params = {};
      if (dateRange.startDate) {
        params.startDate = new Date(dateRange.startDate).toISOString().split('T')[0];
      }
      if (dateRange.endDate) {
        params.endDate = new Date(dateRange.endDate).toISOString().split('T')[0];
      }

      const response = await axios.get(`${API_BASE_URL}/fetch/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });
      setCandidates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setLoading(false);
    }
  };

  // Get unique HR names from candidates
  const hrOptions = React.useMemo(() => {
    const hrSet = new Set();
    candidates.forEach(candidate => {
      if (candidate.createdBy?.firstName || candidate.createdBy?.lastName) {
        const fullName = `${candidate.createdBy.firstName || ''} ${candidate.createdBy.lastName || ''}`.trim();
        if (fullName) {
          hrSet.add(fullName);
        }
      }
    });
    return Array.from(hrSet).sort();
  }, [candidates]);

  // Filter backout candidates
  useEffect(() => {
    const backoutCandidatesList = candidates.filter(candidate => candidate.isBackout);
    setBackoutCandidates(backoutCandidatesList);
  }, [candidates]);

  const filteredRows = React.useMemo(() => {
    return candidates.filter((row) => {
      const fullName = `${row.createdBy?.firstName || ''} ${row.createdBy?.lastName || ''}`.trim();
      
      // HR filter
      if (selectedHRs && selectedHRs.length > 0) {
        const hrMatch = selectedHRs.some(hr => fullName === hr);
        if (!hrMatch) return false;
      }

      // If no date range is set, return HR match result
      if (!dateRange.startDate && !dateRange.endDate) {
        return true;
      }

      // Filter by selectionDate
      const selectionDate = row.selectionDate ? new Date(row.selectionDate) : null;
      if (!selectionDate) return false;

      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      return (
        (!startDate || selectionDate >= startDate) &&
        (!endDate || selectionDate <= endDate)
      );
    });
  }, [candidates, selectedHRs, dateRange]);

  function parseSalary(salaryStr) {
    if (!salaryStr) return 0;

    let s = salaryStr.toString().toLowerCase().replace(/[₹,\s]/g, '');

    if (s.includes('k')) {
      return parseFloat(s.replace('k', '')) * 1000;
    }

    return parseFloat(s);
  }

  useEffect(() => {
    console.log('Filtered Rows:', filteredRows);

    let totalSalarySum = 0;

    filteredRows.forEach(row => {
      const salary = parseSalary(row.salaryOffered) || 0;
      totalSalarySum += salary;

      console.log('Processing row:', {
        name: row.candidateName,
        salary: salary,
        joiningDate: row.joiningDate
      });
    });

    console.log('Total Salary:', totalSalarySum);
    setTotalSalary(totalSalarySum);
  }, [filteredRows]);



  const handleDeleteClick = (candidate) => {
    setSelectedCandidate(candidate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/fetch/candidates/${selectedCandidate._id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Refresh the candidates list after deletion
      fetchCandidates();
      setDeleteDialogOpen(false);
      setSelectedCandidate(null);
    } catch (error) {
      console.error('Error deleting candidate:', error);
    }
  };

  const handleBackoutClick = (candidate) => {
    setSelectedCandidate(candidate);
    setBackoutReason('');
    setBackoutDialogOpen(true);
  };

  const handleBackoutConfirm = async () => {
    if (!backoutReason.trim()) {
      setSnackbar({
        open: true,
        message: 'Please provide a backout reason',
        severity: 'error'
      });
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/fetch/candidates/${selectedCandidate._id}/backout`,
        { backoutReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      fetchCandidates();
      setBackoutDialogOpen(false);
      setSelectedCandidate(null);
      
      setSnackbar({
        open: true,
        message: 'Candidate marked as backout successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error marking candidate as backout:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to mark candidate as backout',
        severity: 'error'
      });
    }
  };

  const handleBackoutCancel = () => {
    setBackoutDialogOpen(false);
    setSelectedCandidate(null);
    setBackoutReason('');
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCandidate(null);
  };

  const formatDateForInput = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return ''; // Return empty string for invalid dates
    return date.toISOString().split('T')[0];
  };

  const handleEditClick = (candidate) => {
    setSelectedCandidate(candidate);
    setEditFormData({
      candidateName: candidate.candidateName || '',
      candidateEmail: candidate.candidateEmail || '',
      candidatePhone: candidate.candidatePhone || '',
      qualification: candidate.qualification || '',
      positionName: candidate.positionName || '',
      experience: candidate.experience || '',
      currentLocation: candidate.currentLocation || '',
      currentPosition: candidate.currentPosition || '',
      currentCTC: candidate.currentCTC || '',
      expectedCTC: candidate.expectedCTC || '',
      noticePeriod: candidate.noticePeriod || '',
      reasonforLeaving: candidate.reasonforLeaving || '',
      currentCompany: candidate.currentCompany || '',
      remark: candidate.remark || '',
      interviewDate: formatDateForInput(candidate.interviewDate),
      originalInterviewDate: formatDateForInput(candidate.originalInterviewDate),
      selectionStatus: candidate.selectionStatus || '',
      selectionDate: formatDateForInput(candidate.selectionDate),
      salaryOffered: candidate.salaryOffered || '',
      offerStatus: candidate.offerStatus || '',
      joiningDate: formatDateForInput(candidate.joiningDate),
      candidateRemarks: candidate.candidateRemarks || '',
      // Preserve billing related fields
      billingDate: formatDateForInput(candidate.billingDate),
      billingAmount: candidate.billingAmount || '',
      paymentStatus: candidate.paymentStatus || '',
      paymentDate: formatDateForInput(candidate.paymentDate),
      paymentMode: candidate.paymentMode || '',
      paymentRemark: candidate.paymentRemark || '',
    });
    setEditDialogOpen(true);
  };

  const handleEditConfirm = async () => {
    if (!selectedCandidate) return;

    try {
      const token = sessionStorage.getItem('token');
      
      // Prepare candidate data for the first API call
      const candidatePayload = {
        candidateName: editFormData.candidateName,
        candidateEmail: editFormData.candidateEmail,
        candidatePhone: editFormData.candidatePhone,
        qualification: editFormData.qualification,
        positionName: editFormData.positionName,
        experience: editFormData.experience,
        currentLocation: editFormData.currentLocation,
        currentPosition: editFormData.currentPosition,
        currentCTC: editFormData.currentCTC,
        expectedCTC: editFormData.expectedCTC,
        noticePeriod: editFormData.noticePeriod,
        reasonforLeaving: editFormData.reasonforLeaving,
        currentCompany: editFormData.currentCompany,
        remark: editFormData.remark,
        interviewDate: editFormData.interviewDate,
        originalInterviewDate: editFormData.originalInterviewDate,
        selectionStatus: editFormData.selectionStatus,
        selectionDate: editFormData.selectionDate,
        salaryOffered: editFormData.salaryOffered,
        offerStatus: editFormData.offerStatus,
        joiningDate: editFormData.joiningDate,
        candidateRemarks: editFormData.candidateRemarks,
      };

      // First API call to update candidate details
      await axios.put(
        `${API_BASE_URL}/candidate/${selectedCandidate._id}`,
        candidatePayload,
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          }
        }
      );

      // Prepare billing data for the second API call
      const billingPayload = {
        billingDate: editFormData.billingDate,
        billingAmount: editFormData.billingAmount,
        paymentStatus: editFormData.paymentStatus,
        paymentDate: editFormData.paymentDate,
        paymentMode: editFormData.paymentMode,
        paymentRemark: editFormData.paymentRemark,
      };

      // Second API call to update billing information
      await axios.put(
        `${API_BASE_URL}/lineup/${selectedCandidate._id}`,
        billingPayload,
        {
          headers: { 
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}` 
          }
        }
      );
      
      // Refresh the candidates list
      await fetchCandidates();
      
      // Close dialog and reset state
      setEditDialogOpen(false);
      setSelectedCandidate(null);
      
      // Show success message
      setSnackbar({
        open: true,
        message: 'Candidate and billing information updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating candidate:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update candidate information',
        severity: 'error'
      });
    }
  };

  const handleEditCancel = () => {
    setEditDialogOpen(false);
    setSelectedCandidate(null);
    setEditFormData({
      billingDate: '',
      billingAmount: '',
      paymentStatus: '',
      paymentDate: '',
      paymentMode: '',
      paymentRemark: '',
    });
  };

  const handleInputChange = (field) => (event) => {
    setEditFormData({
      ...editFormData,
      [field]: event.target.value
    });
  };

  // Reset all filters
  const handleResetFilters = () => {
    setSelectedHRs([]);
    setDateRange({
      startDate: null,
      endDate: null
    });
  };

  // Check if any filter is active
  const isFilterActive = (selectedHRs && selectedHRs.length > 0) || dateRange.startDate || dateRange.endDate;

  // Export to Excel function
  const exportToExcel = () => {
    // Prepare data for export
    const exportData = filteredRows.map(row => ({
      'Created By': row.createdBy ?
        `${row.createdBy.firstName || ''} ${row.createdBy.lastName || ''}` : 'N/A',
      'Name': row.candidateName || '',
      'Email': row.candidateEmail || '',
      'Phone': row.candidatePhone || '',
      'Company Name': row.jobId?.companyName || '',
      'Company Address': row.jobId?.companyAddress || '',
      'Company Phone': row.jobId?.phoneNumber || '',
      'Job Title': row.jobId?.jobTitle || '',
      'Job Location': row.jobId?.jobLocation || '',
      'Job Timing': row.jobId?.jobTiming || '',
      'Qualification': row.qualification || '',
      'Position Name': row.positionName || '',
      'Experience': row.experience || '',
      'Current Location': row.currentLocation || '',
      'Current Position': row.currentPosition || '',
      'Current CTC': row.currentCTC || '',
      'Expected CTC': row.expectedCTC || '',
      'Notice Period': row.noticePeriod || '',
      'Reason for Leaving': row.reasonforLeaving || '',
      'Current Company': row.currentCompany || '',
      'Remark': row.remark || '',
      'Interview Date': row.interviewDate ? formatDate(row.interviewDate) : '',
      'Selection Status': row.selectionStatus || '',
      'Selection Date': row.selectionDate ? formatDate(row.selectionDate) : '',
      'Salary Offered': row.salaryOffered || '',

      'Offer Status': row.offerStatus || '',
      'Joining Date': row.joiningDate ? formatDate(row.joiningDate) : '',
      'Billing Date': row.billingDate ? formatDate(row.billingDate) : '',
      'Billing Amount': row.billingAmount ? `₹${row.billingAmount}` : '',
      'Payment Status': row.paymentStatus || '',
      'Payment Date': row.paymentDate ? formatDate(row.paymentDate) : '',
      'Payment Mode': row.paymentMode || '',
      'Payment Remark': row.paymentRemark || '',
    }));


    // Create worksheet and workbook
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Candidate Report');

    // Generate Excel file and trigger download
    XLSX.writeFile(workbook, `Candidate_Report_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const getStatusColor = (status, isBackout) => {
    if (isBackout) return 'error';
    
    switch (status?.toLowerCase()) {
      case 'selected':
        return 'success';
      case 'rejected':
        return 'error';
      case 'pending':
        return 'warning';
      default:
        return 'default';
    }
  };

  const columns = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 300,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleEditClick(params.row);
            }}
            startIcon={<EditIcon />}
            sx={{
              textTransform: 'none',
              color: '#1976d2',
              borderColor: '#1976d2',
              '&:hover': {
                backgroundColor: 'rgba(25, 118, 210, 0.04)',
                borderColor: '#1976d2',
              },
              fontSize: '0.8125rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            Edit
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              handleDeleteClick(params.row);
            }}
            startIcon={<DeleteIcon />}
            sx={{
              textTransform: 'none',
              color: '#d32f2f',
              borderColor: '#d32f2f',
              '&:hover': {
                backgroundColor: 'rgba(211, 47, 47, 0.04)',
                borderColor: '#d32f2f',
              },
              fontSize: '0.8125rem',
              py: 0.5,
              px: 1.5,
            }}
          >
            Delete
          </Button>
          {!params.row.isBackout && (
            <Button
              variant="outlined"
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                handleBackoutClick(params.row);
              }}
              startIcon={
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                  <line x1="12" y1="9" x2="12" y2="13"></line>
                  <line x1="12" y1="17" x2="12.01" y2="17"></line>
                </svg>
              }
              sx={{
                textTransform: 'none',
                color: '#ed6c02',
                borderColor: '#ed6c02',
                '&:hover': {
                  backgroundColor: 'rgba(237, 108, 2, 0.04)',
                  borderColor: '#ed6c02',
                },
                fontSize: '0.8125rem',
                py: 0.5,
                px: 1.5,
              }}
            >
              Backout
            </Button>
          )}
        </Box>
      ),
    },
  
    {
      field: 'createdBy',
      headerName: 'Created By',
      width: 200,
      renderCell: (params) => {
        const creator = params.row.createdBy;
        return creator ? (
          <Typography sx={{ fontSize: '0.875rem' }}>
            {`${creator.firstName || ''} ${creator.lastName || ''}`}
          </Typography>
        ) : (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>N/A</Typography>
        );
      },
    },
    {
      field: 'companyName',
      headerName: 'Company',
      width: 180,
      renderCell: (params) => {
        const company = params.row.jobId?.companyName;
        if (!company) return <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
        return (
          <Tooltip title="Click to view company details" arrow>
            <span
              onClick={(e) => { e.stopPropagation(); setCompanyDrawer({ open: true, row: params.row }); }}
              style={{
                color: '#3f51b5', fontWeight: 600, fontSize: '0.82rem',
                cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', display: 'block', maxWidth: '100%',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
              }}
            >
              {company}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: 'candidateName',
      headerName: 'Candidate',
      width: 160,
      renderCell: (params) => {
        const name = params.value;
        if (!name) return <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
        return (
          <Tooltip title="Click to view candidate details" arrow>
            <span
              onClick={(e) => { e.stopPropagation(); setCandidateDrawer({ open: true, row: params.row }); }}
              style={{
                color: '#0288d1', fontWeight: 600, fontSize: '0.82rem',
                cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', display: 'block', maxWidth: '100%',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
              }}
            >
              {name}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 180,
      renderCell: (params) => {
        const title = params.row.jobId?.jobTitle;
        if (!title) return <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
        return (
          <Tooltip title="Click to view job details" arrow>
            <span
              onClick={(e) => { e.stopPropagation(); setJobDrawer({ open: true, row: params.row }); }}
              style={{
                color: '#388e3c', fontWeight: 600, fontSize: '0.82rem',
                cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden',
                textOverflow: 'ellipsis', display: 'block', maxWidth: '100%',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
              }}
            >
              {title}
            </span>
          </Tooltip>
        );
      },
    },
   
     // ── CandidateApplication tracking fields ──────────────────────────────────
    {
      field: 'internalInterviewDate', headerName: 'Internal Interview Date', width: 170,
      renderCell: (p) => <Typography sx={{ fontSize: '0.875rem' }}>{p.value ? formatDate(p.value) : 'N/A'}</Typography>,
    },
    {
      field: 'interviewByWhom', headerName: 'Interview By', width: 150,
      renderCell: (p) => {
        const v = p.value;
        if (!v) return <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
        if (typeof v === 'object') return <Typography sx={{ fontSize: '0.875rem' }}>{`${v.firstName || ''} ${v.lastName || ''}`.trim() || 'N/A'}</Typography>;
        return <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
      },
    },
    {
      field: 'candidateReview', headerName: 'Candidate Review', width: 140,
      renderCell: (p) => {
        const colorMap = { Green: '#4caf50', Yellow: '#ff9800', Red: '#f44336' };
        const c = colorMap[p.value];
        return p.value
          ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40`, fontSize: '0.75rem' }} />
          : <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
      },
    },
    {
      field: 'candidateRemark', headerName: 'Candidate Remark', width: 180,
      renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap sx={{ fontSize: '0.875rem' }}>{p.value || 'N/A'}</Typography></Tooltip>,
    },
    {
      field: 'resumeSubmitDate', headerName: 'Resume Submit Date', width: 160,
      renderCell: (p) => <Typography sx={{ fontSize: '0.875rem' }}>{p.value ? formatDate(p.value) : 'N/A'}</Typography>,
    },
    {
      field: 'lineupStatus', headerName: 'Lineup Status', width: 130,
      renderCell: (p) => {
        const colorMap = { Shortlisted: '#3f51b5', Scheduled: '#0288d1', Completed: '#4caf50', Cancelled: '#f44336', Pending: '#ff9800' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value
          ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40`, fontSize: '0.75rem' }} />
          : <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
      },
    },
    {
      field: 'remarks1', headerName: 'Remarks 1', width: 150,
      renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap sx={{ fontSize: '0.875rem' }}>{p.value || 'N/A'}</Typography></Tooltip>,
    },
    {
      field: 'interviewRounds', headerName: 'Interview Rounds', width: 150,
      renderCell: (p) => {
        const rounds = p.value;
        if (!rounds || rounds.length === 0) return <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
        return (
          <Tooltip title={rounds.map(r => `${r.roundName}: ${r.roundDate ? formatDate(r.roundDate) : 'TBD'} (${r.interviewMode})`).join('\n')} arrow>
            <Chip label={`${rounds.length} Round${rounds.length > 1 ? 's' : ''}`} size="small"
              sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700, fontSize: '0.75rem' }} />
          </Tooltip>
        );
      },
    },
    {
      field: 'interviewStatus', headerName: 'Interview Status', width: 150,
      renderCell: (p) => {
        const colorMap = { Selected: '#4caf50', Rejected: '#f44336', 'On Hold': '#ff9800', 'On Discussion': '#0288d1', Trail: '#9c27b0' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value
          ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40`, fontSize: '0.75rem' }} />
          : <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
      },
    },
    {
      field: 'trailDays', headerName: 'Trail Days', width: 100,
      renderCell: (p) => <Typography sx={{ fontSize: '0.875rem' }}>{p.value != null ? p.value : 'N/A'}</Typography>,
    },
    {
      field: 'remarks2', headerName: 'Remarks 2', width: 150,
      renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap sx={{ fontSize: '0.875rem' }}>{p.value || 'N/A'}</Typography></Tooltip>,
    },
    {
      field: 'offeredSalary', headerName: 'Offered Salary', width: 130,
      renderCell: (p) => <Typography sx={{ fontSize: '0.875rem' }}>{p.value || 'N/A'}</Typography>,
    },
    {
      field: 'offeredStatus', headerName: 'Offered Status', width: 130,
      renderCell: (p) => {
        const colorMap = { Accepted: '#4caf50', Rejected: '#f44336' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value
          ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40`, fontSize: '0.75rem' }} />
          : <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
      },
    },
    {
      field: 'remarks3', headerName: 'Remarks 3', width: 150,
      renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap sx={{ fontSize: '0.875rem' }}>{p.value || 'N/A'}</Typography></Tooltip>,
    },
      {
      field: 'selectionStatus',
      headerName: 'Selection Status',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
     {
      field: 'selectionDate',
      headerName: 'Selection Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value ? formatDate(params.value) : 'N/A'}</Typography>
      ),
    },
  
    {
      field: 'joiningDateStatus', headerName: 'Joining Status', width: 160,
      renderCell: (p) => <Typography noWrap sx={{ fontSize: '0.875rem' }}>{p.value || 'N/A'}</Typography>,
    },
        {
      field: 'joiningDate',
      headerName: 'Joining Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value ? formatDate(params.value) : 'N/A'}</Typography>
      ),
    },
    {
      field: 'hasJoined', headerName: 'Has Joined', width: 150,
      renderCell: (p) => {
        const colorMap = { Yes: '#4caf50', No: '#f44336', Backout: '#ff5722', 'Confirmation Awaited': '#ff9800' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value
          ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40`, fontSize: '0.75rem' }} />
          : <Typography sx={{ fontSize: '0.875rem', color: '#9e9e9e' }}>N/A</Typography>;
      },
    },
   

    {
      field: "jobStatus",
      headerName: "Status",
      width: 150,
      renderCell: (params) => {
        // Check if jobId exists and has an _id property
        const jobId = params.row.jobId?._id;
        const isOpen = params.value === 'Open';
        const isBackout = params.row.isBackout;
        
        if (isBackout) {
          return (
            <Chip
              label="Backed Out"
              color="error"
              sx={{ 
                backgroundColor: 'rgba(244, 67, 54, 0.1)',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.2)',
                }
              }}
            />
          );
        }
        
        return (
          <Chip
            label={params.value}
            color={isOpen ? 'success' : 'error'}
            onClick={() => jobId ? handleToggleStatus(jobId) : null}
            icon={isOpen ? <ToggleOnIcon sx={{ color: 'green' }} /> : <ToggleOffIcon sx={{ color: 'red' }} />}
            sx={{ 
              cursor: jobId ? 'pointer' : 'not-allowed',
              backgroundColor: isOpen ? 'rgba(76, 175, 80, 0.1)' : 'rgba(244, 67, 54, 0.1)',
              '&:hover': {
                backgroundColor: isOpen ? 'rgba(76, 175, 80, 0.2)' : 'rgba(244, 67, 54, 0.2)',
              }
            }}
          />
        );
      },
    },
    {
      field: "backoutReason",
      headerName: "Backout Reason",
      width: 250,
      renderCell: (params) => (
        <Typography 
          variant="body2" 
          sx={{ 
            fontSize: '0.875rem',
            color: params.row.isBackout ? 'error.main' : 'text.secondary',
            fontStyle: params.row.isBackout ? 'normal' : 'italic'
          }}
        >
          {params.row.isBackout ? (params.row.backoutReason || 'No reason provided') : 'N/A'}
        </Typography>
      ),
    },

   

  ];

  // Row style for backout candidates
  const getRowClassName = (params) => {
    return params.row.isBackout ? 'backout-row' : '';
  };

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5' }}>
        <Sidebar />
      </div>
      
      <style>
        {`
          .backout-row {
            background-color: #fff8e1 !important; /* Light orange background for backout rows */
          }
          .backout-row:hover {
            background-color: #ffecb3 !important; /* Slightly darker orange on hover */
          }
        `}
      </style>

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
        <Paper
          elevation={4}
          sx={{
            p: 2,
            m: 2,
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            borderRadius: 4,
            boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
            overflow: 'hidden',
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            mb: 3,
            p: 3,
            bgcolor: 'background.paper',
            borderRadius: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.04)'
          }}>
            {/* Header with Title and Export Button */}
            <Box sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              mb: 3
            }}>
              <Typography variant="h5" sx={{
                fontWeight: 600,
                color: 'text.primary',
                fontSize: '1.5rem',
                letterSpacing: '0.5px',
                display: 'flex',
                alignItems: 'center',
                gap: 1
              }}>
                Candidates List
              </Typography>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setBackoutCandidatesDialogOpen(true)}
                  startIcon={<ListIcon />}
                  sx={{ ml: 2 }}
                >
                  View Backout Candidates
                </Button>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={exportToExcel}
                  startIcon={<FileDownloadIcon />}
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    fontWeight: 500,
                    px: 3,
                    py: 1,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    '&:hover': {
                      boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                      transform: 'translateY(-1px)'
                    },
                    transition: 'all 0.2s ease-in-out',
                    height: '40px',
                    ml: 2
                  }}
                >
                  Export to Excel
                </Button>
              </Box>
            </Box>

            {/* Filters Section */}
            <Box
  sx={{
    display: "flex",
    alignItems: "center",
    flexWrap: "wrap",
    gap: 2,
    background: "linear-gradient(135deg, #fafafa 0%, #f5f5f5 100%)",
    borderRadius: 3,
    p: 2,
    boxShadow: "0 4px 15px rgba(0,0,0,0.05)",
    "& > *": { flex: "1 1 200px", maxWidth: 240 } // 👈 kam width
  }}
>


 {/* HR Filter */}
<FormControl size="small" sx={{ minWidth: 220, maxWidth: 280 }}>
  <Autocomplete
    multiple
    id="hr-filter"
    options={hrOptions}
    value={selectedHRs}
    onChange={(event, newValue) => setSelectedHRs(newValue)}
    freeSolo
    renderTags={(value, getTagProps) =>
      value.map((option, index) => (
        <Chip
          variant="outlined"
          label={option}
          size="small"
          sx={{
            background: "linear-gradient(135deg, #e3f2fd, #bbdefb)",
            fontWeight: 500,
            "& .MuiChip-deleteIcon": { color: "#1976d2" }
          }}
          {...getTagProps({ index })}
        />
      ))
    }
    renderInput={(params) => (
      <TextField
        {...params}
        variant="outlined"
        label="HR Name"
        placeholder="Type or select HR names"
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <>
              <InputAdornment position="start">
                <PersonSearchIcon fontSize="small" sx={{ color: "primary.main" }} />
              </InputAdornment>
              {params.InputProps.startAdornment}
            </>
          )
        }}
        sx={{
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            "&:hover fieldset": { borderColor: "primary.main" }
          }
        }}
      />
    )}
    renderOption={(props, option, { selected }) => (
      <li {...props}>
        <Checkbox sx={{ mr: 1 }} checked={selected} />
        {option}
      </li>
    )}
  />
</FormControl>


 {/* Date Filters */}
<LocalizationProvider dateAdapter={AdapterDateFns}>
  <DatePicker
    label="Selection From"
    value={dateRange.startDate}
    onChange={(date) => setDateRange({ ...dateRange, startDate: date })}
    renderInput={(params) => (
      <TextField
        {...params}
        size="small"
        sx={{
          minWidth: 220,
          maxWidth: 280,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            background: "#fff",
            "&:hover fieldset": { borderColor: "primary.main" }
          }
        }}
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <InputAdornment position="start">
              <EventIcon fontSize="small" sx={{ color: "primary.main" }} />
            </InputAdornment>
          )
        }}
      />
    )}
  />

  <DatePicker
    label="Selection To"
    value={dateRange.endDate}
    onChange={(date) => setDateRange({ ...dateRange, endDate: date })}
    minDate={dateRange.startDate}
    renderInput={(params) => (
      <TextField
        {...params}
        size="small"
        sx={{
          minWidth: 220,
          maxWidth: 280,
          "& .MuiOutlinedInput-root": {
            borderRadius: 2,
            background: "#fff",
            "&:hover fieldset": { borderColor: "primary.main" }
          }
        }}
        InputProps={{
          ...params.InputProps,
          startAdornment: (
            <InputAdornment position="start">
              <EventIcon fontSize="small" sx={{ color: "primary.main" }} />
            </InputAdornment>
          )
        }}
      />
    )}
  />

  {/* Reset Button */}
  <Tooltip title="Reset all filters">
    <IconButton
      onClick={handleResetFilters}
      disabled={!isFilterActive}
      sx={{
        width: 40,
        height: 40,
        borderRadius: "12px",
        background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
        color: "#fff",
        boxShadow: "0 3px 10px rgba(25, 118, 210, 0.3)",
        transition: "all 0.3s ease",
        "&:hover": {
          transform: "translateY(-2px)",
          background: "linear-gradient(135deg, #0d47a1 0%, #1976d2 100%)",
          boxShadow: "0 5px 15px rgba(25, 118, 210, 0.4)"
        },
        "&.Mui-disabled": {
          background: "#e0e0e0",
          color: "#9e9e9e",
          boxShadow: "none"
        }
      }}
    >
      <RefreshIcon fontSize="small" />
    </IconButton>
  </Tooltip>
</LocalizationProvider>

</Box>

          </Box>
          <Box sx={{
            flex: 1,
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            minHeight: 0, // Important for proper flexbox scrolling
            '& .MuiDataGrid-root': {
              border: 'none',
              fontSize: '0.875rem',
              flex: 1,
              minHeight: 0, // Important for proper flexbox scrolling
            },
            '& .MuiDataGrid-columnHeaders': {
              backgroundColor: '#f5f7fa',
              fontWeight: 600,
              fontSize: '0.9rem',
            },
            '& .MuiDataGrid-row': {
              '&:nth-of-type(odd)': {
                backgroundColor: '#fafbfe',
              },
              '&:hover': {
                backgroundColor: '#f0f4ff !important',
              },
            },
            '& .MuiDataGrid-cell': {
              borderBottom: '1px solid #f0f0f0',
            },
            '& .MuiDataGrid-columnHeader': {
              '&:focus, &:focus-within': {
                outline: 'none !important',
              },
            },
          }}>
            <Box sx={{
              display: 'flex',
              flexDirection: 'column',
              height: '100%',
              width: '100%',
              mt: 1,
              minHeight: 0, // Important for proper flexbox scrolling
            }}>
              <Box sx={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                mb: 2,
                p: 1,
                backgroundColor: '#f5f5f5',
                borderRadius: 1
              }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                  Total Salary: <span style={{ color: '#1976d2' }}>₹{totalSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {filteredRows.length} records found
                </Typography>
              </Box>
              <DataGrid
                rows={filteredRows}
                columns={columns}
                getRowClassName={getRowClassName}
                components={{
                  Toolbar: GridToolbar,
                  Footer: () => (
                    <Box sx={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      p: 1,
                      borderTop: '1px solid rgba(224, 224, 224, 1)'
                    }}>
                      <Typography variant="body2">
                        Total Salary: <span style={{ fontWeight: 'bold', color: '#1976d2' }}>₹{totalSalary.toLocaleString('en-IN', { maximumFractionDigits: 2 })}</span>
                      </Typography>
                      <div></div> {/* This empty div pushes the pagination to the right */}
                    </Box>
                  )
                }}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                checkboxSelection
                disableColumnReorder={false}
                disableSelectionOnClick
                loading={loading}
                getRowId={(row) => row._id}
                sx={{
                  borderRadius: 2,
                  flex: 1,
                  minHeight: 0, // Important for proper flexbox scrolling
                  '& .MuiDataGrid-virtualScroller': {
                    overflow: 'auto',
                  },
                  '& .MuiDataGrid-cell': {
                    fontSize: '14px',
                    transition: 'all 0.3s ease',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#e3e3e3',
                    fontWeight: 'bold',
                    fontSize: '15px',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                    background: '#e3e3e3',
                  },
                  '& .MuiDataGrid-row:hover': {
                    backgroundColor: '#e0f7fa',
                  },
                  '& .backout-row:hover': {
                    backgroundColor: '#ffecb3 !important',
                  },
                  '& .backout-row .MuiDataGrid-cell': {
                    borderBottom: '1px solid #ffcc80',
                  },
                  '& .backout-row .MuiDataGrid-cell:first-of-type': {
                    borderLeft: '3px solid #ff9800',
                  },
                }}
              />
            </Box>
          </Box>
        </Paper>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={handleDeleteCancel}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title" sx={{ color: '#f44336' }}>
          Confirm Delete
        </DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedCandidate?.candidateName}?
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDeleteConfirm} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={handleEditCancel}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ color: '#2196f3', borderBottom: '1px solid #e0e0e0', pb: 1 }}>
          Edit Candidate Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            {/* Candidate Details Section */}
            <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 'bold', color: '#424242' }}>
              Candidate Information
            </Typography>
            <Grid container spacing={2}>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Candidate Name"
      value={editFormData.candidateName}
      onChange={handleInputChange('candidateName')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Candidate Email"
      type="email"
      value={editFormData.candidateEmail}
      onChange={handleInputChange('candidateEmail')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Candidate Phone"
      value={editFormData.candidatePhone}
      onChange={handleInputChange('candidatePhone')}
      fullWidth
      margin="normal"
    />
  </Grid>

  <Grid item xs={12} sm={4}>
    <TextField
      label="Qualification"
      value={editFormData.qualification}
      onChange={handleInputChange('qualification')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Position Name"
      value={editFormData.positionName}
      onChange={handleInputChange('positionName')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Experience"
      value={editFormData.experience}
      onChange={handleInputChange('experience')}
      fullWidth
      margin="normal"
    />
  </Grid>

  <Grid item xs={12} sm={4}>
    <TextField
      label="Current Location"
      value={editFormData.currentLocation}
      onChange={handleInputChange('currentLocation')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Current Position"
      value={editFormData.currentPosition}
      onChange={handleInputChange('currentPosition')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Current CTC"
      value={editFormData.currentCTC}
      onChange={handleInputChange('currentCTC')}
      fullWidth
      margin="normal"
    />
  </Grid>

  <Grid item xs={12} sm={4}>
    <TextField
      label="Expected CTC"
      value={editFormData.expectedCTC}
      onChange={handleInputChange('expectedCTC')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Notice Period"
      value={editFormData.noticePeriod}
      onChange={handleInputChange('noticePeriod')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Reason for Leaving"
      value={editFormData.reasonforLeaving}
      onChange={handleInputChange('reasonforLeaving')}
      fullWidth
      margin="normal"
    />
  </Grid>

  <Grid item xs={12} sm={4}>
    <TextField
      label="Current Company"
      value={editFormData.currentCompany}
      onChange={handleInputChange('currentCompany')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Remarks"
      value={editFormData.remark}
      onChange={handleInputChange('remark')}
      fullWidth
      margin="normal"
    />
  </Grid>


  <Grid item xs={12} sm={4}>
    <TextField
      label="Interview Date"
      type="date"
      InputLabelProps={{ shrink: true }}
      value={editFormData.interviewDate}
      onChange={handleInputChange('interviewDate')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Original Interview Date"
      type="date"
      InputLabelProps={{ shrink: true }}
      value={editFormData.originalInterviewDate}
      onChange={handleInputChange('originalInterviewDate')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Selection Status"
      value={editFormData.selectionStatus}
      onChange={handleInputChange('selectionStatus')}
      fullWidth
      margin="normal"
    />
  </Grid>

  <Grid item xs={12} sm={4}>
    <TextField
      label="Selection Date"
      type="date"
      InputLabelProps={{ shrink: true }}
      value={editFormData.selectionDate}
      onChange={handleInputChange('selectionDate')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Salary Offered"
      value={editFormData.salaryOffered}
      onChange={handleInputChange('salaryOffered')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Offer Status"
      value={editFormData.offerStatus}
      onChange={handleInputChange('offerStatus')}
      fullWidth
      margin="normal"
    />
  </Grid>

  <Grid item xs={12} sm={4}>
    <TextField
      label="Joining Date"
      type="date"
      InputLabelProps={{ shrink: true }}
      value={editFormData.joiningDate}
      onChange={handleInputChange('joiningDate')}
      fullWidth
      margin="normal"
    />
  </Grid>
  <Grid item xs={12} sm={4}>
    <TextField
      label="Candidate Remarks"
      value={editFormData.candidateRemarks}
      onChange={handleInputChange('candidateRemarks')}
      fullWidth
      margin="normal"
    />
  </Grid>

</Grid>


          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
          <Button 
            onClick={handleEditCancel} 
            color="inherit"
            sx={{ textTransform: 'none' }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleEditConfirm} 
            color="primary" 
            variant="contained"
            sx={{ textTransform: 'none', px: 3 }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backout Confirmation Dialog */}
      <Dialog
        open={backoutDialogOpen}
        onClose={handleBackoutCancel}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#ff9800', display: 'flex', alignItems: 'center', gap: 1 }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
            <line x1="12" y1="9" x2="12" y2="13"></line>
            <line x1="12" y1="17" x2="12.01" y2="17"></line>
          </svg>
          Mark as Backout
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to mark <strong>{selectedCandidate?.candidateName}</strong> as backout?
          </Typography>
          <TextField
            label="Backout Reason"
            fullWidth
            multiline
            rows={4}
            variant="outlined"
            value={backoutReason}
            onChange={(e) => setBackoutReason(e.target.value)}
            placeholder="Please provide the reason for backout..."
            sx={{ mt: 2 }}
          />
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1, fontSize: '0.75rem' }}>
            This action will move the candidate to the backout list.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleBackoutCancel} color="primary">
            Cancel
          </Button>
          <Button 
            onClick={handleBackoutConfirm} 
            color="warning" 
            variant="contained"
            disabled={!backoutReason.trim()}
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path>
                <line x1="12" y1="9" x2="12" y2="13"></line>
                <line x1="12" y1="17" x2="12.01" y2="17"></line>
              </svg>
            }
          >
            Mark as Backout
          </Button>
        </DialogActions>
      </Dialog>

      {/* Backout Candidates Dialog */}
      <Dialog
        open={backoutCandidatesDialogOpen}
        onClose={() => setBackoutCandidatesDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            height: '90vh',
            maxHeight: '1200px',
            width: '95%',
            maxWidth: '1800px',
            margin: '16px',
            borderRadius: '12px',
            '& .MuiDialogContent-root': {
              padding: '16px 24px',
            },
            '& .MuiDialogTitle-root': {
              padding: '20px 24px',
              borderBottom: '1px solid rgba(0, 0, 0, 0.12)',
              backgroundColor: '#f5f5f5',
              fontSize: '1.25rem',
              fontWeight: 600,
            },
          },
        }}
      >
        <DialogTitle>Backout Candidates</DialogTitle>
        <DialogContent>
          <Box sx={{ 
            height: 'calc(90vh - 150px)',
            minHeight: '500px',
            width: '100%',
            '& .MuiDataGrid-root': {
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderBottom: '2px solid #e0e0e0',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid rgba(224, 224, 224, 0.5)',
              },
            },
          }}>
            <DataGrid
              getRowId={(row) => row._id}
              rows={backoutCandidates}
              columns={[
                {
                  field: 'backoutReason',
                  headerName: 'Backout Reason',
                  width: 150,
                  renderCell: (params) => params.row?.backoutReason || 'No reason provided'
                },
                {
                  field: 'backoutAt',
                  headerName: 'Backout Date',
                  width: 200,
                  renderCell: (params) => 
                    params.row?.backoutAt ? new Date(params.row.backoutAt).toLocaleString() : 'N/A'
                },
                { field: 'candidateName', headerName: 'Name', width: 150, renderCell: (params) => params.row?.candidateName || 'N/A' },
                { field: 'candidateEmail', headerName: 'Email', width: 200, renderCell: (params) => params.row?.candidateEmail || 'N/A' },
                { field: 'candidatePhone', headerName: 'Phone', width: 150, renderCell: (params) => params.row?.candidatePhone || 'N/A' },
                { field: 'positionName', headerName: 'Position', width: 150, renderCell: (params) => params.row?.positionName || 'N/A' },
                { field : 'qualification', headerName: 'Qualification', width: 150, renderCell: (params) => params.row?.qualification || 'N/A' },
                { field : 'experience', headerName: 'Experience', width: 150, renderCell: (params) => params.row?.experience || 'N/A' },
                { field : 'currentLocation', headerName: 'Current Location', width: 150, renderCell: (params) => params.row?.currentLocation || 'N/A' },
                { field : 'currentPosition', headerName: 'Current Position', width: 150, renderCell: (params) => params.row?.currentPosition || 'N/A' },
                { field : 'currentCTC', headerName: 'Current CTC', width: 150, renderCell: (params) => params.row?.currentCTC || 'N/A' },
                { field : 'expectedCTC', headerName: 'Expected CTC', width: 150, renderCell: (params) => params.row?.expectedCTC || 'N/A' },
                { field : 'noticePeriod', headerName: 'Notice Period', width: 150, renderCell: (params) => params.row?.noticePeriod || 'N/A' },
                { field : 'reasonforLeaving', headerName: 'Reason for Leaving', width: 150, renderCell: (params) => params.row?.reasonforLeaving || 'N/A' },
                { field : 'currentCompany', headerName: 'Current Company', width: 150, renderCell: (params) => params.row?.currentCompany || 'N/A' },
                { field : 'remark', headerName: 'Remark', width: 150, renderCell: (params) => params.row?.remark || 'N/A' },
                { field : 'resumeLink', headerName: 'Resume Link', width: 150, renderCell: (params) => params.row?.resumeLink || 'N/A' },
                { 
                  field: 'createdBy', 
                  headerName: 'Created By', 
                  width: 150, 
                  renderCell: (params) => {
                    const createdBy = params.row?.createdBy;
                    if (!createdBy) return 'N/A';
                    if (typeof createdBy === 'string') return createdBy;
                    return `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim() || 'N/A';
                  }
                },
                {
                  field : 'interviewDate',
                  headerName: 'Interview Date',
                  width: 200,
                  renderCell: (params) =>
                    params.row?.interviewDate ? new Date(params.row.interviewDate).toLocaleDateString() : 'N/A'
                },
                { field : 'originalInterviewDate', 
                  headerName: 'Original Interview Date', 
                  width: 200,
                  renderCell: (params) =>
                    params.row?.originalInterviewDate ? new Date(params.row.originalInterviewDate).toLocaleDateString() : 'N/A'
                },
                { field : 'lineupStatus', headerName: 'Lineup Status', width: 150, renderCell: (params) => params.row?.lineupStatus || 'N/A' },
                { field : 'selectionStatus', headerName: 'Selection Status', width: 150, renderCell: (params) => params.row?.selectionStatus || 'N/A' },
                {
                  field : 'selectionDate',
                  headerName: 'Selection Date',
                  width: 200,
                  renderCell: (params) =>
                    params.row?.selectionDate ? new Date(params.row.selectionDate).toLocaleDateString() : 'N/A'
                },
                { field : 'salaryOffered', headerName: 'Salary Offered', width: 150, renderCell: (params) => params.row?.salaryOffered || 'N/A' },
                { field : 'offerLetter', 
                  headerName: 'Offer Letter',
                  width: 150, 
                  renderCell: (params) => 
                    params.row?.offerLetter ? (
                      <Button 
                        component="a" 
                        href={params.row.offerLetter} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        size="small"
                        variant="outlined"
                        color="primary"
                      >
                        View
                      </Button>
                    ) : 'N/A' 
                },
                { field : 'offerStatus', headerName: 'Offer Status', width: 150, renderCell: (params) => params.row?.offerStatus || 'N/A' },
                {
                  field : 'joiningDate',
                  headerName: 'Joining Date',
                  width: 200,
                  renderCell: (params) =>
                    params.row?.joiningDate ? new Date(params.row.joiningDate).toLocaleDateString() : 'N/A'
                },
                { field : 'candidateRemarks', headerName: 'Candidate Remarks', width: 150, renderCell: (params) => params.row?.candidateRemarks || 'N/A' },
                { field : 'rescheduledDates', headerName: 'Rescheduled Dates', width: 150, renderCell: (params) => params.row?.rescheduledDates || 'N/A' },
             
              ]}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              components={{
                Toolbar: GridToolbar,
              }}
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-row.backout-row': {
                  backgroundColor: '#fff8e1',
                  '&:hover': {
                    backgroundColor: '#ffecb3 !important',
                  }
                }
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBackoutCandidatesDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar for notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>

      {/* ── Job Detail Drawer ── */}
      <Drawer
        anchor="right"
        open={jobDrawer.open}
        onClose={() => setJobDrawer({ open: false, row: null })}
        PaperProps={{ sx: { width: 380, borderRadius: '16px 0 0 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        {jobDrawer.row && (() => {
          const job = jobDrawer.row.jobId || {};
          const DetailRow = ({ icon, label, value }) => {
            if (!value) return null;
            return (
              <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                <Box sx={{ color: '#9fa8da', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>{value}</Typography>
                </Box>
              </Box>
            );
          };
          return (
            <>
              {/* Header */}
              <Box sx={{ background: 'linear-gradient(135deg, #2e7d32, #388e3c)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <WorkIcon sx={{ color: '#fff', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2}>{job.jobTitle || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>{job.companyName || 'Job Details'}</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => setJobDrawer({ open: false, row: null })}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Body */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Job Title"    value={job.jobTitle} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="Job Location" value={job.jobLocation} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Job Timing"   value={job.jobTiming} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Education"    value={job.education} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Experience"   value={job.experience} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Salary"       value={job.salary} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Gender"       value={job.gender} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Week Off"     value={job.weekOff} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="No. of Requirements" value={job.numberOfRequirements != null ? String(job.numberOfRequirements) : ''} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Required Skills"     value={job.requiredSkills} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Key Responsibility"  value={job.keyResponsibility} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Benefits"     value={job.benefits} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Remarks"      value={job.remarks} />
              </Box>

              {/* Footer */}
              <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
                <Button fullWidth variant="outlined" onClick={() => setJobDrawer({ open: false, row: null })}
                  sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#388e3c', fontWeight: 600, textTransform: 'none' }}>
                  Close
                </Button>
              </Box>
            </>
          );
        })()}
      </Drawer>

      {/* ── Company Detail Drawer ── */}
      <Drawer
        anchor="right"
        open={companyDrawer.open}
        onClose={() => setCompanyDrawer({ open: false, row: null })}
        PaperProps={{ sx: { width: 420, borderRadius: '16px 0 0 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        {companyDrawer.row && (() => {
          const job = companyDrawer.row.jobId || {};
          // Prefer full company details from CompanyCreate, fall back to jobId fields
          const co = companyDrawer.row.companyDetails || {};
          const companyName = co.companyName || job.companyName || '—';

          const DetailRow = ({ icon, label, value }) => {
            if (!value) return null;
            return (
              <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                <Box sx={{ color: '#9fa8da', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>{value}</Typography>
                </Box>
              </Box>
            );
          };

          const SectionHeader = ({ label }) => (
            <Box sx={{ mt: 2, mb: 0.5 }}>
              <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                {label}
              </Typography>
              <Divider sx={{ mt: 0.5, borderColor: '#e8eaf6' }} />
            </Box>
          );

          const DocLink = ({ label, url }) => {
            if (!url) return null;
            return (
              <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                <Box sx={{ color: '#9fa8da', mt: 0.2, flexShrink: 0 }}><WorkIcon sx={{ fontSize: 18 }} /></Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{label}</Typography>
                  <a href={url} target="_blank" rel="noreferrer"
                    style={{ color: '#3f51b5', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                    View Document <OpenInNewIcon sx={{ fontSize: 14 }} />
                  </a>
                </Box>
              </Box>
            );
          };

          return (
            <>
              {/* Header */}
              <Box sx={{ background: 'linear-gradient(135deg, #1e1e2f, #2d2d44)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <BusinessIcon sx={{ color: '#FFD700', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2}>{companyName}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {co.companyId ? `Company ID: ${co.companyId}` : 'Company Details'}
                    </Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => setCompanyDrawer({ open: false, row: null })}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Body */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>

                {/* Basic Info */}
                <SectionHeader label="Basic Info" />
                <DetailRow icon={<BusinessIcon sx={{ fontSize: 18 }} />}    label="Company Name"  value={companyName} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Industries"    value={co.industries || job.industries} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="Address"       value={co.companyAddress || job.companyAddress} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="Area"          value={co.area || job.Area} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="City"          value={co.city} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="State"         value={co.state} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="Country"       value={co.country} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="Pincode"       value={co.pincode} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}  label="GPS Location"  value={co.gpsLocation} />

                {/* Contact Person 1 */}
                {(co.contactPerson || co.contactNumber || co.email) && (
                  <SectionHeader label="Contact Person 1" />
                )}
                <DetailRow icon={<PersonIcon sx={{ fontSize: 18 }} />}      label="Contact Person"        value={co.contactPerson || job.contactName} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Designation"           value={co.contactPersonDesignation} />
                <DetailRow icon={<PhoneIcon sx={{ fontSize: 18 }} />}       label="Phone"                 value={co.contactNumber || job.phoneNumber} />
                <DetailRow icon={<EmailIcon sx={{ fontSize: 18 }} />}       label="Email"                 value={co.email || job.email} />

                {/* Contact Person 2 */}
                {(co.contactPerson2 || co.contactNumber2 || co.email2) && (
                  <SectionHeader label="Contact Person 2" />
                )}
                <DetailRow icon={<PersonIcon sx={{ fontSize: 18 }} />}      label="Contact Person 2"      value={co.contactPerson2} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}        label="Designation"           value={co.contactPerson2Designation} />
                <DetailRow icon={<PhoneIcon sx={{ fontSize: 18 }} />}       label="Phone 2"               value={co.contactNumber2} />
                <DetailRow icon={<EmailIcon sx={{ fontSize: 18 }} />}       label="Email 2"               value={co.email2} />

                {/* Web */}
                {(co.websiteUrl || job.websiteURL) && (
                  <SectionHeader label="Web" />
                )}
                {(co.websiteUrl || job.websiteURL) && (
                  <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Box sx={{ color: '#9fa8da', mt: 0.2 }}><OpenInNewIcon sx={{ fontSize: 18 }} /></Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Website</Typography>
                      <a href={co.websiteUrl || job.websiteURL} target="_blank" rel="noreferrer"
                        style={{ color: '#3f51b5', fontSize: '0.85rem', fontWeight: 500 }}>
                        {co.websiteUrl || job.websiteURL}
                      </a>
                    </Box>
                  </Box>
                )}

                {/* Agreement & GST */}
                <SectionHeader label="Agreement & Documents" />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}  label="Agreement Start Date"
                  value={co.agreementStartDate ? formatDate(co.agreementStartDate) : ''} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}  label="Agreement End Date"
                  value={co.agreementEndDate ? formatDate(co.agreementEndDate) : ''} />
                <DocLink label="Agreement Document" url={co.agreementUpload || job.agreementSigned} />
                <DocLink label="GST Document"       url={co.gstUpload || job.gstUpload} />
                <DocLink label="Other Document"     url={co.otherDocumentUpload} />

                {/* Payment */}
                {(co.invoiceNumber || co.paymentMode || co.tokenAmount) && (
                  <SectionHeader label="Payment Info" />
                )}
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}  label="Invoice Number"  value={co.invoiceNumber} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}  label="Payment Mode"    value={co.paymentMode} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}  label="Payment Remark"  value={co.paymentRemark} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}  label="Token Amount"
                  value={co.tokenAmount != null ? `₹${co.tokenAmount.toLocaleString('en-IN')}` : ''} />
                <DocLink label="Token Upload" url={co.tokenUpload} />

              </Box>

              {/* Footer */}
              <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
                <Button fullWidth variant="outlined" onClick={() => setCompanyDrawer({ open: false, row: null })}
                  sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600, textTransform: 'none' }}>
                  Close
                </Button>
              </Box>
            </>
          );
        })()}
      </Drawer>

      {/* ── Candidate Detail Drawer ── */}
      <Drawer
        anchor="right"
        open={candidateDrawer.open}
        onClose={() => setCandidateDrawer({ open: false, row: null })}
        PaperProps={{ sx: { width: 380, borderRadius: '16px 0 0 16px', display: 'flex', flexDirection: 'column', overflow: 'hidden' } }}
      >
        {candidateDrawer.row && (() => {
          const c = candidateDrawer.row;
          const DetailRow = ({ icon, label, value }) => {
            if (!value) return null;
            return (
              <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                <Box sx={{ color: '#9fa8da', mt: 0.2, flexShrink: 0 }}>{icon}</Box>
                <Box>
                  <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>{label}</Typography>
                  <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>{value}</Typography>
                </Box>
              </Box>
            );
          };
          return (
            <>
              <Box sx={{ background: 'linear-gradient(135deg, #0288d1, #0277bd)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <PersonIcon sx={{ color: '#fff', fontSize: 22 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2}>{c.candidateName || '—'}</Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.7)' }}>Candidate Profile</Typography>
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => setCandidateDrawer({ open: false, row: null })}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
                <DetailRow icon={<PhoneIcon sx={{ fontSize: 18 }} />}        label="Phone"             value={c.candidatePhone} />
                <DetailRow icon={<EmailIcon sx={{ fontSize: 18 }} />}        label="Email"             value={c.candidateEmail} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Position"          value={c.positionName} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Experience"        value={c.experience} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}   label="Current Location"  value={c.currentLocation} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Current Position"  value={c.currentPosition} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Current Company"   value={c.currentCompany} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Current CTC"       value={c.currentCTC} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Expected CTC"      value={c.expectedCTC} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Notice Period"     value={c.noticePeriod} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Qualification"     value={c.qualification} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Salary Offered"    value={c.salaryOffered} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Selection Status"  value={c.selectionStatus} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Selection Date"    value={c.selectionDate ? formatDate(c.selectionDate) : ''} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Joining Date"      value={c.joiningDate ? formatDate(c.joiningDate) : ''} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Offer Status"      value={c.offerStatus} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />}         label="Remark"            value={c.remark} />

                {/* ── Interview Tracking Fields ── */}
                {(c.internalInterviewDate || c.interviewByWhom || c.candidateReview || c.candidateRemark ||
                  c.resumeSubmitDate || c.lineupStatus || c.remarks1 || c.interviewStatus ||
                  c.offeredSalary || c.offeredStatus || c.joiningDateStatus || c.hasJoined) && (
                  <Box sx={{ mt: 2, mb: 1 }}>
                    <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                      Interview Tracking
                    </Typography>
                  </Box>
                )}
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Internal Interview Date" value={c.internalInterviewDate ? formatDate(c.internalInterviewDate) : ''} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Interview By Whom"
                  value={c.interviewByWhom
                    ? (typeof c.interviewByWhom === 'object'
                        ? `${c.interviewByWhom.firstName || ''} ${c.interviewByWhom.lastName || ''}`.trim()
                        : c.interviewByWhom)
                    : ''} />
                {c.candidateReview && (
                  <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Box sx={{ color: '#9fa8da', mt: 0.2 }}><WorkIcon sx={{ fontSize: 18 }} /></Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Candidate Review</Typography>
                      <Chip label={c.candidateReview} size="small" sx={{
                        fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: c.candidateReview === 'Green' ? '#e8f5e9' : c.candidateReview === 'Yellow' ? '#fff8e1' : '#ffebee',
                        color:   c.candidateReview === 'Green' ? '#2e7d32' : c.candidateReview === 'Yellow' ? '#f57f17' : '#c62828',
                      }} />
                    </Box>
                  </Box>
                )}
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Candidate Remark"     value={c.candidateRemark} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Resume Submit Date"   value={c.resumeSubmitDate ? formatDate(c.resumeSubmitDate) : ''} />
                {c.lineupStatus && (
                  <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Box sx={{ color: '#9fa8da', mt: 0.2 }}><WorkIcon sx={{ fontSize: 18 }} /></Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Lineup Status</Typography>
                      <Chip label={c.lineupStatus} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: '#e8eaf6', color: '#3f51b5' }} />
                    </Box>
                  </Box>
                )}
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Remarks 1"            value={c.remarks1} />
                {c.interviewStatus && (
                  <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Box sx={{ color: '#9fa8da', mt: 0.2 }}><WorkIcon sx={{ fontSize: 18 }} /></Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Interview Status</Typography>
                      <Chip label={c.interviewStatus} size="small" sx={{
                        fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: c.interviewStatus === 'Selected' ? '#e8f5e9' : c.interviewStatus === 'Rejected' ? '#ffebee' : '#e8eaf6',
                        color:   c.interviewStatus === 'Selected' ? '#2e7d32' : c.interviewStatus === 'Rejected' ? '#c62828' : '#3f51b5',
                      }} />
                    </Box>
                  </Box>
                )}
                {c.trailDays != null && c.trailDays !== '' && (
                  <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Trail Days" value={String(c.trailDays)} />
                )}
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Remarks 2"            value={c.remarks2} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Offered Salary"       value={c.offeredSalary} />
                {c.offeredStatus && (
                  <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Box sx={{ color: '#9fa8da', mt: 0.2 }}><WorkIcon sx={{ fontSize: 18 }} /></Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Offered Status</Typography>
                      <Chip label={c.offeredStatus} size="small" sx={{
                        fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: c.offeredStatus === 'Accepted' ? '#e8f5e9' : '#ffebee',
                        color:   c.offeredStatus === 'Accepted' ? '#2e7d32' : '#c62828',
                      }} />
                    </Box>
                  </Box>
                )}
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Remarks 3"            value={c.remarks3} />
                <DetailRow icon={<WorkIcon sx={{ fontSize: 18 }} />} label="Joining Date Status"  value={c.joiningDateStatus} />
                {c.hasJoined && (
                  <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Box sx={{ color: '#9fa8da', mt: 0.2 }}><WorkIcon sx={{ fontSize: 18 }} /></Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>Has Joined</Typography>
                      <Chip label={c.hasJoined} size="small" sx={{
                        fontWeight: 700, fontSize: '0.72rem',
                        bgcolor: c.hasJoined === 'Yes' ? '#e8f5e9' : c.hasJoined === 'No' ? '#ffebee' : '#fff8e1',
                        color:   c.hasJoined === 'Yes' ? '#2e7d32' : c.hasJoined === 'No' ? '#c62828' : '#f57f17',
                      }} />
                    </Box>
                  </Box>
                )}

                {c.resumeLink && (
                  <Box sx={{ py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 0.5 }}>Resume</Typography>
                    <a href={c.resumeLink} target="_blank" rel="noreferrer"
                      style={{ color: '#3f51b5', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                      View Resume <OpenInNewIcon sx={{ fontSize: 14 }} />
                    </a>
                  </Box>
                )}
              </Box>
              <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
                <Button fullWidth variant="outlined" onClick={() => setCandidateDrawer({ open: false, row: null })}
                  sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#0288d1', fontWeight: 600, textTransform: 'none' }}>
                  Close
                </Button>
              </Box>
            </>
          );
        })()}
      </Drawer>

    </div>
  );
};

export default HrReport;
