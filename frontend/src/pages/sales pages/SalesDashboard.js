import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  Modal,
  Link,

} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  Grid, Divider, LinearProgress, CheckCircle
} from '@mui/material';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Autocomplete } from '@mui/material';
import axios from 'axios';
import { debounce } from 'lodash';


import {
  createMySale,
  fetchMySales,
  updateMySale,
} from '../../utils/salesPanelService';

const JobOpeningsDashboard = () => {
  const [jobData, setJobData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [formData, setFormData] = useState({
    industries: '',
    companyName: '',
    companyId: '',
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
    agreementSigned: null, // Change to file
    description: '',
    descriptionFile: null, // Add this

  });


  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [parsedJobs, setParsedJobs] = useState([]);
  const [verifyModalOpen, setVerifyModalOpen] = useState(false);
  const [selectedConvertRow, setSelectedConvertRow] = useState(null);
  const [progress, setProgress] = useState(0);
  const [done, setDone] = useState(false);
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [companyOptions, setCompanyOptions] = useState([]);





  useEffect(() => {
    getJobData();
  }, []);

  const handleConvert = (row) => {
    const isPdfLink = typeof row.agreementSigned === 'string' &&
      (row.agreementSigned.startsWith('http://') || row.agreementSigned.startsWith('https://'));

    if (isPdfLink) {
      setSelectedConvertRow(row);
      setVerifyModalOpen(true);
    } else {
      toast.error('No agreement PDF available to convert.', {
        position: "top-right",
        autoClose: 3000,
      });
    }

  };

  

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

  const handleFileUploadForDescription = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, description: file });
    }
  };




  const resetConversionStates = () => {
    setProgress(0);
    setDone(false);
    setError(false);
  };

  const handleConfirmConvert = async () => {
    setProgress(20); // Start fake progress
    setError(false);
    setDone(false);

    const token = sessionStorage.getItem('token');

    const descriptionContent =
      selectedConvertRow.descriptionFile &&
        selectedConvertRow.descriptionFile.toLowerCase().endsWith('.pdf')
        ? selectedConvertRow.descriptionFile
        : selectedConvertRow.description || '';

        const conversionData = {
          ...selectedConvertRow,
          _id: selectedConvertRow._id, // original job ID
          convertedAt: new Date().toISOString(),
          description: descriptionContent,
          companyId: selectedConvertRow.companyId, // ✅ add this line
        };
        


    try {
      const response = await fetch('http://localhost:5000/api/panel/sales-convert', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(conversionData),
      });

      setProgress(70); // Simulate mid progress

      if (!response.ok) {
        const errorData = await response.json();
        toast.error(errorData.message || 'Conversion failed');
        setError(true);
        setVerifyModalOpen(false);
        resetConversionStates();
        return;
      }

      const result = await response.json();
      toast.success('Conversion successful!');
      setProgress(100);
      setDone(true);

      setTimeout(() => {
        setVerifyModalOpen(false);
        resetConversionStates();
      }, 2000);
    } catch (err) {
      console.error('Error converting job:', err);
      toast.error('Something went wrong');
      setError(true);
      setVerifyModalOpen(false);
      resetConversionStates();
    }
  };




  // const handleFileUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = (evt) => {
  //     const bstr = evt.target.result;
  //     const wb = XLSX.read(bstr, { type: 'binary' });
  //     const wsname = wb.SheetNames[0];
  //     const ws = wb.Sheets[wsname];
  //     const data = XLSX.utils.sheet_to_json(ws, { raw: false }); // raw: false to parse dates automatically

  //     const formattedData = data.map(row => {
  //       // Agar date Excel serial number me hai, toh ise convert karen
  //       let dateValue = row['Date'];

  //       // Agar dateValue number type me hai, toh convert karen:
  //       if (typeof dateValue === 'number') {
  //         // Convert Excel date serial number to JS date
  //         const jsDate = XLSX.SSF.parse_date_code(dateValue);
  //         if (jsDate) {
  //           // Format date as yyyy-mm-dd ya apne hisaab se
  //           const formattedDate = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;
  //           dateValue = formattedDate;
  //         }
  //       }
  //       return {
  //         ...row,
  //         Date: dateValue ? dateValue.toString() : ''
  //       };
  //     });

  //     setParsedJobs(formattedData);
  //     setUploadedFileName(file.name);
  //     setImportModalOpen(true);
  //   };

  //   reader.readAsBinaryString(file);
  // };


  // const handleConfirmImport = async () => {
  //   try {
  //     const token = sessionStorage.getItem('token');
  //     const response = await fetch('http://localhost:5000/api/panel/sales-import', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`
  //       },
  //       body: JSON.stringify({ jobs: parsedJobs }),
  //     });

  //     if (response.ok) {
  //       getJobData();
  //       alert('Jobs imported successfully!');
  //       setImportModalOpen(false);
  //     } else {
  //       alert('Failed to import jobs.');
  //     }
  //   } catch (err) {
  //     console.error('Error uploading file:', err);
  //     alert('An error occurred while importing jobs.');
  //   }
  // };

  // const getJobData = async () => {
  //   try {
  //     const response = await fetchMySales();

  //     const withId = response.map((item) => {
  //       return {
  //         ...item,
  //         id: item._id,
  //         createdAt: item.createdAt ? dayjs(item.createdAt).format('DD/MM/YYYY hh:mm A') : 'N/A',
  //       };
  //     });
  //     console.log('Processed Data:', withId);
  //     setJobData(withId);
  //     setFilteredData(withId);
  //   } catch (err) {
  //     console.error('Failed to fetch job openings:', err);
  //   }
  // };

  const getJobData = async () => {
  try {
    const response = await fetchMySales();

    const withId = response.map((item) => {
      return {
        ...item,
        id: item._id,
        rawCreatedAt: item.createdAt, // use this for sorting
        createdAt: item.createdAt
          ? dayjs(item.createdAt).format('DD/MM/YYYY hh:mm A')
          : 'N/A',
      };
    });

    // Sort using rawCreatedAt (descending)
    const sortedData = withId.sort(
      (a, b) => new Date(b.rawCreatedAt) - new Date(a.rawCreatedAt)
    );

    setJobData(sortedData);
    setFilteredData(sortedData);
  } catch (err) {
    console.error('Failed to fetch job openings:', err);
  }
};


  useEffect(() => {
    if (startDate || endDate) {
      const filtered = jobData.filter((job) => {
        const jobDate = dayjs(job.createdAt, 'DD/MM/YYYY hh:mm A');
        return (
          (!startDate || jobDate.isAfter(startDate, 'day')) &&
          (!endDate || jobDate.isBefore(endDate, 'day'))
        );
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(jobData);
    }
  }, [startDate, endDate, jobData]);

const handleOpen = (data = null) => {
  if (data) {
    setEditMode(true);
    setSelectedId(data._id || data.id);
    setFormData({
      industries: data?.industries || '',
      companyName: data?.companyName || '',
      companyId: data?.companyId ? Number(data.companyId) : '',
      companyAddress: data?.companyAddress || '',
      contactName: data?.contactName || '',
      email: data?.email || '',
      phoneNumber: data?.phoneNumber || '',
      response: data?.response || '',
      jobTitle: data?.jobTitle || '',
      benefits: data?.benefits || '',
      numberOfRequirements: data?.numberOfRequirements || '',
      websiteURL: data?.websiteURL || '',
      keyResponsibility: data?.keyResponsibility || '',
      requiredSkills: data?.requiredSkills || '',
      education: data?.education || '',
      experience: data?.experience || '',
      salary: data?.salary || '',
      jobLocation: data?.jobLocation || '',
      remarks: data?.remarks || '',
      agreementSigned: data?.agreementSigned || '',
      description: data?.description || '',
    });
  } else {
    setEditMode(false);
    setSelectedId(null);
    setFormData({
      industries: '',
      companyName: '',
      companyId: '',
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
      agreementSigned: null,
      description: '',
      descriptionFile: null,
    });
  }
  setOpen(true);
};



  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
    setFormData({
      industries: '',
      companyName: '',
      companyId: '',
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
      agreementSigned: null,
      description: '',
      descriptionFile: null,
    });
    setSelectedId(null);
  };


  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'date') {
      // Simple regex for dd-mm-yyyy (no strict validation)
      const isValid = /^(\d{2})-(\d{2})-(\d{4})$/.test(value);
      if (!isValid && value !== '') {
        // You can show an error message or prevent updating formData
        // For now, just update anyway
      }
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    const data = new FormData();
    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== undefined) {
        // Special handling for companyId
        if (key === 'companyId') {
          if (formData[key] !== '') {
            data.append(key, Number(formData[key]));
          }
        } else {
          data.append(key, formData[key]);
        }
      }
    }

    try {
      if (editMode) {
        const response = await updateMySale(selectedId, data, true);
        if (response.error) {
          throw new Error(response.message || 'Failed to update job');
        }
      } else {
        const response = await createMySale(data, true);
        if (response.error) {
          throw new Error(response.message || 'Failed to create job');
        }
      }

      setSuccess(true);
      await getJobData();

      setTimeout(() => {
        setSuccess(false);
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving job opening:', err);
      toast.error(err.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };


  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'JobOpenings');
    XLSX.writeFile(wb, 'job_openings.xlsx');
  };

const columns = [
  // {
  //   field: 'date',
  //   headerName: 'Date',
  //   width: 180,
  //   renderCell: (params) => {
  //     const value = params.value;
  //     if (!value) return <span></span>;
  //     const parts = value.split('/');
  //     if (parts.length === 3) {
  //       const month = parts[0].padStart(2, '0');
  //       const day = parts[1].padStart(2, '0');
  //       let year = parts[2];
  //       if (year.length === 2) year = '20' + year;
  //       return <span>{`${day}-${month}-${year}`}</span>;
  //     }
  //     return <span>{value}</span>;
  //   }
  // },
  { field: 'createdAt', headerName: 'Created At', width: 180 },
  { field: 'industries', headerName: 'Industries', width: 160 },
  { field: 'companyName', headerName: 'Company Name', width: 160 },
  { field: 'companyAddress', headerName: 'Permanent Address', width: 200 },
  { field: 'contactName', headerName: 'Contact Person', width: 160 },
  { field: 'phoneNumber', headerName: 'Phone Number', width: 140 },
  { 
    field: 'websiteURL', 
    headerName: 'Website', 
    width: 180,
    renderCell: (params) => {
      const url = params.value;
      return url ? (
        <a href={url.startsWith('http') ? url : `https://${url}`} target="_blank" rel="noopener noreferrer" style={{ color: '#1976d2', textDecoration: 'underline' }}>
          {url}
        </a>
      ) : <span>No Website</span>;
    },
  },
  { field: 'response', headerName: 'Response', width: 200 },
  { field: 'email', headerName: 'Email', width: 200 },
  { field: 'numberOfRequirements', headerName: 'Vacancies', width: 130 },

  // 🆕 Added fields
  { field: 'jobTitle', headerName: 'Job Title', width: 180 },
  { field: 'benefits', headerName: 'Benefits', width: 180 },
  { field: 'keyResponsibility', headerName: 'Key Responsibility', width: 200 },
  { field: 'requiredSkills', headerName: 'Required Skills', width: 200 },
  { field: 'education', headerName: 'Education', width: 160 },
  { field: 'experience', headerName: 'Experience', width: 140 },
  { field: 'salary', headerName: 'Salary', width: 140 },

  {
    field: 'agreementSigned',
    headerName: 'Agreement Signed',
    width: 150,
    renderCell: (params) => {
      const value = params.value;
      const isPdfLink = typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'));
      return isPdfLink ? (
        <a href={value} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
            View
          </button>
        </a>
      ) : <span>{value || 'No'}</span>;
    }
  },

  {
    field: 'description',
    headerName: 'Description',
    width: 200,
    renderCell: (params) => {
      const pdfUrl = params.row.descriptionFile;
      const text = params.row.description;
      return pdfUrl ? (
        <a href={pdfUrl} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none' }}>
          <button style={{ backgroundColor: '#1976d2', color: 'white', border: 'none', borderRadius: '4px', padding: '4px 8px', cursor: 'pointer' }}>
            View PDF
          </button>
        </a>
      ) : <span>{text || 'No Description'}</span>;
    }
  },

  { field: 'jobLocation', headerName: 'Job Location', width: 160 },
  { field: 'remarks', headerName: 'Remarks', width: 250 },

  {
    field: 'actions',
    headerName: 'Actions',
    width: 120,
    renderCell: (params) => (
      <Button variant="outlined" size="small" onClick={() => handleOpen(params.row)}>
        Edit
      </Button>
    )
  },
  {
    field: 'convert',
    headerName: 'Convert',
    width: 120,
    renderCell: (params) => (
      <button
        style={{
          backgroundColor: '#43a047',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          padding: '4px 10px',
          cursor: 'pointer',
        }}
        onClick={() => handleConvert(params.row)}
      >
        Convert
      </button>
    )
  }
];


  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
          <Sidebar />
        </div>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
          <Navbar />
          <Box p={3}>
            <Typography variant="h4" gutterBottom>
              Lead Generate
            </Typography>

            <Box display="flex" alignItems="center" gap={2} mb={2}>
              <DatePicker
                label="Start Date"
                value={startDate}
                onChange={(date) => setStartDate(date)}
              />
              <DatePicker
                label="End Date"
                value={endDate}
                onChange={(date) => setEndDate(date)}
              />
              <Button onClick={() => { setStartDate(null); setEndDate(null); }}>
                Reset Filter
              </Button>
            </Box>

            <Box mb={2}>
              <Button variant="contained" onClick={() => handleOpen()} sx={{ mr: 2 }}>
                Add Job Opening
              </Button>
              <Button variant="contained" color="success" onClick={exportToExcel}>
                Export to Excel
              </Button>

            </Box>
           
            <Box sx={{ height: 500, width: '100%', overflow: 'auto' }}>
              <DataGrid
                rows={filteredData}
                columns={columns}
                pageSize={5}
                getRowId={(row) => row.id}
                disableSelectionOnClick
                onError={(error) => console.error('DataGrid Error:', error)}
                loading={!filteredData.length}
                components={{
                  NoRowsOverlay: () => (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography>No data available</Typography>
                    </Box>
                  ),
                }}
              />
            </Box>

            <Dialog
              open={open}
              onClose={(event, reason) => {
                if (reason && (reason === "backdropClick" || reason === "escapeKeyDown")) {
                  return;
                }
                handleClose();
              }}
              maxWidth="lg"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  backgroundColor: '#fff',
                  padding: 3,

                },
              }}
            >
              <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: '700', fontSize: '1.8rem', color: '#1a237e' }}>
                {editMode ? 'Edit Job Opening' : 'Add Job Opening'}
                <IconButton onClick={handleClose} sx={{ color: '#1a237e' }}>
                  <CloseIcon />
                </IconButton>
              </DialogTitle>

              <DialogContent dividers sx={{ maxHeight: '80vh', overflowY: 'auto', backgroundColor: '#f5f7fa', borderRadius: 2, p: 4 }}>
                <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                  <Grid container spacing={4}>
                  <Grid item xs={12} sm={4}>
  <Autocomplete
    freeSolo
    options={companyOptions}
    getOptionLabel={(option) => {
      if (typeof option === 'string') return option;
      return `${option.companyName} (ID: ${option.companyId})`;
    }}
    inputValue={formData.companyName}
    onInputChange={(e, newValue) => {
      handleChange({ target: { name: 'companyName', value: newValue } });
      fetchCompanySuggestions(newValue);
    }}
    onChange={(e, value) => {
      if (value) {
        setFormData(prev => ({
          ...prev,
          companyName: value.companyName || '',
          companyAddress: value.companyAddress || '',
          contactName: value.contactName || '',
          email: value.email || '',
          phoneNumber: value.phoneNumber || '',
        }));
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
                      { name: 'industries', label: 'Industries' },
                      { name: 'companyAddress', label: 'Company Address' },
                      { name: 'contactName', label: 'Contact Person Name' },
                      { name: 'email', label: 'Email', type: 'email' },
                      { name: 'phoneNumber', label: 'Phone Number' },
                      { name: 'jobTitle', label: 'Job Title' },
                      { name: 'reponse', label: 'Response' },
                      { name: 'benefits', label: 'Benefits' },
                      { name: 'numberOfRequirements', label: 'Number of Requirements', type: 'number' },
                      { name: 'websiteURL', label: 'Website URL', type: 'url' },
                      { name: 'keyResponsibility', label: 'Key Responsibility ' },
                      { name: 'requiredSkills', label: 'Required Skills ' },
                      { name: 'education', label: 'Education ' },
                      { name: 'experience', label: 'Experience ' },
                      { name: 'salary', label: 'Salary ' },
                      { name: 'jobLocation', label: 'Job Location' },
                    ].map((field, index) => (
                      <Grid item xs={12} sm={4} key={index}>
                        <TextField
                          name={field.name}
                          label={field.label}
                          type={field.type || 'text'}
                          fullWidth
                          value={formData[field.name]}
                          onChange={handleChange}
                          variant="outlined"
                          sx={{
                            '& label': { fontWeight: 600, color: '#555' },
                            '& input': { fontWeight: 500, color: '#333' },
                          }}
                        />
                      </Grid>
                    ))}

                    <Grid item xs={12}>
                      <TextField
                        name="remarks"
                        label="Remarks"
                        fullWidth
                        multiline
                        minRows={2}
                        value={formData.remarks}
                        onChange={handleChange}
                        variant="outlined"
                        sx={{
                          '& label': { fontWeight: 600, color: '#555' },
                          '& textarea': { fontWeight: 500, color: '#333' },
                        }}
                      />
                    </Grid>
                  </Grid>
                </Box>
                {loading && (
                  <Box sx={{ my: 2 }}>
                    <LinearProgress color="primary" />
                  </Box>
                )}

                {success && (
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                    <CheckCircleIcon sx={{ color: 'green' }} />
                    <Typography sx={{ fontWeight: 600, color: 'green' }}>
                      {editMode ? 'Update Successful!' : 'Create Successful!'}
                    </Typography>
                  </Box>
                )}


                <Divider sx={{ my: 3 }} />

                {/* PDF Upload Section */}
                <Box sx={{ p: 2, backgroundColor: '#f9f9f9', borderRadius: 2 }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 700, color: '#333' }}>
                    Agreement Document
                  </Typography>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        agreementSigned: e.target.files[0],
                      }))
                    }
                    style={{ marginBottom: 16 }}
                  />

                  <Typography variant="subtitle1" sx={{ mt: 2, fontWeight: 700, color: '#333' }}>
                    Job Description
                  </Typography>
                  <TextField
                    name="description"
                    label="Description"
                    fullWidth
                    multiline
                    rows={4}
                    value={formData.description}
                    onChange={handleChange}
                    sx={{ mb: 2 }}
                    variant="outlined"
                    InputLabelProps={{ style: { fontWeight: 600, color: '#555' } }}
                    inputProps={{ style: { fontWeight: 500, color: '#333' } }}
                  />

                  <Typography variant="body2" sx={{ mb: 1, color: '#555' }}>
                    Upload Additional Description (PDF)
                  </Typography>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        descriptionFile: e.target.files[0],
                      }))
                    }
                    style={{ marginBottom: 16 }}
                  />
                </Box>
              </DialogContent>

              <DialogActions sx={{ px: 4, py: 3 }}>
                <Button
                  onClick={handleClose}
                  sx={{
                    color: '#1a237e',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    border: '1px solid #1a237e',
                    '&:hover': { backgroundColor: '#1a237e', color: '#fff' },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  disabled={loading}
                  sx={{
                    backgroundColor: '#1a237e',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': { backgroundColor: '#3949ab' },
                  }}
                >
                  {loading ? 'Saving...' : editMode ? 'Update' : 'Save'}
                </Button>

              </DialogActions>
            </Dialog>

            <Dialog
              open={verifyModalOpen}
              onClose={(event, reason) => {
                if (reason !== 'backdropClick' && reason !== 'escapeKeyDown') {
                  setVerifyModalOpen(false);
                }
              }}
              maxWidth="md"
              fullWidth
              PaperProps={{
                sx: {
                  borderRadius: 3,
                  boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                  backgroundColor: '#fff',
                  padding: 3,
                },
              }}
            >
              <DialogTitle sx={{ fontWeight: '700', fontSize: '1.8rem', color: '#1a237e' }}>
                Confirm Conversion
              </DialogTitle>

              <DialogContent dividers sx={{ backgroundColor: '#f5f7fa', borderRadius: 2, p: 4, position: 'relative' }}>
                {/* Conversion Status UI */}
                {(progress > 0 || done || error) && (
                  <Box
                    sx={{
                      position: 'absolute',
                      top: 0,
                      left: 0,
                      width: '100%',
                      height: '100%',
                      backgroundColor: 'rgba(255,255,255,0.8)',
                      zIndex: 10,
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      justifyContent: 'center',
                      borderRadius: 2,
                    }}
                  >
                    {progress > 0 && !done && !error && (
                      <Box width="80%" textAlign="center">
                        <Typography mb={2} fontWeight={600}>Processing Conversion...</Typography>
                        <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 5 }} />
                        <Typography variant="body2" mt={1}>{progress}%</Typography>
                      </Box>
                    )}

                    {done && (
                      <Box textAlign="center">
                        <CheckCircleIcon sx={{ fontSize: 60, color: 'green' }} />
                        <Typography variant="h6" mt={1} fontWeight={600}>Conversion Successful!</Typography>
                      </Box>
                    )}

                    {error && (
                      <Box textAlign="center">
                        <Typography color="error" variant="h6" fontWeight={600}>❌ Conversion failed</Typography>
                        <Typography>Please try again.</Typography>
                      </Box>
                    )}
                  </Box>
                )}

                {/* Always show POP data */}
                {selectedConvertRow ? (
<Box display="grid" gridTemplateColumns="repeat(3, 1fr)" gap={3}>
  {[
    ['Industry', selectedConvertRow.industries],
    ['Company', selectedConvertRow.companyName],
    ['Company Address', selectedConvertRow.companyAddress],
    ['Contact Name', selectedConvertRow.contactName],
    ['Phone Number', selectedConvertRow.phoneNumber],
    ['Email', selectedConvertRow.email],
    ['Job Title', selectedConvertRow.jobTitle],
    ['Benefits', selectedConvertRow.benefits],
    ['Required Skills', selectedConvertRow.requiredSkills],
    ['Key Responsibility', selectedConvertRow.keyResponsibility],
    ['Education', selectedConvertRow.education],
    ['Experience', selectedConvertRow.experience],
    ['Salary', selectedConvertRow.salary],
    ['Job Location', selectedConvertRow.jobLocation],
    ['Response', selectedConvertRow.response],
    ['Requirements', selectedConvertRow.numberOfRequirements],
    [
      'Website',
      selectedConvertRow.websiteURL ? (
        <Link
          href={selectedConvertRow.websiteURL}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
          sx={{ fontWeight: 500 }}
        >
          {selectedConvertRow.websiteURL}
        </Link>
      ) : 'N/A',
    ],
    [
      'Agreement',
      selectedConvertRow.agreementSigned && selectedConvertRow.agreementSigned !== 'no' ? (
        <Link
          href={selectedConvertRow.agreementSigned}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
          sx={{ fontWeight: 500 }}
        >
          View PDF
        </Link>
      ) : 'N/A',
    ],
    [
      'Description',
      selectedConvertRow.descriptionFile ? (
        <Link
          href={selectedConvertRow.descriptionFile}
          target="_blank"
          rel="noopener noreferrer"
          underline="hover"
          color="primary"
          sx={{ fontWeight: 500 }}
        >
          View PDF
        </Link>
      ) : (selectedConvertRow.description || 'N/A'),
    ],
    ['Remarks', selectedConvertRow.remarks],
    ['Created By', selectedConvertRow.createdBy?.name || 'N/A'],
  ].map(([label, value], idx) => (
    <Box key={idx} sx={{ display: 'flex', flexDirection: 'column' }}>
      <Typography variant="subtitle2" sx={{ color: '#555', fontWeight: '600', mb: 0.5 }}>
        {label}:
      </Typography>
      <Typography variant="body1" sx={{ color: '#333', fontWeight: 500 }}>
        {value || 'N/A'}
      </Typography>
    </Box>
  ))}
</Box>

                ) : (
                  <Typography>No data available</Typography>
                )}
              </DialogContent>


              <DialogActions sx={{ px: 4, py: 3 }}>
                <Button
                  onClick={() => setVerifyModalOpen(false)}
                  sx={{
                    color: '#1a237e',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    border: '1px solid #1a237e',
                    '&:hover': { backgroundColor: '#1a237e', color: '#fff' },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleConfirmConvert}
                  variant="contained"
                  sx={{
                    backgroundColor: '#1a237e',
                    textTransform: 'none',
                    fontWeight: 600,
                    borderRadius: 2,
                    px: 3,
                    '&:hover': { backgroundColor: '#3949ab' },
                  }}
                >
                  Confirm
                </Button>
                <Button
                  onClick={() => {
                    setVerifyModalOpen(false);
                    setEditMode(true);
                    setSelectedId(selectedConvertRow._id);
                    setFormData({ ...selectedConvertRow });
                    setOpen(true);
                  }}
                  variant="outlined"
                  sx={{
                    color: '#1a237e',
                    fontWeight: 600,
                    textTransform: 'none',
                    borderRadius: 2,
                    borderColor: '#1a237e',
                    px: 3,
                    '&:hover': {
                      backgroundColor: '#e8eaf6',
                      borderColor: '#3949ab',
                    },
                  }}
                >
                  Edit
                </Button>
              </DialogActions>
            </Dialog>


          </Box>
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default JobOpeningsDashboard;
