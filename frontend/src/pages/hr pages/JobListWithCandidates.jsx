import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Typography,
  Modal,
  IconButton,
  Paper,
  Grid,
  Divider,
  Chip,
  Card,
  CardContent,
  Stack,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
} from "@mui/material";
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import GroupIcon from "@mui/icons-material/Group";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PeopleIcon from '@mui/icons-material/People';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AccessTimeIcon from '@mui/icons-material/AccessTime';

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100%",
  maxWidth: "1800px",
  bgcolor: "background.paper",
  boxShadow: 24,
  p: 4,
  borderRadius: 2,
  maxHeight: "100vh",
  height: "865px",
  display: "flex",
  flexDirection: "column",
  overflow: "auto"
};

const JobListWithCandidates = () => {
  const [jobs, setJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [editedCandidates, setEditedCandidates] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [open, setOpen] = useState(false);
  const [rescheduleHistoryOpen, setRescheduleHistoryOpen] = useState(false);
  const [selectedRescheduleHistory, setSelectedRescheduleHistory] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [editFormData, setEditFormData] = useState({
    interviewDate: '',
    lineupStatus: '',
    joiningDate: '',
    candidateRemarks: ''
  });

  const [rescheduleFormData, setRescheduleFormData] = useState({
    newDate: '',
    reason: ''
  });

  const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleCellEditCommit = (params) => {
    const { id, field, value } = params;
    console.log('Cell edit:', { id, field, value });

    // Only update if the field is one of the editable fields
    if (['interviewDate', 'lineupStatus', 'joiningDate', 'candidateRemarks'].includes(field)) {
      setEditedCandidates(prev => {
        const currentEdits = prev[id] || {};
        return {
          ...prev,
          [id]: {
            ...currentEdits,
            [field]: value
          }
        };
      });
    }
  };

  const handleUpdateCandidate = (candidateId) => {
    const updatedData = editedCandidates[candidateId];
    console.log('Current editedCandidates state:', editedCandidates);
    console.log('Updating candidate:', { candidateId, updatedData });

    if (updatedData && Object.keys(updatedData).length > 0) {
      // Create a clean object with only the changed fields
      const cleanData = Object.entries(updatedData).reduce((acc, [key, value]) => {
        if (value !== undefined && value !== null) {
          acc[key] = value;
        }
        return acc;
      }, {});

      console.log('Sending data to backend:', cleanData);
      handleSaveCandidateDetails(candidateId, cleanData);
    } else {
      setSnackbar({
        open: true,
        message: 'No changes to submit',
        severity: 'info'
      });
    }
  };

  const handleSaveCandidateDetails = async (candidateId, updatedData) => {
    try {
      const token = sessionStorage.getItem("token");
      console.log('Saving candidate details:', { candidateId, updatedData });

      if (!updatedData || Object.keys(updatedData).length === 0) {
        setSnackbar({
          open: true,
          message: 'No changes to save',
          severity: 'info'
        });
        return;
      }

      const response = await axios.put(
        'http://localhost:5000/api/add/candidates/${candidateId}',
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      console.log("Candidate details updated:", response.data);

      // Clear only the edited fields for this candidate
      const newEditedCandidates = { ...editedCandidates };
      delete newEditedCandidates[candidateId];
      setEditedCandidates(newEditedCandidates);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Candidate details updated successfully!',
        severity: 'success'
      });

      // Refresh the candidates list
      if (selectedJob) {
        const res = await axios.get('http://localhost:5000/api/add/jobs/${selectedJob._id}/candidates', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCandidates(res.data);
      }
    } catch (error) {
      console.error("Error updating candidate details:", error);
      // Show error message
      setSnackbar({
        open: true,
        message: 'Failed to update candidate details. Please try again.',
        severity: 'error'
      });
    }
  };

  const handleSubmitAllChanges = async () => {
    try {
      const token = sessionStorage.getItem("token");
      // Get all candidates that have changes
      const candidatesToUpdate = Object.entries(editedCandidates).map(([id, data]) => ({
        id,
        data
      }));

      // Update each candidate
      for (const { id, data } of candidatesToUpdate) {
        await axios.put(
          'http://localhost:5000/api/candidates/${id}',
          data,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
      }

      // Clear all edited states
      setEditedCandidates({});

      // Refresh the candidates list
      if (selectedJob) {
        const res = await axios.get('http://localhost:5000/api/add/jobs/${selectedJob._id}/candidates', {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        setCandidates(res.data);
      }
    } catch (error) {
      console.error("Error updating candidates:", error);
    }
  };

  const fetchJobs = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const res = await axios.get("http://localhost:5000/api/add/jobs", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setJobs(res.data);
    } catch (error) {
      console.error("Failed to fetch jobs:", error);
    }
  };

  const handleOpenModal = async (job) => {
    try {
      const token = sessionStorage.getItem("token");
      setSelectedJob(job);
      const res = await axios.get(`http://localhost:5000/api/add/jobs/${job._id}/candidates`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // setCandidates(res.data);
      setSelectedJob(res.data.job);  // Set job data including keyResponsibility and description
      setCandidates(res.data.candidates);
      setModalOpen(true);
    } catch (error) {
      console.error("Failed to fetch candidates:", error);
    }
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setCandidates([]);
  };

  const handleEditClick = (candidate) => {
    setSelectedCandidate(candidate);
    setEditFormData({
      interviewDate: candidate.interviewDate || '',
      lineupStatus: candidate.lineupStatus || 'Pending',
      joiningDate: candidate.joiningDate || '',
      candidateRemarks: candidate.candidateRemarks || ''
    });
    setEditModalOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleEditSubmit = async () => {
    if (selectedCandidate) {
      try {
        const token = sessionStorage.getItem("token");
        const response = await axios.put(
          `http://localhost:5000/api/add/candidates/${selectedCandidate._id}`,
          editFormData,
          {
            headers: {
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          }
        );

        // Update the candidates list
        const updatedCandidates = candidates.map(candidate =>
          candidate._id === selectedCandidate._id
            ? { ...candidate, ...editFormData }
            : candidate
        );
        setCandidates(updatedCandidates);

        setEditModalOpen(false);
        setSnackbar({
          open: true,
          message: 'Candidate details updated successfully!',
          severity: 'success'
        });
      } catch (error) {
        console.error("Error updating candidate details:", error);
        setSnackbar({
          open: true,
          message: 'Failed to update candidate details. Please try again.',
          severity: 'error'
        });
      }
    }
  };

  const handleRescheduleClick = (candidate) => {
    setSelectedCandidate(candidate);
    setRescheduleFormData({
      newDate: '',
      reason: ''
    });
    setRescheduleModalOpen(true);
  };

const handleRescheduleSubmit = async () => {
  if (!selectedCandidate) return;

  try {
    const token = sessionStorage.getItem("token");
    const response = await axios.post(
      `http://localhost:5000/api/add/candidates/${selectedCandidate._id}/reschedule`,
      rescheduleFormData,
      {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      }
    );

    // No need to update candidate since interviewDate is not changed
    setRescheduleModalOpen(false);
    setSnackbar({
      open: true,
      message: 'Interview rescheduled successfully!',
      severity: 'success'
    });
  } catch (error) {
    console.error("Error rescheduling interview:", error);
    setSnackbar({
      open: true,
      message: 'Failed to reschedule interview.',
      severity: 'error'
    });
  }
};



  const handleOpenRescheduleHistory = (dates) => {
    setSelectedRescheduleHistory(dates);
    setRescheduleHistoryOpen(true);
  };

  const handleCloseRescheduleHistory = () => {
    setRescheduleHistoryOpen(false);
    setSelectedRescheduleHistory(null);
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const jobColumns = [
    {
      field: "jobTitle",
      headerName: "Job Title",
      flex: 1.5,
      renderCell: (params) => (
        <Typography sx={{ textAlign: 'left', width: '100%' }}>{params.value}</Typography>
      )
    },
    {
      field: "companyName",
      headerName: "Company",
      flex: 1.5,
      renderCell: (params) => (
        <Typography sx={{ textAlign: 'left', width: '100%' }}>{params.value}</Typography>
      )
    },
    {
      field: "jobLocation",
      headerName: "Location",
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ textAlign: 'left', width: '100%' }}>{params.value}</Typography>
      )
    },
    {
      field: "numberOfRequirements",
      headerName: "Requirements",
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ textAlign: 'center', width: '100%' }}>{params.value}</Typography>
      )
    },
    {
      field: "salary",
      headerName: "Salary",
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ textAlign: 'left', width: '100%' }}>{params.value}</Typography>
      )
    },
    {
      field: "experience",
      headerName: "Experience",
      flex: 1,
      renderCell: (params) => (
        <Typography sx={{ textAlign: 'left', width: '100%' }}>{params.value}</Typography>
      )
    },
    {
      field: "actions",
      headerName: "Actions",
      flex: 1,
      renderCell: (params) => (
        <Button
          variant="contained"
          onClick={() => handleOpenModal(params.row)}
          sx={{
            backgroundColor: '#3f51b5',
            '&:hover': {
              backgroundColor: '#303f9f',
            },
            width: '100%',
            textTransform: 'none'
          }}
        >
          View Candidates ({params.row.candidateCount || 0})
        </Button>
      ),
    },
  ];
  

  const candidateColumns = [
    {
      field: "candidateName",
      headerName: "Name",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Typography sx={{ fontWeight: 'medium' }}>{params.value}</Typography>
      )
    },
    {
      field: "candidateEmail",
      headerName: "Email",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Typography sx={{ color: '#3f51b5' }}>{params.value}</Typography>
      )
    },
    {
      field: "candidatePhone",
      headerName: "Phone",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Typography>{params.value}</Typography>
      )
    },
    {
      field: "qualification",
      headerName: "Qualification",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Chip
          label={params.value}
          color="primary"
          variant="outlined"
          size="small"
        />
      )
    },
    {
      field: "remark",
      headerName: "Remark",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Typography sx={{
          color: params.value.toLowerCase().includes('selected') ? '#4caf50' :
            params.value.toLowerCase().includes('rejected') ? '#f44336' :
              '#757575'
        }}>
          {params.value}
        </Typography>
      )
    },
    {
      field: "interviewDate",
      headerName: "Interview Date",
      flex: 1.5,
      editable: true,
      renderCell: (params) => {
        const date = params.row.interviewDate ? new Date(params.row.interviewDate) : null;
        return (
          <Typography>
            {date ? date.toLocaleDateString() : 'Not Set'}
          </Typography>
        );
      }
    },
    {
      field: "lineupStatus",
      headerName: "Lineup Status",
      flex: 1.5,
      editable: true,
      type: 'singleSelect',
      valueOptions: ['Pending', 'Scheduled', 'Completed', 'Cancelled'],
      renderCell: (params) => {
        const status = params.row.lineupStatus || 'Pending';
        return (
          <Typography>
            {status}
          </Typography>
        );
      }
    },
    {
      field: "joiningDate",
      headerName: "Joining Date",
      flex: 1.5,
      editable: true,
      renderCell: (params) => {
        const date = params.row.joiningDate ? new Date(params.row.joiningDate) : null;
        return (
          <Typography>
            {date ? date.toLocaleDateString() : 'Not Set'}
          </Typography>
        );
      }
    },
    {
      field: "candidateRemarks",
      headerName: "Candidate Remarks",
      flex: 2,
      editable: true,
      renderCell: (params) => {
        const remarks = params.row.candidateRemarks || '';
        return (
          <Typography>
            {remarks}
          </Typography>
        );
      }
    },
    // {
    //   field: "rescheduledDates",
    //   headerName: "Rescheduled Dates",
    //   flex: 2,
    //   editable: false,
    //   renderCell: (params) => {
    //     const dates = params.row.rescheduledDates || [];
    //     return (
    //       <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
    //         {dates.length > 0 ? (
    //           <Button
    //             size="small"
    //             onClick={() => handleOpenRescheduleHistory(dates)}
    //             variant="outlined"
    //             sx={{
    //               fontSize: '0.7rem',
    //               color: '#3f51b5',
    //               borderColor: '#3f51b5',
    //               '&:hover': {
    //                 backgroundColor: 'rgba(63, 81, 181, 0.04)',
    //                 borderColor: '#303f9f',
    //               }
    //             }}
    //           >
    //             View History ({dates.length})
    //           </Button>
    //         ) : (
    //           <Typography variant="body2" sx={{ color: '#999', fontStyle: 'italic' }}>
    //             No reschedules
    //           </Typography>
    //         )}
    //       </Box>
    //     );
    //   }
    // },

     {
    field: "originalInterviewDate",
    headerName: "Original Interview Date",
    flex: 1.5,
    editable: false,
    renderCell: (params) => {
      const date = params.row.originalInterviewDate ? new Date(params.row.originalInterviewDate) : null;
      return <Typography>{date ? date.toLocaleDateString() : "Not Set"}</Typography>;
    }
  },

  {
    field: "rescheduleDate",
    headerName: "Reschedule Date",
    flex: 1.5,
    editable: false,
    renderCell: (params) => {
      if (params.row.type === "reschedule") {
        const date = params.row.rescheduleDate ? new Date(params.row.rescheduleDate) : null;
        return <Typography>{date ? date.toLocaleDateString() : "N/A"}</Typography>;
      }
      return <Typography sx={{ color: '#999', fontStyle: 'italic' }}>-</Typography>;
    }
  },

  {
    field: "rescheduleReason",
    headerName: "Reschedule Reason",
    flex: 2,
    editable: false,
    renderCell: (params) => {
      if (params.row.type === "reschedule") {
        return (
          <Typography sx={{ fontStyle: 'italic', color: '#555' }}>
            {params.row.reason || "N/A"}
          </Typography>
        );
      }
      return <Typography sx={{ color: '#999', fontStyle: 'italic' }}>-</Typography>;
    }
  },

  {
    field: "status",
    headerName: "Status",
    flex: 1,
    editable: false,
    renderCell: (params) => (
      <Chip
        label={params.row.type === "candidate" ? "Original" : "Rescheduled"}
        color={params.row.type === "candidate" ? "primary" : "secondary"}
        size="small"
      />
    )
  },
    {
      field: "resumeLink",
      headerName: "Resume",
      flex: 1.9,
      editable: false,
      renderCell: (params) => {
        const resumeUrl = params.value && params.value !== "No Resume" ? params.value : null;
    
        return resumeUrl ? (
          <Button
            variant="outlined"
            size="small"
            href={resumeUrl}
            target="_blank"
            rel="noopener noreferrer"
            sx={{
              borderColor: '#3f51b5',
              color: '#3f51b5',
              '&:hover': {
                borderColor: '#303f9f',
                backgroundColor: 'rgba(63, 81, 181, 0.04)',
              },
            }}
          >
            View Resume
          </Button>
        ) : (
          <Typography sx={{ color: '#9e9e9e' }}>N/A</Typography>
        );
      },
    },
    

    {
      field: "actions",
      headerName: "Actions",
      flex: 1.5,
      minWidth: 250,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 1, minWidth: '240px' }}>
          <Button
            variant="contained"
            size="small"
            onClick={() => handleEditClick(params.row)}
            sx={{
              backgroundColor: '#3f51b5',
              '&:hover': {
                backgroundColor: '#303f9f',
              },
              minWidth: '100px',
              fontSize: '0.7rem',
            }}
          >
            Edit Details
          </Button>
          <Button
            variant="outlined"
            size="small"
            onClick={() => handleRescheduleClick(params.row)}
            sx={{
              borderColor: '#3f51b5',
              color: '#3f51b5',
              '&:hover': {
                borderColor: '#303f9f',
                backgroundColor: 'rgba(63, 81, 181, 0.04)',
              },
              minWidth: '100px',
              fontSize: '0.7rem',
            }}
          >
            Reschedule
          </Button>
        </Box>
      )
    }
  ];

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{
        position: 'fixed',
        left: 0,
        top: 0,
        height: '100vh',
        width: '250px',
        backgroundColor: '#3f51b5',
        color: 'white',
        zIndex: 1000
      }}>
        <Sidebar />
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        marginLeft: '250px',
        width: 'calc(100% - 250px)',
      }}>
        {/* Navbar */}
        <div style={{
          position: 'fixed',
          top: 0,
          right: 0,
          left: '250px',
          zIndex: 999,
          backgroundColor: 'white',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <Navbar />
        </div>

        {/* Content */}
        <Box sx={{
          backgroundColor: 'white',
          borderRadius: '12px',
          padding: '24px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          marginTop: '64px',
          margin: '84px 24px 24px 24px'
        }}>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h5" sx={{
              color: '#3f51b5',
              fontWeight: 'bold',
              display: 'flex',
              alignItems: 'center',
              gap: 1
            }}>
              <WorkIcon /> Job Listings
            </Typography>
            <Chip
              label={`Total Jobs: ${jobs.length}`}
              color="primary"
              sx={{
                backgroundColor: '#3f51b5',
                color: 'white',
                fontWeight: 'medium'
              }}
            />
          </Stack>

          <DataGrid
            rows={jobs}
            columns={jobColumns}
            getRowId={(row) => row._id}
            autoHeight
            pageSize={5}
            disableSelectionOnClick
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderColor: '#e0e0e0',
                padding: '16px',
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#f5f5f5',
                borderColor: '#e0e0e0',
                padding: '16px',
                '& .MuiDataGrid-columnHeaderTitle': {
                  fontWeight: 'bold',
                  color: '#3f51b5',
                  textAlign: 'center',
                  width: '100%',
                },
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(63, 81, 181, 0.04)',
              },
              '& .MuiDataGrid-virtualScroller': {
                marginTop: '0 !important',
              },
              '& .MuiDataGrid-main': {
                overflow: 'hidden',
              },
            }}
          />
        </Box>

        <Modal open={modalOpen} onClose={handleCloseModal}>
          <Box sx={{ ...modalStyle, p: 3 }}>
            {selectedJob && (
              <>
                <Typography variant="h6" mb={2} fontWeight="bold" color="primary">
                  <WorkIcon sx={{ mr: 1 }} /> Job Details
                </Typography>

                {/* Job Info Grid */}
                <Grid container spacing={1}>
                  {[
                    { label: 'Job Title', value: selectedJob.jobTitle, icon: <WorkIcon /> },
                    { label: 'Company', value: selectedJob.companyName, icon: <BusinessIcon /> },
                    { label: 'Location', value: selectedJob.jobLocation, icon: <LocationOnIcon /> },
                    { label: 'Requirements', value: selectedJob.numberOfRequirements, icon: <PeopleIcon /> },
                    { label: 'Salary', value: selectedJob.salary, icon: <CurrencyRupeeIcon /> },
                    { label: 'Contact', value: selectedJob.contactName },
                    { label: 'Email', value: selectedJob.email },
                    { label: 'Phone', value: selectedJob.phoneNumber },
                    { label: 'Education', value: selectedJob.education },
                    { label: 'Experience', value: selectedJob.experience },
                  ].map((item, idx) => (
                    <Grid item xs={6} sm={4} md={1.2} key={idx}>
                      <Paper 
                        elevation={0} 
                        sx={{ 
                          p: 1, 
                          height: '100%',
                          border: '1px solid #e0e0e0',
                          borderRadius: 1,
                          '&:hover': {
                            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                            borderColor: '#3f51b5',
                          }
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          {item.icon}
                          <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5, fontSize: '0.7rem' }}>
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 'medium', fontSize: '0.8rem' }} noWrap>
                          {item.value}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>

                {/* Responsibilities and Description */}
                <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Key Responsibilities
                    </Typography>
                    <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>
                      {selectedJob.keyResponsibility}
                    </Typography>
                  </Box>
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 0.5 }}>
                      Job Description
                    </Typography>
                    {selectedJob.description?.endsWith('.pdf') ? (
                      <>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }}>PDF file uploaded</Typography>
                        <Button
                          onClick={() => window.open(selectedJob.description, '_blank')}  
                          size="small"
                          variant="outlined"
                          sx={{ mt: 0.5, fontSize: '0.7rem' }}
                        >
                          View Full Job Description
                        </Button>
                      </>
                    ) : (
                      <>
                        <Typography variant="body2" sx={{ fontSize: '0.8rem' }} noWrap>
                          {selectedJob.description?.slice(0, 100)}...
                        </Typography>
                        <Button onClick={handleOpen} size="small" variant="outlined" sx={{ mt: 0.5, fontSize: '0.7rem' }}>
                          View Full Description
                        </Button>
                      </>
                    )}
                  </Box>
                </Box>

                {/* Dialog for Full Description */}
                <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                  <DialogTitle>Job Description</DialogTitle>
                  <DialogContent dividers>
                    <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>
                      {selectedJob.description}
                    </Typography>
                  </DialogContent>
                  <DialogActions>
                    <Button onClick={handleClose} variant="contained">Close</Button>
                  </DialogActions>
                </Dialog>

                {/* Candidates Grid */}
                <Typography variant="h6" mt={4} mb={2} fontWeight="bold" color="primary">
                  <PeopleIcon sx={{ mr: 1 }} /> Candidates
                </Typography>

                <Box
                  sx={{
                    height: 500,
                    width: '100%',
                  }}
                >
                  <DataGrid
                    rows={candidates}
                    columns={candidateColumns.map((col) => ({
                      ...col,
                      flex: undefined,
                      minWidth: col.minWidth || 150,
                      width: col.width || 150,
                    }))}
                    getRowId={(row) => row._id}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    disableSelectionOnClick
                    density="compact"
                    components={{
                      Toolbar: GridToolbar,
                    }}
                    componentsProps={{
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 500 },
                      },
                    }}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-cell': {
                        whiteSpace: 'normal',
                        lineHeight: '1.5',
                        fontSize: '0.95rem',
                      },
                      '& .MuiDataGrid-row': {
                        '&:hover': {
                          backgroundColor: 'rgba(0,0,0,0.04)',
                        },
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f9f9f9',
                        fontWeight: 'bold',
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        overflowX: 'auto',
                      },
                      '& .MuiDataGrid-toolbarContainer': {
                        padding: '8px',
                        backgroundColor: '#f9f9f9',
                        borderBottom: '1px solid #e0e0e0',
                      },
                      '& .MuiDataGrid-toolbarContainer button': {
                        color: '#3f51b5',
                        '&:hover': {
                          backgroundColor: 'rgba(63, 81, 181, 0.04)',
                        },
                      },
                      '& .MuiDataGrid-footerContainer': {
                        borderTop: '1px solid #e0e0e0',
                        padding: '8px 16px',
                        justifyContent: 'flex-end',
                        '& .MuiTablePagination-root': {
                          marginLeft: 'auto',
                        },
                        '& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows': {
                          margin: 0,
                        },
                      },
                      '& .MuiDataGrid-columnSeparator': {
                        display: 'none',
                      },
                      '& .MuiDataGrid-cell:focus, & .MuiDataGrid-cell:focus-within': {
                        outline: 'none',
                      },
                      '& .MuiDataGrid-main': {
                        overflow: 'auto',
                      },
                      '& .MuiDataGrid-virtualScrollerContent': {
                        minWidth: '1600px',
                      },
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        </Modal>

        {/* Edit Modal */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          aria-labelledby="edit-candidate-modal"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}>
            <Typography variant="h6" component="h2" mb={3}>
              Edit Candidate Details
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="Interview Date"
                type="date"
                value={editFormData.interviewDate}
                onChange={(e) => handleEditFormChange('interviewDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                select
                label="Lineup Status"
                value={editFormData.lineupStatus}
                onChange={(e) => handleEditFormChange('lineupStatus', e.target.value)}
                fullWidth
              >
                {['Pending', 'Scheduled', 'Completed', 'Cancelled'].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              <TextField
                label="Joining Date"
                type="date"
                value={editFormData.joiningDate}
                onChange={(e) => handleEditFormChange('joiningDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Candidate Remarks"
                multiline
                rows={4}
                value={editFormData.candidateRemarks}
                onChange={(e) => handleEditFormChange('candidateRemarks', e.target.value)}
                fullWidth
              />
            </Stack>

            <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
              <Button
                variant="outlined"
                onClick={() => setEditModalOpen(false)}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleEditSubmit}
                sx={{
                  backgroundColor: '#4caf50',
                  '&:hover': {
                    backgroundColor: '#388e3c',
                  },
                }}
              >
                Save Changes
              </Button>
            </Box>
          </Box>
        </Modal>

        {/* Reschedule Modal */}
        <Modal
          open={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          aria-labelledby="reschedule-modal"
        >
          <Box sx={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 400,
            bgcolor: 'background.paper',
            boxShadow: 24,
            p: 4,
            borderRadius: 2,
          }}>
            <Typography variant="h6" component="h2" mb={3}>
              Reschedule Interview
            </Typography>

            <Stack spacing={3}>
              <TextField
                label="New Interview Date"
                type="datetime-local"
                value={rescheduleFormData.newDate}
                onChange={(e) => setRescheduleFormData(prev => ({
                  ...prev,
                  newDate: e.target.value
                }))}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <TextField
                label="Reason for Reschedule"
                multiline
                rows={3}
                value={rescheduleFormData.reason}
                onChange={(e) => setRescheduleFormData(prev => ({
                  ...prev,
                  reason: e.target.value
                }))}
                fullWidth
              />

              <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
                <Button
                  variant="outlined"
                  onClick={() => setRescheduleModalOpen(false)}
                  sx={{
                    borderColor: '#3f51b5',
                    color: '#3f51b5',
                    '&:hover': {
                      borderColor: '#303f9f',
                      backgroundColor: 'rgba(63, 81, 181, 0.04)',
                    },
                  }}
                >
                  Cancel
                </Button>
                <Button
                  variant="contained"
                  onClick={handleRescheduleSubmit}
                  sx={{
                    backgroundColor: '#3f51b5',
                    '&:hover': {
                      backgroundColor: '#303f9f',
                    },
                  }}
                >
                  Reschedule
                </Button>
              </Box>
            </Stack>
          </Box>
        </Modal>

        {/* Reschedule History Dialog */}
        <Dialog
          open={rescheduleHistoryOpen}
          onClose={handleCloseRescheduleHistory}
          maxWidth="sm"
          fullWidth
        >
          <DialogTitle sx={{ 
            backgroundColor: '#3f51b5', 
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <AccessTimeIcon /> Reschedule History
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            {selectedRescheduleHistory && (
              <Stack spacing={2}>
                {selectedRescheduleHistory.map((date, index) => (
                  <Paper
                    key={index}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: '1px solid #e0e0e0',
                      borderRadius: 1,
                      '&:hover': {
                        backgroundColor: 'rgba(63, 81, 181, 0.04)',
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                      <AccessTimeIcon sx={{ color: '#3f51b5', fontSize: '1.2rem' }} />
                      <Typography variant="subtitle1" sx={{ color: '#3f51b5', fontWeight: 'medium' }}>
                        {new Date(date.date).toLocaleDateString('en-US', {
                          weekday: 'long',
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Typography>
                    </Box>
                    {date.reason && (
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                        <Typography variant="subtitle2" sx={{ color: '#666', minWidth: '60px' }}>
                          Reason:
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#333' }}>
                          {date.reason}
                        </Typography>
                      </Box>
                    )}
                  </Paper>
                ))}
              </Stack>
            )}
          </DialogContent>
          <DialogActions>
            <Button 
              onClick={handleCloseRescheduleHistory}
              variant="contained"
              sx={{
                backgroundColor: '#3f51b5',
                '&:hover': {
                  backgroundColor: '#303f9f',
                }
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>
      </div>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleCloseSnackbar}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default JobListWithCandidates;

