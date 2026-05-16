import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Checkbox, FormControlLabel,
  InputAdornment, IconButton, Link, CircularProgress,
} from '@mui/material';
import {
  Email, Lock, Visibility, VisibilityOff, CheckCircle,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OtpModal from './OtpPrompt';

/* ─── Reusable SVG Illustration ─────────────────────────────────────── */
const AuthIllustration = () => (
  <svg viewBox="0 0 480 380" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: '100%', maxWidth: 420 }}>
    {/* Monitor */}
    <rect x="80" y="60" width="320" height="200" rx="16" fill="rgba(255,255,255,0.15)" stroke="rgba(255,255,255,0.35)" strokeWidth="2"/>
    <rect x="96" y="76" width="288" height="168" rx="8" fill="rgba(255,255,255,0.08)"/>
    {/* Screen content bars */}
    <rect x="116" y="100" width="120" height="10" rx="5" fill="rgba(255,255,255,0.5)"/>
    <rect x="116" y="120" width="180" height="8" rx="4" fill="rgba(255,255,255,0.3)"/>
    <rect x="116" y="138" width="150" height="8" rx="4" fill="rgba(255,255,255,0.25)"/>
    {/* Chart bars */}
    <rect x="116" y="180" width="24" height="44" rx="4" fill="rgba(255,255,255,0.55)"/>
    <rect x="148" y="160" width="24" height="64" rx="4" fill="rgba(255,255,255,0.7)"/>
    <rect x="180" y="170" width="24" height="54" rx="4" fill="rgba(255,255,255,0.55)"/>
    <rect x="212" y="150" width="24" height="74" rx="4" fill="rgba(255,255,255,0.8)"/>
    <rect x="244" y="165" width="24" height="59" rx="4" fill="rgba(255,255,255,0.6)"/>
    {/* Lock icon circle */}
    <circle cx="340" cy="160" r="36" fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.4)" strokeWidth="2"/>
    <rect x="326" y="158" width="28" height="22" rx="4" fill="rgba(255,255,255,0.7)"/>
    <path d="M332 158v-6a8 8 0 0116 0v6" stroke="rgba(255,255,255,0.9)" strokeWidth="2.5" strokeLinecap="round"/>
    <circle cx="340" cy="169" r="3" fill="rgba(79,70,229,0.9)"/>
    {/* Stand */}
    <rect x="220" y="260" width="40" height="20" rx="4" fill="rgba(255,255,255,0.2)"/>
    <rect x="190" y="278" width="100" height="10" rx="5" fill="rgba(255,255,255,0.25)"/>
    {/* Floating dots */}
    <circle cx="60" cy="120" r="8" fill="rgba(255,255,255,0.3)"/>
    <circle cx="420" cy="80" r="6" fill="rgba(255,255,255,0.25)"/>
    <circle cx="430" cy="260" r="10" fill="rgba(255,255,255,0.2)"/>
    <circle cx="50" cy="280" r="6" fill="rgba(255,255,255,0.2)"/>
    {/* Checkmark badges */}
    <circle cx="100" cy="320" r="14" fill="rgba(255,255,255,0.2)"/>
    <path d="M94 320l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="240" cy="340" r="14" fill="rgba(255,255,255,0.2)"/>
    <path d="M234 340l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="380" cy="320" r="14" fill="rgba(255,255,255,0.2)"/>
    <path d="M374 320l4 4 8-8" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

/* ─── Blob shape ─────────────────────────────────────────────────────── */
const Blob = ({ style }) => (
  <motion.div
    animate={{ scale: [1, 1.12, 1], rotate: [0, 15, 0] }}
    transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut' }}
    style={{
      position: 'absolute', borderRadius: '60% 40% 70% 30% / 50% 60% 40% 70%',
      filter: 'blur(48px)', pointerEvents: 'none', ...style,
    }}
  />
);

/* ─── Shared field styles ────────────────────────────────────────────── */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: '#f8f9ff',
    fontSize: '14px',
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

/* ─── Left panel ─────────────────────────────────────────────────────── */
const LeftPanel = ({ title, subtitle }) => (
  <Box sx={{
    flex: '0 0 50%', width: '50%', display: { xs: 'none', md: 'flex' }, flexDirection: 'column',
    justifyContent: 'center', alignItems: 'center', position: 'relative',
    overflow: 'hidden', px: 6, py: 8,
    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 50%, #EC4899 100%)',
    minHeight: '100vh',
  }}>
    {/* Animated blobs */}
    <Blob style={{ width: 340, height: 340, top: '-80px', left: '-80px', background: 'rgba(255,255,255,0.08)' }} />
    <Blob style={{ width: 260, height: 260, bottom: '-60px', right: '-60px', background: 'rgba(255,255,255,0.07)' }} />
    <Blob style={{ width: 180, height: 180, top: '40%', right: '10%', background: 'rgba(255,255,255,0.05)' }} />

    {/* Logo */}
    <Box sx={{ position: 'absolute', top: 32, left: 36, display: 'flex', alignItems: 'center', gap: 1.5 }}>
      <Box sx={{
        width: 40, height: 40, borderRadius: '10px',
        background: 'rgba(255,255,255,0.25)',
        backdropFilter: 'blur(8px)',
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

    {/* Illustration */}
    <motion.div
      animate={{ y: [0, -14, 0] }}
      transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
      style={{ width: '100%', maxWidth: 400, marginBottom: 40 }}
    >
      <AuthIllustration />
    </motion.div>

    {/* Heading */}
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
      <Typography sx={{ color: '#fff', fontWeight: 800, fontSize: { md: '28px', lg: '34px' }, textAlign: 'center', lineHeight: 1.25, mb: 2 }}>
        {title}
      </Typography>
      <Typography sx={{ color: 'rgba(255,255,255,0.75)', fontSize: '14px', textAlign: 'center', lineHeight: 1.7, maxWidth: 340, mx: 'auto', mb: 4 }}>
        {subtitle}
      </Typography>
    </motion.div>

    {/* Feature bullets */}
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
        {['Secure Login & Data Protection', 'Fast Access to Your Dashboard', 'User Friendly Interface'].map((f, i) => (
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

/* ═══════════════════════════════════════════════════════════════════════
   LOGIN FORM
═══════════════════════════════════════════════════════════════════════ */
const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [remember, setRemember] = useState(false);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) { setEmailError('Please enter a valid email address'); return; }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/pre-login', { email, password });
      if (res.data.otpRequired) {
        setShowOtpModal(true);
      } else {
        const { token, role, userId } = res.data;
        const exp = new Date().getTime() + 4 * 60 * 60 * 1000;
        sessionStorage.setItem('token', token);
        sessionStorage.setItem('role', role);
        sessionStorage.setItem('tokenExpiration', exp.toString());
        if (userId) sessionStorage.setItem('userId', userId);
        navigateToDashboard(role);
      }
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid credentials';
      alert(msg);
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token, role, userId } = res.data;
      const exp = new Date().getTime() + 4 * 60 * 60 * 1000;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('tokenExpiration', exp.toString());
      if (userId) sessionStorage.setItem('userId', userId);
      setIsLoading(false);
      navigateToDashboard(role);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid OTP';
      alert(msg);
      setIsLoading(false);
    }
  };

  const navigateToDashboard = async (role) => {
    if (role === 'admin') { navigate('/master-dashboard'); return; }
    if (role === 'teamleader') { navigate('/tl-job-report'); return; }
    if (role === 'Sales') { navigate('/sales-master-dashboard'); return; }
    if (role === 'HR') {
      // Check if HR has already created a daily task today
      try {
        const token = sessionStorage.getItem('token');
        const res = await api.get('/dailyTask/hr/today-check', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (res.data.hasTask) {
          navigate('/hr-master-dashboard');
        } else {
          navigate('/daily-hr-task');
        }
      } catch {
        // On error, fall back to master dashboard
        navigate('/hr-master-dashboard');
      }
      return;
    }
    navigate('/user-dashboard');
  };

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter', 'Poppins', sans-serif" }}>
      <LeftPanel
        title="Welcome Back!"
        subtitle="Manage your dashboard, track activity, and access your account securely."
      />

      {/* Right side */}
      <Box sx={{
        flex: '0 0 50%', width: '50%', display: 'flex', alignItems: 'center',
        justifyContent: 'center', background: '#f5f6fa', px: { xs: 2, sm: 4 }, py: 6,
        minHeight: '100vh',
      }}>
        <motion.div
          initial={{ opacity: 0, x: 40 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 400 }}
        >
          {/* Card */}
          <Box sx={{
            background: 'rgba(255,255,255,0.85)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            borderRadius: '20px',
            boxShadow: '0 20px 60px rgba(79,70,229,0.12), 0 4px 20px rgba(0,0,0,0.06)',
            border: '1px solid rgba(255,255,255,0.9)',
            p: { xs: 3, sm: 4.5 },
          }}>
            {/* Mobile logo */}
            <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.2, mb: 3 }}>
              <Box sx={{ width: 36, height: 36, borderRadius: '9px', background: 'linear-gradient(135deg,#4F46E5,#7C3AED)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '14px' }}>IT</Typography>
              </Box>
              <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#1e1b4b' }}>Ideal Talent Connect</Typography>
            </Box>

            <Typography sx={{ fontWeight: 800, fontSize: '26px', color: '#111827', mb: 0.5 }}>Sign In</Typography>
            <Typography sx={{ color: '#6b7280', fontSize: '14px', mb: 3.5 }}>Enter your credentials to access your account</Typography>

            <Box component="form" onSubmit={handleLogin} noValidate>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  fullWidth label="Email Address" value={email}
                  error={Boolean(emailError)} helperText={emailError}
                  onChange={(e) => { setEmail(e.target.value); if (emailError && validateEmail(e.target.value)) setEmailError(''); }}
                  sx={fieldSx}
                  InputProps={{ startAdornment: <InputAdornment position="start"><Email /></InputAdornment> }}
                />
                <TextField
                  fullWidth label="Password" type={showPassword ? 'text' : 'password'}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                  sx={fieldSx}
                  InputProps={{
                    startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
                          {showPassword ? <VisibilityOff sx={{ fontSize: 20, color: '#9ca3af' }} /> : <Visibility sx={{ fontSize: 20, color: '#9ca3af' }} />}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />
              </Box>

              {/* Remember + Forgot */}
              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, mb: 0.5 }}>
                <FormControlLabel
                  control={<Checkbox checked={remember} onChange={(e) => setRemember(e.target.checked)} size="small" sx={{ color: '#d1d5db', '&.Mui-checked': { color: '#4F46E5' } }} />}
                  label={<Typography sx={{ fontSize: '13px', color: '#6b7280' }}>Remember me</Typography>}
                />
                <Link href="/forgot-password" underline="hover" sx={{ fontSize: '13px', color: '#4F46E5', fontWeight: 600 }}>
                  Forgot password?
                </Link>
              </Box>

              {/* Login button */}
              <motion.div whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }} style={{ marginTop: 16 }}>
                <Button
                  type="submit" fullWidth variant="contained" disabled={isLoading}
                  sx={{
                    height: '50px', borderRadius: '12px', fontWeight: 700, fontSize: '15px',
                    textTransform: 'none', letterSpacing: '0.2px',
                    background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                    boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
                    '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)', boxShadow: '0 12px 32px rgba(79,70,229,0.5)' },
                    '&.Mui-disabled': { background: '#e5e7eb', color: '#9ca3af', boxShadow: 'none' },
                  }}
                >
                  <AnimatePresence mode="wait">
                    {isLoading ? (
                      <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <CircularProgress size={18} sx={{ color: '#fff' }} /> Signing in...
                      </motion.span>
                    ) : (
                      <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>Sign In</motion.span>
                    )}
                  </AnimatePresence>
                </Button>
              </motion.div>


            </Box>
          </Box>
        </motion.div>
      </Box>

      <OtpModal
        open={showOtpModal}
        onClose={() => { setShowOtpModal(false); setIsLoading(false); }}
        email={email}
        onSubmit={handleOtpSubmit}
        onSuccess={navigateToDashboard}
      />
    </Box>
  );
};

export default LoginForm;
