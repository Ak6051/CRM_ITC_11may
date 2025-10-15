import React, { useState, useEffect } from 'react';
import { TextField, Button, Box, Typography } from '@mui/material';
import { API_BASE_URL } from '../../config/api.config';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';
import axios from 'axios';

const SalesProfilePage = () => {
  const [user, setUser] = useState({
    firstName: '',
    lastName: '',
    email: '',
    mobileNo: '',
    address: '',
    gender: '',
  });

  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const response = await axios.get(
          `${API_BASE_URL}/user/profile`,
          {
            headers: { Authorization: token },
          }
        );
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
          <Button
            variant="contained"
            color="primary"
            onClick={handleUpdate}
            disabled={isLoading}
            sx={{ mt: 2 }}
          >
            {isLoading ? 'Updating...' : 'Update Profile'}
          </Button>
        </Box>
      </Box>
    </div>
  );
};

export default SalesProfilePage;
