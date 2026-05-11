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
import ChatInterface from '../admin components/ChatInterface';

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

const TeamLeaderChatBox = ({ open, handleClose, socket }) => {
  const [activeTab, setActiveTab] = useState('hr');
  const [selectedUser, setSelectedUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [hrUsers, setHrUsers] = useState([]);
  const [salesUsers, setSalesUsers] = useState([]);
  const [messages, setMessages] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const currentUserId = sessionStorage.getItem('userId');

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

      const config = { headers: { Authorization: `Bearer ${token}` } };

      try {
        const usersRes = await axios.get(`${API_BASE_URL}/chat/all`, config);

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

        const allUsersMap = {};
        [...hrUsersData, ...salesUsersData].forEach(user => {
          allUsersMap[user._id] = user;
        });

        const initialMessages = {};
        const userIds = Object.keys(allUsersMap);

        await Promise.all(userIds.map(async (userId) => {
          try {
            const response = await axios.get(
              `${API_BASE_URL}/chat/messages/${currentUserId}/${userId}`,
              config
            );
            initialMessages[userId] = response.data || [];
          } catch (err) {
            initialMessages[userId] = [];
          }
        }));

        setMessages(initialMessages);
      } catch (err) {
        setError('Failed to load users');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchUsersAndMessages();
  }, [open, currentUserId]);

  useEffect(() => {
    if (!socket) return;

    const handleMessage = (message) => {
      setMessages(prev => {
        const key = message.senderId === currentUserId ? message.receiverId : message.senderId;
        return { ...prev, [key]: [...(prev[key] || []), message] };
      });
    };

    socket.on('getMessage', handleMessage);
    return () => socket.off('getMessage', handleMessage);
  }, [socket, currentUserId]);

  const handleSendMessage = async (messageText) => {
    if (!selectedUser || !messageText.trim()) return;

    const token = sessionStorage.getItem('token');
    try {
      const res = await axios.post(
        `${API_BASE_URL}/chat/send`,
        { receiverId: selectedUser._id, message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      const newMessage = res.data;
      setMessages(prev => ({
        ...prev,
        [selectedUser._id]: [...(prev[selectedUser._id] || []), newMessage]
      }));

      if (socket) {
        socket.emit('sendMessage', {
          senderId: currentUserId,
          receiverId: selectedUser._id,
          message: messageText,
          _id: newMessage._id,
          timestamp: newMessage.timestamp
        });
      }
    } catch (err) {
      console.error('Failed to send message:', err);
    }
  };

  const currentUsers = useMemo(() => {
    const list = activeTab === 'hr' ? hrUsers : salesUsers;
    return list.filter(u => u.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [activeTab, hrUsers, salesUsers, searchQuery]);

  const getUnreadCount = useCallback((userId) => {
    return (messages[userId] || []).filter(
      m => m.senderId === userId && !m.isRead
    ).length;
  }, [messages]);

  return (
    <Modal open={open} onClose={handleClose}>
      <Box sx={style}>
        {/* Left panel - user list */}
        <Box sx={{ width: 300, borderRight: '1px solid #e0e0e0', display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0' }}>
            <Typography variant="h6" gutterBottom>Team Leader Chat</Typography>
            <TextField
              size="small"
              fullWidth
              placeholder="Search users..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{ startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} /> }}
            />
          </Box>

          <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ borderBottom: '1px solid #e0e0e0' }}>
            <Tab label="HR" value="hr" />
            <Tab label="Sales" value="sales" />
          </Tabs>

          <List sx={{ flex: 1, overflowY: 'auto' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Typography color="error" sx={{ p: 2 }}>{error}</Typography>
            ) : currentUsers.length === 0 ? (
              <Typography sx={{ p: 2, color: 'text.secondary' }}>No users found</Typography>
            ) : (
              currentUsers.map(user => (
                <React.Fragment key={user._id}>
                  <ListItem
                    button
                    selected={selectedUser?._id === user._id}
                    onClick={() => setSelectedUser(user)}
                  >
                    <ListItemAvatar>
                      <Badge badgeContent={getUnreadCount(user._id)} color="error">
                        <Avatar>{user.name.charAt(0).toUpperCase()}</Avatar>
                      </Badge>
                    </ListItemAvatar>
                    <ListItemText
                      primary={user.name}
                      secondary={user.role}
                    />
                  </ListItem>
                  <Divider />
                </React.Fragment>
              ))
            )}
          </List>
        </Box>

        {/* Right panel - chat */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <ChatInterface
            users={currentUsers}
            selectedUser={selectedUser}
            onSelectUser={setSelectedUser}
            messages={selectedUser ? (messages[selectedUser._id] || []) : []}
            onSendMessage={handleSendMessage}
            currentUserId={currentUserId}
          />
        </Box>
      </Box>
    </Modal>
  );
};

export default TeamLeaderChatBox;
