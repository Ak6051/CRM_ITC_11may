
import React, { useState, useEffect, useRef, useMemo } from 'react';
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
  DialogActions,
  Chip,
  Tooltip,
  Card,
  CardContent,
  Divider,
  InputAdornment,
  Drawer,
  IconButton,
  Popover,
  Badge,
  FormHelperText,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import FilterListIcon from '@mui/icons-material/FilterList';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import PersonSearchIcon from '@mui/icons-material/PersonSearch';
import PauseCircleIcon from '@mui/icons-material/PauseCircle';
import ReplayIcon from '@mui/icons-material/Replay';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import { API_BASE_URL, SOCKET_URL } from '../../config/api.config'; // Corrected import path
import {
  fetchAllSales,
  createSale,
  deleteSale,
  updateSale,
  fetchHRUsers,
  fetchTLUsers,
  isTokenValid,
  updateJobApproval
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


const JobReport = () => {
  // Socket state
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [transport, setTransport] = useState('N/A');

  const navigate = useNavigate();
  const [sales, setSales] = useState([]);
  const originalSales = useRef([]); // To store the original unfiltered data
  const [error, setError] = useState(null);
  const [formData, setFormData] = useState({
    // company (from CompanyCreate)
    companyName: '',
    companyId: '',
    branchId: '',
    branchName: '',
    // job fields (in display order)
    jobTitle: '',
    jobLocation: '',
    numberOfRequirements: '',
    jobTiming: '',
    education: '',
    gender: '',
    salary: '',
    experience: '',
    requiredSkills: '',
    keyResponsibility: '',
    benefits: '',
    response: '',
    descriptionFile: null,
    weekOff: '',
    // legacy fields kept for old data compatibility
    industries: '',
    companyAddress: '',
    Area: '',
    contactName: '',
    email: '',
    phoneNumber: '',
    websiteURL: '',
    remarks: '',
    agreementSigned: null,
    gstUpload: null,
    assignedHR: [],
    assignedTL: [],
  });
  const [emailError, setEmailError] = useState(false);
  const [emailHelperText, setEmailHelperText] = useState('');

  // Error states for required fields
  const [errors, setErrors] = useState({
    companyName: false,
    jobTitle: false,
    jobLocation: false,
    numberOfRequirements: false,
    experience: false,
    education: false,
    requiredSkills: false,
  });
  const [hrUsers, setHrUsers] = useState([]); // State to hold HR users
  const [tlUsers, setTlUsers] = useState([]); // State to hold TL users
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [parsedJobs, setParsedJobs] = useState([]);
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Approval Workflow State
  const [approvalModalOpen, setApprovalModalOpen] = useState(false);
  const [uploadToastId, setUploadToastId] = useState(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [companyOptions, setCompanyOptions] = useState([]);
  const [selectedBranch, setSelectedBranch] = useState(null);   // branch dropdown
  const [detailPanel, setDetailPanel] = useState({ open: false, row: null, view: 'company' }); // company/branch detail
  const [assignmentFilter, setAssignmentFilter] = useState('all');
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
  const [matchedJobTitle, setMatchedJobTitle] = useState(''); // job title for position filter
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
  const [salaryMonthly, setSalaryMonthly] = useState(''); // monthly input for job form
  const [jobTimingStart, setJobTimingStart] = useState(''); // start time for job timing
  const [jobTimingEnd, setJobTimingEnd] = useState('');     // end time for job timing

  // ── Close Job dialog ──────────────────────────────────────────────────────
  const [closeJobDialog, setCloseJobDialog] = useState({ open: false, jobId: null, jobTitle: '' });

  // ── Hold Job dialog ───────────────────────────────────────────────────────
  const [holdDialog, setHoldDialog] = useState({ open: false, jobId: null, jobTitle: '' });
  const [holdReasonInput, setHoldReasonInput] = useState('');

  // ── Monthly Summary ────────────────────────────────────────────────────────
  const [monthlySummaryOpen, setMonthlySummaryOpen] = useState(false);
  const [summaryMonth, setSummaryMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  });
  const [reviewJob, setReviewJob] = useState(null);

  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const filterPopoverOpen = Boolean(filterAnchorEl);
  const [activeFilterPanel, setActiveFilterPanel] = useState(null); // which filter is expanded on right
  const [filterSearch, setFilterSearch] = useState(''); // search within right panel dropdown

  // Search states for horizontal filter dropdowns
  const [hrSearchTerm, setHrSearchTerm] = useState('');
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [jobTitleSearchTerm, setJobTitleSearchTerm] = useState('');
  const [salarySearchTerm, setSalarySearchTerm] = useState('');
  const [selectedLocations, setSelectedLocations] = useState([]);
  const [locationSearchTerm, setLocationSearchTerm] = useState('');
  const [areaSearchTerm, setAreaSearchTerm] = useState('');

  // ── Cascading filter helper: matchCompany ──────────────────────────────
  const matchCompany = (saleCompanyName, selectedCompany) => {
    if (!saleCompanyName || !selectedCompany) return false;

    let selectedCompanyName;
    if (typeof selectedCompany === 'string') {
      selectedCompanyName = selectedCompany.includes(' (ID: ')
        ? selectedCompany.split(' (ID: ')[0]
        : selectedCompany;
    } else if (typeof selectedCompany === 'object' && selectedCompany.companyName) {
      selectedCompanyName = selectedCompany.companyName;
    } else {
      return false;
    }

    let saleName;
    if (typeof saleCompanyName === 'string') {
      saleName = saleCompanyName.includes(' (ID: ')
        ? saleCompanyName.split(' (ID: ')[0]
        : saleCompanyName;
    } else {
      saleName = saleCompanyName || '';
    }

    const normalizeString = (str) => {
      return str.toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, ' ')
        .trim();
    };

    const normalizedSelected = normalizeString(selectedCompanyName);
    const normalizedSale = normalizeString(saleName);

    return normalizedSelected === normalizedSale ||
      normalizedSelected.includes(normalizedSale) ||
      normalizedSale.includes(normalizedSelected);
  };

  // Job titles filtered by selected companies
  const filteredJobTitleOptions = useMemo(() => {
    if (selectedCompanies.length === 0) return jobTitleNames;
    const matchedTitles = sales
      .filter(sale => selectedCompanies.some(sc => matchCompany(sale.companyName, sc)))
      .map(sale => sale.jobTitle)
      .filter(Boolean);
    return [...new Set(matchedTitles)].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [selectedCompanies, sales, jobTitleNames]);

  // Salary options filtered by selected job titles
  const filteredSalaryOptions = useMemo(() => {
    if (selectedJobTitle.length === 0) return salaryOptions;
    const matchedSalaries = sales
      .filter(sale => selectedJobTitle.includes(sale.jobTitle))
      .map(sale => sale.salary)
      .filter(s => s != null && String(s).trim() !== '')
      .map(s => String(s));
    return [...new Set(matchedSalaries)].sort((a, b) =>
      a.localeCompare(b, undefined, { numeric: true })
    );
  }, [selectedJobTitle, sales, salaryOptions]);

  // Location options filtered by selected job titles
  const filteredLocationOptions = useMemo(() => {
    const relevantSales = selectedJobTitle.length > 0
      ? sales.filter(sale => selectedJobTitle.includes(sale.jobTitle))
      : sales;
    const locations = relevantSales
      .map(sale => sale.jobLocation)
      .filter(l => l && l.trim() !== '');
    return [...new Set(locations)].sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: 'base' })
    );
  }, [selectedJobTitle, sales]);

  // Auto-clear invalid child selections when parent selections change
  useEffect(() => {
    if (selectedJobTitle.length > 0) {
      const validSelected = selectedJobTitle.filter(title => filteredJobTitleOptions.includes(title));
      if (validSelected.length !== selectedJobTitle.length) {
        setSelectedJobTitle(validSelected);
      }
    }
  }, [filteredJobTitleOptions]);

  useEffect(() => {
    if (selectedSalaries.length > 0) {
      const validSelected = selectedSalaries.filter(salary =>
        filteredSalaryOptions.map(String).includes(String(salary))
      );
      if (validSelected.length !== selectedSalaries.length) {
        setSelectedSalaries(validSelected);
      }
    }
  }, [filteredSalaryOptions]);

  useEffect(() => {
    if (selectedLocations.length > 0) {
      const validSelected = selectedLocations.filter(loc => filteredLocationOptions.includes(loc));
      if (validSelected.length !== selectedLocations.length) {
        setSelectedLocations(validSelected);
      }
    }
  }, [filteredLocationOptions]);

  // Per-section text filter states for the new filter panel
  const [filterNoOfReq, setFilterNoOfReq] = useState('');
  const [filterJobTiming, setFilterJobTiming] = useState('');
  const [filterEducation, setFilterEducation] = useState('');
  const [filterExperience, setFilterExperience] = useState('');
  const [filterGender, setFilterGender] = useState('');
  const [filterSkills, setFilterSkills] = useState('');

  // ── Matching Candidates dialog filter states ──────────────────────────────
  const [mcFilterName, setMcFilterName] = useState('');
  const [mcFilterExperience, setMcFilterExperience] = useState('');
  const [mcFilterLocation, setMcFilterLocation] = useState('');
  const [mcFilterPosition, setMcFilterPosition] = useState('');
  const [mcFilterExpectedCTC, setMcFilterExpectedCTC] = useState('');
  const [mcFilterNoticePeriod, setMcFilterNoticePeriod] = useState('');
  const [mcFilterCurrentCompany, setMcFilterCurrentCompany] = useState('');
  const [mcFilterPhone, setMcFilterPhone] = useState('');
  const [mcFilterDateFrom, setMcFilterDateFrom] = useState('');
  const [mcFilterDateTo, setMcFilterDateTo] = useState('');

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
      transports: ['websocket'],  // âœ… Only WebSocket
      upgrade: false,             // âŒ Disable fallback to polling
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
      socketInstance.emit('register-user', token);
    });

    socketInstance.on('disconnect', (reason) => {
    });

    socketInstance.on('task-reminder', (data) => {
      const uniqueKey = `${data.taskId}-${new Date(data.endDate).toISOString()}`;

      if (shownReminders.has(uniqueKey)) return;

      shownReminders.add(uniqueKey);

      toast.info(
        <div style={{ fontSize: '15px', fontWeight: 500 }}>
          <span role="img" aria-label="alarm">ðŸ””</span> <strong>{data.taskName}</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>
            ðŸ“… Due: {new Date(data.endDate).toLocaleString()}
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

      // â±ï¸ Remove from shown reminders after 1 minute so it shows again
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






  const handleFindCandidates = async (jobId, jobTitle) => {
    try {
      const res = await axios.get(`${API_BASE_URL}/matching/jobs/${jobId}/matching-candidates`);
      setMatchedCandidates(res.data.candidates);
      setMatchedJobTitle(jobTitle || '');
      // Reset all MC filters when opening fresh
      setMcFilterName('');
      setMcFilterPhone('');
      setMcFilterExperience('');
      setMcFilterLocation('');
      setMcFilterPosition('');
      setMcFilterExpectedCTC('');
      setMcFilterNoticePeriod('');
      setMcFilterCurrentCompany('');
      setMcFilterDateFrom('');
      setMcFilterDateTo('');
      setOpenCandidateDialog(true); // open popup
    } catch (err) {
      console.error("Error fetching candidates", err);
    }
  };

  // ── Close Job (toggle status to Closed) ──────────────────────────────────
  const handleConfirmCloseJob = async () => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/allType/${closeJobDialog.jobId}/toggle-status`,
        { status: 'Closed' },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success(`Job "${closeJobDialog.jobTitle}" marked as Closed`);
      setCloseJobDialog({ open: false, jobId: null, jobTitle: '' });
      getSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to close job');
    }
  };

  // ── OnHold / Reopen job ───────────────────────────────────────────────────
  const handleSetJobStatus = async (jobId, jobTitle, newStatus, holdReason = '') => {
    try {
      const token = sessionStorage.getItem('token');
      await axios.put(
        `${API_BASE_URL}/allType/${jobId}/toggle-status`,
        { status: newStatus, holdReason },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const label = newStatus === 'OnHold' ? 'On Hold' : newStatus;
      toast.success(`Job "${jobTitle}" marked as ${label}`);
      getSales();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update job status');
    }
  };

  const handleConfirmHold = async () => {
    await handleSetJobStatus(holdDialog.jobId, holdDialog.jobTitle, 'OnHold', holdReasonInput.trim());
    setHoldDialog({ open: false, jobId: null, jobTitle: '' });
    setHoldReasonInput('');
  };


  const normalizedCandidates = matchedCandidates
    .filter(row => {
      if (!matchedJobTitle) return true;
      const pos = (row.positionName || '').trim().toLowerCase();
      const job = matchedJobTitle.trim().toLowerCase();
      // Case-insensitive partial match — "Tele Sale" matches "Tele Sales" and vice versa
      return pos === job || pos.includes(job) || job.includes(pos);
    })
    .map((row, i) => ({
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
      createdAt: row.createdAt || '',
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
        // Backend already deduplicates by normalized name — do a final case-insensitive
        // safety dedup on the frontend in case of any edge cases
        const seen = new Set();
        const unique = (res.data || [])
          .filter(Boolean)
          .filter(name => {
            const key = name.trim().toLowerCase();
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
          })
          .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: 'base' }));
        setCompanyNames(unique);
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
          a.localeCompare(b, undefined, { sensitivity: 'base' })
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

    const fetchTlUsersList = async () => {
      try {
        const response = await fetchTLUsers();
        setTlUsers(response.data);
      } catch (error) {
        console.error('Error fetching TL users:', error);
      }
    };

    fetchJobTitleNames();
    fetchHrUsersList();
    fetchTlUsersList();
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

  // Count by status / assignment
  const assignedCount = sales.filter(sale => Array.isArray(sale.assignedHR) ? sale.assignedHR.length > 0 : !!sale.assignedHR).length;
  const unassignedCount = sales.filter(sale => Array.isArray(sale.assignedHR) ? sale.assignedHR.length === 0 : !sale.assignedHR).length;
  const openCount = sales.filter(sale => !sale.jobStatus || sale.jobStatus === 'Open').length;
  const closedCount = sales.filter(sale => sale.jobStatus === 'Closed').length;
  const onHoldCount = sales.filter(sale => sale.jobStatus === 'OnHold').length;

  const activeFilterCount = [
    selectedCompanies.length > 0,
    hrFilter,
    selectedSalaries.length > 0,
    selectedJobTitle.length > 0,
    areaFilter.length > 0,
    selectedLocations.length > 0,
    filterNoOfReq,
    filterJobTiming,
    filterEducation,
    filterExperience,
    filterGender,
    filterSkills,
    startDate,
    endDate,
  ].filter(Boolean).length;

  // ── Monthly Summary logic ──────────────────────────────────────────────────
  // Uses originalSales (all data) so it's independent of current filters
  const monthlySummaryData = useMemo(() => {
    // Use all sales data (originalSales if available, else sales)
    const allData = originalSales.current.length ? originalSales.current : sales;

    if (!summaryMonth) return null;
    const [year, month] = summaryMonth.split('-').map(Number);

    const inMonth = allData.filter(sale => {
      if (!sale.createdAt) return false;
      const d = new Date(sale.createdAt);
      return d.getFullYear() === year && d.getMonth() + 1 === month;
    });

    const total   = inMonth.length;
    const open    = inMonth.filter(s => !s.jobStatus || s.jobStatus === 'Open').length;
    const closed  = inMonth.filter(s => s.jobStatus === 'Closed').length;
    const onHold  = inMonth.filter(s => s.jobStatus === 'OnHold').length;
    const assigned   = inMonth.filter(s => Array.isArray(s.assignedHR) ? s.assignedHR.length > 0 : !!s.assignedHR).length;
    const unassigned = total - assigned;

    // Company-wise breakdown
    const companyMap = {};
    inMonth.forEach(s => {
      const name = s.companyName || 'Unknown';
      if (!companyMap[name]) companyMap[name] = { total: 0, open: 0, closed: 0, onHold: 0 };
      companyMap[name].total++;
      if (!s.jobStatus || s.jobStatus === 'Open') companyMap[name].open++;
      else if (s.jobStatus === 'Closed') companyMap[name].closed++;
      else if (s.jobStatus === 'OnHold') companyMap[name].onHold++;
    });

    const companyBreakdown = Object.entries(companyMap)
      .map(([name, counts]) => ({ name, ...counts }))
      .sort((a, b) => b.total - a.total);

    // Job title breakdown
    const titleMap = {};
    inMonth.forEach(s => {
      const t = s.jobTitle || 'Unknown';
      titleMap[t] = (titleMap[t] || 0) + 1;
    });
    const titleBreakdown = Object.entries(titleMap)
      .map(([title, count]) => ({ title, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    return { total, open, closed, onHold, assigned, unassigned, companyBreakdown, titleBreakdown, jobs: inMonth };
  }, [summaryMonth, sales]);

  // Quick month helpers
  const quickMonth = (offsetMonths) => {
    const d = new Date();
    d.setDate(1);
    d.setMonth(d.getMonth() + offsetMonths);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  const monthLabel = (ym) => {
    if (!ym) return '';
    const [y, m] = ym.split('-');
    return new Date(Number(y), Number(m) - 1, 1)
      .toLocaleString('en-IN', { month: 'long', year: 'numeric' });
  };

  // Apply month filter to main grid from summary
  const applyMonthToGrid = (ym) => {
    const [y, m] = ym.split('-').map(Number);
    const from = `${y}-${String(m).padStart(2, '0')}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const to = `${y}-${String(m).padStart(2, '0')}-${lastDay}`;
    setStartDate(from);
    setEndDate(to);
    setAssignmentFilter('all');
    // store original if not already stored
    if (!originalSales.current.length) originalSales.current = [...sales];
    const start = dayjs(from).startOf('day');
    const end   = dayjs(to).endOf('day');
    const filtered = originalSales.current.filter(sale => {
      if (!sale.createdAt) return false;
      const d = dayjs(sale.createdAt);
      return (d.isAfter(start) || d.isSame(start, 'day')) && (d.isBefore(end) || d.isSame(end, 'day'));
    });
    setSales(filtered);
    setMonthlySummaryOpen(false);
  };

  // Debug: Log all company names in sales data
  const salesCompanyNames = sales.map(sale => sale.companyName);

  const filteredSales = sales.filter(sale => {
    // Filter by company if any companies are selected
    const companyMatch = selectedCompanies.length === 0 ||
      selectedCompanies.some(selectedCompany => matchCompany(sale.companyName, selectedCompany));

    // Filter by assignment / status tab
    const assignedMatch =
      assignmentFilter === 'all' ? true :
        assignmentFilter === 'assigned' ? (Array.isArray(sale.assignedHR) ? sale.assignedHR.length > 0 : !!sale.assignedHR) :
          assignmentFilter === 'unassigned' ? (Array.isArray(sale.assignedHR) ? sale.assignedHR.length === 0 : !sale.assignedHR) :
            assignmentFilter === 'open' ? (!sale.jobStatus || sale.jobStatus === 'Open') :
              assignmentFilter === 'closed' ? (sale.jobStatus === 'Closed') :
                assignmentFilter === 'onhold' ? (sale.jobStatus === 'OnHold') :
                  true;

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

    // Filter by location (multi-select dropdown)
    const jobLocationMatch = selectedLocations.length === 0 ||
      (sale.jobLocation && selectedLocations.some(selectedLoc =>
        sale.jobLocation.toLowerCase().includes(selectedLoc.toLowerCase()) ||
        selectedLoc.toLowerCase().includes(sale.jobLocation.toLowerCase())
      ));

    const noOfReqMatch = !filterNoOfReq || (sale.numberOfRequirements && String(sale.numberOfRequirements).includes(filterNoOfReq));
    const jobTimingMatch = !filterJobTiming || (sale.jobTiming && sale.jobTiming.toLowerCase().includes(filterJobTiming.toLowerCase()));
    const educationMatch = !filterEducation || (sale.education && sale.education.toLowerCase().includes(filterEducation.toLowerCase()));
    const experienceMatch = !filterExperience || (sale.experience && sale.experience.toLowerCase().includes(filterExperience.toLowerCase()));
    const genderMatch = !filterGender || (sale.gender && sale.gender.toLowerCase() === filterGender.toLowerCase());
    const skillsMatch = !filterSkills || (sale.requiredSkills && sale.requiredSkills.toLowerCase().includes(filterSkills.toLowerCase()));
    const salaryMatch = selectedSalaries.length === 0 || selectedSalaries.some(s => sale.salary != null && String(sale.salary).toLowerCase().includes(String(s).toLowerCase()));

    // Return true only if all conditions are met
    // Also, only show Approved jobs in the main grid
    const isApproved = !sale.approvalStatus || (sale.approvalStatus !== 'Pending' && sale.approvalStatus !== 'Rejected');

    return companyMatch && assignedMatch && jobTitleMatch && hrMatch && areaMatch && jobLocationMatch && noOfReqMatch && jobTimingMatch && educationMatch && experienceMatch && genderMatch && skillsMatch && salaryMatch && isApproved;
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
      const res = await axios.get(`${API_BASE_URL}/companies`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // res.data.data is the array from CompanyCreate model
      setCompanyOptions(res.data.data || []);
    } catch (err) {
      console.error('Error fetching companies', err);
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

  const handleApproveJob = async (jobId) => {
    try {
      await updateJobApproval(jobId, 'Approved');
      toast.success('Job Approved successfully');
      getSales(); // Refresh the list
    } catch (err) {
      toast.error('Failed to approve job');
    }
  };

  const handleRejectJob = async (jobId) => {
    try {
      await updateJobApproval(jobId, 'Rejected');
      toast.success('Job Rejected');
      getSales(); // Refresh the list
    } catch (err) {
      toast.error('Failed to reject job');
    }
  };

  const pendingJobsList = sales.filter(s => s.approvalStatus === 'Pending');



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

      if (data.length === 0) {
        toast.error('❌ Empty Excel file', { position: 'top-right' });
        return;
      }

      // ── Required field validation (mirrors form validation) ──────────────
      const REQUIRED = ['companyName', 'jobTitle', 'jobLocation', 'numberOfRequirements', 'experience', 'education', 'requiredSkills'];
      const rowErrors = [];

      data.forEach((row, index) => {
        const missing = REQUIRED.filter(f => !row[f] || String(row[f]).trim() === '');
        if (missing.length) rowErrors.push(`Row ${index + 2}: missing ${missing.join(', ')}`);
      });

      if (rowErrors.length > 0) {
        toast.error(
          <div>
            <strong>❌ Validation failed — fix these rows:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12 }}>
              {rowErrors.slice(0, 8).map((err, i) => <li key={i}>{err}</li>)}
              {rowErrors.length > 8 && <li>...and {rowErrors.length - 8} more</li>}
            </ul>
          </div>,
          { position: 'top-right', autoClose: false, closeOnClick: true }
        );
        return;
      }

      // ── Salary is stored as Number ──────────────────────────────
      const toAnnualLPA = (val) => {
        if (val == null || val === '') return val;
        const n = Number(val);
        if (!n) return val;
        return n;
      };

      const processedData = data.map(row => ({
        ...row,
        salary: row.salary != null ? toAnnualLPA(row.salary) : row.salary,
      }));

      // Set parsed data and open modal only if validation passes
      setParsedJobs(processedData);
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

  // Fields that should NOT be auto-capitalized (numeric, email, URLs, etc.)
  const NO_CAPITALIZE_FIELDS = ['email', 'phoneNumber', 'websiteURL', 'salary', 'numberOfRequirements', 'experience'];

  const capitalizeWords = (str) =>
    str.replace(/\b\w/g, (char) => char.toUpperCase());

  const handleChange = (e) => {
    const { name, value } = e.target;
    const processedValue = (!NO_CAPITALIZE_FIELDS.includes(name) && typeof value === 'string' && value.length > 0)
      ? capitalizeWords(value)
      : value;
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
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

  const handleTLChange = (e) => {
    const { value } = e.target;

    // If 'none' is selected in the array, clear all TL assignments
    if (Array.isArray(value) && value.includes('none')) {
      setFormData(prev => ({
        ...prev,
        assignedTL: []
      }));
      return;
    }

    // If it's an array, filter out 'none' and any falsy values
    const newValue = Array.isArray(value)
      ? value.filter(v => v && v !== 'none')
      : [value].filter(v => v && v !== 'none');

    setFormData(prev => ({
      ...prev,
      assignedTL: newValue
    }));
  };






  const emptyFormData = {
    companyName: '', companyId: '', branchId: '', branchName: '',
    jobTitle: '', jobLocation: '', numberOfRequirements: '', jobTiming: '',
    education: '', gender: '', salary: '', experience: '',
    requiredSkills: '', keyResponsibility: '', benefits: '', response: '',
    descriptionFile: null, weekOff: '',
    // legacy
    industries: '', companyAddress: '', Area: '', contactName: '',
    email: '', phoneNumber: '', websiteURL: '', remarks: '',
    agreementSigned: null, gstUpload: null, assignedHR: [], assignedTL: [],
  };

  // Predefined experience options for the job opening form
  const experienceOptions = [
    'Fresher', '0-6 Months', '6 Months', '1 Year', '1 Year 3 Months',
    '1 Year 6 Months', '2 Years', '2 Years 3 Months', '2 Years 6 Months',
    '3 Years', '3-5 Years', '5 Years', '5-7 Years', '7-10 Years',
    '10+ Years', '15+ Years',
  ];

  // Convert "9:00 AM" / "1:30 PM" / "9 AM" / "9.30" → "09:00" / "13:30" for <input type="time">
  const to24h = (timeStr) => {
    if (!timeStr) return '';
    const match = timeStr.trim().match(/^(\d{1,2})(?:[:.](\d{2}))?\s*(AM|PM)?$/i);
    if (!match) return '';
    let [, h, m, period] = match;
    h = parseInt(h);
    m = m || '00';
    if (period) {
      if (period.toUpperCase() === 'PM' && h !== 12) h += 12;
      if (period.toUpperCase() === 'AM' && h === 12) h = 0;
    }
    return `${String(h).padStart(2, '0')}:${m}`;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    const newErrors = {
      companyName: !String(formData.companyName || '').trim(),
      jobTitle: !String(formData.jobTitle || '').trim(),
      jobLocation: !String(formData.jobLocation || '').trim(),
      numberOfRequirements: !formData.numberOfRequirements,
      experience: !String(formData.experience || '').trim(),
      education: !String(formData.education || '').trim(),
      requiredSkills: !String(formData.requiredSkills || '').trim(),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setSuccessMessage('');

    try {
      const form = new FormData();

      // Store the raw monthly salary since the database expects a Number
      const salaryToStore = salaryMonthly
        ? salaryMonthly
        : formData.salary;

      // Combine jobTimingStart + jobTimingEnd into jobTiming string
      const combinedJobTiming = jobTimingStart && jobTimingEnd
        ? `${jobTimingStart} - ${jobTimingEnd}`
        : jobTimingStart || jobTimingEnd || formData.jobTiming || '';

      // Append all scalar fields
      Object.entries(formData).forEach(([key, value]) => {
        if (['descriptionFile', 'agreementSigned', 'gstUpload', 'createdBy'].includes(key)) return;
        if (key === 'salary') {
          if (salaryToStore) form.append('salary', salaryToStore);
        } else if (key === 'jobTiming') {
          if (combinedJobTiming) form.append('jobTiming', combinedJobTiming);
        } else if (key === 'assignedHR') {
          form.append('assignedHR', JSON.stringify(Array.isArray(value) ? value : []));
        } else if (key === 'assignedTL') {
          form.append('assignedTL', JSON.stringify(Array.isArray(value) ? value : []));
        } else if (value !== null && value !== undefined && value !== '') {
          form.append(key, value);
        }
      });

      // Always send companyId explicitly
      if (formData.companyId) form.set('companyId', formData.companyId);

      // Branch fields
      if (formData.branchId) form.set('branchId', formData.branchId);
      if (formData.branchName) form.set('branchName', formData.branchName);

      // File fields
      if (formData.descriptionFile instanceof File) form.append('descriptionFile', formData.descriptionFile);
      if (formData.agreementSigned instanceof File) form.append('agreementSigned', formData.agreementSigned);
      if (formData.gstUpload instanceof File) form.append('gstUpload', formData.gstUpload);

      if (editMode) {
        await updateSale(selectedId, form, true);
        setSuccessMessage('Update Successful!');
      } else {
        await createSale(form, true);
        setSuccessMessage('Create Successful!');
      }

      setFormData(emptyFormData);
      setSelectedBranch(null);
      getSales();
      setTimeout(() => { setOpen(false); setSuccessMessage(''); setSalaryMonthly(''); setJobTimingStart(''); setJobTimingEnd(''); }, 1500);
    } catch (error) {
      console.error('Error saving sale:', error);

      // Extract the most specific error message available
      let msg = 'Failed to save job opening';

      if (error?.response?.data) {
        const data = error.response.data;
        // Backend sends { message, error } — show both if error gives more detail
        if (data.message && data.error) {
          msg = `${data.message}: ${data.error}`;
        } else if (data.message) {
          msg = data.message;
        } else if (data.error) {
          msg = data.error;
        }
      } else if (error?.message) {
        // Network error or thrown JS error
        msg = error.message;
      }

      toast.error(`❌ ${msg}`, { autoClose: 6000 });
    } finally {
      setLoading(false);
    }
  };





  const handleDelete = async (id) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this job?');
    if (!confirmDelete) return;

    try {
      await deleteSale(id);
      toast.success('Job deleted successfully');
      getSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
      const msg =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        error?.message ||
        'Failed to delete job';
      toast.error(`❌ ${msg}`, { autoClose: 6000 });
    }
  };







  const handleEdit = (sale) => {
    let formattedAssignedHR = [];
    if (sale.assignedHR) {
      if (Array.isArray(sale.assignedHR)) {
        formattedAssignedHR = sale.assignedHR.map(hr => typeof hr === 'object' ? hr._id || hr : hr).filter(Boolean);
      } else if (typeof sale.assignedHR === 'object' && sale.assignedHR._id) {
        formattedAssignedHR = [sale.assignedHR._id];
      } else if (typeof sale.assignedHR === 'string') {
        formattedAssignedHR = [sale.assignedHR];
      }
    }

    let formattedAssignedTL = [];
    if (sale.assignedTL) {
      if (Array.isArray(sale.assignedTL)) {
        formattedAssignedTL = sale.assignedTL.map(tl => typeof tl === 'object' ? tl._id || tl : tl).filter(Boolean);
      } else if (typeof sale.assignedTL === 'object' && sale.assignedTL._id) {
        formattedAssignedTL = [sale.assignedTL._id];
      } else if (typeof sale.assignedTL === 'string') {
        formattedAssignedTL = [sale.assignedTL];
      }
    }

    // ── If the company from this old job doesn't exist in companyOptions (CompanyCreate),
    //    inject a temporary entry so the Autocomplete can display it ──
    if (sale.companyId && sale.companyName) {
      const exists = companyOptions.some(c => c.companyId === sale.companyId);
      if (!exists) {
        setCompanyOptions(prev => [
          ...prev,
          { companyName: sale.companyName, companyId: sale.companyId, branches: [], _isLegacy: true },
        ]);
      }
    }

    setFormData({
      ...emptyFormData,
      ...sale,
      companyId: sale.companyId || '',
      companyName: sale.companyName || '',
      branchId: sale.branchId || '',
      branchName: sale.branchName || '',
      jobTitle: sale.jobTitle || '',
      jobLocation: sale.jobLocation || '',
      Area: sale.Area || '',
      numberOfRequirements: sale.numberOfRequirements || '',
      jobTiming: sale.jobTiming || '',
      education: sale.education || '',
      gender: sale.gender || '',
      salary: sale.salary || '',
      experience: sale.experience || '',
      requiredSkills: sale.requiredSkills || '',
      keyResponsibility: sale.keyResponsibility || '',
      benefits: sale.benefits || '',
      response: sale.response || '',
      descriptionFile: sale.descriptionFile || null,   // Preserve existing file URL if available
      weekOff: sale.weekOff || '',
      assignedHR: formattedAssignedHR,
      assignedTL: formattedAssignedTL,
    });

    // Restore branch selection if branch exists
    if (sale.branchId) {
      const co = companyOptions.find(c => c.companyId === sale.companyId);
      const br = co?.branches?.find(b => b._id === sale.branchId);
      setSelectedBranch(br || null);
    } else {
      setSelectedBranch(null);
    }

    setSelectedId(sale._id);
    setEditMode(true);
    setOpen(true);

    // Parse salary back to monthly if it's in LPA format or just a number
    let initialSalaryMonthly = '';
    if (sale.salary != null) {
      const salaryStr = String(sale.salary);
      if (salaryStr.toUpperCase().includes('LPA')) {
        const lpaValue = parseFloat(salaryStr.replace(/[^0-9.]/g, ''));
        if (!isNaN(lpaValue)) {
          initialSalaryMonthly = Math.round((lpaValue * 100000) / 12).toString();
        }
      } else if (/^\d*\.?\d*$/.test(salaryStr.trim())) {
        initialSalaryMonthly = salaryStr.trim();
      }
    }
    setSalaryMonthly(initialSalaryMonthly);

    // Parse existing jobTiming into start/end parts more robustly
    let startT = '';
    let endT = '';
    if (sale.jobTiming) {
      if (sale.jobTiming.includes('-')) {
        const parts = sale.jobTiming.split('-');
        startT = parts[0].trim();
        endT = parts[1].trim();
      } else if (sale.jobTiming.toLowerCase().includes(' to ')) {
        const parts = sale.jobTiming.toLowerCase().split(' to ');
        startT = parts[0].trim();
        endT = parts[1].trim();
      } else {
        startT = sale.jobTiming.trim();
      }
    }
    setJobTimingStart(startT);
    setJobTimingEnd(endT);
  };


  const handleAddNew = () => {
    setFormData(emptyFormData);
    setSelectedBranch(null);
    setEditMode(false);
    setSelectedId(null);
    setJobTimingStart('');
    setJobTimingEnd('');
    setSalaryMonthly('');
    setOpen(true);
  };

  const handleClose = () => {
    setFormData(emptyFormData);
    setSelectedBranch(null);
    setOpen(false);
    setEditMode(false);
    setSelectedId(null);
    setJobTimingStart('');
    setJobTimingEnd('');
    setAreaFilter([]);
    setSalaryMonthly('');
  };



  const handleExportData = async () => {
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

          if (field === 'assignedTL') {
            value = Array.isArray(value)
              ? value.map(tl => typeof tl === 'object'
                ? `${tl.firstName || ''} ${tl.lastName || ''}`.trim()
                : tl).join(', ')
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

    // ── Column 1: Edit + Find icons ──────────────────────────────────────────
    {
      field: 'actions',
      headerName: 'Actions',
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Tooltip title="Edit Job" arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}
              sx={{ color: '#3f51b5', '&:hover': { bgcolor: '#e8eaf6' } }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Find Candidates" arrow>
            <IconButton
              size="small"
              onClick={(e) => { e.stopPropagation(); handleFindCandidates(params.row._id, params.row.jobTitle); }}
              sx={{ color: '#2e7d32', '&:hover': { bgcolor: '#e8f5e9' } }}
            >
              <PersonSearchIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    // ── Column 2: JD PDF ─────────────────────────────────────────────────────
    {
      field: 'descriptionFile',
      headerName: 'JD',
      width: 55,
      sortable: false,
      renderCell: (params) => {
        const fileUrl = params.row.descriptionFile;
        return fileUrl ? (
          <Tooltip title="View Job Description PDF" arrow>
            <IconButton
              size="small"
              component="a"
              href={fileUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              sx={{ color: '#d32f2f', '&:hover': { bgcolor: '#fdecea' } }}
            >
              <VisibilityIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        ) : <span style={{ color: '#bbb', fontSize: '0.8rem' }}>—</span>;
      },
    },


    // ── Column 3: Created At ──────────────────────────────────────────────────
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 130,
      renderCell: (params) => {
        const formattedDate = params.value ? dayjs(params.value).format('DD/MM/YY hh:mm A') : '';
        return (
          <Tooltip title={formattedDate} arrow>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>
              {formattedDate}
            </div>
          </Tooltip>
        );
      },
    },

    // ── Column 4: Assigned HR ─────────────────────────────────────────────────
    {
      field: 'assignedHR',
      headerName: 'Assigned HR',
      width: 120,
      renderCell: (params) => {
        const assignedHRs = params.row.assignedHR || [];
        if (!Array.isArray(assignedHRs) || assignedHRs.length === 0) {
          return <span style={{ color: '#bbb', fontSize: '0.78rem' }}>Not Assigned</span>;
        }
        if (assignedHRs && !Array.isArray(assignedHRs) && assignedHRs.firstName) {
          const name = `${assignedHRs.firstName || ''} ${assignedHRs.lastName || ''}`.trim();
          return <span style={{ fontSize: '0.78rem' }}>{name}</span>;
        }
        const hrNames = assignedHRs
          .map(hr => {
            if (typeof hr === 'string') {
              const hrUser = hrUsers.find(h => h._id === hr);
              return hrUser ? `${hrUser.firstName || ''} ${hrUser.lastName || ''}`.trim() : null;
            }
            return hr ? `${hr.firstName || ''} ${hr.lastName || ''}`.trim() : null;
          })
          .filter(Boolean);
        return hrNames.length > 0 ? (
          <Tooltip title={hrNames.join(', ')} arrow>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>
              {hrNames.join(', ')}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: '#bbb', fontSize: '0.78rem' }}>Not Assigned</span>
        );
      },
    },
    {
      field: 'assignedTL',
      headerName: 'Assigned TL',
      width: 120,
      renderCell: (params) => {
        const assignedTLs = params.row.assignedTL || [];
        if (!Array.isArray(assignedTLs) || assignedTLs.length === 0) {
          return <span style={{ color: '#bbb', fontSize: '0.78rem' }}>Not Assigned</span>;
        }
        const tlNames = assignedTLs
          .map(tl => {
            if (typeof tl === 'string') {
              const tlUser = tlUsers.find(t => t._id === tl);
              return tlUser ? `${tlUser.firstName || ''} ${tlUser.lastName || ''}`.trim() : null;
            }
            return tl ? `${tl.firstName || ''} ${tl.lastName || ''}`.trim() : null;
          })
          .filter(Boolean);
        return tlNames.length > 0 ? (
          <Tooltip title={tlNames.join(', ')} arrow>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>
              {tlNames.join(', ')}
            </span>
          </Tooltip>
        ) : (
          <span style={{ color: '#bbb', fontSize: '0.78rem' }}>Not Assigned</span>
        );
      },
    },

    // ── Column 5: Company / Branch ────────────────────────────────────────────
    {
      field: 'companyName',
      headerName: 'Company / Branch',
      width: 140,
      renderCell: (params) => {
        const row = params.row;
        const hasBranch = !!row.br_branchName;
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', overflow: 'hidden' }}>
            <Tooltip title="Click to view company details" arrow>
              <span
                onClick={(e) => { e.stopPropagation(); setDetailPanel({ open: true, row, view: 'company' }); }}
                style={{
                  color: '#3f51b5', fontWeight: 600, fontSize: '0.78rem',
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
                  label={row.br_branchName}
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
      },
    },

    // ── Column 6: Job Title ───────────────────────────────────────────────────
    {
      field: 'jobTitle',
      headerName: 'Job Title',
      width: 160,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>
            {params.value}
          </div>
        </Tooltip>
      ),
    },

    // ── Column 7: Requirements ────────────────────────────────────────────────
    {
      field: 'numberOfRequirements',
      headerName: 'Req.',
      width: 80,
      renderCell: (params) => {
        const total = Number(params.value) || 0;
        const fulfilled = Number(params.row.fulfilledCount) || 0;
        const isFull = total > 0 && fulfilled >= total;
        const status = params.row.jobStatus || 'Open';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, width: '100%', flexWrap: 'nowrap' }}>
            <Tooltip title={`${fulfilled} fulfilled / ${total} required`} arrow>
              <Chip
                label={`${fulfilled}/${total}`}
                size="small"
                sx={{
                  fontWeight: 700, fontSize: '0.68rem', flexShrink: 0,
                  bgcolor: isFull ? '#d1fae5' : '#e8eaf6',
                  color: isFull ? '#065f46' : '#3f51b5',
                  border: isFull ? '1px solid #6ee7b7' : '1px solid #c5cae9',
                }}
              />
            </Tooltip>
            {status === 'Open' && isFull && (
              <Tooltip title="All requirements fulfilled — close this job" arrow>
                <Button size="small" variant="contained"
                  onClick={(e) => { e.stopPropagation(); setCloseJobDialog({ open: true, jobId: params.row._id, jobTitle: params.row.jobTitle || '' }); }}
                  sx={{ fontSize: '0.58rem', fontWeight: 700, px: 0.6, py: 0.1, minWidth: 'auto', borderRadius: '6px', textTransform: 'none', bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' }, flexShrink: 0 }}>
                  Close
                </Button>
              </Tooltip>
            )}
            {status === 'OnHold' && (
              <Chip label="On Hold" size="small"
                sx={{ fontSize: '0.6rem', fontWeight: 700, bgcolor: '#fff7ed', color: '#c2410c', border: '1px solid #fed7aa', flexShrink: 0 }} />
            )}
            {status === 'Closed' && (
              <Chip label="Closed" size="small"
                sx={{ fontSize: '0.6rem', fontWeight: 700, bgcolor: '#fee2e2', color: '#b91c1c', border: '1px solid #fca5a5', flexShrink: 0 }} />
            )}
          </Box>
        );
      },
    },

    // ── Column 8: Gender ──────────────────────────────────────────────────────
    {
      field: 'gender', headerName: 'Gender', width: 80,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 9: Salary ──────────────────────────────────────────────────────
    {
      field: 'salary', headerName: 'Monthly Salary (₹)', width: 140,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 10: Job Timing ─────────────────────────────────────────────────
    {
      field: 'jobTiming', headerName: 'Job Timing', width: 110,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 11: Education ──────────────────────────────────────────────────
    {
      field: 'education', headerName: 'Education', width: 110,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 12: Experience ─────────────────────────────────────────────────
    {
      field: 'experience', headerName: 'Exp. (Years)', width: 100,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 13: Week Off ───────────────────────────────────────────────────
    {
      field: 'weekOff', headerName: 'Week Off', width: 80,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 13b: Area ───────────────────────────────────────────────────────
    {
      field: 'Area', headerName: 'Area', width: 110,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 14: Job Location ───────────────────────────────────────────────
    {
      field: 'jobLocation', headerName: 'Location', width: 110,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 15: Job Age ────────────────────────────────────────────────────
    {
      field: '_ageDays', headerName: 'Age', width: 90, type: 'number',
      renderCell: (params) => {
        const status = params.row.jobStatus || 'Open';
        if (status === 'Closed') return <Chip label="Closed" size="small" sx={{ bgcolor: '#f1f5f9', color: '#64748b', fontWeight: 600, fontSize: '0.68rem' }} />;
        const createdAt = params.row.createdAt;
        if (!createdAt) return <span style={{ color: '#bbb' }}>—</span>;
        const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
        let bg, color, label;
        if (days < 30) { bg = '#dcfce7'; color = '#15803d'; label = `${days}d`; }
        else if (days < 60) { bg = '#fef9c3'; color = '#a16207'; label = `${days}d ⚠️`; }
        else if (days < 90) { bg = '#ffedd5'; color = '#c2410c'; label = `${days}d 🔴`; }
        else { bg = '#fee2e2'; color = '#991b1b'; label = `${days}d 🚨`; }
        return (
          <Tooltip title={`Job open for ${days} day${days !== 1 ? 's' : ''}`} arrow>
            <Chip label={label} size="small" sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: '0.68rem', border: `1px solid ${bg}` }} />
          </Tooltip>
        );
      },
    },

    // ── Column 16: Response ───────────────────────────────────────────────────
    {
      field: 'response', headerName: 'Response', width: 110,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 17: Benefits ───────────────────────────────────────────────────
    {
      field: 'benefits', headerName: 'Benefits', width: 110,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 18: Key Responsibility ─────────────────────────────────────────
    {
      field: 'keyResponsibility', headerName: 'Key Resp.', width: 130,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 19: Required Skills ────────────────────────────────────────────
    {
      field: 'requiredSkills', headerName: 'Skills', width: 130,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 20: Remarks ────────────────────────────────────────────────────
    {
      field: 'remarks', headerName: 'Remarks', width: 120,
      renderCell: (params) => (
        <Tooltip title={params.value || ''} arrow>
          <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem' }}>{params.value || '—'}</div>
        </Tooltip>
      ),
    },

    // ── Column 21: Hold Reason ────────────────────────────────────────────────
    {
      field: 'holdReason', headerName: 'Hold Reason', width: 130,
      renderCell: (params) => {
        const reason = params.value;
        const isOnHold = params.row.jobStatus === 'OnHold';
        if (!reason) return <span style={{ color: '#bbb', fontSize: '0.78rem' }}>—</span>;
        return (
          <Tooltip title={reason} arrow>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, overflow: 'hidden' }}>
              {isOnHold && <Box sx={{ width: 6, height: 6, borderRadius: '50%', bgcolor: '#f97316', flexShrink: 0 }} />}
              <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem', color: isOnHold ? '#c2410c' : '#64748b' }}>
                {reason}
              </span>
            </Box>
          </Tooltip>
        );
      },
    },

    // ── Column 22: Created By ─────────────────────────────────────────────────
    {
      field: 'createdBy', headerName: 'Created By', width: 130,
      renderCell: (params) => {
        const createdBy = params.row.createdBy;
        if (!createdBy) return <span style={{ color: '#bbb', fontSize: '0.78rem' }}>Unknown</span>;
        const name = `${createdBy.firstName || ''} ${createdBy.lastName || ''}`.trim();
        const displayText = `${name} (${createdBy.role || ''})`;
        return (
          <Tooltip title={displayText} arrow>
            <div style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: '0.78rem', width: '100%' }}>
              {displayText}
            </div>
          </Tooltip>
        );
      },
    },

    // ── Column 23: Delete / Hold / Reopen icons ───────────────────────────────
    {
      field: 'remove', headerName: 'Manage', width: 110, sortable: false,
      renderCell: (params) => {
        const status = params.row.jobStatus || 'Open';
        return (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.3 }}>
            <Tooltip title="Delete Job" arrow>
              <IconButton size="small"
                onClick={(e) => { e.stopPropagation(); handleDelete(params.row._id); }}
                sx={{ color: '#b91c1c', '&:hover': { bgcolor: '#fee2e2' } }}>
                <DeleteIcon fontSize="small" />
              </IconButton>
            </Tooltip>
            {status === 'Open' && (
              <Tooltip title="Put on Hold" arrow>
                <IconButton size="small"
                  onClick={(e) => { e.stopPropagation(); setHoldReasonInput(''); setHoldDialog({ open: true, jobId: params.row._id, jobTitle: params.row.jobTitle || '' }); }}
                  sx={{ color: '#f97316', '&:hover': { bgcolor: '#fff7ed' } }}>
                  <PauseCircleIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
            {(status === 'OnHold' || status === 'Closed') && (
              <Tooltip title="Reopen Job" arrow>
                <IconButton size="small"
                  onClick={(e) => { e.stopPropagation(); handleSetJobStatus(params.row._id, params.row.jobTitle, 'Open'); }}
                  sx={{ color: '#10b981', '&:hover': { bgcolor: '#f0fdf4' } }}>
                  <ReplayIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            )}
          </Box>
        );
      },
    },

  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f8' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white', zIndex: 1000 }}>
        <Sidebar />
      </div>

      {/* Main content */}
      <Box sx={{
        flexGrow: 1, display: 'flex', flexDirection: 'column', ml: '250px', minHeight: '100vh',
        overflowY: 'auto', overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: 7 },
        '&::-webkit-scrollbar-track': { background: '#e8eaf0' },
        '&::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
      }}>
        <Box sx={{ position: 'fixed', top: 0, left: '250px', right: 0, zIndex: 999, bgcolor: '#fff', boxShadow: '0 1px 4px rgba(63,81,181,0.12)' }}>
          <Navbar />
        </Box>

        <Box sx={{ p: 3, flex: 1, mt: '64px' }}>

          {/* ── Combined Card: Header + Filters + Actions ── */}
          <Box sx={{
            bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '16px',
            mb: 2, boxShadow: '0 4px 20px rgba(63,81,181,0.1)', overflow: 'hidden',
          }}>
            {/* Header Row */}
            <Box sx={{
              background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
              px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#fff', letterSpacing: '-0.3px' }}>
                  Job Opening Report
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                  Manage and track all job openings
                </Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                {[
                  { label: 'All', count: sales.length, color: '#fff', bg: 'rgba(255,255,255,0.18)', key: 'all' },
                  { label: 'Assigned', count: assignedCount, color: '#d1fae5', bg: 'rgba(16,185,129,0.22)', key: 'assigned' },
                  { label: 'Unassigned', count: unassignedCount, color: '#fef3c7', bg: 'rgba(245,158,11,0.22)', key: 'unassigned' },
                  { label: 'Open', count: openCount, color: '#bfdbfe', bg: 'rgba(59,130,246,0.22)', key: 'open' },
                  { label: 'Closed', count: closedCount, color: '#fecaca', bg: 'rgba(239,68,68,0.22)', key: 'closed' },
                  { label: 'On Hold', count: onHoldCount, color: '#fed7aa', bg: 'rgba(249,115,22,0.22)', key: 'onhold' },
                ].map(({ label, count, color, bg, key }) => {
                  const active = assignmentFilter === key;
                  return (
                    <Box key={key} onClick={() => setAssignmentFilter(key)} sx={{
                      cursor: 'pointer', px: 1.8, py: 0.8, borderRadius: '10px',
                      bgcolor: active ? 'rgba(255,255,255,0.28)' : bg,
                      border: active ? '2px solid rgba(255,255,255,0.7)' : '2px solid transparent',
                      transition: 'all 0.2s', textAlign: 'center', minWidth: 68,
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                    }}>
                      <Typography sx={{ fontSize: '1.15rem', fontWeight: 800, color, lineHeight: 1 }}>{count}</Typography>
                      <Typography sx={{ fontSize: '0.65rem', color: 'rgba(255,255,255,0.85)', fontWeight: 600, mt: 0.2, whiteSpace: 'nowrap' }}>{label}</Typography>
                    </Box>
                  );
                })}
              </Box>
            </Box>

            {/* ── Action buttons row ── */}
            <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 1, borderBottom: '1px solid #f1f5f9', flexWrap: 'wrap' }}>
              <Button variant="contained" onClick={() => setApprovalModalOpen(true)} size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#f43f5e', color: '#fff', '&:hover': { bgcolor: '#e11d48' }, px: 2, height: 34, whiteSpace: 'nowrap' }}
              >
                Job Approvals {pendingJobsList.length > 0 && `(${pendingJobsList.length})`}
              </Button>
              <Button variant="contained" onClick={handleAddNew} size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', color: '#fff', boxShadow: '0 2px 8px rgba(63,81,181,0.3)', '&:hover': { background: 'linear-gradient(135deg, #303f9f, #3f51b5)' }, px: 2, height: 34, whiteSpace: 'nowrap' }}
              >+ Post New Opening</Button>
              <Button variant="contained" onClick={handleExportData} size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#10b981', '&:hover': { bgcolor: '#059669' }, px: 1.8, height: 34, whiteSpace: 'nowrap' }}
              >Export Excel</Button>
              <Button variant="contained" onClick={() => setMonthlySummaryOpen(true)} size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' }, px: 1.8, height: 34, whiteSpace: 'nowrap' }}
              >📅 Monthly Summary</Button>
              <Button variant="contained" onClick={handleDownloadJobTemplate} size="small"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#f59e0b', '&:hover': { bgcolor: '#d97706' }, px: 1.8, height: 34, whiteSpace: 'nowrap' }}
              >Template</Button>
              <input type="file" accept=".xlsx, .xls" onChange={handleFileUpload} style={{ display: 'none' }} id="upload-excel" />
              <label htmlFor="upload-excel">
                <Button variant="contained" component="span" size="small"
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, bgcolor: '#8b5cf6', '&:hover': { bgcolor: '#7c3aed' }, px: 1.8, height: 34, whiteSpace: 'nowrap' }}
                >Import Excel</Button>
              </label>
            </Box>

            {/* ── Horizontal Filter Bar ── */}
            <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', borderBottom: '1px solid #f1f5f9', bgcolor: '#fafbff' }}>

              {/* HR filter with Autocomplete (search directly in field) */}
              <Autocomplete
                size="small"
                options={hrUsers}
                getOptionLabel={(option) => `${option.firstName || ''} ${option.lastName || ''}`.trim()}
                value={hrUsers.find(hr => hr._id === hrFilter) || null}
                onChange={(event, newValue) => {
                  setHrFilter(newValue ? newValue._id : '');
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="HR" 
                    placeholder="Search HR..." 
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: 12 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: 12,
                        borderRadius: '8px',
                        bgcolor: hrFilter ? '#e8eaf6' : '#fff',
                      }
                    }}
                  />
                )}
                renderOption={(props, option) => (
                  <li {...props} style={{ fontSize: 13, padding: '4px 12px' }}>
                    {`${option.firstName || ''} ${option.lastName || ''}`.trim()}
                  </li>
                )}
                sx={{ minWidth: 150, display: 'inline-flex' }}
              />

              {/* Company filter with Autocomplete (search directly in field) */}
              <Autocomplete
                multiple
                limitTags={1}
                size="small"
                options={companyNames}
                value={selectedCompanies}
                onChange={(event, newValue) => {
                  setSelectedCompanies(newValue);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Company" 
                    placeholder={selectedCompanies.length > 0 ? "" : "Company"} 
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: 12 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: 12,
                        borderRadius: '8px',
                        bgcolor: selectedCompanies.length > 0 ? '#e8eaf6' : '#fff',
                        py: '2px !important'
                      }
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ fontSize: 13, padding: '4px 12px' }}>
                    <Checkbox
                      size="small"
                      checked={selected}
                      sx={{ p: 0, mr: 1 }}
                    />
                    <ListItemText primary={option} primaryTypographyProps={{ fontSize: 13 }} />
                  </li>
                )}
                sx={{ minWidth: 200, display: 'inline-flex' }}
              />

              {/* Job Title filter with Autocomplete (search directly in field) */}
              <Autocomplete
                multiple
                limitTags={1}
                size="small"
                options={filteredJobTitleOptions}
                value={selectedJobTitle}
                onChange={(event, newValue) => {
                  setSelectedJobTitle(newValue);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Job Title" 
                    placeholder={selectedJobTitle.length > 0 ? "" : "Job Title"} 
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: 12 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: 12,
                        borderRadius: '8px',
                        bgcolor: selectedJobTitle.length > 0 ? '#e8eaf6' : '#fff',
                        py: '2px !important'
                      }
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ fontSize: 13, padding: '4px 12px' }}>
                    <Checkbox
                      size="small"
                      checked={selected}
                      sx={{ p: 0, mr: 1 }}
                    />
                    <ListItemText primary={option} primaryTypographyProps={{ fontSize: 13 }} />
                  </li>
                )}
                sx={{ minWidth: 180, display: 'inline-flex' }}
              />

              {/* Salary filter with Autocomplete (search directly in field) */}
              <Autocomplete
                multiple
                limitTags={1}
                size="small"
                options={filteredSalaryOptions}
                value={selectedSalaries}
                onChange={(event, newValue) => {
                  setSelectedSalaries(newValue);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Salary" 
                    placeholder={selectedSalaries.length > 0 ? "" : "Salary"} 
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: 12 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: 12,
                        borderRadius: '8px',
                        bgcolor: selectedSalaries.length > 0 ? '#e8eaf6' : '#fff',
                        py: '2px !important'
                      }
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ fontSize: 13, padding: '4px 12px' }}>
                    <Checkbox
                      size="small"
                      checked={selected}
                      sx={{ p: 0, mr: 1 }}
                    />
                    <ListItemText primary={option} primaryTypographyProps={{ fontSize: 13 }} />
                  </li>
                )}
                sx={{ minWidth: 150, display: 'inline-flex' }}
              />

              {/* Gender filter */}
              <FormControl size="small" sx={{ minWidth: 110 }}>
                <InputLabel sx={{ fontSize: 12 }}>Gender</InputLabel>
                <Select
                  value={filterGender}
                  label="Gender"
                  onChange={(e) => setFilterGender(e.target.value)}
                  sx={{ fontSize: 12, borderRadius: '8px', bgcolor: filterGender ? '#e8eaf6' : '#fff' }}
                >
                  <MenuItem value=""><em>Any</em></MenuItem>
                  {['Male', 'Female', 'Other'].map(g => <MenuItem key={g} value={g} sx={{ fontSize: 13 }}>{g}</MenuItem>)}
                </Select>
              </FormControl>

              {/* Area filter with Autocomplete (search directly in field) */}
              <Autocomplete
                multiple
                limitTags={1}
                size="small"
                options={areaOptions}
                value={areaFilter}
                onChange={(event, newValue) => {
                  setAreaFilter(newValue);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Area" 
                    placeholder={areaFilter.length > 0 ? "" : "Area"} 
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: 12 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: 12,
                        borderRadius: '8px',
                        bgcolor: areaFilter.length > 0 ? '#e8eaf6' : '#fff',
                        py: '2px !important'
                      }
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ fontSize: 13, padding: '4px 12px' }}>
                    <Checkbox
                      size="small"
                      checked={selected}
                      sx={{ p: 0, mr: 1 }}
                    />
                    <ListItemText primary={option} primaryTypographyProps={{ fontSize: 13 }} />
                  </li>
                )}
                sx={{ minWidth: 160, display: 'inline-flex' }}
              />

              {/* Location filter with Autocomplete (search directly in field) */}
              <Autocomplete
                multiple
                limitTags={1}
                size="small"
                options={filteredLocationOptions}
                value={selectedLocations}
                onChange={(event, newValue) => {
                  setSelectedLocations(newValue);
                }}
                renderInput={(params) => (
                  <TextField 
                    {...params} 
                    label="Location" 
                    placeholder={selectedLocations.length > 0 ? "" : "Location"} 
                    sx={{
                      '& .MuiInputLabel-root': { fontSize: 12 },
                      '& .MuiOutlinedInput-root': {
                        fontSize: 12,
                        borderRadius: '8px',
                        bgcolor: selectedLocations.length > 0 ? '#e8eaf6' : '#fff',
                        py: '2px !important'
                      }
                    }}
                  />
                )}
                renderOption={(props, option, { selected }) => (
                  <li {...props} style={{ fontSize: 13, padding: '4px 12px' }}>
                    <Checkbox
                      size="small"
                      checked={selected}
                      sx={{ p: 0, mr: 1 }}
                    />
                    <ListItemText primary={option} primaryTypographyProps={{ fontSize: 13 }} />
                  </li>
                )}
                sx={{ minWidth: 160, display: 'inline-flex' }}
              />

              {/* Experience text filter */}
              <TextField
                size="small"
                label="Experience"
                value={filterExperience}
                onChange={(e) => setFilterExperience(e.target.value)}
                sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: filterExperience ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: filterExperience && <IconButton size="small" onClick={() => setFilterExperience('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />

              {/* Education text filter */}
              <TextField
                size="small"
                label="Education"
                value={filterEducation}
                onChange={(e) => setFilterEducation(e.target.value)}
                sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: filterEducation ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: filterEducation && <IconButton size="small" onClick={() => setFilterEducation('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />

              {/* Date range */}
              <TextField size="small" label="From" type="date" InputLabelProps={{ shrink: true }} value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: startDate ? '#e8eaf6' : '#fff' } }}
              />
              <TextField size="small" label="To" type="date" InputLabelProps={{ shrink: true }} value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: endDate ? '#e8eaf6' : '#fff' } }}
              />
              {(startDate && endDate) && (
                <Button size="small" variant="contained" onClick={filterByDate}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, height: 36, background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', whiteSpace: 'nowrap' }}>
                  Apply
                </Button>
              )}

              {/* Clear All */}
              {activeFilterCount > 0 && (
                <Button size="small" variant="outlined" onClick={() => {
                  setSelectedCompanies([]); setHrFilter(''); setSelectedSalaries([]); resetJobTitle(); setAreaFilter([]);
                  setSelectedLocations([]); setFilterNoOfReq(''); setFilterJobTiming('');
                  setFilterEducation(''); setFilterExperience(''); setFilterGender(''); setFilterSkills('');
                  setStartDate(''); setEndDate(''); getSales();
                }} sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, color: '#ef4444', borderColor: '#ef4444', height: 36, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#fff5f5', borderColor: '#ef4444' } }}>
                  Clear All ({activeFilterCount})
                </Button>
              )}
            </Box>
          </Box>

          <Modal open={importModalOpen} onClose={() => setImportModalOpen(false)}>
            <Box sx={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 420, bgcolor: '#fff', borderRadius: '16px',
              boxShadow: '0 8px 32px rgba(63,81,181,0.2)', overflow: 'hidden',
            }}>
              <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 3, py: 2 }}>
                <Typography variant="h6" fontWeight={700} color="#fff">Confirm Import</Typography>
              </Box>
              <Box sx={{ p: 3, textAlign: 'center' }}>
                <Typography variant="body1" gutterBottom>File: <strong>{uploadedFileName}</strong></Typography>
                <Typography variant="body2" color="text.secondary" gutterBottom>Are you sure you want to import this data?</Typography>
                <Box mt={3} display="flex" gap={2}>
                  <Button fullWidth variant="outlined" onClick={() => setImportModalOpen(false)}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>Cancel</Button>
                  <Button fullWidth variant="contained" onClick={handleConfirmImport}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)' }}>Import</Button>
                </Box>
              </Box>
            </Box>
          </Modal>

          <Box sx={{
            bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '14px',
            overflow: 'hidden', height: 600,
            boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
          }}>
            <DataGrid
              rows={filteredSales}
              columns={columns}
              components={{ Toolbar: GridToolbar }}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              checkboxSelection
              disableColumnReorder={false}
              getRowClassName={(params) => {
                const status = params.row.jobStatus || 'Open';
                if (status === 'Closed') return '';
                const createdAt = params.row.createdAt;
                if (!createdAt) return '';
                const days = Math.floor((Date.now() - new Date(createdAt).getTime()) / (1000 * 60 * 60 * 24));
                if (days >= 90) return 'age-critical';
                if (days >= 60) return 'age-warning';
                if (days >= 30) return 'age-caution';
                return '';
              }}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.8rem' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', fontSize: '0.82rem', '&:focus': { outline: 'none' } },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-row.Mui-selected': { bgcolor: 'rgba(63,81,181,0.07)', '&:hover': { bgcolor: 'rgba(63,81,181,0.12)' } },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
                '& .MuiToolbar-root': { color: '#3f51b5' },
                // ── Aging row highlights ──
                '& .age-caution': { bgcolor: '#fefce8 !important', '&:hover': { bgcolor: '#fef9c3 !important' } },
                '& .age-warning': { bgcolor: '#fff7ed !important', '&:hover': { bgcolor: '#ffedd5 !important' } },
                '& .age-critical': { bgcolor: '#fff1f2 !important', '&:hover': { bgcolor: '#fee2e2 !important' } },
              }}
            />
          </Box>

          <Modal open={openJobModal} onClose={() => setOpenJobModal(false)}>
            <Box sx={{
              bgcolor: '#fff', boxShadow: '0 8px 40px rgba(63,81,181,0.2)',
              borderRadius: '16px', maxWidth: '95vw', maxHeight: '90vh',
              mx: 'auto', mt: 6, p: { xs: 2, sm: 3 },
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* Modal Header */}
              <Box sx={{
                background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
                borderRadius: '12px', p: 2.5, mb: 2.5,
              }}>
                <Typography variant="h6" fontWeight={700} color="#fff">
                  {jobDetails?.job?.companyName}
                </Typography>
                <Typography variant="body2" color="rgba(255,255,255,0.8)" mt={0.3}>
                  {jobDetails?.job?.jobTitle}
                </Typography>
                <Box sx={{ display: 'flex', gap: 2, mt: 1.5, flexWrap: 'wrap' }}>
                  <Chip size="small" label={`HR: ${jobDetails?.job?.assignedHR?.length > 0 ? jobDetails.job.assignedHR.map(hr => `${hr.firstName} ${hr.lastName}`).join(', ') : 'Not Assigned'}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.75rem' }} />
                  <Chip size="small" label={`Total Candidates: ${jobDetails?.candidates?.length || 0}`}
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600, fontSize: '0.75rem' }} />
                </Box>
              </Box>

              {/* Search */}
              <Box sx={{ mb: 2, width: 300 }}>
                <TextField fullWidth variant="outlined" size="small" placeholder="Search candidates..."
                  value={candidateFilter} onChange={(e) => setCandidateFilter(e.target.value)}
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2, '&:hover fieldset': { borderColor: '#3f51b5' }, '&.Mui-focused fieldset': { borderColor: '#3f51b5' } } }}
                  InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }}
                />
              </Box>

              {/* Candidate Cards */}
              <Box sx={{ overflowY: 'auto', flex: 1 }}>
                <Grid container spacing={2} sx={{ p: 0.5 }}>
                  {jobDetails?.candidates?.filter(c => c.candidateName?.toLowerCase().includes(candidateFilter.toLowerCase())).map((c) => (
                    <Grid item xs={12} sm={6} md={4} lg={3} key={c._id}>
                      <Card sx={{
                        height: '100%', display: 'flex', flexDirection: 'column',
                        border: '1px solid #e8eaf6', borderRadius: '12px',
                        boxShadow: '0 2px 8px rgba(63,81,181,0.08)',
                        transition: 'all 0.2s', '&:hover': { boxShadow: '0 6px 20px rgba(63,81,181,0.18)', transform: 'translateY(-2px)' },
                      }}>
                        <Box sx={{ background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', p: '12px 16px', borderRadius: '12px 12px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" noWrap sx={{ maxWidth: '65%' }}>
                            {c.candidateName || 'N/A'}
                          </Typography>
                          <Chip label={c.lineupStatus || 'N/A'} size="small"
                            sx={{ bgcolor: c.lineupStatus === 'Selected' ? '#d1fae5' : '#f3f4fd', color: c.lineupStatus === 'Selected' ? '#065f46' : '#3f51b5', fontWeight: 600, fontSize: '0.7rem' }} />
                        </Box>
                        <CardContent sx={{ p: '12px 16px', flex: 1 }}>
                          <Grid container spacing={0.5}>
                            <DetailItem label="Position" value={c.positionName} />
                            <DetailItem label="Experience" value={c.experience || 'N/A'} />
                            <DetailItem label="Location" value={c.currentLocation} />
                            <DetailItem label="Current CTC" value={c.currentCTC} />
                            <DetailItem label="Expected CTC" value={c.expectedCTC} />
                            <DetailItem label="Notice Period" value={c.noticePeriod} />
                            <DetailItem label="Company" value={c.currentCompany} />
                            <DetailItem label="Email" value={c.candidateEmail} />
                            <DetailItem label="Mobile" value={c.candidatePhone} />
                            {c.interviewDate && <DetailItem label="Interview" value={new Date(c.interviewDate).toLocaleDateString()} />}
                            <Grid item xs={12} sx={{ mt: 1 }}>
                              <Button fullWidth variant="outlined" size="small"
                                onClick={() => c.resumeLink && c.resumeLink !== 'No Resume' && window.open(c.resumeLink, '_blank')}
                                disabled={!c.resumeLink || c.resumeLink === 'No Resume'}
                                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#c5cae9', color: '#3f51b5', '&:hover': { bgcolor: '#e8eaf6', borderColor: '#3f51b5' } }}
                              >
                                View Resume
                              </Button>
                            </Grid>
                          </Grid>
                        </CardContent>
                        <Box sx={{ px: 2, py: 1, bgcolor: '#f5f6ff', borderTop: '1px solid #e8eaf6', borderRadius: '0 0 12px 12px' }}>
                          <Typography variant="caption" color="#7986cb">
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



          <Modal open={open} onClose={null} disableEscapeKeyDown aria-labelledby="job-form-modal">
            <Box component="form" onSubmit={handleSubmit} sx={{
              position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
              width: 1600, maxHeight: '95vh', bgcolor: '#fff',
              borderRadius: '16px', boxShadow: '0 16px 48px rgba(63,81,181,0.25)',
              display: 'flex', flexDirection: 'column', overflow: 'hidden',
            }}>
              {/* Modal Header */}
              <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 4, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Box sx={{ width: 6, height: 28, bgcolor: 'rgba(255,255,255,0.7)', borderRadius: 3 }} />
                <Typography variant="h6" fontWeight={700} color="#fff">
                  {editMode ? 'Edit Job Opening' : 'Add New Job Opening'}
                </Typography>
              </Box>

              <Grid container spacing={3} sx={{
                flexGrow: 1, overflowY: 'auto', p: 3,
                '&::-webkit-scrollbar': { width: 6 },
                '&::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 3 },
              }}>
                {/* Left Column */}
                <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

                  {/* ── Company Dropdown from CompanyCreate model ── */}
                  <Autocomplete
                    options={companyOptions || []}
                    getOptionLabel={(option) =>
                      option ? `${option.companyName}${option.companyId ? ` (ID: ${option.companyId})` : ''}` : ''
                    }
                    value={companyOptions.find(c => c.companyId === formData.companyId) || (formData.companyName ? { companyName: formData.companyName, companyId: formData.companyId } : null)}
                    onChange={(e, value) => {
                      if (value) {
                        setInputText(value.companyName);
                        setFormData(prev => ({
                          ...prev,
                          companyName: value.companyName,
                          companyId: value.companyId,
                        }));
                        setSelectedBranch(null);
                        if (errors.companyName) setErrors(p => ({ ...p, companyName: false }));
                      } else {
                        setInputText('');
                        setFormData(prev => ({ ...prev, companyName: '', companyId: '' }));
                        setSelectedBranch(null);
                      }
                    }}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="Select Company *"
                        error={errors.companyName}
                        helperText={errors.companyName ? 'Company is required' : 'Choose from registered companies'}
                        required
                      />
                    )}
                    renderOption={(props, option) => (
                      <li {...props} key={option._id || option.companyId}>
                        <Box>
                          <Typography variant="body2" fontWeight={600}>{option.companyName}</Typography>
                          <Typography variant="caption" color="text.secondary">
                            ID: {option.companyId}
                            {option.area ? ` • ${option.area}` : ''}
                            {option.industries ? ` • ${option.industries}` : ''}
                          </Typography>
                        </Box>
                      </li>
                    )}
                    isOptionEqualToValue={(option, value) => option.companyId === value?.companyId}
                  />

                  {/* ── Branch Dropdown ── */}
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
                          <TextField
                            {...params}
                            label="Select Branch"
                            helperText={
                              !formData.companyId ? 'Select a company first'
                                : !hasBranches ? 'No branches for this company'
                                  : 'Optional — select a branch'
                            }
                            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '10px', bgcolor: !hasBranches ? '#f5f5f5' : undefined } }}
                          />
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

                  {/* Job Title */}
                  <TextField
                    label="Job Title *"
                    name="jobTitle"
                    value={formData.jobTitle}
                    onChange={(e) => { handleChange(e); if (errors.jobTitle) setErrors(p => ({ ...p, jobTitle: false })); }}
                    fullWidth error={errors.jobTitle}
                    helperText={errors.jobTitle ? 'Job title is required' : ''}
                    required
                  />

                  {/* Job Location */}
                  <TextField
                    label="Job Location *"
                    name="jobLocation"
                    value={formData.jobLocation}
                    onChange={(e) => { handleChange(e); if (errors.jobLocation) setErrors(p => ({ ...p, jobLocation: false })); }}
                    fullWidth error={errors.jobLocation}
                    helperText={errors.jobLocation ? 'Job location is required' : ''}
                    required
                  />

                  {/* Area */}
                  <TextField
                    label="Area"
                    name="Area"
                    value={formData.Area || ''}
                    onChange={handleChange}
                    fullWidth
                  />


                  {/* No. of Openings + Job Timing */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="No. of Openings *"
                        name="numberOfRequirements"
                        type="number"
                        value={formData.numberOfRequirements}
                        onChange={(e) => { handleChange(e); if (errors.numberOfRequirements) setErrors(p => ({ ...p, numberOfRequirements: false })); }}
                        fullWidth error={errors.numberOfRequirements}
                        helperText={errors.numberOfRequirements ? 'Required' : ''}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                          Job Timing
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                          <TextField
                            label="Start Time"
                            type="time"
                            value={to24h(jobTimingStart)}
                            onChange={(e) => {
                              const val = e.target.value; // "HH:MM" 24h
                              if (!val) { setJobTimingStart(''); return; }
                              const [h, m] = val.split(':');
                              const hh = parseInt(h);
                              const ampm = hh >= 12 ? 'PM' : 'AM';
                              const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
                              setJobTimingStart(`${h12}:${m} ${ampm}`);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                          <Typography variant="body2" color="text.secondary">to</Typography>
                          <TextField
                            label="End Time"
                            type="time"
                            value={to24h(jobTimingEnd)}
                            onChange={(e) => {
                              const val = e.target.value;
                              if (!val) { setJobTimingEnd(''); return; }
                              const [h, m] = val.split(':');
                              const hh = parseInt(h);
                              const ampm = hh >= 12 ? 'PM' : 'AM';
                              const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
                              setJobTimingEnd(`${h12}:${m} ${ampm}`);
                            }}
                            InputLabelProps={{ shrink: true }}
                            inputProps={{ step: 300 }}
                            size="small"
                            sx={{ flex: 1 }}
                          />
                        </Box>
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

                  {/* Education + Gender */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Education *"
                        name="education"
                        value={formData.education}
                        onChange={(e) => { handleChange(e); if (errors.education) setErrors(p => ({ ...p, education: false })); }}
                        fullWidth error={errors.education}
                        helperText={errors.education ? 'Required' : ''}
                        required
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <Autocomplete
                        freeSolo
                        options={['Male', 'Female', 'Other']}
                        value={formData.gender || ''}
                        onChange={(e, v) => setFormData(p => ({ ...p, gender: v || '' }))}
                        onInputChange={(e, v) => setFormData(p => ({ ...p, gender: v }))}
                        renderInput={(params) => <TextField {...params} label="Gender" fullWidth />}
                      />
                    </Grid>
                  </Grid>

                  {/* Salary + Experience */}
                  <Grid container spacing={2}>
                    <Grid item xs={6}>
                      <TextField
                        label="Salary (Monthly ₹)"
                        name="salaryMonthly"
                        value={salaryMonthly}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v === '' || /^\d*\.?\d*$/.test(v)) setSalaryMonthly(v);
                        }}
                        fullWidth
                        inputProps={{ inputMode: 'decimal' }}
                        helperText=""
                      />
                    </Grid>
                    <Grid item xs={6}>
                      <TextField
                        label="Experience (Year) *"
                        name="experience"
                        value={formData.experience}
                        onChange={(e) => {
                          const val = e.target.value;
                          // Allow decimal numbers (e.g. 1.5, 2.5)
                          if (val === '' || /^\d*\.?\d*$/.test(val)) {
                            setFormData(prev => ({ ...prev, experience: val }));
                            if (errors.experience) setErrors(p => ({ ...p, experience: false }));
                          } else if (!/^\d*\.?\d*$/.test(formData.experience)) {
                            // Old value was a non-numeric string; allow clearing it entirely
                            setFormData(prev => ({ ...prev, experience: '' }));
                          }
                        }}
                        fullWidth
                        error={!!errors.experience}
                        helperText={errors.experience ? 'Required' : ''}
                        required
                        inputProps={{ inputMode: 'decimal' }}
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
                      'No Week Off'
                    ]}
                    value={formData.weekOff || ''}
                    onChange={(e, v) => setFormData(p => ({ ...p, weekOff: v || '' }))}
                    onInputChange={(e, v) => setFormData(p => ({ ...p, weekOff: v }))}
                    renderInput={(params) => (
                      <TextField {...params} label="Week Off" fullWidth
                        helperText="Select or type custom week off" />
                    )}
                  />


                  {/* Required Skills */}
                  <TextField
                    label="Required Skills *"
                    name="requiredSkills"
                    value={formData.requiredSkills}
                    onChange={(e) => { handleChange(e); if (errors.requiredSkills) setErrors(p => ({ ...p, requiredSkills: false })); }}
                    fullWidth multiline rows={2}
                    error={errors.requiredSkills}
                    helperText={errors.requiredSkills ? 'Required skills are required' : ''}
                    required
                  />

                  {/* Key Responsibilities */}
                  <TextField
                    label="Key Responsibilities"
                    name="keyResponsibility"
                    value={formData.keyResponsibility}
                    onChange={handleChange}
                    fullWidth multiline rows={3}
                  />

                  {/* Benefits */}
                  <TextField label="Benefits" name="benefits" value={formData.benefits} onChange={handleChange} fullWidth />

                  {/* Response */}
                  <TextField label="Response" name="response" value={formData.response} onChange={handleChange} fullWidth />



                  {/* Job Description PDF */}
                  <Box>
                    <Typography mb={1} variant="body2" fontWeight={600}>Job Description PDF:</Typography>
                    <Button variant="outlined" component="label" startIcon={<UploadFileIcon />}>
                      Upload PDF
                      <input type="file" hidden accept=".pdf,.doc,.docx"
                        onChange={(e) => {
                          const file = e.target.files[0];
                          if (file && file.size > 5 * 1024 * 1024) {
                            setFileErrors(p => ({ ...p, descriptionFile: 'File size exceeds 5MB' }));
                          } else {
                            setFormData(p => ({ ...p, descriptionFile: file }));
                            setFileErrors(p => ({ ...p, descriptionFile: null }));
                          }
                        }}
                      />
                    </Button>
                    {formData.descriptionFile instanceof File && (
                      <Typography variant="body2" color="text.secondary" mt={0.5}>
                        {formData.descriptionFile.name}
                      </Typography>
                    )}
                    {typeof formData.descriptionFile === 'string' && formData.descriptionFile && (
                      <Box mt={0.5} display="flex" alignItems="center" gap={1}>
                        <Typography variant="body2" color="text.secondary">Existing PDF</Typography>
                        <Button size="small" onClick={() => window.open(formData.descriptionFile, '_blank')} startIcon={<VisibilityIcon />}>View</Button>
                      </Box>
                    )}
                    {fileErrors.descriptionFile && (
                      <Typography variant="caption" color="error">{fileErrors.descriptionFile}</Typography>
                    )}
                  </Box>

                </Grid>
              </Grid>

              {/* ── Modal Footer ── */}
              <Box sx={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff', gap: 2,
              }}>
                <Box sx={{ display: 'flex', gap: 2, flex: 1 }}>
                  <FormControl sx={{ minWidth: 250 }}>
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

                  <FormControl sx={{ minWidth: 250 }}>
                    <InputLabel id="tl-select-label">Assign TL</InputLabel>
                    <Select
                      labelId="tl-select-label"
                      name="assignedTL"
                      value={formData.assignedTL || []}
                      onChange={handleTLChange}
                      label="Assign TL"
                      multiple
                      renderValue={(selected) => {
                        if (!selected || selected.length === 0) return 'Not Assigned';
                        return selected
                          .map(id => {
                            const tl = tlUsers.find(tl => tl._id === id);
                            return tl ? `${tl.firstName} ${tl.lastName}` : '';
                          })
                          .filter(Boolean)
                          .join(', ');
                      }}
                    >
                      <MenuItem value="none">
                        <Checkbox
                          checked={!formData.assignedTL || formData.assignedTL.length === 0}
                          indeterminate={false}
                        />
                        <ListItemText primary="Not Assigned" />
                      </MenuItem>
                      {tlUsers.map((tl) => (
                        <MenuItem key={tl._id} value={tl._id}>
                          <Checkbox
                            checked={formData.assignedTL?.includes(tl._id)}
                            indeterminate={false}
                          />
                          <ListItemText primary={`${tl.firstName} ${tl.lastName}`} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>

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
                  <Button variant="outlined" color="error" onClick={handleClose}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}
                  >
                    Close
                  </Button>
                  <Button type="submit" variant="contained" disabled={loading}
                    sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', boxShadow: '0 2px 8px rgba(63,81,181,0.4)', '&:hover': { background: 'linear-gradient(135deg, #303f9f, #3f51b5)' } }}
                  >
                    {loading ? (editMode ? 'Updating...' : 'Creating...') : editMode ? 'Update Job Opening' : 'Add Job Opening'}
                  </Button>
                </Box>
              </Box>
            </Box>
          </Modal>


          <Dialog open={openCandidateDialog} onClose={() => setOpenCandidateDialog(false)} fullWidth maxWidth="xl"
            PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
          >
            <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 3, py: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6" fontWeight={700} color="#fff">Matching Candidates</Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  {matchedJobTitle && `For: ${matchedJobTitle} • `}
                  {normalizedCandidates.filter(c => {
                    const nm = (v) => String(v || '').toLowerCase();
                    return (
                      (!mcFilterName || nm(c.name).includes(nm(mcFilterName))) &&
                      (!mcFilterPhone || String(c.phoneNumber || '').replace(/\D/g, '').includes(mcFilterPhone.replace(/\D/g, ''))) &&
                      (!mcFilterExperience || nm(c.experience).includes(nm(mcFilterExperience))) &&
                      (!mcFilterLocation || nm(c.currentLocation).includes(nm(mcFilterLocation))) &&
                      (!mcFilterPosition || nm(c.positionName).includes(nm(mcFilterPosition))) &&
                      (!mcFilterExpectedCTC || nm(c.expectedCTC).includes(nm(mcFilterExpectedCTC))) &&
                      (!mcFilterNoticePeriod || nm(c.noticePeriod).includes(nm(mcFilterNoticePeriod))) &&
                      (!mcFilterCurrentCompany || nm(c.currentCompany).includes(nm(mcFilterCurrentCompany))) &&
                      ((!mcFilterDateFrom && !mcFilterDateTo) || (() => {
                        if (!c.createdAt) return false;
                        const candDate = new Date(c.createdAt);
                        if (isNaN(candDate.getTime())) return false;
                        if (mcFilterDateFrom) {
                          const fromDate = new Date(mcFilterDateFrom);
                          fromDate.setHours(0, 0, 0, 0);
                          if (candDate < fromDate) return false;
                        }
                        if (mcFilterDateTo) {
                          const toDate = new Date(mcFilterDateTo);
                          toDate.setHours(23, 59, 59, 999);
                          if (candDate > toDate) return false;
                        }
                        return true;
                      })())
                    );
                  }).length} of {normalizedCandidates.length} candidates
                </Typography>
              </Box>
              <IconButton size="small" onClick={() => setOpenCandidateDialog(false)}
                sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* ── Matching Candidates Filter Bar ── */}
            <Box sx={{ px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap', bgcolor: '#fafbff', borderBottom: '1px solid #e8eaf6' }}>
              <TextField
                size="small"
                placeholder="Search name..."
                value={mcFilterName}
                onChange={(e) => setMcFilterName(e.target.value)}
                sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterName ? '#e8eaf6' : '#fff' } }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ fontSize: 15, color: '#9fa8da', mr: 0.5 }} />,
                  endAdornment: mcFilterName && <IconButton size="small" onClick={() => setMcFilterName('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton>,
                }}
              />
              <TextField
                size="small"
                placeholder="Search phone..."
                value={mcFilterPhone}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setMcFilterPhone(v);
                }}
                sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterPhone ? '#e8eaf6' : '#fff' } }}
                inputProps={{ maxLength: 10 }}
                InputProps={{
                  startAdornment: <SearchIcon sx={{ fontSize: 15, color: '#9fa8da', mr: 0.5 }} />,
                  endAdornment: mcFilterPhone && <IconButton size="small" onClick={() => setMcFilterPhone('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton>,
                }}
              />
              <TextField size="small" label="Experience" value={mcFilterExperience} onChange={(e) => setMcFilterExperience(e.target.value)}
                sx={{ width: 130, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterExperience ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterExperience && <IconButton size="small" onClick={() => setMcFilterExperience('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              <TextField size="small" label="Location" value={mcFilterLocation} onChange={(e) => setMcFilterLocation(e.target.value)}
                sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterLocation ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterLocation && <IconButton size="small" onClick={() => setMcFilterLocation('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              <TextField size="small" label="Position" value={mcFilterPosition} onChange={(e) => setMcFilterPosition(e.target.value)}
                sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterPosition ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterPosition && <IconButton size="small" onClick={() => setMcFilterPosition('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              <TextField size="small" label="Expected CTC" value={mcFilterExpectedCTC} onChange={(e) => setMcFilterExpectedCTC(e.target.value)}
                sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterExpectedCTC ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterExpectedCTC && <IconButton size="small" onClick={() => setMcFilterExpectedCTC('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              <TextField size="small" label="Notice Period" value={mcFilterNoticePeriod} onChange={(e) => setMcFilterNoticePeriod(e.target.value)}
                sx={{ width: 140, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterNoticePeriod ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterNoticePeriod && <IconButton size="small" onClick={() => setMcFilterNoticePeriod('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              <TextField size="small" label="Current Company" value={mcFilterCurrentCompany} onChange={(e) => setMcFilterCurrentCompany(e.target.value)}
                sx={{ width: 160, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterCurrentCompany ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterCurrentCompany && <IconButton size="small" onClick={() => setMcFilterCurrentCompany('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              <TextField
                size="small"
                label="Date From"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={mcFilterDateFrom}
                onChange={(e) => setMcFilterDateFrom(e.target.value)}
                sx={{ width: 135, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterDateFrom ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterDateFrom && <IconButton size="small" onClick={() => setMcFilterDateFrom('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              <TextField
                size="small"
                label="Date To"
                type="date"
                InputLabelProps={{ shrink: true }}
                value={mcFilterDateTo}
                onChange={(e) => setMcFilterDateTo(e.target.value)}
                sx={{ width: 135, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: mcFilterDateTo ? '#e8eaf6' : '#fff' } }}
                InputProps={{ endAdornment: mcFilterDateTo && <IconButton size="small" onClick={() => setMcFilterDateTo('')}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
              />
              {(mcFilterName || mcFilterPhone || mcFilterExperience || mcFilterLocation || mcFilterPosition || mcFilterExpectedCTC || mcFilterNoticePeriod || mcFilterCurrentCompany || mcFilterDateFrom || mcFilterDateTo) && (
                <Button size="small" variant="outlined"
                  onClick={() => {
                    setMcFilterName('');
                    setMcFilterPhone('');
                    setMcFilterExperience('');
                    setMcFilterLocation('');
                    setMcFilterPosition('');
                    setMcFilterExpectedCTC('');
                    setMcFilterNoticePeriod('');
                    setMcFilterCurrentCompany('');
                    setMcFilterDateFrom('');
                    setMcFilterDateTo('');
                  }}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, color: '#ef4444', borderColor: '#ef4444', height: 36, whiteSpace: 'nowrap', '&:hover': { bgcolor: '#fff5f5', borderColor: '#ef4444' } }}>
                  Clear All
                </Button>
              )}
            </Box>

            <DialogContent sx={{ p: 2 }}>
              <div style={{ height: 560, width: '100%' }}>
                <DataGrid
                  rows={normalizedCandidates.filter(c => {
                    const nm = (v) => String(v || '').toLowerCase();
                    return (
                      (!mcFilterName || nm(c.name).includes(nm(mcFilterName))) &&
                      (!mcFilterPhone || String(c.phoneNumber || '').replace(/\D/g, '').includes(mcFilterPhone.replace(/\D/g, ''))) &&
                      (!mcFilterExperience || nm(c.experience).includes(nm(mcFilterExperience))) &&
                      (!mcFilterLocation || nm(c.currentLocation).includes(nm(mcFilterLocation))) &&
                      (!mcFilterPosition || nm(c.positionName).includes(nm(mcFilterPosition))) &&
                      (!mcFilterExpectedCTC || nm(c.expectedCTC).includes(nm(mcFilterExpectedCTC))) &&
                      (!mcFilterNoticePeriod || nm(c.noticePeriod).includes(nm(mcFilterNoticePeriod))) &&
                      (!mcFilterCurrentCompany || nm(c.currentCompany).includes(nm(mcFilterCurrentCompany))) &&
                      ((!mcFilterDateFrom && !mcFilterDateTo) || (() => {
                        if (!c.createdAt) return false;
                        const candDate = new Date(c.createdAt);
                        if (isNaN(candDate.getTime())) return false;
                        if (mcFilterDateFrom) {
                          const fromDate = new Date(mcFilterDateFrom);
                          fromDate.setHours(0, 0, 0, 0);
                          if (candDate < fromDate) return false;
                        }
                        if (mcFilterDateTo) {
                          const toDate = new Date(mcFilterDateTo);
                          toDate.setHours(23, 59, 59, 999);
                          if (candDate > toDate) return false;
                        }
                        return true;
                      })())
                    );
                  })}
                  columns={[
                    { field: 'name', headerName: 'Name', width: 150 },
                    { field: 'phoneNumber', headerName: 'Phone', width: 130 },
                    { field: 'positionName', headerName: 'Position', width: 150 },
                    { field: 'experience', headerName: 'Experience (Years)', width: 140 },
                    { field: 'currentLocation', headerName: 'Location', width: 150 },
                    { field: 'currentPosition', headerName: 'Current Position', width: 160 },
                    { field: 'currentCTC', headerName: 'Current Monthly ₹', width: 140 },
                    { field: 'expectedCTC', headerName: 'Expected Monthly ₹', width: 140 },
                    { field: 'noticePeriod', headerName: 'Notice Period (Days)', width: 150 },
                    { field: 'reasonforLeaving', headerName: 'Reason for Leaving', width: 180 },
                    { field: 'currentCompany', headerName: 'Current Company', width: 150 },
                    { field: 'remark', headerName: 'Remark', width: 150 },
                    {
                      field: 'createdAt',
                      headerName: 'Created At',
                      width: 120,
                      valueFormatter: (params) => params.value ? new Date(params.value).toLocaleDateString() : 'N/A'
                    },
                    {
                      field: 'resume', headerName: 'Resume', width: 100,
                      renderCell: (params) => params.value
                        ? <a href={params.value} target="_blank" rel="noreferrer" style={{ color: '#3f51b5' }}>View</a>
                        : <span style={{ color: '#9fa8da' }}>N/A</span>,
                    },
                  ]}
                  pageSize={10}
                  rowsPerPageOptions={[5, 10, 25]}
                  sx={{
                    border: 'none',
                    '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                    '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.8rem' },
                    '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', '&:focus': { outline: 'none' } },
                    '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                  }}
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

      {/* ── Hold Job Dialog ── */}
      <Dialog
        open={holdDialog.open}
        onClose={() => { setHoldDialog({ open: false, jobId: null, jobTitle: '' }); setHoldReasonInput(''); }}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            ⏸️
          </Box>
          <Box>
            <Typography fontWeight={700} color="#fff" fontSize={16}>Put Job On Hold</Typography>
            <Typography fontSize={12} color="rgba(255,255,255,0.85)">
              {holdDialog.jobTitle}
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography fontSize={13} color="#374151" mb={1.5}>
            Please provide a reason for putting this job on hold:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={3}
            size="small"
            placeholder="e.g. Budget freeze, position re-evaluation..."
            value={holdReasonInput}
            onChange={(e) => setHoldReasonInput(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
            autoFocus
          />
        </Box>
        <Box sx={{ px: 3, pb: 2.5, display: 'flex', gap: 1.5 }}>
          <Button fullWidth variant="outlined"
            onClick={() => { setHoldDialog({ open: false, jobId: null, jobTitle: '' }); setHoldReasonInput(''); }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d1d5db', color: '#6b7280' }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained"
            onClick={handleConfirmHold}
            disabled={!holdReasonInput.trim()}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#f97316', '&:hover': { bgcolor: '#ea580c' }, '&:disabled': { bgcolor: '#fed7aa', color: '#fff' } }}>
            Confirm Hold
          </Button>
        </Box>
      </Dialog>

      {/* ── Close Job Confirmation Dialog ── */}
      <Dialog
        open={closeJobDialog.open}
        onClose={() => setCloseJobDialog({ open: false, jobId: null, jobTitle: '' })}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20,
          }}>
            ✅
          </Box>
          <Box>
            <Typography fontWeight={700} color="#fff" fontSize={16}>Close Job Opening</Typography>
            <Typography fontSize={12} color="rgba(255,255,255,0.8)">All requirements have been fulfilled</Typography>
          </Box>
        </Box>
        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography fontSize={14} color="#374151" lineHeight={1.7}>
            Are you sure you want to mark{' '}
            <strong>"{closeJobDialog.jobTitle}"</strong>{' '}
            as <strong>Closed</strong>?
          </Typography>
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <Typography fontSize={12} color="#b91c1c">
              ⚠️ This job will no longer appear as open. You can reopen it anytime.
            </Typography>
          </Box>
        </Box>
        <Box sx={{ px: 3, pb: 2.5, display: 'flex', gap: 1.5 }}>
          <Button fullWidth variant="outlined"
            onClick={() => setCloseJobDialog({ open: false, jobId: null, jobTitle: '' })}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d1d5db', color: '#6b7280' }}>
            Cancel
          </Button>
          <Button fullWidth variant="contained"
            onClick={handleConfirmCloseJob}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' } }}>
            Yes, Close Job
          </Button>
        </Box>
      </Dialog>

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
          const isCompany = detailPanel.view === 'company';

          // ── Data to display ──────────────────────────────────────────────
          const title = isCompany ? row.companyName : row.br_branchName;
          const subtitle = isCompany ? `Company ID: ${row.companyId}` : `Branch of ${row.companyName}`;
          const address = isCompany ? row.co_companyAddress : row.br_branchAddress;
          const area = isCompany ? row.co_area : row.br_area;
          const city = isCompany ? row.co_city : row.br_city;
          const contact = isCompany ? row.co_contactPerson : row.br_contactPerson;
          const phone = isCompany ? row.co_contactNumber2 : row.br_contactNumber;
          const email = isCompany ? row.co_email : row.br_email;
          const website = isCompany ? row.co_websiteUrl : null;
          const gps = isCompany ? row.co_gpsLocation : row.br_gpsLocation;
          const industries = isCompany ? row.co_industries : null;
          const gst = isCompany ? row.co_gstUpload : null;
          const agreement = isCompany ? row.co_agreementUpload : null;
          const token = isCompany ? row.co_tokenAmount : null;

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
              {row.br_branchName && (
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

      {/* ── Pending Approvals Modal ── */}
      <Dialog open={approvalModalOpen} onClose={() => setApprovalModalOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '16px', bgcolor: '#f9f9f9' } }}>
        <DialogTitle sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', color: '#fff', fontWeight: 700, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          Pending Job Approvals
          <IconButton onClick={() => setApprovalModalOpen(false)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3 }}>
          {pendingJobsList.length === 0 ? (
            <Typography variant="body1" color="text.secondary" textAlign="center" mt={3}>
              No pending job approvals.
            </Typography>
          ) : (
            <Grid container spacing={2}>
              {pendingJobsList.map((job) => (
                <Grid item xs={12} key={job._id}>
                  <Card sx={{ p: 2, border: '1px solid #e0e0e0', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <Box>
                      <Typography variant="subtitle1" fontWeight={700} color="#3f51b5">{job.jobTitle}</Typography>
                      <Typography variant="body2" color="text.secondary">Company: {job.companyName}</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Location: {job.jobLocation || 'N/A'} | Req: {job.numberOfRequirements || 'N/A'} | Created: {job.createdAt ? job.createdAt.format('DD/MM/YYYY') : 'N/A'} | Created By: {job.createdBy ? job.createdBy.firstName + ' ' + job.createdBy.lastName + '-' + job.createdBy.role || '' : 'N/A'}
                      </Typography>
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Button variant="outlined" color="primary" size="small" sx={{ borderRadius: '8px', fontWeight: 600 }} onClick={() => setReviewJob(job)}>Review</Button>
                      <Button variant="outlined" color="error" size="small" sx={{ borderRadius: '8px', fontWeight: 600 }} onClick={() => handleRejectJob(job._id)}>Reject</Button>
                    </Box>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Review Job Details Dialog ── */}
      <Dialog
        open={Boolean(reviewJob)}
        onClose={() => setReviewJob(null)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden', bgcolor: '#fdfdfd' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
          px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box>
            <Typography fontWeight={700} color="#fff" fontSize={18}>
              Review Job Opening Details
            </Typography>
            <Typography fontSize={13} color="rgba(255,255,255,0.85)">
              {reviewJob?.jobTitle} at {reviewJob?.companyName}
            </Typography>
          </Box>
          <IconButton onClick={() => setReviewJob(null)} sx={{ color: '#fff' }}>
            <CloseIcon />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3 }}>
          {reviewJob && (
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>COMPANY NAME</Typography>
                <Typography variant="body1" fontWeight={600} color="#333">{reviewJob.companyName || '—'}</Typography>
                {reviewJob.branchName && (
                  <Chip label={`Branch: ${reviewJob.branchName}`} size="small" sx={{ mt: 0.5, bgcolor: '#e8f5e9', color: '#2e7d32', fontWeight: 700 }} />
                )}
              </Grid>
              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>JOB TITLE</Typography>
                <Typography variant="body1" fontWeight={600} color="#3f51b5">{reviewJob.jobTitle || '—'}</Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>CREATED BY</Typography>
                <Typography variant="body1" fontWeight={600} color="#333">
                  {reviewJob.createdBy
                    ? (typeof reviewJob.createdBy === 'object'
                      ? `${reviewJob.createdBy.firstName || ''} ${reviewJob.createdBy.lastName || ''}`.trim()
                      : reviewJob.createdBy)
                    : '—'}
                </Typography>
                {reviewJob.createdAt && (
                  <Typography variant="caption" color="text.secondary">
                    on {new Date(reviewJob.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </Typography>
                )}
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>LOCATION</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.jobLocation || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>NO. OF OPENINGS</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.numberOfRequirements || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>JOB TIMING</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.jobTiming || '—'}</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>SALARY</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.salary || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>EXPERIENCE</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.experience || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>EDUCATION</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.education || '—'}</Typography>
              </Grid>

              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>GENDER PREFERENCE</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.gender || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>WEEK OFF</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.weekOff || '—'}</Typography>
              </Grid>
              <Grid item xs={12} sm={4}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>RESPONSE</Typography>
                <Typography variant="body2" fontWeight={500}>{reviewJob.response || '—'}</Typography>
              </Grid>

              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

              <Grid item xs={12}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>REQUIRED SKILLS</Typography>
                <Typography variant="body2" sx={{ whiteSpace: 'pre-line', bgcolor: '#f4f6f9', p: 1.5, borderRadius: '8px' }}>{reviewJob.requiredSkills || '—'}</Typography>
              </Grid>

              {reviewJob.keyResponsibility && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>KEY RESPONSIBILITIES</Typography>
                  <Typography variant="body2" sx={{ whiteSpace: 'pre-line', bgcolor: '#f4f6f9', p: 1.5, borderRadius: '8px' }}>{reviewJob.keyResponsibility}</Typography>
                </Grid>
              )}

              {reviewJob.benefits && (
                <Grid item xs={12}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>BENEFITS</Typography>
                  <Typography variant="body2" fontWeight={500}>{reviewJob.benefits}</Typography>
                </Grid>
              )}

              <Grid item xs={12}><Divider sx={{ my: 1 }} /></Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>ASSIGNED HR</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {(() => {
                    const hrList = reviewJob.assignedHR || [];
                    if (hrList.length === 0) return 'Not Assigned';
                    return hrList.map(hr => {
                      if (typeof hr === 'string') {
                        const hrUser = hrUsers.find(h => h._id === hr);
                        return hrUser ? `${hrUser.firstName || ''} ${hrUser.lastName || ''}`.trim() : hr;
                      }
                      return hr ? `${hr.firstName || ''} ${hr.lastName || ''}`.trim() : '';
                    }).filter(Boolean).join(', ') || 'Not Assigned';
                  })()}
                </Typography>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block' }}>ASSIGNED TEAM LEADERS (TL)</Typography>
                <Typography variant="body2" fontWeight={500}>
                  {(() => {
                    const tlList = reviewJob.assignedTL || [];
                    if (tlList.length === 0) return 'Not Assigned';
                    return tlList.map(tl => {
                      if (typeof tl === 'string') {
                        const tlUser = tlUsers.find(t => t._id === tl);
                        return tlUser ? `${tlUser.firstName || ''} ${tlUser.lastName || ''}`.trim() : tl;
                      }
                      return tl ? `${tl.firstName || ''} ${tl.lastName || ''}`.trim() : '';
                    }).filter(Boolean).join(', ') || 'Not Assigned';
                  })()}
                </Typography>
              </Grid>

              {reviewJob.descriptionFile && (
                <Grid item xs={12} sx={{ mt: 1 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 700, display: 'block', mb: 0.5 }}>JOB DESCRIPTION DOCUMENT</Typography>
                  <Button
                    variant="outlined"
                    size="small"
                    component="a"
                    href={reviewJob.descriptionFile}
                    target="_blank"
                    rel="noopener noreferrer"
                    startIcon={<VisibilityIcon />}
                    sx={{ textTransform: 'none', borderRadius: '8px' }}
                  >
                    View JD PDF
                  </Button>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3, pt: 1, display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            onClick={() => setReviewJob(null)}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, px: 3 }}
          >
            Close
          </Button>
          <Button
            variant="contained"
            color="success"
            onClick={() => {
              handleApproveJob(reviewJob._id);
              setReviewJob(null);
            }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, px: 4, bgcolor: '#2e7d32', '&:hover': { bgcolor: '#1b5e20' } }}
          >
            Accept (Approve)
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Monthly Summary Dialog ── */}
      <Dialog
        open={monthlySummaryOpen}
        onClose={() => setMonthlySummaryOpen(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #0ea5e9 0%, #0284c7 100%)',
          px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        }}>
          <Box>
            <Typography variant="h6" fontWeight={800} color="#fff">📅 Monthly Opening Summary</Typography>
            <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
View new job openings for any month
            </Typography>
          </Box>
          <IconButton onClick={() => setMonthlySummaryOpen(false)} size="small"
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <DialogContent sx={{ p: 3, bgcolor: '#f8faff' }}>

          {/* Month Picker + Quick Buttons */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
            <TextField
              type="month"
              size="small"
              label="Select Month"
              value={summaryMonth}
              onChange={e => setSummaryMonth(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{
                width: 180,
                '& .MuiOutlinedInput-root': { borderRadius: '10px', fontWeight: 700, fontSize: '0.9rem' },
              }}
            />
            {[
              { label: 'This Month', offset: 0 },
              { label: 'Last Month', offset: -1 },
              { label: '2 Months Ago', offset: -2 },
              { label: '3 Months Ago', offset: -3 },
            ].map(({ label, offset }) => {
              const val = quickMonth(offset);
              const active = summaryMonth === val;
              return (
                <Button key={label} size="small" variant={active ? 'contained' : 'outlined'}
                  onClick={() => setSummaryMonth(val)}
                  sx={{
                    borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem',
                    ...(active
                      ? { bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }
                      : { borderColor: '#0ea5e9', color: '#0ea5e9', '&:hover': { bgcolor: '#e0f2fe' } }),
                  }}>
                  {label}
                </Button>
              );
            })}
          </Box>

          {monthlySummaryData && (
            <>
              {/* Month Title */}
              <Typography variant="subtitle1" fontWeight={800} color="#1e293b" mb={2}>
                📊 {monthLabel(summaryMonth)} — Summary
              </Typography>

              {/* Stat Cards */}
              <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mb: 3 }}>
                {[
                  { label: 'Total New Openings', value: monthlySummaryData.total, bg: '#e0f2fe', color: '#0369a1', border: '#7dd3fc' },
                  { label: 'Open', value: monthlySummaryData.open, bg: '#dcfce7', color: '#15803d', border: '#86efac' },
                  { label: 'Closed', value: monthlySummaryData.closed, bg: '#fee2e2', color: '#b91c1c', border: '#fca5a5' },
                  { label: 'On Hold', value: monthlySummaryData.onHold, bg: '#fff7ed', color: '#c2410c', border: '#fdba74' },
                  { label: 'Assigned', value: monthlySummaryData.assigned, bg: '#f0fdf4', color: '#166534', border: '#bbf7d0' },
                  { label: 'Unassigned', value: monthlySummaryData.unassigned, bg: '#fefce8', color: '#a16207', border: '#fde047' },
                ].map(({ label, value, bg, color, border }) => (
                  <Box key={label} sx={{
                    flex: '1 1 120px', minWidth: 110,
                    bgcolor: bg, border: `1px solid ${border}`, borderRadius: '12px',
                    p: 1.5, textAlign: 'center',
                  }}>
                    <Typography variant="h5" fontWeight={800} color={color} lineHeight={1}>{value}</Typography>
                    <Typography variant="caption" color={color} fontWeight={600} sx={{ opacity: 0.8 }}>{label}</Typography>
                  </Box>
                ))}
              </Box>

              {monthlySummaryData.total === 0 ? (
                <Box sx={{ textAlign: 'center', py: 4, color: '#94a3b8' }}>
                  <Typography variant="h6">😕 No new openings were found this month</Typography>
                  <Typography variant="caption">Select another month</Typography>
                </Box>
              ) : (
                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>

                  {/* Company-wise Breakdown */}
                  <Box sx={{ flex: '1 1 280px', bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px', overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.2, bgcolor: '#f1f5f9', borderBottom: '1px solid #e8eaf6' }}>
                      <Typography variant="caption" fontWeight={800} color="#3f51b5" textTransform="uppercase" letterSpacing="0.05em">
                        🏢 Company-wise Breakdown
                      </Typography>
                    </Box>
                    <Box sx={{ maxHeight: 260, overflowY: 'auto', p: 1 }}>
                      {monthlySummaryData.companyBreakdown.map(({ name, total, open, closed, onHold }) => (
                        <Box key={name} sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          px: 1.5, py: 0.8, borderRadius: '8px', mb: 0.5,
                          '&:hover': { bgcolor: '#f8faff' },
                        }}>
                          <Typography variant="caption" fontWeight={600} color="#334155" noWrap sx={{ maxWidth: 160 }}>
                            {name}
                          </Typography>
                          <Box sx={{ display: 'flex', gap: 0.5, flexShrink: 0 }}>
                            <Chip label={total} size="small" sx={{ bgcolor: '#e0f2fe', color: '#0369a1', fontWeight: 800, fontSize: '0.7rem', height: 20 }} />
                            {open > 0 && <Chip label={`${open} open`} size="small" sx={{ bgcolor: '#dcfce7', color: '#15803d', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
                            {closed > 0 && <Chip label={`${closed} closed`} size="small" sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
                            {onHold > 0 && <Chip label={`${onHold} hold`} size="small" sx={{ bgcolor: '#fff7ed', color: '#c2410c', fontWeight: 700, fontSize: '0.65rem', height: 20 }} />}
                          </Box>
                        </Box>
                      ))}
                    </Box>
                  </Box>

                  {/* Top Job Titles */}
                  <Box sx={{ flex: '1 1 220px', bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px', overflow: 'hidden' }}>
                    <Box sx={{ px: 2, py: 1.2, bgcolor: '#f1f5f9', borderBottom: '1px solid #e8eaf6' }}>
                      <Typography variant="caption" fontWeight={800} color="#7c3aed" textTransform="uppercase" letterSpacing="0.05em">
                        💼 Top Job Titles
                      </Typography>
                    </Box>
                    <Box sx={{ maxHeight: 260, overflowY: 'auto', p: 1 }}>
                      {monthlySummaryData.titleBreakdown.map(({ title, count }) => (
                        <Box key={title} sx={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          px: 1.5, py: 0.8, borderRadius: '8px', mb: 0.5,
                          '&:hover': { bgcolor: '#faf5ff' },
                        }}>
                          <Typography variant="caption" fontWeight={600} color="#334155" noWrap sx={{ maxWidth: 160 }}>
                            {title}
                          </Typography>
                          <Chip label={count} size="small"
                            sx={{ bgcolor: '#f3e8ff', color: '#7c3aed', fontWeight: 800, fontSize: '0.7rem', height: 20 }} />
                        </Box>
                      ))}
                    </Box>
                  </Box>

                </Box>
              )}
            </>
          )}
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 2.5, pt: 1, borderTop: '1px solid #e8eaf6', bgcolor: '#f8faff', gap: 1 }}>
          <Button onClick={() => setMonthlySummaryOpen(false)} variant="outlined"
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#cbd5e1', color: '#64748b' }}>
            Close
          </Button>
          {monthlySummaryData && monthlySummaryData.total > 0 && (
            <Button
              variant="contained"
              onClick={() => applyMonthToGrid(summaryMonth)}
              sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, bgcolor: '#0ea5e9', '&:hover': { bgcolor: '#0284c7' } }}
            >
              📋 See in Grid View — {monthLabel(summaryMonth)}
            </Button>
          )}
        </DialogActions>
      </Dialog>

    </div>
  );
};

export default JobReport;

