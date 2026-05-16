import React, { useEffect, useState } from 'react';
import { API_BASE_URL } from '../../config/api.config';
import {
  Drawer,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Box,
  Typography,
  Collapse,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  HomeOutlined,
  SettingsOutlined,
  BusinessCenterOutlined,
  PeopleOutline,
  AssessmentOutlined,
  AssignmentIndOutlined,
  WorkOutline,
  GroupsOutlined,
  EventNoteOutlined,
  AddBoxOutlined,
  ExpandLess,
  ExpandMore,
  Menu,
  ChevronLeft,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 260;
const collapsedWidth = 70;

const TeamLeaderSidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hrDropdownOpen, setHrDropdownOpen] = useState(false);
  const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);
  const [settings, setSettings] = useState({ logoUrl: '', companyName: '' });
  const [hrList, setHrList] = useState([]);
  const [salesList, setSalesList] = useState([]);
  const [permissions, setPermissions] = useState(null); // null = loading, [] = no permissions set

  // Fetch TL permissions
  useEffect(() => {
    const fetchPermissions = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/tl/my-permissions`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setPermissions(res.data.permissions || []);
      } catch (err) {
        console.error('Error fetching permissions:', err);
        setPermissions([]); // on error, show all
      }
    };
    fetchPermissions();
  }, []);

  // If permissions is null (still loading) or empty (none blocked), show all items
  // permissions = blocked pages (checked = hidden from TL)
  const can = (key) => !permissions || !permissions.includes(key);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get(`${API_BASE_URL}/settings`);
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
      try {
        // Fetch only HRs assigned to this TL by admin
        const res = await axios.get(`${API_BASE_URL}/tl/my-assigned-hrs`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHrList(res.data.assignedHRs || []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchHRs();
  }, []);

  useEffect(() => {
    const fetchSales = async () => {
      const token = sessionStorage.getItem('token');
      try {
        const res = await axios.get(`${API_BASE_URL}/panel/sales-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSalesList(res.data);
      } catch (error) {
        console.error(error);
      }
    };
    fetchSales();
  }, []);

  const toggleSidebar = () => setSidebarOpen(!sidebarOpen);
  const handleHRClick = () => setHrDropdownOpen(!hrDropdownOpen);
  const handleSalesClick = () => setSalesDropdownOpen(!salesDropdownOpen);

  const menuItems = [
    { 
      title: 'OVERVIEW',
      items: [
        { text: 'Master Dashboard', icon: <HomeOutlined />, route: '/tl-dashboard', permKey: 'tl-dashboard' },
      ]
    },
    {
      title: 'TEAM CENTER',
      items: [
        { text: 'Team Performance', icon: <WorkOutline />, route: '/tl-hr-report', permKey: 'tl-hr-report' },
        { text: 'HR Daily Tasks', icon: <AssessmentOutlined />, route: '/tl-daily-task-report', permKey: 'tl-daily-task-report' },
        { text: 'Sales Daily Tasks', icon: <AssignmentIndOutlined />, route: '/tl-sales-daily-task-report', permKey: 'tl-sales-daily-task-report' },
      ]
    },
    {
      title: 'JOB HUB',
      items: [
        { text: 'Job Report', icon: <BusinessCenterOutlined />, route: '/tl-job-report', permKey: 'tl-job-report' },
      ]
    },
    {
      title: 'TALENT POOL',
      items: [
        { text: 'All Candidates', icon: <GroupsOutlined />, route: '/tl-can-rep', permKey: 'tl-can-rep' },
        { text: 'Candidate Details', icon: <PeopleOutline />, route: '/tl-candidate-details', permKey: 'tl-candidate-details' },
        { text: 'Interview Repo', icon: <EventNoteOutlined />, route: '/tl-interview-repo', permKey: 'tl-interview-repo' },
      ]
    },
    {
      title: 'UTILITIES',
      items: [
        { text: 'Candidate Form', icon: <AddBoxOutlined />, route: '/tl-candidate-form', permKey: 'tl-candidate-form' },
        { text: 'Master Sheet', icon: <AssessmentOutlined />, route: '/tl-master-sheet', permKey: 'tl-master-sheet' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { text: 'Settings', icon: <SettingsOutlined />, route: '/tl-settings', permKey: 'tl-settings' },
      ]
    }
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
          background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
          color: '#fff',
          borderRight: '1px solid rgba(255, 255, 255, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          overflowX: 'hidden',
          '&::-webkit-scrollbar': { width: '4px' },
          '&::-webkit-scrollbar-thumb': { background: 'rgba(255,255,255,0.1)', borderRadius: '10px' },
        },
      }}
    >
      {/* Toggle Button */}
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center', px: 2, py: 2.5 }}>
        {sidebarOpen && (
          <Typography variant="subtitle1" sx={{ fontWeight: 800, color: '#f6b93b', letterSpacing: '1px', fontSize: '0.9rem' }}>
            TL PANEL
          </Typography>
        )}
        <IconButton onClick={toggleSidebar} sx={{ color: 'rgba(255,255,255,0.7)', bgcolor: 'rgba(255,255,255,0.05)', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
          {sidebarOpen ? <ChevronLeft fontSize="small" /> : <Menu fontSize="small" />}
        </IconButton>
      </Box>

      {/* Logo & Info */}
      {sidebarOpen && (
        <Box sx={{ px: 2, mb: 3 }}>
          <Box sx={{ 
            p: 2, 
            borderRadius: '16px', 
            background: 'rgba(255, 255, 255, 0.03)',
            border: '1px solid rgba(255, 255, 255, 0.05)',
            textAlign: 'center'
          }}>
            <img src={settings.logoUrl || 'headerlogo.svg'} alt="Logo" style={{ width: '120px', height: 'auto', marginBottom: 12 }} />
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#f6b93b', lineHeight: 1.2 }}>
              {settings.companyName || 'Ideal Talent Connect'}
            </Typography>
          </Box>
        </Box>
      )}

      {/* Navigation */}
      <Box sx={{ px: 1.5, pb: 4 }}>
        {menuItems.map((section, idx) => (
          <Box key={idx} sx={{ mb: 2 }}>
            {sidebarOpen && (
              <Typography variant="caption" sx={{ px: 2, mb: 1, display: 'block', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '1.5px', fontSize: '0.65rem' }}>
                {section.title}
              </Typography>
            )}
            <List disablePadding>
              {section.items.filter(item => can(item.permKey)).map((item) => (
                <Tooltip key={item.text} title={!sidebarOpen ? item.text : ''} placement="right">
                  <ListItem
                    button
                    onClick={() => navigate(item.route)}
                    sx={{
                      my: 0.3,
                      borderRadius: '12px',
                      py: 1,
                      px: 2,
                      transition: 'all 0.2s ease',
                      backgroundColor: isActive(item.route) ? 'rgba(246, 185, 59, 0.12)' : 'transparent',
                      '&:hover': {
                        backgroundColor: 'rgba(255, 255, 255, 0.05)',
                        '& .MuiListItemIcon-root': { color: '#f6b93b' },
                      },
                    }}
                  >
                    <ListItemIcon sx={{ 
                      color: isActive(item.route) ? '#f6b93b' : 'rgba(255,255,255,0.6)', 
                      minWidth: 36,
                      transition: 'color 0.2s ease'
                    }}>
                      {item.icon}
                    </ListItemIcon>
                    {sidebarOpen && (
                      <ListItemText
                        primary={item.text}
                        primaryTypographyProps={{ 
                          fontSize: '0.85rem', 
                          fontWeight: isActive(item.route) ? 700 : 500,
                          color: isActive(item.route) ? '#f6b93b' : 'rgba(255,255,255,0.8)'
                        }}
                      />
                    )}
                  </ListItem>
                </Tooltip>
              ))}
            </List>
          </Box>
        ))}

        {/* Dynamic HR List */}
        {can('tl-hr-dropdown') && (
          <Box sx={{ mt: 1 }}>
            {sidebarOpen && (
              <Typography variant="caption" sx={{ px: 2, mb: 1, display: 'block', color: 'rgba(255,255,255,0.4)', fontWeight: 700, letterSpacing: '1.5px', fontSize: '0.65rem' }}>
                TEAM MEMBERS
              </Typography>
            )}
            <ListItem button onClick={handleHRClick} sx={{ borderRadius: '12px', py: 1, px: 2, '&:hover': { bgcolor: 'rgba(255,255,255,0.05)' } }}>
              <ListItemIcon sx={{ color: 'rgba(255,255,255,0.6)', minWidth: 36 }}><PeopleOutline /></ListItemIcon>
              {sidebarOpen && <ListItemText primary="HR Team" primaryTypographyProps={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)' }} />}
              {sidebarOpen && (hrDropdownOpen ? <ExpandLess sx={{ color: 'rgba(255,255,255,0.4)' }} /> : <ExpandMore sx={{ color: 'rgba(255,255,255,0.4)' }} />)}
            </ListItem>
            <Collapse in={hrDropdownOpen} timeout="auto" unmountOnExit>
              <List component="div" disablePadding>
                {hrList.map((hr) => (
                  <ListItem
                    key={hr._id}
                    button
                    sx={{ pl: 6.5, py: 0.6, borderRadius: '8px', '&:hover': { bgcolor: 'rgba(255,255,255,0.03)', color: '#f6b93b' } }}
                    onClick={() => navigate(`/tl-hr/${hr._id}`)}
                  >
                    <ListItemText 
                      primary={`${hr.firstName} ${hr.lastName}`} 
                      primaryTypographyProps={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)' }}
                    />
                  </ListItem>
                ))}
              </List>
            </Collapse>
          </Box>
        )}
      </Box>
    </Drawer>
  );
};

export default TeamLeaderSidebar;
