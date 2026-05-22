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
  Drawer,
  Chip,
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
import BusinessIcon from '@mui/icons-material/Business';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
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
    Area: '',
    weekOff: '',
    jobTiming: '',
    gender: '',
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
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [jobTimingStart, setJobTimingStart] = useState(''); // start time for job timing
  const [jobTimingEnd, setJobTimingEnd] = useState('');     // end time for job timing
  const [errors, setErrors] = useState({});
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
  const [detailPanel, setDetailPanel] = useState({ open: false, row: null, view: 'company' });
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
      console.log('ðŸŸ¢ Socket connected to reminder system');
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('ðŸ”´ Socket disconnected:', reason);
    });

    socketInstance.on('initial-reminders', (data) => {
      console.log("ðŸ”” Received reminders:", data);
      if (!data || data.length === 0) return;

      data.forEach(reminder => {
        const reminderKey = `reminder-${reminder._id}`;
        if (shownReminders.current.has(reminderKey)) return;

        shownReminders.current.add(reminderKey);

        toast.info(
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            <strong>ðŸ“Œ {reminder.message}</strong>
            <div style={{ fontSize: '12px', color: '#666' }}>
              ðŸ“… Due: {new Date(reminder.remindAt).toLocaleString()}
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
    fetchAllCompaniesFromCreate();
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
      const res = await axios.get(`${API_BASE_URL}/allType/companies?query=${input}`);
      setCompanyOptions(res.data);
    } catch (err) {
      console.error('Error fetching suggestions', err);
    }
  }, 300);

  // Fetch all companies from CompanyCreate model for the new dropdown
  const fetchAllCompaniesFromCreate = async () => {
    try {
      const token = sessionStorage.getItem('token');
      const res = await axios.get(`${API_BASE_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCompanyOptions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching companies', err);
    }
  };

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
        companyName: data?.companyName || '',
        companyId: data?.companyId ? Number(data.companyId) : '',
        branchId: data?.branchId || '',
        branchName: data?.branchName || '',
        jobTitle: data?.jobTitle || '',
        jobLocation: data?.jobLocation || '',
        Area: data?.Area || '',
        weekOff: data?.weekOff || '',
        numberOfRequirements: data?.numberOfRequirements || '',
        jobTiming: data?.jobTiming || '',
        education: data?.education || '',
        gender: data?.gender || '',
        salary: data?.salary || '',
        experience: data?.experience || '',
        requiredSkills: data?.requiredSkills || '',
        keyResponsibility: data?.keyResponsibility || '',
        benefits: data?.benefits || '',
        response: data?.response || '',
        remarks: data?.remarks || '',
        descriptionFile: data?.descriptionFile || null,
      });
      // Restore branch selection
      if (data.branchId) {
        const co = companyOptions.find(c => c.companyId === Number(data.companyId));
        const br = co?.branches?.find(b => b._id === data.branchId);
        setSelectedBranch(br || null);
      } else {
        setSelectedBranch(null);
      }

      // Parse existing jobTiming into start/end parts (handles "9:00 AM - 6:00 PM", "9:30am to 6:30pm", "9:00-6:00" etc.)
      if (data.jobTiming) {
        const timing = data.jobTiming.trim();
        // Try splitting by ' - ', ' to ', '-' (in priority order)
        let parts = null;
        if (timing.includes(' - ')) {
          parts = timing.split(' - ');
        } else if (timing.toLowerCase().includes(' to ')) {
          parts = timing.toLowerCase().split(' to ');
        } else if (timing.includes('-')) {
          parts = timing.split('-');
        }
        if (parts && parts.length >= 2) {
          setJobTimingStart(parts[0].trim());
          setJobTimingEnd(parts[1].trim());
        } else {
          setJobTimingStart(timing);
          setJobTimingEnd('');
        }
      } else {
        setJobTimingStart('');
        setJobTimingEnd('');
      }
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData({
        companyName: '', companyId: '', branchId: '', branchName: '',
        jobTitle: '', jobLocation: '', Area: '', weekOff: '', numberOfRequirements: '', jobTiming: '',
        education: '', gender: '', salary: '', experience: '',
        requiredSkills: '', keyResponsibility: '', benefits: '', response: '',
        remarks: '', descriptionFile: null,
      });
      setSelectedBranch(null);
      setJobTimingStart('');
      setJobTimingEnd('');
    }
    setErrors({});
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
      jobTiming: '',
      gender: '',
      remarks: '',
      agreementSigned: null,
      //description: '',
      descriptionFile: null,
    });
    setSelectedId(null);
    setJobTimingStart('');
    setJobTimingEnd('');
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

  // Fields that should NOT be auto-capitalized
  const NO_CAPITALIZE_FIELDS = ['email', 'phoneNumber', 'websiteURL', 'salary', 'numberOfRequirements', 'experience', 'companyId', 'branchId'];

  const capitalizeWords = (str) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === 'date') {
      const isValid = /^(\d{2})-(\d{2})-(\d{4})$/.test(value);
      if (!isValid && value !== '') {
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

    setValidationErrors(errors);

    const processedValue = (!NO_CAPITALIZE_FIELDS.includes(name) && typeof value === 'string' && value.length > 0)
      ? capitalizeWords(value)
      : value;

    setFormData((prev) => ({ ...prev, [name]: processedValue }));
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

    // Validate required fields
    const newErrors = {};
    if (!formData.companyName) newErrors.companyName = true;
    if (!formData.jobTitle?.trim()) newErrors.jobTitle = true;
    if (!formData.jobLocation?.trim()) newErrors.jobLocation = true;
    if (!formData.Area?.trim()) newErrors.Area = true;
    if (!formData.numberOfRequirements) newErrors.numberOfRequirements = true;
    if (!jobTimingStart?.trim() && !jobTimingEnd?.trim()) newErrors.jobTiming = true;
    if (!formData.salary) newErrors.salary = true;
    if (!formData.experience?.trim()) newErrors.experience = true;
    if (!formData.education?.trim()) newErrors.education = true;
    if (!formData.weekOff?.trim()) newErrors.weekOff = true;
    if (!formData.requiredSkills?.trim()) newErrors.requiredSkills = true;
    if (!formData.descriptionFile) newErrors.descriptionFile = true;
    if (Object.keys(newErrors).length) {
      setErrors(newErrors);
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setSuccess(false);

    const data = new FormData();

    // Combine jobTimingStart + jobTimingEnd into jobTiming string
    const combinedJobTiming = jobTimingStart && jobTimingEnd
      ? `${jobTimingStart} - ${jobTimingEnd}`
      : jobTimingStart || jobTimingEnd || formData.jobTiming || '';

    // Append all scalar fields
    const skipKeys = ['descriptionFile'];
    for (let key in formData) {
      if (skipKeys.includes(key)) continue;
      if (key === 'jobTiming') {
        if (combinedJobTiming) data.append('jobTiming', combinedJobTiming);
        continue;
      }
      if (formData[key] !== null && formData[key] !== undefined && formData[key] !== '') {
        if (key === 'companyId') {
          data.append(key, Number(formData[key]));
        } else {
          data.append(key, formData[key]);
        }
      }
    }

    // File
    if (formData.descriptionFile instanceof File) {
      data.append('descriptionFile', formData.descriptionFile);
    }

    try {
      if (editMode) {
        const response = await updateMySale(selectedId, data, true);
        if (response?.error) throw new Error(response.message || 'Failed to update job');
      } else {
        const response = await createMySale(data, true);
        if (response?.error) throw new Error(response.message || 'Failed to create job');
      }

      setSuccess(true);
      setSelectedBranch(null);
      await getJobData();

      setTimeout(() => {
        setSuccess(false);
        setJobTimingStart('');
        setJobTimingEnd('');
        handleClose();
      }, 1500);
    } catch (err) {
      console.error('Error saving job opening:', err);
      toast.error(err.response?.data?.message || err.message || 'Something went wrong');
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
    // â›”ï¸ excluded: assignedHR, agreementSigned, descriptionFile, companyId
  ];


  const handleDownloadJobTemplate = () => {
    const worksheetData = [jobTemplateHeaders]; // Header row only
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'JobTemplate');

    XLSX.writeFile(workbook, 'job_import_template.xlsx');
  };



  const columns = [
    {
      field: 'actions',
      headerName: 'Actions',
      width: 100,
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
        </div>
      )
    },
    {
      field: 'approvalStatus',
      headerName: 'Status',
      width: 130,
      renderCell: (params) => {
        const status = params.row.approvalStatus || 'Approved';
        let color = 'warning';
        let label = 'Pending';
        if (status === 'Approved') {
          color = 'success';
          label = 'Accepted';
        } else if (status === 'Rejected') {
          color = 'error';
          label = 'Rejected';
        }
        return <Chip label={label} color={color} size="small" variant="outlined" />;
      }
    },

    {
      field: 'companyName',
      headerName: 'Company / Branch',
      width: 160,
      renderCell: (params) => {
        const row = params.row;
        const hasBranch = !!row.branchName || !!row.br_branchName;
        const branchDisplayName = row.branchName || row.br_branchName;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', overflow: 'hidden' }}>
            <Tooltip title="Click to view company details" arrow>
              <span
                onClick={(e) => { e.stopPropagation(); setDetailPanel({ open: true, row, view: 'company' }); }}
                style={{
                  color: '#3f51b5', fontWeight: 600, fontSize: '0.82rem',
                  cursor: 'pointer', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                  textDecoration: 'underline', textDecorationStyle: 'dotted',
                }}
              >
                {row.companyName || '—'}
              </span>
            </Tooltip>
            {hasBranch && (
              <Tooltip title="Click to view branch details" arrow>
                <Chip
                  label={branchDisplayName}
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setDetailPanel({ open: true, row, view: 'branch' }); }}
                  sx={{
                    bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700,
                    fontSize: '0.62rem', height: 18, cursor: 'pointer', flexShrink: 0,
                    '&:hover': { bgcolor: '#c8e6c9' },
                  }}
                />
              </Tooltip>
            )}
          </Box>
        );
      }
    },

    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'numberOfRequirements',
      headerName: 'No. of Requirements',
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'salary',
      headerName: 'Salary',
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'jobTiming',
      headerName: 'Job Timing',
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'weekOff',
      headerName: 'Week Off',
      width: 130,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value || '—'}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'jobLocation',
      headerName: 'Job Location',
      width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'Area',
      headerName: 'Area',
      width: 110,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value || '—'}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'education',
      headerName: 'Education',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'experience',
      headerName: 'Experience',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: "createdAt",
      headerName: "Created At",
      width: 180,
      renderCell: (params) => {
        const formattedDate = params.value ? dayjs(params.value).format("DD/MM/YYYY hh:mm A") : "";
        return (
          <Tooltip title={formattedDate} arrow>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formattedDate}
            </div>
          </Tooltip>
        );
      }
    },



    {
      field: 'response',
      headerName: 'Response',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'gender',
      headerName: 'Gender',
      width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'keyResponsibility',
      headerName: 'Key Responsibility',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'requiredSkills',
      headerName: 'Required Skills',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'descriptionFile',
      headerName: 'Job Description (PDF)',
      width: 180,
      renderCell: (params) => {
        const fileUrl = params.row.descriptionFile;
        return fileUrl ? (
          <Tooltip title="Click to view PDF" arrow>
            <a href={fileUrl} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}
              style={{ color: '#1976d2', textDecoration: 'underline' }}>
              View PDF
            </a>
          </Tooltip>
        ) : <span>-</span>;
      },
    },

    {
      field: 'remarks',
      headerName: 'Remarks',
      width: 150,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    {
      field: 'rescheduledDate',
      headerName: 'Rescheduled Date',
      width: 180,
      renderCell: (params) => {
        if (!params.value) return '-';
        const date = new Date(params.value);
        const formattedDate = date.toLocaleString();
        return (
          <Tooltip title={formattedDate} arrow>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {formattedDate}
            </div>
          </Tooltip>
        );
      },
    },

    {
      field: 'rescheduleReason',
      headerName: 'Reschedule Reason',
      width: 200,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
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
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f8' }}>
        <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#1e1e2f', zIndex: 1000 }}>
          <Sidebar />
        </div>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
          <Navbar />
          <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

            {/* Header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
              borderRadius: '16px', p: 3, mb: 3,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
              boxShadow: '0 8px 32px rgba(63,81,181,0.25)',
            }}>
              <Box display="flex" alignItems="center" gap={2}>
                <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <CheckCircleIcon sx={{ color: '#fff', fontSize: 28 }} />
                </Box>
                <Box>
                  <Typography variant="h5" fontWeight={800} color="#fff">Job Openings</Typography>
                  <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                    Manage and track all job openings
                  </Typography>
                </Box>
              </Box>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ bgcolor: 'rgba(255,255,255,0.18)', border: '2px solid rgba(255,255,255,0.4)', borderRadius: '12px', px: 2.5, py: 1, textAlign: 'center' }}>
                  <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>{filteredData.length}</Typography>
                  <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, mt: 0.2 }}>Total</Typography>
                </Box>
                <Button variant="contained" onClick={() => handleOpen()}
                  sx={{ bgcolor: '#fff', color: '#3f51b5', fontWeight: 700, borderRadius: '10px', px: 2.5, '&:hover': { bgcolor: '#e8eaf6' } }}>
                  + Add Job Opening
                </Button>
                <Button variant="contained" component="label"
                  sx={{ bgcolor: 'rgba(255,255,255,0.18)', color: '#fff', fontWeight: 600, borderRadius: '10px', border: '1px solid rgba(255,255,255,0.3)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                  Import Excel
                  <input hidden accept=".xlsx,.xls" type="file" onChange={handleFileUpload} />
                </Button>
                <Button variant="outlined" onClick={handleDownloadJobTemplate}
                  sx={{ color: '#fff', borderColor: 'rgba(255,255,255,0.5)', fontWeight: 600, borderRadius: '10px', '&:hover': { bgcolor: 'rgba(255,255,255,0.1)' } }}>
                  Template
                </Button>
               
              </Box>
            </Box>

            {/* Filters */}
            <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px', p: 2, mb: 2, display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center', boxShadow: '0 2px 8px rgba(63,81,181,0.06)' }}>
              <DatePicker label="Start Date" value={startDate} onChange={(date) => setStartDate(date)}
                slotProps={{ textField: { size: 'small', sx: { width: 160 } } }} />
              <DatePicker label="End Date" value={endDate} onChange={(date) => setEndDate(date)}
                slotProps={{ textField: { size: 'small', sx: { width: 160 } } }} />
              <Button variant="outlined" size="small" onClick={() => { setStartDate(null); setEndDate(null); }}
                sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#9fa8da', color: '#3f51b5' }}>
                Reset
              </Button>
            </Box>

            {/* DataGrid */}
            <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '14px', overflow: 'hidden', height: 'calc(100vh - 310px)', boxShadow: '0 2px 12px rgba(63,81,181,0.08)' }}>
              <DataGrid
                rows={filteredData}
                columns={columns}
                pageSize={25}
                getRowId={(row) => row.id}
                disableSelectionOnClick
                onError={(error) => console.error('DataGrid Error:', error)}
                loading={!filteredData.length}
                components={{
                  NoRowsOverlay: () => (
                    <Box display="flex" alignItems="center" justifyContent="center" height="100%">
                      <Typography color="text.secondary">No data available</Typography>
                    </Box>
                  ),
                }}
                sx={{
                  border: 'none', height: '100%',
                  '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', fontSize: '0.82rem', '&:focus': { outline: 'none' } },
                  '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                  '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff' },
                  '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                  '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
                }}
              />
            </Box>


            {/* ── Job Opening Modal (Admin-style) ── */}
            <Modal open={open} onClose={null} disableEscapeKeyDown aria-labelledby="sales-job-form-modal">
              <Box component="form" onSubmit={handleSubmit} sx={{
                position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
                width: '90vw', maxWidth: 1400, maxHeight: '95vh', bgcolor: '#fff',
                borderRadius: '16px', boxShadow: '0 16px 48px rgba(63,81,181,0.25)',
                display: 'flex', flexDirection: 'column', overflow: 'hidden',
              }}>
                {/* Header */}
                <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 4, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{ width: 6, height: 28, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 3 }} />
                    <Typography variant="h6" fontWeight={700} color="#fff">
                      {editMode ? 'Edit Job Opening' : 'Add New Job Opening'}
                    </Typography>
                  </Box>
                  <IconButton onClick={handleClose} sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
                    <CloseIcon />
                  </IconButton>
                </Box>

                <Grid container spacing={3} sx={{
                  flexGrow: 1, overflowY: 'auto', p: 3,
                  '&::-webkit-scrollbar': { width: 6 },
                  '&::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 3 },
                }}>
                  {/* Left Column */}
                  <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Company Dropdown from CompanyCreate */}
                    <Autocomplete
                      options={companyOptions || []}
                      getOptionLabel={(option) =>
                        option ? option.companyName : ''
                      }
                      value={companyOptions.find(c => c.companyId === formData.companyId) || (formData.companyName ? { companyName: formData.companyName, companyId: formData.companyId } : null)}
                      onChange={(e, value) => {
                        if (value) {
                          setFormData(prev => ({ ...prev, companyName: value.companyName, companyId: value.companyId }));
                          setSelectedBranch(null);
                          if (errors.companyName) setErrors(p => ({ ...p, companyName: false }));
                        } else {
                          setFormData(prev => ({ ...prev, companyName: '', companyId: '' }));
                          setSelectedBranch(null);
                        }
                      }}
                      renderInput={(params) => (
                        <TextField {...params} label="Select Company *"
                          error={!!errors.companyName}
                          helperText={errors.companyName ? 'Company is required' : 'Choose from registered companies'} />
                      )}
                      renderOption={(props, option) => (
                        <li {...props} key={option._id || option.companyId}>
                          <Box>
                            <Typography variant="body2" fontWeight={600}>{option.companyName}</Typography>
                            <Typography variant="caption" color="text.secondary">
                              {[option.city, option.industries].filter(Boolean).join(' • ')}
                            </Typography>
                          </Box>
                        </li>
                      )}
                      isOptionEqualToValue={(o, v) => o.companyId === v?.companyId}
                    />

                    {/* Branch Dropdown */}
                    {(() => {
                      const selectedCo = companyOptions.find(c => c.companyId === formData.companyId);
                      const branches = selectedCo?.branches || [];
                      const hasBranches = branches.length > 0;
                      return (
                        <Autocomplete
                          options={branches}
                          getOptionLabel={(b) => b.branchName || ''}
                          value={selectedBranch}
                          disabled={!hasBranches}
                          onChange={(e, val) => {
                            setSelectedBranch(val);
                            setFormData(prev => ({ ...prev, branchId: val?._id || '', branchName: val?.branchName || '' }));
                          }}
                          renderInput={(params) => (
                            <TextField {...params} label="Select Branch"
                              helperText={!formData.companyId ? 'Select a company first' : !hasBranches ? 'No branches for this company' : 'Optional - select a branch'}
                              sx={{ '& .MuiOutlinedInput-root': { bgcolor: !hasBranches ? '#f5f5f5' : undefined } }} />
                          )}
                          renderOption={(props, option) => (
                            <li {...props} key={option._id}>
                              <Box>
                                <Typography variant="body2" fontWeight={600}>{option.branchName}</Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {[option.city, option.area].filter(Boolean).join(' • ')}
                                </Typography>
                              </Box>
                            </li>
                          )}
                          isOptionEqualToValue={(o, v) => o._id === v?._id}
                        />
                      );
                    })()}

                    <TextField label="Job Title *" name="jobTitle" value={formData.jobTitle}
                      onChange={(e) => { handleChange(e); if (errors.jobTitle) setErrors(p => ({ ...p, jobTitle: false })); }}
                      fullWidth error={!!errors.jobTitle} helperText={errors.jobTitle ? 'Required' : ''} required />

                    <TextField label="Job Location *" name="jobLocation" value={formData.jobLocation}
                      onChange={(e) => { handleChange(e); if (errors.jobLocation) setErrors(p => ({ ...p, jobLocation: false })); }}
                      fullWidth error={!!errors.jobLocation} helperText={errors.jobLocation ? 'Required' : ''} required />

                    <TextField label="Area *" name="Area" value={formData.Area || ''}
                      onChange={(e) => { handleChange(e); if (errors.Area) setErrors(p => ({ ...p, Area: false })); }}
                      fullWidth error={!!errors.Area}
                      helperText={errors.Area ? 'Required' : 'e.g. Andheri, Bandra'} required />

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField label="No. of Openings *" name="numberOfRequirements" type="number"
                          value={formData.numberOfRequirements}
                          onChange={(e) => { handleChange(e); if (errors.numberOfRequirements) setErrors(p => ({ ...p, numberOfRequirements: false })); }}
                          fullWidth error={!!errors.numberOfRequirements} helperText={errors.numberOfRequirements ? 'Required' : ''} required />
                      </Grid>
                      <Grid item xs={6}>
                        <Box>
                          <Typography variant="caption" sx={{ mb: 0.5, display: 'block', color: errors.jobTiming ? '#d32f2f' : 'text.secondary' }}>
                            Job Timing *
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField
                              label="Start Time"
                              type="time"
                              value={jobTimingStart ? (() => {
                                // Parse "9:00am", "9:00 AM", "09:00AM", "9:30pm" etc. to 24h "HH:MM"
                                const cleaned = jobTimingStart.trim().toLowerCase();
                                const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
                                if (!match) return '';
                                let hh = parseInt(match[1]);
                                const mm = match[2];
                                const period = match[3];
                                if (period === 'pm' && hh < 12) hh += 12;
                                if (period === 'am' && hh === 12) hh = 0;
                                return `${String(hh).padStart(2, '0')}:${mm}`;
                              })() : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) { setJobTimingStart(''); return; }
                                const [h, m] = val.split(':');
                                const hh = parseInt(h);
                                const ampm = hh >= 12 ? 'PM' : 'AM';
                                const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
                                setJobTimingStart(`${h12}:${m} ${ampm}`);
                                if (errors.jobTiming) setErrors(p => ({ ...p, jobTiming: false }));
                              }}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{ step: 300 }}
                              size="small"
                              error={!!errors.jobTiming}
                              sx={{ flex: 1 }}
                            />
                            <Typography variant="body2" color="text.secondary">to</Typography>
                            <TextField
                              label="End Time"
                              type="time"
                              value={jobTimingEnd ? (() => {
                                const cleaned = jobTimingEnd.trim().toLowerCase();
                                const match = cleaned.match(/^(\d{1,2}):(\d{2})\s*(am|pm)?$/);
                                if (!match) return '';
                                let hh = parseInt(match[1]);
                                const mm = match[2];
                                const period = match[3];
                                if (period === 'pm' && hh < 12) hh += 12;
                                if (period === 'am' && hh === 12) hh = 0;
                                return `${String(hh).padStart(2, '0')}:${mm}`;
                              })() : ''}
                              onChange={(e) => {
                                const val = e.target.value;
                                if (!val) { setJobTimingEnd(''); return; }
                                const [h, m] = val.split(':');
                                const hh = parseInt(h);
                                const ampm = hh >= 12 ? 'PM' : 'AM';
                                const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
                                setJobTimingEnd(`${h12}:${m} ${ampm}`);
                                if (errors.jobTiming) setErrors(p => ({ ...p, jobTiming: false }));
                              }}
                              InputLabelProps={{ shrink: true }}
                              inputProps={{ step: 300 }}
                              size="small"
                              error={!!errors.jobTiming}
                              sx={{ flex: 1 }}
                            />
                          </Box>
                          {errors.jobTiming && (
                            <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block' }}>
                              Job timing is required
                            </Typography>
                          )}
                          {(jobTimingStart || jobTimingEnd) && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {jobTimingStart && jobTimingEnd
                                ? `${jobTimingStart} - ${jobTimingEnd}`
                                : jobTimingStart || jobTimingEnd}
                            </Typography>
                          )}
                        </Box>
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField label="Education *" name="education" value={formData.education}
                          onChange={(e) => { handleChange(e); if (errors.education) setErrors(p => ({ ...p, education: false })); }}
                          fullWidth error={!!errors.education} helperText={errors.education ? 'Required' : ''} required />
                      </Grid>
                      <Grid item xs={6}>
                        <Autocomplete freeSolo options={['Male', 'Female', 'Other']}
                          value={formData.gender || ''}
                          onChange={(e, v) => setFormData(p => ({ ...p, gender: v || '' }))}
                          onInputChange={(e, v) => setFormData(p => ({ ...p, gender: v }))}
                          renderInput={(params) => <TextField {...params} label="Gender" fullWidth />} />
                      </Grid>
                    </Grid>

                    <Grid container spacing={2}>
                      <Grid item xs={6}>
                        <TextField
                          label="Salary (Monthly) *"
                          name="salary"
                          value={formData.salary}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*$/.test(val)) {
                              handleChange({ target: { name: 'salary', value: val } });
                              if (errors.salary) setErrors(p => ({ ...p, salary: false }));
                            }
                          }}
                          fullWidth
                          error={!!errors.salary}
                          helperText={errors.salary ? 'Required' : ''}
                          required
                          inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
                        />
                      </Grid>
                      <Grid item xs={6}>
                        <TextField
                          label="Experience (Year) *"
                          name="experience"
                          value={formData.experience}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === '' || /^\d*$/.test(val)) {
                              handleChange({ target: { name: 'experience', value: val } });
                              if (errors.experience) setErrors(p => ({ ...p, experience: false }));
                            }
                          }}
                          fullWidth
                          error={!!errors.experience}
                          helperText={errors.experience ? 'Required' : ''}
                          required
                          inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
                        />
                      </Grid>
                    </Grid>
                  </Grid>

                  {/* Right Column */}
                  <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                    {/* Week Off */}
                    <Autocomplete
                      freeSolo
                      options={[
                        'Sunday',
                        'Monday',
                        'Tuesday',
                        'Wednesday',
                        'Thursday',
                        'Friday',
                        'Saturday',
                        'Saturday & Sunday',
                        'Sunday & Monday',
                        'Rotational',
                        'No Week Off',
                      ]}
                      value={formData.weekOff || ''}
                      onChange={(e, v) => { setFormData(p => ({ ...p, weekOff: v || '' })); if (errors.weekOff) setErrors(p => ({ ...p, weekOff: false })); }}
                      onInputChange={(e, v) => { setFormData(p => ({ ...p, weekOff: v })); if (errors.weekOff) setErrors(p => ({ ...p, weekOff: false })); }}
                      renderInput={(params) => (
                        <TextField {...params} label="Week Off *" fullWidth
                          error={!!errors.weekOff}
                          helperText={errors.weekOff ? 'Required' : 'Select or type custom week off'} />
                      )}
                    />

                    <TextField label="Required Skills *" name="requiredSkills" value={formData.requiredSkills}
                      onChange={(e) => { handleChange(e); if (errors.requiredSkills) setErrors(p => ({ ...p, requiredSkills: false })); }}
                      fullWidth multiline rows={2} error={!!errors.requiredSkills}
                      helperText={errors.requiredSkills ? 'Required' : ''} required />

                    <TextField label="Key Responsibilities" name="keyResponsibility"
                      value={formData.keyResponsibility} onChange={handleChange} fullWidth multiline rows={3} />

                    <TextField label="Benefits" name="benefits" value={formData.benefits} onChange={handleChange} fullWidth />

                    <TextField label="Response" name="response" value={formData.response} onChange={handleChange} fullWidth />

                    <TextField label="Remarks" name="remarks" value={formData.remarks} onChange={handleChange} fullWidth multiline rows={2} />

                    {/* Job Description PDF */}
                    <Box>
                      <Typography mb={1} variant="body2" fontWeight={600} color={errors.descriptionFile ? 'error' : 'inherit'}>
                        Job Description PDF: *
                      </Typography>
                      <Button variant="outlined" component="label" startIcon={<CheckCircleIcon sx={{ display: 'none' }} />}
                        color={errors.descriptionFile ? 'error' : 'primary'}
                        sx={{ borderColor: errors.descriptionFile ? 'red' : undefined }}>
                        Upload PDF
                        <input type="file" hidden accept=".pdf,.doc,.docx"
                          onChange={(e) => {
                            const file = e.target.files[0];
                            if (file && file.size > 5 * 1024 * 1024) {
                              toast.error('File size exceeds 5MB');
                            } else {
                              setFormData(p => ({ ...p, descriptionFile: file }));
                              if (errors.descriptionFile) setErrors(p => ({ ...p, descriptionFile: false }));
                            }
                          }} />
                      </Button>
                      {errors.descriptionFile && (
                        <Typography variant="caption" color="error" display="block" mt={0.5}>
                          Job Description PDF is required
                        </Typography>
                      )}
                      {formData.descriptionFile instanceof File && (
                        <Typography variant="body2" color="text.secondary" mt={0.5}>{formData.descriptionFile.name}</Typography>
                      )}
                      {typeof formData.descriptionFile === 'string' && formData.descriptionFile && (
                        <Box mt={0.5} display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">Existing PDF</Typography>
                          <Button size="small" onClick={() => window.open(formData.descriptionFile, '_blank')}>View</Button>
                        </Box>
                      )}
                    </Box>
                  </Grid>
                </Grid>

                {/* Footer */}
                <Box sx={{
                  display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
                  px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff', gap: 2
                }}>
                  {loading && <LinearProgress sx={{ flex: 1 }} />}
                  {success && (
                    <Box display="flex" alignItems="center" gap={1}>
                      <CheckCircleIcon color="success" />
                      <Typography color="green" variant="body2">
                        {editMode ? 'Updated!' : 'Created!'}
                      </Typography>
                    </Box>
                  )}
                  <Button variant="outlined" color="error" onClick={handleClose}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                    Close
                  </Button>
                  <Button type="submit" variant="contained" disabled={loading}
                    sx={{
                      borderRadius: '8px', textTransform: 'none', fontWeight: 700,
                      background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
                      '&:hover': { background: 'linear-gradient(135deg, #303f9f, #3f51b5)' }
                    }}>
                    {loading ? (editMode ? 'Updating...' : 'Creating...') : editMode ? 'Update Job Opening' : 'Add Job Opening'}
                  </Button>
                </Box>
              </Box>
            </Modal>

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

            {/* ── Company / Branch Detail Drawer ── */}
            <Drawer
              anchor="right"
              open={detailPanel.open}
              onClose={() => setDetailPanel({ open: false, row: null, view: 'company' })}
              PaperProps={{
                sx: {
                  width: 380,
                  borderRadius: '16px 0 0 16px',
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                },
              }}
            >
              {detailPanel.row && (() => {
                const row = detailPanel.row;

                // Lookup company by companyId from CompanyCreate
                const companyObj = companyOptions.find(c => Number(c.companyId) === Number(row.companyId)) || null;

                // Lookup branch by branchId or branchName
                const branchObj = companyObj?.branches?.find(b => b._id === row.branchId || b.branchName === row.branchName) || null;

                const isCompany = detailPanel.view === 'company';
                const hasBranch = !!row.branchName || !!row.br_branchName;

                // ── Data to display (CompanyCreate -> backend co_ fields -> row's own fields) ──
                const title = isCompany
                  ? (companyObj?.companyName || row.companyName)
                  : (branchObj?.branchName || row.br_branchName || row.branchName);
                const subtitle = isCompany
                  ? `Company ID: ${companyObj?.companyId || row.companyId || '-'}`
                  : `Branch of ${companyObj?.companyName || row.companyName}`;
                const address = isCompany
                  ? (companyObj?.companyAddress || row.co_companyAddress || row.companyAddress)
                  : (branchObj?.branchAddress || row.br_branchAddress);
                const area = isCompany
                  ? (companyObj?.area || row.co_area)
                  : (branchObj?.area || row.br_area);
                const city = isCompany
                  ? (companyObj?.city || row.co_city)
                  : (branchObj?.city || row.br_city);
                const contact = isCompany
                  ? (companyObj?.contactPerson || row.co_contactPerson || row.contactName)
                  : (branchObj?.contactPerson || row.br_contactPerson);
                const phone = isCompany
                  ? (companyObj?.contactNumber2 || companyObj?.contactNumber || row.co_contactNumber2 || row.phoneNumber)
                  : (branchObj?.contactNumber || row.br_contactNumber);
                const email = isCompany
                  ? (companyObj?.email || row.co_email || row.email)
                  : (branchObj?.email || row.br_email);
                const website = isCompany
                  ? (companyObj?.websiteUrl || row.co_websiteUrl || row.websiteURL)
                  : null;
                const gps = isCompany
                  ? (companyObj?.gpsLocation || row.co_gpsLocation)
                  : (branchObj?.gpsLocation || row.br_gpsLocation);
                const industries = isCompany
                  ? (companyObj?.industries || row.co_industries || row.industries)
                  : null;
                const gst = isCompany
                  ? (companyObj?.gstUpload || row.co_gstUpload)
                  : null;
                const agreement = isCompany
                  ? (companyObj?.agreementUpload || row.co_agreementUpload || row.agreementSigned)
                  : null;
                const token = isCompany
                  ? (companyObj?.tokenAmount || row.co_tokenAmount)
                  : null;

                const DetailRow = ({ icon, label, value, link }) => {
                  if (!value && value !== 0) return null;
                  return (
                    <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                      <Typography sx={{ fontSize: '1rem', minWidth: 22, mt: 0.1 }}>{icon}</Typography>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                          {label}
                        </Typography>
                        {link ? (
                          <a href={link.startsWith('http') ? link : `https://${link}`} target="_blank" rel="noreferrer"
                            style={{ color: '#3f51b5', fontSize: '0.85rem', fontWeight: 500, wordBreak: 'break-all' }}>
                            {value}
                          </a>
                        ) : (
                          <Typography variant="body2" sx={{ color: '#1e293b', fontWeight: 500, wordBreak: 'break-word' }}>
                            {value}
                          </Typography>
                        )}
                      </Box>
                    </Box>
                  );
                };

                return (
                  <>
                    {/* Header */}
                    <Box sx={{
                      background: isCompany
                        ? 'linear-gradient(135deg, #1e1e2f, #2d2d44)'
                        : 'linear-gradient(135deg, #1b5e20, #2e7d32)',
                      px: 3, py: 2.5,
                      display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between',
                      flexShrink: 0,
                    }}>
                      <Box display="flex" alignItems="center" gap={1.5}>
                        <Box sx={{
                          width: 44, height: 44, borderRadius: '12px',
                          bgcolor: 'rgba(255,255,255,0.15)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                        }}>
                          <BusinessIcon sx={{ color: isCompany ? '#FFD700' : '#a5d6a7', fontSize: 24 }} />
                        </Box>
                        <Box>
                          <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2}
                            sx={{ wordBreak: 'break-word' }}>
                            {title || '—'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)' }}>
                            {subtitle}
                          </Typography>
                          {!isCompany && (
                            <Chip label="Branch" size="small"
                              sx={{ mt: 0.5, bgcolor: 'rgba(165,214,167,0.25)', color: '#a5d6a7', fontWeight: 700, fontSize: '0.68rem', height: 18 }} />
                          )}
                        </Box>
                      </Box>
                      <IconButton size="small" onClick={() => setDetailPanel({ open: false, row: null, view: 'company' })}
                        sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' }, flexShrink: 0 }}>
                        <CloseIcon fontSize="small" />
                      </IconButton>
                    </Box>

                    {/* Toggle tabs (only when job has a branch) */}
                    {hasBranch && (
                      <Box sx={{ display: 'flex', borderBottom: '2px solid #e8eaf6', bgcolor: '#f8f9ff' }}>
                        {['company', 'branch'].map(v => (
                          <Box key={v} onClick={() => setDetailPanel(p => ({ ...p, view: v }))}
                            sx={{
                              flex: 1, py: 1.2, textAlign: 'center', cursor: 'pointer',
                              fontWeight: 700, fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.06em',
                              color: detailPanel.view === v ? '#3f51b5' : '#9fa8da',
                              borderBottom: detailPanel.view === v ? '2px solid #3f51b5' : '2px solid transparent',
                              mb: '-2px', transition: 'all 0.2s',
                              '&:hover': { color: '#3f51b5' },
                            }}>
                            {v === 'company' ? '🏢 Company' : '🏪 Branch'}
                          </Box>
                        ))}
                      </Box>
                    )}

                    {/* Body */}
                    <Box sx={{ flex: 1, overflowY: 'auto', px: 3, py: 2 }}>
                      <DetailRow icon="🏭" label="Industries" value={industries} />
                      <DetailRow icon="📍" label="Address" value={address} />
                      <DetailRow icon="🏙️" label="City" value={city} />
                      <DetailRow icon="📌" label="Area" value={area} />
                      <DetailRow icon="👤" label="Contact" value={contact} />
                      <DetailRow icon="📞" label="Phone" value={phone} />
                      <DetailRow icon="✉️" label="Email" value={email} />
                      <DetailRow icon="🌐" label="Website" value={website} link={website} />
                      {gps && (
                        <Box sx={{ display: 'flex', gap: 1.5, py: 1, borderBottom: '1px solid #f0f2ff' }}>
                          <Typography sx={{ fontSize: '1rem', minWidth: 22, mt: 0.1 }}>🗺️</Typography>
                          <Box>
                            <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block' }}>
                              GPS Location
                            </Typography>
                            <a href={gps} target="_blank" rel="noreferrer"
                              style={{ color: '#3f51b5', fontSize: '0.85rem', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                              Open in Maps <OpenInNewIcon sx={{ fontSize: 14 }} />
                            </a>
                          </Box>
                        </Box>
                      )}
                      {token != null && (
                        <DetailRow icon="💰" label="Token Amount" value={`₹${token}`} />
                      )}
                      {/* Document links */}
                      {(gst || agreement) && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="caption" sx={{ color: '#9fa8da', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                            Documents
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                            {gst && (
                              <Button size="small" variant="outlined" href={gst} target="_blank" rel="noreferrer"
                                sx={{ borderRadius: '8px', fontSize: '0.75rem', borderColor: '#9fa8da', color: '#3f51b5', textTransform: 'none' }}>
                                📄 GST
                              </Button>
                            )}
                            {agreement && (
                              <Button size="small" variant="outlined" href={agreement} target="_blank" rel="noreferrer"
                                sx={{ borderRadius: '8px', fontSize: '0.75rem', borderColor: '#9fa8da', color: '#388e3c', textTransform: 'none' }}>
                                📄 Agreement
                              </Button>
                            )}
                          </Box>
                        </Box>
                      )}
                    </Box>

                    {/* Footer */}
                    <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
                      <Button fullWidth variant="outlined" onClick={() => setDetailPanel({ open: false, row: null, view: 'company' })}
                        sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600, textTransform: 'none' }}>
                        Close
                      </Button>
                    </Box>
                  </>
                );
              })()}
            </Drawer>

          </Box>
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default JobOpeningsDashboard;
