import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  DashboardOutlined,
  AssessmentOutlined,
  BusinessCenterOutlined,
  ApartmentOutlined,
  TrendingUpOutlined,
  CalendarTodayOutlined,
  Menu,
  ChevronLeft,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';

const drawerWidth = 260;
const collapsedWidth = 70;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  const menuItems = [
    { text: 'Master Dashboard', icon: <AssessmentOutlined />, route: '/sales-master-dashboard' },
    { text: 'Lead Management', icon: <TrendingUpOutlined />, route: '/lead-management' },
    { text: 'Create Company', icon: <ApartmentOutlined />, route: '/sales-company-create' },
        { text: 'Job Openings', icon: <DashboardOutlined />, route: '/sales-dashboard' },
    { text: 'Daily Task Data', icon: <CalendarTodayOutlined />, route: '/daily-sales-task' },
  ];

  const isActive = (route) => location.pathname === route;

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: sidebarOpen ? drawerWidth : collapsedWidth,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: sidebarOpen ? drawerWidth : collapsedWidth,
          boxSizing: 'border-box',
          background: 'rgba(28,28,42,0.92)',
          backdropFilter: 'blur(14px)',
          color: '#fff',
          borderRight: 'none',
          transition: 'width 0.3s',
          overflowX: 'hidden',
        },
      }}
    >
      {/* Toggle Button */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: sidebarOpen ? 'flex-end' : 'center',
          px: 1,
          py: 1.5,
        }}
      >
        <IconButton onClick={toggleSidebar} sx={{ color: '#FFD700' }}>
          {sidebarOpen ? <ChevronLeft /> : <Menu />}
        </IconButton>
      </Box>

      {/* Logo */}
      {sidebarOpen && (
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            py: 3,
            mx: 2,
            mb: 2,
            background: 'rgba(39,40,63,0.75)',
            borderRadius: 3,
            boxShadow: '0 6px 16px rgba(0,0,0,0.3)',
          }}
        >
          <img
            src={'headerlogo.svg'}
            alt="Logo"
            style={{ width: '160px', height: '70px', marginBottom: 8, borderRadius: 10 }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#f6b93b', fontFamily: '"Poppins", "Lora", serif', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.5px' }}
          >
            Ideal Talent Connect
          </Typography>
        </Box>
      )}

      {/* Menu */}
      <List sx={{ py: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.text} title={!sidebarOpen ? item.text : ''} placement="right">
            <ListItem
              button
              onClick={() => navigate(item.route)}
              sx={{
                my: 0.5,
                mx: 1,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                backgroundColor: isActive(item.route) ? 'rgba(255,215,0,0.15)' : 'transparent',
                boxShadow: isActive(item.route) ? '0 0 12px rgba(255,215,0,0.5)' : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(255,215,0,0.25)',
                  transform: 'translateX(5px)',
                  boxShadow: '0 0 12px rgba(255,215,0,0.5)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.route) ? '#FFD700' : '#fff',
                  minWidth: 40,
                  transition: 'all 0.3s ease',
                  filter: isActive(item.route) ? 'drop-shadow(0 0 2px #FFD700)' : 'none',
                }}
              >
                {item.icon}
              </ListItemIcon>
              {sidebarOpen && (
                <ListItemText
                  primary={item.text}
                  sx={{
                    '& .MuiTypography-root': { 
                      fontWeight: 600, 
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: '0.9rem',
                      letterSpacing: '0.3px',
                    },
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}
      </List>
    </Drawer>
  );
};

export default Sidebar;
