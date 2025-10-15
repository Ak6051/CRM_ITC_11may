

import React, { useState } from 'react';
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
import AssignmentIcon from '@mui/icons-material/Assignment';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import WorkIcon from '@mui/icons-material/Work';
import DescriptionIcon from '@mui/icons-material/Description';
import TaskIcon from '@mui/icons-material/Task';
import RecentActorsIcon from '@mui/icons-material/RecentActors';
import AssessmentIcon from '@mui/icons-material/Assessment';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import { useNavigate } from 'react-router-dom';
import AddchartIcon from '@mui/icons-material/Addchart';
import BeenhereIcon from '@mui/icons-material/Beenhere';

const Sidebar = () => {
  const navigate = useNavigate();
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [settings, setSettings] = useState({ logoUrl: '', companyName: '' }); // Default initialization

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
          backgroundColor: '#1e1e2f', // Darker background for sidebar
          color: '#ffffff', // White text
          border: '3px solid DodgerBlue'
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
          borderBottom: '1px solid #444', // Separator for the logo section
        }}
      >
        <img
          src={settings.logoUrl || 'headerlogo.svg'} // Fallback to a default image if logoUrl is not set
          alt="Company Logo"
          style={{ width: '180px', height: '80px', marginBottom: '8px' }}
        />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: '#ffcc00', fontFamily: "Lora" }}>
          {settings.companyName || 'Ideal Talent Connect'}
        </Typography>
      </Box>

      <List>
        {/* Dashboard Link */}
        <ListItem
          button
          onClick={() => navigate('/Hr-dashboard')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
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
          onClick={() => navigate('/hr-job-post-report')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <AssessmentIcon />
          </ListItemIcon>
          <ListItemText primary="Job Post Report" />
        </ListItem>

        <ListItem
          button
          onClick={() => navigate('/candidate-list')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <AddchartIcon />
          </ListItemIcon>
          <ListItemText primary="Sourced Data" />
        </ListItem>

        <ListItem
          button
          onClick={() => navigate('/placed-candidate-list')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <BeenhereIcon />
          </ListItemIcon>
          <ListItemText primary="Placed Data" />
        </ListItem>

        <ListItem
          button
          onClick={() => navigate('/job-form')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <WorkIcon />
          </ListItemIcon>
          <ListItemText primary="Job Openings form" />
        </ListItem>

        <ListItem
          button
          onClick={() => navigate('/all-candidates-form')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <AssignmentIcon />
          </ListItemIcon>
          <ListItemText primary="Candidates Form" />
        </ListItem>

        <ListItem
          button
          onClick={() => navigate('/hr-dasboard-task')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <TaskIcon />
          </ListItemIcon>
          <ListItemText primary="Assigned Task" />
        </ListItem>
        <ListItem
          button
          onClick={() => navigate('/all-candidates')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <PeopleAltIcon />
          </ListItemIcon>
          <ListItemText primary="Candidates Details" />
        </ListItem>

        <ListItem
          button
          onClick={() => navigate('/hr-candidates')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <RecentActorsIcon />
          </ListItemIcon>
          <ListItemText primary="All Candidates Details" />
        </ListItem>

        <ListItem
          button
          onClick={() => navigate('/recent-data')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <DescriptionIcon />
          </ListItemIcon>
          <ListItemText primary="Recent Data" />
        </ListItem>
        <ListItem
          button
          onClick={() => navigate('/daily-hr-task')}
          sx={{
            '&:hover': {
              backgroundColor: '#333',
              color: '#ffcc00',
            },
          }}
        >
          <ListItemIcon sx={{ color: 'inherit' }}>
            <CalendarTodayIcon />
          </ListItemIcon>
          <ListItemText primary="Daily Task Data" />
        </ListItem>
     




      </List>
    </Drawer>
  );
};

export default Sidebar;
