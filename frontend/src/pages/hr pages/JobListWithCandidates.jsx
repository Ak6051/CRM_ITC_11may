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
import EditIcon from "@mui/icons-material/Edit";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import { API_BASE_URL } from "../../config/api.config";
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import WorkIcon from '@mui/icons-material/Work';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import InputAdornment from '@mui/material/InputAdornment';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';

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
  const [editCandidateModalOpen, setEditCandidateModalOpen] = useState(false);
  const [resumeFile, setResumeFile] = useState(null);
  const [agreementFile, setAgreementFile] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [editFormData, setEditFormData] = useState({
    interviewDate: '',
    selectionStatus: '',
    selectionDate: '',
    salaryOffered: '',
    offerStatus: '',
    offerLetter: null,
    lineupStatus: '',
    joiningDate: '',
    candidateRemarks: ''
  });
  const [offerLetterFile, setOfferLetterFile] = useState(null);

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
    if (['interviewDate', 'selectionStatus', 'selectionDate', 'salaryOffered', 'offerStatus', 'lineupStatus', 'joiningDate', 'candidateRemarks'].includes(field)) {
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

      if (!updatedData || Object.keys(updatedData).length === 0) {
        setSnackbar({
          open: true,
          message: 'No changes to save',
          severity: 'info'
        });
        return;
      }


      const response = await axios.put(
        `${API_BASE_URL}/add/candidates/${candidateId}`,
        updatedData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );


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
        const res = await axios.get(`${API_BASE_URL}/add/jobs/${selectedJob._id}/candidates`, {
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
          `${API_BASE_URL}/candidates/${id}`,
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
        const res = await axios.get(`${API_BASE_URL}/add/jobs/${selectedJob._id}/candidates`, {
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
      const res = await axios.get(`${API_BASE_URL}/add/jobs`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
      const res = await axios.get(`${API_BASE_URL}/add/jobs/${job._id}/candidates`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
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
      selectionStatus: candidate.selectionStatus || '',
      selectionDate: candidate.selectionDate || '',
      salaryOffered: candidate.salaryOffered || '',
      offerStatus: candidate.offerStatus || '',
      offerLetter: candidate.offerLetter || null,
      lineupStatus: candidate.lineupStatus || '',
      joiningDate: candidate.joiningDate || '',
      candidateRemarks: candidate.candidateRemarks || ''
    });
    setOfferLetterFile(null);
    setEditModalOpen(true);
  };

  const handleEditFormChange = (field, value) => {
    setEditFormData(prev => ({
      ...prev,
      [field]: value,
      ...(field === 'candidateAgreement' ? { candidateAgreement: value } : {})
    }));
  };

  const handleEditSubmit = async () => {
    if (!selectedCandidate) return;

    // Check if lineupStatus is being set to 'Completed'
    if (editFormData.lineupStatus === 'Completed') {
      // Check if all required fields are filled (either in form or in existing data)
      const hasInterviewDate = editFormData.interviewDate || selectedCandidate.interviewDate;
      const hasSelectionDate = editFormData.selectionDate || selectedCandidate.selectionDate;
      const hasSalaryOffered = editFormData.salaryOffered || selectedCandidate.salaryOffered;
      const hasOfferStatus = editFormData.offerStatus || selectedCandidate.offerStatus;
      const hasJoiningDate = editFormData.joiningDate || selectedCandidate.joiningDate;

      if (!hasInterviewDate || !hasSelectionDate || !hasSalaryOffered || !hasOfferStatus || !hasJoiningDate) {
        setSnackbar({
          open: true,
          message: 'All fields are required when marking as Completed',
          severity: 'error'
        });
        return;
      }
    }

    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      
      // Append all form fields to formData
      Object.keys(editFormData).forEach(key => {
        if (editFormData[key] !== null && editFormData[key] !== '') {
          formData.append(key, editFormData[key]);
        }
      });

      // If a new offer letter file is selected, append it
      if (offerLetterFile) {
        formData.append('offerLetter', offerLetterFile);
      } else if (editFormData.offerLetter === null) {
        // If offer letter was removed
        formData.append('offerLetter', '');
      }

      const response = await axios.put(
        `${API_BASE_URL}/add/candidates/${selectedCandidate._id}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data'
          },
        }
      );

      // Update the local state with the updated candidate data
      const updatedCandidates = candidates.map(candidate =>
        candidate._id === selectedCandidate._id
          ? { 
              ...candidate, 
              ...editFormData,
              // Update offerLetter with the new URL if it was uploaded
              offerLetter: response.data.offerLetter || candidate.offerLetter
            }
          : candidate
      );
      setCandidates(updatedCandidates);

      // Reset the file input
      setOfferLetterFile(null);
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
        message: error.response?.data?.message || 'Failed to update candidate details. Please try again.',
        severity: 'error'
      });
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

      // Create a modified request payload that includes the candidate's ID
      // This ensures we're creating a new reschedule entry rather than updating existing ones
      const requestPayload = {
        ...rescheduleFormData,
        candidateId: selectedCandidate._id,
        // Include a timestamp to ensure uniqueness
        timestamp: new Date().toISOString(),
        // If this is a reschedule of a reschedule, preserve the original interview date
        preserveOriginalDate: true
      };

      const response = await axios.post(
        `${API_BASE_URL}/add/candidates/${selectedCandidate._id}/reschedule`,
        requestPayload,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        }
      );

      // Close the modal
      setRescheduleModalOpen(false);

      // Show success message
      setSnackbar({
        open: true,
        message: 'Interview rescheduled successfully!',
        severity: 'success'
      });

      // Refresh the candidate list to show the new reschedule entry
      if (selectedJob) {
        // Use the existing handleOpenModal function to refresh the data
        await handleOpenModal(selectedJob);
      }
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

  const updateCandidateDetails = async (candidateId, updatedData) => {
    try {
      const token = sessionStorage.getItem("token");
      
      // Create FormData to handle file upload
      const formData = new FormData();
      
      // Add all form data fields
      Object.keys(updatedData).forEach(key => {
        if (key !== 'resumeLink') {
          formData.append(key, updatedData[key]);
        }
      });
      
      // Add resume file if selected
      if (resumeFile) {
        formData.append('resume', resumeFile);
      }
      
      const response = await axios.put(
        `${API_BASE_URL}/fetch/candidate/${candidateId}`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: 'Candidate details updated successfully!',
          severity: 'success'
        });
        return response.data.data;
      } else {
        throw new Error(response.data.message || 'Failed to update candidate');
      }
    } catch (error) {
      console.error('Failed to update candidate details:', error);
      setSnackbar({
        open: true,
        message: error.response?.data?.message || 'Failed to update candidate details',
        severity: 'error'
      });
      throw error;
    }
  };

  const handleEditCandidateSubmit = async () => {
    if (!selectedCandidate) return;

    try {
      const updatedCandidate = await updateCandidateDetails(selectedCandidate._id, editFormData);
      
      // Update the candidates array with the updated data
      setCandidates(prevCandidates => 
        prevCandidates.map(candidate => 
          candidate._id === selectedCandidate._id ? updatedCandidate : candidate
        )
      );
      
      setEditCandidateModalOpen(false);
      setSelectedCandidate(null);
    } catch (error) {
      // Error is already handled in updateCandidateDetails
    }
  };

  const handleResumeFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (PDF + Images only)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message: 'Please upload a valid file type (PDF, DOC, DOCX, JPG, PNG, GIF)',
          severity: 'error'
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'File size should be less than 5MB',
          severity: 'error'
        });
        return;
      }

      setResumeFile(file);
    }
  };

  const handleAgreementFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type (PDF + Images only)
      const validTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(file.type)) {
        setSnackbar({
          open: true,
          message: 'Please upload a valid file type (PDF, DOC, DOCX, JPG, PNG, GIF)',
          severity: 'error'
        });
        return;
      }

      // Validate file size (5MB max)
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'File size should be less than 5MB',
          severity: 'error'
        });
        return;
      }

      setAgreementFile(file);
    }
  };
  

  const handleEditCandidateClick = (candidate) => {
    setSelectedCandidate(candidate);
    setEditFormData({
      candidateName: candidate.candidateName || '',
      candidateEmail: candidate.candidateEmail || '',
      candidatePhone: candidate.candidatePhone || '',
      qualification: candidate.qualification || '',
      positionName: candidate.positionName || '',
      experience: candidate.experience || '',
      currentLocation: candidate.currentLocation || '',
      currentPosition: candidate.currentPosition || '',
      currentCTC: candidate.currentCTC || '',
      expectedCTC: candidate.expectedCTC || '',
      noticePeriod: candidate.noticePeriod || '',
      reasonforLeaving: candidate.reasonforLeaving || '',
      currentCompany: candidate.currentCompany || '',
      remark: candidate.remark || '',
      resumeLink: candidate.resumeLink || ''
    });
    setResumeFile(null); // Reset resume file when opening new candidate
    setEditCandidateModalOpen(true);
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
      field: "jobTiming",
      headerName: "Job Timing",
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
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              color: '#3f51b5',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "candidatePhone",
      headerName: "Phone",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "qualification",
      headerName: "Qualification",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "positionName",
      headerName: "Position",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "experience",
      headerName: "Experience",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "currentLocation",
      headerName: "Location",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "currentCTC",
      headerName: "CTC",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "expectedCTC",
      headerName: "CTC",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "noticePeriod",
      headerName: "Notice Period",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "reasonforLeaving",
      headerName: "Reason for Leaving",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "currentCompany",
      headerName: "Current Company",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              fontWeight: 'medium',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
      )
    },
    {
      field: "remark",
      headerName: "Remark",
      flex: 1.5,
      editable: false,
      renderCell: (params) => (
        <Box sx={{ width: '100%' }}>
          <Typography 
            noWrap
            title={params.value || ''}
            sx={{
              color: params.value && params.value.toLowerCase().includes('selected') ? '#4caf50' :
                params.value && params.value.toLowerCase().includes('rejected') ? '#f44336' :
                  '#757575',
              width: '100%',
              '&:hover': {
                overflow: 'visible',
                whiteSpace: 'normal',
                position: 'absolute',
                zIndex: 1,
                backgroundColor: 'background.paper',
                p: 1,
              }
            }}
          >
            {params.value || 'N/A'}
          </Typography>
        </Box>
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
      field: "selectionStatus",
      headerName: "Selection Status",
      flex: 1.5,
      editable: true,
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
      field: "selectionDate",
      headerName: "Selection Date",
      flex: 1.5,
      editable: true,
      renderCell: (params) => {
        const date = params.row.selectionDate ? new Date(params.row.selectionDate) : null;
        return (
          <Typography>
            {date ? date.toLocaleDateString() : 'Not Set'}
          </Typography>
        );
      }
    },
    {
      field: "salaryOffered",
      headerName: "Salary Offered",
      flex: 1.5,
      editable: true,
      renderCell: (params) => (
        <Typography>
          {params.value || 'Not Set'}
        </Typography>
      )
    },
    
    {
      field: "offerStatus",
      headerName: "Offer Status",
      flex: 1.5,
      editable: true,
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
      flex: 3, // Increased flex value to give more space
      width: 300, // Set a minimum width
      minWidth: 250, // Ensure it doesn't get too small
      editable: false,
      renderCell: (params) => {
        if (params.row.type === "reschedule") {
          return (
            <Box sx={{ width: '100%', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              <Typography
                sx={{
                  fontStyle: 'italic',
                  color: '#555',
                  whiteSpace: 'normal', // Allow text to wrap
                  lineHeight: '1.2',
                  display: '-webkit-box',
                  WebkitLineClamp: 3, // Show up to 3 lines
                  WebkitBoxOrient: 'vertical',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis'
                }}
              >
                {params.row.reason || "N/A"}
              </Typography>
            </Box>
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
      field: "offerLetter",
      headerName: "Offer Letter",
      flex: 1.9,
      editable: false,
      renderCell: (params) => {
        const offerLetterUrl = params.value && params.value !== "No Offer Letter" ? params.value : null;

        return offerLetterUrl ? (
          <Button
            variant="outlined"
            size="small"
            href={offerLetterUrl}
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
            View Offer Letter
          </Button>
        ) : (
          <Typography sx={{ color: '#9e9e9e' }}>N/A</Typography>
        );
      },
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
      field :"editCandidate",
      headerName: "Edit Candidate",
      flex: 1,
      editable: false,
      renderCell: (params) => (
        <Button
          variant="contained"
          size="small"
          onClick={(event) => {
            event.stopPropagation();
            handleEditCandidateClick(params.row);
          }}
          sx={{
            backgroundColor: '#3f51b5',
            '&:hover': {
              backgroundColor: '#303f9f',
            },
            minWidth: '100px',
            fontSize: '0.7rem'
          }}
        >
          Edit Details
        </Button>
      )
    },


    {
      field: "actions",
      headerName: "Actions",
      flex: 2.0,
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
              fontSize: '0.7rem'
            }}
          >
            Add Details
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

          <div style={{ height: 'calc(100vh - 220px)', width: '100%' }}>
            <DataGrid
              rows={jobs}
              columns={jobColumns}
              getRowId={(row) => row._id}
              pageSize={10}
              rowsPerPageOptions={[10, 25, 50]}
              disableSelectionOnClick
              sx={{
                border: 'none',
                '& .MuiDataGrid-cell': {
                  borderColor: '#e0e0e0',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                },
                '& .MuiDataGrid-columnHeaders': {
                  backgroundColor: '#f5f5f5',
                  borderColor: '#e0e0e0',
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
                  overflowY: 'auto',
                  '&::-webkit-scrollbar': {
                    width: '8px',
                  },
                  '&::-webkit-scrollbar-track': {
                    background: '#f1f1f1',
                  },
                  '&::-webkit-scrollbar-thumb': {
                    background: '#888',
                    borderRadius: '4px',
                  },
                  '&::-webkit-scrollbar-thumb:hover': {
                    background: '#555',
                  },
                },
                '& .MuiDataGrid-footerContainer': {
                  borderTop: '1px solid #e0e0e0',
                  backgroundColor: '#f5f5f5',
                  position: 'sticky',
                  bottom: 0,
                  zIndex: 1,
                },
              }}
            />
          </div>
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

                <div style={{ height: 'calc(100vh - 400px)', width: '100%' }}>
                  <DataGrid
                    rows={candidates}
                    columns={candidateColumns.map((col) => ({
                      ...col,
                      flex: col.field === "rescheduleReason" ? col.flex : undefined,
                      minWidth: col.minWidth || 150,
                      width: col.width || 150,
                    }))}
                    getRowId={(row) => row.uniqueEntryId || row._id}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    disableSelectionOnClick
                    density="compact"
                    getRowHeight={() => 'auto'}
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
                        padding: '12px 16px',
                      },
                      '& .MuiDataGrid-row': {
                        '&:hover': {
                          backgroundColor: 'rgba(63, 81, 181, 0.04)',
                        },
                      },
                      '& .MuiDataGrid-columnHeaders': {
                        backgroundColor: '#f5f5f5',
                        fontWeight: 'bold',
                        position: 'sticky',
                        top: 0,
                        zIndex: 1,
                      },
                      '& .MuiDataGrid-virtualScroller': {
                        '&::-webkit-scrollbar': {
                          width: '8px',
                          height: '8px',
                        },
                        '&::-webkit-scrollbar-track': {
                          background: '#f1f1f1',
                        },
                        '&::-webkit-scrollbar-thumb': {
                          background: '#888',
                          borderRadius: '4px',
                        },
                        '&::-webkit-scrollbar-thumb:hover': {
                          background: '#555',
                        },
                      },
                      '& .MuiDataGrid-footerContainer': {
                        borderTop: '1px solid #e0e0e0',
                        backgroundColor: '#f5f5f5',
                        position: 'sticky',
                        bottom: 0,
                        zIndex: 1,
                      },
                      '& .MuiDataGrid-toolbarContainer': {
                        padding: '8px',
                        backgroundColor: '#f5f5f5',
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
                </div>
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
                label="Salary Offered"
                placeholder="e.g. 20000, 10k per month, Negotiable"
                value={editFormData.salaryOffered}
                onChange={(e) => handleEditFormChange('salaryOffered', e.target.value)}
                fullWidth
              />

              <TextField
                select
                label="Offer Status"
                value={editFormData.offerStatus}
                onChange={(e) => handleEditFormChange('offerStatus', e.target.value)}
                fullWidth
              >
                {['Rejected','Accepted', 'Offered', 'Not Offered'].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>


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
                select
                label="Selection Status"
                value={editFormData.selectionStatus}
                onChange={(e) => handleEditFormChange('selectionStatus', e.target.value)}
                fullWidth
              >
                {['Yes', 'No'].map((option) => (
                  <MenuItem key={option} value={option}>
                    {option}
                  </MenuItem>
                ))}
              </TextField>

              {editFormData.selectionStatus === 'Yes' && (
                <TextField
                  label="Selection Date"
                  type="date"
                  value={editFormData.selectionDate}
                  onChange={(e) => handleEditFormChange('selectionDate', e.target.value)}
                  InputLabelProps={{ shrink: true }}
                  fullWidth
                />
              )}

              <TextField
                label="Joining Date"
                type="date"
                value={editFormData.joiningDate}
                onChange={(e) => handleEditFormChange('joiningDate', e.target.value)}
                InputLabelProps={{ shrink: true }}
                fullWidth
              />

              <Box>
                <Typography variant="subtitle2" gutterBottom>
                  Offer Letter
                </Typography>
                {editFormData.offerLetter && !offerLetterFile && (
                  <Box sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <a 
                      href={editFormData.offerLetter} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      style={{ color: '#1976d2', textDecoration: 'none' }}
                    >
                      View Current Offer Letter
                    </a>
                    <Button 
                      size="small" 
                      color="error"
                      onClick={() => handleEditFormChange('offerLetter', null)}
                    >
                      Remove
                    </Button>
                  </Box>
                )}
                <input
                  accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }}
                  id="offer-letter-upload"
                  type="file"
                  onChange={(e) => {
                    if (e.target.files.length > 0) {
                      setOfferLetterFile(e.target.files[0]);
                      handleEditFormChange('offerLetter', e.target.files[0].name);
                    }
                  }}
                />
                <label htmlFor="offer-letter-upload">
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    startIcon={<CloudUploadIcon />}
                  >
                    {offerLetterFile ? offerLetterFile.name : 'Upload Offer Letter'}
                  </Button>
                </label>
                <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                  Supported formats: PDF, DOC, DOCX
                </Typography>
              </Box>

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

        {/* Edit Candidate Details Dialog */}
        <Dialog
          open={editCandidateModalOpen}
          onClose={() => setEditCandidateModalOpen(false)}
          fullWidth
          maxWidth="md"
        >
          <DialogTitle sx={{
            backgroundColor: '#3f51b5',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1
          }}>
            <EditIcon /> 
          </DialogTitle>
          <DialogContent sx={{ mt: 2 }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Candidate Name"
                  value={editFormData.candidateName}
                  onChange={(e) => handleEditFormChange('candidateName', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Candidate Email"
                  value={editFormData.candidateEmail}
                  onChange={(e) => handleEditFormChange('candidateEmail', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Candidate Phone"
                  value={editFormData.candidatePhone}
                  onChange={(e) => handleEditFormChange('candidatePhone', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Qualification"
                  value={editFormData.qualification}
                  onChange={(e) => handleEditFormChange('qualification', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Position Name"
                  value={editFormData.positionName}
                  onChange={(e) => handleEditFormChange('positionName', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Experience"
                  value={editFormData.experience}
                  onChange={(e) => handleEditFormChange('experience', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Location"
                  value={editFormData.currentLocation}
                  onChange={(e) => handleEditFormChange('currentLocation', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Position"
                  value={editFormData.currentPosition}
                  onChange={(e) => handleEditFormChange('currentPosition', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current CTC"
                  value={editFormData.currentCTC}
                  onChange={(e) => handleEditFormChange('currentCTC', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Expected CTC"
                  value={editFormData.expectedCTC}
                  onChange={(e) => handleEditFormChange('expectedCTC', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Notice Period"
                  value={editFormData.noticePeriod}
                  onChange={(e) => handleEditFormChange('noticePeriod', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Reason for Leaving"
                  value={editFormData.reasonforLeaving}
                  onChange={(e) => handleEditFormChange('reasonforLeaving', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Current Company"
                  value={editFormData.currentCompany}
                  onChange={(e) => handleEditFormChange('currentCompany', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  label="Remark"
                  value={editFormData.remark}
                  onChange={(e) => handleEditFormChange('remark', e.target.value)}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  <AttachFileIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Resume
                </Typography>
                
                {/* Current Resume Display */}
                {editFormData.resumeLink && (
                  <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Current Resume:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <AttachFileIcon fontSize="small" />
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {editFormData.resumeLink.split('/').pop() || 'Current Resume'}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => window.open(editFormData.resumeLink, '_blank')}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                )}
                
                {/* New Resume Upload */}
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 1, p: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                  <input
                    type="file"
                    id="resume-upload"
                    accept=".pdf,.doc,.docx,image/jpeg,image/png,image/jpg,image/gif"
                    onChange={handleResumeFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="resume-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      sx={{ mb: 1 }}
                    >
                      Choose New Resume
                    </Button>
                  </label>
                  
                  {resumeFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="success.main">
                        ✓ {resumeFile.name} selected
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {(resumeFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    Supported formats: PDF, Images (JPG, PNG, GIF) (Max 5MB)
                  </Typography>
                </Box>
              </Grid>

              {/* Candidate Agreement Upload */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" gutterBottom>
                  <DescriptionIcon sx={{ mr: 1, verticalAlign: 'middle' }} />
                  Candidate Agreement
                </Typography>
                
                {/* Current Agreement Display */}
                {editFormData.candidateAgreement && (
                  <Box sx={{ mb: 2, p: 2, border: '1px solid #ddd', borderRadius: 1, bgcolor: '#f9f9f9' }}>
                    <Typography variant="body2" color="textSecondary" gutterBottom>
                      Current Agreement:
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon fontSize="small" />
                      <Typography variant="body2" sx={{ flexGrow: 1 }}>
                        {editFormData.candidateAgreement.split('/').pop() || 'Current Agreement'}
                      </Typography>
                      <Button
                        size="small"
                        variant="outlined"
                        startIcon={<VisibilityIcon />}
                        onClick={() => window.open(editFormData.candidateAgreement, '_blank')}
                      >
                        View
                      </Button>
                    </Box>
                  </Box>
                )}
                
                {/* New Agreement Upload */}
                <Box sx={{ border: '2px dashed #ccc', borderRadius: 1, p: 3, textAlign: 'center', bgcolor: '#fafafa' }}>
                  <input
                    type="file"
                    id="agreement-upload"
                    accept=".pdf,.doc,.docx,image/jpeg,image/png,image/jpg,image/gif"
                    onChange={handleAgreementFileChange}
                    style={{ display: 'none' }}
                  />
                  <label htmlFor="agreement-upload">
                    <Button
                      variant="outlined"
                      component="span"
                      startIcon={<CloudUploadIcon />}
                      sx={{ mb: 1 }}
                    >
                      {editFormData.candidateAgreement ? 'Change Agreement' : 'Upload Agreement'}
                    </Button>
                  </label>
                  
                  {agreementFile && (
                    <Box sx={{ mt: 2 }}>
                      <Typography variant="body2" color="success.main">
                        ✓ {agreementFile.name} selected
                      </Typography>
                      <Typography variant="caption" color="textSecondary">
                        {(agreementFile.size / 1024 / 1024).toFixed(2)} MB
                      </Typography>
                    </Box>
                  )}
                  
                  <Typography variant="caption" color="textSecondary" display="block" sx={{ mt: 1 }}>
                    Supported formats: PDF, Images (JPG, PNG, GIF) (Max 5MB)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button
              onClick={() => setEditCandidateModalOpen(false)}
              variant="outlined"
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditCandidateSubmit}
              variant="contained"
              sx={{
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#388e3c',
                },
              }}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

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

