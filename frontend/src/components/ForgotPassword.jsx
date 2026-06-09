import React, { useState } from 'react';
import {
  Box, Button, TextField, Typography,
  InputAdornment, IconButton, CircularProgress, Link,
} from '@mui/material';
import {
  Email, Lock, Numbers, Visibility, VisibilityOff,
  ArrowBack, CheckCircleOutline,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import api from '../utils/forgotapi';

/* ─── Field styles matching LoginForm ─── */
const fieldSx = {
  '& .MuiOutlinedInput-root': {
    borderRadius: '12px',
    background: '#ffffff',
    fontSize: '14px',
    '& fieldset': { borderColor: '#e2e8f0' },
    '&:hover fieldset': { borderColor: '#6366f1' },
    '&.Mui-focused fieldset': { borderColor: '#6366f1', borderWidth: '2px' },
    '&.Mui-focused': { boxShadow: '0 0 0 4px rgba(99,102,241,0.12)' },
  },
  '& .MuiInputLabel-root': { fontSize: '14px', color: '#64748b' },
  '& .MuiInputLabel-root.Mui-focused': { color: '#6366f1' },
  '& .MuiInputAdornment-root svg': { color: '#94a3b8', fontSize: '20px' },
  '& .MuiInputBase-input': { color: '#1e293b' },
  '& .MuiFormHelperText-root': { color: '#ef4444', fontSize: '12px' },
};

/* ─── Step indicator dot ─── */
const StepDot = ({ active, done, label }) => (
  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
    <Box sx={{
      width: 32, height: 32, borderRadius: '50%',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: done ? 'linear-gradient(135deg,#6366f1,#818cf8)' : active ? 'rgba(99,102,241,0.15)' : '#f1f5f9',
      border: `2px solid ${done || active ? '#6366f1' : '#e2e8f0'}`,
      transition: 'all 0.4s',
    }}>
      {done
        ? <CheckCircleOutline sx={{ fontSize: 16, color: '#fff' }} />
        : <Typography sx={{ fontSize: '12px', fontWeight: 700, color: active ? '#6366f1' : '#94a3b8' }}>{label}</Typography>
      }
    </Box>
  </Box>
);

const ForgotPassword = () => {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    if (!email) { setError('Please enter your email address'); return; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setError('Please enter a valid email address'); return; }
    setError(''); setLoading(true);
    try {
      const res = await api.post('/send-otp', { email });
      setMessage(res.data.message || 'OTP sent successfully');
      setStep(2);
    } catch (err) {
      setError(err.response?.data?.message || 'Error sending OTP. Please try again.');
    } finally { setLoading(false); }
  };

  const handleVerifyOtp = async () => {
    if (!otp) { setError('Please enter the OTP'); return; }
    if (!newPassword) { setError('Please enter a new password'); return; }
    if (newPassword.length < 6) { setError('Password must be at least 6 characters'); return; }
    if (newPassword !== confirmPassword) { setError('Passwords do not match'); return; }
    setError(''); setLoading(true);
    try {
      await api.post('/verify-otp', { email, otp, newPassword });
      setSuccess(true);
      setStep(3);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid OTP. Please try again.');
    } finally { setLoading(false); }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ display: 'flex', minHeight: '100vh', fontFamily: "'Inter','Poppins',sans-serif", backgroundColor: '#0f0e17' }}
    >
      {/* ══ LEFT PANEL ══ */}
      <Box sx={{
        flex: '0 0 50%', width: '50%',
        display: { xs: 'none', md: 'flex' },
        flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        position: 'relative', overflow: 'hidden',
        background: 'radial-gradient(ellipse at 40% 30%, #1a1400 0%, #0f0e17 60%, #0a0a0f 100%)',
        px: 5, py: 8,
      }}>
        {/* Ambient glow */}
        <Box sx={{
          position: 'absolute', top: '20%', left: '50%', transform: 'translateX(-50%)',
          width: 360, height: 360, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 65%)',
          pointerEvents: 'none',
        }} />

        {/* Logo */}
        <Box sx={{ position: 'absolute', top: 28, left: 32, display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Box sx={{
            width: 38, height: 38, borderRadius: '10px',
            background: 'rgba(99,102,241,0.15)',
            border: '1px solid rgba(99,102,241,0.35)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Typography sx={{ color: '#818cf8', fontWeight: 900, fontSize: '14px' }}>IT</Typography>
          </Box>
          <Box>
            <Typography sx={{ color: '#e2e8f0', fontWeight: 800, fontSize: '14px', lineHeight: 1.1 }}>Ideal Talent</Typography>
            <Typography sx={{ color: 'rgba(148,163,184,0.7)', fontSize: '9px', letterSpacing: '2.5px', textTransform: 'uppercase' }}>Connect</Typography>
          </Box>
        </Box>

        {/* Lock icon illustration */}
        <motion.div
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          style={{ marginBottom: 32 }}
        >
          <Box sx={{
            width: 120, height: 120, borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.2) 0%, rgba(99,102,241,0.05) 70%)',
            border: '2px solid rgba(99,102,241,0.25)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 0 40px rgba(99,102,241,0.15)',
          }}>
            <Lock sx={{ fontSize: 52, color: '#818cf8' }} />
          </Box>
        </motion.div>

        <Typography sx={{ fontWeight: 800, fontSize: '28px', textAlign: 'center', color: '#f1f5f9', mb: 1.5, lineHeight: 1.3 }}>
          Reset Your Password
        </Typography>
        <Typography sx={{ fontSize: '13.5px', textAlign: 'center', color: 'rgba(148,163,184,0.85)', lineHeight: 1.75, maxWidth: 280, mx: 'auto', mb: 4 }}>
          We'll send a one-time code to your email so you can securely reset your password.
        </Typography>

        {/* Steps guide */}
        {[
          { num: '1', text: 'Enter your registered email' },
          { num: '2', text: 'Enter the OTP sent to your inbox' },
          { num: '3', text: 'Set your new password' },
        ].map((s, i) => (
          <motion.div key={s.num} initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.12 }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1.4 }}>
              <Box sx={{
                width: 30, height: 30, borderRadius: '8px',
                background: step > i + 1 ? 'linear-gradient(135deg,#6366f1,#818cf8)' : step === i + 1 ? 'rgba(99,102,241,0.2)' : 'rgba(255,255,255,0.04)',
                border: `1px solid ${step >= i + 1 ? 'rgba(99,102,241,0.5)' : 'rgba(255,255,255,0.08)'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.4s',
              }}>
                {step > i + 1
                  ? <CheckCircleOutline sx={{ fontSize: 14, color: '#fff' }} />
                  : <Typography sx={{ fontSize: '12px', fontWeight: 700, color: step === i + 1 ? '#818cf8' : '#333' }}>{s.num}</Typography>
                }
              </Box>
              <Typography sx={{ fontSize: '13.5px', fontWeight: 500, color: step >= i + 1 ? 'rgba(203,213,225,0.9)' : '#2a2a35', transition: 'color 0.4s' }}>
                {s.text}
              </Typography>
            </Box>
          </motion.div>
        ))}
      </Box>

      {/* ══ RIGHT PANEL ══ */}
      <motion.div
        style={{
          flex: '0 0 50%', width: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          minHeight: '100vh', padding: '48px 20px',
          backgroundColor: '#13120e',
        }}
      >
        <motion.div
          initial={{ opacity: 0, x: 36 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.55, ease: 'easeOut' }}
          style={{ width: '100%', maxWidth: 420 }}
        >
          {/* Mobile logo */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, alignItems: 'center', gap: 1.2, mb: 3 }}>
            <Box sx={{ width: 34, height: 34, borderRadius: '9px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Typography sx={{ color: '#fff', fontWeight: 900, fontSize: '13px' }}>IT</Typography>
            </Box>
            <Typography sx={{ fontWeight: 800, fontSize: '15px', color: '#e2e8f0' }}>Ideal Talent Connect</Typography>
          </Box>

          {/* Card */}
          <Box sx={{
            background: '#ffffff',
            borderRadius: '22px',
            border: '1px solid #e2e8f0',
            p: { xs: 3, sm: 4.5 },
            boxShadow: '0 24px 64px rgba(99,102,241,0.14), 0 4px 24px rgba(0,0,0,0.12)',
          }}>
            {/* Step progress bar */}
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3.5 }}>
              {[1, 2, 3].map((s, i) => (
                <React.Fragment key={s}>
                  <StepDot active={step === s} done={step > s} label={String(s)} />
                  {i < 2 && (
                    <Box sx={{
                      flex: 1, height: 2, mx: 0.5,
                      background: step > s ? 'linear-gradient(90deg,#6366f1,#818cf8)' : '#e2e8f0',
                      borderRadius: 1, transition: 'background 0.4s',
                    }} />
                  )}
                </React.Fragment>
              ))}
            </Box>

            <AnimatePresence mode="wait">

              {/* ── STEP 1: Email ── */}
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '26px', color: '#1e293b', mb: 0.5 }}>Forgot Password?</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '13.5px', mb: 3 }}>
                    No worries! Enter your email and we'll send you a reset code.
                  </Typography>

                  <TextField
                    fullWidth label="Email Address" type="email"
                    value={email} onChange={(e) => { setEmail(e.target.value); setError(''); }}
                    sx={fieldSx}
                    slotProps={{
                      input: {
                        startAdornment: <InputAdornment position="start"><Email /></InputAdornment>,
                      },
                    }}
                  />

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                      <Typography sx={{ color: '#ef4444', fontSize: '12.5px', mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ⚠ {error}
                      </Typography>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }} style={{ marginTop: 20 }}>
                    <Button
                      fullWidth variant="contained" onClick={handleSendOtp} disabled={loading}
                      sx={{
                        height: '52px', borderRadius: '13px', fontWeight: 700, fontSize: '15px',
                        textTransform: 'none', letterSpacing: '0.3px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        boxShadow: '0 8px 28px rgba(99,102,241,0.38)',
                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 12px 36px rgba(99,102,241,0.5)' },
                        '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
                      }}
                    >
                      {loading ? <><CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} /> Sending OTP...</> : 'Send OTP'}
                    </Button>
                  </motion.div>

                  <Box sx={{ textAlign: 'center', mt: 2.5 }}>
                    <Link href="/login" underline="hover" sx={{ fontSize: '13px', color: '#6366f1', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: 0.5 }}>
                      <ArrowBack sx={{ fontSize: 14 }} /> Back to Login
                    </Link>
                  </Box>
                </motion.div>
              )}

              {/* ── STEP 2: OTP + New Password ── */}
              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} transition={{ duration: 0.3 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '26px', color: '#1e293b', mb: 0.5 }}>Check Your Email</Typography>
                  <Typography sx={{ color: '#64748b', fontSize: '13.5px', mb: 0.5 }}>
                    We sent a 6-digit code to
                  </Typography>
                  <Typography sx={{ color: '#6366f1', fontSize: '13.5px', fontWeight: 700, mb: 3 }}>{email}</Typography>

                  {message && (
                    <Box sx={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: '10px', px: 2, py: 1.2, mb: 2 }}>
                      <Typography sx={{ color: '#6366f1', fontSize: '13px', fontWeight: 500 }}>✓ {message}</Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.2 }}>
                    <TextField
                      fullWidth label="Enter OTP" value={otp}
                      onChange={(e) => { setOtp(e.target.value); setError(''); }}
                      inputProps={{ maxLength: 6 }}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Numbers /></InputAdornment>,
                        },
                      }}
                    />
                    <TextField
                      fullWidth label="New Password" type={showPwd ? 'text' : 'password'}
                      value={newPassword} onChange={(e) => { setNewPassword(e.target.value); setError(''); }}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowPwd(!showPwd)} edge="end" size="small">
                                {showPwd ? <VisibilityOff sx={{ fontSize: 19, color: '#94a3b8' }} /> : <Visibility sx={{ fontSize: 19, color: '#94a3b8' }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                    <TextField
                      fullWidth label="Confirm New Password" type={showConfirm ? 'text' : 'password'}
                      value={confirmPassword} onChange={(e) => { setConfirmPassword(e.target.value); setError(''); }}
                      sx={fieldSx}
                      slotProps={{
                        input: {
                          startAdornment: <InputAdornment position="start"><Lock /></InputAdornment>,
                          endAdornment: (
                            <InputAdornment position="end">
                              <IconButton onClick={() => setShowConfirm(!showConfirm)} edge="end" size="small">
                                {showConfirm ? <VisibilityOff sx={{ fontSize: 19, color: '#94a3b8' }} /> : <Visibility sx={{ fontSize: 19, color: '#94a3b8' }} />}
                              </IconButton>
                            </InputAdornment>
                          ),
                        },
                      }}
                    />
                  </Box>

                  {error && (
                    <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }}>
                      <Typography sx={{ color: '#ef4444', fontSize: '12.5px', mt: 1, display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        ⚠ {error}
                      </Typography>
                    </motion.div>
                  )}

                  <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }} style={{ marginTop: 20 }}>
                    <Button
                      fullWidth variant="contained" onClick={handleVerifyOtp} disabled={loading}
                      sx={{
                        height: '52px', borderRadius: '13px', fontWeight: 700, fontSize: '15px',
                        textTransform: 'none', letterSpacing: '0.3px',
                        background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                        boxShadow: '0 8px 28px rgba(99,102,241,0.38)',
                        '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 12px 36px rgba(99,102,241,0.5)' },
                        '&.Mui-disabled': { background: '#e2e8f0', color: '#94a3b8', boxShadow: 'none' },
                      }}
                    >
                      {loading ? <><CircularProgress size={18} sx={{ color: '#fff', mr: 1 }} /> Resetting...</> : 'Reset Password'}
                    </Button>
                  </motion.div>

                  <Box sx={{ textAlign: 'center', mt: 2 }}>
                    <Typography sx={{ fontSize: '13px', color: '#64748b', display: 'inline' }}>Didn't receive the code? </Typography>
                    <Link component="button" underline="hover" onClick={() => { setStep(1); setError(''); setMessage(''); }}
                      sx={{ fontSize: '13px', color: '#6366f1', fontWeight: 600, cursor: 'pointer', background: 'none', border: 'none' }}>
                      Resend OTP
                    </Link>
                  </Box>
                </motion.div>
              )}

              {/* ── STEP 3: Success ── */}
              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, scale: 0.92 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.4 }}>
                  <Box sx={{ textAlign: 'center', py: 2 }}>
                    <motion.div
                      initial={{ scale: 0 }} animate={{ scale: 1 }}
                      transition={{ type: 'spring', stiffness: 200, damping: 15, delay: 0.1 }}
                    >
                      <Box sx={{
                        width: 80, height: 80, borderRadius: '50%', mx: 'auto', mb: 3,
                        background: 'linear-gradient(135deg, rgba(99,102,241,0.15), rgba(129,140,248,0.1))',
                        border: '2px solid rgba(99,102,241,0.3)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        boxShadow: '0 0 30px rgba(99,102,241,0.2)',
                      }}>
                        <CheckCircleOutline sx={{ fontSize: 42, color: '#6366f1' }} />
                      </Box>
                    </motion.div>

                    <Typography sx={{ fontWeight: 800, fontSize: '26px', color: '#1e293b', mb: 1 }}>
                      Password Reset!
                    </Typography>
                    <Typography sx={{ color: '#64748b', fontSize: '13.5px', mb: 3, lineHeight: 1.7 }}>
                      Your password has been successfully updated. Redirecting you to login in a moment...
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 3 }}>
                      <CircularProgress size={16} sx={{ color: '#6366f1' }} />
                      <Typography sx={{ fontSize: '13px', color: '#6366f1', fontWeight: 500 }}>Redirecting to login...</Typography>
                    </Box>

                    <motion.div whileHover={{ scale: 1.015, y: -1 }} whileTap={{ scale: 0.985 }}>
                      <Button
                        fullWidth variant="contained" onClick={() => navigate('/login')}
                        sx={{
                          height: '52px', borderRadius: '13px', fontWeight: 700, fontSize: '15px',
                          textTransform: 'none', letterSpacing: '0.3px',
                          background: 'linear-gradient(135deg, #6366f1 0%, #818cf8 100%)',
                          boxShadow: '0 8px 28px rgba(99,102,241,0.38)',
                          '&:hover': { background: 'linear-gradient(135deg, #4f46e5 0%, #6366f1 100%)', boxShadow: '0 12px 36px rgba(99,102,241,0.5)' },
                        }}
                      >
                        Go to Login
                      </Button>
                    </motion.div>
                  </Box>
                </motion.div>
              )}

            </AnimatePresence>
          </Box>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};

export default ForgotPassword;
