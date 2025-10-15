import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { Box, Typography } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { API_BASE_URL } from '../../config/api.config';
import Sidebar from '../../components/admin components/AdminSidebar';
import Navbar from '../../components/admin components/AdminNavbar';


const SalesLeadsPage = () => {
  const { salesId, salesName } = useParams();
  const [leads, setLeads] = useState([]);
  const [salesPerson, setSalesPerson] = useState({});
  const [todayLeadsCount, setTodayLeadsCount] = useState(0);
  const [yesterdayLeadsCount, setYesterdayLeadsCount] = useState(0);
  const [todayLeads, setTodayLeads] = useState([]);
  const [yesterdayLeads, setYesterdayLeads] = useState([]);
  const [highlightedRows, setHighlightedRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const highlightLeads = (leadsToHighlight, type) => {
    if (!leadsToHighlight || leadsToHighlight.length === 0) return;
    
    // If clicking the same type again, clear highlights
    if (highlightedRows[0] === type) {
      setHighlightedRows([]);
      return;
    }
    
    // Set the first element as the type for tracking active highlight
    const ids = [type, ...leadsToHighlight.map(lead => lead._id || lead.id)];
    setHighlightedRows(ids);
    
    // Scroll to the first highlighted row
    if (leadsToHighlight.length > 0) {
      const firstRowId = leadsToHighlight[0]._id || leadsToHighlight[0].id;
      const rowElement = document.querySelector(`[data-id="${firstRowId}"]`);
      if (rowElement) {
        rowElement.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  };

  const clearHighlights = () => {
    setHighlightedRows([]);
  };

  useEffect(() => {
    if (!salesId) {
      setError('No sales ID found in URL');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const token = sessionStorage.getItem('token');
        if (!token) {
          throw new Error('No authentication token found');
        }

        // Fetch sales person details
        const [salesRes, leadsRes] = await Promise.all([
          axios.get(`${API_BASE_URL}/panel/sales-users`, {
            headers: { Authorization: `Bearer ${token}` }
          }),
          axios.get(`${API_BASE_URL}/panel/leads/${salesId}`, {
            headers: { Authorization: `Bearer ${token}` },
            params: { sort: '-createdAt' }
          })
        ]);

        // Set sales person data
        const salesPersonData = salesRes.data.find(s => s._id === salesId);
        if (salesPersonData) {
          setSalesPerson(salesPersonData);
        } else {
          throw new Error('Sales person not found');
        }

        // Process leads data
        const sortedLeads = Array.isArray(leadsRes.data) 
          ? [...leadsRes.data].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          : [];
        
        setLeads(sortedLeads);
        
        // Calculate today's and yesterday's leads count
        const today = new Date();
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        const todayStr = today.toDateString();
        const yesterdayStr = yesterday.toDateString();
        
        const todaysLeads = sortedLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt).toDateString();
          return leadDate === todayStr;
        });
        
        const yesterdaysLeads = sortedLeads.filter(lead => {
          const leadDate = new Date(lead.createdAt).toDateString();
          return leadDate === yesterdayStr;
        });

        setTodayLeadsCount(todaysLeads.length);
        setYesterdayLeadsCount(yesterdaysLeads.length);
        setTodayLeads(todaysLeads);
        setYesterdayLeads(yesterdaysLeads);
        
      } catch (err) {
        console.error('Error fetching data:', err);
        setError(
          err.response?.data?.message || 
          err.message || 
          'An error occurred while fetching data'
        );
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [salesId]);

  const columns = [
    { field: 'companyId', headerName: 'Company ID', width: 120 },
    { field: 'companyName', headerName: 'Company Name', width: 180 },
    { field: 'companyAddress', headerName: 'Address', width: 200 },
    { field: 'contactName', headerName: 'Contact Person', width: 150 },
    { field: 'email', headerName: 'Email', width: 200 },
    { field: 'phoneNumber', headerName: 'Phone', width: 130 },
    { field: 'industries', headerName: 'Industry', width: 150 },
    { field: 'jobTitle', headerName: 'Job Title', width: 150 },
    { field: 'numberOfRequirements', headerName: 'Requirements', width: 120 },
    { field: 'jobLocation', headerName: 'Location', width: 150 },
    { field: 'jobTiming', headerName: 'Job Timing', width: 120 },
    { field: 'gender', headerName: 'Gender', width: 100 },
    { field: 'experience', headerName: 'Experience', width: 120 },
    { field: 'salary', headerName: 'Salary', width: 120 },
    { field: 'education', headerName: 'Education', width: 150 },
    { field: 'websiteURL', headerName: 'Website', width: 150, renderCell: (params) => (
      <a href={params.value} target="_blank" rel="noopener noreferrer">Visit</a>
    )},
    { field: 'agreementSigned', headerName: 'Agreement', width: 100, renderCell: (params) => (
      params.value ? (
        <a href={params.value} target="_blank" rel="noopener noreferrer">View</a>
      ) : 'N/A'
    ) },
    { field: 'response', headerName: 'Response', width: 150 },
    { field: 'remarks', headerName: 'Remarks', width: 200 },
    { field: 'reminderDate', headerName: 'Reminder', width: 150, renderCell: (params) => 
      params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    { field: 'rescheduledDate', headerName: 'Rescheduled Date', width: 150, renderCell: (params) => 
      params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
    },
    { field: 'rescheduleReason', headerName: 'Reschedule Reason', width: 150, renderCell: (params) => 
      params.value ? params.value : 'N/A'
    },
    { field: 'createdAt', headerName: 'Created On', width: 150, renderCell: (params) => 
      params.value ? new Date(params.value).toLocaleString() : 'N/A'
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
    <Box p={3}>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" gutterBottom>
          Leads Generated by: {salesPerson.name || salesPerson.firstName} {salesPerson.lastName}
        </Typography>
          <Box display="flex" gap={3}>
            <Box 
              textAlign="center" 
              p={2} 
              bgcolor="#f5f5f5" 
              borderRadius={2} 
              boxShadow={1} 
              minWidth={120}
              onClick={clearHighlights}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#e0e0e0' } }}
            >
              <Typography variant="subtitle2" color="textSecondary">Total Leads</Typography>
              <Typography variant="h6" color="primary">{leads.length}</Typography>
            </Box>
            <Box 
              textAlign="center" 
              p={2} 
              bgcolor={highlightedRows.length > 0 && highlightedRows[0] === 'today' ? '#c8e6c9' : '#e8f5e9'} 
              borderRadius={2} 
              boxShadow={1} 
              minWidth={120}
              onClick={() => highlightLeads(todayLeads, 'today')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#c8e6c9' } }}
            >
              <Typography variant="subtitle2" color="textSecondary">Today's Leads</Typography>
              <Typography variant="h6" color="success.main">{todayLeadsCount}</Typography>
            </Box>
            <Box 
              textAlign="center" 
              p={2} 
              bgcolor={highlightedRows.length > 0 && highlightedRows[0] === 'yesterday' ? '#bbdefb' : '#e3f2fd'} 
              borderRadius={2} 
              boxShadow={1} 
              minWidth={120}
              onClick={() => highlightLeads(yesterdayLeads, 'yesterday')}
              sx={{ cursor: 'pointer', '&:hover': { bgcolor: '#bbdefb' } }}
            >
              <Typography variant="subtitle2" color="textSecondary">Yesterday's Leads</Typography>
              <Typography variant="h6" color="info.main">{yesterdayLeadsCount}</Typography>
            </Box>
          </Box>
      </Box>

      <Box mt={2} sx={{ height: 700, width: '100%', position: 'relative' }}>
        {loading ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography>Loading leads data...</Typography>
          </Box>
        ) : error ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%" color="error.main">
            <Typography>{error}</Typography>
          </Box>
        ) : leads.length === 0 ? (
          <Box display="flex" justifyContent="center" alignItems="center" height="100%">
            <Typography>No leads found for this sales person</Typography>
          </Box>
        ) : (
          <DataGrid
            rows={leads}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[5, 10, 20]}
            disableSelectionOnClick
            getRowId={(row) => row._id || row.companyId || Math.random().toString(36).substr(2, 9)}
            getRowClassName={(params) => {
              const idsToHighlight = highlightedRows.slice(1);
              const isHighlighted = idsToHighlight.includes(params.row._id) || 
                                 idsToHighlight.includes(params.row.id);
              return isHighlighted ? 'highlighted-row' : '';
            }}
            loading={loading}
          />
        )}
        <style>
          {`
            .highlighted-row {
              background-color: #fff9c4 !important;
              font-weight: 500;
            }
            .highlighted-row:hover {
              background-color: #fff59d !important;
            }
          `}
        </style>
      </Box>
    </Box>
    </Box>
    </div>
  );
};

export default SalesLeadsPage;
