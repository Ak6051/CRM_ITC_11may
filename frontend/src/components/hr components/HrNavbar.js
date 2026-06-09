import React, { useState, useEffect } from 'react';
import {
  AppBar,
  Toolbar,
  Button,
  Menu,
  MenuItem,
  Typography,
  IconButton,
  Badge
} from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import HrChatBox from '../../pages/hr pages/HrChatBox';
import { listenForNotifications } from '../../services/chatService';

const HrNavbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState('');
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);

  // Fetch user initials
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: token },
        });

        if (response.data?.firstName && response.data?.lastName) {
          const firstLetter = response.data.firstName[0] + response.data.lastName[0];
          setUserName(firstLetter.toUpperCase());
        }
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };

    fetchUserData();
  }, []);

  // Real-time notifications from Firestore
  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    const unsubscribe = listenForNotifications(userId, (notifications) => {
      const totalUnread = Object.values(notifications).reduce((acc, curr) => acc + (curr.count || 0), 0);
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, []);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      const token = sessionStorage.getItem('token');
      if (token) {
        await axios.post(`${API_BASE_URL}/auth/logout`, {}, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
    } catch (err) {
      console.error('Logout audit log failed:', err);
    } finally {
      sessionStorage.clear();
      navigate('/login');
    }
  };

  // ── Send logout beacon when tab/window is closed directly ─────────────────
  useEffect(() => {
    const handleBeforeUnload = () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      const blob = new Blob([], { type: 'application/json' });
      navigator.sendBeacon(
        `${API_BASE_URL}/auth/logout-beacon?token=${encodeURIComponent(token)}`,
        blob
      );
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, []);

  return (
    <AppBar
      position="static"
      sx={{
        border: '3px solid DodgerBlue',
        backgroundColor: '#1e1e2f',
        color: '#ffffff',
        boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)',
      }}
    >
      <Toolbar>
        <Typography
          variant="h6"
          sx={{
            flexGrow: 1,
            fontWeight: 'bold',
            color: '#ffcc00',
          }}
        >
          HR Dashboard
        </Typography>

        <IconButton 
          color="inherit" 
          onClick={() => setChatOpen(true)} 
          sx={{ ml: 2, transition: '0.3s', '&:hover': { color: '#FFD700', transform: 'scale(1.1)' } }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <ChatBubbleOutlineIcon />
          </Badge>
        </IconButton>
        <HrChatBox open={chatOpen} handleClose={() => setChatOpen(false)} senderId={sessionStorage.getItem("userId")} />

        <Button
          onClick={handleMenuClick}
          sx={{ color: '#ffffff', ml: 2, fontWeight: 'bold', '&:hover': { color: '#ffcc00' } }}
        >
          {userName || 'Profile'}
        </Button>
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          sx={{
            '& .MuiPaper-root': {
              backgroundColor: '#2c2c3e',
              color: '#ffffff',
            },
          }}
        >
          <MenuItem onClick={() => { handleClose(); navigate('/hr-profile'); }}>My Profile</MenuItem>
          <MenuItem onClick={() => { handleClose(); handleLogout(); }}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default HrNavbar;
