import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Modal,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  TableCell,
  TableRow,
  TableBody,
  TableHead,
  Card,
  CardContent,
  Checkbox,
  ListItemText,
  Table,
  Grid
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import {
  fetchAllSales,
  createSale,
  deleteSale,
  updateSale,
  fetchHRUsers,
  isTokenValid
} from '../../utils/JobReportService';
import * as XLSX from 'xlsx';
import dayjs from 'dayjs';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import { debounce } from 'lodash';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';


import { Autocomplete } from '@mui/material';


const JobReport = () => {
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    industries: '',
    companyName: '',
    companyAddress: '',
    contactName: '',
    email: '',
    phoneNumber: '',
    response:'',
    jobTitle: '',
    benefits: '',
    numberOfRequirements: '',
    websiteURL:'',
    keyResponsibility: '',
    requiredSkills: '',
    education: '',
    experience: '',
    salary: '',
    jobLocation: '',
    remarks:'',
    agreementSigned: null,
    description: '',
    descriptionFile: null,
    assignedHR: '',
  });
  const [hrUsers, setHrUsers] = useState([]); // State to hold HR users
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [parsedJobs, setParsedJobs] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [jobDetails, setJobDetails] = useState(null);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [openJobModal, setOpenJobModal] = useState(false);
  const [companyNames, setCompanyNames] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');



  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/allType/industries'); // ✅ correct route
        setIndustryOptions(res.data);
      } catch (err) {
        console.error('Error fetching industries:', err);
      }
    };

    fetchIndustries();
  }, []);

  useEffect(() => {
    const fetchCompanyNames = async () => {
      try {
        const res = await axios.get('http://localhost:5000/api/allType/company-names');
        setCompanyNames(res.data);
      } catch (err) {
        console.error('Error fetching company names:', err);
      }
    };
    fetchCompanyNames();
  }, []);

  const handleCompanyChange = (event) => {
    const {
      target: { value },
    } = event;
    setSelectedCompanies(
      // On autofill we get a stringified value
      typeof value === 'string' ? value.split(',') : value,
    );
  };

  const resetCompanies = () => {
    setSelectedCompanies([]);
  };



  const filteredSales = selectedCompanies.length > 0
    ? sales.filter((sale) => selectedCompanies.includes(sale.companyName))
    : sales;


  const handleRowClick = async (params) => {
    const jobId = params.row._id; // Assuming _id is present in your row

    try {
      const res = await axios.get(`http://localhost:5000/api/report/job-report/${jobId}`);
      setJobDetails(res.data);
      setOpenJobModal(true);
    } catch (err) {
      console.error("Failed to fetch job report details", err);
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




  const filterByDate = () => {
    if (!startDate || !endDate) return;

    const filtered = sales.filter((sale) => {
      if (!sale.createdAt) return false;
      return (
        dayjs(sale.createdAt).isAfter(dayjs(startDate).startOf('day').subtract(1, 'second')) &&
        dayjs(sale.createdAt).isBefore(dayjs(endDate).endOf('day').add(1, 'second'))
      );
    });

    setSales(filtered);
  };



  useEffect(() => {
    const checkAuthAndFetchData = async () => {
      try {
        const token = sessionStorage.getItem('token');
        const expirationTime = sessionStorage.getItem('tokenExpiration');

        if (!token || !expirationTime) {
          console.error('No authentication token found');
          navigate('/login');
          return;
        }

        const currentTime = new Date().getTime();
        if (currentTime >= parseInt(expirationTime)) {
          // Token is expired, try to refresh it
          try {
            const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh-token', {}, {
              headers: { Authorization: `Bearer ${token}` }
            });

            if (refreshResponse.data.token) {
              // Update token and expiration
              const newExpirationTime = new Date().getTime() + 10 * 60 * 60 * 1000; // 10 hours
              sessionStorage.setItem('token', refreshResponse.data.token);
              sessionStorage.setItem('tokenExpiration', newExpirationTime.toString());
              console.log('Token refreshed, new expiration time:', newExpirationTime);
            } else {
              throw new Error('Failed to refresh token');
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('tokenExpiration');
            sessionStorage.removeItem('role');
            navigate('/login');
            return;
          }
        }

        await getSales();
        await getHRUsers();
      } catch (error) {
        console.error('Error in initial data fetch:', error);
        if (error.message === 'Token expired' || error.message === 'Authentication required') {
          navigate('/login');
        }
      }
    };

    checkAuthAndFetchData();

    // Set up periodic refresh every 5 minutes
    const refreshInterval = setInterval(checkAuthAndFetchData, 5 * 60 * 1000);

    return () => clearInterval(refreshInterval);
  }, [navigate]);

  const getSales = async () => {
    try {
      const response = await fetchAllSales();

      if (!Array.isArray(response)) {
        throw new Error('Invalid response format from server');
      }

      const validSales = response.map(sale => ({
        ...sale,
        id: sale._id,
        createdAt: sale.createdAt ? dayjs(sale.createdAt) : null
      }));

      setSales(validSales);
      setError(null);
    } catch (error) {
      console.error('Error fetching sales data:', error);
      setError(error.message);
      if (error.message === 'Token expired' || error.message === 'Authentication required') {
        navigate('/login');
      }
    }
  };

  useEffect(() => {
    console.log('Current sales state:', sales); // Debug log for sales state
  }, [sales]);

  const getHRUsers = async () => {
    try {
      const response = await fetchHRUsers(); // Fetch HR users
      setHrUsers(response.data);
    } catch (error) {
      console.error('Error fetching HR users:', error);
    }
  };


  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws);

      // Store parsed data and file name in state
      setParsedJobs(data);
      setUploadedFileName(file.name);
      setImportModalOpen(true); // Show confirmation modal
    };

    reader.readAsBinaryString(file);
  };
  const handleConfirmImport = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const response = await fetch('http://localhost:5000/api/allType/import', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobs: parsedJobs }),
      });

      if (response.ok) {
        getSales();
        alert('Jobs imported successfully!');
        setImportModalOpen(false);
      } else {
        alert('Failed to import jobs.');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      alert('An error occurred while importing jobs.');
    }
  };



  const handleChange = (e) => {
    const { name, value } = e.target;
    const updatedForm = { ...formData, [name]: value };
    setFormData(updatedForm);
  };



  //   const handleSubmit = async (e) => {
  //   e.preventDefault();
  //   setLoading(true);
  //   setSuccessMessage('');

  //   try {
  //     const form = new FormData();

  //     Object.entries(formData).forEach(([key, value]) => {
  //   if (key === 'description') return;
  //   if (key === 'assignedHR' && !value) return;

  //   // ✅ FIX for assignedHR
  //   if (key === 'assignedHR' && typeof value === 'object' && value._id) {
  //     form.append('assignedHR', value._id);
  //   }

  //   // ✅ FIX for createdBy
  //   else if (key === 'createdBy' && typeof value === 'object' && value._id) {
  //     form.append('createdBy', value._id);
  //   } else {
  //     form.append(key, value);
  //   }
  // });

  //     if (formData.description) {
  //       form.append('pdfFile', formData.description);
  //     }

  //     if (editMode) {
  //       await updateSale(selectedId, form, true);
  //       setSuccessMessage('Update Successful!');
  //     } else {
  //       await createSale(form, true);
  //       setSuccessMessage('Create Successful!');
  //     }

  //     // Reset
  //     setFormData({
  //       industries: '',
  //       companyName: '',
  //       companyAddress: '',
  //       contactName: '',
  //       email: '',
  //       phoneNumber: '',
  //       jobTitle: '',
  //       benefits: '',
  //       numberOfRequirements: '',
  //       keyResponsibility: '',
  //       requiredSkills: '',
  //       education: '',
  //       experience: '',
  //       salary: '',
  //       jobLocation: '',
  //       description: '',
  //       assignedHR: '',
  //     });

  //     getSales();

  //     // Delay closing modal to show success
  //     setTimeout(() => {
  //       setOpen(false);
  //       setSuccessMessage('');
  //     }, 1500);

  //   } catch (error) {
  //     console.error('Error saving sale:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

 const handleSubmit = async (e) => {
  e.preventDefault();
  setLoading(true);
  setSuccessMessage('');

  try {
    const form = new FormData();

    Object.entries(formData).forEach(([key, value]) => {
      if (key === 'description' || key === 'descriptionFile' || key === 'agreementSigned') return;

      // Handle assignedHR field
      if (key === 'assignedHR') {
        if (value === '' || value === null || value === 'null') {
          // Don't append assignedHR if it's empty/null
          return;
        }
        form.append('assignedHR', value._id || value);
      } else if (key === 'createdBy' && value && typeof value === 'object' && value._id) {
        form.append('createdBy', value._id);
      } else {
        form.append(key, value);
      }
    });

    if (formData.agreementSigned) {
      form.append('agreementSigned', formData.agreementSigned);
    }

    if (formData.descriptionFile) {
      form.append('descriptionFile', formData.descriptionFile);
    } else if (formData.description) {
      form.append('description', formData.description);
    }

    if (editMode) {
      await updateSale(selectedId, form, true);
      setSuccessMessage('Update Successful!');
    } else {
      await createSale(form, true);
      setSuccessMessage('Create Successful!');
    }

    setFormData({
      industries: '',
      companyName: '',
      companyAddress: '',
      contactName: '',
      email: '',
      phoneNumber: '',
      jobTitle: '',
      benefits: '',
      numberOfRequirements: '',
      keyResponsibility: '',
      requiredSkills: '',
      education: '',
      experience: '',
      salary: '',
      jobLocation: '',
      description: '',
      descriptionFile: '',
      agreementSigned: '',
      assignedHR: '', // Reset to empty string
    });

    getSales();

    setTimeout(() => {
      setOpen(false);
      setSuccessMessage('');
    }, 1500);
  } catch (error) {
    console.error('Error saving sale:', error);
  } finally {
    setLoading(false);
  }
};






  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this job?');

    if (!confirmDelete) return; // If user clicks "No", stop here

    try {
      await deleteSale(id);
      getSales(); // Refresh the data
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };







  const handleEdit = (sale) => {
    setFormData(sale);
    setSelectedId(sale._id);
    setEditMode(true);
    setOpen(true);
  };


  const handleClose = () => {
    setFormData({
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
      assignedHR: '',
    });
    setOpen(false); // close modal
    setEditMode(false);
    setSelectedId(null);
  };


  // const handleExport = () => {
  //   const worksheet = XLSX.utils.json_to_sheet(sales);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesData');
  //   XLSX.writeFile(workbook, 'SalesData.xlsx');
  // };

  const handleExportData = async () => {
    console.log("Export button clicked ✅");
    let apiData = null;

    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }

      console.log('Making API call to export data...');
      const response = await fetch('http://localhost:5000/api/allType/export-data', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });

      console.log('API Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      apiData = await response.json();
      console.log('Received data from API:', apiData);

      if (!Array.isArray(apiData) || apiData.length === 0) {
        throw new Error('No data received from server or invalid data format');
      }

    } catch (error) {
      console.error('Export Error:', error);
      alert(`Failed to export data: ${error.message}`);
      return; // Exit if API call fails
    }

    // Only proceed with Excel creation if we have valid data from API
    try {
      const formattedData = apiData.map(job => ({
        Industries: job.industries || '',
        Company_Name: job.companyName || '',
        Company_ID: job.companyId || '',
        Company_Address: job.companyAddress || '',
        Contact_Name: job.contactName || '',
        Email: job.email || '',
        Phone_Number: job.phoneNumber || '',
        Response: job.response || '',
        Job_Title: job.jobTitle || '',
        Benefits: job.benefits || '',
        No_of_Requirements: job.numberOfRequirements || '',
        Website_URL: job.websiteURL || '',
        Key_Responsibility: job.keyResponsibility || '',
        Required_Skills: job.requiredSkills || '',
        Education: job.education || '',
        Experience: job.experience || '',
        Salary: job.salary || '',
        Job_Location: job.jobLocation || '',
        Remarks: job.remarks || '',
        Description: job.description || '',
        Assigned_HR: job.assignedHR
          ? `${job.assignedHR.firstName || ''} ${job.assignedHR.lastName || ''}`
          : 'Not Assigned',
        Created_By: job.createdBy
          ? `${job.createdBy.firstName || ''} ${job.createdBy.lastName || ''} ${job.createdBy.role || ''}`
          : 'N/A',
        Created_At: job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'
      }));

      if (formattedData.length === 0) {
        throw new Error('No data available to export');
      }

      console.log('Creating Excel file with formatted data...');
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'JobData');
      
      // Generate filename with current date
      const date = new Date().toISOString().split('T')[0];
      const filename = `JobOpeningsExport_${date}.xlsx`;
      
      console.log('Exporting file:', filename);
      XLSX.writeFile(workbook, filename);
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Excel Creation Error:', error);
      alert(`Failed to create Excel file: ${error.message}`);
    }
  };

  const columns = [

    {
      field: 'actions',
      headerName: 'Actions',
      width: 110,
      renderCell: (params) => (
        <>
          <Button
            onClick={(e) => {
              e.stopPropagation();  // Prevent row click from triggering
              handleEdit(params.row);
            }}

            variant="contained"
            color="primary"
            size="small"
          >
            Edit
          </Button>
          {/* <Button
            onClick={(e) => {
              e.stopPropagation();  // Prevent row click from triggering
              handleDelete(params.row._id);
            }}
            variant="contained"
            color="secondary"
            size="small"
            style={{ marginLeft: 8 }}
          >
            Delete
          </Button> */}
        </>
      ),
    },
    {
      field: 'assignedHR',
      headerName: 'Assigned HR',
      width: 150,

      renderCell: (params) => {
        if (!params.row) return 'Not Assigned';
        const assignedHR = params.row.assignedHR;
        if (assignedHR && typeof assignedHR === 'object') {
          const fullName = `${assignedHR.firstName || ''} ${assignedHR.lastName || ''}`.trim();
          return <span>{fullName || 'Not Assigned'}</span>;
        }
        return <span>Not Assigned</span>;
      }
    },
       {
      field: 'createdBy',
      headerName: 'Created By',
      width: 200,
      renderCell: (params) => {
        const createdBy = params.row.createdBy;
        if (!createdBy) return <span>Unknown</span>;

        const name = `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim();
        const role = createdBy.role || '';

        return <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>{name} ({role})</span>;
      }
    },
     {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      renderCell: (params) =>
        params.value ? dayjs(params.value).format("DD/MM/YYYY hh:mm A") : ""
    },

  
 
    { field: 'industries', headerName: 'Industries', width: 180 },

  { field: 'companyName', headerName: 'Company Name', width: 180 },
    { field: 'companyId', headerName: 'Comapany ID', width: 180 },

  { field: 'companyAddress', headerName: 'Company Address', width: 180 },
  { field: 'contactName', headerName: 'Contact Name', width: 150 },
  { field: 'email', headerName: 'Email', width: 180 },
  { field: 'phoneNumber', headerName: 'Phone Number', width: 150 },
  { field: 'jobTitle', headerName: 'Job Title', width: 150 },
  { field: 'numberOfRequirements', headerName: 'No. of Requirements', width: 170 },
  { field: 'keyResponsibility', headerName: 'Key Responsibility', width: 200 },
  { field: 'requiredSkills', headerName: 'Required Skills', width: 200 },
  { field: 'education', headerName: 'Education', width: 150 },
  { field: 'experience', headerName: 'Experience', width: 150 },
  { field: 'salary', headerName: 'Salary', width: 150 },
  { field: 'jobLocation', headerName: 'Job Location', width: 150 },

 // 📄 Description File
{
  field: 'descriptionFile',
  headerName: 'Description',
  width: 250,
  renderCell: (params) => {
    if (params.row.descriptionFile) {
      return (
        <a
          href={params.row.descriptionFile}
          target="_blank"
          rel="noopener noreferrer"
          onClick={(e) => e.stopPropagation()}
          style={{ color: '#1976d2', textDecoration: 'underline' }}
        >
          View PDF
        </a>
      );
    } else {
      return <span>{params.row.description || 'N/A'}</span>;
    }
  },
},

// 📝 Agreement PDF
{
  field: 'agreementSigned',
  headerName: 'Agreement',
  width: 150,
  renderCell: (params) =>
    params.value ? (
      <a
        href={params.value}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ color: '#1976d2', textDecoration: 'underline' }}
      >
        View PDF
      </a>
    ) : (
      'N/A'
    ),
},

// 🌐 Website URL
{
  field: 'websiteURL',
  headerName: 'Website',
  width: 200,
  renderCell: (params) =>
    params.value ? (
      <a
        href={params.value.startsWith('http') ? params.value : `https://${params.value}`}
        target="_blank"
        rel="noopener noreferrer"
        onClick={(e) => e.stopPropagation()}
        style={{ color: '#1976d2', textDecoration: 'underline' }}
      >
        {params.value}
      </a>
    ) : (
      'N/A'
    ),
},


   

    {
      field: 'remove',
      headerName: 'Remove',
      width: 100,
      renderCell: (params) => (
        <>

          <Button
            onClick={(e) => {
              e.stopPropagation();  // Prevent row click from triggering
              handleDelete(params.row._id);
            }}
            variant="contained"
            color="secondary"
            size="small"
            style={{ marginLeft: 8 }}
          >
            Delete
          </Button>
        </>
      ),
    },


  ];

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar is fixed */}
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
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
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
            Job Openning Report
          </Typography>

          <Box display="flex" flexWrap="wrap" alignItems="center" gap={2} mb={3}>
            {/* Start Date */}
            <TextField
              label="Start Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              size="small"
            />

            {/* End Date */}
            <TextField
              label="End Date"
              type="date"
              InputLabelProps={{ shrink: true }}
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              size="small"
            />

            {/* Filter Button */}
            <Button
              variant="contained"
              onClick={() => filterByDate()}
              sx={{ bgcolor: '#1976d2', color: '#fff', height: '40px' }}
            >
              Filter
            </Button>

            {/* Reset Button */}
            <Button
              variant="outlined"
              onClick={() => {
                setStartDate('');
                setEndDate('');
                getSales(); // Reset to original data
              }}
              sx={{ height: '40px' }}
            >
              Reset
            </Button>

            {/* Company Filter */}
            {/* <FormControl sx={{ minWidth: 200 }}>
  <InputLabel sx={{ fontWeight: 500 }}>Select Company</InputLabel>
  <Select
    value={selectedCompany}
    onChange={(e) => setSelectedCompany(e.target.value)}
    label="Select Company"
    size="small"
    sx={{
      backgroundColor: '#fff',
      borderRadius: '8px',
      textAlign: 'center', // Centers the selected value
      '& .MuiSelect-select': {
        textAlign: 'center', // Ensures value inside is centered
      },
      '& .MuiOutlinedInput-notchedOutline': {
        borderColor: '#ccc',
      },
      '&:hover .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1976d2',
      },
      '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
        borderColor: '#1976d2',
      },
    }}
  >
    <MenuItem value="" sx={{ justifyContent: 'center' }}>All Companies</MenuItem>
    {companyNames.map((company, index) => (
      <MenuItem key={index} value={company} sx={{ justifyContent: 'center' }}>
        {company}
      </MenuItem>
    ))}
  </Select>
</FormControl> */}

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <FormControl size="small" sx={{ minWidth: 250 }}>
                <InputLabel id="select-company-label">Select Company</InputLabel>
                <Select
                  labelId="select-company-label"
                  multiple
                  value={selectedCompanies}
                  onChange={handleCompanyChange}
                  renderValue={(selected) => selected.join(', ')}
                  label="Select Company"
                  sx={{
                    backgroundColor: '#fff',
                    borderRadius: 2,
                    fontWeight: 500,
                    fontSize: '0.875rem',
                    '& .MuiSelect-select': {
                      paddingY: 1,
                      paddingX: 2,
                      textAlign: 'left',
                    },
                    '& .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#d0d0d0',
                    },
                    '&:hover .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                    },
                    '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                      borderColor: '#1976d2',
                      boxShadow: '0 0 0 2px rgba(25, 118, 210, 0.1)',
                    },
                  }}
                >
                  <MenuItem value="">
                    <em>All Companies</em>
                  </MenuItem>
                  {companyNames.map((company) => (
                    <MenuItem key={company} value={company}>
                      <Checkbox checked={selectedCompanies.indexOf(company) > -1} />
                      <ListItemText primary={company} />
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              {selectedCompanies.length > 0 && (
                <Button variant="outlined" color="secondary" onClick={resetCompanies} sx={{ height: '40px', textTransform: 'none' }}>
                  Reset
                </Button>
              )}
            </Box>
          </Box>

          <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)}>


            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 400,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                textAlign: 'center',
              }}
            >
              <Typography variant="h6" gutterBottom>
                Confirm Import
              </Typography>
              <Typography variant="body1" gutterBottom>
                File: <strong>{uploadedFileName}</strong>
              </Typography>
              <Typography variant="body2" gutterBottom>
                Are you sure you want to import this data?
              </Typography>
              <Box mt={3} display="flex" justifyContent="space-between">
                <Button variant="outlined" onClick={() => setImportModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="contained" color="success" onClick={handleConfirmImport}>
                  Submit
                </Button>
              </Box>
            </Box>
          </Modal>




          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(true)}
            >
              Post New Opening
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleExportData}
            >
              Export to Excel
            </Button>
            <input
              type="file"
              accept=".xlsx, .xls"
              onChange={handleFileUpload}
              style={{ display: 'none' }}
              id="upload-excel"
            />
            <label htmlFor="upload-excel">
              <Button variant="contained" color="success" component="span">
                Import Excel
              </Button>
            </label>


          </Box>
          <Box sx={{ height: '600px', width: '100%', overflowY: 'auto', mt: 1 }}>
            <DataGrid
              rows={filteredSales}
              columns={columns}
              onRowClick={handleRowClick}
              components={{ Toolbar: GridToolbar }}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              checkboxSelection
            />
          </Box>

          <Modal open={openJobModal} onClose={() => setOpenJobModal(false)}>
            <Box
              sx={{
                bgcolor: "background.paper",
                boxShadow: 24,
                borderRadius: 2,
                maxWidth: "95vw",
                maxHeight: "90vh",
                mx: "auto",
                mt: 8,
                p: { xs: 2, sm: 3, md: 4 },
                overflow: "auto",
              }}
            >
              {/* Header Info */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="h5" fontWeight={600} gutterBottom>
                  Company Name: {jobDetails?.job?.companyName}
                </Typography>
                <Typography variant="h6" gutterBottom>
                  Job Title: {jobDetails?.job?.jobTitle}
                </Typography>
                <Typography variant="subtitle1" gutterBottom>
                  Assigned HR: {jobDetails?.job?.assignedHR?.firstName} {jobDetails?.job?.assignedHR?.lastName}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Job Start: {jobDetails?.job?.startDate ? new Date(jobDetails.job.startDate).toLocaleString() : "N/A"}
                </Typography>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Job End: {jobDetails?.job?.endDate ? new Date(jobDetails.job.endDate).toLocaleString() : "N/A"}
                </Typography>
              </Box>

              {/* Table */}
              <Box sx={{ overflowX: "auto" }}>
                <Table stickyHeader size="small">
                  <TableHead sx={{ backgroundColor: "#f5f5f5" }}>
                    <TableRow>
                      <TableCell>Name</TableCell>
                      <TableCell>Email</TableCell>
                      <TableCell>Mobile</TableCell>
                      <TableCell>Qualification</TableCell>
                      <TableCell>Remark</TableCell>
                      <TableCell>Resume</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Interview</TableCell>
                      <TableCell>Placement</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {jobDetails?.candidates?.map((c) => (
                      <TableRow key={c._id}>
                        <TableCell>{c.candidateName}</TableCell>
                        <TableCell>{c.candidateEmail}</TableCell>
                        <TableCell>{c.candidatePhone}</TableCell>
                        <TableCell>{c.qualification}</TableCell>
                        <TableCell>{c.remark}</TableCell>
                        <TableCell>
                          {c.resumeLink && c.resumeLink !== "No Resume" ? (
                            <Button
                              variant="outlined"
                              size="small"
                              onClick={() =>
                                window.open(`http://localhost:5000${c.resumeLink}`, "_blank")
                              }
                            >
                              View
                            </Button>
                          ) : (
                            <Typography variant="body2" color="text.secondary">N/A</Typography>
                          )}
                        </TableCell>
                        <TableCell>{c.lineupStatus}</TableCell>
                        <TableCell>{c.interviewDate?.substring(0, 10)}</TableCell>
                        <TableCell>{c.placementStatus}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </Box>
            </Box>
          </Modal>


          <Modal
            open={open}
            onClose={null} // disable backdrop click close
            disableEscapeKeyDown // disable escape key close
            aria-labelledby="job-form-modal"
          >
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 1600,
                maxHeight: '95vh', // increased height to avoid scroll
                bgcolor: 'background.paper',
                p: 4,
                borderRadius: 3,
                boxShadow: '0 10px 30px rgba(0,0,0,0.15)',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'hidden', // disable scroll on modal container
              }}
            >
              <Typography variant="h5" fontFamily="Lora" mb={3}>
                {editMode ? 'Edit Job Opening' : 'Add New Job'}
              </Typography>

              <Grid container spacing={3} sx={{ flexGrow: 1, overflowY: 'auto', pr: 2 }}>
                {/* Left Column */}
                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <Autocomplete
                    freeSolo
                    options={industryOptions}
                    value={formData.industries}
                    onChange={(event, newValue) => {
                      setFormData({ ...formData, industries: newValue || '' });
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Industries"
                        name="industries"
                        value={formData.industries}
                        onChange={(e) =>
                          setFormData({ ...formData, industries: e.target.value })
                        }
                        fullWidth
                      />
                    )}
                  />

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
                        // Auto-fill form fields with company data
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

                  <TextField
                    label="Company Address"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Contact Person Name"
                    name="contactName"
                    value={formData.contactName}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Phone Number"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Response"
                    name="response"
                    value={formData.response}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Job Title"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Benefits"
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    fullWidth
                  />

                  {/* Moved Description Input here */}
                  <Box>
                    <Typography mb={1}>Job Description (Text or PDF):</Typography>

                    {/* Text Description */}
                    <TextField
                      label="Description (Text)"
                      name="description"
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({ ...formData, description: e.target.value, descriptionFile: null })
                      }
                      multiline
                      rows={4}
                      fullWidth
                      disabled={!!formData.descriptionFile}
                    />

                    {/* File Upload */}
                    <Button
                      variant="outlined"
                      component="label"
                      startIcon={<UploadFileIcon />}
                      sx={{ mt: 1 }}
                      disabled={!!formData.description}
                    >
                      Upload PDF
                      <input
                        type="file"
                        hidden
                        accept=".pdf,.doc,.docx"
                        onChange={(e) =>
                          setFormData({ ...formData, descriptionFile: e.target.files[0], description: '' })
                        }
                      />
                    </Button>
                    {formData.descriptionFile && (
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        {formData.descriptionFile.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>

                {/* Right Column */}
                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Number of Openings"
                    name="numberOfRequirements"
                    type="number"
                    value={formData.numberOfRequirements}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Wesite URL"
                    name="websiteURL"
                    value={formData.websiteURL}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Key Responsibilities"
                    name="keyResponsibility"
                    value={formData.keyResponsibility}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Required Skills"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Education"
                    name="education"
                    value={formData.education}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Experience"
                    name="experience"
                    value={formData.experience}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Salary"
                    name="salary"
                    value={formData.salary}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Job Location"
                    name="jobLocation"
                    value={formData.jobLocation}
                    onChange={handleChange}
                    fullWidth
                  />

                  {/* Agreement PDF Upload */}
                  <Box>
                    <Typography mb={1}>Upload Agreement (PDF):</Typography>
                    <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                      Upload Agreement
                      <input
                        type="file"
                        hidden
                        accept=".pdf"
                        onChange={(e) => setFormData({ ...formData, agreementSigned: e.target.files[0] })}
                      />
                    </Button>
                    {formData.agreementSigned && (
                      <Typography variant="body2" color="textSecondary" mt={1}>
                        {formData.agreementSigned.name}
                      </Typography>
                    )}
                  </Box>
                </Grid>
              </Grid>

              {/* Bottom Section: HR Select & Buttons */}
              <Box
                sx={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  mt: 4,
                  gap: 2,
                }}
              >
                <FormControl sx={{ minWidth: 300 }}>
                  <InputLabel id="hr-select-label">Assign HR</InputLabel>
                  <Select
                    labelId="hr-select-label"
                    name="assignedHR"
                    value={formData.assignedHR}
                    onChange={handleChange}
                    label="Assign HR"
                  >
                    {hrUsers.map((hr) => (
                      <MenuItem key={hr._id} value={hr._id}>
                        {hr.firstName} {hr.lastName}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                {loading && <LinearProgress sx={{ my: 2 }} />}

                {successMessage && (
                  <Box display="flex" alignItems="center" gap={1} my={2}>
                    <CheckCircleIcon color="success" />
                    <Typography variant="body1" color="green">
                      {successMessage}
                    </Typography>
                  </Box>
                )}

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Button variant="outlined" color="error" onClick={handleClose}>
                    Close
                  </Button>

                  <Button type="submit" variant="contained" color="primary" disabled={loading}>
                    {loading ? (editMode ? 'Updating...' : 'Creating...') : editMode ? 'Update Job Opening' : 'Add Job Opening'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Modal>


        </Box>
      </Box>
    </div>
  );
};

export default JobReport;
