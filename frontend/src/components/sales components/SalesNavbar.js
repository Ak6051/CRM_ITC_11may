import React, { useState, useEffect, useCallback } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography, IconButton, Badge, Popover, Box, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import MailIcon from '@mui/icons-material/Mail';

const SalesNavbar = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [anchorMsg, setAnchorMsg] = useState(null);
    const [userName, setUserName] = useState('');
    const [hrMessages, setHrMessages] = useState([]);
    const [unreadCount, setUnreadCount] = useState(0);
    const [loadingMessages, setLoadingMessages] = useState(true);
    const [chatOpen, setChatOpen] = useState(false);

    // Fetching user data on navbar load
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = sessionStorage.getItem('token');
                if (!token) {
                    console.error("Token is missing");
                    return;
                }

                const response = await axios.get(`${API_BASE_URL}/user/profile`, {
                    headers: { Authorization: token },
                });

                // Extract the first letter of first name and last name
                if (response.data && response.data.firstName && response.data.lastName) {
                    const firstLetter = response.data.firstName[0] + response.data.lastName[0];
                    setUserName(firstLetter.toUpperCase());
                }
            } catch (error) {
                console.error('Error fetching user data', error);
            }
        };

        fetchUserData();
    }, []);

    const markMessagesAsRead = useCallback(async () => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) return;

        try {
            // First update the UI for better responsiveness
            setHrMessages(prevMessages =>
                prevMessages.map(msg => ({
                    ...msg,
                    isRead: true
                }))
            );
            setUnreadCount(0);

            // Then make the API call
            await axios.post(`${API_BASE_URL}/message/sales-admin/mark-read/${userId}`);
        } catch (err) {
            console.error("Failed to mark messages as read", err);
            // Revert UI if API call fails
            fetchMessages();
        }
    }, []);

    // Fetch messages with proper timestamp handling
    const fetchMessages = async () => {
        const userId = sessionStorage.getItem('userId');
        if (!userId) return;

        setLoadingMessages(true);
        try {
            const response = await axios.get(`${API_BASE_URL}/message/sales-admin/${userId}`);
            const messages = response.data || [];

            // Process messages and ensure consistent structure
            const processedMessages = messages.map(msg => ({
                ...msg,
                // Ensure timestamp is a Date object
                timestamp: msg.timestamp instanceof Date ? msg.timestamp :
                    (msg.timestamp?._seconds ? new Date(msg.timestamp._seconds * 1000) : new Date()),
                // Ensure isRead is a boolean
                isRead: Boolean(msg.isRead)
            }));

            // Sort by timestamp (newest first)
            const sortedMessages = [...processedMessages].sort(
                (a, b) => new Date(b.timestamp) - new Date(a.timestamp)
            );

            setHrMessages(sortedMessages);

            // Update unread count
            const unreadCount = sortedMessages.filter(msg => !msg.isRead).length;
            setUnreadCount(unreadCount);

            // Mark messages as read if popover is open
            if (anchorMsg && unreadCount > 0) {
                markMessagesAsRead();
            }
        } catch (err) {
            console.error('Error fetching messages:', err);
        } finally {
            setLoadingMessages(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchMessages();
    }, []);

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('userId');
        navigate('/login');
    };

    const handlePopoverOpen = (event) => {
        setAnchorMsg(event.currentTarget);
        // Mark messages as read when popover is opened
        if (unreadCount > 0) {
            markMessagesAsRead();
        }
    };

    const handlePopoverClose = () => {
        setAnchorMsg(null);
    };

    return (
        <AppBar
            position="static"
            sx={{
                border: '3px solid DodgerBlue',
                backgroundColor: '#1e1e2f', // Darker background color for consistency
                color: '#ffffff', // White text
                boxShadow: '0px 4px 6px rgba(0, 0, 0, 0.1)', // Slight shadow for a modern look
            }}
        >
            <Toolbar>
                <Typography
                    variant="h6"
                    sx={{
                        flexGrow: 1,
                        fontWeight: 'bold',
                        color: '#ffcc00', // Highlighted text color
                    }}
                >
                    Sales Dashboard
                </Typography>

                <IconButton color="inherit" onClick={handlePopoverOpen} sx={{ mr: 1 }}>
                    <Badge badgeContent={unreadCount} color="error">
                        <MailIcon />
                    </Badge>
                </IconButton>
                <div>
                    <Button
                        onClick={handleMenuClick}
                        aria-controls={Boolean(anchorEl) ? 'simple-menu' : undefined}
                        aria-haspopup="true"
                        sx={{
                            color: '#ffffff', // White text for button
                            '&:hover': {
                                backgroundColor: '#333', // Dark hover effect
                                color: '#ffcc00', // Highlight color on hover
                            },
                        }}
                    >
                        {/* Show first name & last name initials */}
                        {userName || 'Profile'}
                    </Button>
                    <Menu
                        anchorEl={anchorEl}
                        open={Boolean(anchorEl)}
                        onClose={handleClose}
                        sx={{
                            '& .MuiPaper-root': {
                                backgroundColor: 'grey', // Match navbar background
                                color: '#ffffff', // White text for menu items
                            },
                        }}
                    >
                        <MenuItem
                            onClick={() => {
                                handleClose();
                                navigate('/sales-profile');
                            }}
                            sx={{
                                '&:hover': {
                                    backgroundColor: '#333', // Dark hover effect
                                    color: '#ffcc00', // Highlight color
                                },
                            }}
                        >
                            My Profile
                        </MenuItem>
                        <MenuItem
                            onClick={() => {
                                handleClose();
                                handleLogout();
                            }}
                            sx={{
                                '&:hover': {
                                    backgroundColor: '#333', // Dark hover effect
                                    color: '#ffcc00', // Highlight color
                                },
                            }}
                        >
                            Logout
                        </MenuItem>
                    </Menu>
                </div>
            </Toolbar>

            {/* Messages Popover */}
            <Popover
                id="message-menu"
                open={Boolean(anchorMsg)}
                anchorEl={anchorMsg}
                onClose={handlePopoverClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                sx={{
                    '& .MuiPaper-root': {
                        width: 400,
                        maxWidth: '90vw',
                        p: 2,
                        borderRadius: 2,
                        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.15)',
                    },
                }}
            >
                <Typography variant="h6" color="primary" gutterBottom>
                    Hr and Admin Messages
                </Typography>

                <Box sx={{ maxHeight: 400, overflow: 'auto' }}>
                    {loadingMessages ? (
                        <Typography>Loading messages...</Typography>
                    ) : hrMessages.length === 0 ? (
                        <Typography>No messages from Hr and Admin.</Typography>
                    ) : (
                        [...hrMessages]
                            .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
                            .map((msg) => (
                                <Paper
                                    key={msg.id}
                                    sx={{
                                        p: 1.5,
                                        my: 1,
                                        background: msg.isRead ? '#f9f9f9' : '#e3f2fd',
                                        borderLeft: `4px solid ${msg.isRead ? '#90caf9' : '#1976d2'}`,
                                        borderRadius: 1,
                                        boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
                                        '&:hover': {
                                            boxShadow: '0 2px 5px rgba(0,0,0,0.2)'
                                        }
                                    }}
                                >
                                    <Typography
                                        variant="body2"
                                        sx={{
                                            mb: 0.5,
                                            fontWeight: msg.isRead ? 'normal' : '500',
                                            color: msg.isRead ? 'text.secondary' : 'text.primary'
                                        }}
                                    >
                                        {msg.message}
                                    </Typography>
                                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                        <Typography
                                            variant="caption"
                                            sx={{
                                                color: msg.isRead ? 'text.disabled' : 'primary.main',
                                                fontSize: '0.7rem'
                                            }}
                                        >
                                            {msg.isRead ? 'Read' : 'New'}
                                        </Typography>
                                        <Typography
                                            variant="caption"
                                            color="text.secondary"
                                            sx={{ fontSize: '0.7rem' }}
                                        >
                                            {msg.timestamp?.toLocaleDateString('en-IN', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                            {' at '}
                                            {msg.timestamp?.toLocaleTimeString('en-IN', {
                                                hour: '2-digit',
                                                minute: '2-digit',
                                                hour12: true
                                            })}
                                        </Typography>
                                    </Box>
                                </Paper>
                            ))
                    )}
                </Box>
            </Popover>
        </AppBar>
    );
};

export default SalesNavbar;
