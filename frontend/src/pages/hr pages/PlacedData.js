import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import { Refresh as RefreshIcon, Search as SearchIcon } from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { toast } from 'react-toastify';
import Sidebar from '../../components/hr components/HrSidebar';
import Navbar from '../../components/hr components/HrNavbar';

const PlacedData = () => {
  const [placedCandidates, setPlacedCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');
  const [filteredRows, setFilteredRows] = useState([]);
  const [dateFilter, setDateFilter] = useState('all');
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const fetchPlacedCandidates = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/fetch/hr/candidates`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlacedCandidates(response.data);
      setFilteredRows(response.data);
    } catch (error) {
      console.error('Error fetching placed candidates:', error);
      toast.error('Failed to fetch placed candidates');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPlacedCandidates();
  }, []);

  useEffect(() => {
    let filtered = [...placedCandidates];

    // Apply text search filter
    if (searchText.trim() !== '') {
      const searchLower = searchText.toLowerCase();
      filtered = filtered.filter(
        (row) =>
          (row.candidateName?.toLowerCase().includes(searchLower) ||
          row.candidateEmail?.toLowerCase().includes(searchLower) ||
          row.positionName?.toLowerCase().includes(searchLower) ||
          row.jobId?.jobTitle?.toLowerCase().includes(searchLower) ||
          row.jobId?.companyName?.toLowerCase().includes(searchLower) ||
          row.jobId?.companyAddress?.toLowerCase().includes(searchLower) ||
          row.jobId?.phoneNumber?.toLowerCase().includes(searchLower) ||
          row.jobId?.jobLocation?.toLowerCase().includes(searchLower) ||
          row.jobId?.qualification?.toLowerCase().includes(searchLower) ||
          row.jobId?.experience?.toLowerCase().includes(searchLower) ||
          row.jobId?.currentPosition?.toLowerCase().includes(searchLower) ||
          row.jobId?.currentCTC?.toLowerCase().includes(searchLower) ||
          row.jobId?.expectedCTC?.toLowerCase().includes(searchLower) ||
          row.jobId?.noticePeriod?.toLowerCase().includes(searchLower) ||
          row.jobId?.currentCompany?.toLowerCase().includes(searchLower) ||
          row.jobId?.salaryOffered?.toLowerCase().includes(searchLower))
      );
    }

    // Apply date filter
    if (dateFilter !== 'all' && (startDate || endDate)) {
      filtered = filtered.filter(row => {
        if (!row.joiningDate) return false;
        
        const joiningDate = new Date(row.joiningDate);
        joiningDate.setHours(0, 0, 0, 0);
        
        if (dateFilter === 'range' && startDate && endDate) {
          const start = new Date(startDate);
          const end = new Date(endDate);
          start.setHours(0, 0, 0, 0);
          end.setHours(23, 59, 59, 999);
          return joiningDate >= start && joiningDate <= end;
        }
        
        if (dateFilter === 'today') {
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          const tomorrow = new Date(today);
          tomorrow.setDate(tomorrow.getDate() + 1);
          return joiningDate >= today && joiningDate < tomorrow;
        }
        
        if (dateFilter === 'thisWeek') {
          const today = new Date();
          const firstDay = new Date(today.setDate(today.getDate() - today.getDay()));
          const lastDay = new Date(firstDay);
          lastDay.setDate(lastDay.getDate() + 6);
          firstDay.setHours(0, 0, 0, 0);
          lastDay.setHours(23, 59, 59, 999);
          return joiningDate >= firstDay && joiningDate <= lastDay;
        }
        
        if (dateFilter === 'thisMonth') {
          const date = new Date();
          const firstDay = new Date(date.getFullYear(), date.getMonth(), 1);
          const lastDay = new Date(date.getFullYear(), date.getMonth() + 1, 0);
          lastDay.setHours(23, 59, 59, 999);
          return joiningDate >= firstDay && joiningDate <= lastDay;
        }
        
        return true;
      });
    }

    setFilteredRows(filtered);
  }, [searchText, placedCandidates, dateFilter, startDate, endDate]);
  
  const handleDateFilterChange = (event) => {
    setDateFilter(event.target.value);
    if (event.target.value !== 'range') {
      setStartDate(null);
      setEndDate(null);
    }
  };

  const columns = [
   
  
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

   
  

    
  ];

  // Common cell style
  const cellStyle = {
    fontSize: '0.875rem',
    whiteSpace: 'normal',
    lineHeight: '1.2',
    padding: '8px 0',
  };

  // Header style
  const headerStyle = {
    '& .header-bold': {
      fontWeight: 'bold !important',
      backgroundColor: '#f5f5f5',
    },
  };

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
        <Box sx={{ p: 3, ...headerStyle }}>
      <Paper elevation={3} sx={{ p: 3, borderRadius: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="h5" component="h1" sx={{ fontWeight: 'bold' }}>
              My Placed Candidates
            </Typography>
            <Box sx={{ display: 'flex', gap: 2, alignItems: 'center' }}>
              <TextField
                size="small"
                placeholder="Search candidates..."
                value={searchText}
                onChange={(e) => setSearchText(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <SearchIcon color="action" />
                    </InputAdornment>
                  ),
                }}
                sx={{ minWidth: 250 }}
              />
              <Button
                variant="contained"
                color="primary"
                startIcon={<RefreshIcon />}
                onClick={fetchPlacedCandidates}
                disabled={loading}
              >
                Refresh
              </Button>
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControl size="small" sx={{ minWidth: 200 }}>
              <InputLabel>Filter by Joining Date</InputLabel>
              <Select
                value={dateFilter}
                label="Filter by Joining Date"
                onChange={handleDateFilterChange}
              >
                <MenuItem value="all">All Dates</MenuItem>
                <MenuItem value="today">Today</MenuItem>
                <MenuItem value="thisWeek">This Week</MenuItem>
                <MenuItem value="thisMonth">This Month</MenuItem>
                <MenuItem value="range">Custom Range</MenuItem>
              </Select>
            </FormControl>
            
            {dateFilter === 'range' && (
              <LocalizationProvider dateAdapter={AdapterDateFns}>
                <Stack direction="row" spacing={2} alignItems="center">
                  <DatePicker
                    label="Start Date"
                    value={startDate}
                    onChange={(newValue) => setStartDate(newValue)}
                    renderInput={(params) => <TextField {...params} size="small" />}
                  />
                  <Typography>to</Typography>
                  <DatePicker
                    label="End Date"
                    value={endDate}
                    onChange={(newValue) => setEndDate(newValue)}
                    renderInput={(params) => <TextField {...params} size="small" />}
                    minDate={startDate}
                  />
                </Stack>
              </LocalizationProvider>
            )}
          </Box>
        </Box>

        <Box sx={{ 
          height: '70vh', 
          width: '100%',
          '& .MuiDataGrid-columnHeaders': {
            backgroundColor: '#f5f5f5',
            '& .MuiDataGrid-columnHeaderTitle': {
              fontWeight: 'bold',
            },
          },
          '& .MuiDataGrid-cell': {
            display: 'flex',
            alignItems: 'center',
            padding: '0 16px',
          },
          '& .MuiDataGrid-row': {
            '&:hover': {
              backgroundColor: 'rgba(0, 0, 0, 0.04)',
            },
          },
        }}>
          <DataGrid
            rows={filteredRows}
            columns={columns.map(column => ({
              ...column,
              headerClassName: 'header-bold',
              renderCell: column.renderCell || ((params) => (
                <Typography sx={cellStyle}>
                  {params.value || 'N/A'}
                </Typography>
              )),
            }))}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            loading={loading}
            components={{
              Toolbar: GridToolbar,
              LoadingOverlay: () => (
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    height: '100%',
                  }}
                >
                  <CircularProgress />
                </Box>
              ),
              NoRowsOverlay: () => (
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    height: '100%',
                    p: 2,
                  }}
                >
                  <Typography variant="body1" color="textSecondary" sx={{ fontSize: '1rem' }}>
                    {loading ? 'Loading candidates...' : 'No placed candidates found'}
                  </Typography>
                </Box>
              ),
            }}
            disableSelectionOnClick
            getRowId={(row) => row._id}
            sx={{
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: '#f9f9f9',
              },
            }}
          />
        </Box>
      </Paper>
    </Box>
    </Box>
    </div>
  );
};

export default PlacedData;