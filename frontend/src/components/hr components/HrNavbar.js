
import React, { useState, useEffect } from 'react';
import { AppBar, Toolbar, Button, Menu, MenuItem, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const HrNavbar = () => {
    const navigate = useNavigate();
    const [anchorEl, setAnchorEl] = useState(null);
    const [userName, setUserName] = useState('');

    // Fetching user data on navbar load
    useEffect(() => {
        const fetchUserData = async () => {
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    console.error("Token is missing");
                    return;
                }

                const response = await axios.get('http://localhost:5000/api/user/profile', {
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

    const handleMenuClick = (event) => {
        setAnchorEl(event.currentTarget);
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const handleLogout = () => {
        localStorage.removeItem('token');
        localStorage.removeItem('role');
        navigate('/login');
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
                    HR Dashboard
                </Typography>
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
                                navigate('/hr-profile');
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
        </AppBar>
    );
};

export default HrNavbar;
