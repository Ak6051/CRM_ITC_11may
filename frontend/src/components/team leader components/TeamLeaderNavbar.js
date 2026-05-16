import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography, IconButton, Badge, Popover, Box, Paper, Tooltip, Divider, LinearProgress, Chip } from '@mui/material';
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
        backgroundColor: '#1a1a2e',
        color: '#ffffff',
        boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        width: '100%',
      }}
    >
      <Toolbar sx={{ px: 3 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 800, color: '#f6b93b', letterSpacing: '-0.5px' }}>
          Management <span style={{ color: '#fff', fontWeight: 400 }}>Center</span>
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Tooltip title="Team Chat">
            <IconButton color="inherit" onClick={() => setChatOpen(true)} sx={{ bgcolor: 'rgba(255,255,255,0.03)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#f6b93b' } }}>
              <Badge badgeContent={0} color="error">
                <ChatBubbleOutlineIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>
          
          <Tooltip title="Messages">
            <IconButton color="inherit" onClick={handlePopoverOpen} sx={{ bgcolor: 'rgba(255,255,255,0.03)', '&:hover': { bgcolor: 'rgba(255,255,255,0.08)', color: '#f6b93b' } }}>
              <Badge badgeContent={unreadCount} color="error">
                <MailOutlineIcon fontSize="small" />
              </Badge>
            </IconButton>
          </Tooltip>

          <Divider orientation="vertical" flexItem sx={{ mx: 1, borderColor: 'rgba(255,255,255,0.1)', height: 24, alignSelf: 'center' }} />

          <Button 
            onClick={handleMenuClick} 
            sx={{ 
              color: '#fff', 
              textTransform: 'none',
              fontWeight: 600,
              fontSize: '0.85rem',
              px: 2,
              borderRadius: '10px',
              '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)' }
            }}
            startIcon={
              <Box sx={{ 
                width: 32, height: 32, borderRadius: '8px', 
                background: 'linear-gradient(135deg, #f6b93b, #e58e26)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: '#fff', fontWeight: 800, fontSize: '0.75rem'
              }}>
                {userName || 'TL'}
              </Box>
            }
          >
            {userName ? `Hi, ${userName}` : 'Account'}
          </Button>
        </Box>

        <Menu 
          anchorEl={anchorEl} 
          open={Boolean(anchorEl)} 
          onClose={handleClose} 
          sx={{ 
            '& .MuiPaper-root': { 
              backgroundColor: '#1a1a2e', 
              color: '#fff',
              minWidth: 180,
              mt: 1,
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 4px 20px rgba(0,0,0,0.3)'
            } 
          }}
        >
          <MenuItem onClick={() => { handleClose(); navigate('/tl-profile'); }} sx={{ fontSize: '0.85rem', py: 1.2, '&:hover': { backgroundColor: 'rgba(255,255,255,0.05)', color: '#f6b93b' } }}>My Profile</MenuItem>
          <Divider sx={{ borderColor: 'rgba(255,255,255,0.05)' }} />
          <MenuItem onClick={() => { handleClose(); handleLogout(); }} sx={{ fontSize: '0.85rem', py: 1.2, color: '#ff6b6b', '&:hover': { backgroundColor: 'rgba(255,107,107,0.05)' } }}>Logout</MenuItem>
        </Menu>

        <Popover
          open={Boolean(anchorMsg)}
          anchorEl={anchorMsg}
          onClose={handlePopoverClose}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          transformOrigin={{ vertical: 'top', horizontal: 'right' }}
          sx={{ 
            '& .MuiPaper-root': { 
              width: 380, 
              mt: 1.5,
              borderRadius: '16px', 
              backgroundColor: '#1a1a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              boxShadow: '0 10px 40px rgba(0,0,0,0.4)',
              overflow: 'hidden'
            } 
          }}
        >
          <Box sx={{ p: 2, borderBottom: '1px solid rgba(255,255,255,0.05)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>Notifications</Typography>
            <Badge badgeContent={unreadCount} color="error" />
          </Box>
          <Box sx={{ maxHeight: 400, overflowY: 'auto', p: 1 }}>
            {loadingMessages ? (
              <Box sx={{ p: 4, textAlign: 'center' }}><LinearProgress sx={{ borderRadius: 2 }} /></Box>
            ) : messages.length === 0 ? (
              <Box sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="body2" color="rgba(255,255,255,0.4)">No new notifications</Typography>
              </Box>
            ) : (
              messages.map(msg => (
                <Box key={msg._id} sx={{
                  p: 2, mb: 1, 
                  borderRadius: '12px',
                  bgcolor: msg.isRead ? 'transparent' : 'rgba(246, 185, 59, 0.05)',
                  border: '1px solid rgba(255,255,255,0.03)',
                  transition: '0.2s',
                  '&:hover': { bgcolor: 'rgba(255,255,255,0.03)' }
                }}>
                  <Typography variant="body2" sx={{ fontWeight: msg.isRead ? 400 : 600, mb: 1 }}>{msg.message}</Typography>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Chip label={msg.isRead ? 'Read' : 'New'} size="small" sx={{ height: 18, fontSize: '0.65rem', bgcolor: msg.isRead ? 'rgba(255,255,255,0.1)' : '#f6b93b', color: '#fff' }} />
                    <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.4)' }}>
                      {msg.timestamp?.toLocaleDateString()}
                    </Typography>
                  </Box>
                </Box>
              ))
            )}
          </Box>
        </Popover>
      </Toolbar>
    </AppBar>
  );
};

export default TeamLeaderNavbar;
