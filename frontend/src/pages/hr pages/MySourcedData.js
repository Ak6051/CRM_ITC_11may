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
import { QRCodeSVG } from "qrcode.react";
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
  Search as SearchIcon,
  BusinessCenter as BusinessCenterIcon,
  CalendarToday as CalendarTodayIcon,
  Edit as EditIcon,
} from "@mui/icons-material";
import CurrencyRupeeIcon from "@mui/icons-material/CurrencyRupee";
import { DataGrid } from "@mui/x-data-grid";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import Navbar from "../../components/hr components/HrNavbar";
import Sidebar from "../../components/hr components/HrSidebar";
import CandidatesForm from "./CandidatesForm";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { ProfessionalResumePreview, generateProfessionalCV } from "../../components/ProfessionalResume";

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
  const [currentUserFullName, setCurrentUserFullName] = useState("");

  // Filters
  const [nameFilter, setNameFilter] = useState("");
  const [locationFilter, setLocationFilter] = useState("");
  const [positionFilter, setPositionFilter] = useState("");
  const [experienceRange, setExperienceRange] = useState({ min: "", max: "" });
  const [ctcFilter, setCtcFilter] = useState({ min: "", max: "" });
  const [noticePeriodFilter, setNoticePeriodFilter] = useState("");
  const [genderFilter, setGenderFilter] = useState("");
  const [phoneFilter, setPhoneFilter] = useState("");
  const [currentPositionFilter, setCurrentPositionFilter] = useState("");
  const [industryFilter, setIndustryFilter] = useState("");
  const [dateRange, setDateRange] = useState({ startDate: null, endDate: null });
  const [positions, setPositions] = useState([]);

  const dName = useDebounce(nameFilter);
  const dLocation = useDebounce(locationFilter);
  const dPosition = useDebounce(positionFilter);
  const dCtc = useDebounce(ctcFilter.min);
  const dCtcMax = useDebounce(ctcFilter.max);
  const dNotice = useDebounce(noticePeriodFilter);
  const dGender = useDebounce(genderFilter);
  const dPhone = useDebounce(phoneFilter);
  const dCurPos = useDebounce(currentPositionFilter);
  const dIndustry = useDebounce(industryFilter);
  const dExpMin = useDebounce(experienceRange.min);
  const dExpMax = useDebounce(experienceRange.max);

  // Filter accordion open state
  const [openFilters, setOpenFilters] = useState({
    keywords: true, location: false, experience: false,
    salary: false, position: false,
    noticePeriod: false, gender: false, phone: false, dateRange: false,
    currentPosition: false, industry: false,
  });
  const toggleFilter = (key) => setOpenFilters(p => ({ ...p, [key]: !p[key] }));

  // Selection for assign
  const [selectedIds, setSelectedIds] = useState([]);

  // Assign dialog
  const [assignOpen, setAssignOpen] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [jobsLoading, setJobsLoading] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [assigning, setAssigning] = useState(false);

  // View dialog
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // History dialog
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyData, setHistoryData] = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add Candidate Form Dialog state
  const [addCandidateDialogOpen, setAddCandidateDialogOpen] = useState(false);

  // Edit Candidate Form Dialog state
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // ── Send Email Dialog state ─────────────────────────────────────────────────
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [emailTarget, setEmailTarget] = useState(null);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailBody, setEmailBody] = useState('');
  const [emailSendMeCopy, setEmailSendMeCopy] = useState(false);
  const [emailSending, setEmailSending] = useState(false);

  // ── Assignment Success Dialog ──────────────────────────────────────────────
  const [assignSuccessDialogOpen, setAssignSuccessDialogOpen] = useState(false);
  const [assignedJobData, setAssignedJobData] = useState(null);
  const [assignedCandidatesData, setAssignedCandidatesData] = useState(null);

  // ── Sender name for WhatsApp message ───────────────────────────────────────
  const [senderName, setSenderName] = useState('');

  // ── Phone popover ───────────────────────────────────────────────────────────
  const [phonePopover, setPhonePopover] = useState({ anchor: null, phone: '', name: '' });
  const openPhonePopover = (e, candidate) => setPhonePopover({ anchor: e.currentTarget, phone: candidate.phoneNumber || '', name: candidate.name || '' });
  const closePhonePopover = () => setPhonePopover({ anchor: null, phone: '', name: '' });

  // ── WhatsApp Preview Dialog ─────────────────────────────────────────────────
  const [waDialogOpen, setWaDialogOpen] = useState(false);
  const [waCandidate, setWaCandidate] = useState(null);
  const [waJob, setWaJob] = useState(null);
  const [waJobList, setWaJobList] = useState([]);
  const [waMessage, setWaMessage] = useState('');
  const [senderPhone, setSenderPhone] = useState('');
  const [waJobLoading, setWaJobLoading] = useState(false);

  const buildWaMessage = (candidate, job, hrName, hrPhone) => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    const jobTitle = job?.jobTitle || candidate.positionName || "relevant opening";
    const company = job?.companyName || '';
    const jobLocation = job?.jobLocation || '';
    const salary = job?.salary || '';
    return (
      `${greeting} 👋
${candidate.name || "there"},

We came across your profile and would like to discuss an exciting job opportunity with you.

Position: ${jobTitle}
Company Name: ${company}
Location: ${jobLocation}
Salary: ${salary}

Please let us know your availability for a quick call.

Regards,
${hrName}
iTalentConnect`
    );
  };

  const openWaDialog = async (candidate) => {
    setWaCandidate(candidate);
    setWaJob(null);
    setWaJobList([]);
    setWaDialogOpen(true);

    if (candidate.positionName) {
      try {
        setWaJobLoading(true);
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/allType/by-title`, {
          headers: { Authorization: `Bearer ${token}` },
          params: { title: candidate.positionName },
        });
        const list = Array.isArray(res.data) ? res.data : [];
        setWaJobList(list);
        const firstJob = list[0] || null;
        setWaJob(firstJob);
        setWaMessage(buildWaMessage(candidate, firstJob, senderName || 'HR Team', senderPhone));
      } catch (e) {
        setWaMessage(buildWaMessage(candidate, null, senderName || 'HR Team', senderPhone));
      } finally {
        setWaJobLoading(false);
      }
    } else {
      setWaMessage(buildWaMessage(candidate, null, senderName || 'HR Team', senderPhone));
    }
  };

  const handleWaJobSelect = (job) => {
    setWaJob(job);
    setWaMessage(buildWaMessage(waCandidate, job, senderName || 'HR Team', senderPhone));
  };

  const sendWhatsApp = () => {
    if (!waCandidate?.phoneNumber) return;
    const url = `https://wa.me/${waCandidate.phoneNumber.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(waMessage)}`;
    window.open(url, "_blank", "noopener,noreferrer");
    setWaDialogOpen(false);
  };

  // ── Profile dialog tab ──────────────────────────────────────────────────────
  const [profileTab, setProfileTab] = useState('profile'); // 'profile' | 'cv'

  // ── Generate & download CV as PDF (uses shared professional component) ──
  const handleDownloadCV = async (candidate) => {
    await generateProfessionalCV(candidate);
  };

  // Get logged-in user profile
  useEffect(() => {
    const fetchSenderName = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        const res = await axios.get(`${API_BASE_URL}/user/profile`, {
          headers: { Authorization: token },
        });
        const { firstName = '', lastName = '', phoneNumber = '' } = res.data || {};
        const name = `${firstName} ${lastName}`.trim();
        if (name) {
          setSenderName(name);
          setCurrentUserFullName(name);
        }
        if (phoneNumber) setSenderPhone(phoneNumber);
      } catch (e) {
        console.error('Could not fetch sender name:', e?.response?.status);
      }
    };
    fetchSenderName();
  }, []);

  const openEmailDialog = (candidate) => {
    setEmailTarget({ email: candidate.email, name: candidate.name });
    setEmailSubject('');
    setEmailBody('');
    setEmailSendMeCopy(false);
    setEmailDialogOpen(true);
  };

  const handleSendEmail = async () => {
    if (!emailSubject.trim()) { toast.error('Please enter a subject'); return; }
    if (!emailBody.trim()) { toast.error('Please enter a message'); return; }
    setEmailSending(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/email/send-candidate-email`, {
        to: emailTarget.email,
        subject: emailSubject,
        body: emailBody,
        sendMeCopy: emailSendMeCopy,
      }, { headers: { Authorization: `Bearer ${token}` } });
      toast.success('Email sent successfully!');
      setEmailDialogOpen(false);
    } catch (e) {
      toast.error(e.response?.data?.message || 'Failed to send email');
    } finally {
      setEmailSending(false);
    }
  };

  const isFirstRender = useRef(true);
  const navigate = useNavigate();

  // View mode state
  const [viewMode, setViewMode] = useState("card"); // "card" or "table"

  // ── Fetch candidates ────────────────────────────────────────────────────────
  const fetchCandidates = useCallback(async () => {
    if (!currentUserFullName) return;
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const params = {
        page: paginationModel.page + 1,
        limit: paginationModel.pageSize,
        createdBy: currentUserFullName, // strictly force my candidates
      };
      if (dName) params.name = dName;
      if (dLocation) params.location = dLocation;
      if (dPosition) params.position = dPosition;
      if (dExpMin) params.minExp = dExpMin;
      if (dExpMax) params.maxExp = dExpMax;
      if (dCtc) params.minCtc = dCtc;
      if (dCtcMax) params.maxCtc = dCtcMax;
      if (dNotice) params.maxNotice = dNotice;
      if (dGender) params.gender = dGender;
      if (dPhone) params.phone = dPhone;
      if (dCurPos) params.currentPosition = dCurPos;
      if (dIndustry) params.industry = dIndustry;
      if (dateRange.startDate) params.startDate = dateRange.startDate.toISOString();
      if (dateRange.endDate) params.endDate = dateRange.endDate.toISOString();

      const res = await axios.get(`${API_BASE_URL}/candidate/hr-candidates`, {
        headers: { Authorization: `Bearer ${token}` },
        params,
      });

      const { data, total: totalCount } = res.data;
      setCandidates(data.map((c) => ({ ...c, id: c._id || c.id })));
      setTotal(totalCount);
      setPositions((prev) => {
        const all = [...new Set([...prev, ...data.map((c) => c.positionName).filter(Boolean)])].sort();
        return all;
      });
    } catch (err) {
      console.error("Error fetching candidates:", err);
    } finally {
      setLoading(false);
    }
  }, [paginationModel, currentUserFullName, dName, dLocation, dPosition, dExpMin, dExpMax, dCtc, dCtcMax, dNotice, dGender, dPhone, dCurPos, dIndustry, dateRange]);

  // Reset page on filter change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [dName, dLocation, dPosition, dExpMin, dExpMax, dCtc, dCtcMax, dNotice, dGender, dPhone, dCurPos, dIndustry, dateRange]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // ── Fetch HR's assigned jobs only ──────────────────────────────────────────
  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.get(`${API_BASE_URL}/assignhr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const jobList = Array.isArray(res.data?.data)
        ? res.data.data
        : Array.isArray(res.data)
          ? res.data
          : [];
      setJobs(jobList);
    } catch (err) {
      console.error("Error fetching assigned jobs:", err);
      toast.error("Failed to load job positions");
    } finally {
      setJobsLoading(false);
    }
  };

  // ── Open assign dialog ──────────────────────────────────────────────────────
  const handleOpenAssign = () => {
    if (selectedIds.length === 0) {
      toast.warning("Please select at least one candidate");
      return;
    }
    fetchJobs();
    setSelectedJob(null);
    setAssignOpen(true);
  };

  // ── Confirm assign ──────────────────────────────────────────────────────────
  const handleAssign = async () => {
    if (!selectedJob) {
      toast.warning("Please select a job position");
      return;
    }
    try {
      setAssigning(true);
      const token = sessionStorage.getItem("token");
      const res = await axios.post(
        `${API_BASE_URL}/applications/assign`,
        { candidateIds: selectedIds, jobId: selectedJob._id },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const { assigned, alreadyAssigned } = res.data;

      setAssignOpen(false);
      setAssignedJobData(selectedJob);
      setAssignedCandidatesData({ assigned: assigned.length, alreadyAssigned: alreadyAssigned.length });
      setAssignSuccessDialogOpen(true);
      setSelectedIds([]);
    } catch (err) {
      toast.error(err.response?.data?.message || "Assignment failed");
    } finally {
      setAssigning(false);
    }
  };

  // ── View candidate history ──────────────────────────────────────────────────
  const handleViewHistory = async (candidateId) => {
    try {
      setHistoryLoading(true);
      setHistoryOpen(true);
      setHistoryData(null);
      const token = sessionStorage.getItem("token");
      const res = await axios.get(
        `${API_BASE_URL}/applications/candidate/${candidateId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      const raw = res.data;
      setHistoryData(Array.isArray(raw) ? raw : Array.isArray(raw?.data) ? raw.data : Array.isArray(raw?.applications) ? raw.applications : []);
    } catch (err) {
      toast.error("Failed to load history");
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClearFilters = () => {
    setNameFilter(""); setLocationFilter(""); setPositionFilter("");
    setDateRange({ startDate: null, endDate: null });
    setExperienceRange({ min: "", max: "" }); setCtcFilter({ min: "", max: "" }); setNoticePeriodFilter("");
    setGenderFilter(""); setPhoneFilter(""); setCurrentPositionFilter("");
    setIndustryFilter("");
  };

  const hasActiveFilters =
    nameFilter || locationFilter || positionFilter ||
    ctcFilter.min || ctcFilter.max || noticePeriodFilter || genderFilter || phoneFilter || currentPositionFilter || industryFilter ||
    experienceRange.min || experienceRange.max ||
    dateRange.startDate || dateRange.endDate;

  // ── Columns (table view) ─────────────────────────────────────────────────────
  const columns = [
    {
      field: "actions", headerName: "Actions", width: 140, sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View details">
            <IconButton size="small" color="primary"
              onClick={(e) => { e.stopPropagation(); setSelectedCandidate(params.row); setOpenDialog(true); setProfileTab('profile'); }}
            >
              <ViewIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit candidate">
            <IconButton size="small" sx={{ color: "#f59e0b" }}
              onClick={(e) => { e.stopPropagation(); setSelectedCandidate(params.row); setEditDialogOpen(true); }}
            >
              <EditIcon fontSize="small" />
            </IconButton>
          </Tooltip>
          <Tooltip title="View job history">
            <IconButton size="small" color="secondary"
              onClick={(e) => { e.stopPropagation(); handleViewHistory(params.row._id || params.row.id); }}
            >
              <HistoryIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: "resumeUpload", headerName: "Resume", width: 90,
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
    { field: "name", headerName: "Name", width: 150 },
    { field: "phoneNumber", headerName: "Phone", width: 130 },
    { field: "gender", headerName: "Gender", width: 90 },
    { field: "positionName", headerName: "Position", width: 150 },
    { field: "experience", headerName: "Experience (Years)", width: 140 },
    { field: "currentLocation", headerName: "Location", width: 130 },
    { field: "currentPosition", headerName: "Current Position", width: 150 },
    { field: "currentCTC", headerName: "Current CTC (Monthly ₹)", width: 160 },
    { field: "expectedCTC", headerName: "Expected CTC (Monthly ₹)", width: 160 },
    { field: "noticePeriod", headerName: "Notice Period (Days)", width: 140 },
    { field: "currentCompany", headerName: "Company", width: 140 },
    { field: "industry", headerName: "Industry", width: 140 },
    { field: "remark", headerName: "Remark", width: 140 },
  ];

  // ── Render candidate card (admin panel design) ─────────────────────────────
  const renderCandidateCard = (candidate) => (
    <Box
      key={candidate.id}
      sx={{
        bgcolor: "#fff",
        border: "1px solid #e2e8f0",
        borderRadius: "10px",
        mb: 1.5,
        width: "fit-content",
        minWidth: "920px",
        maxWidth: "1150px",
        ml: 4,
        mr: "auto",
        overflow: "visible",
        "&:hover": { boxShadow: "0 2px 12px rgba(0,0,0,0.08)", borderColor: "#c7d2fe" },
      }}
    >
      {/* MAIN BODY */}
      <Box sx={{ display: "flex", alignItems: "stretch" }}>

        {/* ── LEFT: candidate info ── */}
        <Box sx={{ flexGrow: 0, width: "auto", minWidth: "720px", p: "16px 20px 12px 16px" }}>

          {/* Row 1: Checkbox + Avatar initial + Name + New badge */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, mb: 1 }}>
            <Checkbox
              size="small"
              sx={{ p: 0 }}
              checked={selectedIds.includes(candidate.id)}
              onChange={(e) => {
                if (e.target.checked) setSelectedIds(prev => [...prev, candidate.id]);
                else setSelectedIds(prev => prev.filter(id => id !== candidate.id));
              }}
            />
            <Avatar sx={{ width: 38, height: 38, bgcolor: "#e8eaf6", color: "#3f51b5", fontWeight: 700, fontSize: 16 }}>
              {(candidate.name || "?")[0].toUpperCase()}
            </Avatar>
            <Typography fontWeight={700} fontSize={15} color="#0f172a"
              onClick={() => { setSelectedCandidate(candidate); setOpenDialog(true); setProfileTab('profile'); }}
              sx={{ cursor: 'pointer', '&:hover': { color: '#3f51b5', textDecoration: 'underline' } }}>
              {candidate.name || "—"}
            </Typography>
            {candidate.createdAt && new Date(candidate.createdAt) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) && (
              <Chip label="New" size="small"
                sx={{ bgcolor: "#e0e7ff", color: "#3730a3", fontSize: "11px", height: 20, fontWeight: 600, borderRadius: "6px" }} />
            )}
          </Box>

          {/* Row 2: exp · CTC · location */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 1.2, ml: "60px", flexWrap: "wrap" }}>
            {candidate.experience && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <AccessTime sx={{ fontSize: 13, color: "#64748b" }} />
                <Typography fontSize={13} color="#475569">{candidate.experience} Years</Typography>
              </Box>
            )}
            {candidate.currentCTC && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <CurrencyRupeeIcon sx={{ fontSize: 13, color: "#64748b" }} />
                <Typography fontSize={13} color="#475569">{candidate.currentCTC} Monthly</Typography>
              </Box>
            )}
            {candidate.currentLocation && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <LocationIcon sx={{ fontSize: 13, color: "#64748b" }} />
                <Typography fontSize={13} color="#475569">{candidate.currentLocation}</Typography>
              </Box>
            )}
            {candidate.gender && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <PersonIcon sx={{ fontSize: 13, color: "#64748b" }} />
                <Typography fontSize={13} color="#475569">{candidate.gender}</Typography>
              </Box>
            )}
          </Box>

          {/* Row 3: Current | Applied For — stacked with header left and data right */}
          <Box sx={{ ml: "60px", mb: 1.2, display: "flex", flexDirection: "column", gap: 0.8 }}>
            {(candidate.currentPosition || candidate.currentCompany) && (
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography fontSize={12} color="#94a3b8" sx={{ minWidth: "80px" }}>Current:</Typography>
                <Typography fontSize={13} fontWeight={600} color="#1e293b">
                  {candidate.currentPosition || ""}
                  {candidate.currentCompany ? ` at ${candidate.currentCompany}` : ""}
                </Typography>
              </Box>
            )}
            {candidate.positionName && (
              <Box sx={{ display: "flex", alignItems: "baseline", gap: 1 }}>
                <Typography fontSize={12} color="#94a3b8" sx={{ minWidth: "80px" }}>Applied For:</Typography>
                <Typography fontSize={13} fontWeight={600} color="#1e293b">{candidate.positionName}</Typography>
              </Box>
            )}
            {(candidate.positionName || candidate.currentPosition || candidate.experience) && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                <Typography fontSize={12} color="#94a3b8" sx={{ minWidth: "80px" }}>Key skills:</Typography>
                <Box sx={{ display: "flex", flexWrap: "wrap", gap: 0.8 }}>
                  {[
                    candidate.positionName,
                    candidate.currentPosition,
                    candidate.experience ? `${candidate.experience} exp` : null,
                  ].filter(Boolean).map((skill, i) => (
                    <Chip key={i} label={skill} size="small"
                      sx={{ bgcolor: "#fff", border: "1px solid #e2e8f0", color: "#475569", fontSize: "11px", height: 22, borderRadius: "20px" }} />
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* Row 5: Expected CTC · Notice Period · Phone */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 3, mb: 1, ml: "60px", flexWrap: "wrap" }}>
            {candidate.expectedCTC && (
              <Typography fontSize={12.5} color="#64748b">
                Expected CTC: <strong>₹{candidate.expectedCTC} Monthly</strong>
              </Typography>
            )}
            {(candidate.noticePeriod !== undefined && candidate.noticePeriod !== "") && (
              <Typography fontSize={12.5} color="#64748b">
                Notice Period: <strong>{candidate.noticePeriod} Days</strong>
              </Typography>
            )}
            {candidate.phoneNumber && (
              <Typography fontSize={12.5} color="#64748b">
                Phone: <strong>{candidate.phoneNumber}</strong>
              </Typography>
            )}
          </Box>

          {/* Row 6: Created by + date */}
          <Box sx={{ display: "flex", alignItems: "center", gap: 1.5, ml: "60px", pt: 1, borderTop: "1px solid #f1f5f9" }}>
            {candidate.createdAt && (
              <Typography fontSize={12} color="#94a3b8">
                Added on: <span style={{ color: "#475569", fontWeight: 500 }}>
                  {new Date(candidate.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
                </span>
              </Typography>
            )}
            {candidate.remark && (
              <Typography fontSize={12} color="#94a3b8" sx={{ ml: 1 }}>
                Remark: <span style={{ color: "#475569" }}>{candidate.remark}</span>
              </Typography>
            )}
          </Box>
        </Box>

        {/* ── RIGHT: action panel ── */}
        <Box sx={{
          width: 200,
          flexShrink: 0,
          borderLeft: "1px solid #f1f5f9",
          display: "flex",
          flexDirection: "column",
          alignItems: "stretch",
          p: "14px 14px 14px 14px",
          gap: 1,
        }}>
          {/* Icon row — 5 action icons in a horizontal row */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 0.8, mb: 0.5 }}>
            <Tooltip title="View details">
              <IconButton size="small"
                onClick={() => { setSelectedCandidate(candidate); setOpenDialog(true); setProfileTab('profile'); }}
                sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", width: 32, height: 32 }}>
                <ResumeIcon sx={{ fontSize: 15, color: "#64748b" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Edit candidate">
              <IconButton size="small"
                onClick={() => { setSelectedCandidate(candidate); setEditDialogOpen(true); }}
                sx={{ bgcolor: "#fffbeb", border: "1px solid #fde68a", width: 32, height: 32 }}>
                <EditIcon sx={{ fontSize: 15, color: "#f59e0b" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title="View job history">
              <IconButton size="small"
                onClick={() => handleViewHistory(candidate._id || candidate.id)}
                sx={{ bgcolor: "#f3e8ff", border: "1px solid #e9d5ff", width: 32, height: 32 }}>
                <HistoryIcon sx={{ fontSize: 15, color: "#7c3aed" }} />
              </IconButton>
            </Tooltip>
            <Tooltip title={candidate.email ? `Send email to ${candidate.email}` : "No email available"}>
              <span>
                <IconButton size="small" disabled={!candidate.email}
                  onClick={() => candidate.email && openEmailDialog(candidate)}
                  sx={{ bgcolor: candidate.email ? "#eff6ff" : "#f8fafc", border: "1px solid #e2e8f0", width: 32, height: 32, "&:hover": { bgcolor: "#dbeafe" } }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none"
                    stroke={candidate.email ? "#3b82f6" : "#cbd5e1"} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="4" width="20" height="16" rx="2" />
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
                  </svg>
                </IconButton>
              </span>
            </Tooltip>
            <Tooltip title={candidate.phoneNumber ? `WhatsApp ${candidate.phoneNumber}` : "No phone available"}>
              <span>
                <IconButton size="small" disabled={!candidate.phoneNumber}
                  onClick={() => candidate.phoneNumber && openWaDialog(candidate)}
                  sx={{ bgcolor: candidate.phoneNumber ? "#f0fdf4" : "#f8fafc", border: "1px solid #e2e8f0", width: 32, height: 32, "&:hover": { bgcolor: "#dcfce7" } }}>
                  <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill={candidate.phoneNumber ? "#22c55e" : "#cbd5e1"}>
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
                  </svg>
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          <Divider sx={{ my: 0.5 }} />

          {/* Position label */}
          <Typography fontSize={12} align="center" color="#64748b" lineHeight={1.4} sx={{ px: 0.5 }}>
            {candidate.currentPosition || "Candidate"}
            {candidate.currentLocation
              ? <><br /><span style={{ color: "#94a3b8" }}>{candidate.currentLocation}</span></>
              : null}
          </Typography>

          {/* Call button */}
          <Button
            variant="outlined" size="small" fullWidth
            onClick={(e) => openPhonePopover(e, candidate)}
            startIcon={<PhoneIcon sx={{ fontSize: 13 }} />}
            sx={{
              textTransform: "none", borderRadius: "6px", fontSize: 11.5, fontWeight: 600,
              borderColor: "#3f51b5", color: "#3f51b5", py: 0.6,
              "&:hover": { bgcolor: "#f5f6ff" },
            }}
          >
            Call
          </Button>

          <Typography fontSize={11} color="#94a3b8" align="center">{candidate.phoneNumber || "—"}</Typography>
        </Box>
      </Box>

      {/* FOOTER BAR */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 3,
        px: 2, py: 0.8,
        borderTop: "1px solid #f1f5f9",
        bgcolor: "#fafafa",
        borderRadius: "0 0 12px 12px",
      }}>
        {candidate.resumeUpload && candidate.resumeUpload.startsWith("http") ? (
          <Box component="a" href={candidate.resumeUpload} target="_blank" rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", gap: 0.5, textDecoration: "none" }}>
            <Typography fontSize={12} color="#64748b">📎 CV Attached</Typography>
          </Box>
        ) : (
          <Typography fontSize={12} color="#cbd5e1">📎 No Resume</Typography>
        )}
        <Typography fontSize={12} color="#94a3b8" sx={{ ml: "auto" }}>
          {candidate.email || "No email"}
        </Typography>
      </Box>
    </Box>
  );

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f8", overflow: "hidden" }}>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Fixed Sidebar */}
      <div style={{ position: "fixed", height: "100vh", width: "250px", backgroundColor: "#3f51b5", zIndex: 1000 }}>
        <Sidebar />
      </div>

      {/* Main Content Area — offset by sidebar */}
      <Box sx={{ flexGrow: 1, ml: "250px", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>

        {/* Fixed Navbar */}
        <Box sx={{ position: "sticky", top: 0, zIndex: 999, bgcolor: "#fff", boxShadow: "0 1px 4px rgba(63,81,181,0.12)", flexShrink: 0 }}>
          <Navbar />
        </Box>

        {/* Filter + Content row — fills remaining height */}
        <Box sx={{ display: "flex", flexGrow: 1, overflow: "hidden", height: "calc(100vh - 64px)" }}>

          {/* Left Filter Sidebar */}
          <Box sx={{
            width: "280px",
            minWidth: "280px",
            bgcolor: "#fff",
            borderRight: "1px solid #e8eaf6",
            height: "100%",
            overflowY: "auto",
            flexShrink: 0,
            "&::-webkit-scrollbar": { width: 4 },
            "&::-webkit-scrollbar-track": { background: "#f8fafc" },
            "&::-webkit-scrollbar-thumb": { background: "#cbd5e1", borderRadius: 3 },
          }}>
            {/* Filter Header — sticky */}
            <Box sx={{
              px: 2, py: 1.8,
              borderBottom: "1px solid #e0e7ff",
              position: "sticky", top: 0, bgcolor: "#fff", zIndex: 10,
              background: "linear-gradient(135deg, #f8faff 0%, #eef2ff 100%)",
            }}>
              <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: hasActiveFilters ? 1.2 : 0 }}>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Box sx={{ width: 28, height: 28, borderRadius: "8px", bgcolor: "#3f51b5", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: "2.5px" }}>
                      {[0, 1, 2].map(i => (
                        <Box key={i} sx={{ width: 12, height: 1.5, bgcolor: "#fff", borderRadius: 1 }} />
                      ))}
                    </Box>
                  </Box>
                  <Typography fontWeight={700} fontSize={15} color="#1e293b">Filters</Typography>
                  {hasActiveFilters && (
                    <Box sx={{
                      bgcolor: "#3f51b5", color: "#fff", fontWeight: 700, fontSize: "0.7rem", borderRadius: "10px",
                      minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", px: 0.5
                    }}>
                      {[nameFilter, locationFilter, positionFilter, experienceRange.min || experienceRange.max,
                        ctcFilter.min || ctcFilter.max, noticePeriodFilter, genderFilter, phoneFilter,
                        currentPositionFilter, industryFilter, dateRange.startDate || dateRange.endDate,
                      ].filter(Boolean).length}
                    </Box>
                  )}
                </Box>
                {hasActiveFilters && (
                  <Button size="small" onClick={handleClearFilters}
                    sx={{
                      fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "none", minWidth: "auto",
                      borderRadius: "6px", px: 1, "&:hover": { bgcolor: "#fef2f2" }
                    }}>
                    Clear all
                  </Button>
                )}
              </Box>
            </Box>

            {/* Accordion filter rows */}
            {[
              {
                key: "dateRange", label: "Date Range", icon: <CalendarTodayIcon sx={{ fontSize: 18 }} />,
                content: (
                  <LocalizationProvider dateAdapter={AdapterDateFns}>
                    <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                      <DatePicker label="From Date" value={dateRange.startDate}
                        onChange={(val) => setDateRange(p => ({ ...p, startDate: val }))}
                        slotProps={{
                          textField: {
                            size: "small", fullWidth: true,
                            sx: { "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }
                          }
                        }} />
                      <DatePicker label="To Date" value={dateRange.endDate}
                        onChange={(val) => setDateRange(p => ({ ...p, endDate: val }))}
                        slotProps={{
                          textField: {
                            size: "small", fullWidth: true,
                            sx: { "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }
                          }
                        }} />
                    </Box>
                  </LocalizationProvider>
                ),
              },
              {
                key: "keywords", label: "Candidate Name", icon: <SearchIcon sx={{ fontSize: 18 }} />,
                content: (
                  <TextField fullWidth size="small" placeholder="Search by name..."
                    value={nameFilter} onChange={(e) => setNameFilter(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                    InputProps={{ endAdornment: nameFilter && (
                      <IconButton size="small" onClick={() => setNameFilter("")}><ClearIcon sx={{ fontSize: 14 }} /></IconButton>
                    )}}
                  />
                ),
              },
              {
                key: "location", label: "Location", icon: <LocationIcon sx={{ fontSize: 18 }} />,
                content: (
                  <TextField fullWidth size="small" placeholder="e.g. Mumbai, Delhi"
                    value={locationFilter} onChange={(e) => setLocationFilter(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                    InputProps={{ endAdornment: locationFilter && (
                      <IconButton size="small" onClick={() => setLocationFilter("")}><ClearIcon sx={{ fontSize: 14 }} /></IconButton>
                    )}}
                  />
                ),
              },
              {
                key: "experience", label: "Experience (Years)", icon: <AccessTime sx={{ fontSize: 18 }} />,
                content: (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField size="small" placeholder="Min" value={experienceRange.min}
                      onChange={(e) => setExperienceRange(p => ({ ...p, min: e.target.value.replace(/[^0-9.]/g, "") }))}
                      sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }} />
                    <Typography fontSize={12} color="#94a3b8">to</Typography>
                    <TextField size="small" placeholder="Max" value={experienceRange.max}
                      onChange={(e) => setExperienceRange(p => ({ ...p, max: e.target.value.replace(/[^0-9.]/g, "") }))}
                      sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }} />
                  </Box>
                ),
              },
              {
                key: "salary", label: "Monthly CTC (₹)", icon: <CurrencyRupeeIcon sx={{ fontSize: 18 }} />,
                content: (
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <TextField size="small" placeholder="Min"
                      value={ctcFilter.min}
                      onChange={(e) => setCtcFilter(p => ({ ...p, min: e.target.value.replace(/\D/g, "") }))}
                      sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                    />
                    <Typography fontSize={12} color="#94a3b8">–</Typography>
                    <TextField size="small" placeholder="Max"
                      value={ctcFilter.max}
                      onChange={(e) => setCtcFilter(p => ({ ...p, max: e.target.value.replace(/\D/g, "") }))}
                      sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                    />
                  </Box>
                ),
              },
              {
                key: "position", label: "Position", icon: <AssignIcon sx={{ fontSize: 18 }} />,
                content: (
                  <Autocomplete
                    multiple size="small"
                    options={positions}
                    value={positionFilter ? [positionFilter] : []}
                    onChange={(_, val) => setPositionFilter(val[val.length - 1] || "")}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select positions"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }} />
                    )}
                    renderTags={(value, getTagProps) =>
                      value.map((option, index) => <Chip {...getTagProps({ index })} label={option} size="small" key={index} />)
                    }
                  />
                ),
              },
              {
                key: "noticePeriod", label: "Notice period (Days)", icon: <ClearIcon sx={{ fontSize: 18 }} />,
                content: (
                  <TextField fullWidth size="small" placeholder="Max days (e.g. 30)"
                    value={noticePeriodFilter} onChange={(e) => setNoticePeriodFilter(e.target.value.replace(/\D/g, ""))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }} />
                ),
              },
              {
                key: "currentPosition", label: "Current Position", icon: <AssignIcon sx={{ fontSize: 18 }} />,
                content: (
                  <TextField fullWidth size="small" placeholder="e.g. Accountant"
                    value={currentPositionFilter} onChange={(e) => setCurrentPositionFilter(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                  />
                ),
              },
              {
                key: "industry", label: "Industry", icon: <BusinessCenterIcon sx={{ fontSize: 18 }} />,
                content: (
                  <TextField fullWidth size="small" placeholder="e.g. IT"
                    value={industryFilter} onChange={(e) => setIndustryFilter(e.target.value)}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                  />
                ),
              },
              {
                key: "gender", label: "Gender", icon: <PersonIcon sx={{ fontSize: 18 }} />,
                content: (
                  <Autocomplete
                    size="small"
                    options={["Male", "Female", "Other"]}
                    value={genderFilter || null}
                    onChange={(_, val) => setGenderFilter(val || "")}
                    renderInput={(params) => (
                      <TextField {...params} placeholder="Select gender"
                        sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }} />
                    )}
                  />
                ),
              },
              {
                key: "phone", label: "Phone Number", icon: <PhoneIcon sx={{ fontSize: 18 }} />,
                content: (
                  <TextField fullWidth size="small" placeholder="Search by phone..."
                    value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value.replace(/\D/g, "").slice(0, 10))}
                    sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                  />
                ),
              },
            ].map(({ key, label, icon, content }) => {
              // Determine if this filter category is active
              const isActive = {
                keywords: !!nameFilter, location: !!locationFilter,
                experience: !!(experienceRange.min || experienceRange.max),
                salary: !!(ctcFilter.min || ctcFilter.max),
                position: !!positionFilter,
                noticePeriod: !!noticePeriodFilter,
                gender: !!genderFilter,
                phone: !!phoneFilter,
                currentPosition: !!currentPositionFilter,
                industry: !!industryFilter,
                dateRange: !!(dateRange.startDate || dateRange.endDate),
              }[key];

              return (
                <Box key={key} sx={{ borderBottom: "1px solid #f1f5f9" }}>
                  <Box onClick={() => toggleFilter(key)}
                    sx={{
                      px: 2, py: 1.5, display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer", userSelect: "none", transition: "background 0.2s",
                      "&:hover": { bgcolor: "#f8fafc" },
                      bgcolor: openFilters[key] ? "#f8faff" : "transparent"
                    }}>
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.2, color: isActive ? "#3f51b5" : "#64748b" }}>
                      {icon}
                      <Typography fontSize={13.5} fontWeight={isActive ? 700 : 500} color={isActive ? "#3f51b5" : "#475569"}>
                        {label}
                      </Typography>
                    </Box>
                    <Typography fontSize={11} color="#cbd5e1" fontWeight={700}>
                      {openFilters[key] ? "▲" : "▼"}
                    </Typography>
                  </Box>
                  {openFilters[key] && (
                    <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                      {content}
                    </Box>
                  )}
                </Box>
              );
            })}
          </Box>

          {/* Right Content Area */}
          <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

            {/* Content with padding */}
            <Box sx={{ flexGrow: 1, p: 3, display: "flex", flexDirection: "column", overflow: "hidden" }}>

              {/* ── Top bar: count + view toggle + action buttons (admin style) ── */}
              <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                {/* Left: count + view toggle */}
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box>
                    <Typography variant="h5" fontWeight={800} color="#1e293b">My Sourced Data</Typography>
                    <Typography variant="body2" color="#64748b">Candidates you have personally added</Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600, ml: 2 }}>
                    {total.toLocaleString()} candidates
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>View:</Typography>
                    <IconButton size="small" onClick={() => setViewMode("card")}
                      sx={{
                        bgcolor: viewMode === "card" ? "#3f51b5" : "#e8eaf6",
                        color: viewMode === "card" ? "#fff" : "#3f51b5",
                        borderRadius: "8px",
                        '&:hover': { bgcolor: viewMode === "card" ? "#3949ab" : "#c5cae9" },
                      }}>
                      <ViewModuleIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => setViewMode("table")}
                      sx={{
                        bgcolor: viewMode === "table" ? "#3f51b5" : "#e8eaf6",
                        color: viewMode === "table" ? "#fff" : "#3f51b5",
                        borderRadius: "8px",
                        '&:hover': { bgcolor: viewMode === "table" ? "#3949ab" : "#c5cae9" },
                      }}>
                      <ViewListIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>

                {/* Right: action buttons */}
                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Button
                    variant="contained" size="small"
                    startIcon={<PersonAddIcon />}
                    onClick={() => setAddCandidateDialogOpen(true)}
                    sx={{
                      bgcolor: "#10b981", color: "#fff", fontWeight: 600,
                      borderRadius: "8px", textTransform: "none",
                      "&:hover": { bgcolor: "#059669" },
                      boxShadow: "0 2px 8px rgba(16,185,129,0.3)",
                    }}
                  >
                    Add Candidate
                  </Button>
                  <Button
                    variant="contained" size="small"
                    startIcon={<AssignIcon />}
                    onClick={handleOpenAssign}
                    disabled={selectedIds.length === 0}
                    sx={{
                      bgcolor: selectedIds.length > 0 ? "#3f51b5" : "#e0e0e0",
                      color: selectedIds.length > 0 ? "#fff" : "#9e9e9e",
                      fontWeight: 600, borderRadius: "8px", textTransform: "none",
                      "&:hover": { bgcolor: selectedIds.length > 0 ? "#3949ab" : "#e0e0e0" },
                      "&.Mui-disabled": { bgcolor: "#e0e0e0", color: "#9e9e9e" },
                      boxShadow: selectedIds.length > 0 ? "0 2px 8px rgba(63,81,181,0.3)" : "none",
                    }}
                  >
                    {selectedIds.length > 0 ? `Assign (${selectedIds.length})` : "Assign Candidate"}
                  </Button>
                </Box>
              </Box>

              {viewMode === "card" ? (
                <Box sx={{ flexGrow: 1, overflow: 'auto', pb: 2 }}>
                  {loading ? (
                    <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
                      <CircularProgress sx={{ color: '#3f51b5' }} />
                    </Box>
                  ) : candidates.length === 0 ? (
                    <Box sx={{ textAlign: 'center', py: 8, bgcolor: '#fff', borderRadius: '14px', border: '1px solid #e8eaf6' }}>
                      <Typography color="text.secondary">No candidates found</Typography>
                    </Box>
                  ) : (
                    <>
                      {/* Select All bar */}
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.5, px: 1, width: "fit-content", ml: 4 }}>
                        <input
                          type="checkbox"
                          checked={selectedIds.length === candidates.length && candidates.length > 0}
                          onChange={(e) => {
                            if (e.target.checked) setSelectedIds(candidates.map(c => c.id));
                            else setSelectedIds([]);
                          }}
                          style={{ width: 18, height: 18, cursor: 'pointer' }}
                        />
                        <Typography variant="caption" sx={{ color: '#64748b', fontWeight: 600 }}>
                          {selectedIds.length > 0 ? `${selectedIds.length} selected` : 'Select all'}
                        </Typography>
                      </Box>
                      {candidates.map(renderCandidateCard)}
                      {/* Pagination */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 2, px: 1, width: "fit-content", minWidth: "920px", ml: 4 }}>
                        <Typography variant="caption" sx={{ color: '#64748b' }}>
                          Showing {paginationModel.page * paginationModel.pageSize + 1}–{Math.min((paginationModel.page + 1) * paginationModel.pageSize, total)} of {total} records
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={paginationModel.page === 0}
                            onClick={() => setPaginationModel(p => ({ ...p, page: p.page - 1 }))}
                            sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#c5cae9', color: '#3f51b5' }}
                          >
                            Previous
                          </Button>
                          <Button
                            size="small"
                            variant="outlined"
                            disabled={(paginationModel.page + 1) * paginationModel.pageSize >= total}
                            onClick={() => setPaginationModel(p => ({ ...p, page: p.page + 1 }))}
                            sx={{ borderRadius: '8px', textTransform: 'none', borderColor: '#c5cae9', color: '#3f51b5' }}
                          >
                            Next
                          </Button>
                        </Box>
                      </Box>
                    </>
                  )}
                </Box>
              ) : (
                /* Table / DataGrid view mode */
                <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", bgcolor: '#fff', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e8eaf6' }}>
                  <DataGrid
                    rows={candidates}
                    columns={columns}
                    loading={loading}
                    rowCount={total}
                    paginationMode="server"
                    paginationModel={paginationModel}
                    onPaginationModelChange={setPaginationModel}
                    checkboxSelection
                    disableRowSelectionOnClick
                    rowSelectionModel={selectedIds}
                    onRowSelectionModelChange={(newModel) => setSelectedIds(newModel)}
                    pageSizeOptions={[10, 25, 50, 100]}
                    sx={{
                      border: 'none',
                      '& .MuiDataGrid-columnHeaders': {
                        bgcolor: '#f8fafc',
                        borderBottom: '1px solid #e2e8f0',
                        color: '#475569',
                        fontWeight: 700,
                      },
                      '& .MuiDataGrid-row:hover': {
                        bgcolor: '#f1f5f9',
                      },
                      '& .MuiDataGrid-cell': {
                        borderBottom: '1px solid #f1f5f9',
                        color: '#0f172a',
                      },
                    }}
                  />
                </Box>
              )}
            </Box>
          </Box>
        </Box>
      </Box>

      {/* ── Detail Dialog (ReadOnly) ── */}
      <Dialog
        open={openDialog}
        onClose={() => { setOpenDialog(false); setSelectedCandidate(null); }}
        maxWidth="lg"
        fullWidth
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
        {selectedCandidate && (
          <>
            {/* Top Single scroll area */}
            <DialogContent sx={{ p: 0, bgcolor: '#f8fafc', flexGrow: 1, overflowY: 'auto' }}>
              {/* Header Box */}
              <Box sx={{
                p: 4, pb: 3,
                background: 'linear-gradient(to right, #eff6ff, #fff)',
                borderBottom: '1px solid #e8eaf6',
                display: 'flex', gap: 3, alignItems: 'flex-start',
              }}>
                <Avatar sx={{ width: 70, height: 70, bgcolor: '#3f51b5', color: '#fff', fontSize: 26, fontWeight: 700 }}>
                  {(selectedCandidate.name || '?')[0].toUpperCase()}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography variant="h5" fontWeight={800} color="#1e293b" mb={0.4}>
                    {selectedCandidate.name}
                  </Typography>
                  <Typography fontSize={14} color="#64748b" fontWeight={600} sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                    <WorkIcon sx={{ fontSize: 15 }} /> {selectedCandidate.positionName || 'No position requested'}
                  </Typography>

                  {/* Actions under name header */}
                  <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                    <Button variant="outlined" size="small" component="a" href={`tel:${selectedCandidate.phoneNumber}`}
                      sx={{ textTransform: 'none', borderRadius: '6px', fontSize: 13, borderColor: '#64748b', color: '#475569' }}>
                      Call candidate
                    </Button>
                    {selectedCandidate.phoneNumber && (
                      <Button variant="outlined" size="small"
                        onClick={() => openWaDialog(selectedCandidate)}
                        sx={{ textTransform: 'none', borderRadius: '6px', fontSize: 13, borderColor: '#22c55e', color: '#22c55e' }}>
                        WhatsApp
                      </Button>
                    )}
                  </Box>
                  {selectedCandidate.email && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8, mt: 1.5 }}>
                      <Typography fontSize={13} color="#64748b">{selectedCandidate.email}</Typography>
                      <Chip label="Verified phone & email" size="small" sx={{ height: 20, fontSize: 11, bgcolor: '#f0fdf4', color: '#166534' }} />
                    </Box>
                  )}
                </Box>
              </Box>

              {/* Tabs */}
              <Box sx={{ display: 'flex', borderBottom: '1px solid #e8eaf6', bgcolor: '#f8fafc', px: 3 }}>
                <Button onClick={() => setProfileTab('profile')}
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: 0, py: 1.5,
                    color: profileTab === 'profile' ? '#3f51b5' : '#64748b',
                    borderBottom: profileTab === 'profile' ? '2px solid #3f51b5' : '2px solid transparent',
                  }}>
                  Profile detail
                </Button>
                <Button onClick={() => setProfileTab('cv')}
                  sx={{
                    textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: 0, py: 1.5, ml: 3,
                    color: profileTab === 'cv' ? '#3f51b5' : '#64748b',
                    borderBottom: profileTab === 'cv' ? '2px solid #3f51b5' : '2px solid transparent',
                  }}>
                  Attached CV
                </Button>
              </Box>

              {/* Tab content */}
              <Box sx={{ p: 3 }}>

                {/* ── PROFILE DETAIL TAB ── */}
                {profileTab === 'profile' && (<>
                  {/* Work Summary */}
                  {(selectedCandidate.currentPosition || selectedCandidate.experience) && (
                    <Box sx={{ mb: 3, p: 2.5, bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px' }}>
                      <Typography fontSize={15} fontWeight={700} color="#1e293b" mb={1.5}>Work summary</Typography>
                      <Typography fontSize={14} color="#475569" lineHeight={1.7}>
                        {selectedCandidate.currentPosition && `${selectedCandidate.currentPosition} `}
                        {selectedCandidate.experience && `with ${selectedCandidate.experience} years experience `}
                        {selectedCandidate.currentCompany && `at ${selectedCandidate.currentCompany}. `}
                        {selectedCandidate.reasonforLeaving && `Reason for leaving: ${selectedCandidate.reasonforLeaving}`}
                      </Typography>
                    </Box>
                  )}

                  {/* Key Skills */}
                  {(selectedCandidate.positionName || selectedCandidate.currentPosition) && (
                    <Box sx={{ mb: 3, p: 2.5, bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px' }}>
                      <Typography fontSize={15} fontWeight={700} color="#1e293b" mb={1.5}>Key skills</Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {[selectedCandidate.positionName, selectedCandidate.currentPosition, selectedCandidate.experience ? `${selectedCandidate.experience} exp` : null]
                          .filter(Boolean)
                          .map((skill, i) => (
                            <Chip key={i} label={skill} size="small"
                              sx={{ bgcolor: '#fef3c7', color: '#92400e', fontWeight: 600, fontSize: 13, height: 28, borderRadius: '6px' }} />
                          ))}
                      </Box>
                    </Box>
                  )}

                  {/* Details Grid */}
                  <Grid container spacing={2}>
                    {[
                      { label: 'Expected CTC', value: selectedCandidate.expectedCTC ? `₹${selectedCandidate.expectedCTC} Monthly` : null },
                      { label: 'Notice Period', value: selectedCandidate.noticePeriod ? `${selectedCandidate.noticePeriod} Days` : null },
                      { label: 'Current Company', value: selectedCandidate.currentCompany },
                      { label: 'Current Position', value: selectedCandidate.currentPosition },
                    ].filter(item => item.value).map(({ label, value }) => (
                      <Grid item xs={12} md={6} key={label}>
                        <Box sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '10px' }}>
                          <Typography fontSize={12} color="#94a3b8" mb={0.4}>{label}</Typography>
                          <Typography fontSize={14} fontWeight={600} color="#1e293b">{value}</Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>

                  {selectedCandidate.remark && (
                    <Box sx={{ mt: 2, p: 2.5, bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px' }}>
                      <Typography fontSize={15} fontWeight={700} color="#1e293b" mb={1}>Remarks</Typography>
                      <Typography fontSize={14} color="#475569">{selectedCandidate.remark}</Typography>
                    </Box>
                  )}
                </>)}

                {/* ── ATTACHED CV TAB ── */}
                {profileTab === 'cv' && (
                  <Box>
                    {selectedCandidate.resumeUpload && selectedCandidate.resumeUpload.startsWith('http') ? (
                      /* Has valid uploaded CV — show it */
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 1.5 }}>
                          <Button variant="contained" size="small" startIcon={<ResumeIcon />}
                            component="a" href={selectedCandidate.resumeUpload} target="_blank" rel="noopener noreferrer"
                            sx={{ textTransform: 'none', borderRadius: '8px', fontSize: 13, fontWeight: 600, bgcolor: '#3f51b5' }}>
                            Download CV
                          </Button>
                        </Box>
                        <Box sx={{ border: '1px solid #e2e8f0', borderRadius: '12px', overflow: 'hidden', bgcolor: '#ffffff' }}>
                          {selectedCandidate.resumeUpload.toLowerCase().endsWith('.pdf') ? (
                            <iframe
                              src={`${selectedCandidate.resumeUpload}#toolbar=0&navpanes=0&scrollbar=0&view=FitH`}
                              width="100%"
                              height="900px"
                              style={{ border: 'none', display: 'block', backgroundColor: '#ffffff' }}
                              title="Resume Preview"
                            />
                          ) : (
                            <iframe
                              src={`https://docs.google.com/viewer?url=${encodeURIComponent(selectedCandidate.resumeUpload)}&embedded=true`}
                              width="100%" height="900px" style={{ border: 'none', backgroundColor: '#ffffff' }} title="Resume Preview"
                            />
                          )}
                        </Box>
                      </Box>
                    ) : (
                      /* No CV — show generated CV preview + download */
                      <Box>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                          <Typography fontSize={14} color="#64748b">No CV uploaded. A professional resume has been generated from candidate data.</Typography>
                          <Button variant="contained" size="small" startIcon={<ResumeIcon />}
                            onClick={() => handleDownloadCV(selectedCandidate)}
                            sx={{ textTransform: 'none', borderRadius: '8px', fontSize: 13, fontWeight: 600, bgcolor: '#1e3a5f', flexShrink: 0, '&:hover': { bgcolor: '#2c5282' } }}>
                            Download Resume PDF
                          </Button>
                        </Box>
                        <ProfessionalResumePreview candidate={selectedCandidate} />
                      </Box>
                    )}
                  </Box>
                )}
              </Box>
            </DialogContent>

            <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#fff', flexShrink: 0 }}>
              <Button onClick={() => { setOpenDialog(false); setSelectedCandidate(null); }}
                variant="outlined"
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#c5cae9', color: '#3f51b5' }}>
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Add Candidate Form Dialog */}
      <Dialog
        open={addCandidateDialogOpen}
        onClose={() => setAddCandidateDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            height: 'auto',
            maxHeight: '98vh',
          },
        }}
      >
        <DialogTitle sx={{
          p: 3,
          background: "linear-gradient(135deg, #10b981 0%, #059669 100%)",
          color: "#fff", display: "flex", alignItems: "center", gap: 2,
        }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}><PersonAddIcon /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Add New Candidate</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Sourcing a new profile</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
          <Box sx={{ p: 2 }}>
            <CandidatesForm
              userId={sessionStorage.getItem('userId')}
              isEdit={false}
              onSuccess={() => {
                setAddCandidateDialogOpen(false);
                fetchCandidates();
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#fff", borderTop: "1px solid #f1f5f9" }}>
          <Button onClick={() => setAddCandidateDialogOpen(false)} sx={{ fontWeight: 700, borderRadius: "12px", px: 3, textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Candidate Form Dialog */}
      <Dialog
        open={editDialogOpen}
        onClose={() => setEditDialogOpen(false)}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            overflow: 'hidden',
            height: 'auto',
            maxHeight: '98vh',
          },
        }}
      >
        <DialogTitle sx={{
          p: 3,
          background: "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)",
          color: "#fff", display: "flex", alignItems: "center", gap: 2,
        }}>
          <Avatar sx={{ bgcolor: "rgba(255,255,255,0.2)", color: "#fff" }}><EditIcon /></Avatar>
          <Box>
            <Typography variant="h6" fontWeight={800} lineHeight={1.2}>Edit Candidate</Typography>
            <Typography variant="caption" sx={{ opacity: 0.8 }}>Updating details for {selectedCandidate?.name}</Typography>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: "#f8fafc" }}>
          <Box sx={{ p: 2 }}>
            <CandidatesForm
              userId={sessionStorage.getItem('userId')}
              candidateData={selectedCandidate}
              isEdit={true}
              onSuccess={() => {
                setEditDialogOpen(false);
                fetchCandidates();
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2, bgcolor: "#fff", borderTop: "1px solid #f1f5f9" }}>
          <Button onClick={() => setEditDialogOpen(false)} sx={{ fontWeight: 700, borderRadius: "12px", px: 3, textTransform: "none", color: "#64748b" }}>
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Position Dialog ── */}
      <Dialog open={assignOpen} onClose={() => setAssignOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
        <DialogTitle sx={{ p: 3, borderBottom: '1px solid #e8eaf6', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AssignIcon sx={{ color: '#3f51b5' }} />
          <Typography variant="h6" fontWeight={700}>Assign Candidates to Job Position</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 3, pt: 4 }}>
          {jobsLoading ? (
            <Box display="flex" justifyContent="center" py={4}><CircularProgress size={30} /></Box>
          ) : jobs.length === 0 ? (
            <Typography color="text.secondary">No job positions found assigned to you. Contact Admin/TL to get jobs assigned.</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
              <Typography fontSize={13.5} color="#475569">
                You are assigning <strong>{selectedIds.length} candidate{selectedIds.length !== 1 ? 's' : ''}</strong>. Select a target opening:
              </Typography>
              <Autocomplete
                options={jobs}
                value={selectedJob}
                onChange={(_, val) => setSelectedJob(val)}
                getOptionLabel={(o) => `${o.jobTitle} — ${o.companyName || ''}`}
                renderInput={(params) => <TextField {...params} label="Job Openings" size="small" />}
                renderOption={(props, option) => (
                  <li {...props} key={option._id}>
                    <Box>
                      <Typography fontSize={13.5} fontWeight={600} color="#1e293b">{option.jobTitle}</Typography>
                      <Typography fontSize={11.5} color="#64748b">
                        {option.companyName}{option.jobLocation ? ` · ${option.jobLocation}` : ''}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6' }}>
          <Button onClick={() => setAssignOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Cancel</Button>
          <Button variant="contained" onClick={handleAssign} disabled={assigning || !selectedJob} sx={{ textTransform: 'none', bgcolor: '#3f51b5' }}>
            {assigning ? 'Assigning...' : 'Assign'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assign Success Dialog ── */}
      <Dialog open={assignSuccessDialogOpen} onClose={() => setAssignSuccessDialogOpen(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', p: 1 } }}>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', pt: 4, pb: 2 }}>
          <Box sx={{ width: 60, height: 60, borderRadius: '50%', bgcolor: '#f0fdf4', display: 'flex', alignItems: 'center', justifyContent: 'center', mb: 2 }}>
            <svg xmlns="http://www.w3.org/2000/svg" width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </Box>
          <Typography variant="h6" fontWeight={800} color="#1e293b" mb={1}>
            Assignment Done!
          </Typography>
          <Typography fontSize={13.5} color="#64748b" mb={3}>
            {assignedCandidatesData?.assigned > 0 ? (
              <>Successfully assigned <strong>{assignedCandidatesData.assigned}</strong> candidates to <strong>{assignedJobData?.jobTitle}</strong>.</>
            ) : (
              <>Candidates were already assigned to <strong>{assignedJobData?.jobTitle}</strong>.</>
            )}
            {assignedCandidatesData?.alreadyAssigned > 0 && (
              <Box component="span" sx={{ display: 'block', mt: 1, fontSize: 12, color: '#f59e0b' }}>
                Note: {assignedCandidatesData.alreadyAssigned} record(s) skipped (already exists).
              </Box>
            )}
          </Typography>
          <Button variant="contained" fullWidth onClick={() => setAssignSuccessDialogOpen(false)} sx={{ borderRadius: '8px', textTransform: 'none', bgcolor: '#3f51b5' }}>
            Awesome
          </Button>
        </DialogContent>
      </Dialog>

      {/* ── Candidate Job Application History Dialog ── */}
      <Dialog open={historyOpen} onClose={() => setHistoryOpen(false)} maxWidth="sm" fullWidth
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}>
        <DialogTitle sx={{ p: 3, borderBottom: '1px solid #e8eaf6', display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <HistoryIcon sx={{ color: '#7c3aed' }} />
          <Typography variant="h6" fontWeight={700}>Candidate Application Journey</Typography>
        </DialogTitle>
        <DialogContent sx={{ p: 0, bgcolor: '#f8fafc', maxHeight: '60vh', overflowY: 'auto' }}>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" py={8}><CircularProgress color="secondary" /></Box>
          ) : !historyData || historyData.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">No job application records found for this candidate.</Typography>
            </Box>
          ) : (
            <Box sx={{ p: 3 }}>
              {historyData.map((app, idx) => {
                const isFirst = idx === 0;
                const isLast = idx === historyData.length - 1;
                return (
                  <Box key={app._id || idx} sx={{ display: 'flex', gap: 2 }}>
                    {/* Timeline axis */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                      <Box sx={{
                        width: 14, height: 14, borderRadius: '50%',
                        bgcolor: app.status === 'Selected' ? '#22c55e' : app.status === 'Rejected' ? '#ef4444' : '#3f51b5',
                        border: '3px solid #fff', boxShadow: '0 0 0 2px rgba(99,102,241,0.2)', zIndex: 1
                      }} />
                      {!isLast && <Box sx={{ width: 2, flexGrow: 1, bgcolor: '#e2e8f0', my: 0.5 }} />}
                    </Box>
                    {/* Card details */}
                    <Box sx={{ flexGrow: 1, pb: 3 }}>
                      <Box sx={{ p: 2, bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography fontSize={14} fontWeight={700} color="#1e293b">
                            {app.jobId?.jobTitle || 'Relevant Opening'}
                          </Typography>
                          <Chip label={app.status || 'Applied'} size="small"
                            sx={{
                              height: 20, fontSize: 11, fontWeight: 700,
                              bgcolor: app.status === 'Selected' ? '#dcfce7' : app.status === 'Rejected' ? '#fee2e2' : '#eff6ff',
                              color: app.status === 'Selected' ? '#15803d' : app.status === 'Rejected' ? '#b91c1c' : '#1e40af'
                            }} />
                        </Box>
                        <Typography fontSize={12} color="#64748b" mb={1.5}>
                          Company: {app.jobId?.companyName || '—'} · Location: {app.jobId?.jobLocation || '—'}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 1.5, fontSize: 12, color: '#94a3b8' }}>
                          <Typography fontSize={11}>
                            Assigned on: {new Date(app.createdAt).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  </Box>
                );
              })}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6' }}>
          <Button onClick={() => setHistoryOpen(false)} sx={{ textTransform: 'none', color: '#64748b' }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* ── Send Email Dialog ── */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: '16px', overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid #e8eaf6',
        }}>
          <Typography variant="h6" fontWeight={700} color="#1e293b" fontSize={17}>
            Send email
          </Typography>
          <IconButton size="small" onClick={() => setEmailDialogOpen(false)}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Select Template bar */}
        <Box sx={{ px: 3, py: 1.2, bgcolor: '#f0f7ff', borderBottom: '1px solid #e0eaff', display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography fontSize={13} fontWeight={600} color="#3f51b5">Select Template</Typography>
          <Typography fontSize={13} color="#3f51b5">▾</Typography>
        </Box>

        <Box sx={{ px: 3, py: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
          {/* To + Send me a copy */}
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography fontSize={13} color="#64748b" fontWeight={600}>To:</Typography>
              <Typography fontSize={13} color="#1e293b" fontWeight={500}>
                {emailTarget?.email || '—'}
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
              <input
                type="checkbox"
                id="hrSendMeCopy"
                checked={emailSendMeCopy}
                onChange={(e) => setEmailSendMeCopy(e.target.checked)}
                style={{ cursor: 'pointer' }}
              />
              <label htmlFor="hrSendMeCopy" style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>
                Send me a copy
              </label>
            </Box>
          </Box>

          {/* Subject */}
          <Box>
            <Typography fontSize={13} color="#64748b" fontWeight={600} mb={0.5}>Subject:</Typography>
            <TextField
              fullWidth size="small"
              placeholder="Enter subject..."
              value={emailSubject}
              onChange={(e) => setEmailSubject(e.target.value)}
              sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 13 } }}
            />
          </Box>

          {/* Body */}
          <Box>
            <Box sx={{
              display: 'flex', alignItems: 'center', gap: 1,
              px: 1.5, py: 0.8,
              border: '1px solid #e2e8f0', borderBottom: 'none',
              borderRadius: '8px 8px 0 0', bgcolor: '#f8fafc',
            }}>
              {['B', 'I', 'U'].map((fmt) => (
                <Typography key={fmt} fontSize={13} fontWeight={700} color="#475569"
                  sx={{ cursor: 'pointer', px: 0.5, '&:hover': { color: '#3f51b5' } }}>
                  {fmt}
                </Typography>
              ))}
              <Box sx={{ width: 1, height: 16, bgcolor: '#e2e8f0', mx: 0.5 }} />
              {['•—', '1—'].map((fmt) => (
                <Typography key={fmt} fontSize={13} color="#475569"
                  sx={{ cursor: 'pointer', px: 0.5, '&:hover': { color: '#3f51b5' } }}>
                  {fmt}
                </Typography>
              ))}
              <Typography fontSize={12} color="#3f51b5" sx={{ ml: 'auto', cursor: 'pointer', fontWeight: 600 }}>
                Insert tags ▾
              </Typography>
            </Box>
            <TextField
              fullWidth multiline minRows={6}
              placeholder="Write your message here..."
              value={emailBody}
              onChange={(e) => setEmailBody(e.target.value)}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '0 0 8px 8px', fontSize: 13, alignItems: 'flex-start',
                },
              }}
            />
          </Box>
        </Box>

        {/* Footer */}
        <Box sx={{
          px: 3, py: 2,
          borderTop: '1px solid #e8eaf6',
          display: 'flex', alignItems: 'center', gap: 2,
        }}>
          <Button
            variant="contained"
            onClick={handleSendEmail}
            disabled={emailSending}
            sx={{
              bgcolor: '#3f51b5', color: '#fff', fontWeight: 700,
              borderRadius: '8px', textTransform: 'none', px: 3,
              '&:hover': { bgcolor: '#3949ab' },
            }}
          >
            {emailSending ? 'Sending...' : 'Send email'}
          </Button>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.8 }}>
            <input type="checkbox" id="hrSaveTemplate" style={{ cursor: 'pointer' }} />
            <label htmlFor="hrSaveTemplate" style={{ fontSize: 13, color: '#475569', cursor: 'pointer' }}>
              Save this as a template
            </label>
          </Box>
        </Box>
      </Dialog>

      {/* ── Phone Popover ── */}
      <Popover
        open={Boolean(phonePopover.anchor)}
        anchorEl={phonePopover.anchor}
        onClose={closePhonePopover}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        transformOrigin={{ vertical: 'top', horizontal: 'center' }}
        PaperProps={{ sx: { borderRadius: '16px', boxShadow: '0 8px 32px rgba(0,0,0,0.18)', overflow: 'hidden', minWidth: 240 } }}
      >
        <Box sx={{ background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', px: 2.5, py: 1.5 }}>
          <Typography fontSize={13} fontWeight={700} color="#fff">{phonePopover.name}</Typography>
          <Typography fontSize={11} color="rgba(255,255,255,0.7)">Phone Number</Typography>
        </Box>
        <Box sx={{ p: 2.5, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
          {/* QR Code */}
          <Box sx={{ p: 1.5, bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px' }}>
            <QRCodeSVG
              value={phonePopover.phone ? `tel:${phonePopover.phone.replace(/[^0-9+]/g, '')}` : 'tel:'}
              size={140}
              bgColor="#ffffff"
              fgColor="#1e293b"
              level="M"
            />
          </Box>
          <Typography fontSize={11} color="#94a3b8" textAlign="center">
            Scan to call from mobile
          </Typography>
          {/* Phone number display */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, bgcolor: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '10px', px: 2, py: 1.2, width: '100%' }}>
            <Typography fontSize={15} fontWeight={700} color="#1e293b" sx={{ flexGrow: 1, letterSpacing: '0.04em' }}>
              {phonePopover.phone || '—'}
            </Typography>
            <Tooltip title="Copy number">
              <IconButton size="small"
                onClick={() => { navigator.clipboard.writeText(phonePopover.phone); }}
                sx={{ color: '#3f51b5' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
              </IconButton>
            </Tooltip>
          </Box>
          {/* Call button */}
          <Button
            variant="contained" fullWidth size="small"
            component="a" href={`tel:${phonePopover.phone}`}
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, fontSize: 13, bgcolor: '#3f51b5', '&:hover': { bgcolor: '#303f9f' } }}
          >
            📞 Call Now
          </Button>
        </Box>
      </Popover>

      {/* ── WhatsApp Preview Dialog ── */}
      <Dialog
        open={waDialogOpen}
        onClose={() => setWaDialogOpen(false)}
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
        {/* ── Fixed Header ── */}
        <Box sx={{
          background: 'linear-gradient(135deg, #25d366 0%, #128c7e 100%)',
          px: 3, py: 2,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          flexShrink: 0,
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Box sx={{ width: 38, height: 38, borderRadius: '55%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            </Box>
            <Box>
              <Typography fontWeight={700} color="#fff" fontSize={15} lineHeight={1.3}>
                Send WhatsApp to {waCandidate?.name || '—'}
              </Typography>
              <Typography fontSize={11.5} color="rgba(255,255,255,0.8)">
                Review the template and select a job opening, then send.
              </Typography>
            </Box>
          </Box>
          <IconButton size="small" onClick={() => setWaDialogOpen(false)}
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.15)', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
            <ClearIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ── Scrollable Body — two columns ── */}
        <Box sx={{ display: 'flex', flexGrow: 1, overflow: 'hidden', minHeight: 0 }}>

          {/* LEFT column — job + HR info */}
          <Box sx={{
            width: '42%',
            flexShrink: 0,
            borderRight: '1px solid #e8eaf6',
            overflowY: 'auto',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 2,
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 3 },
          }}>

            {/* Job Opening Dropdown */}
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                <Typography fontSize={11.5} fontWeight={700} color="#166534" textTransform="uppercase" letterSpacing="0.06em">
                  Select Job Opening
                </Typography>
                {waJobLoading && <CircularProgress size={13} sx={{ color: '#166534' }} />}
              </Box>
              <Autocomplete
                size="small"
                options={waJobList}
                value={waJob}
                onChange={(_, val) => handleWaJobSelect(val)}
                getOptionLabel={(o) => `${o.jobTitle} — ${o.companyName || ''}`}
                noOptionsText={waJobLoading ? "Loading..." : "No open positions found"}
                renderInput={(params) => (
                  <TextField {...params} placeholder="Select a position..."
                    sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px', bgcolor: '#f8fafc', fontSize: 13 } }} />
                )}
                renderOption={(props, option) => (
                  <li {...props} key={option._id}>
                    <Box sx={{ py: 0.3 }}>
                      <Typography fontSize={13} fontWeight={600} color="#1e293b">{option.jobTitle}</Typography>
                      <Typography fontSize={11.5} color="#64748b">
                        {option.companyName}{option.jobLocation ? ` · ${option.jobLocation}` : ''}{option.salary ? ` · ${option.salary}` : ''}
                      </Typography>
                    </Box>
                  </li>
                )}
              />
            </Box>

            {/* Selected job details */}
            {waJob && (
              <Box sx={{ bgcolor: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '10px', p: 1.5 }}>
                <Typography fontSize={11} fontWeight={700} color="#166534" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                  Job Details
                </Typography>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                  <Typography fontSize={12.5} color="#1e293b"><strong>Title:</strong> {waJob.jobTitle}</Typography>
                  {waJob.companyName && <Typography fontSize={12.5} color="#1e293b"><strong>Company:</strong> {waJob.companyName}</Typography>}
                  {waJob.jobLocation && <Typography fontSize={12.5} color="#1e293b"><strong>Location:</strong> {waJob.jobLocation}</Typography>}
                  {waJob.salary && <Typography fontSize={12.5} color="#1e293b"><strong>Salary:</strong> {waJob.salary}</Typography>}
                  {waJob.experience && <Typography fontSize={12.5} color="#1e293b"><strong>Experience:</strong> {waJob.experience}</Typography>}
                </Box>
              </Box>
            )}

            {/* HR Sender info */}
            <Box sx={{ bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '10px', p: 1.5 }}>
              <Typography fontSize={11} fontWeight={700} color="#1e40af" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                Sender (HR)
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography fontSize={12.5} color="#1e293b"><strong>Name:</strong> {senderName || 'HR Team'}</Typography>
                {senderPhone && <Typography fontSize={12.5} color="#1e293b"><strong>Mobile:</strong> {senderPhone}</Typography>}
              </Box>
            </Box>

            {/* Candidate info */}
            <Box sx={{ bgcolor: '#fafafa', border: '1px solid #e2e8f0', borderRadius: '10px', p: 1.5 }}>
              <Typography fontSize={11} fontWeight={700} color="#475569" textTransform="uppercase" letterSpacing="0.06em" mb={1}>
                Sending To
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
                <Typography fontSize={12.5} color="#1e293b"><strong>Name:</strong> {waCandidate?.name || '—'}</Typography>
                {waCandidate?.phoneNumber && <Typography fontSize={12.5} color="#1e293b"><strong>Phone:</strong> {waCandidate.phoneNumber}</Typography>}
                {waCandidate?.positionName && <Typography fontSize={12.5} color="#1e293b"><strong>Applied For:</strong> {waCandidate.positionName}</Typography>}
              </Box>
            </Box>
          </Box>

          {/* RIGHT column — message preview */}
          <Box sx={{
            flex: 1,
            overflowY: 'auto',
            p: 2.5,
            display: 'flex',
            flexDirection: 'column',
            gap: 1.5,
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
              fullWidth
              multiline
              minRows={16}
              value={waMessage}
              onChange={(e) => setWaMessage(e.target.value)}
              sx={{
                flexGrow: 1,
                '& .MuiOutlinedInput-root': {
                  borderRadius: '10px',
                  fontSize: 13,
                  fontFamily: 'Lora',
                  bgcolor: '#f8fafc',
                  alignItems: 'flex-start',
                  lineHeight: 1.7,
                },
              }}
            />
            <Typography fontSize={11} color="#94a3b8">
              💡 You can edit the message above before sending.
            </Typography>
          </Box>
        </Box>

        {/* ── Fixed Footer ── */}
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', justifyContent: 'flex-end', alignItems: 'center', gap: 1.5,
          borderTop: '1px solid #e8eaf6',
          bgcolor: '#fff',
          flexShrink: 0,
        }}>
          <Button onClick={() => setWaDialogOpen(false)} variant="outlined" size="medium"
            sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 600, borderColor: '#d1d5db', color: '#6b7280', px: 3 }}>
            Cancel
          </Button>
          <Button
            onClick={sendWhatsApp}
            variant="contained"
            size="medium"
            startIcon={
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
              </svg>
            }
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
    </div>
  );
};

export default MySourcedData;