import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { Box, Typography } from '@mui/material';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';

const ConvertedJobsTable = () => {
  const [rows, setRows] = useState([]);

  useEffect(() => {
    const fetchJobs = async () => {
      try {
        const token = sessionStorage.getItem('token'); // token get karo sessionStorage se

        const res = await axios.get(`${API_BASE_URL}/panel/converted-jobs`, {
          headers: {
            Authorization: `Bearer ${token}`,  // token ko header me bhejo
          }
        });

        const dataWithIds = res.data.map((item, index) => ({
          id: item._id || index,
          ...item,
        }));
        setRows(dataWithIds);
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };


    fetchJobs();
  }, []);

  const columns = [
    { field: 'industries', headerName: 'Industries', width: 150 },
    { field: 'companyName', headerName: 'Company Name', width: 180 },
    { field: 'companyAddress', headerName: 'Company Address', width: 200 },
    { field: 'contactName', headerName: 'Contact Name', width: 160 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phoneNumber', headerName: 'Phone', width: 140 },
    { field: 'response', headerName: 'Response', width: 140 },
    { field: 'jobTitle', headerName: 'Job Title', width: 140 },
    
    { field: 'benefits', headerName: 'Benefits', width: 140 },
    { field: 'numberOfRequirements', headerName: 'Requirements', width: 150 },

    {
      field: 'websiteURL',
      headerName: 'Website',
      width: 180,
      renderCell: (params) => (
        <a
          href={params.value}
          target="_blank"
          rel="noopener noreferrer"
          style={{ color: '#1976d2', textDecoration: 'underline' }}
        >
          {params.value}
        </a>
      ),
    },
    { field: 'keyResponsibility', headerName: 'Key Responsibility', width: 150 },
    { field: 'requiredSkills', headerName: 'Required Skills', width: 150 },
    { field: 'education', headerName: 'Education', width: 150 },
    { field: 'experience', headerName: 'Experience', width: 150 },
    { field: 'salary', headerName: 'Salary', width: 150 },
    { field: 'jobLocation', headerName: 'Job Location', width: 150 },
    { field: 'jobTiming', headerName: 'Job Timing', width: 150 },
    { field: 'gender', headerName: 'Gender', width: 150 },
    { field: 'remarks', headerName: 'Remarks', width: 200 },

    {
      field: 'agreementSigned',
      headerName: 'Agreement Signed',
      width: 150,
      renderCell: (params) => {
        const value = params.value;

        // Check if value looks like a PDF URL
        const isPdfLink = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));

        return isPdfLink ? (
          <a
            href={value}
            target="_blank"
            rel="noopener noreferrer"
            style={{ textDecoration: 'none' }}
          >
            <button style={{
              backgroundColor: '#1976d2',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              padding: '4px 8px',
              cursor: 'pointer'
            }}>
              View
            </button>
          </a>
        ) : (
          <span>{value || 'No'}</span>
        );
      }
    },

    {
      field: 'descriptionFile',
      headerName: 'Job Description (PDF)',
      width: 200,
      renderCell: (params) => {
        const fileUrl = params.row.descriptionFile;
        return fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'underline' }}
          >
            View PDF
          </a>
        ) : (
          <span>N/A</span>
        );
      },
    },
    // {
    //   field: 'description',
    //   headerName: 'Job Description (Text)',
    //   width: 300,
    //   renderCell: (params) => {
    //     const text = params.row.description;
    //     return text ? (
    //       <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
    //         {text}
    //       </span>
    //     ) : (
    //       <span>N/A</span>
    //     );
    //   },
    // },
    

    {
      field: 'convertedAt',
      headerName: 'Converted At',
      width: 200,
      renderCell: (params) => {
        const value = params.value;
        if (!value) return 'N/A';

        const date = new Date(value);
        if (isNaN(date)) return 'N/A';

        return date.toLocaleString('en-IN', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        });
      }
    }


  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
          <Sidebar />
        </div>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
          <Navbar />
        <Box sx={{ 
          flex: 1, 
          display: 'flex', 
          flexDirection: 'column',
          minHeight: 0, // Important for proper scrolling
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
          padding: '16px',
          width: 'calc(100% - 32px)' // Account for padding
        }}>
          <Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600, color: '#333' }}>
            Converted Jobs
          </Typography>

          <Box sx={{ 
            flex: 1, 
            width: '100%',
            height: '90%',
            '& .MuiDataGrid-root': {
              border: 'none',
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderBottom: '1px solid #e0e0e0',
              },
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid #f0f0f0',
              },
              '& .MuiDataGrid-virtualScroller': {
                overflowX: 'auto',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(0, 0, 0, 0.04)',
              },
            },
          }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10, 20, 50]}
              disableSelectionOnClick
              disableColumnMenu
              sx={{
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                  color: '#333',
                },
                '& .MuiDataGrid-cell:focus': {
                  outline: 'none',
                },
              }}
              components={{
                LoadingOverlay: () => (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                    Loading...
                  </Box>
                ),
                NoRowsOverlay: () => (
                  <Box display="flex" justifyContent="center" alignItems="center" height="100%" color="#666">
                    No data available
                  </Box>
                ),
              }}
            />
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default ConvertedJobsTable;
