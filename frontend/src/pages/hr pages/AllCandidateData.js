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
} from "@mui/material";import { QRCodeSVG } from "qrcode.react";
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

// Debounce hook
function useDebounce(value, delay = 500) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

const AllCandidateData = () => {
  const [candidates, setCandidates]   = useState([]);
  const [total, setTotal]             = useState(0);
  const [loading, setLoading]         = useState(false);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 50 });

  // Filters
  const [nameFilter, setNameFilter]               = useState("");
  const [locationFilter, setLocationFilter]       = useState("");
  const [positionFilter, setPositionFilter]       = useState("");
  const [selectedHRs, setSelectedHRs]             = useState([]);
  const [hrList, setHrList]                       = useState([]);
  const [experienceRange, setExperienceRange]     = useState({ min: "", max: "" });
  const [ctcFilter, setCtcFilter]                 = useState({ min: "", max: "" });
  const [noticePeriodFilter, setNoticePeriodFilter] = useState("");
  const [genderFilter, setGenderFilter]             = useState("");
  const [phoneFilter, setPhoneFilter]               = useState("");
  const [currentPositionFilter, setCurrentPositionFilter] = useState("");
  const [industryFilter, setIndustryFilter]               = useState("");
  const [dateRange, setDateRange]                 = useState({ startDate: null, endDate: null });
  const [positions, setPositions]                 = useState([]);

  const dName     = useDebounce(nameFilter);
  const dLocation = useDebounce(locationFilter);
  const dPosition = useDebounce(positionFilter);
  const dCreatedBy= useDebounce(''); // kept for compat — HR uses selectedHRs dropdown now
  const dCtc      = useDebounce(ctcFilter.min);
  const dCtcMax   = useDebounce(ctcFilter.max);
  const dNotice   = useDebounce(noticePeriodFilter);
  const dGender   = useDebounce(genderFilter);
  const dPhone    = useDebounce(phoneFilter);
  const dCurPos   = useDebounce(currentPositionFilter);
  const dIndustry = useDebounce(industryFilter);
  const dExpMin   = useDebounce(experienceRange.min);
  const dExpMax   = useDebounce(experienceRange.max);

  // Filter accordion open state
  const [openFilters, setOpenFilters] = useState({
    keywords: true, location: false, experience: false,
    salary: false, position: false, createdBy: false,
    noticePeriod: false, gender: false, phone: false, dateRange: false,
    currentPosition: false, industry: false,
  });
  const toggleFilter = (key) => setOpenFilters(p => ({ ...p, [key]: !p[key] }));

  // Selection for assign
  const [selectedIds, setSelectedIds]   = useState([]);

  // Assign dialog
  const [assignOpen, setAssignOpen]     = useState(false);
  const [jobs, setJobs]                 = useState([]);
  const [jobsLoading, setJobsLoading]   = useState(false);
  const [selectedJob, setSelectedJob]   = useState(null);
  const [assigning, setAssigning]       = useState(false);

  // View dialog
  const [openDialog, setOpenDialog]         = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);

  // History dialog
  const [historyOpen, setHistoryOpen]       = useState(false);
  const [historyData, setHistoryData]       = useState(null);
  const [historyLoading, setHistoryLoading] = useState(false);

  // Add Candidate Form Dialog state
  const [addCandidateDialogOpen, setAddCandidateDialogOpen] = useState(false);

  // ── Send Email Dialog state ─────────────────────────────────────────────────
  const [emailDialogOpen, setEmailDialogOpen]   = useState(false);
  const [emailTarget, setEmailTarget]           = useState(null);
  const [emailSubject, setEmailSubject]         = useState('');
  const [emailBody, setEmailBody]               = useState('');
  const [emailSendMeCopy, setEmailSendMeCopy]   = useState(false);
  const [emailSending, setEmailSending]         = useState(false);

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
  const [waDialogOpen, setWaDialogOpen]   = useState(false);
  const [waCandidate, setWaCandidate]     = useState(null);
  const [waJob, setWaJob]                 = useState(null);
  const [waJobList, setWaJobList]         = useState([]);
  const [waMessage, setWaMessage]         = useState('');
  const [senderPhone, setSenderPhone]     = useState('');
  const [waJobLoading, setWaJobLoading]   = useState(false);

  const buildWaMessage = (candidate, job, hrName, hrPhone) => {
    const hour = new Date().getHours();
    const greeting = hour < 12 ? "Good Morning" : hour < 17 ? "Good Afternoon" : "Good Evening";
    const jobTitle    = job?.jobTitle    || candidate.positionName || "relevant opening";
    const company     = job?.companyName || '';
    const jobLocation = job?.jobLocation || '';
    const salary      = job?.salary      || '';
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

  // ── Generate & download CV as PDF ──────────────────────────────────────────
  const handleDownloadCV = async (candidate) => {
    const { jsPDF } = await import('jspdf');
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const W = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = 40;

    // ── Header: Name ──
    doc.setFillColor(59, 130, 246);
    doc.rect(margin, y, W - margin * 2, 38, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text((candidate.name || 'CANDIDATE').toUpperCase(), margin + 12, y + 27);
    y += 55;

    // ── Sub-header: gender/age · location · phone · email ──
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y, W - margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(60, 60, 60);
    const subParts = [
      candidate.gender ? candidate.gender : null,
      candidate.currentLocation || null,
      candidate.phoneNumber || null,
      candidate.email || null,
    ].filter(Boolean);
    doc.text(subParts.join('   •   '), margin, y);
    y += 6;
    doc.line(margin, y, W - margin, y);
    y += 20;

    // ── Career Objective ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('CAREER OBJECTIVE', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    const objective = candidate.remark || candidate.reasonforLeaving ||
      `I aim to be associated with an organization that gives me the scope to apply my skills and actively work towards the growth of the organization and myself.`;
    const objLines = doc.splitTextToSize(objective, W - margin * 2);
    doc.text(objLines, margin, y);
    y += objLines.length * 13 + 16;

    // ── Education ──
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.setTextColor(40, 40, 40);
    doc.text('EDUCATION', margin, y);
    y += 14;
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(80, 80, 80);
    if (candidate.qualification) {
      doc.text(`Education level: ${candidate.qualification}`, margin, y);
      y += 13;
    }
    y += 10;

    // ── Work Experience ──
    if (candidate.currentPosition || candidate.currentCompany || candidate.experience) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('WORK EXPERIENCE', margin, y);
      y += 14;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      if (candidate.currentPosition) { doc.text(`Position: ${candidate.currentPosition}`, margin + 10, y); y += 13; }
      if (candidate.currentCompany)  { doc.text(`Company: ${candidate.currentCompany}`, margin + 10, y); y += 13; }
      if (candidate.experience)      { doc.text(`Experience: ${candidate.experience}`, margin + 10, y); y += 13; }
      if (candidate.currentCTC)      { doc.text(`Current CTC: ₹${candidate.currentCTC} `, margin + 10, y); y += 13; }
      if (candidate.expectedCTC)     { doc.text(`Expected CTC: ₹${candidate.expectedCTC} `, margin + 10, y); y += 13; }
      if (candidate.noticePeriod)    { doc.text(`Notice Period: ${candidate.noticePeriod} `, margin + 10, y); y += 13; }
      y += 10;
    }

    // ── Skills ──
    if (candidate.positionName || candidate.currentPosition) {
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(12);
      doc.setTextColor(40, 40, 40);
      doc.text('SKILLS', margin, y);
      y += 14;
      const skills = [candidate.positionName, candidate.currentPosition].filter(Boolean);
      let sx = margin;
      skills.forEach(skill => {
        doc.setFillColor(59, 130, 246);
        doc.setTextColor(255, 255, 255);
        doc.setFontSize(9);
        const tw = doc.getTextWidth(skill) + 14;
        doc.roundedRect(sx, y - 10, tw, 16, 4, 4, 'F');
        doc.text(skill, sx + 7, y + 1);
        sx += tw + 8;
      });
      y += 22;
    }

    // ── Footer ──
    doc.setFont('helvetica', 'italic');
    doc.setFontSize(9);
    doc.setTextColor(120, 120, 120);
    doc.setFillColor(240, 240, 240);
    doc.rect(0, doc.internal.pageSize.getHeight() - 28, W, 28, 'F');
    doc.text('This CV is generated by iTalentConnect from candidate\'s profile', margin, doc.internal.pageSize.getHeight() - 12);

    doc.save(`${(candidate.name || 'candidate').replace(/\s+/g, '_')}_CV.pdf`);
  };

  useEffect(() => {
    const fetchSenderName = async () => {
      try {
        const token = sessionStorage.getItem('token');
        if (!token) return;
        // profile middleware expects raw token (no "Bearer " prefix)
        const res = await axios.get(`${API_BASE_URL}/profile`, {
          headers: { Authorization: token },
        });
        const { firstName = '', lastName = '', phoneNumber = '' } = res.data || {};
        const name = `${firstName} ${lastName}`.trim();
        if (name) setSenderName(name);
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
    if (!emailBody.trim())    { toast.error('Please enter a message'); return; }
    setEmailSending(true);
    try {
      const token = sessionStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/email/send-candidate-email`, {
        to:         emailTarget.email,
        subject:    emailSubject,
        body:       emailBody,
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
    try {
      setLoading(true);
      const token = sessionStorage.getItem("token");
      const params = {
        page:  paginationModel.page + 1,
        limit: paginationModel.pageSize,
      };
      if (dName)      params.name      = dName;
      if (dLocation)  params.location  = dLocation;
      if (dPosition)  params.position  = dPosition;
      if (selectedHRs.length > 0)
        params.createdBy = selectedHRs.map((h) => h.name).join(",");
      if (dExpMin)    params.minExp    = dExpMin;
      if (dExpMax)    params.maxExp    = dExpMax;
      if (dCtc)       params.minCtc    = dCtc;
      if (dCtcMax)    params.maxCtc    = dCtcMax;
      if (dNotice)    params.maxNotice        = dNotice;
      if (dGender)    params.gender           = dGender;
      if (dPhone)     params.phone            = dPhone;
      if (dCurPos)    params.currentPosition  = dCurPos;
      if (dIndustry)  params.industry         = dIndustry;
      if (dateRange.startDate) params.startDate = dateRange.startDate.toISOString();
      if (dateRange.endDate)   params.endDate   = dateRange.endDate.toISOString();

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
  }, [paginationModel, dName, dLocation, dPosition, dExpMin, dExpMax, dCtc, dCtcMax, dNotice, dGender, dPhone, dCurPos, dIndustry, selectedHRs, dateRange]);

  // Reset page on filter change
  useEffect(() => {
    if (isFirstRender.current) { isFirstRender.current = false; return; }
    setPaginationModel((p) => ({ ...p, page: 0 }));
  }, [dName, dLocation, dPosition, dExpMin, dExpMax, dCtc, dCtcMax, dNotice, dGender, dPhone, dCurPos, dIndustry, selectedHRs, dateRange]);

  useEffect(() => { fetchCandidates(); }, [fetchCandidates]);

  // ── Fetch HR list for Created By dropdown ──────────────────────────────────
  useEffect(() => {
    const fetchHRList = async () => {
      try {
        const token = sessionStorage.getItem("token");
        const res = await axios.get(`${API_BASE_URL}/hr/hr-admins`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const sorted = res.data
          .map((u) => ({ id: u._id, name: `${u.firstName} ${u.lastName}`.trim(), role: u.role }))
          .sort((a, b) => a.name.localeCompare(b.name));
        setHrList(sorted);
      } catch (e) { console.error(e); }
    };
    fetchHRList();
  }, []);

  // ── Fetch HR's assigned jobs only ──────────────────────────────────────────
  const fetchJobs = async () => {
    try {
      setJobsLoading(true);
      const token = sessionStorage.getItem("token");
      // /api/assignhr returns only jobs assigned to the logged-in HR
      const res = await axios.get(`${API_BASE_URL}/assignhr`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Response shape: { success: true, data: [...] }
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

      // Close assign dialog and show success dialog
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
      setHistoryData(res.data);
    } catch (err) {
      toast.error("Failed to load history");
      setHistoryOpen(false);
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleClearFilters = () => {
    setNameFilter(""); setLocationFilter(""); setPositionFilter("");
    setSelectedHRs([]); setDateRange({ startDate: null, endDate: null });
    setExperienceRange({ min: "", max: "" }); setCtcFilter({ min: "", max: "" }); setNoticePeriodFilter("");
    setGenderFilter(""); setPhoneFilter(""); setCurrentPositionFilter("");
    setIndustryFilter("");
  };

  const hasActiveFilters =
    nameFilter || locationFilter || positionFilter || selectedHRs.length > 0 ||
    ctcFilter.min || ctcFilter.max || noticePeriodFilter || genderFilter || phoneFilter || currentPositionFilter || industryFilter ||
    experienceRange.min || experienceRange.max ||
    dateRange.startDate || dateRange.endDate;

  // ── Columns (table view) ─────────────────────────────────────────────────────
  const columns = [
    {
      field: "actions", headerName: "Actions", width: 100, sortable: false,
      renderCell: (params) => (
        <Box display="flex" gap={0.5}>
          <Tooltip title="View details">
            <IconButton size="small" color="primary"
              onClick={(e) => { e.stopPropagation(); setSelectedCandidate(params.row); setOpenDialog(true); }}
            >
              <ViewIcon fontSize="small" />
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
    { field: "createdBy",       headerName: "Created By",       width: 130 },
    { field: "name",            headerName: "Name",             width: 150 },
    { field: "phoneNumber",     headerName: "Phone",            width: 130 },
    { field: "positionName",    headerName: "Position",         width: 150 },
    { field: "experience",      headerName: "Experience",       width: 100 },
    { field: "currentLocation", headerName: "Location",         width: 130 },
    { field: "currentPosition", headerName: "Current Position", width: 150 },
    { field: "currentCTC",      headerName: "Current CTC",      width: 110 },
    { field: "expectedCTC",     headerName: "Expected CTC",     width: 110 },
    { field: "noticePeriod",    headerName: "Notice Period",    width: 110 },
    { field: "currentCompany",  headerName: "Company",          width: 140 },
    { field: "industry",        headerName: "Industry",         width: 140 },
    { field: "remark",          headerName: "Remark",           width: 140 },
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
                <Typography fontSize={13} color="#475569">{candidate.experience}</Typography>
              </Box>
            )}
            {candidate.currentCTC && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <CurrencyRupeeIcon sx={{ fontSize: 13, color: "#64748b" }} />
                <Typography fontSize={13} color="#475569">{candidate.currentCTC}</Typography>
              </Box>
            )}
            {candidate.currentLocation && (
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.4 }}>
                <LocationIcon sx={{ fontSize: 13, color: "#64748b" }} />
                <Typography fontSize={13} color="#475569">{candidate.currentLocation}</Typography>
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
                Expected CTC: <strong>{candidate.expectedCTC}</strong>
              </Typography>
            )}
            {(candidate.noticePeriod !== undefined && candidate.noticePeriod !== "") && (
              <Typography fontSize={12.5} color="#64748b">
                Notice Period: <strong>{candidate.noticePeriod}</strong>
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
            {candidate.createdBy && (
              <Typography fontSize={12} color="#94a3b8">
                Created by: <span style={{ color: "#475569", fontWeight: 500 }}>{candidate.createdBy}</span>
              </Typography>
            )}
            {candidate.createdAt && (
              <Typography fontSize={12} color="#94a3b8">
                {new Date(candidate.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
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
          {/* Icon row — 4 action icons in a horizontal row */}
          <Box sx={{ display: "flex", justifyContent: "center", gap: 1, mb: 0.5 }}>
            <Tooltip title="View details">
              <IconButton size="small"
                onClick={() => { setSelectedCandidate(candidate); setOpenDialog(true); }}
                sx={{ bgcolor: "#f8fafc", border: "1px solid #e2e8f0", width: 32, height: 32 }}>
                <ResumeIcon sx={{ fontSize: 15, color: "#64748b" }} />
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
                    <rect x="2" y="4" width="20" height="16" rx="2"/>
                    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>
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
                    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
                  </svg>
                </IconButton>
              </span>
            </Tooltip>
          </Box>

          {/* Divider */}
          <Box sx={{ height: "1px", bgcolor: "#f1f5f9" }} />

          {/* Position label */}
          <Typography fontSize={12} align="center" color="#64748b" lineHeight={1.4} sx={{ px: 0.5 }}>
            {candidate.currentPosition || "Candidate"}
            {candidate.currentLocation ? <><br /><span style={{ color: "#94a3b8" }}>{candidate.currentLocation}</span></> : null}
          </Typography>

          {/* View phone number button */}
          <Button variant="outlined" size="small" fullWidth
            onClick={(e) => openPhonePopover(e, candidate)}
            sx={{
              textTransform: "none", borderRadius: "6px", fontSize: 11.5, fontWeight: 600,
              borderColor: "#3f51b5", color: "#3f51b5", py: 0.6,
              "&:hover": { bgcolor: "#f0f2ff" },
            }}
          >
            View phone number
          </Button>

          {/* Call candidate button */}
          <Button variant="outlined" size="small" fullWidth
            component="a" href={`tel:${candidate.phoneNumber}`}
            startIcon={<PhoneIcon sx={{ fontSize: 13 }} />}
            sx={{
              textTransform: "none", borderRadius: "6px", fontSize: 11.5, fontWeight: 600,
              borderColor: "#64748b", color: "#475569", py: 0.6,
              "&:hover": { bgcolor: "#f8fafc" },
            }}
          >
            Call candidate
          </Button>

          <Typography fontSize={11} color="#94a3b8" align="center">Verified phone &amp; email</Typography>
        </Box>
      </Box>

      {/* FOOTER BAR */}
      <Box sx={{
        display: "flex", alignItems: "center", gap: 3,
        px: 2, py: 0.8,
        borderTop: "1px solid #f1f5f9",
        bgcolor: "#fafafa",
        borderRadius: "0 0 10px 10px",
      }}>
        {candidate.resumeUpload && candidate.resumeUpload.startsWith('http') ? (
          <Box component="a" href={candidate.resumeUpload} target="_blank" rel="noopener noreferrer"
            sx={{ display: "flex", alignItems: "center", gap: 0.5, textDecoration: "none" }}>
            <Typography fontSize={12} color="#64748b">📎 CV</Typography>
          </Box>
        ) : (
          <Typography fontSize={12} color="#cbd5e1">📎 No Resume</Typography>
        )}
        <Typography fontSize={12} color="#94a3b8">
          Modified {candidate.createdAt ? new Date(candidate.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "—"}
        </Typography>
        <Typography fontSize={12} color="#94a3b8" sx={{ ml: "auto" }}>Currently Active</Typography>
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
                    {[0,1,2].map(i => (
                      <Box key={i} sx={{ width: 12, height: 1.5, bgcolor: "#fff", borderRadius: 1 }} />
                    ))}
                  </Box>
                </Box>
                <Typography fontWeight={700} fontSize={15} color="#1e293b">Filters</Typography>
                {hasActiveFilters && (
                  <Box sx={{ bgcolor: "#3f51b5", color: "#fff", fontWeight: 700, fontSize: "0.7rem", borderRadius: "10px",
                    minWidth: 22, height: 22, display: "flex", alignItems: "center", justifyContent: "center", px: 0.5 }}>
                    {[nameFilter, locationFilter, positionFilter, experienceRange.min || experienceRange.max,
                      ctcFilter.min || ctcFilter.max, noticePeriodFilter, genderFilter, phoneFilter,
                      currentPositionFilter, industryFilter, selectedHRs.length > 0,
                      dateRange.startDate || dateRange.endDate,
                    ].filter(Boolean).length}
                  </Box>
                )}
              </Box>
              {hasActiveFilters && (
                <Button size="small" onClick={handleClearFilters}
                  sx={{ fontSize: 11, fontWeight: 700, color: "#ef4444", textTransform: "none", minWidth: "auto",
                    borderRadius: "6px", px: 1, "&:hover": { bgcolor: "#fef2f2" } }}>
                  Clear all
                </Button>
              )}
            </Box>
            {hasActiveFilters && (
              <Button size="small" onClick={handleClearFilters} sx={{ textTransform: "none", fontSize: 12, minWidth: 0, p: 0.5 }}>
                Clear all
              </Button>
            )}
          </Box>

          {/* Accordion filter rows */}
          {[
            {
              key: "keywords", label: "Keywords", icon: <SearchIcon sx={{ fontSize: 18 }} />,
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
              key: "experience", label: "Experience", icon: <AccessTime sx={{ fontSize: 18 }} />,
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
              key: "salary", label: "Salary (CTC)", icon: <CurrencyRupeeIcon sx={{ fontSize: 18 }} />,
              content: (
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <TextField size="small" placeholder="Min"
                    value={ctcFilter.min}
                    onChange={(e) => setCtcFilter(p => ({ ...p, min: e.target.value.replace(/[^0-9.]/g, "") }))}
                    sx={{ flex: 1, "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                  />
                  <Typography fontSize={12} color="#94a3b8">–</Typography>
                  <TextField size="small" placeholder="Max"
                    value={ctcFilter.max}
                    onChange={(e) => setCtcFilter(p => ({ ...p, max: e.target.value.replace(/[^0-9.]/g, "") }))}
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
                  onChange={(_, val) => setPositionFilter(val[val.length-1] || "")}
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
              key: "createdBy", label: "Created By", icon: <PersonIcon sx={{ fontSize: 18 }} />,
              content: (
                <Autocomplete multiple size="small" options={hrList} value={selectedHRs}
                  getOptionLabel={(o) => `${o.name} (${o.role})`}
                  onChange={(_, val) => setSelectedHRs(val)}
                  renderInput={(params) => (
                    <TextField {...params} placeholder="Select HR/Admin"
                      sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }} />
                  )}
                  renderTags={(value, getTagProps) =>
                    value.map((option, index) => <Chip {...getTagProps({ index })} label={option.name} size="small" key={index} />)
                  }
                />
              ),
            },
            {
              key: "noticePeriod", label: "Notice period", icon: <ClearIcon sx={{ fontSize: 18 }} />,
              content: (
                <TextField fullWidth size="small" placeholder="Max days (e.g. 30)"
                  value={noticePeriodFilter} onChange={(e) => setNoticePeriodFilter(e.target.value)}
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
                  value={phoneFilter} onChange={(e) => setPhoneFilter(e.target.value)}
                  sx={{ "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } }}
                />
              ),
            },
            {
              key: "dateRange", label: "Date Range", icon: <CalendarTodayIcon sx={{ fontSize: 18 }} />,
              content: (
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <Box sx={{ display: "flex", flexDirection: "column", gap: 1.5 }}>
                    <DatePicker label="From Date" value={dateRange.startDate}
                      onChange={(val) => setDateRange(p => ({ ...p, startDate: val }))}
                      slotProps={{ textField: { size: "small", fullWidth: true,
                        sx: { "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } } } }} />
                    <DatePicker label="To Date" value={dateRange.endDate}
                      onChange={(val) => setDateRange(p => ({ ...p, endDate: val }))}
                      slotProps={{ textField: { size: "small", fullWidth: true,
                        sx: { "& .MuiOutlinedInput-root": { borderRadius: "8px", bgcolor: "#f8fafc", fontSize: 13 } } } }} />
                  </Box>
                </LocalizationProvider>
              ),
            },
          ].map(({ key, label, icon, content }) => {
            const isActive = {
              keywords: !!nameFilter, location: !!locationFilter,
              experience: !!(experienceRange.min || experienceRange.max),
              salary: !!(ctcFilter.min || ctcFilter.max),
              position: !!positionFilter,
              createdBy: selectedHRs.length > 0,
              currentPosition: !!currentPositionFilter,
              industry: !!industryFilter,
              noticePeriod: !!noticePeriodFilter,
              gender: !!genderFilter,
              phone: !!phoneFilter,
              dateRange: !!(dateRange.startDate || dateRange.endDate),
            }[key];
            return (
            <Box key={key} sx={{ borderBottom: "1px solid #f1f5f9" }}>
              <Box
                onClick={() => toggleFilter(key)}
                sx={{
                  display: "flex", alignItems: "center", justifyContent: "space-between",
                  px: 2, py: 1.5, cursor: "pointer",
                  bgcolor: isActive ? "#f8faff" : "transparent",
                  borderLeft: isActive ? "4px solid #3f51b5" : "4px solid transparent",
                  transition: "all 0.2s ease",
                  "&:hover": { bgcolor: "#f1f5f9" },
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  {isActive && <Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "#3f51b5" }} />}
                  <Typography fontSize={13} fontWeight={isActive ? 700 : 600} color={isActive ? "#3f51b5" : "#1e293b"}>{label}</Typography>
                </Box>
                <Typography fontSize={16} color="#94a3b8" sx={{
                  transform: openFilters[key] ? "rotate(180deg)" : "rotate(0deg)",
                  transition: "transform 0.2s ease",
                  lineHeight: 1,
                }}>
                  ⌄
                </Typography>
              </Box>
              {openFilters[key] && (
                <Box sx={{ px: 2, pb: 1.5, pt: 0.5 }}>
                  {content}
                </Box>
              )}
            </Box>
          );})}
        </Box>

        {/* Right Content Area */}
        <Box sx={{ flexGrow: 1, display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>

          {/* Content with padding */}
          <Box sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>

          {/* ── Top bar: count + view toggle + action buttons (admin style) ── */}
          <Box sx={{ mb: 1.5, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            {/* Left: count + view toggle */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Typography variant="body2" sx={{ color: '#64748b', fontWeight: 600 }}>
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
              <Box>
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
            <Box sx={{
              bgcolor: "#fff",
              border: "1px solid #e8eaf6",
              borderRadius: "16px",
              overflow: "hidden",
              boxShadow: "0 4px 20px rgba(63,81,181,0.08)",
              height: "calc(100vh - 380px)",
            }}>
              {/* Table header bar */}
              <Box sx={{
                px: 3, py: 1.5,
                background: "linear-gradient(135deg, #e8eaf6, #f3f4fd)",
                borderBottom: "1px solid #c5cae9",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 4, height: 18, bgcolor: "#3f51b5", borderRadius: 2 }} />
                  <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" textTransform="uppercase" letterSpacing="0.06em">
                    All Candidates
                  </Typography>
                </Box>
                <Chip
                  label={`${total} records`}
                  size="small"
                  sx={{ bgcolor: "#e8eaf6", color: "#3f51b5", fontWeight: 700, fontSize: "0.75rem" }}
                />
              </Box>

              <DataGrid
                rows={candidates}
                columns={columns}
                rowCount={total}
                loading={loading}
                paginationMode="server"
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[25, 50, 100]}
                checkboxSelection
                rowSelectionModel={selectedIds}
                onRowSelectionModelChange={(ids) => setSelectedIds(ids)}
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  height: "calc(100% - 52px)",
                  "& .MuiDataGrid-columnHeaders": {
                    background: "linear-gradient(135deg, #e8eaf6, #f3f4fd)",
                    borderBottom: "2px solid #c5cae9",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 700,
                    color: "#3f51b5",
                    fontSize: "0.78rem",
                    textTransform: "uppercase",
                    letterSpacing: "0.04em",
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #f0f2ff",
                    fontSize: "0.83rem",
                    color: "#334155",
                    "&:focus": { outline: "none" },
                  },
                  "& .MuiDataGrid-row:hover": { bgcolor: "#f5f6ff" },
                  "& .MuiDataGrid-row.Mui-selected": {
                    bgcolor: "#e8eaf6",
                    "&:hover": { bgcolor: "#dce1f5" },
                  },
                  "& .MuiDataGrid-footerContainer": {
                    borderTop: "1px solid #e8eaf6",
                    bgcolor: "#f5f6ff",
                  },
                  "& .MuiCheckbox-root.Mui-checked": {
                    color: "#3f51b5",
                  },
                  "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": { height: 7, width: 7 },
                  "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
                    background: "#9fa8da", borderRadius: 4,
                  },
                }}
              />
            </Box>
          )}
        </Box>
      </Box>
        </Box>  {/* end filter+content row */}
      </Box>    {/* end main content area */}

      {/* ── Assign Dialog ── */}
      <Dialog 
        open={assignOpen} 
        onClose={() => setAssignOpen(false)} 
        maxWidth="sm" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          } 
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            color: "#fff", 
            fontWeight: 800,
            fontSize: '1.5rem',
            p: 3,
          }}
        >
          Assign {selectedIds.length} Candidate(s) to Job
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          <Typography variant="body2" color="text.secondary" mb={2} sx={{ fontSize: '0.95rem' }}>
            Select a job position to assign the selected candidates.
          </Typography>
          {jobsLoading ? (
            <Box display="flex" justifyContent="center" py={3}>
              <CircularProgress sx={{ color: '#3f51b5' }} />
            </Box>
          ) : (
            <Autocomplete
              options={jobs}
              value={selectedJob}
              onChange={(_, val) => setSelectedJob(val)}
              getOptionLabel={(o) => `${o.jobTitle || "—"} — ${o.companyName || "—"}`}
              renderInput={(params) => (
                <TextField 
                  {...params} 
                  label="Select Job Position" 
                  variant="outlined" 
                  fullWidth 
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '12px',
                      '&:hover fieldset': { borderColor: '#3f51b5' },
                      '&.Mui-focused fieldset': { borderColor: '#3f51b5' },
                    },
                  }}
                />
              )}
              noOptionsText="No jobs found"
            />
          )}
          {selectedJob && (
            <Box 
              mt={2} 
              p={2.5} 
              sx={{ 
                background: 'linear-gradient(135deg, rgba(63,81,181,0.1) 0%, rgba(92,107,192,0.1) 100%)',
                borderRadius: '12px',
                border: '2px solid rgba(63,81,181,0.3)',
              }}
            >
              <Typography variant="body1" fontWeight={700} color="#3f51b5" sx={{ mb: 0.5 }}>
                {selectedJob.jobTitle}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 0.5 }}>
                {selectedJob.companyName}
              </Typography>
              {selectedJob.jobLocation && (
                <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <LocationIcon sx={{ fontSize: 16 }} /> {selectedJob.jobLocation}
                </Typography>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1.5 }}>
          <Button 
            onClick={() => setAssignOpen(false)} 
            variant="outlined" 
            sx={{ 
              borderRadius: '12px',
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderColor: '#3f51b5',
              color: '#3f51b5',
              '&:hover': {
                borderColor: '#5c6bc0',
                background: 'rgba(63,81,181,0.05)',
              },
            }}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleAssign} 
            variant="contained" 
            disabled={!selectedJob || assigning}
            startIcon={assigning ? <CircularProgress size={16} color="inherit" /> : <AssignIcon />}
            sx={{ 
              borderRadius: '12px',
              textTransform: "none",
              fontWeight: 700,
              px: 3,
              background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5c6bc0 0%, #7986cb 100%)',
              },
            }}
          >
            {assigning ? "Assigning..." : "Assign"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Assignment Success Dialog ── */}
      <Dialog
        open={assignSuccessDialogOpen}
        onClose={() => setAssignSuccessDialogOpen(false)}
        maxWidth="xs"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: '20px',
            boxShadow: '0 8px 40px rgba(16,185,129,0.2)',
            overflow: 'hidden',
          }
        }}
      >
        {/* Green success header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
          px: 3, py: 3,
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1.5,
        }}>
          {/* Checkmark circle */}
          <Box sx={{
            width: 64, height: 64, borderRadius: '50%',
            bgcolor: 'rgba(255,255,255,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography fontSize={32}>✅</Typography>
          </Box>
          <Typography variant="h6" fontWeight={800} color="#fff" textAlign="center">
            Assignment Successful!
          </Typography>
          <Typography fontSize={13} color="rgba(255,255,255,0.85)" textAlign="center">
            {assignedCandidatesData?.assigned} candidate{assignedCandidatesData?.assigned !== 1 ? 's' : ''} assigned
            {assignedCandidatesData?.alreadyAssigned > 0 && `, ${assignedCandidatesData.alreadyAssigned} already assigned`}
          </Typography>
        </Box>

        {/* Job info */}
        {assignedJobData && (
          <Box sx={{ px: 3, py: 2.5, bgcolor: '#f0fdf4', borderBottom: '1px solid #d1fae5' }}>
            <Typography fontSize={12} color="#6b7280" fontWeight={600} mb={0.4}>Assigned to</Typography>
            <Typography fontSize={15} fontWeight={700} color="#1e293b">{assignedJobData.jobTitle}</Typography>
            <Typography fontSize={13} color="#475569">{assignedJobData.companyName}</Typography>
          </Box>
        )}

        {/* Action buttons */}
        <Box sx={{ px: 3, py: 2.5, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          <Button
            variant="contained"
            fullWidth
            onClick={() => {
              setAssignSuccessDialogOpen(false);
              navigate('/candidate-list', { state: { openJobId: assignedJobData?._id, openAddCandidateDialog: true } });
            }}
            sx={{
              background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)',
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 700,
              fontSize: 14,
              py: 1.2,
              '&:hover': { background: 'linear-gradient(135deg, #303f9f 0%, #3f51b5 100%)' },
            }}
          >
            Go To Interview Scheduled  →
          </Button>
          <Button
            variant="outlined"
            fullWidth
            onClick={() => setAssignSuccessDialogOpen(false)}
            sx={{
              borderRadius: '10px',
              textTransform: 'none',
              fontWeight: 600,
              fontSize: 14,
              py: 1.2,
              borderColor: '#d1d5db',
              color: '#6b7280',
              '&:hover': { bgcolor: '#f9fafb', borderColor: '#9ca3af' },
            }}
          >
            Stay Here
          </Button>
        </Box>
      </Dialog>

      {/* ── History Dialog ── */}
      <Dialog 
        open={historyOpen} 
        onClose={() => setHistoryOpen(false)} 
        maxWidth="md" 
        fullWidth
        PaperProps={{ 
          sx: { 
            borderRadius: '20px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
          } 
        }}
      >
        <DialogTitle 
          sx={{ 
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            color: "#fff", 
            fontWeight: 800,
            fontSize: '1.5rem',
            p: 3,
          }}
        >
          Job Application History
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 2 }}>
          {historyLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress sx={{ color: '#3f51b5' }} />
            </Box>
          ) : historyData ? (
            <Box>
              {/* Candidate summary */}
              <Box 
                display="flex" 
                alignItems="center" 
                gap={2} 
                mb={3} 
                p={2.5}
                sx={{ 
                  background: 'linear-gradient(135deg, rgba(63,81,181,0.1) 0%, rgba(92,107,192,0.1) 100%)',
                  borderRadius: '16px',
                  border: '2px solid rgba(63,81,181,0.3)',
                }}
              >
                <Avatar 
                  sx={{ 
                    background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
                    width: 56, 
                    height: 56, 
                    fontWeight: 700,
                    fontSize: '1.5rem',
                  }}
                >
                  {historyData.candidate?.name?.charAt(0)?.toUpperCase() || "C"}
                </Avatar>
                <Box sx={{ flexGrow: 1 }}>
                  <Typography fontWeight={700} fontSize="1.1rem">{historyData.candidate?.name || "—"}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {historyData.candidate?.phoneNumber} · {historyData.candidate?.positionName}
                  </Typography>
                </Box>
                <Chip 
                  label={`${historyData.totalApplications} application(s)`}
                  sx={{ 
                    background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
                    color: '#fff',
                    fontWeight: 700,
                  }}
                />
              </Box>

              {/* Applications list */}
              {historyData.applications.length === 0 ? (
                <Box 
                  sx={{ 
                    textAlign: 'center', 
                    py: 6,
                    background: 'rgba(63,81,181,0.05)',
                    borderRadius: '12px',
                  }}
                >
                  <Typography color="text.secondary" fontSize="1rem">
                    No job assignments yet.
                  </Typography>
                </Box>
              ) : (
                historyData.applications.map((app) => (
                  <Box 
                    key={app._id} 
                    mb={2} 
                    p={2.5}
                    sx={{ 
                      border: "2px solid rgba(63,81,181,0.2)",
                      borderRadius: '16px',
                      background: 'rgba(255,255,255,0.8)',
                      transition: 'all 0.3s ease',
                      '&:hover': {
                        borderColor: 'rgba(63,81,181,0.4)',
                        boxShadow: '0 4px 12px rgba(63,81,181,0.15)',
                      },
                    }}
                  >
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1.5}>
                      <Box>
                        <Typography fontWeight={700} color="#3f51b5" fontSize="1.05rem">
                          {app.jobId?.jobTitle || "—"}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.jobId?.companyName} · {app.jobId?.jobLocation}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1} flexWrap="wrap" justifyContent="flex-end">
                        {app.lineupStatus && (
                          <Chip label={app.lineupStatus} size="small" color="info" />
                        )}
                        {app.selectionStatus && (
                          <Chip label={app.selectionStatus} size="small" color="success" />
                        )}
                        {app.isBackout && (
                          <Chip label="Backout" size="small" color="error" />
                        )}
                      </Box>
                    </Box>
                    <Box display="flex" flexWrap="wrap" gap={2} mb={1}>
                      {app.interviewDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          📅 Interview: {new Date(app.interviewDate).toLocaleDateString("en-IN")}
                        </Typography>
                      )}
                      {app.joiningDate && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          🏢 Joining: {new Date(app.joiningDate).toLocaleDateString("en-IN")}
                        </Typography>
                      )}
                      {app.salaryOffered && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          💰 Salary: {app.salaryOffered}
                        </Typography>
                      )}
                      {app.billingAmount && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          🧾 Billing: ₹{app.billingAmount} ({app.paymentStatus})
                        </Typography>
                      )}
                    </Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Assigned on: {new Date(app.createdAt).toLocaleDateString("en-IN")}
                      {app.createdBy && ` by ${app.createdBy.firstName} ${app.createdBy.lastName}`}
                    </Typography>
                  </Box>
                ))
              )}
            </Box>
          ) : null}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button 
            onClick={() => setHistoryOpen(false)} 
            variant="outlined" 
            sx={{ 
              borderRadius: '12px',
              textTransform: "none",
              fontWeight: 600,
              px: 3,
              borderColor: '#3f51b5',
              color: '#3f51b5',
              '&:hover': {
                borderColor: '#5c6bc0',
                background: 'rgba(63,81,181,0.05)',
              },
            }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── View Detail Dialog ── */}
      <Dialog 
        open={openDialog} 
        onClose={() => { setOpenDialog(false); setSelectedCandidate(null); }}
        maxWidth="lg" 
        fullWidth 
        PaperProps={{ 
          sx: { 
            borderRadius: '16px',
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
            maxHeight: '92vh',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
          } 
        }}
      >
        {selectedCandidate && (
          <>
            {/* Single scrollable content — header + tabs + body all scroll together */}
            <DialogContent sx={{ p: 0, bgcolor: '#f8fafc', overflowY: 'auto', flex: 1,
              '&::-webkit-scrollbar': { width: 6 },
              '&::-webkit-scrollbar-track': { background: '#f1f5f9' },
              '&::-webkit-scrollbar-thumb': { background: '#c7d2fe', borderRadius: 3 },
            }}>

            {/* Header with Avatar + Name */}
            <Box sx={{ display: 'flex', p: 3, borderBottom: '1px solid #e8eaf6', bgcolor: '#fff' }}>
              <Avatar 
                sx={{ 
                  width: 80, height: 80, 
                  bgcolor: '#e8eaf6', color: '#3f51b5',
                  fontWeight: 700, fontSize: '2rem',
                  mr: 2.5,
                }}
              >
                {selectedCandidate.name?.charAt(0)?.toUpperCase() || "C"}
              </Avatar>
              <Box sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 0.5 }}>
                  <Typography variant="h5" fontWeight={700} color="#1e293b">
                    {selectedCandidate.name || "—"}
                  </Typography>
                  <IconButton size="small" sx={{ color: '#3f51b5' }}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z"/>
                    </svg>
                  </IconButton>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 2.5, mb: 1, flexWrap: 'wrap' }}>
                  {selectedCandidate.experience && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <AccessTime sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography fontSize={14} color="#475569">{selectedCandidate.experience}</Typography>
                    </Box>
                  )}
                  {selectedCandidate.currentCTC && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <CurrencyRupeeIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography fontSize={14} color="#475569">₹{selectedCandidate.currentCTC}</Typography>
                    </Box>
                  )}
                  {selectedCandidate.currentLocation && (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <LocationIcon sx={{ fontSize: 16, color: '#64748b' }} />
                      <Typography fontSize={14} color="#475569">{selectedCandidate.currentLocation}</Typography>
                    </Box>
                  )}
                </Box>
                <Box sx={{ mb: 1.5 }}>
                  <Typography fontSize={13} color="#94a3b8" mb={0.3}>Current</Typography>
                  <Typography fontSize={14} fontWeight={600} color="#1e293b">
                    {selectedCandidate.currentPosition || "—"} 
                    {selectedCandidate.currentCompany && ` at ${selectedCandidate.currentCompany}`}
                  </Typography>
                </Box>
                {selectedCandidate.positionName && (
                  <Box sx={{ mb: 1.5 }}>
                    <Typography fontSize={13} color="#94a3b8" mb={0.3}>Highest degree</Typography>
                    <Typography fontSize={14} fontWeight={600} color="#1e293b">{selectedCandidate.positionName}</Typography>
                  </Box>
                )}
                <Box sx={{ display: 'flex', gap: 1.5, mt: 2 }}>
                  <Button variant="outlined" size="small" onClick={(e) => openPhonePopover(e, selectedCandidate)}
                    sx={{ textTransform: 'none', borderRadius: '6px', fontSize: 13, borderColor: '#3f51b5', color: '#3f51b5' }}>
                    View phone number
                  </Button>
                  <Button variant="outlined" size="small" component="a" href={`tel:${selectedCandidate.phoneNumber}`}
                    startIcon={<PhoneIcon sx={{ fontSize: 14 }} />}
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
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: 0, py: 1.5,
                  color: profileTab === 'profile' ? '#3f51b5' : '#64748b',
                  borderBottom: profileTab === 'profile' ? '2px solid #3f51b5' : '2px solid transparent',
                }}>
                Profile detail
              </Button>
              <Button onClick={() => setProfileTab('cv')}
                sx={{ textTransform: 'none', fontWeight: 600, fontSize: 14, borderRadius: 0, py: 1.5, ml: 3,
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
                    {selectedCandidate.experience && `with ${selectedCandidate.experience} experience `}
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
                  { label: 'Expected CTC', value: selectedCandidate.expectedCTC ? `₹${selectedCandidate.expectedCTC}` : null },
                  { label: 'Notice Period', value: selectedCandidate.noticePeriod ? `${selectedCandidate.noticePeriod} ` : null },
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
                        <Typography fontSize={14} color="#64748b">No CV uploaded. A CV has been generated from candidate data.</Typography>
                        <Button variant="contained" size="small" startIcon={<ResumeIcon />}
                          onClick={() => handleDownloadCV(selectedCandidate)}
                          sx={{ textTransform: 'none', borderRadius: '8px', fontSize: 13, fontWeight: 600, bgcolor: '#3f51b5', flexShrink: 0 }}>
                          Download Generated CV
                        </Button>
                      </Box>

                      {/* CV Preview — matches the Apna-style format */}
                      <Box sx={{ bgcolor: '#fff', border: '1px solid #e0e0e0', borderRadius: '8px', overflow: 'hidden', fontFamily: 'Arial, sans-serif' }}>
                        {/* Name header */}
                        <Box sx={{ bgcolor: '#3b82f6', px: 3, py: 2 }}>
                          <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: 28, letterSpacing: 2, textTransform: 'uppercase' }}>
                            {selectedCandidate.name || 'CANDIDATE'}
                          </Typography>
                        </Box>

                        {/* Sub-header */}
                        <Box sx={{ px: 3, py: 1.5, borderBottom: '1px solid #e0e0e0' }}>
                          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
                            {selectedCandidate.gender && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PersonIcon sx={{ fontSize: 14, color: '#3b82f6' }} /><Typography fontSize={13} color="#475569">{selectedCandidate.gender}</Typography></Box>}
                            {selectedCandidate.currentLocation && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LocationIcon sx={{ fontSize: 14, color: '#3b82f6' }} /><Typography fontSize={13} color="#475569">{selectedCandidate.currentLocation}</Typography></Box>}
                            {selectedCandidate.phoneNumber && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PhoneIcon sx={{ fontSize: 14, color: '#3b82f6' }} /><Typography fontSize={13} color="#475569">{selectedCandidate.phoneNumber}</Typography></Box>}
                            {selectedCandidate.email && <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><ResumeIcon sx={{ fontSize: 14, color: '#3b82f6' }} /><Typography fontSize={13} color="#475569">{selectedCandidate.email}</Typography></Box>}
                          </Box>
                        </Box>

                        <Box sx={{ px: 3, py: 2 }}>
                          {/* Career Objective */}
                          <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: '#1e293b', mb: 0.8, textTransform: 'uppercase' }}>Career Objective</Typography>
                          <Typography fontSize={13} color="#475569" lineHeight={1.7} mb={2.5}>
                            {selectedCandidate.remark || selectedCandidate.reasonforLeaving ||
                              'I aim to be associated with an organization that gives me the scope to apply my skills and actively work towards the growth of the organization and myself.'}
                          </Typography>

                          {/* Education */}
                          <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: '#1e293b', mb: 0.8, textTransform: 'uppercase' }}>Education</Typography>
                          <Typography fontSize={13} color="#64748b" mb={0.4}>Education level: {selectedCandidate.qualification || 'Graduate'}</Typography>
                          {selectedCandidate.qualification && (
                            <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1, mb: 2.5 }}>
                              <Box sx={{ width: 28, height: 28, bgcolor: '#3b82f6', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, mt: 0.3 }}>
                                <Typography fontSize={11} color="#fff" fontWeight={700}>🎓</Typography>
                              </Box>
                              <Box>
                                <Typography fontSize={13} fontWeight={700} color="#1e293b">{selectedCandidate.qualification}</Typography>
                              </Box>
                            </Box>
                          )}

                          {/* Work Experience */}
                          {(selectedCandidate.currentPosition || selectedCandidate.currentCompany) && (<>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: '#1e293b', mb: 0.8, textTransform: 'uppercase' }}>Work Experience</Typography>
                            <Box sx={{ mb: 2.5 }}>
                              {selectedCandidate.currentPosition && <Typography fontSize={13} color="#475569">Position: <strong>{selectedCandidate.currentPosition}</strong></Typography>}
                              {selectedCandidate.currentCompany && <Typography fontSize={13} color="#475569">Company: <strong>{selectedCandidate.currentCompany}</strong></Typography>}
                              {selectedCandidate.experience && <Typography fontSize={13} color="#475569">Experience: <strong>{selectedCandidate.experience}</strong></Typography>}
                              {selectedCandidate.currentCTC && <Typography fontSize={13} color="#475569">Current CTC: <strong>₹{selectedCandidate.currentCTC}</strong></Typography>}
                              {selectedCandidate.expectedCTC && <Typography fontSize={13} color="#475569">Expected CTC: <strong>₹{selectedCandidate.expectedCTC}</strong></Typography>}
                              {selectedCandidate.noticePeriod && <Typography fontSize={13} color="#475569">Notice Period: <strong>{selectedCandidate.noticePeriod} </strong></Typography>}
                            </Box>
                          </>)}

                          {/* Skills */}
                          {(selectedCandidate.positionName || selectedCandidate.currentPosition) && (<>
                            <Typography sx={{ fontSize: 13, fontWeight: 700, letterSpacing: 1.5, color: '#1e293b', mb: 1, textTransform: 'uppercase' }}>Skills</Typography>
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 2.5 }}>
                              {[selectedCandidate.positionName, selectedCandidate.currentPosition].filter(Boolean).map((s, i) => (
                                <Box key={i} sx={{ bgcolor: '#3b82f6', color: '#fff', px: 1.5, py: 0.4, borderRadius: '6px', fontSize: 12, fontWeight: 600 }}>{s}</Box>
                              ))}
                            </Box>
                          </>)}
                        </Box>

                        {/* Footer */}
                        <Box sx={{ bgcolor: '#f1f5f9', px: 3, py: 1, borderTop: '1px solid #e0e0e0' }}>
                          <Typography fontSize={11} color="#94a3b8" fontStyle="italic">
                            This CV is generated by iTalentConnect from candidate's profile
                          </Typography>
                        </Box>
                      </Box>
                    </Box>
                  )}
                </Box>
              )}
            </Box>       {/* end tab content */}
            </DialogContent>  {/* end single scroll */}

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
        <DialogTitle
          sx={{
            background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#fff',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            p: 2,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
              sx={{
                width: 40,
                height: 40,
                borderRadius: '10px',
                bgcolor: 'rgba(255,255,255,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <PersonAddIcon sx={{ fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 800 }}>
                Add New Candidate
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                Fill in the candidate details below
              </Typography>
            </Box>
          </Box>
          <IconButton
            onClick={() => setAddCandidateDialogOpen(false)}
            sx={{ color: '#fff' }}
          >
            <ClearAllIcon />
          </IconButton>
        </DialogTitle>

        <DialogContent sx={{ p: 0, bgcolor: '#f8fafc', overflow: 'auto' }}>
          <Box sx={{ p: 2 }}>
            <CandidatesForm 
              userId={sessionStorage.getItem('userId')}
              onSuccess={() => {
                setAddCandidateDialogOpen(false);
                fetchCandidates();
              }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e7ff', bgcolor: '#f8fafc' }}>
          <Button
            onClick={() => setAddCandidateDialogOpen(false)}
            variant="outlined"
            sx={{
              borderRadius: '8px',
              borderColor: '#9fa8da',
              color: '#3f51b5',
              fontWeight: 600,
              textTransform: 'none',
            }}
          >
            Cancel
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Send Email Dialog ── */}
      <Dialog
        open={emailDialogOpen}
        onClose={() => setEmailDialogOpen(false)}
        fullWidth
        maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
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
                  <rect x="9" y="9" width="13" height="13" rx="2"/><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"/>
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
            <Box sx={{ width: 38, height: 38, borderRadius: '50%', bgcolor: 'rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="#fff">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
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
                  {waJob.companyName  && <Typography fontSize={12.5} color="#1e293b"><strong>Company:</strong> {waJob.companyName}</Typography>}
                  {waJob.jobLocation  && <Typography fontSize={12.5} color="#1e293b"><strong>Location:</strong> {waJob.jobLocation}</Typography>}
                  {waJob.salary       && <Typography fontSize={12.5} color="#1e293b"><strong>Salary:</strong> {waJob.salary}</Typography>}
                  {waJob.experience   && <Typography fontSize={12.5} color="#1e293b"><strong>Experience:</strong> {waJob.experience}</Typography>}
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
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z"/>
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

export default AllCandidateData;
