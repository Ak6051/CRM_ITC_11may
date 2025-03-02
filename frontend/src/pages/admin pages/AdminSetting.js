// import React, { useState } from 'react';
// import { Typography, Container, Box, Button, TextField } from '@mui/material';
// import Navbar from '../../components/admin components/AdminNavbar';
// import Sidebar from '../../components/admin components/AdminSidebar';
// import axios from 'axios';

// const AdminSetting = () => {
//   const [logo, setLogo] = useState(null);
//   const [companyName, setCompanyName] = useState('');

//   const handleLogoUpload = (event) => {
//     const file = event.target.files[0];
//     if (file) {
//       const reader = new FileReader();
//       reader.onloadend = () => {
//         setLogo(reader.result); // Set logo as Base64 string for preview or upload
//       };
//       reader.readAsDataURL(file);
//     }
//   };

//   const handleSaveSettings = async () => {
//     const formData = new FormData();
//     if (logo) {
//       formData.append('logo', logo); // Append logo
//     }
//     formData.append('companyName', companyName); // Append company name

//     try {
//       await axios.post('http://localhost:5000/api/settings/logo', formData, {
//         headers: {
//           'Content-Type': 'multipart/form-data',
//         },
//       });
//       alert('Settings saved successfully!');
//     } catch (error) {
//       console.error('Error saving settings:', error);
//       alert('Error saving settings. Please try again.');
//     }
//   };

//   return (
//     <div style={{ display: 'flex' }}>
//       <Sidebar />
//       <Box sx={{ flexGrow: 1 }}>
//         <Navbar />
//         <Container maxWidth="md" sx={{ mt: 4 }}>
//           <Typography variant="h4">Settings</Typography>
//           <Typography variant="body1" sx={{ mt: 2 }}>
//             This is the Admin Settings page.
//           </Typography>

//           <Box sx={{ mt: 3 }}>
//             <Typography variant="h6">Upload Logo</Typography>
//             <input
//               accept="image/*"
//               type="file"
//               onChange={handleLogoUpload}
//               style={{ marginTop: '10px' }}
//             />
//             {logo && (
//               <img
//                 src={logo}
//                 alt="Logo Preview"
//                 style={{ width: '100px', height: '100px', marginTop: '10px' }}
//               />
//             )}

//             <Typography variant="h6" sx={{ mt: 2 }}>
//               Company Name
//             </Typography>
//             <TextField
//               fullWidth
//               variant="outlined"
//               value={companyName}
//               onChange={(e) => setCompanyName(e.target.value)}
//               placeholder="Enter company name"
//               sx={{ mt: 1 }}
//             />

//             <Button
//               variant="contained"
//               color="primary"
//               onClick={handleSaveSettings}
//               sx={{ mt: 2 }}
//             >
//               Save Settings
//             </Button>
//           </Box>
//         </Container>
//       </Box>
//     </div>
//   );
// };

// export default AdminSetting;
import React, { useState, useEffect } from 'react';
import { Typography, Container, Box, Button, TextField } from '@mui/material';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import axios from 'axios';

const AdminSetting = () => {
  const [logo, setLogo] = useState(null); // Logo preview (Base64)
  const [companyName, setCompanyName] = useState('');
  const [savedLogo, setSavedLogo] = useState(null); // For displaying saved logo

  // Fetch saved settings on component load
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/settings/logo');
        const { companyName, logoUrl } = response.data;
        setCompanyName(companyName || '');
        setSavedLogo(logoUrl || null);
      } catch (error) {
        console.error('Error fetching settings:', error);
      }
    };
    fetchSettings();
  }, []);

  const handleLogoUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setLogo(reader.result); // Set logo as Base64 string for preview or upload
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSaveSettings = async () => {
    const formData = new FormData();
    if (logo) {
      formData.append('logo', logo); // Append logo
    }
    formData.append('companyName', companyName); // Append company name

    try {
      const response = await axios.post('http://localhost:5000/api/settings/logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      alert('Settings saved successfully!');
      setSavedLogo(response.data.logoUrl); // Update saved logo with the response
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Error saving settings. Please try again.');
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh',marginLeft:'-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar is fixed */}
      <div style={{ position: 'fixed',marginLeft:'-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '250px',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Navbar is fixed at the top */}
        <Navbar />
        <Container maxWidth="md" sx={{ mt: 4 }}>
          <Typography variant="h4">Settings</Typography>
          <Typography variant="body1" sx={{ mt: 2 }}>
            This is the Admin Settings page.
          </Typography>

          <Box sx={{ mt: 3 }}>
            <Typography variant="h6">Upload Logo</Typography>
            <input
              accept="image/*"
              type="file"
              onChange={handleLogoUpload}
              style={{ marginTop: '10px' }}
            />
            {/* Preview uploaded logo */}
            {logo && (
              <img
                src={logo}
                alt="Logo Preview"
                style={{ width: '100px', height: '100px', marginTop: '10px' }}
              />
            )}
            {/* Display saved logo if no new logo is uploaded */}
            {!logo && savedLogo && (
              <img
                src={savedLogo}
                alt="Saved Logo"
                style={{ width: '100px', height: '100px', marginTop: '10px' }}
              />
            )}

            <Typography variant="h6" sx={{ mt: 2 }}>
              Company Name
            </Typography>
            <TextField
              fullWidth
              variant="outlined"
              value={companyName}
              onChange={(e) => setCompanyName(e.target.value)}
              placeholder="Enter company name"
              sx={{ mt: 1 }}
            />

            <Button
              variant="contained"
              color="primary"
              onClick={handleSaveSettings}
              sx={{ mt: 2 }}
            >
              Save Settings
            </Button>
          </Box>
        </Container>
      </Box>
    </div>
  );
};

export default AdminSetting;
