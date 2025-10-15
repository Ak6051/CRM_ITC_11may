import React, { useEffect, useState, useRef } from "react";
import Navbar from "../../components/hr components/HrNavbar";
import Sidebar from "../../components/hr components/HrSidebar";
import {
  Container,
  Typography,
  Box,
  Paper,
  Modal,
  IconButton,
  TextField,
  Button,
  Grid,
  Tooltip,
  Alert,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DescriptionIcon from "@mui/icons-material/Description";
import CircularProgress from '@mui/material/CircularProgress';
import LinearProgress from '@mui/material/LinearProgress';
import dayjs from 'dayjs';

import axios from "axios";
import { API_BASE_URL, SOCKET_URL } from "../../config/api.config";

import { useNavigate } from "react-router-dom";
import api, { isTokenExpired, refreshToken } from "../../utils/api";
import { io } from 'socket.io-client';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const HrDashboard = () => {
 
  const [jobOpenings, setJobOpenings] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [reminderList, setReminderList] = useState([]);
  const [candidates, setCandidates] = useState([
    { candidateName: "", candidateEmail: "", candidatePhone: "", qualification:"", positionName:"", experience:"", currentLocation:"", currentPosition:"", currentCTC:"", expectedCTC:"", noticePeriod:"", reasonforLeaving:"", currentCompany:"", remark:"", resumeLink: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveProgress, setSaveProgress] = useState(0);
  const [error, setError] = useState("");
  const navigate = useNavigate();


  const shownRemindersRef = useRef(new Set());

  useEffect(() => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      console.warn('❌ No token found in sessionStorage');
      return;
    }
  
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
      console.log('🟢 HR Dashboard: Socket connected');
      setIsConnected(true);
    });
  
    socketInstance.on('disconnect', (reason) => {
      console.log('🔴 HR Dashboard: Socket disconnected:', reason);
      setIsConnected(false);
    });
  
    // ✅ AssignedTask (via "reminder" event from server)
    socketInstance.on('reminder', (data) => {
      const reminderKey = `assigned-${data._id}`;
      if (shownRemindersRef.current.has(reminderKey)) return;
  
      shownRemindersRef.current.add(reminderKey);
  
      toast.info(
        <div style={{ fontSize: '15px', fontWeight: 500 }}>
          📌 <strong>Assigned Task: {data.taskName}</strong>
          <div style={{ fontSize: '12px', color: '#666' }}>
            📅 Due: {new Date(data.endDate).toLocaleString()}
          </div>
        </div>,
        {
          position: 'bottom-right',
          autoClose: 6000,
          style: {
            background: '#f3e5f5',
            borderLeft: '5px solid #8e24aa',
            color: '#333',
            borderRadius: '8px',
          },
          icon: false,
        }
      );
  
      setReminderList(prev => [
        ...prev,
        {
          _id: reminderKey,
          type: 'assigned',
          taskName: data.taskName,
          endDate: data.endDate,
        }
      ]);
  
      setTimeout(() => {
        shownRemindersRef.current.delete(reminderKey);
        setReminderList(prev => prev.filter(r => r._id !== reminderKey));
      }, 60000);
    });
  
    // ✅ Task Reminder
    socketInstance.on('task-reminder', (data) => {
      const reminderKey = `task-${data.taskId}`;
      if (shownRemindersRef.current.has(reminderKey)) return;
  
      shownRemindersRef.current.add(reminderKey);
  
      toast.info(
        <div style={{ fontSize: '15px', fontWeight: 500 }}>
          🔔 <strong>{data.taskName}</strong>
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
  
      setReminderList(prev => [
        ...prev,
        {
          _id: reminderKey,
          type: 'task',
          taskName: data.taskName,
          endDate: data.endDate,
        }
      ]);
  
      setTimeout(() => {
        shownRemindersRef.current.delete(reminderKey);
        setReminderList(prev => prev.filter(r => r._id !== reminderKey));
      }, 60000);
    });
  
    // ✅ Reminder model (initial)
    socketInstance.on('candidate-reminders', (data = []) => {
      const finalList = [];
  
      data.forEach(reminder => {
        const reminderKey = `reminder-${reminder._id}`;
        if (shownRemindersRef.current.has(reminderKey)) return;
  
        shownRemindersRef.current.add(reminderKey);
  
        const isCandidate = !!reminder.candidateId;
        const label = isCandidate ? '👤 Candidate Reminder' : '📌 Reminder';
  
        toast.info(
          <div style={{ fontSize: '15px', fontWeight: 500 }}>
            <strong>{label}</strong><br />
            {reminder.message}
            <div style={{ fontSize: '12px', color: '#666' }}>
              📅 Due: {new Date(reminder.remindAt).toLocaleString()}
            </div>
          </div>,
          {
            position: 'bottom-right',
            autoClose: 6000,
            style: {
              background: isCandidate ? '#e8f5e9' : '#e3f2fd',
              borderLeft: isCandidate ? '5px solid #388e3c' : '5px solid #1976d2',
              color: '#333',
              borderRadius: '8px',
            },
            icon: false,
          }
        );
  
        setTimeout(() => {
          shownRemindersRef.current.delete(reminderKey);
        }, 60000);
  
        finalList.push(reminder);
      });
  
      setReminderList(finalList);
    });
  
    setSocket(socketInstance);
  
    return () => {
      socketInstance.disconnect();
      socketInstance.off('reminder');
      socketInstance.off('task-reminder');
      socketInstance.off('candidate-reminders');
    };
  }, []);
  
  

  const renderWithTooltip = (params) => (
    <Tooltip title={params.value || ""} arrow placement="top">
      <div style={{
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        maxWidth: '180px',
      }}>
        {params.value}
      </div>
    </Tooltip>
  );

  useEffect(() => {
    const checkTokenExpiration = () => {
      if (isTokenExpired()) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('userId');
        sessionStorage.removeItem('tokenExpiration');
        navigate('/login');
      }
    };

    checkTokenExpiration();

    const intervalId = setInterval(checkTokenExpiration, 28800000);

    const logoutTimeout = setTimeout(() => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('userId');
      sessionStorage.removeItem('tokenExpiration');
      alert("Session expired after 8 hours. Please login again.");
      navigate('/login');
    }, 8 * 60 * 60 * 1000); 

    return () => {
      clearInterval(intervalId);
      clearTimeout(logoutTimeout); 
    };
  }, [navigate]);

  const handleAddRow = () => {
    setCandidates([
      ...candidates,
      { candidateName: "", candidateEmail: "", candidatePhone: "", qualification:"", positionName:"", experience:"", currentLocation:"", currentPosition:"", currentCTC:"", expectedCTC:"", noticePeriod:"", reasonforLeaving:"", currentCompany:"", remark:"", resumeLink: "" },
    ]);
  };

  const handleRemoveRow = (index) => {
    const updatedCandidates = candidates.filter((_, i) => i !== index);
    setCandidates(updatedCandidates);
  };

  const handleCandidateChange = (index, field, value) => {
    const updated = [...candidates];
    updated[index][field] = value;
    setCandidates(updated);
  };

  // const handleSaveAll = async () => {
  //   if (!selectedJob?._id) {
  //     toast.error("Please select a job first", {
  //       position: "top-right",
  //       autoClose: 3000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true
  //     });
  //     return;
  //   }

    

  //   setSaving(true);
  //   setSaveProgress(0);

  //   try {
  //     const formData = new FormData();
  //     formData.append("jobId", selectedJob._id);
  //     formData.append("candidates", JSON.stringify(candidates));

  //     // Add files to form data
  //     candidates.forEach((candidate, index) => {
  //       if (candidate.resumeFile) {
  //         formData.append(`resume-${index}`, candidate.resumeFile);
  //       }
  //     });

  //     // Simulate progress (since we can't track actual upload progress with current setup)
  //     const progressInterval = setInterval(() => {
  //       setSaveProgress(prev => {
  //         const newProgress = Math.min(prev + Math.random() * 10, 90);
  //         return newProgress;
  //       });
  //     }, 200);

  //     const response = await api.post("/add/candidate", formData, {
  //       headers: {
  //         "Content-Type": "multipart/form-data",
  //       },
  //       onUploadProgress: (progressEvent) => {
  //         const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total);
  //         setSaveProgress(progress);
  //       },
  //     });

  //     clearInterval(progressInterval);
  //     setSaveProgress(100);

  //     if (response.data.success) {
  //       setTimeout(() => {
  //         toast.success("All candidates added successfully!", {
  //           position: "top-right",
  //           autoClose: 3000,
  //           hideProgressBar: false,
  //           closeOnClick: true,
  //           pauseOnHover: true,
  //           draggable: true
  //         });
  //         setCandidates([
  //           {
  //             candidateName: "",
  //             candidateEmail: "",
  //             candidatePhone: "",
  //             qualification: "",
  //             positionName: "",
  //             experience: "",
  //             currentLocation: "",
  //             currentPosition: "",
  //             currentCTC: "",
  //             expectedCTC: "",
  //             noticePeriod: "",
  //             reasonforLeaving: "",
  //             currentCompany: "",
  //             remark: "",
  //             resumeLink: "",
  //           },
  //         ]);
  //         handleClose();
  //         setSaving(false);
  //         setSaveProgress(0);
  //       }, 500);
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     setSaving(false);
  //     setSaveProgress(0);
  //     toast.error("Failed to add candidates: " + (error.response?.data?.message || error.message), {
  //       position: "top-right",
  //       autoClose: 5000,
  //       hideProgressBar: false,
  //       closeOnClick: true,
  //       pauseOnHover: true,
  //       draggable: true
  //     });
  //   }
  // };

const handleSaveAll = async () => {
  if (!selectedJob?._id) {
    toast.error("Please select a job first");
    return;
  }

  if (!candidates || candidates.length === 0) {
    toast.error("Please add at least one candidate");
    return;
  }

  setSaving(true);
  setSaveProgress(0);

  try {
    const formData = new FormData();
    formData.append("jobId", selectedJob._id);
    formData.append("candidates", JSON.stringify(candidates));

    candidates.forEach((candidate, index) => {
      if (candidate.resumeFile) {
        formData.append(`resume-${index}`, candidate.resumeFile); // ✅ Corrected
      }
    });

    const response = await api.post("/add/candidate", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
      onUploadProgress: (progressEvent) => {
        const progress = Math.round(
          (progressEvent.loaded * 100) / progressEvent.total
        );
        setSaveProgress(progress);
      },
    });

    if (response.data.success) {
      toast.success("All candidates added successfully!");
      setCandidates([
        {
          candidateName: "",
          candidateEmail: "",
          candidatePhone: "",
          qualification: "",
          positionName: "",
          experience: "",
          currentLocation: "",
          currentPosition: "",
          currentCTC: "",
          expectedCTC: "",
          noticePeriod: "",
          reasonforLeaving: "",
          currentCompany: "",
          remark: "",
          resumeLink: "",
        },
      ]);
      handleClose();
    }
  } catch (error) {
    console.error(error);
    toast.error(
      "Failed to add candidates: " +
        (error.response?.data?.message || error.message)
    );
  } finally {
    setSaving(false);
    setSaveProgress(0);
  }
};


  const handleClose = () => {
    setOpenModal(false);
  };

  const handleIconClick = (job) => {
    setSelectedJob(job);
    setOpenModal(true);
  };

  useEffect(() => {
    const fetchJobOpenings = async () => {
      setLoading(true);
      setError("");
      
      try {
        const response = await api.get("/assignhr");

        if (response.data.success) {
          setJobOpenings(response.data.data);
        }
      } catch (error) {
        console.error("Error fetching job openings:", error);
        if (error.response?.status === 401) {
          // Token expired or invalid, try to refresh
          try {
            await refreshToken();
            // Retry the request after token refresh
            const retryResponse = await api.get("/assignhr");
            if (retryResponse.data.success) {
              setJobOpenings(retryResponse.data.data);
            }
          } catch (refreshError) {
            console.error("Token refresh failed:", refreshError);
            setError("Session expired. Please login again.");
            navigate('/login');
          }
        } else {
          setError("Failed to load job openings. Please try again later.");
        }
      } finally {
        setLoading(false);
      }
    };

    fetchJobOpenings();
    
    // Set up periodic data refresh every 5 minutes
    const refreshInterval = setInterval(fetchJobOpenings, 5 * 60 * 1000);
    
    return () => clearInterval(refreshInterval);
  }, [navigate]);

const columns = [
   {
    field: "sourcingData",
    headerName: "Sourcing Data",
    flex: 1,
    minWidth: 120,
    renderCell: (params) => (
      <IconButton onClick={() => handleIconClick(params.row)}>
        <DescriptionIcon color="primary" />
      </IconButton>
    ),
  },
    { field: 'industries', headerName: 'Industries', width: 180 },

  { field: 'companyName', headerName: 'Company Name', width: 180 },
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
  { field: 'jobTiming', headerName: 'Job Timing', width: 150 },
  { field: 'gender', headerName: 'Gender', width: 150 },

  // 📄 Description: if PDF exists, show button, else show text
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

  // {
  //   field: 'description',
  //   headerName: 'Job Description (Text)',
  //   width: 300,
  //   renderCell: (params) => {
  //     const text = params.row.description;
  //     return text ? (
  //       <span style={{ whiteSpace: 'normal', wordBreak: 'break-word' }}>
  //         {text}
  //       </span>
  //     ) : (
  //       <span>N/A</span>
  //     );
  //   },
  // },
  

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
          style={{ color: '#1976d2', textDecoration: 'underline' }}
        >
          {params.value}
        </a>
      ) : (
        'N/A'
      ),
  },

  // 🕐 Created At
  {
       field: "createdAt",
       headerName: "Created At",
       width: 180,
       renderCell: (params) =>
         params.value ? dayjs(params.value).format("DD/MM/YYYY hh:mm A") : ""
     },
  {
    field: "startDate",
    headerName: "Start Date",
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      if (!params || params.value === undefined || params.value === null) return "--";
      try {
        return new Date(params.value).toLocaleDateString();
      } catch (error) {
        return "--";
      }
    },
  },
  {
    field: "endDate",
    headerName: "End Date",
    flex: 1,
    minWidth: 150,
    renderCell: (params) => {
      if (!params || params.value === undefined || params.value === null) return "--";
      try {
        return new Date(params.value).toLocaleDateString();
      } catch (error) {
        return "--";
      }
    },
  },
 
];
  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5", overflow: "hidden" }}>
    <div style={{ position: "fixed", height: "100vh", width: "250px", backgroundColor: "#3f51b5", color: "white" }}>
      <Sidebar />
    </div>
  
    <Box
      sx={{
        flexGrow: 1,
        display: "flex",
        flexDirection: "column",
        marginLeft: "250px",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      <Navbar />
      {/* HR Messages Section */}
      

      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <Container maxWidth={false} sx={{ mt: 4, px: 3 }}>
          <Typography variant="h4" align="center" gutterBottom>
            HR Dashboard - Job Openings
          </Typography>
          <p>Status: {isConnected ? '🟢 Connected' : '🔴 Disconnected'}</p>
          <Paper
  elevation={3}
  sx={{
    width: "100%",
    mt: 3,
    p: 2,
    borderRadius: 3,
    overflowX: "auto", // horizontal scroll only here
    boxShadow: "0 8px 24px rgba(0, 0, 0, 0.12)",
    backgroundColor: "#ffffff",
    transition: "all 0.3s ease",
    "&:hover": {
      boxShadow: "0 12px 32px rgba(0, 0, 0, 0.15)",
    },
    "&::-webkit-scrollbar": {
      height: "8px",
    },
    "&::-webkit-scrollbar-thumb": {
      backgroundColor: "#888",
      borderRadius: "4px",
    },
  }}
>
  <Box sx={{ minWidth: "1200px" }}>
  <div style={{ height: 'calc(100vh - 300px)', width: '100%' }}>
    <DataGrid
      rows={jobOpenings.map((job) => ({ id: job._id, ...job }))}
      columns={columns}
      pageSize={10}
      rowsPerPageOptions={[10, 25, 50]}
      pagination
      sx={{
        width: "100%",
        "& .MuiDataGrid-columnHeaders": {
          backgroundColor: "#f5f7fa",
          fontWeight: "bold",
          fontSize: "0.95rem",
          borderBottom: "2px solid #e0e0e0",
          position: "sticky",
          top: 0,
          zIndex: 1,
        },
        "& .MuiDataGrid-footerContainer": {
          borderTop: "2px solid #e0e0e0",
          backgroundColor: "#f5f7fa",
          minHeight: "56px",
          position: 'sticky',
          bottom: 0,
          zIndex: 1,
        },
        "& .MuiDataGrid-virtualScroller": {
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
      }}
    />
  </div>

  </Box>
</Paper>

        </Container>
      </Box>
    </Box>
  
    <Modal open={openModal} onClose={handleClose}>
  <Box
    sx={{
      position: "absolute",
      top: "50%",
      left: "54%",
      transform: "translate(-50%, -50%)",
      width: "100vw",
      maxWidth: "1700px",
      bgcolor: "#fff",
      boxShadow: 10,
      borderRadius: "16px",
      p: 4,
      maxHeight: "90vh",
      overflowY: "auto",
    }}
  >
    <Typography variant="h5" gutterBottom fontWeight="bold" sx={{ mb: 3 }}>
      Add Candidates for: <span style={{ color: "#1976d2" }}>{selectedJob?.jobTitle}</span>
    </Typography>

    {/* Header Row */}
  <Box
  sx={{
    display: "grid",
    gridTemplateColumns: "repeat(16, minmax(120px, 1fr)) 80px",
    gap: 2,
    p: 1.5,
    fontWeight: "bold",
    borderRadius: 2,
    mb: 2,
    position: "sticky",
    top: 0,
    zIndex: 2,
    fontSize: "0.85rem",
    backgroundColor: "#fff", // simple white background (optional for contrast)
  }}
>
  <div>Name</div>
  <div>Email</div>
  <div>Phone</div>
  <div>Qualification</div>
  <div>Position Name</div>
  <div>Experience</div>
  <div>Current Location</div>
  <div>Current Position</div>
  <div>Current CTC</div>
  <div>Expected CTC</div>
  <div>Notice Period</div>
  <div>Reason for Leaving</div>
  <div>Current Company</div>
  <div>Remark</div>
  <div>Resume</div>
  <div>Action</div>
</Box>


    {/* Candidate Rows */}
    {candidates.map((candidate, index) => (
      <Box
        key={index}
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(16, minmax(120px, 1fr)) 80px",
          gap: 2,
          mb: 2,
          alignItems: "center",
          p: 2,
          transition: "all 0.2s ease-in-out",
          "&:hover": {
            backgroundColor: "#f0f8ff",
          },
        }}
      >
        <TextField size="small" value={candidate.candidateName} onChange={(e) => handleCandidateChange(index, "candidateName", e.target.value)} />
        <TextField size="small" value={candidate.candidateEmail} onChange={(e) => handleCandidateChange(index, "candidateEmail", e.target.value)} />
        <TextField size="small" value={candidate.candidatePhone} onChange={(e) => handleCandidateChange(index, "candidatePhone", e.target.value)} />
        <TextField size="small" value={candidate.qualification} onChange={(e) => handleCandidateChange(index, "qualification", e.target.value)} />
        <TextField size="small" value={candidate.positionName} onChange={(e) => handleCandidateChange(index, "positionName", e.target.value)} />
        <TextField size="small" value={candidate.experience} onChange={(e) => handleCandidateChange(index, "experience", e.target.value)} />
        <TextField size="small" value={candidate.currentLocation} onChange={(e) => handleCandidateChange(index, "currentLocation", e.target.value)} />
        <TextField size="small" value={candidate.currentPosition} onChange={(e) => handleCandidateChange(index, "currentPosition", e.target.value)} />
        <TextField size="small" value={candidate.currentCTC} onChange={(e) => handleCandidateChange(index, "currentCTC", e.target.value)} />
        <TextField size="small" value={candidate.expectedCTC} onChange={(e) => handleCandidateChange(index, "expectedCTC", e.target.value)} />
        <TextField size="small" value={candidate.noticePeriod} onChange={(e) => handleCandidateChange(index, "noticePeriod", e.target.value)} />
        <TextField size="small" multiline minRows={2} value={candidate.reasonforLeaving} onChange={(e) => handleCandidateChange(index, "reasonforLeaving", e.target.value)} />
        <TextField size="small" value={candidate.currentCompany} onChange={(e) => handleCandidateChange(index, "currentCompany", e.target.value)} />
        <TextField size="small" multiline minRows={2} value={candidate.remark} onChange={(e) => handleCandidateChange(index, "remark", e.target.value)} />

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
  <Button
    component="label"
    variant="contained"
    size="small"
    sx={{
      textTransform: "none",
      fontWeight: "500",
      fontSize: "0.75rem",
      whiteSpace: 'nowrap',
      minWidth: '80px'
    }}
  >
    Upload
    <input
      hidden
      type="file"
      accept=".pdf,.doc,.docx"
      onChange={(e) => {
        const file = e.target.files[0];
        if (file) {
          const updated = [...candidates];
          updated[index].resumeFile = file;
          updated[index].resumeName = file.name;
          setCandidates(updated);
        }
      }}
    />
  </Button>
  {candidate.resumeName && (
    <Typography variant="caption" noWrap sx={{ 
      maxWidth: '150px', 
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      color: 'text.secondary'
    }}>
      {candidate.resumeName}
    </Typography>
  )}
</Box>


        <Button
          variant="outlined"
          color="error"
          size="small"
          onClick={() => handleRemoveRow(index)}
          sx={{
            fontSize: "0.75rem",
            textTransform: "none",
            "&:hover": {
              backgroundColor: "#ffeaea",
            },
          }}
        >
          Remove
        </Button>
      </Box>
    ))}

    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
      <Button
        variant="outlined"
        onClick={handleAddRow}
        sx={{
          borderRadius: "8px",
          px: 3,
          py: 1,
          fontWeight: "bold",
          "&:hover": {
            backgroundColor: "#e3f2fd",
          },
        }}
      >
        + Add Row
      </Button>
      <Box sx={{ position: 'relative', width: '150px' }}>
        <Button
          variant="contained"
          onClick={handleSaveAll}
          disabled={saving}
          fullWidth
          sx={{
            borderRadius: "8px",
            py: 1.5,
            fontWeight: "bold",
            backgroundColor: saving ? "#90caf9" : "#1976d2",
            "&:hover": {
              backgroundColor: saving ? "#90caf9" : "#1565c0",
            },
          }}
        >
          {saving ? (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={20} color="inherit" />
              <span>{Math.round(saveProgress)}%</span>
            </Box>
          ) : 'Save All'}
        </Button>
        {saving && (
          <LinearProgress 
            variant="determinate" 
            value={saveProgress} 
            sx={{ 
              position: 'absolute', 
              bottom: 0, 
              left: 0, 
              right: 0,
              height: 4,
              borderBottomLeftRadius: 4,
              borderBottomRightRadius: 4
            }} 
          />
        )}
      </Box>
    </Box>
  </Box>
</Modal>





{/* <div style={{ position: 'fixed', top: '80px', right: '20px', zIndex: 1000 }}>
  {reminderList.map((reminder) => (
    <Alert key={reminder._id} severity="info" sx={{ mb: 1 }}>
      Reminder: {reminder.message} (Due: {new Date(reminder.remindAt).toDateString()})
    </Alert>
  ))}
</div> */}
    </div>
  );
};

export default HrDashboard;