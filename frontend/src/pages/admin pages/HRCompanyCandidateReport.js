import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { Box, Typography, Chip, Tooltip, Button, TextField, Tab, Tabs, IconButton, Grid } from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import dayjs from 'dayjs';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import PeopleAltIcon from '@mui/icons-material/PeopleAlt';
import BusinessIcon from '@mui/icons-material/Business';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import WorkOutlineIcon from '@mui/icons-material/WorkOutline';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import CloseIcon from '@mui/icons-material/Close';

// ── Helpers ────────────────────────────────────────────────────────────────────

const interviewStatusColor = (status) => {
  switch (status) {
    case 'Selected':    return { bg: '#e8f5e9', color: '#2e7d32' };
    case 'Rejected':    return { bg: '#ffebee', color: '#c62828' };
    case 'On Hold':     return { bg: '#fff8e1', color: '#f57f17' };
    case 'Trail':       return { bg: '#e3f2fd', color: '#1565c0' };
    case 'On Discussion': return { bg: '#f3e5f5', color: '#6a1b9a' };
    default:            return { bg: '#f5f5f5', color: '#616161' };
  }
};

const offeredStatusColor = (status) => {
  switch (status) {
    case 'Accepted': return { bg: '#e8f5e9', color: '#2e7d32' };
    case 'Rejected': return { bg: '#ffebee', color: '#c62828' };
    default:         return { bg: '#f5f5f5', color: '#616161' };
  }
};

const joinedStatusColor = (status) => {
  switch (status) {
    case 'Yes':     return { bg: '#e8f5e9', color: '#2e7d32' };
    case 'Backout': return { bg: '#ffebee', color: '#c62828' };
    default:        return { bg: '#f5f5f5', color: '#616161' };
  }
};

const jobStatusColor = (status) => {
  switch (status) {
    case 'Open':   return { bg: '#e8f5e9', color: '#2e7d32' };
    case 'Closed': return { bg: '#ffebee', color: '#c62828' };
    case 'OnHold': return { bg: '#fff8e1', color: '#f57f17' };
    default:       return { bg: '#e8eaf6', color: '#3f51b5' };
  }
};

const fmt = (v) => (v ? dayjs(v).format('DD/MM/YYYY') : '—');
const fmtDT = (v) => (v ? dayjs(v).format('DD/MM/YYYY hh:mm A') : '—');

// ── Stat Card ──────────────────────────────────────────────────────────────────

const StatCard = ({ icon, label, value, accent }) => (
  <Box
    sx={{
      flex: '1 1 120px',
      minWidth: 110,
      background: '#fff',
      borderRadius: '16px',
      boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
      p: 2,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      gap: 0.5,
      borderTop: `4px solid ${accent || '#3f51b5'}`,
    }}
  >
    <Box sx={{ color: accent || '#3f51b5', display: 'flex' }}>{icon}</Box>
    <Typography variant="h5" sx={{ fontWeight: 700, color: '#1a237e' }}>
      {value}
    </Typography>
    <Typography variant="caption" sx={{ color: '#757575', textAlign: 'center', lineHeight: 1.2 }}>
      {label}
    </Typography>
  </Box>
);

// ── DataGrid shared header style ───────────────────────────────────────────────

const gridHeaderSx = {
  '& .MuiDataGrid-columnHeaders': {
    background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
    color: '#fff',
    borderRadius: 0,
  },
  '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#fff' },
  '& .MuiDataGrid-sortIcon': { color: '#fff' },
  '& .MuiDataGrid-menuIconButton': { color: '#fff' },
  '& .MuiDataGrid-row:nth-of-type(odd)': { background: '#f8f9ff' },
  '& .MuiDataGrid-row:hover': { background: '#e8eaf6' },
  '& .MuiDataGrid-cell': { display: 'flex', alignItems: 'center' },
  border: 'none',
};

// ── Main Component ─────────────────────────────────────────────────────────────

const HRCompanyCandidateReport = () => {
  const { hrId } = useParams();

  const [hr, setHr] = useState(null);
  const [jobOpenings, setJobOpenings] = useState([]);
  const [applications, setApplications] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(true);

  const [activeTab, setActiveTab] = useState(0);
  const [companyFilter, setCompanyFilter] = useState(''); // company name filter for candidates tab
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');

  // ── Fetch ────────────────────────────────────────────────────────────────────

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const token = sessionStorage.getItem('token');
        const res = await axios.get(`${API_BASE_URL}/allType/hr/${hrId}/assigned-data`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setHr(res.data.hr);
        setJobOpenings(res.data.jobOpenings || []);
        setApplications(res.data.applications || []);
        setSummary(res.data.summary || {});
      } catch (err) {
        console.error('Error fetching HR data:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [hrId]);

  // ── Date filter helper ───────────────────────────────────────────────────────

  const inDateRange = (dateStr) => {
    if (!fromDate && !toDate) return true;
    const d = dayjs(dateStr);
    if (!d.isValid()) return false;
    if (fromDate && d.isBefore(dayjs(fromDate).startOf('day'))) return false;
    if (toDate && d.isAfter(dayjs(toDate).endOf('day'))) return false;
    return true;
  };

  // ── Filtered rows ────────────────────────────────────────────────────────────

  const filteredJobs = jobOpenings.filter((j) => inDateRange(j.createdAt));

  const filteredApplications = applications.filter((app) => {
    if (!inDateRange(app.createdAt)) return false;
    if (companyFilter) {
      const jobCompany = (app.jobId?.companyName || '').toLowerCase();
      if (!jobCompany.includes(companyFilter.toLowerCase())) return false;
    }
    return true;
  });

  const handleCompanyClick = (companyName) => {
    setCompanyFilter(companyName);
    setActiveTab(1);
  };

  // ── Job Openings columns ─────────────────────────────────────────────────────

  const jobColumns = [
    {
      field: 'companyName',
      headerName: 'Company Name',
      width: 180,
      renderCell: (params) => (
        <Tooltip title="Click to filter candidates by this company" arrow>
          <span
            onClick={() => handleCompanyClick(params.value || '')}
            style={{ cursor: 'pointer', color: '#3f51b5', fontWeight: 600, textDecoration: 'underline' }}
          >
            {params.value || '—'}
          </span>
        </Tooltip>
      ),
    },
    { field: 'jobTitle', headerName: 'Job Title', width: 160 },
    { field: 'jobLocation', headerName: 'Location', width: 140 },
    { field: 'salary', headerName: 'Salary', width: 120 },
    { field: 'numberOfRequirements', headerName: 'Requirements', width: 120, type: 'number' },
    { field: '_sourced',      headerName: 'Sourced',       width: 90,  type: 'number' },
    { field: '_selected',     headerName: 'Selected',      width: 90,  type: 'number' },
    { field: '_rejected',     headerName: 'Rejected',      width: 90,  type: 'number' },
    { field: '_onHold',       headerName: 'On Hold',       width: 90,  type: 'number' },
    { field: '_joined',       headerName: 'Joined',        width: 90,  type: 'number' },
    { field: '_backout',      headerName: 'Backout',       width: 90,  type: 'number' },
    { field: '_offerAccepted',headerName: 'Offer Accepted',width: 120, type: 'number' },
    {
      field: '_selectionPct',
      headerName: 'Selection %',
      width: 110,
      type: 'number',
      renderCell: (params) => `${params.value ?? 0}%`,
    },
    {
      field: 'jobStatus',
      headerName: 'Status',
      width: 110,
      renderCell: (params) => {
        const s = params.value || 'Open';
        const { bg, color } = jobStatusColor(s);
        return (
          <Chip
            label={s === 'OnHold' ? 'On Hold' : s}
            size="small"
            sx={{ background: bg, color, fontWeight: 600, fontSize: 11 }}
          />
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 160,
      renderCell: (params) => fmtDT(params.value),
    },
  ];

  // ── Candidates columns ───────────────────────────────────────────────────────

  const candidateColumns = [
    { field: '_name',           headerName: 'Candidate Name',  width: 160 },
    { field: '_phone',          headerName: 'Phone',           width: 130 },
    { field: '_position',       headerName: 'Position',        width: 150 },
    { field: '_company',        headerName: 'Company',         width: 160 },
    { field: '_experience',     headerName: 'Experience',      width: 110 },
    { field: '_location',       headerName: 'Location',        width: 130 },
    { field: '_currentCTC',     headerName: 'Current CTC',     width: 120 },
    { field: '_expectedCTC',    headerName: 'Expected CTC',    width: 120 },
    { field: '_noticePeriod',   headerName: 'Notice Period',   width: 120 },
    { field: '_currentCompany', headerName: 'Current Company', width: 150 },
    {
      field: 'interviewStatus',
      headerName: 'Interview Status',
      width: 150,
      renderCell: (params) => {
        const v = params.value || '';
        const { bg, color } = interviewStatusColor(v);
        return v ? (
          <Chip label={v} size="small" sx={{ background: bg, color, fontWeight: 600, fontSize: 11 }} />
        ) : (
          <span style={{ color: '#9e9e9e' }}>—</span>
        );
      },
    },
    {
      field: 'offeredStatus',
      headerName: 'Offered Status',
      width: 130,
      renderCell: (params) => {
        const v = params.value || '';
        const { bg, color } = offeredStatusColor(v);
        return v ? (
          <Chip label={v} size="small" sx={{ background: bg, color, fontWeight: 600, fontSize: 11 }} />
        ) : (
          <span style={{ color: '#9e9e9e' }}>—</span>
        );
      },
    },
    {
      field: 'hasJoined',
      headerName: 'Has Joined',
      width: 120,
      renderCell: (params) => {
        const v = params.value || '';
        const { bg, color } = joinedStatusColor(v);
        return v ? (
          <Chip label={v} size="small" sx={{ background: bg, color, fontWeight: 600, fontSize: 11 }} />
        ) : (
          <span style={{ color: '#9e9e9e' }}>—</span>
        );
      },
    },
    {
      field: 'joiningDate',
      headerName: 'Joining Date',
      width: 120,
      renderCell: (params) => fmt(params.value),
    },
    {
      field: 'lineupStatus',
      headerName: 'Lineup Status',
      width: 130,
    },
    {
      field: 'resume',
      headerName: 'Resume',
      width: 100,
      sortable: false,
      renderCell: (params) => {
        const url = params.row._resumeUrl;
        if (!url || (!url.startsWith('http://') && !url.startsWith('https://'))) {
          return <span style={{ color: '#9e9e9e', fontSize: 12 }}>No file</span>;
        }
        return (
          <Button
            variant="contained"
            size="small"
            sx={{ background: '#3f51b5', fontSize: 11, px: 1, py: 0.25, minWidth: 0 }}
            onClick={() => window.open(url, '_blank')}
          >
            View
          </Button>
        );
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created At',
      width: 160,
      renderCell: (params) => fmtDT(params.value),
    },
  ];

  // ── Derived summary values ───────────────────────────────────────────────────

  const selectionPct =
    summary.totalSourced > 0
      ? Math.round((summary.totalSelected / summary.totalSourced) * 100)
      : 0;

  const statCards = [
    { icon: <BusinessIcon />,    label: 'Jobs Assigned',   value: summary.totalJobs ?? 0,          accent: '#3f51b5' },
    { icon: <PeopleAltIcon />,   label: 'Total Sourced',   value: summary.totalSourced ?? 0,        accent: '#5c6bc0' },
    { icon: <CheckCircleIcon />, label: 'Selected',        value: summary.totalSelected ?? 0,       accent: '#2e7d32' },
    { icon: <CancelIcon />,      label: 'Rejected',        value: summary.totalRejected ?? 0,       accent: '#c62828' },
    { icon: <WorkOutlineIcon />, label: 'Joined',          value: summary.totalJoined ?? 0,         accent: '#1565c0' },
    { icon: <CancelIcon />,      label: 'Backout',         value: summary.totalBackout ?? 0,        accent: '#e65100' },
    { icon: <CheckCircleIcon />, label: 'Offer Accepted',  value: summary.totalOfferAccepted ?? 0,  accent: '#00695c' },
    { icon: <TrendingUpIcon />,  label: 'Selection %',     value: `${selectionPct}%`,               accent: '#6a1b9a' },
  ];

  // ── Render ───────────────────────────────────────────────────────────────────

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2ff' }}>
      {/* Sidebar */}
      <div
        style={{
          position: 'fixed',
          left: 0,
          top: 0,
          height: '100vh',
          width: '250px',
          backgroundColor: '#3f51b5',
          color: '#fff',
          zIndex: 100,
        }}
      >
        <Sidebar />
      </div>

      {/* Main */}
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', ml: '250px', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 3 }}>

          {/* ── Header card ── */}
          <Box
            sx={{
              background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
              borderRadius: '16px',
              p: 3,
              mb: 3,
              color: '#fff',
              boxShadow: '0 4px 20px rgba(63,81,181,0.3)',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
              <BadgeIcon sx={{ fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {hr ? `${hr.firstName} ${hr.lastName}` : 'Loading…'}
              </Typography>
              {hr?.role && (
                <Chip
                  label={hr.role}
                  size="small"
                  sx={{ background: 'rgba(255,255,255,0.2)', color: '#fff', fontWeight: 600 }}
                />
              )}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mt: 1 }}>
              {hr?.email && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <EmailIcon sx={{ fontSize: 18, opacity: 0.85 }} />
                  <Typography variant="body2">{hr.email}</Typography>
                </Box>
              )}
              {hr?.mobileNo && (
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                  <PhoneIcon sx={{ fontSize: 18, opacity: 0.85 }} />
                  <Typography variant="body2">{hr.mobileNo}</Typography>
                </Box>
              )}
            </Box>
          </Box>

          {/* ── Summary stat cards ── */}
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, mb: 3 }}>
            {statCards.map((s) => (
              <StatCard key={s.label} icon={s.icon} label={s.label} value={s.value} accent={s.accent} />
            ))}
          </Box>

          {/* ── Date range filter ── */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              flexWrap: 'wrap',
              mb: 2,
              background: '#fff',
              borderRadius: '12px',
              p: 2,
              boxShadow: '0 2px 8px rgba(63,81,181,0.07)',
            }}
          >
            <Typography variant="body2" sx={{ fontWeight: 600, color: '#3f51b5', mr: 1 }}>
              Date Filter:
            </Typography>
            <TextField
              label="From"
              type="date"
              size="small"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            <TextField
              label="To"
              type="date"
              size="small"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ width: 160 }}
            />
            {(fromDate || toDate) && (
              <IconButton
                size="small"
                onClick={() => { setFromDate(''); setToDate(''); }}
                sx={{ color: '#c62828' }}
                title="Clear dates"
              >
                <CloseIcon fontSize="small" />
              </IconButton>
            )}

            {/* Company filter (shown when on Candidates tab) */}
            {activeTab === 1 && (
              <>
                <Box sx={{ width: 1, borderLeft: '1px solid #e0e0e0', height: 32, mx: 1 }} />
                <TextField
                  label="Filter by Company"
                  size="small"
                  value={companyFilter}
                  onChange={(e) => setCompanyFilter(e.target.value)}
                  sx={{ width: 220 }}
                  placeholder="Type company name…"
                />
                {companyFilter && (
                  <IconButton
                    size="small"
                    onClick={() => setCompanyFilter('')}
                    sx={{ color: '#c62828' }}
                    title="Clear company filter"
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                )}
              </>
            )}
          </Box>

          {/* ── Tabs ── */}
          <Box
            sx={{
              background: '#fff',
              borderRadius: '16px',
              boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
              overflow: 'hidden',
            }}
          >
            <Tabs
              value={activeTab}
              onChange={(_, v) => setActiveTab(v)}
              sx={{
                borderBottom: '1px solid #e8eaf6',
                '& .MuiTab-root': { fontWeight: 600, textTransform: 'none', fontSize: 14 },
                '& .Mui-selected': { color: '#3f51b5' },
                '& .MuiTabs-indicator': { background: '#3f51b5' },
                px: 2,
              }}
            >
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BusinessIcon fontSize="small" />
                    Job Openings
                    <Chip
                      label={filteredJobs.length}
                      size="small"
                      sx={{ background: '#e8eaf6', color: '#3f51b5', fontWeight: 700, height: 20, fontSize: 11 }}
                    />
                  </Box>
                }
              />
              <Tab
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PeopleAltIcon fontSize="small" />
                    Candidates
                    <Chip
                      label={filteredApplications.length}
                      size="small"
                      sx={{ background: '#e8eaf6', color: '#3f51b5', fontWeight: 700, height: 20, fontSize: 11 }}
                    />
                  </Box>
                }
              />
            </Tabs>

            {/* ── Job Openings tab ── */}
            {activeTab === 0 && (
              <Box sx={{ height: 600, p: 0 }}>
                <DataGrid
                  loading={loading}
                  rows={filteredJobs.map((j) => {
                    const s = j.stats || {};
                    const sourced = s.sourced || 0;
                    const selected = s.selected || 0;
                    return {
                      ...j,
                      id: j._id,
                      _sourced:       sourced,
                      _selected:      selected,
                      _rejected:      s.rejected      || 0,
                      _onHold:        s.onHold        || 0,
                      _joined:        s.joined        || 0,
                      _backout:       s.backout       || 0,
                      _offerAccepted: s.offerAccepted || 0,
                      _selectionPct:  sourced > 0 ? Math.round((selected / sourced) * 100) : 0,
                    };
                  })}
                  columns={jobColumns}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true } }}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  disableRowSelectionOnClick
                  sx={gridHeaderSx}
                />
              </Box>
            )}

            {/* ── Candidates tab ── */}
            {activeTab === 1 && (
              <Box sx={{ height: 600, p: 0 }}>
                {companyFilter && (
                  <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" sx={{ color: '#616161' }}>
                      Filtered by company:
                    </Typography>
                    <Chip
                      label={companyFilter}
                      size="small"
                      onDelete={() => setCompanyFilter('')}
                      sx={{ background: '#e8eaf6', color: '#3f51b5', fontWeight: 600 }}
                    />
                  </Box>
                )}
                <DataGrid
                  loading={loading}
                  rows={filteredApplications.map((a) => {
                    const c = a.candidateId || {};
                    return {
                      ...a,
                      id: a._id,
                      _name:           c.candidateName    || '—',
                      _phone:          c.candidatePhone   || '—',
                      _position:       c.positionName     || a.positionName || '—',
                      _company:        a.jobId?.companyName || '—',
                      _experience:     c.experience       || '—',
                      _location:       c.currentLocation  || '—',
                      _currentCTC:     c.currentCTC       || '—',
                      _expectedCTC:    c.expectedCTC      || '—',
                      _noticePeriod:   c.noticePeriod     || '—',
                      _currentCompany: c.currentCompany   || '—',
                      _resumeUrl:      c.resumeLink       || '',
                    };
                  })}
                  columns={candidateColumns}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{ toolbar: { showQuickFilter: true } }}
                  pageSizeOptions={[10, 25, 50]}
                  initialState={{ pagination: { paginationModel: { pageSize: 10 } } }}
                  disableRowSelectionOnClick
                  sx={gridHeaderSx}
                />
              </Box>
            )}
          </Box>
        </Box>
      </Box>
    </div>
  );
};

export default HRCompanyCandidateReport;
