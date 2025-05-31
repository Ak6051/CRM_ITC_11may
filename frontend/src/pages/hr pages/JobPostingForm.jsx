
import React, { useState } from 'react';
import {
  TextField, Button, Box, Grid, Typography, Paper, CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import { Autocomplete } from '@mui/material';
import axios from 'axios';
import { debounce } from 'lodash';

const validationSchema = Yup.object().shape({
  companyName: Yup.string(),
  companyAddress: Yup.string(),
  contactName: Yup.string(),
  email: Yup.string().email('Invalid email'),
  phoneNumber: Yup.string(),
  jobTitle: Yup.string(),
  numberOfRequirements: Yup.number(),
  keyResponsibility: Yup.string(),
  requiredSkills: Yup.string(),
  education: Yup.string(),
  experience: Yup.string(),
  salary: Yup.string(),
  jobLocation: Yup.string(),
  description: Yup.string(), // not required
});

const HRJobForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreementFile, setAgreementFile] = useState(null);
  const [descriptionFile, setDescriptionFile] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);

  const formik = useFormik({
    initialValues: {
      industries: '',
      companyName: '',
      companyAddress: '',
      contactName: '',
      email: '',
      phoneNumber: '',
      response: '',
      jobTitle: '',
      benefits: '',
      numberOfRequirements: '',
      websiteURL: '',
      keyResponsibility: '',
      requiredSkills: '',
      education: '',
      experience: '',
      salary: '',
      jobLocation: '',
      remarks: '',
      description: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);
      setSuccess(false);

      const formData = new FormData();
      const token = sessionStorage.getItem('token');

      // Append form fields
      Object.keys(values).forEach((key) => {
        if (key !== 'description') {
          formData.append(key, values[key]);
        }
      });

      // Append agreement file if available
      if (agreementFile) {
        formData.append('agreementSigned', agreementFile);
      }

      // Append either description text or PDF
      if (descriptionFile) {
        formData.append('descriptionFile', descriptionFile);
      } else if (values.description) {
        formData.append('description', values.description);
      }

      try {
        const response = await fetch('http://localhost:5000/api/allType/create', {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          setSuccess(true);
          resetForm();
          setAgreementFile(null);
          setDescriptionFile(null);
        } else {
          alert('Failed to post job.');
        }
      } catch (error) {
        alert('An error occurred.');
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const fetchCompanySuggestions = debounce(async (input) => {
    if (!input) return;
    try {
      // Search by both companyName and companyId
      const res = await axios.get(`http://localhost:5000/api/allType/companies?query=${input}`);
      setCompanyOptions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions', err);
    }
  }, 300);

  const handleAgreementChange = (e) => {
    setAgreementFile(e.target.files[0]);
  };

  const handleDescriptionFileChange = (e) => {
    setDescriptionFile(e.target.files[0]);
    formik.setFieldValue('description', ''); // clear text if PDF uploaded
  };

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#f4f6f8', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box sx={{
        position: 'fixed', left: 0, top: 0, bottom: 0, width: 250, bgcolor: '#212121', color: '#fff', zIndex: 1100
      }}>
        <Sidebar />
      </Box>

      {/* Main content */}
      <Box sx={{ ml: '250px', flex: 1 }}>
        <Box sx={{ position: 'fixed', top: 0, left: '250px', right: 0, zIndex: 1000, bgcolor: '#fff', boxShadow: 1 }}>
          <Navbar />
        </Box>

        <Box sx={{ mt: 12, px: 6, py: 6 }}>
          <Paper elevation={5} sx={{
            maxWidth: '95%',
            mx: 'auto',
            p: 5,
            borderRadius: 4,
            bgcolor: '#fff',
            boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
          }}>
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
              <Typography variant="h4" fontWeight="bold" color="primary.main">
                Post a New Job
              </Typography>
              {isSubmitting ? <CircularProgress size={28} /> : success && <CheckCircleIcon sx={{ color: 'green', fontSize: 30 }} />}
            </Box>

            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
              <Autocomplete
  freeSolo
  options={companyOptions}
  getOptionLabel={(option) => {
    if (typeof option === 'string') return option;
    return `${option.companyName} (ID: ${option.companyId})`;
  }}
  inputValue={formik.values.companyName}
  onInputChange={(e, newValue) => {
    formik.setFieldValue('companyName', newValue);
    fetchCompanySuggestions(newValue);
  }}
  onChange={(e, value) => {
    if (value) {
      formik.setFieldValue('companyName', value.companyName || '');
      formik.setFieldValue('companyAddress', value.companyAddress || '');
      formik.setFieldValue('contactName', value.contactName || '');
      formik.setFieldValue('email', value.email || '');
      formik.setFieldValue('phoneNumber', value.phoneNumber || '');
    }
  }}
  renderInput={(params) => (
    <TextField 
      {...params} 
      label="Company Name or ID" 
      fullWidth 
      helperText="Search by company name or ID"
      variant="outlined"
      sx={{
        '& label': { fontWeight: 600, color: '#555' },
        '& input': { fontWeight: 500, color: '#333' },
      }}
    />
  )}
  renderOption={(props, option) => (
    <li {...props}>
      <Box>
        <Typography variant="body1">
          {option.companyName}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          ID: {option.companyId}
          {option.companyAddress && ` • ${option.companyAddress}`}
        </Typography>
      </Box>
    </li>
  )}
/>

</Grid>

                {[
                  { label: 'Industry', name: 'industries' },
                  { label: 'Company Address', name: 'companyAddress' },
                  { label: 'Contact Name', name: 'contactName' },
                  { label: 'Email', name: 'email', type: 'email' },
                  { label: 'Phone Number', name: 'phoneNumber' },
                  { label: 'Job Title', name: 'jobTitle' },
                  { label: 'Number of Requirements', name: 'numberOfRequirements', type: 'number' },
                  { label: 'Education', name: 'education' },
                  { label: 'Experience', name: 'experience' },
                  { label: 'Salary', name: 'salary' },
                  { label: 'Job Location', name: 'jobLocation' },
                  { label: 'Benefits', name: 'benefits' },
                  { label: 'Key Responsibility', name: 'keyResponsibility' },
                  { label: 'Required Skills', name: 'requiredSkills' },
                ].map((field, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <TextField
                      fullWidth
                      label={field.label}
                      name={field.name}
                      type={field.type || 'text'}
                      variant="outlined"
                      value={formik.values[field.name]}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                      helperText={formik.touched[field.name] && formik.errors[field.name]}
                      multiline={['benefits', 'keyResponsibility', 'requiredSkills'].includes(field.name)}
                      rows={['benefits', 'keyResponsibility', 'requiredSkills'].includes(field.name) ? 3 : 1}
                    />
                  </Grid>
                ))}

                {/* Description Text */}
                {!descriptionFile && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      multiline
                      rows={3}
                      label="Job Description (Text)"
                      name="description"
                      value={formik.values.description}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      error={formik.touched.description && Boolean(formik.errors.description)}
                      helperText={formik.touched.description && formik.errors.description}
                    />
                  </Grid>
                )}

                {/* Uploads */}
                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" mb={1}>Upload Agreement PDF</Typography>
                  <input type="file" accept=".pdf" onChange={handleAgreementChange} disabled={isSubmitting} />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <Typography variant="subtitle1" mb={1}>Upload Description PDF</Typography>
                  <input type="file" accept=".pdf" onChange={handleDescriptionFileChange} disabled={isSubmitting} />
                </Grid>
              </Grid>

              {/* Submit Button */}
              <Box mt={5} display="flex" justifyContent="flex-end">
                <Button
                  type="submit"
                  variant="contained"
                  disabled={isSubmitting}
                  sx={{
                    px: 5,
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    borderRadius: '12px',
                    textTransform: 'none',
                    background: 'linear-gradient(to right, #007BFF, #00C6FF)',
                    color: '#fff',
                    boxShadow: '0 6px 20px rgba(0, 123, 255, 0.3)',
                    '&:hover': {
                      background: 'linear-gradient(to right, #0056b3, #00aaff)'
                    }
                  }}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Job'}
                </Button>
              </Box>
            </form>
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default HRJobForm;
