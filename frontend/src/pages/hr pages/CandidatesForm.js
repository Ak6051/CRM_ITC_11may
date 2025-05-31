// import React, { useState } from "react";
// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
//   Grid,
// } from "@mui/material";
// import Navbar from '../../components/hr components/HrNavbar';
// import Sidebar from '../../components/hr components/HrSidebar';
// import axios from "axios";
// import { toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";

// const CandidateForm = ({ userId }) => {
//   const [formData, setFormData] = useState({
//     name: "",
//     phoneNumber: "",
//     positionName: "",
//     experience: "",
//     currentLocation: "",
//     currentPosition: "",
//     currentCTC: "",
//     expectedCTC: "",
//     noticePeriod: "",
//     reasonforLeaving: "",
//     currentCompany: "",
//     remark: "",
//     createdBy: userId || "",
//   });

//   const [resumeFile, setResumeFile] = useState(null);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData((prev) => ({ ...prev, [name]: value }));
//   };

//   const handleFileChange = (e) => {
//     setResumeFile(e.target.files[0]);
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     try {
//       const token = sessionStorage.getItem("token");
//       if (!token) {
//         alert("Unauthorized: No token found");
//         return;
//       }

//       const data = new FormData();
//       Object.entries(formData).forEach(([key, value]) => {
//         data.append(key, value);
//       });

//       if (resumeFile) {
//         data.append("resumeUpload", resumeFile);
//       }

//       const response = await axios.post("http://localhost:5000/api/candidate/create-all", data, {
//         headers: {
//           "Content-Type": "multipart/form-data",
//           Authorization: `Bearer ${token}`,
//         },
//       });

// toast.success("Candidate submitted successfully!");
//       setFormData({
//         name: "",
//         phoneNumber: "",
//         positionName: "",
//         experience: "",
//         currentLocation: "",
//         currentPosition: "",
//         currentCTC: "",
//         expectedCTC: "",
//         noticePeriod: "",
//         reasonforLeaving: "",
//         currentCompany: "",
//         remark: "",
//         createdBy: userId || "",
//       });
  
//       setResumeFile(null); // Clear file
  
//     } catch (error) {
//       console.error(error);
// toast.error("Submission failed!");
//     }
//   };

//   return (
    
//   <div style={{ display: "flex", height: "100vh", backgroundColor: "#f5f5f5", overflow: "hidden" }}>
//     <div style={{ position: "fixed", height: "100vh", width: "250px", backgroundColor: "#3f51b5", color: "white" }}>
//       <Sidebar />
//     </div>
  
//     <Box
//       sx={{
//         flexGrow: 1,
//         display: "flex",
//         flexDirection: "column",
//         marginLeft: "250px",
//         height: "100vh",
//         overflow: "hidden",
//       }}
//     >
//       <Navbar />
//     <Box p={4} sx={{ width: '100%' }}>
//       <Typography variant="h5" gutterBottom>
//         Candidate Application Form
//       </Typography>
//       <form onSubmit={handleSubmit} encType="multipart/form-data">
//         <Grid container spacing={2}>
//           {[
//             "name",
//             "phoneNumber",
//             "positionName",
//             "experience",
//             "currentLocation",
//             "currentPosition",
//             "currentCTC",
//             "expectedCTC",
//             "noticePeriod",
//             "reasonforLeaving",
//             "currentCompany",
//             "remark",
//           ].map((field) => (
//             <Grid item xs={12} sm={6} key={field}>
//               <TextField
//                 fullWidth
//                 name={field}
//                 label={field.replace(/([A-Z])/g, " $1")}
//                 value={formData[field]}
//                 onChange={handleChange}
//               />
//             </Grid>
//           ))}

//           <Grid item xs={12}>
//             <Button variant="contained" component="label">
//               Upload Resume (PDF)
//               <input
//                 type="file"
//                 accept=".pdf"
//                 hidden
//                 onChange={handleFileChange}
//               />
//             </Button>
//             {resumeFile && (
//               <Typography variant="body2" mt={1}>
//                 Selected File: {resumeFile.name}
//               </Typography>
//             )}
//           </Grid>

//           <Grid item xs={12}>
//             <Button type="submit" variant="contained" color="primary">
//               Submit Candidate
//             </Button>
//           </Grid>
//         </Grid>
//       </form>
//     </Box>
//     </Box>
//     </div>
    
    
//   );
// };

// export default CandidateForm;
import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  LinearProgress,
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import axios from "axios";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const CandidateForm = ({ userId }) => {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
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
    createdBy: userId || "",
  });

  const [resumeFile, setResumeFile] = useState(null);
  
  // New states for loading and success
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    setResumeFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setSuccess(false);

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("Unauthorized: No token found");
        setLoading(false);
        return;
      }

      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) => {
        data.append(key, value);
      });

      if (resumeFile) {
        data.append("resumeUpload", resumeFile);
      }

      const response = await axios.post("http://localhost:5000/api/candidate/create-all", data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });

      toast.success("Candidate submitted successfully!");
      setSuccess(true);

      setFormData({
        name: "",
        phoneNumber: "",
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
        createdBy: userId || "",
      });

      setResumeFile(null); // Clear file

    } catch (error) {
      console.error(error);
      toast.error("Submission failed!");
    } finally {
      setLoading(false);
    }
  };

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
        <Box p={4} sx={{ width: '100%' }}>
          <Typography variant="h5" gutterBottom>
            Candidate Application Form
          </Typography>
          <form onSubmit={handleSubmit} encType="multipart/form-data">
            <Grid container spacing={2}>
              {[
                "name",
                "phoneNumber",
                "positionName",
                "experience",
                "currentLocation",
                "currentPosition",
                "currentCTC",
                "expectedCTC",
                "noticePeriod",
                "reasonforLeaving",
                "currentCompany",
                "remark",
              ].map((field) => (
                <Grid item xs={12} sm={6} key={field}>
                  <TextField
                    fullWidth
                    name={field}
                    label={field.replace(/([A-Z])/g, " $1")}
                    value={formData[field]}
                    onChange={handleChange}
                  />
                </Grid>
              ))}

              <Grid item xs={12}>
                <Button variant="contained" component="label">
                  Upload Resume (PDF)
                  <input
                    type="file"
                    accept=".pdf"
                    hidden
                    onChange={handleFileChange}
                  />
                </Button>
                {resumeFile && (
                  <Typography variant="body2" mt={1}>
                    Selected File: {resumeFile.name}
                  </Typography>
                )}
              </Grid>

              {/* Loading Progress Bar */}
              {loading && (
                <Grid item xs={12}>
                  <LinearProgress color="primary" />
                </Grid>
              )}

              {/* Success message with green tick */}
              {success && (
                <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <CheckCircleIcon sx={{ color: 'green' }} />
                  <Typography sx={{ fontWeight: 600, color: 'green' }}>
                    Candidate created successfully!
                  </Typography>
                </Grid>
              )}

              <Grid item xs={12}>
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}  // Disable button while loading
                >
                  Submit Candidate
                </Button>
              </Grid>
            </Grid>
          </form>
        </Box>
      </Box>
    </div>
  );
};

export default CandidateForm;
