import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent,
  DialogActions, TextField, Grid, IconButton, Chip, Tooltip,
  InputAdornment, CircularProgress, Paper, Alert,
  Select, MenuItem, FormControl, InputLabel, Autocomplete,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import CloseIcon from '@mui/icons-material/Close';
import BusinessIcon from '@mui/icons-material/Business';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import VisibilityIcon from '@mui/icons-material/Visibility';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import DescriptionIcon from '@mui/icons-material/Description';
import NotificationsActiveIcon from '@mui/icons-material/NotificationsActive';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import CancelIcon from '@mui/icons-material/Cancel';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import axios from 'axios';
import * as XLSX from 'xlsx';
import { toast } from 'react-toastify';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import { API_BASE_URL } from '../../config/api.config';

// ─── helpers ────────────────────────────────────────────────────────────────
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    '& fieldset': { borderColor: '#e2e8f0', transition: 'all 0.2s' },
    '&:hover fieldset': { borderColor: '#3f51b5' },
    '&.Mui-focused fieldset': { borderColor: '#3f51b5', borderWidth: '2px', boxShadow: '0 0 0 4px rgba(63, 81, 181, 0.1)' },
    '& .MuiInputBase-input': { fontSize: '0.92rem', fontWeight: 500 },
  },
  '& .MuiInputLabel-root': { fontSize: '0.88rem', fontWeight: 600, color: '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#3f51b5' },
};

const emptyForm = {
  companyName: '', industries: '', companyAddress: '', area: '', city: '',
  state: '', country: '', pincode: '',
  contactPerson: '', contactPersonDesignation: '', contactNumber: '', email: '',
  contactPerson2: '', contactPerson2Designation: '', contactNumber2: '', email2: '',
  websiteUrl: '', gpsLocation: '',
  agreementStartDate: '', agreementEndDate: '',
  invoiceNumber: '', paymentMode: '', paymentRemark: '',
  tokenAmount: '',
};

const emptyFiles = { gstUpload: null, agreementUpload: null, tokenUpload: null, otherDocumentUpload: null };

const emptyBranch = {
  branchName: '', branchAddress: '', area: '', city: '',
  state: '', country: '', pincode: '',
  contactPerson: '', contactPersonDesignation: '', contactNumber: '', email: '',
  contactPerson2: '', contactPerson2Designation: '', contactNumber2: '', email2: '',
  websiteUrl: '', gpsLocation: '',
  agreementStartDate: '', agreementEndDate: '',
  invoiceNumber: '', paymentMode: '', paymentRemark: '',
  tokenAmount: '',
};
const emptyBranchFiles = { gstUpload: null, agreementUpload: null, otherDocumentUpload: null, tokenUpload: null };

// ─── validators ──────────────────────────────────────────────────────────────
const isValidEmail = (v) => !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const isValidUrl = (v) => !v || /^(https?:\/\/|www\.)[^\s]+$/.test(v.trim());
const isValidPhone = (v) => !v || /^[0-9]{10}$/.test(v.trim());

const validateCompanyForm = (form, companies, editCompanyId) => {
  const errs = {};
  if (!form.companyName.trim()) errs.companyName = 'Company name is required';
  if (!isValidPhone(form.contactNumber)) errs.contactNumber = 'Enter a valid 10-digit phone number';
  if (!isValidPhone(form.contactNumber2)) errs.contactNumber2 = 'Enter a valid 10-digit phone number';
  if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address';
  if (!isValidUrl(form.websiteUrl)) errs.websiteUrl = 'Enter a valid URL (start with http/https or www)';
  if (!isValidUrl(form.gpsLocation)) errs.gpsLocation = 'Enter a valid GPS link (start with http/https or www)';
  if (form.tokenAmount !== '' && isNaN(Number(form.tokenAmount)))
    errs.tokenAmount = 'Token amount must be a number';
  // Agreement upload required for new company (not edit)
  if (!editCompanyId && !form._agreementFile)
    errs.agreementUpload = 'Signed agreement document is required';
  // Duplicate company name check
  if (form.companyName.trim() && companies) {
    const dup = companies.find(c =>
      c.companyName.trim().toLowerCase() === form.companyName.trim().toLowerCase() &&
      c._id !== editCompanyId
    );
    if (dup) errs.companyName = `Company "${form.companyName.trim()}" already exists (ID: ${dup.companyId})`;
  }
  return errs;
};

const validateBranchForm = (form) => {
  const errs = {};
  if (!form.branchName.trim()) errs.branchName = 'Branch name is required';
  if (!isValidPhone(form.contactNumber)) errs.contactNumber = 'Enter a valid 10-digit phone number';
  if (!isValidPhone(form.contactNumber2)) errs.contactNumber2 = 'Enter a valid 10-digit phone number';
  if (!isValidEmail(form.email)) errs.email = 'Enter a valid email address';
  if (!isValidUrl(form.gpsLocation)) errs.gpsLocation = 'Enter a valid GPS link (start with http/https or www)';
  return errs;
};

// ─── FileUploadField ─────────────────────────────────────────────────────────
function FileUploadField({ label, fieldName, file, existingUrl, onChange }) {
  const inputId = `file-${fieldName}`;
  return (
    <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: '10px', border: '1px solid #e8eaf6' }}>
      <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
        {label}
      </Typography>
      {existingUrl && !file && (
        <Box sx={{ mb: 1.5, display: 'flex', alignItems: 'center', gap: 1, p: 1, bgcolor: '#fff', borderRadius: '8px', border: '1px solid #e8eaf6' }}>
          <DescriptionIcon fontSize="small" sx={{ color: '#3f51b5' }} />
          <Typography variant="caption" sx={{ flexGrow: 1, color: '#334155' }} noWrap>
            Uploaded file
          </Typography>
          <Tooltip title="View">
            <IconButton size="small" onClick={() => window.open(existingUrl, '_blank')}>
              <VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} />
            </IconButton>
          </Tooltip>
        </Box>
      )}
      <input type="file" id={inputId} accept=".pdf,.jpg,.jpeg,.png" style={{ display: 'none' }}
        onChange={(e) => onChange(fieldName, e.target.files[0] || null)} />
      <label htmlFor={inputId}>
        <Button variant="outlined" component="span" fullWidth size="small" startIcon={<CloudUploadIcon />}
          sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontSize: '0.8rem', textTransform: 'none' }}>
          {file ? file.name : (existingUrl ? 'Replace File' : 'Upload PDF / Image')}
        </Button>
      </label>
      <Typography variant="caption" sx={{ mt: 0.5, color: 'text.secondary', display: 'block' }}>
        Supported: PDF, JPG, PNG
      </Typography>
    </Box>
  );
}

// ─── Main Component ──────────────────────────────────────────────────────────
export default function CompanyManagement() {
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialog, setDeleteDialog] = useState({ open: false, company: null });
  const [editCompany, setEditCompany] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [files, setFiles] = useState(emptyFiles);
  const [saving, setSaving] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [duplicateWarning, setDuplicateWarning] = useState('');

  // ── Pending requests from Sales ────────────────────────────────────────────
  const [pendingRequests, setPendingRequests] = useState([]);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [approveRequest, setApproveRequest] = useState(null); // request being reviewed
  const [rejectDialog, setRejectDialog] = useState({ open: false, request: null });
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState('');
  const [requestsDialogOpen, setRequestsDialogOpen] = useState(false);

  // ── branch state ───────────────────────────────────────────────────────────
  const [branchDialogOpen, setBranchDialogOpen] = useState(false);
  const [branchTargetCompany, setBranchTargetCompany] = useState(null);
  const [branchForm, setBranchForm] = useState(emptyBranch);
  const [branchFiles, setBranchFiles] = useState(emptyBranchFiles);
  const [editBranch, setEditBranch] = useState(null);
  const [branchSaving, setBranchSaving] = useState(false);
  const [branchFormErrors, setBranchFormErrors] = useState({});
  const [deleteBranchDialog, setDeleteBranchDialog] = useState({ open: false, company: null, branch: null });
  const [branchViewOpen, setBranchViewOpen] = useState(false);
  const [branchViewCompany, setBranchViewCompany] = useState(null);
  const [branchDetailOpen, setBranchDetailOpen] = useState(false);
  const [branchDetailData, setBranchDetailData] = useState(null);

  // ── Excel Import State ─────────────────────────────────────────────────────
  const [selectedExcelFile, setSelectedExcelFile] = useState(null);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [importing, setImporting] = useState(false);
  const [excelErrors, setExcelErrors] = useState([]);
  const [showExcelErrorsDialog, setShowExcelErrorsDialog] = useState(false);

  // ── Filters State ──────────────────────────────────────────────────────────
  const [filters, setFilters] = useState({
    companyName: '',
    industries: '',
    area: '',
    city: '',
    state: '',
    country: '',
    contactPerson: '',
    contactNumber: '',
  });

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      companyName: '',
      industries: '',
      area: '',
      city: '',
      state: '',
      country: '',
      contactPerson: '',
      contactNumber: '',
    });
  };

  const filteredCompanies = companies.filter(c => {
    const match = (val, search) => !search || String(val || '').toLowerCase().includes(search.toLowerCase());
    
    // For phone numbers, we normalize by removing all non-digit characters for the comparison
    const matchPhone = (val, search) => {
      if (!search) return true;
      const normalizedVal = String(val || '').replace(/\D/g, '');
      const normalizedSearch = String(search || '').replace(/\D/g, '');
      return normalizedVal.includes(normalizedSearch);
    };

    return match(c.companyName, filters.companyName) &&
           match(c.industries, filters.industries) &&
           match(c.area, filters.area) &&
           match(c.city, filters.city) &&
           match(c.state, filters.state) &&
           match(c.country, filters.country) &&
           match(c.contactPerson, filters.contactPerson) &&
           matchPhone(c.contactNumber, filters.contactNumber);
  });

  const token = sessionStorage.getItem('token');
  const headers = useMemo(() => ({ Authorization: `Bearer ${token}` }), [token]);

  // ── Dropdown options derived from loaded companies ─────────────────────────
  const filterOptions = useMemo(() => {
    const uniq = (arr) => [...new Set(arr.filter(Boolean))].sort();
    return {
      companyName: uniq(companies.map(c => c.companyName)),
      industries:  uniq(companies.map(c => c.industries)),
      contactPerson: uniq(companies.map(c => c.contactPerson)),
      area:    uniq(companies.map(c => c.area)),
      city:    uniq(companies.map(c => c.city)),
      state:   uniq(companies.map(c => c.state)),
      country: uniq(companies.map(c => c.country)),
    };
  }, [companies]);

  // ── fetch ──────────────────────────────────────────────────────────────────
  const fetchCompanies = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/companies`, { headers });
      setCompanies(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load companies');
    } finally {
      setLoading(false);
    }
  }, [headers]);

  useEffect(() => { fetchCompanies(); }, [fetchCompanies]);

  // Keep branchViewCompany in sync when companies list refreshes
  useEffect(() => {
    if (branchViewCompany) {
      const updated = companies.find(c => c._id === branchViewCompany._id);
      if (updated) setBranchViewCompany(updated);
    }
  }, [companies, branchViewCompany]);

  // ── Fetch pending requests ─────────────────────────────────────────────────
  const fetchPendingRequests = useCallback(async () => {
    setRequestsLoading(true);
    try {
      const res = await axios.get(`${API_BASE_URL}/company-requests/pending`, { headers });
      console.log('Pending requests fetched:', res.data.data);
      setPendingRequests(res.data.data || []);
    } catch (err) {
      console.error('Failed to fetch pending requests:', err);
    }
    finally { setRequestsLoading(false); }
  }, [headers]);

  useEffect(() => {
    fetchPendingRequests();
    // Poll every 15 seconds so admin sees new requests without refresh
    const interval = setInterval(fetchPendingRequests, 15000);
    return () => clearInterval(interval);
  }, [fetchPendingRequests]);

  // ── Open approve dialog — pre-fill the existing Create form ───────────────
  const openApproveDialog = (request) => {
    setApproveRequest(request);
    setEditCompany(null); // treat as new company
    setForm({
      companyName: request.companyName || '',
      industries: request.industries || '',
      companyAddress: request.companyAddress || '',
      area: request.area || '',
      city: request.city || '',
      state: request.state || '',
      country: request.country || '',
      pincode: request.pincode || '',
      contactPerson: request.contactPerson || '',
      contactPersonDesignation: request.contactPersonDesignation || '',
      contactNumber: request.contactNumber || '',
      email: request.email || '',
      contactPerson2: request.contactPerson2 || '',
      contactPerson2Designation: request.contactPerson2Designation || '',
      contactNumber2: request.contactNumber2 || '',
      email2: request.email2 || '',
      websiteUrl: request.websiteUrl || '',
      gpsLocation: request.gpsLocation || '',
      agreementStartDate: request.agreementStartDate ? request.agreementStartDate.slice(0, 10) : '',
      agreementEndDate: request.agreementEndDate ? request.agreementEndDate.slice(0, 10) : '',
      invoiceNumber: request.invoiceNumber || '',
      paymentMode: request.paymentMode || '',
      paymentRemark: request.paymentRemark || '',
      tokenAmount: request.tokenAmount != null ? String(request.tokenAmount) : '',
    });
    setFiles({ gstUpload: null, agreementUpload: null, tokenUpload: null, otherDocumentUpload: null });
    setFormErrors({});
    setDialogOpen(true);
  };

  // ── Reject request ─────────────────────────────────────────────────────────
  const handleRejectRequest = async () => {
    if (!rejectReason.trim()) { toast.error('Please provide a reason'); return; }
    setActionLoading(rejectDialog.request._id);
    try {
      await axios.post(`${API_BASE_URL}/company-requests/${rejectDialog.request._id}/reject`,
        { reason: rejectReason }, { headers });
      toast.success('Request rejected');
      setRejectDialog({ open: false, request: null });
      setRejectReason('');
      fetchPendingRequests();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Rejection failed');
    } finally {
      setActionLoading('');
    }
  };

  // ── dialog helpers ─────────────────────────────────────────────────────────
  const openCreate = () => {
    setEditCompany(null);
    setForm(emptyForm);
    setFiles(emptyFiles);
    setDialogOpen(true);
  };

  const openEdit = (company) => {
    setEditCompany(company);
    setForm({
      companyName: company.companyName || '',
      industries: company.industries || '',
      companyAddress: company.companyAddress || '',
      area: company.area || '',
      city: company.city || '',
      state: company.state || '',
      country: company.country || '',
      pincode: company.pincode || '',
      contactPerson: company.contactPerson || '',
      contactPersonDesignation: company.contactPersonDesignation || '',
      contactNumber: company.contactNumber || '',
      email: company.email || '',
      contactPerson2: company.contactPerson2 || '',
      contactPerson2Designation: company.contactPerson2Designation || '',
      contactNumber2: company.contactNumber2 || '',
      email2: company.email2 || '',
      websiteUrl: company.websiteUrl || '',
      gpsLocation: company.gpsLocation || '',
      agreementStartDate: company.agreementStartDate ? company.agreementStartDate.slice(0, 10) : '',
      agreementEndDate: company.agreementEndDate ? company.agreementEndDate.slice(0, 10) : '',
      invoiceNumber: company.invoiceNumber || '',
      paymentMode: company.paymentMode || '',
      paymentRemark: company.paymentRemark || '',
      tokenAmount: company.tokenAmount != null ? String(company.tokenAmount) : '',
    });
    setFiles(emptyFiles);
    setDialogOpen(true);
  };

  const closeDialog = () => { setDialogOpen(false); setEditCompany(null); setFormErrors({}); setApproveRequest(null); setDuplicateWarning(''); };

  const handleField = (e) => {
    setForm((p) => ({ ...p, [e.target.name]: e.target.value }));
    if (formErrors[e.target.name]) setFormErrors(p => ({ ...p, [e.target.name]: undefined }));
    // Check duplicate on company name change
    if (e.target.name === 'companyName') {
      const name = e.target.value.trim();
      if (name.length > 2) {
        const exists = companies.find(c =>
          c.companyName.toLowerCase() === name.toLowerCase() &&
          c._id !== editCompany?._id
        );
        setDuplicateWarning(exists ? `⚠️ Company "${name}" already exists (ID: ${exists.companyId})` : '');
      } else {
        setDuplicateWarning('');
      }
    }
  };
  const handleFile = (name, file) => {
    setFiles((p) => ({ ...p, [name]: file }));
    if (name === 'agreementUpload' && file) {
      setFormErrors(p => ({ ...p, agreementUpload: undefined }));
    }
  };

  // ── save ───────────────────────────────────────────────────────────────────
  const handleSave = async () => {
    const errs = validateCompanyForm(
      { ...form, _agreementFile: files.agreementUpload || editCompany?.agreementUpload || approveRequest?.agreementUpload },
      companies,
      editCompany?._id || (approveRequest ? 'exists' : null)
    );
    if (Object.keys(errs).length) { setFormErrors(errs); return; }

    setSaving(true);
    try {
      const fd = new FormData();
      Object.entries(form).forEach(([k, v]) => fd.append(k, v));
      Object.entries(files).forEach(([k, v]) => { if (v) fd.append(k, v); });

      if (approveRequest) {
        // Approve endpoint already creates the company internally — just call it with the edited form data
        await axios.post(
          `${API_BASE_URL}/company-requests/${approveRequest._id}/approve`,
          form,   // send edited form so admin's changes are used
          { headers }
        );
        toast.success(`✅ "${form.companyName}" approved and created!`);
        setApproveRequest(null);
        fetchPendingRequests();
      } else if (editCompany) {
        await axios.put(`${API_BASE_URL}/companies/${editCompany._id}`, fd, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Company updated');
      } else {
        await axios.post(`${API_BASE_URL}/companies`, fd, {
          headers: { ...headers, 'Content-Type': 'multipart/form-data' },
        });
        toast.success('Company created');
      }
      closeDialog();
      fetchCompanies();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  // ── delete ─────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    try {
      await axios.delete(`${API_BASE_URL}/companies/${deleteDialog.company._id}`, { headers });
      toast.success('Company deleted');
      setDeleteDialog({ open: false, company: null });
      fetchCompanies();
    } catch {
      toast.error('Delete failed');
    }
  };

  // ── branch handlers ────────────────────────────────────────────────────────
  const openAddBranch = (company) => {
    setBranchTargetCompany(company);
    setEditBranch(null);
    setBranchForm(emptyBranch);
    setBranchFiles(emptyBranchFiles);
    setBranchDialogOpen(true);
  };

  const openEditBranch = (company, branch) => {
    setBranchTargetCompany(company);
    setEditBranch(branch);
    setBranchForm({
      branchName: branch.branchName || '',
      branchAddress: branch.branchAddress || '',
      area: branch.area || '',
      city: branch.city || '',
      state: branch.state || '',
      country: branch.country || '',
      pincode: branch.pincode || '',
      contactPerson: branch.contactPerson || '',
      contactPersonDesignation: branch.contactPersonDesignation || '',
      contactNumber: branch.contactNumber || '',
      email: branch.email || '',
      contactPerson2: branch.contactPerson2 || '',
      contactPerson2Designation: branch.contactPerson2Designation || '',
      contactNumber2: branch.contactNumber2 || '',
      email2: branch.email2 || '',
      websiteUrl: branch.websiteUrl || '',
      gpsLocation: branch.gpsLocation || '',
      agreementStartDate: branch.agreementStartDate ? branch.agreementStartDate.slice(0, 10) : '',
      agreementEndDate: branch.agreementEndDate ? branch.agreementEndDate.slice(0, 10) : '',
      invoiceNumber: branch.invoiceNumber || '',
      paymentMode: branch.paymentMode || '',
      paymentRemark: branch.paymentRemark || '',
      tokenAmount: branch.tokenAmount != null ? String(branch.tokenAmount) : '',
    });
    setBranchFiles(emptyBranchFiles);
    setBranchDialogOpen(true);
  };

  const closeBranchDialog = () => {
    setBranchDialogOpen(false);
    setBranchTargetCompany(null);
    setEditBranch(null);
    setBranchFiles(emptyBranchFiles);
    setBranchFormErrors({});
  };

  const handleBranchSave = async () => {
    const errs = validateBranchForm(branchForm);
    if (Object.keys(errs).length) { setBranchFormErrors(errs); return; }

    setBranchSaving(true);
    const targetId = branchTargetCompany._id;
    try {
      const fd = new FormData();
      Object.entries(branchForm).forEach(([k, v]) => fd.append(k, v));
      Object.entries(branchFiles).forEach(([k, v]) => { if (v) fd.append(k, v); });

      if (editBranch) {
        await axios.put(
          `${API_BASE_URL}/companies/${targetId}/branches/${editBranch._id}`,
          fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Branch updated');
      } else {
        await axios.post(
          `${API_BASE_URL}/companies/${targetId}/branches`,
          fd, { headers: { ...headers, 'Content-Type': 'multipart/form-data' } }
        );
        toast.success('Branch added');
      }
      closeBranchDialog();
      const res = await axios.get(`${API_BASE_URL}/companies`, { headers });
      const fresh = res.data.data || [];
      setCompanies(fresh);
      const updated = fresh.find(c => c._id === targetId);
      if (updated) { setBranchViewCompany(updated); setBranchViewOpen(true); }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Branch save failed');
    } finally {
      setBranchSaving(false);
    }
  };

  const handleBranchDelete = async () => {
    const targetId = deleteBranchDialog.company._id;
    try {
      await axios.delete(
        `${API_BASE_URL}/companies/${targetId}/branches/${deleteBranchDialog.branch._id}`,
        { headers }
      );
      toast.success('Branch deleted');
      setDeleteBranchDialog({ open: false, company: null, branch: null });
      // Fetch fresh data then re-open view dialog
      const res = await axios.get(`${API_BASE_URL}/companies`, { headers });
      const fresh = res.data.data || [];
      setCompanies(fresh);
      const updated = fresh.find(c => c._id === targetId);
      if (updated) { setBranchViewCompany(updated); setBranchViewOpen(true); }
    } catch {
      toast.error('Branch delete failed');
    }
  };

  // ── Excel Handlers ─────────────────────────────────────────────────────────
  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          toast.error('Excel file is empty');
          return;
        }

        const errors = [];
        const duplicateNamesInExcel = new Set();

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // Header is row 1
          const rowErrors = [];

          // 1. Company Name validation (Required & database/excel duplicate check)
          const name = String(row.companyName || '').trim();
          if (!name) {
            rowErrors.push('Company name is required');
          } else {
            const dbExists = companies.some(c => c.companyName.trim().toLowerCase() === name.toLowerCase());
            if (dbExists) {
              rowErrors.push(`Company "${name}" already exists in the database`);
            }
            if (duplicateNamesInExcel.has(name.toLowerCase())) {
              rowErrors.push(`Duplicate company name "${name}" in the Excel file itself`);
            } else {
              duplicateNamesInExcel.add(name.toLowerCase());
            }
          }

          // 2. contactNumber (10-digit validation)
          const contactNo = row.contactNumber ? String(row.contactNumber).trim() : '';
          if (contactNo && !isValidPhone(contactNo)) {
            rowErrors.push('Contact Number must be a valid 10-digit phone number');
          }

          // 3. contactNumber2 (10-digit validation)
          const contactNo2 = row.contactNumber2 ? String(row.contactNumber2).trim() : '';
          if (contactNo2 && !isValidPhone(contactNo2)) {
            rowErrors.push('Contact Number 2 must be a valid 10-digit phone number');
          }

          // 4. email (Valid email check)
          const emailVal = row.email ? String(row.email).trim() : '';
          if (emailVal && !isValidEmail(emailVal)) {
            rowErrors.push('Email must be a valid email address');
          }

          // 5. websiteUrl (Valid URL format check)
          const webUrl = row.websiteUrl ? String(row.websiteUrl).trim() : '';
          if (webUrl && !isValidUrl(webUrl)) {
            rowErrors.push('Website URL must start with http://, https:// or www.');
          }

          // 6. gpsLocation (Valid GPS link format check)
          const gps = row.gpsLocation ? String(row.gpsLocation).trim() : '';
          if (gps && !isValidUrl(gps)) {
            rowErrors.push('GPS Location must start with http://, https:// or www.');
          }

          // 7. tokenAmount (Must be a numeric value)
          if (row.tokenAmount !== undefined && row.tokenAmount !== '') {
            if (isNaN(Number(row.tokenAmount))) {
              rowErrors.push('Token amount must be a number');
            }
          }

          if (rowErrors.length > 0) {
            errors.push({ row: rowNum, companyName: name || `Row ${rowNum}`, errors: rowErrors });
          }
        });

        if (errors.length > 0) {
          setExcelErrors(errors);
          setShowExcelErrorsDialog(true);
          setSelectedExcelFile(null);
        } else {
          setExcelErrors([]);
          setSelectedExcelFile(file);
          setShowConfirmDialog(true);
        }
      } catch (err) {
        toast.error('Failed to parse Excel file: ' + err.message);
      }
    };
    reader.readAsArrayBuffer(file);
    e.target.value = ''; // Reset input
  };

  const confirmExcelUpload = () => {
    if (!selectedExcelFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[sheetName];
      const jsonData = XLSX.utils.sheet_to_json(worksheet);

      if (jsonData.length === 0) {
        toast.error('Excel file is empty');
        setShowConfirmDialog(false);
        return;
      }

      setImporting(true);
      const loadingToastId = toast.loading('Importing companies...');

      try {
        const res = await axios.post(
          `${API_BASE_URL}/companies/bulk-import`,
          { companies: jsonData },
          { headers }
        );

        const { insertedCount, duplicateCount, skippedNames } = res.data;
        toast.update(loadingToastId, {
          render: `✅ Import complete! ${insertedCount} imported, ${duplicateCount} skipped.`,
          type: 'success',
          isLoading: false,
          autoClose: 5000,
        });

        if (skippedNames?.length > 0) {
          console.log('Skipped companies:', skippedNames);
        }

        fetchCompanies();
      } catch (err) {
        toast.update(loadingToastId, {
          render: `❌ Import failed: ${err.response?.data?.message || err.message}`,
          type: 'error',
          isLoading: false,
          autoClose: 5000,
        });
      } finally {
        setImporting(false);
        setShowConfirmDialog(false);
        setSelectedExcelFile(null);
      }
    };
    reader.readAsArrayBuffer(selectedExcelFile);
  };

  const handleTemplateDownload = () => {
    const headers = [
      'companyName', 'industries', 'companyAddress', 'area', 'city',
      'state', 'country', 'pincode',
      'contactPerson', 'contactPersonDesignation', 'contactNumber', 'email',
      'contactPerson2', 'contactPerson2Designation', 'contactNumber2', 'email2',
      'websiteUrl', 'gpsLocation',
      'agreementStartDate', 'agreementEndDate',
      'invoiceNumber', 'paymentMode', 'paymentRemark', 'tokenAmount'
    ];

    const sampleData = [
      {
        companyName: 'Example Corp',
        industries: 'IT, Software',
        companyAddress: '123 Business Park',
        area: 'Tech Zone',
        city: 'Mumbai',
        state: 'Maharashtra',
        country: 'India',
        pincode: '400001',
        contactPerson: 'John Doe',
        contactPersonDesignation: 'CEO',
        contactNumber: '9876543210',
        email: 'john@example.com',
        websiteUrl: 'https://example.com',
        gpsLocation: 'https://maps.google.com/?q=19.076,72.877',
        agreementStartDate: '2024-01-01',
        agreementEndDate: '2025-01-01',
        paymentMode: 'Bank',
        tokenAmount: 5000
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(sampleData, { header: headers });
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Companies');
    XLSX.writeFile(workbook, 'Company_Import_Template.xlsx');
  };

  // ── columns ────────────────────────────────────────────────────────────────
  const copyCompanyData = (row) => {
    const lines = [
      `Company ID   : ${row.companyId || '—'}`,
      `Company Name : ${row.companyName || '—'}`,
      `Industries   : ${row.industries || '—'}`,
      `Address      : ${row.companyAddress || '—'}`,
      `Area         : ${row.area || '—'}`,
      `City         : ${row.city || '—'}`,
      `State        : ${row.state || '—'}`,
      `Country      : ${row.country || '—'}`,
      `Pincode      : ${row.pincode || '—'}`,
      `Contact Person      : ${row.contactPerson || '—'}`,
      `Designation  : ${row.contactPersonDesignation || '—'}`,
      `Contact No.  : ${row.contactNumber || '—'}`,
      `Contact No.2 : ${row.contactNumber2 || '—'}`,
      `Email        : ${row.email || '—'}`,
      `Website      : ${row.websiteUrl || '—'}`,
      `GPS          : ${row.gpsLocation || '—'}`,
    ];
    navigator.clipboard.writeText(lines.join('\n'))
      .then(() => toast.success('Company data copied to clipboard!'))
      .catch(() => toast.error('Copy failed'));
  };

  const columns = [

    {
      field: 'actions', headerName: 'Actions', width: 200, sortable: false,
      renderCell: (p) => (
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          <Tooltip title="Copy Company Data">
            <IconButton size="small" onClick={() => copyCompanyData(p.row)}
              sx={{ bgcolor: '#e0f7fa', '&:hover': { bgcolor: '#b2ebf2' } }}>
              <ContentCopyIcon fontSize="small" sx={{ color: '#00838f' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Edit Company">
            <IconButton size="small" onClick={() => openEdit(p.row)}
              sx={{ bgcolor: '#e8eaf6', '&:hover': { bgcolor: '#c5cae9' } }}>
              <EditIcon fontSize="small" sx={{ color: '#3f51b5' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Add Branch">
            <IconButton size="small" onClick={() => openAddBranch(p.row)}
              sx={{ bgcolor: '#e8f5e9', '&:hover': { bgcolor: '#c8e6c9' } }}>
              <AddIcon fontSize="small" sx={{ color: '#388e3c' }} />
            </IconButton>
          </Tooltip>
          <Tooltip title="Delete Company">
            <IconButton size="small" onClick={() => setDeleteDialog({ open: true, company: p.row })}
              sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}>
              <DeleteIcon fontSize="small" sx={{ color: '#c62828' }} />
            </IconButton>
          </Tooltip>
        </Box>
      ),
    },

    {
      field: 'agreementUpload', headerName: 'Agreement', width: 100,
      renderCell: (p) => p.value
        ? <Tooltip title="View Agreement"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#388e3c' }} /></IconButton></Tooltip>
        : '—',
    },

    { field: 'companyId', headerName: 'ID', width: 80 },
    { field: 'companyName', headerName: 'Company Name', flex: 1.4, minWidth: 160 },
    {
      field: 'branches', headerName: 'Branches', width: 120,
      renderCell: (p) => {
        const count = p.value?.length || 0;
        return (
          <Chip
            label={`${count} branch${count !== 1 ? 'es' : ''}`}
            size="small"
            onClick={() => {
              setBranchViewCompany(p.row);
              setBranchViewOpen(true);
            }}
            sx={{
              bgcolor: count > 0 ? '#e8f5e9' : '#f5f5f5',
              color: count > 0 ? '#388e3c' : '#9e9e9e',
              fontWeight: 600, fontSize: '0.72rem',
              cursor: count > 0 ? 'pointer' : 'default',
              '&:hover': count > 0 ? { bgcolor: '#c8e6c9' } : {},
            }}
          />
        );
      },
    },
    { field: 'industries', headerName: 'Industries', flex: 1, minWidth: 130 },
    { field: 'companyAddress', headerName: 'Address', flex: 1.2, minWidth: 150 },
    { field: 'area', headerName: 'Area', flex: 0.8, minWidth: 100 },
    { field: 'city', headerName: 'City', flex: 0.8, minWidth: 100 },
    { field: 'state', headerName: 'State', flex: 0.8, minWidth: 100 },
    { field: 'country', headerName: 'Country', flex: 0.8, minWidth: 100 },
    { field: 'pincode', headerName: 'Pincode', width: 90 },
    { field: 'contactPerson', headerName: 'Contact Person', flex: 1, minWidth: 130 },
    { field: 'contactPersonDesignation', headerName: 'Designation', flex: 1, minWidth: 130 },
    { 
      field: 'contactNumber', headerName: 'Contact No.', flex: 1, minWidth: 130,
      renderCell: (p) => p.value ? String(p.value).replace(/\s/g, '') : '—'
    },
    { field: 'email', headerName: 'Email', flex: 1.2, minWidth: 160 },
    { field: 'contactPerson2', headerName: 'Contact Person 2', flex: 1, minWidth: 140 },
    { field: 'contactPerson2Designation', headerName: 'Designation 2', flex: 1, minWidth: 130 },
    { 
      field: 'contactNumber2', headerName: 'Contact No. 2', flex: 1, minWidth: 130,
      renderCell: (p) => p.value ? String(p.value).replace(/\s/g, '') : '—'
    },
    { field: 'email2', headerName: 'Email 2', flex: 1.2, minWidth: 160 },
    {
      field: 'websiteUrl', headerName: 'Website', flex: 1, minWidth: 130,
      renderCell: (p) => p.value
        ? <a href={p.value.startsWith('http') ? p.value : `https://${p.value}`} target="_blank" rel="noreferrer"
          style={{ color: '#3f51b5', fontSize: '0.82rem' }}>{p.value}</a>
        : '—',
    },
    {
      field: 'gpsLocation', headerName: 'GPS', width: 80,
      renderCell: (p) => p.value
        ? <Tooltip title="Open GPS"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><LocationOnIcon fontSize="small" sx={{ color: '#3f51b5' }} /></IconButton></Tooltip>
        : '—',
    },
    {
      field: 'gstUpload', headerName: 'GST', width: 80,
      renderCell: (p) => p.value
        ? <Tooltip title="View GST"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#3f51b5' }} /></IconButton></Tooltip>
        : '—',
    },

    {
      field: 'otherDocumentUpload', headerName: 'Other Doc', width: 90,
      renderCell: (p) => p.value
        ? <Tooltip title="View Other Document"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#7c3aed' }} /></IconButton></Tooltip>
        : '—',
    },
    { field: 'invoiceNumber', headerName: 'Invoice No.', width: 130 },
    {
      field: 'tokenAmount', headerName: 'Token ₹', width: 100,
      renderCell: (p) => p.value != null ? `₹${p.value}` : '—',
    },
    {
      field: 'paymentMode', headerName: 'Pay Mode', width: 110,
      renderCell: (p) => {
        if (!p.value) return '—';
        const map = { Cash: '💵 Cash', Bank: '🏦 Bank', Other: '📋 Other' };
        return map[p.value] || p.value;
      },
    },
    {
      field: 'paymentRemark', headerName: 'Pay Remark', width: 140,
      renderCell: (p) => p.value || '—',
    },

    {
      field: 'tokenUpload', headerName: 'Token Doc', width: 100,
      renderCell: (p) => p.value
        ? <Tooltip title="View Token Doc"><IconButton size="small" onClick={() => window.open(p.value, '_blank')}><VisibilityIcon fontSize="small" sx={{ color: '#f57c00' }} /></IconButton></Tooltip>
        : '—',
    },
    {
      field: 'createdAt', headerName: 'Created At', width: 150,
      renderCell: (p) => p.value
        ? new Date(p.value).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
        : '—',
    },
    {
      field: 'createdBy', headerName: 'Created By', width: 150,
      renderCell: (p) => {
        const u = p.value;
        if (!u) return '—';
        return `${u.firstName || ''} ${u.lastName || ''}`.trim() || u.email || '—';
      },
    },

  ];

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', height: '100vh', bgcolor: '#f0f2f8', overflow: 'hidden' }}>
      {/* Sidebar */}
      <Box sx={{ position: 'fixed', left: 0, top: 0, height: '100vh', zIndex: 1000 }}>
        <Sidebar />
      </Box>

      {/* Main */}
      <Box sx={{ flexGrow: 1, ml: '260px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>

          {/* Header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #1e1e2f 0%, #2d2d44 60%, #3f3f5c 100%)',
            borderRadius: '16px', p: 3, mb: 3,
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 32px rgba(0,0,0,0.25)',
          }}>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ width: 52, height: 52, borderRadius: '14px', bgcolor: 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <BusinessIcon sx={{ color: '#FFD700', fontSize: 28 }} />
              </Box>
              <Box>
                <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.3px">
                  Company Management
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.6)', mt: 0.3 }}>
                  Create and manage client companies
                </Typography>
              </Box>
            </Box>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ bgcolor: 'rgba(255,215,0,0.15)', border: '2px solid rgba(255,215,0,0.4)', borderRadius: '12px', px: 2.5, py: 1, textAlign: 'center' }}>
                <Typography sx={{ fontSize: '1.4rem', fontWeight: 800, color: '#FFD700', lineHeight: 1 }}>{companies.length}</Typography>
                <Typography sx={{ fontSize: '0.68rem', color: 'rgba(255,255,255,0.7)', fontWeight: 600, mt: 0.2 }}>Companies</Typography>
              </Box>

              <Tooltip title="Download Excel Template">
                <Button variant="outlined" onClick={handleTemplateDownload}
                  sx={{ borderColor: 'rgba(255,255,255,0.3)', color: '#fff', fontWeight: 600, borderRadius: '10px', px: 2, '&:hover': { borderColor: '#FFD700', bgcolor: 'rgba(255,215,0,0.05)' } }}>
                  Template
                </Button>
              </Tooltip>

              <input type="file" accept=".xlsx, .xls" id="excel-upload" style={{ display: 'none' }} onChange={handleExcelUpload} />
              <label htmlFor="excel-upload">
                <Button variant="contained" component="span" startIcon={<CloudUploadIcon />}
                  sx={{ bgcolor: '#4caf50', color: '#fff', fontWeight: 700, borderRadius: '10px', px: 2.5, '&:hover': { bgcolor: '#43a047' }, boxShadow: '0 4px 12px rgba(76,175,80,0.35)' }}>
                  Import Excel
                </Button>
              </label>

              <Button variant="contained" startIcon={<AddIcon />} onClick={openCreate}
                sx={{ bgcolor: '#FFD700', color: '#1e1e2f', fontWeight: 700, borderRadius: '10px', px: 2.5, '&:hover': { bgcolor: '#f6b93b' }, boxShadow: '0 4px 12px rgba(255,215,0,0.35)' }}>
                New Company
              </Button>
              {/* Pending Requests button — always visible */}
              <Button
                variant="contained"
                startIcon={<NotificationsActiveIcon />}
                onClick={() => setRequestsDialogOpen(true)}
                sx={{
                  bgcolor: pendingRequests.length > 0 ? '#ff9800' : 'rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 2.5,
                  border: pendingRequests.length > 0 ? 'none' : '1px solid rgba(255,255,255,0.3)',
                  '&:hover': { bgcolor: pendingRequests.length > 0 ? '#f57c00' : 'rgba(255,255,255,0.25)' },
                  boxShadow: pendingRequests.length > 0 ? '0 4px 12px rgba(255,152,0,0.5)' : 'none',
                  ...(pendingRequests.length > 0 && {
                    animation: 'pulse 2s infinite',
                    '@keyframes pulse': {
                      '0%': { boxShadow: '0 4px 12px rgba(255,152,0,0.4)' },
                      '50%': { boxShadow: '0 4px 24px rgba(255,152,0,0.9)' },
                      '100%': { boxShadow: '0 4px 12px rgba(255,152,0,0.4)' },
                    },
                  }),
                }}
              >
                {requestsLoading
                  ? 'Loading...'
                  : pendingRequests.length > 0
                    ? `${pendingRequests.length} Pending Request${pendingRequests.length > 1 ? 's' : ''}`
                    : 'No Pending Requests'}
              </Button>
            </Box>
          </Box>

          {/* ── Filters Section ── */}
          <Paper sx={{ 
            p: 1.5, mb: 2, borderRadius: '16px', 
            boxShadow: '0 4px 20px rgba(0,0,0,0.05)', 
            border: '1px solid #e8eaf6',
            background: '#fff'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'nowrap' }}>
              {/* Label */}
              <Box display="flex" alignItems="center" gap={1} sx={{ flexShrink: 0 }}>
                <Box sx={{ width: 4, height: 16, bgcolor: '#3f51b5', borderRadius: 2 }} />
                <Typography variant="caption" fontWeight={800} color="#3f51b5" textTransform="uppercase" letterSpacing="0.05em" sx={{ whiteSpace: 'nowrap', fontSize: '0.7rem' }}>
                  Filters
                </Typography>
              </Box>

              {/* All filter fields in one row - more compact */}
              <Box sx={{ display: 'flex', gap: 1, flex: 1, flexWrap: 'nowrap', alignItems: 'center' }}>

                {/* Company Name */}
                <Autocomplete
                  freeSolo size="small" options={filterOptions.companyName}
                  inputValue={filters.companyName}
                  onInputChange={(_, v) => setFilters(p => ({ ...p, companyName: v ?? '' }))}
                  sx={{ flex: 1, minWidth: 100 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Company" placeholder="Name..."
                      sx={{ ...fieldSx }} />
                  )}
                />

                {/* Industry */}
                <Autocomplete
                  freeSolo size="small" options={filterOptions.industries}
                  inputValue={filters.industries}
                  onInputChange={(_, v) => setFilters(p => ({ ...p, industries: v ?? '' }))}
                  sx={{ flex: 0.8, minWidth: 90 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Industry" placeholder="Industry..."
                      sx={{ ...fieldSx }} />
                  )}
                />

                {/* Contact Person */}
                <Autocomplete
                  freeSolo size="small" options={filterOptions.contactPerson}
                  inputValue={filters.contactPerson}
                  onInputChange={(_, v) => setFilters(p => ({ ...p, contactPerson: v ?? '' }))}
                  sx={{ flex: 1, minWidth: 100 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Contact" placeholder="Person..."
                      sx={{ ...fieldSx }} />
                  )}
                />

                {/* Mobile — plain TextField (no dropdown needed for numbers) */}
                <TextField
                  label="Mobile"
                  name="contactNumber"
                  value={filters.contactNumber}
                  onChange={(e) => {
                    const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                    handleFilterChange({ target: { name: 'contactNumber', value: v } });
                  }}
                  size="small"
                  sx={{ ...fieldSx, flex: 0.8, minWidth: 90 }}
                  placeholder="Mobile..."
                  inputProps={{ maxLength: 10 }}
                />

                {/* Area */}
                <Autocomplete
                  freeSolo size="small" options={filterOptions.area}
                  inputValue={filters.area}
                  onInputChange={(_, v) => setFilters(p => ({ ...p, area: v ?? '' }))}
                  sx={{ flex: 0.7, minWidth: 80 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Area" placeholder="Area..."
                      sx={{ ...fieldSx }} />
                  )}
                />

                {/* City */}
                <Autocomplete
                  freeSolo size="small" options={filterOptions.city}
                  inputValue={filters.city}
                  onInputChange={(_, v) => setFilters(p => ({ ...p, city: v ?? '' }))}
                  sx={{ flex: 0.7, minWidth: 80 }}
                  renderInput={(params) => (
                    <TextField {...params} label="City" placeholder="City..."
                      sx={{ ...fieldSx }} />
                  )}
                />

                {/* State */}
                <Autocomplete
                  freeSolo size="small" options={filterOptions.state}
                  inputValue={filters.state}
                  onInputChange={(_, v) => setFilters(p => ({ ...p, state: v ?? '' }))}
                  sx={{ flex: 0.7, minWidth: 80 }}
                  renderInput={(params) => (
                    <TextField {...params} label="State" placeholder="State..."
                      sx={{ ...fieldSx }} />
                  )}
                />

                {/* Country */}
                <Autocomplete
                  freeSolo size="small" options={filterOptions.country}
                  inputValue={filters.country}
                  onInputChange={(_, v) => setFilters(p => ({ ...p, country: v ?? '' }))}
                  sx={{ flex: 0.8, minWidth: 85 }}
                  renderInput={(params) => (
                    <TextField {...params} label="Country" placeholder="Country..."
                      sx={{ ...fieldSx }} />
                  )}
                />

              </Box>

              {/* Clear button */}
              <Button
                size="small"
                onClick={clearFilters}
                startIcon={<CloseIcon fontSize="small" />}
                sx={{
                  flexShrink: 0,
                  color: '#64748b', fontWeight: 600, textTransform: 'none', fontSize: '0.75rem',
                  '&:hover': { color: '#ef4444', bgcolor: '#fff1f2' },
                  borderRadius: '8px', whiteSpace: 'nowrap', px: 1.5, py: 0.5,
                }}
              >
                Clear
              </Button>
            </Box>
          </Paper>

          {/* ── Pending Requests Dialog ── */}
          <Dialog
            open={requestsDialogOpen}
            onClose={() => setRequestsDialogOpen(false)}
            maxWidth="md"
            fullWidth
            PaperProps={{ sx: { borderRadius: 3 } }}
          >
            <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#fff8e1', borderBottom: '1px solid #ffe082' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <NotificationsActiveIcon sx={{ color: '#f57c00' }} />
                <Typography variant="subtitle1" fontWeight={700} color="#e65100">
                  {pendingRequests.length} Company Request{pendingRequests.length !== 1 ? 's' : ''} Awaiting Approval
                </Typography>
              </Box>
              <IconButton onClick={() => setRequestsDialogOpen(false)} size="small">
                <CloseIcon />
              </IconButton>
            </DialogTitle>
            <DialogContent sx={{ p: 3, bgcolor: '#fbfbfb', minHeight: '200px' }}>
              {pendingRequests.length === 0 ? (
                <Typography color="text.secondary" textAlign="center" mt={4}>No pending requests at the moment.</Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {pendingRequests.map(req => (
                    <Box key={req._id} sx={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      p: 2, bgcolor: '#fff', borderRadius: '10px', border: '1px solid #e0e0e0',
                      boxShadow: '0 2px 8px rgba(0,0,0,0.04)'
                    }}>
                      <Box>
                        <Typography variant="body1" fontWeight={700} color="#1e293b">{req.companyName}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5 }}>
                          {req.industries && `${req.industries} · `}
                          {req.city && `${req.city} · `}
                          Requested by <strong>{req.requestedBy?.firstName} {req.requestedBy?.lastName}</strong>
                        </Typography>
                      </Box>
                      <Box display="flex" gap={1}>
                        <Tooltip title="Review & Approve">
                          <Button size="small" variant="contained" startIcon={<CheckCircleIcon />}
                            onClick={() => { setRequestsDialogOpen(false); openApproveDialog(req); }}
                            sx={{ borderRadius: '8px', bgcolor: '#388e3c', '&:hover': { bgcolor: '#2e7d32' }, textTransform: 'none', fontWeight: 700, fontSize: '0.75rem' }}>
                            Review
                          </Button>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <Button size="small" variant="outlined" startIcon={<CancelIcon />}
                            onClick={() => { setRequestsDialogOpen(false); setRejectDialog({ open: true, request: req }); setRejectReason(''); }}
                            sx={{ borderRadius: '8px', borderColor: '#c62828', color: '#c62828', textTransform: 'none', fontWeight: 700, fontSize: '0.75rem', '&:hover': { bgcolor: '#ffebee' } }}>
                            Reject
                          </Button>
                        </Tooltip>
                      </Box>
                    </Box>
                  ))}
                </Box>
              )}
            </DialogContent>
          </Dialog>

          {/* DataGrid */}
          <Box sx={{ bgcolor: '#fff', border: '1px solid #e8eaf6', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 20px rgba(63,81,181,0.08)', height: 'calc(100vh - 180px)' }}>
            <Box sx={{ px: 3, py: 1.5, background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '1px solid #c5cae9', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#3f51b5', borderRadius: 2 }} />
                <Typography variant="subtitle2" fontWeight={700} color="#3f51b5" textTransform="uppercase" letterSpacing="0.06em">
                  All Companies
                </Typography>
              </Box>
              <Chip label={`${filteredCompanies.length} records found`} size="small" sx={{ bgcolor: '#e8eaf6', color: '#3f51b5', fontWeight: 700, fontSize: '0.75rem' }} />
            </Box>
            <DataGrid
              rows={filteredCompanies}
              columns={columns}
              getRowId={(r) => r._id}
              loading={loading}
              rowHeight={38}
              pageSizeOptions={[50, 100, 200]}
              initialState={{ pagination: { paginationModel: { pageSize: 100 } } }}
              disableRowSelectionOnClick
              sx={{
                border: 'none',
                height: 'calc(100% - 52px)',
                '& .MuiDataGrid-columnHeaders': { background: 'linear-gradient(135deg, #e8eaf6, #f3f4fd)', borderBottom: '2px solid #c5cae9' },
                '& .MuiDataGrid-columnHeaderTitle': { fontWeight: 700, color: '#3f51b5', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '0.04em' },
                '& .MuiDataGrid-cell': { borderBottom: '1px solid #f0f2ff', fontSize: '0.82rem', color: '#334155', '&:focus': { outline: 'none' } },
                '& .MuiDataGrid-row:hover': { bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-footerContainer': { borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff' },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar': { height: 7, width: 7 },
                '& .MuiDataGrid-virtualScroller::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 4 },
              }}
            />
          </Box>
        </Box>
      </Box>

      {/* ── Create / Edit Dialog ── */}
      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="lg"
        PaperProps={{
          sx: {
            borderRadius: 3,
            overflow: 'hidden',
            maxHeight: '92vh',
            display: 'flex',
            flexDirection: 'column',
          },
        }}
      >
        {/* Header */}
        <Box sx={{
          background: 'linear-gradient(135deg, #1e1e2f, #33334d)',
          px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              width: 44, height: 44, borderRadius: '12px',
              background: 'rgba(255, 215, 0, 0.15)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
            }}>
              <BusinessIcon sx={{ color: '#FFD700', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#fff" sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                {approveRequest ? 'Review & Approve' : editCompany ? 'Edit Company Profile' : 'Register New Company'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.6)', fontWeight: 500 }}>
                {approveRequest
                  ? `Requested by ${approveRequest.requestedBy?.firstName || ''} ${approveRequest.requestedBy?.lastName || ''}`
                  : editCompany
                    ? `Update details for ID: ${editCompany.companyId}`
                    : 'System will assign ID starting from 1001'}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={closeDialog} size="small" sx={{ 
            color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', 
            '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' } 
          }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        {/* Scrollable body */}
        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 3, pt: 3, pb: 1, bgcolor: '#fcfdff' }}>
          <Grid container spacing={3}>

            {/* ── Section 1: Basic Information ── */}
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#3f51b5', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Basic Information
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Company Name *" name="companyName" value={form.companyName}
                onChange={handleField} fullWidth size="small" sx={fieldSx}
                error={!!formErrors.companyName || !!duplicateWarning}
                helperText={formErrors.companyName || duplicateWarning || ''}
                InputProps={{
                  endAdornment: duplicateWarning ? (
                    <InputAdornment position="end">
                      <Tooltip title={duplicateWarning}>
                        <span style={{ color: '#f57c00', fontSize: '1.1rem', cursor: 'default' }}>⚠️</span>
                      </Tooltip>
                    </InputAdornment>
                  ) : null,
                }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Industries" name="industries" value={form.industries} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Company Address" name="companyAddress" value={form.companyAddress} onChange={handleField} fullWidth size="small" sx={fieldSx}
                multiline rows={3} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Area" name="area" value={form.area} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="City" name="city" value={form.city} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="State" name="state" value={form.state} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Country" name="country" value={form.country} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Pincode" name="pincode" value={form.pincode}
                onChange={e => setForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                fullWidth size="small" sx={fieldSx} inputProps={{ maxLength: 6 }} />
            </Grid>

            <Grid item xs={12} sm={4}>
              <TextField
                label="GPS Location Link" name="gpsLocation" value={form.gpsLocation}
                onChange={handleField} fullWidth size="small" sx={fieldSx}
                error={!!formErrors.gpsLocation} helperText={formErrors.gpsLocation}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                label="Website URL" name="websiteUrl" value={form.websiteUrl}
                onChange={handleField} fullWidth size="small" sx={fieldSx}
                error={!!formErrors.websiteUrl} helperText={formErrors.websiteUrl}
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: '#9fa8da', fontSize: '1rem' }}>🌐</InputAdornment> }}
              />
            </Grid>

            {/* ── Section 2: Contact Details ── */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#0891b2', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Contact Details
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person Name" name="contactPerson" value={form.contactPerson} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person Designation" name="contactPersonDesignation" value={form.contactPersonDesignation} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Number" name="contactNumber" value={form.contactNumber}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleField({ target: { name: 'contactNumber', value: v } });
                }}
                fullWidth size="small" sx={fieldSx}
                inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                error={!!formErrors.contactNumber}
                helperText={formErrors.contactNumber || '10-digit number'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email" name="email" type="email" value={form.email}
                onChange={handleField} fullWidth size="small" sx={fieldSx}
                error={!!formErrors.email} helperText={formErrors.email}
              />
            </Grid>

            {/* ── Contact Person 2 ── */}
            <Grid item xs={12} sx={{ mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 3, height: 14, bgcolor: '#0891b2', borderRadius: 2, opacity: 0.6 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.8 }}>
                  Contact Person 2 (Optional)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person 2 Name" name="contactPerson2" value={form.contactPerson2} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person 2 Designation" name="contactPerson2Designation" value={form.contactPerson2Designation} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Contact Number 2" name="contactNumber2" value={form.contactNumber2}
                onChange={(e) => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  handleField({ target: { name: 'contactNumber2', value: v } });
                }}
                fullWidth size="small" sx={fieldSx}
                inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                helperText="10-digit number (optional)"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email 2" name="email2" type="email" value={form.email2} onChange={handleField} fullWidth size="small" sx={fieldSx} />
            </Grid>

            {/* ── Section 3: Documents ── */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#7c3aed', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Documents & Agreement
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={4}>
              <FileUploadField label="GST Upload" fieldName="gstUpload" file={files.gstUpload} existingUrl={editCompany?.gstUpload || approveRequest?.gstUpload} onChange={handleFile} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FileUploadField label="Signed Agreement Upload *" fieldName="agreementUpload" file={files.agreementUpload} existingUrl={editCompany?.agreementUpload || approveRequest?.agreementUpload} onChange={handleFile} />
              {formErrors.agreementUpload && (
                <Typography variant="caption" color="error" sx={{ mt: 0.5, display: 'block', pl: 0.5 }}>
                  {formErrors.agreementUpload}
                </Typography>
              )}
            </Grid>
            <Grid item xs={12} sm={4}>
              <FileUploadField label="Other Document Upload" fieldName="otherDocumentUpload" file={files.otherDocumentUpload} existingUrl={editCompany?.otherDocumentUpload || approveRequest?.otherDocumentUpload} onChange={handleFile} />
            </Grid>
            {/* Agreement dates */}
            <Grid item xs={12} sm={6}>
              <TextField
                label="Agreement Start Date" name="agreementStartDate" type="date"
                value={form.agreementStartDate} onChange={handleField}
                fullWidth size="small" sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Agreement End Date" name="agreementEndDate" type="date"
                value={form.agreementEndDate} onChange={handleField}
                fullWidth size="small" sx={fieldSx}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>

            {/* ── Section 4: Payment ── */}
            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#059669', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Payment Information
                </Typography>
              </Box>
            </Grid>

            <Grid item xs={12} sm={6}>
              <TextField
                label="Invoice Number" name="invoiceNumber" value={form.invoiceNumber}
                onChange={handleField} fullWidth size="small" sx={fieldSx}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Token Amount (₹)" name="tokenAmount" value={form.tokenAmount}
                onChange={(e) => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) handleField(e); }}
                fullWidth size="small" sx={fieldSx}
                inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
                error={!!formErrors.tokenAmount}
                helperText={formErrors.tokenAmount || 'Numbers only — leave blank if not applicable'}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  label="Payment Mode"
                  name="paymentMode"
                  value={form.paymentMode}
                  onChange={(e) => {
                    handleField(e);
                    // clear remark when switching mode
                    setForm(p => ({ ...p, paymentMode: e.target.value, paymentRemark: '' }));
                  }}
                >
                  <MenuItem value="">— Select —</MenuItem>
                  <MenuItem value="Cash">💵 Cash</MenuItem>
                  <MenuItem value="Bank">🏦 Bank</MenuItem>
                  <MenuItem value="Other">📋 Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {/* Cash or Other → show remark */}
            {(form.paymentMode === 'Cash' || form.paymentMode === 'Other') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label={form.paymentMode === 'Cash' ? 'Cash Remark' : 'Other Remark'}
                  name="paymentRemark" value={form.paymentRemark}
                  onChange={handleField} fullWidth size="small" sx={fieldSx}
                  placeholder={form.paymentMode === 'Cash' ? 'e.g. Received in hand' : 'e.g. Cheque / DD'}
                />
              </Grid>
            )}
            {/* Bank → show token upload */}
            {form.paymentMode === 'Bank' && (
              <Grid item xs={12} sm={6}>
                <FileUploadField label="Token Payment Upload" fieldName="tokenUpload" file={files.tokenUpload} existingUrl={editCompany?.tokenUpload || approveRequest?.tokenUpload} onChange={handleFile} />
              </Grid>
            )}

          </Grid>
        </Box>

        {/* Footer */}
        <Box sx={{
          px: 3, py: 2,
          display: 'flex', justifyContent: 'flex-end', gap: 1.5,
          borderTop: '1px solid #e8eaf6',
          bgcolor: '#f8f9ff',
          flexShrink: 0,
        }}>
          <Button
            onClick={closeDialog}
            variant="outlined"
            sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={saving}
            sx={{
              borderRadius: '8px',
              bgcolor: '#FFD700',
              color: '#1e1e2f',
              fontWeight: 700,
              '&:hover': { bgcolor: '#f6b93b' },
              minWidth: 140,
            }}
          >
            {saving
              ? <CircularProgress size={20} sx={{ color: '#1e1e2f' }} />
              : approveRequest ? 'Approve & Create' : (editCompany ? 'Save Changes' : 'Create Company')}
          </Button>
        </Box>
      </Dialog>

      {/* ── Delete Confirm ── */}
      <Dialog open={deleteDialog.open} onClose={() => setDeleteDialog({ open: false, company: null })} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Delete Company</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>{deleteDialog.company?.companyName}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteDialog({ open: false, company: null })} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleDelete} variant="contained" color="error" sx={{ borderRadius: '8px', fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ── Branch Create / Edit Dialog ── */}
      <Dialog
        open={branchDialogOpen}
        onClose={closeBranchDialog}
        fullWidth maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden', maxHeight: '92vh', display: 'flex', flexDirection: 'column' } }}
      >
        <Box sx={{
          background: 'linear-gradient(135deg, #1e1e2f, #33334d)',
          px: 3, py: 2.5,
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          flexShrink: 0
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{
              width: 42, height: 42, borderRadius: '12px',
              bgcolor: 'rgba(255,215,0,0.12)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <BusinessIcon sx={{ color: '#FFD700', fontSize: 22 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={800} color="#fff" sx={{ letterSpacing: '-0.01em', lineHeight: 1.2 }}>
                {editBranch ? 'Update Branch Details' : 'Add New Branch Location'}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)' }}>
                {branchTargetCompany?.companyName} &bull; ID: {branchTargetCompany?.companyId}
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={closeBranchDialog} size="small" sx={{
            color: '#fff', bgcolor: 'rgba(255,255,255,0.06)',
            '&:hover': { bgcolor: 'rgba(255,255,255,0.18)' }
          }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ overflowY: 'auto', flexGrow: 1, px: 3, pt: 3, pb: 1, bgcolor: '#fcfdff' }}>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#3f51b5', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Branch Basic Information
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Branch Name *" value={branchForm.branchName}
                onChange={e => { setBranchForm(p => ({ ...p, branchName: e.target.value })); if (branchFormErrors.branchName) setBranchFormErrors(p => ({ ...p, branchName: undefined })); }}
                fullWidth size="small" sx={fieldSx} error={!!branchFormErrors.branchName} helperText={branchFormErrors.branchName} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Website URL" value={branchForm.websiteUrl}
                onChange={e => setBranchForm(p => ({ ...p, websiteUrl: e.target.value }))}
                fullWidth size="small" sx={fieldSx}
                InputProps={{ startAdornment: <InputAdornment position="start" sx={{ color: '#9fa8da', fontSize: '1rem' }}>🌐</InputAdornment> }} />
            </Grid>
            <Grid item xs={12}>
              <TextField label="Branch Address" value={branchForm.branchAddress}
                onChange={e => setBranchForm(p => ({ ...p, branchAddress: e.target.value }))}
                fullWidth size="small" sx={fieldSx} multiline rows={3} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Area" value={branchForm.area}
                onChange={e => setBranchForm(p => ({ ...p, area: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="City" value={branchForm.city}
                onChange={e => setBranchForm(p => ({ ...p, city: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="State" value={branchForm.state}
                onChange={e => setBranchForm(p => ({ ...p, state: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Country" value={branchForm.country}
                onChange={e => setBranchForm(p => ({ ...p, country: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="Pincode" value={branchForm.pincode}
                onChange={e => setBranchForm(p => ({ ...p, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                fullWidth size="small" sx={fieldSx} inputProps={{ maxLength: 6 }} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField label="GPS Location Link" value={branchForm.gpsLocation}
                onChange={e => { setBranchForm(p => ({ ...p, gpsLocation: e.target.value })); if (branchFormErrors.gpsLocation) setBranchFormErrors(p => ({ ...p, gpsLocation: undefined })); }}
                fullWidth size="small" sx={fieldSx}
                error={!!branchFormErrors.gpsLocation} helperText={branchFormErrors.gpsLocation}
                InputProps={{ startAdornment: <InputAdornment position="start"><LocationOnIcon fontSize="small" sx={{ color: '#9fa8da' }} /></InputAdornment> }} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#0891b2', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Branch Contact Details
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person Name" value={branchForm.contactPerson}
                onChange={e => setBranchForm(p => ({ ...p, contactPerson: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person Designation" value={branchForm.contactPersonDesignation}
                onChange={e => setBranchForm(p => ({ ...p, contactPersonDesignation: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Number" value={branchForm.contactNumber}
                onChange={e => {
                  const v = e.target.value.replace(/\D/g, '').slice(0, 10);
                  setBranchForm(p => ({ ...p, contactNumber: v }));
                  if (branchFormErrors.contactNumber) setBranchFormErrors(p => ({ ...p, contactNumber: undefined }));
                }}
                fullWidth size="small" sx={fieldSx}
                inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                error={!!branchFormErrors.contactNumber} helperText={branchFormErrors.contactNumber || '10-digit number'} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email" type="email" value={branchForm.email}
                onChange={e => { setBranchForm(p => ({ ...p, email: e.target.value })); if (branchFormErrors.email) setBranchFormErrors(p => ({ ...p, email: undefined })); }}
                fullWidth size="small" sx={fieldSx}
                error={!!branchFormErrors.email} helperText={branchFormErrors.email} />
            </Grid>

            {/* ── Contact Person 2 ── */}
            <Grid item xs={12} sx={{ mt: 0.5 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                <Box sx={{ width: 3, height: 14, bgcolor: '#0891b2', borderRadius: 2, opacity: 0.6 }} />
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em', opacity: 0.8 }}>
                  Contact Person 2 (Optional)
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person 2 Name" value={branchForm.contactPerson2 || ''}
                onChange={e => setBranchForm(p => ({ ...p, contactPerson2: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Person 2 Designation" value={branchForm.contactPerson2Designation || ''}
                onChange={e => setBranchForm(p => ({ ...p, contactPerson2Designation: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Contact Number 2" value={branchForm.contactNumber2 || ''}
                onChange={e => setBranchForm(p => ({ ...p, contactNumber2: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                fullWidth size="small" sx={fieldSx}
                inputProps={{ inputMode: 'numeric', maxLength: 10 }}
                helperText="10-digit number (optional)" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Email 2" type="email" value={branchForm.email2 || ''}
                onChange={e => setBranchForm(p => ({ ...p, email2: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#7c3aed', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Branch Documents & Agreement
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={4}>
              <FileUploadField label="GST Upload" fieldName="gstUpload" file={branchFiles.gstUpload} existingUrl={editBranch?.gstUpload} onChange={(n, f) => setBranchFiles(p => ({ ...p, [n]: f }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FileUploadField label="Signed Agreement Upload" fieldName="agreementUpload" file={branchFiles.agreementUpload} existingUrl={editBranch?.agreementUpload} onChange={(n, f) => setBranchFiles(p => ({ ...p, [n]: f }))} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FileUploadField label="Other Document Upload" fieldName="otherDocumentUpload" file={branchFiles.otherDocumentUpload} existingUrl={editBranch?.otherDocumentUpload} onChange={(n, f) => setBranchFiles(p => ({ ...p, [n]: f }))} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Agreement Start Date" type="date" value={branchForm.agreementStartDate}
                onChange={e => setBranchForm(p => ({ ...p, agreementStartDate: e.target.value }))}
                fullWidth size="small" sx={fieldSx} InputLabelProps={{ shrink: true }} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Agreement End Date" type="date" value={branchForm.agreementEndDate}
                onChange={e => setBranchForm(p => ({ ...p, agreementEndDate: e.target.value }))}
                fullWidth size="small" sx={fieldSx} InputLabelProps={{ shrink: true }} />
            </Grid>

            <Grid item xs={12} sx={{ mt: 1 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                <Box sx={{ width: 4, height: 18, bgcolor: '#059669', borderRadius: '4px' }} />
                <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#1e293b', textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.05em' }}>
                  Branch Payment Information
                </Typography>
              </Box>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Invoice Number" value={branchForm.invoiceNumber}
                onChange={e => setBranchForm(p => ({ ...p, invoiceNumber: e.target.value }))}
                fullWidth size="small" sx={fieldSx} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Token Amount (₹)" value={branchForm.tokenAmount}
                onChange={e => { const v = e.target.value; if (v === '' || /^\d+$/.test(v)) setBranchForm(p => ({ ...p, tokenAmount: v })); }}
                fullWidth size="small" sx={fieldSx} inputProps={{ inputMode: 'numeric' }}
                helperText="Numbers only — optional" />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth size="small" sx={fieldSx}>
                <InputLabel>Payment Mode</InputLabel>
                <Select
                  label="Payment Mode"
                  value={branchForm.paymentMode}
                  onChange={e => setBranchForm(p => ({ ...p, paymentMode: e.target.value, paymentRemark: '' }))}
                >
                  <MenuItem value="">— Select —</MenuItem>
                  <MenuItem value="Cash">💵 Cash</MenuItem>
                  <MenuItem value="Bank">🏦 Bank</MenuItem>
                  <MenuItem value="Other">📋 Other</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            {(branchForm.paymentMode === 'Cash' || branchForm.paymentMode === 'Other') && (
              <Grid item xs={12} sm={6}>
                <TextField
                  label={branchForm.paymentMode === 'Cash' ? 'Cash Remark' : 'Other Remark'}
                  value={branchForm.paymentRemark}
                  onChange={e => setBranchForm(p => ({ ...p, paymentRemark: e.target.value }))}
                  fullWidth size="small" sx={fieldSx}
                  placeholder={branchForm.paymentMode === 'Cash' ? 'e.g. Received in hand' : 'e.g. Cheque / DD'} />
              </Grid>
            )}
            {branchForm.paymentMode === 'Bank' && (
              <Grid item xs={12} sm={6}>
                <FileUploadField label="Token Payment Upload" fieldName="tokenUpload" file={branchFiles.tokenUpload} existingUrl={editBranch?.tokenUpload} onChange={(n, f) => setBranchFiles(p => ({ ...p, [n]: f }))} />
              </Grid>
            )}

          </Grid>
        </Box>

        <Box sx={{ px: 3, py: 2, display: 'flex', justifyContent: 'flex-end', gap: 1.5, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', flexShrink: 0 }}>
          <Button onClick={closeBranchDialog} variant="outlined" sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600 }}>
            Cancel
          </Button>
          <Button onClick={handleBranchSave} variant="contained" disabled={branchSaving}
            sx={{ borderRadius: '8px', bgcolor: '#FFD700', color: '#1e1e2f', fontWeight: 700, '&:hover': { bgcolor: '#f6b93b' }, minWidth: 130 }}>
            {branchSaving ? <CircularProgress size={20} sx={{ color: '#1e1e2f' }} /> : (editBranch ? 'Save Changes' : 'Add Branch')}
          </Button>
        </Box>
      </Dialog>

      {/* ── Branch View Dialog ── */}
      <Dialog
        open={branchViewOpen}
        onClose={() => { setBranchViewOpen(false); setBranchViewCompany(null); }}
        fullWidth maxWidth="md"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{ 
          background: 'linear-gradient(135deg, #1e1e2f, #33334d)', 
          px: 3, py: 2.5, 
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          borderBottom: '1px solid rgba(255,255,255,0.1)'
        }}>
          <Box display="flex" alignItems="center" gap={2}>
            <Box sx={{ 
              width: 44, height: 44, borderRadius: '12px', 
              background: 'rgba(255, 215, 0, 0.15)', 
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
            }}>
              <BusinessIcon sx={{ color: '#FFD700', fontSize: 24 }} />
            </Box>
            <Box>
              <Typography variant="h6" fontWeight={800} color="#fff" sx={{ letterSpacing: '-0.02em', lineHeight: 1.2 }}>
                Manage Branches
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.5)', fontWeight: 500 }}>
                {branchViewCompany?.companyName} &bull; ID: {branchViewCompany?.companyId}
              </Typography>
            </Box>
          </Box>
          <Box display="flex" alignItems="center" gap={1}>
            <Button
              variant="contained"
              size="small"
              startIcon={<AddIcon />}
              onClick={() => {
                setBranchViewOpen(false);
                openAddBranch(branchViewCompany);
              }}
              sx={{ bgcolor: '#FFD700', color: '#1e1e2f', fontWeight: 700, borderRadius: '8px', '&:hover': { bgcolor: '#f6b93b' } }}
            >
              Add Branch
            </Button>
             <IconButton
              onClick={() => { setBranchViewOpen(false); setBranchViewCompany(null); }}
              size="small"
              sx={{ 
                color: '#fff', bgcolor: 'rgba(255,255,255,0.08)', 
                '&:hover': { bgcolor: 'rgba(255,255,255,0.2)' },
                transition: 'all 0.2s'
              }}
            >
              <CloseIcon fontSize="small" />
            </IconButton>
          </Box>
        </Box>

        {/* Branch list */}
        <Box sx={{ p: 3, maxHeight: '65vh', overflowY: 'auto' }}>
          {(!branchViewCompany?.branches || branchViewCompany.branches.length === 0) ? (
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <BusinessIcon sx={{ fontSize: 48, color: '#e0e0e0', mb: 1 }} />
              <Typography color="text.secondary" fontWeight={500}>No branches yet</Typography>
              <Typography variant="caption" color="text.secondary">Click "Add Branch" to create the first branch</Typography>
            </Box>
          ) : (
            <Grid container spacing={2}>
              {branchViewCompany.branches.map((branch, idx) => (
                <Grid item xs={12} sm={6} key={branch._id || idx}>
                  <Box sx={{
                    border: '1px solid #e8eaf6', borderRadius: '12px', p: 2.5,
                    bgcolor: '#f8f9ff', transition: 'all 0.2s',
                    '&:hover': { boxShadow: '0 4px 16px rgba(63,81,181,0.12)', borderColor: '#9fa8da' },
                  }}>
                    {/* Branch header */}
                    <Box display="flex" alignItems="center" justifyContent="space-between" mb={1.5}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <Box sx={{ width: 32, height: 32, borderRadius: '8px', bgcolor: '#e8eaf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <BusinessIcon fontSize="small" sx={{ color: '#3f51b5' }} />
                        </Box>
                        <Typography variant="subtitle2" fontWeight={700} color="#1e1e2f">
                          {branch.branchName}
                        </Typography>
                      </Box>
                      <Box display="flex" gap={0.5}>
                        <Tooltip title="View Details">
                          <IconButton size="small"
                            onClick={() => { setBranchDetailData(branch); setBranchDetailOpen(true); }}
                            sx={{ bgcolor: '#e3f2fd', '&:hover': { bgcolor: '#bbdefb' } }}>
                            <VisibilityIcon fontSize="small" sx={{ color: '#1565c0' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit Branch">
                          <IconButton size="small"
                            onClick={() => {
                              setBranchViewOpen(false);
                              openEditBranch(branchViewCompany, branch);
                            }}
                            sx={{ bgcolor: '#e8eaf6', '&:hover': { bgcolor: '#c5cae9' } }}>
                            <EditIcon fontSize="small" sx={{ color: '#3f51b5' }} />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete Branch">
                          <IconButton size="small"
                            onClick={() => {
                              setBranchViewOpen(false);
                              setDeleteBranchDialog({ open: true, company: branchViewCompany, branch });
                            }}
                            sx={{ bgcolor: '#ffebee', '&:hover': { bgcolor: '#ffcdd2' } }}>
                            <DeleteIcon fontSize="small" sx={{ color: '#c62828' }} />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>

                    {/* Branch details */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.6 }}>
                      {[
                        { icon: '📍', label: 'Address', value: branch.branchAddress },
                        { icon: '🏙', label: 'City', value: branch.city },
                        { icon: '📌', label: 'Area', value: branch.area },
                        { icon: '🗺', label: 'State', value: branch.state },
                        { icon: '🌍', label: 'Country', value: branch.country },
                        { icon: '📮', label: 'Pincode', value: branch.pincode },
                        { icon: '👤', label: 'Contact', value: branch.contactPerson },
                        { icon: '🏷', label: 'Designation', value: branch.contactPersonDesignation },
                        { icon: '📞', label: 'Phone', value: branch.contactNumber },
                        { icon: '✉', label: 'Email', value: branch.email },
                        { icon: '🌐', label: 'Website', value: branch.websiteUrl },
                        { icon: '🧾', label: 'Invoice', value: branch.invoiceNumber },
                        { icon: '💳', label: 'Pay Mode', value: branch.paymentMode },
                        { icon: '💬', label: 'Pay Remark', value: branch.paymentRemark },
                        { icon: '💰', label: 'Token', value: branch.tokenAmount != null ? `₹${branch.tokenAmount}` : null },
                      ].filter(item => item.value).map(({ icon, label, value }) => (
                        <Box key={label} display="flex" alignItems="flex-start" gap={0.8}>
                          <Typography variant="caption" sx={{ minWidth: 16 }}>{icon}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72, fontWeight: 600 }}>
                            {label}:
                          </Typography>
                          <Typography variant="caption" color="#334155" sx={{ wordBreak: 'break-word' }}>
                            {value}
                          </Typography>
                        </Box>
                      ))}
                      {/* Agreement dates */}
                      {(branch.agreementStartDate || branch.agreementEndDate) && (
                        <Box display="flex" alignItems="flex-start" gap={0.8}>
                          <Typography variant="caption" sx={{ minWidth: 16 }}>📅</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72, fontWeight: 600 }}>Agreement:</Typography>
                          <Typography variant="caption" color="#334155">
                            {branch.agreementStartDate ? new Date(branch.agreementStartDate).toLocaleDateString('en-IN') : '—'}
                            {' → '}
                            {branch.agreementEndDate ? new Date(branch.agreementEndDate).toLocaleDateString('en-IN') : '—'}
                          </Typography>
                        </Box>
                      )}
                      {/* Document links */}
                      {[
                        { label: 'GST', url: branch.gstUpload, color: '#3f51b5' },
                        { label: 'Agreement', url: branch.agreementUpload, color: '#388e3c' },
                        { label: 'Other Doc', url: branch.otherDocumentUpload, color: '#7c3aed' },
                        { label: 'Token Doc', url: branch.tokenUpload, color: '#f57c00' },
                      ].filter(d => d.url).map(({ label, url, color }) => (
                        <Box key={label} display="flex" alignItems="center" gap={0.8}>
                          <Typography variant="caption" sx={{ minWidth: 16 }}>📎</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72, fontWeight: 600 }}>{label}:</Typography>
                          <a href={url} target="_blank" rel="noreferrer" style={{ color, fontSize: '0.75rem', fontWeight: 600 }}>View</a>
                        </Box>
                      ))}
                      {branch.gpsLocation && (
                        <Box display="flex" alignItems="center" gap={0.8} mt={0.5}>
                          <Typography variant="caption" sx={{ minWidth: 16 }}>�</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ minWidth: 72, fontWeight: 600 }}>GPS:</Typography>
                          <a href={branch.gpsLocation} target="_blank" rel="noreferrer"
                            style={{ color: '#3f51b5', fontSize: '0.75rem', fontWeight: 600 }}>
                            View on Map
                          </a>
                        </Box>
                      )}
                    </Box>
                  </Box>
                </Grid>
              ))}
            </Grid>
          )}
        </Box>

        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', display: 'flex', justifyContent: 'flex-end' }}>
          <Button
            onClick={() => { setBranchViewOpen(false); setBranchViewCompany(null); }}
            variant="outlined"
            sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600 }}
          >
            Close
          </Button>
        </Box>
      </Dialog>

      {/* ── Delete Branch Confirm ── */}
      <Dialog open={deleteBranchDialog.open} onClose={() => setDeleteBranchDialog({ open: false, company: null, branch: null })} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Delete Branch</DialogTitle>
        <DialogContent>
          <Typography>
            Delete branch <strong>{deleteBranchDialog.branch?.branchName}</strong> from <strong>{deleteBranchDialog.company?.companyName}</strong>? This cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteBranchDialog({ open: false, company: null, branch: null })} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleBranchDelete} variant="contained" color="error" sx={{ borderRadius: '8px', fontWeight: 700 }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* ── Reject Request Dialog ── */}
      <Dialog open={rejectDialog.open} onClose={() => setRejectDialog({ open: false, request: null })} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, color: '#c62828' }}>Reject Company Request</DialogTitle>
        <DialogContent>
          <Typography variant="body2" mb={2}>
            Rejecting <strong>{rejectDialog.request?.companyName}</strong>. Please provide a reason:
          </Typography>
          <TextField label="Reason *" multiline rows={3} fullWidth value={rejectReason}
            onChange={e => setRejectReason(e.target.value)}
            sx={{ '& .MuiOutlinedInput-root': { borderRadius: '8px' } }} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setRejectDialog({ open: false, request: null })} variant="outlined" sx={{ borderRadius: '8px' }}>Cancel</Button>
          <Button onClick={handleRejectRequest} variant="contained" color="error" disabled={!!actionLoading}
            sx={{ borderRadius: '8px', fontWeight: 700 }}>
            {actionLoading ? <CircularProgress size={18} color="inherit" /> : 'Reject'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Branch Full Detail Dialog ── */}
      <Dialog
        open={branchDetailOpen}
        onClose={() => { setBranchDetailOpen(false); setBranchDetailData(null); }}
        fullWidth maxWidth="sm"
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        {/* Header */}
        <Box sx={{ background: 'linear-gradient(135deg, #1e1e2f, #2d2d44)', px: 3, py: 2.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <Box sx={{ width: 40, height: 40, borderRadius: '10px', bgcolor: 'rgba(255,215,0,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <BusinessIcon sx={{ color: '#FFD700', fontSize: 20 }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} color="#fff" lineHeight={1.2}>
                {branchDetailData?.branchName}
              </Typography>
              <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.55)' }}>Branch Details</Typography>
            </Box>
          </Box>
          <IconButton onClick={() => { setBranchDetailOpen(false); setBranchDetailData(null); }} size="small"
            sx={{ color: '#fff', bgcolor: 'rgba(255,255,255,0.1)', '&:hover': { bgcolor: 'rgba(255,255,255,0.22)' } }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </Box>

        <Box sx={{ p: 3, maxHeight: '75vh', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

          {/* ── Basic Info ── */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 3, height: 14, bgcolor: '#3f51b5', borderRadius: 2 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Basic Information</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
              {[
                { label: 'Branch Name', value: branchDetailData?.branchName },
                { label: 'Address', value: branchDetailData?.branchAddress },
                { label: 'Area', value: branchDetailData?.area },
                { label: 'City', value: branchDetailData?.city },
                { label: 'State', value: branchDetailData?.state },
                { label: 'Country', value: branchDetailData?.country },
                { label: 'Pincode', value: branchDetailData?.pincode },
                { label: 'Website', value: branchDetailData?.websiteUrl },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ bgcolor: '#f8f9ff', borderRadius: '8px', px: 1.5, py: 1, border: '1px solid #e8eaf6' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 0.2 }}>{label}</Typography>
                  {label === 'Website' && value
                    ? <a href={value.startsWith('http') ? value : `https://${value}`} target="_blank" rel="noreferrer" style={{ color: '#3f51b5', fontSize: '0.78rem', fontWeight: 600 }}>{value}</a>
                    : <Typography variant="body2" fontWeight={600} color={value ? '#1e293b' : '#9e9e9e'}>{value || '—'}</Typography>
                  }
                </Box>
              ))}
            </Box>
            {branchDetailData?.gpsLocation && (
              <Box sx={{ mt: 1, bgcolor: '#f8f9ff', borderRadius: '8px', px: 1.5, py: 1, border: '1px solid #e8eaf6', display: 'flex', alignItems: 'center', gap: 1 }}>
                <LocationOnIcon fontSize="small" sx={{ color: '#3f51b5' }} />
                <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600 }}>GPS Location:</Typography>
                <a href={branchDetailData.gpsLocation} target="_blank" rel="noreferrer" style={{ color: '#3f51b5', fontSize: '0.78rem', fontWeight: 600 }}>View on Map</a>
              </Box>
            )}
          </Box>

          {/* ── Contact Details ── */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 3, height: 14, bgcolor: '#0891b2', borderRadius: 2 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Contact Details</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
              {[
                { label: 'Contact Person', value: branchDetailData?.contactPerson },
                { label: 'Designation', value: branchDetailData?.contactPersonDesignation },
                { label: 'Phone', value: branchDetailData?.contactNumber },
                { label: 'Email', value: branchDetailData?.email },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ bgcolor: '#f0fdff', borderRadius: '8px', px: 1.5, py: 1, border: '1px solid #cffafe' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 0.2 }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={600} color={value ? '#1e293b' : '#9e9e9e'}>{value || '—'}</Typography>
                </Box>
              ))}
            </Box>
            {(branchDetailData?.contactPerson2 || branchDetailData?.contactNumber2 || branchDetailData?.email2) && (
              <Box sx={{ mt: 1.2 }}>
                <Typography variant="caption" sx={{ fontWeight: 700, color: '#0891b2', opacity: 0.75, textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                  Contact Person 2
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
                  {[
                    { label: 'Contact Person 2', value: branchDetailData?.contactPerson2 },
                    { label: 'Designation 2', value: branchDetailData?.contactPerson2Designation },
                    { label: 'Phone 2', value: branchDetailData?.contactNumber2 },
                    { label: 'Email 2', value: branchDetailData?.email2 },
                  ].map(({ label, value }) => (
                    <Box key={label} sx={{ bgcolor: '#f0fdff', borderRadius: '8px', px: 1.5, py: 1, border: '1px solid #cffafe' }}>
                      <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 0.2 }}>{label}</Typography>
                      <Typography variant="body2" fontWeight={600} color={value ? '#1e293b' : '#9e9e9e'}>{value || '—'}</Typography>
                    </Box>
                  ))}
                </Box>
              </Box>
            )}
          </Box>

          {/* ── Documents ── */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 3, height: 14, bgcolor: '#7c3aed', borderRadius: 2 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#7c3aed', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Documents</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2, mb: 1.2 }}>
              {[
                { label: 'Agreement Start', value: branchDetailData?.agreementStartDate ? new Date(branchDetailData.agreementStartDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null },
                { label: 'Agreement End', value: branchDetailData?.agreementEndDate ? new Date(branchDetailData.agreementEndDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : null },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ bgcolor: '#faf5ff', borderRadius: '8px', px: 1.5, py: 1, border: '1px solid #ede9fe' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 0.2 }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={600} color={value ? '#1e293b' : '#9e9e9e'}>{value || '—'}</Typography>
                </Box>
              ))}
            </Box>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {[
                { label: 'GST', url: branchDetailData?.gstUpload, color: '#3f51b5', bg: '#e8eaf6' },
                { label: 'Agreement', url: branchDetailData?.agreementUpload, color: '#388e3c', bg: '#e8f5e9' },
                { label: 'Other Doc', url: branchDetailData?.otherDocumentUpload, color: '#7c3aed', bg: '#f3e8ff' },
                { label: 'Token Doc', url: branchDetailData?.tokenUpload, color: '#f57c00', bg: '#fff3e0' },
              ].map(({ label, url, color, bg }) => (
                <Box key={label} sx={{ bgcolor: bg, borderRadius: '8px', px: 1.5, py: 0.8, border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', gap: 0.8 }}>
                  <DescriptionIcon fontSize="small" sx={{ color, fontSize: '0.9rem' }} />
                  <Typography variant="caption" sx={{ fontWeight: 600, color: '#6b7280' }}>{label}:</Typography>
                  {url
                    ? <a href={url} target="_blank" rel="noreferrer" style={{ color, fontSize: '0.78rem', fontWeight: 700 }}>View</a>
                    : <Typography variant="caption" color="#9e9e9e">—</Typography>
                  }
                </Box>
              ))}
            </Box>
          </Box>

          {/* ── Payment ── */}
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
              <Box sx={{ width: 3, height: 14, bgcolor: '#059669', borderRadius: 2 }} />
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Payment</Typography>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1.2 }}>
              {[
                { label: 'Invoice No.', value: branchDetailData?.invoiceNumber },
                { label: 'Payment Mode', value: branchDetailData?.paymentMode },
                { label: 'Pay Remark', value: branchDetailData?.paymentRemark },
                { label: 'Token Amount', value: branchDetailData?.tokenAmount != null ? `₹${branchDetailData.tokenAmount}` : null },
              ].map(({ label, value }) => (
                <Box key={label} sx={{ bgcolor: '#f0fdf4', borderRadius: '8px', px: 1.5, py: 1, border: '1px solid #bbf7d0' }}>
                  <Typography variant="caption" sx={{ color: '#6b7280', fontWeight: 600, display: 'block', mb: 0.2 }}>{label}</Typography>
                  <Typography variant="body2" fontWeight={600} color={value ? '#1e293b' : '#9e9e9e'}>{value || '—'}</Typography>
                </Box>
              ))}
            </Box>
          </Box>

        </Box>

        <Box sx={{ px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f8f9ff', display: 'flex', justifyContent: 'flex-end' }}>
          <Button onClick={() => { setBranchDetailOpen(false); setBranchDetailData(null); }}
            variant="outlined" sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', fontWeight: 600 }}>
            Close
          </Button>
        </Box>
      </Dialog>

      {/* ── Excel Import Confirmation ── */}
      <Dialog open={showConfirmDialog} onClose={() => !importing && setShowConfirmDialog(false)} maxWidth="xs" fullWidth
        PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <CloudUploadIcon sx={{ color: '#4caf50' }} />
          Confirm Excel Import
        </DialogTitle>
        <DialogContent>
          <Typography variant="body2" color="text.secondary" mb={1}>
            Are you sure you want to import companies from <strong>{selectedExcelFile?.name}</strong>?
          </Typography>
          <Alert severity="info" sx={{ borderRadius: '8px', '& .MuiAlert-message': { fontSize: '0.75rem' } }}>
            Duplicate companies (by name) will be skipped automatically.
          </Alert>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2, gap: 1 }}>
          <Button onClick={() => setShowConfirmDialog(false)} variant="outlined" disabled={importing}
            sx={{ borderRadius: '8px', color: '#666', borderColor: '#ccc' }}>
            Cancel
          </Button>
          <Button onClick={confirmExcelUpload} variant="contained" disabled={importing}
            sx={{ borderRadius: '8px', bgcolor: '#4caf50', fontWeight: 700, '&:hover': { bgcolor: '#43a047' }, minWidth: 100 }}>
            {importing ? <CircularProgress size={20} sx={{ color: '#fff' }} /> : 'Import Now'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Excel Validation Errors Dialog ── */}
      <Dialog
        open={showExcelErrorsDialog}
        onClose={() => setShowExcelErrorsDialog(false)}
        maxWidth="md"
        fullWidth
        PaperProps={{ sx: { borderRadius: 3, overflow: 'hidden' } }}
      >
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', bgcolor: '#ffebee', borderBottom: '1px solid #ffcdd2' }}>
          <Box display="flex" alignItems="center" gap={1.5}>
            <CancelIcon sx={{ color: '#c62828' }} />
            <Typography variant="h6" fontWeight={700} color="#b71c1c">
              Excel Sheet Validation Failed
            </Typography>
          </Box>
          <IconButton onClick={() => setShowExcelErrorsDialog(false)} size="small" sx={{ color: '#b71c1c' }}>
            <CloseIcon fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 3, bgcolor: '#fafafa', maxHeight: '60vh', overflowY: 'auto' }}>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            We found some validation errors in your Excel sheet. Please correct these rows and re-upload the file.
          </Typography>
          <Box display="flex" flexDirection="column" gap={1.5}>
            {excelErrors.map((err, idx) => (
              <Box key={idx} sx={{ bgcolor: '#fff', border: '1px solid #ffcdd2', borderRadius: '8px', p: 2, boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                <Typography variant="subtitle2" color="#c62828" fontWeight={700} sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <span>Row {err.row}:</span>
                  <strong style={{ color: '#334155' }}>{err.companyName}</strong>
                </Typography>
                <ul style={{ margin: '8px 0 0 0', paddingLeft: '20px', color: '#475569', fontSize: '0.85rem' }}>
                  {err.errors.map((msg, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>{msg}</li>
                  ))}
                </ul>
              </Box>
            ))}
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2, borderTop: '1px solid #e0e0e0', bgcolor: '#f5f5f5' }}>
          <Button onClick={() => setShowExcelErrorsDialog(false)} variant="contained" color="error" sx={{ borderRadius: '8px', fontWeight: 700 }}>
            Dismiss and Fix Sheet
          </Button>
        </DialogActions>
      </Dialog>

    </Box>
  );
}
