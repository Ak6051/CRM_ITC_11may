import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  InputAdornment
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

const ProfilePage = () => {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    address: '',
    gender: '',
    designation: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
  });

  const [showPassword, setShowPassword] = useState({
    current: false,
    new: false,
  });

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: token },
        });
        setUser(response.data);
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };
    fetchUserData();
  }, []);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleUpdate = async () => {
    try {
      setIsLoading(true);
      const token = sessionStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/user/profile`, user, {
        headers: { Authorization: token },
      });
      alert('Profile updated successfully');
    } catch (error) {
      console.error('Error updating profile', error);
    } finally {
      setIsLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setShowPassword((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  };

  const handlePasswordUpdate = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(`${API_BASE_URL}/user/change-password`, passwordData, {
        headers: { Authorization: token },
      });
      alert('Password updated successfully');
      setPasswordModalOpen(false);
      setPasswordData({ currentPassword: '', newPassword: '' });
    } catch (error) {
      console.error('Error updating password', error);
      alert('Password update failed');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <Navbar />
        <Box sx={{ maxWidth: 600, mx: 'auto', mt: 4 }}>
          <Typography variant="h4" gutterBottom>
            My Profile
          </Typography>

          <TextField
            label="First Name"
            name="firstName"
            value={user.firstName}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Last Name"
            name="lastName"
            value={user.lastName}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Email"
            name="email"
            value={user.email}
            disabled
            fullWidth
            margin="normal"
          />
          <TextField
            label="Mobile No"
            name="mobileNo"
            value={user.mobileNo}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Address"
            name="address"
            value={user.address}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Gender"
            name="gender"
            value={user.gender}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />
          <TextField
            label="Designation"
            name="designation"
            value={user.designation}
            onChange={handleChange}
            fullWidth
            margin="normal"
          />

          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleUpdate}
              disabled={isLoading}
            >
              {isLoading ? 'Updating...' : 'Update Profile'}
            </Button>

            <Button
              variant="outlined"
              color="secondary"
              onClick={() => setPasswordModalOpen(true)}
            >
              Change Password
            </Button>
          </Box>
        </Box>
      </Box>

      {/* Password Change Modal */}
      <Dialog open={passwordModalOpen} onClose={() => setPasswordModalOpen(false)}>
        <DialogTitle>Change Password</DialogTitle>
        <DialogContent>
          <TextField
            label="Current Password"
            name="currentPassword"
            type={showPassword.current ? 'text' : 'password'}
            value={passwordData.currentPassword}
            onChange={handlePasswordChange}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('current')}>
                    {showPassword.current ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
          <TextField
            label="New Password"
            name="newPassword"
            type={showPassword.new ? 'text' : 'password'}
            value={passwordData.newPassword}
            onChange={handlePasswordChange}
            fullWidth
            margin="normal"
            InputProps={{
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton onClick={() => togglePasswordVisibility('new')}>
                    {showPassword.new ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPasswordModalOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handlePasswordUpdate}>
            Update
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ProfilePage;
