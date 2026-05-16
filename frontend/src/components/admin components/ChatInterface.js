import React, { useRef, useEffect, useState } from 'react';
import { 
  Box, Avatar, TextField, IconButton, Typography, Paper, Badge, 
  Popover
} from '@mui/material';
import { 
  Send as SendIcon, 
  AttachFile as AttachFileIcon,
  MoreVert as MoreVertIcon,
  EmojiEmotions as EmojiIcon,
  DoneAll as DoneAllIcon,
  ChatBubbleOutline as ChatBubbleOutlineIcon
} from '@mui/icons-material';
import { format } from 'date-fns';
import EmojiPicker from 'emoji-picker-react';

const ChatInterface = ({ 
  users, 
  selectedUser, 
  userStatus,
  messages = [], 
  onSendMessage, 
  currentUserId 
}) => {
  const [message, setMessage] = useState('');
  const [anchorElEmoji, setAnchorElEmoji] = useState(null);
  const messagesEndRef = useRef(null);
  const isOnline = userStatus?.status === 'online';

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

  const onEmojiClick = (emojiData) => {
    setMessage(prev => prev + emojiData.emoji);
  };

  const handleEmojiOpen = (event) => {
    setAnchorElEmoji(event.currentTarget);
  };

  const handleEmojiClose = () => {
    setAnchorElEmoji(null);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!selectedUser) {
    return (
      <Box sx={{ 
        flex: 1, display: 'flex', flexDirection: 'column', 
        alignItems: 'center', justifyContent: 'center', 
        bgcolor: '#f8f9fa', borderBottom: '6px solid #25d366' 
      }}>
        <Avatar sx={{ width: 120, height: 120, mb: 2, bgcolor: '#e9edef' }}>
          <ChatBubbleOutlineIcon sx={{ fontSize: 60, color: '#8696a0' }} />
        </Avatar>
        <Typography variant="h5" color="text.primary" fontWeight="light">WhatsApp for CRM</Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
          Send and receive messages in real-time.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', bgcolor: '#efeae2' }}>
      {/* WhatsApp Header */}
      <Box sx={{ 
        p: '10px 16px', 
        bgcolor: '#f0f2f5', 
        display: 'flex', 
        alignItems: 'center',
        justifyContent: 'space-between',
        borderBottom: '1px solid rgba(0,0,0,0.1)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            variant="dot"
            sx={{
              '& .MuiBadge-badge': {
                backgroundColor: isOnline ? '#44b700' : '#bdbdbd',
                color: isOnline ? '#44b700' : '#bdbdbd',
                boxShadow: `0 0 0 2px #f0f2f5`,
              }
            }}
          >
            <Avatar sx={{ width: 40, height: 40, mr: 2 }}>
              {selectedUser.name.charAt(0).toUpperCase()}
            </Avatar>
          </Badge>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold" sx={{ lineHeight: 1.2 }}>
              {selectedUser.name}
            </Typography>
            <Typography variant="caption" sx={{ color: isOnline ? '#00a884' : '#667781', fontWeight: isOnline ? 'bold' : 'normal' }}>
              {isOnline ? 'online' : 'offline'}
            </Typography>
          </Box>
        </Box>
        <Box>
          <IconButton size="small"><MoreVertIcon /></IconButton>
        </Box>
      </Box>

      {/* Messages Area */}
      <Box sx={{ 
        flex: 1, 
        p: '20px 7%', 
        overflowY: 'auto', 
        position: 'relative',
        backgroundImage: 'url("https://user-images.githubusercontent.com/15075759/28719144-86dc0f70-73b1-11e7-911d-60d70fcded21.png")',
        backgroundRepeat: 'repeat',
        backgroundSize: 'contain'
      }}>
        {messages.map((msg, index) => {
          const isCurrentUser = msg.senderId === currentUserId;
          return (
            <Box
              key={index}
              sx={{
                display: 'flex',
                justifyContent: isCurrentUser ? 'flex-end' : 'flex-start',
                mb: 1,
                px: 1
              }}
            >
              <Paper
                elevation={0}
                sx={{
                  p: '6px 7px 8px 9px',
                  bgcolor: isCurrentUser ? '#dcf8c6' : '#ffffff',
                  color: '#111b21',
                  borderRadius: '7.5px',
                  boxShadow: '0 1px 0.5px rgba(11,20,26,.13)',
                  maxWidth: '85%',
                  position: 'relative',
                  '&::before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    [isCurrentUser ? 'right' : 'left']: '-8px',
                    width: '12px',
                    height: '12px',
                    bgcolor: isCurrentUser ? '#dcf8c6' : '#ffffff',
                    clipPath: isCurrentUser ? 'polygon(0 0, 0 100%, 100% 0)' : 'polygon(100% 0, 100% 100%, 0 0)',
                  }
                }}
              >
                <Typography variant="body2" sx={{ fontSize: '14.2px', lineHeight: '19px', pr: isCurrentUser ? 5 : 0 }}>
                  {msg.message}
                </Typography>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mt: -0.5, ml: 1 }}>
                  <Typography variant="caption" sx={{ color: '#667781', fontSize: '11px', mr: 0.5 }}>
                    {msg.timestamp ? format(new Date(msg.timestamp), 'h:mm a') : 'now'}
                  </Typography>
                  {isCurrentUser && (
                    <DoneAllIcon sx={{ fontSize: 16, color: msg.isRead ? '#53bdeb' : '#8696a0' }} />
                  )}
                </Box>
              </Paper>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </Box>

      {/* WhatsApp Input Bar */}
      <Box sx={{ 
        p: '10px 16px', 
        bgcolor: '#f0f2f5',
        display: 'flex',
        alignItems: 'center',
        gap: 1
      }}>
        <IconButton size="small" sx={{ color: '#54656f' }} onClick={handleEmojiOpen}>
          <EmojiIcon />
        </IconButton>
        
        <Popover
          open={Boolean(anchorElEmoji)}
          anchorEl={anchorElEmoji}
          onClose={handleEmojiClose}
          anchorOrigin={{
            vertical: 'top',
            horizontal: 'left',
          }}
          transformOrigin={{
            vertical: 'bottom',
            horizontal: 'left',
          }}
          sx={{ mb: 1 }}
        >
          <EmojiPicker onEmojiClick={onEmojiClick} />
        </Popover>

        <IconButton size="small" sx={{ color: '#54656f' }}><AttachFileIcon /></IconButton>
        
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
            '& .MuiOutlinedInput-root': {
              borderRadius: '8px',
              '& fieldset': { borderColor: 'transparent' },
              '&:hover fieldset': { borderColor: 'transparent' },
              '&.Mui-focused fieldset': { borderColor: 'transparent' },
            },
          }}
        />
        
        {message.trim() ? (
          <IconButton onClick={handleSend} sx={{ color: '#00a884' }}>
            <SendIcon />
          </IconButton>
        ) : (
          <Box sx={{ width: 40 }} />
        )}
      </Box>
    </Box>
  );
};

export default ChatInterface;
