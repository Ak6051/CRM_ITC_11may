import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Modal, Paper, CircularProgress
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import Sidebar from '../../components/hr components/HrSidebar';
import Navbar from '../../components/hr components/HrNavbar';
import dayjs from 'dayjs';


const HRJobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedJobs, setParsedJobs] = useState([]);

  const isTokenExpired = (token) => {
    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const expiry = decoded.exp * 1000;  // Expiry time in milliseconds
      return expiry < Date.now();
    } catch (e) {
      return true;  // Token is invalid or expired
    }
  };

  // Fetch jobs from the backend


const fetchJobs = async () => {
  const token = sessionStorage.getItem('token');
  if (!token || isTokenExpired(token)) {
    alert('Session expired. Please log in again.');
    sessionStorage.removeItem('token');
    window.location.href = '/login';
    return;
  }

  setLoading(true);
  try {
    const res = await fetch('http://localhost:5000/api/allType/my-jobs', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error('Expected array but got:', typeof data);
      setJobs([]);
      return;
    }

    const filteredData = data.map((item) => ({
      id: item._id, // Use MongoDB ID
      industries:item.industries,
      companyName: item.companyName,
      companyAddress: item.companyAddress,
      contactName: item.contactName,
      email: item.email,
      phoneNumber: item.phoneNumber,
      jobTitle: item.jobTitle,
      numberOfRequirements: item.numberOfRequirements,
      keyResponsibility: item.keyResponsibility,
      requiredSkills: item.requiredSkills,
      education: item.education,
      experience: item.experience,
      salary: item.salary,
      jobLocation: item.jobLocation,
      description: item.description,
      descriptionFile: item.descriptionFile,
      agreementSigned: item.agreementSigned,
      websiteURL: item.websiteURL,
      createdAt: item.createdAt
        ? dayjs(item.createdAt).format('DD/MM/YYYY hh:mm A')
        : 'N/A', // Format local time
    }));

    // ✅ Optionally sort by latest date first
    const sortedData = filteredData.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    setJobs(sortedData);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
  }
  setLoading(false);
};


  // const handleFileUpload = (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = (evt) => {
  //     const bstr = evt.target.result;
  //     const wb = XLSX.read(bstr, { type: 'binary' });
  //     const wsname = wb.SheetNames[0];
  //     const ws = wb.Sheets[wsname];
  //     const data = XLSX.utils.sheet_to_json(ws);
  //     setParsedJobs(data);
  //     setUploadedFileName(file.name);
  //     setImportModalOpen(true);
  //   };
  //   reader.readAsBinaryString(file);
  // };

  // const handleConfirmImport = async () => {
  //   try {
  //     const token = sessionStorage.getItem('token');
  //     const res = await fetch('http://localhost:5000/api/allType/import', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         Authorization: `Bearer ${token}`,
  //       },
  //       body: JSON.stringify({ jobs: parsedJobs }),
  //     });

  //     if (res.ok) {
  //       alert('Jobs imported successfully!');
  //       setImportModalOpen(false);
  //       fetchJobs(); // Refresh
  //     } else {
  //       alert('Failed to import jobs.');
  //     }
  //   } catch (err) {
  //     console.error(err);
  //     alert('Error while importing jobs.');
  //   }
  // };

  useEffect(() => {
    fetchJobs();
  }, []);

const columns = [
    { field: 'industries', headerName: 'Industries', width: 180 },

  { field: 'companyName', headerName: 'Company Name', width: 180 },
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

  // 📄 Description: if PDF exists, show button, else show text
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

  // 📝 Agreement PDF
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

  // 🌐 Website URL
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

  // 🕐 Created At
  {
    field: 'createdAt',
    headerName: 'Created At',
    width: 180,
  },
];


  return (
    <div style={{ display: 'flex', minHeight: '100vh' }}>
      <div style={{
        position: 'fixed', left: 0, top: 0, height: '100vh', width: '250px',
        backgroundColor: '#3f51b5', color: 'white', zIndex: 1000,
      }}>
        <Sidebar />
      </div>

      <div style={{ flex: 1, marginLeft: '250px', width: 'calc(100% - 250px)' }}>
        <div style={{
          position: 'fixed', top: 0, right: 0, left: '250px',
          zIndex: 999, backgroundColor: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        }}>
          <Navbar />
        </div>

        <Box sx={{ pt: 12, px: 4 }}>
          <Paper elevation={3} sx={{ borderRadius: 3, p: 3 }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="h5" fontWeight="bold">Job Openings</Typography>
              {/* <Button variant="contained" component="label">
                Import from Excel
                <input hidden accept=".xlsx, .xls" type="file" onChange={handleFileUpload} />
              </Button> */}
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" mt={4}>
                <CircularProgress />
              </Box>
            ) : (
              <div style={{ height: 600, width: '100%' }}>
                <DataGrid
                  rows={jobs}
                  columns={columns}
                  pageSize={10}
                  rowsPerPageOptions={[10, 20, 50]}
                  getRowId={(row) => row.id}
                />
              </div>
            )}
          </Paper>
        </Box>
{/* 
        <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)}>
          <Box sx={{
            position: 'absolute',
            top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400, bgcolor: 'background.paper',
            boxShadow: 24, p: 4, borderRadius: 2, textAlign: 'center',
          }}>
            <Typography variant="h6" gutterBottom>Confirm Import</Typography>
            <Typography variant="body1">File: <strong>{uploadedFileName}</strong></Typography>
            <Typography variant="body2" gutterBottom>Are you sure you want to import this data?</Typography>
            <Box mt={3} display="flex" justifyContent="space-between">
              <Button variant="outlined" onClick={() => setImportModalOpen(false)}>Cancel</Button>
              <Button variant="contained" color="success" onClick={handleConfirmImport}>Import</Button>
            </Box>
          </Box>
        </Modal> */}
      </div>
    </div>
  );
};

export default HRJobList;
