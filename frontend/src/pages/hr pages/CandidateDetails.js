import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_BASE_URL } from "../../config/api.config";
import { 
  Box, 
  Typography,
  Grid,
  Modal,
  TextField,
  Button 
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';



const style = {
  position: 'absolute',
  top: '50%',
  left: '50%',
  transform: 'translate(-50%, -50%)',
  width: 500,
  bgcolor: 'background.paper',
  borderRadius: 2,
  boxShadow: 24,
  p: 4,
};

const CandidateList = () => {
  const [candidates, setCandidates] = useState([]);
  const [open, setOpen] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  const fetchCandidates = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const hrId = sessionStorage.getItem("userId");
      const response = await axios.get(`${API_BASE_URL}/candidate/all-candidates/${hrId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      const formattedData = response.data.map((candidate) => ({
        id: candidate._id,
        name: candidate.candidateName,
        phoneNumber: candidate.candidatePhone,
        email: candidate.candidateEmail,
        positionName: candidate.positionName,
        qualification: candidate.qualification,
        experience: candidate.experience,
        currentLocation: candidate.currentLocation,
        currentPosition: candidate.currentPosition,
        currentCTC: candidate.currentCTC,
        expectedCTC: candidate.expectedCTC,
        noticePeriod: candidate.noticePeriod,
        reasonforLeaving: candidate.reasonforLeaving,
        currentCompany: candidate.currentCompany,
        remark: candidate.remark,
        resumeLink: candidate.resumeLink,
      }));
      setCandidates(formattedData);
    } catch (error) {
      console.error("Error fetching candidates:", error);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this candidate?")) {
      try {
        const token = sessionStorage.getItem("token");
        await axios.delete(`${API_BASE_URL}/candidate/delete/${id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        setCandidates(candidates.filter(candidate => candidate.id !== id));
      } catch (error) {
        console.error("Error deleting candidate:", error);
      }
    }
  };

  const handleEdit = (candidate) => {
    setSelectedCandidate(candidate);
    setOpen(true);
  };

  const handleInputChange = (e) => {
    setSelectedCandidate({
      ...selectedCandidate,
      [e.target.name]: e.target.value,
    });
  };

  const handleUpdate = async () => {
    try {
      const token = sessionStorage.getItem("token");
      const formData = new FormData();
      
      // Add all fields to formData
      for (let key in selectedCandidate) {
        if (key === 'id' || key === 'modelType') continue;
        
        // Handle file upload
        if (key === 'resumeFile' && selectedCandidate.resumeFile) {
          formData.append('resumeUpload', selectedCandidate.resumeFile);
        } 
        // For existing resume link
        else if (key === 'resumeLink' && typeof selectedCandidate[key] === 'string') {
          formData.append('resumeLink', selectedCandidate[key]);
        }
        // For other fields
        else if (selectedCandidate[key] !== undefined && selectedCandidate[key] !== null) {
          formData.append(key, selectedCandidate[key]);
        }
      }

      // Add modelType to formData if available
      if (selectedCandidate.modelType) {
        formData.append('modelType', selectedCandidate.modelType);
      }

      await axios.put(
        `${API_BASE_URL}/candidate/update/${selectedCandidate.id}`,
        formData,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );
      setOpen(false);
      fetchCandidates(); // Refresh data
    } catch (error) {
      console.error("Error updating candidate:", error);
    }
  };

  const columns = [
    {
      field: "actions",
      headerName: "Actions",
      width: 180,
      renderCell: (params) => (
        <>
          <button
            onClick={() => handleEdit(params.row)}
            style={{ marginRight: 8, backgroundColor: "#1976d2", color: "#fff", border: "none", padding: "4px 8px", cursor: "pointer", borderRadius: "4px" }}
          >
            Edit
          </button>
          <button
            onClick={() => handleDelete(params.row.id)}
            style={{ backgroundColor: "red", color: "#fff", border: "none", padding: "4px 8px", cursor: "pointer", borderRadius: "4px" }}
          >
            Delete
          </button>
        </>
      ),
    },
    { field: "name", headerName: "Name", width: 150 },
    { field: "phoneNumber", headerName: "Phone", width: 130 },
    { field: "email", headerName: "Email", width: 130 },
    { field: "qualification", headerName: "Qualification", width: 130 },
    { field: "positionName", headerName: "Position", width: 150 },
    { field: "experience", headerName: "Experience", width: 120 },
    { field: "currentLocation", headerName: "Current Location", width: 120 },
    { field: "currentPosition", headerName: "Current Position", width: 120 },
    { field: "currentCTC", headerName: "Current CTC", width: 120 },
    { field: "expectedCTC", headerName: "Expected CTC", width: 130 },
    { field: "noticePeriod", headerName: "Notice Period", width: 120 },
    { field: "reasonforLeaving", headerName: "Reason For Leaving", width: 120 },
    { field: "currentCompany", headerName: "Current Company", width: 120 },
    { field: "remark", headerName: "Remark", width: 150 },
    {
      field: "resumeLink",
      headerName: "Resume",
      width: 150,
      renderCell: (params) =>
        params.value ? (
          <a href={params.value} target="_blank" rel="noopener noreferrer">
            View Resume
          </a>
        ) : (
          "No Resume"
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
        <Box p={4} sx={{ height: 800, width: "100%" }}>
          <Typography variant="h5" gutterBottom>
            Candidate List
          </Typography>
          <DataGrid
            rows={candidates}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            pagination
          />
        </Box>
      </Box>

      {/* Update Modal */}
    <Modal open={open} onClose={() => setOpen(false)}>
  <Box
    sx={{
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: 'translate(-50%, -50%)',
      width: '70vw',
      maxHeight: '80vh',
      bgcolor: 'background.paper',
      boxShadow: 24,
      p: 4,
      borderRadius: 2,
      overflowY: 'auto',
    }}
  >
    <Typography variant="h6" gutterBottom>
      Edit Candidate
    </Typography>
    {selectedCandidate && (
      <>
        <Grid container spacing={2}>
          {/* Each Grid item will take 4 columns out of 12 => 3 per row */}
          <Grid item xs={12} sm={4}>
            <TextField
              label="Name"
              name="name"
              value={selectedCandidate.name}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Phone"
              name="phoneNumber"
              value={selectedCandidate.phoneNumber}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Email"
              name="email"
              value={selectedCandidate.email}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Position"
              name="positionName"
              value={selectedCandidate.positionName}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Qualification"
              name="qualification"
              value={selectedCandidate.qualification}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Experience"
              name="experience"
              value={selectedCandidate.experience}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Current Location"
              name="currentLocation"
              value={selectedCandidate.currentLocation}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Current Position"
              name="currentPosition"
              value={selectedCandidate.currentPosition}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Current CTC"
              name="currentCTC"
              value={selectedCandidate.currentCTC}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Expected CTC"
              name="expectedCTC"
              value={selectedCandidate.expectedCTC}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Notice Period"
              name="noticePeriod"
              value={selectedCandidate.noticePeriod}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12} sm={4}>
            <TextField
              label="Reason For Leaving"
              name="reasonforLeaving"
              value={selectedCandidate.reasonforLeaving}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              label="Current Company"
              name="currentCompany"
              value={selectedCandidate.currentCompany}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          {/* Upload Resume button takes full width */}
          <Grid item xs={12} sm={4}>
            <Button variant="outlined" component="label" fullWidth>
              Upload Resume
              <input
                type="file"
                hidden
                accept=".pdf,.doc,.docx"
                onChange={(e) =>
                  setSelectedCandidate({ ...selectedCandidate, resumeFile: e.target.files[0] })
                }
              />
            </Button>
            <Typography variant="body2" sx={{ mt: 1 }}>
              {selectedCandidate?.resumeFile?.name || 'No file selected'}
            </Typography>
          </Grid>

          <Grid item xs={12}>
            <TextField
              label="Remark"
              name="remark"
              value={selectedCandidate.remark}
              onChange={handleInputChange}
              fullWidth
            />
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" onClick={handleUpdate} fullWidth>
              Update
            </Button>
          </Grid>
        </Grid>
      </>
    )}
  </Box>
</Modal>
      
    </div>
  );
};

export default CandidateList;
