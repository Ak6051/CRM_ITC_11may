// import React, { useEffect, useState } from 'react';
// import { API_BASE_URL } from '../../config/api.config';
// import {
//   Drawer,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Box,
//   Typography,

// } from '@mui/material';
// import HomeIcon from '@mui/icons-material/Home';
// import SettingsIcon from '@mui/icons-material/Settings';
// import BusinessIcon from '@mui/icons-material/Business';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import Collapse from '@mui/material/Collapse';
// import PeopleIcon from '@mui/icons-material/People';
// import AssessmentIcon from '@mui/icons-material/Assessment';
// import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
// import WorkIcon from '@mui/icons-material/Work';
// import TaskIcon from '@mui/icons-material/Task';
// import AssignmentTurnedInIcon from '@mui/icons-material/AssignmentTurnedIn';
// import GroupsIcon from '@mui/icons-material/Groups';
// import EventNoteIcon from '@mui/icons-material/EventNote';
// import AddBoxIcon from '@mui/icons-material/AddBox';

// const Sidebar = () => {
//   const navigate = useNavigate();
//   const [departmentOpen, setDepartmentOpen] = useState(false);
//   const [settings, setSettings] = useState({ logoUrl: '', companyName: '' });
// const [hrDropdownOpen, setHrDropdownOpen] = useState(false);
// const [hrList, setHrList] = useState([]);
// const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);
// const [salesList, setSalesList] = useState([]);

//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const response = await axios.get(`${API_BASE_URL}/settings`);
//         if (response.data) {
//           setSettings({
//             logoUrl: response.data.logoUrl || '',
//             companyName: response.data.companyName || '',
//           });
//         }
//       } catch (error) {
//         console.error(error);
//       }
//     };

//     fetchSettings();
//   }, []);

//   useEffect(() => {
//     const fetchHRs = async () => {
//       const token = sessionStorage.getItem('token');
//       const res = await axios.get(`${API_BASE_URL}/panel/hr-users`, {
//         headers: { Authorization: `Bearer ${token}` }
//       });
//       setHrList(res.data);
//     };

//     fetchHRs();
//   }, []);

//   useEffect(() => {
//     const fetchSales = async () => {
//       const token = sessionStorage.getItem('token');
//       try {
//         const res = await axios.get(`${API_BASE_URL}/panel/sales-users`, {
//           headers: { Authorization: `Bearer ${token}` }
//         });
//         setSalesList(res.data);
//       } catch (error) {
//         console.error(error);
//       }
//     };
//     fetchSales();
//   }, []);

//   const handleHRClick = () => {
//   setHrDropdownOpen(!hrDropdownOpen);
// };

// const handleSalesClick = () => {
//   setSalesDropdownOpen(!salesDropdownOpen);
// };


//   const handleDepartmentClick = () => {
//     setDepartmentOpen(!departmentOpen);
//   };

//   return (
//     <Drawer
//       variant="permanent"
//       sx={{
//         width: 240,
//         flexShrink: 0,
//         '& .MuiDrawer-paper': {
//           width: 240,
//           boxSizing: 'border-box',
//           backgroundColor: '#1e1e2f', // Sidebar background color
//           color: '#ffffff', // White text color
//            border:'5px solid DodgerBlue'
//         },
//       }}
//     >
//       {/* Company Logo and Name */}
//       <Box
//         sx={{
//           display: 'flex',
//           flexDirection: 'column',
//           alignItems: 'center',
//           p: 2,
//           borderBottom: '1px solid #333', // Divider line
//         }}
//       >
//         <img
//           src={settings.logoUrl || 'headerlogo.svg'}
//           alt="Company Logo"
//           style={{ width: '180px', height: '80px', marginBottom: '8px' }}
//         />
//         <Typography
//           variant="h6"
//           sx={{
//             fontWeight: 'bold',
//             color: '#ffcc00', // Highlight color for company name
//             fontFamily:"Lora"
//           }}
//         >
//           {settings.companyName || 'Ideal Talent Connect'}
//         </Typography>
//       </Box>

//        <List>


//         {/* Dashboard Link */}
//         <ListItem
//           button
//           onClick={() => navigate('/job-report')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333', // Hover effect
//               color: '#ffcc00', // Highlight text color
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff', // Default icon color
//               '&:hover': { color: '#ffcc00' }, // Icon hover effect
//             }}
//           >
//             <HomeIcon />
//           </ListItemIcon>
//           <ListItemText primary="Dashboard" />
//         </ListItem>

//         {/* Settings Link */}
//         <ListItem
//           button
//           onClick={() => navigate('/admin-settings')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <SettingsIcon />
//           </ListItemIcon>
//           <ListItemText primary="Settings" />
//         </ListItem>

//          <ListItem
//           button
//           onClick={() => navigate('/hr-report')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <WorkIcon />
//           </ListItemIcon>
//           <ListItemText primary="Placement Report" />
//         </ListItem>


//           <ListItem
//           button
//           onClick={() => navigate('/can-rep')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <GroupsIcon />
//           </ListItemIcon>
//           <ListItemText primary="All Candidates Details" />
//         </ListItem>

//         <ListItem
//           button
//           onClick={() => navigate('/candidate-form')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <AddBoxIcon />
//           </ListItemIcon>
//           <ListItemText primary="Candidates Form" />
//         </ListItem>

//         <ListItem
//           button
//           onClick={() => navigate('/admin-candidate-details')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <GroupsIcon />
//           </ListItemIcon>
//           <ListItemText primary="Admin Candidates Details" />
//         </ListItem>

//          <ListItem
//           button
//           onClick={() => navigate('/interview-repo')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <EventNoteIcon />
//           </ListItemIcon>
//           <ListItemText primary="Interview Details" />
//         </ListItem>

//         <ListItem
//           button
//           onClick={() => navigate('/assigned-tasks')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <AssignmentIndIcon />
//           </ListItemIcon>
//           <ListItemText primary="Assigned Tasks" />
//         </ListItem>

//         <ListItem
//           button
//           onClick={() => navigate('/hr-assigned-tasks')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <AssignmentTurnedInIcon />
//           </ListItemIcon>
//           <ListItemText primary="HR Assigned Tasks" />
//         </ListItem>

//         <ListItem
//           button
//           onClick={() => navigate('/daily-task-report')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <AssessmentIcon />
//           </ListItemIcon>
//           <ListItemText primary="Daily Task Report" />
//         </ListItem>
//         <ListItem
//           button
//           onClick={() => navigate('/master-sheet')}
//           sx={{
//             '&:hover': {
//               backgroundColor: '#333',
//               color: '#ffcc00',
//             },
//           }}
//         >
//           <ListItemIcon
//             sx={{
//               color: '#ffffff',
//               '&:hover': { color: '#ffcc00' },
//             }}
//           >
//             <AssessmentIcon />
//           </ListItemIcon>
//           <ListItemText primary="Master Sheet" />
//         </ListItem>


// <ListItem
//   button
//   onClick={handleHRClick}
//   sx={{
//     '&:hover': {
//       backgroundColor: '#333',
//       color: '#ffcc00',
//     },
//   }}
// >
//   <ListItemIcon sx={{ color: '#ffffff', '&:hover': { color: '#ffcc00' } }}>
//     <PeopleIcon />
//   </ListItemIcon>
//   <ListItemText primary="All HR's" />
//   {hrDropdownOpen ? <ExpandLess /> : <ExpandMore />}
// </ListItem>

// <Collapse in={hrDropdownOpen} timeout="auto" unmountOnExit>
//   <List component="div" disablePadding>
//     {hrList.map((hr) => (
//       <ListItem
//         key={hr._id}
//         button
//         sx={{ pl: 4, '&:hover': { backgroundColor: '#333', color: '#ffcc00' } }}
//         onClick={() => navigate(`/hr/${hr._id}`)} // 👈 Route to HR details
//       >
//         <ListItemText primary={hr.firstName + ' ' + hr.lastName} />
//       </ListItem>
//     ))}
//   </List>
// </Collapse>

//   {/* Sales Dropdown */}
//   <ListItem button onClick={handleSalesClick} sx={{'&:hover':{backgroundColor:'#333',color:'#ffcc00'}}}>
//           <ListItemIcon sx={{color:'#ffffff','&:hover':{color:'#ffcc00'}}}><BusinessIcon /></ListItemIcon>
//           <ListItemText primary="Sales" />
//           {salesDropdownOpen ? <ExpandLess /> : <ExpandMore />}
//         </ListItem>
//         <Collapse in={salesDropdownOpen} timeout="auto" unmountOnExit>
//   <List component="div" disablePadding>
//     {salesList && salesList.length > 0 ? salesList.map((sales) => {
//       // Get the ID from possible locations
//       const salesId = sales._id?.$oid || sales._id || sales.id;
//       const salesName = sales.name || `${sales.firstName || ''} ${sales.lastName || ''}`.trim() || 'unnamed';

//       if (!salesId) {
//         console.error('Invalid sales user data - missing ID:', sales);
//         return null; // Skip rendering if no ID
//       }

//       return (
//         <ListItem
//           key={salesId}
//           button
//           sx={{ pl: 4, '&:hover': { backgroundColor: '#333', color: '#ffcc00' } }}
//           onClick={() => {
//             const nameSlug = salesName.toLowerCase().replace(/\s+/g, '-');
//             navigate(`/sales/${salesId}/${nameSlug}`);
//           }}
//         >
//           <ListItemText primary={salesName} />
//         </ListItem>
//       );
//     }) : (
//       <ListItem sx={{ pl: 4 }}>
//         <ListItemText primary="No Sales found" />
//       </ListItem>
//     )}
//   </List>
// </Collapse>



//       </List>

//     </Drawer>
//   );
// };

// export default Sidebar;



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
  ExpandLess,
  ExpandMore,
  Menu,
  ChevronLeft,
  SecurityOutlined,
  ListAltOutlined,
  AccountBalanceOutlined,
  TrendingUpOutlined,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const drawerWidth = 260;
const collapsedWidth = 70;

const Sidebar = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [hrDropdownOpen, setHrDropdownOpen] = useState(false);
  const [salesDropdownOpen, setSalesDropdownOpen] = useState(false);
  const [settings, setSettings] = useState({ logoUrl: '', companyName: '' });
  const [hrList, setHrList] = useState([]);
  const [salesList, setSalesList] = useState([]);

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
        const res = await axios.get(`${API_BASE_URL}/panel/hr-users`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHrList(res.data);
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
    { text: 'Master Dashboard', icon: <AssessmentOutlined />, route: '/master-dashboard' },
    { text: 'Company Management', icon: <BusinessCenterOutlined />, route: '/company-management' },
    { text: 'Job Openings', icon: <HomeOutlined />, route: '/job-report' },
    { text: 'Daily Task Report', icon: <AssessmentOutlined />, route: '/daily-task-report' },
    { text: 'Sales Daily Task Report', icon: <AssignmentIndOutlined />, route: '/sales-daily-task-report' },
    { text: 'All Candidates Details', icon: <GroupsOutlined />, route: '/can-rep' },
    { text: 'HR Analytics', icon: <TrendingUpOutlined />, route: '/hr-analytics' },
    { text: 'Placement Report', icon: <WorkOutline />, route: '/hr-report' },
    { text: 'User Management', icon: <PeopleOutline />, route: '/user-management' },
    { text: 'TL Permissions', icon: <SettingsOutlined />, route: '/admin-settings' },
    { text: 'Master Sheet', icon: <AssessmentOutlined />, route: '/master-sheet' },
    { text: 'Audit Dashboard', icon: <ListAltOutlined />, route: '/audit-dashboard' },
    { text: 'IP Whitelist', icon: <SecurityOutlined />, route: '/ip-whitelist' },
    { text: 'Account Department', icon: <AccountBalanceOutlined />, route: '/account-department' },
  ];

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
      {/* Logo Section at the Top */}
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          py: 1,
          px: 2,
          mb: 0.5,
          width: '100%',
        }}
      >
        <img
          src={settings.logoUrl || 'headerlogo.svg'}
          alt="Logo"
          style={{ 
            width: '130px', 
            height: 'auto', 
            maxHeight: '70px',
            objectFit: 'contain',
            marginBottom: 4 
          }}
        />
        <Typography
          variant="h6"
          sx={{ 
            fontWeight: 700, 
            color: '#EEB33B', 
            fontFamily: '"Poppins", sans-serif', 
            textAlign: 'center', 
            fontSize: '0.9rem', 
            letterSpacing: '0.5px',
            lineHeight: 1.2
          }}
        >
          {settings.companyName || 'Ideal Talent Connect'}
        </Typography>
      </Box>

      {/* Menu */}
      <List sx={{ py: 1 }}>
        {menuItems.map((item) => (
          <Tooltip key={item.text} title={!sidebarOpen ? item.text : ''} placement="right">
            <ListItem
              button
              onClick={() => navigate(item.route)}
              sx={{
                my: 0.1,
                py: 0.4,
                borderRadius: 2,
                transition: 'all 0.3s ease',
                backgroundColor: isActive(item.route) ? 'rgba(238,179,59,0.15)' : 'transparent',
                boxShadow: isActive(item.route) ? '0 0 12px rgba(238,179,59,0.5)' : 'none',
                '&:hover': {
                  backgroundColor: 'rgba(238,179,59,0.25)',
                  transform: 'translateX(5px)',
                  boxShadow: '0 0 12px rgba(238,179,59,0.5)',
                },
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.route) ? '#EEB33B' : '#fff',
                  minWidth: 36,
                  transition: 'all 0.3s ease',
                  filter: isActive(item.route) ? 'drop-shadow(0 0 2px #EEB33B)' : 'none',
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

        {/* HR Dropdown */}
        <ListItem
          button
          onClick={handleHRClick}
          sx={{
            my: 0.1,
            py: 0.4,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255,215,0,0.25)',
              boxShadow: '0 0 12px rgba(255,215,0,0.5)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
            <PeopleOutline />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="All HR's" />}
          {sidebarOpen && (hrDropdownOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
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
                    backgroundColor: 'rgba(238,179,59,0.25)',
                    boxShadow: '0 0 12px rgba(238,179,59,0.5)',
                  },
                }}
                onClick={() => navigate(`/hr/${hr._id}`)}
              >
                <ListItemText primary={`${hr.firstName} ${hr.lastName}`}
                  sx={{
                    '& .MuiTypography-root': {
                      fontWeight: 500,
                      fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                      fontSize: '0.85rem',
                    },
                  }}
                />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Sales Dropdown */}
        <ListItem
          button
          onClick={handleSalesClick}
          sx={{
            my: 0.1,
            py: 0.4,
            borderRadius: 2,
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: 'rgba(255,215,0,0.25)',
              boxShadow: '0 0 12px rgba(255,215,0,0.5)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#fff', minWidth: 36 }}>
            <BusinessCenterOutlined />
          </ListItemIcon>
          {sidebarOpen && <ListItemText primary="Sales" />}
          {sidebarOpen && (salesDropdownOpen ? <ExpandLess /> : <ExpandMore />)}
        </ListItem>
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
                      navigate(`/sales/${salesId}/${nameSlug}`);
                    }}
                  >
                    <ListItemText primary={salesName}
                      sx={{
                        '& .MuiTypography-root': {
                          fontWeight: 500,
                          fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
                          fontSize: '0.85rem',
                        },
                      }}
                    />
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
      </List>
    </Drawer>
  );
};

export default Sidebar;
