import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Select, MenuItem,
  FormControl, InputLabel, Grid, CircularProgress,
  InputAdornment, IconButton, FormHelperText, Link,
} from '@mui/material';
import {
  Person, Email, Lock, Phone, Visibility, VisibilityOff, CheckCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../utils/api';

/* ─── SVG Illustration ───────────────────────────────────────────────── */
const RegisterIllustration = () => (
  <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 400 }}>
    {/* Card base */}
    <rect x="60" y="40" width="360" height="240" rx="20" fill="rgba(255,255,255,0.12)" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5"/>
    {/* Avatar circle */}
    <circle cx="240" cy="100" r="40" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
    <circle cx="240" cy="90" r="16" fill="rgba(255,255,255,0.5)"/>
    <ellipse cx="240" cy="120" rx="24" ry="14" fill="rgba(255,255,255,0.4)"/>
    {/* Form lines */}
    <rect x="100" y="160" width="280" height="10" rx="5" fill="rgba(255,255,255,0.35)"/>
    <rect x="100" y="182" width="200" height="10" rx="5" fill="rgba(255,255,255,0.25)"/>
    <rect x="100" y="204" width="240" height="10" rx="5" fill="rgba(255,255,255,0.3)"/>
    <rect x="100" y="226" width="160" height="10" rx="5" fill="rgba(255,255,255,0.2)"/>
    {/* Submit button shape */}
    <rect x="160" y="252" width="160" height="20" rx="10" fill="rgba(255,255,255,0.4)"/>
    {/* Floating elements */}
    <circle cx="50" cy="100" r="10" fill="rgba(255,255,255,0.2)"/>
    <circle cx="430" cy="60" r="8" fill="rgba(255,255,255,0.2)"/>
    <circle cx="440" cy="240" r="12" fill="rgba(255,255,255,0.15)"/>
    <circle cx="40" cy="260" r="8" fill="rgba(255,255,255,0.18)"/>
    {/* Stars */}
    <path d="M400 140 l4 8 8 0 -6 6 2 8 -8-4 -8 4 2-8 -6-6 8 0z" fill="rgba(255,255,255,0.3)"/>
    <path d="M80 180 l3 6 6 0 -4 4 1 6 -6-3 -6 3 1-6 -4-4 6 0z" fill="rgba(255,255,255,0.25)"/>
    {/* Check badges */}
    <circle cx="120" cy="320" r="14" fill="rgba(255,255,255,0.2)"/>
    <path d="M114 320l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="240" cy="336" r="14" fill="rgba(255,255,255,0.2)"/>
    <path d="M234 336l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="360" cy="320" r="14" fill="rgba(255,255,255,0.2)"/>
    <path d="M354 320l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─── Blob ───────────────────────────────────────────────────────────── */
const Blob = ({ style }) => (
  <motion.div
    animate={{ scale: [1, 1.12, 1], rotate: [0, 15, 0] }}
    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    style={{ position: 'absolute', borderRadius: '60% 40% 70% 30% / 50% 60% 40% 70%', filter: 'blur(48px)', pointerEvents: 'none', ...style }}
  />
);

/* ─── Left panel ─────────────────────────────────────────────────────── */
const LeftPanel = () => (
  <Box sx={{
    flex: '0 0 50%', width: '50%', display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
    overflow: 'hidden', px: 6, py: 8,
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
    minHeight: '100vh',
  }}>
    <Blob style={{ width: 320, height: 320, top: '-70px', left: '-70px', background: 'rgba(255,255,255,0.08)' }} />
    <Blob style={{ width: 240, height: 240, bottom: '-50px', right: '-50px', background: 'rgba(255,255,255,0.07)' }} />

    {/* Logo */}
    <Box sx={{ position: 'absolute', top: 32, left: 36, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: '10px',
        background: 'rgba(255,255,255,0.25)', backdropFilter: 'blur(8px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid rgba(255,255,255,0.4)',
      }}>
        <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '16px' }}>IT</Typography>
      </Box>
      <Box>
        <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: '15px', lineHeight: 1.1 }}>Ideal Talent</Typography>
        <Typography sx={{ color: 'rgba(255,255,255,0.7)', fontSize: '10px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Connect</Typography>
      </Box>
    </Box>

    <motion.div animate={{ y: [0, -14, 0] }} transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }} style={{ width: '100%', maxWidth: 380, marginBottom: 36 }}>
      <RegisterIllustration />
    </motion.div>

    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { md: '26px', lg: '32px' }, textAlign: 'center', lineHeight: 1.25, mb: 2 }}>
        Join Ideal Talent Connect
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', textAlign: 'center', lineHeight: 1.7, maxWidth: 320, mx: 'auto', mb: 4 }}>
        Create your account and start connecting with top opportunities today.
      </Typography>
    </motion.div>

    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {['Quick & Easy Registration', 'Secure Data Encryption', 'Instant Dashboard Access'].map((f, i) => (
          <motion.div key={f} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.6 + i * 0.12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <CheckCircle sx={{ color: 'rgba(255,255,255,0.9)', fontSize: 20 }} />
              <Typography sx={{ color: 'rgba(255,255,255,0.85)', fontSize: '14px', fontWeight: 500 }}>{f}</Typography>
            </Box>
          </motion.div>
        ))}
      </Box>
    </motion.div>
  </Box>
);

/* ─── Field styles ───────────────────────────────────────────────────── */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px', background: '#f8f9ff', fontSize: '14px',
    '& fieldset': { borderColor: '#e2e5f1' },
    '&:hover fieldset': { borderColor: '#4F46E5' },
    '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: '2px' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(79,70,229,0.1)' },
  },
  '& .MuiInputLabel-root': { fontSize: '14px', color: '#6b7280' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#4F46E5' },
  '& .MuiInputAdornment-root svg': { color: '#9ca3af', fontSize: '20px' },
  '& .MuiFormHelperText-root': { color: '#ef4444', fontSize: '12px' },
};

const selectSx = {
  borderRadius: '12px', background: '#f8f9ff', fontSize: '14px',
  '& fieldset': { borderColor: '#e2e5f1' },
  '&:hover fieldset': { borderColor: '#4F46E5' },
  '&.Mui-focused fieldset': { borderColor: '#4F46E5', borderWidth: '2px' },
};

const validationSchema = Yup.object({
  firstName: Yup.string().required('First name is required'),
  lastName: Yup.string().required('Last name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  mobileNo: Yup.string().matches(/^[0-9]{10}$/, 'Must be 10 digits').required('Required'),
  address: Yup.string().required('Address is required'),
  password: Yup.string().min(6, 'Minimum 6 characters').required('Password is required'),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref('password')], 'Passwords do not match')
    .required('Please confirm your password'),
  role: Yup.string().required('Role is required'),
  gender: Yup.string().required('Gender is required'),
});

/* ═══════════════════════════════════════════════════════════════════════
   REGISTER FORM
═══════════════════════════════════════════════════════════════════════ */
const RegisterForm = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const formik = useFormik({
    initialValues: { firstName: '', lastName: '', email: '', mobileNo: '', address: '', password: '', confirmPassword: '', role: '', gender: '' },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const { confirmPassword, ...payload } = values;
        const res = await api.post('/auth/register', payload);
        if (res.status === 201) { alert('Registration successful'); navigate('/login'); }
      } catch (err) {
        const msg = err?.response?.data?.msg || err?.response?.data?.message || 'Registration failed';
        alert(msg);
      }
      finally { setSubmitting(false); }
    },
  });

  const err = (name) => formik.touched[name] && Boolean(formik.errors[name]);
  const msg = (name) => formik.touched[name] && formik.errors[name];

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <LeftPanel />

      {/* Right side */}
      <Box sx={{
        flex: '0 0 50%', width: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f5f6fa',
        px: { xs: 2, sm: 4 }, py: 5, minHeight: '100vh', overflowY: 'auto',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 460 }}
        >
          <Box sx={{
            background: 'rgba(255,255,255,0.88)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(79,70,229,0.12), 0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid rgba(255,255,255,0.9)',
            p: { xs: 3, sm: 4 },
          }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.2, mb: 3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '9px', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>IT</Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#1e1b4b' }}>Ideal Talent Connect</Typography>
            </Box>

            <Typography sx={{ fontWeight: 800, fontSize: '24px', color: '#111827', mb: 0.5 }}>Create Account</Typography>
            <Typography sx={{ color: '#6b7280', fontSize: '13.5px', mb: 3 }}>Fill in the details below to get started</Typography>

            <Box component="form" onSubmit={formik.handleSubmit} noValidate>
              <Grid container spacing={2}>
                {/* First + Last name */}
                {[
                  { name: 'firstName', label: 'First Name', sm: 6 },
                  { name: 'lastName', label: 'Last Name', sm: 6 },
                ].map(({ name, label, sm }, i) => (
                  <Grid item xs={12} sm={sm} key={name}>
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 + i * 0.06 }}>
                      <TextField fullWidth label={label} name={name}
                        value={formik.values[name]} onChange={formik.handleChange} onBlur={formik.handleBlur}
                        error={err(name)} helperText={msg(name)} sx={fieldSx}
                        InputProps={{ startAdornment: <InputAdornment position="start"><Person /></InputAdornment> }}
                      />
                    </motion.div>
                  </Grid>
                ))}

                {/* Email */}
                <Grid item xs={12}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
                    <TextField fullWidth label="Email Address" name="email"
                      value={formik.values.email} onChange={formik.handleChange} onBlur={formik.handleBlur}
                      error={err('email')} helperText={msg('email')} sx={fieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
                    />
                  </motion.div>
                </Grid>

                {/* Mobile */}
                <Grid item xs={12}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                    <TextField fullWidth label="Mobile Number" name="mobileNo"
                      value={formik.values.mobileNo} onChange={formik.handleChange} onBlur={formik.handleBlur}
                      error={err('mobileNo')} helperText={msg('mobileNo')} sx={fieldSx}
                      InputProps={{ startAdornment: <InputAdornment position="start"><Phone /></InputAdornment> }}
                    />
                  </motion.div>
                </Grid>

                {/* Address */}
                <Grid item xs={12}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.31 }}>
                    <TextField fullWidth label="Address" name="address"
                      value={formik.values.address} onChange={formik.handleChange} onBlur={formik.handleBlur}
                      error={err('address')} helperText={msg('address')} sx={fieldSx}
                    />
                  </motion.div>
                </Grid>

                {/* Password */}
                <Grid item xs={12} sm={6}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.34 }}>
                    <TextField fullWidth label="Password" name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formik.values.password} onChange={formik.handleChange} onBlur={formik.handleBlur}
                      error={err('password')} helperText={msg('password')} sx={fieldSx}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                              {showPassword ? <VisibilityOff sx={{ fontSize: 18, color: '#9ca3af' }} /> : <Visibility sx={{ fontSize: 18, color: '#9ca3af' }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </motion.div>
                </Grid>

                {/* Confirm Password */}
                <Grid item xs={12} sm={6}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
                    <TextField fullWidth label="Confirm Password" name="confirmPassword"
                      type={showConfirm ? 'text' : 'password'}
                      value={formik.values.confirmPassword} onChange={formik.handleChange} onBlur={formik.handleBlur}
                      error={err('confirmPassword')} helperText={msg('confirmPassword')} sx={fieldSx}
                      InputProps={{
                        startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                              {showConfirm ? <VisibilityOff sx={{ fontSize: 18, color: '#9ca3af' }} /> : <Visibility sx={{ fontSize: 18, color: '#9ca3af' }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      }}
                    />
                  </motion.div>
                </Grid>

                {/* Gender */}
                <Grid item xs={12} sm={6}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.46 }}>
                    <FormControl fullWidth error={err('gender')}>
                      <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#4F46E5' } }}>Gender</InputLabel>
                      <Select name="gender" value={formik.values.gender} onChange={formik.handleChange} onBlur={formik.handleBlur} label="Gender" sx={selectSx}
                        MenuProps={{ PaperProps: { sx: { borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                      {err('gender') && <FormHelperText sx={{ color: '#ef4444', fontSize: '12px' }}>{msg('gender')}</FormHelperText>}
                    </FormControl>
                  </motion.div>
                </Grid>

                {/* Role */}
                <Grid item xs={12} sm={6}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.52 }}>
                    <FormControl fullWidth error={err('role')}>
                      <InputLabel sx={{ fontSize: '14px', color: '#6b7280', '&.Mui-focused': { color: '#4F46E5' } }}>Role</InputLabel>
                      <Select name="role" value={formik.values.role} onChange={formik.handleChange} onBlur={formik.handleBlur} label="Role" sx={selectSx}
                        MenuProps={{ PaperProps: { sx: { borderRadius: '12px', boxShadow: '0 8px 24px rgba(0,0,0,0.12)' } } }}>
                        <MenuItem value="Sales">Sales</MenuItem>
                        <MenuItem value="HR">HR</MenuItem>
                      </Select>
                      {err('role') && <FormHelperText sx={{ color: '#ef4444', fontSize: '12px' }}>{msg('role')}</FormHelperText>}
                    </FormControl>
                  </motion.div>
                </Grid>

                {/* Submit */}
                <Grid item xs={12}>
                  <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.58 }} whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}>
                    <Button type="submit" fullWidth variant="contained" disabled={formik.isSubmitting}
                      sx={{
                        height: '50px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                        textTransform: 'none', mt: 0.5,
                        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                        boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
                        '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)', boxShadow: '0 12px 32px rgba(79,70,229,0.5)' },
                        '&.Mui-disabled': { background: '#e5e7eb', color: '#9ca3af', boxShadow: 'none' },
                      }}
                    >
                      <AnimatePresence mode="wait">
                        {formik.isSubmitting ? (
                          <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <CircularProgress size={18} sx={{ color: '#fff' }} /> Creating account...
                          </motion.span>
                        ) : (
                          <motion.span key="r" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Create Account</motion.span>
                        )}
                      </AnimatePresence>
                    </Button>
                  </motion.div>
                </Grid>
              </Grid>

              <Typography sx={{ textAlign: 'center', mt: 2.5, fontSize: '14px', color: '#6b7280' }}>
                Already have an account?{' '}
                <Link href="/login" underline="hover" sx={{ color: '#4F46E5', fontWeight: 700 }}>Sign In</Link>
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Box>
    </Box>
  );
};

export default RegisterForm;
