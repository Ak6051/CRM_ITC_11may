import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography, IconButton, Badge, Popover, Box, Paper } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../../config/api.config';
import TeamLeaderChatBox from './TeamLeaderChatBox';

const TeamLeaderNavbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [anchorMsg, setAnchorMsg] = useState(null);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const socket = useRef();

  useEffect(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    socket.current = io(SOCKET_URL, { withCredentials: true, transports: ['websocket'] });

    socket.current.on('connect', () => {
      socket.current.emit('addUser', userId);
    });

    socket.current.on('getMessage', (message) => {
      setMessages(prev => {
        if (prev.some(msg => msg._id === message._id)) return prev;
        if (!chatOpen && message.senderId !== userId) setUnreadCount(prevCount => prevCount + 1);
        return [message, ...prev];
      });
    });

    socket.current.on('messageReadSuccess', ({ messageId }) => {
      setMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, isRead: true } : msg));
    });

    return () => { if (socket.current) socket.current.disconnect(); };
  }, [chatOpen]);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/user/profile`, { headers: { Authorization: token } });
        if (res.data && res.data.firstName && res.data.lastName) {
          setUserName((res.data.firstName[0] + res.data.lastName[0]).toUpperCase());
        }
      } catch (err) { console.error(err); }
    };
    fetchUserData();
  }, []);

  const markMessagesAsRead = useCallback(() => {
    const userId = sessionStorage.getItem('userId');
    if (!userId || !socket.current) return;
    const unreadMessages = messages.filter(msg => !msg.isRead && msg.receiverId === userId);
    setMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    setUnreadCount(0);
    unreadMessages.forEach(msg => { socket.current.emit('messageRead', { messageId: msg._id, userId }); });
  }, [messages]);

  const fetchMessages = useCallback(async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;
    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/messages/${userId}`);
      const data = res.data || [];
      const processed = data.map(msg => ({
        ...msg,
        timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
        isRead: Boolean(msg.isRead)
      }));
      const sorted = processed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setMessages(sorted);
      setUnreadCount(sorted.filter(msg => !msg.isRead && msg.receiverId === userId).length);
    } catch (err) { console.error(err); } finally { setLoadingMessages(false); }
  }, []);

  useEffect(() => {
    fetchMessages();
    const interval = setInterval(fetchMessages, 30000);
    return () => clearInterval(interval);
  }, [fetchMessages, chatOpen]);

  useEffect(() => { if (chatOpen) markMessagesAsRead(); }, [chatOpen, markMessagesAsRead]);

  const handleNewMessage = useCallback((message) => {
    const userId = sessionStorage.getItem('userId');
    if (message.receiverId === userId) {
      setMessages(prev => [message, ...prev]);
      if (!chatOpen) setUnreadCount(prev => prev + 1);
      if (Notification.permission === 'granted') {
        new Notification('New Message', { body: `New message from ${message.senderName || 'a user'}`, icon: '/favicon.ico' });
      }
    }
  }, [chatOpen]);

  useEffect(() => {
    if (socket.current) {
      socket.current.on('getMessage', handleNewMessage);
      if (Notification.permission !== 'denied') Notification.requestPermission();
      return () => { if (socket.current) socket.current.off('getMessage', handleNewMessage); };
    }
  }, [socket, handleNewMessage]);

  const handlePopoverOpen = (event) => setAnchorMsg(event.currentTarget);
  const handlePopoverClose = () => setAnchorMsg(null);
  const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);
  const handleLogout = () => { sessionStorage.clear(); navigate('/login'); };

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
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#f6b93b', fontFamily: 'Lora' }}>
          Team Leader Dashboard
        </Typography>

        <IconButton color="inherit" onClick={() => setChatOpen(true)} sx={{ ml: 1, transition: '0.3s', '&:hover': { color: '#FFD700', transform: 'scale(1.1)' } }}>
          <ChatBubbleOutlineIcon />
        </IconButton>
        <TeamLeaderChatBox open={chatOpen} handleClose={() => setChatOpen(false)} socket={socket.current} />

        <IconButton color="inherit" onClick={handlePopoverOpen} sx={{ ml: 1, transition: '0.3s', '&:hover': { color: '#FFD700', transform: 'scale(1.1)' } }}>
          <Badge badgeContent={unreadCount} color="error">
            <MailOutlineIcon />
          </Badge>
        </IconButton>

        <Button onClick={handleMenuClick} aria-controls={Boolean(anchorEl) ? 'tl-menu' : undefined} aria-haspopup="true" sx={{ color: '#fff', ml: 1, fontWeight: 'bold', '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>
          {userName || 'Profile'}
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} sx={{ '& .MuiPaper-root': { backgroundColor: '#2c2c3e', color: '#fff' } }}>
          <MenuItem onClick={() => { handleClose(); navigate('/tl-profile'); }} sx={{ '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>My Profile</MenuItem>
          <MenuItem onClick={() => { handleClose(); handleLogout(); }} sx={{ '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>Logout</MenuItem>
        </Menu>

        <Popover
          open={Boolean(anchorMsg)}
          anchorEl={anchorMsg}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ '& .MuiPaper-root': { width: 380, maxWidth: '90vw', p: 2, borderRadius: 2, boxShadow: '0 4px 20px rgba(0,0,0,0.15)' } }}
        >
          <Typography variant="h6" color="primary" gutterBottom>Messages</Typography>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {loadingMessages ? <Typography>Loading messages...</Typography> :
              messages.length === 0 ? <Typography>No messages.</Typography> :
              [...messages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(msg => (
                <Paper key={msg._id} sx={{
                  p: 1.5, my: 1, background: msg.isRead ? '#1f1f2f' : '#252554', color: '#fff',
                  borderLeft: `4px solid ${msg.isRead ? '#90caf9' : '#FFD700'}`, borderRadius: 1,
                  boxShadow: '0 2px 8px rgba(0,0,0,0.15)', transition: '0.3s', '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.25)' }
                }}>
                  <Typography variant="body2" sx={{ mb: 0.5, fontWeight: msg.isRead ? 'normal' : 'bold' }}>{msg.message}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Typography variant="caption" sx={{ color: msg.isRead ? 'text.secondary' : '#FFD700' }}>{msg.isRead ? 'Read' : 'New'}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {msg.timestamp?.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })} at {msg.timestamp?.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                    </Typography>
                  </Box>
                </Paper>
              ))}
          </Box>
        </Popover>
      </Toolbar>
    </AppBar>
  );
};

export default TeamLeaderNavbar;
