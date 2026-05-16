import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Box, Modal, Typography, TextField, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, Badge, IconButton,
  Divider, CircularProgress, Tabs, Tab, Paper
} from '@mui/material';
import { 
  Search as SearchIcon, 
  MoreVert as MoreVertIcon,
  Chat as ChatIcon,
  DonutLarge as StatusIcon
} from '@mui/icons-material';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import ChatInterface from './ChatInterface';
import { 
  listenForMessages, 
  sendMessage, 
  listenForUserStatus, 
  updateUserStatus,
  clearUnreadCount,
  listenForNotifications
} from '../../services/chatService';

const AdminChatBox = ({ open, handleClose }) => {
  const [activeTab, setActiveTab] = useState('hr'); // 'hr', 'sales'
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hrUsers, setHrUsers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userStatuses, setUserStatuses] = useState({});
  const [notifications, setNotifications] = useState({});
  
  const currentUserId = sessionStorage.getItem('userId');

  // Fetch users only
  useEffect(() => {
    if (!open) return;
    
    const fetchUsers = async () => {
      setError('');
      setLoading(true);
      const token = sessionStorage.getItem('token');
      if (!token) { setError('Authentication required'); setLoading(false); return; }
      
      try {
        const response = await axios.get(`${API_BASE_URL}/chat/all`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const processUsers = (users, role) => {
          if (!Array.isArray(users)) return [];
          return users.map(user => ({
            _id: user._id || user.id,
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Unknown User',
            email: user.email || '',
            role: user.role || role || 'user',
            ...user
          }));
        };
        
        setHrUsers(processUsers(response.data.hrs, 'hr'));
        setSalesUsers(processUsers(response.data.sales, 'sales'));
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsers();
  }, [open]);

  // Real-time notifications and statuses
  useEffect(() => {
    if (!open || !currentUserId) return;

    const unsubNotifications = listenForNotifications(currentUserId, (notifs) => {
      setNotifications(notifs);
    });

    const unsubStatuses = [];
    [...hrUsers, ...salesUsers].forEach(user => {
      unsubStatuses.push(listenForUserStatus(user._id, (statusData) => {
        setUserStatuses(prev => ({ ...prev, [user._id]: statusData }));
      }));
    });

    return () => {
      unsubNotifications();
      unsubStatuses.forEach(unsub => unsub());
    };
  }, [open, currentUserId, hrUsers, salesUsers]);

  // Real-time messages for selected user
  useEffect(() => {
    if (!selectedUser || !currentUserId) return;

    const unsubscribe = listenForMessages(currentUserId, selectedUser._id, (newMessages) => {
      setMessages(prev => ({ ...prev, [selectedUser._id]: newMessages }));
      clearUnreadCount(currentUserId, selectedUser._id);
    });

    return () => unsubscribe();
  }, [selectedUser, currentUserId]);

  const handleSendMessage = useCallback(async (message) => {
    if (!selectedUser || !currentUserId) return;
    const userName = sessionStorage.getItem('userName') || 'Admin';
    await sendMessage(currentUserId, selectedUser._id, message, userName);
  }, [selectedUser, currentUserId]);

  const unreadCounts = useMemo(() => {
    const counts = {};
    Object.entries(notifications).forEach(([userId, data]) => {
      counts[userId] = data.count || 0;
    });
    return counts;
  }, [notifications]);

  const filteredUsers = useMemo(() => {
    let users = activeTab === 'hr' ? hrUsers : salesUsers;
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      users = users.filter(user => 
        user.name.toLowerCase().includes(query) ||
        user.email.toLowerCase().includes(query)
      );
    }

    return [...users].sort((a, b) => {
      // 1. Sort by unread messages first (WhatsApp style)
      const unreadA = unreadCounts[a._id] || 0;
      const unreadB = unreadCounts[b._id] || 0;
      if (unreadB !== unreadA) return unreadB - unreadA;

      // 2. Sort by online status next
      const statusA = userStatuses[a._id]?.status === 'online' ? 1 : 0;
      const statusB = userStatuses[b._id]?.status === 'online' ? 1 : 0;
      if (statusB !== statusA) return statusB - statusA;

      return 0;
    });
  }, [activeTab, hrUsers, salesUsers, searchQuery, userStatuses, unreadCounts]);
  
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    clearUnreadCount(currentUserId, user._id);
  };

  return (
    <Modal 
      open={open} 
      onClose={handleClose}
      sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}
    >
      <Paper elevation={24} sx={{
        width: '90%',
        maxWidth: '1400px',
        height: '90vh',
        display: 'flex',
        overflow: 'hidden',
        borderRadius: 0, // WhatsApp Web style is often squared
        bgcolor: '#f0f2f5'
      }}>
        {/* Left Sidebar (WhatsApp Style) */}
        <Box sx={{
          width: { xs: '100%', sm: '30%', md: '350px' }, 
          borderRight: '1px solid rgba(0,0,0,0.1)',
          display: (selectedUser && window.innerWidth < 600) ? 'none' : 'flex',
          flexDirection: 'column',
          bgcolor: 'white'
        }}>
          {/* Sidebar Header */}
          <Box sx={{ 
            p: '10px 16px', 
            bgcolor: '#f0f2f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <Avatar sx={{ width: 40, height: 40 }} src="/path-to-admin-avatar.png" />
            <Box>
              <IconButton size="small" sx={{ color: '#54656f' }}><StatusIcon /></IconButton>
              <IconButton size="small" sx={{ color: '#54656f' }}><ChatIcon /></IconButton>
              <IconButton size="small" sx={{ color: '#54656f' }}><MoreVertIcon /></IconButton>
            </Box>
          </Box>
          
          {/* Search Bar */}
          <Box sx={{ p: '7px 12px', bgcolor: 'white' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: '#54656f' }} />,
                sx: { borderRadius: '8px', bgcolor: '#f0f2f5', height: '35px', '& fieldset': { border: 'none' } }
              }}
            />
          </Box>
          
          {/* Custom Tabs */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid rgba(0,0,0,0.05)' }}>
            <Box 
              onClick={() => setActiveTab('hr')}
              sx={{
                flex: 1, textAlign: 'center', p: 1.5, cursor: 'pointer',
                borderBottom: activeTab === 'hr' ? '3px solid #00a884' : 'none',
                color: activeTab === 'hr' ? '#00a884' : '#54656f',
                fontWeight: activeTab === 'hr' ? 'bold' : 'normal',
                fontSize: '14px', textTransform: 'uppercase'
              }}
            >
              HR Team
            </Box>
            <Box 
              onClick={() => setActiveTab('sales')}
              sx={{
                flex: 1, textAlign: 'center', p: 1.5, cursor: 'pointer',
                borderBottom: activeTab === 'sales' ? '3px solid #00a884' : 'none',
                color: activeTab === 'sales' ? '#00a884' : '#54656f',
                fontWeight: activeTab === 'sales' ? 'bold' : 'normal',
                fontSize: '14px', textTransform: 'uppercase'
              }}
            >
              Sales Team
            </Box>
          </Box>
          
          {/* User List */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress size={30} sx={{ color: '#00a884' }} /></Box>
            ) : (
              <List disablePadding>
                {filteredUsers.map((user) => (
                  <React.Fragment key={user._id}>
                    <ListItem 
                      button 
                      onClick={() => handleUserSelect(user)}
                      selected={selectedUser?._id === user._id}
                      sx={{
                        py: 1.5,
                        px: 2,
                        '&:hover': { bgcolor: '#f5f6f6' },
                        '&.Mui-selected': { bgcolor: '#f0f2f5' }
                      }}
                    >
                      <ListItemAvatar sx={{ minWidth: 56 }}>
                        <Badge 
                          overlap="circular"
                          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
                          variant="dot"
                          sx={{
                            '& .MuiBadge-badge': {
                              backgroundColor: userStatuses[user._id]?.status === 'online' ? '#44b700' : '#bdbdbd',
                              color: userStatuses[user._id]?.status === 'online' ? '#44b700' : '#bdbdbd',
                              boxShadow: `0 0 0 2px white`,
                            }
                          }}
                        >
                          <Avatar sx={{ width: 49, height: 49 }}>{user.name.charAt(0).toUpperCase()}</Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={
                          <Box component="div" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                            <Typography component="div" variant="body1" sx={{ color: '#111b21', fontWeight: unreadCounts[user._id] ? 700 : 400 }}>
                              {user.name}
                            </Typography>
                            <Typography component="div" variant="caption" sx={{ color: '#667781' }}>
                              {userStatuses[user._id]?.status === 'online' ? 'now' : ''}
                            </Typography>
                          </Box>
                        }
                        secondary={
                          <Box component="div" sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 0.5 }}>
                            <Typography component="div" variant="body2" noWrap sx={{ color: '#667781', fontSize: '13px', maxWidth: '80%' }}>
                              {user.role?.toUpperCase()}
                            </Typography>
                            {unreadCounts[user._id] > 0 && (
                              <Box sx={{ 
                                bgcolor: '#25d366', 
                                color: 'white', 
                                borderRadius: '50%', 
                                minWidth: '20px', 
                                height: '20px', 
                                display: 'flex', 
                                alignItems: 'center', 
                                justifyContent: 'center',
                                fontSize: '12px',
                                fontWeight: 'bold',
                                px: 0.5
                              }}>
                                {unreadCounts[user._id]}
                              </Box>
                            )}
                          </Box>
                        }
                      />
                    </ListItem>
                    <Divider variant="inset" component="li" sx={{ ml: '75px', borderColor: 'rgba(0,0,0,0.05)' }} />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
        
        {/* Right Chat Area */}
        <Box sx={{
          flex: 1, 
          display: (selectedUser || window.innerWidth >= 600) ? 'flex' : 'none',
          flexDirection: 'column',
          bgcolor: '#efeae2'
        }}>
          {selectedUser ? (
            <ChatInterface
              users={filteredUsers}
              selectedUser={selectedUser}
              userStatus={userStatuses[selectedUser._id]}
              messages={messages[selectedUser._id] || []}
              onSendMessage={handleSendMessage}
              currentUserId={currentUserId}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', 
              height: '100%', bgcolor: '#f8f9fa', borderBottom: '6px solid #25d366' 
            }}>
              <Avatar sx={{ width: 100, height: 100, mb: 3, bgcolor: '#e9edef' }}>
                <ChatIcon sx={{ fontSize: 50, color: '#8696a0' }} />
              </Avatar>
              <Typography variant="h5" color="#41525d" fontWeight="light">WhatsApp Web</Typography>
              <Typography variant="body2" sx={{ color: '#667781', mt: 1, textAlign: 'center', maxWidth: '300px' }}>
                Send and receive messages without keeping your phone online.
              </Typography>
            </Box>
          )}
        </Box>
      </Paper>
    </Modal>
  );
};

export default AdminChatBox;
