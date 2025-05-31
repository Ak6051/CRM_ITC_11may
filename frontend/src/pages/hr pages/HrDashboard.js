import React, { useEffect, useState } from "react";
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
  Tooltip
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import DescriptionIcon from "@mui/icons-material/Description";
import dayjs from 'dayjs';

import axios from "axios";

import { useNavigate } from "react-router-dom";
import api, { isTokenExpired, refreshToken } from "../../utils/api";

const HrDashboard = () => {
  const [jobOpenings, setJobOpenings] = useState([]);
  const [openModal, setOpenModal] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [candidates, setCandidates] = useState([
    { candidateName: "", candidateEmail: "", candidatePhone: "", qualification:"", remark:"", resumeLink: "" },
  ]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();


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





  // Check token expiration on component mount
  useEffect(() => {
    const checkTokenExpiration = () => {
      if (isTokenExpired()) {
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('role');
        sessionStorage.removeItem('tokenExpiration');
        navigate('/login');
      }
    };
  
    // Check immediately
    checkTokenExpiration();
  
    // Token check every hour
    const intervalId = setInterval(checkTokenExpiration, 28800000);
  
    // Auto logout after 8 hours
    const logoutTimeout = setTimeout(() => {
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('role');
      sessionStorage.removeItem('tokenExpiration');
      alert("Session expired after 8 hours. Please login again.");
      navigate('/login');
    }, 8 * 60 * 60 * 1000); // 8 hours in milliseconds
  
    return () => {
      clearInterval(intervalId);
      clearTimeout(logoutTimeout); // clear on unmount
    };
  }, [navigate]);
  
  const handleAddRow = () => {
    setCandidates([
      ...candidates,
      { candidateName: "", candidateEmail: "", candidatePhone: "", qualification:"", remark:"", resumeLink: "" },
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
  //   if (!selectedJob?._id) return alert("No job selected");

  //   try {
  //     const response = await api.post("/add/candidate", {
  //       candidates,
  //       jobId: selectedJob._id,
  //     });

  //     if (response.data.success) {
  //       alert("All candidates added!");
  //       setCandidates([{ candidateName: "", candidateEmail: "", candidatePhone: "", qualification:"", remark:"", resumeLink: "" }]);
  //       handleClose();
  //     }
  //   } catch (error) {
  //     console.error(error);
  //     alert("Failed to add candidates.");
  //   }
  // };


  const handleSaveAll = async () => {
    if (!selectedJob?._id) return alert("No job selected");
  
    try {
      const formData = new FormData();
      formData.append("jobId", selectedJob._id);
      formData.append("candidates", JSON.stringify(candidates));
  
      candidates.forEach((candidate, index) => {
        if (candidate.resumeFile) {
          formData.append(`resume-${index}`, candidate.resumeFile);
        }
      });
  
      const response = await api.post("/add/candidate", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
  
      if (response.data.success) {
        alert("All candidates added!");
        setCandidates([
          {
            candidateName: "",
            candidateEmail: "",
            candidatePhone: "",
            qualification: "",
            remark: "",
            resumeLink: "",
          },
        ]);
        handleClose();
      }
    } catch (error) {
      console.error(error);
      alert("Failed to add candidates.");
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

  // 📄 Description: if PDF exists, show button, else show text
  {
    field: 'descriptionFile',
    headerName: 'Description',
    width: 250,
    renderCell: (params) => {
      if (params.row.descriptionFile) {
        return (
          <a
            href={params.row.descriptionFile}
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: '#1976d2', textDecoration: 'underline' }}
          >
            View PDF
          </a>
        );
      } else {
        return <span>{params.row.description || 'N/A'}</span>;
      }
    },
  },

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
      <Box sx={{ flexGrow: 1, overflow: "auto" }}>
        <Container maxWidth={false} sx={{ mt: 4, px: 3 }}>
          <Typography variant="h4" align="center" gutterBottom>
            HR Dashboard - Job Openings
          </Typography>
  
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
  <DataGrid
  rows={jobOpenings.map((job) => ({ id: job._id, ...job }))}
  columns={columns}
  pageSize={10}
  rowsPerPageOptions={[10, 25, 50]}
  pagination
  autoHeight // This ensures the full DataGrid (including pagination) is visible
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
      minHeight: "56px", // ensures footer space is preserved
    },
  }}
/>

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
      left: "50%",
      transform: "translate(-50%, -50%)",
      width: 1000,
      bgcolor: "background.paper",
      boxShadow: 24,
      p: 4,
      borderRadius: 2,
      maxHeight: "90vh",
      overflowY: "auto",
    }}
  >
    <Typography variant="h6" gutterBottom>
      Add Candidates for: <b>{selectedJob?.jobTitle}</b>
    </Typography>

    {/* Header Row */}
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr 1.5fr auto",
        gap: 2,
        fontWeight: "bold",
        mb: 1,
        px: 1,
      }}
    >
      <div>Name</div>
      <div>Email</div>
      <div>Phone</div>
      <div>Qualification</div>
      <div>Remark</div>
      <div>Resume Link</div>
      <div>Action</div>
    </Box>

    {/* Candidate Rows */}
    {candidates.map((candidate, index) => (
      <Box
        key={index}
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr 1fr 1.5fr 1.5fr auto",
          gap: 2,
          mb: 1,
          alignItems: "start",
        }}
      >
        <TextField
          size="small"
          value={candidate.candidateName}
          onChange={(e) =>
            handleCandidateChange(index, "candidateName", e.target.value)
          }
        />
        <TextField
          size="small"
          value={candidate.candidateEmail}
          onChange={(e) =>
            handleCandidateChange(index, "candidateEmail", e.target.value)
          }
        />
        <TextField
          size="small"
          value={candidate.candidatePhone}
          onChange={(e) =>
            handleCandidateChange(index, "candidatePhone", e.target.value)
          }
        />
        <TextField
          size="small"
          value={candidate.qualification}
          onChange={(e) =>
            handleCandidateChange(index, "qualification", e.target.value)
          }
        />
        <TextField
          size="small"
          multiline
          minRows={3}
          value={candidate.remark}
          onChange={(e) =>
            handleCandidateChange(index, "remark", e.target.value)
          }
        />
       <TextField
  type="file"
  accept=".pdf,.doc,.docx"
  onChange={(e) => {
    const file = e.target.files[0];
    const updatedCandidates = [...candidates];
    updatedCandidates[index].resumeFile = file;
    setCandidates(updatedCandidates);
  }}
/>

        <Button
          variant="outlined"
          color="error"
          onClick={() => handleRemoveRow(index)}
        >
          Remove
        </Button>
      </Box>
    ))}

    <Box sx={{ display: "flex", justifyContent: "space-between", mt: 3 }}>
      <Button variant="outlined" onClick={handleAddRow}>
        + Add Row
      </Button>
      <Button variant="contained" onClick={handleSaveAll}>
        Save All
      </Button>
    </Box>
  </Box>
</Modal>



    </div>
  );
};

export default HrDashboard;
