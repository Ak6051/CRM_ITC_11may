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
  AssignmentTurnedInOutlined,
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
    { text: 'Dashboard', icon: <HomeOutlined />, route: '/job-report' },
    { text: 'Settings', icon: <SettingsOutlined />, route: '/admin-settings' },
    { text: 'Placement Report', icon: <WorkOutline />, route: '/hr-report' },
    { text: 'All Candidates Details', icon: <GroupsOutlined />, route: '/can-rep' },
    { text: 'Candidates Form', icon: <AddBoxOutlined />, route: '/candidate-form' },
    { text: 'Admin Candidates Details', icon: <GroupsOutlined />, route: '/admin-candidate-details' },
    { text: 'Interview Details', icon: <EventNoteOutlined />, route: '/interview-repo' },
    { text: 'Assigned Tasks', icon: <AssignmentIndOutlined />, route: '/assigned-tasks' },
    { text: 'HR Assigned Tasks', icon: <AssignmentTurnedInOutlined />, route: '/hr-assigned-tasks' },
    { text: 'Daily Task Report', icon: <AssessmentOutlined />, route: '/daily-task-report' },
    { text: 'Master Sheet', icon: <AssessmentOutlined />, route: '/master-sheet' },
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
            sx={{ fontWeight: 700, color: '#FFD700', fontFamily: 'Lora', textAlign: 'center' }}
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
                onClick={() => navigate(`/hr/${hr._id}`)}
              >
                <ListItemText primary={`${hr.firstName} ${hr.lastName}`} />
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Sales Dropdown */}
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
      </List>
    </Drawer>
  );
};

export default Sidebar;
