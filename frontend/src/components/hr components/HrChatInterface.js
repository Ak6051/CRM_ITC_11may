import React, { useRef, useEffect } from 'react';
import { 
  Box, Avatar, TextField, IconButton, Typography, Paper, Badge
} from '@mui/material';
import { Send as SendIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const HrChatInterface = ({ 
  users, 
  selectedUser, 
  messages = [], 
  onSendMessage, 
  currentUserId,
  onBack
}) => {
  const [message, setMessage] = React.useState('');
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
      <Box sx={{ 
        p: 2, 
        borderBottom: '1px solid #e0e0e0', 
        display: 'flex', 
        alignItems: 'center',
        bgcolor: '#f0f2f5'
      }}>
        <IconButton onClick={onBack} sx={{ mr: 1, display: { sm: 'none' } }}>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
            <path d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" fill="currentColor"/>
          </svg>
        </IconButton>
        <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
          {selectedUser.name.charAt(0).toUpperCase()}
        </Avatar>
        <Box>
          <Typography variant="subtitle1" fontWeight="medium">
            {selectedUser.name}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {selectedUser.role === 'hr' ? 'HR Team' : 
             selectedUser.role === 'admin' ? 'Admin' : 'Sales Team'}
          </Typography>
        </Box>
      </Box>

      {/* Messages */}
      <Box sx={{ 
        flex: 1, 
        p: 2, 
        overflowY: 'auto', 
        bgcolor: '#e5ddd5',
        backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%239C92AC\' fill-opacity=\'0.1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")'
      }}>
        {messages.map((msg, index) => {
          const isCurrentUser = msg.senderId === currentUserId;
          const sender = users.find(u => u._id === msg.senderId) || { name: 'Unknown User' };
          
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                mb: 2,
                px: 1
              }}
            >
              {!isCurrentUser && (
                <Avatar 
                  sx={{ 
                    width: 32, 
                    height: 32, 
                    mt: 'auto',
                    mr: 1,
                    bgcolor: 'primary.main',
                    fontSize: '0.875rem'
                  }}
                >
                  {sender.name.charAt(0).toUpperCase()}
                </Avatar>
              )}
              <Box sx={{ maxWidth: '70%' }}>
                {!isCurrentUser && (
                  <Typography 
                    variant="caption" 
                    sx={{ 
                      display: 'block',
                      color: 'text.secondary',
                      ml: 1,
                      mb: 0.5
                    }}
                  >
                    {sender.name}
                  </Typography>
                )}
                <Paper
                  sx={{
                    p: 1.5,
                    bgcolor: isCurrentUser ? '#dcf8c6' : 'white',
                    boxShadow: '0 1px 0.5px rgba(0,0,0,0.13)',
                    borderTopLeftRadius: isCurrentUser ? 12 : 4,
                    borderTopRightRadius: isCurrentUser ? 4 : 12,
                    borderBottomLeftRadius: 12,
                    borderBottomRightRadius: 12
                  }}
                >
                  <Typography variant="body2" sx={{ wordBreak: 'break-word' }}>
                    {msg.message}
                  </Typography>
                  <Box 
                    sx={{ 
                      display: 'flex', 
                      justifyContent: 'flex-end',
                      mt: 0.5,
                      alignItems: 'center'
                    }}
                  >
                    <Typography 
                      variant="caption" 
                      sx={{ 
                        color: 'text.secondary',
                        fontSize: '0.65rem',
                        lineHeight: 1.5
                      }}
                    >
                      {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : 'Now'}
                    </Typography>
                    {isCurrentUser && (
                      <Box component="span" ml={0.5}>
                        {msg.isRead ? (
                          <svg width="16" height="16" viewBox="0 0 16 15" fill="none">
                            <path d="M10.5 5.5L7 9L5.5 7.5" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                            <path d="M10.5 8.5L7 12L5.5 10.5" stroke="#4fc3f7" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        ) : (
                          <svg width="16" height="16" viewBox="0 0 16 15" fill="none">
                            <path d="M10.5 5.5L7 9L5.5 7.5" stroke="#90a4ae" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

    
      <Box sx={{ 
        p: 1.5, 
        borderTop: '1px solid #e0e0e0', 
        bgcolor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center'
      }}>
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
          sx={{ 
            bgcolor: 'white',
            borderRadius: 2,
            '& .MuiOutlinedInput-root': {
              '& fieldset': {
                borderColor: 'transparent',
              },
              '&:hover fieldset': {
                borderColor: 'transparent',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'transparent',
              },
            },
          }}
        />
        <IconButton 
          color="primary" 
          onClick={handleSend}
          disabled={!message.trim()}
          sx={{ ml: 1 }}
        >
          <SendIcon />
        </IconButton>
      </Box>
      
    </Box>
  );
};

export default HrChatInterface;
