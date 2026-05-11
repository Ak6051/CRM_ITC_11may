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
  DialogContentText
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
import Navbar from '../../components/team leader components/TeamLeaderNavbar';
import Sidebar from '../../components/team leader components/TeamLeaderSidebar';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import ListIcon from '@mui/icons-material/List';
import useTLPermissions from '../../hooks/useTLPermissions';

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
  const { canDo } = useTLPermissions();
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
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  useEffect(() => {
    fetchCandidates();
  }, []);

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
      const response = await axios.get(`${API_BASE_URL}/fetch/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
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
      
          // If HRs are selected, check if this row's HR is in the selected list
      if (selectedHRs && selectedHRs.length > 0) {
        const hrMatch = selectedHRs.some(hr => fullName === hr);
        if (!hrMatch) return false;
      }

      // If no date range is set, return HR match result
      if (!dateRange.startDate && !dateRange.endDate) {
        return true;
      }

      const joiningDate = row.joiningDate ? new Date(row.joiningDate) : null;
      if (!joiningDate) return false;

      // Adjust dates to start/end of day for proper date comparison
      const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
      const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;

      if (startDate) startDate.setHours(0, 0, 0, 0);
      if (endDate) endDate.setHours(23, 59, 59, 999);

      const dateInRange =
        (!startDate || joiningDate >= startDate) &&
        (!endDate || joiningDate <= endDate);

      return dateInRange;
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
          {canDo('tl-hr-report:edit') && (
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
          )}
          {canDo('tl-hr-report:delete') && (
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
          )}
          {canDo('tl-hr-report:backout') && !params.row.isBackout && (
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
      headerName: 'Company Name',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.row.jobId?.companyName || 'N/A'}</Typography>
      ),
    },
    {
      field: 'candidateName',
      headerName: 'Name',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.row.jobId?.jobTitle || 'N/A'}</Typography>
      ),
    },
    {
      field: 'jobLocation',
      headerName: 'Job Location',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.row.jobId?.jobLocation || 'N/A'}</Typography>
      ),
    },
    {
      field: 'salaryOffered',
      headerName: 'Salary Offered',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'interviewDate',
      headerName: 'Interview Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value ? formatDate(params.value) : 'N/A'}</Typography>
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
      field: 'selectionStatus',
      headerName: 'Selection Status',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'noticePeriod',
      headerName: 'Notice Period',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
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
      field: 'billingDate',
      headerName: 'Billing Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value ? formatDate(params.value) : 'N/A'}</Typography>
      ),
    },

    {
      field: 'billingAmount',
      headerName: 'Billing Amount',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value ? `₹${params.value}` : 'N/A'}</Typography>
      ),
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment Status',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'paymentDate',
      headerName: 'Payment Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value ? formatDate(params.value) : 'N/A'}</Typography>
      ),
    },

    {
      field: 'paymentMode',
      headerName: 'Payment Mode',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },

    {
      field: 'companyAddress',
      headerName: 'Company Address',
      width: 220,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.row.jobId?.companyAddress || 'N/A'}</Typography>
      ),
    },

    {
      field: 'companyPhoneNumber',
      headerName: 'Company Phone',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.row.jobId?.phoneNumber || 'N/A'}</Typography>
      ),
    },

    {
      field: 'candidatePhone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'candidateEmail',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },

    {
      field: 'jobTiming',
      headerName: 'Job Timing',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.row.jobId?.jobTiming || 'N/A'}</Typography>
      ),
    },



    {
      field: 'qualification',
      headerName: 'Qualification',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'experience',
      headerName: 'Experience',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'currentPosition',
      headerName: 'Current Position',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'currentCTC',
      headerName: 'Current CTC',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'expectedCTC',
      headerName: 'Expected CTC',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'reasonforLeaving',
      headerName: 'Reason for Leaving',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'currentCompany',
      headerName: 'Current Company',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'remark',
      headerName: 'Remark',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },
    {
      field: 'paymentRemark',
      headerName: 'Payment Remark',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },


    {
      field: 'positionName',
      headerName: 'Position Name',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },

    {
      field: 'currentLocation',
      headerName: 'Current Location',
      width: 180,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
    },




    {
      field: 'offerStatus',
      headerName: 'Offer Status',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'N/A'}</Typography>
      ),
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
                {canDo('tl-hr-report:view-backout-list') && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => setBackoutCandidatesDialogOpen(true)}
                  startIcon={<ListIcon />}
                  sx={{ ml: 2 }}
                >
                  View Backout Candidates
                </Button>
                )}
                {canDo('tl-hr-report:export') && (
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
                )}
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
    label="From Date"
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
    label="To Date"
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


            {/* Billing Details Section */}
            <Typography variant="subtitle1" sx={{ mt: 3, mb: 1, fontWeight: 'bold', color: '#424242' }}>
              Billing Information
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Billing Date"
                  type="date"
                  value={editFormData.billingDate}
                  onChange={handleInputChange('billingDate')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Billing Amount"
                  type="number"
                  value={editFormData.billingAmount}
                  onChange={handleInputChange('billingAmount')}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Payment Status"
                  value={editFormData.paymentStatus}
                  onChange={handleInputChange('paymentStatus')}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="Pending">Pending</MenuItem>
                  <MenuItem value="Paid">Paid</MenuItem>
                  <MenuItem value="Failed">Failed</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Payment Date"
                  type="date"
                  value={editFormData.paymentDate}
                  onChange={handleInputChange('paymentDate')}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                  margin="normal"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  label="Payment Mode"
                  value={editFormData.paymentMode}
                  onChange={handleInputChange('paymentMode')}
                  fullWidth
                  margin="normal"
                >
                  <MenuItem value="">Select Payment Mode</MenuItem>
                  <MenuItem value="Cash">Cash</MenuItem>
                  <MenuItem value="GPay">GPay</MenuItem>
                  <MenuItem value="Bank">Bank Transfer</MenuItem>
                </TextField>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  label="Payment Remarks"
                  value={editFormData.paymentRemark}
                  onChange={handleInputChange('paymentRemark')}
                  fullWidth
                  multiline
                  rows={2}
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
    </div>
  );
};

export default HrReport;
