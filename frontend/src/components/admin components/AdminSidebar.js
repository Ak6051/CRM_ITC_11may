
import React, { useEffect, useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
 
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import SettingsIcon from '@mui/icons-material/Settings';
import BusinessIcon from '@mui/icons-material/Business';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ExpandLess from '@mui/icons-material/ExpandLess';
import ExpandMore from '@mui/icons-material/ExpandMore';
import Collapse from '@mui/material/Collapse';
import PeopleIcon from '@mui/icons-material/People';


const Sidebar = () => {
  const navigate = useNavigate();
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [settings, setSettings] = useState({ logoUrl: '', companyName: '' });
const [hrDropdownOpen, setHrDropdownOpen] = useState(false);
const [hrList, setHrList] = useState([]);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/settings');
        if (response.data) {
          setSettings({
            logoUrl: response.data.logoUrl || '',
            companyName: response.data.companyName || '',
          });
        }
      } catch (error) {
        console.error(error);
      }
    };

    fetchSettings();
  }, []);

  useEffect(() => {
    const fetchHRs = async () => {
      const token = sessionStorage.getItem('token');
      const res = await axios.get("http://localhost:5000/api/panel/hr-users", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setHrList(res.data);
    };
  
    fetchHRs();
  }, []);

  const handleHRClick = () => {
  setHrDropdownOpen(!hrDropdownOpen);
};


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
           border:'5px solid DodgerBlue'
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
          borderBottom: '1px solid #333', // Divider line
        }}
      >
        <img
          src={settings.logoUrl || 'headerlogo.svg'}
          alt="Company Logo"
          style={{ width: '180px', height: '80px', marginBottom: '8px' }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: '#ffcc00', // Highlight color for company name
            fontFamily:"Lora"
          }}
        >
          {settings.companyName || 'Ideal Talent Connect'}
        </Typography>
      </Box>

      <List>
        {/* Dashboard Link */}
        <ListItem
          button
          onClick={() => navigate('/job-report')}
          sx={{
            '&:hover': {
              backgroundColor: '#333', // Hover effect
              color: '#ffcc00', // Highlight text color
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: '#ffffff', // Default icon color
              '&:hover': { color: '#ffcc00' }, // Icon hover effect
            }}
          >
            <HomeIcon />
          </ListItemIcon>
          <ListItemText primary="Dashboard" />
        </ListItem>

        {/* Settings Link */}
        <ListItem
          button
          onClick={() => navigate('/admin-settings')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: '#ffffff',
              '&:hover': { color: '#ffcc00' },
            }}
          >
            <SettingsIcon />
          </ListItemIcon>
          <ListItemText primary="Settings" />
        </ListItem>

         <ListItem
          button
          onClick={() => navigate('/hr-report')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: '#ffffff',
              '&:hover': { color: '#ffcc00' },
            }}
          >
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Placement Report" />
        </ListItem>

         
          <ListItem
          button
          onClick={() => navigate('/can-rep')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: '#ffffff',
              '&:hover': { color: '#ffcc00' },
            }}
          >
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Candidates Details" />
        </ListItem>

         <ListItem
          button
          onClick={() => navigate('/interview-repo')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon
            sx={{
              color: '#ffffff',
              '&:hover': { color: '#ffcc00' },
            }}
          >
            <BusinessIcon />
          </ListItemIcon>
          <ListItemText primary="Interview Details" />
        </ListItem>

<ListItem
  button
  onClick={handleHRClick}
  sx={{
    '&:hover': {
      backgroundColor: '#333',
      color: '#ffcc00',
    },
  }}
>
  <ListItemIcon sx={{ color: '#ffffff', '&:hover': { color: '#ffcc00' } }}>
    <PeopleIcon />
  </ListItemIcon>
  <ListItemText primary="All HR's" />
  {hrDropdownOpen ? <ExpandLess /> : <ExpandMore />}
</ListItem>

<Collapse in={hrDropdownOpen} timeout="auto" unmountOnExit>
  <List component="div" disablePadding>
    {hrList.map((hr) => (
      <ListItem
        key={hr._id}
        button
        sx={{ pl: 4, '&:hover': { backgroundColor: '#333', color: '#ffcc00' } }}
        onClick={() => navigate(`/hr/${hr._id}`)} // 👈 Route to HR details
      >
        <ListItemText primary={hr.firstName + ' ' + hr.lastName} />
      </ListItem>
    ))}
  </List>
</Collapse>

        
      </List>
      
    </Drawer>
  );
};

export default Sidebar;
