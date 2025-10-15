import React, { useState, useEffect, useRef } from 'react';
import { 
  Box, Avatar, TextField, IconButton, List, ListItem, ListItemAvatar, 
  ListItemText, Divider, Typography, Badge, Button, Paper
} from '@mui/material';
import { Send as SendIcon, Search as SearchIcon, ArrowBack as ArrowBackIcon } from '@mui/icons-material';
import { API_BASE_URL } from '../../config/api.config';

const ChatInterface = ({ users, selectedUser, onSelectUser, messages = [], onSendMessage, currentUserId }) => {
  const [message, setMessage] = useState('');
  const messagesEndRef = useRef(null);

  const handleSend = () => {
    if (message.trim() && selectedUser) {
      onSendMessage(message);
      setMessage('');
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) {
    return (
      <Box sx={{ p: 2, textAlign: 'center', color: 'text.secondary' }}>
        <Typography>Select a user to start chatting</Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      {/* Chat header */}
      <Box sx={{ p: 2, borderBottom: '1px solid #e0e0e0', display: 'flex', alignItems: 'center' }}>
        <IconButton onClick={() => onSelectUser(null)} sx={{ mr: 1, display: { sm: 'none' } }}>
          <ArrowBackIcon />
        </IconButton>
        <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
          {selectedUser.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="subtitle1">{selectedUser.name}</Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedUser.role === 'hr' ? 'HR Team' : 'Sales Team'}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ flex: 1, p: 2, overflowY: 'auto', bgcolor: '#e5ddd5' }}>
        {messages.map((msg, index) => (
          <Box
            key={index}
            sx={{
              display: 'flex',
              justifyContent: msg.senderId === currentUserId ? 'flex-end' : 'flex-start',
              mb: 1
            }}
          >
            <Paper
              sx={{
                p: 1.5,
                maxWidth: '70%',
                bgcolor: msg.senderId === currentUserId ? '#d9fdd3' : 'white',
                borderRadius: 2
              }}
            >
              <Typography variant="body2">{msg.message}</Typography>
              <Typography variant="caption" color="text.secondary" sx={{ display: 'block', textAlign: 'right' }}>
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Typography>
            </Paper>
          </Box>
        ))}
        <div ref={messagesEndRef} />
      </Box>

      {/* Message input */}
      <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0', bgcolor: 'white' }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            multiline
            maxRows={4}
            placeholder="Type a message"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            variant="outlined"
            size="small"
            sx={{ mr: 1, bgcolor: 'white' }}
          />
          <IconButton 
            color="primary" 
            onClick={handleSend}
            disabled={!message.trim()}
          >
            <SendIcon />
          </IconButton>
        </Box>
      </Box>
    </Box>
  );
};

export default ChatInterface;
