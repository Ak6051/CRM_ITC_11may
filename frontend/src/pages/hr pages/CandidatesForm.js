import React, { useState } from "react";
import {
  Box,
  Button,
  TextField,
  Typography,
  Grid,
  LinearProgress,
  Paper,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import axios from "axios";
import { API_BASE_URL } from "../../config/api.config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx';

const CandidateForm = ({ userId }) => {
  const [formData, setFormData] = useState({
    name: "",
    phoneNumber: "",
    email: "",
    positionName: "",
    qualification:"",
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
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileError, setFileError] = useState('');
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Error states for required fields
  const [errors, setErrors] = useState({
    name: false,
    phoneNumber: false,
    email: false,
    positionName: false,
    qualification: false,
    experience: false,
    currentLocation: false,
    currentPosition: false,
    currentCTC: false
  });


  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setFileError('');
      setResumeFile(file);
    } else {
      e.target.value = '';
    }
  };

  

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validate required fields
    const newErrors = {
      name: !formData.name.trim(),
      phoneNumber: !formData.phoneNumber.trim(),
      email: !formData.email.trim(),
      positionName: !formData.positionName.trim(),
      qualification: !formData.qualification.trim(),
      experience: !formData.experience.trim(),
      currentLocation: !formData.currentLocation.trim(),
      currentPosition: !formData.currentPosition.trim(),
      currentCTC: !formData.currentCTC.trim()
    };
    
    setErrors(newErrors);
    
    // Check if any required field has an error
    const hasErrors = Object.values(newErrors).some(error => error);
    if (hasErrors) {
      toast.error('Please fill in all required fields', {
        position: "top-right",
        autoClose: 4000,
        style: { backgroundColor: "#ffebee", color: "#d32f2f" },
        progressStyle: { background: "#d32f2f" },
      });
      return;
    }
  
    setLoading(true);
    setSuccess(false);
  
    const loadingToast = toast.loading("Submitting candidate details...", {
      position: "top-right",
      style: { backgroundColor: "#e3f2fd", color: "#0d47a1", minWidth: "250px" },
      autoClose: false,
      closeButton: false,
    });
  
    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        alert("Unauthorized: No token found");
        setLoading(false);
        return;
      }
  
      const data = new FormData();
      Object.entries(formData).forEach(([key, value]) =>
        data.append(key, value)
      );
      if (resumeFile) data.append("resumeUpload", resumeFile);
  
      await axios.post(`${API_BASE_URL}/candidate/create-all`, data, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${token}`,
        },
      });
  
      toast.dismiss(loadingToast);
      toast.success("Candidate submitted successfully!", {
        position: "top-right",
        autoClose: 3000,
        style: { backgroundColor: "#e8f5e9", color: "#2e7d32" },
        progressStyle: { background: "#2e7d32" },
      });
  
      setSuccess(true);
      setFormData({
        name: "",
        phoneNumber: "",
        email: "",
        positionName: "",
        qualification:"",
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
      setResumeFile(null);
    } catch (error) {
      toast.dismiss(loadingToast);
  
      if (error.response?.status === 409) {
        toast.info("⚠️ Candidate already exists with this phone number.", {
          position: "top-right",
          autoClose: 4000,
          style: { backgroundColor: "#fff8e1", color: "#ff6f00" },
          progressStyle: { background: "#ff6f00" },
        });
      } else {
        toast.error(error.response?.data?.message || "Submission failed!", {
          position: "top-right",
          autoClose: 5000,
          style: { backgroundColor: "#ffebee", color: "#d32f2f" },
          progressStyle: { background: "#d32f2f" },
        });
      }
    } finally {
      setLoading(false);
    }
  };
  
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
  
    setSelectedExcelFile(file);
    setShowConfirmDialog(true);
  };

  const confirmExcelUpload = () => {
    const file = selectedExcelFile;
    if (!file) return;
  
    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);
  
      if (jsonData.length === 0) {
        toast.error("❌ Empty Excel file", { position: "top-right" });
        setShowConfirmDialog(false);
        return;
      }
  
      // ✅ Filter out entries without phoneNumber
      const validData = jsonData.filter((row) => row.phoneNumber && String(row.phoneNumber).trim() !== "");
      const invalidDataCount = jsonData.length - validData.length;
  
      if (validData.length === 0) {
        toast.error("❌ All rows missing phone number. Cannot import.", {
          position: "top-right",
          autoClose: 5000,
        });
        setShowConfirmDialog(false);
        return;
      }
  
      if (invalidDataCount > 0) {
        toast.warn(`⚠️ ${invalidDataCount} rows skipped due to missing phone number`, {
          position: "top-right",
          autoClose: 4000,
          style: { backgroundColor: "#fff8e1", color: "#ff6f00" },
        });
      }
  
      // 🔄 Simulate loading progress
      let progress = 0;
      const loadingToastId = toast.loading(`Importing candidates... 0%`, {
        position: "top-right",
        progress,
        closeButton: false,
        autoClose: false,
        style: { backgroundColor: "#fff3e0", color: "#ef6c00" },
      });
  
      const simulateProgress = () => {
        return new Promise((resolve) => {
          const interval = setInterval(() => {
            progress += 5;
            if (progress >= 100) {
              clearInterval(interval);
              resolve();
            } else {
              toast.update(loadingToastId, {
                render: `Importing candidates... ${progress}%`,
                progress: progress / 100,
              });
            }
          }, 100);
        });
      };
  
      try {
        await simulateProgress(); // show progress while uploading
  
        const token = sessionStorage.getItem("token");
        const response = await axios.post(
          `${API_BASE_URL}/candidate/bulk-upload`,
          { candidates: validData },
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
  
        const { insertedCount, duplicateCount, skippedPhoneNumbers } = response.data;
  
        toast.update(loadingToastId, {
          render: `✅ Import complete! ${insertedCount} imported, ${duplicateCount} skipped.`,
          type: "success",
          isLoading: false,
          autoClose: 4000,
          progress: 1,
          style: { backgroundColor: "#e8f5e9", color: "#2e7d32" },
        });
  
        if (insertedCount === 0 && duplicateCount === 1 && validData.length === 1) {
          toast.info("⚠️ This candidate is already stored.", {
            position: "top-right",
            autoClose: 4000,
            style: { backgroundColor: "#fff8e1", color: "#ff6f00" },
          });
        }
  
        if (skippedPhoneNumbers?.length) {
          toast.info(
            <>
              <strong>⛔ Skipped Phone Numbers:</strong>
              <ul style={{ margin: 0, paddingLeft: 18 }}>
                {skippedPhoneNumbers.slice(0, 5).map((phone, i) => (
                  <li key={i}>{phone}</li>
                ))}
              </ul>
              {skippedPhoneNumbers.length > 5 && (
                <em>+{skippedPhoneNumbers.length - 5} more</em>
              )}
            </>,
            {
              autoClose: 6000,
              position: "top-right",
              style: { backgroundColor: "#fff8e1", color: "#ff6f00" },
            }
          );
        }
      } catch (err) {
        console.error(err);
        toast.update(loadingToastId, {
          render: "❌ Bulk upload failed!",
          type: "error",
          isLoading: false,
          autoClose: 4000,
          style: { backgroundColor: "#ffebee", color: "#d32f2f" },
        });
      } finally {
        setShowConfirmDialog(false);
        setSelectedExcelFile(null);
      }
    };
  
    reader.readAsArrayBuffer(file);
  };
  

  const handleTemplateDownload = () => {
    const headers = [
      "name",
      "phoneNumber",
      "email",
      "positionName",
      "qualification",
      "experience",
      "currentLocation",
      "currentPosition",
      "currentCTC",
      "expectedCTC",
      "noticePeriod",
      "reasonforLeaving",
      "currentCompany",
      "remark"
    ];

    const worksheet = XLSX.utils.json_to_sheet([], { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CandidatesTemplate");

    XLSX.writeFile(workbook, "Candidate_Template.xlsx");
  };


  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f5" }}>
      <div style={{ position: "fixed", height: "100vh", width: "250px", backgroundColor: "#3f51b5", color: "white" }}>
        <Sidebar />
      </div>

      <Box sx={{ flexGrow: 1, marginLeft: "250px", overflowY: "auto" }}>
        <Navbar />
        <Box sx={{ p: 4 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, backgroundColor: "#ffffff" }}>
            <Typography variant="h4" gutterBottom sx={{ fontWeight: 600, color: "#3f51b5" }}>
              Candidate Application Form
            </Typography>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <Grid container spacing={2}>
                {Object.keys(formData).filter(f => f !== 'createdBy').map((field) => {
                  const isRequired = ['name', 'phoneNumber', 'email', 'positionName', 'qualification', 'experience', 'currentLocation', 'currentPosition', 'currentCTC'].includes(field);
                  const fieldName = field.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase());
                  
                  return (
                  <Grid item xs={12} sm={6} key={field}>
                    <TextField
                      fullWidth
                      name={field}
                      label={fieldName}
                      value={formData[field]}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors[field]) {
                          setErrors(prev => ({ ...prev, [field]: false }));
                        }
                      }}
                      variant="outlined"
                      size="medium"
                      InputProps={{ style: { height: 50 } }}
                      error={errors[field]}
                      helperText={errors[field] ? `${fieldName} is required` : ""}
                      required={isRequired}
                    />
                  </Grid>
                  );
                })}

                {loading && (
                  <Grid item xs={12}>
                    <LinearProgress color="primary" />
                  </Grid>
                )}

                {success && (
                  <Grid item xs={12} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <CheckCircleIcon sx={{ color: 'green' }} />
                    <Typography sx={{ fontWeight: 600, color: 'green' }}>
                      Candidate created successfully!
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 2, flexWrap: "wrap", mt: 2 }}>
                    <Button variant="outlined" component="label" sx={{ textTransform: "none", height: 45 }}>
                      Upload Resume (PDF)
                      <input type="file" accept=".pdf" hidden onChange={handleFileChange} />
                    </Button>

                    <Button
                      type="submit"
                      variant="contained"
                      disabled={loading}
                      sx={{
                        background: "linear-gradient(to right, #3f51b5, #1e88e5)",
                        color: "white",
                        fontWeight: 600,
                        px: 4,
                        height: 45,
                        borderRadius: 2,
                        textTransform: "none",
                        '&:hover': {
                          background: "linear-gradient(to right, #1e88e5, #3f51b5)",
                        },
                      }}
                    >
                      Submit Candidate
                    </Button>
                  </Box>

                  {resumeFile && (
                    <Typography variant="body2" align="center" mt={1}>
                      Selected File: {resumeFile.name}
                    </Typography>
                  )}
                  {fileError && (
                    <Typography variant="caption" color="error" display="block" align="center" mt={1}>
                      {fileError}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* ✅ Bulk Excel Upload Section */}
          <Paper elevation={3} sx={{ p: 4, mt: 4, borderRadius: 3, backgroundColor: "#ffffff" }}>
            <Typography variant="h5" gutterBottom sx={{ fontWeight: 600, color: "#3f51b5" }}>
              Bulk Import Candidates (Excel)
            </Typography>

            <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
              <Button variant="outlined" component="label" sx={{ textTransform: "none", height: 45 }}>
                Upload Excel File
                <input type="file" accept=".xlsx, .csv" hidden onChange={handleExcelUpload} />
              </Button>
              
              <Button
                variant="outlined"
                onClick={handleTemplateDownload}
                sx={{
                  textTransform: "none",
                  height: 45,
                  borderColor: "#1e88e5",
                  color: "#1e88e5",
                  '&:hover': { backgroundColor: "#e3f2fd", borderColor: "#1e88e5" }
                }}
              >
                Download Template
              </Button>

              <Typography variant="body2" color="textSecondary">
                Accepted file formats: .xlsx, .csv
              </Typography>
            </Box>
          </Paper>

          <Dialog
  open={showConfirmDialog}
  onClose={() => setShowConfirmDialog(false)}
  PaperProps={{
    sx: {
      borderRadius: 3,
      padding: 2,
      width: 400,
      background: '#fafafa',
      boxShadow: 10,
    }
  }}
>
  <DialogTitle sx={{ textAlign: 'center', fontWeight: 700, color: '#3f51b5' }}>
    📁 Confirm Excel Import
  </DialogTitle>

  <DialogContent>
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mt: 1 }}>
      <Typography variant="body1" sx={{ textAlign: 'center', color: '#555' }}>
        You're about to import candidate data from the following file:
      </Typography>

      <Box
        sx={{
          backgroundColor: '#e3f2fd',
          color: '#0d47a1',
          padding: '10px 15px',
          borderRadius: 2,
          fontWeight: 600,
          fontSize: '0.95rem',
          wordBreak: 'break-all',
        }}
      >
        {selectedExcelFile?.name}
      </Box>

      <Typography variant="body2" sx={{ color: '#888', textAlign: 'center' }}>
        Make sure your file follows the required column structure.
        <br />
        This action will insert all valid rows into the system.
      </Typography>
    </Box>
  </DialogContent>

  <DialogActions sx={{ justifyContent: 'center', gap: 2, pb: 2 }}>
    <Button
      onClick={confirmExcelUpload}
      variant="contained"
      sx={{
        background: 'linear-gradient(to right, #3f51b5, #1e88e5)',
        color: '#fff',
        textTransform: 'none',
        px: 4,
        borderRadius: 2,
        fontWeight: 600,
        '&:hover': {
          background: 'linear-gradient(to right, #1e88e5, #3f51b5)',
        },
      }}
    >
      Yes, Import
    </Button>

    <Button
      onClick={() => {
        setShowConfirmDialog(false);
        setSelectedExcelFile(null);
      }}
      variant="outlined"
      sx={{
        textTransform: 'none',
        borderColor: '#d32f2f',
        color: '#d32f2f',
        px: 4,
        fontWeight: 600,
        '&:hover': {
          backgroundColor: '#ffebee',
          borderColor: '#d32f2f',
        },
      }}
    >
      Cancel
    </Button>
  </DialogActions>
</Dialog>


        </Box>
      </Box>
    </div>
  );
};

export default CandidateForm;
