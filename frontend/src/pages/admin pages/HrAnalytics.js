import React, { useEffect, useState, useCallback, useMemo } from 'react';
import axios from 'axios';
import {
  Box, Typography, Chip, Tooltip, Button, TextField,
  Tab, Tabs, FormControl, InputLabel, Select, MenuItem,
  IconButton,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import RefreshIcon       from '@mui/icons-material/Refresh';
import BusinessIcon      from '@mui/icons-material/Business';
import PeopleAltIcon     from '@mui/icons-material/PeopleAlt';
import CheckCircleIcon   from '@mui/icons-material/CheckCircle';
import CancelIcon        from '@mui/icons-material/Cancel';
import TrendingUpIcon    from '@mui/icons-material/TrendingUp';
import WorkOutlineIcon   from '@mui/icons-material/WorkOutline';
import Navbar  from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import { API_BASE_URL } from '../../config/api.config';

// ── Stat card ─────────────────────────────────────────────────────────────────
const StatCard = ({ label, value, icon, color, bg }) => (
  <Box sx={{
    flex: '1 1 150px', minWidth: 140,
    bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '14px',
    p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
    boxShadow: '0 2px 12px rgba(63,81,181,0.07)',
  }}>
    <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', color, flexShrink: 0 }}>
      {React.cloneElement(icon, { fontSize: 'small' })}
    </Box>
    <Box>
      <Typography variant="h6" fontWeight={800} color="#1e293b" lineHeight={1}>{value}</Typography>
      <Typography variant="caption" color="text.secondary" fontWeight={500}>{label}</Typography>
    </Box>
  </Box>
);

// ── Percentage chip ───────────────────────────────────────────────────────────
const PctChip = ({ value }) => {
  const color = value >= 50 ? '#065f46' : value >= 25 ? '#92400e' : '#991b1b';
  const bg    = value >= 50 ? '#d1fae5' : value >= 25 ? '#fef3c7' : '#fee2e2';
  return (
    <Chip label={`${value}%`} size="small"
      sx={{ bgcolor: bg, color, fontWeight: 700, fontSize: '0.72rem' }} />
  );
};

// ── Build rows with subtotals ─────────────────────────────────────────────────
const buildRowsWithSubtotals = (data, groupKeyFn, subtotalLabel) => {
  const groups = {};
  data.forEach(r => {
    const key = groupKeyFn(r);
    if (!groups[key]) groups[key] = { key, rows: [], label: subtotalLabel(r) };
    groups[key].rows.push(r);
  });

  const result = [];
  let idx = 0;

  Object.values(groups).forEach(({ key, rows, label }) => {
    // Individual HR rows
    rows.forEach(r => result.push({ ...r, id: `row-${idx++}`, _isSubtotal: false }));

    // Subtotal row — only add if more than 1 HR in this group
    if (rows.length > 1) {
      const sum = rows.reduce((acc, r) => ({
        sourced:       acc.sourced       + (r.sourced       || 0),
        selected:      acc.selected      + (r.selected      || 0),
        rejected:      acc.rejected      + (r.rejected      || 0),
        onHold:        acc.onHold        + (r.onHold        || 0),
        joined:        acc.joined        + (r.joined        || 0),
        backout:       acc.backout       + (r.backout       || 0),
        offerAccepted: acc.offerAccepted + (r.offerAccepted || 0),
        offerRejected: acc.offerRejected + (r.offerRejected || 0),
      }), { sourced:0, selected:0, rejected:0, onHold:0, joined:0, backout:0, offerAccepted:0, offerRejected:0 });

      const selRate = sum.sourced > 0 ? Math.round((sum.selected / sum.sourced) * 100) : 0;

      // Collect all HR names who contributed
      const hrNames = rows.map(r => (r.hrName || '').trim()).filter(Boolean);

      result.push({
        ...rows[0],
        id: `subtotal-${idx++}`,
        _isSubtotal: true,
        _subtotalLabel: label,
        _hrNames: hrNames,                          // ← all contributing HR names
        hrName: `📊 Total (${rows.length} HRs)`,
        jobTitle: rows[0].jobTitle,
        companyName: rows[0].companyName,
        ...sum,
        selectionRate: selRate,
      });
    }
  });

  return result;
};

// ─────────────────────────────────────────────────────────────────────────────
const HrAnalytics = () => {
  const [tab, setTab]               = useState(0);
  const [companyData, setCompanyData] = useState([]);
  const [hrData, setHrData]         = useState([]);
  const [loading, setLoading]       = useState(false);
  const [from, setFrom]             = useState('');
  const [to, setTo]                 = useState('');
  const [hrList, setHrList]         = useState([]);
  const [selectedHr, setSelectedHr] = useState('');

  // ── Fetch HR list ──────────────────────────────────────────────────────────
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    axios.get(`${API_BASE_URL}/hr/hr-users`, { headers: { Authorization: `Bearer ${token}` } })
      .then(r => setHrList(r.data || []))
      .catch(() => {});
  }, []);

  // ── Fetch company-HR stats ─────────────────────────────────────────────────
  const fetchCompanyHr = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const params = {};
      if (from) params.from = from;
      if (to)   params.to   = to;
      const res = await axios.get(`${API_BASE_URL}/analytics/company-hr`, {
        headers: { Authorization: `Bearer ${token}` }, params,
      });
      setCompanyData(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [from, to]);

  // ── Fetch HR-position stats ────────────────────────────────────────────────
  const fetchHrPosition = useCallback(async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const params = {};
      if (from)       params.from = from;
      if (to)         params.to   = to;
      if (selectedHr) params.hrId = selectedHr;
      const res = await axios.get(`${API_BASE_URL}/analytics/hr-position`, {
        headers: { Authorization: `Bearer ${token}` }, params,
      });
      setHrData(res.data.data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, [from, to, selectedHr]);

  useEffect(() => {
    if (tab === 0) fetchCompanyHr();
    else           fetchHrPosition();
  }, [tab, fetchCompanyHr, fetchHrPosition]);

  // ── Build rows with subtotals ──────────────────────────────────────────────

  // Tab 0: group by company → subtotal per company
  const companyRows = useMemo(() =>
    buildRowsWithSubtotals(
      companyData,
      r => r.companyName || '',
      r => r.companyName || '',
    ),
  [companyData]);

  // Tab 1: group by (jobTitle + companyName) → subtotal per position
  const hrPositionRows = useMemo(() =>
    buildRowsWithSubtotals(
      hrData,
      r => `${r.jobTitle || ''}__${r.companyName || ''}`,
      r => `${r.jobTitle || ''} @ ${r.companyName || ''}`,
    ),
  [hrData]);

  const activeRows = tab === 0 ? companyRows : hrPositionRows;

  // ── Summary totals (from raw data, not subtotal rows) ─────────────────────
  const rawData = tab === 0 ? companyData : hrData;
  const totals = rawData.reduce(
    (acc, r) => ({
      sourced:       acc.sourced       + (r.sourced       || 0),
      selected:      acc.selected      + (r.selected      || 0),
      rejected:      acc.rejected      + (r.rejected      || 0),
      joined:        acc.joined        + (r.joined        || 0),
      offerAccepted: acc.offerAccepted + (r.offerAccepted || 0),
    }),
    { sourced: 0, selected: 0, rejected: 0, joined: 0, offerAccepted: 0 }
  );
  const overallRate = totals.sourced > 0
    ? Math.round((totals.selected / totals.sourced) * 100) : 0;

  // ── Column helpers ─────────────────────────────────────────────────────────
  const numCol = (field, headerName, width = 100) => ({
    field, headerName, width, type: 'number',
    renderCell: (p) => (
      <Typography
        fontWeight={p.row._isSubtotal ? 800 : 600}
        fontSize="0.83rem"
        color={p.row._isSubtotal ? '#1e293b' : 'inherit'}
      >
        {p.value ?? 0}
      </Typography>
    ),
  });

  // ── Tab 0 columns: Company → HR ────────────────────────────────────────────
  const companyHrColumns = [
    {
      field: 'companyName', headerName: 'Company', width: 200,
      renderCell: (p) => (
        <Box display="flex" alignItems="center" gap={0.8}>
          <BusinessIcon sx={{ fontSize: 15, color: p.row._isSubtotal ? '#f57c00' : '#3f51b5' }} />
          <Tooltip title={p.value || ''}>
            <Typography noWrap fontWeight={p.row._isSubtotal ? 800 : 600} fontSize="0.83rem"
              color={p.row._isSubtotal ? '#f57c00' : 'inherit'}>
              {p.value || '—'}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'hrName', headerName: 'HR Name', width: 200,
      renderCell: (p) => {
        if (p.row._isSubtotal) {
          const names = p.row._hrNames || [];
          return (
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                    HRs who sourced candidates:
                  </Typography>
                  {names.map((n, i) => (
                    <Typography key={i} variant="caption" sx={{ display: 'block' }}>• {n}</Typography>
                  ))}
                </Box>
              }
              arrow
            >
              <Box display="flex" alignItems="center" gap={0.8} sx={{ cursor: 'help' }}>
                <PeopleAltIcon sx={{ fontSize: 15, color: '#f57c00' }} />
                <Box>
                  <Typography noWrap fontSize="0.83rem" fontWeight={800} color="#f57c00" fontStyle="italic">
                    📊 Total ({names.length} HRs)
                  </Typography>
                  <Typography noWrap fontSize="0.68rem" color="#94a3b8" sx={{ lineHeight: 1 }}>
                    {names.join(', ')}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          );
        }
        return (
          <Box display="flex" alignItems="center" gap={0.8}>
            <PeopleAltIcon sx={{ fontSize: 15, color: '#0288d1' }} />
            <Typography noWrap fontSize="0.83rem" fontWeight={500}>
              {(p.value || '').trim() || '—'}
            </Typography>
          </Box>
        );
      },
    },
    numCol('sourced',       'Sourced',        100),
    numCol('selected',      'Selected',       100),
    numCol('rejected',      'Rejected',       100),
    numCol('onHold',        'On Hold',        100),
    numCol('joined',        'Joined',         100),
    numCol('backout',       'Backout',        100),
    numCol('offerAccepted', 'Offer Accepted', 130),
    numCol('offerRejected', 'Offer Rejected', 130),
    {
      field: 'selectionRate', headerName: 'Selection %', width: 120,
      renderCell: (p) => <PctChip value={p.value ?? 0} />,
    },
  ];

  // ── Tab 1 columns: HR → Position ───────────────────────────────────────────
  const hrPositionColumns = [
    {
      field: 'hrName', headerName: 'HR Name', width: 190,
      renderCell: (p) => {
        if (p.row._isSubtotal) {
          const names = p.row._hrNames || [];
          return (
            <Tooltip
              title={
                <Box>
                  <Typography variant="caption" fontWeight={700} sx={{ display: 'block', mb: 0.5 }}>
                    HRs who sourced for this position:
                  </Typography>
                  {names.map((n, i) => (
                    <Typography key={i} variant="caption" sx={{ display: 'block' }}>• {n}</Typography>
                  ))}
                </Box>
              }
              arrow
            >
              <Box display="flex" alignItems="center" gap={0.8} sx={{ cursor: 'help' }}>
                <PeopleAltIcon sx={{ fontSize: 15, color: '#f57c00' }} />
                <Box>
                  <Typography noWrap fontSize="0.83rem" fontWeight={800} color="#f57c00" fontStyle="italic">
                    📊 Total ({names.length} HRs)
                  </Typography>
                  <Typography noWrap fontSize="0.68rem" color="#94a3b8" sx={{ lineHeight: 1 }}>
                    {names.join(', ')}
                  </Typography>
                </Box>
              </Box>
            </Tooltip>
          );
        }
        return (
          <Box display="flex" alignItems="center" gap={0.8}>
            <PeopleAltIcon sx={{ fontSize: 15, color: '#0288d1' }} />
            <Typography noWrap fontWeight={600} fontSize="0.83rem">
              {(p.value || '').trim() || '—'}
            </Typography>
          </Box>
        );
      },
    },
    {
      field: 'jobTitle', headerName: 'Position', width: 200,
      renderCell: (p) => (
        <Box display="flex" alignItems="center" gap={0.8}>
          <WorkOutlineIcon sx={{ fontSize: 15, color: p.row._isSubtotal ? '#f57c00' : '#7b1fa2' }} />
          <Tooltip title={p.value || ''}>
            <Typography noWrap fontSize="0.83rem" fontWeight={p.row._isSubtotal ? 800 : 500}
              color={p.row._isSubtotal ? '#f57c00' : 'inherit'}>
              {p.value || '—'}
            </Typography>
          </Tooltip>
        </Box>
      ),
    },
    {
      field: 'companyName', headerName: 'Company', width: 180,
      renderCell: (p) => (
        <Tooltip title={p.value || ''}>
          <Typography noWrap fontSize="0.83rem" color="#3f51b5">{p.value || '—'}</Typography>
        </Tooltip>
      ),
    },
    numCol('sourced',       'Sourced',        100),
    numCol('selected',      'Selected',       100),
    numCol('rejected',      'Rejected',       100),
    numCol('onHold',        'On Hold',        100),
    numCol('joined',        'Joined',         100),
    numCol('backout',       'Backout',        100),
    numCol('offerAccepted', 'Offer Accepted', 130),
    numCol('offerRejected', 'Offer Rejected', 130),
    {
      field: 'selectionRate', headerName: 'Selection %', width: 120,
      renderCell: (p) => <PctChip value={p.value ?? 0} />,
    },
  ];

  const clearFilters = () => { setFrom(''); setTo(''); setSelectedHr(''); };
  const hasFilters = from || to || selectedHr;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f0f2f8' }}>
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', zIndex: 1000 }}>
        <Sidebar />
      </div>

      <Box sx={{
        flexGrow: 1, display: 'flex', flexDirection: 'column', ml: '250px', minHeight: '100vh',
        overflowY: 'auto', overflowX: 'hidden',
        '&::-webkit-scrollbar': { width: 7 },
        '&::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
      }}>
        <Box sx={{ position: 'fixed', top: 0, left: '250px', right: 0, zIndex: 999, bgcolor: '#fff', boxShadow: '0 1px 4px rgba(63,81,181,0.12)' }}>
          <Navbar />
        </Box>

        <Box sx={{ p: 3, flex: 1, mt: '64px' }}>

          {/* ── Header ── */}
          <Box sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            borderRadius: '16px', p: 3, mb: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(63,81,181,0.25)',
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(255,255,255,0.18)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <TrendingUpIcon sx={{ color: '#fff', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.3px">
                  HR Analytics
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                  Company-wise & HR-wise candidate sourcing report · subtotals shown when multiple HRs work on same position
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Refresh">
              <IconButton onClick={() => tab === 0 ? fetchCompanyHr() : fetchHrPosition()}
                sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: '#fff', '&:hover': { bgcolor: 'rgba(255,255,255,0.25)' } }}>
                <RefreshIcon />
              </IconButton>
            </Tooltip>
          </Box>

          {/* ── Summary Stats ── */}
          <Box display="flex" gap={2} mb={3} flexWrap="wrap">
            <StatCard label="Total Sourced"  value={totals.sourced}       icon={<PeopleAltIcon />}   color="#3f51b5" bg="#e8eaf6" />
            <StatCard label="Selected"       value={totals.selected}      icon={<CheckCircleIcon />} color="#065f46" bg="#d1fae5" />
            <StatCard label="Rejected"       value={totals.rejected}      icon={<CancelIcon />}      color="#991b1b" bg="#fee2e2" />
            <StatCard label="Joined"         value={totals.joined}        icon={<WorkOutlineIcon />} color="#0288d1" bg="#e1f5fe" />
            <StatCard label="Offer Accepted" value={totals.offerAccepted} icon={<TrendingUpIcon />}  color="#7b1fa2" bg="#f3e5f5" />
            <Box sx={{
              flex: '1 1 150px', minWidth: 140,
              bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '14px',
              p: 2, display: 'flex', alignItems: 'center', gap: 1.5,
              boxShadow: '0 2px 12px rgba(63,81,181,0.07)',
            }}>
              <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: overallRate >= 50 ? '#d1fae5' : '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <TrendingUpIcon fontSize="small" sx={{ color: overallRate >= 50 ? '#065f46' : '#92400e' }} />
              </Box>
              <Box>
                <Typography variant="h6" fontWeight={800} color="#1e293b" lineHeight={1}>{overallRate}%</Typography>
                <Typography variant="caption" color="text.secondary" fontWeight={500}>Selection Rate</Typography>
              </Box>
            </Box>
          </Box>

          {/* ── Tabs + Filters ── */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '16px', mb: 2, boxShadow: '0 4px 20px rgba(63,81,181,0.08)', overflow: 'hidden' }}>
            <Box sx={{ background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 100%)', px: 3, pt: 1.5 }}>
              <Tabs value={tab} onChange={(_, v) => setTab(v)}
                TabIndicatorProps={{ style: { backgroundColor: '#fff', height: 3, borderRadius: 2 } }}
                sx={{
                  '& .MuiTab-root': { color: 'rgba(255,255,255,0.65)', fontWeight: 700, textTransform: 'none', fontSize: '0.9rem', minHeight: 44 },
                  '& .Mui-selected': { color: '#fff !important' },
                }}>
                <Tab label="🏢 Company → HR Breakdown" />
                <Tab label="👤 HR → Position Breakdown" />
              </Tabs>
            </Box>

            <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap', bgcolor: '#fafbff', borderBottom: '1px solid #e8eaf6' }}>
              <TextField size="small" label="From Date" type="date" InputLabelProps={{ shrink: true }}
                value={from} onChange={e => setFrom(e.target.value)}
                sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: from ? '#e8eaf6' : '#fff' } }}
              />
              <TextField size="small" label="To Date" type="date" InputLabelProps={{ shrink: true }}
                value={to} onChange={e => setTo(e.target.value)}
                sx={{ width: 150, '& .MuiOutlinedInput-root': { borderRadius: '8px', fontSize: 12, bgcolor: to ? '#e8eaf6' : '#fff' } }}
              />
              {tab === 1 && (
                <FormControl size="small" sx={{ minWidth: 180 }}>
                  <InputLabel sx={{ fontSize: 12 }}>Filter by HR</InputLabel>
                  <Select value={selectedHr} label="Filter by HR"
                    onChange={e => setSelectedHr(e.target.value)}
                    sx={{ fontSize: 12, borderRadius: '8px', bgcolor: selectedHr ? '#e8eaf6' : '#fff' }}>
                    <MenuItem value=""><em>All HRs</em></MenuItem>
                    {hrList.map(hr => (
                      <MenuItem key={hr._id} value={hr._id} sx={{ fontSize: 13 }}>
                        {`${hr.firstName || ''} ${hr.lastName || ''}`.trim()}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}
              <Button variant="contained" size="small"
                onClick={() => tab === 0 ? fetchCompanyHr() : fetchHrPosition()}
                sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, height: 36, background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)', whiteSpace: 'nowrap' }}>
                Apply
              </Button>
              {hasFilters && (
                <Button size="small" variant="outlined" onClick={clearFilters}
                  sx={{ borderRadius: '8px', textTransform: 'none', fontWeight: 700, color: '#ef4444', borderColor: '#ef4444', height: 36, '&:hover': { bgcolor: '#fff5f5' } }}>
                  Clear
                </Button>
              )}
              <Box sx={{ ml: 'auto', display: 'flex', gap: 1, alignItems: 'center' }}>
                <Chip label={`${rawData.length} HR rows`} size="small"
                  sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700, fontSize: '0.75rem' }} />
                {activeRows.filter(r => r._isSubtotal).length > 0 && (
                  <Chip
                    label={`${activeRows.filter(r => r._isSubtotal).length} subtotal${activeRows.filter(r => r._isSubtotal).length > 1 ? 's' : ''}`}
                    size="small"
                    sx={{ bgcolor: '#fff3e0', color: '#f57c00', fontWeight: 700, fontSize: '0.75rem', border: '1px solid #ffe0b2' }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* ── DataGrid ── */}
          <Box sx={{
            bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '14px',
            overflow: 'hidden', height: 580,
            boxShadow: '0 2px 12px rgba(63,81,181,0.08)',
          }}>
            <DataGrid
              rows={activeRows}
              columns={tab === 0 ? companyHrColumns : hrPositionColumns}
              loading={loading}
              components={{ Toolbar: GridToolbar }}
              componentsProps={{ toolbar: { showQuickFilter: true, quickFilterProps: { debounceMs: 300 } } }}
              pageSize={25}
              rowsPerPageOptions={[10, 25, 50, 100]}
              disableSelectionOnClick
              getRowClassName={(params) => params.row._isSubtotal ? 'subtotal-row' : ''}
              sx={{
                border: 'none',
                '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', fontSize: '0.82rem', '&:focus': { outline: 'none' } },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
                '& .MuiToolbar-root': { color: '#3f51b5' },
                // Subtotal row styling
                '& .subtotal-row': {
                  bgcolor: '#fff8f0 !important',
                  borderTop: '2px solid #ffe0b2',
                  borderBottom: '2px solid #ffe0b2',
                },
                '& .subtotal-row:hover': { bgcolor: '#fff3e0 !important' },
              }}
            />
          </Box>

          {/* ── Legend ── */}
          <Box sx={{ mt: 2, p: 2, bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '12px', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
            <Typography variant="caption" fontWeight={700} color="#64748b" sx={{ textTransform: 'uppercase', letterSpacing: '0.06em' }}>Legend:</Typography>
            {[
              { label: 'Each row = one HR\'s contribution to that company/position', color: '#3f51b5' },
              { label: '📊 Total row = combined across all HRs (shown when 2+ HRs work on same position)', color: '#f57c00' },
              { label: 'Sourced = candidates added by that HR', color: '#0288d1' },
              { label: 'Selected = interviewStatus: Selected', color: '#065f46' },
              { label: 'Joined = hasJoined: Yes', color: '#388e3c' },
              { label: 'Selection % = Selected ÷ Sourced × 100', color: '#7b1fa2' },
            ].map(({ label, color }) => (
              <Box key={label} display="flex" alignItems="center" gap={0.5}>
                <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
                <Typography variant="caption" color="#64748b">{label}</Typography>
              </Box>
            ))}
          </Box>

        </Box>
      </Box>
    </div>
  );
};

export default HrAnalytics;
