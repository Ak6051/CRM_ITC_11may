import React, { useEffect, useState, useCallback } from 'react';
import {
  Box, Typography, Button, TextField, Grid, IconButton,
  Chip, Tooltip, InputAdornment, CircularProgress, Paper,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, FormControl, InputLabel,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import BusinessIcon from '@mui/icons-material/Business';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import CloseIcon from '@mui/icons-material/Close';
import HourglassEmptyIcon from '@mui/icons-material/HourglassEmpty';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useLocation, useNavigate } from 'react-router-dom';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';
import { API_BASE_URL } from '../../config/api.config';

// ─── helpers ────────────────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    '& fieldset': { borderColor: '#e2e5f1' },
    '&:hover fieldset': { borderColor: '#3f51b5' },
    '&.Mui-focused fieldset': { borderColor: '#3f51b5', borderWidth: '2px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#3f51b5' },
};

const emptyForm = {
  companyName: '', industries: '', companyAddress: '', area: '', city: '',
  state: '', country: '', pincode: '',
  contactPerson: '', contactPersonDesignation: '', contactNumber: '', email: '',
  contactPerson2: '', contactPerson2Designation: '', contactNumber2: '', email2: '',
  websiteUrl: '', gpsLocation: '',
  agreementStartDate: '', agreementEndDate: '',
  invoiceNumber: '', paymentMode: '', paymentRemark: '',
  tokenAmount: '',
  gstUpload: '',
  agreementUpload: '',
  leadId: '',
};
const emptyFiles = { gstUpload: null, agreementUpload: null, tokenUpload: null, otherDocumentUpload: null };

function FileUploadField({ label, fieldName, file, existingUrl, onChange }) {
  const inputId = `req-file-${fieldName}`;
  return (
    <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: '10px', border: '1px solid #e8eaf6' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
        {label}
      </Typography>
      {existingUrl && !file && (
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #e8eaf6' }}>
          <DescriptionIcon fontSize="small" sx={{ color: '#3f51b5' }} />
          <Typography variant="caption" sx={{ flexGrow: 1, color: '#334155' }} noWrap>
            Fetched from Lead
          </Typography>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => window.open(existingUrl, '_blank')}>
              <VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <input type="file" id={inputId} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
        onChange={e => onChange(fieldName, e.target.files[0] || null)} />
      <label htmlFor={inputId}>
        <Button variant="outlined" component="span" fullWidth size="small" startIcon={<CloudUploadIcon />}
          sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontSize: '0.8rem', textTransform: 'none' }}>
          {file ? file.name : (existingUrl ? 'Replace File' : 'Upload PDF / Image')}
        </Button>
      </label>
      <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', display: 'block' }}>
        Supported: PDF, JPG, PNG
      </Typography>
    </Box>
  );
}

const statusChip = (status) => {
  const map = {
    Pending:  { color: '#f57c00', bg: '#fff3e0', icon: <HourglassEmptyIcon sx={{ fontSize: 14 }} /> },
    Approved: { color: '#388e3c', bg: '#e8f5e9', icon: <CheckCircleIcon sx={{ fontSize: 14 }} /> },
    Rejected: { color: '#c62828', bg: '#ffebee', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
    Revoked:  { color: '#6d4c41', bg: '#efebe9', icon: <CancelIcon sx={{ fontSize: 14 }} /> },
  };
  const s = map[status] || map.Pending;
  return (
    <Chip icon={s.icon} label={status} size="small"
      sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.72rem',
        '& .MuiChip-icon': { color: s.color } }} />
  );
};

export default function SalesCompanyCreate() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState(emptyFiles);
  const [saving, setSaving] = useState(false);
  const [isResubmit, setIsResubmit] = useState(false);
  const [statusFilter, setStatusFilter] = useState('All'); // All | Pending | Approved | Rejected
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);

  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    if (location.state?.leadData) {
      const lead = location.state.leadData;
      setForm({
        companyName: lead.companyName || '',
        industries: lead.industry || '',
        companyAddress: lead.fullAddress || '',
        area: '',
        city: lead.city || '',
        state: lead.state || '',
        country: lead.country || '',
        pincode: '',
        contactPerson: lead.leadName || '',
        contactPersonDesignation: lead.designation || '',
        contactNumber: lead.mobileNumber || '',
        email: lead.email || '',
        contactPerson2: '',
        contactPerson2Designation: '',
        contactNumber2: '',
        email2: '',
        websiteUrl: lead.websiteUrl || '',
        gpsLocation: '',
        agreementStartDate: '',
        agreementEndDate: '',
        invoiceNumber: '',
        paymentMode: '',
        paymentRemark: '',
        tokenAmount: '',
        gstUpload: lead.gstUpload || '',
        agreementUpload: lead.agreementUpload || '',
        leadId: lead._id || '',
      });
      setFiles(emptyFiles);
      setIsResubmit(false);
      setDialogOpen(true);
      // Clear location state so refreshing doesn't open the dialog again
      window.history.replaceState({}, document.title);
    }
  }, [location.state]);

  const token = sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/company-requests/my-requests`, { headers });
      setRequests(res.data.data || []);
    } catch {
      toast.error('Failed to load requests');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
    // Poll every 15 seconds so Sales sees approval/rejection without refresh
    const interval = setInterval(fetchRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchRequests]);

  const handleField = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));
  const handleFile  = (name, file) => setFiles(p => ({ ...p, [name]: file }));

  const handleSubmit = async () => {
    if (!form.companyName.trim()) { toast.error('Company name is required'); return; }
    if (form.tokenAmount !== '' && isNaN(Number(form.tokenAmount))) {
      toast.error('Token amount must be a number'); return;
    }
    if (!form.agreementUpload && !files.agreementUpload) {
      toast.error('Agreement document is required!');
      return;
    }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });

      await axios.post(`${API_BASE_URL}/company-requests`, fd, {
        headers: { ...headers, 'Content-Type': 'multipart/form-data' },
      });
      toast.success('Company request submitted! Awaiting admin approval.');
      setDialogOpen(false);
      setIsResubmit(false);
      setForm(emptyForm);
      setFiles(emptyFiles);
      fetchRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Submission failed');
    } finally {
      setSaving(false);
    }
  };

  // ── Resubmit rejected request — pre-fill form and open dialog ─────────────
  const handleResubmit = (request) => {
    setIsResubmit(true);
    setForm({
      companyName:    request.companyName    || '',
      industries:     request.industries     || '',
      companyAddress: request.companyAddress || '',
      area:           request.area           || '',
      city:           request.city           || '',
      state:          request.state          || '',
      country:        request.country        || '',
      pincode:        request.pincode        || '',
      contactPerson:  request.contactPerson  || '',
      contactPersonDesignation: request.contactPersonDesignation || '',
      contactNumber: request.contactNumber || '',
      email:          request.email          || '',
      contactPerson2: request.contactPerson2 || '',
      contactPerson2Designation: request.contactPerson2Designation || '',
      contactNumber2: request.contactNumber2 || '',
      email2:         request.email2         || '',
      websiteUrl:     request.websiteUrl     || '',
      gpsLocation:    request.gpsLocation    || '',
      agreementStartDate: request.agreementStartDate ? request.agreementStartDate.slice(0,10) : '',
      agreementEndDate:   request.agreementEndDate   ? request.agreementEndDate.slice(0,10)   : '',
      invoiceNumber:  request.invoiceNumber  || '',
      paymentMode:    request.paymentMode    || '',
      paymentRemark:  request.paymentRemark  || '',
      tokenAmount:    request.tokenAmount != null ? String(request.tokenAmount) : '',
    });
    setFiles(emptyFiles);
    setDialogOpen(true);
  };

  const columns = [
    {
      field: 'actions', headerName: 'Action', width: 110, sortable: false,
      renderCell: p => ['Rejected', 'Revoked'].includes(p.row.status) ? (
        <Tooltip title="Resubmit this request">
          <Button size="small" variant="contained"
            onClick={() => handleResubmit(p.row)}
            sx={{ borderRadius: '8px', fontSize: '0.7rem', textTransform: 'none', fontWeight: 700,
              bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' } }}>
            Resubmit
          </Button>
        </Tooltip>
      ) : '—',
    },
    {
      field: 'status', headerName: 'Status', width: 120,
      renderCell: p => statusChip(p.value),
    },
    { field: 'companyName',    headerName: 'Company Name',    width: 180 },
    { field: 'industries',     headerName: 'Industries',      width: 140 },
    { field: 'companyAddress', headerName: 'Address',         width: 200 },
    { field: 'area',           headerName: 'Area',            width: 110 },
    { field: 'city',           headerName: 'City',            width: 110 },
    { field: 'state',          headerName: 'State',           width: 110 },
    { field: 'country',        headerName: 'Country',         width: 110 },
    { field: 'pincode',        headerName: 'Pincode',         width: 90  },
    { field: 'contactPerson',  headerName: 'Contact Person',  width: 150 },
    { field: 'contactPersonDesignation', headerName: 'Designation', width: 150 },
    { field: 'contactNumber', headerName: 'Contact Number',  width: 140 },
    { field: 'email',          headerName: 'Email',           width: 190 },
    { field: 'contactPerson2', headerName: 'Contact Person 2', width: 160 },
    { field: 'contactPerson2Designation', headerName: 'Designation 2', width: 150 },
    { field: 'contactNumber2', headerName: 'Contact No. 2',   width: 140 },
    { field: 'email2',         headerName: 'Email 2',         width: 190 },
    { field: 'websiteUrl',     headerName: 'Website',         width: 170,
      renderCell: p => p.value
        ? <a href={p.value.startsWith('http') ? p.value : `https://${p.value}`} target="_blank" rel="noreferrer"
            style={{ color: '#3f51b5', fontSize: '0.82rem' }}>{p.value}</a>
        : '—',
    },
    { field: 'gpsLocation',    headerName: 'GPS',             width: 80,
      renderCell: p => p.value
        ? <Tooltip title="Open GPS"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} /></IconButton></Tooltip>
        : '—',
    },
    { field: 'gstUpload',      headerName: 'GST',             width: 70,
      renderCell: p => p.value
        ? <Tooltip title="View GST"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} /></IconButton></Tooltip>
        : '—',
    },
    { field: 'agreementUpload',headerName: 'Agreement',       width: 100,
      renderCell: p => p.value
        ? <Tooltip title="View Agreement"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#388e3c' }} /></IconButton></Tooltip>
        : '—',
    },
    { field: 'otherDocumentUpload', headerName: 'Other Doc',  width: 90,
      renderCell: p => p.value
        ? <Tooltip title="View Other Document"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#7c3aed' }} /></IconButton></Tooltip>
        : '—',
    },
    { field: 'tokenAmount',    headerName: 'Token ₹',         width: 100,
      renderCell: p => p.value != null ? `₹${p.value}` : '—',
    },
    { field: 'tokenUpload',    headerName: 'Token Doc',       width: 100,
      renderCell: p => p.value
        ? <Tooltip title="View Token Doc"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#f57c00' }} /></IconButton></Tooltip>
        : '—',
    },
    {
      field: 'rejectReason', headerName: 'Reject Reason', width: 200,
      renderCell: p => p.value
        ? <Tooltip title={p.value} arrow><Typography variant="caption" color="error" noWrap sx={{ maxWidth: 180 }}>{p.value}</Typography></Tooltip>
        : '—',
    },
    {
      field: 'createdAt', headerName: 'Submitted', width: 150,
      renderCell: p => new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
  ];

  const pendingCount  = requests.filter(r => r.status === 'Pending').length;

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f8', overflow: 'hidden' }}>
      <Box sx={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '250px', bgcolor: '#1e1e2f', zIndex: 1000 }}>
        <Sidebar />
      </Box>

      <Box sx={{ flexGrow: 1, ml: '250px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            borderRadius: '16px', p: 3, mb: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(63,81,181,0.25)',
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BusinessIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff">Create Company Request</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                  Submit a new company — admin will review and approve
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              {[
                { label: 'All',      value: requests.length,                                    color: '#fff',    bg: 'rgba(255,255,255,0.18)', border: 'rgba(255,255,255,0.4)' },
                { label: 'Pending',  value: requests.filter(r => r.status === 'Pending').length,  color: '#ff9800', bg: 'rgba(255,152,0,0.2)',    border: 'rgba(255,152,0,0.5)' },
                { label: 'Approved', value: requests.filter(r => r.status === 'Approved').length, color: '#4caf50', bg: 'rgba(76,175,80,0.2)',    border: 'rgba(76,175,80,0.5)' },
                { label: 'Rejected', value: requests.filter(r => r.status === 'Rejected').length, color: '#f44336', bg: 'rgba(244,67,54,0.2)',    border: 'rgba(244,67,54,0.5)' },
                { label: 'Revoked',  value: requests.filter(r => r.status === 'Revoked').length,  color: '#a1887f', bg: 'rgba(161,136,127,0.2)',  border: 'rgba(161,136,127,0.5)' },
              ].map(({ label, value, color, bg, border }) => (
                <Box key={label} onClick={() => setStatusFilter(label)}
                  sx={{
                    bgcolor: statusFilter === label ? bg : 'rgba(255,255,255,0.1)',
                    border: `2px solid ${statusFilter === label ? border : 'rgba(255,255,255,0.2)'}`,
                    borderRadius: '10px', px: 2, py: 1, textAlign: 'center', minWidth: 75,
                    cursor: 'pointer', transition: 'all 0.2s',
                    '&:hover': { bgcolor: bg, border: `2px solid ${border}` },
                  }}>
                  <Typography sx={{ fontSize: '1.2rem', fontWeight: 800, color, lineHeight: 1 }}>{value}</Typography>
                  <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, mt: 0.2 }}>{label}</Typography>
                </Box>
              ))}
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setIsResubmit(false); setForm(emptyForm); setFiles(emptyFiles); setDialogOpen(true); }}
                sx={{ bgcolor: '#fff', color: '#3f51b5', fontWeight: 700, borderRadius: '10px', px: 2.5, '&:hover': { bgcolor: '#e8eaf6' } }}>
                New Request
              </Button>
            </Box>
          </Box>

          {/* DataGrid */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(63,81,181,0.08)', height: 'calc(100vh - 240px)' }}>
            <Box sx={{ px: 3, py: 1.5, background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '1px solid #c5cae9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#3f51b5', borderRadius: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" textTransform="uppercase" letterSpacing="0.06em">
                  My Company Requests
                </Typography>
              </Box>
              <Chip label={`${statusFilter === 'All' ? requests.length : requests.filter(r => r.status === statusFilter).length} requests`} size="small" sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700, fontSize: '0.75rem' }} />
            </Box>
            <DataGrid
              rows={statusFilter === 'All' ? requests : requests.filter(r => r.status === statusFilter)}
              columns={columns}
              getRowId={r => r._id}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
              sx={{
                border: 'none', height: 'calc(100% - 52px)',
                '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', fontSize: '0.83rem', color: '#334155', '&:focus': { outline: 'none' } },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-virtualScroller': { overflowX: 'auto' },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Create Request Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' } }}>

        <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BusinessIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#fff" lineHeight={1.2}>
                {isResubmit ? 'Resubmit Company Request' : 'New Company Request'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {isResubmit ? 'Edit and resubmit for approval' : 'Will be sent to admin for approval'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => { setDialogOpen(false); setIsResubmit(false); }} size="small"
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 3, pt: 3, pb: 1 }}>
          <Grid container spacing={2.5}>

            {/* ── Section 1: Basic Information ── */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 3, height: 16, bgcolor: '#3f51b5', borderRadius: 2 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Basic Information
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Company Name *" name="companyName" value={form.companyName} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Industries" name="industries" value={form.industries} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12}><TextField label="Company Address" name="companyAddress" value={form.companyAddress} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Area" name="area" value={form.area} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="City" name="city" value={form.city} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="State" name="state" value={form.state} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={4}><TextField label="Country" name="country" value={form.country} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Pincode" name="pincode" value={form.pincode}
                onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g,'').slice(0,6) }))}
                fullWidth size="small" sx={fieldSx} inputProps={{ maxLength: 6 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Website URL" name="websiteUrl" value={form.websiteUrl} onChange={handleField} fullWidth size="small" sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: '#9fa8da' }}>🌐</InputAdornment> }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="GPS Location Link" name="gpsLocation" value={form.gpsLocation} onChange={handleField} fullWidth size="small" sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }} />
            </Grid>

            {/* ── Section 2: Contact Details ── */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 3, height: 16, bgcolor: '#0891b2', borderRadius: 2 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Contact Details
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Contact Person Name" name="contactPerson" value={form.contactPerson} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Contact Person Designation" name="contactPersonDesignation" value={form.contactPersonDesignation} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Number" name="contactNumber" value={form.contactNumber}
                onChange={e => setForm(p => ({ ...p, contactNumber: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                fullWidth size="small" sx={fieldSx} inputProps={{ maxLength: 10 }} helperText="10-digit number" />
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Email" name="email" type="email" value={form.email} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>

            {/* ── Contact Person 2 ── */}
            <Grid item xs={12} sx={{ mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 3, height: 14, bgcolor: '#0891b2', borderRadius: 2, opacity: 0.6 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.8 }}>
                  Contact Person 2 (Optional)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Contact Person 2 Name" name="contactPerson2" value={form.contactPerson2} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Contact Person 2 Designation" name="contactPerson2Designation" value={form.contactPerson2Designation} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Number 2" name="contactNumber2" value={form.contactNumber2}
                onChange={e => setForm(p => ({ ...p, contactNumber2: e.target.value.replace(/\D/g,'').slice(0,10) }))}
                fullWidth size="small" sx={fieldSx} inputProps={{ maxLength: 10 }} helperText="10-digit number (optional)" />
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Email 2" name="email2" type="email" value={form.email2} onChange={handleField} fullWidth size="small" sx={fieldSx} /></Grid>

            {/* ── Section 3: Documents ── */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 3, height: 16, bgcolor: '#7c3aed', borderRadius: 2 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Documents
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}><FileUploadField label="GST Upload" fieldName="gstUpload" file={files.gstUpload} existingUrl={form.gstUpload} onChange={handleFile} /></Grid>
            <Grid item xs={12} sm={4}><FileUploadField label="Signed Agreement Upload" fieldName="agreementUpload" file={files.agreementUpload} existingUrl={form.agreementUpload} onChange={handleFile} /></Grid>
            <Grid item xs={12} sm={4}><FileUploadField label="Other Document Upload" fieldName="otherDocumentUpload" file={files.otherDocumentUpload} onChange={handleFile} /></Grid>
            {/* Agreement dates */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Agreement Start Date" name="agreementStartDate" type="date"
                value={form.agreementStartDate} onChange={handleField}
                fullWidth size="small" sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Agreement End Date" name="agreementEndDate" type="date"
                value={form.agreementEndDate} onChange={handleField}
                fullWidth size="small" sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* ── Section 4: Payment ── */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 3, height: 16, bgcolor: '#059669', borderRadius: 2 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Payment
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Invoice Number" name="invoiceNumber" value={form.invoiceNumber}
                onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Token Amount (₹)" name="tokenAmount" value={form.tokenAmount}
                onChange={e => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) handleField(e); }}
                fullWidth size="small" sx={fieldSx} inputProps={{ inputMode: 'numeric' }}
                helperText="Numbers only — optional" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  label="Payment Mode"
                  name="paymentMode"
                  value={form.paymentMode}
                  onChange={(e) => setForm(p => ({ ...p, paymentMode: e.target.value, paymentRemark: '' }))}
                >
                  <MenuItem value="">— Select —</MenuItem>
                  <MenuItem value="Cash">💵 Cash</MenuItem>
                  <MenuItem value="Bank">🏦 Bank</MenuItem>
                  <MenuItem value="Other">📋 Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Cash or Other → remark */}
            {(form.paymentMode === 'Cash' || form.paymentMode === 'Other') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label={form.paymentMode === 'Cash' ? 'Cash Remark' : 'Other Remark'}
                  name="paymentRemark" value={form.paymentRemark}
                  onChange={handleField} fullWidth size="small" sx={fieldSx}
                  placeholder={form.paymentMode === 'Cash' ? 'e.g. Received in hand' : 'e.g. Cheque / DD'}
                />
              </Grid>
            )}
            {/* Bank → token upload */}
            {form.paymentMode === 'Bank' && (
              <Grid item xs={12} sm={6}>
                <FileUploadField label="Token Payment Upload" fieldName="tokenUpload" file={files.tokenUpload} onChange={handleFile} />
              </Grid>
            )}

          </Grid>
        </Box>

        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined" sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600 }}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={saving}
            sx={{ borderRadius: '8px', background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', fontWeight: 700, minWidth: 160, '&:hover': { background: 'linear-gradient(135deg, #303f9f, #3f51b5)' } }}>
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : isResubmit ? 'Resubmit for Approval' : 'Submit for Approval'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
