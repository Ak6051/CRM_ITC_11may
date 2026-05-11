import React, { useEffect, useState } from "react";
import { API_BASE_URL } from "../../config/api.config";
import axios from "axios";
import { 
  Grid,
  Paper,
  Typography,
  Box,
  TextField,
  MenuItem,
  Button,
  Slider,
  Chip,
  FormControl,
  Select,
  InputAdornment,
  IconButton,
  Tooltip,
  FormControlLabel,
  Switch,
  Checkbox,
  FormGroup,
  FormLabel,
  Radio,
  RadioGroup,
  Divider,
  Autocomplete,
  LinearProgress,
  Collapse,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Avatar,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  ListItemAvatar,
  Card,
  CardContent,
  CardActions,
  CardMedia,
  CircularProgress
} from "@mui/material";
import { 
  Visibility as ViewIcon, 
  Work as WorkIcon, 
  LocationOn as LocationIcon, 
  AttachMoney as MoneyIcon, 
  AccessTime as NoticeIcon, 
  Business as CompanyIcon, 
  Person as PersonIcon, 
  Phone as PhoneIcon, 
  Email as EmailIcon,
  GridView as GridViewIcon, 
  ViewList as ListViewIcon, 
  Description as ResumeIcon,
} from '@mui/icons-material';
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import Navbar from '../../components/team leader components/TeamLeaderNavbar';
import ClearIcon from '@mui/icons-material/Clear';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import ArrowBackIcon from '@mui/icons-material/ArrowBack'; 
import { useNavigate } from 'react-router-dom';
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import useTLPermissions from '../../hooks/useTLPermissions';

const mainContentStyle = {
  padding: '16px',
  width: '100%',
  backgroundColor: '#f8fafc',
};

const AdminCandidateList = () => {
  const { canDo } = useTLPermissions();
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hrList, setHrList] = useState([]);
  const [selectedHRs, setSelectedHRs] = useState([]);
  const [dateRange, setDateRange] = useState({
    startDate: null,
    endDate: null
  });
  const [positions, setPositions] = useState([]);
  const [selectedPositions, setSelectedPositions] = useState([]);
  
  // New filter states
  const [nameFilter, setNameFilter] = useState('');
  const [experienceRange, setExperienceRange] = useState({
    min: '',
    max: ''
  });
  const [locationFilter, setLocationFilter] = useState('');
  const [ctcFilter, setCtcFilter] = useState('');
  const [noticePeriodFilter, setNoticePeriodFilter] = useState('');

  const navigate = useNavigate();

  const handleExperienceChange = (field) => (e) => {
    const value = e.target.value.replace(/[^0-9.]/g, '');
    setExperienceRange(prev => ({
      ...prev,
      [field]: value
    }));
  };
  
  // State for view dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchHRList = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/hr/hr-admins`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const hrAdmins = response.data.map(user => ({
        id: user._id,
        name: `${user.firstName} ${user.lastName}`.trim(),
        role: user.role
      }));
      
      setHrList(hrAdmins);
    } catch (error) {
      console.error("Error fetching HR list:", error);
    }
  };

  const fetchCandidates = async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const response = await axios.get(`${API_BASE_URL}/candidate/hr-candidates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      // Format the data and ensure each row has a unique ID
      const formattedData = response.data.map((candidate, index) => ({
        ...candidate,
        // Use _id if available, otherwise create a unique ID using timestamp and index
        id: candidate._id || `row-${Date.now()}-${index}`,
      }));

      // Extract unique positions
      const uniquePositions = [...new Set(formattedData
        .map(candidate => candidate.positionName)
        .filter(Boolean)
        .sort()
      )];
      
      setPositions(uniquePositions);
      setCandidates(formattedData);
      setFilteredCandidates(formattedData);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  // Filter candidates based on all selected filters
  useEffect(() => {
    let filtered = [...candidates];

    // Apply all filters with AND logic
    filtered = filtered.filter(candidate => {
      // Filter by name (case insensitive partial match)
      if (nameFilter) {
        const candidateName = String(candidate.name || '').toLowerCase();
        if (!candidateName.includes(nameFilter.toLowerCase())) {
          return false;
        }
      }

      // Filter by experience range
      if (experienceRange.min || experienceRange.max) {
        const candidateExp = parseFloat(candidate.experience) || 0;
        const minExp = experienceRange.min ? parseFloat(experienceRange.min) : 0;
        const maxExp = experienceRange.max ? parseFloat(experienceRange.max) : Infinity;
        
        if (candidateExp < minExp || candidateExp > maxExp) {
          return false;
        }
      }

      // Filter by location (case insensitive partial match)
      if (locationFilter) {
        const location = String(candidate.currentLocation || '').toLowerCase();
        if (!location.includes(locationFilter.toLowerCase())) {
          return false;
        }
      }

      // Filter by current CTC (exact match or greater than)
      if (ctcFilter) {
        const ctc = parseFloat(ctcFilter);
        const candidateCtc = parseFloat(candidate.currentCTC) || 0;
        if (candidateCtc < ctc) {
          return false;
        }
      }

      // Filter by notice period (exact match or less than)
      if (noticePeriodFilter) {
        const noticePeriod = parseInt(noticePeriodFilter, 10);
        const candidateNotice = parseInt(candidate.noticePeriod, 10);
        if (isNaN(candidateNotice) || candidateNotice > noticePeriod) {
          return false;
        }
      }

      // Filter by selected HRs (if any selected)
      if (selectedHRs.length > 0) {
        const createdBy = String(candidate.createdBy || '');
        const hrMatch = selectedHRs.some(hr => {
          return createdBy.toLowerCase().includes(hr.name.toLowerCase()) ||
                 (hr.name && createdBy.toLowerCase().includes(hr.name.split(' ')[0].toLowerCase()));
        });
        if (!hrMatch) return false;
      }

      // Filter by selected positions (if any selected)
      if (selectedPositions.length > 0) {
        const positionName = String(candidate.positionName || '').trim().toLowerCase();
        const positionMatch = selectedPositions.some(
          pos => positionName === pos.trim().toLowerCase()
        );
        if (!positionMatch) return false;
      }

      // Filter by date range (if any date is selected)
      if (dateRange.startDate || dateRange.endDate) {
        if (!candidate.createdAt) return false;
        
        const candidateDate = new Date(candidate.createdAt);
        const startDate = dateRange.startDate ? new Date(dateRange.startDate) : null;
        const endDate = dateRange.endDate ? new Date(dateRange.endDate) : null;
        
        if (startDate) startDate.setHours(0, 0, 0, 0);
        if (endDate) endDate.setHours(23, 59, 59, 999);
        
        const candidateDateOnly = new Date(candidateDate);
        candidateDateOnly.setHours(12, 0, 0, 0);
        
        const dateInRange = (!startDate || candidateDateOnly >= startDate) &&
                          (!endDate || candidateDateOnly <= endDate);
        
        if (!dateInRange) return false;
      }

      return true; // Include candidate if all applied filters match
    });

    setFilteredCandidates(filtered);
  }, [
    nameFilter,
    experienceRange,
    locationFilter,
    ctcFilter,
    noticePeriodFilter,
    selectedHRs,
    selectedPositions,
    dateRange,
    candidates
  ]);

  const handleDateChange = (field) => (newValue) => {
    setDateRange(prev => ({
      ...prev,
      [field]: newValue
    }));
  };

  const clearDateFilter = () => {
    setDateRange({ startDate: null, endDate: null });
  };

  const handleHRChange = (event, newValue) => {
    setSelectedHRs(newValue);
  };

  const handlePositionChange = (event, newValue) => {
    setSelectedPositions(newValue);
  };

  useEffect(() => {
    fetchCandidates();
    fetchHRList();
  }, []);

  const columns = [
    {
      field: "actions",
      headerName: "View",
      width: 80,
      sortable: false,
      renderCell: (params) => (
        <IconButton 
          size="small" 
          onClick={(e) => {
            e.stopPropagation();
            handleViewClick(params.row);
          }}
          color="primary"
        >
          <ViewIcon />
        </IconButton>
      ),
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 200,
      renderCell: (params) =>
        new Date(params.value).toLocaleString("en-IN", {
          day: "2-digit",
          month: "short",
          year: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
    },
    

    { field: "createdBy", headerName: "Created By", width: 150 },
    { field: "name", headerName: "Name", width: 150 },
    { field: "phoneNumber", headerName: "Phone", width: 180 },
    { field: "positionName", headerName: "Position", width: 150 },
    { field: "experience", headerName: "Experience", width: 150 },
    { field: "currentLocation", headerName: "Current Location", width: 180 },
    { field: "currentPosition", headerName: "Current Position", width: 180 },
    { field: "currentCTC", headerName: "Current CTC", width: 150 },
    { field: "expectedCTC", headerName: "Expected CTC", width: 150 },
    { field: "noticePeriod", headerName: "Notice Period", width: 150 },
    { field: "reasonforLeaving", headerName: "Reason For Leaving", width: 200 },
    { field: "currentCompany", headerName: "Current Company", width: 180 },
    { field: "remark", headerName: "Remark", width: 150 },
    {
      field: "resumeUpload",
      headerName: "Resume",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <a href={params.value} target="_blank" rel="noopener noreferrer">
            View
          </a>
        ) : (
          "No Resume"
        ),
    },
    { field: "source", headerName: "Source", width: 150 },
  ];


//           const FilterSection = ({ title, children, onClear, showClear }) => (
//   <Box sx={{ mb: 2 }}>
//     <Box
//       sx={{
//         display: 'flex',
//         justifyContent: 'space-between',
//         alignItems: 'center',
//         mb: 0.8,
//       }}
//     >
//       <Typography fontSize="0.85rem" fontWeight={600}>
//         {title}
//       </Typography>

//       {showClear && (
//         <Button
//           size="small"
//           sx={{ fontSize: '0.7rem', minWidth: 'auto' }}
//           onClick={onClear}
//         >
//           Clear
//         </Button>
//       )}
//     </Box>

//     {children}
//   </Box>
// );


  // Open dialog with candidate details
  const FilterSection = ({
  title,
  children,
  onClear,
  showClear,
  defaultOpen = true,
}) => {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <Box sx={{ mb: 2, borderBottom: "1px solid #f1f5f9", pb: 1 }}>
      {/* Header */}
      <Box
        onClick={() => setOpen(!open)}
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          cursor: "pointer",
          mb: 1,
        }}
      >
        <Box display="flex" alignItems="center" gap={1}>
          <Typography fontSize="0.9rem" fontWeight={600}>
            {title}
          </Typography>
          {open ? (
            <ExpandLessIcon fontSize="small" />
          ) : (
            <ExpandMoreIcon fontSize="small" />
          )}
        </Box>

        {showClear && open && (
          <Button
            size="small"
            sx={{ fontSize: "0.7rem", minWidth: "auto" }}
            onClick={(e) => {
              e.stopPropagation();
              onClear();
            }}
          >
            Clear
          </Button>
        )}
      </Box>

      {open && <Box sx={{ mt: 1 }}>{children}</Box>}
    </Box>
  );
};
  
  
  const handleViewClick = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCandidate(null);
  };

  // Render candidate details dialog
  const renderCandidateDialog = () => (
    <Dialog 
      open={openDialog} 
      onClose={handleCloseDialog}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          maxWidth: '90%',
          width: '1000px',
          maxHeight: '90vh',
          height: '150vh',
          '& .MuiDialogContent-root': {
            padding: 0
          }
        }
      }}
    >
      <DialogTitle>Candidate Details</DialogTitle>
      <DialogContent dividers>
        {selectedCandidate && (
          <Box>
            {/* Candidate Details */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
                    {selectedCandidate.name?.charAt(0) || 'C'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedCandidate.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCandidate.positionName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon><WorkIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Current Position" 
                      secondary={selectedCandidate.currentPosition || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CompanyIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Current Company" 
                      secondary={selectedCandidate.currentCompany || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><LocationIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Location" 
                      secondary={selectedCandidate.currentLocation || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CurrencyRupeeIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Current CTC" 
                      secondary={selectedCandidate.currentCTC ? `${selectedCandidate.currentCTC} LPA` : 'N/A'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Experience" 
                      secondary={selectedCandidate.experience ? `${selectedCandidate.experience} years` : 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><NoticeIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Notice Period" 
                      secondary={selectedCandidate.noticePeriod || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PhoneIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Phone" 
                      secondary={selectedCandidate.phoneNumber || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CurrencyRupeeIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Expected CTC" 
                      secondary={selectedCandidate.expectedCTC ? `${selectedCandidate.expectedCTC} LPA` : 'N/A'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              {selectedCandidate.reasonforLeaving && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reason for Leaving
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedCandidate.reasonforLeaving}
                  </Typography>
                </Grid>
              )}
              
              {selectedCandidate.remark && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Remarks
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedCandidate.remark}
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            {/* Resume Section */}
            <Divider sx={{ 
              my: 4, 
              borderColor: 'divider',
              '&:before, &:after': {
                borderColor: 'primary.light',
                opacity: 0.5
              }
            }} />
            <Box sx={{ 
              p: 3, 
              backgroundColor: 'background.paper', 
              borderRadius: 2, 
              boxShadow: '0 4px 20px rgba(0,0,0,0.05)',
              border: '1px solid',
              borderColor: 'divider',
              background: 'linear-gradient(to bottom, #ffffff, #f8f9ff)',
              transition: 'all 0.3s ease-in-out',
              '&:hover': {
                boxShadow: '0 6px 24px rgba(25, 118, 210, 0.1)',
                transform: 'translateY(-2px)'
              }
            }}>
              <Box sx={{ 
                display: 'flex', 
                justifyContent: 'space-between', 
                alignItems: 'center', 
                mb: 3,
                pb: 2,
                borderBottom: '1px solid',
                borderColor: 'divider',
                position: 'relative',
                '&:after': {
                  content: '""',
                  position: 'absolute',
                  bottom: -1,
                  left: 0,
                  width: '100px',
                  height: '2px',
                  background: 'linear-gradient(90deg, #1976d2, #64b5f6)',
                  borderRadius: '2px'
                }
              }}>
                <Box>
                  <Typography 
                    variant="h6" 
                    component="h3" 
                    sx={{ 
                      fontWeight: 700, 
                      color: 'primary.dark',
                      letterSpacing: '0.5px',
                      position: 'relative',
                      display: 'inline-block',
                      '&:after': {
                        content: '""',
                        position: 'absolute',
                        bottom: -8,
                        left: 0,
                        width: '40px',
                        height: '3px',
                        background: 'linear-gradient(90deg, #1976d2, #64b5f6)',
                        borderRadius: '3px'
                      }
                    }}
                  >
                    Candidate Resume
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    Review and download the candidate's resume
                  </Typography>
                </Box>
                {selectedCandidate.resumeUpload && (
                  <Button
                    variant="contained"
                    size="medium"
                    startIcon={<ResumeIcon />}
                    component="a"
                    href={selectedCandidate.resumeUpload}
                    download
                    onClick={(e) => e.stopPropagation()}
                    sx={{
                      ml: 2,
                      textTransform: 'none',
                      fontWeight: 500,
                      borderRadius: 2,
                      px: 3,
                      py: 1,
                      boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                      '&:hover': {
                        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
                        transform: 'translateY(-1px)'
                      },
                      transition: 'all 0.2s ease-in-out'
                    }}
                    target="_blank"
                  >
                    <Box component="span" sx={{ display: 'flex', alignItems: 'center' }}>
                      <ResumeIcon sx={{ mr: 1 }} />
                      Download Resume
                    </Box>
                  </Button>
                )}
              </Box>
              {selectedCandidate.resumeUpload ? (
                <Box sx={{ 
                  width: '100%', 
                  height: 'calc(80vh - 300px)',
                  minHeight: '400px',
                  border: '1px solid #e0e0e0', 
                  borderRadius: 1, 
                  overflow: 'hidden',
                  '& iframe': {
                    width: '100%',
                    height: '100%',
                    border: 'none'
                  }
                }}>
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedCandidate.resumeUpload)}&embedded=true`}
                    width="100%" 
                    height="100%"
                    style={{ border: 'none' }}
                    title="Resume Preview"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Your browser does not support PDFs. 
                      <a href={selectedCandidate.resumeUpload} target="_blank" rel="noopener noreferrer">
                        Download the resume
                      </a>
                    </Typography>
                  </iframe>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No resume uploaded
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  // Render candidate details dialog
  const renderCandidateDetailsDialog = () => (
    <Dialog 
      open={openDialog} 
      onClose={handleCloseDialog}
      maxWidth="md"
      fullWidth
    >
      <DialogTitle>Candidate Details</DialogTitle>
      <DialogContent dividers>
        {selectedCandidate && (
          <Box>
            {/* Candidate Details */}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <Box display="flex" alignItems="center" mb={2}>
                  <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
                    {selectedCandidate.name?.charAt(0) || 'C'}
                  </Avatar>
                  <Box>
                    <Typography variant="h6">{selectedCandidate.name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {selectedCandidate.positionName}
                    </Typography>
                  </Box>
                </Box>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon><WorkIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Current Position" 
                      secondary={selectedCandidate.currentPosition || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><CompanyIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Current Company" 
                      secondary={selectedCandidate.currentCompany || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><LocationIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Location" 
                      secondary={selectedCandidate.currentLocation || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MoneyIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Current CTC" 
                      secondary={selectedCandidate.currentCTC ? `${selectedCandidate.currentCTC} LPA` : 'N/A'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <List dense>
                  <ListItem>
                    <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Experience" 
                      secondary={selectedCandidate.experience ? `${selectedCandidate.experience} years` : 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><NoticeIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Notice Period" 
                      secondary={selectedCandidate.noticePeriod || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><PhoneIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Phone" 
                      secondary={selectedCandidate.phoneNumber || 'N/A'} 
                    />
                  </ListItem>
                  <ListItem>
                    <ListItemIcon><MoneyIcon color="action" /></ListItemIcon>
                    <ListItemText 
                      primary="Expected CTC" 
                      secondary={selectedCandidate.expectedCTC ? `${selectedCandidate.expectedCTC} LPA` : 'N/A'} 
                    />
                  </ListItem>
                </List>
              </Grid>
              
              {selectedCandidate.reasonforLeaving && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Reason for Leaving
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedCandidate.reasonforLeaving}
                  </Typography>
                </Grid>
              )}
              
              {selectedCandidate.remark && (
                <Grid item xs={12}>
                  <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Remarks
                  </Typography>
                  <Typography variant="body2" paragraph>
                    {selectedCandidate.remark}
                  </Typography>
                </Grid>
              )}
            </Grid>
            
            {/* Resume Section */}
            <Divider sx={{ my: 3 }} />
            <Box sx={{ p: 3 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6">Resume</Typography>
                {selectedCandidate.resumeUpload && (
                  <Button
                    variant="contained"
                    size="small"
                    startIcon={<ResumeIcon />}
                    component="a"
                    href={selectedCandidate.resumeUpload}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(selectedCandidate.resumeUpload, '_blank', 'noopener,noreferrer');
                    }}
                    sx={{ ml: 2 }}
                  >
                    <Box component="span" sx={{ 
                      display: 'flex',
                      alignItems: 'center',
                      '&:hover svg': {
                        transform: 'translateX(2px)'
                      },
                      '& svg': {
                        transition: 'transform 0.2s ease-in-out'
                      }
                    }}>
                      <ResumeIcon sx={{ mr: 1 }} />
                      Download Resume
                    </Box>
                  </Button>
                )}
              </Box>
              {selectedCandidate.resumeUpload ? (
                <Box sx={{ 
                  width: '100%', 
                  height: 'calc(80vh - 300px)',
                  minHeight: '400px',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  overflow: 'hidden',
                  position: 'relative',
                  '&:before': {
                    content: '""',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    right: 0,
                    height: '4px',
                    background: 'linear-gradient(90deg, #1976d2, #64b5f6)',
                    zIndex: 1
                  }
                }}>
                  <iframe 
                    src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedCandidate.resumeUpload)}&embedded=true`}
                    width="100%" 
                    height="100%"
                    style={{ border: 'none' }}
                    title="Resume Preview"
                  >
                    <Typography variant="body2" color="text.secondary">
                      Your browser does not support PDFs. 
                      <a href={selectedCandidate.resumeUpload} target="_blank" rel="noopener noreferrer">
                        Download the resume
                      </a>
                    </Typography>
                  </iframe>
                </Box>
              ) : (
                <Typography variant="body2" color="text.secondary">
                  No resume uploaded
                </Typography>
              )}
            </Box>
          </Box>
        )}
      </DialogContent>
      <DialogActions>
        <Button onClick={handleCloseDialog}>Close</Button>
      </DialogActions>
    </Dialog>
  );

  return (
    <>
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
        <Navbar />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, backgroundColor: 'white', p: 2, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <IconButton 
    onClick={() => navigate(-1)} 
    size="small"
    sx={{ color: '#1e293b' }}
  >
    <ArrowBackIcon />
  </IconButton>
  <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
    Candidate Details
  </Typography>
</Box>
        </Box>




        <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
          {/* Filter Sidebar */}


  <Paper
      elevation={0}
      sx={{
        width: 320,
        borderRadius: 2,
        border: "1px solid #e5e7eb",
        backgroundColor: "#ffffff",
        position: "sticky",
        top: 16,
      }}
    >
      {/* Header */}
      <Box
        sx={{
          px: 2,
          py: 1.5,
          borderBottom: "1px solid #e5e7eb",
          display: "flex",
          justifyContent: "space-between",
          background: "#f9fafb",
        }}
      >
        <Typography fontWeight={600}>Filters</Typography>

        <Button
          size="small"
          color="error"
          onClick={() => {
            setSelectedHRs([]);
            setSelectedPositions([]);
            setDateRange({ startDate: null, endDate: null });
            setNameFilter("");
            setExperienceRange({ min: "", max: "" });
            setLocationFilter("");
            setCtcFilter("");
            setNoticePeriodFilter("");
          }}
        >
          Clear All
        </Button>
      </Box>

      <Box sx={{ p: 2 }}>

        {/* CREATED BY */}
        <FilterSection
          title="Created By"
          showClear={selectedHRs.length > 0}
          onClear={() => setSelectedHRs([])}
        >
          <Autocomplete
            multiple
            options={hrList}
            value={selectedHRs}
            getOptionLabel={(option) => `${option.name} (${option.role})`}
            onChange={(e, val) => setSelectedHRs(val)}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder="Select HR/Admin" />
            )}
            renderTags={(value, getTagProps) =>
              value.map((option, index) => (
                <Chip
                  {...getTagProps({ index })}
                  label={option.name}
                  size="small"
                />
              ))
            }
          />
        </FilterSection>

        {/* DATE RANGE */}
        <FilterSection title="Date Range">
          <LocalizationProvider dateAdapter={AdapterDateFns}>
            <Box display="flex" gap={1}>
              <DatePicker
                label="Start"
                value={dateRange.startDate}
                onChange={handleDateChange("startDate")}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
              <DatePicker
                label="End"
                value={dateRange.endDate}
                onChange={handleDateChange("endDate")}
                slotProps={{ textField: { size: "small", fullWidth: true } }}
              />
            </Box>
          </LocalizationProvider>
        </FilterSection>

        {/* NAME */}
        <FilterSection title="Candidate Name">
          <TextField
            fullWidth
            size="small"
            placeholder="Search name"
            value={nameFilter}
            onChange={(e) => setNameFilter(e.target.value)}
          />
        </FilterSection>

        {/* EXPERIENCE */}
        <FilterSection title="Experience (Years)">
          <Box display="flex" gap={1}>
            <TextField
              size="small"
              placeholder="Min"
              fullWidth
              value={experienceRange.min}
              onChange={(e) =>
                setExperienceRange({ ...experienceRange, min: e.target.value })
              }
            />
            <TextField
              size="small"
              placeholder="Max"
              fullWidth
              value={experienceRange.max}
              onChange={(e) =>
                setExperienceRange({ ...experienceRange, max: e.target.value })
              }
            />
          </Box>
        </FilterSection>

        {/* LOCATION */}
        <FilterSection title="Location">
          <TextField
            size="small"
            fullWidth
            placeholder="e.g. Mumbai"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          />
        </FilterSection>

        {/* CTC */}
        <FilterSection title="Current CTC (LPA)">
          <TextField
            size="small"
            fullWidth
            placeholder="e.g. 6.5"
            value={ctcFilter}
            onChange={(e) => setCtcFilter(e.target.value)}
          />
        </FilterSection>

        {/* NOTICE PERIOD */}
        <FilterSection title="Notice Period (Days)">
          <TextField
            size="small"
            fullWidth
            placeholder="e.g. 30"
            value={noticePeriodFilter}
            onChange={(e) => setNoticePeriodFilter(e.target.value)}
          />
        </FilterSection>

        {/* POSITION */}
        <FilterSection
          title="Position"
          showClear={selectedPositions.length > 0}
          onClear={() => setSelectedPositions([])}
        >
          <Autocomplete
            multiple
            options={positions}
            value={selectedPositions}
            onChange={(e, val) => setSelectedPositions(val)}
            renderInput={(params) => (
              <TextField {...params} size="small" placeholder="Select position" />
            )}
          />
        </FilterSection>

      </Box>
    </Paper>



          {/* Main Content */}
          <Paper
            elevation={0}
            sx={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              overflow: 'hidden',
              height: 750, // Fixed height for vertical scroll
            }}
          >
            <Box
              sx={{
                height: '100%',
                width: '100%',
                '& .MuiDataGrid-root': {
                  border: 'none',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f8fafc',
                  borderBottom: '1px solid #e2e8f0',
                },
                '& .MuiDataGrid-cell': {
                  borderBottom: '1px solid #f1f5f9',
                },
                '& .MuiDataGrid-virtualScroller': {
                  flex: '1 1 auto',
                  overflowX: 'auto',
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    height: '10px',
                    width: '10px',
                  },
                },
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 600,
                },
              }}
            >
              <DataGrid
                rows={filteredCandidates}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50, 100]}
                checkboxSelection
                disableSelectionOnClick
                loading={loading}
                components={{
                  NoRowsOverlay: () => (
                    <Box sx={{ 
                      height: '100%', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      <Typography variant="body1" color="textSecondary">
                        {loading ? 'Loading candidates...' : 'No candidates found'}
                      </Typography>
                    </Box>
                  ),
                }}
                sx={{
                  border: 'none',
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                  },
                  '& .MuiDataGrid-cell': {
                    borderBottom: '1px solid #f1f5f9',
                    padding: '8px 16px',
                    '&:focus': {
                      outline: 'none',
                    },
                  },
                  '& .MuiDataGrid-row': {
                    '&:hover': {
                      backgroundColor: 'rgba(0, 0, 0, 0.02)',
                    },
                    '&.Mui-selected': {
                      backgroundColor: 'rgba(25, 118, 210, 0.04)',
                      '&:hover': {
                        backgroundColor: 'rgba(25, 118, 210, 0.08)',
                      },
                    },
                  },
                  '& .MuiDataGrid-virtualScroller': {
                    '&::-webkit-scrollbar': {
                      height: '10px',
                      width: '10px',
                    },
                    '&::-webkit-scrollbar-track': {
                      background: '#f1f1f1',
                    },
                    '&::-webkit-scrollbar-thumb': {
                      background: '#c1c1c1',
                      borderRadius: '5px',
                      '&:hover': {
                        background: '#a8a8a8',
                      },
                    },
                  },
                  '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
                    minWidth: '120px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  },
                  '& .MuiDataGrid-columnHeader': {
                    '& .MuiDataGrid-columnHeaderTitleContainer': {
                      justifyContent: 'space-between',
                    },
                    '& .MuiDataGrid-menuIcon': {
                      visibility: 'visible',
                      width: 'auto',
                      marginRight: 0,
                    },
                    '& .MuiDataGrid-menuIconButton': {
                      opacity: 1,
                    },
                  },
                }}
              />
            </Box>
          </Paper>

          </Box>
        </Box>
      </div>
      
      {/* Candidate Details Dialog */}
      {renderCandidateDialog()}
    </>
  );
};
export default AdminCandidateList;
