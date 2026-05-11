import React, { useState, useEffect } from 'react';
import {
  Box, Button, Grid, Typography, TextField, Paper,
} from '@mui/material';
import { Autocomplete } from '@mui/material';
import LinearProgress from '@mui/material/LinearProgress';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import VisibilityIcon from '@mui/icons-material/Visibility';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import { createSale, updateSale } from '../../utils/JobReportService';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// ── empty form ─────────────────────────────────────────────────────────────────
const emptyFormData = {
  companyName: '', companyId: '', branchId: '', branchName: '',
  jobTitle: '', jobLocation: '', numberOfRequirements: '', jobTiming: '',
  education: '', gender: '', salary: '', experience: '',
  requiredSkills: '', keyResponsibility: '', benefits: '', response: '',
  descriptionFile: null, weekOff: '',
  industries: '', companyAddress: '', Area: '', contactName: '',
  email: '', phoneNumber: '', websiteURL: '', remarks: '',
  agreementSigned: null, gstUpload: null,
};

// ── component ──────────────────────────────────────────────────────────────────
// Props:
//   onSuccess  – called after successful submit (enables embedded/dialog mode)
//   onClose    – called when Cancel is clicked
//   editData   – job object to pre-fill (edit mode)
//   editId     – _id of job being edited
const HRJobForm = ({ onSuccess, onClose, editData, editId }) => {
  const isEmbedded = !!onSuccess;
  const isEditMode  = !!editId;

  const [formData, setFormData]             = useState(emptyFormData);
  const [selectedBranch, setSelectedBranch] = useState(null);
  const [companyOptions, setCompanyOptions] = useState([]);
  const [loading, setLoading]               = useState(false);
  const [successMsg, setSuccessMsg]         = useState('');
  const [fileErrors, setFileErrors]         = useState({ descriptionFile: '' });
  const [salaryMonthly, setSalaryMonthly]   = useState('');
  const [jobTimingStart, setJobTimingStart] = useState(''); // start time for job timing
  const [jobTimingEnd, setJobTimingEnd]     = useState(''); // end time for job timing
  const [errors, setErrors]                 = useState({
    companyName: false, jobTitle: false, jobLocation: false,
    numberOfRequirements: false, experience: false, education: false, requiredSkills: false,
  });

  // pre-fill when editing
  useEffect(() => {
    if (editData && editId) {
      setFormData({ ...emptyFormData, ...editData, descriptionFile: null });
      setSalaryMonthly(''); // clear monthly input; existing LPA shown in formData.salary
      // Parse existing jobTiming into start/end parts
      if (editData.jobTiming && editData.jobTiming.includes(' - ')) {
        const [start, end] = editData.jobTiming.split(' - ');
        setJobTimingStart(start.trim());
        setJobTimingEnd(end.trim());
      } else {
        setJobTimingStart(editData.jobTiming || '');
        setJobTimingEnd('');
      }
    }
  }, [editData, editId]);

  // fetch companies
  useEffect(() => {
    const token = sessionStorage.getItem('token');
    axios.get(`${API_BASE_URL}/companies`, { headers: { Authorization: `Bearer ${token}` } })
      .then(res => setCompanyOptions(res.data.data || []))
      .catch(() => {});
  }, []);

  // restore branch when editing
  useEffect(() => {
    if (editData?.branchId && companyOptions.length) {
      const co = companyOptions.find(c => c.companyId === editData.companyId);
      const br = co?.branches?.find(b => b._id === editData.branchId);
      setSelectedBranch(br || null);
    }
  }, [editData, companyOptions]);

  // ── handlers ──────────────────────────────────────────────────────────────
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const resetForm = () => {
    setFormData(emptyFormData);
    setSelectedBranch(null);
    setSalaryMonthly('');
    setJobTimingStart('');
    setJobTimingEnd('');
    setErrors({ companyName: false, jobTitle: false, jobLocation: false, numberOfRequirements: false, experience: false, education: false, requiredSkills: false });
    setSuccessMsg('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newErrors = {
      companyName:          !formData.companyName?.trim(),
      jobTitle:             !formData.jobTitle?.trim(),
      jobLocation:          !formData.jobLocation?.trim(),
      numberOfRequirements: !formData.numberOfRequirements,
      experience:           !formData.experience?.trim(),
      education:            !formData.education?.trim(),
      requiredSkills:       !formData.requiredSkills?.trim(),
    };
    setErrors(newErrors);
    if (Object.values(newErrors).some(Boolean)) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setSuccessMsg('');

    try {
      const form = new FormData();

      // Convert monthly salary to annual LPA if user entered a monthly amount
      const salaryToStore = salaryMonthly
        ? `${((Number(salaryMonthly) * 12) / 100000).toFixed(2)} LPA`
        : formData.salary;

      // Combine jobTimingStart + jobTimingEnd into jobTiming string
      const combinedJobTiming = jobTimingStart && jobTimingEnd
        ? `${jobTimingStart} - ${jobTimingEnd}`
        : jobTimingStart || jobTimingEnd || formData.jobTiming || '';

      Object.entries(formData).forEach(([key, value]) => {
        if (['descriptionFile', 'agreementSigned', 'gstUpload'].includes(key)) return;
        if (key === 'salary') {
          if (salaryToStore) form.append('salary', salaryToStore);
        } else if (key === 'jobTiming') {
          if (combinedJobTiming) form.append('jobTiming', combinedJobTiming);
        } else if (value !== null && value !== undefined && value !== '') {
          form.append(key, value);
        }
      });
      if (formData.companyId)  form.set('companyId',  formData.companyId);
      if (formData.branchId)   form.set('branchId',   formData.branchId);
      if (formData.branchName) form.set('branchName', formData.branchName);
      if (formData.descriptionFile instanceof File) form.append('descriptionFile', formData.descriptionFile);

      if (isEditMode) {
        await updateSale(editId, form, true);
        setSuccessMsg('Update Successful!');
        toast.success('Job updated successfully!');
      } else {
        await createSale(form, true);
        setSuccessMsg('Job Created!');
        toast.success('Job posted successfully! 🎉');
      }

      if (!isEditMode) resetForm();
      if (onSuccess) setTimeout(() => onSuccess(), 1200);
    } catch (err) {
      console.error('Error saving job:', err);
      toast.error('Failed to save job opening');
    } finally {
      setLoading(false);
    }
  };

  // selected company's branches
  const selectedCo  = companyOptions.find(c => c.companyId === formData.companyId);
  const branches    = selectedCo?.branches || [];
  const hasBranches = branches.length > 0;

  // ── shared form fields ─────────────────────────────────────────────────────
  const formFields = (
    <Box component="form" onSubmit={handleSubmit} sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

      {/* Scrollable body */}
      <Box sx={{
        flexGrow: 1, overflowY: 'auto', p: 3,
        '&::-webkit-scrollbar': { width: 6 },
        '&::-webkit-scrollbar-thumb': { background: '#9fa8da', borderRadius: 3 },
      }}>
        <Grid container spacing={2.5}>

          {/* ── LEFT COLUMN ── */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Company */}
            <Autocomplete
              options={companyOptions}
              getOptionLabel={(opt) =>
                opt ? `${opt.companyName}${opt.companyId ? ` (ID: ${opt.companyId})` : ''}` : ''
              }
              value={companyOptions.find(c => c.companyId === formData.companyId) || null}
              onChange={(e, val) => {
                if (val) {
                  setFormData(prev => ({ ...prev, companyName: val.companyName, companyId: val.companyId }));
                  setSelectedBranch(null);
                  if (errors.companyName) setErrors(p => ({ ...p, companyName: false }));
                } else {
                  setFormData(prev => ({ ...prev, companyName: '', companyId: '' }));
                  setSelectedBranch(null);
                }
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Company *"
                  error={errors.companyName}
                  helperText={errors.companyName ? 'Company is required' : 'Choose from registered companies'}
                  size="small" required />
              )}
              renderOption={(props, opt) => (
                <li {...props} key={opt._id || opt.companyId}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{opt.companyName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      ID: {opt.companyId}
                      {opt.area ? ` • ${opt.area}` : ''}
                      {opt.industries ? ` • ${opt.industries}` : ''}
                    </Typography>
                  </Box>
                </li>
              )}
              isOptionEqualToValue={(opt, val) => opt.companyId === val?.companyId}
            />

            {/* Branch */}
            <Autocomplete
              options={branches}
              getOptionLabel={(b) => b.branchName || ''}
              value={selectedBranch}
              disabled={!hasBranches}
              onChange={(e, val) => {
                setSelectedBranch(val);
                setFormData(prev => ({ ...prev, branchId: val?._id || '', branchName: val?.branchName || '' }));
              }}
              renderInput={(params) => (
                <TextField {...params} label="Select Branch" size="small"
                  helperText={
                    !formData.companyId ? 'Select a company first'
                    : !hasBranches ? 'No branches for this company'
                    : 'Optional — select a branch'
                  }
                  sx={{ '& .MuiOutlinedInput-root': { bgcolor: !hasBranches ? '#f5f5f5' : undefined } }}
                />
              )}
              renderOption={(props, opt) => (
                <li {...props} key={opt._id}>
                  <Box>
                    <Typography variant="body2" fontWeight={600}>{opt.branchName}</Typography>
                    <Typography variant="caption" color="text.secondary">
                      {[opt.city, opt.area].filter(Boolean).join(' • ')}
                    </Typography>
                  </Box>
                </li>
              )}
              isOptionEqualToValue={(o, v) => o._id === v?._id}
            />

            {/* Job Title */}
            <TextField label="Job Title *" name="jobTitle" value={formData.jobTitle} size="small"
              onChange={(e) => { handleChange(e); if (errors.jobTitle) setErrors(p => ({ ...p, jobTitle: false })); }}
              fullWidth error={errors.jobTitle}
              helperText={errors.jobTitle ? 'Job title is required' : ''} required />

            {/* Job Location */}
            <TextField label="Job Location *" name="jobLocation" value={formData.jobLocation} size="small"
              onChange={(e) => { handleChange(e); if (errors.jobLocation) setErrors(p => ({ ...p, jobLocation: false })); }}
              fullWidth error={errors.jobLocation}
              helperText={errors.jobLocation ? 'Job location is required' : ''} required />

            {/* No. of Openings + Job Timing */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="No. of Openings *" name="numberOfRequirements" type="number" size="small"
                  value={formData.numberOfRequirements}
                  onChange={(e) => { handleChange(e); if (errors.numberOfRequirements) setErrors(p => ({ ...p, numberOfRequirements: false })); }}
                  fullWidth error={errors.numberOfRequirements}
                  helperText={errors.numberOfRequirements ? 'Required' : ''} required />
              </Grid>
              <Grid item xs={6}>
                <Box>
                  <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
                    Job Timing
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      label="Start Time"
                      type="time"
                      value={jobTimingStart ? (() => { const [h,m] = jobTimingStart.split(':'); const hh = parseInt(h); return `${String(hh > 12 ? hh - 12 : hh || 12).padStart(2,'0')}:${m}`; })() : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) { setJobTimingStart(''); return; }
                        const [h, m] = val.split(':');
                        const hh = parseInt(h);
                        const ampm = hh >= 12 ? 'PM' : 'AM';
                        const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
                        setJobTimingStart(`${h12}:${m} ${ampm}`);
                      }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                    <Typography variant="body2" color="text.secondary">to</Typography>
                    <TextField
                      label="End Time"
                      type="time"
                      value={jobTimingEnd ? (() => { const [h,m] = jobTimingEnd.split(':'); const hh = parseInt(h); return `${String(hh > 12 ? hh - 12 : hh || 12).padStart(2,'0')}:${m}`; })() : ''}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (!val) { setJobTimingEnd(''); return; }
                        const [h, m] = val.split(':');
                        const hh = parseInt(h);
                        const ampm = hh >= 12 ? 'PM' : 'AM';
                        const h12 = hh > 12 ? hh - 12 : hh === 0 ? 12 : hh;
                        setJobTimingEnd(`${h12}:${m} ${ampm}`);
                      }}
                      InputLabelProps={{ shrink: true }}
                      inputProps={{ step: 300 }}
                      size="small"
                      sx={{ flex: 1 }}
                    />
                  </Box>
                  {(jobTimingStart || jobTimingEnd) && (
                    <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                      {jobTimingStart && jobTimingEnd
                        ? `${jobTimingStart} - ${jobTimingEnd}`
                        : jobTimingStart || jobTimingEnd}
                    </Typography>
                  )}
                </Box>
              </Grid>
            </Grid>

            {/* Education + Gender */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField label="Education *" name="education" value={formData.education} size="small"
                  onChange={(e) => { handleChange(e); if (errors.education) setErrors(p => ({ ...p, education: false })); }}
                  fullWidth error={errors.education}
                  helperText={errors.education ? 'Required' : ''} required />
              </Grid>
              <Grid item xs={6}>
                <Autocomplete freeSolo options={['Male', 'Female', 'Other']}
                  value={formData.gender || ''}
                  onChange={(e, v) => setFormData(p => ({ ...p, gender: v || '' }))}
                  onInputChange={(e, v) => setFormData(p => ({ ...p, gender: v }))}
                  renderInput={(params) => <TextField {...params} label="Gender" size="small" fullWidth />}
                />
              </Grid>
            </Grid>

            {/* Salary + Experience */}
            <Grid container spacing={2}>
              <Grid item xs={6}>
                <TextField
                  label="Salary (Monthly ₹)"
                  name="salaryMonthly"
                  value={salaryMonthly}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (v === '' || /^\d*$/.test(v)) setSalaryMonthly(v);
                  }}
                  size="small" fullWidth
                  inputProps={{ inputMode: 'numeric', pattern: '\\d*' }}
                  helperText={
                    salaryMonthly
                      ? `= ₹${((Number(salaryMonthly) * 12) / 100000).toFixed(2)} LPA (Annual)`
                      : formData.salary
                      ? `Current: ${formData.salary}`
                      : 'Enter monthly amount in ₹'
                  }
                />
              </Grid>
              <Grid item xs={6}>
                <TextField label="Experience *" name="experience" value={formData.experience} size="small"
                  onChange={(e) => { handleChange(e); if (errors.experience) setErrors(p => ({ ...p, experience: false })); }}
                  fullWidth error={errors.experience}
                  helperText={errors.experience ? 'Required' : ''} required />
              </Grid>
            </Grid>
          </Grid>

          {/* ── RIGHT COLUMN ── */}
          <Grid item xs={12} md={6} sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>

            {/* Required Skills */}
            <TextField label="Required Skills *" name="requiredSkills" value={formData.requiredSkills} size="small"
              onChange={(e) => { handleChange(e); if (errors.requiredSkills) setErrors(p => ({ ...p, requiredSkills: false })); }}
              fullWidth multiline rows={2}
              error={errors.requiredSkills}
              helperText={errors.requiredSkills ? 'Required skills are required' : ''} required />

            {/* Key Responsibilities */}
            <TextField label="Key Responsibilities" name="keyResponsibility" size="small"
              value={formData.keyResponsibility} onChange={handleChange} fullWidth multiline rows={3} />

            {/* Benefits */}
            <TextField label="Benefits" name="benefits" value={formData.benefits} size="small" onChange={handleChange} fullWidth />

            {/* Response */}
            <TextField label="Response" name="response" value={formData.response} size="small" onChange={handleChange} fullWidth />

            {/* Week Off */}
            <Autocomplete
              freeSolo
              options={[
                'Sunday',
                'Monday',
                'Tuesday',
                'Wednesday',
                'Thursday',
                'Friday',
                'Saturday',
                'Saturday & Sunday',
                'Sunday & Monday',
                'Rotational',
                'No Week Off'
              ]}
              value={formData.weekOff || ''}
              onChange={(e, v) => setFormData(p => ({ ...p, weekOff: v || '' }))}
              onInputChange={(e, v) => setFormData(p => ({ ...p, weekOff: v }))}
              renderInput={(params) => (
                <TextField {...params} label="Week Off" size="small" fullWidth
                  helperText="Select or type custom week off" />
              )}
            />

            {/* Job Description PDF */}
            <Box sx={{ p: 2, bgcolor: '#f8f9ff', borderRadius: '10px', border: '1px solid #e8eaf6' }}>
              <Typography variant="caption" sx={{ fontWeight: 700, color: '#3f51b5', textTransform: 'uppercase', letterSpacing: '0.06em', display: 'block', mb: 1 }}>
                Job Description PDF
              </Typography>
              <Button variant="outlined" component="label" size="small" startIcon={<UploadFileIcon />}
                sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', textTransform: 'none', fontSize: '0.82rem' }}>
                Upload PDF
                <input type="file" hidden accept=".pdf,.doc,.docx"
                  onChange={(e) => {
                    const file = e.target.files[0];
                    if (file && file.size > 5 * 1024 * 1024) {
                      setFileErrors(p => ({ ...p, descriptionFile: 'File size exceeds 5MB' }));
                    } else {
                      setFormData(p => ({ ...p, descriptionFile: file }));
                      setFileErrors(p => ({ ...p, descriptionFile: '' }));
                    }
                  }}
                />
              </Button>
              {formData.descriptionFile instanceof File && (
                <Typography variant="body2" color="text.secondary" mt={0.5} sx={{ fontSize: '0.8rem' }}>
                  📄 {formData.descriptionFile.name}
                </Typography>
              )}
              {typeof formData.descriptionFile === 'string' && formData.descriptionFile && (
                <Box mt={0.5} display="flex" alignItems="center" gap={1}>
                  <Typography variant="body2" color="text.secondary" sx={{ fontSize: '0.8rem' }}>Existing PDF</Typography>
                  <Button size="small" onClick={() => window.open(formData.descriptionFile, '_blank')}
                    startIcon={<VisibilityIcon />} sx={{ color: '#3f51b5', fontSize: '0.75rem', textTransform: 'none' }}>View</Button>
                </Box>
              )}
              {fileErrors.descriptionFile && (
                <Typography variant="caption" color="error" display="block" mt={0.5}>{fileErrors.descriptionFile}</Typography>
              )}
            </Box>
          </Grid>
        </Grid>
      </Box>

      {/* ── Footer ── */}
      <Box sx={{
        display: 'flex', justifyContent: 'flex-end', alignItems: 'center',
        px: 3, py: 2, borderTop: '1px solid #e8eaf6', bgcolor: '#f5f6ff',
        gap: 2, flexShrink: 0,
      }}>
        {loading && <LinearProgress sx={{ flex: 1, maxWidth: 200 }} />}

        {successMsg && (
          <Box display="flex" alignItems="center" gap={0.8}>
            <CheckCircleIcon color="success" fontSize="small" />
            <Typography variant="body2" color="green" fontWeight={600}>{successMsg}</Typography>
          </Box>
        )}

        {onClose && (
          <Button variant="outlined" onClick={onClose}
            sx={{ borderRadius: '8px', borderColor: '#9fa8da', color: '#3f51b5', textTransform: 'none', fontWeight: 600 }}>
            Cancel
          </Button>
        )}

        <Button type="submit" variant="contained" disabled={loading}
          sx={{
            borderRadius: '8px', textTransform: 'none', fontWeight: 700,
            background: 'linear-gradient(135deg, #3f51b5, #5c6bc0)',
            boxShadow: '0 2px 8px rgba(63,81,181,0.35)',
            '&:hover': { background: 'linear-gradient(135deg, #303f9f, #3f51b5)' },
            px: 3,
          }}>
          {loading
            ? (isEditMode ? 'Updating...' : 'Creating...')
            : isEditMode ? 'Update Job Opening' : 'Add Job Opening'}
        </Button>
      </Box>
    </Box>
  );

  // ── Embedded / Dialog mode ─────────────────────────────────────────────────
  if (isEmbedded) {
    return (
      <>
        <ToastContainer position="top-right" autoClose={3000} />
        {formFields}
      </>
    );
  }

  // ── Standalone page mode ───────────────────────────────────────────────────
  return (
    <Box sx={{ display: 'flex', height: '100vh', backgroundColor: '#f0f2f8', overflow: 'hidden' }}>
      <ToastContainer position="top-right" autoClose={3000} />

      {/* Sidebar */}
      <Box sx={{ position: 'fixed', left: 0, top: 0, height: '100vh', width: '250px', backgroundColor: '#3f51b5', zIndex: 1000 }}>
        <Sidebar />
      </Box>

      {/* Main */}
      <Box sx={{ flexGrow: 1, ml: '250px', display: 'flex', flexDirection: 'column', height: '100vh', overflow: 'hidden' }}>
        <Navbar />

        <Box sx={{ flexGrow: 1, overflow: 'auto', p: 3 }}>
          {/* Page header */}
          <Box sx={{
            background: 'linear-gradient(135deg, #3f51b5 0%, #5c6bc0 60%, #7986cb 100%)',
            borderRadius: '16px', p: 3, mb: 3,
            display: 'flex', alignItems: 'center',
            boxShadow: '0 8px 32px rgba(63,81,181,0.25)',
          }}>
            <Box>
              <Typography variant="h5" fontWeight={800} color="#fff" letterSpacing="-0.3px">
                Post a New Job
              </Typography>
              <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.75)', mt: 0.3 }}>
                Fill in all required fields to create a new job opening
              </Typography>
            </Box>
          </Box>

          {/* Form card */}
          <Paper elevation={0} sx={{
            border: '1px solid #e8eaf6', borderRadius: '16px', overflow: 'hidden',
            maxHeight: 'calc(100vh - 200px)', display: 'flex', flexDirection: 'column',
            boxShadow: '0 4px 24px rgba(63,81,181,0.08)',
          }}>
            {formFields}
          </Paper>
        </Box>
      </Box>
    </Box>
  );
};

export default HRJobForm;
