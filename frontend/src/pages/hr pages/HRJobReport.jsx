import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Paper, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Chip, Tooltip, Drawer
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import Sidebar from '../../components/hr components/HrSidebar';
import Navbar from '../../components/hr components/HrNavbar';
import dayjs from 'dayjs';
import { API_BASE_URL } from '../../config/api.config';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import BusinessIcon from '@mui/icons-material/Business';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import FactoryIcon from '@mui/icons-material/Factory';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import LocationCityIcon from '@mui/icons-material/LocationCity';
import PinDropIcon from '@mui/icons-material/PinDrop';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LanguageIcon from '@mui/icons-material/Language';
import MapIcon from '@mui/icons-material/Map';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import DescriptionIcon from '@mui/icons-material/Description';
import HRJobForm from './JobPostingForm';
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const HRJobList = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedJobs, setParsedJobs] = useState([]);
  const [createJobDialogOpen, setCreateJobDialogOpen] = useState(false);
  const [detailPanel, setDetailPanel] = useState({ open: false, row: null, view: 'company' });

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
    const res = await fetch(`${API_BASE_URL}/allType/my-jobs`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    const data = await res.json();

    if (!Array.isArray(data)) {
      console.error('Expected array but got:', typeof data);
      setJobs([]);
      return;
    }

    const filteredData = data.map((item) => ({
      id: item._id,
      _id: item._id,
      // Company fields (prefixed co_)
      companyName: item.companyName,
      companyId: item.companyId,
      co_companyAddress: item.companyAddress,
      co_area: item.Area,
      co_city: item.city,
      co_contactPerson: item.contactName,
      co_contactNumber2: item.phoneNumber,
      co_email: item.email,
      co_websiteUrl: item.websiteURL,
      co_industries: item.industries,
      co_gstUpload: item.gstUpload,
      co_agreementUpload: item.agreementSigned,
      co_gpsLocation: item.gpsLocation,
      co_tokenAmount: item.tokenAmount,
      // Branch fields (prefixed br_)
      branchId: item.branchId,
      br_branchName: item.branchName,
      br_branchAddress: item.branchAddress,
      br_area: item.branchArea,
      br_city: item.branchCity,
      br_contactPerson: item.branchContactPerson,
      br_contactNumber: item.branchContactNumber,
      br_email: item.branchEmail,
      br_gpsLocation: item.branchGpsLocation,
      // Job fields
      industries: item.industries,
      jobTitle: item.jobTitle,
      numberOfRequirements: item.numberOfRequirements,
      keyResponsibility: item.keyResponsibility,
      requiredSkills: item.requiredSkills,
      education: item.education,
      experience: item.experience,
      salary: item.salary,
      jobLocation: item.jobLocation,
      jobTiming: item.jobTiming,
      gender: item.gender,
      approvalStatus: item.approvalStatus,
      descriptionFile: item.descriptionFile,
      agreementSigned: item.agreementSigned,
      gstUpload: item.gstUpload,
      websiteURL: item.websiteURL,
      response: item.response,
      benefits: item.benefits,
      createdAt: item.createdAt
        ? dayjs(item.createdAt).format('DD/MM/YYYY hh:mm A')
        : 'N/A',
    }));

    const sortedData = filteredData.sort((a, b) =>
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    setJobs(sortedData);
  } catch (error) {
    console.error('Failed to fetch jobs:', error);
  }
  setLoading(false);
};


  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);
      setParsedJobs(data);
      setUploadedFileName(file.name);
      setImportModalOpen(true);
    };
    reader.readAsBinaryString(file);
  };

  const handleConfirmImport = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const options = {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobs: parsedJobs })
      };

      const res = await fetch(`${API_BASE_URL}/allType/import`, options);

      if (res.ok) {
        alert('Jobs imported successfully!');
        setImportModalOpen(false);
        fetchJobs(); // Refresh
      } else {
        alert('Failed to import jobs.');
      }
    } catch (err) {
      console.error(err);
      alert('Error while importing jobs.');
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

const columns = [
  {
    field: 'approvalStatus',
    headerName: 'Status',
    width: 130,
    renderCell: (params) => {
      const status = params.row.approvalStatus || 'Approved';
      let color = 'warning';
      let label = 'Pending';
      if (status === 'Approved') {
        color = 'success';
        label = 'Accepted';
      } else if (status === 'Rejected') {
        color = 'error';
        label = 'Rejected';
      }
      return <Chip label={label} color={color} size="small" variant="outlined" />;
    }
  },
  {
    field: 'companyName',
    headerName: 'Company / Branch',
    width: 260,
    renderCell: (params) => {
      const row = params.row;
      const hasBranch = !!row.br_branchName;
      return (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, width: '100%', overflow: 'hidden' }}>
          {/* Company name � clickable */}
          <Tooltip title={`Click to view company details`} arrow>
            <span
              onClick={(e) => { e.stopPropagation(); setDetailPanel({ open: true, row, view: 'company' }); }}
              style={{
                color: '#3f51b5', fontWeight: 600, fontSize: '0.82rem',
                cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                textDecoration: 'underline', textDecorationStyle: 'dotted',
              }}
            >
              {row.companyName || '�'}
            </span>
          </Tooltip>
          {/* Branch chip � only when job was created against a branch */}
          {hasBranch && (
            <Tooltip title={`Click to view branch details`} arrow>
              <Chip
                label={row.br_branchName}
                size="small"
                onClick={(e) => { e.stopPropagation(); setDetailPanel({ open: true, row, view: 'branch' }); }}
                sx={{
                  bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700,
                  fontSize: '0.68rem', height: 20, cursor: 'pointer',
                  flexShrink: 0,
                  '&:hover': { bgcolor: '#c8e6c9' },
                }}
              />
            </Tooltip>
          )}
        </Box>
      );
    },
  },
  {
    field: 'jobTitle',
    headerName: 'Job Title',
    width: 180,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'numberOfRequirements',
    headerName: 'No. of Requirements',
    width: 170,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'salary',
    headerName: 'Salary',
    width: 150,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'jobTiming',
    headerName: 'Job Timing',
    width: 150,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'jobLocation',
    headerName: 'Job Location',
    width: 150,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'education',
    headerName: 'Education',
    width: 150,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'experience',
    headerName: 'Experience',
    width: 150,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'createdAt',
    headerName: 'Created At',
    width: 180,
    renderCell: (params) => {
      const formattedDate = params.value || '';
      return (
        <Tooltip title={formattedDate} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {formattedDate}
          </div>
        </Tooltip>
      );
    }
  },
  {
    field: 'response',
    headerName: 'Response',
    width: 150,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
  {
    field: 'benefits',
    headerName: 'Benefits',
    width: 150,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
  },
];


  return (
    <>
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f8', overflow: 'hidden' }}>
      <ToastContainer position="top-right" autoClose={3000} />

      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5' }}>
        <Sidebar />
      </div>

      <Box sx={{ flexGrow: 1, marginLeft: '250px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

          {/* -- Header Card -- */}
          <Box sx={{
            background: "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)",
            borderRadius: "16px",
            p: 3,
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 32px rgba(63,81,181,0.25)",
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{
                width: 52, height: 52, borderRadius: "14px",
                bgcolor: "rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <AddIcon sx={{ color: "#fff", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.3px">
                  Job Openings
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.3 }}>
                  Manage your job postings
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              {/* Total count */}
              <Box sx={{
                bgcolor: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "12px", px: 2.5, py: 1, textAlign: "center",
              }}>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                  {jobs.length}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.8)", fontWeight: 600, mt: 0.2 }}>
                  Total Jobs
                </Typography>
              </Box>

              {/* Create Job Button */}
              <Button
                variant="contained"
                startIcon={<AddIcon />}
                onClick={() => setCreateJobDialogOpen(true)}
                sx={{
                  bgcolor: 'rgba(255,255,255,0.18)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '12px',
                  textTransform: 'none',
                  px: 3,
                  py: 1.2,
                  border: '2px solid rgba(255,255,255,0.3)',
                  '&:hover': { 
                    bgcolor: 'rgba(255,255,255,0.25)',
                    border: '2px solid rgba(255,255,255,0.5)',
                  },
                  transition: 'all 0.3s ease',
                }}
              >
                Create Job
              </Button>

              {/* Import Excel Button */}
              <Button 
                variant="outlined" 
                component="label"
                startIcon={<UploadFileIcon />}
                sx={{
                  borderRadius: '12px',
                  textTransform: 'none',
                  fontWeight: 600,
                  px: 3,
                  py: 1.2,
                  borderColor: 'rgba(255,255,255,0.4)',
                  color: '#fff',
                  border: '2px solid rgba(255,255,255,0.4)',
                  '&:hover': {
                    borderColor: 'rgba(255,255,255,0.6)',
                    bgcolor: 'rgba(255,255,255,0.1)',
                    border: '2px solid rgba(255,255,255,0.6)',
                  },
                }}
              >
                Import Excel
                <input hidden accept=".xlsx, .xls" type="file" onChange={handleFileUpload} />
              </Button>
            </Box>
          </Box>

          {/* -- DataGrid Card -- */}
          <Box sx={{
            bgcolor: "#fff",
            border: "1px solid #e8eaf6",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(63,81,181,0.08)",
            height: "calc(100vh - 240px)",
          }}>
            {/* Table header bar */}
            <Box sx={{
              px: 3, py: 1.5,
              background: "linear-gradient(135deg, #e8eaf6, #f3f4fd)",
              borderBottom: "1px solid #c5cae9",
              display: "flex", alignItems: "center", justifyContent: "space-between",
            }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 4, height: 18, bgcolor: "#3f51b5", borderRadius: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" textTransform="uppercase" letterSpacing="0.06em">
                  All Job Openings
                </Typography>
              </Box>
              <Chip
                label={`${jobs.length} records`}
                size="small"
                sx={{ bgcolor: "#e8eaf6", color: "#3f51b5", fontWeight: 700, fontSize: "0.75rem" }}
              />
            </Box>

            {loading ? (
              <Box display="flex" justifyContent="center" alignItems="center" height="100%">
                <CircularProgress sx={{ color: '#3f51b5' }} size={60} />
              </Box>
            ) : (
              <DataGrid
                rows={jobs}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50]}
                getRowId={(row) => row.id}
                sx={{
                  border: "none",
                  height: "calc(100% - 52px)",
                  "& .MuiDataGrid-columnHeaders": {
                    background: "linear-gradient(135deg, #e8eaf6, #f3f4fd)",
                    borderBottom: "2px solid #c5cae9",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 700,
                    color: "#3f51b5",
                    fontSize: "0.78rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #f0f2ff",
                    fontSize: "0.83rem",
                    color: "#334155",
                    "&:focus": { outline: "none" },
                  },
                  "& .MuiDataGrid-row:hover": { bgcolor: "#f5f6ff" },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid #e8eaf6",
                    bgcolor: "#f5f6ff",
                  },
                  "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": { height: 7, width: 7 },
                  "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
                    background: "#9fa8da", borderRadius: 4,
                  },
                }}
              />
            )}
          </Box>
        </Box>
      </Box>

      {/* Import Modal */}
      <Dialog
        open={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          }
        }}
      >
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: '#fff',
            fontWeight: 800,
            fontSize: '1.5rem',
            p: 3,
          }}
        >
          Confirm Import
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body1" sx={{ mb: 1, fontSize: '0.95rem' }}>
            File: <strong>{uploadedFileName}</strong>
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.95rem' }}>
            Are you sure you want to import this data?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button
            onClick={() => setImportModalOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 600,
              px: 3,
              borderColor: '#667eea',
              color: '#667eea',
              '&:hover': {
                borderColor: '#764ba2',
                background: 'rgba(102,126,234,0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleConfirmImport}
            variant="contained"
            sx={{
              borderRadius: '12px',
              textTransform: 'none',
              fontWeight: 700,
              px: 3,
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              },
            }}
          >
            Import
          </Button>
        </DialogActions>
      </Dialog>

        {/* Create Job Dialog */}
        <Dialog
          open={createJobDialogOpen}
          onClose={() => setCreateJobDialogOpen(false)}
          maxWidth="lg"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: '16px',
              height: '92vh',
              overflow: 'hidden',
              boxShadow: '0 16px 48px rgba(63,81,181,0.25)',
              display: 'flex',
              flexDirection: 'column',
            },
          }}
        >
          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
            px: 4, py: 2.5,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexShrink: 0,
          }}>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ width: 6, height: 28, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 3 }} />
              <Box>
                <Typography variant="h6" fontWeight={700} color="#fff">
                  Add New Job Opening
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Fill in the job details below
                </Typography>
              </Box>
            </Box>
            <IconButton
              onClick={() => setCreateJobDialogOpen(false)}
              size="small"
              sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>

          {/* Form � no extra padding, form manages its own scroll + footer */}
          <Box sx={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
            <HRJobForm
              onSuccess={() => {
                setCreateJobDialogOpen(false);
                fetchJobs();
              }}
              onClose={() => setCreateJobDialogOpen(false)}
            />
          </Box>
        </Dialog>

      {/* Company Branch Detail Drawer */}
      <Drawer
        anchor="right"
        open={detailPanel.open}
        onClose={() => setDetailPanel({ open: false, row: null, view: 'company' })}
        PaperProps={{
          sx: {
            width: 380,
            borderRadius: '16px 0 0 16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {detailPanel.row && (() => {
          const row = detailPanel.row;
          const isCompany = detailPanel.view === 'company';

          const title      = isCompany ? row.companyName       : row.br_branchName;
          const subtitle   = isCompany ? `Company ID: ${row.companyId}` : `Branch of ${row.companyName}`;
          const address    = isCompany ? row.co_companyAddress  : row.br_branchAddress;
          const area       = isCompany ? row.co_area            : row.br_area;
          const city       = isCompany ? row.co_city            : row.br_city;
          const contact    = isCompany ? row.co_contactPerson   : row.br_contactPerson;
          const phone      = isCompany ? row.co_contactNumber2  : row.br_contactNumber;
          const email      = isCompany ? row.co_email           : row.br_email;
          const website    = isCompany ? row.co_websiteUrl      : null;
          const gps        = isCompany ? row.co_gpsLocation     : row.br_gpsLocation;
          const industries = isCompany ? row.co_industries      : null;
          const gst        = isCompany ? row.co_gstUpload       : null;
          const agreement  = isCompany ? row.co_agreementUpload : null;
          const token      = isCompany ? row.co_tokenAmount     : null;

          const DetailRow = ({ icon, label, value, link }) => {
            if (!value && value !== 0) return null;
            return (
              <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                <Box sx={{ fontSize: '1rem', minWidth: 22, mt: 0.2, color: '#9fa8da', display: 'flex', alignItems: 'flex-start' }}>
                  {icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                    {label}
                  </Typography>
                  {link ? (
                    <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer"
                      style={{ color: '#3f51b5', fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-all' }}>
                      {value}
                    </a>
                  ) : (
                    <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>
                      {value}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          };

          return (
            <>
              {/* Header */}
              <Box sx={{
                background: isCompany
                  ? 'linear-gradient(135deg, #1e1e2f, #2d2d44)'
                  : 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                px: 3, py: 2.5,
                display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                flexShrink: 0,
              }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: '12px',
                    bgcolor: 'rgba(255,255,255,0.15)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <BusinessIcon sx={{ color: isCompany ? '#FFD700' : '#a5d6a7', fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2}
                      sx={{ wordBreak: 'break-word' }}>
                      {title || '�'}
                    </Typography>
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                      {subtitle}
                    </Typography>
                    {!isCompany && (
                      <Chip label="Branch" size="small"
                        sx={{ mt: 0.5, bgcolor: 'rgba(165,214,167,0.25)', color: '#a5d6a7', fontWeight: 700, fontSize: '0.68rem', height: 18 }} />
                    )}
                  </Box>
                </Box>
                <IconButton size="small" onClick={() => setDetailPanel({ open: false, row: null, view: 'company' })}
                  sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' }, flexShrink: 0 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Toggle tabs (only when job has a branch) */}
              {row.br_branchName && (
                <Box sx={{ display: 'flex', borderBottom: '2px solid #e8eaf6', bgcolor: '#f8f9ff' }}>
                  {['company', 'branch'].map(v => (
                    <Box key={v} onClick={() => setDetailPanel(p => ({ ...p, view: v }))}
                      sx={{
                        flex: 1, py: 1.2, textAlign: 'center', cursor: 'pointer',
                        fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: detailPanel.view === v ? '#3f51b5' : '#9fa8da',
                        borderBottom: detailPanel.view === v ? '2px solid #3f51b5' : '2px solid transparent',
                        mb: '-2px', transition: 'all 0.2s',
                        '&:hover': { color: '#3f51b5' },
                      }}>
                      {v === 'company' ? '🏢 Company' : '🏪 Branch'}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Body */}
              <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
                <DetailRow icon={<FactoryIcon sx={{ fontSize: 18 }} />}      label="Industries"   value={industries} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}   label="Address"      value={address} />
                <DetailRow icon={<LocationCityIcon sx={{ fontSize: 18 }} />} label="City"         value={city} />
                <DetailRow icon={<PinDropIcon sx={{ fontSize: 18 }} />}      label="Area"         value={area} />
                <DetailRow icon={<PersonIcon sx={{ fontSize: 18 }} />}       label="Contact"      value={contact} />
                <DetailRow icon={<PhoneIcon sx={{ fontSize: 18 }} />}        label="Phone"        value={phone} />
                <DetailRow icon={<EmailIcon sx={{ fontSize: 18 }} />}        label="Email"        value={email} />
                <DetailRow icon={<LanguageIcon sx={{ fontSize: 18 }} />}     label="Website"      value={website} link={website} />
                {gps && (
                  <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                    <Box sx={{ color: '#9fa8da', display: 'flex', alignItems: 'flex-start', mt: 0.2 }}>
                      <MapIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                        GPS Location
                      </Typography>
                      <a href={gps} target="_blank" rel="noreferrer"
                        style={{ color: '#3f51b5', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                        Open in Maps <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </a>
                    </Box>
                  </Box>
                )}
                {token != null && (
                  <DetailRow icon={<CurrencyRupeeIcon sx={{ fontSize: 18 }} />} label="Token Amount" value={`Rs. ${token}`} />
                )}
                {(gst || agreement) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                      Documents
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {gst && (
                        <Button size="small" variant="outlined" href={gst} target="_blank" rel="noreferrer"
                          startIcon={<DescriptionIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderRadius: '8px', fontSize: '0.75rem', borderColor: '#9fa8da', color: '#3f51b5', textTransform: 'none' }}>
                          GST
                        </Button>
                      )}
                      {agreement && (
                        <Button size="small" variant="outlined" href={agreement} target="_blank" rel="noreferrer"
                          startIcon={<DescriptionIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderRadius: '8px', fontSize: '0.75rem', borderColor: '#9fa8da', color: '#388e3c', textTransform: 'none' }}>
                          Agreement
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Footer */}
              <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
                <Button fullWidth variant="outlined" onClick={() => setDetailPanel({ open: false, row: null, view: 'company' })}
                  sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600, textTransform: 'none' }}>
                  Close
                </Button>
              </Box>
            </>
          );
        })()}
      </Drawer>
    </div>
    </>
  );
};

export default HRJobList;
