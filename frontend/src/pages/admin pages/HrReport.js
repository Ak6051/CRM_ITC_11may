import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import { Box, Typography, Paper, Chip, IconButton, Tooltip, Dialog, DialogTitle, DialogContent, DialogActions, Button, Snackbar, Alert, TextField, MenuItem } from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import axios from 'axios';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import ToggleOnIcon from '@mui/icons-material/ToggleOn';
import ToggleOffIcon from '@mui/icons-material/ToggleOff';

const HrReport = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [filterHR, setFilterHR] = useState('');

  const [editFormData, setEditFormData] = useState({
    billingDate: '',
    billingAmount: '',
    paymentStatus: '',
    paymentDate: ''
  });
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
        `http://localhost:5000/api/allType/${jobId}/toggle-status`,
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
      const response = await axios.get(`http://localhost:5000/api/fetch/candidates?createdByName=${filterHR}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching candidates:', error);
      setLoading(false);
    }
  };

  const filteredRows = candidates.filter((row) => {
  const fullName = `${row.createdBy?.firstName || ''} ${row.createdBy?.lastName || ''}`.toLowerCase();
  return fullName.includes(filterHR.toLowerCase());
});


  const handleDeleteClick = (candidate) => {
    setSelectedCandidate(candidate);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`http://localhost:5000/api/fetch/candidates/${selectedCandidate._id}`, {
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

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedCandidate(null);
  };

  const handleEditClick = (candidate) => {
    setSelectedCandidate(candidate);
    setEditFormData({
      billingDate: candidate.billingDate || '',
      billingAmount: candidate.billingAmount || '',
      paymentStatus: candidate.paymentStatus || '',
      paymentDate: candidate.paymentDate || ''
    });
    setEditDialogOpen(true);
  };

  const handleEditConfirm = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `http://localhost:5000/api/fetch/lineup/${selectedCandidate._id}`,
        editFormData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      fetchCandidates();
      setEditDialogOpen(false);
      setSelectedCandidate(null);
      setSnackbar({
        open: true,
        message: 'Candidate details updated successfully',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error updating candidate:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update candidate details',
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
      paymentDate: ''
    });
  };

  const handleInputChange = (field) => (event) => {
    setEditFormData({
      ...editFormData,
      [field]: event.target.value
    });
  };

  const formatDate = (date) => {
    if (!date) return '';
    try {
      return new Date(date).toLocaleDateString();
    } catch (error) {
      return '';
    }
  };

  const getStatusColor = (status) => {
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
  field: 'createdBy',
  headerName: 'Created By',
  width: 250,
  renderCell: (params) => {
    const creator = params.row.createdBy;
    return creator ? (
      <Typography sx={{ fontSize: '0.875rem' }}>
        {`${creator.firstName || ''} ${creator.lastName || ''} (${creator.role || ''})`}
      </Typography>
    ) : (
      <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>N/A</Typography>
    );
  },
},

    {
      field: 'candidateName',
      headerName: 'Name',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'candidateEmail',
      headerName: 'Email',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'candidatePhone',
      headerName: 'Phone',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'qualification',
      headerName: 'Qualification',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'remark',
      headerName: 'Remark',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
      ),
    },
    {
      field: 'interviewDate',
      headerName: 'Interview Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'lineupStatus',
      headerName: 'Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Pending'}
          color={getStatusColor(params.value)}
          size="small"
          sx={{
            minWidth: '100px',
            fontWeight: 'medium',
          }}
        />
      ),
    },
    {
      field: 'joiningDate',
      headerName: 'Joining Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'candidateRemarks',
      headerName: 'Remarks',
      width: 200,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{params.value || 'No remarks'}</Typography>
      ),
    },
    {
      field: 'jobId',
      headerName: 'Job Details',
      width: 250,
      renderCell: (params) => {
        const job = params.row.jobId;
        return job ? (
          <Typography sx={{ fontSize: '0.875rem' }}>
            {`${job.jobTitle} - ${job.companyName}`}

          </Typography>
        ) : (
          <Typography sx={{ color: 'text.secondary', fontSize: '0.875rem' }}>N/A</Typography>
        );
      },
    },
    {
        field: "jobStatus",
        headerName: "Status",
        width: 120,
        renderCell: (params) => {
          // Check if jobId exists and has an _id property
          const jobId = params.row.jobId?._id;
          const isOpen = params.value === 'Open';
          
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
      field: 'billingDate',
      headerName: 'Billing Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'billingAmount',
      headerName: 'Billing Amount',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>
          {params.value ? `₹${params.value}` : 'N/A'}
        </Typography>
      ),
    },
    {
      field: 'paymentStatus',
      headerName: 'Payment Status',
      width: 150,
      renderCell: (params) => (
        <Chip
          label={params.value || 'Pending'}
          color={params.value === 'Paid' ? 'success' : 'warning'}
          size="small"
          sx={{
            minWidth: '100px',
            fontWeight: 'medium',
          }}
        />
      ),
    },
    {
      field: 'paymentDate',
      headerName: 'Payment Date',
      width: 150,
      renderCell: (params) => (
        <Typography sx={{ fontSize: '0.875rem' }}>{formatDate(params.value)}</Typography>
      ),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Box>
          <Tooltip title="Edit Candidate">
            <IconButton
              onClick={() => handleEditClick(params.row)}
              sx={{
                color: '#2196f3',
                mr: 1,
                '&:hover': {
                  backgroundColor: 'rgba(33, 150, 243, 0.1)',
                },
              }}
            >
              <EditIcon />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Candidate">
            <IconButton
              onClick={() => handleDeleteClick(params.row)}
              sx={{
                color: '#f44336',
                '&:hover': {
                  backgroundColor: 'rgba(244, 67, 54, 0.1)',
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5' }}>
        <Sidebar />
      </div>

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
          <Typography variant="h5" gutterBottom>
            Candidate Report
          </Typography>
          <TextField
  label="Filter by HR Name"
  variant="outlined"
  size="small"
  value={filterHR}
  onChange={(e) => setFilterHR(e.target.value)}
  sx={{ mb: 2 }}
/>
          <Box sx={{ 
            flex: 1, 
            width: '100%', 
            overflow: 'auto',
            '& .MuiDataGrid-root': {
              border: 'none',
            }
          }}>
            <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              checkboxSelection
              disableSelectionOnClick
              loading={loading}
              getRowId={(row) => row._id}
              sx={{
                borderRadius: 2,
                '& .MuiDataGrid-cell': {
                  fontSize: '14px',
                  transition: 'all 0.3s ease',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#e3e3e3',
                  fontWeight: 'bold',
                  fontSize: '15px',
                },
                '& .MuiDataGrid-row:hover': {
                  backgroundColor: '#e0f7fa',
                  transform: 'scale(1.01)',
                  transition: 'transform 0.2s ease-in-out',
                },
              }}
            />
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
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle sx={{ color: '#2196f3' }}>
          Edit Candidate Details
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 2 }}>
            <TextField
              label="Billing Date"
              type="date"
              value={editFormData.billingDate}
              onChange={handleInputChange('billingDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <TextField
              label="Billing Amount"
              type="number"
              value={editFormData.billingAmount}
              onChange={handleInputChange('billingAmount')}
              fullWidth
            />
            <TextField
              select
              label="Payment Status"
              value={editFormData.paymentStatus}
              onChange={handleInputChange('paymentStatus')}
              fullWidth
            >
              <MenuItem value="Pending">Pending</MenuItem>
              <MenuItem value="Paid">Paid</MenuItem>
              <MenuItem value="Failed">Failed</MenuItem>
            </TextField>
            <TextField
              label="Payment Date"
              type="date"
              value={editFormData.paymentDate}
              onChange={handleInputChange('paymentDate')}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditCancel} color="primary">
            Cancel
          </Button>
          <Button onClick={handleEditConfirm} color="primary" variant="contained">
            Save Changes
          </Button>
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
