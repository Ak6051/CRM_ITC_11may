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
    { text: 'Dashboard', icon: <HomeOutlined />, route: '/tl-job-report',            permKey: 'tl-job-report' },
    { text: 'Settings', icon: <SettingsOutlined />, route: '/tl-settings',           permKey: 'tl-settings' },
    { text: 'Placement Report', icon: <WorkOutline />, route: '/tl-hr-report',       permKey: 'tl-hr-report' },
    { text: 'All Candidates Details', icon: <GroupsOutlined />, route: '/tl-can-rep', permKey: 'tl-can-rep' },
    { text: 'Candidates Form', icon: <AddBoxOutlined />, route: '/tl-candidate-form', permKey: 'tl-candidate-form' },
    { text: 'TL Candidates Details', icon: <GroupsOutlined />, route: '/tl-candidate-details', permKey: 'tl-candidate-details' },
    { text: 'Interview Details', icon: <EventNoteOutlined />, route: '/tl-interview-repo', permKey: 'tl-interview-repo' },
    { text: 'Daily Task Report', icon: <AssessmentOutlined />, route: '/tl-daily-task-report', permKey: 'tl-daily-task-report' },
    { text: 'Sales Daily Task Report', icon: <AssignmentIndOutlined />, route: '/tl-sales-daily-task-report', permKey: 'tl-sales-daily-task-report' },
    { text: 'Master Sheet', icon: <AssessmentOutlined />, route: '/tl-master-sheet', permKey: 'tl-master-sheet' },
  ].filter(item => can(item.permKey));

  const isActive = (route) => location.pathname.startsWith(route);

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
            sx={{ fontWeight: 700, color: '#f6b93b', fontFamily: 'Lora', textAlign: 'center' }}
          >
            {settings.companyName || 'Ideal Talent Connect'}
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
                    '& .MuiTypography-root': { fontWeight: 500, fontFamily: 'Roboto' },
                  }}
                />
              )}
            </ListItem>
          </Tooltip>
        ))}

        {/* HR Dropdown */}
        {can('tl-hr-dropdown') && (
        <ListItem
          button
          onClick={handleHRClick}
          sx={{
            my: 0.5,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255,215,0,0.25)',
              boxShadow: '0 0 12px rgba(255,215,0,0.5)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#fff' }}>
            <PeopleOutline />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="All HR's" />}
          {sidebarOpen && (hrDropdownOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        )}
        {can('tl-hr-dropdown') && (
        <Collapse in={hrDropdownOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {hrList.map((hr) => (
              <ListItem
                key={hr._id}
                button
                sx={{
                  pl: 5,
                  py: 0.5,
                  borderRadius: 1.5,
                  transition: 'all 0.3s ease',
                  '&:hover': {
                    backgroundColor: 'rgba(255,215,0,0.25)',
                    boxShadow: '0 0 12px rgba(255,215,0,0.5)',
                  },
                }}
                onClick={() => navigate(`/tl-hr/${hr._id}`)}
              >
                <ListItemText primary={`${hr.firstName} ${hr.lastName}`} />
              </ListItem>
            ))}
          </List>
        </Collapse>
        )}

        {/* Sales Dropdown */}
        {can('tl-sales-dropdown') && (
        <ListItem
          button
          onClick={handleSalesClick}
          sx={{
            my: 0.5,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255,215,0,0.25)',
              boxShadow: '0 0 12px rgba(255,215,0,0.5)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#fff' }}>
            <BusinessCenterOutlined />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="Sales" />}
          {sidebarOpen && (salesDropdownOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
        )}
        {can('tl-sales-dropdown') && (
        <Collapse in={salesDropdownOpen} timeout="auto" unmountOnExit>
          <List component="div" disablePadding>
            {salesList && salesList.length > 0 ? (
              salesList.map((sales) => {
                const salesId = sales._id?.$oid || sales._id || sales.id;
                const salesName = sales.name || `${sales.firstName || ''} ${sales.lastName || ''}`.trim() || 'Unnamed';
                if (!salesId) return null;
                return (
                  <ListItem
                    key={salesId}
                    button
                    sx={{
                      pl: 5,
                      py: 0.5,
                      borderRadius: 1.5,
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        backgroundColor: 'rgba(255,215,0,0.25)',
                        boxShadow: '0 0 12px rgba(255,215,0,0.5)',
                      },
                    }}
                    onClick={() => {
                      const nameSlug = salesName.toLowerCase().replace(/\s+/g, '-');
                      navigate(`/tl-sales/${salesId}/${nameSlug}`);
                    }}
                  >
                    <ListItemText primary={salesName} />
                  </ListItem>
                );
              })
            ) : (
              <ListItem sx={{ pl: 5 }}>
                <ListItemText primary="No Sales found" />
              </ListItem>
            )}
          </List>
        </Collapse>
        )}
      </List>
    </Drawer>
  );
};

export default TeamLeaderSidebar;
