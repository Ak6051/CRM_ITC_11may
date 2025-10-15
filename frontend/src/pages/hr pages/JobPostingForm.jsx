import React, { useState, useEffect } from 'react';
import {
  TextField, Button, Box, Grid, Typography, Paper, CircularProgress,
} from '@mui/material';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useFormik } from 'formik';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import { Autocomplete } from '@mui/material';
import axios from 'axios';
import { debounce } from 'lodash';
import { API_BASE_URL } from '../../config/api.config';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import * as Yup from "yup";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";


const HRJobForm = () => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [agreementFile, setAgreementFile] = useState(null);
  const [gstUpload, setGstUpload] = useState(null);
  const [descriptionFile, setDescriptionFile] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [fileError, setFileError] = useState({ agreement: '', description: '' });
  const [formData, setFormData] = useState({
    existingAgreement: null,
    agreementSigned: '',
    gstUpload: null
  });
  const [inputText, setInputText] = useState('');


  const validationSchema = Yup.object({
    industries: Yup.string().required("Industry is required"),
    companyName: Yup.string().required("Company Name is required"),
    companyAddress: Yup.string().required("Company Address is required"),
    contactName: Yup.string().required("Contact Name is required"),
    email: Yup.string().email("Invalid email").required("Email is required"),
    phoneNumber: Yup.string().required("Phone Number is required"),
    jobTitle: Yup.string().required("Job Title is required"),
    numberOfRequirements: Yup.number()
      .typeError("Must be a number")
      .required("Number of Requirements is required"),
    education: Yup.string().required("Education is required"),
    experience: Yup.string().required("Experience is required"),
    salary: Yup.string().required("Salary is required"),
    jobLocation: Yup.string().required("Job Location is required"),
    jobTiming: Yup.string().required("Job Timing is required"),
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedFormData = {
      ...formData,
      [name]: value
    };
    setFormData(updatedFormData);
    formik.setFieldValue(name, value);
    
    // If company name is being updated, ensure it's set in the main form data
    if (name === 'companyName') {
      formik.setFieldValue('companyName', value);
    }
  };

  // Initialize formik with empty values
  const formik = useFormik({
    initialValues: {
      industries: '',
      companyName: '',
      companyAddress: '',
      Area: '',
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
      jobTiming: '',
      gender: '',
      remarks: '',
    },
    validationSchema,
    onSubmit: async (values, { resetForm }) => {
      setIsSubmitting(true);
      setSuccess(false);

      const formData = new FormData();
      const token = sessionStorage.getItem('token');

      // Ensure companyName is included from formData if not in values
      const formValues = { ...values };
      if (!formValues.companyName && formData.companyName) {
        formValues.companyName = formData.companyName;
      }

      // Append form fields
      Object.keys(formValues).forEach((key) => {
        if (key !== 'description' && formValues[key] !== undefined) {
          formData.append(key, formValues[key]);
        }
      });

      // Append agreement file if available
      if (agreementFile) {
        formData.append('agreementSigned', agreementFile);
      } else if (formData.agreementSigned) {
        // If agreementSigned exists in formData but no new file was selected
        formData.append('agreementSigned', formData.agreementSigned);
      }

      if (gstUpload) {
        formData.append('gstUpload', gstUpload);
      }

      // Append either description text or PDF
      if (descriptionFile) {
        formData.append('descriptionFile', descriptionFile);
      } 

      try {
        const response = await fetch(`${API_BASE_URL}/allType/create`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData,
        });

        if (response.ok) {
          setSuccess(true);
          toast.success("Job posted successfully! 🎉"); // ✅ Success toast
          resetForm();
          setFormData({
            existingAgreement: null,
            agreementSigned: null,
            gstUpload: null,
            companyName: '',
            companyAddress: '',
            Area: '',
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
            jobTiming: '',
            gender: '',
            remarks: ''
          });
          setAgreementFile(null);
          setGstUpload(null);
          setDescriptionFile(null);
        } else {
          toast.error("Failed to post job ❌"); // ✅ Error toast
        }
      } catch (error) {
        toast.error("An error occurred. Try again! ⚠️");
      } finally {
        setIsSubmitting(false);
      }
    }
  });

  const fetchAllCompanies = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/allType/companies?query=`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setCompanyOptions(res.data);
    } catch (err) {
      console.error('Error fetching all companies', err);
    }
  };

  useEffect(() => {
    fetchAllCompanies();
  }, []);

  const handleAgreementChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAgreementFile(file);
      setFormData(prev => ({
        ...prev,
        agreementSigned: file,
        existingAgreement: null
      }));
      setFileError(prev => ({ ...prev, agreement: '' }));
    } else {
      // Reset the agreement file if no file is selected
      setAgreementFile(null);
      setFormData(prev => ({
        ...prev,
        agreementSigned: '',
        existingAgreement: null
      }));
    }
  };

  const handleGSTChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setGstUpload(file);
      setFormData(prev => ({
        ...prev,
        gstUpload: file
      }));
    }
  };

  const handleDescriptionFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // if (validateFileSize(file, 'description')) {
        setDescriptionFile(file);
        formik.setFieldValue('description', ''); // clear text if PDF uploaded
      // } else {
      //   e.target.value = ''; // Reset the file input
      // }
    }
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
            borderRadius: '16px',
            background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: '0 15px 35px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e3f2fd'
          }}>
            <Box sx={{ 
              display: 'flex', 
              justifyContent: 'space-between', 
              alignItems: 'center', 
              mb: 4, 
              pb: 3, 
              borderBottom: '2px solid #e3f2fd'
            }}>
              <Box>
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold', 
                  color: '#1976d2',
                  mb: 1,
                  textShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
                }}>
                  Post a New Job
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  Fill in all required fields to create a new job posting
                </Typography>
              </Box>
              <Box>
                {isSubmitting ? <CircularProgress size={28} /> : success && <CheckCircleIcon sx={{ color: '#4caf50', fontSize: 30 }} />}
              </Box>
            </Box>

            <form onSubmit={(e) => {
              e.preventDefault();
              const companyName = inputText || formik.values.companyName;
              formik.setFieldValue('companyName', companyName);
              formik.handleSubmit(e);
            }}>
              <Grid container spacing={3}>
              <Grid item xs={12} sm={4}>
      <Autocomplete
  freeSolo
  options={companyOptions || []}
  getOptionLabel={(option) => {
    if (!option) return '';
    if (typeof option === 'string') return option;
    return String(option.companyName || '');
  }}
  inputValue={inputText}
  onInputChange={(e, newValue) => {
    const value = String(newValue || '');
    setInputText(value);
    // Update formik value when typing
    formik.setFieldValue('companyName', value);
  }}
  onChange={(e, value) => {
    if (value) {
      const name = value.companyName ? String(value.companyName) : String(value || '');
      setInputText(name);
      
      // Update formData state
      setFormData(prev => ({
        ...prev,
        companyName: name,
        companyAddress: value.companyAddress ? String(value.companyAddress) : '',
        contactName: value.contactName ? String(value.contactName) : '',
        email: value.email ? String(value.email) : '',
        phoneNumber: value.phoneNumber ? String(value.phoneNumber) : '',
        websiteURL: value.websiteURL ? String(value.websiteURL) : '',
        industries: value.industries ? String(value.industries) : '',
        agreementSigned: value.agreementSigned || '',
        // gstUpload: value.gstUpload || '',
        existingAgreement: value.agreementSigned ? {
          name: 'Existing Agreement',
          url: value.agreementSigned,
          isExisting: true
        } : null
      }));
      
      // Also update formik values for form submission
      formik.setFieldValue('companyName', name);
      formik.setFieldValue('companyAddress', value.companyAddress ? String(value.companyAddress) : '');
      formik.setFieldValue('contactName', value.contactName ? String(value.contactName) : '');
      formik.setFieldValue('email', value.email ? String(value.email) : '');
      formik.setFieldValue('phoneNumber', value.phoneNumber ? String(value.phoneNumber) : '');
      formik.setFieldValue('websiteURL', value.websiteURL ? String(value.websiteURL) : '');
      formik.setFieldValue('industries', value.industries ? String(value.industries) : '');
      formik.setFieldValue('agreementSigned', value.agreementSigned || '');
      // formik.setFieldValue('gstUpload', value.gstUpload || '');
    }
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Company Name or ID"
      fullWidth
      helperText="Search by company name or ID"
      value={inputText}
      onChange={(e) => {
        setInputText(e.target.value);
        handleChange({ target: { name: 'companyName', value: e.target.value } });
      }}
    />
  )}
  renderOption={(props, option) => (
    <li {...props}>
      <Box>
        <Typography variant="body1">
          {typeof option === 'string' ? option : option.companyName}
        </Typography>
        {typeof option === 'object' && option.companyId && (
          <Typography variant="caption" color="text.secondary">
            ID: {option.companyId}
            {option.companyAddress && ` • ${option.companyAddress}`}
          </Typography>
        )}
      </Box>
    </li>
  )}
/>

</Grid>

                {/* Company Information Section */}
                <Grid item xs={12}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600, mb: 2 }}>
                    Company Information
                  </Typography>
                </Grid>
                
                {[
                  { label: 'Industry', name: 'industries' },
                  { label: 'Company Address', name: 'companyAddress' },
                  { label: 'Contact Name', name: 'contactName' },
                  { label: 'Email', name: 'email', type: 'email' },
                  { label: 'Phone Number', name: 'phoneNumber' },
                  { label: 'Website URL', name: 'websiteURL' },
                  { label: 'Area', name: 'Area' },
                ].map((field, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <TextField
                      fullWidth
                      label={field.label}
                      name={field.name}
                      type={field.type || 'text'}
                      error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                      helperText={formik.touched[field.name] && formik.errors[field.name]}
                      variant="outlined"
                      value={formData[field.name] || ''}
                      onChange={handleChange}
                      onBlur={formik.handleBlur}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500,
                        }
                      }}
                    />
                  </Grid>
                ))}

                {/* Job Details Section */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600, mb: 2 }}>
                    Job Details
                  </Typography>
                </Grid>
                
                {[
                  { label: 'Job Title', name: 'jobTitle' },
                  { label: 'Response', name: 'response' },
                  { label: 'Number of Requirements', name: 'numberOfRequirements', type: 'number' },
                  { label: 'Education', name: 'education' },
                  { label: 'Experience', name: 'experience' },
                  { label: 'Salary', name: 'salary' },
                  { label: 'Job Location', name: 'jobLocation' },
                  { label: 'Job Timing', name: 'jobTiming' },
                ].map((field, idx) => (
                  <Grid item xs={12} sm={6} md={4} key={idx}>
                    <TextField
                      fullWidth
                      label={field.label}
                      name={field.name}
                      type={field.type || 'text'}
                      error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                      helperText={formik.touched[field.name] && formik.errors[field.name]}
                      variant="outlined"
                      value={formik.values[field.name]}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500,
                        }
                      }}
                    />
                  </Grid>
                ))}

                {/* Job Description Section */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600, mb: 2 }}>
                    Job Description
                  </Typography>
                </Grid>
                
                {[
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
                      error={formik.touched[field.name] && Boolean(formik.errors[field.name])}
                      helperText={formik.touched[field.name] && formik.errors[field.name]}
                      variant="outlined"
                      value={formik.values[field.name]}
                      onChange={formik.handleChange}
                      onBlur={formik.handleBlur}
                      multiline
                      rows={3}
                      sx={{
                        '& .MuiOutlinedInput-root': {
                          borderRadius: '8px',
                        },
                        '& .MuiInputLabel-root': {
                          fontWeight: 500,
                        }
                      }}
                    />
                  </Grid>
                ))}

                {/* Additional Information Section */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600, mb: 2 }}>
                    Additional Information
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <Autocomplete
                    freeSolo
                    options={['Male', 'Female', 'Other']}
                    value={formik.values.gender || ''}
                    onChange={(event, newValue) => {
                      formik.setFieldValue('gender', newValue || '');
                    }}
                    onInputChange={(event, newInputValue) => {
                      formik.setFieldValue('gender', newInputValue);
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Gender"
                        name="gender"
                        variant="outlined"
                        fullWidth
                        onBlur={formik.handleBlur}
                        error={formik.touched.gender && Boolean(formik.errors.gender)}
                        helperText={formik.touched.gender && formik.errors.gender}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: '8px',
                          },
                          '& .MuiInputLabel-root': {
                            fontWeight: 500,
                          }
                        }}
                      />
                    )}
                  />
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
                  <TextField
                    fullWidth
                    label="Remarks"
                    name="remarks"
                    variant="outlined"
                    value={formik.values.remarks}
                    onChange={formik.handleChange}
                    onBlur={formik.handleBlur}
                    error={formik.touched.remarks && Boolean(formik.errors.remarks)}
                    helperText={formik.touched.remarks && formik.errors.remarks}
                    multiline
                    rows={2}
                    sx={{
                      '& .MuiOutlinedInput-root': {
                        borderRadius: '8px',
                      },
                      '& .MuiInputLabel-root': {
                        fontWeight: 500,
                      }
                    }}
                  />
                </Grid>

                {/* Document Uploads Section */}
                <Grid item xs={12} sx={{ mt: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ color: '#1976d2', fontWeight: 600, mb: 2 }}>
                    Document Uploads
                  </Typography>
                </Grid>
                
                <Grid item xs={12} sm={6} md={4}>
  <Box
    sx={{
      border: '2px dashed #ccc',
      borderRadius: '8px',
      p: 2,
      textAlign: 'center',
      transition: 'border-color 0.3s',
      '&:hover': { borderColor: '#1976d2' },
    }}
  >
    <Typography variant="subtitle1" mb={1} sx={{ fontWeight: 500 }}>
      Upload Agreement (PDF)
    </Typography>
    <Button
      variant="outlined"
      component="label"
      startIcon={<UploadFileIcon />}
      disabled={!!formData.existingAgreement}
      sx={{ borderRadius: '8px' }}
    >
      {formData.existingAgreement ? 'Agreement Exists' : 'Choose File'}
      <input
        type="file"
        hidden
        accept=".pdf"
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            // ✅ yaha dono jagah set karo
            setAgreementFile(file); 
            setFormData((prev) => ({
              ...prev,
              agreementSigned: file,
              existingAgreement: null,
            }));
          }
        }}
      />
    </Button>

    {formData.existingAgreement ? (
      <Box
        mt={1}
        display="flex"
        alignItems="center"
        gap={1}
        justifyContent="center"
      >
        <Typography variant="body2" color="textSecondary">
          Existing agreement found
        </Typography>
        <Button
          size="small"
          color="primary"
          onClick={() =>
            window.open(formData.existingAgreement.url, '_blank')
          }
          startIcon={<VisibilityIcon />}
        >
          View
        </Button>
        <Button
          size="small"
          color="secondary"
          onClick={() =>
            setFormData((prev) => ({
              ...prev,
              existingAgreement: null,
              agreementSigned: '',
            }))
          }
          startIcon={<DeleteIcon />}
        >
          Remove
        </Button>
      </Box>
    ) : formData.agreementSigned ? (
      <Typography variant="body2" color="textSecondary" mt={1}>
        {formData.agreementSigned.name}
      </Typography>
    ) : null}
  </Box>
</Grid>


                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: '8px', 
                    p: 2, 
                    textAlign: 'center',
                    transition: 'border-color 0.3s',
                    '&:hover': { borderColor: '#1976d2' }
                  }}>
                    <Typography variant="subtitle1" mb={1} sx={{ fontWeight: 500 }}>
                      Upload GST PDF
                    </Typography>
                    <Button 
                      variant="outlined" 
                      component="label" 
                      startIcon={<UploadFileIcon />}
                      disabled={isSubmitting}
                      sx={{ borderRadius: '8px' }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={handleGSTChange}
                      />
                    </Button>
                    {gstUpload && (
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        {gstUpload.name}
                      </Typography>
                    )}
                    {fileError.gst && (
                      <Typography variant="caption" color="error" display="block" mt={1}>
                        {fileError.gst}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                <Grid item xs={12} sm={6} md={4}>
                  <Box sx={{ 
                    border: '2px dashed #ccc', 
                    borderRadius: '8px', 
                    p: 2, 
                    textAlign: 'center',
                    transition: 'border-color 0.3s',
                    '&:hover': { borderColor: '#1976d2' }
                  }}>
                    <Typography variant="subtitle1" mb={1} sx={{ fontWeight: 500 }}>
                      Upload Description PDF
                    </Typography>
                    <Button 
                      variant="outlined" 
                      component="label" 
                      startIcon={<UploadFileIcon />}
                      disabled={isSubmitting}
                      sx={{ borderRadius: '8px' }}
                    >
                      Choose File
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={handleDescriptionFileChange}
                      />
                    </Button>
                    {descriptionFile && (
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        {descriptionFile.name}
                      </Typography>
                    )}
                    {fileError.description && (
                      <Typography variant="caption" color="error" display="block" mt={1}>
                        {fileError.description}
                      </Typography>
                    )}
                  </Box>
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
