import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import * as XLSX from 'xlsx';
import { Button } from '@mui/material';


const SalesOpeningData = () => {
  const [rows, setRows] = useState([]);
  const [hrList, setHrList] = useState([]);

useEffect(() => {
  const fetchHRs = async () => {
    const token = sessionStorage.getItem('token');
    const res = await axios.get("http://localhost:5000/api/panel/hr-users", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setHrList(res.data);
  };

  fetchHRs();
}, []);


  useEffect(() => {
   const fetchJobs = async () => {
  try {
    const token = sessionStorage.getItem('token'); // token get karo sessionStorage se

    const res = await axios.get('http://localhost:5000/api/panel/converted-jobs', {
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

  const handleExport = () => {
  const exportData = rows.map(row => {
    const { id, _id, __v, assignedHR, createdBy, ...rest } = row; // remove unwanted keys
    return {
      ...rest,
      Assigned_HR: assignedHR ? `${assignedHR.firstName} ${assignedHR.lastName}` : 'Not assigned',
      Created_By: createdBy ? `${createdBy.firstName} ${createdBy.lastName}` : 'Unknown',
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(exportData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "ConvertedJobs");

  XLSX.writeFile(workbook, "ConvertedJobs.xlsx");
};


  const columns = [
    {
  field: 'assignHR',
  headerName: 'Select HR',
  width: 200,
  renderCell: (params) => {
    return (
      <select
        defaultValue={params.row.assignedHR?._id || ""}
        onChange={async (e) => {
          const hrId = e.target.value;
          const jobId = params.row._id;

          if (!hrId) return;

          const token = sessionStorage.getItem('token');
          try {
            await axios.put(
              `http://localhost:5000/api/panel/assign-hr/${jobId}`,
              { hrId },
              { headers: { Authorization: `Bearer ${token}` } }
            );
            alert("HR assigned successfully");
          } catch (err) {
            console.error("Failed to assign HR:", err);
            alert("Assignment failed");
          }
        }}
      >
        <option value="">Select HR</option>
        {hrList.map((hr) => (
          <option key={hr._id} value={hr._id}>
            {hr.firstName} {hr.lastName}
          </option>
        ))}
      </select>
    );
  }
},
{
  field: 'assignedHR',
  headerName: 'Assigned HR',
  width: 180,
  renderCell: (params) => {
    const hr = params.row.assignedHR;
    if (!hr) return "Not assigned";
    return `${hr.firstName || ''} ${hr.lastName || ''}`.trim();
  }
},

{
  field: "createdBy",
  headerName: "Created By",
  width: 180,
  renderCell: (params) => {
    const user = params.row.createdBy;
    if (!user) return "Unknown";
    return `${user.firstName || ''} ${user.lastName || ''}`.trim();
  },
},

    { field: 'industries', headerName: 'Industries', width: 150 },
    { field: 'companyName', headerName: 'Company Name', width: 180 },
    { field: 'companyAddress', headerName: 'Company Address', width: 200 },
    { field: 'contactName', headerName: 'Contact Name', width: 160 },
    { field: 'phoneNumber', headerName: 'Phone', width: 140 },
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
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'numberOfRequirements', headerName: 'Requirements', width: 150 },
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
  field: 'description',
  headerName: 'Description',
  width: 200,
  renderCell: (params) => {
    const value = params.value;

    // Check if it's a PDF URL
    const isPdfLink = typeof value === 'string' &&
      (value.endsWith('.pdf') || value.includes('.pdf')) &&
      (value.startsWith('http://') || value.startsWith('https://'));

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
          View PDF
        </button>
      </a>
    ) : (
      <Typography variant="body2">
        {value || 'No Description'}
      </Typography>
    );
  }
},

    { field: 'jobLocation', headerName: 'Job Location', width: 150 },
    { field: 'remarks', headerName: 'Remarks', width: 200 },
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
    <Box sx={{ height: 600, width: '100%' }}>
   <Box sx={{ textAlign: 'left', paddingLeft: 2 }}>
  <Typography variant="h5" gutterBottom>
    Converted Jobs
  </Typography>
  

  <Box sx={{ width: '100%', overflowX: 'auto' }}>
    <Button
  variant="contained"
  color="primary"
  onClick={handleExport}
  sx={{ mb: 2 }}
>
  Export to Excel
</Button>

    <DataGrid
      rows={rows}
      columns={columns}
      pageSize={10}
      rowsPerPageOptions={[10, 20, 50]}
      autoHeight
    />
  </Box>


</Box>
</Box>
    </Box>
    </div>
  );
};

export default SalesOpeningData;
