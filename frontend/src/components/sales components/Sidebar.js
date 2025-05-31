import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Collapse,
  Box,
  Typography,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import ApartmentIcon from '@mui/icons-material/Apartment';
import BusinessIcon from '@mui/icons-material/Business';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import { useNavigate } from 'react-router-dom';

const Sidebar = () => {
  const navigate = useNavigate();
  const [departmentOpen, setDepartmentOpen] = useState(false);

  const handleDepartmentClick = () => {
    setDepartmentOpen(!departmentOpen);
  };

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: 240,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: 240,
          boxSizing: 'border-box',
          backgroundColor: '#1e1e2f', // Sidebar background color
          color: '#ffffff', // White text color
          border:'3px solid DodgerBlue'
        },
      }}
    >
      {/* Company Logo and Name */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          p: 2,
        }}
      >
        <img
          src={'headerlogo.svg'} // Replace with `settings.logoUrl` if dynamic logos are needed
          alt="Company Logo"
          style={{
            width: '180px',
            height: '80px',
            marginBottom: '8px',
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: '#ffcc00', // Highlighted text color for branding
            fontWeight: 'bold',
            fontFamily:"Lora"
          }}
        >
         Ideal Talent Connect
        </Typography>
      </Box>

      <List>
        {/* Dashboard Link */}
        <ListItem
          button
          onClick={() => navigate('/sales-dashboard')}
          sx={{
            '&:hover': {
              backgroundColor: '#333', // Hover background
              color: '#ffcc00', // Highlight text color
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        {/* Settings Link */}
        <ListItem
          button
          onClick={() => navigate('/settings')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>

        {/* Department with Dropdown */}
        <ListItem
          button
          onClick={handleDepartmentClick}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <ApartmentIcon />
          </ListItemIcon>
          <ListItemText primary="Department" />
          {departmentOpen ? <ExpandLess /> : <ExpandMore />}
        </ListItem>
        <Collapse in={departmentOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            
            <ListItem
              button
              sx={{
                pl: 4,
                '&:hover': {
                  backgroundColor: '#333',
                  color: '#ffcc00',
                },
              }}
              onClick={() => navigate('/jobopennings')}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Job Opennings" />
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;
