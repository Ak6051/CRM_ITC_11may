
import React, { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Modal,
  IconButton,
  Divider,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import VisibilityIcon from '@mui/icons-material/Visibility';
import CloseIcon from '@mui/icons-material/Close';
import axios from 'axios';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import { API_BASE_URL } from '../../config/api.config';

const RecentData = (props) => {
  // Use hrId from props if provided, else fallback to sessionStorage
  const hrId = props.hrId || sessionStorage.getItem('userId');
  const [data, setData] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [candidatesLoading, setCandidatesLoading] = useState(false);

  useEffect(() => {
    if (!hrId) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/fetch/candidates/by-hr/${hrId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        // Group by companyId
        const grouped = {};
        res.data.forEach(candidate => {
          const job = candidate.jobId || {};
          const companyKey = job.companyId || 'Unknown';
          if (!grouped[companyKey]) {
            grouped[companyKey] = {
              companyName: job.companyName || 'Unknown',
              companyAddress: job.companyAddress || '',
              phoneNumber: job.phoneNumber || '',
              jobTitle: job.jobTitle || '',
              jobLocation: job.jobLocation || '',
              jobTiming: job.jobTiming || '',
              companyId: job.companyId || 'Unknown',
              candidates: []
            };
          }
          grouped[companyKey].candidates.push(candidate);
        });
        setData(Object.values(grouped));
        setSelectedCompany(Object.values(grouped)[0] || null);
      } catch (err) {
        setData([]);
      }
      setLoading(false);
    };
    fetchData();
  }, [hrId]);

  const companyColumns = [
    { field: 'companyName', headerName: 'Company Name', flex: 1 },
    { field: 'jobTitle', headerName: 'Job Title', flex: 1 },
    { field: 'jobLocation', headerName: 'Location', flex: 1 },
    {
      field: 'candidates',
      headerName: 'Candidates',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          startIcon={<VisibilityIcon />}
          onClick={(e) => {
            e.stopPropagation();
            setSelectedCompany(params.row);
            setCandidates(params.row.candidates);
            setModalOpen(true);
          }}
        >
          {params.row.candidates.length}
        </Button>
      ),
    },
  ];

  const candidateColumns = [
    { field: 'candidateName', headerName: 'Name', width: 160 },
    { field: 'candidateEmail', headerName: 'Email', width: 200 },
    { field: 'candidatePhone', headerName: 'Phone', width: 140 },
    { field: 'qualification', headerName: 'Qualification', width: 150 },
    { field: 'positionName', headerName: 'Position', width: 150 },
    { field: 'experience', headerName: 'Experience (Years)', width: 160, renderCell: (p) => p.value ? `${p.value} Years` : 'N/A' },
    { field: 'currentLocation', headerName: 'Location', width: 140 },
    { field: 'currentPosition', headerName: 'Current Position', width: 150 },
    { field: 'currentCTC', headerName: 'Current Monthly ₹', width: 150, renderCell: (p) => p.value ? `₹${p.value}` : 'N/A' },
    { field: 'expectedCTC', headerName: 'Expected Monthly ₹', width: 150, renderCell: (p) => p.value ? `₹${p.value}` : 'N/A' },
    { field: 'noticePeriod', headerName: 'Notice Period (Days)', width: 160, renderCell: (p) => p.value ? `${p.value} Days` : 'N/A' },
    { field: 'reasonforLeaving', headerName: 'Reason for Leaving', width: 180 },
    { field: 'currentCompany', headerName: 'Current Company', width: 150 },
    { field: 'remark', headerName: 'Remark', width: 150 },
    { field: 'resumeLink', headerName: 'Resume', width: 110, renderCell: params => params.row.resumeLink ? (<a href={params.row.resumeLink} target="_blank" rel="noopener noreferrer">View</a>) : '' },
  ];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6f8' }}>
      {/* Sidebar */}
      <Box sx={{
        position: 'fixed',
        top: 0,
        left: 0,
        bottom: 0,
        width: 250,
        bgcolor: '#212121',
        color: '#fff',
        zIndex: 1100
      }}>
        <Sidebar />
      </Box>

      {/* Main content area */}
      <Box sx={{ ml: '250px', flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Navbar */}
        <Box sx={{
          position: 'fixed',
          top: 0,
          left: '250px',
          right: 0,
          height: 64,
          bgcolor: '#fff',
          zIndex: 1000,
          boxShadow: 2
        }}>
          <Navbar />
        </Box>

        {/* Content Area */}
        <Box sx={{ mt: '64px', p: 3 }}>
          <Paper sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h5" gutterBottom>Companies</Typography>
            <Divider sx={{ mb: 3 }} />
            <div style={{ width: '100%' }}>
              <DataGrid
                rows={data}
                columns={companyColumns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                loading={loading}
                disableSelectionOnClick
                getRowId={(row) => row.companyId || `row-${Math.random().toString(36).substr(2, 9)}`}
                autoHeight={false}
                style={{ height: 'calc(100vh - 200px)' }}
                sx={{
                  bgcolor: '#fff',
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#1976d2',
                    color: 'black',
                    position: 'sticky',
                    top: 0,
                    zIndex: 1,
                  },
                  '& .MuiDataGrid-cell:hover': {
                    cursor: 'pointer',
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    overflow: 'auto',
                  },
                }}
              />
            </div>
          </Paper>
        </Box>
      </Box>

      {/* Candidates Modal */}
      <Dialog
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        maxWidth="xl"
        fullWidth
        sx={{ '& .MuiDialog-paper': { width: '95%', maxWidth: '1800px', maxHeight: '90vh' } }}
      >
        <DialogTitle>
          {selectedCompany?.companyName} - Candidates
          <IconButton
            onClick={() => setModalOpen(false)}
            sx={{
              position: 'absolute',
              right: 8,
              top: 8,
              color: (theme) => theme.palette.grey[500],
            }}
          >
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
          <Box sx={{ width: '100%', height: 'calc(90vh - 150px)', minHeight: '400px', display: 'flex', flexDirection: 'column' }}>
            <DataGrid
              rows={candidates}
              columns={candidateColumns}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              loading={candidatesLoading}
              disableSelectionOnClick
              getRowId={(row) => row._id || `candidate-${Math.random().toString(36).substr(2, 9)}`}
              autoHeight={false}
              sx={{
                flex: 1,
                '& .MuiDataGrid-main': {
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1,
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  position: 'sticky',
                  top: 0,
                  zIndex: 1,
                },
                '& .MuiDataGrid-virtualScroller': {
                  flex: 1,
                  overflow: 'auto',
                  minHeight: '200px',
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  wordWrap: 'break-word',
                },
                '& .MuiDataGrid-row': {
                  minHeight: 'auto !important',
                  maxHeight: 'none !important',
                },
                '& .MuiDataGrid-cellContent': {
                  whiteSpace: 'normal',
                  lineHeight: '1.2',
                  padding: '8px 0',
                },
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalOpen(false)} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
  
};

export default RecentData;
