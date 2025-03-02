import React, { useState } from 'react';
import {
  Typography,
  Container,
  Box,
  TextField,
  Button,
  MenuItem,
  Grid,
  Paper,
  Snackbar,
} from '@mui/material';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';
import PhoneIcon from '@mui/icons-material/Phone';
import BusinessIcon from '@mui/icons-material/Business';
import HomeIcon from '@mui/icons-material/Home';
import LinkIcon from '@mui/icons-material/Link';
import EmailIcon from '@mui/icons-material/Email';
import PersonIcon from '@mui/icons-material/Person';
import EventIcon from '@mui/icons-material/Event';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const callStatuses = [
  'Ringing',
  'Not Reachable',
  'Interested',
  'Not Interested',
  'Meeting Fixed',
];

const JobOpennings = () => {
  const [formData, setFormData] = useState({
    LeadBy: '',
    companyName: '',
    phoneNumber: '',
    address: '',
    websiteUrl: '',
    emailId: '',
    callStatus: '',
    meetingDate: '',
    meetingTime: '',
    contactPerson: '',
    designation: '',
    description: '',
  });

  const [openAlert, setOpenAlert] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5000/api/openning/job', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      console.log(result);

      if (response.ok) {
        setAlertMessage('Data submitted successfully!');
        setOpenAlert(true);
        setFormData({
          LeadBy: '',
          companyName: '',
          phoneNumber: '',
          address: '',
          websiteUrl: '',
          emailId: '',
          callStatus: '',
          meetingDate: '',
          meetingTime: '',
          contactPerson: '',
          designation: '',
          description: '',
        });
      } else {
        setAlertMessage('Error submitting data. Please try again.');
        setOpenAlert(true);
      }
    } catch (error) {
      console.error('Error:', error);
      setAlertMessage('An error occurred. Please try again later.');
      setOpenAlert(true);
    }
  };

  const handleCloseAlert = () => {
    setOpenAlert(false);
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
        {/* Scrollable Content Area */}
        <Box
          sx={{
            flexGrow: 1,
            overflowY: 'auto',
            mt: 8, // Add margin top to avoid overlap with the fixed Navbar
          }}
        >
          <Container maxWidth="md" sx={{ flexGrow: 1, mt: 2, mb: 2 }}>
            <Paper elevation={3} sx={{ padding: 3 }}>
              <Typography variant="h4" align="center">
                JOB OPENNINGS
              </Typography>
              <Typography variant="body1" sx={{ mt: 2 }} align="center">
                Please fill in the details below.
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2} sx={{ mt: 2 }}>
                  {/* Form fields */}
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Lead By"
                      name="LeadBy"
                      value={formData.LeadBy}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <PersonIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Company Name"
                      name="companyName"
                      value={formData.companyName}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <BusinessIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Phone Number"
                      name="phoneNumber"
                      value={formData.phoneNumber}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <PhoneIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: <HomeIcon style={{ marginRight: 8 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Website URL"
                      name="websiteUrl"
                      value={formData.websiteUrl}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: <LinkIcon style={{ marginRight: 8 }} />,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Email ID"
                      name="emailId"
                      value={formData.emailId}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <EmailIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      select
                      label="Call Status"
                      name="callStatus"
                      value={formData.callStatus}
                      onChange={handleChange}
                      required
                    >
                      {callStatuses.map((status) => (
                        <MenuItem key={status} value={status}>
                          {status}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Meeting Date"
                      type="date"
                      name="meetingDate"
                      value={formData.meetingDate}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <EventIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Meeting Time"
                      type="time"
                      name="meetingTime"
                      value={formData.meetingTime}
                      onChange={handleChange}
                      InputLabelProps={{ shrink: true }}
                      InputProps={{
                        startAdornment: (
                          <AccessTimeIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Contact Person"
                      name="contactPerson"
                      value={formData.contactPerson}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <PersonIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Designation"
                      name="designation"
                      value={formData.designation}
                      onChange={handleChange}
                      required
                      InputProps={{
                        startAdornment: (
                          <PersonIcon style={{ marginRight: 8 }} />
                        ),
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Description"
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      multiline
                      rows={4}
                      required
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <Button type="submit" variant="contained" color="primary">
                      Submit
                    </Button>
                  </Grid>
                </Grid>
              </form>
              <Snackbar
                open={openAlert}
                onClose={handleCloseAlert}
                message={alertMessage}
                autoHideDuration={6000}
              />
            </Paper>
          </Container>
        </Box>
      </Box>
    </div>
  );
};

export default JobOpennings;
