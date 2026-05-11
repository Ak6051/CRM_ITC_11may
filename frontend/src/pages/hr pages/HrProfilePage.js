import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Box, Typography, Dialog, DialogTitle,
  DialogContent, DialogActions, IconButton, InputAdornment,
  Avatar, Divider, Chip, CircularProgress, Snackbar, Alert,
  Grid, Paper,
} from '@mui/material';
import {
  Visibility, VisibilityOff, Edit as EditIcon,
  Lock as LockIcon, Person as PersonIcon,
  Email as EmailIcon, Phone as PhoneIcon,
  Home as HomeIcon, Save as SaveIcon,
  Wc as GenderIcon,
} from '@mui/icons-material';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

const SIDEBAR_WIDTH = 250;

const HrProfilePage = () => {
  const [user, setUser] = useState({
    firstName: '', lastName: '', email: '',
    mobileNo: '', address: '', gender: '',
  });
  const [isLoading, setIsLoading]               = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [passwordData, setPasswordData]         = useState({
    currentPassword: '', newPassword: '', confirmPassword: '',
  });
  const [showPassword, setShowPassword]         = useState({ current: false, new: false, confirm: false });
  const [snackbar, setSnackbar]                 = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/hr/profile`, {
          headers: { Authorization: token },
        });
        setUser(res.data);
      } catch (e) {
        console.error('Error fetching user data', e);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => setUser({ ...user, [e.target.name]: e.target.value });

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/hr/profile`, user, {
        headers: { Authorization: token },
      });
      setSnackbar({ open: true, message: 'Profile updated successfully', severity: 'success' });
    } catch (e) {
      setSnackbar({ open: true, message: 'Failed to update profile', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setSnackbar({ open: true, message: 'New passwords do not match', severity: 'error' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setSnackbar({ open: true, message: 'Password must be at least 6 characters', severity: 'error' });
      return;
    }
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/hr/change-password`, {
        currentPassword: passwordData.currentPassword,
        newPassword:     passwordData.newPassword,
      }, { headers: { Authorization: token, 'Content-Type': 'application/json' } });

      setSnackbar({ open: true, message: 'Password changed successfully', severity: 'success' });
      setPasswordData({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setChangePasswordOpen(false), 1500);
    } catch (e) {
      setSnackbar({ open: true, message: e.response?.data?.message || 'Failed to change password', severity: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const initials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'H';
  const fullName = `${user.firstName} ${user.lastName}`.trim() || 'HR User';

  const fields = [
    { name: 'firstName', label: 'First Name', icon: <PersonIcon />, xs: 6 },
    { name: 'lastName',  label: 'Last Name',  icon: <PersonIcon />, xs: 6 },
    { name: 'email',     label: 'Email',      icon: <EmailIcon />,  xs: 12, disabled: true },
    { name: 'mobileNo',  label: 'Mobile No',  icon: <PhoneIcon />,  xs: 6 },
    { name: 'gender',    label: 'Gender',     icon: <GenderIcon />, xs: 6 },
    { name: 'address',   label: 'Address',    icon: <HomeIcon />,   xs: 12 },
  ];

  const pwFields = [
    { field: 'current', name: 'currentPassword', label: 'Current Password' },
    { field: 'new',     name: 'newPassword',     label: 'New Password' },
    { field: 'confirm', name: 'confirmPassword', label: 'Confirm New Password' },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f8' }}>
      {/* Fixed Sidebar */}
      <div style={{ position: 'fixed', height: '100vh', width: SIDEBAR_WIDTH, backgroundColor: '#3f51b5', zIndex: 1000 }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <Box sx={{ flexGrow: 1, ml: `${SIDEBAR_WIDTH}px`, display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Box sx={{ position: 'sticky', top: 0, zIndex: 999, bgcolor: '#fff', boxShadow: '0 1px 4px rgba(63,81,181,0.12)' }}>
          <Navbar />
        </Box>

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3,
          '&::-webkit-scrollbar': { width: 6 },
          '&::-webkit-scrollbar-thumb': { background: '#c5cae9', borderRadius: 3 },
        }}>
          <Box sx={{ maxWidth: 860, mx: 'auto' }}>

            {/* ── Profile Card ── */}
            <Paper elevation={0} sx={{ borderRadius: 3, overflow: 'hidden', border: '1px solid #e8eaf6', mb: 3 }}>

              {/* Gradient header */}
              <Box sx={{
                background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
                px: 4, py: 4,
                display: 'flex', alignItems: 'center', gap: 3,
              }}>
                <Avatar sx={{
                  width: 80, height: 80,
                  bgcolor: 'rgba(255,255,255,0.25)',
                  color: '#fff',
                  fontSize: 28, fontWeight: 800,
                  border: '3px solid rgba(255,255,255,0.5)',
                }}>
                  {initials}
                </Avatar>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="#fff" lineHeight={1.2}>
                    {fullName}
                  </Typography>
                  <Typography fontSize={14} sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.5 }}>
                    {user.email}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, mt: 1 }}>
                    <Chip label="HR" size="small"
                      sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, fontSize: 12 }} />
                  </Box>
                </Box>
              </Box>

              {/* Form body */}
              <Box sx={{ p: 4 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                  <EditIcon sx={{ color: '#3f51b5', fontSize: 20 }} />
                  <Typography fontWeight={700} fontSize={16} color="#1e293b">Personal Information</Typography>
                </Box>

                <Grid container spacing={2.5}>
                  {fields.map(({ name, label, icon, xs, disabled }) => (
                    <Grid item xs={12} sm={xs} key={name}>
                      <TextField
                        label={label}
                        name={name}
                        value={user[name] || ''}
                        onChange={handleChange}
                        disabled={disabled}
                        fullWidth
                        size="small"
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              {React.cloneElement(icon, { sx: { fontSize: 18, color: '#9fa8da' } })}
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '10px',
                            bgcolor: disabled ? '#f8fafc' : '#fff',
                            '&:hover fieldset': { borderColor: '#3f51b5' },
                            '&.Mui-focused fieldset': { borderColor: '#3f51b5' },
                          },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#3f51b5' },
                        }}
                      />
                    </Grid>
                  ))}
                </Grid>

                <Divider sx={{ my: 3 }} />

                <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                  <Button
                    variant="outlined"
                    startIcon={<LockIcon />}
                    onClick={() => setChangePasswordOpen(true)}
                    disabled={isLoading}
                    sx={{
                      borderRadius: '10px', textTransform: 'none', fontWeight: 600,
                      borderColor: '#9fa8da', color: '#3f51b5',
                      '&:hover': { borderColor: '#3f51b5', bgcolor: '#f0f2ff' },
                    }}
                  >
                    Change Password
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={isLoading ? <CircularProgress size={16} color="inherit" /> : <SaveIcon />}
                    onClick={handleUpdate}
                    disabled={isLoading}
                    sx={{
                      borderRadius: '10px', textTransform: 'none', fontWeight: 700, px: 3,
                      background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
                      boxShadow: '0 3px 10px rgba(63,81,181,0.3)',
                      '&:hover': { background: 'linear-gradient(135deg, #303f9f 0%, #3f51b5 100%)' },
                    }}
                  >
                    {isLoading ? 'Saving...' : 'Save Changes'}
                  </Button>
                </Box>
              </Box>
            </Paper>

          </Box>
        </Box>
      </Box>

      {/* ── Change Password Dialog ── */}
      <Dialog
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        fullWidth maxWidth="xs"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{ width: 38, height: 38, borderRadius: '10px', bgcolor: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <LockIcon sx={{ color: '#fff', fontSize: 20 }} />
          </Box>
          <Box>
            <Typography fontWeight={700} color="#fff" fontSize={16}>Change Password</Typography>
            <Typography fontSize={12} sx={{ color: 'rgba(255,255,255,0.7)' }}>Update your account password</Typography>
          </Box>
        </Box>

        <DialogContent sx={{ pt: 3, pb: 1 }}>
          {pwFields.map(({ field, name, label }) => (
            <TextField
              key={name}
              label={label}
              name={name}
              type={showPassword[field] ? 'text' : 'password'}
              value={passwordData[name]}
              onChange={(e) => setPasswordData({ ...passwordData, [name]: e.target.value })}
              fullWidth size="small" margin="normal"
              disabled={isLoading}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setShowPassword(p => ({ ...p, [field]: !p[field] }))}>
                      {showPassword[field] ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  '&:hover fieldset': { borderColor: '#3f51b5' },
                  '&.Mui-focused fieldset': { borderColor: '#3f51b5' },
                },
                '& .MuiInputLabel-root.Mui-focused': { color: '#3f51b5' },
              }}
            />
          ))}
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, gap: 1 }}>
          <Button onClick={() => setChangePasswordOpen(false)} variant="outlined" disabled={isLoading}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#c5cae9', color: '#3f51b5' }}>
            Cancel
          </Button>
          <Button
            onClick={handleChangePassword}
            variant="contained"
            disabled={isLoading || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword}
            sx={{
              borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 3,
              background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
              '&:hover': { background: 'linear-gradient(135deg, #303f9f 0%, #3f51b5 100%)' },
            }}
          >
            {isLoading ? <CircularProgress size={18} color="inherit" /> : 'Update Password'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar open={snackbar.open} autoHideDuration={4000}
        onClose={() => setSnackbar(s => ({ ...s, open: false }))}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar(s => ({ ...s, open: false }))}
          sx={{ borderRadius: 2 }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default HrProfilePage;
