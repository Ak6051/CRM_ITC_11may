import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Chip, Tooltip, CircularProgress,
  Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, MenuItem, Snackbar, Alert, IconButton,
  InputAdornment,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import axios from 'axios';
import dayjs from 'dayjs';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import { API_BASE_URL } from '../../config/api.config';
import AccountBalanceIcon from '@mui/icons-material/AccountBalance';
import EditIcon from '@mui/icons-material/Edit';
import RefreshIcon from '@mui/icons-material/Refresh';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import * as XLSX from 'xlsx/xlsx.mjs';

const AccountDepartment = () => {
  const [candidates, setCandidates] = useState([]);
  const [loading, setLoading]       = useState(true);
  const [billingDialog, setBillingDialog] = useState({ open: false, row: null });
  const [billingForm, setBillingForm] = useState({
    billingDate: '', billingAmount: '',
    paymentStatus: 'Pending', paymentDate: '',
    paymentMode: '', paymentRemark: '',
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  // ── Fetch candidates: joiningDate set + hasJoined = 'Yes' ─────────────────
  const fetchCandidates = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/fetch/candidates/joined`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCandidates(res.data);
    } catch (err) {
      console.error('Error fetching joined candidates:', err);
      setSnackbar({ open: true, message: 'Failed to load data', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCandidates(); }, []);

  // ── Open billing dialog ───────────────────────────────────────────────────
  const handleEditBilling = (row) => {
    setBillingForm({
      billingDate:   row.billingDate   ? dayjs(row.billingDate).format('YYYY-MM-DD')  : '',
      billingAmount: row.billingAmount || '',
      paymentStatus: row.paymentStatus || 'Pending',
      paymentDate:   row.paymentDate   ? dayjs(row.paymentDate).format('YYYY-MM-DD')  : '',
      paymentMode:   row.paymentMode   || '',
      paymentRemark: row.paymentRemark || '',
    });
    setBillingDialog({ open: true, row });
  };

  // ── Save billing ──────────────────────────────────────────────────────────
  const handleSaveBilling = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/fetch/lineup/${billingDialog.row._id}`,
        billingForm,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSnackbar({ open: true, message: 'Billing information saved successfully', severity: 'success' });
      setBillingDialog({ open: false, row: null });
      fetchCandidates();
    } catch (err) {
      setSnackbar({ open: true, message: err.response?.data?.message || 'Failed to save billing', severity: 'error' });
    }
  };

  // ── Export ────────────────────────────────────────────────────────────────
  const handleExport = () => {
    const data = candidates.map(c => ({
      'HR Name':        c.createdBy ? `${c.createdBy.firstName || ''} ${c.createdBy.lastName || ''}`.trim() : 'N/A',
      'Candidate Name': c.candidateName || '',
      'Phone':          c.candidatePhone || '',
      'Email':          c.candidateEmail || '',
      'Company':        c.jobId?.companyName || '',
      'Job Title':      c.jobId?.jobTitle || '',
      'Joining Date':   c.joiningDate ? dayjs(c.joiningDate).format('DD/MM/YYYY') : '',
      'Has Joined':     c.hasJoined || '',
      'Salary Offered': c.salaryOffered || '',
      'Billing Date':   c.billingDate ? dayjs(c.billingDate).format('DD/MM/YYYY') : '',
      'Billing Amount': c.billingAmount ? `₹${c.billingAmount}` : '',
      'Payment Status': c.paymentStatus || '',
      'Payment Date':   c.paymentDate ? dayjs(c.paymentDate).format('DD/MM/YYYY') : '',
      'Payment Mode':   c.paymentMode || '',
      'Payment Remark': c.paymentRemark || '',
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Account');
    XLSX.writeFile(wb, `AccountDepartment_${dayjs().format('YYYY-MM-DD')}.xlsx`);
  };

  const fmt = (d) => d ? dayjs(d).format('DD/MM/YYYY') : '—';

  const paymentStatusColor = { Pending: '#f59e0b', Paid: '#10b981', Failed: '#ef4444' };

  // ── Columns ───────────────────────────────────────────────────────────────
  const columns = [
    {
      field: 'billing',
      headerName: 'Billing',
      width: 110,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small" variant="contained" startIcon={<EditIcon sx={{ fontSize: '14px !important' }} />}
          onClick={(e) => { e.stopPropagation(); handleEditBilling(params.row); }}
          sx={{
            fontSize: '0.72rem', fontWeight: 700, borderRadius: '8px',
            textTransform: 'none', bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' },
          }}
        >
          Billing
        </Button>
      ),
    },
    {
      field: 'createdBy', headerName: 'HR Name', width: 150,
      renderCell: (p) => {
        const v = p.row.createdBy;
        return <Typography fontSize="0.83rem">{v ? `${v.firstName || ''} ${v.lastName || ''}`.trim() : '—'}</Typography>;
      },
    },
    { field: 'candidateName', headerName: 'Candidate Name', width: 160,
      renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap fontSize="0.83rem" fontWeight={600}>{p.value || '—'}</Typography></Tooltip> },
    { field: 'candidatePhone', headerName: 'Phone', width: 130,
      renderCell: (p) => <Typography fontSize="0.83rem">{p.value || '—'}</Typography> },
    { field: 'candidateEmail', headerName: 'Email', width: 200,
      renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap fontSize="0.83rem" color="#3f51b5">{p.value || '—'}</Typography></Tooltip> },
    { field: 'companyName', headerName: 'Company', width: 180,
      renderCell: (p) => <Tooltip title={p.row.jobId?.companyName || ''}><Typography noWrap fontSize="0.83rem">{p.row.jobId?.companyName || '—'}</Typography></Tooltip> },
    { field: 'jobTitle', headerName: 'Job Title', width: 160,
      renderCell: (p) => <Tooltip title={p.row.jobId?.jobTitle || ''}><Typography noWrap fontSize="0.83rem">{p.row.jobId?.jobTitle || '—'}</Typography></Tooltip> },
    { field: 'joiningDate', headerName: 'Joining Date', width: 130,
      renderCell: (p) => <Typography fontSize="0.83rem">{fmt(p.value)}</Typography> },
    {
      field: 'hasJoined', headerName: 'Has Joined', width: 120,
      renderCell: (p) => (
        <Chip label={p.value || '—'} size="small"
          sx={{ fontWeight: 700, fontSize: '0.72rem',
            bgcolor: p.value === 'Yes' ? '#d1fae5' : p.value === 'No' ? '#fee2e2' : '#f3f4f6',
            color:   p.value === 'Yes' ? '#065f46' : p.value === 'No' ? '#b91c1c' : '#374151',
          }} />
      ),
    },
    { field: 'salaryOffered', headerName: 'Salary Offered', width: 140,
      renderCell: (p) => <Typography fontSize="0.83rem">{p.value || '—'}</Typography> },
    { field: 'billingDate', headerName: 'Billing Date', width: 130,
      renderCell: (p) => <Typography fontSize="0.83rem">{fmt(p.value)}</Typography> },
    { field: 'billingAmount', headerName: 'Billing Amount', width: 140,
      renderCell: (p) => <Typography fontSize="0.83rem" fontWeight={600} color="#3f51b5">{p.value ? `₹${p.value}` : '—'}</Typography> },
    {
      field: 'paymentStatus', headerName: 'Payment Status', width: 140,
      renderCell: (p) => {
        const c = paymentStatusColor[p.value] || '#9e9e9e';
        return p.value
          ? <Chip label={p.value} size="small" sx={{ fontWeight: 700, fontSize: '0.72rem', bgcolor: `${c}20`, color: c, border: `1px solid ${c}40` }} />
          : <Typography fontSize="0.83rem" color="#9e9e9e">—</Typography>;
      },
    },
    { field: 'paymentDate', headerName: 'Payment Date', width: 130,
      renderCell: (p) => <Typography fontSize="0.83rem">{fmt(p.value)}</Typography> },
    { field: 'paymentMode', headerName: 'Payment Mode', width: 130,
      renderCell: (p) => <Typography fontSize="0.83rem">{p.value || '—'}</Typography> },
    { field: 'paymentRemark', headerName: 'Payment Remark', width: 180,
      renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap fontSize="0.83rem">{p.value || '—'}</Typography></Tooltip> },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f8', overflow: 'hidden' }}>
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', zIndex: 1000 }}>
        <Sidebar />
      </div>

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
                <AccountBalanceIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.3px">
                  Account Department
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                  Candidates who have joined — manage billing & payments
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={1.5}>
              <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '12px', px: 2.5, py: 1, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{candidates.length}</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, mt: 0.2 }}>Joined</Typography>
              </Box>
              <Tooltip title="Refresh">
                <IconButton onClick={fetchCandidates} disabled={loading}
                  sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                  {loading ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : <RefreshIcon />}
                </IconButton>
              </Tooltip>
              <Button variant="contained" startIcon={<FileDownloadIcon />} onClick={handleExport}
                sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 700, borderRadius: '12px', textTransform: 'none', border: '2px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                Export
              </Button>
            </Box>
          </Box>

          {/* DataGrid */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(63,81,181,0.08)', height: 'calc(100vh - 220px)' }}>
            <Box sx={{ px: 3, py: 1.5, background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '1px solid #c5cae9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#3f51b5', borderRadius: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" textTransform="uppercase" letterSpacing="0.06em">
                  Joined Candidates
                </Typography>
              </Box>
              <Chip label={`${candidates.length} records`} size="small" sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700, fontSize: '0.75rem' }} />
            </Box>

            <DataGrid
              rows={candidates.map(c => ({ id: c._id, ...c }))}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
              disableRowSelectionOnClick
              components={{ Toolbar: GridToolbar }}
              sx={{
                border: 'none',
                height: 'calc(100% - 52px)',
                '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', fontSize: '0.83rem', color: '#334155', '&:focus': { outline: 'none' } },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Billing Dialog */}
      <Dialog open={billingDialog.open} onClose={() => setBillingDialog({ open: false, row: null })} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <AccountBalanceIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight={700} color="#fff" lineHeight={1.2}>Billing Information</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
              {billingDialog.row?.candidateName}
            </Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <TextField label="Billing Date" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={billingForm.billingDate}
                onChange={(e) => setBillingForm(p => ({ ...p, billingDate: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Billing Amount (₹)" type="number" size="small" fullWidth
                value={billingForm.billingAmount}
                onChange={(e) => setBillingForm(p => ({ ...p, billingAmount: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Payment Status" size="small" fullWidth
                value={billingForm.paymentStatus}
                onChange={(e) => setBillingForm(p => ({ ...p, paymentStatus: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                <MenuItem value="Pending">Pending</MenuItem>
                <MenuItem value="Paid">Paid</MenuItem>
                <MenuItem value="Failed">Failed</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Payment Date" type="date" size="small" fullWidth
                InputLabelProps={{ shrink: true }}
                value={billingForm.paymentDate}
                onChange={(e) => setBillingForm(p => ({ ...p, paymentDate: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField select label="Payment Mode" size="small" fullWidth
                value={billingForm.paymentMode}
                onChange={(e) => setBillingForm(p => ({ ...p, paymentMode: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                <MenuItem value="">Select</MenuItem>
                <MenuItem value="Cash">Cash</MenuItem>
                <MenuItem value="GPay">GPay</MenuItem>
                <MenuItem value="Bank">Bank Transfer</MenuItem>
              </TextField>
            </Grid>
            <Grid item xs={12}>
              <TextField label="Payment Remarks" multiline rows={2} size="small" fullWidth
                value={billingForm.paymentRemark}
                onChange={(e) => setBillingForm(p => ({ ...p, paymentRemark: e.target.value }))}
                sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
            </Grid>
          </Grid>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff' }}>
          <Button variant="outlined" onClick={() => setBillingDialog({ open: false, row: null })}
            sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSaveBilling}
            sx={{ borderRadius: '8px', bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' }, textTransform: 'none', fontWeight: 700, px: 3 }}>
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar(p => ({ ...p, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(p => ({ ...p, open: false }))} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default AccountDepartment;
