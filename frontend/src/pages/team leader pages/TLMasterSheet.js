import React, { useState, useEffect } from "react";
import axios from "axios";
import {
  Box,
  Button,
  InputAdornment,
  Typography,
  Grid,
  MenuItem,
  TextField,
 
  Dialog,
  DialogTitle,
  DialogContent,
  Snackbar,
  Alert,
  Tooltip,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Paper,
  Checkbox,
  Input,
  ListItemText
} from "@mui/material";
import { FileDownload as FileDownloadIcon } from "@mui/icons-material";
import { DataGrid } from "@mui/x-data-grid";
import { useFormik } from "formik";
import * as Yup from "yup";
import Navbar from "../../components/team leader components/TeamLeaderNavbar";
import Sidebar from "../../components/team leader components/TeamLeaderSidebar";
import { API_BASE_URL } from "../../config/api.config"; 
import * as XLSX from 'xlsx';
import AddIcon from "@mui/icons-material/Add";
import UploadFileIcon from "@mui/icons-material/UploadFile";
import GetAppIcon from "@mui/icons-material/GetApp";
import ClearAllIcon from "@mui/icons-material/ClearAll";
import EventIcon from '@mui/icons-material/Event';
import useTLPermissions from '../../hooks/useTLPermissions';

const MasterSheet = () => {
  const { canDo } = useTLPermissions();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState([]);
  const [selectedRecruiters, setSelectedRecruiters] = useState([]);
  const [recruiterOptions, setRecruiterOptions] = useState([]);
  const [editId, setEditId] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [file, setFile] = useState(null);
  const [sheetNames, setSheetNames] = useState([]);
  const [selectedSheet, setSelectedSheet] = useState("");
  const [headers, setHeaders] = useState([]);
  const [fileData, setFileData] = useState([]);
  const [mapping, setMapping] = useState({});
  const [importing, setImporting] = useState(false);
  const [alert, setAlert] = useState({
    open: false,
    message: '',
    severity: 'success' // 'success', 'error', 'warning', 'info'
  });
  const token = sessionStorage.getItem("token");
  const [importDialogOpen, setImportDialogOpen] = useState(false);

  const openImportDialog = () => {
    setImportDialogOpen(true);
  };
  
  const closeImportDialog = () => {
    setImportDialogOpen(false);
  };
 

  const handleClearFilter = () => {
    setStartDate("");
    setEndDate("");
  };

  // Extract unique recruiters when rows change
  useEffect(() => {
    const recruiters = [...new Set(rows.map(row => row.recruiter).filter(Boolean))];
    setRecruiterOptions(recruiters);
  }, [rows]);

  const filteredRows = rows.filter((row) => {
    if (!row.createdAt) return false;
    const rowDate = new Date(row.createdAt);

    // Date filtering
    if (startDate && rowDate < new Date(startDate)) return false;
    if (endDate && rowDate > new Date(endDate)) return false;

    // Recruiter filtering
    if (selectedRecruiters.length > 0 && !selectedRecruiters.includes(row.recruiter)) {
      return false;
    }

    return true;
  });
  // Handle alert close
  const handleCloseAlert = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setAlert({ ...alert, open: false });
  };

  // ✅ Export to CSV
  const handleExportToCSV = () => {
    try {
      // Create CSV header
      const headers = [
        'Company Name',
        'Company Address',
        'GST No',
        'Candidate Name',
        'Job Position',
        'Pipeline',
        'C2C Offered',
        'Back Out',
        'Billing Amount',
        'Selection Date',
        'Joining Date',
        'Billing Date',
        'Recruiter',
        'Payment Receive Date',
        'Remark'
      ];

      // Create CSV content
      const csvContent = [
        headers.join(','), // Add headers first
        ...rows.map(row => [
          `"${(row.companyName || '').replace(/"/g, '""')}"`,
          `"${(row.companyAddress || '').replace(/"/g, '""')}"`,
          `"${(row.gstNo || '')}"`,
          `"${(row.candidateName || '').replace(/"/g, '""')}"`,
          `"${(row.jobPosition || '').replace(/"/g, '""')}"`,
          `"${(row.pipeline || '')}"`,
          `"${(row.c2cOffered || '')}"`,
          `"${(row.backOut || '')}"`,
          `"${(row.billingAmount || '')}"`,
          `"${formatDate(row.selectionDate) || ''}"`,
          `"${formatDate(row.joiningDate) || ''}"`,
          `"${formatDate(row.billingDate) || ''}"`,
          `"${(row.recruiter || '')}"`,
          `"${formatDate(row.paymentReceiveDate) || ''}"`,
          `"${(row.remark || '').replace(/"/g, '""')}"`
        ].join(','))
      ].join('\r\n');

      // Create download link
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `MasterSheet_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      setAlert({
        open: true,
        message: 'Export completed successfully!',
        severity: 'success'
      });
    } catch (error) {
      console.error('Error exporting to CSV:', error);
      setAlert({
        open: true,
        message: 'Error exporting data. Please try again.',
        severity: 'error'
      });
    }
  };

  // ✅ Helper function to parse MongoDB date
  const parseMongoDate = (dateObj) => {
    if (!dateObj) return null;
    // Handle both string dates and MongoDB date objects
    if (dateObj.$date) {
      return new Date(dateObj.$date);
    }
    return new Date(dateObj);
  };

  // ✅ Format date for display
  const formatDate = (dateInput) => {
    if (!dateInput) return '';
    try {
      const date = typeof dateInput === 'object' && dateInput.$date 
        ? new Date(dateInput.$date) 
        : new Date(dateInput);
      
      if (isNaN(date.getTime())) return ''; // Check if date is invalid
      
      // Format as YYYY-MM-DD for the date input
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return '';
    }
  };

  // ✅ Fetch Data
  const fetchCandidates = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/master/all`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      const formattedData = res.data.map((item) => ({
        ...item,
        id: item._id,
        selectionDate: formatDate(item.selectionDate),
        joiningDate: formatDate(item.joiningDate),
        billingDate: formatDate(item.billingDate),
        paymentReceiveDate: formatDate(item.paymentReceiveDate),
        billingAmount: item.billingAmount || 0,
        // Store the original date objects for editing
        _selectionDate: parseMongoDate(item.selectionDate),
        _joiningDate: parseMongoDate(item.joiningDate),
        _billingDate: parseMongoDate(item.billingDate),
        _paymentReceiveDate: parseMongoDate(item.paymentReceiveDate),
      }));

      console.log("Formatted data:", formattedData);
      setRows(formattedData);
    } catch (error) {
      console.error("❌ Error fetching candidates:", error.response?.data || error.message);
    }
  };

  useEffect(() => {
    fetchCandidates();
  }, []);

 

  const formik = useFormik({
    initialValues: {
      companyName: "",
      companyAddress: "",
      gstNo: "",
      candidateName: "",
      jobPosition: "",
      pipeline: "",
      c2cOffered: "",
      backOut: "",
      billingAmount: "",
      selectionDate: "",
      joiningDate: "",
      billingDate: "",
      recruiter: "",
      paymentReceiveDate: "",
      remark: "",
      GstUpload: null, // file rakhenge yahan
    },
    validationSchema: Yup.object({
      companyName: Yup.string(),
      companyAddress: Yup.string(),
      candidateName: Yup.string(),
      jobPosition: Yup.string(),
      billingAmount: Yup.number().typeError("Must be a number").nullable(),
      gstNo: Yup.string()
        .test("gst-format", "Invalid GST format. Valid format: 22AAAAA0000A1Z5", (value) => {
          if (!value) return true;
          const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
          return gstRegex.test(value);
        })
        .nullable(),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        // ✅ Convert Formik values to FormData
        const formData = new FormData();
  
        // Process each form field
        Object.keys(values).forEach((key) => {
          // Skip file upload field here as it's handled separately
          if (key === 'GstUpload') return;
          
          // Handle date fields
          if (['selectionDate', 'joiningDate', 'billingDate', 'paymentReceiveDate'].includes(key)) {
            // Only process if the date field has a value
            if (values[key]) {
              const date = new Date(values[key]);
              if (!isNaN(date)) {
                // Format as YYYY-MM-DD for the backend
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                formData.append(key, `${year}-${month}-${day}`);
              }
            } else {
              // If date is being cleared, send null explicitly
              formData.append(key, '');
            }
          } else {
            // For non-date fields, add as-is if not empty
            if (values[key] !== null && values[key] !== undefined && values[key] !== '') {
              formData.append(key, values[key]);
            }
          }
        });
  
        // ✅ API call with multipart/form-data
        if (editId) {
          await axios.put(`${API_BASE_URL}/master/update/${editId}`, formData, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
          });
        } else {
          await axios.post(`${API_BASE_URL}/master/create`, formData, {
            headers: { Authorization: `Bearer ${token}`, "Content-Type": "multipart/form-data" },
          });
        }
  
        resetForm();
        setEditId(null);
        setOpenDialog(false);
        setAlert({
          open: true,
          message: editId ? 'Record updated successfully!' : 'New record created successfully!',
          severity: 'success'
        });
        await fetchCandidates();
      } catch (error) {
        console.error("❌ Error saving candidate:", error.response?.data || error.message);
        setAlert({
          open: true,
          message: error.response?.data?.message || 'Failed to save record. Please try again.',
          severity: 'error'
        });
      }
    },
  });
  
 
   // ✅ Handle Open Dialog for Create
   const handleOpenDialog = () => {
     setEditId(null);
     formik.resetForm();
     setOpenDialog(true);
   };
 
   // ✅ Handle Edit
   const handleEdit = (row) => {
     setEditId(row.id);
     // Use the pre-formatted dates from the row
     formik.setValues({
       ...row,
       // Use the stored date objects for form fields
       selectionDate: row._selectionDate ? formatDate(row._selectionDate) : '',
       joiningDate: row._joiningDate ? formatDate(row._joiningDate) : '',
       billingDate: row._billingDate ? formatDate(row._billingDate) : '',
       paymentReceiveDate: row._paymentReceiveDate ? formatDate(row._paymentReceiveDate) : '',
     });
     setOpenDialog(true);
   };
 
   // ✅ Handle Delete
   const handleDelete = async (id) => {
     try {
       await axios.delete(`${API_BASE_URL}/master/delete/${id}`, {
         headers: { Authorization: `Bearer ${token}` },
       });
       fetchCandidates();
     } catch (error) {
       console.error("❌ Error deleting candidate:", error.response?.data || error.message);
     }
   };
 
   // Helper function to format cell value
   const formatCellValue = (value) => {
     if (value === null || value === undefined || value === '') return '-';
     return value;
   };

   // ✅ Total C2C Offered// Calculate totals based on filtered rows
const totalC2COffered = filteredRows.reduce(
  (sum, row) => sum + (parseFloat(row.c2cOffered) || 0),
  0
);

const totalBillingAmount = filteredRows.reduce(
  (sum, row) => sum + (parseFloat(row.billingAmount) || 0),
  0
);

const totalBackOut = filteredRows.reduce(
  (sum, row) => sum + (parseFloat(row.backOut) || 0),
  0
);

const totalPipeline = filteredRows.reduce(
  (sum, row) => sum + (parseFloat(row.pipeline) || 0),
  0
);

const modelFields = [
  "companyName",
  "companyAddress",
  "gstNo",
  "candidateName",
  "jobPosition",
  "pipeline",
  "c2cOffered",
  "backOut",
  "billingAmount",
  "selectionDate",
  "joiningDate",
  "billingDate",
  "recruiter",
  "paymentReceiveDate",
  "remark",
];


const downloadTemplate = () => {
  const worksheet = XLSX.utils.json_to_sheet([]);
  XLSX.utils.sheet_add_aoa(worksheet, [modelFields]); // add headers

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Template");

  XLSX.writeFile(workbook, "MasterSheet_Template.xlsx");
};


  // File Upload
  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setFile(file);
    const reader = new FileReader();

    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });

      setSheetNames(workbook.SheetNames);

      if (workbook.SheetNames.length > 0) {
        setSelectedSheet(workbook.SheetNames[0]);
        processSheet(workbook.Sheets[workbook.SheetNames[0]]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  // Process Sheet
  const processSheet = (worksheet) => {
    const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 });
    if (jsonData.length === 0) return;

    const headers = jsonData[0].map((header) => String(header).trim());
    setHeaders(headers);

    const initialMapping = {};
    modelFields.forEach((field) => {
      initialMapping[field] = "";
    });
    setMapping(initialMapping);

    setFileData(jsonData.slice(1));
  };

  // Sheet change
  const handleSheetChange = (e) => {
    setSelectedSheet(e.target.value);

    const reader = new FileReader();
    reader.onload = (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: "array" });
      processSheet(workbook.Sheets[e.target.value]);
    };
    reader.readAsArrayBuffer(file);
  };

  // Mapping Change
  const handleMappingChange = (field, value) => {
    setMapping((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  // Import
  const handleImport = async () => {
    if (!file) return;
  
    const requiredFields = ["candidateName", "companyName"];
    const missingFields = requiredFields.filter((f) => !mapping[f]);
  
    if (missingFields.length > 0) {
      setAlert({
        open: true,
        message: `Please map required fields: ${missingFields.join(", ")}`,
        severity: "error",
      });
      return;
    }
  
    setImporting(true);
  
    try {
      const payload = fileData.map((row) => {
        const item = {};
        Object.entries(mapping).forEach(([field, header]) => {
          if (header && header !== "") {
            const colIndex = headers.indexOf(header);
            if (colIndex !== -1 && row[colIndex] !== undefined) {
              if (["selectionDate", "joiningDate", "billingDate", "paymentReceiveDate"].includes(field)) {
                item[field] = new Date(row[colIndex]);
              } else {
                item[field] = row[colIndex];
              }
            }
          }
        });
        return item;
      });
  
      await axios.post(
        `${API_BASE_URL}/master-sheet/import`,
        { data: payload },
        {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
  
      setAlert({
        open: true,
        message: `Successfully imported ${payload.length} records`,
        severity: "success",
      });
  
      fetchCandidates();
      closeImportDialog(); // ✅ FIXED
    } catch (error) {
      console.error("Import error:", error);
      setAlert({
        open: true,
        message: "Failed to import data. Please check file format.",
        severity: "error",
      });
    } finally {
      setImporting(false);
    }
  };
  
  // ✅ DataGrid Columns
// ✅ DataGrid Columns (fixed width instead of flex)
const columns = [
  {
    field: "actions",
    headerName: "Actions",
    width: 200, // ✅ fixed width
    sortable: false,
    renderCell: (params) => (
      <Box sx={{ display: "flex", gap: 1 }}>
        <Button
          onClick={() => handleEdit(params.row)}
          variant="outlined"
          color="primary"
          size="small"
        >
          Edit
        </Button>
        <Button
          onClick={() => handleDelete(params.row.id)}
          variant="outlined"
          color="error"
          size="small"
        >
          Delete
        </Button>
      </Box>
    ),
  },
  { field: "recruiter", headerName: "Recruiter", width: 200 },
  { field: "companyName", headerName: "Company Name", width: 200 },
  { field: "companyAddress", headerName: "Company Address", width: 300 },
  {
    field: "GstUpload",
    headerName: "GST Upload",
    width: 150,
    renderCell: (params) => {
      if (!params.value) {
        return (
          <Typography variant="body2" color="textSecondary">
            No File
          </Typography>
        );
      }
      return (
        <Button
          variant="outlined"
          size="small"
          color="primary"
          onClick={() => window.open(params.value, "_blank")}
        >
          View
        </Button>
      );
    },
  },
  { field: "gstNo", headerName: "GST No", width: 150 },
  { field: "candidateName", headerName: "Candidate", width: 200 },
  { field: "jobPosition", headerName: "Job Position", width: 200 },
  { field: "pipeline", headerName: "Pipeline", width: 150 },
  { field: "c2cOffered", headerName: "C2C Offered", width: 200 },
  { field: "backOut", headerName: "Back Out", width: 150 },
  {
    field: "selectionDate",
    headerName: "Selection Date",
    width: 180,
    renderCell: (params) => formatDate(params.value),
  },
  {
    field: "joiningDate",
    headerName: "Joining Date",
    width: 180,
    renderCell: (params) => formatDate(params.value),
  },
  {
    field: "billingDate",
    headerName: "Billing Date",
    width: 180,
    renderCell: (params) => formatDate(params.value),
  },
  { field: "billingAmount", headerName: "Billing Amount", width: 200 },
  {
    field: "paymentReceiveDate",
    headerName: "Payment Receive Date",
    width: 200,
  },
  
  
  
  
 
  { field: "remark", headerName: "Remark", width: 200 },
  {
    field: "createdAt",
    headerName: "Created At",
    width: 220,
    renderCell: (params) => {
      if (!params.value) return "";
      const date = new Date(params.value);
      return date.toLocaleString("en-GB", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: true,
      });
    },
  },
];


  return (
    <div
      style={{
        display: "flex",
        height: "100vh",
        marginLeft: "-10px",
        backgroundColor: "#f5f5f5",
      }}
    >
      {/* Sidebar */}
      <div
        style={{
          position: "fixed",
          marginLeft: "-9px",
          height: "100vh",
          width: "250px",
          backgroundColor: "#3f51b5",
          color: "white",
        }}
      >
        <Sidebar />
      </div>

      {/* Main content */}
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

        <Box
          sx={{
            p: 3,
            backgroundColor: "#fff",
            borderRadius: "12px",
            boxShadow: "0 4px 10px rgba(0,0,0,0.1)",
            maxWidth: "95%",
            margin: "auto",
          }}
        >
          <Typography variant="h5" gutterBottom sx={{ fontWeight: "bold" }}>
            Company & Candidate Records
          </Typography>

          {/* ✅ Create Button */}
          <Paper
      elevation={3}
      sx={{
        p: 2,
        mb: 3,
        borderRadius: 3,
        display: "flex",
        flexWrap: "wrap",
        gap: 2,
        alignItems: "center",
        justifyContent: "space-between",
      }}
    >
      {/* Left Actions */}
      <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog} disabled={!canDo('tl-master-sheet:create')}
        >
          Create New
        </Button>

        <Tooltip title="Export all records as CSV">
          <Button
            variant="outlined"
            startIcon={<FileDownloadIcon />}
            onClick={handleExportToCSV} disabled={!canDo('tl-master-sheet:export')}
          >
            Export
          </Button>
        </Tooltip>

        <Tooltip title="Import records from Excel">
          <Button
            variant="contained"
            color="secondary"
            startIcon={<UploadFileIcon />}
            onClick={openImportDialog} disabled={!canDo('tl-master-sheet:import')}
          >
            Import
          </Button>
        </Tooltip>

        <Tooltip title="Download Excel template">
          <Button
            variant="outlined"
            startIcon={<GetAppIcon />}
            onClick={downloadTemplate} disabled={!canDo('tl-master-sheet:download-template')}
          >
            Template
          </Button>
        </Tooltip>
      </Box>

      {/* Right Filter Section */}
      <Box
        sx={{
          display: "flex",
          gap: 2,
          flexWrap: "wrap",
          alignItems: "center",
        }}
      >
        <TextField
          type="date"
          size="small"
          label="Start Date"
          InputLabelProps={{ shrink: true }}
          value={startDate}
          onChange={(e) => setStartDate(e.target.value)}
        />
        <TextField
          type="date"
          size="small"
          label="End Date"
          InputLabelProps={{ shrink: true }}
          value={endDate}
          onChange={(e) => setEndDate(e.target.value)}
        />
        <Button
          variant="outlined"
          color="error"
          startIcon={<ClearAllIcon />}
          onClick={() => {
            handleClearFilter();
            setSelectedRecruiters([]);
          }}
        >
          Clear All
        </Button>
      </Box>

      {/* Recruiter Filter */}
      <Box sx={{ minWidth: 200, maxWidth: 300 }}>
        <FormControl fullWidth size="small">
          <InputLabel>Filter by Recruiter</InputLabel>
          <Select
            multiple
            value={selectedRecruiters}
            onChange={(e) => setSelectedRecruiters(e.target.value)}
            input={<Input />}
            renderValue={(selected) => selected.join(', ')}
            MenuProps={{
              PaperProps: {
                style: {
                  maxHeight: 224,
                  width: 250,
                },
              }
            }}
          >
            {recruiterOptions.map((recruiter) => (
              <MenuItem key={recruiter} value={recruiter}>
                <Checkbox checked={selectedRecruiters.indexOf(recruiter) > -1} />
                <ListItemText primary={recruiter} />
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>
    </Paper>
{/* ✅ Totals Row in One Line */}
<Grid container spacing={2} sx={{ mt: 2 }}>
  <Grid item xs={12} md={3}>
    <Box
      sx={{
        p: 2,
        backgroundColor: "#e3f2fd",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: "bold",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h6" color="primary">
        Total C2C Offered: ₹ {totalC2COffered.toLocaleString("en-IN")}
      </Typography>
    </Box>
  </Grid>

  <Grid item xs={12} md={3}>
    <Box
      sx={{
        p: 2,
        backgroundColor: "#fce4ec",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: "bold",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h6" color="secondary">
        Total Billing Amount: ₹ {totalBillingAmount.toLocaleString("en-IN")}
      </Typography>
    </Box>
  </Grid>

  <Grid item xs={12} md={3}>
    <Box
      sx={{
        p: 2,
        backgroundColor: "#e8f5e9",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: "bold",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h6" color="success.main">
        Total Back Out: {totalBackOut}
      </Typography>
    </Box>
  </Grid>

  <Grid item xs={12} md={3}>
    <Box
      sx={{
        p: 2,
        backgroundColor: "#e8f5e9",
        borderRadius: "8px",
        textAlign: "center",
        fontWeight: "bold",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Typography variant="h6" color="success.main">
        Total Pipeline: {totalPipeline}
      </Typography>
    </Box>
  </Grid>
</Grid>




          {/* ✅ DataGrid Wrapper */}
          <Box
            sx={{
              height: 750,
              width: "100%",
              maxWidth: "100%",
              padding: "16px",
              backgroundColor: "#f9f9f9",
              borderRadius: "12px",
              boxShadow: "0 4px 10px rgba(0, 0, 0, 0.15)",
              overflow: "auto", // ✅ scroll inside grid
              "&::-webkit-scrollbar": { width: "8px", height: "8px" },
              "&::-webkit-scrollbar-thumb": {
                backgroundColor: "#888",
                borderRadius: "4px",
              },
              "&::-webkit-scrollbar-thumb:hover": {
                backgroundColor: "#555",
              },
              "&::-webkit-scrollbar-track": { backgroundColor: "#f1f1f1" },
            }}
          >
            <DataGrid
              rows={filteredRows}
              columns={columns}
              pageSize={10}
              rowsPerPageOptions={[5, 10, 20]}
              disableSelectionOnClick
              autoHeight={false}
              sx={{
                minWidth: "2000px", // ✅ horizontal scroll
                backgroundColor: "#fff",
                borderRadius: "8px",
                boxShadow: "0 3px 8px rgba(0, 0, 0, 0.1)",
                "& .MuiDataGrid-columnHeaders": {
                  backgroundColor: "#1976d2",
                  color: "black",
                  fontWeight: "bold",
                  fontSize: "15px",
                  textAlign: "center",
                },
                "& .MuiDataGrid-cell": {
                  fontSize: "14px",
                  padding: "10px",
                  textAlign: "center",
                },
                "& .MuiDataGrid-row:hover": {
                  backgroundColor: "#f5f5f5",
                  cursor: "pointer",
                },
                "& .MuiDataGrid-footerContainer": {
                  backgroundColor: "#f5f5f5",
                  fontWeight: "bold",
                },
              }}
            />
          </Box>

        </Box>
      </Box>

      {/* ✅ Dialog Box for Create & Edit */}
   <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
          <DialogTitle>{editId ? "Edit Candidate" : "Add Candidate"}</DialogTitle>
          <DialogContent dividers>
            <form onSubmit={formik.handleSubmit}>
              <Grid container spacing={2}>
                {/* Company Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Name"
                    name="companyName"
                    value={formik.values.companyName}
                    onChange={formik.handleChange}
                  />
                </Grid>
  
                {/* Company Address */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Company Address"
                    name="companyAddress"
                    value={formik.values.companyAddress}
                    onChange={formik.handleChange}
                  />
                </Grid>
  
                {/* Candidate Name */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Candidate Name"
                    name="candidateName"
                    value={formik.values.candidateName}
                    onChange={formik.handleChange}
                  />
                </Grid>
  
                {/* Job Position */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Job Position"
                    name="jobPosition"
                    value={formik.values.jobPosition}
                    onChange={formik.handleChange}
                  />
                </Grid>
  
                {/* Billing Amount */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Billing Amount"
                    name="billingAmount"
                    type="number"
                    value={formik.values.billingAmount}
                    onChange={formik.handleChange}
                  />
                </Grid>
  
                {/* GST No */}
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="GST No"
                    name="gstNo"
                    value={formik.values.gstNo || ''}
                    onChange={formik.handleChange}
                    error={formik.touched.gstNo && Boolean(formik.errors.gstNo)}
                    helperText={formik.touched.gstNo && formik.errors.gstNo}
                    inputProps={{ 
                      maxLength: 15,
                      style: { textTransform: 'uppercase' },
                      onInput: (e) => {
                        e.target.value = e.target.value.toUpperCase();
                      }
                    }}
                    placeholder="22AAAAA0000A1Z5"
                  />
                </Grid>
  
                <Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    type="number"
    label="Pipeline"
    name="pipeline"
    value={formik.values.pipeline || ""}
    onChange={formik.handleChange}
  />
</Grid>

  
               {/* C2C Offered */}
<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    type="number"
    label="C2C Offered (Amount)"
    name="c2cOffered"
    value={formik.values.c2cOffered || ""}
    onChange={formik.handleChange}
  />
</Grid>

{/* Back Out */}
<Grid item xs={12} sm={6}>
  <TextField
    fullWidth
    type="number"
    label="Back Out (Amount)"
    name="backOut"
    value={formik.values.backOut || ""}
    onChange={formik.handleChange}
  />
</Grid>

  
                {/* Dates */}
                {["selectionDate", "joiningDate", "billingDate", "paymentReceiveDate"].map((field) => {
                  // Convert date to yyyy-MM-dd format for the input field
                  const formatDateForInput = (dateString) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    if (isNaN(date)) return '';
                    return date.toISOString().split('T')[0];
                  };

                  // Format date for display (dd/mm/yyyy)
                  const formatDisplayDate = (dateString) => {
                    if (!dateString) return '';
                    const date = new Date(dateString);
                    if (isNaN(date)) return '';
                    const day = String(date.getDate()).padStart(2, '0');
                    const month = String(date.getMonth() + 1).padStart(2, '0');
                    const year = date.getFullYear();
                    return `${day}/${month}/${year}`;
                  };

                  return (
                    <Grid item xs={12} sm={6} key={field}>
                      <TextField
                        type="date"
                        fullWidth
                        label={field.replace(/([A-Z])/g, " $1")}
                        name={field}
                        InputLabelProps={{ shrink: true }}
                        value={formatDateForInput(formik.values[field])}
                        onChange={(e) => {
                          // Convert the date to a proper format when changed
                          formik.setFieldValue(field, e.target.value);
                        }}
                        inputProps={{
                          placeholder: 'dd/mm/yyyy',
                        }}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <EventIcon color="action" />
                            </InputAdornment>
                          ),
                        }}
                      />
                      {/* Display formatted date below the input */}
                      {formik.values[field] && (
                        <Typography variant="caption" color="textSecondary" style={{ marginLeft: '8px' }}>
                          {formatDisplayDate(formik.values[field])}
                        </Typography>
                      )}
                    </Grid>
                  );
                })}
  
                {/* Recruiter */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Recruiter"
                    name="recruiter"
                    value={formik.values.recruiter}
                    onChange={formik.handleChange}
                  />
                </Grid>
  
                {/* Remark */}
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    multiline
                    rows={3}
                    label="Remark"
                    name="remark"
                    value={formik.values.remark}
                    onChange={formik.handleChange}
                  />
                </Grid>

                {/* GstUpload File Input */}
        <Grid item xs={12}>
          <Button
            variant="outlined"
            component="label"
            fullWidth
          >
            Upload GST Document (PDF/Image)
            <input
              type="file"
              hidden
              name="GstUpload"
              accept="application/pdf,image/*"
              onChange={(event) => {
                formik.setFieldValue("GstUpload", event.currentTarget.files[0]);
              }}
            />
          </Button>

          {/* File Preview */}
          {formik.values.GstUpload && (
            <Box sx={{ mt: 2 }}>
              {formik.values.GstUpload.type?.startsWith("image/") ? (
                <img
                  src={URL.createObjectURL(formik.values.GstUpload)}
                  alt="Preview"
                  style={{ width: "150px", borderRadius: "8px" }}
                />
              ) : (
                <Typography variant="body2" color="primary">
                  {formik.values.GstUpload.name} (PDF Selected)
                </Typography>
              )}
            </Box>
          )}
        </Grid>
  
                <Grid item xs={12}>
                  <Box sx={{ display: "flex", justifyContent: "flex-end", gap: 2 }}>
                    <Button onClick={() => setOpenDialog(false)} variant="outlined">
                      Cancel
                    </Button>
                    <Button type="submit" variant="contained" sx={{ backgroundColor: "#ff6600" }}>
                      {editId ? "Update" : "Create"}
                    </Button>
                  </Box>
                </Grid>
              </Grid>
            </form>
          </DialogContent>
        </Dialog>
  
  {/* ✅ Import Dialog */}
  <Dialog open={importDialogOpen} onClose={closeImportDialog} maxWidth="md" fullWidth>
  <DialogTitle>Import Data from Excel</DialogTitle>
  <DialogContent dividers>
    {/* File Upload */}
    <Button variant="outlined" component="label" sx={{ mb: 2 }}>
      Upload Excel File
      <input hidden type="file" accept=".xlsx, .xls" onChange={handleFileUpload} />
    </Button>

    {file && (
      <>
        {/* Sheet Selection */}
        <FormControl fullWidth sx={{ mb: 2 }}>
          <InputLabel>Select Sheet</InputLabel>
          <Select value={selectedSheet} onChange={handleSheetChange}>
            {sheetNames.map((sheet) => (
              <MenuItem key={sheet} value={sheet}>
                {sheet}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {/* Mapping */}
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Map Excel Columns to Fields
        </Typography>
        <Grid container spacing={2}>
          {modelFields.map((field) => (
            <Grid item xs={12} sm={6} key={field}>
              <FormControl fullWidth>
                <InputLabel>{field}</InputLabel>
                <Select
                  value={mapping[field] || ""}
                  onChange={(e) => handleMappingChange(field, e.target.value)}
                >
                  <MenuItem value="">
                    <em>Ignore</em>
                  </MenuItem>
                  {headers.map((header) => (
                    <MenuItem key={header} value={header}>
                      {header}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
          ))}
        </Grid>
      </>
    )}
  </DialogContent>
  <DialogActions>
    <Button onClick={() => setOpen(false)}>Cancel</Button>
    <Button
      variant="contained"
      color="primary"
      onClick={handleImport}
      disabled={importing}
    >
      {importing ? <CircularProgress size={24} /> : "Import"}
    </Button>
  </DialogActions>
</Dialog>



      {/* Alert/Snackbar */}
      <Snackbar 
        open={alert.open} 
        autoHideDuration={6000} 
        onClose={handleCloseAlert}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseAlert} 
          severity={alert.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {alert.message}
        </Alert>
      </Snackbar>
    </div>
  );
};

export default MasterSheet;
