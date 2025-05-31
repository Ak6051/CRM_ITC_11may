import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  IconButton,
  Button
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import dayjs from 'dayjs';

const HRCompanyCandidateReport = () => {
  const { hrId } = useParams();
  const [data, setData] = useState({
    jobOpenings: [],
    candidates: [],
  });

  const [selectedCompanyJobId, setSelectedCompanyJobId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`http://localhost:5000/api/allType/hr/${hrId}/assigned-data`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setData(res.data);
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
  };

  const jobColumns = [
    {
      field: 'companyName',
      headerName: 'Company Name',
      width: 200,
      renderCell: (params) => (
        <span
          onClick={() => handleCompanyClick(params.row._id)}
          style={{ cursor: 'pointer', color: 'blue' }}
        >
          {params.row.companyName}
        </span>
      )
    },
    { field: 'industries', headerName: 'Industries', width: 180 },
    { field: 'companyAddress', headerName: 'Company Address', width: 180 },
    { field: 'contactName', headerName: 'Contact Name', width: 150 },
    { field: 'email', headerName: 'Email', width: 180 },
    { field: 'phoneNumber', headerName: 'Phone Number', width: 150 },
    { field: 'jobTitle', headerName: 'Job Title', width: 150 },
    { field: 'numberOfRequirements', headerName: 'No. of Requirements', width: 170 },
    { field: 'keyResponsibility', headerName: 'Key Responsibility', width: 200 },
    { field: 'requiredSkills', headerName: 'Required Skills', width: 200 },
    { field: 'education', headerName: 'Education', width: 150 },
    { field: 'experience', headerName: 'Experience', width: 150 },
    { field: 'salary', headerName: 'Salary', width: 150 },
    { field: 'jobLocation', headerName: 'Job Location', width: 150 },

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
        } else {
          return <span>{params.row.description || 'N/A'}</span>;
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
    { field: 'candidateName', headerName: 'Name', width: 150 },
    { field: 'candidateEmail', headerName: 'Email', width: 200 },
    { field: 'candidatePhone', headerName: 'Phone', width: 150 },
    { field: 'qualification', headerName: 'Qualification', width: 150 },
    { field: 'remark', headerName: 'Remark', width: 200 },
    {
      field: 'resumeLink',
      headerName: 'Resume',
      width: 120,
      sortable: false,
      renderCell: (params) => {
        if (!params.value) return 'N/A';
        return (
          <Button
            variant="contained"
            color="secondary"
            size="small"
            onClick={() => window.open(params.value, '_blank')}
          >
            View
          </Button>
        );
      },
    },

    {
      field: 'interviewDate',
      headerName: 'Interview Date',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    {
      field: 'joiningDate',
      headerName: 'Joining Date',
      width: 150,
      renderCell: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    { field: 'lineupStatus', headerName: 'Lineup Status', width: 150 },
    { field: 'candidateRemarks', headerName: 'Candidate Remarks', width: 200 },
  ];

  const getCandidateRows = () => {
    return data.candidates
      .filter((c) => c.jobId === selectedCompanyJobId)
      .map((c) => ({ ...c, id: c._id }));
  };

  const getJobRows = (jobs) => {
    return jobs.map((job) => ({
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

          <Typography variant="h5" sx={{ mt: 2, mb: 1 }}>
            📂 Active Job Openings
          </Typography>

          {/* JOB GRID: using your Job Report grid format */}
         <Box
  sx={{
    flexGrow: 1,
    height: '600px',
    overflowX: 'auto', // ✅ enable horizontal scroll
    overflowY: 'hidden', // or auto, as needed
    display: 'flex',
    flexDirection: 'column'
  }}
>
  <Box
    sx={{
      minWidth: 'fit-content', // ✅ allow width to expand with content
    }}
  >

    <DataGrid
      rows={getJobRows(data.jobOpenings)}
      columns={jobColumns}
      components={{ Toolbar: GridToolbar }}
      pageSize={10}
      rowsPerPageOptions={[10, 25, 50]}
      checkboxSelection
      disableRowSelectionOnClick
      autoHeight={false} // must be false to enable internal scrolling
      sx={{
        minWidth: 1500, // optional, if columns overflow horizontally
        '& .MuiDataGrid-columnHeaders': {
          position: 'sticky',
          top: 0,
          backgroundColor: '#f5f5f5',
          zIndex: 2,
          borderBottom: '2px solid #e0e0e0',
        },
      }}
    />
  </Box>
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
        maxWidth="lg"
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          👤 Candidates for Selected Job
          <IconButton onClick={handleCloseDialog}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent>
         <Box sx={{ 
  width: '95%',
  height: '400px',
  margin: '0 auto',
  overflowX: 'auto',  // ✅ enable horizontal scroll
  overflowY: 'hidden',
  minWidth: 'fit-content', // ✅ let content control width
}}>

            <DataGrid
              rows={getCandidateRows()}
              columns={candidateColumns}
              pageSize={5}
              rowsPerPageOptions={[5]}
              autoHeight={false}
              sx={{
                height: '100%',
                '& .MuiDataGrid-main': {
                  overflow: 'visible'
                },
                '& .MuiDataGrid-virtualScroller': {
                  overflow: 'auto !important',
                  minHeight: '100%'
                },
                '& .MuiDataGrid-virtualScrollerContent': {
                  minWidth: '100%'
                },
                '& .MuiDataGrid-columnHeaders': {
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f5f5f5',
                  zIndex: 2,
                  borderBottom: '2px solid #e0e0e0'
                },
                '& .MuiDataGrid-columnHeader': {
                  backgroundColor: '#f5f5f5',
                  fontWeight: 'bold',
                  whiteSpace: 'normal',
                  lineHeight: 'normal',
                  padding: '8px'
                },
                '& .MuiDataGrid-cell': {
                  whiteSpace: 'normal',
                  lineHeight: 'normal',
                  padding: '8px'
                },
                '& .MuiDataGrid-columnHeadersInner': {
                  backgroundColor: '#f5f5f5'
                }
              }}
            />
          </Box>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default HRCompanyCandidateReport;
