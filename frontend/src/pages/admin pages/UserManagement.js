import React, { useCallback, useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogContent,
  DialogActions, TextField, Select, MenuItem, FormControl, InputLabel,
  IconButton, Chip, Tooltip, Alert, Switch,
  Card, CardContent, Grid, InputAdornment, Divider, Avatar,
  Table, TableHead, TableBody, TableRow, TableCell, CircularProgress,
} from '@mui/material';
import { toast } from 'react-toastify';
import { DataGrid } from '@mui/x-data-grid';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import SearchIcon from '@mui/icons-material/Search';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import PhoneIcon from '@mui/icons-material/Phone';
import HomeIcon from '@mui/icons-material/Home';
import BadgeIcon from '@mui/icons-material/Badge';
import WcIcon from '@mui/icons-material/Wc';
import WorkIcon from '@mui/icons-material/Work';
import CloseIcon from '@mui/icons-material/Close';
import AccountBoxIcon from '@mui/icons-material/AccountBox';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import HistoryIcon from '@mui/icons-material/History';
import axios from 'axios';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import { API_BASE_URL } from '../../config/api.config';

const ROLES = ['HR', 'Sales', 'teamleader'];

const roleColors = {
  HR: { bg: '#e3f2fd', color: '#1565c0' },
  Sales: { bg: '#e8f5e9', color: '#2e7d32' },
  teamleader: { bg: '#fff3e0', color: '#e65100' },
};

const RoleChip = styled(Chip)(({ rolename }) => ({
  fontWeight: 600,
  borderRadius: '6px',
  backgroundColor: roleColors[rolename]?.bg || '#f5f5f5',
  color: roleColors[rolename]?.color || '#333',
}));

const emptyForm = {
  firstName: '', lastName: '', email: '', password: '',
  mobileNo: '', address: '', gender: 'Male', role: 'HR',
};

const dialogFieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '10px',
    background: '#fff',
    '& fieldset': { borderColor: '#e2e5f1' },
    '&:hover fieldset': { borderColor: '#6366f1' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '2px' },
  },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
};

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('All');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, user: null });
  const [editUser, setEditUser] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formError, setFormError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});

  // ── Employee Profile state ─────────────────────────────────────────────────
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [profileUser, setProfileUser] = useState(null);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileFiles, setProfileFiles] = useState({});

  // ── Reassign state ─────────────────────────────────────────────────────────
  const [reassignDialog, setReassignDialog] = useState({ open: false, user: null });
  const [reassignForm, setReassignForm] = useState({ firstName: '', lastName: '', mobileNo: '', address: '', password: '' });
  const [reassignErrors, setReassignErrors] = useState({});
  const [reassignSaving, setReassignSaving] = useState(false);

  // ── Tenure History state ───────────────────────────────────────────────────
  const [historyDialog, setHistoryDialog] = useState({ open: false, user: null });
  const [archivedProfile, setArchivedProfile] = useState({ open: false, data: null });
  const emptyProfile = {
    fatherHusbandName: '', dateOfBirth: '', maritalStatus: '', nationality: '',
    alternateNumber: '', currentAddress: '', permanentAddress: '',
    position: '', department: '', dateOfJoining: '', workLocation: '', reportingManager: '',
    education: [{ qualification: '', boardUniversity: '', year: '', percentage: '' }],
    workExperience: [{ companyName: '', designation: '', duration: '', lastCTC: '' }],
    currentCTC: '', offeredCTC: '', paymentMode: '',
    bankName: '', accountHolderName: '', accountNumber: '', ifscCode: '', bankBranch: '',
    emergencyName: '', emergencyRelation: '', emergencyContact: '',
  };
  const [profileForm, setProfileForm] = useState(emptyProfile);

  const token = sessionStorage.getItem('token');
  const headers = { Authorization: `Bearer ${token}` };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/manage-users`, { headers });
      const sorted = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setUsers(sorted);
    } catch {
      showSnack('Failed to fetch users', 'error');
    } finally {
      setLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  useEffect(() => {
    let data = [...users];
    if (roleFilter !== 'All') data = data.filter(u => u.role === roleFilter);
    if (search) {
      const s = search.toLowerCase();
      data = data.filter(u =>
        `${u.firstName} ${u.lastName}`.toLowerCase().includes(s) ||
        u.email.toLowerCase().includes(s) ||
        u.mobileNo?.includes(s)
      );
    }
    setFiltered(data);
  }, [users, search, roleFilter]);

  const showSnack = (msg, severity = 'success') => {
    if (severity === 'error') toast.error(msg);
    else toast.success(msg);
  };

  const openAdd = () => { setEditUser(null); setForm(emptyForm); setFormError(''); setFieldErrors({}); setDialogOpen(true); };
  const openEdit = (user) => {
    setEditUser(user);
    setForm({
      firstName: user.firstName, lastName: user.lastName, email: user.email,
      password: '', mobileNo: user.mobileNo, address: user.address,
      gender: user.gender, role: user.role
    });
    setFormError('');
    setFieldErrors({});
    setDialogOpen(true);
  };

  const validate = () => {
    const errors = {};
    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    else if (!/^[a-zA-Z\s]+$/.test(form.firstName)) errors.firstName = 'Only letters allowed';

    if (!form.lastName.trim()) errors.lastName = 'Last name is required';
    else if (!/^[a-zA-Z\s]+$/.test(form.lastName)) errors.lastName = 'Only letters allowed';

    if (!form.email.trim()) errors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) errors.email = 'Enter a valid email';

    if (!editUser && !form.password) errors.password = 'Password is required';
    else if (!editUser && form.password.length < 6) errors.password = 'Minimum 6 characters';

    if (!form.mobileNo.trim()) errors.mobileNo = 'Mobile number is required';
    else if (!/^[6-9]\d{9}$/.test(form.mobileNo)) errors.mobileNo = 'Enter valid 10-digit Indian mobile no';

    if (!form.address.trim()) errors.address = 'Address is required';
    else if (form.address.trim().length < 5) errors.address = 'Address too short';

    return errors;
  };

  const handleFieldChange = (key, value) => {
    setForm(p => ({ ...p, [key]: value }));
    if (fieldErrors[key]) setFieldErrors(p => ({ ...p, [key]: '' }));
  };

  const handleSave = async () => {
    const errors = validate();
    if (Object.keys(errors).length > 0) { setFieldErrors(errors); return; }
    setFormError('');
    try {
      if (editUser) {
        await axios.put(`${API_BASE_URL}/manage-users/${editUser._id}`, form, { headers });
        showSnack('User updated successfully');
      } else {
        await axios.post(`${API_BASE_URL}/manage-users`, form, { headers });
        showSnack('User created successfully');
      }
      setDialogOpen(false);
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Something went wrong');
    }
  };

  const handleToggleActive = async (user) => {
    try {
      const res = await axios.patch(`${API_BASE_URL}/manage-users/${user._id}/toggle-active`, {}, { headers });
      setUsers(prev => prev.map(u => u._id === user._id ? { ...u, isActive: res.data.isActive } : u));
      showSnack(`User ${res.data.isActive ? 'activated' : 'deactivated'} successfully`);
    } catch {
      showSnack('Failed to update status', 'error');
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/manage-users/${deleteDialog.user._id}`, { headers });
      showSnack('User deleted successfully');
      setDeleteDialog({ open: false, user: null });
      fetchUsers();
    } catch {
      showSnack('Failed to delete user', 'error');
    }
  };

  // ── Reassign handlers ──────────────────────────────────────────────────────
  const openReassign = (user) => {
    setReassignForm({ firstName: '', lastName: '', mobileNo: '', address: '', password: '' });
    setReassignErrors({});
    setReassignDialog({ open: true, user });
  };

  const handleReassign = async () => {
    const errors = {};
    if (!reassignForm.firstName.trim()) errors.firstName = 'Required';
    if (!reassignForm.lastName.trim()) errors.lastName = 'Required';
    if (!reassignForm.mobileNo.trim()) errors.mobileNo = 'Required';
    else if (!/^[6-9]\d{9}$/.test(reassignForm.mobileNo)) errors.mobileNo = 'Invalid';
    if (!reassignForm.address.trim()) errors.address = 'Required';

    if (Object.keys(errors).length) { setReassignErrors(errors); return; }

    setReassignSaving(true);
    try {
      await axios.patch(
        `${API_BASE_URL}/manage-users/${reassignDialog.user._id}/reassign`,
        reassignForm,
        { headers }
      );
      toast.success(`Account reassigned to ${reassignForm.firstName} ${reassignForm.lastName}. New tenure started.`);
      setReassignDialog({ open: false, user: null });
      fetchUsers();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Reassign failed');
    } finally {
      setReassignSaving(false);
    }
  };

  // ── Profile handlers ───────────────────────────────────────────────────────
  const fmt = (d) => d ? new Date(d).toISOString().split('T')[0] : '';

  const openProfile = (user) => {
    setProfileUser(user);
    setProfileFiles({});
    setProfileForm({
      fatherHusbandName: user.fatherHusbandName || '',
      dateOfBirth: fmt(user.dateOfBirth),
      maritalStatus: user.maritalStatus || '',
      nationality: user.nationality || '',
      alternateNumber: user.alternateNumber || '',
      currentAddress: user.currentAddress || '',
      permanentAddress: user.permanentAddress || '',
      position: user.position || '',
      department: user.department || '',
      dateOfJoining: fmt(user.dateOfJoining),
      workLocation: user.workLocation || '',
      reportingManager: user.reportingManager || '',
      education: user.education?.length
        ? user.education
        : [{ qualification: '', boardUniversity: '', year: '', percentage: '' }],
      workExperience: user.workExperience?.length
        ? user.workExperience
        : [{ companyName: '', designation: '', duration: '', lastCTC: '' }],
      currentCTC: user.currentCTC || '',
      offeredCTC: user.offeredCTC || '',
      paymentMode: user.paymentMode || '',
      bankName: user.bankName || '',
      accountHolderName: user.accountHolderName || '',
      accountNumber: user.accountNumber || '',
      ifscCode: user.ifscCode || '',
      bankBranch: user.bankBranch || '',
      emergencyName: user.emergencyName || '',
      emergencyRelation: user.emergencyRelation || '',
      emergencyContact: user.emergencyContact || '',
    });
    setProfileDialogOpen(true);
  };

  const handleProfileSave = async () => {
    setProfileSaving(true);
    try {
      const fd = new FormData();
      // scalar fields
      Object.entries(profileForm).forEach(([k, v]) => {
        if (k === 'education' || k === 'workExperience') {
          fd.append(k, JSON.stringify(v));
        } else {
          fd.append(k, v ?? '');
        }
      });
      // files
      Object.entries(profileFiles).forEach(([k, f]) => { if (f) fd.append(k, f); });

      const res = await axios.put(
        `${API_BASE_URL}/manage-users/${profileUser._id}/profile`,
        fd,
        { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
      );
      setUsers(prev => prev.map(u => u._id === profileUser._id ? { ...u, ...res.data } : u));
      toast.success('Employee profile saved');
      setProfileDialogOpen(false);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Save failed');
    } finally {
      setProfileSaving(false);
    }
  };

  const DocUpload = ({ field, label, existingUrl }) => (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, py: 0.8, borderBottom: '1px solid #f0f2ff' }}>
      <Typography variant="body2" sx={{ flexGrow: 1, color: '#334155', fontSize: '0.83rem' }}>{label}</Typography>
      {existingUrl && (
        <Tooltip title="View uploaded file">
          <IconButton size="small" onClick={() => window.open(existingUrl, '_blank')}>
            <VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} />
          </IconButton>
        </Tooltip>
      )}
      <input type="file" id={`doc-${field}`} accept=".pdf,.jpg,.jpeg,.png"
        style={{ display: 'none' }}
        onChange={e => setProfileFiles(p => ({ ...p, [field]: e.target.files[0] || null }))} />
      <label htmlFor={`doc-${field}`}>
        <Button component="span" size="small" variant="outlined" startIcon={<CloudUploadIcon />}
          sx={{ borderRadius: '8px', fontSize: '0.72rem', textTransform: 'none', borderColor: '#9fa8da', color: '#3f51b5' }}>
          {profileFiles[field] ? profileFiles[field].name : (existingUrl ? 'Replace' : 'Upload')}
        </Button>
      </label>
    </Box>
  );

  const columns = [
    { field: 'firstName', headerName: 'First Name', flex: 1, minWidth: 120 },
    { field: 'lastName', headerName: 'Last Name', flex: 1, minWidth: 120 },
    { field: 'email', headerName: 'Email', flex: 1.5, minWidth: 180 },
    { field: 'mobileNo', headerName: 'Mobile', flex: 1, minWidth: 120 },
    { field: 'address', headerName: 'Address', flex: 1.5, minWidth: 160 },
    {
      field: 'role', headerName: 'Role', width: 130,
      renderCell: ({ value }) => <RoleChip label={value} rolename={value} size="small" />,
    },
    {
      field: 'isActive', headerName: 'Status', width: 130,
      renderCell: ({ row }) => (
        <Tooltip title={row.isActive ? 'Click to Deactivate' : 'Click to Activate'}>
          <Switch
            checked={!!row.isActive}
            onChange={() => handleToggleActive(row)}
            color="success"
            size="small"
          />
        </Tooltip>
      ),
    },
    {
      field: 'actions', headerName: 'Actions', width: 220, sortable: false,
      renderCell: ({ row }) => (
        <Box display="flex" gap={0.5} alignItems="center">
          <Tooltip title="Employee Profile">
            <IconButton size="small" onClick={() => openProfile(row)} sx={{ color: '#7c3aed' }}>
              <AccountBoxIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit">
            <IconButton size="small" onClick={() => openEdit(row)} sx={{ color: '#1976d2' }}>
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          {/* Reassign — only for deactivated users */}
          {!row.isActive && (
            <Tooltip title="Reassign to new person (same email/password)">
              <IconButton size="small" onClick={() => openReassign(row)}
                sx={{
                  color: '#059669', bgcolor: '#d1fae5', borderRadius: '6px',
                  '&:hover': { bgcolor: '#a7f3d0' }
                }}>
                <SwapHorizIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          {/* Tenure History */}
          {row.tenureHistory?.length > 0 && (
            <Tooltip title="View tenure history">
              <IconButton size="small" onClick={() => setHistoryDialog({ open: true, user: row })}
                sx={{ color: '#7c3aed' }}>
                <HistoryIcon fontSize="small" />
              </IconButton>
            </Tooltip>
          )}
          <Tooltip title="Delete">
            <IconButton size="small" onClick={() => setDeleteDialog({ open: true, user: row })} sx={{ color: '#d32f2f' }}>
              <DeleteIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
  ];

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f4f6fb' }}>
      <Sidebar />
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Box sx={{ p: 3 }}>
          <Typography variant="h5" fontWeight={700} mb={3} color="#1e1e2f">
            User Management
          </Typography>

          {/* Stats */}
          <Grid container spacing={2} mb={3}>
            {[
              { label: 'Total Users', value: stats.total, color: '#1976d2' },
              { label: 'Active', value: stats.active, color: '#2e7d32' },
              { label: 'Inactive', value: stats.inactive, color: '#d32f2f' },
            ].map(s => (
              <Grid item xs={12} sm={4} key={s.label}>
                <Card sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.07)' }}>
                  <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <PersonIcon sx={{ color: s.color, fontSize: 36 }} />
                    <Box>
                      <Typography variant="h5" fontWeight={700} color={s.color}>{s.value}</Typography>
                      <Typography variant="body2" color="text.secondary">{s.label}</Typography>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>

          {/* Filters + Add */}
          <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              size="small" placeholder="Search by name, email, mobile..."
              value={search} onChange={e => setSearch(e.target.value)}
              InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" /></InputAdornment> }}
              sx={{ minWidth: 260 }}
            />
            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Role</InputLabel>
              <Select value={roleFilter} label="Role" onChange={e => setRoleFilter(e.target.value)}>
                <MenuItem value="All">All Roles</MenuItem>
                {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
              </Select>
            </FormControl>
            <Button variant="contained" startIcon={<AddIcon />} onClick={openAdd}
              sx={{ ml: 'auto', borderRadius: 2, textTransform: 'none', fontWeight: 600 }}>
              Add User
            </Button>
          </Box>

          {/* DataGrid */}
          <Box sx={{ bgcolor: '#fff', borderRadius: 2, boxShadow: '0 2px 8px rgba(0,0,0,0.07)', overflow: 'hidden', height: 520 }}>
            <DataGrid
              rows={filtered}
              columns={columns}
              getRowId={row => row._id}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 50 } } }}
              disableRowSelectionOnClick
              sx={{
                height: '100%',
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { bgcolor: '#f0f4ff', fontWeight: 700 },
                '& .MuiDataGrid-virtualScroller': { overflowY: 'auto' },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>

        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <BadgeIcon sx={{ color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '17px' }}>
                {editUser ? 'Edit User' : 'Create New User'}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>
                {editUser ? 'Update user information' : 'Fill in the details to add a new user'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setDialogOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: '#f8f9ff' }}>
          {formError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{formError}</Alert>}

          {/* Personal Info Section */}
          <Box sx={{ mb: 2.5 }}>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
              Personal Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth size="small" label="First Name *"
                  value={form.firstName}
                  onChange={e => handleFieldChange('firstName', e.target.value)}
                  error={!!fieldErrors.firstName} helperText={fieldErrors.firstName}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment> }}
                  sx={dialogFieldSx}
                />
                <TextField
                  fullWidth size="small" label="Last Name *"
                  value={form.lastName}
                  onChange={e => handleFieldChange('lastName', e.target.value)}
                  error={!!fieldErrors.lastName} helperText={fieldErrors.lastName}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PersonIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment> }}
                  sx={dialogFieldSx}
                />
              </Box>
              <Box sx={{ display: 'flex', gap: 2 }}>
                <FormControl fullWidth size="small" sx={dialogFieldSx}>
                  <InputLabel>Gender *</InputLabel>
                  <Select value={form.gender} label="Gender *"
                    onChange={e => handleFieldChange('gender', e.target.value)}
                    startAdornment={<InputAdornment position="start"><WcIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment>}>
                    {['Male', 'Female', 'Other'].map(g => <MenuItem key={g} value={g}>{g}</MenuItem>)}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth size="small" label="Mobile No *"
                  value={form.mobileNo}
                  onChange={e => handleFieldChange('mobileNo', e.target.value.replace(/\D/g, '').slice(0, 10))}
                  error={!!fieldErrors.mobileNo} helperText={fieldErrors.mobileNo}
                  inputProps={{ maxLength: 10 }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment> }}
                  sx={dialogFieldSx}
                />
              </Box>
              <TextField
                fullWidth size="small" label="Address *"
                value={form.address}
                onChange={e => handleFieldChange('address', e.target.value)}
                error={!!fieldErrors.address} helperText={fieldErrors.address}
                InputProps={{ startAdornment: <InputAdornment position="start"><HomeIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment> }}
                sx={dialogFieldSx}
              />
            </Box>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Account Info Section */}
          <Box>
            <Typography sx={{ fontSize: '12px', fontWeight: 700, color: '#6366f1', textTransform: 'uppercase', letterSpacing: 1, mb: 1.5 }}>
              Account Information
            </Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField
                fullWidth size="small" label="Email *" type="email"
                value={form.email}
                onChange={e => handleFieldChange('email', e.target.value)}
                error={!!fieldErrors.email} helperText={fieldErrors.email}
                InputProps={{ startAdornment: <InputAdornment position="start"><EmailIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment> }}
                sx={dialogFieldSx}
              />
              <Box sx={{ display: 'flex', gap: 2 }}>
                <TextField
                  fullWidth size="small" type="password"
                  label={editUser ? 'New Password (leave blank to keep)' : 'Password *'}
                  value={form.password}
                  onChange={e => handleFieldChange('password', e.target.value)}
                  error={!!fieldErrors.password} helperText={fieldErrors.password}
                  InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment> }}
                  sx={dialogFieldSx}
                />
                <FormControl fullWidth size="small" sx={dialogFieldSx}>
                  <InputLabel>Role *</InputLabel>
                  <Select value={form.role} label="Role *"
                    onChange={e => setForm(p => ({ ...p, role: e.target.value }))}
                    startAdornment={<InputAdornment position="start"><WorkIcon sx={{ fontSize: 18, color: '#6366f1' }} /></InputAdornment>}>
                    {ROLES.map(r => <MenuItem key={r} value={r}>{r}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8f9ff', borderTop: '1px solid #e8eaf6', gap: 1 }}>
          <Button onClick={() => setDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#6b7280', borderRadius: 2, px: 3 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleSave}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4,
              background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
              boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
              '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)' },
            }}>
            {editUser ? 'Update User' : 'Create User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirm */}
      <Dialog
        open={deleteDialog.open}
        onClose={() => setDeleteDialog({ open: false, user: null })}
        maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 38, height: 38 }}>
            <DeleteIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Avatar>
          <Box>
            <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Delete User</Typography>
            <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '12px' }}>This action cannot be undone</Typography>
          </Box>
        </Box>
        <DialogContent sx={{ pt: 3, pb: 1, px: 3 }}>
          <Typography sx={{ color: '#374151', fontSize: '14px' }}>
            Are you sure you want to delete{' '}
            <strong style={{ color: '#111827' }}>
              {deleteDialog.user?.firstName} {deleteDialog.user?.lastName}
            </strong>?
            All data associated with this user will be permanently removed.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button
            onClick={() => setDeleteDialog({ open: false, user: null })}
            sx={{ textTransform: 'none', color: '#6b7280', borderRadius: 2, px: 3, border: '1px solid #e5e7eb' }}
          >
            Cancel
          </Button>
          <Button
            variant="contained" onClick={handleDelete}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 3,
              background: 'linear-gradient(135deg, #ef4444 0%, #b91c1c 100%)',
              boxShadow: '0 4px 12px rgba(239,68,68,0.4)',
              '&:hover': { background: 'linear-gradient(135deg, #dc2626 0%, #991b1b 100%)' },
            }}
          >
            Yes, Delete
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Reassign Dialog ── */}
      <Dialog open={reassignDialog.open} onClose={() => setReassignDialog({ open: false, user: null })}
        maxWidth="xs" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <SwapHorizIcon sx={{ color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Reassign Account</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>
                {reassignDialog.user?.email}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setReassignDialog({ open: false, user: null })} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: '#f8fffe' }}>
          {/* Info box */}
          <Box sx={{ bgcolor: '#ecfdf5', border: '1px solid #6ee7b7', borderRadius: 2, p: 2, mb: 3 }}>
            <Typography variant="body2" sx={{ color: '#065f46', fontWeight: 600, mb: 0.5 }}>
              ✅ Same email & password reuse
            </Typography>
            <Typography variant="caption" sx={{ color: '#047857' }}>
              Purana HR <strong>{reassignDialog.user?.firstName} {reassignDialog.user?.lastName}</strong> ka data unke naam se safe rahega.
              Naye HR ka data alag tenure mein track hoga.
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth size="small" label="New HR First Name *"
                value={reassignForm.firstName}
                onChange={e => { setReassignForm(p => ({ ...p, firstName: e.target.value })); setReassignErrors(p => ({ ...p, firstName: '' })); }}
                error={!!reassignErrors.firstName} helperText={reassignErrors.firstName}
                sx={dialogFieldSx}
              />
              <TextField
                fullWidth size="small" label="Last Name *"
                value={reassignForm.lastName}
                onChange={e => { setReassignForm(p => ({ ...p, lastName: e.target.value })); setReassignErrors(p => ({ ...p, lastName: '' })); }}
                error={!!reassignErrors.lastName} helperText={reassignErrors.lastName}
                sx={dialogFieldSx}
              />
            </Box>
            <Box sx={{ display: 'flex', gap: 1.5 }}>
              <TextField
                fullWidth size="small" label="New Mobile No *"
                value={reassignForm.mobileNo}
                onChange={e => { setReassignForm(p => ({ ...p, mobileNo: e.target.value.replace(/\D/g, '').slice(0, 10) })); setReassignErrors(p => ({ ...p, mobileNo: '' })); }}
                error={!!reassignErrors.mobileNo} helperText={reassignErrors.mobileNo}
                InputProps={{ startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ fontSize: 18, color: '#059669' }} /></InputAdornment> }}
                sx={dialogFieldSx}
              />
              <TextField
                fullWidth size="small" label="New Address *"
                value={reassignForm.address}
                onChange={e => { setReassignForm(p => ({ ...p, address: e.target.value })); setReassignErrors(p => ({ ...p, address: '' })); }}
                error={!!reassignErrors.address} helperText={reassignErrors.address}
                InputProps={{ startAdornment: <InputAdornment position="start"><HomeIcon sx={{ fontSize: 18, color: '#059669' }} /></InputAdornment> }}
                sx={dialogFieldSx}
              />
            </Box>
            <TextField
              fullWidth size="small" type="password"
              label="New Password (optional — leave blank to keep same)"
              value={reassignForm.password}
              onChange={e => setReassignForm(p => ({ ...p, password: e.target.value }))}
              InputProps={{ startAdornment: <InputAdornment position="start"><LockIcon sx={{ fontSize: 18, color: '#059669' }} /></InputAdornment> }}
              sx={dialogFieldSx}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, bgcolor: '#f8fffe', borderTop: '1px solid #d1fae5', gap: 1 }}>
          <Button onClick={() => setReassignDialog({ open: false, user: null })}
            sx={{ textTransform: 'none', color: '#6b7280', borderRadius: 2, px: 3 }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleReassign} disabled={reassignSaving}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4,
              background: 'linear-gradient(135deg, #059669 0%, #047857 100%)',
              boxShadow: '0 4px 12px rgba(5,150,105,0.35)',
              '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #065f46 100%)' }
            }}>
            {reassignSaving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Reassign Account'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Tenure History Dialog ── */}
      <Dialog open={historyDialog.open} onClose={() => setHistoryDialog({ open: false, user: null })}
        maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 40, height: 40 }}>
              <HistoryIcon sx={{ color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '16px' }}>Tenure History</Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '12px' }}>{historyDialog.user?.email}</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setHistoryDialog({ open: false, user: null })} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3 }}>
          {historyDialog.user?.tenureHistory?.length > 0 ? (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
              {historyDialog.user.tenureHistory.map((t, i) => (
                <Box key={i} sx={{ p: 2, bgcolor: '#f5f3ff', borderRadius: 2, border: '1px solid #e9d5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="body2" sx={{ fontWeight: 700, color: '#4f46e5' }}>{t.name}</Typography>
                    <Typography variant="caption" sx={{ color: '#6b7280' }}>
                      {new Date(t.startedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                      {' → '}
                      {new Date(t.endedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </Typography>
                  </Box>
                  {t.profileSnapshot && (
                    <Button
                      size="small"
                      variant="outlined"
                      onClick={() => setArchivedProfile({ open: true, data: t.profileSnapshot })}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: '11px' }}
                    >
                      View Profile
                    </Button>
                  )}
                </Box>
              ))}
              {/* Current tenure */}
              <Box sx={{ p: 2, bgcolor: '#ecfdf5', borderRadius: 2, border: '1px solid #6ee7b7' }}>
                <Typography variant="body2" sx={{ fontWeight: 700, color: '#059669' }}>
                  {historyDialog.user?.firstName} {historyDialog.user?.lastName} (Current)
                </Typography>
                <Typography variant="caption" sx={{ color: '#047857' }}>
                  {historyDialog.user?.tenureStartedAt
                    ? new Date(historyDialog.user.tenureStartedAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
                    : '—'} → Present
                </Typography>
              </Box>
            </Box>
          ) : (
            <Typography variant="body2" sx={{ color: '#9ca3af', textAlign: 'center', py: 3 }}>
              No previous tenures found.
            </Typography>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setHistoryDialog({ open: false, user: null })} variant="contained" sx={{ borderRadius: 2, textTransform: 'none' }}>
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Archived Profile Snapshot Dialog ── */}
      <Dialog open={archivedProfile.open} onClose={() => setArchivedProfile({ open: false, data: null })}
        maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}>
        <Box sx={{ background: 'linear-gradient(135deg, #1e293b 0%, #334155 100%)', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Typography sx={{ color: '#fff', fontWeight: 700 }}>Archived Employee Profile</Typography>
          <IconButton onClick={() => setArchivedProfile({ open: false, data: null })} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>
        <DialogContent sx={{ p: 3, bgcolor: '#f8fafc' }}>
          {archivedProfile.data && (
            <Grid container spacing={3}>
              <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700}>PERSONAL & CONTACT</Typography><Divider /></Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Full Name</Typography>
                <Typography variant="body2" fontWeight={600}>{archivedProfile.data.firstName} {archivedProfile.data.lastName}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Mobile & Gender</Typography>
                <Typography variant="body2">{archivedProfile.data.mobileNo} ({archivedProfile.data.gender})</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">Father/Husband Name</Typography>
                <Typography variant="body2">{archivedProfile.data.fatherHusbandName || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary">DOB & Status</Typography>
                <Typography variant="body2">{archivedProfile.data.dateOfBirth ? new Date(archivedProfile.data.dateOfBirth).toLocaleDateString() : '—'} | {archivedProfile.data.maritalStatus || '—'}</Typography>
              </Grid>
              <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>EMPLOYMENT</Typography><Divider /></Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Position</Typography>
                <Typography variant="body2">{archivedProfile.data.position || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Department</Typography>
                <Typography variant="body2">{archivedProfile.data.department || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Joining Date</Typography>
                <Typography variant="body2">{archivedProfile.data.dateOfJoining ? new Date(archivedProfile.data.dateOfJoining).toLocaleDateString() : '—'}</Typography>
              </Grid>
              <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>BANK DETAILS</Typography><Divider /></Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Bank Name</Typography>
                <Typography variant="body2">{archivedProfile.data.bankName || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">Account Number</Typography>
                <Typography variant="body2">{archivedProfile.data.accountNumber || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary">IFSC Code</Typography>
                <Typography variant="body2">{archivedProfile.data.ifscCode || '—'}</Typography>
              </Grid>
              {/* Documents */}
              <Grid item xs={12}><Typography variant="subtitle2" color="primary" fontWeight={700} sx={{ mt: 2 }}>UPLOADED DOCUMENTS</Typography><Divider /></Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mt: 1 }}>
                  {[
                    { label: 'Aadhaar', url: archivedProfile.data.docAadhaar },
                    { label: 'PAN', url: archivedProfile.data.docPAN },
                    { label: 'Resume', url: archivedProfile.data.docResume },
                    { label: 'Certs', url: archivedProfile.data.docEducationalCerts },
                    { label: 'Exp Letter', url: archivedProfile.data.docExperienceLetters },
                    { label: 'Photo', url: archivedProfile.data.docPassportPhoto },
                  ].map((doc, idx) => doc.url && (
                    <Button key={idx} size="small" variant="text" startIcon={<VisibilityIcon />} onClick={() => window.open(doc.url, '_blank')}>
                      {doc.label}
                    </Button>
                  ))}
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: '#f1f5f9' }}>
          <Button onClick={() => setArchivedProfile({ open: false, data: null })} variant="contained" sx={{ bgcolor: '#334155', '&:hover': { bgcolor: '#1e293b' } }}>
            Back to History
          </Button>
        </DialogActions>
      </Dialog>


      {/* ── Employee Profile Dialog ── */}
      <Dialog open={profileDialogOpen} onClose={() => setProfileDialogOpen(false)}
        fullWidth maxWidth="lg"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '95vh', display: 'flex', flexDirection: 'column' } }}>

        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Avatar sx={{ bgcolor: 'rgba(255,255,255,0.2)', width: 44, height: 44 }}>
              <AccountBoxIcon sx={{ color: '#fff' }} />
            </Avatar>
            <Box>
              <Typography sx={{ color: '#fff', fontWeight: 700, fontSize: '17px' }}>
                Employee Profile — {profileUser?.firstName} {profileUser?.lastName}
              </Typography>
              <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '12px' }}>
                {profileUser?.role} · {profileUser?.email}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={() => setProfileDialogOpen(false)} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
            <CloseIcon />
          </IconButton>
        </Box>

        {/* Body */}
        <Box sx={{
          overflowY: 'auto', flexGrow: 1, p: 3,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { background: '#c5cae9', borderRadius: 3 },
        }}>
          {(() => {
            const sec = { fontWeight: 700, color: '#4F46E5', textTransform: 'uppercase', letterSpacing: '0.07em', fontSize: '0.72rem', mb: 1.5 };
            const f = { '& .MuiOutlinedInput-root': { borderRadius: '8px' } };
            const pf = profileForm;
            const set = (k, v) => setProfileForm(p => ({ ...p, [k]: v }));

            return (
              <Grid container spacing={3}>

                {/* 1. Personal Details */}
                <Grid item xs={12}><Typography sx={sec}>1. Personal Details</Typography></Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Father's / Husband's Name" size="small" fullWidth sx={f} value={pf.fatherHusbandName} onChange={e => set('fatherHusbandName', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Date of Birth" type="date" size="small" fullWidth sx={f} InputLabelProps={{ shrink: true }} value={pf.dateOfBirth} onChange={e => set('dateOfBirth', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField select label="Marital Status" size="small" fullWidth sx={f} value={pf.maritalStatus} onChange={e => set('maritalStatus', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['Single', 'Married'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Nationality" size="small" fullWidth sx={f} value={pf.nationality} onChange={e => set('nationality', e.target.value)} />
                </Grid>

                {/* 2. Contact Details */}
                <Grid item xs={12}><Divider /><Typography sx={{ ...sec, mt: 2 }}>2. Contact Details</Typography></Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Alternate Number" size="small" fullWidth sx={f}
                    value={pf.alternateNumber}
                    onChange={e => set('alternateNumber', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputProps={{ maxLength: 10 }} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Current Address" size="small" fullWidth sx={f} value={pf.currentAddress} onChange={e => set('currentAddress', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Permanent Address" size="small" fullWidth sx={f} value={pf.permanentAddress} onChange={e => set('permanentAddress', e.target.value)} />
                </Grid>

                {/* 3. Employment Details */}
                <Grid item xs={12}><Divider /><Typography sx={{ ...sec, mt: 2 }}>3. Employment Details</Typography></Grid>
                {[
                  ['position', 'Position'], ['department', 'Department'],
                  ['workLocation', 'Work Location'], ['reportingManager', 'Reporting Manager'],
                ].map(([k, lbl]) => (
                  <Grid item xs={12} sm={6} md={3} key={k}>
                    <TextField label={lbl} size="small" fullWidth sx={f} value={pf[k]} onChange={e => set(k, e.target.value)} />
                  </Grid>
                ))}
                <Grid item xs={12} sm={6} md={4}>
                  <TextField label="Date of Joining" type="date" size="small" fullWidth sx={f} InputLabelProps={{ shrink: true }} value={pf.dateOfJoining} onChange={e => set('dateOfJoining', e.target.value)} />
                </Grid>

                {/* 4. Educational Qualification */}
                <Grid item xs={12}>
                  <Divider />
                  <Box display="flex" alignItems="center" justifyContent="space-between" mt={2} mb={1.5}>
                    <Typography sx={sec}>4. Educational Qualification</Typography>
                    <Button size="small" variant="outlined" onClick={() => set('education', [...pf.education, { qualification: '', boardUniversity: '', year: '', percentage: '' }])}
                      sx={{ borderRadius: '8px', fontSize: '0.72rem', textTransform: 'none', borderColor: '#4F46E5', color: '#4F46E5' }}>+ Add Row</Button>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                        {['Qualification', 'Board/University', 'Year', 'Percentage', ''].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#4F46E5' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pf.education.map((row, i) => (
                        <TableRow key={i}>
                          {['qualification', 'boardUniversity', 'year', 'percentage'].map(k => (
                            <TableCell key={k}>
                              <TextField size="small" fullWidth sx={f} value={row[k]}
                                onChange={e => { const ed = [...pf.education]; ed[i][k] = e.target.value; set('education', ed); }} />
                            </TableCell>
                          ))}
                          <TableCell>
                            {pf.education.length > 1 && (
                              <IconButton size="small" color="error" onClick={() => set('education', pf.education.filter((_, idx) => idx !== i))}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>

                {/* 5. Work Experience */}
                <Grid item xs={12}>
                  <Divider />
                  <Box display="flex" alignItems="center" justifyContent="space-between" mt={2} mb={1.5}>
                    <Typography sx={sec}>5. Work Experience</Typography>
                    <Button size="small" variant="outlined" onClick={() => set('workExperience', [...pf.workExperience, { companyName: '', designation: '', duration: '', lastCTC: '' }])}
                      sx={{ borderRadius: '8px', fontSize: '0.72rem', textTransform: 'none', borderColor: '#4F46E5', color: '#4F46E5' }}>+ Add Row</Button>
                  </Box>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: '#f0f4ff' }}>
                        {['Company Name', 'Designation', 'Duration', 'Last CTC', ''].map(h => (
                          <TableCell key={h} sx={{ fontWeight: 700, fontSize: '0.75rem', color: '#4F46E5' }}>{h}</TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {pf.workExperience.map((row, i) => (
                        <TableRow key={i}>
                          {['companyName', 'designation', 'duration', 'lastCTC'].map(k => (
                            <TableCell key={k}>
                              <TextField size="small" fullWidth sx={f} value={row[k]}
                                onChange={e => { const we = [...pf.workExperience]; we[i][k] = e.target.value; set('workExperience', we); }} />
                            </TableCell>
                          ))}
                          <TableCell>
                            {pf.workExperience.length > 1 && (
                              <IconButton size="small" color="error" onClick={() => set('workExperience', pf.workExperience.filter((_, idx) => idx !== i))}>
                                <CloseIcon fontSize="small" />
                              </IconButton>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </Grid>

                {/* 6. Salary Details */}
                <Grid item xs={12}><Divider /><Typography sx={{ ...sec, mt: 2 }}>6. Salary Details</Typography></Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Current CTC" size="small" fullWidth sx={f} value={pf.currentCTC} onChange={e => set('currentCTC', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Offered CTC" size="small" fullWidth sx={f} value={pf.offeredCTC} onChange={e => set('offeredCTC', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Payment Mode" size="small" fullWidth sx={f} value={pf.paymentMode} onChange={e => set('paymentMode', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['Bank Transfer', 'Cash'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>

                {/* 7. Bank Details */}
                <Grid item xs={12}><Divider /><Typography sx={{ ...sec, mt: 2 }}>7. Bank Details</Typography></Grid>
                {[
                  ['bankName', 'Bank Name'], ['accountHolderName', 'Account Holder Name'],
                  ['accountNumber', 'Account Number'], ['ifscCode', 'IFSC Code'], ['bankBranch', 'Branch'],
                ].map(([k, lbl]) => (
                  <Grid item xs={12} sm={6} md={4} key={k}>
                    <TextField label={lbl} size="small" fullWidth sx={f} value={pf[k]} onChange={e => set(k, e.target.value)} />
                  </Grid>
                ))}

                {/* 8. Documents */}
                <Grid item xs={12}>
                  <Divider />
                  <Typography sx={{ ...sec, mt: 2 }}>8. Documents Submitted</Typography>
                  <Box sx={{ bgcolor: '#f8f9ff', borderRadius: '10px', border: '1px solid #e8eaf6', p: 2 }}>
                    {[
                      ['docAadhaar', 'Aadhaar Card'],
                      ['docPAN', 'PAN Card'],
                      ['docResume', 'Resume'],
                      ['docEducationalCerts', 'Educational Certificates'],
                      ['docExperienceLetters', 'Experience Letters'],
                      ['docPassportPhoto', 'Passport Size Photos'],
                    ].map(([field, label]) => (
                      <DocUpload key={field} field={field} label={label} existingUrl={profileUser?.[field]} />
                    ))}
                  </Box>
                </Grid>

                {/* 9. Emergency Contact */}
                <Grid item xs={12}><Divider /><Typography sx={{ ...sec, mt: 2 }}>9. Emergency Contact</Typography></Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Name" size="small" fullWidth sx={f} value={pf.emergencyName} onChange={e => set('emergencyName', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Relation" size="small" fullWidth sx={f} value={pf.emergencyRelation} onChange={e => set('emergencyRelation', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Contact Number" size="small" fullWidth sx={f}
                    value={pf.emergencyContact}
                    onChange={e => set('emergencyContact', e.target.value.replace(/\D/g, '').slice(0, 10))}
                    inputProps={{ maxLength: 10 }} />
                </Grid>

              </Grid>
            );
          })()}
        </Box>

        {/* Footer */}
        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', display: 'flex', justifyContent: 'flex-end', gap: 1.5, flexShrink: 0 }}>
          <Button onClick={() => setProfileDialogOpen(false)}
            sx={{ textTransform: 'none', color: '#6b7280', borderRadius: 2, px: 3, border: '1px solid #e5e7eb' }}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleProfileSave} disabled={profileSaving}
            sx={{
              textTransform: 'none', fontWeight: 700, borderRadius: 2, px: 4, minWidth: 130,
              background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
              boxShadow: '0 4px 14px rgba(79,70,229,0.4)',
              '&:hover': { background: 'linear-gradient(135deg, #4338CA, #6D28D9)' }
            }}>
            {profileSaving ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Save Profile'}
          </Button>
        </Box>
      </Dialog>
    </Box>
  );
}
