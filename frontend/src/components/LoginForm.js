import React, { useState } from 'react';
import {
  Box, TextField, Button, Typography, Checkbox, FormControlLabel,
  InputAdornment, IconButton, Link, CircularProgress,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/api';
import OtpModal from './OtpPrompt';

/* ─────────────────────────────────────────────────────────────────────
   REAL LAMP SVG  — mushroom dome style (like the reel image)
   Click anywhere on the lamp to toggle ON / OFF
───────────────────────────────────────────────────────────────────── */
const RealisticLamp = ({ isOn, onToggle }) => (
  <Box
    onClick={onToggle}
    title={isOn ? 'Click to turn off' : 'Click to turn on'}
    sx={{ cursor: 'pointer', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative' }}
  >
    {/* Radial floor glow when ON */}
    <AnimatePresence>
      {isOn && (
        <motion.div
          key="floor-glow"
          initial={{ opacity: 0, scaleX: 0.3 }}
          animate={{ opacity: 1, scaleX: 1 }}
          exit={{ opacity: 0, scaleX: 0.3 }}
          transition={{ duration: 0.7 }}
          style={{
            position: 'absolute', bottom: -10, left: '50%',
            transform: 'translateX(-50%)',
            width: 160, height: 28,
            borderRadius: '50%',
            background: 'radial-gradient(ellipse, rgba(255,210,80,0.45) 0%, transparent 70%)',
            filter: 'blur(6px)',
            pointerEvents: 'none',
          }}
        />
      )}
    </AnimatePresence>

    <svg width="140" height="220" viewBox="0 0 140 220" fill="none" xmlns="http://www.w3.org/2000/svg">
      <defs>
        {/* Shade gradient */}
        <radialGradient id="shadeGrad" cx="50%" cy="30%" r="70%">
          <stop offset="0%" stopColor={isOn ? '#fff8e1' : '#d6cfc0'} />
          <stop offset="60%" stopColor={isOn ? '#ffe082' : '#b8b0a0'} />
          <stop offset="100%" stopColor={isOn ? '#ffb300' : '#8a8070'} />
        </radialGradient>
        {/* Inner bulb glow */}
        <radialGradient id="bulbGlow" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor={isOn ? '#fff9c4' : '#555'} stopOpacity={isOn ? 1 : 0.4} />
          <stop offset="100%" stopColor={isOn ? '#ffd54f' : '#333'} stopOpacity={0} />
        </radialGradient>
        {/* Stem gradient */}
        <linearGradient id="stemGrad" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={isOn ? '#bfa060' : '#6b6458'} />
          <stop offset="40%" stopColor={isOn ? '#e8c87a' : '#8a8070'} />
          <stop offset="100%" stopColor={isOn ? '#a07840' : '#504840'} />
        </linearGradient>
        {/* Base gradient */}
        <linearGradient id="baseGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={isOn ? '#d4a840' : '#7a7060'} />
          <stop offset="100%" stopColor={isOn ? '#8a6010' : '#3a3428'} />
        </linearGradient>
        {/* Shade inner shadow */}
        <radialGradient id="shadeInner" cx="50%" cy="100%" r="60%">
          <stop offset="0%" stopColor="rgba(0,0,0,0.25)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </radialGradient>
        {/* Ambient light cone */}
        <linearGradient id="lightCone" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="rgba(255,220,80,0.18)" />
          <stop offset="100%" stopColor="rgba(255,220,80,0)" />
        </linearGradient>
      </defs>

      {/* ── Light cone below shade ── */}
      {isOn && (
        <motion.path
          d="M42 108 L10 200 L130 200 L98 108 Z"
          fill="url(#lightCone)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* ── Dome shade outer shape ── */}
      <ellipse cx="70" cy="72" rx="52" ry="18" fill={isOn ? '#fff3cd' : '#ccc5b0'} opacity="0.6" />
      <path
        d="M18 72 Q20 108 42 118 Q56 124 70 124 Q84 124 98 118 Q120 108 122 72 Z"
        fill="url(#shadeGrad)"
        stroke={isOn ? 'rgba(255,180,0,0.4)' : 'rgba(100,90,70,0.4)'}
        strokeWidth="1"
      />
      {/* Shade inner shadow for depth */}
      <path
        d="M18 72 Q20 108 42 118 Q56 124 70 124 Q84 124 98 118 Q120 108 122 72 Z"
        fill="url(#shadeInner)"
      />
      {/* Shade top rim */}
      <ellipse cx="70" cy="72" rx="52" ry="18"
        fill={isOn ? '#fff8e1' : '#d6cfc0'}
        stroke={isOn ? 'rgba(255,200,50,0.6)' : 'rgba(120,110,90,0.5)'}
        strokeWidth="1.5"
      />
      {/* Shade highlight stripe */}
      <path d="M30 80 Q50 76 70 76 Q90 76 110 80" stroke="rgba(255,255,255,0.35)" strokeWidth="2.5" strokeLinecap="round" fill="none" />

      {/* ── Bulb visible inside shade ── */}
      <ellipse cx="70" cy="116" rx="14" ry="8" fill="url(#bulbGlow)" />
      {isOn && (
        <>
          <ellipse cx="70" cy="116" rx="8" ry="5" fill="#fffde7" opacity="0.95" />
          <ellipse cx="70" cy="116" rx="14" ry="8" fill="rgba(255,240,100,0.3)" style={{ filter: 'blur(3px)' }} />
        </>
      )}

      {/* ── Neck connector ── */}
      <rect x="64" y="120" width="12" height="10" rx="4" fill="url(#stemGrad)" />

      {/* ── Main stem ── */}
      <rect x="66" y="130" width="8" height="52" rx="4" fill="url(#stemGrad)" />
      {/* Stem highlight */}
      <rect x="68" y="132" width="2.5" height="48" rx="1.5" fill="rgba(255,255,255,0.2)" />

      {/* ── Pull cord ── */}
      <line x1="70" y1="148" x2="70" y2="168" stroke={isOn ? '#d4a840' : '#6b6458'} strokeWidth="1.5" strokeDasharray="3 2" />
      <circle cx="70" cy="170" r="5"
        fill={isOn ? '#ff7043' : '#444'}
        stroke={isOn ? '#bf360c' : '#222'}
        strokeWidth="1.5"
      />
      {/* Cord knot highlight */}
      <circle cx="69" cy="169" r="1.5" fill="rgba(255,255,255,0.4)" />

      {/* ── Base platform ── */}
      <ellipse cx="70" cy="186" rx="30" ry="8" fill="url(#baseGrad)" />
      <ellipse cx="70" cy="183" rx="28" ry="6"
        fill={isOn ? '#c8a030' : '#6a6050'}
        stroke={isOn ? 'rgba(255,200,50,0.5)' : 'rgba(80,70,55,0.5)'}
        strokeWidth="1"
      />
      {/* Base highlight */}
      <ellipse cx="62" cy="181" rx="10" ry="2.5" fill="rgba(255,255,255,0.15)" />

      {/* ── Ambient glow ring around shade when ON ── */}
      {isOn && (
        <ellipse cx="70" cy="95" rx="58" ry="32"
          fill="none"
          stroke="rgba(255,210,60,0.12)"
          strokeWidth="18"
          style={{ filter: 'blur(8px)' }}
        />
      )}
    </svg>

    {/* ON / OFF badge */}
    <Box sx={{
      mt: 0.5, px: 1.5, py: 0.3,
      borderRadius: '20px',
      background: isOn ? 'rgba(255,200,50,0.18)' : 'rgba(255,255,255,0.06)',
      border: `1px solid ${isOn ? 'rgba(255,200,50,0.4)' : 'rgba(255,255,255,0.1)'}`,
      transition: 'all 0.5s ease',
    }}>
      <Typography sx={{
        fontSize: '10px', fontWeight: 800, letterSpacing: '3px',
        color: isOn ? '#ffd54f' : '#555',
        textTransform: 'uppercase',
        transition: 'color 0.5s',
      }}>
        {isOn ? '● ON' : '○ OFF'}
      </Typography>
    </Box>
  </Box>
);

/* ─────────────────────────────────────────────────────────────────────
   FIELD STYLES  — light card (lamp ON) vs muted dark (lamp OFF)
───────────────────────────────────────────────────────────────────── */
const getFieldSx = (disabled) => ({
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: disabled ? 'rgba(255,255,255,0.03)' : '#ffffff',
    fontSize: '14px',
    transition: 'background 0.5s',
    '& fieldset': { borderColor: disabled ? 'rgba(255,255,255,0.08)' : '#e2e8f0' },
    '&:hover fieldset': { borderColor: disabled ? 'rgba(255,255,255,0.08)' : '#6366f1' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '2px' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(99,102,241,0.12)' },
  },
  '& .MuiInputLabel-root': { fontSize: '14px', color: disabled ? '#3a3a3a' : '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
  '& .MuiInputAdornment-root svg': { color: disabled ? '#2a2a2a' : '#94a3b8', fontSize: '20px' },
  '& .MuiInputBase-input': { color: disabled ? '#2a2a2a' : '#1e293b' },
  '& .MuiFormHelperText-root': { color: '#ef4444', fontSize: '12px' },
});

/* ─────────────────────────────────────────────────────────────────────
   MAIN LOGIN FORM
───────────────────────────────────────────────────────────────────── */
const LoginForm = () => {
  const [email, setEmail]           = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword]     = useState('');
  const [showPwd, setShowPwd]       = useState(false);
  const [remember, setRemember]     = useState(false);
  const [showOtp, setShowOtp]       = useState(false);
  const [loading, setLoading]       = useState(false);
  const [lampOn, setLampOn]         = useState(false);
  const navigate = useNavigate();

  const validateEmail = (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);

  /* ── Login submit ── */
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!lampOn) return;
    if (!validateEmail(email)) { setEmailError('Please enter a valid email address'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/pre-login', { email, password });
      if (res.data.otpRequired) {
        setShowOtp(true);
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
      alert(err.response?.data?.message || 'Invalid credentials');
      setLoading(false);
    }
  };

  /* ── OTP submit ── */
  const handleOtpSubmit = async (otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token, role, userId } = res.data;
      const exp = new Date().getTime() + 4 * 60 * 60 * 1000;
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('tokenExpiration', exp.toString());
      if (userId) sessionStorage.setItem('userId', userId);
      setLoading(false);
      navigateToDashboard(role);
    } catch (err) {
      alert(err.response?.data?.message || 'Invalid OTP');
      setLoading(false);
    }
  };

  /* ── Role routing ── */
  const navigateToDashboard = async (role) => {
    if (role === 'admin')      { navigate('/master-dashboard'); return; }
    if (role === 'teamleader') { navigate('/tl-job-report'); return; }
    if (role === 'Sales')      { navigate('/sales-master-dashboard'); return; }
    if (role === 'HR') {
      try {
        const token = sessionStorage.getItem('token');
        const res = await api.get('/dailyTask/hr/today-check', { headers: { Authorization: `Bearer ${token}` } });
        navigate(res.data.hasTask ? '/hr-master-dashboard' : '/daily-hr-task');
      } catch { navigate('/hr-master-dashboard'); }
      return;
    }
    navigate('/user-dashboard');
  };

  /* ── Theme tokens ── */
  const pageBg   = lampOn ? '#0f0e17'   : '#0a0a0f';
  const leftBg   = lampOn
    ? 'radial-gradient(ellipse at 40% 30%, #1a1400 0%, #0f0e17 60%, #0a0a0f 100%)'
    : 'radial-gradient(ellipse at 40% 30%, #0d0d18 0%, #080810 60%, #050508 100%)';
  const rightBg  = lampOn ? '#13120e'   : '#0c0c10';
  const cardBg   = lampOn ? '#ffffff'   : '#111118';
  const cardBorder = lampOn ? '#e2e8f0' : 'rgba(255,255,255,0.06)';
  const headingColor = lampOn ? '#1e293b' : '#2a2a35';
  const subColor     = lampOn ? '#64748b' : '#2a2a35';
  const labelColor   = lampOn ? '#1e293b' : '#2a2a35';
  const linkColor    = lampOn ? '#6366f1' : '#2a2a35';

  return (
    <motion.div
      animate={{ backgroundColor: pageBg }}
      transition={{ duration: 0.9 }}
      style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Poppins',sans-serif" }}
    >
      {/* ══════════════ LEFT PANEL ══════════════ */}
      <Box sx={{
        flex: '0 0 50%', width: '50%',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: leftBg,
        minHeight: '100vh',
        transition: 'background 0.9s ease',
        px: 5, py: 8,
      }}>

        {/* Ambient warm glow when ON */}
        <AnimatePresence>
          {lampOn && (
            <motion.div key="ambient"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              transition={{ duration: 1 }}
              style={{
                position: 'absolute', top: '20%', left: '50%',
                transform: 'translateX(-50%)',
                width: 360, height: 360, borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255,200,50,0.10) 0%, transparent 65%)',
                pointerEvents: 'none',
              }}
            />
          )}
        </AnimatePresence>

        {/* Logo top-left */}
        <Box sx={{ position: 'absolute', top: 28, left: 32, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '10px',
            background: lampOn ? 'rgba(99,102,241,0.15)' : 'rgba(255,255,255,0.04)',
            border: `1px solid ${lampOn ? 'rgba(99,102,241,0.35)' : 'rgba(255,255,255,0.08)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            transition: 'all 0.6s',
          }}>
            <Typography sx={{ color: lampOn ? '#818cf8' : '#333', fontWeight: 900, fontSize: '14px', transition: 'color 0.6s' }}>IT</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: lampOn ? '#e2e8f0' : '#252530', fontWeight: 800, fontSize: '14px', lineHeight: 1.1, transition: 'color 0.6s' }}>Ideal Talent</Typography>
            <Typography sx={{ color: lampOn ? 'rgba(148,163,184,0.7)' : '#1a1a22', fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase', transition: 'color 0.6s' }}>Connect</Typography>
          </Box>
        </Box>

        {/* Lamp — gently floating */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 28 }}
        >
          <RealisticLamp isOn={lampOn} onToggle={() => setLampOn(v => !v)} />
        </motion.div>

        {/* Heading */}
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Typography sx={{
            fontWeight: 800, fontSize: { md: '26px', lg: '30px' }, textAlign: 'center', lineHeight: 1.3, mb: 1.5,
            color: lampOn ? '#f1f5f9' : '#1e1e28',
            transition: 'color 0.8s',
          }}>
            {lampOn ? 'Welcome Back!' : 'Turn On the Lamp'}
          </Typography>
          <Typography sx={{
            fontSize: '13.5px', textAlign: 'center', lineHeight: 1.75, maxWidth: 280, mx: 'auto', mb: 3.5,
            color: lampOn ? 'rgba(148,163,184,0.85)' : '#181820',
            transition: 'color 0.8s',
          }}>
            {lampOn
              ? 'Manage your dashboard, track activity, and access your account securely.'
              : 'Click the lamp above to illuminate your login experience.'}
          </Typography>
        </motion.div>

        {/* Feature list — only when ON */}
        <AnimatePresence>
          {lampOn && (
            <motion.div key="feats"
              initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 14 }} transition={{ duration: 0.45 }}
            >
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.4 }}>
                {[
                  { icon: '🔒', text: 'Secure Login & Data Protection' },
                  { icon: '⚡', text: 'Fast Access to Your Dashboard' },
                  { icon: '✨', text: 'Clean & Intuitive Interface' },
                ].map((f, i) => (
                  <motion.div key={f.text} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Box sx={{ width: 32, height: 32, borderRadius: '8px', background: 'rgba(99,102,241,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px' }}>
                        {f.icon}
                      </Box>
                      <Typography sx={{ color: 'rgba(203,213,225,0.85)', fontSize: '13.5px', fontWeight: 500 }}>{f.text}</Typography>
                    </Box>
                  </motion.div>
                ))}
              </Box>
            </motion.div>
          )}
        </AnimatePresence>
      </Box>

      {/* ══════════════ RIGHT PANEL ══════════════ */}
      <motion.div
        animate={{ backgroundColor: rightBg }}
        transition={{ duration: 0.9 }}
        style={{
          flex: '0 0 50%', width: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '48px 20px',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Mobile lamp */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, justifyContent: 'center', mb: 3 }}>
            <RealisticLamp isOn={lampOn} onToggle={() => setLampOn(v => !v)} />
          </Box>

          {/* ── Card ── */}
          <motion.div
            animate={{
              boxShadow: lampOn
                ? '0 24px 64px rgba(99,102,241,0.14), 0 4px 24px rgba(0,0,0,0.12)'
                : '0 24px 64px rgba(0,0,0,0.6)',
            }}
            transition={{ duration: 0.8 }}
            style={{ borderRadius: 22 }}
          >
            <Box sx={{
              background: cardBg,
              borderRadius: '22px',
              border: `1px solid ${cardBorder}`,
              p: { xs: 3, sm: 4.5 },
              transition: 'background 0.7s, border-color 0.7s',
            }}>

              {/* Mobile logo */}
              <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.2, mb: 3 }}>
                <Box sx={{
                  width: 34, height: 34, borderRadius: '9px',
                  background: lampOn ? 'linear-gradient(135deg,#6366f1,#818cf8)' : '#1a1a22',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'background 0.6s',
                }}>
                  <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '13px' }}>IT</Typography>
                </Box>
                <Typography sx={{ fontWeight: 800, fontSize: '15px', color: lampOn ? '#1e293b' : '#252530', transition: 'color 0.6s' }}>
                  Ideal Talent Connect
                </Typography>
              </Box>

              {/* Heading */}
              <Typography sx={{ fontWeight: 800, fontSize: '27px', color: headingColor, mb: 0.5, transition: 'color 0.7s' }}>
                Sign In
              </Typography>
              <Typography sx={{ color: subColor, fontSize: '13.5px', mb: 3.5, transition: 'color 0.7s' }}>
                {lampOn ? 'Enter your credentials to access your account' : 'Turn on the lamp to enable login'}
              </Typography>

              {/* Form */}
              <Box component="form" onSubmit={handleLogin} noValidate>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>

                  {/* Email */}
                  <TextField
                    fullWidth label="Email Address" value={email}
                    disabled={!lampOn}
                    error={Boolean(emailError)} helperText={emailError}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (emailError && validateEmail(e.target.value)) setEmailError('');
                    }}
                    sx={getFieldSx(!lampOn)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Email sx={{ fontSize: 20, color: lampOn ? '#94a3b8' : '#2a2a35' }} />
                          </InputAdornment>
                        ),
                      },
                    }}
                  />

                  {/* Password */}
                  <TextField
                    fullWidth label="Password"
                    type={showPwd ? 'text' : 'password'}
                    value={password}
                    disabled={!lampOn}
                    onChange={(e) => setPassword(e.target.value)}
                    sx={getFieldSx(!lampOn)}
                    slotProps={{
                      input: {
                        startAdornment: (
                          <InputAdornment position="start">
                            <Lock sx={{ fontSize: 20, color: lampOn ? '#94a3b8' : '#2a2a35' }} />
                          </InputAdornment>
                        ),
                        endAdornment: (
                          <InputAdornment position="end">
                            <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small" disabled={!lampOn}>
                              {showPwd
                                ? <VisibilityOff sx={{ fontSize: 19, color: lampOn ? '#94a3b8' : '#2a2a35' }} />
                                : <Visibility   sx={{ fontSize: 19, color: lampOn ? '#94a3b8' : '#2a2a35' }} />}
                            </IconButton>
                          </InputAdornment>
                        ),
                      },
                    }}
                  />
                </Box>

                {/* Remember + Forgot */}
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 1.5, mb: 0.5 }}>
                  <FormControlLabel
                    disabled={!lampOn}
                    control={
                      <Checkbox
                        checked={remember}
                        onChange={(e) => setRemember(e.target.checked)}
                        size="small"
                        sx={{ color: lampOn ? '#cbd5e1' : '#222', '&.Mui-checked': { color: '#6366f1' } }}
                      />
                    }
                    label={<Typography sx={{ fontSize: '13px', color: lampOn ? '#64748b' : '#222', transition: 'color 0.6s' }}>Remember me</Typography>}
                  />
                  <Link
                    href="/forgot-password" underline="hover"
                    sx={{ fontSize: '13px', color: linkColor, fontWeight: 600, pointerEvents: lampOn ? 'auto' : 'none', transition: 'color 0.6s' }}
                  >
                    Forgot password?
                  </Link>
                </Box>

                {/* Submit button */}
                <motion.div
                  whileHover={lampOn ? { scale: 1.015, y: -1 } : {}}
                  whileTap={lampOn ? { scale: 0.985 } : {}}
                  style={{ marginTop: 20 }}
                >
                  <Button
                    type="submit" fullWidth variant="contained"
                    disabled={loading || !lampOn}
                    sx={{
                      height: '52px', borderRadius: '13px',
                      fontWeight: 700, fontSize: '15px',
                      textTransform: 'none', letterSpacing: '0.3px',
                      background: lampOn
                        ? 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)'
                        : '#111118',
                      color: lampOn ? '#fff' : '#252530',
                      boxShadow: lampOn ? '0 8px 28px rgba(99,102,241,0.38)' : 'none',
                      transition: 'all 0.6s ease',
                      '&:hover': {
                        background: lampOn ? 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)' : '#111118',
                        boxShadow: lampOn ? '0 12px 36px rgba(99,102,241,0.5)' : 'none',
                      },
                      '&.Mui-disabled': {
                        background: lampOn ? '#e2e8f0' : '#0e0e14',
                        color: lampOn ? '#94a3b8' : '#1e1e28',
                        boxShadow: 'none',
                      },
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CircularProgress size={18} sx={{ color: '#fff' }} /> Signing in...
                        </motion.span>
                      ) : (
                        <motion.span key="s" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          {lampOn ? 'Sign In' : '💡 Turn On Lamp to Login'}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* OTP Modal */}
      <OtpModal
        open={showOtp}
        onClose={() => { setShowOtp(false); setLoading(false); }}
        email={email}
        onSubmit={handleOtpSubmit}
        onSuccess={navigateToDashboard}
      />
    </motion.div>
  );
};

export default LoginForm;
