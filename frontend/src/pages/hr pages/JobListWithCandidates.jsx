
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
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
  Stack,
  Snackbar,
  Alert,
  TextField,
  MenuItem,
  Tooltip,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import { Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import EditIcon from "@mui/icons-material/Edit";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import axios from "axios";
import { API_BASE_URL } from "../../config/api.config";
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import WorkIcon from '@mui/icons-material/Work';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import BusinessIcon from '@mui/icons-material/Business';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import PeopleIcon from '@mui/icons-material/People';
import CurrencyRupeeIcon from '@mui/icons-material/CurrencyRupee';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import DescriptionIcon from '@mui/icons-material/Description';
import EventNoteIcon from '@mui/icons-material/EventNote';
import BadgeIcon from '@mui/icons-material/Badge';
import CloseIcon from '@mui/icons-material/Close';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import AssignmentIndIcon from '@mui/icons-material/AssignmentInd';
import CalendarMonthIcon from '@mui/icons-material/CalendarMonth';
import PersonEditIcon from '@mui/icons-material/ManageAccounts';
import PlaylistAddIcon from '@mui/icons-material/PlaylistAdd';
import EventRepeatIcon from '@mui/icons-material/EventRepeat';
import PersonRemoveIcon from '@mui/icons-material/PersonRemove';
import PictureAsPdfIcon from '@mui/icons-material/PictureAsPdf';
import WhatsAppIcon from '@mui/icons-material/WhatsApp';

const modalStyle = {
  position: "absolute",
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "100%",
  maxWidth: "1800px",
  bgcolor: "background.paper",
  boxShadow: "0 24px 64px rgba(63,81,181,0.18)",
  p: 3,
  borderRadius: 3,
  maxHeight: "100vh",
  height: "98vh",
  display: "flex",
  flexDirection: "column",
  overflow: "auto",
  border: "1px solid #e8eaf6",
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
  const [hrUsers, setHrUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [autoOpenAddDetails, setAutoOpenAddDetails] = useState(false);

  // ── WhatsApp Interview Call Letter Dialog ───────────────────────────────────
  const [waOpen, setWaOpen]           = useState(false);
  const [waRow, setWaRow]             = useState(null);   // candidate row
  const [waMessage, setWaMessage]     = useState('');
  const [senderName, setSenderName]   = useState('');
  const [senderPhone, setSenderPhone] = useState('');

  // Fetch logged-in HR name + phone once
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: token },
        });
        const { firstName = '', lastName = '', phoneNumber = '' } = res.data || {};
        const name = `${firstName} ${lastName}`.trim();
        if (name) setSenderName(name);
        if (phoneNumber) setSenderPhone(phoneNumber);
      } catch (e) { /* silent */ }
    };
    fetchProfile();
  }, []);

  const buildInterviewMessage = (row, job, hrName, hrPhone) => {
    // Pull interview details from latest round if available
    const rounds = row.interviewRounds;
    const latest = rounds && rounds.length > 0 ? rounds[rounds.length - 1] : null;

    const interviewDate = latest?.roundDate
      ? new Date(latest.roundDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : row.internalInterviewDate
      ? new Date(row.internalInterviewDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
      : '[Date]';

    const interviewTime  = latest?.roundTime         || '[Time]';
    const interviewMode  = latest?.interviewMode     || 'Face To Face';
    const interviewer    = latest?.interviewedByWhom || row.interviewByWhom || '[Interviewer Name]';

    const companyName    = job?.companyName    || '[Company Name]';
    const designation    = row.positionName    || job?.jobTitle || '[Designation]';
    const companyAddress = job?.companyAddress || job?.jobLocation || '[Company Address]';
    const websiteURL     = job?.websiteURL     || '[Website]';
    const gpsLocation    = job?.gpsLocation    || '';

    return (
`Subject: Interview Call Letter

Dear ${row.candidateName || 'Not Provided'},

Greetings from Ideal Talent Connect Pvt. Ltd. 

We are pleased to inform you that your profile has been shortlisted for the position of ${designation} at our company.

You are requested to attend the interview as per the details mentioned below:

Company Name: ${companyName}
Website: ${websiteURL}
Interview Date: ${interviewDate }
Interview Time: ${interviewTime }
Interview Mode: ${interviewMode}
Interview Location: ${companyAddress }
Interviewer: ${interviewer}${gpsLocation ? `\n GPS Location: ${gpsLocation}` : ''}

Please carry the following documents:
• Updated Resume
• Passport Size Photograph
• Educational Certificates
• Salary Slip / Bank Statement
• ID Proof

Kindly confirm your availability for the interview.

We look forward to meeting you.

Best Regards,
${hrName || '[HR Name]'}${hrPhone ? `\n📞 ${hrPhone}` : ''}
Ideal Talent Connect Pvt. Ltd.`
    );
  };

  const openWaDialog = (row) => {
    const msg = buildInterviewMessage(row, selectedJob, senderName, senderPhone);
    setWaRow(row);
    setWaMessage(msg);
    setWaOpen(true);
  };

  const sendWaMessage = () => {
    if (!waRow?.candidatePhone) return;
    const url = `https://wa.me/${waRow.candidatePhone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
    setWaOpen(false);
  };

  // ── Remove candidate from position ─────────────────────────────────────────
  const [removeConfirmOpen, setRemoveConfirmOpen] = useState(false);
  const [candidateToRemove, setCandidateToRemove] = useState(null);

  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const [editFormData, setEditFormData] = useState({
    // legacy
    interviewDate: '', selectionStatus: '', selectionDate: '',
    salaryOffered: '', offerStatus: '', offerLetter: null,
    candidateRemarks: '',
    // 16 new fields
    internalInterviewDate: '',
    interviewByWhom: '',
    candidateReview: '',
    candidateRemark: '',
    resumeSubmitDate: '',
    lineupStatus: '',
    remarks1: '',
    interviewRounds: [{ roundName: 'Round 1', roundDate: '', roundTime: '', interviewMode: 'Face To Face', interviewedByWhom: '' }],
    interviewStatus: '',
    trailDays: '',
    remarks2: '',
    offeredSalary: '',
    offeredStatus: '',
    remarks3: '',
    joiningDateStatus: '',
    joiningDate: '',
    hasJoined: '',
  });
  const [offerLetterFile, setOfferLetterFile] = useState(null);
  // ── Wizard step tracking for Add Details modal ────────────────────────────
  const [activeStep, setActiveStep] = useState(0);

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

  const handleOpenModal = async (job, autoOpenDetails = false) => {
    try {
      const token = sessionStorage.getItem("token");
      setSelectedJob(job);
      const res = await axios.get(`${API_BASE_URL}/add/jobs/${job._id}/candidates`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setSelectedJob(res.data.job);
      const loadedCandidates = res.data.candidates;
      setCandidates(loadedCandidates);
      setModalOpen(true);

      // If auto-open requested, open Add Details for the first candidate
      if (autoOpenDetails && loadedCandidates.length > 0) {
        setTimeout(() => {
          handleEditClick(loadedCandidates[0]);
        }, 400);
      }
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
    const fmt = (d) => d ? new Date(d).toISOString().split('T')[0] : '';
    setEditFormData({
      interviewDate:         fmt(candidate.interviewDate),
      selectionStatus:       candidate.selectionStatus       || '',
      selectionDate:         fmt(candidate.selectionDate),
      salaryOffered:         candidate.salaryOffered         || '',
      offerStatus:           candidate.offerStatus           || '',
      offerLetter:           candidate.offerLetter           || null,
      candidateRemarks:      candidate.candidateRemarks      || '',
      // 16 new
      internalInterviewDate: fmt(candidate.internalInterviewDate),
      interviewByWhom:       candidate.interviewByWhom?._id  || candidate.interviewByWhom || '',
      candidateReview:       candidate.candidateReview       || '',
      candidateRemark:       candidate.candidateRemark       || '',
      resumeSubmitDate:      fmt(candidate.resumeSubmitDate),
      lineupStatus:          candidate.lineupStatus          || '',
      remarks1:              candidate.remarks1              || '',
      interviewRounds:       candidate.interviewRounds?.length
        ? candidate.interviewRounds.map(r => ({
            roundName:         r.roundName         || 'Round 1',
            roundDate:         fmt(r.roundDate),
            roundTime:         r.roundTime         || '',
            interviewMode:     r.interviewMode     || 'Face To Face',
            interviewedByWhom: r.interviewedByWhom || '',
          }))
        : [{ roundName: 'Round 1', roundDate: '', roundTime: '', interviewMode: 'Face To Face', interviewedByWhom: '' }],
      interviewStatus:       candidate.interviewStatus       || '',
      trailDays:             candidate.trailDays != null ? String(candidate.trailDays) : '',
      remarks2:              candidate.remarks2              || '',
      offeredSalary:         candidate.offeredSalary         || '',
      offeredStatus:         candidate.offeredStatus         || '',
      remarks3:              candidate.remarks3              || '',
      joiningDateStatus:     candidate.joiningDateStatus     || '',
      joiningDate:           fmt(candidate.joiningDate),
      hasJoined:             candidate.hasJoined             || '',
    });
    setOfferLetterFile(null);
    setActiveStep(0);
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

      // Always send jobId so the correct CandidateApplication is updated
      if (selectedJob?._id) {
        formData.set('jobId', selectedJob._id);
      }

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

  // ── Remove candidate from position ─────────────────────────────────────────
  const handleRemoveClick = (candidate) => {
    setCandidateToRemove(candidate);
    setRemoveConfirmOpen(true);
  };

  const handleConfirmRemove = async () => {
    if (!candidateToRemove) return;
    try {
      const token = sessionStorage.getItem("token");
      const applicationId = candidateToRemove.applicationId;
      if (!applicationId) {
        setSnackbar({ open: true, message: 'Application ID not found. Cannot remove.', severity: 'error' });
        setRemoveConfirmOpen(false);
        return;
      }
      await axios.delete(`${API_BASE_URL}/applications/${applicationId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSnackbar({ open: true, message: `${candidateToRemove.candidateName || 'Candidate'} removed from this position.`, severity: 'success' });
      setRemoveConfirmOpen(false);
      setCandidateToRemove(null);
      // Refresh both: modal candidates list + job cards count
      await Promise.all([
        selectedJob ? handleOpenModal(selectedJob) : Promise.resolve(),
        fetchJobs(),
      ]);
    } catch (err) {
      setSnackbar({
        open: true,
        message: err.response?.data?.message || 'Failed to remove candidate.',
        severity: 'error',
      });
      setRemoveConfirmOpen(false);
    }
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
      
      // Add candidate agreement file if selected
      if (agreementFile) {
        formData.append('candidateAgreement', agreementFile);
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
      setResumeFile(null); // Clear resume file after successful update
      setAgreementFile(null); // Clear agreement file after successful update
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
    setEditFormData(prev => ({
      // preserve all existing fields (especially interviewRounds)
      ...prev,
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
      resumeLink: candidate.resumeLink || '',
      // ensure interviewRounds always has a valid array
      interviewRounds: prev.interviewRounds?.length
        ? prev.interviewRounds
        : [{ roundName: 'Round 1', roundDate: '', roundTime: '', interviewMode: 'Face To Face', interviewedByWhom: '' }],
    }));
    setResumeFile(null);
    setAgreementFile(null);
    setEditCandidateModalOpen(true);
  };

  useEffect(() => {
    fetchJobs();
    // Fetch HR users for Interview By Whom dropdown
    const token = sessionStorage.getItem("token");
    axios.get(`${API_BASE_URL}/hr/hr-users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setHrUsers(res.data || []))
      .catch(() => {});
  }, []);

  // ── Auto-open job modal when navigated from AllCandidateData after assign ──
  const location = useLocation();
  useEffect(() => {
    const openJobId = location.state?.openJobId;
    const openAddCandidateDialog = location.state?.openAddCandidateDialog;
    if (!openJobId || jobs.length === 0) return;
    const job = jobs.find(j => j._id === openJobId);
    if (job) {
      handleOpenModal(job, !!openAddCandidateDialog);
      // Clear state so it doesn't re-open on refresh
      window.history.replaceState({}, document.title);
    }
  }, [jobs, location.state?.openJobId]);

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
            background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
            '&:hover': {
              background: 'linear-gradient(135deg, #303f9f, #3f51b5)',
            },
            width: '100%',
            textTransform: 'none',
            borderRadius: '8px',
            fontWeight: 600,
            fontSize: '0.8rem',
            boxShadow: '0 2px 8px rgba(63,81,181,0.25)',
          }}
        >
          View Candidates ({params.row.candidateCount || 0})
        </Button>
      ),
    },
  ];


  const candidateColumns = [

  // ── Copy helpers ─────────────────────────────────────────────────────────
  // CV Copy: company name, candidate name, position, current ctc, expected ctc, notice period, experience, location
  // Interview Copy: company name, candidate name, experience, position, current ctc, expected ctc, notice period, location, interview date, interview time, interview mode, interviewer

  // ── Actions (first) ──────────────────────────────────────────────────────
    // ── CV Copy ──────────────────────────────────────────────────────────────
    {
      field: "cvCopy",
      headerName: "CV",
      width:55, sortable: false,
      renderCell: (params) => {
        const r = params.row;
        const company = selectedJob?.companyName || '—';
        const text = [
          `📋 CV Details`,
          `🏢 Company     : ${company}`,
          `👤 Name        : ${r.candidateName || '—'}`,
          `💼 Position    : ${r.positionName || '—'}`,
          `💰 Current CTC : ${r.currentCTC || '—'}`,
          `💵 Expected CTC: ${r.expectedCTC || '—'}`,
          `⏳ Notice Period: ${r.noticePeriod || '—'}`,
          `📅 Experience  : ${r.experience || '—'}`,
          `📍 Location    : ${r.currentLocation || '—'}`,
        ].join('\n');
        return (
          <Tooltip title="Copy CV Details" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(text).then(() => {
                  setSnackbar({ open: true, message: `CV details copied for ${r.candidateName || 'candidate'}`, severity: 'success' });
                }).catch(() => {
                  setSnackbar({ open: true, message: 'Failed to copy', severity: 'error' });
                });
              }}
              sx={{
                bgcolor: '#e8eaf6', color: '#3f51b5',
                '&:hover': { bgcolor: '#c5cae9' },
                borderRadius: '8px', width: 32, height: 32,
              }}
            >
              <AssignmentIndIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        );
      },
    },
    // ── Interview Copy ────────────────────────────────────────────────────────
    {
      field: "interviewCopy",
      headerName: "Interview",
      width: 60, sortable: false,
      renderCell: (params) => {
        const r = params.row;
        const company = selectedJob?.companyName || '—';
        // Use latest interview round if available
        const rounds = r.interviewRounds;
        const latestRound = rounds && rounds.length > 0 ? rounds[rounds.length - 1] : null;
        const interviewDate = latestRound?.roundDate
          ? new Date(latestRound.roundDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : r.internalInterviewDate
          ? new Date(r.internalInterviewDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
          : '—';
        const interviewTime = latestRound?.roundTime || '—';
        const interviewMode = latestRound?.interviewMode || '—';
        const interviewer   = latestRound?.interviewedByWhom || '—';

        const text = [
          `📅 Interview Details`,
          `🏢 Company      : ${company}`,
          `👤 Name         : ${r.candidateName || '—'}`,
          `📅 Experience   : ${r.experience || '—'}`,
          `💼 Position     : ${r.positionName || '—'}`,
          `💰 Current CTC  : ${r.currentCTC || '—'}`,
          `💵 Expected CTC : ${r.expectedCTC || '—'}`,
          `⏳ Notice Period : ${r.noticePeriod || '—'}`,
          `📍 Location     : ${r.currentLocation || '—'}`,
          `📆 Interview Date: ${interviewDate}`,
          `🕐 Interview Time: ${interviewTime}`,
          `🖥️  Mode          : ${interviewMode}`,
          `🧑‍💼 Interviewer   : ${interviewer}`,
        ].join('\n');
        return (
          <Tooltip title="Copy Interview Details" arrow>
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                navigator.clipboard.writeText(text).then(() => {
                  setSnackbar({ open: true, message: `Interview details copied for ${r.candidateName || 'candidate'}`, severity: 'success' });
                }).catch(() => {
                  setSnackbar({ open: true, message: 'Failed to copy', severity: 'error' });
                });
              }}
              sx={{
                bgcolor: '#e8f5e9', color: '#2e7d32',
                '&:hover': { bgcolor: '#c8e6c9' },
                borderRadius: '8px', width: 32, height: 32,
              }}
            >
              <CalendarMonthIcon sx={{ fontSize: 17 }} />
            </IconButton>
          </Tooltip>
        );
      },
    },
  
  
  {
      field: "whatsapp",
      headerName: "WA",
      width: 52, sortable: false,
      renderCell: (params) => (
        <Tooltip title={params.row.candidatePhone ? `Send Interview Call Letter via WhatsApp` : "No phone available"} arrow>
          <span>
            <IconButton
              size="small"
              disabled={!params.row.candidatePhone}
              onClick={(e) => { e.stopPropagation(); openWaDialog(params.row); }}
              sx={{
                bgcolor: params.row.candidatePhone ? '#f0fdf4' : '#f8fafc',
                color: params.row.candidatePhone ? '#22c55e' : '#cbd5e1',
                border: `1px solid ${params.row.candidatePhone ? '#bbf7d0' : '#e2e8f0'}`,
                '&:hover': { bgcolor: '#dcfce7' },
                borderRadius: '8px', width: 34, height: 34,
              }}
            >
              <WhatsAppIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </span>
        </Tooltip>
      ),
    },

  {
      field: "editCandidate",
      headerName: "Edit",
      width: 50, sortable: false,
      renderCell: (params) => (
        <Tooltip title="Edit Candidate Details" arrow>
          <IconButton
            size="small"
            onClick={(e) => { e.stopPropagation(); handleEditCandidateClick(params.row); }}
            sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', '&:hover': { bgcolor: '#c5cae9' }, borderRadius: '8px', width: 34, height: 34 }}
          >
            <PersonEditIcon sx={{ fontSize: 18 }} />
          </IconButton>
        </Tooltip>
      ),
    },

    {
      field: "actions",
      headerName: "Actions",
      width: 130, sortable: false,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center' }}>
          {/* Add Details */}
          <Tooltip title="Add Details" arrow>
            <IconButton
              size="small"
              onClick={() => handleEditClick(params.row)}
              sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', '&:hover': { bgcolor: '#c5cae9' }, borderRadius: '8px', width: 34, height: 34 }}
            >
              <PlaylistAddIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {/* Reschedule */}
          <Tooltip title="Reschedule Interview" arrow>
            <IconButton
              size="small"
              onClick={() => handleRescheduleClick(params.row)}
              sx={{ bgcolor: '#e3f2fd', color: '#0288d1', '&:hover': { bgcolor: '#b3e5fc' }, borderRadius: '8px', width: 34, height: 34 }}
            >
              <EventRepeatIcon sx={{ fontSize: 18 }} />
            </IconButton>
          </Tooltip>
          {/* Remove — only for original entries */}
          {!params.row.isRescheduleEntry && (
            <Tooltip title="Remove from Position" arrow>
              <IconButton
                size="small"
                onClick={() => handleRemoveClick(params.row)}
                sx={{ bgcolor: '#fef2f2', color: '#ef4444', '&:hover': { bgcolor: '#fee2e2' }, borderRadius: '8px', width: 34, height: 34 }}
              >
                <PersonRemoveIcon sx={{ fontSize: 18 }} />
              </IconButton>
            </Tooltip>
          )}
        </Box>
      ),
    },

    // ── Candidate Profile ────────────────────────────────────────────────────
    { field: "candidateName",    headerName: "Name",             width: 140, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap sx={{ fontWeight: 600 }}>{p.value || '—'}</Typography></Tooltip> },
    { field: "candidatePhone",   headerName: "Phone",            width: 130, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    { field: "candidateEmail",   headerName: "Email",            width: 180, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap sx={{ color: '#3f51b5' }}>{p.value || '—'}</Typography></Tooltip> },
    { field: "positionName",     headerName: "Position",         width: 150, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },
    { field: "experience",       headerName: "Experience",       width: 110, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    { field: "currentLocation",  headerName: "Location",         width: 120, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    { field: "currentPosition",  headerName: "Current Position", width: 150, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },
    { field: "currentCTC",       headerName: "Current CTC",      width: 120, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    { field: "expectedCTC",      headerName: "Expected CTC",     width: 120, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    { field: "noticePeriod",     headerName: "Notice Period",    width: 120, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    { field: "currentCompany",   headerName: "Current Company",  width: 150, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },
    { field: "qualification",    headerName: "Qualification",    width: 130, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    { field: "reasonforLeaving", headerName: "Reason for Leaving", width: 160, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },
    { field: "remark",           headerName: "Remark",           width: 140, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap sx={{ color: p.value?.toLowerCase().includes('selected') ? '#4caf50' : p.value?.toLowerCase().includes('rejected') ? '#f44336' : '#757575' }}>{p.value || '—'}</Typography></Tooltip> },

    // ── Assignment Info ──────────────────────────────────────────────────────
    {
      field: "assignedBy", headerName: "Assigned By", width: 140,
      renderCell: (p) => {
        const v = p.row.assignedBy;
        if (!v) return <Typography sx={{ color: '#9e9e9e', fontStyle: 'italic' }}>Self</Typography>;
        if (typeof v === 'object') return <Typography>{`${v.firstName || ''} ${v.lastName || ''}`.trim() || '—'}</Typography>;
        return <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },
    {
      field: "assignedAt", headerName: "Assigned At", width: 130,
      renderCell: (p) => { const d = p.row.assignedAt ? new Date(p.row.assignedAt) : null; return <Typography>{d ? d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'}</Typography>; },
    },

    // ── Internal Interview (new fields) ──────────────────────────────────────
    {
      field: "internalInterviewDate", headerName: "Internal Interview Date", width: 170,
      renderCell: (p) => { const d = p.value ? new Date(p.value) : null; return <Typography>{d ? d.toLocaleDateString('en-IN') : '—'}</Typography>; },
    },
    {
      field: "interviewByWhom", headerName: "Interview By", width: 140,
      renderCell: (p) => {
        const v = p.value;
        if (!v) return <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
        if (typeof v === 'object') return <Typography>{`${v.firstName || ''} ${v.lastName || ''}`.trim() || '—'}</Typography>;
        return <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },
    {
      field: "candidateReview", headerName: "Candidate Review", width: 140,
      renderCell: (p) => {
        const colorMap = { Green: '#4caf50', Yellow: '#ff9800', Red: '#f44336' };
        return p.value ? (
          <Chip label={p.value} size="small"
            sx={{ bgcolor: `${colorMap[p.value]}20`, color: colorMap[p.value], fontWeight: 700, border: `1px solid ${colorMap[p.value]}40` }} />
        ) : <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },
    { field: "candidateRemark", headerName: "Candidate Remark", width: 160, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },

    // ── Resume & Lineup ──────────────────────────────────────────────────────
    {
      field: "resumeSubmitDate", headerName: "Resume Submit Date", width: 160,
      renderCell: (p) => { const d = p.value ? new Date(p.value) : null; return <Typography>{d ? d.toLocaleDateString('en-IN') : '—'}</Typography>; },
    },
    {
      field: "lineupStatus", headerName: "Lineup Status", width: 130,
      renderCell: (p) => {
        const colorMap = { Shortlisted: '#3f51b5', Scheduled: '#0288d1', Completed: '#4caf50', Cancelled: '#f44336', Pending: '#ff9800' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40` }} /> : <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },
    { field: "remarks1", headerName: "Remarks 1", width: 150, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },

    // ── Interview Rounds ─────────────────────────────────────────────────────
    {
      field: "interviewRounds", headerName: "Interview Rounds", width: 160,
      renderCell: (p) => {
        const rounds = p.value;
        if (!rounds || rounds.length === 0) return <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
        const latest = rounds[rounds.length - 1];
        return (
          <Tooltip title={rounds.map(r => `${r.roundName}: ${r.roundDate ? new Date(r.roundDate).toLocaleDateString('en-IN') : 'TBD'} (${r.interviewMode})`).join('\n')}>
            <Chip label={`${rounds.length} Round${rounds.length > 1 ? 's' : ''}`} size="small"
              sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700 }} />
          </Tooltip>
        );
      },
    },

    // ── Interview Outcome ────────────────────────────────────────────────────
    {
      field: "interviewStatus", headerName: "Interview Status", width: 150,
      renderCell: (p) => {
        const colorMap = { Selected: '#4caf50', Rejected: '#f44336', 'On Hold': '#ff9800', 'On Discussion': '#0288d1', Trail: '#9c27b0' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40` }} /> : <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },
    { field: "trailDays",  headerName: "Trail Days",  width: 100, renderCell: (p) => <Typography>{p.value != null ? p.value : '—'}</Typography> },
    { field: "remarks2",   headerName: "Remarks 2",   width: 150, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },

    // ── Offer Details ────────────────────────────────────────────────────────
    { field: "offeredSalary", headerName: "Offered Salary", width: 130, renderCell: (p) => <Typography>{p.value || '—'}</Typography> },
    {
      field: "offeredStatus", headerName: "Offered Status", width: 130,
      renderCell: (p) => {
        const colorMap = { Accepted: '#4caf50', Rejected: '#f44336' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40` }} /> : <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },
    { field: "remarks3", headerName: "Remarks 3", width: 150, renderCell: (p) => <Tooltip title={p.value || ''}><Typography noWrap>{p.value || '—'}</Typography></Tooltip> },

    // ── Selection ────────────────────────────────────────────────────────────
    {
      field: "selectionStatus", headerName: "Selection Status", width: 140,
      renderCell: (p) => {
        const colorMap = { Accepted: '#4caf50', Rejected: '#f44336' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value
          ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40` }} />
          : <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },
    {
      field: "selectionDate", headerName: "Selection Date", width: 130,
      renderCell: (p) => { const d = p.value ? new Date(p.value) : null; return <Typography>{d ? d.toLocaleDateString('en-IN') : '—'}</Typography>; },
    },

    // ── Joining ──────────────────────────────────────────────────────────────
    { field: "joiningDateStatus", headerName: "Joining Status", width: 160, renderCell: (p) => <Typography noWrap>{p.value || '—'}</Typography> },
    {
      field: "joiningDate", headerName: "Joining Date", width: 130,
      renderCell: (p) => { const d = p.value ? new Date(p.value) : null; return <Typography>{d ? d.toLocaleDateString('en-IN') : '—'}</Typography>; },
    },
    {
      field: "hasJoined", headerName: "Has Joined", width: 160,
      renderCell: (p) => {
        const colorMap = { Yes: '#4caf50', No: '#f44336', Backout: '#ff5722', 'Confirmation Awaited': '#ff9800' };
        const c = colorMap[p.value] || '#9e9e9e';
        return p.value ? <Chip label={p.value} size="small" sx={{ bgcolor: `${c}20`, color: c, fontWeight: 700, border: `1px solid ${c}40` }} /> : <Typography sx={{ color: '#9e9e9e' }}>—</Typography>;
      },
    },

    // ── Reschedule Info ──────────────────────────────────────────────────────
    {
      field: "originalInterviewDate", headerName: "Original Interview Date", width: 170,
      renderCell: (p) => { const d = p.value ? new Date(p.value) : null; return <Typography>{d ? d.toLocaleDateString('en-IN') : '—'}</Typography>; },
    },
    {
      field: "rescheduleDate", headerName: "Reschedule Date", width: 150,
      renderCell: (p) => {
        if (p.row.isRescheduleEntry) { const d = p.value ? new Date(p.value) : null; return <Typography>{d ? d.toLocaleDateString('en-IN') : '—'}</Typography>; }
        return <Typography sx={{ color: '#999', fontStyle: 'italic' }}>—</Typography>;
      },
    },
    {
      field: "reason", headerName: "Reschedule Reason", width: 200,
      renderCell: (p) => {
        if (p.row.isRescheduleEntry) return <Tooltip title={p.value || ''}><Typography noWrap sx={{ fontStyle: 'italic', color: '#555' }}>{p.value || '—'}</Typography></Tooltip>;
        return <Typography sx={{ color: '#999', fontStyle: 'italic' }}>—</Typography>;
      },
    },
    {
      field: "status", headerName: "Entry Type", width: 110,
      renderCell: (p) => (
        <Chip label={p.row.isRescheduleEntry ? 'Rescheduled' : 'Original'} size="small"
          color={p.row.isRescheduleEntry ? 'secondary' : 'primary'} />
      ),
    },

    // ── Documents ────────────────────────────────────────────────────────────
    {
      field: "offerLetter", headerName: "Offer Letter", width: 140,
      renderCell: (p) => p.value ? (
        <Button variant="outlined" size="small" href={p.value} target="_blank" rel="noopener noreferrer"
          sx={{ borderColor: '#3f51b5', color: '#3f51b5', fontSize: '0.72rem', borderRadius: '6px' }}>
          View
        </Button>
      ) : <Typography sx={{ color: '#9e9e9e' }}>N/A</Typography>,
    },
    {
      field: "candidateAgreement", headerName: "Agreement", width: 130,
      renderCell: (p) => p.value ? (
        <Button variant="outlined" size="small" href={p.value} target="_blank" rel="noopener noreferrer"
          sx={{ borderColor: '#3f51b5', color: '#3f51b5', fontSize: '0.72rem', borderRadius: '6px' }}>
          View
        </Button>
      ) : <Typography sx={{ color: '#9e9e9e' }}>N/A</Typography>,
    },
    {
      field: "resumeLink", headerName: "Resume", width: 120,
      renderCell: (p) => p.value ? (
        <Button variant="outlined" size="small" href={p.value} target="_blank" rel="noopener noreferrer"
          sx={{ borderColor: '#3f51b5', color: '#3f51b5', fontSize: '0.72rem', borderRadius: '6px' }}>
          View
        </Button>
      ) : <Typography sx={{ color: '#9e9e9e' }}>N/A</Typography>,
    },
  ];

  const filteredJobs = searchQuery.trim()
    ? jobs.filter((job) => {
        const q = searchQuery.toLowerCase();
        return (
          (job.jobTitle || '').toLowerCase().includes(q) ||
          (job.companyName || '').toLowerCase().includes(q) ||
          (job.jobLocation || '').toLowerCase().includes(q) ||
          (job.experience || '').toLowerCase().includes(q) ||
          (job.salary || '').toLowerCase().includes(q) ||
          (job.jobTiming || '').toLowerCase().includes(q) ||
          (job.weekOff || '').toLowerCase().includes(q)
        );
      })
    : jobs;

  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f8', overflow: 'hidden' }}>
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
      <Box sx={{ flexGrow: 1, ml: '250px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

          {/* â”€â”€ Header Card â”€â”€ */}
          <Box sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            borderRadius: '16px',
            p: 3,
            mb: 3,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(63,81,181,0.25)',
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{
                width: 52, height: 52, borderRadius: '14px',
                bgcolor: 'rgba(255,255,255,0.18)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <WorkOutlineIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.3px">
                  Job Listings
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                  Manage job openings and their candidates
                </Typography>
              </Box>
            </Box>
            <Box sx={{
              bgcolor: 'rgba(255,255,255,0.18)',
              border: '2px solid rgba(255,255,255,0.4)',
              borderRadius: '12px', px: 2.5, py: 1, textAlign: 'center',
            }}>
              <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#fff', lineHeight: 1 }}>
                {jobs.length}
              </Typography>
              <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.8)', fontWeight: 600, mt: 0.2 }}>
                Total Jobs
              </Typography>
            </Box>
          </Box>

          {/* â”€â”€ Stats Row â”€â”€ */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            {[
              { label: 'Total Jobs', value: jobs.length, icon: <WorkOutlineIcon />, color: '#3f51b5', bg: '#e8eaf6' },
              { label: 'Companies', value: new Set(jobs.map(j => j.companyName)).size, icon: <BusinessIcon />, color: '#0288d1', bg: '#e1f5fe' },
              { label: 'Locations', value: new Set(jobs.map(j => j.jobLocation).filter(Boolean)).size, icon: <LocationOnIcon />, color: '#388e3c', bg: '#e8f5e9' },
              { label: 'Total Openings', value: jobs.reduce((s, j) => s + (Number(j.numberOfRequirements) || 0), 0), icon: <PeopleIcon />, color: '#f57c00', bg: '#fff3e0' },
            ].map(({ label, value, icon, color, bg }) => (
              <Box key={label} sx={{
                flex: '1 1 160px', minWidth: 150,
                bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '14px',
                p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
                boxShadow: '0 2px 12px rgba(63,81,181,0.07)',
              }}>
                <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color }}>
                  {React.cloneElement(icon, { fontSize: 'small' })}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#1e293b" lineHeight={1}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── Search Bar ── */}
          <Box mb={2.5}>
            <TextField
              fullWidth
              size="small"
              placeholder="Search by job title, company, location, experience, salary..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon sx={{ color: '#3f51b5', fontSize: 20 }} />
                  </InputAdornment>
                ),
                endAdornment: searchQuery ? (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => setSearchQuery('')}>
                      <CloseIcon sx={{ fontSize: 18, color: '#9e9e9e' }} />
                    </IconButton>
                  </InputAdornment>
                ) : null,
              }}
              sx={{
                bgcolor: '#fff',
                borderRadius: '12px',
                '& .MuiOutlinedInput-root': {
                  borderRadius: '12px',
                  '& fieldset': { borderColor: '#c5cae9' },
                  '&:hover fieldset': { borderColor: '#9fa8da' },
                  '&.Mui-focused fieldset': { borderColor: '#3f51b5' },
                },
              }}
            />
          </Box>

          {/* Job Cards Section header */}
          <Box sx={{
            px: 2.5, py: 1.5, mb: 2,
            background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)',
            borderRadius: '12px',
            border: '1px solid #c5cae9',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          }}>
            <Box display="flex" alignItems="center" gap={1}>
              <Box sx={{ width: 4, height: 18, bgcolor: '#3f51b5', borderRadius: 2 }} />
              <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" textTransform="uppercase" letterSpacing="0.06em">
                All Job Openings
              </Typography>
            </Box>
            <Chip
              label={`${filteredJobs.length} records`}
              size="small"
              sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700, fontSize: '0.75rem' }}
            />
          </Box>

          {/* Job Cards Grid */}
          <Grid container spacing={2.5}>
            {filteredJobs.map((job) => (
              <Grid item xs={12} sm={6} md={4} lg={3} key={job._id}>
                <Paper elevation={0} sx={{
                  border: '1px solid #e8eaf6',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  height: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  transition: 'all 0.22s ease',
                  '&:hover': {
                    boxShadow: '0 8px 32px rgba(63,81,181,0.14)',
                    borderColor: '#9fa8da',
                    transform: 'translateY(-2px)',
                  },
                }}>
                  {/* Card top accent */}
                  <Box sx={{ height: 4, background: 'linear-gradient(90deg, #3f51b5, #7986cb)' }} />

                  <Box sx={{ p: 2.5, flexGrow: 1 }}>
                    {/* Job title + company */}
                    <Box display="flex" alignItems="flex-start" justifyContent="space-between" mb={1.5}>
                      <Box sx={{ flexGrow: 1, pr: 1 }}>
                        <Typography variant="subtitle1" fontWeight={700} color="#1e293b" lineHeight={1.3}
                          sx={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {job.jobTitle}
                        </Typography>
                        <Box display="flex" alignItems="center" gap={0.5} mt={0.4}>
                          <BusinessIcon sx={{ fontSize: 13, color: '#64748b' }} />
                          <Typography variant="caption" color="text.secondary" fontWeight={500} noWrap>
                            {job.companyName}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        label={job.numberOfRequirements || 0}
                        size="small"
                        sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 800, fontSize: '0.78rem', minWidth: 32 }}
                      />
                    </Box>

                    <Divider sx={{ mb: 1.5, borderColor: '#f0f2ff' }} />

                    {/* Info rows */}
                    <Stack spacing={0.9}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <LocationOnIcon sx={{ fontSize: 14, color: '#388e3c', flexShrink: 0 }} />
                        <Typography variant="caption" color="#334155" noWrap>{job.jobLocation || '—'}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <AccessTimeIcon sx={{ fontSize: 14, color: '#f57c00', flexShrink: 0 }} />
                        <Typography variant="caption" color="#334155" noWrap>{job.jobTiming || '—'}</Typography>
                      </Box>
                      {job.weekOff && (
                        <Box display="flex" alignItems="center" gap={1}>
                          <EventNoteIcon sx={{ fontSize: 14, color: '#e53935', flexShrink: 0 }} />
                          <Typography variant="caption" color="#334155" noWrap>Week Off: {job.weekOff}</Typography>
                        </Box>
                      )}
                      <Box display="flex" alignItems="center" gap={1}>
                        <CurrencyRupeeIcon sx={{ fontSize: 14, color: '#7b1fa2', flexShrink: 0 }} />
                        <Typography variant="caption" color="#334155" noWrap>{job.salary || '—'}</Typography>
                      </Box>
                      <Box display="flex" alignItems="center" gap={1}>
                        <WorkOutlineIcon sx={{ fontSize: 14, color: '#0288d1', flexShrink: 0 }} />
                        <Typography variant="caption" color="#334155" noWrap>{job.experience || '—'}</Typography>
                      </Box>
                    </Stack>
                  </Box>

                  {/* Card footer */}
                  <Box sx={{ px: 2.5, pb: 2.5 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      onClick={() => handleOpenModal(job)}
                      startIcon={<PeopleIcon sx={{ fontSize: '16px !important' }} />}
                      sx={{
                        background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
                        '&:hover': { background: 'linear-gradient(135deg, #303f9f, #3f51b5)' },
                        borderRadius: '10px',
                        textTransform: 'none',
                        fontWeight: 700,
                        fontSize: '0.82rem',
                        py: 1,
                        boxShadow: '0 4px 12px rgba(63,81,181,0.3)',
                      }}
                    >
                      View Candidates ({job.candidateCount || 0})
                    </Button>
                  </Box>
                </Paper>
              </Grid>
            ))}

            {filteredJobs.length === 0 && (
              <Grid item xs={12}>
                <Box sx={{ textAlign: 'center', py: 8, color: '#94a3b8' }}>
                  <SearchIcon sx={{ fontSize: 56, mb: 1, opacity: 0.4 }} />
                  <Typography variant="body1" fontWeight={500}>
                    {searchQuery ? `No jobs found for "${searchQuery}"` : 'No job openings found'}
                  </Typography>
                  {searchQuery && (
                    <Button size="small" onClick={() => setSearchQuery('')}
                      sx={{ mt: 1, color: '#3f51b5', textTransform: 'none' }}>
                      Clear search
                    </Button>
                  )}
                </Box>
              </Grid>
            )}
          </Grid>
        </Box>
      </Box>

        <Modal open={modalOpen} onClose={handleCloseModal}>
          <Box sx={modalStyle}>
            {selectedJob && (
              <>
                {/* Modal Header */}
                <Box sx={{
                  background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
                  borderRadius: '12px',
                  p: 2.5,
                  mb: 2.5,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  boxShadow: '0 4px 16px rgba(63,81,181,0.2)',
                }}>
                  <Box display="flex" alignItems="center" gap={1.5}>
                    <Box sx={{
                      width: 42, height: 42, borderRadius: '10px',
                      bgcolor: 'rgba(255,255,255,0.18)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <WorkOutlineIcon sx={{ color: '#fff', fontSize: 22 }} />
                    </Box>
                    <Box>
                      <Typography variant="h6" fontWeight={800} color="#fff" lineHeight={1.2}>
                        {selectedJob.jobTitle}
                      </Typography>
                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                        {selectedJob.companyName} &bull; {selectedJob.jobLocation}
                      </Typography>
                    </Box>
                  </Box>
                  <Chip
                    label={`${candidates.length} Candidates`}
                    size="small"
                    sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 700, border: '1px solid rgba(255,255,255,0.4)' }}
                  />
                  <IconButton
                    onClick={handleCloseModal}
                    size="small"
                    sx={{
                      color: '#fff',
                      bgcolor: 'rgba(255,255,255,0.15)',
                      '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' },
                      ml: 1,
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>

                {/* Job Info Grid */}
                <Grid container spacing={1.5} mb={2}>
                  {[
                    { label: 'Job Title', value: selectedJob.jobTitle, icon: <WorkIcon fontSize="small" />, color: '#3f51b5', bg: '#e8eaf6' },
                    { label: 'Company', value: selectedJob.companyName, icon: <BusinessIcon fontSize="small" />, color: '#0288d1', bg: '#e1f5fe' },
                    { label: 'Location', value: selectedJob.jobLocation, icon: <LocationOnIcon fontSize="small" />, color: '#388e3c', bg: '#e8f5e9' },
                    { label: 'Requirements', value: selectedJob.numberOfRequirements, icon: <PeopleIcon fontSize="small" />, color: '#f57c00', bg: '#fff3e0' },
                    { label: 'Salary', value: selectedJob.salary, icon: <CurrencyRupeeIcon fontSize="small" />, color: '#7b1fa2', bg: '#f3e5f5' },
                    { label: 'Contact', value: selectedJob.contactName, icon: <BadgeIcon fontSize="small" />, color: '#0288d1', bg: '#e1f5fe' },
                    { label: 'Email', value: selectedJob.email, icon: <DescriptionIcon fontSize="small" />, color: '#388e3c', bg: '#e8f5e9' },
                    { label: 'Phone', value: selectedJob.phoneNumber, icon: <BadgeIcon fontSize="small" />, color: '#f57c00', bg: '#fff3e0' },
                    { label: 'Education', value: selectedJob.education, icon: <WorkOutlineIcon fontSize="small" />, color: '#3f51b5', bg: '#e8eaf6' },
                    { label: 'Experience', value: selectedJob.experience, icon: <AccessTimeIcon fontSize="small" />, color: '#7b1fa2', bg: '#f3e5f5' },
                    { label: 'Week Off', value: selectedJob.weekOff, icon: <EventNoteIcon fontSize="small" />, color: '#e53935', bg: '#ffebee' },
                  ].map((item, idx) => (
                    <Grid item xs={6} sm={4} md={1.2} key={idx}>
                      <Paper elevation={0} sx={{
                        p: 1.5, height: '100%',
                        border: '1px solid #e8eaf6', borderRadius: '10px',
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: '0 4px 12px rgba(63,81,181,0.12)', borderColor: '#9fa8da' }
                      }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mb: 0.5 }}>
                          <Box sx={{ color: item.color, display: 'flex' }}>{item.icon}</Box>
                          <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.68rem', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {item.label}
                          </Typography>
                        </Box>
                        <Typography variant="body2" sx={{ fontWeight: 600, fontSize: '0.8rem', color: '#1e293b' }} noWrap>
                          {item.value || 'â€”'}
                        </Typography>
                      </Paper>
                    </Grid>
                  ))}

                  {/* Job Details button */}
                  <Grid item xs={6} sm={4} md={1.2}>
                    <Paper
                      elevation={0}
                      onClick={handleOpen}
                      sx={{
                        p: 1.5, height: '100%', cursor: 'pointer',
                        border: '1px solid #c5cae9', borderRadius: '10px',
                        background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)',
                        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                        transition: 'all 0.2s',
                        '&:hover': { boxShadow: '0 4px 12px rgba(63,81,181,0.18)', borderColor: '#9fa8da', background: 'linear-gradient(135deg, #c5cae9, #e8eaf6)' }
                      }}
                    >
                      <DescriptionIcon sx={{ fontSize: 20, color: '#3f51b5' }} />
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', fontSize: '0.68rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                        Key Responsibility
                      </Typography>
                    </Paper>
                  </Grid>

                  {/* View JD PDF button — only if descriptionFile exists */}
                  {selectedJob.descriptionFile && (
                    <Grid item xs={6} sm={4} md={1.2}>
                      <Paper
                        elevation={0}
                        onClick={() => window.open(selectedJob.descriptionFile, '_blank')}
                        sx={{
                          p: 1.5, height: '100%', cursor: 'pointer',
                          border: '1px solid #fca5a5', borderRadius: '10px',
                          background: 'linear-gradient(135deg, #fff1f2, #ffe4e6)',
                          display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 0.5,
                          transition: 'all 0.2s',
                          '&:hover': { boxShadow: '0 4px 12px rgba(239,68,68,0.18)', borderColor: '#f87171', background: 'linear-gradient(135deg, #ffe4e6, #fecdd3)' }
                        }}
                      >
                        <PictureAsPdfIcon sx={{ fontSize: 20, color: '#ef4444' }} />
                        <Typography variant="caption" sx={{ fontWeight: 700, color: '#ef4444', fontSize: '0.68rem', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                          View JD
                        </Typography>
                      </Paper>
                    </Grid>
                  )}
                </Grid>

                {/* Combined Dialog: Key Responsibilities + Job Description */}
                <Dialog open={open} onClose={handleClose} fullWidth maxWidth="md">
                  <DialogTitle sx={{
                    background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
                    color: '#fff', fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    py: 1.5, px: 2.5,
                  }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <DescriptionIcon sx={{ fontSize: 20 }} />
                      <Typography variant="h6" fontWeight={700} fontSize="1rem">
                        Key Responsibility
                      </Typography>
                    </Box>
                    <IconButton size="small" onClick={handleClose}
                      sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                      <CloseIcon fontSize="small" />
                    </IconButton>
                  </DialogTitle>
                  <DialogContent dividers sx={{ p: 0 }}>
                    <Box sx={{ p: 2.5, borderBottom: '1px solid #e8eaf6' }}>
                      <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                        Key Responsibilities
                      </Typography>
                      <Typography variant="body2" sx={{ fontSize: '0.85rem', color: '#334155', lineHeight: 1.8, whiteSpace: 'pre-line' }}>
                        {selectedJob.keyResponsibility || '—'}
                      </Typography>
                    </Box>
                   
                  </DialogContent>
                  <DialogActions sx={{ p: 2, bgcolor: '#f5f6ff' }}>
                    <Button onClick={handleClose} variant="contained"
                      sx={{ bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' }, borderRadius: '8px', textTransform: 'none', fontWeight: 600 }}>
                      Close
                    </Button>
                  </DialogActions>
                </Dialog>

                {/* Candidates Section Header */}
                <Box sx={{
                  px: 2, py: 1.5,
                  background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)',
                  borderRadius: '10px 10px 0 0',
                  border: '1px solid #c5cae9',
                  borderBottom: 'none',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}>
                  <Box display="flex" alignItems="center" gap={1}>
                    <Box sx={{ width: 4, height: 18, bgcolor: '#3f51b5', borderRadius: 2 }} />
                    <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" textTransform="uppercase" letterSpacing="0.06em">
                      Candidates
                    </Typography>
                  </Box>
                  <Chip
                    label={`${candidates.length} records`}
                    size="small"
                    sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700, fontSize: '0.75rem' }}
                  />
                </Box>

                <Box sx={{ border: '1px solid #c5cae9', borderRadius: '0 0 10px 10px', height: 'calc(100vh - 320px)', overflow: 'hidden' }}>
                  <DataGrid
                    rows={candidates}
                    columns={candidateColumns}
                    getRowId={(row) => row.uniqueEntryId || row._id}
                    pageSize={10}
                    rowsPerPageOptions={[10, 25, 50, 100]}
                    disableSelectionOnClick
                    density="compact"
                    components={{ Toolbar: GridToolbar }}
                    componentsProps={{
                      toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { debounceMs: 500 },
                      },
                    }}
                    sx={{
                      border: 'none',
                      height: '100%',
                      '& .MuiDataGrid-columnHeaders': {
                        background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)',
                        borderBottom: '2px solid #c5cae9',
                      },
                      '& .MuiDataGrid-columnHeaderTitle': {
                        fontWeight: 700, color: '#3f51b5', fontSize: '0.75rem',
                        textTransform: 'uppercase', letterSpacing: '0.04em',
                      },
                      '& .MuiDataGrid-cell': {
                        fontSize: '0.82rem', color: '#334155',
                        borderBottom: '1px solid #f0f2ff',
                        display: 'flex',
                        alignItems: 'center',
                        '&:focus, &:focus-within': { outline: 'none' },
                      },
                      '& .MuiDataGrid-row': {
                        maxHeight: 'none !important',
                      },
                      '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                      '& .MuiDataGrid-toolbarContainer': {
                        px: 2, py: 1,
                        background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)',
                        borderBottom: '1px solid #c5cae9',
                        '& button': { color: '#3f51b5' },
                      },
                      '& .MuiDataGrid-footerContainer': {
                        borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff',
                      },
                      '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                      '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': {
                        background: '#9fa8da', borderRadius: 4,
                      },
                      '& .MuiDataGrid-virtualScrollerContent': { minWidth: '1600px' },
                    }}
                  />
                </Box>
              </>
            )}
          </Box>
        </Modal>

        {/* Edit Modal — Step-by-step wizard */}
        <Modal
          open={editModalOpen}
          onClose={() => setEditModalOpen(false)}
          aria-labelledby="edit-candidate-modal"
        >
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 900, bgcolor: 'background.paper',
            boxShadow: '0 24px 64px rgba(63,81,181,0.18)',
            borderRadius: 3, overflow: 'hidden',
            border: '1px solid #e8eaf6',
          }}>
            {/* Modal Header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
              px: 3, py: 2,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <Box display="flex" alignItems="center" gap={1.5}>
                <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <EditIcon sx={{ color: '#fff', fontSize: 20 }} />
                </Box>
                <Box>
                  <Typography variant="subtitle1" fontWeight={700} color="#fff" lineHeight={1.2}>
                    Add Candidate Details
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                    {selectedCandidate?.candidateName} &bull; Step {activeStep + 1} of 7
                  </Typography>
                </Box>
              </Box>
              <IconButton size="small" onClick={() => setEditModalOpen(false)}
                sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.28)' } }}>
                <CloseIcon fontSize="small" />
              </IconButton>
            </Box>

            {/* Step Progress Bar */}
            {(() => {
              const steps = [
                { label: 'Internal Interview', done: !!(editFormData.internalInterviewDate && editFormData.interviewByWhom) },
                { label: 'Resume & Lineup',    done: !!(editFormData.resumeSubmitDate && editFormData.lineupStatus) },
                { label: 'Interview Rounds',   done: !!(editFormData.interviewRounds?.some(r => r.roundDate)) },
                { label: 'Outcome',            done: !!(editFormData.interviewStatus) },
                { label: 'Offer',              done: !!(editFormData.offeredSalary && editFormData.offeredStatus) },
                { label: 'Selection',          done: !!(editFormData.selectionStatus) },
                { label: 'Joining',            done: !!(editFormData.joiningDateStatus) },
              ];
              return (
                <Box sx={{ px: 3, pt: 2, pb: 1, bgcolor: '#f8f9ff', borderBottom: '1px solid #e8eaf6' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                    {steps.map((s, i) => {
                      const isActive = activeStep === i;
                      const isDone   = s.done;
                      const isLocked = i > 0 && !steps[i - 1].done;
                      return (
                        <React.Fragment key={i}>
                          <Box
                            onClick={() => { if (!isLocked) setActiveStep(i); }}
                            sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', cursor: isLocked ? 'not-allowed' : 'pointer', opacity: isLocked ? 0.4 : 1, minWidth: 80 }}
                          >
                            <Box sx={{
                              width: 28, height: 28, borderRadius: '50%',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 700, fontSize: '0.75rem',
                              bgcolor: isDone ? '#4caf50' : isActive ? '#3f51b5' : '#e8eaf6',
                              color: isDone || isActive ? '#fff' : '#9fa8da',
                              border: isActive ? '2px solid #3f51b5' : isDone ? '2px solid #4caf50' : '2px solid #e8eaf6',
                              transition: 'all 0.2s',
                            }}>
                              {isDone ? '✓' : i + 1}
                            </Box>
                            <Typography sx={{ fontSize: '0.6rem', fontWeight: isActive ? 700 : 500, mt: 0.4, color: isDone ? '#4caf50' : isActive ? '#3f51b5' : '#9fa8da', textAlign: 'center', whiteSpace: 'nowrap' }}>
                              {s.label}
                            </Typography>
                          </Box>
                          {i < steps.length - 1 && (
                            <Box sx={{ flex: 1, height: 2, mb: 2.5, bgcolor: steps[i].done ? '#4caf50' : '#e8eaf6', transition: 'background 0.3s' }} />
                          )}
                        </React.Fragment>
                      );
                    })}
                  </Box>
                </Box>
              );
            })()}

            {/* Step Content */}
            <Box sx={{ p: 3, maxHeight: '58vh', overflowY: 'auto',
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 3 },
            }}>
            <Stack spacing={2.5}>

              {/* STEP 0 - Internal Interview */}
              {activeStep === 0 && (<>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Internal Interview
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField label="Internal Interview Date *" type="date" size="small" fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.internalInterviewDate}
                    onChange={e => handleEditFormChange('internalInterviewDate', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Interview By Whom *" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.interviewByWhom}
                    onChange={e => handleEditFormChange('interviewByWhom', e.target.value)}>
                    <MenuItem value=""><em>Select HR</em></MenuItem>
                    {hrUsers.map(hr => (
                      <MenuItem key={hr._id} value={hr._id}>{hr.firstName + ' ' + hr.lastName}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Candidate Review" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.candidateReview}
                    onChange={e => handleEditFormChange('candidateReview', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {[{ v: 'Green', c: '#4caf50' }, { v: 'Yellow', c: '#ff9800' }, { v: 'Red', c: '#f44336' }].map(({ v, c }) => (
                      <MenuItem key={v} value={v}>
                        <Box display="flex" alignItems="center" gap={1}>
                          <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: c, flexShrink: 0 }} />
                          {v}
                        </Box>
                      </MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12}>
                  <TextField label="Candidate Remarks" multiline rows={2} size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.candidateRemark}
                    onChange={e => handleEditFormChange('candidateRemark', e.target.value)} />
                </Grid>
              </Grid>
              <Typography variant="caption" sx={{ color: '#f57c00', fontStyle: 'italic' }}>
                * Fill Internal Interview Date and Interview By Whom to unlock next step
              </Typography>
              </>)}

              {/* STEP 1 - Resume and Lineup */}
              {activeStep === 1 && (<>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Resume &amp; Lineup
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField label="Resume Submit Date *" type="date" size="small" fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.resumeSubmitDate}
                    onChange={e => handleEditFormChange('resumeSubmitDate', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Lineup Status *" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.lineupStatus}
                    onChange={e => handleEditFormChange('lineupStatus', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['Pending','Shortlisted','Scheduled','Completed','Cancelled'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Remarks 1" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.remarks1}
                    onChange={e => handleEditFormChange('remarks1', e.target.value)} />
                </Grid>
              </Grid>
              <Typography variant="caption" sx={{ color: '#f57c00', fontStyle: 'italic' }}>
                * Fill Resume Submit Date and Lineup Status to unlock next step
              </Typography>
              </>)}

              {/* STEP 2 - Interview Rounds */}
              {activeStep === 2 && (<>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                  Interview Rounds
                </Typography>
                <Button size="small" variant="outlined"
                  onClick={() => handleEditFormChange('interviewRounds', [
                    ...editFormData.interviewRounds,
                    { roundName: 'Round ' + (editFormData.interviewRounds.length + 1), roundDate: '', roundTime: '', interviewMode: 'Face To Face', interviewedByWhom: '' }
                  ])}
                  sx={{ borderRadius: '8px', fontSize: '0.72rem', borderColor: '#3f51b5', color: '#3f51b5', textTransform: 'none' }}>
                  + Add Round
                </Button>
              </Box>
              {editFormData.interviewRounds?.map((round, idx) => (
                <Box key={idx} sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: '10px', border: '1px solid #e8eaf6' }}>
                  <Box display="flex" justifyContent="space-between" alignItems="center" mb={1.5}>
                    <TextField select label="Select Round" value={round.roundName} size="small"
                      onChange={e => { const r = [...editFormData.interviewRounds]; r[idx].roundName = e.target.value; handleEditFormChange('interviewRounds', r); }}
                      sx={{ width: 160, '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                      {['Round 1','Round 2','Round 3','Round 4','HR Round','Final Round'].map(r => (
                        <MenuItem key={r} value={r}>{r}</MenuItem>
                      ))}
                    </TextField>
                    {editFormData.interviewRounds.length > 1 && (
                      <Button size="small" color="error"
                        onClick={() => handleEditFormChange('interviewRounds', editFormData.interviewRounds.filter((_, i) => i !== idx))}
                        sx={{ fontSize: '0.72rem', textTransform: 'none' }}>Remove</Button>
                    )}
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Date *" type="date" value={round.roundDate} size="small" fullWidth
                        InputLabelProps={{ shrink: true }}
                        onChange={e => { const r = [...editFormData.interviewRounds]; r[idx].roundDate = e.target.value; handleEditFormChange('interviewRounds', r); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Time" type="time" value={round.roundTime} size="small" fullWidth
                        InputLabelProps={{ shrink: true }}
                        onChange={e => { const r = [...editFormData.interviewRounds]; r[idx].roundTime = e.target.value; handleEditFormChange('interviewRounds', r); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField select label="Interview Mode" value={round.interviewMode} size="small" fullWidth
                        onChange={e => { const r = [...editFormData.interviewRounds]; r[idx].interviewMode = e.target.value; handleEditFormChange('interviewRounds', r); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}>
                        {['Face To Face','Telephonic','Video Call','Other'].map(m => (
                          <MenuItem key={m} value={m}>{m}</MenuItem>
                        ))}
                      </TextField>
                    </Grid>
                    <Grid item xs={6} sm={3}>
                      <TextField label="Interviewed By Whom" value={round.interviewedByWhom} size="small" fullWidth
                        onChange={e => { const r = [...editFormData.interviewRounds]; r[idx].interviewedByWhom = e.target.value; handleEditFormChange('interviewRounds', r); }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
                    </Grid>
                  </Grid>
                </Box>
              ))}
              <Typography variant="caption" sx={{ color: '#f57c00', fontStyle: 'italic' }}>
                * Set at least one round date to unlock next step
              </Typography>
              </>)}

              {/* STEP 3 - Interview Outcome */}
              {activeStep === 3 && (<>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Interview Outcome
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Interview Status *" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.interviewStatus}
                    onChange={e => handleEditFormChange('interviewStatus', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['On Discussion','Selected','On Hold','Trail','Rejected'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                {editFormData.interviewStatus === 'Trail' && (
                  <Grid item xs={12} sm={4}>
                    <TextField label="No. of Trail Days" type="number" size="small" fullWidth
                      sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                      value={editFormData.trailDays}
                      onChange={e => handleEditFormChange('trailDays', e.target.value.replace(/D/g, ''))}
                      inputProps={{ min: 1 }} />
                  </Grid>
                )}
                <Grid item xs={12} sm={editFormData.interviewStatus === 'Trail' ? 4 : 8}>
                  <TextField label="Remarks 2" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    disabled={!['On Hold','Rejected'].includes(editFormData.interviewStatus)}
                    value={editFormData.remarks2}
                    onChange={e => handleEditFormChange('remarks2', e.target.value)}
                    placeholder={['On Hold','Rejected'].includes(editFormData.interviewStatus) ? '' : 'Active when On Hold or Rejected'} />
                </Grid>
              </Grid>
              <Typography variant="caption" sx={{ color: '#f57c00', fontStyle: 'italic' }}>
                * Select Interview Status to unlock next step
              </Typography>
              </>)}

              {/* STEP 4 - Offer Details */}
              {activeStep === 4 && (<>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Offer Details
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField label="Offered Salary *" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.offeredSalary}
                    onChange={e => handleEditFormChange('offeredSalary', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Offered Status *" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.offeredStatus}
                    onChange={e => handleEditFormChange('offeredStatus', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['Accepted','Rejected'].map(o => <MenuItem key={o} value={o}>{o}</MenuItem>)}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Remarks 3" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    disabled={editFormData.offeredStatus !== 'Rejected'}
                    value={editFormData.remarks3}
                    onChange={e => handleEditFormChange('remarks3', e.target.value)}
                    placeholder={editFormData.offeredStatus !== 'Rejected' ? 'Active when Offer Rejected' : ''} />
                </Grid>
              </Grid>
              <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: '10px', border: '1px solid #e8eaf6' }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                  Offer Letter
                </Typography>
                {editFormData.offerLetter && !offerLetterFile && (
                  <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #e8eaf6' }}>
                    <DescriptionIcon fontSize="small" sx={{ color: '#3f51b5' }} />
                    <a href={editFormData.offerLetter} target="_blank" rel="noopener noreferrer"
                      style={{ color: '#3f51b5', textDecoration: 'none', fontSize: '0.82rem', flexGrow: 1 }}>
                      View Current Offer Letter
                    </a>
                    <Button size="small" color="error" onClick={() => handleEditFormChange('offerLetter', null)}
                      sx={{ minWidth: 'auto', fontSize: '0.72rem' }}>Remove</Button>
                  </Box>
                )}
                <input accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  style={{ display: 'none' }} id="offer-letter-upload" type="file"
                  onChange={e => { if (e.target.files.length > 0) { setOfferLetterFile(e.target.files[0]); handleEditFormChange('offerLetter', e.target.files[0].name); } }} />
                <label htmlFor="offer-letter-upload">
                  <Button variant="outlined" component="span" fullWidth startIcon={<CloudUploadIcon />}
                    sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontSize: '0.82rem' }}>
                    {offerLetterFile ? offerLetterFile.name : 'Upload Offer Letter'}
                  </Button>
                </label>
                <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', display: 'block' }}>Supported: PDF, DOC, DOCX</Typography>
              </Box>
              <Typography variant="caption" sx={{ color: '#f57c00', fontStyle: 'italic' }}>
                * Fill Offered Salary and Offered Status to unlock next step
              </Typography>
              </>)}

              {/* STEP 5 - Selection */}
              {activeStep === 5 && (<>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Selection
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Selection Status *" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.selectionStatus}
                    onChange={e => handleEditFormChange('selectionStatus', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['Accepted','Rejected'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Selection Date" type="date" size="small" fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.selectionDate}
                    onChange={e => handleEditFormChange('selectionDate', e.target.value)} />
                </Grid>
              </Grid>
              <Typography variant="caption" sx={{ color: '#f57c00', fontStyle: 'italic' }}>
                * Select Selection Status to unlock next step
              </Typography>
              </>)}

              {/* STEP 6 - Joining */}
              {activeStep === 6 && (<>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
                Joining
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Joining Date Status *" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.joiningDateStatus}
                    onChange={e => handleEditFormChange('joiningDateStatus', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['Confirmed','Pending','Not Decided','Postponed'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField label="Joining Date" type="date" size="small" fullWidth
                    InputLabelProps={{ shrink: true }}
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.joiningDate}
                    onChange={e => handleEditFormChange('joiningDate', e.target.value)} />
                </Grid>
                <Grid item xs={12} sm={4}>
                  <TextField select label="Has Joined" size="small" fullWidth
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                    value={editFormData.hasJoined}
                    onChange={e => handleEditFormChange('hasJoined', e.target.value)}>
                    <MenuItem value=""><em>Select</em></MenuItem>
                    {['Confirmation Awaited','Yes','No','Backout'].map(o => (
                      <MenuItem key={o} value={o}>{o}</MenuItem>
                    ))}
                  </TextField>
                </Grid>
              </Grid>

              {/* ── Offer Letter (required when Joining Date is set) ── */}
              {(() => {
                const offerLetterRequired = !!editFormData.joiningDate;
                const offerLetterPresent  = !!(editFormData.offerLetter || offerLetterFile);
                const showError = offerLetterRequired && !offerLetterPresent;
                return (
                  <Box sx={{
                    p: 2, borderRadius: '10px',
                    border: showError ? '1.5px solid #ef4444' : '1px solid #e8eaf6',
                    bgcolor: showError ? '#fff5f5' : '#f8f9ff',
                    transition: 'all 0.2s',
                  }}>
                    <Box display="flex" alignItems="center" gap={1} mb={1}>
                      <DescriptionIcon fontSize="small" sx={{ color: showError ? '#ef4444' : '#3f51b5' }} />
                      <Typography variant="caption" sx={{
                        fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em',
                        color: showError ? '#ef4444' : '#3f51b5',
                      }}>
                        Offer Letter {offerLetterRequired ? '*' : '(Optional)'}
                      </Typography>
                      {offerLetterRequired && !offerLetterPresent && (
                        <Chip label="Required" size="small"
                          sx={{ bgcolor: '#fee2e2', color: '#b91c1c', fontWeight: 700, fontSize: '0.65rem', height: 18, ml: 'auto' }} />
                      )}
                      {offerLetterPresent && (
                        <Chip label="✓ Uploaded" size="small"
                          sx={{ bgcolor: '#d1fae5', color: '#065f46', fontWeight: 700, fontSize: '0.65rem', height: 18, ml: 'auto' }} />
                      )}
                    </Box>

                    {/* Existing offer letter */}
                    {editFormData.offerLetter && !offerLetterFile && (
                      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #e8eaf6' }}>
                        <DescriptionIcon fontSize="small" sx={{ color: '#3f51b5' }} />
                        <a href={editFormData.offerLetter} target="_blank" rel="noopener noreferrer"
                          style={{ color: '#3f51b5', textDecoration: 'none', fontSize: '0.82rem', flexGrow: 1 }}>
                          View Current Offer Letter
                        </a>
                        <Button size="small" color="error"
                          onClick={() => handleEditFormChange('offerLetter', null)}
                          sx={{ minWidth: 'auto', fontSize: '0.72rem' }}>
                          Remove
                        </Button>
                      </Box>
                    )}

                    {/* New file selected preview */}
                    {offerLetterFile && (
                      <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#f0fdf4', borderRadius: '8px', border: '1px solid #bbf7d0' }}>
                        <DescriptionIcon fontSize="small" sx={{ color: '#16a34a' }} />
                        <Typography variant="body2" sx={{ color: '#15803d', flexGrow: 1, fontSize: '0.82rem' }}>
                          {offerLetterFile.name}
                        </Typography>
                        <Button size="small" color="error"
                          onClick={() => { setOfferLetterFile(null); handleEditFormChange('offerLetter', selectedCandidate?.offerLetter || null); }}
                          sx={{ minWidth: 'auto', fontSize: '0.72rem' }}>
                          Remove
                        </Button>
                      </Box>
                    )}

                    {/* Upload button */}
                    <input
                      accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                      style={{ display: 'none' }}
                      id="offer-letter-upload-step6"
                      type="file"
                      onChange={e => {
                        if (e.target.files.length > 0) {
                          setOfferLetterFile(e.target.files[0]);
                          handleEditFormChange('offerLetter', e.target.files[0].name);
                        }
                      }}
                    />
                    <label htmlFor="offer-letter-upload-step6">
                      <Button variant="outlined" component="span" fullWidth startIcon={<CloudUploadIcon />}
                        sx={{
                          borderRadius: '8px', fontSize: '0.82rem',
                          borderColor: showError ? '#ef4444' : '#9fa8da',
                          color: showError ? '#ef4444' : '#3f51b5',
                          '&:hover': { borderColor: showError ? '#dc2626' : '#3f51b5', bgcolor: showError ? '#fff5f5' : undefined },
                        }}>
                        {offerLetterFile ? 'Change Offer Letter' : editFormData.offerLetter ? 'Replace Offer Letter' : 'Upload Offer Letter'}
                      </Button>
                    </label>
                    <Typography variant="caption" sx={{ mt: 0.5, display: 'block', color: showError ? '#ef4444' : 'text.secondary' }}>
                      {showError
                        ? '⚠️ Offer letter is required when a joining date is set'
                        : 'Supported: PDF, DOC, DOCX'}
                    </Typography>
                  </Box>
                );
              })()}
              </>)}

            </Stack>
            </Box>

            {/* Wizard Footer */}
            {(() => {
              const offerLetterPresent = !!(editFormData.offerLetter || offerLetterFile);
              const joiningDateSet     = !!editFormData.joiningDate;
              const offerLetterOk      = !joiningDateSet || offerLetterPresent; // required only when joining date is set

              const stepDone = [
                !!(editFormData.internalInterviewDate && editFormData.interviewByWhom),
                !!(editFormData.resumeSubmitDate && editFormData.lineupStatus),
                !!(editFormData.interviewRounds?.some(r => r.roundDate)),
                !!(editFormData.interviewStatus),
                !!(editFormData.offeredSalary && editFormData.offeredStatus),
                !!(editFormData.selectionStatus),
                !!(editFormData.joiningDateStatus && offerLetterOk), // step 6: also needs offer letter when joining date set
              ];
              const canNext   = stepDone[activeStep];
              const isLast    = activeStep === 6;
              const canSave   = !isLast || offerLetterOk; // on last step, block Save if offer letter missing
              const saveTooltip = isLast && !offerLetterOk
                ? 'Upload an offer letter before saving (joining date is set)'
                : '';
              return (
                <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff' }}>
                  <Button variant="outlined" disabled={activeStep === 0}
                    onClick={() => setActiveStep(s => s - 1)}
                    sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600, minWidth: 90 }}>
                    Back
                  </Button>
                  <Box display="flex" gap={1.5}>
                    <Button variant="outlined" onClick={() => setEditModalOpen(false)}
                      sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#6b7280' }}>
                      Cancel
                    </Button>
                    <Tooltip title={saveTooltip} arrow>
                      <span>
                        <Button variant="contained" onClick={handleEditSubmit} disabled={!canSave}
                          sx={{ borderRadius: '8px', bgcolor: '#4caf50', '&:hover': { bgcolor: '#388e3c' }, fontWeight: 700, minWidth: 110 }}>
                          Save Changes
                        </Button>
                      </span>
                    </Tooltip>
                    {!isLast && (
                      <Tooltip title={canNext ? '' : 'Complete required fields to proceed'} arrow>
                        <span>
                          <Button variant="contained" disabled={!canNext}
                            onClick={() => setActiveStep(s => s + 1)}
                            sx={{ borderRadius: '8px', background: canNext ? 'linear-gradient(135deg, #3f51b5, #5c6bc0)' : undefined, fontWeight: 700, minWidth: 90 }}>
                            Next
                          </Button>
                        </span>
                      </Tooltip>
                    )}
                  </Box>
                </Box>
              );
            })()}
          </Box>
        </Modal>

{/* Reschedule Modal */}
        <Modal
          open={rescheduleModalOpen}
          onClose={() => setRescheduleModalOpen(false)}
          aria-labelledby="reschedule-modal"
        >
          <Box sx={{
            position: 'absolute', top: '50%', left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 460, bgcolor: 'background.paper',
            boxShadow: '0 24px 64px rgba(63,81,181,0.18)',
            borderRadius: 3, overflow: 'hidden',
            border: '1px solid #e8eaf6',
          }}>
            {/* Modal Header */}
            <Box sx={{
              background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
              px: 3, py: 2,
              display: 'flex', alignItems: 'center', gap: 1.5,
            }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <EventNoteIcon sx={{ color: '#fff', fontSize: 20 }} />
              </Box>
              <Box>
                <Typography variant="subtitle1" fontWeight={700} color="#fff" lineHeight={1.2}>
                  Reschedule Interview
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>
                  Set a new date and reason
                </Typography>
              </Box>
            </Box>

            <Box sx={{ p: 3 }}>
              <Stack spacing={2.5}>
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
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
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
                  size="small"
                  sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }}
                />
              </Stack>
            </Box>

            <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff' }}>
              <Button
                variant="outlined"
                onClick={() => setRescheduleModalOpen(false)}
                sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5' }}
              >
                Cancel
              </Button>
              <Button
                variant="contained"
                onClick={handleRescheduleSubmit}
                sx={{ borderRadius: '8px', bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' }, fontWeight: 700 }}
              >
                Reschedule
              </Button>
            </Box>
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
            background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 2,
          }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <EditIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Edit Candidate Details</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>Update candidate profile information</Typography>
            </Box>
          </DialogTitle>
          <DialogContent sx={{ mt: 2, px: 3 }}>
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
                        âœ“ {resumeFile.name} selected
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
                        âœ“ {agreementFile.name} selected
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
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff' }}>
            <Button
              onClick={() => setEditCandidateModalOpen(false)}
              variant="outlined"
              sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5' }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleEditCandidateSubmit}
              variant="contained"
              sx={{
                borderRadius: '8px',
                backgroundColor: '#4caf50',
                '&:hover': {
                  backgroundColor: '#388e3c',
                },
                fontWeight: 700,
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
            background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
            color: 'white',
            display: 'flex',
            alignItems: 'center',
            gap: 1.5,
            py: 2,
          }}>
            <Box sx={{ width: 36, height: 36, borderRadius: '8px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <AccessTimeIcon sx={{ fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} lineHeight={1.2}>Reschedule History</Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.75)' }}>All rescheduled interview dates</Typography>
            </Box>
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
                      border: '1px solid #e8eaf6',
                      borderRadius: '10px',
                      transition: 'all 0.2s',
                      '&:hover': {
                        backgroundColor: '#f5f6ff',
                        borderColor: '#9fa8da',
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
          <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff' }}>
            <Button
              onClick={handleCloseRescheduleHistory}
              variant="contained"
              sx={{
                borderRadius: '8px',
                backgroundColor: '#3f51b5',
                '&:hover': {
                  backgroundColor: '#303f9f',
                },
                fontWeight: 700,
              }}
            >
              Close
            </Button>
          </DialogActions>
        </Dialog>

      {/* ── WhatsApp Interview Call Letter Dialog ── */}
      <Dialog
        open={waOpen}
        onClose={() => setWaOpen(false)}
        fullWidth
        maxWidth="md"
        PaperProps={{
          sx: {
            borderRadius: '16px',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
          }
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
          px: 3, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <WhatsAppIcon sx={{ color: '#fff', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography fontWeight={700} color="#fff" fontSize={15} lineHeight={1.3}>
                Interview Call Letter — {waRow?.candidateName || '—'}
              </Typography>
              <Typography fontSize={11.5} color="rgba(255,255,255,0.8)">
                Review and edit the message before sending on WhatsApp.
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setWaOpen(false)}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Two-column body */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT — candidate + job summary */}
          <Box sx={{
            width: '38%', flexShrink: 0,
            borderRight: '1px solid #e8eaf6',
            overflowY: 'auto', p: 2.5,
            display: 'flex', flexDirection: 'column', gap: 2,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 3 },
          }}>

            {/* Candidate info */}
            <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', p: 1.5 }}>
              <Typography fontSize={11} fontWeight={700} color="#166534" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                Candidate
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                <Typography fontSize={12.5} color="#1e293b"><strong>Name:</strong> {waRow?.candidateName || '—'}</Typography>
                <Typography fontSize={12.5} color="#1e293b"><strong>Phone:</strong> {waRow?.candidatePhone || '—'}</Typography>
                <Typography fontSize={12.5} color="#1e293b"><strong>Position:</strong> {waRow?.positionName || '—'}</Typography>
                {waRow?.experience && <Typography fontSize={12.5} color="#1e293b"><strong>Experience:</strong> {waRow.experience}</Typography>}
                {waRow?.currentCTC && <Typography fontSize={12.5} color="#1e293b"><strong>Current CTC:</strong> {waRow.currentCTC}</Typography>}
              </Box>
            </Box>

            {/* Interview details */}
            <Box sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', p: 1.5 }}>
              <Typography fontSize={11} fontWeight={700} color="#1e40af" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                Interview Details
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                {(() => {
                  const rounds = waRow?.interviewRounds;
                  const latest = rounds && rounds.length > 0 ? rounds[rounds.length - 1] : null;
                  const date = latest?.roundDate
                    ? new Date(latest.roundDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                    : waRow?.internalInterviewDate
                    ? new Date(waRow.internalInterviewDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })
                    : '—';
                  return (<>
                    <Typography fontSize={12.5} color="#1e293b"><strong>Date:</strong> {date}</Typography>
                    <Typography fontSize={12.5} color="#1e293b"><strong>Time:</strong> {latest?.roundTime || '—'}</Typography>
                    <Typography fontSize={12.5} color="#1e293b"><strong>Mode:</strong> {latest?.interviewMode || '—'}</Typography>
                    <Typography fontSize={12.5} color="#1e293b"><strong>Interviewer:</strong> {latest?.interviewedByWhom || '—'}</Typography>
                  </>);
                })()}
              </Box>
            </Box>

            {/* Job / Company info */}
            <Box sx={{ bgcolor: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '10px', p: 1.5 }}>
              <Typography fontSize={11} fontWeight={700} color="#475569" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                Company
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                <Typography fontSize={12.5} color="#1e293b"><strong>Name:</strong> {selectedJob?.companyName || '—'}</Typography>
                {selectedJob?.jobLocation && <Typography fontSize={12.5} color="#1e293b"><strong>Location:</strong> {selectedJob.jobLocation}</Typography>}
                {selectedJob?.companyAddress && <Typography fontSize={12.5} color="#1e293b"><strong>Address:</strong> {selectedJob.companyAddress}</Typography>}
                {selectedJob?.websiteURL && <Typography fontSize={12.5} color="#1e293b"><strong>Website:</strong> {selectedJob.websiteURL}</Typography>}
                {selectedJob?.phoneNumber && <Typography fontSize={12.5} color="#1e293b"><strong>Contact:</strong> {selectedJob.phoneNumber}</Typography>}
              </Box>
            </Box>

            {/* Sender info */}
            <Box sx={{ bgcolor: '#fdf4ff', border: '1px solid #e9d5ff', borderRadius: '10px', p: 1.5 }}>
              <Typography fontSize={11} fontWeight={700} color="#7c3aed" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                Sender (HR)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography fontSize={12.5} color="#1e293b"><strong>Name:</strong> {senderName || '—'}</Typography>
                {senderPhone && <Typography fontSize={12.5} color="#1e293b"><strong>Mobile:</strong> {senderPhone}</Typography>}
              </Box>
            </Box>
          </Box>

          {/* RIGHT — editable message */}
          <Box sx={{
            flex: 1, overflowY: 'auto', p: 2.5,
            display: 'flex', flexDirection: 'column', gap: 1.5,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 3 },
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Typography fontSize={11.5} fontWeight={700} color="#475569" textTransform="uppercase" letterSpacing="0.06em">
                Message Preview
              </Typography>
              <Typography fontSize={11} color="#94a3b8" fontStyle="italic">editable</Typography>
            </Box>
            <TextField
              fullWidth multiline minRows={22}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: 11,
                  fontFamily: '"Lora","poppins"',
                  bgcolor: '#f8fafc',
                  alignItems: 'flex-start',
                  lineHeight: 1.7,
                },
              }}
            />
            <Typography fontSize={11} color="#94a3b8">
              💡 Edit the message above before sending. Fields in [brackets] are placeholders.
            </Typography>
          </Box>
        </Box>

        {/* Fixed Footer */}
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5,
          borderTop: '1px solid #e8eaf6', bgcolor: '#fff', flexShrink: 0,
        }}>
          <Button onClick={() => setWaOpen(false)} variant="outlined" size="medium"
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d1d5db', color: '#6b7280', px: 3 }}>
            Cancel
          </Button>
          <Button
            onClick={sendWaMessage}
            variant="contained"
            size="medium"
            disabled={!waRow?.candidatePhone}
            startIcon={<WhatsAppIcon />}
            sx={{
              bgcolor: '#25d366', color: '#fff', fontWeight: 700,
              borderRadius: '8px', textTransform: 'none', px: 3,
              '&:hover': { bgcolor: '#1ebe5d' },
            }}
          >
            Send on WhatsApp
          </Button>
        </Box>
      </Dialog>

      {/* ── Remove Candidate Confirmation Dialog ── */}
      <Dialog
        open={removeConfirmOpen}
        onClose={() => setRemoveConfirmOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        {/* Red warning header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)',
          px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', gap: 1.5,
        }}>
          <Box sx={{
            width: 40, height: 40, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            🗑️
          </Box>
          <Box>
            <Typography fontWeight={700} color="#fff" fontSize={16}>Remove Candidate</Typography>
            <Typography fontSize={12} color="rgba(255,255,255,0.8)">This will unassign from this position</Typography>
          </Box>
        </Box>

        <Box sx={{ px: 3, py: 2.5 }}>
          <Typography fontSize={14} color="#374151" lineHeight={1.7}>
            Are you sure you want to remove{' '}
            <strong>{candidateToRemove?.candidateName || 'this candidate'}</strong>{' '}
            from this position?
          </Typography>
          <Box sx={{ mt: 1.5, p: 1.5, bgcolor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
            <Typography fontSize={12} color="#b91c1c">
              ⚠️ Only candidates you assigned can be removed. This action cannot be undone.
            </Typography>
          </Box>
        </Box>

        <Box sx={{ px: 3, pb: 2.5, display: 'flex', gap: 1.5 }}>
          <Button
            fullWidth variant="outlined"
            onClick={() => { setRemoveConfirmOpen(false); setCandidateToRemove(null); }}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d1d5db', color: '#6b7280' }}
          >
            Cancel
          </Button>
          <Button
            fullWidth variant="contained"
            onClick={handleConfirmRemove}
            sx={{
              borderRadius: '8px', textTransform: 'none', fontWeight: 700,
              bgcolor: '#ef4444', '&:hover': { bgcolor: '#dc2626' },
            }}
          >
            Yes, Remove
          </Button>
        </Box>
      </Dialog>

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


    </Box>
  );
};

export default JobListWithCandidates;


