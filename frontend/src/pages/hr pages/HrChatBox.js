import React, { useState, useEffect, useMemo } from 'react';
import {
  Box, Modal, Typography, TextField, List, ListItem,
  ListItemAvatar, ListItemText, Avatar, Badge, IconButton,
  Divider, CircularProgress, Tabs, Tab
} from '@mui/material';
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../config/api.config';
import HrChatInterface from '../../components/hr components/HrChatInterface';

const HrChatBox = ({ open, handleClose, senderId }) => {
  const [activeTab, setActiveTab] = useState('admin'); // 'admin', 'hr', 'sales'
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [adminUsers, setAdminUsers] = useState([]);
  const [hrUsers, setHrUsers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [socket, setSocket] = useState(null);

  // Initialize socket connection
  useEffect(() => {
    if (!open) return;
    
    const newSocket = io(API_BASE_URL);
    setSocket(newSocket);
    
    return () => {
      newSocket.disconnect();
    };
  }, [open]);

  // Fetch users and messages
  useEffect(() => {
    const fetchChatData = async () => {
      if (!open) return;
      
      setError('');
      setLoading(true);
      
      const token = sessionStorage.getItem('token');
      if (!token) {
        setError('Authentication required');
        setLoading(false);
        return;
      }
      
      const config = {
        headers: { Authorization: `Bearer ${token}` }
      };
      
      try {
        // Fetch all user types for chat
        console.log('Fetching users from:', `${API_BASE_URL}/chat/all`);
        const response = await axios.get(`${API_BASE_URL}/chat/all`, config);
        console.log('API Response:', response.data);
        
        const currentUserId = sessionStorage.getItem('userId');
        console.log('Current User ID:', currentUserId);
        
        // Helper function to process user data
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
        
        // Process admin users
        const adminUsersData = processUsers(response.data.admins, 'admin');
        console.log('Admin Users:', adminUsersData);
        
        // Process HR users (excluding current user)
        const allHrUsers = processUsers(response.data.hrs, 'hr');
        const hrUsersData = allHrUsers.filter(u => u._id !== currentUserId);
        console.log('HR Users:', hrUsersData);
        
        // Process sales users
        const salesUsersData = processUsers(response.data.sales, 'sales');
        console.log('Sales Users:', salesUsersData);
        
        setAdminUsers(adminUsersData);
        setHrUsers(hrUsersData);
        setSalesUsers(salesUsersData);
        
        // Initialize empty messages for each user
        const initialMessages = {};
        const allUsers = [...adminUsersData, ...hrUsersData, ...salesUsersData];
        console.log('All Users for Messages:', allUsers);
        
        allUsers.forEach(user => {
          if (user && user._id) {
            initialMessages[user._id] = [];
          } else {
            console.warn('Invalid user data:', user);
          }
        });
        
        setMessages(initialMessages);
        
        // Load existing messages
        console.log('Loading messages for user:', currentUserId);
        await loadMessages(currentUserId);
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchChatData();
    
    // Set up socket listener for new messages
    if (socket) {
      const handleNewMessage = (newMessage) => {
        setMessages(prev => ({
          ...prev,
          [newMessage.senderId]: [...(prev[newMessage.senderId] || []), newMessage]
        }));
      };
      
      socket.on('getMessage', handleNewMessage);
      return () => {
        socket.off('getMessage', handleNewMessage);
      };
    }
  }, [open, socket]);
  
  // Load messages for all conversations
  const loadMessages = async (currentUserId) => {
    if (!currentUserId) {
      console.error('No current user ID found');
      return;
    }

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        setError('Authentication required');
        return;
      }

      console.log('Loading conversations for user:', currentUserId);
      const response = await axios.get(`${API_BASE_URL}/chat/conversations/${currentUserId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      console.log('Conversations API Response:', response.data);
      
      if (!response.data || !Array.isArray(response.data)) {
        console.warn('Unexpected response format from conversations API');
        return;
      }
      
      // Initialize messages for each conversation
      const initialMessages = {};
      
      // Load messages for each conversation
      await Promise.all(response.data.map(async (conversation) => {
        const otherUserId = conversation._id;
        try {
          const messagesRes = await axios.get(
            `${API_BASE_URL}/chat/messages/${currentUserId}/${otherUserId}`, 
            { headers: { Authorization: `Bearer ${token}` } }
          );
          
          if (messagesRes.data && Array.isArray(messagesRes.data)) {
            initialMessages[otherUserId] = messagesRes.data.map(msg => ({
              _id: msg._id || Date.now().toString(),
              senderId: msg.senderId,
              receiverId: msg.receiverId,
              message: msg.message,
              timestamp: new Date(msg.timestamp),
              isRead: msg.isRead
            }));
          }
        } catch (err) {
          console.error(`Error loading messages for conversation with ${otherUserId}:`, err);
        }
      }));
      
      console.log('Initial messages loaded:', initialMessages);
      setMessages(prev => ({
        ...prev,
        ...initialMessages
      }));
    } catch (err) {
      console.error('Error loading conversations:', err);
      setError('Failed to load conversations. ' + (err.response?.data?.message || err.message));
    }
  };

  // Handle sending a message
  const handleSendMessage = async (message) => {
    if (!selectedUser) return;
    
    const newMessage = {
      senderId: senderId,
      receiverId: selectedUser._id,
      role: selectedUser.role.toLowerCase(),
      message: message,
      timestamp: new Date().toISOString(),
      isRead: false
    };
    
    try {
      const token = sessionStorage.getItem('token');
      
      // Emit message via WebSocket if available
      if (socket) {
        socket.emit('sendMessage', newMessage);
      }
      
      // Update local state optimistically
      const optimisticMessage = {
        ...newMessage,
        _id: `temp-${Date.now()}`,
        timestamp: new Date(newMessage.timestamp)
      };
      
      setMessages(prev => ({
        ...prev,
        [selectedUser._id]: [...(prev[selectedUser._id] || []), optimisticMessage]
      }));
      
      // Send message to server
      await axios.post(`${API_BASE_URL}/chat/send`, newMessage, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
    } catch (error) {
      console.error("Error sending message:", error);
      setError('Failed to send message');
    }
  };
  
  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    let users = [];
    if (activeTab === 'admin') users = adminUsers;
    else if (activeTab === 'hr') users = hrUsers;
    else if (activeTab === 'sales') users = salesUsers;
    
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query)
    );
  }, [activeTab, adminUsers, hrUsers, salesUsers, searchQuery]);
  
  // Get unread counts for each user
  const unreadCounts = useMemo(() => {
    const counts = {};
    Object.entries(messages).forEach(([userId, msgs]) => {
      counts[userId] = msgs.filter(
        msg => !msg.isRead && msg.senderId === userId
      ).length;
    });
    return counts;
  }, [messages]);
  
  // Handle user selection
  const handleUserSelect = (user) => {
    setSelectedUser(user);
    
    // Mark messages as read when opening chat
    if (socket && messages[user._id]?.some(m => !m.isRead && m.senderId === user._id)) {
      const unreadMessageIds = messages[user._id]
        .filter(m => !m.isRead && m.senderId === user._id)
        .map(m => m._id);
        
      if (unreadMessageIds.length > 0) {
        socket.emit('messageRead', {
          messageIds: unreadMessageIds,
          userId: senderId
        });
      }
    }
  };

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '80%',
        height: '80vh',
        bgcolor: 'background.paper',
        boxShadow: 24,
        borderRadius: 2,
        display: 'flex',
        overflow: 'hidden',
      }}>
        {/* Left sidebar */}
        <Box sx={{
          width: { xs: '100%', sm: '40%' }, 
          borderRight: '1px solid #e0e0e0',
          flexDirection: 'column',
          height: '100%',
          bgcolor: '#f5f5f5',
          ...(selectedUser ? { display: { xs: 'none', sm: 'flex' } } : { display: 'flex' })
        }}>
          {/* Header */}
          <Box sx={{ 
            p: 2, 
            bgcolor: '#f0f2f5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '1px solid #e0e0e0'
          }}>
            <Typography variant="subtitle1" fontWeight="bold">
              {activeTab === 'admin' ? 'Admins' : 
               activeTab === 'hr' ? 'HR Team' : 'Sales Team'}
            </Typography>
          </Box>
          
          {/* Search */}
          <Box sx={{ p: 2, bgcolor: 'white' }}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search or start new chat"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
                sx: { borderRadius: 2, bgcolor: '#f0f2f5' }
              }}
              variant="outlined"
            />
          </Box>
          
          {/* Tabs */}
          <Box sx={{ display: 'flex', borderBottom: '1px solid #e0e0e0', bgcolor: 'white' }}>
            <Box 
              onClick={() => setActiveTab('admin')}
              sx={{
                flex: 1,
                textAlign: 'center',
                p: 1.5,
                cursor: 'pointer',
                borderBottom: activeTab === 'admin' ? '2px solid #008069' : 'none',
                color: activeTab === 'admin' ? '#008069' : 'inherit',
                fontWeight: activeTab === 'admin' ? 'bold' : 'normal'
              }}
            >
              Admin
            </Box>
            <Box 
              onClick={() => setActiveTab('hr')}
              sx={{
                flex: 1,
                textAlign: 'center',
                p: 1.5,
                cursor: 'pointer',
                borderBottom: activeTab === 'hr' ? '2px solid #008069' : 'none',
                color: activeTab === 'hr' ? '#008069' : 'inherit',
                fontWeight: activeTab === 'hr' ? 'bold' : 'normal'
              }}
            >
              HR Team
            </Box>
            <Box 
              onClick={() => setActiveTab('sales')}
              sx={{
                flex: 1,
                textAlign: 'center',
                p: 1.5,
                cursor: 'pointer',
                borderBottom: activeTab === 'sales' ? '2px solid #008069' : 'none',
                color: activeTab === 'sales' ? '#008069' : 'inherit',
                fontWeight: activeTab === 'sales' ? 'bold' : 'normal'
              }}
            >
              Sales
            </Box>
          </Box>
          
          {/* User list */}
          <Box sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
                <CircularProgress size={24} />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ p: 2, textAlign: 'center' }}>
                {error}
              </Typography>
            ) : filteredUsers.length === 0 ? (
              <Typography sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
                No users found
              </Typography>
            ) : (
              <List disablePadding>
                {filteredUsers.map((user) => (
                  <React.Fragment key={user._id}>
                    <ListItem 
                      button 
                      onClick={() => handleUserSelect(user)}
                      selected={selectedUser?._id === user._id}
                      sx={{
                        '&:hover': { bgcolor: '#f5f5f5' },
                        '&.Mui-selected': { bgcolor: '#e5f3ff' }
                      }}
                    >
                      <ListItemAvatar>
                        <Badge 
                          badgeContent={unreadCounts[user._id] || 0} 
                          color="error"
                          invisible={!unreadCounts[user._id]}
                        >
                          <Avatar>{user.name.charAt(0).toUpperCase()}</Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText 
                        primary={user.name}
                        secondary={user.email || ''}
                        primaryTypographyProps={{ fontWeight: 'medium' }}
                      />
                    </ListItem>
                    <Divider component="li" />
                  </React.Fragment>
                ))}
              </List>
            )}
          </Box>
        </Box>
        
        {/* Right chat area */}
        <Box sx={{
          flex: 1, 
          flexDirection: 'column',
          height: '100%',
          ...(selectedUser ? { display: 'flex' } : { display: { xs: 'none', sm: 'flex' } })
        }}>
          {selectedUser ? (
            <HrChatInterface
              users={filteredUsers}
              selectedUser={selectedUser}
              messages={messages[selectedUser._id] || []}
              onSendMessage={handleSendMessage}
              currentUserId={senderId}
              onBack={() => setSelectedUser(null)}
            />
          ) : (
            <Box sx={{ 
              display: 'flex', 
              flexDirection: 'column', 
              alignItems: 'center', 
              justifyContent: 'center',
              height: '100%',
              bgcolor: '#f8f9fa',
              color: 'text.secondary',
              textAlign: 'center',
              p: 3
            }}>
              <Typography variant="h6" gutterBottom>
                WhatsApp Web
              </Typography>
              <Typography variant="body2">
                Select a chat to start messaging
              </Typography>
            </Box>
          )}
        </Box>
      </Box>
    </Modal>
  );
};

export default HrChatBox;
