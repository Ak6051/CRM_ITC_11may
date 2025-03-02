// import React, { useState } from 'react';
// import { TextField, Button, Typography, Box, Grid, InputAdornment, Container } from '@mui/material';
// import { CloudUpload, Language } from '@mui/icons-material';
// import Navbar from '../../components/hr components/HrNavbar';
// import Sidebar from '../../components/hr components/HrSidebar';
// import axios from 'axios';

// const HRForm = () => {
//   const [employeeCount, setEmployeeCount] = useState(0);
//   const [cvFiles, setCvFiles] = useState([]);

//   const handleEmployeeCountChange = (event) => {
//     const count = parseInt(event.target.value, 10);
//     if (count >= 0 && !isNaN(count)) {
//       setEmployeeCount(count);
//       setCvFiles(Array(count).fill(null));
//     } else {
//       setEmployeeCount(0);
//       setCvFiles([]);
//     }
//   };

//   const handleCvChange = (index, event) => {
//     const files = [...cvFiles];
//     files[index] = event.target.files[0];
//     setCvFiles(files);
//   };

//   const handleSubmit = async (event) => {
//     event.preventDefault();
//     const formData = new FormData();
//     formData.append('websiteUrl', event.target.websiteUrl.value);
//     formData.append('employeeCount', employeeCount);

//     cvFiles.forEach((file) => {
//       if (file) formData.append('cvFiles', file);
//     });

//     try {
//       await axios.post('http://localhost:5000/api/hrform/submit', formData, {
//         headers: { 'Content-Type': 'multipart/form-data' },
//       });
//       alert('Form submitted successfully!');
//       setEmployeeCount(0);
//       setCvFiles([]);
//     } catch (error) {
//       alert('Failed to submit the form. Please try again!');
//     }
//   };

//   return (
//     <div style={{ display: 'flex', height: '100vh' }}>
//     <Sidebar />
//     <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
//       <Navbar />
//     <Container component="form" onSubmit={handleSubmit} encType="multipart/form-data" sx={{ maxWidth: 400, mt: 4 }}>
//       <Typography variant="h4" align="center" gutterBottom>
//         HR Form
//       </Typography>
//       <TextField
//         fullWidth
//         margin="normal"
//         label="Website URL"
//         name="websiteUrl"
//         variant="outlined"
//         required
//         InputProps={{
//           startAdornment: <InputAdornment position="start"><Language /></InputAdornment>,
//         }}
//       />
//       <TextField
//         fullWidth
//         margin="normal"
//         type="number"
//         label="Number of Employees"
//         value={employeeCount}
//         onChange={handleEmployeeCountChange}
//         variant="outlined"
//         required
//       />
//       <Box mt={2}>
//         <Typography variant="subtitle1">Upload CVs</Typography>
//         <Grid container spacing={2}>
//           {cvFiles.map((_, index) => (
//             <Grid item xs={12} key={index}>
//               <TextField
//                 fullWidth
//                 type="file"
//                 inputProps={{ accept: '.pdf' }}
//                 onChange={(e) => handleCvChange(index, e)}
//                 variant="outlined"
//                 required
//               />
//             </Grid>
//           ))}
//         </Grid>
//       </Box>
//       <Button type="submit" variant="contained" color="primary" fullWidth sx={{ mt: 3 }}>
//         Submit
//       </Button>
//     </Container>
//     </Box>
//     </div>
//   );
// };

// export default HRForm;
import React, { useState, useEffect } from 'react';
import {
  TextField,
  Button,
  Typography,
  Box,
  Grid,
  InputAdornment,
  Container,
  MenuItem,
} from '@mui/material';
import { CloudUpload, Language } from '@mui/icons-material';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import axios from 'axios';

const HRForm = () => {
  const [employeeCount, setEmployeeCount] = useState(0);
  const [cvFiles, setCvFiles] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');

  // Fetch company names from API
  useEffect(() => {
    const fetchCompanies = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('http://localhost:5000/api/assignhr', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (Array.isArray(response.data.data)) {
          setCompanies(response.data.data.map((item) => item.companyName));
        } else {
          console.error('Invalid response structure:', response.data);
        }
      } catch (error) {
        console.error('Error fetching companies:', error);
      }
    };

    fetchCompanies();
  }, []);

  const handleEmployeeCountChange = (event) => {
    const count = parseInt(event.target.value, 10);
    if (count >= 0 && !isNaN(count)) {
      setEmployeeCount(count);
      setCvFiles(Array(count).fill(null));
    } else {
      setEmployeeCount(0);
      setCvFiles([]);
    }
  };

  const handleCvChange = (index, event) => {
    const files = [...cvFiles];
    files[index] = event.target.files[0];
    setCvFiles(files);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const formData = new FormData();
    formData.append('websiteUrl', event.target.websiteUrl.value);
    formData.append('employeeCount', employeeCount);
    formData.append('selectedCompany', selectedCompany);

    cvFiles.forEach((file) => {
      if (file) formData.append('cvFiles', file);
    });

    try {
      await axios.post('http://localhost:5000/api/hrform/submit', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      alert('Form submitted successfully!');
      setEmployeeCount(0);
      setCvFiles([]);
      setSelectedCompany('');
    } catch (error) {
      alert('Failed to submit the form. Please try again!');
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
        <Container
          component="form"
          onSubmit={handleSubmit}
          encType="multipart/form-data"
          sx={{ maxWidth: 400, mt: 4 }}
        >
          <Typography variant="h4" align="center" gutterBottom>
            HR Form
          </Typography>

          {/* Dropdown for Company Name */}
          <TextField
            fullWidth
            select
            margin="normal"
            label="Select Company"
            value={selectedCompany}
            onChange={(e) => setSelectedCompany(e.target.value)}
            variant="outlined"
            required
          >
            {companies.length > 0 ? (
              companies.map((company, index) => (
                <MenuItem key={index} value={company}>
                  {company}
                </MenuItem>
              ))
            ) : (
              <MenuItem disabled>No companies available</MenuItem>
            )}
          </TextField>

          <TextField
            fullWidth
            margin="normal"
            label="Website URL"
            name="websiteUrl"
            variant="outlined"
            required
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Language />
                </InputAdornment>
              ),
            }}
          />
          <TextField
            fullWidth
            margin="normal"
            type="number"
            label="Number of Employees"
            value={employeeCount}
            onChange={handleEmployeeCountChange}
            variant="outlined"
            required
          />
          <Box mt={2}>
            <Typography variant="subtitle1">Upload CVs</Typography>
            <Grid container spacing={2}>
              {cvFiles.map((_, index) => (
                <Grid item xs={12} key={index}>
                  <TextField
                    fullWidth
                    type="file"
                    inputProps={{ accept: '.pdf' }}
                    onChange={(e) => handleCvChange(index, e)}
                    variant="outlined"
                    required
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 3 }}
          >
            Submit
          </Button>
        </Container>
      </Box>
    </div>
  );
};

export default HRForm;
