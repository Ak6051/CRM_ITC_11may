// import React, { useState } from 'react';
// import { Drawer, List, ListItem, ListItemText, ListItemIcon, Collapse, Box, Typography } from '@mui/material';
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
//       {/* Company Logo and Name */}
//       <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 2 }}>
//         <img src="mascot.png" alt="Company Logo" style={{ width: '180px', height: '80px', marginBottom: '8px' }} />
//         <Typography variant="h6">SA TECH</Typography>
//       </Box>

//       <List>
//         {/* Dashboard Link */}
//         <ListItem button onClick={() => navigate('/user-dashboard')}>
//           <ListItemIcon>
//             <HomeIcon />
//           </ListItemIcon>
//           <ListItemText primary="Dashboard" />
//         </ListItem>

//         {/* Settings Link */}
//         <ListItem button onClick={() => navigate('/settings')}>
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
//             <ListItem button sx={{ pl: 4 }} onClick={() => navigate('/sales')}>
//               <ListItemIcon>
//                 <BusinessIcon />
//               </ListItemIcon>
//               <ListItemText primary="Sales" />
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
//   const [settings, setSettings] = useState({ logoUrl: '', companyName: '' }); // Default initialization

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
//           src={settings.logoUrl || 'mascot.png'} // Fallback to a default image if logoUrl is not set
//           alt="Company Logo"
//           style={{ width: '180px', height: '80px', marginBottom: '8px' }}
//         />
//         <Typography variant="h6">
//           {settings.companyName || 'SA TECH'}
//         </Typography>{' '}
//         {/* Fallback company name */}
//       </Box>

//       <List>
//         {/* Dashboard Link */}
//         <ListItem button onClick={() => navigate('/sales-dashboard')}>
//           <ListItemIcon>
//             <HomeIcon />
//           </ListItemIcon>
//           <ListItemText primary="Dashboard" />
//         </ListItem>

//         {/* Settings Link */}
//         <ListItem button onClick={() => navigate('/settings')}>
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
//             <ListItem button sx={{ pl: 4 }} onClick={() => navigate('/sales')}>
//               <ListItemIcon>
//                 <BusinessIcon />
//               </ListItemIcon>
//               <ListItemText primary="Sales" />
//             </ListItem>
//           </List>
//           <List component="div" disablePadding>
//             <ListItem button sx={{ pl: 4 }} onClick={() => navigate('/jobopennings')}>
//               <ListItemIcon>
//                 <BusinessIcon />
//               </ListItemIcon>
//               <ListItemText primary="Job Opennings" />
//             </ListItem>
//           </List>
//         </Collapse>
//       </List>
//     </Drawer>
//   );
// };

// export default Sidebar;

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
          src={'mascot.png'} // Replace with `settings.logoUrl` if dynamic logos are needed
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
          }}
        >
          SA TECH
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
              onClick={() => navigate('/sales')}
            >
              <ListItemIcon sx={{ color: 'inherit' }}>
                <BusinessIcon />
              </ListItemIcon>
              <ListItemText primary="Sales" />
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
