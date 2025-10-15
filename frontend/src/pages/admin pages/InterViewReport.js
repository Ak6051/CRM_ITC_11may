import React, { useEffect, useState } from 'react';
import { DataGrid } from '@mui/x-data-grid';
import axios from 'axios';
import { Box, TextField, Button, Tooltip, Typography } from '@mui/material';
import { API_BASE_URL } from '../../config/api.config';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import * as XLSX from 'xlsx';


const formatDate = (dateString) => {
  if (!dateString) return '';
  return new Date(dateString).toLocaleDateString();
};

const HRReport = () => {
const [rowData, setRowData] = useState([]);
const [startDate, setStartDate] = useState('');
const [endDate, setEndDate] = useState('');
const [filteredData, setFilteredData] = useState([]);


  useEffect(() => {
  axios.get(`${API_BASE_URL}/interview/hr-company-candidates`)
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
          positionName: candidate.positionName,
          experience: candidate.experience,
          currentLocation: candidate.currentLocation,
          currentPosition: candidate.currentPosition,
          currentCTC: candidate.currentCTC,
          expectedCTC: candidate.expectedCTC,
          noticePeriod: candidate.noticePeriod,
          reasonforLeaving: candidate.reasonforLeaving,
          currentCompany: candidate.currentCompany,
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
      'Position Name': row.positionName,
      'Experience': row.experience,
      'Current Location': row.currentLocation,
      'Current Position': row.currentPosition,
      'Current CTC': row.currentCTC,
      'Expected CTC': row.expectedCTC,
      'Notice Period': row.noticePeriod,
      'Reason for Leaving': row.reasonforLeaving,
      'Current Company': row.currentCompany,
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
  { field: 'positionName', headerName: 'Position Name', width: 150 },
  { field: 'experience', headerName: 'Experience', width: 150 },
  { field: 'currentLocation', headerName: 'Current Location', width: 150 },
  { field: 'currentPosition', headerName: 'Current Position', width: 150 },
  { field: 'currentCTC', headerName: 'Current CTC', width: 150 },
  { field: 'expectedCTC', headerName: 'Expected CTC', width: 150 },
  { field: 'noticePeriod', headerName: 'Notice Period', width: 150 },
  { field: 'reasonforLeaving', headerName: 'Reason for Leaving', width: 150 },
  { field: 'currentCompany', headerName: 'Current Company', width: 150 },
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
  {
    field: 'selectionStatus',
    headerName: 'Selection Status',
    width: 150,
    renderCell: (params) => (
      <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
    ),
  },
  {
    field: 'selectionDate',
    headerName: 'Selection Date',
    width: 150,
    renderCell: (params) => (
      <Typography sx={{ fontSize: '0.875rem' }}>{formatDate(params.value)}</Typography>
    ),
  },
  {
    field: 'salaryOffered',
    headerName: 'Salary Offered',
    width: 150,
    renderCell: (params) => (
      <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
    ),
  },

  {
    field: 'offerStatus',
    headerName: 'Offer Status',
    width: 150,
    renderCell: (params) => (
      <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
    ),
  },
  {
    field: 'lineupStatus',
    headerName: 'Lineup Status',
    width: 150,
    renderCell: (params) => (
      <Typography sx={{ fontSize: '0.875rem' }}>{params.value}</Typography>
    ),
  },

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
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar is fixed */}
      <div style={{ 
        position: 'fixed',
        height: '100vh', 
        width: '250px', 
        backgroundColor: '#3f51b5', 
        color: 'white',
        overflowY: 'auto'
      }}>
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

        <div style={{ 
          width: 'calc(100% - 40px)',
          margin: '0 20px',
          height: 'calc(100vh - 120px)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden'
        }}>
          <h2>HR-wise Company and Candidate Report</h2>

          
          <div style={{ 
            margin: '10px 0 20px', 
            display: 'flex', 
            gap: '10px',
            flexWrap: 'wrap'
          }}>
            <TextField
              label="Start Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <TextField
              label="End Date"
              type="date"
              size="small"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleFilter}
              size="small"
            >
              Filter
            </Button>
            <Button 
              variant="outlined" 
              color="secondary" 
              onClick={clearFilter}
              size="small"
            >
              Clear
            </Button>
            <Button 
              variant="contained" 
              color="primary" 
              onClick={handleExport}
              size="small"
            >
              Export to Excel
            </Button>
          </div>

          <div style={{ 
            flex: 1,
            width: '100%',
            minHeight: 0,
            backgroundColor: 'white',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <DataGrid
              rows={filteredData}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[10]}
              disableSelectionOnClick
              sx={{
                '& .MuiDataGrid-main': {
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                },
                '& .MuiDataGrid-virtualScroller': {
                  flexGrow: 1,
                },
                '& .MuiDataGrid-columnHeaders': {
                  position: 'sticky',
                  top: 0,
                  backgroundColor: '#f5f5f5',
                  zIndex: 1,
                },
                '& .MuiDataGrid-row': {
                  '&:hover': {
                    backgroundColor: 'rgba(0, 0, 0, 0.04)',
                  },
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
