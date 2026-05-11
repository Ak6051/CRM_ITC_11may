
import React, { useState, useEffect, useRef } from 'react';
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
  Checkbox,
  ListItemText,
  Table,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  Chip,
  Tooltip,
  Card,
  CardContent,
  Divider,
  InputAdornment,
} from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Navbar from '../../components/team leader components/TeamLeaderNavbar';
import Sidebar from '../../components/team leader components/TeamLeaderSidebar';
import { API_BASE_URL, SOCKET_URL } from '../../config/api.config'; // Corrected import path
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
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { debounce } from 'lodash';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { io } from 'socket.io-client';
import { Autocomplete } from '@mui/material';
import useTLPermissions from '../../hooks/useTLPermissions';


const JobReport = () => {
  const { canDo } = useTLPermissions();
  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');
  
  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const originalSales = useRef([]); // To store the original unfiltered data
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    industries: '',
    companyName: '',
    companyAddress: '',
    Area: '',
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
    jobTiming:'',
    gender:'',
    remarks:'',
    agreementSigned: null,
    gstUpload: null,
    //description: '',
    descriptionFile: null,
    assignedHR: [] // Changed to array to support multiple HRs
  });
  const [emailError, setEmailError] = useState(false);
  const [emailHelperText, setEmailHelperText] = useState('');
  
  // Error states for required fields
  const [errors, setErrors] = useState({
    companyName: false,
    jobTitle: false,
    email: false,
    numberOfRequirements: false,
    requiredSkills: false,
    experience: false,
    education: false,
    jobLocation: false
  });
  const [hrUsers, setHrUsers] = useState([]); // State to hold HR users
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [parsedJobs, setParsedJobs] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadToastId, setUploadToastId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [assignmentFilter, setAssignmentFilter] = useState('all'); // 'all', 'assigned', 'unassigned'
  const [hrFilter, setHrFilter] = useState('');
  const [areaFilter, setAreaFilter] = useState([]);
  const [areaOptions, setAreaOptions] = useState([]);
  const [jobDetails, setJobDetails] = useState(null);
  const [industryOptions, setIndustryOptions] = useState([]);
  const [openJobModal, setOpenJobModal] = useState(false);
  const [candidateFilter, setCandidateFilter] = useState('');
  const [companyNames, setCompanyNames] = useState([]); // This will now store objects with companyName and companyId
  const [selectedCompany, setSelectedCompany] = useState('');
  const [selectedCompanies, setSelectedCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [openCandidateDialog, setOpenCandidateDialog] = useState(false);
  const [jobTitleNames, setJobTitleNames] = useState([]);
  const [selectedJobTitle, setSelectedJobTitle] = useState([]);
  const [jobTitleInput, setJobTitleInput] = useState('');
  const [fileErrors, setFileErrors] = useState({
    descriptionFile: '',
    agreementSigned: '',
    gstUpload: ''
  });
  const [selectedSalaries, setSelectedSalaries] = useState([]); // Salary filter states
  const [salaryInput, setSalaryInput] = useState('');
  const [salaryOptions, setSalaryOptions] = useState([]);

  const [inputText, setInputText] = useState(String(formData.companyName || ''));
  const shownReminders = new Set();
  // const SOCKET_URL = 'http://localhost:5000'; 
  // Keep input in sync with formData
  useEffect(() => {
    setInputText(String(formData.companyName || ''));
  }, [formData.companyName]);

// Reusable component for displaying key-value pairs in the card
const DetailItem = ({ label, value }) => (
  <>
    <Grid item xs={6}>
      <Typography variant="caption" color="text.secondary">
        {label}:
      </Typography>
    </Grid>
    <Grid item xs={6}>
      <Typography variant="body2" noWrap>
        {value || 'N/A'}
      </Typography>
    </Grid>
  </>
);


  const resetJobTitle = () => {
    setSelectedJobTitle([]);
    setJobTitleInput('');
  };

  const handleJobTitleChange = (event) => {
    const { target: { value } } = event;
    // When using multiple select with checkboxes, the value is already an array
    setSelectedJobTitle(
      // Handle both array and string cases
      Array.isArray(value) ? value : [value].filter(Boolean)
    );
  };

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.warn('No token found');
      return;
    }

    // const socketInstance = io(SOCKET_URL, {
    //   path: '/socket.io',
    //   reconnection: true,
    //   reconnectionAttempts: 5,
    //   reconnectionDelay: 1000,
    //   reconnectionDelayMax: 5000,
    //   timeout: 20000,
    //   autoConnect: true,
    //   transports: ['websocket', 'polling'],
    //   withCredentials: true,
    // });

    const socketInstance = io(SOCKET_URL, {
      transports: ['websocket'],  // ✅ Only WebSocket
      upgrade: false,             // ❌ Disable fallback to polling
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 3000,
      timeout: 10000,
      withCredentials: true,
      auth: {
        token,
      }
    });
    

    socketInstance.on('connect', () => {
      console.log('🟢 Socket connected');
      socketInstance.emit('register-user', token);
    });

    socketInstance.on('disconnect', (reason) => {
      console.log('🔴 Socket disconnected:', reason);
    });

    socketInstance.on('task-reminder', (data) => {
      const uniqueKey = `${data.taskId}-${new Date(data.endDate).toISOString()}`;

      if (shownReminders.has(uniqueKey)) return;

      shownReminders.add(uniqueKey);

      toast.info(
        <div style={{ fontSize: '15px', fontWeight: 500 }}>
          <span role="img" aria-label="alarm">🔔</span> <strong>{data.taskName}</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>
            📅 Due: {new Date(data.endDate).toLocaleString()}
          </div>
        </div>,
        {
          position: 'bottom-right',
          autoClose: 6000,
          style: {
            background: '#fff8e1',
            borderLeft: '5px solid #f57c00',
            color: '#333',
            borderRadius: '8px',
          },
          icon: false,
        }
      );

      // ⏱️ Remove from shown reminders after 1 minute so it shows again
      setTimeout(() => shownReminders.delete(uniqueKey), 1 * 60 * 1000);
    });

    setSocket(socketInstance);

    return () => {
      if (socketInstance) {
        socketInstance.off('task-reminder');
        socketInstance.disconnect();
      }
    };
  }, []);

  
  


  
  const handleFindCandidates = async (jobId) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/matching/jobs/${jobId}/matching-candidates`);
      setMatchedCandidates(res.data.candidates);
      setOpenCandidateDialog(true); // open popup
    } catch (err) {
      console.error("Error fetching candidates", err);
    }
  };
  

  const normalizedCandidates = matchedCandidates.map((row, i) => ({
    id: i + 1,
    name: row.name || row.candidateName || 'N/A',
    phoneNumber: row.phoneNumber || row.candidatePhone || 'N/A',
    // candidateEmail: row.candidateEmail || 'N/A',
    qualification: row.qualification || 'N/A',
    positionName: row.positionName || 'N/A',
    experience: row.experience || 'N/A',
    currentLocation: row.currentLocation || 'N/A',
    currentPosition: row.currentPosition || 'N/A',
    currentCTC: row.currentCTC || 'N/A',
    expectedCTC: row.expectedCTC || 'N/A',
    noticePeriod: row.noticePeriod || 'N/A',
    reasonforLeaving: row.reasonforLeaving || 'N/A',
    currentCompany: row.currentCompany || 'N/A',
    remark: row.remark || 'N/A',
    resume: row.resumeUpload || row.resumeLink || '',
  }));
  


  useEffect(() => {
    const fetchIndustries = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/allType/industries`);
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
        const res = await axios.get(`${API_BASE_URL}/allType/company-names`);
        // Now we get array of strings like "Company Name (ID: 123)"
        setCompanyNames(res.data);
      } catch (err) {
        console.error('Error fetching company names:', err);
      }
    };
    fetchCompanyNames();
  }, []);

  useEffect(() => {
    const fetchJobTitleNames = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/allType/jobTitle-names`);
        // Sort job titles in ascending order (A to Z)
        const sortedJobTitles = [...res.data].sort((a, b) => 
          a.localeCompare(b, undefined, {sensitivity: 'base'})
        );
        setJobTitleNames(sortedJobTitles);
      } catch (err) {
        console.error('Error fetching job title names:', err);
      }
    };

    
    const fetchHrUsersList = async () => {
      try {
        const response = await fetchHRUsers();
        setHrUsers(response.data);
      } catch (error) {
        console.error('Error fetching HR users:', error);
      }
    };

    fetchJobTitleNames();
    fetchHrUsersList();
  }, []);

  useEffect(() => {
    const fetchSalaryOptions = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/allType/salary-names`);
        setSalaryOptions(res.data);
      } catch (err) {
        console.error('Error fetching salary options:', err);
      }
    };
    fetchSalaryOptions();
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
    // Reset to original data when clearing filters
    if (originalSales.current.length) {
      setSales([...originalSales.current]);
    }
  };

  const filterByDate = () => {
    if (!startDate || !endDate) {
      toast.error('Please select both start and end dates');
      return;
    }

    // Convert input dates to the start and end of day in the correct timezone
    const start = dayjs(startDate).startOf('day');
    const end = dayjs(endDate).endOf('day');

    // If end date is before start date, show error
    if (end.isBefore(start)) {
      toast.error('End date cannot be before start date');
      return;
    }

    // Get the original data if it's not already available
    if (!originalSales.current.length) {
      originalSales.current = [...sales];
    }

    const filtered = originalSales.current.filter((sale) => {
      if (!sale.createdAt) return false;
      
      // Convert sale date to dayjs object in the same timezone
      const saleDate = dayjs(sale.createdAt);
      
      // Check if sale date is between start and end dates (inclusive)
      return (
        (saleDate.isAfter(start) || saleDate.isSame(start, 'day')) &&
        (saleDate.isBefore(end) || saleDate.isSame(end, 'day'))
      );
    });
    
    setSales(filtered);
  };

  // Count assigned and unassigned companies
  const assignedCount = sales.filter(sale => {
    const hasAssignedHR = Array.isArray(sale.assignedHR)
      ? sale.assignedHR.length > 0
      : !!sale.assignedHR;
    return hasAssignedHR;
  }).length;
  
  const unassignedCount = sales.length - assignedCount;

  // Debug: Log all company names in sales data
  const salesCompanyNames = sales.map(sale => sale.companyName);

  const filteredSales = sales.filter(sale => {
    // Filter by company if any companies are selected
    const companyMatch = selectedCompanies.length === 0 || 
                        selectedCompanies.some(selectedCompany => {
                          if (!selectedCompany) return false;
                          
                          // Handle different formats of selectedCompany
                          let selectedCompanyName;
                          if (typeof selectedCompany === 'string') {
                            // If it's a string, extract company name (handle both "Company Name" and "Company Name (ID: 123)" formats)
                            selectedCompanyName = selectedCompany.includes(' (ID: ') 
                              ? selectedCompany.split(' (ID: ')[0] 
                              : selectedCompany;
                          } else if (typeof selectedCompany === 'object' && selectedCompany.companyName) {
                            // If it's an object with companyName property
                            selectedCompanyName = selectedCompany.companyName;
                          } else {
                            return false;
                          }
                          
                          // Handle different formats of sale.companyName
                          let saleCompanyName;
                          if (typeof sale.companyName === 'string') {
                            saleCompanyName = sale.companyName.includes(' (ID: ') 
                              ? sale.companyName.split(' (ID: ')[0] 
                              : sale.companyName;
                          } else {
                            saleCompanyName = sale.companyName || '';
                          }
                          
                          // Use flexible matching to handle spelling variations and case differences
                          const normalizeString = (str) => {
                            return str.toLowerCase()
                                      .replace(/[^a-z0-9\s]/g, '') // Remove special characters
                                      .replace(/\s+/g, ' ') // Normalize whitespace
                                      .trim();
                          };
                          
                          const normalizedSelected = normalizeString(selectedCompanyName);
                          const normalizedSale = normalizeString(saleCompanyName);
                          
                          // Debug logging - remove after fixing
                          if (selectedCompanyName.toLowerCase().includes('candor') || saleCompanyName.toLowerCase().includes('candor')) {
                            console.log('DEBUG - Company Filter Comparison:', {
                              selectedCompany: selectedCompanyName,
                              saleCompany: saleCompanyName,
                              normalizedSelected,
                              normalizedSale,
                              exactMatch: normalizedSelected === normalizedSale,
                              selectedContainsSale: normalizedSelected.includes(normalizedSale),
                              saleContainsSelected: normalizedSale.includes(normalizedSelected)
                            });
                          }
                          
                          // Check if one string contains the other (flexible matching)
                          return normalizedSelected === normalizedSale || 
                                 normalizedSelected.includes(normalizedSale) || 
                                 normalizedSale.includes(normalizedSelected);
                        });
    
    // Filter by assigned/unassigned company
    const assignedMatch = assignmentFilter === 'all' || 
                         (assignmentFilter === 'assigned' && 
                          ((Array.isArray(sale.assignedHR) && sale.assignedHR.length > 0) || 
                           (!Array.isArray(sale.assignedHR) && !!sale.assignedHR))) || 
                         (assignmentFilter === 'unassigned' && 
                          ((Array.isArray(sale.assignedHR) && sale.assignedHR.length === 0) || 
                           (!Array.isArray(sale.assignedHR) && !sale.assignedHR)));
    
    // Filter by job title if any job titles are selected
    const jobTitleMatch = selectedJobTitle.length === 0 || 
                         selectedJobTitle.includes(sale.jobTitle);
    
    // Filter by HR if any HR is selected
    const hrMatch = !hrFilter || 
                   (sale.assignedHR && 
                    (Array.isArray(sale.assignedHR)
                      ? sale.assignedHR.some(hr => hr._id === hrFilter)
                      : sale.assignedHR._id === hrFilter));
    
    // Filter by area if any areas are selected
    const areaMatch = areaFilter.length === 0 || 
                     (sale.Area && areaFilter.some(selectedArea => 
                       sale.Area.toLowerCase().includes(selectedArea.toLowerCase())
                     ));
    
    // Return true only if all conditions are met
    return companyMatch && assignedMatch && jobTitleMatch && hrMatch && areaMatch;
  });

  // Extract unique areas from sales data
  useEffect(() => {
    const uniqueAreas = [...new Set(sales
      .map(sale => sale.Area)
      .filter(area => area && area.trim() !== '')
    )].sort();
    setAreaOptions(uniqueAreas);
  }, [sales]);

// ... (rest of the code remains the same)

  const handleRowClick = async (params) => {
    const jobId = params.row._id; // Assuming _id is present in your row

    try {
      const res = await axios.get(`${API_BASE_URL}/report/job-report/${jobId}`);
      setJobDetails(res.data);
      setOpenJobModal(true);
    } catch (err) {
      console.error("Failed to fetch job report details", err);
    }
  };

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
  

  const handleFileUploadForDescription = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFormData({ ...formData, description: file });
    }
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
            const refreshResponse = await axios.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
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


  // const handleFileUpload = async (e) => {
  //   const file = e.target.files[0];
  //   if (!file) return;

  //   const reader = new FileReader();
  //   reader.onload = (evt) => {
  //     const bstr = evt.target.result;
  //     const wb = XLSX.read(bstr, { type: 'binary' });
  //     const wsname = wb.SheetNames[0];
  //     const ws = wb.Sheets[wsname];
  //     const data = XLSX.utils.sheet_to_json(ws);

  //     // Store parsed data and file name in state
  //     setParsedJobs(data);
  //     setUploadedFileName(file.name);
  //     setImportModalOpen(true); // Show confirmation modal
  //   };

  //   reader.readAsBinaryString(file);
  // };



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
  
      // Validation before setting state
      const requiredFields = ['email', 'jobLocation', 'jobTiming', 'companyAddress'];
      const invalidRows = [];
  
      data.forEach((row, index) => {
        requiredFields.forEach(field => {
          if (!row[field] || row[field].toString().trim() === '') {
            invalidRows.push({ row: index + 2, field }); // +2 because Excel headers start from 1
          }
        });
      });
  
      if (invalidRows.length > 0) {
        const missingDetails = invalidRows.map(item => `Row ${item.row}: Missing ${item.field}`).join('\n');
        toast.error(`Import failed. Missing fields:\n${missingDetails}`, {
          autoClose: false,
          closeOnClick: true,
          position: 'top-right'
        });
        return;
      }
  
      // Set parsed data and open modal only if validation passes
      setParsedJobs(data);
      setUploadedFileName(file.name);
      setImportModalOpen(true);
    };
  
    reader.readAsBinaryString(file);
  };
  
  const handleConfirmImport = async () => {
    // Show loading toast with progress
    const toastId = toast.loading('Preparing import...', {
      position: "top-right",
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
      draggable: false,
      progress: 0
    });
    setUploadToastId(toastId);
    setUploadProgress(0);

    // Simulate progress (0-50%)
    const simulateProgress = setInterval(() => {
      setUploadProgress(prev => {
        const newProgress = Math.min(prev + 2, 50);
        toast.update(toastId, {
          render: `Processing data... ${newProgress}%`,
          progress: newProgress / 100
        });
        return newProgress;
      });
    }, 100);

    try {
      const token = sessionStorage.getItem('token');
      
      // Update progress to show upload is starting
      toast.update(toastId, {
        render: 'Uploading data to server... 50%',
        progress: 0.5
      });

      const response = await fetch(`${API_BASE_URL}/allType/import`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ jobs: parsedJobs }),
      });

      clearInterval(simulateProgress);

      // Simulate processing completion (50-100%)
      for (let i = 50; i <= 100; i += 5) {
        await new Promise(resolve => setTimeout(resolve, 50));
        setUploadProgress(i);
        toast.update(toastId, {
          render: `Finalizing import... ${i}%`,
          progress: i / 100
        });
      }

      if (response.ok) {
        getSales();
        toast.update(toastId, {
          render: 'Jobs imported successfully!',
          type: 'success',
          isLoading: false,
          autoClose: 3000,
          closeButton: true,
          progress: 1
        });
        setImportModalOpen(false);
      } else {
        throw new Error('Failed to import jobs');
      }
    } catch (err) {
      console.error('Error uploading file:', err);
      toast.update(toastId, {
        render: err.response?.data?.message || 'An error occurred while importing jobs.',
        type: 'error',
        isLoading: false,
        autoClose: 5000,
        closeButton: true
      });
    } finally {
      setUploadProgress(0);
      setUploadToastId(null);
    }
  };





  const validateEmail = (email) => {
    // Simple RFC 5322 regex for demonstration
    return /^[\w-.]+@([\w-]+\.)+[\w-]{2,}$/.test(email);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    if (name === 'email') {
      if (!value) {
        setEmailError(false);
        setEmailHelperText('');
      } else if (!validateEmail(value)) {
        setEmailError(true);
        setEmailHelperText('Please enter a valid email address');
      } else {
        setEmailError(false);
        setEmailHelperText('');
      }
    }
  };

  const handleHRChange = (e) => {
    const { value } = e.target;
    
    // If 'none' is selected in the array, clear all HR assignments
    if (Array.isArray(value) && value.includes('none')) {
      setFormData(prev => ({
        ...prev,
        assignedHR: []
      }));
      return;
    }
    
    // If it's an array, filter out 'none' and any falsy values
    const newValue = Array.isArray(value) 
      ? value.filter(v => v && v !== 'none')
      : [value].filter(v => v && v !== 'none');
    
    setFormData(prev => ({
      ...prev,
      assignedHR: newValue
    }));
  };

 
  



const handleSubmit = async (e) => {
  e.preventDefault();
  
  // Validate required fields
  const newErrors = {
    companyName: !formData.companyName.trim(),
    jobTitle: !formData.jobTitle.trim(),
    email: !formData.email.trim(),
    numberOfRequirements: !formData.numberOfRequirements,
    requiredSkills: !formData.requiredSkills.trim(),
    experience: !formData.experience.trim(),
    education: !formData.education.trim(),
    jobLocation: !formData.jobLocation.trim()
  };
  
  setErrors(newErrors);
  
  // Check if any required field has an error
  const hasErrors = Object.values(newErrors).some(error => error);
  if (hasErrors) {
    alert('Please fill in all required fields');
    setLoading(false);
    return;
  }
  
  // Email validation before submission
  if (!validateEmail(formData.email)) {
    setEmailError(true);
    setEmailHelperText('Please enter a valid email address');
    setLoading(false);
    return;
  }
  setLoading(true);
  setSuccessMessage('');

  try {
    const form = new FormData();
    let isDuplicateHR = false;

      // Process each field in formData
    Object.entries(formData).forEach(([key, value]) => {
      // Skip these fields as they are handled separately
      if (['description', 'descriptionFile', 'agreementSigned', 'gstUpload', 'createdBy'].includes(key)) return;

      if (key === 'assignedHR') {
        form.delete('assignedHR');
        // Always send an array of HR IDs, even if empty
        const hrArray = Array.isArray(value) ? value : [];
        form.append('assignedHR', JSON.stringify(hrArray));
      } else if (value !== null && value !== undefined) {
        // Only append if value is not null or undefined
        form.append(key, value);
      }
    });

    // Handle createdBy - ensure we only send the ID if it exists
    if (formData.createdBy && formData.createdBy._id) {
      form.append('createdBy', formData.createdBy._id);
    }

    if (isDuplicateHR) {
      alert('Duplicate HR assigned! Please remove duplicates before submitting.');
      setLoading(false);
      return;
    }

    if (formData.agreementSigned) {
      form.append('agreementSigned', formData.agreementSigned);
    }

    if (formData.descriptionFile) {
      form.append('descriptionFile', formData.descriptionFile);
    } else if (formData.description) {
      form.append('description', formData.description);
    }

    if (formData.gstUpload) {
      form.append('gstUpload', formData.gstUpload);
    }

    let response;
    if (editMode) {
      response = await updateSale(selectedId, form, true);
      setSuccessMessage('Update Successful!');
    } else {
      response = await createSale(form, true);
      setSuccessMessage('Create Successful!');
    }

    setFormData({
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
      keyResponsibility: '',
      requiredSkills: '',
      education: '',
      experience: '',
      salary: '',
      jobLocation: '',
      jobTiming:'',
      gender:'',
      //description: '',
      descriptionFile: '',
      agreementSigned: '',
      gstUpload: '',
      assignedHR: [],
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
    // Format assignedHR to be an array of HR IDs
    let formattedAssignedHR = [];
    
    if (sale.assignedHR) {
      if (Array.isArray(sale.assignedHR)) {
        // If it's an array, extract the IDs
        formattedAssignedHR = sale.assignedHR.map(hr => 
          typeof hr === 'object' ? hr._id || hr : hr
        ).filter(Boolean);
      } else if (typeof sale.assignedHR === 'object' && sale.assignedHR._id) {
        // If it's a single HR object
        formattedAssignedHR = [sale.assignedHR._id];
      } else if (typeof sale.assignedHR === 'string') {
        // If it's a string (ID)
        formattedAssignedHR = [sale.assignedHR];
      }
    }

    setFormData({
      ...sale,
      assignedHR: formattedAssignedHR
    });
    
    setSelectedId(sale._id);
    setEditMode(true);
    setOpen(true);
  };


  const handleClose = () => {
    setFormData({
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
      jobTiming:'',
      gender:'',
      remarks: '',
      //description: '',
      assignedHR: '',
    });
    setOpen(false); // close modal
    setEditMode(false);
    setSelectedId(null);
    setAreaFilter([]);
  };


  // const handleExport = () => {
  //   const worksheet = XLSX.utils.json_to_sheet(sales);
  //   const workbook = XLSX.utils.book_new();
  //   XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesData');
  //   XLSX.writeFile(workbook, 'SalesData.xlsx');
  // };

  // const handleExportData = async () => {
  //   console.log("Export button clicked ");
  //   let apiData = null;

  //   try {
  //     const token = sessionStorage.getItem('token');
  //     if (!token) {
  //       alert('Authentication token not found. Please login again.');
  //       return;
  //     }

  //     console.log('Making API call to export data...');
  //     const response = await fetch(`${API_BASE_URL}/allType/export-data`, {
  //       method: 'GET',
  //       headers: {
  //         'Authorization': `Bearer ${token}`,
  //         'Content-Type': 'application/json'
  //       }
  //     });
      
  //     console.log('API Response status:', response.status);
  //     if (!response.ok) {
  //       throw new Error(`HTTP error! status: ${response.status}`);
  //     }

  //     apiData = await response.json();
  //     console.log('Received data from API:', apiData);

  //     if (!Array.isArray(apiData) || apiData.length === 0) {
  //       throw new Error('No data received from server or invalid data format');
  //     }

  //   } catch (error) {
  //     console.error('Export Error:', error);
  //     alert(`Failed to export data: ${error.message}`);
  //     return; // Exit if API call fails
  //   }

  //   // Only proceed with Excel creation if we have valid data from API
  //   try {
  //     // Sort data by createdAt in descending order (newest first)
  //     const sortedData = [...apiData].sort((a, b) => {
  //       const dateA = new Date(a.createdAt);
  //       const dateB = new Date(b.createdAt);
  //       return dateB - dateA; // Sort in descending order
  //     });

  //     const formattedData = sortedData.map(job => ({
  //       Industries: job.industries || '',
  //       Company_Name: job.companyName || '',
  //       Company_ID: job.companyId || '',
  //       Company_Address: job.companyAddress || '',
  //       Contact_Name: job.contactName || '',
  //       Email: job.email || '',
  //       Phone_Number: job.phoneNumber || '',
  //       Response: job.response || '',
  //       Job_Title: job.jobTitle || '',
  //       Benefits: job.benefits || '',
  //       No_of_Requirements: job.numberOfRequirements || '',
  //       Website_URL: job.websiteURL || '',
  //       Key_Responsibility: job.keyResponsibility || '',
  //       Required_Skills: job.requiredSkills || '',
  //       Education: job.education || '',
  //       Experience: job.experience || '',
  //       Salary: job.salary || '',
  //       Job_Location: job.jobLocation || '',
  //       Job_Timing: job.jobTiming || '',
  //       Remarks: job.remarks || '',
  //       //Description: job.description || '',
  //       Assigned_HR: job.assignedHR && job.assignedHR.length > 0
  //         ? job.assignedHR
  //             .map(hr => 
  //               typeof hr === 'object' 
  //                 ? `${hr.firstName || ''} ${hr.lastName || ''}`.trim()
  //                 : hr
  //             )
  //             .filter(Boolean)
  //             .join(', ')
  //         : 'Not Assigned',
  //       Created_By: job.createdBy
  //         ? typeof job.createdBy === 'object'
  //           ? `${job.createdBy.firstName || ''} ${job.createdBy.lastName || ''} (${job.createdBy.role || ''})`
  //           : String(job.createdBy || 'N/A')
  //         : 'N/A',
  //       Created_At: job.createdAt ? new Date(job.createdAt).toLocaleString() : 'N/A'
  //     }));

  //     if (formattedData.length === 0) {
  //       throw new Error('No data available to export');
  //     }

  //     console.log('Creating Excel file with formatted data...');
  //     const worksheet = XLSX.utils.json_to_sheet(formattedData);
  //     const workbook = XLSX.utils.book_new();
  //     XLSX.utils.book_append_sheet(workbook, worksheet, 'JobData');
      
  //     // Generate filename with current date
  //     const date = new Date().toISOString().split('T')[0];
  //     const filename = `JobOpeningsExport_${date}.xlsx`;
      
  //     console.log('Exporting file:', filename);
  //     XLSX.writeFile(workbook, filename);
  //     console.log('Export completed successfully');
  //   } catch (error) {
  //     console.error('Excel Creation Error:', error);
  //     alert(`Failed to create Excel file: ${error.message}`);
  //   }
  // };

  const handleExportData = async () => {
    console.log("Export button clicked ");
    let apiData = null;
  
    try {
      const token = sessionStorage.getItem('token');
      if (!token) {
        alert('Authentication token not found. Please login again.');
        return;
      }
  
      const response = await fetch(`${API_BASE_URL}/allType/export-data`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
  
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
  
      apiData = await response.json();
  
      if (!Array.isArray(apiData) || apiData.length === 0) {
        throw new Error('No data received from server or invalid data format');
      }
    } catch (error) {
      console.error('Export Error:', error);
      alert(`Failed to export data: ${error.message}`);
      return;
    }
  
    try {
      const sortedData = [...apiData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
  
      // Dynamically generate header and data using column definitions
      const exportableColumns = columns.filter(col =>
        !['actions', 'remove', 'descriptionFile', 'agreementSigned'].includes(col.field)
      );
  
      const formattedData = sortedData.map(row => {
        const formattedRow = {};
  
        exportableColumns.forEach(col => {
          const field = col.field;
          let value = row[field];
  
          // Handle special formatting per column
          if (field === 'assignedHR') {
            value = Array.isArray(value)
              ? value.map(hr => typeof hr === 'object'
                  ? `${hr.firstName || ''} ${hr.lastName || ''}`.trim()
                  : hr).join(', ')
              : 'Not Assigned';
          }
  
          if (field === 'createdBy') {
            value = value
              ? typeof value === 'object'
                ? `${value.firstName || ''} ${value.lastName || ''} (${value.role || ''})`
                : String(value)
              : 'N/A';
          }
  
          if (field === 'createdAt') {
            value = value ? new Date(value).toLocaleString() : 'N/A';
          }
  
          formattedRow[col.headerName] = value ?? '';
        });
  
        return formattedRow;
      });
  
      if (formattedData.length === 0) {
        throw new Error('No data available to export');
      }
  
      const worksheet = XLSX.utils.json_to_sheet(formattedData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'JobData');
  
      const date = new Date().toISOString().split('T')[0];
      const filename = `JobOpeningsExport_${date}.xlsx`;
  
      XLSX.writeFile(workbook, filename);
      console.log('Export completed successfully');
    } catch (error) {
      console.error('Excel Creation Error:', error);
      alert(`Failed to create Excel file: ${error.message}`);
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
    'contactName',
    'email',
    'companyAddress',
    'Area',
    'gender',
    'keyResponsibility',
    'requiredSkills',
    'remarks',
    // excluded: assignedHR, agreementSigned, descriptionFile, companyId, gstUpload
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
      width: 180,
      renderCell: (params) => (
        <>
          {canDo('tl-job-report:edit') && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleEdit(params.row);
            }}
            variant="contained"
            color="primary"
            size="small"
          >
            Edit
          </Button>
          )}
          {canDo('tl-job-report:find-candidates') && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleFindCandidates(params.row._id);
            }}
            variant="contained"
            color="success"
            size="small"
            style={{ marginLeft: 8 }}
          >
            Find
          </Button>
          )}
        </>
      ),
    },
    
    {
      field: 'assignedHR',
      headerName: 'Assigned HR',
      width: 250,
      renderCell: (params) => {
        const assignedHRs = params.row.assignedHR || [];
    
        if (!Array.isArray(assignedHRs) || assignedHRs.length === 0) {
          return <span>Not Assigned</span>;
        }
    
        // If it's a single HR (for backward compatibility)
        if (assignedHRs && !Array.isArray(assignedHRs) && assignedHRs.firstName) {
          const name = `${assignedHRs.firstName || ''} ${assignedHRs.lastName || ''}`.trim();
          return <span>{name}</span>;
        }

        // Handle array of HRs
        const hrNames = assignedHRs
          .map(hr => {
            if (typeof hr === 'string') {
              // If it's just an ID, try to find the HR in hrUsers
              const hrUser = hrUsers.find(h => h._id === hr);
              return hrUser ? `${hrUser.firstName || ''} ${hrUser.lastName || ''}`.trim() : null;
            }
            return hr ? `${hr.firstName || ''} ${hr.lastName || ''}`.trim() : null;
          })
          .filter(Boolean);
    
        return (
          <Box>
            {hrNames.length > 0 ? (
              <Tooltip title={hrNames.join(', ')}>
                <span>{hrNames.join(', ')}</span>
              </Tooltip>
            ) : (
              <span>Not Assigned</span>
            )}
          </Box>
        );
      },
    },
    
    
    { 
      field: 'companyName', 
      headerName: 'Company Name', 
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
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
      width: 170,
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
      field: 'jobTiming', 
      headerName: 'Job Timing', 
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
      field: 'jobLocation', 
      headerName: 'Job Location', 
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
          'No URL available'
        ),
    },

    { 
      field: 'industries', 
      headerName: 'Industries', 
      width: 180,
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
      field: 'phoneNumber', 
      headerName: 'Phone Number', 
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
      field: 'contactName', 
      headerName: 'Contact Name', 
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
      field: 'email', 
      headerName: 'Email', 
      width: 180,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {params.value}
          </div>
        </Tooltip>
      )
    },

    
  { 
    field: 'companyAddress', 
    headerName: 'Company Address', 
    width: 180,
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
    width: 200,
    renderCell: (params) => {
      const fileUrl = params.row.descriptionFile;
      return fileUrl ? (
        <Tooltip title="Click to view PDF" arrow>
          <a
            href={fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ 
              color: '#1976d2', 
              textDecoration: 'underline',
              display: 'inline-block',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              width: '100%'
            }}
          >
            View PDF
          </a>
        </Tooltip>
      ) : (
        <span>No PDF available</span>
      );
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
        'No PDF available'
      ),
  },
  
 {
    field: 'gstUpload',
    headerName: 'GST Upload',
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
          View GST
        </a>
      ) : (
        'No GST available'
      ),
  },


  { 
    field: 'companyId', 
    headerName: 'Company ID', 
    width: 180,
    renderCell: (params) => (
      <Tooltip title={params.value || ''} arrow>
        <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
          {params.value}
        </div>
      </Tooltip>
    )
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
        const displayText = `${name} (${role})`;
        
        return (
          <Tooltip title={displayText} arrow>
            <div style={{ 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis',
              width: '100%'
            }}>
              {displayText}
            </div>
          </Tooltip>
        );
      }
    },
     

    {
      field: 'remove',
      headerName: 'Remove',
      width: 100,
      renderCell: (params) => (
        <>
          {canDo('tl-job-report:delete') && (
          <Button
            onClick={(e) => {
              e.stopPropagation();
              handleDelete(params.row._id);
            }}
            variant="contained"
            color="secondary"
            size="small"
            style={{ marginLeft: 8 }}
          >
            Delete
          </Button>
          )}
        </>
      ),
    },


  ];

  return (
    <div style={{ 
      display: 'flex', 
      minHeight: '100vh', 
      marginLeft: '-10px', 
      backgroundColor: '#f5f5f5',
      scrollBehavior: 'smooth'
    }}>
      {/* Sidebar is fixed */}
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white', zIndex: 1000 }}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '250px',
          minHeight: '100vh',
          overflowY: 'auto',
          overflowX: 'hidden',
          scrollBehavior: 'smooth',
          '&::-webkit-scrollbar': {
            width: '8px',
          },
          '&::-webkit-scrollbar-track': {
            background: '#f1f1f1',
            borderRadius: '4px',
          },
          '&::-webkit-scrollbar-thumb': {
            background: '#c1c1c1',
            borderRadius: '4px',
            '&:hover': {
              background: '#a8a8a8',
            },
          },
        }}
      >
        {/* Navbar is sticky at the top */}
        <Box sx={{ position: 'sticky', top: 0, zIndex: 999, backgroundColor: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}>
          <Navbar />
        </Box>
        <Box sx={{ p: 3, flex: 1 }}>
          {/* Page Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 3 }}>
            <Box>
              <Typography variant="h5" sx={{ fontWeight: 700, color: '#111827', letterSpacing: '-0.3px' }}>
                Job Opening Report
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7280', mt: 0.5 }}>
                Manage and track all job openings
              </Typography>
            </Box>
          </Box>

          {/* Filters Card */}
          <Box sx={{
            bgcolor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            p: 2.5,
            mb: 2,
          }}>
            <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em', mb: 2, display: 'block' }}>
              Filters
            </Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1.5, alignItems: 'flex-start' }}>
              <TextField
                label="Start Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                size="small"
                sx={{ width: 160 }}
              />
              <TextField
                label="End Date"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                size="small"
                sx={{ width: 160 }}
              />
              <Button
                variant="contained"
                onClick={() => filterByDate()}
                size="small"
                sx={{ height: 40, px: 2.5, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', borderRadius: '8px', textTransform: 'none', fontWeight: 600, boxShadow: '0 2px 8px rgba(79,70,229,0.4)', '&:hover': { background: 'linear-gradient(135deg, #4338ca, #6d28d9)', boxShadow: '0 4px 12px rgba(79,70,229,0.5)' } }}
              >
                Apply
              </Button>
              <Button
                variant="outlined"
                onClick={() => { setStartDate(''); setEndDate(''); getSales(); }}
                size="small"
                sx={{ height: 40, px: 2.5, borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#4F46E5', color: '#4F46E5', '&:hover': { bgcolor: '#eef2ff', borderColor: '#4338ca' } }}
              >
                Reset Dates
              </Button>

              <Autocomplete
                multiple
                id="company-filter"
                options={companyNames}
                value={selectedCompanies}
                onChange={(event, newValue) => setSelectedCompanies(newValue)}
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Company" size="small" sx={{ minWidth: 220 }} />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox style={{ marginRight: 8 }} checked={selected} />{option}</li>
                )}
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} size="small" {...getTagProps({ index })} sx={{ m: 0.5 }} />
                  ))
                }
                disableCloseOnSelect
              />

              <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel id="hr-filter-label">HR</InputLabel>
                <Select
                  labelId="hr-filter-label"
                  value={hrFilter}
                  onChange={(e) => setHrFilter(e.target.value)}
                  label="HR"
                >
                  <MenuItem value=""><em>All HRs</em></MenuItem>
                  {hrUsers.map((hr) => (
                    <MenuItem key={hr._id} value={hr._id}>
                      {`${hr.firstName || ''} ${hr.lastName || ''}`.trim()}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Autocomplete
                multiple
                id="salary-filter"
                options={salaryOptions}
                value={selectedSalaries}
                onChange={(event, newValue) => setSelectedSalaries(newValue)}
                inputValue={salaryInput}
                onInputChange={(event, newInputValue) => setSalaryInput(newInputValue)}
                freeSolo
                disableCloseOnSelect
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} sx={{ fontSize: 13, borderRadius: '8px' }} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Salary" placeholder="Enter or select" size="small" sx={{ minWidth: 180 }} />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox style={{ marginRight: 8 }} checked={selected} size="small" /><Typography variant="body2">{option}</Typography></li>
                )}
              />

              <Autocomplete
                multiple
                id="job-title-filter"
                options={jobTitleNames}
                value={selectedJobTitle}
                onChange={(event, newValue) => setSelectedJobTitle(newValue)}
                inputValue={jobTitleInput}
                onInputChange={(event, newInputValue) => setJobTitleInput(newInputValue)}
                freeSolo
                disableCloseOnSelect
                renderTags={(value, getTagProps) =>
                  value.map((option, index) => (
                    <Chip variant="outlined" label={option} {...getTagProps({ index })} key={option} sx={{ fontSize: 13, borderRadius: '8px' }} />
                  ))
                }
                renderInput={(params) => (
                  <TextField {...params} variant="outlined" label="Job Title" placeholder="Type or select" size="small" sx={{ minWidth: 200 }} />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox style={{ marginRight: 8 }} checked={selected} size="small" /><Typography variant="body2">{option}</Typography></li>
                )}
              />

              <Autocomplete
                multiple
                options={areaOptions}
                value={areaFilter}
                onChange={(event, newValue) => setAreaFilter(newValue)}
                onInputChange={(event, newInputValue) => {
                  if (event && event.type === 'change') {
                    const typedValue = newInputValue.trim();
                    if (typedValue && !areaOptions.includes(typedValue)) {
                      setAreaFilter(prev => [...prev, typedValue]);
                    }
                  }
                }}
                renderOption={(props, option, { selected }) => (
                  <li {...props}><Checkbox checked={selected} sx={{ marginRight: 1 }} />{option}</li>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Area" variant="outlined" size="small" placeholder="Select or type..." sx={{ minWidth: 180 }} />
                )}
                disableCloseOnSelect
                freeSolo
              />

              {(selectedCompanies.length > 0 || hrFilter || selectedSalaries.length > 0 || selectedJobTitle.length > 0 || areaFilter.length > 0) && (
                <Button
                  variant="text"
                  size="small"
                  onClick={() => { setSelectedCompanies([]); setHrFilter(''); setSelectedSalaries([]); resetJobTitle(); setAreaFilter([]); }}
                  sx={{ height: 40, textTransform: 'none', color: '#ef4444', fontWeight: 600, border: '1px dashed #fca5a5', borderRadius: '8px', '&:hover': { bgcolor: '#fef2f2', borderColor: '#ef4444' } }}
                >
                  Clear All Filters
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




          {/* Action Bar */}
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mb: 2,
            bgcolor: '#fff',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            p: 1.5,
          }}>
            {/* Assignment Filter */}
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <Typography variant="body2" sx={{ color: '#6b7280', fontWeight: 600, mr: 0.5 }}>Show:</Typography>
              <Button
                variant={assignmentFilter === 'all' ? 'contained' : 'outlined'}
                onClick={() => setAssignmentFilter('all')}
                size="small"
                sx={{
                  borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  ...(assignmentFilter === 'all'
                    ? { bgcolor: '#4F46E5', '&:hover': { bgcolor: '#4338ca' } }
                    : { borderColor: '#e5e7eb', color: '#374151', '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' } })
                }}
              >
                All ({sales.length})
              </Button>
              <Button
                variant={assignmentFilter === 'assigned' ? 'contained' : 'outlined'}
                onClick={() => setAssignmentFilter('assigned')}
                size="small"
                sx={{
                  borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  ...(assignmentFilter === 'assigned'
                    ? { bgcolor: '#059669', '&:hover': { bgcolor: '#047857' } }
                    : { borderColor: '#e5e7eb', color: '#374151', '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' } })
                }}
              >
                Assigned ({assignedCount})
              </Button>
              <Button
                variant={assignmentFilter === 'unassigned' ? 'contained' : 'outlined'}
                onClick={() => setAssignmentFilter('unassigned')}
                size="small"
                sx={{
                  borderRadius: '8px', textTransform: 'none', fontWeight: 600,
                  ...(assignmentFilter === 'unassigned'
                    ? { bgcolor: '#d97706', '&:hover': { bgcolor: '#b45309' } }
                    : { borderColor: '#e5e7eb', color: '#374151', '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' } })
                }}
              >
                Unassigned ({unassignedCount})
              </Button>
            </Box>

            {/* Action Buttons */}
            <Box sx={{ display: 'flex', gap: 1.5, alignItems: 'center' }}>
              {canDo('tl-job-report:post-new') && (
              <Button
                variant="contained"
                onClick={() => setOpen(true)}
                size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, background: 'linear-gradient(135deg, #4F46E5, #7C3AED)', color: '#fff', boxShadow: '0 2px 8px rgba(79,70,229,0.35)', '&:hover': { background: 'linear-gradient(135deg, #4338ca, #6d28d9)', boxShadow: '0 4px 12px rgba(79,70,229,0.5)' }, px: 2 }}
              >
                + Post New Opening
              </Button>
              )}
              {canDo('tl-job-report:export') && (
              <Button
                variant="outlined"
                onClick={handleExportData}
                size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' }, px: 2 }}
              >
                Export to Excel
              </Button>
              )}
              {canDo('tl-job-report:download-template') && (
              <Button
                variant="outlined"
                onClick={handleDownloadJobTemplate}
                size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' }, px: 2 }}
              >
                Download Template
              </Button>
              )}
              {canDo('tl-job-report:import') && (
              <>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} id="upload-excel" />
              <label htmlFor="upload-excel">
                <Button
                  variant="outlined"
                  component="span"
                  size="small"
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#e5e7eb', color: '#374151', '&:hover': { borderColor: '#d1d5db', bgcolor: '#f9fafb' }, px: 2 }}
                >
                  Import Excel
                </Button>
              </label>
              </>
              )}
            </Box>
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
              disableColumnReorder={false} // Must be false to allow drag & drop
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
      display: "flex",
      flexDirection: "column",
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
  Assigned HR:{" "}
  {jobDetails?.job?.assignedHR?.length > 0
    ? jobDetails.job.assignedHR.map(
        (hr, index) =>
          `${hr.firstName} ${hr.lastName}${
            index !== jobDetails.job.assignedHR.length - 1 ? ", " : ""
          }`
      )
    : "Not Assigned"}
</Typography>

      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Job Start:{" "}
        {jobDetails?.job?.startDate
          ? new Date(jobDetails.job.startDate).toLocaleString()
          : "N/A"}
      </Typography>
      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
        Job End:{" "}
        {jobDetails?.job?.endDate
          ? new Date(jobDetails.job.endDate).toLocaleString()
          : "N/A"}
      </Typography>

      {/* Total Candidates Count */}
      <Typography
        variant="h6"
        sx={{
          mt: 2,
          color: "#1976d2",
          fontWeight: "bold",
        }}
      >
        Total Candidates: {jobDetails?.candidates?.length || 0}
      </Typography>
    </Box>

    {/* Search and Filter */}
    <Box sx={{ mb: 2, width: 300 }}>
      <TextField
        fullWidth
        variant="outlined"
        size="small"
        placeholder="Search candidates..."
        value={candidateFilter}
        onChange={(e) => setCandidateFilter(e.target.value)}
        sx={{
          '& .MuiOutlinedInput-root': {
            borderRadius: 2,
            backgroundColor: 'background.paper',
            '&:hover .MuiOutlinedInput-notchedOutline': {
              borderColor: 'primary.light',
            },
          },
        }}
        InputProps={{
          startAdornment: (
            <InputAdornment position="start" sx={{ color: 'text.secondary' }}>
              <SearchIcon fontSize="small" />
            </InputAdornment>
          ),
        }}
      />
    </Box>

    {/* Candidate Cards - Scrollable */}
    <Box sx={{ overflowY: 'auto', maxHeight: '60vh', mt: 2 }}>
      <Grid container spacing={2} sx={{ p: 1 }}>
        {jobDetails?.candidates
          ?.filter(candidate => 
            candidate.candidateName?.toLowerCase().includes(candidateFilter.toLowerCase())
          )
          .map((c) => (
          <Grid item xs={12} sm={6} md={4} lg={3} key={c._id}>
            <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', boxShadow: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold">
                    {c.candidateName || 'N/A'}
                  </Typography>
                  <Chip 
                    label={c.lineupStatus || 'N/A'} 
                    size="small" 
                    color={c.lineupStatus === 'Selected' ? 'success' : 'default'}
                  />
                </Box>
                
                <Divider sx={{ my: 1 }} />
                
                <Grid container spacing={1}>
                  <DetailItem label="Position" value={c.positionName} />
                  <DetailItem label="Experience" value={`${c.experience || 'N/A'}`} />
                  <DetailItem label="Location" value={c.currentLocation} />
                  <DetailItem label="Current CTC" value={c.currentCTC} />
                  <DetailItem label="Expected CTC" value={c.expectedCTC} />
                  <DetailItem label="Notice Period" value={c.noticePeriod} />
                  <DetailItem label="Current Company" value={c.currentCompany} />
                  <DetailItem label="Email" value={c.candidateEmail} />
                  <DetailItem label="Mobile" value={c.candidatePhone} />
                  
                  {c.interviewDate && (
                    <DetailItem 
                      label="Interview Date" 
                      value={new Date(c.interviewDate).toLocaleDateString()} 
                    />
                  )}
                  
                  <Grid item xs={12} sx={{ mt: 1 }}>
                  <Button
  fullWidth
  variant="outlined"
  size="small"
  onClick={() => 
    c.resumeLink && c.resumeLink !== "No Resume" &&
    window.open(c.resumeLink, "_blank")
  }
  disabled={!c.resumeLink || c.resumeLink === "No Resume"}
>
  View Resume
</Button>

                  </Grid>
                </Grid>
              </CardContent>
              
              <Box sx={{ p: 1, bgcolor: 'grey.100', mt: 'auto' }}>
                <Typography variant="caption" color="text.secondary">
                  Added: {c.createdAt ? new Date(c.createdAt).toLocaleString() : 'N/A'}
                </Typography>
              </Box>
            </Card>
          </Grid>
        ))}
      </Grid>
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
  }}
  onChange={(e, value) => {
    if (value) {
      const name = value.companyName ? String(value.companyName) : String(value || '');
      setInputText(name);
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
        gstUpload: value.gstUpload || '',
        existingAgreement: value.agreementSigned ? {
          name: 'Existing Agreement',
          url: value.agreementSigned,
          isExisting: true
        } : null
      }));
    }
  }}
  renderInput={(params) => (
    <TextField
      {...params}
      label="Company Name or ID"
      fullWidth
      helperText={errors.companyName ? "Company name is required" : "Search by company name or ID"}
      value={inputText}
      onChange={(e) => {
        setInputText(e.target.value);
        handleChange({ target: { name: 'companyName', value: e.target.value } });
        if (errors.companyName) {
          setErrors(prev => ({ ...prev, companyName: false }));
        }
      }}
      error={errors.companyName}
      required
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

                  <TextField
                    label="Company Address"
                    name="companyAddress"
                    value={formData.companyAddress}
                    onChange={handleChange}
                    fullWidth
                  />
                  <TextField
                    label="Area"
                    name="Area"
                    value={formData.Area}
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
                    onChange={(e) => {
                      const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
                      if (emailRegex.test(e.target.value)) {
                        setEmailError(false);
                        setEmailHelperText('');
                      } else {
                        setEmailError(true);
                        setEmailHelperText('Invalid email format');
                      }
                      handleChange(e);
                    }}
                    error={emailError}
                    helperText={emailHelperText}
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
                    label="Wesite URL"
                    name="websiteURL"
                    value={formData.websiteURL}
                    onChange={handleChange}
                    fullWidth
                  />
               
                  <TextField
                    label="Job Title"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.jobTitle) {
                        setErrors(prev => ({ ...prev, jobTitle: false }));
                      }
                    }}
                    fullWidth
                    error={errors.jobTitle}
                    helperText={errors.jobTitle ? "Job title is required" : ""}
                    required
                  />
                    <Box>
                      <Typography mb={1}>Upload Agreement (PDF):</Typography>
                      <Button 
                        variant="outlined" 
                        component="label" 
                        startIcon={<UploadFileIcon />}
                        disabled={!!formData.existingAgreement}
                      >
                        {formData.existingAgreement ? 'Agreement Exists' : 'Upload Agreement'}
                        <input
                          type="file"
                          hidden
                          accept=".pdf"
                          onChange={(e) => setFormData(prev => ({
                            ...prev,
                            agreementSigned: e.target.files[0],
                            existingAgreement: null
                          }))}
                        />
                      </Button>
                      {formData.existingAgreement ? (
                        <Box mt={1} display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="textSecondary">
                            Existing agreement found
                          </Typography>
                          <Button 
                            size="small" 
                            color="primary"
                            onClick={() => window.open(formData.existingAgreement.url, '_blank')}
                            startIcon={<VisibilityIcon />}
                          >
                            View
                          </Button>
                          <Button 
                            size="small" 
                            color="secondary"
                            onClick={() => setFormData(prev => ({
                              ...prev,
                              existingAgreement: null,
                              agreementSigned: ''
                            }))}
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

                {/* Right Column */}
                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                 
                  
                <Grid container spacing={2}>

<Grid item xs={6}>
                     <TextField
                    label="Response"
                    name="response"
                    value={formData.response}
                    onChange={handleChange}
                    fullWidth
                  />
                  </Grid>
                  <Grid item xs={6}>

                  <TextField
                    label="Number of Openings"
                    name="numberOfRequirements"
                    type="number"
                    value={formData.numberOfRequirements}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.numberOfRequirements) {
                        setErrors(prev => ({ ...prev, numberOfRequirements: false }));
                      }
                    }}
                    fullWidth
                    error={errors.numberOfRequirements}
                    helperText={errors.numberOfRequirements ? "Number of openings is required" : ""}
                    required
                  />
                  </Grid>
                  </Grid>
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
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.requiredSkills) {
                        setErrors(prev => ({ ...prev, requiredSkills: false }));
                      }
                    }}
                    fullWidth
                    error={errors.requiredSkills}
                    helperText={errors.requiredSkills ? "Required skills are required" : ""}
                    required
                  />
                  <TextField
                    label="Education"
                    name="education"
                    value={formData.education}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.education) {
                        setErrors(prev => ({ ...prev, education: false }));
                      }
                    }}
                    fullWidth
                    error={errors.education}
                    helperText={errors.education ? "Education is required" : ""}
                    required
                  />
                    <Grid container spacing={2}>

                    <Grid item xs={6}>
                    <Autocomplete
  freeSolo
  options={['Male', 'Female', 'Other']}
  value={formData.gender || ''} // default to empty string if null
  onChange={(event, newValue) => {
    setFormData({ ...formData, gender: newValue || '' }); // allow empty
  }}
  onInputChange={(event, newInputValue) => {
    setFormData({ ...formData, gender: newInputValue });
  }}
  renderInput={(params) => (
    <TextField {...params} label="Gender" name="gender" fullWidth />
  )}
/>
                   
                  </Grid>
                  <Grid item xs={6}>
                  <TextField
                    label="Experience"
                    name="experience"
                    value={formData.experience}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.experience) {
                        setErrors(prev => ({ ...prev, experience: false }));
                      }
                    }}
                    fullWidth
                    error={errors.experience}
                    helperText={errors.experience ? "Experience is required" : ""}
                    required
                  />
               </Grid>
                </Grid>
                <Grid container spacing={2}>
  <Grid item xs={6}>
    <TextField
      label="Salary"
      name="salary"
      value={formData.salary}
      onChange={handleChange}
      fullWidth
    />
  </Grid>
  <Grid item xs={6}>
    <TextField
      label="Job Timing"
      name="jobTiming"
      value={formData.jobTiming || ''}
      onChange={handleChange}
      fullWidth
    />
  </Grid>
</Grid>

                  <TextField
                    label="Job Location"
                    name="jobLocation"
                    value={formData.jobLocation}
                    onChange={(e) => {
                      handleChange(e);
                      if (errors.jobLocation) {
                        setErrors(prev => ({ ...prev, jobLocation: false }));
                      }
                    }}
                    fullWidth
                    error={errors.jobLocation}
                    helperText={errors.jobLocation ? "Job location is required" : ""}
                    required
                  />
                
                    <TextField
                    label="Benefits"
                    name="benefits"
                    value={formData.benefits}
                    onChange={handleChange}
                    fullWidth
                  />

<Grid container spacing={2}>

<Grid item xs={6}>

<Box>
  <Typography mb={1}>Job Description PDF:</Typography>


  {/* File Upload */}
  <Button
    variant="outlined"
    component="label"
    startIcon={<UploadFileIcon />}
    sx={{ mt: 1 }}
  >
    Upload PDF
    <input
      type="file"
      hidden
      accept=".pdf,.doc,.docx"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file.size > 1024 * 1024 * 5) {
          setFileErrors({
            ...fileErrors,
            descriptionFile: 'File size exceeds 5MB',
          });
        } else {
          setFormData({ ...formData, descriptionFile: file });
          setFileErrors({ ...fileErrors, descriptionFile: null });
        }
      }}
    />
  </Button>

  {formData.descriptionFile && (
    <Box>
      <Typography variant="body2" color="textSecondary" mt={1}>
        {formData.descriptionFile.name}
      </Typography>
      {fileErrors.descriptionFile && (
        <Typography variant="caption" color="error">
          {fileErrors.descriptionFile}
        </Typography>
      )}
    </Box>
  )}
</Box>
</Grid>
<Grid item xs={6}>


<Box>
  <Typography mb={1}>GST Upload PDF:</Typography>


  {/* File Upload */}
  <Button
    variant="outlined"
    component="label"
    startIcon={<UploadFileIcon />}
    sx={{ mt: 1 }}
  >
    Upload PDF
    <input
      type="file"
      hidden
      accept=".pdf,.doc,.docx"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file.size > 1024 * 1024 * 5) {
          setFileErrors({
            ...fileErrors,
            gstUpload: 'File size exceeds 5MB',
          });
        } else {
          setFormData({ ...formData, gstUpload: file });
          setFileErrors({ ...fileErrors, gstUpload: null });
        }
      }}
    />
  </Button>

  {formData.gstUpload && (
    <Box>
      <Typography variant="body2" color="textSecondary" mt={1}>
        {formData.gstUpload.name}
      </Typography>
      {fileErrors.gstUpload && (
        <Typography variant="caption" color="error">
          {fileErrors.gstUpload}
        </Typography>
      )}
    </Box>
  )}
</Box>
</Grid>
</Grid>             
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
                    value={formData.assignedHR || []}
                    onChange={handleHRChange}
                    label="Assign HR"
                    multiple
                    renderValue={(selected) => {
                      if (!selected || selected.length === 0) return 'Not Assigned';
                      return selected
                        .map(id => {
                          const hr = hrUsers.find(hr => hr._id === id);
                          return hr ? `${hr.firstName} ${hr.lastName}` : '';
                        })
                        .filter(Boolean)
                        .join(', ');
                    }}
                  >
                    <MenuItem value="none">
                      <Checkbox 
                        checked={!formData.assignedHR || formData.assignedHR.length === 0} 
                        indeterminate={false}
                      />
                      <ListItemText primary="Not Assigned" />
                    </MenuItem>
                    {hrUsers.map((hr) => (
                      <MenuItem key={hr._id} value={hr._id}>
                        <Checkbox 
                          checked={formData.assignedHR?.includes(hr._id)} 
                          indeterminate={false}
                        />
                        <ListItemText primary={`${hr.firstName} ${hr.lastName}`} />
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

          {/* Commented out duplicate dialog
          <Dialog
            open={openCandidateDialog}
            onClose={() => setOpenCandidateDialog(false)}
            fullWidth
            maxWidth="xl"
          >
            <DialogTitle>Matching Candidates</DialogTitle>
            <DialogContent>
              <div style={{ height: 500, width: '100%' }}>
                <DataGrid
                  rows={matchedCandidates.map((row, i) => ({ id: i + 1, ...row }))}
                  columns={[
                    { field: 'name', headerName: 'Name', width: 150 },
                    { field: 'phoneNumber', headerName: 'Phone', width: 130 },
                    { field: 'positionName', headerName: 'Position', width: 150 },
                    { field: 'experience', headerName: 'Experience', width: 100 },
                    { field: 'currentLocation', headerName: 'Location', width: 150 },
                    { field: 'expectedCTC', headerName: 'Expected CTC', width: 130 },
                    { field: 'noticePeriod', headerName: 'Notice', width: 100 },
                    {
                      field: 'resumeUpload',
                      headerName: 'Resume',
                      width: 100,
                      renderCell: (params) => (
                        <a
                          href={params.value}
                          target="_blank"
                          rel="noreferrer"
                          style={{ color: 'blue' }}
                        >
                          View
                        </a>
                      ),
                    }
                  ]}
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 25]}
                />
              </div>
            </DialogContent>
          </Dialog>
          */}

          <Dialog
            open={openCandidateDialog}
            onClose={() => setOpenCandidateDialog(false)}
            fullWidth
            maxWidth="xl"
          >
  <DialogTitle>Matching Candidates</DialogTitle>
  <DialogContent>
    <div style={{ height: 600, width: '100%' }}>
      <DataGrid
        rows={normalizedCandidates}
        columns={[
          { field: 'name', headerName: 'Name', width: 150 },
          { field: 'phoneNumber', headerName: 'Phone', width: 130 },
          // { field: 'candidateEmail', headerName: 'Email', width: 180 },
          // { field: 'qualification', headerName: 'Qualification', width: 150 },
          { field: 'positionName', headerName: 'Position', width: 150 },
          { field: 'experience', headerName: 'Experience', width: 100 },
          { field: 'currentLocation', headerName: 'Location', width: 150 },
          { field: 'currentPosition', headerName: 'Current Position', width: 160 },
          { field: 'currentCTC', headerName: 'Current CTC', width: 130 },
          { field: 'expectedCTC', headerName: 'Expected CTC', width: 130 },
          { field: 'noticePeriod', headerName: 'Notice Period', width: 130 },
          { field: 'reasonforLeaving', headerName: 'Reason for Leaving', width: 180 },
          { field: 'currentCompany', headerName: 'Current Company', width: 150 },
          { field: 'remark', headerName: 'Remark', width: 150 },
          {
            field: 'resume',
            headerName: 'Resume',
            width: 100,
            renderCell: (params) => (
              params.value ? (
                <a
                  href={params.value}
                  target="_blank"
                  rel="noreferrer"
                  style={{ color: 'blue' }}
                >
                  View
                </a>
              ) : (
                <span style={{ color: 'gray' }}>N/A</span>
              )
            ),
          }
        ]}
        pageSize={10}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </div>
  </DialogContent>
</Dialog>

        </Box>
      </Box>
      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </div>
  );
};

export default JobReport;

