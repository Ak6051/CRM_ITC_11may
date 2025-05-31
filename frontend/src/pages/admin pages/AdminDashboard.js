// src/components/UserDashboard.js
import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/admin components/AdminNavbar';
import { Container, Typography, Box } from '@mui/material';
import Sidebar from '../../components/admin components/AdminSidebar';

const AdminDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      navigate('/login'); // Redirect to login if no token
    }
  }, [navigate]);

  return (
    <div style={{ display: 'flex', height: '100vh',marginLeft:'-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar is fixed */}
      <div style={{ position: 'fixed',marginLeft:'-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
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
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h4">Welcome to Your Dashboard</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            This is your Admin dashboard where you can manage your profile and
            settings.
          </Typography>
          <style>
            
          </style>
          {/* Add more dashboard content here */}
        </Container>
      </Box>
    </div>
  );
};

export default AdminDashboard;
