import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Box, Modal, Tabs, Tab, Typography, TextField, 
  List, ListItem, ListItemAvatar, ListItemText, 
  Avatar, Badge, IconButton, Divider, CircularProgress
} from '@mui/material';
import { Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL } from '../../config/api.config';
import ChatInterface from './ChatInterface';

const style = {
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
};

const AdminChatBox = ({ open, handleClose, socket }) => {
  const [activeTab, setActiveTab] = useState('hr');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hrUsers, setHrUsers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const currentUserId = sessionStorage.getItem('userId');

  // Fetch users and messages
  useEffect(() => {
    if (!open || !currentUserId) return;
    
    const fetchUsersAndMessages = async () => {
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
        // First fetch users
        const usersRes = await axios.get(`${API_BASE_URL}/chat/all`, config);
        
        // Process users from the API response
        const hrUsersData = (usersRes.data.hrs || []).map(user => ({
          ...user,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: 'HR'
        }));
        
        const salesUsersData = (usersRes.data.sales || []).map(user => ({
          ...user,
          name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
          role: 'Sales'
        }));
        
        setHrUsers(hrUsersData);
        setSalesUsers(salesUsersData);
        
        // Create a map of all users for easy lookup
        const allUsersMap = {};
        [...hrUsersData, ...salesUsersData].forEach(user => {
          allUsersMap[user._id] = user;
        });
        
        console.log('Processed users:', {
          hrUsers: hrUsersData,
          salesUsers: salesUsersData,
          allUsersMap
        });
        
        // Initialize messages object
        const initialMessages = {};
        const userIds = Object.keys(allUsersMap);
        
        // Load messages for each user in parallel
        await Promise.all(userIds.map(async (userId) => {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/chat/messages/${currentUserId}/${userId}`,
              config
            );
            
            if (response.data && Array.isArray(response.data)) {
              initialMessages[userId] = response.data.map(msg => ({
                ...msg,
                timestamp: new Date(msg.timestamp)
              }));
            } else {
              initialMessages[userId] = [];
            }
          } catch (err) {
            console.error(`Error loading messages for user ${userId}:`, err);
            initialMessages[userId] = [];
          }
        }));
        
        // Ensure all users have an entry in messages, even if empty
        userIds.forEach(userId => {
          if (!initialMessages[userId]) {
            initialMessages[userId] = [];
          }
        });
        
        setMessages(initialMessages);
      } catch (err) {
        console.error('Error fetching chat data:', err);
        setError('Failed to load chat data');
      } finally {
        setLoading(false);
      }
    };
    
    fetchUsersAndMessages();
  }, [open, currentUserId]);

  // Set up socket listener for new messages
  useEffect(() => {
    if (!socket || !open) return;
    
    const handleNewMessage = (newMessage) => {
      setMessages(prev => {
        // Create a new message object with proper formatting
        const formattedMessage = {
          ...newMessage,
          timestamp: new Date(newMessage.timestamp)
        };
        
        // Add to existing messages or create new array
        const existingMessages = prev[newMessage.senderId] || [];
        
        // Check if message already exists to avoid duplicates
        const messageExists = existingMessages.some(
          msg => msg._id === newMessage._id || 
                 (msg.senderId === newMessage.senderId && 
                  msg.message === newMessage.message && 
                  Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 1000)
        );
        
        if (messageExists) return prev;
        
        return {
          ...prev,
          [newMessage.senderId]: [...existingMessages, formattedMessage]
        };
      });
    };
    
    socket.on('getMessage', handleNewMessage);
    return () => {
      socket.off('getMessage', handleNewMessage);
    };
  }, [socket, open]);

  // Handle receiving new messages
  useEffect(() => {
    if (!socket || !open) return;
    
    const handleNewMessage = (newMessage) => {
      setMessages(prev => {
        // Create a new message object with proper formatting
        const formattedMessage = {
          ...newMessage,
          timestamp: new Date(newMessage.timestamp)
        };
        
        // Add to existing messages or create new array
        const existingMessages = prev[newMessage.senderId] || [];
        
        // Check if message already exists to avoid duplicates
        const messageExists = existingMessages.some(
          msg => msg._id === newMessage._id || 
                 (msg.senderId === newMessage.senderId && 
                  msg.message === newMessage.message && 
                  Math.abs(new Date(msg.timestamp) - new Date(newMessage.timestamp)) < 1000)
        );
        
        if (messageExists) return prev;
        
        return {
          ...prev,
          [newMessage.senderId]: [...existingMessages, formattedMessage]
        };
      });
    };
    
    socket.on('getMessage', handleNewMessage);
    return () => {
      socket.off('getMessage', handleNewMessage);
    };
  }, [socket, open]);

  // Handle sending a message
  const handleSendMessage = useCallback(async (message) => {
    if (!selectedUser || !currentUserId) return;
    
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.error('No authentication token found');
      return;
    }
    
    const authAxios = axios.create({
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      }
    });
    
    // Ensure role is in the correct case (HR/Sales)
    const role = selectedUser.role === 'hr' ? 'HR' : 
               selectedUser.role === 'sales' ? 'Sales' : 
               selectedUser.role; // fallback

    try {
      // Create a temporary ID for the message (will be replaced by server ID)
      const tempMessageId = `temp-${Date.now()}`;
      const newMessage = {
        _id: tempMessageId,
        senderId: currentUserId,
        receiverId: selectedUser._id,
        role: role,
        message: message,
        timestamp: new Date(),
        isRead: false,
        isSending: true // Flag to show sending state
      };

      // Add message to local state immediately for instant feedback
      setMessages(prev => ({
        ...prev,
        [selectedUser._id]: [...(prev[selectedUser._id] || []), newMessage]
      }));

      try {
        // Send to server
        const response = await axios.post(
          `${API_BASE_URL}/chat/send`,
          newMessage,
          {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            }
          }
        );

        // Update message with server response
        setMessages(prev => {
          const updatedMessages = { ...prev };
          const messageIndex = updatedMessages[selectedUser._id]?.findIndex(m => m._id === tempMessageId);
          
          if (messageIndex > -1) {
            updatedMessages[selectedUser._id][messageIndex] = {
              ...response.data,
              timestamp: new Date(response.data.timestamp)
            };
          }
          
          return updatedMessages;
        });
      } catch (error) {
        console.error('Error sending message:', error);
        // Update message to show error state
        setMessages(prev => {
          const updatedMessages = { ...prev };
          const messageIndex = updatedMessages[selectedUser._id]?.findIndex(m => m._id === tempMessageId);
          
          if (messageIndex > -1) {
            updatedMessages[selectedUser._id][messageIndex] = {
              ...updatedMessages[selectedUser._id][messageIndex],
              isError: true,
              isSending: false
            };
          }
          
          return updatedMessages;
        });
        throw error;
      }
    } catch (err) {
      console.error('Error sending message:', err);
      // Show error to user
      setError('Failed to send message. Please try again.');
    }
  }, [selectedUser, socket, currentUserId]);

  // Filter users based on search query
  const filteredUsers = useMemo(() => {
    const users = activeTab === 'hr' ? hrUsers : salesUsers;
    if (!searchQuery) return users;
    
    const query = searchQuery.toLowerCase();
    return users.filter(user => 
      user.name.toLowerCase().includes(query) ||
      user.email.toLowerCase().includes(query)
    );
  }, [activeTab, hrUsers, salesUsers, searchQuery]);
  
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

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
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
              {activeTab === 'hr' ? 'HR Team' : 'Sales Team'}
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
              Sales Team
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
                      onClick={() => setSelectedUser(user)}
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
                        secondary={user.email}
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
            <ChatInterface
              users={filteredUsers}
              selectedUser={selectedUser}
              onSelectUser={setSelectedUser}
              messages={messages[selectedUser._id] || []}
              onSendMessage={handleSendMessage}
              currentUserId={currentUserId}
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

export default AdminChatBox;
