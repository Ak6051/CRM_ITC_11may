// import React, { useState } from 'react';
// import { Drawer, List, ListItem, ListItemText, ListItemIcon, Collapse , Box , Typography } from '@mui/material';
// import HomeIcon from '@mui/icons-material/Home';
// import SettingsIcon from '@mui/icons-material/Settings';
// import ApartmentIcon from '@mui/icons-material/Apartment';
// import BusinessIcon from '@mui/icons-material/Business';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import { useNavigate } from 'react-router-dom';

// const Sidebar = () => {
//   const navigate = useNavigate();
//   const [departmentOpen, setDepartmentOpen] = useState(false);

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
//         },
//       }}
//     >

// <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
//         <img src="mascot.png" alt="Company Logo" style={{ width: '180px', height: '80px', marginBottom: '8px' }} />
//         <Typography variant="h6">SA TECH</Typography>
//       </Box>

//       <List>
//         {/* Dashboard Link */}
//         <ListItem button onClick={() => navigate('/admin-dashboard')}>
//           <ListItemIcon>
//             <HomeIcon />
//           </ListItemIcon>
//           <ListItemText primary="Dashboard" />
//         </ListItem>

//         {/* Settings Link */}
//         <ListItem button onClick={() => navigate('/admin-settings')}>
//           <ListItemIcon>
//             <SettingsIcon />
//           </ListItemIcon>
//           <ListItemText primary="Settings" />
//         </ListItem>

//         {/* Department with Dropdown */}
//         <ListItem button onClick={handleDepartmentClick}>
//           <ListItemIcon>
//             <ApartmentIcon />
//           </ListItemIcon>
//           <ListItemText primary="Department" />
//           {departmentOpen ? <ExpandLess /> : <ExpandMore />}
//         </ListItem>
//         <Collapse in={departmentOpen} timeout="auto" unmountOnExit>
//           <List component="div" disablePadding>
//             <ListItem button sx={{ pl: 4 }} onClick={() => navigate('/sales-report')}>
//               <ListItemIcon>
//                 <BusinessIcon />
//               </ListItemIcon>
//               <ListItemText primary="Sales Report" />
//             </ListItem>
//           </List>
//         </Collapse>
//       </List>
//     </Drawer>
//   );
// };

// export default Sidebar;
// import React, { useEffect, useState } from 'react';
// import {
//   Drawer,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   Collapse,
//   Box,
//   Typography,
// } from '@mui/material';
// import HomeIcon from '@mui/icons-material/Home';
// import SettingsIcon from '@mui/icons-material/Settings';
// import ApartmentIcon from '@mui/icons-material/Apartment';
// import BusinessIcon from '@mui/icons-material/Business';
// import ExpandLess from '@mui/icons-material/ExpandLess';
// import ExpandMore from '@mui/icons-material/ExpandMore';
// import { useNavigate } from 'react-router-dom';
// import axios from 'axios';

// const Sidebar = () => {
//   const navigate = useNavigate();
//   const [departmentOpen, setDepartmentOpen] = useState(false);
//   const [settings, setSettings] = useState({ logoUrl: '', companyName: '' });

//   useEffect(() => {
//     const fetchSettings = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/settings');
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
//         }}
//       >
//         <img
//           src={settings.logoUrl || 'mascot.png'}
//           alt="Company Logo"
//           style={{ width: '180px', height: '80px', marginBottom: '8px' }}
//         />
//         <Typography variant="h6">
//           {settings.companyName || 'Company Name'}
//         </Typography>
//       </Box>

//       <List>
//         {/* Dashboard Link */}
//         <ListItem button onClick={() => navigate('/admin-dashboard')}>
//           <ListItemIcon>
//             <HomeIcon />
//           </ListItemIcon>
//           <ListItemText primary="Dashboard" />
//         </ListItem>

//         {/* Settings Link */}
//         <ListItem button onClick={() => navigate('/admin-settings')}>
//           <ListItemIcon>
//             <SettingsIcon />
//           </ListItemIcon>
//           <ListItemText primary="Settings" />
//         </ListItem>

//         {/* Department with Dropdown */}
//         <ListItem button onClick={handleDepartmentClick}>
//           <ListItemIcon>
//             <ApartmentIcon />
//           </ListItemIcon>
//           <ListItemText primary="Department" />
//           {departmentOpen ? <ExpandLess /> : <ExpandMore />}
//         </ListItem>
//         <Collapse in={departmentOpen} timeout="auto" unmountOnExit>
//           <List component="div" disablePadding>
//             <ListItem
//               button
//               sx={{ pl: 4 }}
//               onClick={() => navigate('/sales-report')}
//             >
//               <ListItemIcon>
//                 <BusinessIcon />
//               </ListItemIcon>
//               <ListItemText primary="Sales Report" />
//             </ListItem>
//             <ListItem
//               button
//               sx={{ pl: 4 }}
//               onClick={() => navigate('/em-report')}
//             >
//               <ListItemIcon>
//                 <BusinessIcon />
//               </ListItemIcon>
//               <ListItemText primary="Employee Report" />
//             </ListItem>
//             <ListItem
//               button
//               sx={{ pl: 4 }}
//               onClick={() => navigate('/job-report')}
//             >
//               <ListItemIcon>
//                 <BusinessIcon />
//               </ListItemIcon>
//               <ListItemText primary="Job Openning Report" />
//             </ListItem>
//           </List>
//         </Collapse>
//       </List>
//     </Drawer>
//   );
// };

// export default Sidebar;
import React, { useEffect, useState } from 'react';
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
import axios from 'axios';

const Sidebar = () => {
  const navigate = useNavigate();
  const [departmentOpen, setDepartmentOpen] = useState(false);
  const [settings, setSettings] = useState({ logoUrl: '', companyName: '' });

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
          src={settings.logoUrl || 'mascot.png'}
          alt="Company Logo"
          style={{ width: '180px', height: '80px', marginBottom: '8px' }}
        />
        <Typography
          variant="h6"
          sx={{
            fontWeight: 'bold',
            color: '#ffcc00', // Highlight color for company name
          }}
        >
          {settings.companyName || 'Company Name'}
        </Typography>
      </Box>

      <List>
        {/* Dashboard Link */}
        <ListItem
          button
          onClick={() => navigate('/admin-dashboard')}
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
          <ListItemIcon
            sx={{
              color: '#ffffff',
              '&:hover': { color: '#ffcc00' },
            }}
          >
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
              onClick={() => navigate('/sales-report')}
            >
              <ListItemIcon
                sx={{
                  color: '#ffffff',
                  '&:hover': { color: '#ffcc00' },
                }}
              >
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Sales Report" />
            </ListItem>
            <ListItem
              button
              sx={{
                pl: 4,
                '&:hover': {
                  backgroundColor: '#333',
                  color: '#ffcc00',
                },
              }}
              onClick={() => navigate('/em-report')}
            >
              <ListItemIcon
                sx={{
                  color: '#ffffff',
                  '&:hover': { color: '#ffcc00' },
                }}
              >
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Employee Report" />
            </ListItem>
            <ListItem
              button
              sx={{
                pl: 4,
                '&:hover': {
                  backgroundColor: '#333',
                  color: '#ffcc00',
                },
              }}
              onClick={() => navigate('/job-report')}
            >
              <ListItemIcon
                sx={{
                  color: '#ffffff',
                  '&:hover': { color: '#ffcc00' },
                }}
              >
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Job Openning Report" />
            </ListItem>
            <ListItem
              button
              sx={{
                pl: 4,
                '&:hover': {
                  backgroundColor: '#333',
                  color: '#ffcc00',
                },
              }}
              onClick={() => navigate('/closedsale')}
            >
              <ListItemIcon
                sx={{
                  color: '#ffffff',
                  '&:hover': { color: '#ffcc00' },
                }}
              >
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Closed sale Report" />
            </ListItem>
          </List>
        </Collapse>
      </List>
    </Drawer>
  );
};

export default Sidebar;
