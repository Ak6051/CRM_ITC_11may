// import React, { useState, useEffect, useCallback, useRef } from 'react';
// import { AppBar, Toolbar, Button, Menu, MenuItem, Typography, IconButton, Badge, Popover, Box, Paper } from '@mui/material';
// import ChatIcon from '@mui/icons-material/Chat';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import { io } from 'socket.io-client';
// import { API_BASE_URL, SOCKET_URL } from '../../config/api.config';
// import MailIcon from '@mui/icons-material/Mail';

// import AdminChatBox from './AdminChatBox';

// const AdminNavbar = () => {
//     const navigate = useNavigate();
//     const [anchorEl, setAnchorEl] = useState(null);
//     const [userName, setUserName] = useState('');
//     const [chatOpen, setChatOpen] = useState(false);
//     const [adminMessages, setAdminMessages] = useState([]);
//     const [unreadCount, setUnreadCount] = useState(0);
//     const [anchorMsg, setAnchorMsg] = useState(null);
//     const [loadingMessages, setLoadingMessages] = useState(false);
//     const socket = useRef();

//     // Initialize Socket.IO connection
//     useEffect(() => {
//         const userId = sessionStorage.getItem('userId');
//         if (!userId) return;

//         // Initialize socket connection
//         socket.current = io(SOCKET_URL, {
//             withCredentials: true,
//             transports: ['websocket'],
//         });

//         // Set up event listeners
//         socket.current.on('connect', () => {
//             console.log('Connected to WebSocket server');
//             // Add user to online users
//             socket.current.emit('addUser', userId);
//         });

//         // Listen for new messages
//         socket.current.on('getMessage', (message) => {
//             setAdminMessages(prevMessages => {
//                 // Check if message already exists to prevent duplicates
//                 const messageExists = prevMessages.some(msg => msg._id === message._id);
//                 if (messageExists) return prevMessages;
                
//                 // Add new message to the beginning of the array
//                 const updatedMessages = [message, ...prevMessages];
                
//                 // Update unread count if chat is not open and message is not from current user
//                 if (!chatOpen && message.senderId !== userId) {
//                     setUnreadCount(prev => prev + 1);
//                 }
                
//                 return updatedMessages;
//             });
//         });

//         // Listen for message read confirmation
//         socket.current.on('messageReadSuccess', ({ messageId }) => {
//             setAdminMessages(prevMessages => 
//                 prevMessages.map(msg => 
//                     msg._id === messageId ? { ...msg, isRead: true } : msg
//                 )
//             );
//         });

//         // Clean up on unmount
//         return () => {
//             if (socket.current) {
//                 socket.current.disconnect();
//             }
//         };
//     }, [chatOpen]);

//     // Fetching user data on navbar load
//     useEffect(() => {
//         const fetchUserData = async () => {
//             try {
//                 const token = sessionStorage.getItem('token');
//                 if (!token) {
//                     console.error("Token is missing");
//                     return;
//                 }

//                 const response = await axios.get(`${API_BASE_URL}/user/profile`, {
//                     headers: { Authorization: token }
//                 });

//                 // Extract the first letter of first name and last name
//                 if (response.data && response.data.firstName && response.data.lastName) {
//                     const firstLetter = response.data.firstName[0] + response.data.lastName[0];
//                     setUserName(firstLetter.toUpperCase());
//                 }
//             } catch (error) {
//                 console.error('Error fetching user data', error);
//             }
//         };

//         fetchUserData();
//     }, []);


//     const markMessagesAsRead = useCallback(async () => {
//         const userId = sessionStorage.getItem('userId');
//         if (!userId || !socket.current) return;
    
//         try {
//             // Get unread messages
//             const unreadMessages = adminMessages.filter(msg => !msg.isRead && msg.receiverId === userId);
            
//             // Update UI immediately for better responsiveness
//             setAdminMessages(prevMessages => 
//                 prevMessages.map(msg => ({
//                     ...msg,
//                     isRead: true
//                 }))
//             );
            
//             setUnreadCount(0);
    
//             // Emit message read event for each unread message
//             unreadMessages.forEach(msg => {
//                 socket.current.emit('messageRead', {
//                     messageId: msg._id,
//                     userId: userId
//                 });
//             });
//         } catch (err) {
//             console.error("Failed to mark messages as read", err);
//         }
//     }, [adminMessages]);

//     const fetchMessages = useCallback(async () => {
//         const userId = sessionStorage.getItem('userId');
//         if (!userId) return;
        
//         setLoadingMessages(true);
//         try {
//             const response = await axios.get(`${API_BASE_URL}/chat/messages/${userId}`);
//             const messages = response.data || [];
            
//             // Process messages and ensure consistent structure
//             const processedMessages = messages.map(msg => ({
//                 ...msg,
//                 // Ensure timestamp is a Date object
//                 timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(),
//                 // Ensure isRead is a boolean
//                 isRead: Boolean(msg.isRead)
//             }));
    
//             // Sort by timestamp (newest first)
//             const sortedMessages = [...processedMessages].sort(
//                 (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
//             );
    
//             setAdminMessages(sortedMessages);
            
//             // Update unread count (only count messages where current user is the receiver)
//             const unread = sortedMessages.filter(msg => 
//                 !msg.isRead && msg.receiverId === userId
//             ).length;
            
//             setUnreadCount(unread);
//         } catch (err) {
//             console.error('Error fetching messages:', err);
//         } finally {
//             setLoadingMessages(false);
//         }
//     }, []);

//     useEffect(() => {
//         fetchMessages();
        
//         // Set up interval to check for new messages (fallback in case WebSocket fails)
//         const interval = setInterval(fetchMessages, 30000); // Check every 30 seconds
        
//         // Clean up interval on unmount
//         return () => clearInterval(interval);
//     }, [fetchMessages, chatOpen]);

//     useEffect(() => {
//         if (chatOpen) {
//             markMessagesAsRead();
//         }
//     }, [chatOpen, markMessagesAsRead]);

//     const handleNewMessage = useCallback((message) => {
//         // Only process if the message is for the current user
//         const userId = sessionStorage.getItem('userId');
//         if (message.receiverId === userId) {
//             // Add message to the beginning of the list
//             setAdminMessages(prevMessages => [message, ...prevMessages]);
            
//             // Update unread count if chat is closed
//             if (!chatOpen) {
//                 setUnreadCount(prev => prev + 1);
                
//                 // Show desktop notification if browser supports it
//                 if (Notification.permission === 'granted') {
//                     new Notification('New Message', {
//                         body: `You have a new message from ${message.senderName || 'a user'}`,
//                         icon: '/favicon.ico'
//                     });
//                 }
//             }
//         }
//     }, [chatOpen]);

//     useEffect(() => {
//         if (socket.current) {
//             socket.current.on('getMessage', handleNewMessage);
            
//             // Request notification permission when component mounts
//             if (Notification.permission !== 'denied') {
//                 Notification.requestPermission();
//             }
            
//             return () => {
//                 if (socket.current) {
//                     socket.current.off('getMessage', handleNewMessage);
//                 }
//             };
//         }
//     }, [socket, handleNewMessage]);

//     const handlePopoverOpen = (event) => {
//         setAnchorMsg(event.currentTarget);
//     };

//     const handlePopoverClose = () => {
//         setAnchorMsg(null);
//     };

//     const handleMenuClick = (event) => {
//         setAnchorEl(event.currentTarget);
//     };

//     const handleClose = () => {
//         setAnchorEl(null);
//     };

//     const handleLogout = () => {
//         sessionStorage.removeItem('token');
//         sessionStorage.removeItem('role');
//         sessionStorage.removeItem('userId');
//         navigate('/login');
//     };

//     return (
//         <AppBar
//             position="static"
//             sx={{
//                 border: '3px solid DodgerBlue',
//                 backgroundColor: '#1e1e2f', // Darker background color for consistency
//                 color: '#ffffff', // White text
//                 boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Slight shadow for a modern look
//             }}
//         >
//             <Toolbar>
//                 <Typography
//                     variant="h6"
//                     sx={{
//                         flexGrow: 1,
//                         fontWeight: 'bold',
//                         color: '#ffcc00', // Highlighted text color
//                     }}
//                 >
//                  Admin Dashboard
//                 </Typography>
//                 <IconButton color="inherit" onClick={() => setChatOpen(true)} sx={{ ml: 2 }}>
//                     <ChatIcon />
//                 </IconButton>
//                 <AdminChatBox open={chatOpen} handleClose={() => setChatOpen(false)} socket={socket.current} />

//                      <IconButton color="inherit" onClick={handlePopoverOpen} sx={{ mr: 1 }}>
//                               <Badge badgeContent={unreadCount} color="error">
//                                 <MailIcon />
//                               </Badge>
//                             </IconButton>
//                 <div>
//                     <Button
//                         onClick={handleMenuClick}
//                         aria-controls={Boolean(anchorEl) ? 'simple-menu' : undefined}
//                         aria-haspopup="true"
//                         sx={{
//                             color: '#ffffff', // White text for button
//                             '&:hover': {
//                                 backgroundColor: '#333', // Dark hover effect
//                                 color: '#ffcc00', // Highlight color on hover
//                             },
//                         }}
//                     >
//                         {/* Show first name & last name initials */}
//                         {userName || 'Profile'}
//                     </Button>
//                     <Menu
//                         anchorEl={anchorEl}
//                         open={Boolean(anchorEl)}
//                         onClose={handleClose}
//                         sx={{
//                             '& .MuiPaper-root': {
//                                 backgroundColor: 'grey', // Match navbar background
//                                 color: '#ffffff', // White text for menu items
//                             },
//                         }}
//                     >
//                         <MenuItem
//                             onClick={() => {
//                                 handleClose();
//                                 navigate('/profile');
//                             }}
//                             sx={{
//                                 '&:hover': {
//                                     backgroundColor: '#333', // Dark hover effect
//                                     color: '#ffcc00', // Highlight color
//                                 },
//                             }}
//                         >
//                             My Profile
//                         </MenuItem>
//                         <MenuItem
//                             onClick={() => {
//                                 handleClose();
//                                 handleLogout();
//                             }}
//                             sx={{
//                                 '&:hover': {
//                                     backgroundColor: '#333', // Dark hover effect
//                                     color: '#ffcc00', // Highlight color
//                                 },
//                             }}
//                         >
//                             Logout
//                         </MenuItem>
//                     </Menu>
//                 </div>
//             </Toolbar>

//                 <Popover
//                     id="message-menu"
//                     open={Boolean(anchorMsg)}
//                     anchorEl={anchorMsg}
//                     onClose={handlePopoverClose}
//                     anchorOrigin={{
//                       vertical: 'bottom',
//                       horizontal: 'right',
//                     }}
//                     transformOrigin={{
//                       vertical: 'top',
//                       horizontal: 'right',
//                     }}
//                     sx={{
//                       '& .MuiPaper-root': {
//                         width: 400,
//                         maxWidth: '90vw',
//                         p: 2,
//                         borderRadius: 2,
//                         boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
//                       },
//                     }}
//                   >
//                     <Typography variant="h6" color="primary" gutterBottom>
//                     Hr Messages
//                     </Typography>
            
//                     <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
//                       {loadingMessages ? (
//                         <Typography>Loading messages...</Typography>
//                       ) : adminMessages.length === 0 ? (
//                         <Typography>No messages from Admin.</Typography>
//                       ) : (
//                         [...adminMessages]
//                           .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
//                           .map((msg) => (
//                             <Paper 
//                               key={msg.id} 
//                               sx={{ 
//                                 p: 1.5, 
//                                 my: 1, 
//                                 background: msg.isRead ? '#f9f9f9' : '#e3f2fd',
//                                 borderLeft: `4px solid ${msg.isRead ? '#90caf9' : '#1976d2'}`,
//                                 borderRadius: 1,
//                                 boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
//                                 '&:hover': {
//                                   boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
//                                 }
//                               }}
//                             >
//                               <Typography 
//                                 variant="body2" 
//                                 sx={{ 
//                                   mb: 0.5,
//                                   fontWeight: msg.isRead ? 'normal' : '500',
//                                   color: msg.isRead ? 'text.secondary' : 'text.primary'
//                                 }}
//                               >
//                                 {msg.message}
//                               </Typography>
//                               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
//                                 <Typography 
//                                   variant="caption" 
//                                   sx={{ 
//                                     color: msg.isRead ? 'text.disabled' : 'primary.main',
//                                     fontSize: '0.7rem'
//                                   }}
//                                 >
//                                   {msg.isRead ? 'Read' : 'New'}
//                                 </Typography>
//                                 <Typography 
//                                   variant="caption" 
//                                   color="text.secondary"
//                                   sx={{ fontSize: '0.7rem' }}
//                                 >
//                                   {msg.timestamp?.toLocaleDateString('en-IN', {
//                                     day: '2-digit',
//                                     month: 'short',
//                                     year: 'numeric',
//                                   })}
//                                   {' at '}
//                                   {msg.timestamp?.toLocaleTimeString('en-IN', {
//                                     hour: '2-digit',
//                                     minute: '2-digit',
//                                     hour12: true
//                                   })}
//                                 </Typography>
//                               </Box>
//                             </Paper>
//                           ))
//                       )}
//                     </Box>
//                   </Popover>
//         </AppBar>
//     );
// };

// export default AdminNavbar;
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography, IconButton, Badge, Popover, Box, Paper } from '@mui/material';
import ChatBubbleOutlineIcon from '@mui/icons-material/ChatBubbleOutline';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../../config/api.config';

import AdminChatBox from './AdminChatBox';

const AdminNavbar = () => {
  const navigate = useNavigate();
  const [anchorEl, setAnchorEl] = useState(null);
  const [userName, setUserName] = useState('');
  const [chatOpen, setChatOpen] = useState(false);
  const [adminMessages, setAdminMessages] = useState([]);
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
      setAdminMessages(prev => {
        if (prev.some(msg => msg._id === message._id)) return prev;
        if (!chatOpen && message.senderId !== userId) setUnreadCount(prevCount => prevCount + 1);
        return [message, ...prev];
      });
    });

    socket.current.on('messageReadSuccess', ({ messageId }) => {
      setAdminMessages(prev => prev.map(msg => msg._id === messageId ? { ...msg, isRead: true } : msg));
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

    const unreadMessages = adminMessages.filter(msg => !msg.isRead && msg.receiverId === userId);
    setAdminMessages(prev => prev.map(msg => ({ ...msg, isRead: true })));
    setUnreadCount(0);

    unreadMessages.forEach(msg => { socket.current.emit('messageRead', { messageId: msg._id, userId }); });
  }, [adminMessages]);

  const fetchMessages = useCallback(async () => {
    const userId = sessionStorage.getItem('userId');
    if (!userId) return;

    setLoadingMessages(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/chat/messages/${userId}`);
      const messages = res.data || [];
      const processed = messages.map(msg => ({ ...msg, timestamp: msg.timestamp ? new Date(msg.timestamp) : new Date(), isRead: Boolean(msg.isRead) }));
      const sorted = processed.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
      setAdminMessages(sorted);
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
      setAdminMessages(prev => [message, ...prev]);
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
        maxWidth: '98%', // Slimmer width
        mx: 'auto',
        borderRadius: 2,
      }}
    >
      <Toolbar sx={{ minHeight: 56 }}>
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold', color: '#ffcc00', fontFamily: 'Lora' }}>
          Admin Dashboard
        </Typography>

        <IconButton color="inherit" onClick={() => setChatOpen(true)} sx={{ ml: 1, transition: '0.3s', '&:hover': { color: '#FFD700', transform: 'scale(1.1)' } }}>
          <ChatBubbleOutlineIcon />
        </IconButton>
        <AdminChatBox open={chatOpen} handleClose={() => setChatOpen(false)} socket={socket.current} />

        <IconButton color="inherit" onClick={handlePopoverOpen} sx={{ ml: 1, transition: '0.3s', '&:hover': { color: '#FFD700', transform: 'scale(1.1)' } }}>
          <Badge badgeContent={unreadCount} color="error">
            <MailOutlineIcon />
          </Badge>
        </IconButton>

        <Button onClick={handleMenuClick} aria-controls={Boolean(anchorEl) ? 'simple-menu' : undefined} aria-haspopup="true" sx={{ color: '#fff', ml: 1, fontWeight: 'bold', '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>
          {userName || 'Profile'}
        </Button>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleClose} sx={{ '& .MuiPaper-root': { backgroundColor: '#2c2c3e', color: '#fff' } }}>
          <MenuItem onClick={() => { handleClose(); navigate('/profile'); }} sx={{ '&:hover': { backgroundColor: '#333', color: '#FFD700' } }}>My Profile</MenuItem>
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
          <Typography variant="h6" color="primary" gutterBottom>Hr Messages</Typography>
          <Box sx={{ maxHeight: 400, overflowY: 'auto' }}>
            {loadingMessages ? <Typography>Loading messages...</Typography> :
              adminMessages.length === 0 ? <Typography>No messages from Admin.</Typography> :
              [...adminMessages].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).map(msg => (
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

export default AdminNavbar;
