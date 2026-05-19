import React, { useEffect, useState, useCallback, useRef } from 'react';
import {
  Box, Typography, Button, TextField, Grid, IconButton, Chip,
  Tooltip, InputAdornment, CircularProgress, MenuItem, Dialog,
  DialogTitle, DialogContent, DialogActions, Stack, Divider,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import SearchIcon from '@mui/icons-material/Search';
import LeaderboardIcon from '@mui/icons-material/Leaderboard';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import EventNoteIcon from '@mui/icons-material/EventNote';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DescriptionIcon from '@mui/icons-material/Description';
import BusinessIcon from '@mui/icons-material/Business';
import axios from 'axios';
import { toast } from 'react-toastify';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';
import { API_BASE_URL } from '../../config/api.config';

// ─── constants ───────────────────────────────────────────────────────────────
const SOURCES = ['Website', 'Call', 'Reference', 'WhatsApp', 'Social Media', 'Walk-in', 'Other'];
const STATUSES = ['New', 'Contacted', 'Interested', 'Not Interested', 'Converted', 'Lost'];
const COMM_MODES = ['Call', 'WhatsApp', 'Email', 'Meeting'];

const STATUS_COLORS = {
  New:           { bg: '#e3f2fd', color: '#1565c0' },
  Contacted:     { bg: '#e8f5e9', color: '#2e7d32' },
  Interested:    { bg: '#fff8e1', color: '#f57f17' },
  'Not Interested': { bg: '#fce4ec', color: '#880e4f' },
  Converted:     { bg: '#e8f5e9', color: '#1b5e20' },
  Lost:          { bg: '#efebe9', color: '#4e342e' },
};

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
  leadName: '', companyName: '', industry: '', designation: '',
  mobileNumber: '', email: '', websiteUrl: '',
  leadSource: '', leadStatus: 'New',
  city: '', state: '', country: '', fullAddress: '',
  nextFollowUpDate: '', followUpNotes: '', communicationMode: '', remarks: '',
  gstUpload: '', agreementUpload: '',
};

// ─── FileUploadField ─────────────────────────────────────────────────────────
function FileUploadField({ label, fieldName, file, existingUrl, onChange }) {
  const inputId = `lead-file-${fieldName}`;
  return (
    <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: '10px', border: '1px solid #e8eaf6' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
        {label}
      </Typography>
      {existingUrl && !file && (
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #e8eaf6' }}>
          <DescriptionIcon fontSize="small" sx={{ color: '#3f51b5' }} />
          <Typography variant="caption" sx={{ flexGrow: 1, color: '#334155' }} noWrap>
            Uploaded file
          </Typography>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => window.open(existingUrl, '_blank')}>
              <VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <input type="file" id={inputId} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
        onChange={(e) => onChange(fieldName, e.target.files[0] || null)} />
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

// ─── Main Component ───────────────────────────────────────────────────────────
export default function LeadManagement() {
  const [leads, setLeads]           = useState([]);
  const [total, setTotal]           = useState(0);
  const [loading, setLoading]       = useState(false);
  const [search, setSearch]         = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });
  const [dbCounts, setDbCounts]     = useState({ All: 0, New: 0, Contacted: 0, Interested: 0, 'Not Interested': 0, Converted: 0, Lost: 0 });

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editLead, setEditLead]     = useState(null);
  const [form, setForm]             = useState(emptyForm);
  const [files, setFiles]           = useState({ gstUpload: null, agreementUpload: null });
  const [errors, setErrors]         = useState({});
  const [saving, setSaving]         = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, lead: null });

  const searchTimer = useRef(null);
  const navigate = useNavigate();

  const token   = sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchStatusCounts = useCallback(async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/leads/status-counts`, { headers });
      if (res.data.success) {
        setDbCounts(res.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch lead counts:', err);
    }
  }, []);

  const fetchLeads = useCallback(async () => {
    setLoading(true);
    try {
      const params = {
        page:  paginationModel.page + 1,
        limit: paginationModel.pageSize,
      };
      if (search)                        params.search = search;
      if (statusFilter !== 'All') {
        params.status = statusFilter;
      } else {
        params.excludeStatus = 'Converted';
      }

      const res = await axios.get(`${API_BASE_URL}/leads`, { headers, params });
      setLeads((res.data.data || []).map(r => ({ ...r, id: r._id })));
      setTotal(res.data.total || 0);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, [paginationModel, search, statusFilter]);

  useEffect(() => {
    fetchLeads();
    fetchStatusCounts();
  }, [fetchLeads, fetchStatusCounts]);

  // ── handlers ───────────────────────────────────────────────────────────────
  const handleField = (e) => {
    setForm(p => ({ ...p, [e.target.name]: e.target.value }));
    if (errors[e.target.name]) setErrors(p => ({ ...p, [e.target.name]: '' }));
  };

  const handleFile = (name, file) => {
    setFiles(p => ({ ...p, [name]: file }));
  };

  const validate = () => {
    const e = {};
    if (!form.leadName.trim())    e.leadName    = 'Required';
    if (!form.companyName.trim()) e.companyName = 'Required';
    if (!form.mobileNumber.trim() || !/^\d{10}$/.test(form.mobileNumber.trim()))
      e.mobileNumber = 'Enter valid 10-digit number';
    if (!form.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email))
      e.email = 'Enter valid email';
    if (!form.leadSource) e.leadSource = 'Required';
    return e;
  };

  const openCreate = () => {
    setEditLead(null);
    setForm({ ...emptyForm, gstUpload: '', agreementUpload: '' });
    setFiles({ gstUpload: null, agreementUpload: null });
    setErrors({});
    setDialogOpen(true);
  };

  const openEdit = (lead) => {
    setEditLead(lead);
    setForm({
      leadName:          lead.leadName          || '',
      companyName:       lead.companyName       || '',
      industry:          lead.industry          || '',
      designation:       lead.designation       || '',
      mobileNumber:      lead.mobileNumber      || '',
      email:             lead.email             || '',
      websiteUrl:        lead.websiteUrl        || '',
      leadSource:        lead.leadSource        || '',
      leadStatus:        lead.leadStatus        || 'New',
      city:              lead.city              || '',
      state:             lead.state             || '',
      country:           lead.country           || '',
      fullAddress:       lead.fullAddress       || '',
      nextFollowUpDate:  lead.nextFollowUpDate
        ? new Date(lead.nextFollowUpDate).toISOString().split('T')[0] : '',
      followUpNotes:     lead.followUpNotes     || '',
      communicationMode: lead.communicationMode || '',
      remarks:           lead.remarks           || '',
      gstUpload:         lead.gstUpload         || '',
      agreementUpload:   lead.agreementUpload   || '',
    });
    setFiles({ gstUpload: null, agreementUpload: null });
    setErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });

      if (editLead) {
        await axios.put(`${API_BASE_URL}/leads/${editLead._id}`, fd, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Lead updated');
      } else {
        await axios.post(`${API_BASE_URL}/leads`, fd, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Lead created');
      }
      setDialogOpen(false);
      fetchLeads();
      fetchStatusCounts();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/leads/${deleteDialog.lead._id}`, { headers });
      toast.success('Lead deleted');
      setDeleteDialog({ open: false, lead: null });
      fetchLeads();
      fetchStatusCounts();
    } catch {
      toast.error('Delete failed');
    }
  };

  const handleConvertLead = (lead) => {
    if (!lead.agreementUpload) {
      toast.error('An agreement document is required to convert this lead. Please upload it first!');
      return;
    }
    navigate('/sales-company-create', { state: { leadData: lead } });
  };

  // ── columns ────────────────────────────────────────────────────────────────
  const columns = [
    {
      field: 'actions', headerName: 'Actions', width: 140, sortable: false,
      renderCell: p => {
        const isConverted = p.row.leadStatus === 'Converted';
        return (
          <Box display="flex" gap={0.5}>
            <Tooltip title={isConverted ? "Already Converted to Company" : "Convert to Company Request"}>
              <span>
                <IconButton size="small" onClick={() => handleConvertLead(p.row)} disabled={isConverted}
                  sx={{ bgcolor: isConverted ? '#f5f5f5' : '#e8f5e9', '&:hover': { bgcolor: isConverted ? '#f5f5f5' : '#c8e6c9' } }}>
                  <BusinessIcon fontSize="small" sx={{ color: isConverted ? '#9e9e9e' : '#2e7d32' }} />
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title="Edit">
              <IconButton size="small" onClick={() => openEdit(p.row)}
                sx={{ bgcolor: '#e8eaf6', '&:hover': { bgcolor: '#c5cae9' } }}>
                <EditIcon fontSize="small" sx={{ color: '#3f51b5' }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Delete">
              <IconButton size="small" onClick={() => setDeleteDialog({ open: true, lead: p.row })}
                sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}>
                <DeleteIcon fontSize="small" sx={{ color: '#c62828' }} />
              </IconButton>
            </Tooltip>
          </Box>
        );
      },
    },
    {
      field: 'leadStatus', headerName: 'Status', width: 140,
      renderCell: p => {
        const s = STATUS_COLORS[p.value] || { bg: '#f5f5f5', color: '#333' };
        return <Chip label={p.value} size="small" sx={{ bgcolor: s.bg, color: s.color, fontWeight: 700, fontSize: '0.72rem' }} />;
      },
    },
    { field: 'leadName',    headerName: 'Lead Name',    flex: 1.2, minWidth: 150 },
    { field: 'companyName', headerName: 'Company',      flex: 1.2, minWidth: 150 },
    { field: 'industry',   headerName: 'Industry',      width: 130 },
    { field: 'designation',headerName: 'Designation',   width: 140 },
    { field: 'mobileNumber',headerName: 'Mobile',       width: 130 },
    { field: 'email',       headerName: 'Email',        flex: 1.3, minWidth: 180 },
    { field: 'websiteUrl',  headerName: 'Website',      width: 160,
      renderCell: p => p.value
        ? <a href={p.value.startsWith('http') ? p.value : `https://${p.value}`} target="_blank" rel="noreferrer"
            style={{ color: '#3f51b5', fontSize: '0.82rem' }}>{p.value}</a>
        : '—',
    },
    {
      field: 'gstUpload', headerName: 'GST', width: 80,
      renderCell: p => p.value
        ? <Tooltip title="View GST"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} /></IconButton></Tooltip>
        : '—',
    },
    {
      field: 'agreementUpload', headerName: 'Agreement', width: 100,
      renderCell: p => p.value
        ? <Tooltip title="View Agreement"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#388e3c' }} /></IconButton></Tooltip>
        : '—',
    },
    { field: 'leadSource',  headerName: 'Source',       width: 130,
      renderCell: p => <Chip label={p.value} size="small" variant="outlined" sx={{ fontSize: '0.72rem' }} />,
    },
    { field: 'city',        headerName: 'City',         width: 110 },
    { field: 'state',       headerName: 'State',        width: 110 },
    { field: 'communicationMode', headerName: 'Comm. Mode', width: 120 },
    {
      field: 'nextFollowUpDate', headerName: 'Next Follow-up', width: 140,
      renderCell: p => p.value
        ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
    },
    { field: 'followUpNotes', headerName: 'Follow-up Notes', flex: 1.5, minWidth: 180,
      renderCell: p => <Tooltip title={p.value || ''} arrow><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>{p.value || '—'}</span></Tooltip>,
    },
    { field: 'remarks', headerName: 'Remarks', flex: 1.2, minWidth: 150,
      renderCell: p => <Tooltip title={p.value || ''} arrow><span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block', maxWidth: '100%' }}>{p.value || '—'}</span></Tooltip>,
    },
    {
      field: 'createdBy', headerName: 'Created By', width: 140,
      renderCell: p => {
        const u = p.value;
        return u ? `${u.firstName} ${u.lastName}` : '—';
      },
    },
    {
      field: 'createdAt', headerName: 'Created At', width: 150,
      renderCell: p => new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }),
    },
  ];


  const secLabel = { fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.72rem', display: 'block', mb: 1.5 };

  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f8', overflow: 'hidden' }}>
      <Box sx={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '250px', bgcolor: '#1e1e2f', zIndex: 1000 }}>
        <Sidebar />
      </Box>

      <Box sx={{ flexGrow: 1, ml: '250px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

          {/* ── Header ── */}
          <Box sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            borderRadius: '16px', p: 3, mb: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(63,81,181,0.25)',
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <LeaderboardIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff">Lead Management</Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                  Track and manage all sales leads
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '12px', px: 2.5, py: 1, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{total}</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, mt: 0.2 }}>Total Leads</Typography>
              </Box>
              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                sx={{ bgcolor: '#fff', color: '#3f51b5', fontWeight: 700, borderRadius: '10px', px: 2.5, '&:hover': { bgcolor: '#e8eaf6' } }}>
                New Lead
              </Button>
            </Box>
          </Box>

          {/* ── Status Filter Tabs ── */}
          <Box sx={{ display: 'flex', gap: 1, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            {['All', 'New', 'Contacted', 'Interested', 'Not Interested', 'Lost'].map(s => {
              const count = dbCounts[s] || 0;
              const sc = STATUS_COLORS[s] || { bg: '#e8eaf6', color: '#3f51b5' };
              const active = statusFilter === s;
              return (
                <Chip key={s} label={`${s} (${count})`} onClick={() => setStatusFilter(s)}
                  sx={{
                    fontWeight: 700, fontSize: '0.78rem', cursor: 'pointer',
                    bgcolor: active ? (s === 'All' ? '#3f51b5' : sc.color) : (s === 'All' ? '#e8eaf6' : sc.bg),
                    color: active ? '#fff' : (s === 'All' ? '#3f51b5' : sc.color),
                    border: `2px solid ${active ? 'transparent' : '#e0e0e0'}`,
                    '&:hover': { opacity: 0.85 },
                  }} />
              );
            })}
            <Button
              variant={statusFilter === 'Converted' ? 'contained' : 'outlined'}
              color="success"
              startIcon={<BusinessIcon />}
              onClick={() => setStatusFilter(statusFilter === 'Converted' ? 'All' : 'Converted')}
              sx={{
                borderRadius: '16px',
                fontWeight: 700,
                textTransform: 'none',
                px: 2,
                py: 0.5,
                fontSize: '0.75rem',
                height: '32px',
                borderColor: '#2e7d32',
                color: statusFilter === 'Converted' ? '#fff' : '#2e7d32',
                bgcolor: statusFilter === 'Converted' ? '#2e7d32' : 'transparent',
                '&:hover': {
                  bgcolor: statusFilter === 'Converted' ? '#1b5e20' : 'rgba(46,125,50,0.08)',
                  borderColor: '#1b5e20'
                }
              }}
            >
              Converted Leads ({dbCounts['Converted'] || 0})
            </Button>
            <TextField size="small" placeholder="Search name, company, mobile, email..."
              value={search}
              onChange={e => {
                setSearch(e.target.value);
                clearTimeout(searchTimer.current);
                searchTimer.current = setTimeout(() => setPaginationModel(p => ({ ...p, page: 0 })), 400);
              }}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }}
              sx={{ ml: 'auto', width: 300, '& .MuiOutlinedInput-root': { borderRadius: '10px' } }}
            />
          </Box>

          {/* ── DataGrid ── */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(63,81,181,0.08)', height: 'calc(100vh - 310px)' }}>
            <DataGrid
              rows={leads}
              columns={columns}
              getRowId={r => r._id}
              rowCount={total}
              loading={loading}
              paginationMode="server"
              paginationModel={paginationModel}
              onPaginationModelChange={setPaginationModel}
              pageSizeOptions={[25, 50, 100]}
              disableRowSelectionOnClick
              getRowClassName={(params) => params.row.leadStatus === 'Converted' ? 'lead-row-converted' : ''}
              sx={{
                border: 'none', height: '100%',
                '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', fontSize: '0.83rem', color: '#334155', '&:focus': { outline: 'none' } },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                '& .lead-row-converted': {
                  opacity: 0.75,
                  bgcolor: '#f4fbf7',
                  '&:hover': { bgcolor: '#e8f7ee' }
                },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Create / Edit Dialog ── */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '95vh', display: 'flex', flexDirection: 'column' } }}>

        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 42, height: 42, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <LeaderboardIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={700} color="#fff" lineHeight={1.2}>
                {editLead ? 'Edit Lead' : 'New Lead'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                {editLead ? `Editing: ${editLead.leadName}` : 'Fill in lead details'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} size="small"
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 3, pt: 3, pb: 1,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 3 },
        }}>
          <Stack spacing={2.5}>

            {/* 1. Basic Lead Information */}
            <Typography sx={secLabel}>Basic Lead Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField label="Lead Name *" name="leadName" value={form.leadName} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} error={!!errors.leadName} helperText={errors.leadName}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Company Name *" name="companyName" value={form.companyName} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} error={!!errors.companyName} helperText={errors.companyName} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Industry" name="industry" value={form.industry} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Designation" name="designation" value={form.designation} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Mobile Number *" name="mobileNumber" value={form.mobileNumber}
                  onChange={e => { const v = e.target.value.replace(/\D/g,'').slice(0,10); setForm(p => ({ ...p, mobileNumber: v })); if (errors.mobileNumber) setErrors(p => ({ ...p, mobileNumber: '' })); }}
                  fullWidth size="small" sx={fieldSx} error={!!errors.mobileNumber} helperText={errors.mobileNumber}
                  inputProps={{ maxLength: 10, inputMode: 'numeric' }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Email Address *" name="email" type="email" value={form.email} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} error={!!errors.email} helperText={errors.email}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField label="Website URL" name="websiteUrl" value={form.websiteUrl} onChange={handleField}
                  fullWidth size="small" sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: '#9fa8da', fontSize: '1rem' }}>🌐</InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Lead Source *" name="leadSource" value={form.leadSource} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} error={!!errors.leadSource} helperText={errors.leadSource}>
                  <MenuItem value=""><em>Select Source</em></MenuItem>
                  {SOURCES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField select label="Lead Status" name="leadStatus" value={form.leadStatus} onChange={handleField}
                  fullWidth size="small" sx={fieldSx}>
                  {STATUSES.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
                </TextField>
              </Grid>
            </Grid>

            <Divider />

            {/* 2. Address Information */}
            <Typography sx={secLabel}>Address Information</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="City" name="city" value={form.city} onChange={handleField}
                  fullWidth size="small" sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="State" name="state" value={form.state} onChange={handleField} fullWidth size="small" sx={fieldSx} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField label="Country" name="country" value={form.country} onChange={handleField} fullWidth size="small" sx={fieldSx} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Full Address (optional)" name="fullAddress" value={form.fullAddress} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} multiline rows={2} />
              </Grid>
            </Grid>

            <Divider />

            {/* 3. Follow-up */}
            <Typography sx={secLabel}>Follow-up &amp; Communication</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="Next Follow-up Date" name="nextFollowUpDate" type="date" value={form.nextFollowUpDate}
                  onChange={handleField} fullWidth size="small" sx={fieldSx} InputLabelProps={{ shrink: true }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><EventNoteIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }} />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField select label="Communication Mode" name="communicationMode" value={form.communicationMode} onChange={handleField}
                  fullWidth size="small" sx={fieldSx}>
                  <MenuItem value=""><em>Select Mode</em></MenuItem>
                  {COMM_MODES.map(m => <MenuItem key={m} value={m}>{m}</MenuItem>)}
                </TextField>
              </Grid>
              <Grid item xs={12} sm={4}>
                {/* spacer */}
              </Grid>
              <Grid item xs={12}>
                <TextField label="Follow-up Notes" name="followUpNotes" value={form.followUpNotes} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} multiline rows={2} />
              </Grid>
              <Grid item xs={12}>
                <TextField label="Remarks" name="remarks" value={form.remarks} onChange={handleField}
                  fullWidth size="small" sx={fieldSx} multiline rows={2} />
              </Grid>
            </Grid>

            <Divider />

            {/* 4. Uploaded Documents */}
            <Typography sx={secLabel}>Uploaded Documents</Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <FileUploadField
                  label="GST Document"
                  fieldName="gstUpload"
                  file={files.gstUpload}
                  existingUrl={form.gstUpload}
                  onChange={handleFile}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FileUploadField
                  label="Signed Agreement Document"
                  fieldName="agreementUpload"
                  file={files.agreementUpload}
                  existingUrl={form.agreementUpload}
                  onChange={handleFile}
                />
              </Grid>
            </Grid>

          </Stack>
        </Box>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
          <Button onClick={() => setDialogOpen(false)} variant="outlined"
            sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}
            sx={{ borderRadius: '8px', background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', fontWeight: 700, minWidth: 130, '&:hover': { background: 'linear-gradient(135deg, #303f9f, #3f51b5)' } }}>
            {saving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : editLead ? 'Save Changes' : 'Create Lead'}
          </Button>
        </Box>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, lead: null })} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Delete Lead</DialogTitle>
        <DialogContent>
          <Typography>
            Delete lead <strong>{deleteDialog.lead?.leadName}</strong> ({deleteDialog.lead?.companyName})? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setDeleteDialog({ open: false, lead: null })} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: '8px', fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
