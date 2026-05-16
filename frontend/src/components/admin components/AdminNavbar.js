import React, { useState, useEffect, useCallback } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography, IconButton, Badge } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import AdminChatBox from './AdminChatBox';
import { listenForNotifications } from '../../services/chatService';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

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

  // Fetching user data on navbar load
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;

        const response = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: token }
        });

        if (response.data && response.data.firstName && response.data.lastName) {
          const firstLetter = response.data.firstName[0] + response.data.lastName[0];
          setUserName(firstLetter.toUpperCase());
        }
      } catch (error) {
        console.error('Error fetching user data', error);
      }
    };

    fetchUserData();
  }, []);

  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { 
    sessionStorage.clear(); 
    navigate('/login'); 
  };

  return (
    <AppBar
      position="static"
      sx={{
        border: '3px solid DodgerBlue',
        backgroundColor: '#1e1e2f',
        color: '#ffffff',
        boxShadow: '0px 4px 10px rgba(0,0,0,0.2)',
        backdropFilter: 'blur(10px)',
        maxWidth: '98%',
        mx: 'auto',
        borderRadius: 2,
        mt: 1
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#f6b93b', fontFamily: 'Lora' }}>
          Admin Dashboard
        </Typography>

        <IconButton 
          color="inherit" 
          onClick={() => setChatOpen(true)} 
          sx={{ ml: 1, transition: '0.3s', '&:hover': { color: '#FFD700', transform: 'scale(1.1)' } }}
        >
          <Badge badgeContent={unreadCount} color="error">
            <ChatBubbleOutlineIcon />
          </Badge>
        </IconButton>
        <AdminChatBox open={chatOpen} handleClose={() => setChatOpen(false)} />

        <Button onClick={handleMenuClick} sx={{ color: '#fff', ml: 1, fontWeight: 'bold', '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>
          {userName || 'Profile'}
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} sx={{ '& .MuiPaper-root': { backgroundColor: '#2c2c3e', color: '#fff' } }}>
          <MenuItem onClick={() => { handleClose(); navigate('/profile'); }} sx={{ '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>My Profile</MenuItem>
          <MenuItem onClick={() => { handleClose(); handleLogout(); }} sx={{ '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>Logout</MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default AdminNavbar;
