import React, { useState, useEffect } from "react";
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
  Autocomplete,
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  InputAdornment,
  IconButton,
  Tooltip,
} from "@mui/material";
import VisibilityIcon from '@mui/icons-material/Visibility';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import axios from "axios";
import { API_BASE_URL } from "../../config/api.config";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import * as XLSX from 'xlsx';
import { useNavigate } from "react-router-dom";

const AdminCandidateForm = ({ userId, onSuccess, candidateData = null, isEdit = false }) => {
  const navigate = useNavigate();
  const [duplicateCandidate, setDuplicateCandidate] = useState(null); // { id, name } when phone already exists
  const [formData, setFormData] = useState({
    name: candidateData?.name || "",
    phoneNumber: candidateData?.phoneNumber || "",
    email: candidateData?.email || "",
    positionName: candidateData?.positionName || "",
    qualification: candidateData?.qualification || "",
    experience: candidateData?.experience || "",
    currentLocation: candidateData?.currentLocation || "",
    preferredLocation: candidateData?.preferredLocation || "",
    currentPosition: candidateData?.currentPosition || "",
    industry: candidateData?.industry || "",
    gender: candidateData?.gender || "",
    currentCTC: candidateData?.currentCTC || "",
    expectedCTC: candidateData?.expectedCTC || "",
    noticePeriod: candidateData?.noticePeriod || "",
    reasonforLeaving: candidateData?.reasonforLeaving || "",
    currentCompany: candidateData?.currentCompany || "",
    remark: candidateData?.remark || "",
    createdBy: candidateData?.createdBy || userId || "",
  });

  // Update formData when candidateData changes (for edit mode)
  useEffect(() => {
    if (candidateData) {
      setFormData({
        name: candidateData.name || "",
        phoneNumber: candidateData.phoneNumber || "",
        email: candidateData.email || "",
        positionName: candidateData.positionName || "",
        qualification: candidateData.qualification || "",
        experience: candidateData.experience || "",
        currentLocation: candidateData.currentLocation || "",
        preferredLocation: candidateData.preferredLocation || "",
        currentPosition: candidateData.currentPosition || "",
        industry: candidateData.industry || "",
        gender: candidateData.gender || "",
        currentCTC: candidateData.currentCTC || "",
        expectedCTC: candidateData.expectedCTC || "",
        noticePeriod: candidateData.noticePeriod || "",
        reasonforLeaving: candidateData.reasonforLeaving || "",
        currentCompany: candidateData.currentCompany || "",
        remark: candidateData.remark || "",
        createdBy: candidateData.createdBy || userId || "",
      });
    }
  }, [candidateData, userId]);

  const [resumeFile, setResumeFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [fileError, setFileError] = useState('');
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [positions, setPositions] = useState([]);
  const [loadingPositions, setLoadingPositions] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");


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
    currentCTC: false,
    resumeFile: false
  });


  // Real-time phone duplicate check
  useEffect(() => {
    const phone = formData.phoneNumber;
    if (!phone || phone.length !== 10 || isEdit) {
      setDuplicateCandidate(null);
      return;
    }
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/candidate/check-phone?phone=${phone}`, {
          headers: { Authorization: `Bearer ${token}` },
          signal: controller.signal,
        });
        if (res.data?.exists) {
          setDuplicateCandidate({ id: res.data.id, name: res.data.name });
        } else {
          setDuplicateCandidate(null);
        }
      } catch (err) {
        if (err.name !== 'CanceledError' && err.name !== 'AbortError') {
          setDuplicateCandidate(null);
        }
      }
    }, 400);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [formData.phoneNumber, isEdit]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    // Reset duplicate state when phone number changes
    if (name === 'phoneNumber') {
      setDuplicateCandidate(null);
    }

    // Special handling for numeric fields
    if (['phoneNumber', 'currentCTC', 'expectedCTC', 'experience', 'noticePeriod'].includes(name)) {
      if (name === 'phoneNumber') {
        const numericValue = value.replace(/\D/g, '');
        setFormData(prev => ({ ...prev, [name]: numericValue.slice(0, 10) }));
      } else {
        // Allow decimal values
        if (value === '' || /^\d*\.?\d*$/.test(value)) {
          setFormData(prev => ({ ...prev, [name]: value }));
        }
      }
      return;
    }

    if ([
      'name',
      'positionName',
      'currentLocation',
      'preferredLocation',
      'currentPosition',
      'qualification',
      'currentCompany',
      'industry',
      'reasonforLeaving',
      'remark'
    ].includes(name)) {
      // Capitalize first letter of each word (preserve rest of casing)
      const capitalizedValue = value.replace(/\b\w/g, (char) => char.toUpperCase());
      setFormData(prev => ({ ...prev, [name]: capitalizedValue }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
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

  useEffect(() => {
    const fetchPositions = async () => {
      if (!searchTerm) {
        setPositions([]);
        return;
      }

      try {
        setLoadingPositions(true);
        const res = await fetch(`${API_BASE_URL}/candidate?search=${encodeURIComponent(searchTerm)}`);
        const data = await res.json();

        if (data?.success && Array.isArray(data.positions)) {
          setPositions(data.positions);
        } else {
          setPositions([]);
        }
      } catch (err) {
        console.error("Error fetching positions:", err);
        setPositions([]);
      } finally {
        setLoadingPositions(false);
      }
    };

    const delayDebounce = setTimeout(fetchPositions, 500); // 0.5s delay for typing
    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handlePositionChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      positionName: newValue || ""
    }));
  };

  const handleExperienceChange = (event, newValue) => {
    setFormData(prev => ({
      ...prev,
      experience: newValue || ""
    }));

    // Clear error if any
    if (errors.experience) {
      setErrors(prev => ({ ...prev, experience: false }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const submitData = {
      ...formData,
      currentCTC: formData.currentCTC ? Number(formData.currentCTC) : 0,
      expectedCTC: formData.expectedCTC ? Number(formData.expectedCTC) : 0,
      experience: formData.experience ? Number(formData.experience) : 0,
      noticePeriod: formData.noticePeriod ? Number(formData.noticePeriod) : 0,
    };

    // Validate required fields
    const newErrors = {
      name: !formData.name.trim(),
      phoneNumber: !formData.phoneNumber.trim(),
      email: !formData.email.trim(),
      positionName: !formData.positionName.trim(),
      qualification: !formData.qualification.trim(),
      experience: !String(formData.experience).trim(),
      currentLocation: !formData.currentLocation.trim(),
      currentPosition: !formData.currentPosition.trim(),
      currentCTC: !String(formData.currentCTC).trim(),
      expectedCTC: !String(formData.expectedCTC).trim(),
      resumeFile: !isEdit && !resumeFile, // Only required for new candidates
      noticePeriod: !String(formData.noticePeriod).trim(),
    };

    if (resumeFile) {
      setFileError('');
    } else {
      setFileError('Resume is required');
    }

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

    const loadingToast = toast.loading(isEdit ? "Updating candidate..." : "Submitting candidate details...", {
      position: "top-right",
      style: { backgroundColor: "#e3f2fd", color: "#0d47a1", minWidth: "250px" },
      closeButton: false,
    });

    try {
      const token = sessionStorage.getItem("token");
      if (!token) {
        setLoading(false);
        return;
      }

      const data = new FormData();
      Object.entries(submitData).forEach(([key, value]) => {
        if (value !== null && value !== undefined) {
          data.append(key, value);
        }
      });

      if (resumeFile) data.append("resumeUpload", resumeFile);

      if (isEdit) {
        await axios.put(`${API_BASE_URL}/candidate/update/${candidateData._id || candidateData.id}`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        toast.dismiss(loadingToast);
        toast.success("Candidate updated successfully!", {
          position: "top-right",
          style: { backgroundColor: "#e8f5e9", color: "#2e7d32" },
        });
      } else {
        await axios.post(`${API_BASE_URL}/candidate/create-all`, data, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: `Bearer ${token}`,
          },
        });
        toast.dismiss(loadingToast);
        toast.success("Candidate submitted successfully!", {
          position: "top-right",
          style: { backgroundColor: "#e8f5e9", color: "#2e7d32" },
        });
      }

      setSuccess(true);
      if (!isEdit) {
        setFormData({
          name: "",
          phoneNumber: "",
          email: "",
          positionName: "",
          qualification: "",
          experience: "",
          currentLocation: "",
          preferredLocation: "",
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
      }

      if (onSuccess) onSuccess();
    } catch (error) {
      toast.dismiss(loadingToast);

      if (error.response?.status === 409 && !isEdit) {
        const { existingId, existingName } = error.response.data || {};
        if (existingId) {
          setDuplicateCandidate({ id: existingId, name: existingName || 'this candidate' });
        }
        toast.info("⚠️ Candidate already exists with this phone number.", {
          position: "top-right",
          style: { backgroundColor: "#fff8e1", color: "#ff6f00" },
        });
      } else {
        toast.error(`❌ Error: ${error.response?.data?.message || "Something went wrong"}`, {
          position: "top-right",
          style: { backgroundColor: "#ffebee", color: "#c62828" },
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
    e.target.value = null;
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

      // ── Required field validation (mirrors form validation) ──────────────
      const REQUIRED = ['name', 'phoneNumber', 'email', 'positionName', 'qualification', 'experience', 'currentLocation', 'currentPosition', 'currentCTC', 'noticePeriod'];
      const rowErrors = [];
      jsonData.forEach((row, i) => {
        const missing = REQUIRED.filter(f => !row[f] || String(row[f]).trim() === '');
        if (missing.length) {
          rowErrors.push(`Row ${i + 2}: missing ${missing.join(', ')}`);
        } else {
          // Check for valid phone number (must be 10 digits after non-digits are stripped)
          const rawPhone = String(row.phoneNumber);
          const cleanedPhone = rawPhone.replace(/\D/g, '').slice(-10);
          if (!cleanedPhone || cleanedPhone.length !== 10) {
            rowErrors.push(`Row ${i + 2}: phoneNumber must be a valid 10-digit number (found "${rawPhone}")`);
          }

          // Check for numeric validity in specific fields
          const numericFields = ['currentCTC', 'expectedCTC', 'experience', 'noticePeriod'];
          numericFields.forEach(field => {
            if (row[field] != null) {
              const val = String(row[field]).replace(/[, \s]/g, ''); // strip commas and spaces
              if (val !== '' && isNaN(Number(val))) {
                rowErrors.push(`Row ${i + 2}: ${field} must be a number (found "${row[field]}")`);
              }
            }
          });
        }
      });

      if (rowErrors.length > 0) {
        toast.error(
          <div>
            <strong>❌ Validation failed — fix these rows:</strong>
            <ul style={{ margin: '6px 0 0', paddingLeft: 18, fontSize: 12 }}>
              {rowErrors.slice(0, 8).map((e, i) => <li key={i}>{e}</li>)}
              {rowErrors.length > 8 && <li>...and {rowErrors.length - 8} more</li>}
            </ul>
          </div>,
          { position: "top-right", autoClose: false, closeOnClick: true }
        );
        setShowConfirmDialog(false);
        return;
      }

      const processedData = jsonData.map(row => {
        const rawPhone = row.phoneNumber != null ? String(row.phoneNumber) : '';
        const cleanedPhone = rawPhone.replace(/\D/g, '').slice(-10);

        return {
          ...row,
          phoneNumber: cleanedPhone,
          currentCTC: row.currentCTC != null ? (Number(String(row.currentCTC).replace(/[^0-9.]/g, '')) || 0) : row.currentCTC,
          expectedCTC: row.expectedCTC != null ? (Number(String(row.expectedCTC).replace(/[^0-9.]/g, '')) || 0) : row.expectedCTC,
          experience: row.experience != null ? (Number(String(row.experience).replace(/[^0-9.]/g, '')) || 0) : row.experience,
          noticePeriod: row.noticePeriod != null ? (Number(String(row.noticePeriod).replace(/[^0-9.]/g, '')) || 0) : row.noticePeriod,
        };
      });

      // ── Filter out duplicate phone numbers within the sheet itself (self-de-duplication) ──
      const validData = [];
      const seenPhones = new Set();
      let duplicateSheetCount = 0;

      processedData.forEach((row) => {
        if (row.phoneNumber && row.phoneNumber.length === 10) {
          if (seenPhones.has(row.phoneNumber)) {
            duplicateSheetCount++;
          } else {
            seenPhones.add(row.phoneNumber);
            validData.push(row);
          }
        }
      });

      if (validData.length === 0) {
        toast.error("❌ All rows missing valid 10-digit phone number. Cannot import.", { position: "top-right", autoClose: 5000 });
        setShowConfirmDialog(false);
        return;
      }

      if (duplicateSheetCount > 0) {
        toast.warn(`⚠️ ${duplicateSheetCount} duplicate candidates inside the sheet were skipped.`, {
          position: "top-right", autoClose: 4000,
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
      "preferredLocation",
      "currentPosition",
      "currentCTC",
      "expectedCTC",
      "noticePeriod",
      "reasonforLeaving",
      "currentCompany",
      "industry",
      "gender",
      "remark"
    ];

    // Sample row — one real-looking example
    const sampleRows = [
      {
        name: "Rahul Sharma",
        phoneNumber: "9876543210",
        email: "rahul.sharma@email.com",
        positionName: "Software Engineer",
        qualification: "B.Tech",
        currentCTC: 20000,   // monthly ₹ (numbers only)
        expectedCTC: 28000,   // monthly ₹ (numbers only)
        noticePeriod: 30,      // days (numbers only)
        reasonforLeaving: "Better Growth Opportunity",
        currentCompany: "Tech Solutions Pvt Ltd",
        industry: "IT",
        gender: "Male",
        remark: "Good communication skills",
      },
    ];


    // Build worksheet with headers + sample rows
    const worksheet = XLSX.utils.json_to_sheet(sampleRows, { header: headers });

    // ── Column widths ──────────────────────────────────────────────────────
    const colWidths = [
      { wch: 20 }, // name
      { wch: 15 }, // phoneNumber
      { wch: 25 }, // email
      { wch: 20 }, // positionName
      { wch: 15 }, // qualification
      { wch: 15 }, // experience
      { wch: 18 }, // currentLocation
      { wch: 18 }, // preferredLocation
      { wch: 20 }, // currentPosition
      { wch: 12 }, // currentCTC
      { wch: 12 }, // expectedCTC
      { wch: 15 }, // noticePeriod
      { wch: 25 }, // reasonforLeaving
      { wch: 25 }, // currentCompany
      { wch: 15 }, // industry
      { wch: 10 }, // gender
      { wch: 30 }, // remark
    ];
    worksheet['!cols'] = colWidths;

    // ── Add instructions at the bottom ──
    const lastRow = sampleRows.length + 2;
    XLSX.utils.sheet_add_aoa(worksheet, [
      [""], // empty row
      ["📢 INSTRUCTIONS & RULES:"],
      ["1. Do NOT change the header names in the first row."],
      ["2. currentCTC & expectedCTC: Enter monthly amount in numbers (decimals allowed, e.g. 20000.5)."],
      ["3. experience: Enter number of years (decimals allowed, e.g. 2.5)."],
      ["4. noticePeriod: Enter number of days (decimals allowed, e.g. 30.5)."],
      ["5. phoneNumber: Must be a 10-digit number."],
      ["6. Required Columns: name, phoneNumber, email, positionName, qualification, experience, currentLocation, currentPosition, currentCTC, noticePeriod"],
      [""],
      ["VALID VALUES FOR DROPDOWNS:"],
      ["Gender:", "Male | Female | Other"]
    ], { origin: { r: lastRow, c: 0 } });

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "CandidatesTemplate");

    XLSX.writeFile(workbook, "Candidate_Import_Template.xlsx");
  };


  return onSuccess ? (
    // Dialog mode - Only form without Sidebar/Navbar
    <Box sx={{ width: '100%' }}>
      <Paper elevation={0} sx={{ p: 2, borderRadius: 2, backgroundColor: "#ffffff", boxShadow: 'none' }}>
        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <Grid container spacing={1.5}>
            {Object.keys(formData)
              .filter((f) => f !== "createdBy")
              .map((field) => {
                const isRequired = [
                  "name",
                  "phoneNumber",
                  "email",
                  "positionName",
                  "qualification",
                  "experience",
                  "currentLocation",
                  "currentPosition",
                ].includes(field);

                const fieldName = field
                  .replace(/([A-Z])/g, " $1")
                  .replace(/^./, (str) => str.toUpperCase());

                if (field === "phoneNumber") {
                  return (
                    <Grid item xs={12} sm={6} md={3} key={field}>
                      <TextField
                        fullWidth
                        name="phoneNumber"
                        label="Phone Number"
                        value={formData.phoneNumber}
                        onChange={(e) => {
                          handleChange(e);
                          if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: false }));
                        }}
                        variant="outlined"
                        size="medium"
                        InputProps={{
                          style: { height: 44 },
                          endAdornment: duplicateCandidate ? (
                            <InputAdornment position="end">
                              <Tooltip title={`View existing candidate: ${duplicateCandidate.name}`}>
                                <IconButton
                                  size="small"
                                  onClick={() => navigate(`/can-rep?phone=${formData.phoneNumber}`)}
                                  sx={{ color: '#f59e0b' }}
                                >
                                  <VisibilityIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </InputAdornment>
                          ) : null,
                        }}
                        error={errors.phoneNumber}
                        helperText={
                          errors.phoneNumber
                            ? "Phone Number is required"
                            : duplicateCandidate
                            ? `Already exists: ${duplicateCandidate.name}`
                            : ""
                        }
                        FormHelperTextProps={duplicateCandidate ? { sx: { color: '#f59e0b', fontWeight: 600 } } : {}}
                        required
                      />
                    </Grid>
                  );
                }

                if (field === "positionName") {
                  return (
                    <Grid item xs={12} sm={6} md={3} key={field}>
                      <Autocomplete
                        freeSolo
                        options={positions}
                        value={formData.positionName}
                        onChange={handlePositionChange}
                        onInputChange={(event, newInputValue) => {
                          setFormData((prev) => ({ ...prev, positionName: newInputValue }));
                          setSearchTerm(newInputValue);
                        }}
                        loading={loadingPositions}
                        renderInput={(params) => (
                          <TextField
                            {...params}
                            fullWidth
                            label="Position Name"
                            variant="outlined"
                            size="medium"
                            InputProps={{
                              ...params.InputProps,
                              style: { height: 44 },
                              endAdornment: (
                                <>
                                  {loadingPositions ? <CircularProgress size={20} /> : null}
                                  {params.InputProps.endAdornment}
                                </>
                              ),
                            }}
                            error={errors.positionName}
                            helperText={errors.positionName ? "Position Name is required" : ""}
                            required
                          />
                        )}
                        noOptionsText={searchTerm ? "No matching positions found" : "Type to search positions"}
                      />
                    </Grid>
                  );
                }

                if (field === "experience") {
                  return (
                    <Grid item xs={12} sm={6} md={3} key={field}>
                      <TextField
                        fullWidth
                        name="experience"
                        label="Experience (Years)"
                        placeholder="e.g. 2"
                        type="number"
                        value={formData.experience || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="medium"
                        InputProps={{ style: { height: 44 } }}
                        error={errors.experience}
                        helperText={errors.experience ? "Experience is required" : ""}
                        required
                      />
                    </Grid>
                  );
                }

                if (field === "currentCTC") {
                  return (
                    <Grid item xs={12} sm={6} md={3} key={field}>
                      <TextField
                        fullWidth
                        name="currentCTC"
                        label="Current CTC (Monthly ₹)"
                        placeholder="e.g. 20000"
                        value={formData.currentCTC || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="medium"
                        InputProps={{
                          style: { height: 44 },
                        }}
                        error={errors.currentCTC}
                        helperText={
                          errors.currentCTC
                            ? "Current CTC is required"
                            : "Enter monthly amount in ₹"
                        }
                        required
                      />
                    </Grid>
                  );
                }

                if (field === "noticePeriod") {
                  return (
                    <Grid item xs={12} sm={6} md={3} key={field}>
                      <TextField
                        fullWidth
                        name="noticePeriod"
                        label="Notice Period (Days)"
                        placeholder="e.g. 30"
                        type="number"
                        value={formData.noticePeriod || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="medium"
                        InputProps={{ style: { height: 44 } }}
                        error={errors.noticePeriod}
                        helperText={errors.noticePeriod ? "Notice Period is required" : ""}
                        required
                      />
                    </Grid>
                  );
                }

                if (field === "gender") {
                  return (
                    <Grid item xs={12} sm={6} md={3} key={field}>
                      <FormControl fullWidth>
                        <InputLabel>Gender</InputLabel>
                        <Select
                          value={formData.gender || ""}
                          label="Gender"
                          onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                          sx={{ height: 44 }}
                        >
                          <MenuItem value="Male">Male</MenuItem>
                          <MenuItem value="Female">Female</MenuItem>
                          <MenuItem value="Other">Other</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  );
                }

                if (field === "expectedCTC") {
                  return (
                    <Grid item xs={12} sm={6} md={3} key={field}>
                      <TextField
                        fullWidth
                        name="expectedCTC"
                        label="Expected CTC (Monthly ₹)"
                        placeholder="e.g. 25000"
                        value={formData.expectedCTC || ''}
                        onChange={handleChange}
                        variant="outlined"
                        size="medium"
                        InputProps={{
                          style: { height: 44 },
                        }}
                        error={errors.expectedCTC}
                        helperText={
                          errors.expectedCTC
                            ? "Expected CTC is required"
                            : "Enter monthly amount in ₹"
                        }
                        required
                      />
                    </Grid>
                  );
                }

                return (
                  <Grid item xs={12} sm={6} md={3} key={field}>
                    <TextField
                      fullWidth
                      name={field}
                      label={fieldName}
                      value={formData[field]}
                      onChange={(e) => {
                        handleChange(e);
                        if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
                      }}
                      variant="outlined"
                      size="medium"
                      InputProps={{ style: { height: 44 } }}
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
              <Grid item xs={12} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <CheckCircleIcon sx={{ color: "green" }} />
                <Typography sx={{ fontWeight: 600, color: "green" }}>
                  Candidate {isEdit ? "updated" : "created"} successfully!
                </Typography>
              </Grid>
            )}

            <Grid item xs={12}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: 2,
                  flexWrap: "wrap",
                  mt: 2,
                }}
              >
                <Button
                  variant="outlined"
                  component="label"
                  sx={{ textTransform: "none", height: 45 }}
                >
                  {isEdit ? "Update Resume (PDF/Word)" : "Upload Resume (PDF/Word)"}
                  <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFileChange} />
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
                    "&:hover": {
                      background: "linear-gradient(to right, #1e88e5, #3f51b5)",
                    },
                  }}
                >
                  {isEdit ? "Update Candidate" : "Submit Candidate"}
                </Button>
              </Box>

              {resumeFile && (
                <Typography variant="body2" align="center" mt={1}>
                  Selected File: {resumeFile.name}
                </Typography>
              )}
              {fileError && (
                <Typography
                  variant="caption"
                  color="error"
                  display="block"
                  align="center"
                  mt={1}
                >
                  {fileError}
                </Typography>
              )}
            </Grid>
          </Grid>
        </form>
      </Paper>

      {/* Excel Upload Section - Only in dialog mode */}
      {!isEdit && (
        <Box sx={{ mt: 4, pt: 3, borderTop: "1px dashed #c5cae9" }}>
          <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: "#3f51b5" }}>
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
        </Box>
      )}

      {/* Excel Upload Confirmation Dialog */}
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
  ) : (
    // Standalone page mode - Full page with Sidebar/Navbar
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f5" }}>
      <div style={{ position: "fixed", height: "100vh", width: "250px", backgroundColor: "#3f51b5", color: "white" }}>
        <Sidebar />
      </div>

      <Box sx={{ flexGrow: 1, marginLeft: "250px", overflowY: "auto" }}>
        <Navbar />
        <Box sx={{ p: 4 }}>
          <Paper elevation={3} sx={{ p: 4, borderRadius: 3, backgroundColor: "#ffffff" }}>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#1e3a8a', mb: 1 }}>
              {isEdit ? "Edit Candidate Details" : "Candidate Application Form"}
            </Typography>

            <form onSubmit={handleSubmit} encType="multipart/form-data">
              <Grid container spacing={2}>
                {Object.keys(formData)
                  .filter((f) => f !== "createdBy")
                  .map((field) => {
                    const isRequired = [
                      "name",
                      "phoneNumber",
                      "email",
                      "positionName",
                      "qualification",
                      "experience",
                      "currentLocation",
                      "currentPosition",
                    ].includes(field);

                    const fieldName = field
                      .replace(/([A-Z])/g, " $1")
                      .replace(/^./, (str) => str.toUpperCase());

                    if (field === "phoneNumber") {
                      return (
                        <Grid item xs={12} sm={6} key={field}>
                          <TextField
                            fullWidth
                            name="phoneNumber"
                            label="Phone Number *"
                            value={formData.phoneNumber}
                            onChange={(e) => {
                              handleChange(e);
                              if (errors.phoneNumber) setErrors((prev) => ({ ...prev, phoneNumber: false }));
                            }}
                            variant="outlined"
                            size="medium"
                            InputProps={{
                              style: { height: 50 },
                              endAdornment: duplicateCandidate ? (
                                <InputAdornment position="end">
                                  <Tooltip title={`View existing candidate: ${duplicateCandidate.name}`}>
                                    <IconButton
                                      size="small"
                                      onClick={() => navigate(`/can-rep?phone=${formData.phoneNumber}`)}
                                      sx={{ color: '#f59e0b' }}
                                    >
                                      <VisibilityIcon fontSize="small" />
                                    </IconButton>
                                  </Tooltip>
                                </InputAdornment>
                              ) : null,
                            }}
                            error={errors.phoneNumber}
                            helperText={
                              errors.phoneNumber
                                ? "Phone Number is required"
                                : duplicateCandidate
                                ? `Already exists: ${duplicateCandidate.name}`
                                : ""
                            }
                            FormHelperTextProps={duplicateCandidate ? { sx: { color: '#f59e0b', fontWeight: 600 } } : {}}
                            required
                          />
                        </Grid>
                      );
                    }

                    if (field === "positionName") {
                      return (
                        <Grid item xs={12} sm={6} key={field}>
                          <Autocomplete
                            freeSolo
                            options={positions}
                            value={formData.positionName}
                            onChange={handlePositionChange}
                            onInputChange={(event, newInputValue) => {
                              setFormData((prev) => ({ ...prev, positionName: newInputValue }));
                              setSearchTerm(newInputValue);
                            }}
                            loading={loadingPositions}
                            renderInput={(params) => (
                              <TextField
                                {...params}
                                fullWidth
                                label="Position Name *"
                                variant="outlined"
                                size="medium"
                                InputProps={{
                                  ...params.InputProps,
                                  style: { height: 50 },
                                }}
                                error={errors.positionName}
                                helperText={errors.positionName ? "Position Name is required" : ""}
                                required
                              />
                            )}
                          />
                        </Grid>
                      );
                    }

                    if (field === "experience") {
                      return (
                        <Grid item xs={12} sm={6} key={field}>
                          <TextField
                            fullWidth
                            label="Experience (Years) *"
                            name="experience"
                            variant="outlined"
                            size="medium"
                            value={formData.experience}
                            onChange={handleChange}
                            InputProps={{ style: { height: 50 } }}
                            error={errors.experience}
                            helperText={errors.experience ? "Experience is required" : "Enter number of years"}
                            required
                          />
                        </Grid>
                      );
                    }

                    if (field === "currentCTC") {
                      return (
                        <Grid item xs={12} sm={6} key={field}>
                          <TextField
                            fullWidth
                            name="currentCTC"
                            label="Current Monthly ₹ *"
                            placeholder="e.g. 50000"
                            value={formData.currentCTC}
                            onChange={handleChange}
                            variant="outlined"
                            size="medium"
                            InputProps={{ style: { height: 50 } }}
                            error={errors.currentCTC}
                            helperText={errors.currentCTC ? "Current CTC is required" : "Monthly amount in ₹"}
                            required
                          />
                        </Grid>
                      );
                    }

                    if (field === "expectedCTC") {
                      return (
                        <Grid item xs={12} sm={6} key={field}>
                          <TextField
                            fullWidth
                            name="expectedCTC"
                            label="Expected Monthly ₹ *"
                            placeholder="e.g. 60000"
                            value={formData.expectedCTC}
                            onChange={handleChange}
                            variant="outlined"
                            size="medium"
                            InputProps={{ style: { height: 50 } }}
                            error={errors.expectedCTC}
                            helperText={errors.expectedCTC ? "Expected CTC is required" : "Monthly amount in ₹"}
                            required
                          />
                        </Grid>
                      );
                    }

                    if (field === "noticePeriod") {
                      return (
                        <Grid item xs={12} sm={6} key={field}>
                          <TextField
                            fullWidth
                            label="Notice Period (Days) *"
                            name="noticePeriod"
                            variant="outlined"
                            size="medium"
                            value={formData.noticePeriod}
                            onChange={handleChange}
                            InputProps={{ style: { height: 50 } }}
                            error={errors.noticePeriod}
                            helperText={errors.noticePeriod ? "Notice Period is required" : "Enter number of days"}
                            required
                          />
                        </Grid>
                      );
                    }

                    return (
                      <Grid item xs={12} sm={6} md={3} key={field}>
                        <TextField
                          fullWidth
                          name={field}
                          label={fieldName}
                          value={formData[field]}
                          onChange={(e) => {
                            handleChange(e);
                            if (errors[field]) setErrors((prev) => ({ ...prev, [field]: false }));
                          }}
                          variant="outlined"
                          size="medium"
                          InputProps={{ style: { height: 44 } }}
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
                  <Grid item xs={12} sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <CheckCircleIcon sx={{ color: "green" }} />
                    <Typography sx={{ fontWeight: 600, color: "green" }}>
                      Candidate created successfully!
                    </Typography>
                  </Grid>
                )}

                <Grid item xs={12}>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "center",
                      alignItems: "center",
                      gap: 2,
                      flexWrap: "wrap",
                      mt: 2,
                    }}
                  >
                    <Button
                      variant="outlined"
                      component="label"
                      sx={{ textTransform: "none", height: 45 }}
                    >
                      {isEdit ? "Update Resume (PDF/Word)" : "Upload Resume (PDF/Word)"}
                      <input type="file" accept=".pdf,.doc,.docx" hidden onChange={handleFileChange} />
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
                        "&:hover": {
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
                    <Typography
                      variant="caption"
                      color="error"
                      display="block"
                      align="center"
                      mt={1}
                    >
                      {fileError}
                    </Typography>
                  )}
                </Grid>
              </Grid>
            </form>
          </Paper>

          {/* Bulk Excel Upload Section */}
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
        </Box>
      </Box>

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
    </div>
  );
};

export default AdminCandidateForm;
