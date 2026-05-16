

import React, { useState, useEffect } from 'react';
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
  WorkOutlineOutlined,
  PersonAddOutlined,
  GroupOutlined,
  PeopleAltOutlined,
  DescriptionOutlined,
  CalendarTodayOutlined,
  AddchartOutlined,
  VerifiedOutlined,
  Menu,
  ChevronLeft,
  LockOutlined,
  ChatBubbleOutlineOutlined
} from '@mui/icons-material';
import { Badge } from '@mui/material';
import { listenForNotifications } from '../../services/chatService';
import HrChatBox from '../../pages/hr pages/HrChatBox';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';

const drawerWidth = 260;
const collapsedWidth = 70;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [settings] = useState({ logoUrl: '', companyName: '' });
  const [hasTaskToday, setHasTaskToday] = useState(true); // optimistic default
  const [unreadCount, setUnreadCount] = useState(0);
  const [chatOpen, setChatOpen] = useState(false);
  const currentUserId = sessionStorage.getItem('userId');

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);

  // Check if HR has created a daily task today
  useEffect(() => {
    const checkTask = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const role  = sessionStorage.getItem('role');
        if (!token || role !== 'HR') { setHasTaskToday(true); return; }
        const res = await axios.get(`${API_BASE_URL}/dailyTask/hr/today-check`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHasTaskToday(res.data.hasTask);
      } catch {
        setHasTaskToday(true); // fail open — don't block on error
      }
    };
    checkTask();
    // Re-check whenever the route changes (e.g. after task is created)
  }, [location.pathname]);

  // Also re-check when HR creates a daily task (custom event — no page reload needed)
  useEffect(() => {
    const handleTaskCreated = () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;
      axios.get(`${API_BASE_URL}/dailyTask/hr/today-check`, {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then(res => setHasTaskToday(res.data.hasTask))
        .catch(() => setHasTaskToday(true));
    };
    window.addEventListener('hr-task-created', handleTaskCreated);
    return () => window.removeEventListener('hr-task-created', handleTaskCreated);
  }, []);

  // Listen for real-time notifications
  useEffect(() => {
    if (!currentUserId) return;

    const unsubscribe = listenForNotifications(currentUserId, (notifications) => {
      const totalUnread = Object.values(notifications).reduce((acc, curr) => acc + (curr.count || 0), 0);
      setUnreadCount(totalUnread);
    });

    return () => unsubscribe();
  }, [currentUserId]);

  const menuItems = [
    { text: 'Master Dashboard',        icon: <AssessmentOutlined />,   route: '/hr-master-dashboard' },
    { text: 'Assigned Data',           icon: <DashboardOutlined />,    route: '/Hr-dashboard' },
    { text: 'Sourced Data',            icon: <AddchartOutlined />,     route: '/candidate-list' },
    { text: 'All Candidates Details',  icon: <GroupOutlined />,        route: '/hr-candidates' },
    { text: 'My Sourced Data',         icon: <PersonAddOutlined />,    route: '/my-sourced-data' },
    { text: 'Job Post Report',         icon: <AssessmentOutlined />,   route: '/hr-job-post-report' },
    { text: 'Placed Data',             icon: <VerifiedOutlined />,     route: '/placed-candidate-list' },
    { text: 'Recent Data',             icon: <DescriptionOutlined />,  route: '/recent-data' },
    { text: 'Daily Task Data',         icon: <CalendarTodayOutlined />, route: '/daily-hr-task', alwaysEnabled: true },
    { text: 'Live Chat',               icon: <ChatBubbleOutlineOutlined />, route: 'chat', alwaysEnabled: true, isAction: true },
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
            src={settings.logoUrl || 'headerlogo.svg'}
            alt="Logo"
            style={{ width: '160px', height: '70px', marginBottom: 8, borderRadius: 10 }}
          />
          <Typography
            variant="h6"
            sx={{ fontWeight: 700, color: '#f6b93b', fontFamily: '"Poppins", "Lora", serif', textAlign: 'center', fontSize: '1.1rem', letterSpacing: '0.5px' }}
          >
            {settings.companyName || 'Ideal Talent Connect'}
          </Typography>
        </Box>
      )}

      {/* Daily task banner — shown when task not created */}
      {!hasTaskToday && sidebarOpen && (
        <Box sx={{
          mx: 2, mb: 1.5, px: 1.5, py: 1.2,
          bgcolor: 'rgba(255,193,7,0.15)',
          border: '1px solid rgba(255,193,7,0.4)',
          borderRadius: 2,
          display: 'flex', alignItems: 'center', gap: 1,
        }}>
          <LockOutlined sx={{ color: '#FFD700', fontSize: 16, flexShrink: 0 }} />
          <Typography sx={{ color: '#FFD700', fontSize: '0.72rem', fontWeight: 600, lineHeight: 1.4 }}>
            Create today's daily task to unlock all sections
          </Typography>
        </Box>
      )}

      {/* Menu */}
      <List sx={{ py: 1 }}>
        {menuItems.map((item) => {
          const isEnabled = item.alwaysEnabled || hasTaskToday;
          const active    = isActive(item.route);

          return (
            <Tooltip
              key={item.text}
              title={
                !isEnabled
                  ? 'Create today\'s daily task to unlock'
                  : !sidebarOpen
                  ? item.text
                  : ''
              }
              placement="right"
            >
              <ListItem
                button
                disabled={!isEnabled}
                 onClick={() => {
                  if (isEnabled) {
                    if (item.isAction && item.route === 'chat') {
                      setChatOpen(true);
                    } else {
                      navigate(item.route);
                    }
                  }
                }}
                sx={{
                  my: 0.5,
                  mx: 1,
                  borderRadius: 2,
                  transition: 'all 0.3s ease',
                  cursor: isEnabled ? 'pointer' : 'not-allowed',
                  backgroundColor: active ? 'rgba(255,215,0,0.15)' : 'transparent',
                  boxShadow: active ? '0 0 12px rgba(255,215,0,0.5)' : 'none',
                  opacity: isEnabled ? 1 : 0.4,
                  '&:hover': isEnabled ? {
                    backgroundColor: 'rgba(255,215,0,0.25)',
                    transform: 'translateX(5px)',
                    boxShadow: '0 0 12px rgba(255,215,0,0.5)',
                  } : {},
                  '&.Mui-disabled': {
                    opacity: 0.4,
                    pointerEvents: 'auto', // keep pointer so tooltip shows
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? '#FFD700' : isEnabled ? '#fff' : '#888',
                    minWidth: 40,
                    transition: 'all 0.3s ease',
                    filter: active ? 'drop-shadow(0 0 2px #FFD700)' : 'none',
                  }}
                >
                  {!isEnabled ? (
                    <LockOutlined sx={{ fontSize: 18, color: '#888' }} />
                  ) : item.text === 'Live Chat' ? (
                    <Badge badgeContent={unreadCount} color="error" overlap="circular">
                      {item.icon}
                    </Badge>
                  ) : (
                    item.icon
                  )}
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
                        color: isEnabled ? '#fff' : '#888',
                      },
                    }}
                  />
                )}
              </ListItem>
            </Tooltip>
          );
        })}
      </List>
      <HrChatBox open={chatOpen} handleClose={() => setChatOpen(false)} senderId={currentUserId} />
    </Drawer>
  );
};

export default Sidebar;
