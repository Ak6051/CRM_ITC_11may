// import React, { useEffect, useState } from "react";
// import { API_BASE_URL } from "../../config/api.config";
// import axios from "axios";
// import {
//   Grid,
//   Paper,
//   Typography,
//   Box,
//   TextField,
//   MenuItem,
//   Button,
//   Slider,
//   Chip,
//   FormControl,
//   Select,
//   InputAdornment,
//   IconButton,
//   Tooltip,
//   FormControlLabel,
//   Switch,
//   Checkbox,
//   FormGroup,
//   FormLabel,
//   Radio,
//   RadioGroup,
//   Divider,
//   Autocomplete,
//   LinearProgress,
//   Collapse,
//   Dialog,
//   DialogTitle,
//   DialogContent,
//   DialogActions,
//   Avatar,
//   List,
//   ListItem,
//   ListItemText,
//   ListItemIcon,
//   ListItemAvatar
// } from "@mui/material";
// import { 
//   Visibility as ViewIcon, 
//   Work as WorkIcon, 
//   LocationOn as LocationIcon, 
//   AttachMoney as MoneyIcon, 
//   AccessTime as NoticeIcon, 
//   Business as CompanyIcon, 
//   Person as PersonIcon, 
//   Phone as PhoneIcon, 
//   Email as EmailIcon, 
//   Description as ResumeIcon,
//   FilterList, 
//   Clear, 
//   ExpandLess, 
//   ExpandMore, 

// } from '@mui/icons-material';
// import { DataGrid } from "@mui/x-data-grid";
// import Navbar from '../../components/hr components/HrNavbar';
// import ClearIcon from '@mui/icons-material/Clear';
// import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

// const mainContentStyle = {
//   padding: '16px',
//   width: '100%',
//   backgroundColor: '#f8fafc',
// };

// const AdminCandidateList = () => {
//   const [candidates, setCandidates] = useState([]);
//   const [filteredCandidates, setFilteredCandidates] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [filters, setFilters] = useState({
//     positionName: '',
//     experience: [0, 30],
//     currentLocation: '',
//     ctcRange: [0, 50],
//     noticePeriod: '',
//     dateRange: [null, null]
//   });
//   const [filterOpen, setFilterOpen] = useState(false);
//   const [locations, setLocations] = useState([]);
//   const [positions, setPositions] = useState([]);
//   const [noticePeriods] = useState([
//     'Immediate',
//     '15 days',
//     '1 month',
//     '2 months',
//     '3 months',
//     '3 months+'
//   ]);
  
//   // State for view dialog
//   const [openDialog, setOpenDialog] = useState(false);
//   const [selectedCandidate, setSelectedCandidate] = useState(null);

//   const fetchCandidates = async () => {
//     try {
//       setLoading(true);
//       const token = sessionStorage.getItem("token");
//       const response = await axios.get(`${API_BASE_URL}/candidate/hr-candidates`, {
//         headers: {
//           Authorization: `Bearer ${token}`,
//         },
//       });

//       // Format the data and ensure each row has a unique ID
//       const formattedData = response.data.map((candidate, index) => ({
//         ...candidate,
//         // Use _id if available, otherwise create a unique ID using timestamp and index
//         id: candidate._id || `row-${Date.now()}-${index}`,
//       }));

//       setCandidates(formattedData);
//       setFilteredCandidates(formattedData);

//       const uniqueLocations = [...new Set(formattedData.map(c => c.currentLocation).filter(Boolean))];
//       const uniquePositions = [...new Set(formattedData.map(c => c.positionName).filter(Boolean))];

//       // Set unique creators from our processed data
//       setLocations(uniqueLocations);
//       setPositions(uniquePositions);
//     } catch (error) {
//       console.error("Error fetching candidates:", error);
//     } finally {
//       setLoading(false);
//     }
//   };

//   useEffect(() => {
//     fetchCandidates();
//   }, []);

//   const columns = [
//     {
//       field: "actions",
//       headerName: "View",
//       width: 80,
//       sortable: false,
//       filterable: false,
//       renderCell: (params) => (
//         <IconButton 
//           size="small" 
//           onClick={(e) => {
//             e.stopPropagation();
//             handleViewClick(params.row);
//           }}
//           color="primary"
//         >
//           <ViewIcon />
//         </IconButton>
//       ),
//     },
//     {
//       field: "createdAt",
//       headerName: "Created At",
//       width: 200,
//       renderCell: (params) =>
//         new Date(params.value).toLocaleString("en-IN", {
//           day: "2-digit",
//           month: "short",
//           year: "numeric",
//           hour: "2-digit",
//           minute: "2-digit",
//           second: "2-digit",
//         }),
//     },
    

//     { field: "createdBy", headerName: "Created By", width: 150 },
//     { field: "name", headerName: "Name", width: 150 },
//     { field: "phoneNumber", headerName: "Phone", width: 180 },
//     { field: "positionName", headerName: "Position", width: 150 },
//     { field: "experience", headerName: "Experience", width: 150 },
//     { field: "currentLocation", headerName: "Current Location", width: 150 },
//     { field: "currentPosition", headerName: "Current Position", width: 150 },
//     { field: "currentCTC", headerName: "Current CTC", width: 150 },
//     { field: "expectedCTC", headerName: "Expected CTC", width: 150 },
//     { field: "noticePeriod", headerName: "Notice Period", width: 150 },
//     { field: "reasonforLeaving", headerName: "Reason For Leaving", width: 150 },
//     { field: "currentCompany", headerName: "Current Company", width: 150 },
//     { field: "remark", headerName: "Remark", width: 150 },
//     {
//       field: "resumeUpload",
//       headerName: "Resume",
//       width: 150,
//       renderCell: (params) =>
//         params.value ? (
//           <a href={params.value} target="_blank" rel="noopener noreferrer">
//             View
//           </a>
//         ) : (
//           "No Resume"
//         ),
//     },
//     { field: "source", headerName: "Source", width: 150 },
//   ];


//   // Open dialog with candidate details
//   const handleViewClick = (candidate) => {
//     setSelectedCandidate(candidate);
//     setOpenDialog(true);
//   };

//   // Close dialog
//   const handleCloseDialog = () => {
//     setOpenDialog(false);
//     setSelectedCandidate(null);
//   };

//   const handleFilterChange = (filterName, value) => {
//     const newFilters = { ...filters, [filterName]: value };
//     setFilters(newFilters);
    
//     // Filter candidates based on the new filters
//     const filtered = candidates.filter(candidate => {
//       // Position filter
//       if (newFilters.positionName && candidate.positionName !== newFilters.positionName) {
//         return false;
//       }
      
//       // Experience filter
//       const [minExp, maxExp] = newFilters.experience || [0, 30];
//       if (candidate.experience < minExp || candidate.experience > maxExp) {
//         return false;
//       }
      
//       // Location filter
//       if (newFilters.currentLocation && candidate.currentLocation !== newFilters.currentLocation) {
//         return false;
//       }
      
//       // CTC Range filter
//       const [minCTC, maxCTC] = newFilters.ctcRange || [0, 50];
//       if (candidate.currentCTC < minCTC || candidate.currentCTC > maxCTC) {
//         return false;
//       }
      
//       // Notice Period filter
//       if (newFilters.noticePeriod && candidate.noticePeriod !== newFilters.noticePeriod) {
//         return false;
//       }
      
//       // Date Range filter
//       if (newFilters.dateRange[0] || newFilters.dateRange[1]) {
//         const candidateDate = new Date(candidate.createdAt);
//         const startDate = newFilters.dateRange[0] ? new Date(newFilters.dateRange[0]) : null;
//         const endDate = newFilters.dateRange[1] ? new Date(newFilters.dateRange[1]) : null;
        
//         if (startDate && candidateDate < startDate) return false;
//         if (endDate && candidateDate > endDate) return false;
//       }
      
//       return true;
//     });
    
//     setFilteredCandidates(filtered);
//   };

//   // Reset all filters to their default values
//   const resetFilters = () => {
//     setFilters({
//       positionName: '',
//       experience: [0, 30],
//       currentLocation: '',
//       ctcRange: [0, 50],
//       noticePeriod: '',
//       dateRange: [null, null]
//     });
//     setFilteredCandidates(candidates);
//   };

//   const applyFilters = () => {
//     let filtered = [...candidates];

//     if (filters.positionName) {
//       filtered = filtered.filter(candidate => 
//         candidate.positionName?.toLowerCase().includes(filters.positionName.toLowerCase())
//       );
//     }

//     if (filters.currentLocation) {
//       filtered = filtered.filter(candidate => 
//         candidate.currentLocation?.toLowerCase().includes(filters.currentLocation.toLowerCase())
//       );
//     }

//     if (filters.noticePeriod) {
//       filtered = filtered.filter(candidate => 
//         candidate.noticePeriod?.toLowerCase().includes(filters.noticePeriod.toLowerCase())
//       );
//     }

//     // Date Range filter
//     if (filters.dateRange[0] && filters.dateRange[1]) {
//       const startDate = new Date(filters.dateRange[0]);
//       const endDate = new Date(filters.dateRange[1]);
//       endDate.setHours(23, 59, 59, 999); // End of the day
      
//       filtered = filtered.filter(candidate => {
//         const candidateDate = new Date(candidate.createdAt);
//         return candidateDate >= startDate && candidateDate <= endDate;
//       });
//     }

//     // Experience filter
//     filtered = filtered.filter(candidate => 
//       candidate.experience >= filters.experience[0] && 
//       candidate.experience <= filters.experience[1]
//     );

//     // CTC filter
//     filtered = filtered.filter(candidate => 
//       candidate.currentCTC >= filters.ctcRange[0] && 
//       candidate.currentCTC <= filters.ctcRange[1]
//     );

//     setFilteredCandidates(filtered);
//   };

//   // handleFilterChange is defined above with more comprehensive functionality

//   const clearFilters = () => {
//     setFilters({
//       positionName: '',
//       experience: [0, 30],
//       currentLocation: '',
//       ctcRange: [0, 50],
//       noticePeriod: '',
//       dateRange: [null, null]
//     });
//     setFilteredCandidates(candidates);
//   };

//   // Function to count candidates by position
//   const countByPosition = (position) => {
//     if (!position) return candidates.length;
//     return candidates.filter(c => c.positionName === position).length;
//   };

//   // Function to count candidates by location
//   const countByLocation = (location) => {
//     if (!location) return candidates.length;
//     return candidates.filter(c => c.currentLocation === location).length;
//   };

//   // Function to count candidates by notice period
//   const countByNoticePeriod = (noticePeriod) => {
//     if (!noticePeriod) return candidates.length;
//     return candidates.filter(c => c.noticePeriod === noticePeriod).length;
//   };

//   const renderFilters = () => (
//     <Box sx={{ '& > *:not(:last-child)': { mb: 3 } }}>
//       {/* Position Filter */}
//       <Box>
//         <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
//           Position
//         </Typography>
//         <Autocomplete
//           options={Array.from(new Set(positions))}
//           value={filters.positionName || null}
//           onChange={(_, newValue) => handleFilterChange('positionName', newValue || '')}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               variant="outlined"
//               size="small"
//               placeholder="Search positions..."
//               sx={{
//                 '& .MuiOutlinedInput-root': {
//                   padding: '0 12px',
//                 },
//               }}
//             />
//           )}
//           renderOption={(props, option) => (
//             <Box component="li" {...props}>
//               {option}
//             </Box>
//           )}
//           clearIcon={
//             <IconButton size="small" onClick={() => handleFilterChange('positionName', '')}>
//               <Clear fontSize="small" />
//             </IconButton>
//           }
//           sx={{
//             '& .MuiAutocomplete-endAdornment': {
//               right: '8px',
//               top: 'calc(50% - 12px)'
//             },
//             '& .MuiAutocomplete-clearIndicator': {
//               padding: '4px',
//               marginRight: '-4px'
//             }
//           }}
//         />
//       </Box>

//       {/* Experience Filter */}
//       <Box>
//         <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary">
//           Experience (Years)
//         </Typography>
//         <Box display="flex" alignItems="center" gap={2} mb={2}>
//           <TextField
//             size="small"
//             type="number"
//             value={filters.experience[0]}
//             onChange={(e) => {
//               const value = Math.min(Number(e.target.value), filters.experience[1] - 0.5);
//               handleFilterChange('experience', [value, filters.experience[1]]);
//             }}
//             inputProps={{
//               min: 0,
//               max: 29.5,
//               step: 0.5,
//               style: { textAlign: 'center' }
//             }}
//             sx={{
//               width: '80px',
//               '& .MuiOutlinedInput-root': {
//                 '& input': {
//                   padding: '8px',
//                   textAlign: 'center'
//                 }
//               }
//             }}
//           />
//           <Box flex={1}>
//             <Slider
//               value={filters.experience}
//               onChange={(_, newValue) => handleFilterChange('experience', newValue)}
//               min={0}
//               max={30}
//               step={0.5}
//               valueLabelDisplay="auto"
//               valueLabelFormat={(value) => `${value} yrs`}
//               sx={{
//                 color: 'primary.main',
//                 '& .MuiSlider-thumb': {
//                   width: 16,
//                   height: 16,
//                   '&:hover, &.Mui-focusVisible': {
//                     boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
//                   },
//                 },
//                 '& .MuiSlider-valueLabel': {
//                   backgroundColor: 'primary.main',
//                   borderRadius: '4px',
//                   padding: '2px 6px',
//                   '&:before': {
//                     display: 'none',
//                   },
//                 },
//               }}
//             />
//           </Box>
//           <TextField
//             size="small"
//             type="number"
//             value={filters.experience[1]}
//             onChange={(e) => {
//               const value = Math.max(Number(e.target.value), filters.experience[0] + 0.5);
//               handleFilterChange('experience', [filters.experience[0], Math.min(value, 30)]);
//             }}
//             inputProps={{
//               min: 0.5,
//               max: 30,
//               step: 0.5,
//               style: { textAlign: 'center' }
//             }}
//             sx={{
//               width: '80px',
//               '& .MuiOutlinedInput-root': {
//                 '& input': {
//                   padding: '8px',
//                   textAlign: 'center'
//                 }
//               }
//             }}
//           />
//         </Box>
//       </Box>

//       {/* Location Filter */}
//       <Box>
//         <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
//           Location
//         </Typography>
//         <Autocomplete
//           options={Array.from(new Set(locations))}
//           value={filters.currentLocation || null}
//           onChange={(_, newValue) => handleFilterChange('currentLocation', newValue || '')}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               variant="outlined"
//               size="small"
//               placeholder="Search locations..."
//               sx={{
//                 '& .MuiOutlinedInput-root': {
//                   padding: '0 12px',
//                 },
//               }}
//             />
//           )}
//           renderOption={(props, option) => (
//             <Box component="li" {...props}>
//               {option}
//             </Box>
//           )}
//           clearIcon={
//             <IconButton size="small" onClick={() => handleFilterChange('currentLocation', '')}>
//               <Clear fontSize="small" />
//             </IconButton>
//           }
//           sx={{
//             '& .MuiAutocomplete-endAdornment': {
//               right: '8px',
//               top: 'calc(50% - 12px)'
//             },
//             '& .MuiAutocomplete-clearIndicator': {
//               padding: '4px',
//               marginRight: '-4px'
//             }
//           }}
//         />
//       </Box>

//       {/* CTC Range Filter */}
//       <Box>
//         <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary">
//           CTC Range (LPA)
//         </Typography>
//         <Box display="flex" alignItems="center" gap={2} mb={2}>
//           <TextField
//             size="small"
//             type="number"
//             value={filters.ctcRange[0]}
//             onChange={(e) => {
//               const value = Math.min(Number(e.target.value), filters.ctcRange[1] - 1);
//               handleFilterChange('ctcRange', [value, filters.ctcRange[1]]);
//             }}
//             inputProps={{
//               min: 0,
//               max: 49,
//               step: 1,
//               style: { textAlign: 'center' }
//             }}
//             sx={{
//               width: '80px',
//               '& .MuiOutlinedInput-root': {
//                 '& input': {
//                   padding: '8px',
//                   textAlign: 'center'
//                 }
//               }
//             }}
//           />
//           <Box flex={1}>
//             <Slider
//               value={filters.ctcRange}
//               onChange={(_, newValue) => handleFilterChange('ctcRange', newValue)}
//               min={0}
//               max={50}
//               step={1}
//               valueLabelDisplay="auto"
//               valueLabelFormat={(value) => `${value} LPA`}
//               sx={{
//                 color: 'primary.main',
//                 '& .MuiSlider-thumb': {
//                   width: 16,
//                   height: 16,
//                   '&:hover, &.Mui-focusVisible': {
//                     boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
//                   },
//                 },
//                 '& .MuiSlider-valueLabel': {
//                   backgroundColor: 'primary.main',
//                   borderRadius: '4px',
//                   padding: '2px 6px',
//                   '&:before': {
//                     display: 'none',
//                   },
//                 },
//               }}
//             />
//           </Box>
//           <TextField
//             size="small"
//             type="number"
//             value={filters.ctcRange[1]}
//             onChange={(e) => {
//               const value = Math.max(Number(e.target.value), filters.ctcRange[0] + 1);
//               handleFilterChange('ctcRange', [filters.ctcRange[0], Math.min(value, 50)]);
//             }}
//             inputProps={{
//               min: 1,
//               max: 50,
//               step: 1,
//               style: { textAlign: 'center' }
//             }}
//             sx={{
//               width: '80px',
//               '& .MuiOutlinedInput-root': {
//                 '& input': {
//                   padding: '8px',
//                   textAlign: 'center'
//                 }
//               }
//             }}
//           />
//         </Box>
//       </Box>

//       {/* Notice Period Filter */}
//       <Box>
//         <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
//           Notice Period
//         </Typography>
//         <Autocomplete
//           options={Array.from(new Set(noticePeriods))}
//           value={filters.noticePeriod || null}
//           onChange={(_, newValue) => handleFilterChange('noticePeriod', newValue || '')}
//           renderInput={(params) => (
//             <TextField
//               {...params}
//               variant="outlined"
//               size="small"
//               placeholder="Search notice periods..."
//               sx={{
//                 '& .MuiOutlinedInput-root': {
//                   padding: '0 12px',
//                 },
//               }}
//             />
//           )}
//           renderOption={(props, option) => (
//             <Box component="li" {...props}>
//               {option}
//             </Box>
//           )}
//           clearIcon={
//             <IconButton size="small" onClick={() => handleFilterChange('noticePeriod', '')}>
//               <Clear fontSize="small" />
//             </IconButton>
//           }
//           sx={{
//             '& .MuiAutocomplete-endAdornment': {
//               right: '8px',
//               top: 'calc(50% - 12px)'
//             },
//             '& .MuiAutocomplete-clearIndicator': {
//               padding: '4px',
//               marginRight: '-4px'
//             }
//           }}
//         />
//       </Box>

//       {/* Date Range Filter */}
//       <Box>
//         <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
//           Date Range
//         </Typography>
//         <Box mb={2}>
//           <TextField
//             label="Start Date"
//             type="date"
//             value={filters.dateRange[0] || ''}
//             onChange={(e) => handleFilterChange('dateRange', [e.target.value, filters.dateRange[1]])}
//             fullWidth
//             size="small"
//             InputLabelProps={{
//               shrink: true,
//             }}
//           />
//         </Box>
//         <Box>
//           <TextField
//             label="End Date"
//             type="date"
//             value={filters.dateRange[1] || ''}
//             onChange={(e) => handleFilterChange('dateRange', [filters.dateRange[0], e.target.value])}
//             fullWidth
//             size="small"
//             InputLabelProps={{
//               shrink: true,
//             }}
//           />
//         </Box>
//       </Box>

//       {/* Clear Filters Button */}
//       <Box mt={3}>
//         <Button
//           variant="outlined"
//           onClick={resetFilters}
//           fullWidth
//           startIcon={<ClearIcon />}
//           sx={{
//             textTransform: 'none',
//             fontWeight: 500,
//             color: 'text.secondary',
//             borderColor: 'divider',
//             '&:hover': {
//               borderColor: 'primary.main',
//               color: 'primary.main',
//             },
//           }}
//         >
//           Clear All Filters
//         </Button>
//       </Box>
      
//       {/* Candidate Details Dialog */}
//       {renderCandidateDialog()}
//     </Box>
//   );

//   // Render candidate details dialog
//   const renderCandidateDialog = () => (
//     <Dialog 
//       open={openDialog} 
//       onClose={handleCloseDialog}
//       maxWidth="lg"
//       fullWidth
//       PaperProps={{
//         sx: {
//           maxWidth: '90%',
//           width: '1000px',
//           maxHeight: '90vh',
//           height: '150vh',
//           '& .MuiDialogContent-root': {
//             padding: 0
//           }
//         }
//       }}
//     >
//       <DialogTitle>Candidate Details</DialogTitle>
//       <DialogContent dividers>
//         {selectedCandidate && (
//           <Box>
//             {/* Candidate Details */}
//             <Grid container spacing={2}>
//               <Grid item xs={12}>
//                 <Box display="flex" alignItems="center" mb={2}>
//                   <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
//                     {selectedCandidate.name?.charAt(0) || 'C'}
//                   </Avatar>
//                   <Box>
//                     <Typography variant="h6">{selectedCandidate.name}</Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       {selectedCandidate.positionName}
//                     </Typography>
//                   </Box>
//                 </Box>
//               </Grid>
              
//               <Grid item xs={12} md={6}>
//                 <List dense>
//                   <ListItem>
//                     <ListItemIcon><WorkIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Current Position" 
//                       secondary={selectedCandidate.currentPosition || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><CompanyIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Current Company" 
//                       secondary={selectedCandidate.currentCompany || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><LocationIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Location" 
//                       secondary={selectedCandidate.currentLocation || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><CurrencyRupeeIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Current CTC" 
//                       secondary={selectedCandidate.currentCTC ? `${selectedCandidate.currentCTC} LPA` : 'N/A'} 
//                     />
//                   </ListItem>
//                 </List>
//               </Grid>
              
//               <Grid item xs={12} md={6}>
//                 <List dense>
//                   <ListItem>
//                     <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Experience" 
//                       secondary={selectedCandidate.experience ? `${selectedCandidate.experience} years` : 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><NoticeIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Notice Period" 
//                       secondary={selectedCandidate.noticePeriod || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><PhoneIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Phone" 
//                       secondary={selectedCandidate.phoneNumber || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><CurrencyRupeeIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Expected CTC" 
//                       secondary={selectedCandidate.expectedCTC ? `${selectedCandidate.expectedCTC} LPA` : 'N/A'} 
//                     />
//                   </ListItem>
//                 </List>
//               </Grid>
              
//               {selectedCandidate.reasonforLeaving && (
//                 <Grid item xs={12}>
//                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                     Reason for Leaving
//                   </Typography>
//                   <Typography variant="body2" paragraph>
//                     {selectedCandidate.reasonforLeaving}
//                   </Typography>
//                 </Grid>
//               )}
              
//               {selectedCandidate.remark && (
//                 <Grid item xs={12}>
//                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                     Remarks
//                   </Typography>
//                   <Typography variant="body2" paragraph>
//                     {selectedCandidate.remark}
//                   </Typography>
//                 </Grid>
//               )}
//             </Grid>
            
//             {/* Resume Section */}
//             <Divider sx={{ my: 3 }} />
//             <Box sx={{ p: 3 }}>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                 <Typography variant="h6">Resume</Typography>
//                 {selectedCandidate.resumeUpload && (
//                   <Button
//                     variant="contained"
//                     size="small"
//                     startIcon={<ResumeIcon />}
//                     component="a"
//                     href={selectedCandidate.resumeUpload}
//                     download
//                     onClick={(e) => e.stopPropagation()}
//                     sx={{ ml: 2 }}
//                     target="_blank"
//                   >
//                     Download Resume
//                   </Button>
//                 )}
//               </Box>
//               {selectedCandidate.resumeUpload ? (
//                 <Box sx={{ 
//                   width: '100%', 
//                   height: 'calc(80vh - 300px)',
//                   minHeight: '400px',
//                   border: '1px solid #e0e0e0', 
//                   borderRadius: 1, 
//                   overflow: 'hidden',
//                   '& iframe': {
//                     width: '100%',
//                     height: '100%',
//                     border: 'none'
//                   }
//                 }}>
//                   <iframe 
//                     src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedCandidate.resumeUpload)}&embedded=true`}
//                     width="100%" 
//                     height="100%"
//                     style={{ border: 'none' }}
//                     title="Resume Preview"
//                   >
//                     <Typography variant="body2" color="text.secondary">
//                       Your browser does not support PDFs. 
//                       <a href={selectedCandidate.resumeUpload} target="_blank" rel="noopener noreferrer">
//                         Download the resume
//                       </a>
//                     </Typography>
//                   </iframe>
//                 </Box>
//               ) : (
//                 <Typography variant="body2" color="text.secondary">
//                   No resume uploaded
//                 </Typography>
//               )}
//             </Box>
//           </Box>
//         )}
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={handleCloseDialog}>Close</Button>
//       </DialogActions>
//     </Dialog>
//   );

//   // Render candidate details dialog
//   const renderCandidateDetailsDialog = () => (
//     <Dialog 
//       open={openDialog} 
//       onClose={handleCloseDialog}
//       maxWidth="md"
//       fullWidth
//     >
//       <DialogTitle>Candidate Details</DialogTitle>
//       <DialogContent dividers>
//         {selectedCandidate && (
//           <Box>
//             {/* Candidate Details */}
//             <Grid container spacing={2}>
//               <Grid item xs={12}>
//                 <Box display="flex" alignItems="center" mb={2}>
//                   <Avatar sx={{ width: 60, height: 60, mr: 2, bgcolor: 'primary.main' }}>
//                     {selectedCandidate.name?.charAt(0) || 'C'}
//                   </Avatar>
//                   <Box>
//                     <Typography variant="h6">{selectedCandidate.name}</Typography>
//                     <Typography variant="body2" color="text.secondary">
//                       {selectedCandidate.positionName}
//                     </Typography>
//                   </Box>
//                 </Box>
//               </Grid>
              
//               <Grid item xs={12} md={6}>
//                 <List dense>
//                   <ListItem>
//                     <ListItemIcon><WorkIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Current Position" 
//                       secondary={selectedCandidate.currentPosition || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><CompanyIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Current Company" 
//                       secondary={selectedCandidate.currentCompany || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><LocationIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Location" 
//                       secondary={selectedCandidate.currentLocation || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><MoneyIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Current CTC" 
//                       secondary={selectedCandidate.currentCTC ? `${selectedCandidate.currentCTC} LPA` : 'N/A'} 
//                     />
//                   </ListItem>
//                 </List>
//               </Grid>
              
//               <Grid item xs={12} md={6}>
//                 <List dense>
//                   <ListItem>
//                     <ListItemIcon><PersonIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Experience" 
//                       secondary={selectedCandidate.experience ? `${selectedCandidate.experience} years` : 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><NoticeIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Notice Period" 
//                       secondary={selectedCandidate.noticePeriod || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><PhoneIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Phone" 
//                       secondary={selectedCandidate.phoneNumber || 'N/A'} 
//                     />
//                   </ListItem>
//                   <ListItem>
//                     <ListItemIcon><MoneyIcon color="action" /></ListItemIcon>
//                     <ListItemText 
//                       primary="Expected CTC" 
//                       secondary={selectedCandidate.expectedCTC ? `${selectedCandidate.expectedCTC} LPA` : 'N/A'} 
//                     />
//                   </ListItem>
//                 </List>
//               </Grid>
              
//               {selectedCandidate.reasonforLeaving && (
//                 <Grid item xs={12}>
//                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                     Reason for Leaving
//                   </Typography>
//                   <Typography variant="body2" paragraph>
//                     {selectedCandidate.reasonforLeaving}
//                   </Typography>
//                 </Grid>
//               )}
              
//               {selectedCandidate.remark && (
//                 <Grid item xs={12}>
//                   <Typography variant="subtitle2" color="text.secondary" gutterBottom>
//                     Remarks
//                   </Typography>
//                   <Typography variant="body2" paragraph>
//                     {selectedCandidate.remark}
//                   </Typography>
//                 </Grid>
//               )}
//             </Grid>
            
//             {/* Resume Section */}
//             <Divider sx={{ my: 3 }} />
//             <Box sx={{ p: 3 }}>
//               <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
//                 <Typography variant="h6">Resume</Typography>
//                 {selectedCandidate.resumeUpload && (
//                   <Button
//                     variant="contained"
//                     size="small"
//                     startIcon={<ResumeIcon />}
//                     component="a"
//                     href={selectedCandidate.resumeUpload}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     onClick={(e) => {
//                       e.stopPropagation();
//                       window.open(selectedCandidate.resumeUpload, '_blank', 'noopener,noreferrer');
//                     }}
//                     sx={{ ml: 2 }}
//                   >
//                     View Resume
//                   </Button>
//                 )}
//               </Box>
//               {selectedCandidate.resumeUpload ? (
//                 <Box sx={{ 
//                   width: '100%', 
//                   height: 'calc(80vh - 300px)',
//                   minHeight: '400px',
//                   border: '1px solid #e0e0e0', 
//                   borderRadius: 1, 
//                   overflow: 'hidden',
//                   '& iframe': {
//                     width: '100%',
//                     height: '100%',
//                     border: 'none'
//                   }
//                 }}>
//                   <iframe 
//                     src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedCandidate.resumeUpload)}&embedded=true`}
//                     width="100%" 
//                     height="100%"
//                     style={{ border: 'none' }}
//                     title="Resume Preview"
//                   >
//                     <Typography variant="body2" color="text.secondary">
//                       Your browser does not support PDFs. 
//                       <a href={selectedCandidate.resumeUpload} target="_blank" rel="noopener noreferrer">
//                         Download the resume
//                       </a>
//                     </Typography>
//                   </iframe>
//                 </Box>
//               ) : (
//                 <Typography variant="body2" color="text.secondary">
//                   No resume uploaded
//                 </Typography>
//               )}
//             </Box>
//           </Box>
//         )}
//       </DialogContent>
//       <DialogActions>
//         <Button onClick={handleCloseDialog}>Close</Button>
//       </DialogActions>
//     </Dialog>
//   );

//   return (
//     <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
//       <Navbar />
      
//       <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', p: 2 }}>
//         <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, backgroundColor: 'white', p: 2, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
//           <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
//             Candidate Details
//           </Typography>
//           <Chip 
//             label={`${filteredCandidates.length} candidates found`} 
//             size="small" 
//             sx={{ 
//               backgroundColor: '#f1f5f9', 
//               color: '#475569',
//               fontWeight: 500
//             }} 
//           />
//         </Box>

//         <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
//           {/* Left Sidebar - Filters */}
//           <Paper 
//             elevation={0} 
//             sx={{ 
//               width: '280px', 
//               p: 2, 
//               borderRadius: '8px',
//               border: '1px solid #e2e8f0',
//               backgroundColor: 'white',
//               height: 'fit-content',
//               position: 'sticky',
//               top: '16px',
//               maxHeight: 'calc(100vh - 120px)',
//               overflowY: 'auto',
//               '&::-webkit-scrollbar': {
//                 width: '6px',
//               },
//               '&::-webkit-scrollbar-track': {
//                 background: '#f1f1f1',
//                 borderRadius: '3px',
//               },
//               '&::-webkit-scrollbar-thumb': {
//                 background: '#c1c1c1',
//                 borderRadius: '3px',
//                 '&:hover': {
//                   background: '#a8a8a8',
//                 },
//               },
//             }}
//           >
//             <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
//               <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
//                 Filters
//               </Typography>
//               <Button 
//                 onClick={clearFilters} 
//                 size="small" 
//                 sx={{ textTransform: 'none', color: '#3b82f6', fontSize: '0.8rem' }}
//               >
//                 Clear All
//               </Button>
//             </Box>
//             <Box sx={{ pr: 1 }}>
//               {renderFilters()}
//             </Box>
//           </Paper>

//           {/* Main Content */}
//           <Paper
//             elevation={0}
//             sx={{
//               flex: 1,
//               display: 'flex',
//               flexDirection: 'column',
//               borderRadius: '8px',
//               border: '1px solid #e2e8f0',
//               backgroundColor: 'white',
//               overflow: 'hidden',
//               height: 750, // Fixed height for vertical scroll
//             }}
//           >
//             <Box
//               sx={{
//                 height: '100%',
//                 width: '100%',
//                 '& .MuiDataGrid-root': {
//                   border: 'none',
//                 },
//                 '& .MuiDataGrid-columnHeaders': {
//                   backgroundColor: '#f8fafc',
//                   borderBottom: '1px solid #e2e8f0',
//                 },
//                 '& .MuiDataGrid-cell': {
//                   borderBottom: '1px solid #f1f5f9',
//                 },
//                 '& .MuiDataGrid-virtualScroller': {
//                   flex: '1 1 auto',
//                   overflowX: 'auto', // horizontal scroll
//                   overflowY: 'auto', // vertical scroll
//                   '&::-webkit-scrollbar': {
//                     height: '10px',
//                     width: '10px',
//                   },
//                   '&::-webkit-scrollbar-track': {
//                     background: '#f1f1f1',
//                   },
//                   '&::-webkit-scrollbar-thumb': {
//                     background: '#c1c1c1',
//                     borderRadius: '5px',
//                     '&:hover': {
//                       background: '#a8a8a8',
//                     },
//                   },
//                 },
//               }}
//             >
//               <DataGrid
//                 rows={filteredCandidates}
//                 columns={columns}
//                 pageSize={10}
//                 rowsPerPageOptions={[10, 25, 50]}
//                 checkboxSelection
//                 disableSelectionOnClick
//                 getRowId={(row) => row.id}
//                 loading={loading}
//                 components={{
//                   LoadingOverlay: LinearProgress,
//                   NoRowsOverlay: () => (
//                     <Box sx={{ 
//                       display: 'flex', 
//                       height: '100%', 
//                       alignItems: 'center', 
//                       justifyContent: 'center',
//                       flexDirection: 'column',
//                       gap: 1
//                     }}>
//                       <Typography variant="body1" color="textSecondary">
//                         {loading ? 'Loading candidates...' : 'No candidates found'}
//                       </Typography>
//                       {!loading && (
//                         <Button 
//                           variant="outlined" 
//                           size="small" 
//                           onClick={resetFilters}
//                           sx={{ mt: 1 }}
//                         >
//                           Clear Filters
//                         </Button>
//                       )}
//                     </Box>
//                   ),
//                 }}
//                 sx={{
//                   '& .MuiDataGrid-columnHeaders': {
//                     backgroundColor: '#f8fafc',
//                     borderBottom: '1px solid #e2e8f0',
//                     '& .MuiDataGrid-columnHeaderTitle': {
//                       fontWeight: 600,
//                     },
//                   },
//                   '& .MuiDataGrid-cell': {
//                     borderBottom: '1px solid #f1f5f9',
//                     padding: '8px 16px',
//                     '&:focus': {
//                       outline: 'none',
//                     },
//                   },
//                   '& .MuiDataGrid-row': {
//                     '&:hover': {
//                       backgroundColor: 'rgba(0, 0, 0, 0.02)',
//                     },
//                     '&.Mui-selected': {
//                       backgroundColor: 'rgba(25, 118, 210, 0.04)',
//                       '&:hover': {
//                         backgroundColor: 'rgba(25, 118, 210, 0.08)',
//                       },
//                     },
//                   },
//                   '& .MuiDataGrid-virtualScroller': {
//                     '&::-webkit-scrollbar': {
//                       height: '10px',
//                       width: '10px',
//                     },
//                     '&::-webkit-scrollbar-track': {
//                       background: '#f1f1f1',
//                     },
//                     '&::-webkit-scrollbar-thumb': {
//                       background: '#c1c1c1',
//                       borderRadius: '5px',
//                       '&:hover': {
//                         background: '#a8a8a8',
//                       },
//                     },
//                   },
//                   '& .MuiDataGrid-columnHeader, & .MuiDataGrid-cell': {
//                     minWidth: '120px',
//                     whiteSpace: 'nowrap',
//                     overflow: 'hidden',
//                     textOverflow: 'ellipsis',
//                   },
//                   '& .MuiDataGrid-columnHeader': {
//                     '& .MuiDataGrid-columnHeaderTitleContainer': {
//                       justifyContent: 'space-between',
//                     },
//                     '& .MuiDataGrid-menuIcon': {
//                       visibility: 'visible',
//                       width: 'auto',
//                       marginRight: 0,
//                     },
//                     '& .MuiDataGrid-menuIconButton': {
//                       opacity: 1,
//                     },
//                   },
//                 }}
//               />
//             </Box>
//           </Paper>

//           </Box>
//         </Box>
//       </div>
    
//   );
// };

// export default AdminCandidateList;
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
  ListItemAvatar
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
  Description as ResumeIcon,
  FilterList, 
  Clear, 
  ExpandLess, 
  ExpandMore, 

} from '@mui/icons-material';
import { DataGrid } from "@mui/x-data-grid";
import Navbar from '../../components/hr components/HrNavbar';
import ClearIcon from '@mui/icons-material/Clear';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';

const mainContentStyle = {
  padding: '16px',
  width: '100%',
  backgroundColor: '#f8fafc',
};

const HRCandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [filteredCandidates, setFilteredCandidates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    positionName: [],
    experience: [0, 30],
    currentLocation: [],
    ctcRange: [0, 50],
    noticePeriod: '',
    dateRange: [null, null],
    createdBy: [],
    name: ''
  });

  // Unique creator list with type
  const [creators, setCreators] = useState([]);

  const [filterOpen, setFilterOpen] = useState(false);
  const [locations, setLocations] = useState([]);
  const [positions, setPositions] = useState([]);
  const [noticePeriods] = useState([
    'Immediate',
    '15 days',
    '1 month',
    '2 months',
    '3 months',
    '3 months+'
  ]);
  
  // State for view dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);


  useEffect(() => {
    // Extract unique creators and count candidates per creator
    const creatorMap = new Map();
    
    candidates.forEach(c => {
      if (c.createdBy) {
        const creatorKey = c.createdBy;
        if (!creatorMap.has(creatorKey)) {
          creatorMap.set(creatorKey, {
            name: c.createdBy,
            type: c.createdByType || 'Admin',
            count: 0
          });
        }
        // Increment count for this creator
        creatorMap.get(creatorKey).count += 1;
      }
    });
    
    // Convert map to array of creator objects
    const creatorsArray = Array.from(creatorMap.values());
    setCreators(creatorsArray);
  }, [candidates]);


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

      setCandidates(formattedData);
      setFilteredCandidates(formattedData);

      const uniqueLocations = [...new Set(formattedData.map(c => c.currentLocation).filter(Boolean))];
      const uniquePositions = [...new Set(formattedData.map(c => c.positionName).filter(Boolean))];

      // Set unique creators from our processed data
      setLocations(uniqueLocations);
      setPositions(uniquePositions);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  // Update locations when candidates change or position filter changes
  useEffect(() => {
    if (filters.positionName?.length > 0) {
      const filteredCandidates = candidates.filter(c => 
        filters.positionName.includes(c.positionName)
      );
      const uniqueLocations = [...new Set(filteredCandidates.map(c => c.currentLocation).filter(Boolean))];
      setLocations(uniqueLocations);
      
      // Remove any selected locations that are no longer in the filtered list
      if (filters.currentLocation?.length > 0) {
        const validLocations = filters.currentLocation.filter(loc => 
          uniqueLocations.includes(loc)
        );
        if (validLocations.length !== filters.currentLocation.length) {
          handleFilterChange('currentLocation', validLocations);
        }
      }
    } else {
      const uniqueLocations = [...new Set(candidates.map(c => c.currentLocation).filter(Boolean))];
      setLocations(uniqueLocations);
    }
  }, [candidates, filters.positionName]);

  const columns = [
    {
      field: "actions",
      headerName: "View",
      width: 80,
      sortable: false,
      filterable: false,
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


  // Open dialog with candidate details
  const handleViewClick = (candidate) => {
    setSelectedCandidate(candidate);
    setOpenDialog(true);
  };

  // Close dialog
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedCandidate(null);
  };

  const handleFilterChange = (filterName, value) => {
    const newFilters = { ...filters, [filterName]: value };
    setFilters(newFilters);
    
    // Filter candidates based on the new filters
    const filtered = candidates.filter(candidate => {
      // Position filter (multi-select)
      if (newFilters.positionName?.length > 0 && 
          !newFilters.positionName.includes(candidate.positionName)) {
        return false;
      }
      
      // If locations are selected, filter by them
      if (newFilters.currentLocation?.length > 0 && 
          !newFilters.currentLocation.includes(candidate.currentLocation)) {
        return false;
      }
      
      // Experience filter
      const [minExp, maxExp] = newFilters.experience || [0, 30];
      if (candidate.experience < minExp || candidate.experience > maxExp) {
        return false;
      }
      
      // Location filter (multi-select)
      if (newFilters.currentLocation?.length > 0 && 
          !newFilters.currentLocation.includes(candidate.currentLocation)) {
        return false;
      }
      
      // CTC Range filter
      const [minCTC, maxCTC] = newFilters.ctcRange || [0, 50];
      if (candidate.currentCTC < minCTC || candidate.currentCTC > maxCTC) {
        return false;
      }
      
      // Notice Period filter
      if (newFilters.noticePeriod && candidate.noticePeriod !== newFilters.noticePeriod) {
        return false;
      }
      
      // Date Range filter
      if (newFilters.dateRange[0] || newFilters.dateRange[1]) {
        const candidateDate = new Date(candidate.createdAt);
        const startDate = newFilters.dateRange[0] ? new Date(newFilters.dateRange[0]) : null;
        const endDate = newFilters.dateRange[1] ? new Date(newFilters.dateRange[1]) : null;
        
        if (startDate && candidateDate < startDate) return false;
        if (endDate && candidateDate > endDate) return false;
      }
      
      // Created By filter (multi-select)
      if (newFilters.createdBy?.length > 0 &&
          !newFilters.createdBy.includes(candidate.createdBy)) {
        return false;
      }
      
      // Name filter
      if (newFilters.name && 
          !candidate.name?.toLowerCase().includes(newFilters.name.toLowerCase())) {
        return false;
      }
      
      return true;
    });
    
    setFilteredCandidates(filtered);
  };

  // Reset all filters to their default values
  const resetFilters = () => {
    setFilters({
      positionName: [],
      experience: [0, 30],
      currentLocation: [],
      ctcRange: [0, 50],
      noticePeriod: '',
      dateRange: [null, null],
      createdBy: [],
      name: ''
    });
    setFilteredCandidates(candidates);
  };

  const applyFilters = () => {
    let filtered = [...candidates];

    if (filters.positionName) {
      filtered = filtered.filter(candidate => 
        candidate.positionName?.toLowerCase().includes(filters.positionName.toLowerCase())
      );
    }

    if (filters.currentLocation) {
      filtered = filtered.filter(candidate => 
        candidate.currentLocation?.toLowerCase().includes(filters.currentLocation.toLowerCase())
      );
    }

    if (filters.noticePeriod) {
      filtered = filtered.filter(candidate => 
        candidate.noticePeriod?.toLowerCase().includes(filters.noticePeriod.toLowerCase())
      );
    }

    // Date Range filter
    if (filters.dateRange[0] && filters.dateRange[1]) {
      const startDate = new Date(filters.dateRange[0]);
      const endDate = new Date(filters.dateRange[1]);
      endDate.setHours(23, 59, 59, 999); // End of the day
      
      filtered = filtered.filter(candidate => {
        const candidateDate = new Date(candidate.createdAt);
        return candidateDate >= startDate && candidateDate <= endDate;
      });
    }

    // Experience filter
    filtered = filtered.filter(candidate => 
      candidate.experience >= filters.experience[0] && 
      candidate.experience <= filters.experience[1]
    );

    // CTC filter
    filtered = filtered.filter(candidate => 
      candidate.currentCTC >= filters.ctcRange[0] && 
      candidate.currentCTC <= filters.ctcRange[1]
    );

    setFilteredCandidates(filtered);
  };

  // handleFilterChange is defined above with more comprehensive functionality

  const clearFilters = () => {
    setFilters({
      positionName: [],
      experience: [0, 30],
      currentLocation: [],
      ctcRange: [0, 50],
      noticePeriod: '',
      dateRange: [null, null],
      createdBy: [],
      name: ''
    });
    setFilteredCandidates(candidates);
  };

  // Function to count candidates by position
  const countByPosition = (position) => {
    if (!position) return candidates.length;
    return candidates.filter(c => c.positionName === position).length;
  };

  // Function to count candidates by location with position filter
  const countByLocation = (location) => {
    if (!location) return candidates.length;
    
    // If positions are selected, only count candidates with those positions
    if (filters.positionName?.length > 0) {
      return candidates.filter(c => 
        c.currentLocation === location && 
        filters.positionName.includes(c.positionName)
      ).length;
    }
    
    return candidates.filter(c => c.currentLocation === location).length;
  };

  // Get filtered locations based on selected positions
  const getFilteredLocations = () => {
    if (filters.positionName?.length > 0) {
      // Get unique locations that have at least one candidate with the selected positions
      const filteredCandidates = candidates.filter(c => 
        filters.positionName.includes(c.positionName)
      );
      return [...new Set(filteredCandidates.map(c => c.currentLocation).filter(Boolean))];
    }
    return locations;
  };

  // Function to count candidates by notice period
  const countByNoticePeriod = (noticePeriod) => {
    if (!noticePeriod) return candidates.length;
    return candidates.filter(c => c.noticePeriod === noticePeriod).length;
  };

  const renderFilters = () => (
    <Box sx={{ '& > *:not(:last-child)': { mb: 3 } }}>
      {/* Position Filter with Multi-Select */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          Position
        </Typography>
        <Autocomplete
          multiple
          options={Array.from(new Set(positions))}
          value={filters.positionName || []}
          onChange={(_, newValue) => handleFilterChange('positionName', newValue)}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              placeholder="Select positions..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: '0 12px',
                },
              }}
            />
          )}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                style={{ marginRight: 8 }}
                checked={filters.positionName?.includes(option) || false}
              />
              {option}
              <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.75rem' }}>
                ({countByPosition(option)})
              </span>
            </li>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                onDelete={() => {
                  handleFilterChange('positionName', filters.positionName.filter(item => item !== option));
                }}
              />
            ))
          }
          sx={{
            '& .MuiAutocomplete-endAdornment': {
              right: '8px',
              top: 'calc(50% - 12px)'
            }
          }}
        />
      </Box>

      {/* Experience Filter */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary">
          Experience (Years)
        </Typography>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <TextField
            size="small"
            type="number"
            value={filters.experience[0]}
            onChange={(e) => {
              const value = Math.min(Number(e.target.value), filters.experience[1] - 0.5);
              handleFilterChange('experience', [value, filters.experience[1]]);
            }}
            inputProps={{
              min: 0,
              max: 29.5,
              step: 0.5,
              style: { textAlign: 'center' }
            }}
            sx={{
              width: '80px',
              '& .MuiOutlinedInput-root': {
                '& input': {
                  padding: '8px',
                  textAlign: 'center'
                }
              }
            }}
          />
          <Box flex={1}>
            <Slider
              value={filters.experience}
              onChange={(_, newValue) => handleFilterChange('experience', newValue)}
              min={0}
              max={30}
              step={0.5}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} yrs`}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
                  },
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: 'primary.main',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  '&:before': {
                    display: 'none',
                  },
                },
              }}
            />
          </Box>
          <TextField
            size="small"
            type="number"
            value={filters.experience[1]}
            onChange={(e) => {
              const value = Math.max(Number(e.target.value), filters.experience[0] + 0.5);
              handleFilterChange('experience', [filters.experience[0], Math.min(value, 30)]);
            }}
            inputProps={{
              min: 0.5,
              max: 30,
              step: 0.5,
              style: { textAlign: 'center' }
            }}
            sx={{
              width: '80px',
              '& .MuiOutlinedInput-root': {
                '& input': {
                  padding: '8px',
                  textAlign: 'center'
                }
              }
            }}
          />
        </Box>
      </Box>

      {/* Location Filter with Multi-Select */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          Location
        </Typography>
        <Autocomplete
          multiple
          options={getFilteredLocations()}
          value={filters.currentLocation || []}
          onChange={(_, newValue) => handleFilterChange('currentLocation', newValue)}
          disabled={loading}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              placeholder="Select locations..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: '0 12px',
                },
              }}
            />
          )}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                style={{ marginRight: 8 }}
                checked={filters.currentLocation?.includes(option) || false}
              />
              {option}
              <span style={{ marginLeft: '8px', color: '#666', fontSize: '0.75rem' }}>
                ({countByLocation(option)})
              </span>
            </li>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option}
                label={option}
                size="small"
                onDelete={() => {
                  handleFilterChange('currentLocation', filters.currentLocation.filter(item => item !== option));
                }}
              />
            ))
          }
          sx={{
            '& .MuiAutocomplete-endAdornment': {
              right: '8px',
              top: 'calc(50% - 12px)'
            }
          }}
        />
      </Box>

      {/* CTC Range Filter */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={2} color="text.secondary">
          CTC Range (LPA)
        </Typography>
        <Box display="flex" alignItems="center" gap={2} mb={2}>
          <TextField
            size="small"
            type="number"
            value={filters.ctcRange[0]}
            onChange={(e) => {
              const value = Math.min(Number(e.target.value), filters.ctcRange[1] - 1);
              handleFilterChange('ctcRange', [value, filters.ctcRange[1]]);
            }}
            inputProps={{
              min: 0,
              max: 49,
              step: 1,
              style: { textAlign: 'center' }
            }}
            sx={{
              width: '80px',
              '& .MuiOutlinedInput-root': {
                '& input': {
                  padding: '8px',
                  textAlign: 'center'
                }
              }
            }}
          />
          <Box flex={1}>
            <Slider
              value={filters.ctcRange}
              onChange={(_, newValue) => handleFilterChange('ctcRange', newValue)}
              min={0}
              max={50}
              step={1}
              valueLabelDisplay="auto"
              valueLabelFormat={(value) => `${value} LPA`}
              sx={{
                color: 'primary.main',
                '& .MuiSlider-thumb': {
                  width: 16,
                  height: 16,
                  '&:hover, &.Mui-focusVisible': {
                    boxShadow: '0 0 0 8px rgba(99, 102, 241, 0.16)',
                  },
                },
                '& .MuiSlider-valueLabel': {
                  backgroundColor: 'primary.main',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  '&:before': {
                    display: 'none',
                  },
                },
              }}
            />
          </Box>
          <TextField
            size="small"
            type="number"
            value={filters.ctcRange[1]}
            onChange={(e) => {
              const value = Math.max(Number(e.target.value), filters.ctcRange[0] + 1);
              handleFilterChange('ctcRange', [filters.ctcRange[0], Math.min(value, 50)]);
            }}
            inputProps={{
              min: 1,
              max: 50,
              step: 1,
              style: { textAlign: 'center' }
            }}
            sx={{
              width: '80px',
              '& .MuiOutlinedInput-root': {
                '& input': {
                  padding: '8px',
                  textAlign: 'center'
                }
              }
            }}
          />
        </Box>
      </Box>

      {/* Notice Period Filter */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          Notice Period
        </Typography>
        <Autocomplete
          options={Array.from(new Set(noticePeriods))}
          value={filters.noticePeriod || null}
          onChange={(_, newValue) => handleFilterChange('noticePeriod', newValue || '')}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              placeholder="Search notice periods..."
              sx={{
                '& .MuiOutlinedInput-root': {
                  padding: '0 12px',
                },
              }}
            />
          )}
          renderOption={(props, option) => (
            <Box component="li" {...props}>
              {option}
            </Box>
          )}
          clearIcon={
            <IconButton size="small" onClick={() => handleFilterChange('noticePeriod', '')}>
              <Clear fontSize="small" />
            </IconButton>
          }
          sx={{
            '& .MuiAutocomplete-endAdornment': {
              right: '8px',
              top: 'calc(50% - 12px)'
            },
            '& .MuiAutocomplete-clearIndicator': {
              padding: '4px',
              marginRight: '-4px'
            }
          }}
        />
      </Box>

      {/* Date Range Filter */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          Date Range
        </Typography>
        <Box display="flex" gap={2} mb={2}>
          <TextField
            label="Start Date"
            type="date"
            value={filters.dateRange[0] || ''}
            onChange={(e) => handleFilterChange('dateRange', [e.target.value, filters.dateRange[1]])}
            fullWidth
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
          <TextField
            label="End Date"
            type="date"
            value={filters.dateRange[1] || ''}
            onChange={(e) => handleFilterChange('dateRange', [filters.dateRange[0], e.target.value])}
            fullWidth
            size="small"
            InputLabelProps={{
              shrink: true,
            }}
          />
        </Box>
      </Box>

      {/* Created By Filter (multi-select with type) */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          Created By
        </Typography>
        <Autocomplete
          multiple
          options={creators}
          getOptionLabel={(option) => `${option.name} (${option.count})`}
          value={creators.filter(opt => filters.createdBy.includes(opt.name))}
          onChange={(_, newValue) => handleFilterChange('createdBy', newValue.map(v => v.name))}
          renderInput={(params) => (
            <TextField
              {...params}
              variant="outlined"
              size="small"
              placeholder="Select creators..."
            />
          )}
          renderOption={(props, option, { selected }) => (
            <li {...props}>
              <Checkbox
                style={{ marginRight: 8 }}
                checked={filters.createdBy.includes(option.name)}
              />
              {`${option.name} (${option.count})`}
            </li>
          )}
          renderTags={(value, getTagProps) =>
            value.map((option, index) => (
              <Chip
                {...getTagProps({ index })}
                key={option.name}
                size="small"
                onDelete={() => {
                  handleFilterChange('createdBy', filters.createdBy.filter(item => item !== option.name));
                }}
              />
            ))
          }
        />
      </Box>

      {/* Name Filter */}
      <Box>
        <Typography variant="subtitle2" fontWeight={600} mb={1} color="text.secondary">
          Candidate Name
        </Typography>
        <TextField
          fullWidth
          size="small"
          placeholder="Filter by name"
          value={filters.name || ''}
          onChange={(e) => handleFilterChange('name', e.target.value)}
          InputProps={{
            endAdornment: filters.name && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => handleFilterChange('name', '')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {/* Clear Filters Button */}
      <Box mt={3}>
        <Button
          variant="outlined"
          onClick={resetFilters}
          fullWidth
          startIcon={<ClearIcon />}
          sx={{
            textTransform: 'none',
            fontWeight: 500,
            color: 'text.secondary',
            borderColor: 'divider',
            '&:hover': {
              borderColor: 'primary.main',
              color: 'primary.main',
            },
          }}
        >
          Clear All Filters
        </Button>
      </Box>
      
      {/* Candidate Details Dialog */}
      {renderCandidateDialog()}
    </Box>
  );

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
                    download
                    onClick={(e) => e.stopPropagation()}
                    sx={{ ml: 2 }}
                    target="_blank"
                  >
                    Download Resume
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
                    View Resume
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <Navbar />
      
      <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', backgroundColor: '#f8fafc', p: 2 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2, backgroundColor: 'white', p: 2, borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
          <Typography variant="h6" sx={{ fontWeight: 600, color: '#1e293b' }}>
            Candidate Details
          </Typography>
          <Chip 
            label={`${filteredCandidates.length} candidates found`} 
            size="small" 
            sx={{ 
              backgroundColor: '#f1f5f9', 
              color: '#475569',
              fontWeight: 500
            }} 
          />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, flex: 1, minHeight: 0 }}>
          {/* Left Sidebar - Filters */}
          <Paper 
            elevation={0} 
            sx={{ 
              width: '280px', 
              p: 2, 
              borderRadius: '8px',
              border: '1px solid #e2e8f0',
              backgroundColor: 'white',
              height: 'fit-content',
              position: 'sticky',
              top: '16px',
              maxHeight: 'calc(100vh - 120px)',
              overflowY: 'auto',
              '&::-webkit-scrollbar': {
                width: '6px',
              },
              '&::-webkit-scrollbar-track': {
                background: '#f1f1f1',
                borderRadius: '3px',
              },
              '&::-webkit-scrollbar-thumb': {
                background: '#c1c1c1',
                borderRadius: '3px',
                '&:hover': {
                  background: '#a8a8a8',
                },
              },
            }}
          >
            <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600, color: '#1e293b' }}>
                Filters
              </Typography>
              <Button 
                onClick={clearFilters} 
                size="small" 
                sx={{ textTransform: 'none', color: '#3b82f6', fontSize: '0.8rem' }}
              >
                Clear All
              </Button>
            </Box>
            <Box sx={{ pr: 1 }}>
              {renderFilters()}
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
                  overflowX: 'auto', // horizontal scroll
                  overflowY: 'auto', // vertical scroll
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
              }}
            >
              <DataGrid
                rows={filteredCandidates}
                columns={columns}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                checkboxSelection
                disableSelectionOnClick
                getRowId={(row) => row.id}
                loading={loading}
                components={{
                  LoadingOverlay: LinearProgress,
                  NoRowsOverlay: () => (
                    <Box sx={{ 
                      display: 'flex', 
                      height: '100%', 
                      alignItems: 'center', 
                      justifyContent: 'center',
                      flexDirection: 'column',
                      gap: 1
                    }}>
                      <Typography variant="body1" color="textSecondary">
                        {loading ? 'Loading candidates...' : 'No candidates found'}
                      </Typography>
                      {!loading && (
                        <Button 
                          variant="outlined" 
                          size="small" 
                          onClick={resetFilters}
                          sx={{ mt: 1 }}
                        >
                          Clear Filters
                        </Button>
                      )}
                    </Box>
                  ),
                }}
                sx={{
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#f8fafc',
                    borderBottom: '1px solid #e2e8f0',
                    '& .MuiDataGrid-columnHeaderTitle': {
                      fontWeight: 600,
                    },
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
    
  );
};

export default HRCandidateList;
