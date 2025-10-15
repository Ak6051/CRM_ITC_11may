import React, { useState, useEffect, useRef } from 'react';
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
  Snackbar,
  Alert,  
  Tooltip,
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
import DeleteIcon from '@mui/icons-material/Delete';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { Autocomplete } from '@mui/material';
import axios from 'axios';
import { API_BASE_URL, SOCKET_URL } from '../../config/api.config';
import { debounce } from 'lodash';
import { io } from 'socket.io-client';


import {
  createMySale,
  fetchMySales,
  updateMySale,
} from '../../utils/salesPanelService';

const JobOpeningsDashboard = () => {
  const [salesMessages, setSalesMessages] = useState([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [importProgress, setImportProgress] = useState(0);
  const [isImporting, setIsImporting] = useState(false);


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
    jobTiming:'',
    gender:'',
    remarks: '',
    agreementSigned: null,
    //description: '',
    descriptionFile: null,
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
  const [openReschedule, setOpenReschedule] = useState(false);
  const [validationErrors, setValidationErrors] = useState({
    email: '',
    phoneNumber: ''
  });
const [selectedSale, setSelectedSale] = useState(null);
const [rescheduleDate, setRescheduleDate] = useState('');
const [rescheduleReason, setRescheduleReason] = useState('');

const [reminderMessage, setReminderMessage] = useState('');
const [reminderDate, setReminderDate] = useState(null);
const [reminderList, setReminderList] = useState([]);
const [openSnackbar, setOpenSnackbar] = useState(false);
const [snackbarMessage, setSnackbarMessage] = useState('');
  const [fileError, setFileError] = useState('');

  const shownReminders = useRef(new Set());

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    const userId = sessionStorage.getItem('userId');
    if (!token || !userId) return;

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
      withCredentials: true,
      auth: { token },
    });

    socketInstance.on('connect', () => {
      console.log('🟢 Socket connected to reminder system');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    socketInstance.on('initial-reminders', (data) => {
      console.log("🔔 Received reminders:", data);
      if (!data || data.length === 0) return;

      data.forEach(reminder => {
        const reminderKey = `reminder-${reminder._id}`;
        if (shownReminders.current.has(reminderKey)) return;

        shownReminders.current.add(reminderKey);

        toast.info(
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            <strong>📌 {reminder.message}</strong>
            <div style={{ fontSize: '12px', color: '#666' }}>
              📅 Due: {new Date(reminder.remindAt).toLocaleString()}
            </div>
          </div>,
          {
            position: 'bottom-right',
            autoClose: 6000,
            style: {
              background: '#e3f2fd',
              borderLeft: '5px solid #1976d2',
              color: '#333',
              borderRadius: '8px',
            },
            icon: false,
          }
        );

        // Remove from shown after 1 minute so it can re-show next minute
        setTimeout(() => {
          shownReminders.current.delete(reminderKey);
        }, 60000);
      });
    });

    return () => {
      socketInstance.disconnect();
      socketInstance.off('initial-reminders');
    };
  }, []);




const handleCloseSnackbar = (event, reason) => {
  if (reason === 'clickaway') return;
  setOpenSnackbar(false);
};

const handleOpenRescheduleDialog = (row) => {
  setSelectedSale(row);
  setOpenReschedule(true);
};

const handleSubmitReschedule = async () => {
  try {
    const token = sessionStorage.getItem('token'); // Get token from sessionStorage

    await axios.post(
      `${API_BASE_URL}/panel/reschedule`,
      {
        salesId: selectedSale._id,
        newDate: rescheduleDate,
        reason: rescheduleReason
      },
      {
        headers: {
          Authorization: `Bearer ${token}`, // Add token in Authorization header
        }
      }
    );

    toast.success('Meeting Rescheduled!');
    setOpenReschedule(false);
    getJobData(); // re-fetch the updated list
  } catch (err) {
    console.error(err);
    toast.error('Failed to reschedule');
  }
};







  useEffect(() => {
    getJobData();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this job opening? This action cannot be undone.')) {
      try {
        const token = sessionStorage.getItem('token');
        const response = await fetch(`${API_BASE_URL}/panel/delete-sale/${id}`, {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to delete job opening');
        }

        // Refresh the job data after successful deletion
        await getJobData();
        toast.success('Job opening deleted successfully');
      } catch (error) {
        console.error('Error deleting job opening:', error);
        toast.error(error.message || 'Error deleting job opening');
      }
    }
  };

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
      const res = await axios.get(`${API_BASE_URL}/allType/companies?query=${input}`);
      setCompanyOptions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions', err);
    }
  }, 300);

  const validateFileSize = (file) => {
    const maxSizeMB = 1;
    const maxSizeBytes = maxSizeMB * 1024 * 1024; // 1MB in bytes
    
    if (file.size > maxSizeBytes) {
      setFileError(`File size exceeds ${maxSizeMB}MB`);
      toast.error(`File size should not exceed ${maxSizeMB}MB`);
      return false;
    }
    setFileError('');
    return true;
  };

  const handleFileUploadForDescription = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (validateFileSize(file)) {
        setFormData({ ...formData, description: file });
      } else {
        e.target.value = ''; // Reset the file input
      }
    }
  };




  const resetConversionStates = () => {
    setProgress(0);
    setDone(false);
    setError(false);
  };

  // const handleConfirmConvert = async () => {
  //   setProgress(20); // Start fake progress
  //   setError(false);
  //   setDone(false);

  //   const token = sessionStorage.getItem('token');

  //   const descriptionContent =
  //     selectedConvertRow.descriptionFile &&
  //       selectedConvertRow.descriptionFile.toLowerCase().endsWith('.pdf')
  //       ? selectedConvertRow.descriptionFile
  //       : selectedConvertRow.description || '';

  //   const conversionData = {
  //     ...selectedConvertRow,
  //     _id: selectedConvertRow._id, // original job ID
  //     convertedAt: new Date().toISOString(),
  //     description: descriptionContent,
  //     companyId: selectedConvertRow.companyId, // 
  //   };



  //   try {
  //     const response = await fetch(`${API_BASE_URL}/panel/sales-convert`, {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //         'Authorization': `Bearer ${token}`,
  //       },
  //       body: JSON.stringify(conversionData),
  //     });

  //     setProgress(70); // Simulate mid progress

  //     if (!response.ok) {
  //       const errorData = await response.json();
  //       toast.error(errorData.message || 'Conversion failed');
  //       setError(true);
  //       setVerifyModalOpen(false);
  //       resetConversionStates();
  //       return;
  //     }

  //     const result = await response.json();
  //     toast.success('Conversion successful!');
  //     setProgress(100);
  //     setDone(true);

  //     setTimeout(() => {
  //       setVerifyModalOpen(false);
  //       resetConversionStates();
  //     }, 2000);
  //   } catch (err) {
  //     console.error('Error converting job:', err);
  //     toast.error('Something went wrong');
  //     setError(true);
  //     setVerifyModalOpen(false);
  //     resetConversionStates();
  //   }
  // };

  const handleConfirmConvert = async () => {
    setProgress(20); // Start fake progress
    setError(false);
    setDone(false);
  
    const token = sessionStorage.getItem('token');
  
    const conversionData = {
      ...selectedConvertRow,
      _id: selectedConvertRow._id,
      convertedAt: new Date().toISOString(),
      // description: selectedConvertRow.description || '',
      descriptionFile: selectedConvertRow.descriptionFile || '',
      companyId: selectedConvertRow.companyId,
    };
  
    try {
      const response = await fetch(`${API_BASE_URL}/panel/sales-convert`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify(conversionData),
      });
  
      setProgress(70);
  
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
        jobTiming:data?.jobTiming||'',
        gender:data?.gender||'',
        remarks: data?.remarks || '',
        agreementSigned: data?.agreementSigned || '',
        //description: data?.description || '',
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
        //description: '',
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
      jobTiming:'',
      gender:'',
      remarks: '',
      agreementSigned: null,
      //description: '',
      descriptionFile: null,
    });
    setSelectedId(null);
  };


  // Validation functions
  const validateEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // const validatePhoneNumber = (phone) => {
  //   const phoneRegex = /^\d{10}$/;
  //   return phoneRegex.test(phone);
  // };

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'date') {
      const isValid = /^(\d{2})-(\d{2})-(\d{4})$/.test(value);
      if (!isValid && value !== '') {
        // You can show an error message or prevent updating formData
        // For now, just update anyway
      }
    }

    const errors = { ...validationErrors };
    
    // Validate email format
    if (name === 'email' && value) {
      if (!validateEmail(value)) {
        errors.email = 'Please enter a valid email address';
      } else {
        delete errors.email;
      }
    }
    
    // // Validate phone number format
    // if (name === 'phoneNumber' && value) {
    //   if (!validatePhoneNumber(value)) {
    //     errors.phoneNumber = 'Phone number must be 10 digits';
    //   } else {
    //     delete errors.phoneNumber;
    //   }
    // }
    
    setValidationErrors(errors);
    setFormData((prev) => ({ ...prev, [name]: value }));
  };


  const formatReminderText = (message, date) => {
    const formattedDate = dayjs(date).format('DD-MM-YYYY');
    return `reminder: ${message} on ${formattedDate}`;
  };

  const validateForm = () => {
    const errors = {};
    let isValid = true;

    // Validate email if provided
    if (formData.email && formData.email.trim() !== '') {
      if (!validateEmail(formData.email)) {
        errors.email = 'Please enter a valid email address';
        isValid = false;
      }
    }

    // Validate phone number if provided
    // if (formData.phoneNumber && formData.phoneNumber.trim() !== '') {
    //   if (!validatePhoneNumber(formData.phoneNumber)) {
    //     errors.phoneNumber = 'Phone number must be 10 digits';
    //     isValid = false;
    //   }
    // }

    setValidationErrors(errors);
    return isValid;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    // Validate form
    if (!validateForm()) {
      setLoading(false);
      return;
    }

    const data = new FormData();
    
    if (reminderMessage && reminderDate) {
      const reminderText = formatReminderText(reminderMessage, reminderDate);
      console.log('Setting reminder:', reminderText); // Debug log
      data.append('remarks', reminderText);
    } else {
      data.append('remarks', formData.remarks);
    }

    // Debug log for form data
    for (let pair of data.entries()) {
      console.log(pair[0] + ': ' + pair[1]);
    }

    for (let key in formData) {
      if (formData[key] !== null && formData[key] !== undefined && key !== 'remarks') {
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

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const bstr = evt.target.result;
      const wb = XLSX.read(bstr, { type: 'binary' });
      const wsname = wb.SheetNames[0];
      const ws = wb.Sheets[wsname];
      const data = XLSX.utils.sheet_to_json(ws, { raw: false }); // raw: false to parse dates automatically

      const formattedData = data.map(row => {
        // Agar date Excel serial number me hai, toh ise convert karen
        let dateValue = row['Date'];

        // Agar dateValue number type me hai, toh convert karen:
        if (typeof dateValue === 'number') {
          // Convert Excel date serial number to JS date
          const jsDate = XLSX.SSF.parse_date_code(dateValue);
          if (jsDate) {
            // Format date as yyyy-mm-dd ya apne hisaab se
            const formattedDate = `${jsDate.y}-${String(jsDate.m).padStart(2, '0')}-${String(jsDate.d).padStart(2, '0')}`;
            dateValue = formattedDate;
          }
        }
        return {
          ...row,
          Date: dateValue ? dateValue.toString() : ''
        };
      });

      setParsedJobs(formattedData);
      setUploadedFileName(file.name);
      setImportModalOpen(true);
    };

    reader.readAsBinaryString(file);
  };


  const handleConfirmImport = async () => {
    setIsImporting(true);
    setImportProgress(10);
    const toastId = toast.loading('Starting import process...');
    
    try {
      const token = sessionStorage.getItem('token');
      
      // Simulate progress
      const updateProgress = (progress) => {
        setImportProgress(progress);
        toast.update(toastId, {
          render: `Importing... ${progress}%`,
          isLoading: true,
          autoClose: false
        });
      };
      
      // Update progress every 500ms
      const progressInterval = setInterval(() => {
        setImportProgress(prev => {
          const newProgress = Math.min(prev + 5, 90); // Cap at 90% until complete
          updateProgress(newProgress);
          return newProgress;
        });
      }, 500);

      const response = await fetch(`${API_BASE_URL}/panel/sales-import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobs: parsedJobs }),
      });

      clearInterval(progressInterval);
      setImportProgress(100);
      
      if (response.ok) {
        await getJobData();
        toast.update(toastId, {
          render: 'Jobs imported successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 3000
        });
        setImportModalOpen(false);
      } else {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to import jobs');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.update(toastId, {
        render: `Import failed: ${err.message}`,
        type: 'error',
        isLoading: false,
        autoClose: 5000
      });
    } finally {
      setIsImporting(false);
      setImportProgress(0);
    }
  };

    const jobTemplateHeaders = [
      'companyName',
      'jobTitle',
      'numberOfRequirements',
      'salary',
      'jobTiming',
      'jobLocation',
      'education',
      'experience',
      'websiteURL',
      'industries',
      'phoneNumber',
      'response',
      'benefits',
      'contactName',
      'email',
      'companyAddress',
      'gender',
      'keyResponsibility',
      'requiredSkills',
      'remarks',
      // ⛔️ excluded: assignedHR, agreementSigned, descriptionFile, companyId
    ];
    
  
    const handleDownloadJobTemplate = () => {
      const worksheetData = [jobTemplateHeaders]; // Header row only
      const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'JobTemplate');
    
      XLSX.writeFile(workbook, 'job_import_template.xlsx');
    };
    


  const columns = [

    { field: 'createdAt', headerName: 'Created At', width: 180 },
    { field: 'industries', headerName: 'Industries', width: 160 },
    { field: 'companyId', headerName: 'Company ID', width: 160 },
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
   
    // 
    { field: 'jobTitle', headerName: 'Job Title', width: 180 },
    { field: 'benefits', headerName: 'Benefits', width: 180 },
    { field: 'keyResponsibility', headerName: 'Key Responsibility ', width: 200 },
    { field: 'requiredSkills', headerName: 'Required Skills ', width: 200 },
    { field: 'education', headerName: 'Education ', width: 160 },
    { field: 'experience', headerName: 'Experience ', width: 140 },
    { field: 'salary', headerName: 'Salary ', width: 140 },

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
      field: 'descriptionFile',
      headerName: 'Job Description (PDF)',
      width: 200,
      renderCell: (params) => {
        const fileUrl = params.row.descriptionFile;
        return fileUrl ? (
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ color: '#1976d2', textDecoration: 'underline' }}
          >
            View PDF
          </a>
        ) : (
          <span>No PDF available</span>
        );
      },
    },
    

    

    { field: 'jobLocation', headerName: 'Job Location', width: 160 },
    { field: 'jobTiming', headerName: 'Job Timing', width: 140 },
    { field: 'gender', headerName: 'Gender', width: 140 },
    { field: 'remarks', headerName: 'Remarks', width: 250 },
    {
      field: 'rescheduledDate',
      headerName: 'Rescheduled Date',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '—';
        const date = new Date(params.value);
        return date.toLocaleString(); 
      },
    },
    
        { field: 'rescheduleReason', headerName: 'Reschedule Reason', width: 200 },

    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <div style={{ display: 'flex', gap: '8px' }}>
          <Button 
            variant="outlined" 
            size="small" 
            onClick={(e) => {
              e.stopPropagation();
              handleOpen(params.row);
            }}
          >
            Edit
          </Button>
          <IconButton
            size="small"
            color="error"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.row._id);
            }}
            title="Delete"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </div>
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
    },

    {
      field: 'reschedule',
      headerName: 'Reschedule',
      width: 140,
      renderCell: (params) => (
        <Button
          variant="outlined"
          size="small"
          onClick={() => handleOpenRescheduleDialog(params.row)}
        >
          Reschedule
        </Button>
      )
    },
    
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
              {/* <Button variant="contained" color="success" onClick={exportToExcel}>
                Export to Excel
              </Button> */}
                  <Button variant="contained" component="label" sx={{ ml: 2 }}>
                              Import from Excel
                              <input hidden accept=".xlsx, .xls" type="file" onChange={handleFileUpload} />
                            </Button>

                               <Button
                              variant="outlined"
                              sx={{
                                minWidth: 180,
                                color: '#FF9800', // orange text
                                borderColor: '#FF9800',
                                ml:6,
                                '&:hover': {
                                  backgroundColor: '#FFF3E0', // light orange on hover
                                  borderColor: '#FB8C00',
                                  
                                },
                              }}
                              onClick={handleDownloadJobTemplate}
                            >
                              Download Template
                            </Button>

            </Box>

            <Box sx={{ height: 600, width: '100%', overflow: 'auto' }}>
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
                      { 
                        name: 'email', 
                        label: 'Email', 
                        type: 'email', 
                        error: !!validationErrors.email, 
                        helperText: validationErrors.email,
                        sx: { 
                          '& .MuiFormHelperText-root': {
                            color: 'error.main',
                            fontSize: '0.75rem',
                            marginLeft: 0,
                            marginTop: '3px'
                          }
                        }
                      },
                      { 
                        name: 'phoneNumber', 
                        label: 'Phone Number', 
                        // error: !!validationErrors.phoneNumber, 
                        // helperText: validationErrors.phoneNumber,
                        // sx: { 
                        //   '& .MuiFormHelperText-root': {
                        //     color: 'error.main',
                        //     fontSize: '0.75rem',
                        //     marginLeft: 0,
                        //     marginTop: '3px'
                        //   }
                        // }
                      },
                      { name: 'jobTitle', label: 'Job Title' },
                      { name: 'response', label: 'Response' },
                      { name: 'benefits', label: 'Benefits' },
                      { name: 'numberOfRequirements', label: 'Number of Requirements', type: 'number' },
                      { name: 'websiteURL', label: 'Website URL', type: 'url' },
                      { name: 'keyResponsibility', label: 'Key Responsibility ' },
                      { name: 'requiredSkills', label: 'Required Skills ' },
                      { name: 'education', label: 'Education ' },
                      { name: 'experience', label: 'Experience ' },
                      { name: 'salary', label: 'Salary ' },
                      { name: 'jobLocation', label: 'Job Location' },
                      
                      { name: 'jobTiming', label: 'Job Timing' },
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
                          error={field.error}
                          helperText={field.helperText}
                          inputProps={field.name === 'phoneNumber' ? {} : {}}
                          sx={{
                            '& label': { fontWeight: 600, color: '#555' },
                            '& input': { fontWeight: 500, color: '#333' },
                            '& .MuiFormHelperText-root': {
                              marginLeft: 0,
                              mt: 0.5,
                              fontSize: '0.75rem',
                              lineHeight: 1.2,
                              minHeight: '1.2rem',
                              display: 'block',
                              visibility: field.error ? 'visible' : 'hidden'
                            }
                          }}
                        />
                      </Grid>
                    ))}

<Grid item xs={12} sm={4}>
  <Autocomplete
    freeSolo
    options={['Male', 'Female', 'Other']}
    value={formData.gender || ''}
    onChange={(event, newValue) => {
      setFormData({ ...formData, gender: newValue || '' });
    }}
    onInputChange={(event, newInputValue) => {
      setFormData({ ...formData, gender: newInputValue });
    }}
    renderInput={(params) => (
      <TextField
        {...params}
        label="Gender"
        name="gender"
        fullWidth
        variant="outlined"
        sx={{
          '& label': { fontWeight: 600, color: '#555' },
          '& input': { fontWeight: 500, color: '#333' },
        }}
      />
    )}
  />
</Grid>


                    <Grid item xs={12}>
                      <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#555', mb: 1 }}>
                        Set Reminder
                      </Typography>
                      <TextField
                        label="Reminder Message"
                        fullWidth
                        value={reminderMessage}
                        onChange={(e) => setReminderMessage(e.target.value)}
                        sx={{ mb: 2 }}
                      />
                      <DatePicker
                        label="Reminder Date"
                        value={reminderDate}
                        onChange={(date) => setReminderDate(date)}
                        sx={{ width: '100%' }}
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
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (validateFileSize(file)) {
                          setFormData((prev) => ({
                            ...prev,
                            agreementSigned: file,
                          }));
                        } else {
                          e.target.value = ''; // Reset the file input
                        }
                      }
                    }}
                    style={{ marginBottom: 16 }}
                  />
                  {fileError && (
                    <Typography color="error" variant="caption" display="block" gutterBottom>
                      {fileError}
                    </Typography>
                  )}

                 

                  <Typography variant="body2" sx={{ mb: 1, color: '#555' }}>
                    Upload Additional Description (PDF)
                  </Typography>
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={(e) => {
                      const file = e.target.files[0];
                      if (file) {
                        if (validateFileSize(file)) {
                          setFormData((prev) => ({
                            ...prev,
                            descriptionFile: file,
                          }));
                        } else {
                          e.target.value = ''; // Reset the file input
                        }
                      }
                    }}
                    style={{ marginBottom: 16 }}
                  />
                  {fileError && (
                    <Typography color="error" variant="caption" display="block" gutterBottom>
                      {fileError}
                    </Typography>
                  )}
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

               <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)}>
                      <Box sx={{
                        position: 'absolute',
                        top: '50%', left: '50%',
                        transform: 'translate(-50%, -50%)',
                        width: 400, bgcolor: 'background.paper',
                        boxShadow: 24, p: 4, borderRadius: 2, textAlign: 'center',
                      }}>
                        <Typography variant="h6" gutterBottom>Confirm Import</Typography>
            <DialogContent>
            <Typography>Are you sure you want to import {parsedJobs?.length || 0} jobs from {uploadedFileName}?</Typography>
            {isImporting && (
              <Box sx={{ width: '100%', mt: 2 }}>
                <LinearProgress 
                  variant="determinate" 
                  value={importProgress} 
                  sx={{ height: 10, borderRadius: 5 }}
                />
                <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 1 }}>
                  {importProgress}% Complete
                </Typography>
              </Box>
            )}
          </DialogContent>
                        <Box mt={3} display="flex" justifyContent="space-between">
                          <Button variant="outlined" onClick={() => setImportModalOpen(false)}>Cancel</Button>
                          <Button 
            onClick={handleConfirmImport} 
            color="primary"
            variant="contained"
            disabled={isImporting}
          >
            {isImporting ? 'Importing...' : 'Import'}
          </Button>
                        </Box>
                      </Box>
                    </Modal>

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
                      ['Job Timing', selectedConvertRow.jobTiming],
                      ['Gender', selectedConvertRow.gender],
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
                        'Description (PDF)',
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
                        ) : 'N/A',
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

            <Dialog open={openReschedule} onClose={() => setOpenReschedule(false)}>
  <DialogTitle>Reschedule Meeting</DialogTitle>
  <DialogContent>
  <TextField
  label="New Date & Time"
  type="datetime-local"
  fullWidth
  InputLabelProps={{ shrink: true }}
  value={rescheduleDate}
  onChange={(e) => setRescheduleDate(e.target.value)}
  sx={{ my: 2 }}
/>

    <TextField
      label="Reason"
      fullWidth
      multiline
      rows={3}
      value={rescheduleReason}
      onChange={(e) => setRescheduleReason(e.target.value)}
    />
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpenReschedule(false)}>Cancel</Button>
    <Button onClick={handleSubmitReschedule} variant="contained">Submit</Button>
  </DialogActions>
</Dialog>

<div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1000 }}>
  {reminderList.map((reminder) => (
    <Alert key={reminder._id} severity="info" sx={{ mb: 1 }}>
      Reminder: {reminder.message} (Due: {new Date(reminder.remindAt).toDateString()})
    </Alert>
  ))}
</div>


          </Box>
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default JobOpeningsDashboard;