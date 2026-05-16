import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { API_BASE_URL } from "../../config/api.config";
import axios from "axios";
import {
  Box, Typography, TextField, Button, IconButton,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Avatar, List, ListItem, ListItemText, ListItemIcon,
  Divider, Chip, Autocomplete, CircularProgress, Tooltip, Checkbox,
  Popover, Grid,
} from "@mui/material";
import {
  Visibility as ViewIcon,
  Work as WorkIcon,
  LocationOn as LocationIcon,
  AccessTime as NoticeIcon,
  AccessTime,
  Business as CompanyIcon,
  Person as PersonIcon,
  Phone as PhoneIcon,
  Description as ResumeIcon,
  ClearAll as ClearAllIcon,
  AssignmentInd as AssignIcon,
  History as HistoryIcon,
  PersonAdd as PersonAddIcon,
  ViewList as ViewListIcon,
  ViewModule as ViewModuleIcon,
  Clear as ClearIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Navbar from "../../components/hr components/HrNavbar";
import Sidebar from "../../components/hr components/HrSidebar";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Debounce hook
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const MySourcedData = () => {
  const [candidates, setCandidates] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");

  const dName = useDebounce(nameFilter);
  const dLocation = useDebounce(locationFilter);
  const dPosition = useDebounce(positionFilter);

  // View dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // Edit dialog
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState({});
  const [updating, setUpdating] = useState(false);
  const [editFile, setEditFile] = useState(null);

  const userId = sessionStorage.getItem('userId');
  const navigate = useNavigate();

  // ── Fetch candidates ────────────────────────────────────────────────────────
  const fetchMyCandidates = useCallback(async () => {
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      if (!userId || !token) return;

      // 1. Fetch user profile to get the full name
      const profileRes = await axios.get(`${API_BASE_URL}/user/profile`, {
        headers: { Authorization: token },
      });

      const fullName = `${profileRes.data.firstName || ""} ${profileRes.data.lastName || ""}`.trim();
      if (!fullName) {
        setCandidates([]);
        return;
      }

      // 2. Use the robust hr-candidates endpoint with name filter
      const res = await axios.get(`${API_BASE_URL}/candidate/hr-candidates`, {
        headers: { Authorization: `Bearer ${token}` },
        params: {
          createdBy: fullName,
          limit: 1000, // Fetch more for local filtering
        }
      });

      let data = res.data?.data || [];

      // Local search filtering
      if (dName) {
        data = data.filter(c => (c.name || c.candidateName)?.toLowerCase().includes(dName.toLowerCase()));
      }
      if (dLocation) {
        data = data.filter(c => c.currentLocation?.toLowerCase().includes(dLocation.toLowerCase()));
      }
      if (dPosition) {
        data = data.filter(c => c.positionName?.toLowerCase().includes(dPosition.toLowerCase()));
      }

      setCandidates(data.map((c) => ({ ...c, id: c._id || c.id })));
      setTotal(res.data?.total || data.length);
    } catch (err) {
      console.error("Error fetching my candidates:", err);
      toast.error("Failed to load your candidates");
    } finally {
      setLoading(false);
    }
  }, [userId, dName, dLocation, dPosition]);

  useEffect(() => { fetchMyCandidates(); }, [fetchMyCandidates]);

  // ── Actions ──────────────────────────────────────────────────────────────────
  const handleEdit = (candidate) => {
    setEditFormData({
      name: candidate.name || "",
      email: candidate.email || "",
      phoneNumber: candidate.phoneNumber || "",
      positionName: candidate.positionName || "",
      experience: candidate.experience || "",
      currentLocation: candidate.currentLocation || "",
      currentPosition: candidate.currentPosition || "",
      currentCompany: candidate.currentCompany || "",
      currentCTC: candidate.currentCTC || "",
      expectedCTC: candidate.expectedCTC || "",
      noticePeriod: candidate.noticePeriod || "",
      remark: candidate.remark || "",
    });
    setSelectedCandidate(candidate);
    setEditFile(null);
    setEditDialogOpen(true);
  };

  const handleUpdate = async () => {
    try {
      setUpdating(true);
      const token = sessionStorage.getItem("token");
      const formData = new FormData();

      Object.entries(editFormData).forEach(([key, value]) => {
        formData.append(key, value);
      });

      if (editFile) {
        formData.append("resumeUpload", editFile);
      }

      await axios.put(`${API_BASE_URL}/candidate/update/${selectedCandidate.id}`, formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      toast.success("Candidate updated successfully");
      setEditDialogOpen(false);
      fetchMyCandidates();
    } catch (err) {
      console.error("Error updating candidate:", err);
      toast.error(err.response?.data?.message || "Failed to update candidate");
    } finally {
      setUpdating(false);
    }
  };

  const columns = [
    {
      field: "actions", headerName: "Actions", width: 150, sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View details">
            <IconButton size="small" color="primary"
              onClick={(e) => { e.stopPropagation(); setSelectedCandidate(params.row); setOpenDialog(true); }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit candidate">
            <IconButton size="small" sx={{ color: '#f59e0b' }}
              onClick={(e) => { e.stopPropagation(); handleEdit(params.row); }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    { field: "name", headerName: "Name", width: 150 },
    { field: "phoneNumber", headerName: "Phone", width: 130 },
    { field: "qualification", headerName: "Qualification", width: 150 },
    { field: "positionName", headerName: "Position", width: 150 },
    { field: "experience", headerName: "Experience", width: 100 },
    { field: "currentLocation", headerName: "Location", width: 130 },
    { field: "currentPosition", headerName: "Current Position", width: 150 },
    { field: "currentCTC", headerName: "Current CTC", width: 110 },
    { field: "expectedCTC", headerName: "Expected CTC", width: 110 },
    { field: "noticePeriod", headerName: "Notice Period", width: 110 },
    { field: "currentCompany", headerName: "Company", width: 140 },
    { field: "industry", headerName: "Industry", width: 140 },
    { field: "remark", headerName: "Remark", width: 150 },
    {
      field: "resumeLink", headerName: "Resume", width: 90,
      renderCell: (params) => params.value
        ? <a href={params.value} target="_blank" rel="noopener noreferrer">View</a>
        : <span style={{ color: "#aaa" }}>—</span>,
    },
    {
      field: "createdAt", headerName: "Created At", width: 150,
      renderCell: (params) => params.value
        ? new Date(params.value).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "—",
    },
  ];

  return (
    <Box sx={{ display: "flex", bgcolor: "#f8fafc", minHeight: "100vh" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Navbar />

        {/* Header Bar */}
        <Box sx={{
          p: 2.5, bgcolor: "#fff", borderBottom: "1px solid #e2e8f0",
          display: "flex", justifyContent: "space-between", alignItems: "center"
        }}>
          <Box>
            <Typography variant="h5" fontWeight={800} color="#1e293b">My Sourced Data</Typography>
            <Typography variant="body2" color="#64748b">Manage candidates you have personally added</Typography>
          </Box>
          <Box sx={{ display: "flex", gap: 2 }}>
            <TextField
              size="small" placeholder="Search by name..."
              value={nameFilter} onChange={(e) => setNameFilter(e.target.value)}
              sx={{ width: 220, "& .MuiOutlinedInput-root": { borderRadius: "10px", bgcolor: "#f8fafc" } }}
              InputProps={{ startAdornment: <PersonIcon sx={{ color: "#94a3b8", mr: 1, fontSize: 18 }} /> }}
            />
          </Box>
        </Box>

        {/* Content Area */}
        <Box sx={{ p: 3, flexGrow: 1, overflow: "auto" }}>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height="400px">
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: "calc(100vh - 200px)", bgcolor: "#fff", borderRadius: "12px", boxShadow: "0 1px 3px rgba(0,0,0,0.1)", overflow: "hidden" }}>
              <DataGrid
                rows={candidates}
                columns={columns}
                pageSize={paginationModel.pageSize}
                onPageSizeChange={(s) => setPaginationModel(p => ({ ...p, pageSize: s }))}
                rowsPerPageOptions={[25, 50, 100]}
                disableSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": { bgcolor: "#f8fafc", color: "#64748b", fontWeight: 700, borderBottom: "1px solid #e2e8f0" },
                  "& .MuiDataGrid-cell": { borderBottom: "1px solid #f1f5f9" },
                  "& .MuiDataGrid-row:hover": { bgcolor: "#f8faff" },
                }}
              />
            </Box>
          )}
        </Box>

        {/* ── Edit Dialog ── */}
        <Dialog
          open={editDialogOpen}
          onClose={() => !updating && setEditDialogOpen(false)}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: "24px",
              boxShadow: "0 24px 48px rgba(0,0,0,0.12)",
              overflow: "hidden"
            }
          }}
        >
          <DialogTitle sx={{
            p: 3,
            background: "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
            color: "#fff",
            display: "flex",
            alignItems: "center",
            gap: 2
          }}>
            <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}>
              <EditIcon />
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Edit Candidate</Typography>
              <Typography variant="caption" sx={{ opacity: 0.8 }}>Updating details for {selectedCandidate?.name}</Typography>
            </Box>
          </DialogTitle>

          <DialogContent sx={{ p: 4, bgcolor: "#f8fafc" }}>
            <Box component="form" sx={{ mt: 1 }}>
              {/* Personal Section */}
              <Typography variant="subtitle2" fontWeight={800} color="#3f51b5" textTransform="uppercase" letterSpacing="0.05em" mb={2.5}>
                Personal Information
              </Typography>
              <Grid container spacing={3} mb={5}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Full Name" value={editFormData.name} onChange={(e) => setEditFormData(p => ({ ...p, name: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Email Address" value={editFormData.email} onChange={(e) => setEditFormData(p => ({ ...p, email: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Phone Number" value={editFormData.phoneNumber} onChange={(e) => setEditFormData(p => ({ ...p, phoneNumber: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Current Location" value={editFormData.currentLocation} onChange={(e) => setEditFormData(p => ({ ...p, currentLocation: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
              </Grid>

              {/* Professional Section */}
              <Typography variant="subtitle2" fontWeight={800} color="#3f51b5" textTransform="uppercase" letterSpacing="0.05em" mb={2.5}>
                Professional Details
              </Typography>
              <Grid container spacing={3} mb={5}>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Position Applied For" value={editFormData.positionName} onChange={(e) => setEditFormData(p => ({ ...p, positionName: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Experience" value={editFormData.experience} onChange={(e) => setEditFormData(p => ({ ...p, experience: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Current Position" value={editFormData.currentPosition} onChange={(e) => setEditFormData(p => ({ ...p, currentPosition: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={6}>
                  <TextField fullWidth label="Current Company" value={editFormData.currentCompany} onChange={(e) => setEditFormData(p => ({ ...p, currentCompany: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Current CTC" value={editFormData.currentCTC} onChange={(e) => setEditFormData(p => ({ ...p, currentCTC: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Expected CTC" value={editFormData.expectedCTC} onChange={(e) => setEditFormData(p => ({ ...p, expectedCTC: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12} md={4}>
                  <TextField fullWidth label="Notice Period" value={editFormData.noticePeriod} onChange={(e) => setEditFormData(p => ({ ...p, noticePeriod: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
                <Grid item xs={12}>
                  <TextField fullWidth multiline rows={3} label="Remark" value={editFormData.remark} onChange={(e) => setEditFormData(p => ({ ...p, remark: e.target.value }))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "12px", bgcolor: "#fff" } }} />
                </Grid>
              </Grid>

              {/* Documents Section */}
              <Typography variant="subtitle2" fontWeight={800} color="#3f51b5" textTransform="uppercase" letterSpacing="0.05em" mb={2.5}>
                Documents
              </Typography>
              <Box sx={{
                p: 3, border: "2px dashed #e2e8f0", borderRadius: "16px", bgcolor: "#fff",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1.5,
                textAlign: "center", cursor: "pointer", transition: "all 0.2s",
                "&:hover": { borderColor: "#3f51b5", bgcolor: "#f5f7ff" }
              }} component="label">
                <input type="file" hidden onChange={(e) => setEditFile(e.target.files[0])} accept=".pdf,.doc,.docx" />
                <Avatar sx={{ bgcolor: "#eef2ff", color: "#3f51b5", width: 48, height: 48 }}>
                  <ResumeIcon />
                </Avatar>
                <Box>
                  <Typography variant="body2" fontWeight={700} color="#1e293b">
                    {editFile ? editFile.name : "Click to upload updated resume"}
                  </Typography>
                  <Typography variant="caption" color="#64748b">
                    PDF, DOC or DOCX (Max 5MB)
                  </Typography>
                </Box>
              </Box>
            </Box>
          </DialogContent>

          <DialogActions sx={{ p: 3, bgcolor: "#fff", borderTop: "1px solid #f1f5f9", justifyContent: "space-between" }}>
            <Button
              onClick={() => setEditDialogOpen(false)}
              disabled={updating}
              sx={{ color: "#64748b", fontWeight: 700, borderRadius: "12px", px: 3, textTransform: "none" }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdate}
              variant="contained"
              disabled={updating}
              startIcon={updating ? <CircularProgress size={18} sx={{ color: "#fff" }} /> : null}
              sx={{
                borderRadius: "12px", textTransform: "none", fontWeight: 800, px: 5, py: 1.2,
                background: "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
                boxShadow: "0 8px 16px rgba(63,81,181,0.25)"
              }}
            >
              {updating ? "Saving Changes..." : "Update Candidate Profile"}
            </Button>
          </DialogActions>
        </Dialog>

        {/* ── Detail Dialog (ReadOnly) ── */}
        <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: "24px", boxShadow: "0 24px 48px rgba(0,0,0,0.12)" } }}>
          <DialogTitle sx={{
            p: 3, borderBottom: "1px solid #f1f5f9", display: "flex", alignItems: "center", gap: 2,
            background: "linear-gradient(to right, #f8fafc, #ffffff)"
          }}>
            <Avatar sx={{ bgcolor: "#eef2ff", color: "#3f51b5" }}><PersonIcon /></Avatar>
            <Typography variant="h6" fontWeight={800}>Candidate Profile</Typography>
          </DialogTitle>
          <DialogContent sx={{ p: 4 }}>
            {selectedCandidate && (
              <Box>
                <Box display="flex" alignItems="center" gap={3} mb={4}>
                  <Avatar sx={{ width: 80, height: 80, bgcolor: "#eef2ff", color: "#3f51b5", fontSize: 32, fontWeight: 800, border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.08)" }}>
                    {(selectedCandidate.name || "?")[0].toUpperCase()}
                  </Avatar>
                  <Box>
                    <Typography variant="h5" fontWeight={900} color="#1e293b">{selectedCandidate.name}</Typography>
                    <Typography fontWeight={600} color="#3f51b5" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <WorkIcon sx={{ fontSize: 16 }} /> {selectedCandidate.positionName}
                    </Typography>
                  </Box>
                </Box>

                <Grid container spacing={3}>
                  {[
                    { icon: <PhoneIcon sx={{ fontSize: 18 }} />, label: "Phone", value: selectedCandidate.phoneNumber },
                    { icon: <PersonIcon sx={{ fontSize: 18 }} />, label: "Email", value: selectedCandidate.email },
                    { icon: <LocationIcon sx={{ fontSize: 18 }} />, label: "Location", value: selectedCandidate.currentLocation },
                    { icon: <HistoryIcon sx={{ fontSize: 18 }} />, label: "Experience", value: selectedCandidate.experience },
                    { icon: <CurrencyRupeeIcon sx={{ fontSize: 18 }} />, label: "Current CTC", value: selectedCandidate.currentCTC },
                    { icon: <CurrencyRupeeIcon sx={{ fontSize: 18 }} />, label: "Expected CTC", value: selectedCandidate.expectedCTC },
                    { icon: <CompanyIcon sx={{ fontSize: 18 }} />, label: "Company", value: selectedCandidate.currentCompany, fullWidth: true },
                    { icon: <AssignIcon sx={{ fontSize: 18 }} />, label: "Remark", value: selectedCandidate.remark, fullWidth: true },
                  ].map((item, idx) => (
                    <Grid item xs={item.fullWidth ? 12 : 6} key={idx}>
                      <Box sx={{ p: 2, bgcolor: "#f8fafc", borderRadius: "12px", border: "1px solid #f1f5f9" }}>
                        <Box display="flex" alignItems="center" gap={1} mb={0.5}>
                          <Box sx={{ color: "#3f51b5", display: "flex" }}>{item.icon}</Box>
                          <Typography variant="caption" fontWeight={700} color="#64748b" textTransform="uppercase">{item.label}</Typography>
                        </Box>
                        <Typography fontWeight={700} color="#1e293b" sx={{ wordBreak: "break-word" }}>{item.value || "—"}</Typography>
                      </Box>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 2, borderTop: "1px solid #f1f5f9" }}>
            <Button fullWidth onClick={() => setOpenDialog(false)} sx={{ py: 1.5, borderRadius: "12px", fontWeight: 800, color: "#3f51b5" }}>
              Close Profile
            </Button>
          </DialogActions>
        </Dialog>

        <ToastContainer />
      </Box>
    </Box>
  );
};

export default MySourcedData;
