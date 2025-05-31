import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { Box,TextField, Button,Tooltip } from '@mui/material';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import * as XLSX from 'xlsx';


const HRReport = () => {
const [rowData, setRowData] = useState([]);
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [filteredData, setFilteredData] = useState([]);


  useEffect(() => {
  axios.get('http://localhost:5000/api/interview/hr-company-candidates')
    .then((res) => {
      const flatRows = [];
      let idCounter = 1;

     res.data.forEach(hr => {
  hr.companies
    .filter(company => company.type === "JobOpening") // <-- ✅ FILTER here
    .forEach(company => {
      company.candidates.forEach(candidate => {
        flatRows.push({
          id: idCounter++,
          hrName: hr.hrName,
          companyName: company.companyName,
                    jobTitle: company.jobTitle,

          companyAddress: company.companyAddress,
          jobLocation: company.jobLocation,
          candidateName: candidate.name,
          candidateEmail: candidate.email,
          candidatePhone: candidate.phone,
          qualification: candidate.qualification,
          remark: candidate.remark,
          resumeLink: candidate.resumeLink,
          interviewDate: candidate.interviewDate,
          lineupStatus: candidate.lineupStatus,
          joiningDate: candidate.joiningDate,
        });
      });
    });
});

     

      setRowData(flatRows);
      setFilteredData(flatRows); // default
    })
    .catch((err) => {
      console.error("API error", err);
    });
}, []);


const handleFilter = () => {
  if (!startDate || !endDate) return;

  const start = new Date(startDate);
  const end = new Date(endDate);

  const filtered = rowData.filter(row => {
    if (!row.interviewDate) return false;
    const interview = new Date(row.interviewDate);
    return interview >= start && interview <= end;
  });

  setFilteredData(filtered);
};

const clearFilter = () => {
  setStartDate('');
  setEndDate('');
  setFilteredData(rowData);
};

 const handleExport = () => {
    const exportData = filteredData.map(row => ({
      'HR Name': row.hrName,
      'Company': row.companyName,
          'jobtitle': row.jobTitle,

      'Location': row.jobLocation,
      'Candidate': row.candidateName,
      'Email': row.candidateEmail,
      'Phone': row.candidatePhone,
      'Qualification': row.qualification,
      'Remark': row.remark,
      'Interview Date': row.interviewDate ? new Date(row.interviewDate).toLocaleDateString() : '',
      'Lineup Status': row.lineupStatus,
      'Joining Date': row.joiningDate ? new Date(row.joiningDate).toLocaleDateString() : ''
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'HR Report');

    XLSX.writeFile(wb, 'HR_Report.xlsx');
  };


const columns = [
  { field: 'hrName', headerName: 'HR Name', width: 150 },
  { field: 'companyName', headerName: 'Company Name', width: 150 },
    { field: 'jobTitle', headerName: 'Job Title', width: 150 },

    { field: 'companyAddress', headerName: 'Company Address', width: 150 },
  { field: 'jobLocation', headerName: 'Job Location', width: 130 },
  { field: 'candidateName', headerName: 'Candidate', width: 150 },
  { field: 'candidateEmail', headerName: 'Candidate Email', width: 200 },
  { field: 'candidatePhone', headerName: 'Candidate Phone', width: 150 },
  { field: 'qualification', headerName: 'Candidate Qualification', width: 200 },
  { field: 'remark', headerName: 'Remark', width: 150 },
 {
  field: 'resumeLink',
  headerName: 'Resume',
  width: 120,
  sortable: false,
  renderCell: (params) => {
    const value = params.value;
    if (!value) return 'N/A';

    return (
      <Tooltip title="View Resume" arrow placement="top">
        <Button
          variant="contained"
          color="secondary"
          size="small"
          onClick={() => window.open(value, '_blank')}
        >
          View
        </Button>
      </Tooltip>
    );
  },
},


  {
    field: 'interviewDate',
    headerName: 'Interview Date',
    width: 150,
    renderCell: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString(); // e.g. 25/05/2025
    },
  },

  { field: 'lineupStatus', headerName: 'Lineup Status', width: 150 },

  {
    field: 'joiningDate',
    headerName: 'Joining Date',
    width: 150,
    renderCell: (params) => {
      if (!params.value) return '';
      return new Date(params.value).toLocaleDateString();
    },
  },
];


  return (
      <div style={{ display: 'flex', height: '100vh',marginLeft:'-10px', backgroundColor: '#f5f5f5' }}>
          {/* Sidebar is fixed */}
          <div style={{ position: 'fixed',marginLeft:'-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
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

<div style={{ width: '100%', marginLeft: '10px' }}>
  <h2>HR-wise Company and Candidate Report</h2>

  <div style={{ marginBottom: '20px', display: 'flex', gap: '10px' }}>
  <TextField
    label="Start Date"
    type="date"
    InputLabelProps={{ shrink: true }}
    value={startDate}
    onChange={(e) => setStartDate(e.target.value)}
  />
  <TextField
    label="End Date"
    type="date"
    InputLabelProps={{ shrink: true }}
    value={endDate}
    onChange={(e) => setEndDate(e.target.value)}
  />
  <Button variant="contained" color="primary" onClick={handleFilter}>
    Filter
  </Button>
  <Button variant="outlined" color="secondary" onClick={clearFilter}>
    Clear
  </Button>
    <Button variant="contained" color="primary" onClick={handleExport}>
              Export to Excel
            </Button>
</div>


  <div
    style={{
      maxHeight: '600px',     // Maximum height limit
      overflowY: 'auto',      // Scroll only vertically when needed
    }}
  >
    <DataGrid
   rows={filteredData}
      columns={columns}
      autoHeight           // 👈 Automatically adjust height for few rows
      disableColumnMenu
      disableRowSelectionOnClick
      sx={{
        '& .MuiDataGrid-columnHeaders': {
          position: 'sticky',
          top: 0,
          backgroundColor: '#fff',
          zIndex: 1,
        },
      }}
    />
  </div>
</div>

    </Box>
    </div>

  );
};

export default HRReport;
