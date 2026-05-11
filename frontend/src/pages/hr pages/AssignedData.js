import React, { useEffect, useState, useRef } from "react";
import Navbar from "../../components/hr components/HrNavbar";
import Sidebar from "../../components/hr components/HrSidebar";
import {
  Box,
  Typography,
  Chip,
  Tooltip,
  CircularProgress,
  IconButton,
  Drawer,
  Button,
  Dialog,
  DialogContent,
  TextField,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import dayjs from "dayjs";
import { SOCKET_URL, API_BASE_URL } from "../../config/api.config";
import { useNavigate } from "react-router-dom";
import api, { isTokenExpired, refreshToken } from "../../utils/api";
import { io } from "socket.io-client";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import axios from "axios";

// ── Icons ──────────────────────────────────────────────────────────────────────
import WorkOutlineIcon       from "@mui/icons-material/WorkOutline";
import BusinessIcon          from "@mui/icons-material/Business";
import LocationOnIcon        from "@mui/icons-material/LocationOn";
import RefreshIcon           from "@mui/icons-material/Refresh";
import FiberManualRecordIcon from "@mui/icons-material/FiberManualRecord";
import CloseIcon             from "@mui/icons-material/Close";
import FactoryIcon           from "@mui/icons-material/Factory";
import LocationCityIcon      from "@mui/icons-material/LocationCity";
import PinDropIcon           from "@mui/icons-material/PinDrop";
import PersonIcon            from "@mui/icons-material/Person";
import PhoneIcon             from "@mui/icons-material/Phone";
import EmailIcon             from "@mui/icons-material/Email";
import LanguageIcon          from "@mui/icons-material/Language";
import MapIcon               from "@mui/icons-material/Map";
import CurrencyRupeeIcon     from "@mui/icons-material/CurrencyRupee";
import DescriptionIcon       from "@mui/icons-material/Description";
import OpenInNewIcon         from "@mui/icons-material/OpenInNew";
import PeopleAltIcon         from "@mui/icons-material/PeopleAlt";
import SearchIcon            from "@mui/icons-material/Search";

const HrDashboard = () => {
  const [jobOpenings, setJobOpenings]   = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [socket, setSocket]             = useState(null);
  const [isConnected, setIsConnected]   = useState(false);
  const [reminderList, setReminderList] = useState([]);
  const [detailPanel, setDetailPanel]   = useState({ open: false, row: null, view: "company" });
  const [matchedCandidates, setMatchedCandidates] = useState([]);
  const [openCandidateDialog, setOpenCandidateDialog] = useState(false);
  const [candidateFilter, setCandidateFilter] = useState("");
  const [findLoading, setFindLoading] = useState(false);
  const [selectedJobTitle, setSelectedJobTitle] = useState("");
  const navigate = useNavigate();
  const shownRemindersRef = useRef(new Set());

  // ── Matching Candidates filter states ─────────────────────────────────────────
  const [mcFilterName, setMcFilterName] = useState("");
  const [mcFilterExperience, setMcFilterExperience] = useState("");
  const [mcFilterLocation, setMcFilterLocation] = useState("");
  const [mcFilterPosition, setMcFilterPosition] = useState("");
  const [mcFilterExpectedCTC, setMcFilterExpectedCTC] = useState("");
  const [mcFilterNoticePeriod, setMcFilterNoticePeriod] = useState("");
  const [mcFilterCurrentCompany, setMcFilterCurrentCompany] = useState("");

  // ── Socket setup ─────────────────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem("token");
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 3,
      reconnectionDelay: 2000,
      timeout: 10000,
      withCredentials: true,
      auth: { token },
    });

    socketInstance.on("connect",    () => setIsConnected(true));
    socketInstance.on("disconnect", () => setIsConnected(false));

    socketInstance.on("reminder", (data) => {
      const key = `assigned-${data._id}`;
      if (shownRemindersRef.current.has(key)) return;
      shownRemindersRef.current.add(key);
      toast.info(
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          📌 <strong>Assigned Task: {data.taskName}</strong>
          <div style={{ fontSize: 12, color: "#666" }}>📅 Due: {new Date(data.endDate).toLocaleString()}</div>
        </div>,
        { position: "bottom-right", autoClose: 6000, style: { background: "#f3e5f5", borderLeft: "5px solid #8e24aa", borderRadius: 8 }, icon: false }
      );
      setReminderList(prev => [...prev, { _id: key, type: "assigned", taskName: data.taskName, endDate: data.endDate }]);
      setTimeout(() => { shownRemindersRef.current.delete(key); setReminderList(prev => prev.filter(r => r._id !== key)); }, 60000);
    });

    socketInstance.on("task-reminder", (data) => {
      const key = `task-${data.taskId}`;
      if (shownRemindersRef.current.has(key)) return;
      shownRemindersRef.current.add(key);
      toast.info(
        <div style={{ fontSize: 14, fontWeight: 500 }}>
          🔔 <strong>{data.taskName}</strong>
          <div style={{ fontSize: 12, color: "#666" }}>📅 Due: {new Date(data.endDate).toLocaleString()}</div>
        </div>,
        { position: "bottom-right", autoClose: 6000, style: { background: "#fff8e1", borderLeft: "5px solid #f57c00", borderRadius: 8 }, icon: false }
      );
      setReminderList(prev => [...prev, { _id: key, type: "task", taskName: data.taskName, endDate: data.endDate }]);
      setTimeout(() => { shownRemindersRef.current.delete(key); setReminderList(prev => prev.filter(r => r._id !== key)); }, 60000);
    });

    socketInstance.on("candidate-reminders", (data = []) => {
      const finalList = [];
      data.forEach(reminder => {
        const key = `reminder-${reminder._id}`;
        if (shownRemindersRef.current.has(key)) return;
        shownRemindersRef.current.add(key);
        const isCandidate = !!reminder.candidateId;
        toast.info(
          <div style={{ fontSize: 14, fontWeight: 500 }}>
            <strong>{isCandidate ? "👤 Candidate Reminder" : "📌 Reminder"}</strong><br />
            {reminder.message}
            <div style={{ fontSize: 12, color: "#666" }}>📅 Due: {new Date(reminder.remindAt).toLocaleString()}</div>
          </div>,
          { position: "bottom-right", autoClose: 6000, style: { background: isCandidate ? "#e8f5e9" : "#e3f2fd", borderLeft: isCandidate ? "5px solid #388e3c" : "5px solid #1976d2", borderRadius: 8 }, icon: false }
        );
        setTimeout(() => shownRemindersRef.current.delete(key), 60000);
        finalList.push(reminder);
      });
      setReminderList(finalList);
    });

    setSocket(socketInstance);
    return () => {
      socketInstance.disconnect();
      socketInstance.off("reminder");
      socketInstance.off("task-reminder");
      socketInstance.off("candidate-reminders");
    };
  }, []);

  // ── Token expiry check ────────────────────────────────────────────────────────
  useEffect(() => {
    const check = () => {
      if (isTokenExpired()) {
        ["token", "role", "userId", "tokenExpiration"].forEach(k => sessionStorage.removeItem(k));
        navigate("/login");
      }
    };
    check();
    const interval = setInterval(check, 28800000);
    const timeout  = setTimeout(() => {
      ["token", "role", "userId", "tokenExpiration"].forEach(k => sessionStorage.removeItem(k));
      alert("Session expired after 8 hours. Please login again.");
      navigate("/login");
    }, 8 * 60 * 60 * 1000);
    return () => { clearInterval(interval); clearTimeout(timeout); };
  }, [navigate]);

  // ── Fetch job openings ────────────────────────────────────────────────────────
  const fetchJobOpenings = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/assignhr");
      if (response.data.success) setJobOpenings(response.data.data);
    } catch (err) {
      if (err.response?.status === 401) {
        try {
          await refreshToken();
          const retry = await api.get("/assignhr");
          if (retry.data.success) setJobOpenings(retry.data.data);
        } catch {
          setError("Session expired. Please login again.");
          navigate("/login");
        }
      } else {
        setError("Failed to load job openings.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobOpenings();
    const interval = setInterval(fetchJobOpenings, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [navigate]);

  // ── Find matching candidates ──────────────────────────────────────────────────
  const handleFindCandidates = async (jobId, jobTitle) => {
    setFindLoading(true);
    setMatchedCandidates([]);
    setSelectedJobTitle(jobTitle || "");
    setOpenCandidateDialog(true);
    setCandidateFilter("");
    // Reset MC filters on fresh open
    setMcFilterName("");
    setMcFilterExperience("");
    setMcFilterLocation("");
    setMcFilterPosition("");
    setMcFilterExpectedCTC("");
    setMcFilterNoticePeriod("");
    setMcFilterCurrentCompany("");
    try {
      const res = await axios.get(`${API_BASE_URL}/matching/jobs/${jobId}/matching-candidates`);
      setMatchedCandidates(res.data.candidates || []);
    } catch (err) {
      console.error("Error fetching matching candidates:", err);
      toast.error("Failed to fetch matching candidates");
    } finally {
      setFindLoading(false);
    }
  };

  // ── Tooltip cell renderer ─────────────────────────────────────────────────────
  const tooltipCell = (params) => (
    <Tooltip title={params.value || ""} arrow placement="top">
      <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "100%" }}>
        {params.value || "—"}
      </span>
    </Tooltip>
  );

  // ── Columns — only job/position fields; company details live in the drawer ──
  const columns = [
    // ── 0. Find button ─────────────────────────────────────────────────────
    {
      field: "find",
      headerName: "Find",
      width: 90,
      sortable: false,
      renderCell: (params) => (
        <Button
          size="small"
          variant="contained"
          color="success"
          onClick={(e) => {
            e.stopPropagation();
            handleFindCandidates(params.row._id, params.row.jobTitle);
          }}
          sx={{
            borderRadius: "8px",
            textTransform: "none",
            fontWeight: 700,
            fontSize: "0.75rem",
            px: 1.5,
            py: 0.4,
            bgcolor: "#10b981",
            "&:hover": { bgcolor: "#059669" },
          }}
        >
          Find
        </Button>
      ),
    },

    // ── 1. Company / Branch — clickable, opens drawer ──────────────────────
    {
      field: "companyName",
      headerName: "Company / Branch",
      width: 240,
      renderCell: (params) => {
        const row = params.row;
        const hasBranch = !!row.branchName;
        return (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.8, width: "100%", overflow: "hidden" }}>
            <Tooltip title="Click to view company details" arrow>
              <span
                onClick={(e) => { e.stopPropagation(); setDetailPanel({ open: true, row, view: "company" }); }}
                style={{
                  color: "#3f51b5", fontWeight: 600, fontSize: "0.82rem",
                  cursor: "pointer", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis",
                  textDecoration: "underline", textDecorationStyle: "dotted",
                }}
              >
                {row.companyName || "—"}
              </span>
            </Tooltip>
            {hasBranch && (
              <Tooltip title="Click to view branch details" arrow>
                <Chip
                  label={row.branchName}
                  size="small"
                  onClick={(e) => { e.stopPropagation(); setDetailPanel({ open: true, row, view: "branch" }); }}
                  sx={{
                    bgcolor: "#e8f5e9", color: "#2e7d32", fontWeight: 700,
                    fontSize: "0.68rem", height: 20, cursor: "pointer", flexShrink: 0,
                    "&:hover": { bgcolor: "#c8e6c9" },
                  }}
                />
              </Tooltip>
            )}
          </Box>
        );
      },
    },

    // ── 2. Position / Job details ───────────────────────────────────────────
    { field: "jobTitle",      headerName: "Job Title",           width: 180, renderCell: tooltipCell },
    {
      field: "numberOfRequirements",
      headerName: "No. of Requirements",
      width: 170,
      renderCell: (params) => (
        <Chip
          label={params.value ?? "—"}
          size="small"
          sx={{ bgcolor: "#e8eaf6", color: "#3f51b5", fontWeight: 700, fontSize: "0.78rem" }}
        />
      ),
    },
    { field: "jobLocation",   headerName: "Job Location",        width: 150, renderCell: tooltipCell },
    { field: "salary",        headerName: "Salary",              width: 150, renderCell: tooltipCell },
    { field: "experience",    headerName: "Experience",          width: 140, renderCell: tooltipCell },
    { field: "education",     headerName: "Education",           width: 150, renderCell: tooltipCell },
    { field: "jobTiming",     headerName: "Job Timing",          width: 150, renderCell: tooltipCell },
    { field: "gender",        headerName: "Gender",              width: 110, renderCell: tooltipCell },
    { field: "requiredSkills",    headerName: "Required Skills",    width: 200, renderCell: tooltipCell },
    { field: "keyResponsibility", headerName: "Key Responsibility", width: 200, renderCell: tooltipCell },
    { field: "benefits",      headerName: "Benefits",            width: 160, renderCell: tooltipCell },
    { field: "response",      headerName: "Response",            width: 140, renderCell: tooltipCell },
    { field: "weekOff",       headerName: "Week Off",            width: 120, renderCell: tooltipCell },
    { field: "remarks",       headerName: "Remarks",             width: 160, renderCell: tooltipCell },
    {
      field: "jobStatus",
      headerName: "Status",
      width: 110,
      renderCell: (params) => (
        <Chip
          label={params.value || "Open"}
          size="small"
          sx={{
            bgcolor: params.value === "Closed" ? "#ffebee" : "#e8f5e9",
            color:   params.value === "Closed" ? "#c62828" : "#2e7d32",
            fontWeight: 700, fontSize: "0.75rem",
          }}
        />
      ),
    },
    {
      field: "descriptionFile",
      headerName: "JD (PDF)",
      width: 110,
      renderCell: (params) => params.value
        ? <a href={params.value} target="_blank" rel="noopener noreferrer"
            style={{ color: "#3f51b5", fontWeight: 600, fontSize: "0.8rem" }}>View PDF</a>
        : <span style={{ color: "#bbb", fontSize: "0.8rem" }}>—</span>,
    },
    {
      field: "createdAt",
      headerName: "Created At",
      width: 175,
      renderCell: (params) => {
        const formatted = params.value ? dayjs(params.value).format("DD/MM/YYYY hh:mm A") : "—";
        return (
          <Tooltip title={formatted} arrow>
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", display: "block", maxWidth: "100%" }}>
              {formatted}
            </span>
          </Tooltip>
        );
      },
    },
    {
      field: "startDate",
      headerName: "Start Date",
      width: 130,
      renderCell: (params) => params.value ? dayjs(params.value).format("DD MMM YYYY") : "—",
    },
    {
      field: "endDate",
      headerName: "End Date",
      width: 130,
      renderCell: (params) => params.value ? dayjs(params.value).format("DD MMM YYYY") : "—",
    },
  ];

  return (
    <div style={{ display: "flex", height: "100vh", backgroundColor: "#f0f2f8", overflow: "hidden" }}>
      <ToastContainer />

      {/* ── Sidebar ── */}
      <div style={{ position: "fixed", height: "100vh", width: "250px", backgroundColor: "#3f51b5", zIndex: 1000 }}>
        <Sidebar />
      </div>

      {/* ── Main ── */}
      <Box sx={{ flexGrow: 1, ml: "250px", display: "flex", flexDirection: "column", height: "100vh", overflow: "hidden" }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflow: "auto", p: 3 }}>

          {/* ── Header Card ── */}
          <Box sx={{
            background: "linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)",
            borderRadius: "16px",
            p: 3,
            mb: 3,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            boxShadow: "0 8px 32px rgba(63,81,181,0.25)",
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{
                width: 52, height: 52, borderRadius: "14px",
                bgcolor: "rgba(255,255,255,0.18)",
                display: "flex", alignItems: "center", justifyContent: "center",
              }}>
                <WorkOutlineIcon sx={{ color: "#fff", fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.3px">
                  Assigned Data
                </Typography>
                <Typography variant="body2" sx={{ color: "rgba(255,255,255,0.75)", mt: 0.3 }}>
                  Your assigned job openings
                </Typography>
              </Box>
            </Box>

            <Box display="flex" alignItems="center" gap={2}>
              {/* Socket status */}
              <Box display="flex" alignItems="center" gap={0.8}
                sx={{ bgcolor: "rgba(255,255,255,0.15)", borderRadius: "10px", px: 1.5, py: 0.8 }}>
                <FiberManualRecordIcon sx={{ fontSize: 10, color: isConnected ? "#69f0ae" : "#ff5252" }} />
                <Typography variant="caption" sx={{ color: "#fff", fontWeight: 600 }}>
                  {isConnected ? "Live" : "Offline"}
                </Typography>
              </Box>

              {/* Total count */}
              <Box sx={{
                bgcolor: "rgba(255,255,255,0.18)", border: "2px solid rgba(255,255,255,0.4)",
                borderRadius: "12px", px: 2.5, py: 1, textAlign: "center",
              }}>
                <Typography sx={{ fontSize: "1.4rem", fontWeight: 800, color: "#fff", lineHeight: 1 }}>
                  {jobOpenings.length}
                </Typography>
                <Typography sx={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.8)", fontWeight: 600, mt: 0.2 }}>
                  Positions
                </Typography>
              </Box>

              {/* Refresh */}
              <Tooltip title="Refresh">
                <IconButton onClick={fetchJobOpenings} disabled={loading}
                  sx={{ bgcolor: "rgba(255,255,255,0.15)", color: "#fff", "&:hover": { bgcolor: "rgba(255,255,255,0.25)" } }}>
                  {loading
                    ? <CircularProgress size={20} sx={{ color: "#fff" }} />
                    : <RefreshIcon />}
                </IconButton>
              </Tooltip>
            </Box>
          </Box>

          {/* ── Error ── */}
          {error && (
            <Box sx={{ mb: 2, p: 2, bgcolor: "#ffebee", borderRadius: 2, border: "1px solid #ffcdd2" }}>
              <Typography color="error" variant="body2">{error}</Typography>
            </Box>
          )}

          {/* ── Stats row ── */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            {[
              { label: "Total Positions",  value: jobOpenings.length,                                          icon: <WorkOutlineIcon />, color: "#3f51b5", bg: "#e8eaf6" },
              { label: "Companies",        value: new Set(jobOpenings.map(j => j.companyName)).size,           icon: <BusinessIcon />,    color: "#0288d1", bg: "#e1f5fe" },
              { label: "Locations",        value: new Set(jobOpenings.map(j => j.jobLocation).filter(Boolean)).size, icon: <LocationOnIcon />,  color: "#388e3c", bg: "#e8f5e9" },
              { label: "Total Openings",   value: jobOpenings.reduce((s, j) => s + (Number(j.numberOfRequirements) || 0), 0), icon: <WorkOutlineIcon />, color: "#f57c00", bg: "#fff3e0" },
            ].map(({ label, value, icon, color, bg }) => (
              <Box key={label} sx={{
                flex: "1 1 160px", minWidth: 150,
                bgcolor: "#fff", border: "1px solid #e8eaf6", borderRadius: "14px",
                p: 2, display: "flex", alignItems: "center", gap: 1.5,
                boxShadow: "0 2px 12px rgba(63,81,181,0.07)",
              }}>
                <Box sx={{ width: 40, height: 40, borderRadius: "10px", bgcolor: bg, display: "flex", alignItems: "center", justifyContent: "center", color }}>
                  {React.cloneElement(icon, { fontSize: "small" })}
                </Box>
                <Box>
                  <Typography variant="h6" fontWeight={800} color="#1e293b" lineHeight={1}>{value}</Typography>
                  <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
                </Box>
              </Box>
            ))}
          </Box>

          {/* ── DataGrid Card ── */}
          <Box sx={{
            bgcolor: "#fff",
            border: "1px solid #e8eaf6",
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: "0 4px 20px rgba(63,81,181,0.08)",
            height: "calc(100vh - 340px)",
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
                  Assigned Job Openings
                </Typography>
              </Box>
              <Chip
                label={`${jobOpenings.length} records`}
                size="small"
                sx={{ bgcolor: "#e8eaf6", color: "#3f51b5", fontWeight: 700, fontSize: "0.75rem" }}
              />
            </Box>

            <DataGrid
              rows={jobOpenings.map((job) => ({ id: job._id, ...job }))}
              columns={columns}
              loading={loading}
              pageSizeOptions={[10, 25, 50]}
              initialState={{ pagination: { paginationModel: { pageSize: 25 } } }}
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
                "& .MuiDataGrid-footerContainer": {
                  borderTop: "1px solid #e8eaf6",
                  bgcolor: "#f5f6ff",
                },
                "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": { height: 7, width: 7 },
                "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": {
                  background: "#9fa8da", borderRadius: 4,
                },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Company / Branch Detail Drawer ── */}
      <Drawer
        anchor="right"
        open={detailPanel.open}
        onClose={() => setDetailPanel({ open: false, row: null, view: "company" })}
        PaperProps={{
          sx: {
            width: 380,
            borderRadius: "16px 0 0 16px",
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
          },
        }}
      >
        {detailPanel.row && (() => {
          const row = detailPanel.row;
          const isCompany = detailPanel.view === "company";

          // Company view uses root-level fields from the model
          // Branch view uses branchName (only name is stored in job doc; rest falls back to company)
          const title    = isCompany ? row.companyName    : row.branchName;
          const subtitle = isCompany ? `Company ID: ${row.companyId}` : `Branch of ${row.companyName}`;

          // All company-detail fields come from the job document (legacy fields)
          const address    = row.companyAddress;
          const area       = row.Area;
          const city       = row.city;
          const contact    = row.contactName;
          const phone      = row.phoneNumber;
          const email      = row.email;
          const website    = row.websiteURL;
          const gps        = row.gpsLocation;
          const industries = row.industries;
          const gst        = row.gstUpload;
          const agreement  = row.agreementSigned;
          const tokenAmt   = row.tokenAmount;

          const DetailRow = ({ icon, label, value, link }) => {
            if (!value && value !== 0) return null;
            return (
              <Box sx={{ display: "flex", gap: 1.5, py: 1, borderBottom: "1px solid #f0f2ff" }}>
                <Box sx={{ fontSize: "1rem", minWidth: 22, mt: 0.2, color: "#9fa8da", display: "flex", alignItems: "flex-start" }}>
                  {icon}
                </Box>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                  <Typography variant="caption" sx={{ color: "#9fa8da", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                    {label}
                  </Typography>
                  {link ? (
                    <a href={link.startsWith("http") ? link : `https://${link}`} target="_blank" rel="noreferrer"
                      style={{ color: "#3f51b5", fontSize: "0.85rem", fontWeight: 500, wordBreak: "break-all" }}>
                      {value}
                    </a>
                  ) : (
                    <Typography variant="body2" sx={{ color: "#1e293b", fontWeight: 500, wordBreak: "break-word" }}>
                      {value}
                    </Typography>
                  )}
                </Box>
              </Box>
            );
          };

          return (
            <>
              {/* Header */}
              <Box sx={{
                background: isCompany
                  ? "linear-gradient(135deg, #1e1e2f, #2d2d44)"
                  : "linear-gradient(135deg, #1b5e20, #2e7d32)",
                px: 3, py: 2.5,
                display: "flex", alignItems: "flex-start", justifyContent: "space-between",
                flexShrink: 0,
              }}>
                <Box display="flex" alignItems="center" gap={1.5}>
                  <Box sx={{
                    width: 44, height: 44, borderRadius: "12px",
                    bgcolor: "rgba(255,255,255,0.15)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    flexShrink: 0,
                  }}>
                    <BusinessIcon sx={{ color: isCompany ? "#FFD700" : "#a5d6a7", fontSize: 24 }} />
                  </Box>
                  <Box>
                    <Typography variant="subtitle1" fontWeight={800} color="#fff" lineHeight={1.2}
                      sx={{ wordBreak: "break-word" }}>
                      {title || "—"}
                    </Typography>
                    <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.6)" }}>
                      {subtitle}
                    </Typography>
                    {!isCompany && (
                      <Chip label="Branch" size="small"
                        sx={{ mt: 0.5, bgcolor: "rgba(165,214,167,0.25)", color: "#a5d6a7", fontWeight: 700, fontSize: "0.68rem", height: 18 }} />
                    )}
                  </Box>
                </Box>
                <IconButton size="small"
                  onClick={() => setDetailPanel({ open: false, row: null, view: "company" })}
                  sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.1)", "&:hover": { bgcolor: "rgba(255,255,255,0.22)" }, flexShrink: 0 }}>
                  <CloseIcon fontSize="small" />
                </IconButton>
              </Box>

              {/* Toggle tabs — only when job has a branch */}
              {row.branchName && (
                <Box sx={{ display: "flex", borderBottom: "2px solid #e8eaf6", bgcolor: "#f8f9ff" }}>
                  {["company", "branch"].map((v) => (
                    <Box key={v}
                      onClick={() => setDetailPanel((p) => ({ ...p, view: v }))}
                      sx={{
                        flex: 1, py: 1.2, textAlign: "center", cursor: "pointer",
                        fontWeight: 700, fontSize: "0.8rem", textTransform: "uppercase", letterSpacing: "0.06em",
                        color: detailPanel.view === v ? "#3f51b5" : "#9fa8da",
                        borderBottom: detailPanel.view === v ? "2px solid #3f51b5" : "2px solid transparent",
                        mb: "-2px", transition: "all 0.2s",
                        "&:hover": { color: "#3f51b5" },
                      }}>
                      {v === "company" ? "🏢 Company" : "🏪 Branch"}
                    </Box>
                  ))}
                </Box>
              )}

              {/* Body */}
              <Box sx={{ flex: 1, overflowY: "auto", px: 3, py: 2 }}>
                <DetailRow icon={<FactoryIcon sx={{ fontSize: 18 }} />}      label="Industries"   value={industries} />
                <DetailRow icon={<LocationOnIcon sx={{ fontSize: 18 }} />}   label="Address"      value={address} />
                <DetailRow icon={<LocationCityIcon sx={{ fontSize: 18 }} />} label="City"         value={city} />
                <DetailRow icon={<PinDropIcon sx={{ fontSize: 18 }} />}      label="Area"         value={area} />
                <DetailRow icon={<PersonIcon sx={{ fontSize: 18 }} />}       label="Contact"      value={contact} />
                <DetailRow icon={<PhoneIcon sx={{ fontSize: 18 }} />}        label="Phone"        value={phone} />
                <DetailRow icon={<EmailIcon sx={{ fontSize: 18 }} />}        label="Email"        value={email} />
                <DetailRow icon={<LanguageIcon sx={{ fontSize: 18 }} />}     label="Website"      value={website} link={website} />
                {gps && (
                  <Box sx={{ display: "flex", gap: 1.5, py: 1, borderBottom: "1px solid #f0f2ff" }}>
                    <Box sx={{ color: "#9fa8da", display: "flex", alignItems: "flex-start", mt: 0.2 }}>
                      <MapIcon sx={{ fontSize: 18 }} />
                    </Box>
                    <Box>
                      <Typography variant="caption" sx={{ color: "#9fa8da", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.06em", display: "block" }}>
                        GPS Location
                      </Typography>
                      <a href={gps} target="_blank" rel="noreferrer"
                        style={{ color: "#3f51b5", fontSize: "0.85rem", fontWeight: 500, display: "flex", alignItems: "center", gap: 4 }}>
                        Open in Maps <OpenInNewIcon sx={{ fontSize: 14 }} />
                      </a>
                    </Box>
                  </Box>
                )}
                {tokenAmt != null && (
                  <DetailRow icon={<CurrencyRupeeIcon sx={{ fontSize: 18 }} />} label="Token Amount" value={`Rs. ${tokenAmt}`} />
                )}
                {(gst || agreement) && (
                  <Box sx={{ mt: 2 }}>
                    <Typography variant="caption" sx={{ color: "#9fa8da", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", display: "block", mb: 1 }}>
                      Documents
                    </Typography>
                    <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap" }}>
                      {gst && (
                        <Button size="small" variant="outlined" href={gst} target="_blank" rel="noreferrer"
                          startIcon={<DescriptionIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderRadius: "8px", fontSize: "0.75rem", borderColor: "#9fa8da", color: "#3f51b5", textTransform: "none" }}>
                          GST
                        </Button>
                      )}
                      {agreement && (
                        <Button size="small" variant="outlined" href={agreement} target="_blank" rel="noreferrer"
                          startIcon={<DescriptionIcon sx={{ fontSize: 14 }} />}
                          sx={{ borderRadius: "8px", fontSize: "0.75rem", borderColor: "#9fa8da", color: "#388e3c", textTransform: "none" }}>
                          Agreement
                        </Button>
                      )}
                    </Box>
                  </Box>
                )}
              </Box>

              {/* Footer */}
              <Box sx={{ px: 3, py: 2, borderTop: "1px solid #e8eaf6", bgcolor: "#f8f9ff", flexShrink: 0 }}>
                <Button fullWidth variant="outlined"
                  onClick={() => setDetailPanel({ open: false, row: null, view: "company" })}
                  sx={{ borderRadius: "8px", borderColor: "#9fa8da", color: "#3f51b5", fontWeight: 600, textTransform: "none" }}>
                  Close
                </Button>
              </Box>
            </>
          );
        })()}
      </Drawer>

      {/* ── Matching Candidates Dialog ── */}
      <Dialog
        open={openCandidateDialog}
        onClose={() => { setOpenCandidateDialog(false); setMatchedCandidates([]); setCandidateFilter(""); }}
        maxWidth="xl"
        fullWidth
        PaperProps={{
          sx: { borderRadius: "16px", overflow: "hidden" },
        }}
      >
        {/* Header */}
        <Box sx={{ background: "linear-gradient(135deg, #3f51b5, #5c6bc0)", px: 3, py: 2, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <PeopleAltIcon sx={{ color: "#fff", fontSize: 24 }} />
            <Box>
              <Typography variant="h6" fontWeight={700} color="#fff">Matching Candidates</Typography>
              {selectedJobTitle && (
                <Typography variant="caption" sx={{ color: "rgba(255,255,255,0.75)" }}>
                  For: {selectedJobTitle} &nbsp;•&nbsp; {findLoading ? "Searching..." : `${(() => {
                    const nm = (v) => String(v || "").toLowerCase();
                    return matchedCandidates
                      .filter(row => {
                        if (!selectedJobTitle) return true;
                        const pos = (row.positionName || '').trim().toLowerCase();
                        const job = selectedJobTitle.trim().toLowerCase();
                        return pos === job || pos.includes(job) || job.includes(pos);
                      })
                      .map((row, i) => ({
                        id: i + 1,
                        name:            row.name            || row.candidateName    || "N/A",
                        experience:      row.experience                              || "N/A",
                        currentLocation: row.currentLocation                        || "N/A",
                        positionName:    row.positionName                            || "N/A",
                        expectedCTC:     row.expectedCTC                            || "N/A",
                        noticePeriod:    row.noticePeriod                           || "N/A",
                        currentCompany:  row.currentCompany                         || "N/A",
                      })).filter(c =>
                        (!mcFilterName           || nm(c.name).includes(nm(mcFilterName))) &&
                        (!mcFilterExperience     || nm(c.experience).includes(nm(mcFilterExperience))) &&
                        (!mcFilterLocation       || nm(c.currentLocation).includes(nm(mcFilterLocation))) &&
                        (!mcFilterPosition       || nm(c.positionName).includes(nm(mcFilterPosition))) &&
                        (!mcFilterExpectedCTC    || nm(c.expectedCTC).includes(nm(mcFilterExpectedCTC))) &&
                        (!mcFilterNoticePeriod   || nm(c.noticePeriod).includes(nm(mcFilterNoticePeriod))) &&
                        (!mcFilterCurrentCompany || nm(c.currentCompany).includes(nm(mcFilterCurrentCompany)))
                      ).length;
                  })()} of ${matchedCandidates.filter(row => {
                    if (!selectedJobTitle) return true;
                    const pos = (row.positionName || '').trim().toLowerCase();
                    const job = selectedJobTitle.trim().toLowerCase();
                    return pos === job || pos.includes(job) || job.includes(pos);
                  }).length} found`}
                </Typography>
              )}
            </Box>
          </Box>
          <IconButton
            size="small"
            onClick={() => { setOpenCandidateDialog(false); setMatchedCandidates([]); setCandidateFilter(""); }}
            sx={{ color: "#fff", bgcolor: "rgba(255,255,255,0.15)", "&:hover": { bgcolor: "rgba(255,255,255,0.28)" } }}
          >
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* ── Filter Bar ── */}
        <Box sx={{ px: 2, py: 1.5, display: "flex", alignItems: "center", gap: 1, flexWrap: "wrap", bgcolor: "#fafbff", borderBottom: "1px solid #e8eaf6" }}>
          <TextField
            size="small"
            placeholder="Search name..."
            value={mcFilterName}
            onChange={(e) => setMcFilterName(e.target.value)}
            sx={{ width: 150, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, bgcolor: mcFilterName ? "#e8eaf6" : "#fff" } }}
            InputProps={{
              startAdornment: <SearchIcon sx={{ fontSize: 15, color: "#9fa8da", mr: 0.5 }} />,
              endAdornment: mcFilterName && <IconButton size="small" onClick={() => setMcFilterName("")}><CloseIcon sx={{ fontSize: 13 }} /></IconButton>,
            }}
          />
          <TextField size="small" label="Experience" value={mcFilterExperience} onChange={(e) => setMcFilterExperience(e.target.value)}
            sx={{ width: 130, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, bgcolor: mcFilterExperience ? "#e8eaf6" : "#fff" } }}
            InputProps={{ endAdornment: mcFilterExperience && <IconButton size="small" onClick={() => setMcFilterExperience("")}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
          />
          <TextField size="small" label="Location" value={mcFilterLocation} onChange={(e) => setMcFilterLocation(e.target.value)}
            sx={{ width: 140, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, bgcolor: mcFilterLocation ? "#e8eaf6" : "#fff" } }}
            InputProps={{ endAdornment: mcFilterLocation && <IconButton size="small" onClick={() => setMcFilterLocation("")}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
          />
          <TextField size="small" label="Position" value={mcFilterPosition} onChange={(e) => setMcFilterPosition(e.target.value)}
            sx={{ width: 150, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, bgcolor: mcFilterPosition ? "#e8eaf6" : "#fff" } }}
            InputProps={{ endAdornment: mcFilterPosition && <IconButton size="small" onClick={() => setMcFilterPosition("")}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
          />
          <TextField size="small" label="Expected CTC" value={mcFilterExpectedCTC} onChange={(e) => setMcFilterExpectedCTC(e.target.value)}
            sx={{ width: 140, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, bgcolor: mcFilterExpectedCTC ? "#e8eaf6" : "#fff" } }}
            InputProps={{ endAdornment: mcFilterExpectedCTC && <IconButton size="small" onClick={() => setMcFilterExpectedCTC("")}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
          />
          <TextField size="small" label="Notice Period" value={mcFilterNoticePeriod} onChange={(e) => setMcFilterNoticePeriod(e.target.value)}
            sx={{ width: 140, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, bgcolor: mcFilterNoticePeriod ? "#e8eaf6" : "#fff" } }}
            InputProps={{ endAdornment: mcFilterNoticePeriod && <IconButton size="small" onClick={() => setMcFilterNoticePeriod("")}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
          />
          <TextField size="small" label="Current Company" value={mcFilterCurrentCompany} onChange={(e) => setMcFilterCurrentCompany(e.target.value)}
            sx={{ width: 160, "& .MuiOutlinedInput-root": { borderRadius: "8px", fontSize: 12, bgcolor: mcFilterCurrentCompany ? "#e8eaf6" : "#fff" } }}
            InputProps={{ endAdornment: mcFilterCurrentCompany && <IconButton size="small" onClick={() => setMcFilterCurrentCompany("")}><CloseIcon sx={{ fontSize: 13 }} /></IconButton> }}
          />
          {(mcFilterName || mcFilterExperience || mcFilterLocation || mcFilterPosition || mcFilterExpectedCTC || mcFilterNoticePeriod || mcFilterCurrentCompany) && (
            <Button size="small" variant="outlined"
              onClick={() => { setMcFilterName(""); setMcFilterExperience(""); setMcFilterLocation(""); setMcFilterPosition(""); setMcFilterExpectedCTC(""); setMcFilterNoticePeriod(""); setMcFilterCurrentCompany(""); }}
              sx={{ borderRadius: "8px", textTransform: "none", fontWeight: 700, color: "#ef4444", borderColor: "#ef4444", height: 36, whiteSpace: "nowrap", "&:hover": { bgcolor: "#fff5f5", borderColor: "#ef4444" } }}>
              Clear All
            </Button>
          )}
        </Box>

        {/* Body */}
        <DialogContent sx={{ p: 2 }}>
          {findLoading ? (
            <Box display="flex" justifyContent="center" alignItems="center" height={400}>
              <CircularProgress sx={{ color: "#3f51b5" }} />
            </Box>
          ) : (
            <div style={{ height: 560, width: "100%" }}>
              <DataGrid
                rows={matchedCandidates
                  .filter(row => {
                    if (!selectedJobTitle) return true;
                    const pos = (row.positionName || '').trim().toLowerCase();
                    const job = selectedJobTitle.trim().toLowerCase();
                    return pos === job || pos.includes(job) || job.includes(pos);
                  })
                  .map((row, i) => ({
                  id: i + 1,
                  name:            row.name            || row.candidateName    || "N/A",
                  phoneNumber:     row.phoneNumber      || row.candidatePhone  || "N/A",
                  qualification:   row.qualification                           || "N/A",
                  positionName:    row.positionName                            || "N/A",
                  experience:      row.experience                              || "N/A",
                  currentLocation: row.currentLocation                        || "N/A",
                  currentPosition: row.currentPosition                        || "N/A",
                  currentCTC:      row.currentCTC                             || "N/A",
                  expectedCTC:     row.expectedCTC                            || "N/A",
                  noticePeriod:    row.noticePeriod                           || "N/A",
                  reasonforLeaving:row.reasonforLeaving                       || "N/A",
                  currentCompany:  row.currentCompany                         || "N/A",
                  remark:          row.remark                                 || "N/A",
                  resume:          row.resumeUpload    || row.resumeLink      || "",
                })).filter(c => {
                  const nm = (v) => String(v || "").toLowerCase();
                  return (
                    (!mcFilterName           || nm(c.name).includes(nm(mcFilterName))) &&
                    (!mcFilterExperience     || nm(c.experience).includes(nm(mcFilterExperience))) &&
                    (!mcFilterLocation       || nm(c.currentLocation).includes(nm(mcFilterLocation))) &&
                    (!mcFilterPosition       || nm(c.positionName).includes(nm(mcFilterPosition))) &&
                    (!mcFilterExpectedCTC    || nm(c.expectedCTC).includes(nm(mcFilterExpectedCTC))) &&
                    (!mcFilterNoticePeriod   || nm(c.noticePeriod).includes(nm(mcFilterNoticePeriod))) &&
                    (!mcFilterCurrentCompany || nm(c.currentCompany).includes(nm(mcFilterCurrentCompany)))
                  );
                })}
                columns={[
                  { field: "name",             headerName: "Name",               width: 160 },
                  { field: "phoneNumber",       headerName: "Phone",              width: 130 },
                  { field: "qualification",     headerName: "Qualification",      width: 140 },
                  { field: "positionName",      headerName: "Position",           width: 160 },
                  { field: "experience",        headerName: "Experience",         width: 110 },
                  { field: "currentLocation",   headerName: "Location",           width: 140 },
                  { field: "currentPosition",   headerName: "Current Position",   width: 160 },
                  { field: "currentCTC",        headerName: "Current CTC",        width: 130 },
                  { field: "expectedCTC",       headerName: "Expected CTC",       width: 130 },
                  { field: "noticePeriod",      headerName: "Notice Period",      width: 130 },
                  { field: "reasonforLeaving",  headerName: "Reason for Leaving", width: 180 },
                  { field: "currentCompany",    headerName: "Current Company",    width: 160 },
                  { field: "remark",            headerName: "Remark",             width: 150 },
                  {
                    field: "resume",
                    headerName: "Resume",
                    width: 100,
                    renderCell: (params) => params.value
                      ? <a href={params.value} target="_blank" rel="noreferrer" style={{ color: "#3f51b5", fontWeight: 600, fontSize: "0.8rem" }}>View</a>
                      : <span style={{ color: "#9fa8da", fontSize: "0.8rem" }}>N/A</span>,
                  },
                ]}
                pageSizeOptions={[10, 25, 50]}
                initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                disableRowSelectionOnClick
                sx={{
                  border: "none",
                  "& .MuiDataGrid-columnHeaders": {
                    background: "linear-gradient(135deg, #e8eaf6, #f3f4fd)",
                    borderBottom: "2px solid #c5cae9",
                  },
                  "& .MuiDataGrid-columnHeaderTitle": {
                    fontWeight: 700, color: "#3f51b5", fontSize: "0.78rem",
                    textTransform: "uppercase", letterSpacing: "0.04em",
                  },
                  "& .MuiDataGrid-cell": {
                    borderBottom: "1px solid #f0f2ff",
                    fontSize: "0.83rem", color: "#334155",
                    "&:focus": { outline: "none" },
                  },
                  "& .MuiDataGrid-row:hover": { bgcolor: "#f5f6ff" },
                  "& .MuiDataGrid-footerContainer": { borderTop: "1px solid #e8eaf6", bgcolor: "#f5f6ff" },
                  "& .MuiDataGrid-virtualScroller::-webkit-scrollbar": { height: 7, width: 7 },
                  "& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb": { background: "#9fa8da", borderRadius: 4 },
                }}
              />
            </div>
          )}
        </DialogContent>
      </Dialog>

    </div>
  );
};

export default HrDashboard;
