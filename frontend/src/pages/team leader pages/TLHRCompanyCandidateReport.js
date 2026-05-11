import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button,
  Chip,
  Tooltip,
  TextField,
  Stack
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Navbar from '../../components/team leader components/TeamLeaderNavbar';
import Sidebar from '../../components/team leader components/TeamLeaderSidebar';
import dayjs from 'dayjs';

const getStatusColor = (status) => {
  if (!status) return 'default';
  
  const statusLower = status.toLowerCase();
  
  switch (statusLower) {
    case 'selected':
    case 'accepted':
    case 'joined':
    case 'completed':
      return 'success';
    case 'rejected':
    case 'not selected':
    case 'declined':
      return 'error';
    case 'in progress':
    case 'pending':
    case 'in review':
      return 'warning';
    case 'on hold':
    case 'waiting':
      return 'info';
    default:
      return 'default';
  }
};

const HRCompanyCandidateReport = () => {
  const { hrId } = useParams();
  const [data, setData] = useState({
    jobOpenings: [],
    candidates: [],
  });
  const [candidateCount, setCandidateCount] = useState(0);
  const [selectedCompanyJobId, setSelectedCompanyJobId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [hrName, setHrName] = useState('');
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  
  const [jobDateRange, setJobDateRange] = useState({
    startDate: null,
    endDate: null
  });
  
  // Import dayjs
  const dayjs = require('dayjs');
  require('dayjs/locale/en');

  // useEffect(() => {
  //   const fetchData = async () => {
  //     const token = sessionStorage.getItem('token');
  //     const res = await axios.get(`${API_BASE_URL}/allType/hr/${hrId}/assigned-data`, {
  //       headers: { Authorization: `Bearer ${token}` },
  //     });
  //     setData(res.data);
  //   };

  //   fetchData();
  // }, [hrId]);

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/allType/hr/${hrId}/assigned-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      // Set job and candidate data
      setData({
        jobOpenings: res.data.jobOpenings,
        candidates: res.data.candidates,
      });
      // Set candidate count
      setCandidateCount(res.data.candidateCount || 0);
  
      // Set HR Name (assuming hr object has firstName and lastName)
      if (res.data.hr) {
        setHrName(`${res.data.hr.firstName} ${res.data.hr.lastName}`);
      }
    };
  
    fetchData();
  }, [hrId]);
  

  const handleCompanyClick = (jobId) => {
    setSelectedCompanyJobId(jobId);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCompanyJobId(null);
    // Reset date range when dialog is closed
    setDateRange({ startDate: null, endDate: null });
  };

  // Common renderCell function with tooltip
  const renderCellWithTooltip = (params) => {
    const value = params.value || '';
    return (
      <Tooltip title={value} arrow>
        <div style={{ 
          whiteSpace: 'nowrap',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          width: '100%'
        }}>
          {value}
        </div>
      </Tooltip>
    );
  };

  const jobColumns = [
    {
      field: 'companyName',
      headerName: 'Company Name',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.row.companyName || ''} arrow>
          <span
            onClick={() => handleCompanyClick(params.row._id)}
            style={{ 
              cursor: 'pointer', 
              color: 'blue',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}
          >
            {params.row.companyName}
          </span>
        </Tooltip>
      )
    },
    { 
      field: 'industries', 
      headerName: 'Industries', 
      width: 180,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'companyAddress', 
      headerName: 'Company Address', 
      width: 180,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'contactName', 
      headerName: 'Contact Name', 
      width: 150,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'email', 
      headerName: 'Email', 
      width: 180,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'phoneNumber', 
      headerName: 'Phone Number', 
      width: 150,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'jobTitle', 
      headerName: 'Job Title', 
      width: 150,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'numberOfRequirements', 
      headerName: 'No. of Requirements', 
      width: 170,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'keyResponsibility', 
      headerName: 'Key Responsibility', 
      width: 200,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'requiredSkills', 
      headerName: 'Required Skills', 
      width: 200,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'education', 
      headerName: 'Education', 
      width: 150,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'experience', 
      headerName: 'Experience', 
      width: 150,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'salary', 
      headerName: 'Salary', 
      width: 150,
      renderCell: renderCellWithTooltip
    },
    { 
      field: 'jobLocation', 
      headerName: 'Job Location', 
      width: 150,
      renderCell: renderCellWithTooltip
    },

    {
      field: 'descriptionFile',
      headerName: 'Description',
      width: 250,
      renderCell: (params) => {
        if (params.row.descriptionFile) {
          return (
            <a
              href={params.row.descriptionFile}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#1976d2', textDecoration: 'underline' }}
            >
              View PDF
            </a>
          );
        } 
      },
    },

    {
      field: 'agreementSigned',
      headerName: 'Agreement',
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <a
            href={params.value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'underline' }}
          >
            View PDF
          </a>
        ) : (
          'N/A'
        ),
    },

    {
      field: 'websiteURL',
      headerName: 'Website',
      width: 200,
      renderCell: (params) =>
        params.value ? (
          <a
            href={params.value.startsWith('http') ? params.value : `https://${params.value}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'underline' }}
          >
            {params.value}
          </a>
        ) : (
          'N/A'
        ),
    },

    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY hh:mm A") : ""
    },

    {
      field: 'startDate',
      headerName: 'Start Date',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
  ];

  const candidateColumns = [
    {
      field: 'resumeLink',
      headerName: 'Resume',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        const resumeLink = params.value;
        // Check if the value is a valid URL
        const isValidUrl = resumeLink && 
                         (resumeLink.startsWith('http://') || resumeLink.startsWith('https://')) &&
                         resumeLink !== 'No Resume';
        
        if (!isValidUrl) {
          return 'No Resume';
        }
        
        return (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => window.open(resumeLink, '_blank')}
          >
            View
          </Button>
        );
      },
    },
    { field: 'candidateName', headerName: 'Name', width: 150 },
    { field: 'candidateEmail', headerName: 'Email', width: 200 },
    { field: 'candidatePhone', headerName: 'Phone', width: 150 },
    { field: 'qualification', headerName: 'Qualification', width: 150 },
    { field: 'positionName', headerName: 'Position', width: 150 },  
    { field: 'experience', headerName: 'Experience', width: 150 },
    { field: 'currentLocation', headerName: 'Location', width: 150 },
    { field: 'currentCTC', headerName: 'CTC', width: 150 },
    { field: 'expectedCTC', headerName: 'Expected CTC', width: 150 },
    { field: 'noticePeriod', headerName: 'Notice Period', width: 150 },
    { field: 'reasonforLeaving', headerName: 'Reason for Leaving', width: 150 },
    { field: 'currentCompany', headerName: 'Current Company', width: 150 },
    { field: 'remark', headerName: 'Remark', width: 200 },
  

    {
      field: 'interviewDate',
      headerName: 'Interview Date',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    {
      field: 'selectionStatus',
      headerName: 'Selection Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Pending'}
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field:'selectionDate',
      headerName: 'Selection Date',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    {
      field:'salaryOffered',
      headerName: 'Salary Offered',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    {
      field:'offerStatus',
      headerName: 'Offer Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Pending'}
          color={getStatusColor(params.value)}
        />
      ),
    },
    {
      field: 'joiningDate',
      headerName: 'Joining Date',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    { field: 'lineupStatus', headerName: 'Lineup Status', width: 150 },
    { field: 'candidateRemarks', headerName: 'Candidate Remarks', width: 200 },
    { field: 'createdAt', headerName: 'Created At', width: 170, renderCell: (params) => params.value ? new Date(params.value).toLocaleString() : 'N/A' }
  ];

  const getCandidateRows = () => {
    return data.candidates
      .filter((c) => {
        if (c.jobId !== selectedCompanyJobId) return false;
        if (dateRange.startDate || dateRange.endDate) {
          const createdAt = c.createdAt ? new Date(c.createdAt) : null;
          if (!createdAt) return false;
          
          // Convert to timestamps for comparison
          const startTimestamp = dateRange.startDate ? dayjs(dateRange.startDate).startOf('day').valueOf() : null;
          const endTimestamp = dateRange.endDate ? dayjs(dateRange.endDate).endOf('day').valueOf() : null;
          const createdAtTimestamp = createdAt.getTime();
          
          if (startTimestamp && createdAtTimestamp < startTimestamp) return false;
          if (endTimestamp && createdAtTimestamp > endTimestamp) return false;
        }
        return true;
      })
      .map((c) => ({ ...c, id: c._id }));
  };

  const getJobRows = (jobs) => {
    return jobs
      .filter((job) => {
        if (jobDateRange.startDate || jobDateRange.endDate) {
          const jobStartDate = job.startDate ? new Date(job.startDate) : null;
          const jobEndDate = job.endDate ? new Date(job.endDate) : null;
          
          if (!jobStartDate && !jobEndDate) return false;
          
          // Convert filter dates to timestamps for comparison
          const filterStartTimestamp = jobDateRange.startDate ? 
            dayjs(jobDateRange.startDate).startOf('day').valueOf() : null;
          const filterEndTimestamp = jobDateRange.endDate ? 
            dayjs(jobDateRange.endDate).endOf('day').valueOf() : null;
          
          // Check if job's date range overlaps with filter date range
          if (filterStartTimestamp && jobEndDate && jobEndDate.getTime() < filterStartTimestamp) {
            return false;
          }
          if (filterEndTimestamp && jobStartDate && jobStartDate.getTime() > filterEndTimestamp) {
            return false;
          }
        }
        return true;
      })
      .map((job) => ({
        ...job,
        id: job._id,
      }));
  };

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar is fixed */}
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

      {/* Main content area */}
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
        {/* Navbar is fixed at the top */}
        <Navbar />
        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 3 }}>
            HR Assigned Jobs & Candidates
          </Typography>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, mb: 1 }}>
          <Typography variant="h5">
            📂 Active Job Openings
          </Typography>
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={2} sx={{ alignItems: 'center' }}>
              <DatePicker
                label="From Date"
                value={jobDateRange.startDate ? dayjs(jobDateRange.startDate) : null}
                onChange={(newValue) => {
                  setJobDateRange(prev => ({
                    ...prev,
                    startDate: newValue ? newValue.toDate() : null
                  }));
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 180 },
                    InputLabelProps: { shrink: true }
                  }
                }}
                maxDate={jobDateRange.endDate ? dayjs(jobDateRange.endDate) : undefined}
              />
              <DatePicker
                label="To Date"
                value={jobDateRange.endDate ? dayjs(jobDateRange.endDate) : null}
                onChange={(newValue) => {
                  setJobDateRange(prev => ({
                    ...prev,
                    endDate: newValue ? newValue.toDate() : null
                  }));
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 180 },
                    InputLabelProps: { shrink: true }
                  }
                }}
                minDate={jobDateRange.startDate ? dayjs(jobDateRange.startDate) : undefined}
              />
              <Button 
                variant="outlined" 
                onClick={() => setJobDateRange({ startDate: null, endDate: null })}
                size="small"
                sx={{ height: '40px', alignSelf: 'center' }}
              >
                Clear Dates
              </Button>
              <Chip 
                label={`Showing: ${getJobRows(data.jobOpenings).length} jobs`} 
                color="info" 
                size="small" 
                variant="outlined"
                sx={{ 
                  height: '32px', 
                  alignSelf: 'center',
                  fontWeight: 'medium'
                }}
              />
            </Stack>
          </LocalizationProvider>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#3f51b5' }}>
            👤 Viewing HR: {hrName || 'Loading...'}
          </Typography>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', color: '#1976d2', marginLeft: 3 }}>
            📄 Total Resumes: {data.candidates.length}
          </Typography>
        </Box>


        {/* JOB GRID: using your Job Report grid format */}
       <Box
  sx={{
    width: '100%',
    height: '70vh',
    margin: '0 auto',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'white',
    borderRadius: '4px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  }}
>
  <DataGrid
    rows={getJobRows(data.jobOpenings)}
    columns={jobColumns}
    components={{ 
      Toolbar: GridToolbar,
      Pagination: () => (
        <Box sx={{ width: '100%', display: 'flex', justifyContent: 'space-between', p: 1, alignItems: 'center' }}>
          <Box sx={{ ml: 2 }}>
            Rows per page:
            <select 
              style={{ 
                margin: '0 8px', 
                padding: '4px',
                borderRadius: '4px',
                border: '1px solid #ccc'
              }}
              value={10}
              onChange={(e) => {}}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </Box>
          <Box sx={{ mr: 2 }}>
            {data.jobOpenings.length} of {data.jobOpenings.length} rows
          </Box>
        </Box>
      )
    }}
    pageSize={10}
    rowsPerPageOptions={[10, 25, 50]}
    checkboxSelection
    disableRowSelectionOnClick
    autoHeight={false}
    sx={{
      flex: '1 1 auto',
      '& .MuiDataGrid-main': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        '& .MuiDataGrid-columnHeaders': {
          minWidth: 'fit-content',
          width: '100%',
          '& .MuiDataGrid-columnHeader': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }
        },
        '& .MuiDataGrid-virtualScroller': {
          overflowX: 'auto',
          '& .MuiDataGrid-row': {
            minWidth: 'fit-content',
            width: '100% !important',
          },
          '& .MuiDataGrid-cell': {
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
          }
        }
      },
      '& .MuiDataGrid-virtualScroller': {
        flexGrow: 1,
        minHeight: '200px',
      },
      '& .MuiDataGrid-columnHeaders': {
        position: 'sticky',
        top: 0,
        zIndex: 2,
        backgroundColor: '#f5f5f5',
        borderBottom: '2px solid #e0e0e0',
      },
      '& .MuiDataGrid-columnHeader': {
        backgroundColor: '#f5f5f5',
        fontWeight: 'bold',
        whiteSpace: 'normal',
        lineHeight: 'normal',
        padding: '8px',
      },
      '& .MuiDataGrid-cell': {
        whiteSpace: 'normal',
        lineHeight: 'normal',
        padding: '8px',
      },
      '& .MuiDataGrid-row': {
        '&:nth-of-type(odd)': {
          backgroundColor: 'rgba(0, 0, 0, 0.02)',
        },
        '&:hover': {
          backgroundColor: 'rgba(25, 118, 210, 0.08)',
        },
      },
      '& .MuiTablePagination-root': {
        marginLeft: 'auto',
      },
      '& .MuiDataGrid-columnHeaderTitle': {
        fontWeight: '600',
      },
    }}
  />
</Box>



       
        </Box>
      </Box>

      {/* Candidate Popup Dialog */}
      <Dialog
        open={openDialog}
        disableEscapeKeyDown
        onClose={(event, reason) => {
          if (reason === 'backdropClick' || reason === 'escapeKeyDown') return;
          handleCloseDialog();
        }}
        fullWidth
        maxWidth="xl"
        sx={{ '& .MuiDialog-paper': { width: '95%', maxWidth: 'none', maxHeight: '90vh' } }}
      >
        <DialogTitle sx={{ p: 2 }}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={1}>
            <Box display="flex" alignItems="center">
              <Typography variant="h6" component="span">👤 Candidates for Selected Job</Typography>
              <Chip 
                label={`Total: ${data.candidates.filter(c => c.jobId === selectedCompanyJobId).length} candidates`} 
                color="primary" 
                size="small" 
                sx={{ ml: 2, fontWeight: 'medium' }}
              />
            </Box>
            <IconButton onClick={handleCloseDialog} size="small">
              <CloseIcon />
            </IconButton>
          </Box>
          
          <LocalizationProvider dateAdapter={AdapterDayjs}>
            <Stack direction="row" spacing={2} sx={{ mt: 1 }}>
              <DatePicker
                label="From Date"
                value={dateRange.startDate ? dayjs(dateRange.startDate) : null}
                onChange={(newValue) => {
                  setDateRange(prev => ({
                    ...prev,
                    startDate: newValue ? newValue.toDate() : null
                  }));
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 180 },
                    InputLabelProps: { shrink: true }
                  }
                }}
                maxDate={dateRange.endDate ? dayjs(dateRange.endDate) : undefined}
              />
              <DatePicker
                label="To Date"
                value={dateRange.endDate ? dayjs(dateRange.endDate) : null}
                onChange={(newValue) => {
                  setDateRange(prev => ({
                    ...prev,
                    endDate: newValue ? newValue.toDate() : null
                  }));
                }}
                slotProps={{
                  textField: {
                    size: 'small',
                    sx: { width: 180 },
                    InputLabelProps: { shrink: true }
                  }
                }}
                minDate={dateRange.startDate ? dayjs(dateRange.startDate) : undefined}
              />
              <Button 
                variant="outlined" 
                onClick={() => setDateRange({ startDate: null, endDate: null })}
                size="small"
                sx={{ height: '40px', alignSelf: 'center' }}
              >
                Clear Dates
              </Button>
              <Chip 
                label={`Showing: ${getCandidateRows().length} candidates`} 
                color="info" 
                size="small" 
                variant="outlined"
                sx={{ 
                  height: '32px', 
                  alignSelf: 'center',
                  ml: 'auto',
                  fontWeight: 'medium'
                }}
              />
            </Stack>
          </LocalizationProvider>
        </DialogTitle>
        <DialogContent>
         <Box sx={{ 
  width: '100%',
  height: '75vh',
  margin: '0 auto',
  display: 'flex',
  flexDirection: 'column',
  backgroundColor: 'white',
  borderRadius: '4px',
  boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
}}>
  <DataGrid
    rows={getCandidateRows()}
    columns={candidateColumns}
    pageSize={10}
    rowsPerPageOptions={[10, 25, 50]}
    checkboxSelection
    disableSelectionOnClick
    components={{
      Toolbar: GridToolbar,
    }}
    componentsProps={{
      toolbar: {
        showQuickFilter: true,
        quickFilterProps: { debounceMs: 500 },
      },
    }}
    sx={{
      flex: '1 1 auto',
      overflow: 'auto',
      '& .MuiDataGrid-main': {
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        width: '100%',
        '& .MuiDataGrid-columnHeaders': {
          minWidth: 'fit-content',
          width: '100%',
          position: 'sticky',
          top: 0,
          zIndex: 2,
          backgroundColor: '#f5f5f5',
          borderBottom: '2px solid #e0e0e0',
          '& .MuiDataGrid-columnHeader': {
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: '#f5f5f5',
            fontWeight: 'bold',
            whiteSpace: 'normal',
            lineHeight: 'normal',
            padding: '8px',
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: '600',
            },
          }
        },
        '& .MuiDataGrid-virtualScroller': {
          overflowX: 'auto',
          flexGrow: 1,
          minHeight: '200px',
          '& .MuiDataGrid-row': {
            minWidth: 'fit-content',
            width: '100% !important',
            '&:nth-of-type(odd)': {
              backgroundColor: 'rgba(0, 0, 0, 0.02)',
            },
            '&:hover': {
              backgroundColor: 'rgba(25, 118, 210, 0.08)',
            },
          },
          '& .MuiDataGrid-cell': {
            whiteSpace: 'nowrap',
            display: 'flex',
            alignItems: 'center',
            padding: '8px',
          }
        },
        '& .MuiTablePagination-root': {
          marginLeft: 'auto',
        },
      },
      '& .MuiDataGrid-columnHeadersInner': {
        backgroundColor: '#f5f5f5',
      },
    }}
  />
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRCompanyCandidateReport;
