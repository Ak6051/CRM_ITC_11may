import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Container, Typography, Box } from '@mui/material';
import TeamLeaderNavbar from '../../components/team leader components/TeamLeaderNavbar';
import TeamLeaderSidebar from '../../components/team leader components/TeamLeaderSidebar';

const TLDashboard = () => {
  const navigate = useNavigate();

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) navigate('/login');
  }, [navigate]);

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#1e1e2f', color: 'white' }}>
        <TeamLeaderSidebar />
      </div>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
        <TeamLeaderNavbar />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h4">Welcome to Team Leader Dashboard</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            Manage your team, track tasks, and monitor performance from here.
          </Typography>
        </Container>
      </Box>
    </div>
  );
};

export default TLDashboard;
