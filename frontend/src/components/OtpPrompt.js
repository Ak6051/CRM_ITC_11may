import React, { useState, useRef, useEffect } from 'react';
import { Dialog, Button, Typography, IconButton, Box, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { MarkEmailRead } from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';
import api from '../utils/api';

const OTP_LENGTH = 4;

const OtpModal = ({ open, onClose, email, onSuccess }) => {
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const inputRefs = useRef([]);

  // countdown timer
  useEffect(() => {
    if (!open) return;
    setResendTimer(30);
    const interval = setInterval(() => {
      setResendTimer((t) => (t > 0 ? t - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [open]);

  // focus first input on open
  useEffect(() => {
    if (open) {
      setOtp(Array(OTP_LENGTH).fill(''));
      setError('');
      setTimeout(() => inputRefs.current[0]?.focus(), 100);
    }
  }, [open]);

  const handleChange = (index, value) => {
    if (!/^\d*$/.test(value)) return;
    const updated = [...otp];
    updated[index] = value.slice(-1);
    setOtp(updated);
    setError('');
    if (value && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
    if (e.key === 'ArrowLeft' && index > 0) inputRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < OTP_LENGTH - 1) inputRefs.current[index + 1]?.focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;
    const updated = Array(OTP_LENGTH).fill('');
    pasted.split('').forEach((ch, i) => { updated[i] = ch; });
    setOtp(updated);
    const nextFocus = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextFocus]?.focus();
  };

  const handleVerify = async () => {
    const code = otp.join('');
    if (code.length < OTP_LENGTH) { setError('Please enter all 4 digits'); return; }
    setLoading(true);
    try {
      const res = await api.post('/auth/verify-otp', { email, otp: code });
      const { token, role, userId } = res.data;
      const exp = new Date().getTime() + 4 * 60 * 60 * 1000;
      if (userId) sessionStorage.setItem('userId', userId);
      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('tokenExpiration', exp.toString());
      onClose();
      onSuccess(role);
    } catch {
      setError('Invalid or expired OTP. Please try again.');
      setOtp(Array(OTP_LENGTH).fill(''));
      setTimeout(() => inputRefs.current[0]?.focus(), 50);
    } finally {
      setLoading(false);
    }
  };

  const maskedEmail = email
    ? email.replace(/(.{2})(.*)(@.*)/, (_, a, b, c) => a + '*'.repeat(Math.min(b.length, 5)) + c)
    : '';

  return (
    <Dialog
      open={open}
      onClose={() => {}}
      disableEscapeKeyDown
      maxWidth="xs"
      fullWidth
      PaperProps={{
        sx: {
          background: 'transparent',
          boxShadow: 'none',
          overflow: 'visible',
        },
      }}
      BackdropProps={{
        sx: { backdropFilter: 'blur(6px)', background: 'rgba(15,10,40,0.55)' },
      }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, scale: 0.88, y: 30 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.88, y: 30 }}
            transition={{ duration: 0.35, ease: [0.34, 1.56, 0.64, 1] }}
          >
            <Box sx={{
              background: '#fff',
              borderRadius: '24px',
              boxShadow: '0 32px 80px rgba(79,70,229,0.18), 0 8px 32px rgba(0,0,0,0.1)',
              border: '1px solid rgba(79,70,229,0.1)',
              overflow: 'hidden',
              position: 'relative',
            }}>
              {/* Top gradient bar */}
              <Box sx={{
                height: 5,
                background: 'linear-gradient(90deg, #4F46E5, #7C3AED, #EC4899)',
              }} />

              {/* Close button */}
              <IconButton
                onClick={onClose}
                size="small"
                sx={{
                  position: 'absolute', top: 16, right: 16,
                  color: '#9ca3af', background: '#f3f4f6',
                  '&:hover': { background: '#e5e7eb', color: '#374151' },
                }}
              >
                <CloseIcon fontSize="small" />
              </IconButton>

              <Box sx={{ px: 4, pt: 4, pb: 4 }}>
                {/* Icon */}
                <motion.div
                  initial={{ scale: 0, rotate: -20 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.15, type: 'spring', stiffness: 260, damping: 18 }}
                  style={{ display: 'flex', justifyContent: 'center', marginBottom: 20 }}
                >
                  <Box sx={{
                    width: 68, height: 68, borderRadius: '20px',
                    background: 'linear-gradient(135deg, #4F46E5, #7C3AED)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    boxShadow: '0 12px 32px rgba(79,70,229,0.35)',
                  }}>
                    <MarkEmailRead sx={{ color: '#fff', fontSize: 34 }} />
                  </Box>
                </motion.div>

                {/* Heading */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
                  <Typography sx={{ fontWeight: 800, fontSize: '22px', color: '#111827', textAlign: 'center', mb: 0.75 }}>
                    Verify Your Email
                  </Typography>
                  <Typography sx={{ fontSize: '13.5px', color: '#6b7280', textAlign: 'center', lineHeight: 1.6, mb: 3 }}>
                    We sent a 4-digit code to<br />
                    <Box component="span" sx={{ color: '#4F46E5', fontWeight: 700 }}>{maskedEmail}</Box>
                  </Typography>
                </motion.div>

                {/* OTP inputs */}
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.28 }}>
                  <Box sx={{ display: 'flex', gap: 1.2, justifyContent: 'center', mb: 1 }} onPaste={handlePaste}>
                    {otp.map((digit, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.3 + i * 0.05 }}
                      >
                        <Box
                          component="input"
                          ref={(el) => (inputRefs.current[i] = el)}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleChange(i, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(i, e)}
                          sx={{
                            width: 46, height: 54,
                            textAlign: 'center',
                            fontSize: '22px', fontWeight: 700,
                            color: '#111827',
                            border: `2px solid ${error ? '#ef4444' : digit ? '#4F46E5' : '#e2e5f1'}`,
                            borderRadius: '12px',
                            background: digit ? 'rgba(79,70,229,0.06)' : '#f8f9ff',
                            outline: 'none',
                            cursor: 'text',
                            transition: 'all 0.18s ease',
                            fontFamily: "'Inter', sans-serif",
                            '&:focus': {
                              borderColor: '#4F46E5',
                              background: 'rgba(79,70,229,0.08)',
                              boxShadow: '0 0 0 4px rgba(79,70,229,0.12)',
                            },
                          }}
                        />
                      </motion.div>
                    ))}
                  </Box>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.div
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                      >
                        <Typography sx={{ color: '#ef4444', fontSize: '12.5px', textAlign: 'center', mt: 1 }}>
                          {error}
                        </Typography>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>

                {/* Verify button */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}
                  whileHover={{ scale: 1.02, y: -1 }} whileTap={{ scale: 0.98 }}
                  style={{ marginTop: 20 }}
                >
                  <Button
                    fullWidth variant="contained"
                    onClick={handleVerify}
                    disabled={loading || otp.join('').length < OTP_LENGTH}
                    sx={{
                      height: '50px', borderRadius: '12px',
                      fontWeight: 700, fontSize: '15px', textTransform: 'none',
                      background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
                      boxShadow: '0 8px 24px rgba(79,70,229,0.4)',
                      '&:hover': { background: 'linear-gradient(135deg, #4338CA 0%, #6D28D9 100%)', boxShadow: '0 12px 32px rgba(79,70,229,0.5)' },
                      '&.Mui-disabled': { background: '#e5e7eb', color: '#9ca3af', boxShadow: 'none' },
                    }}
                  >
                    <AnimatePresence mode="wait">
                      {loading ? (
                        <motion.span key="l" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <CircularProgress size={18} sx={{ color: '#fff' }} /> Verifying...
                        </motion.span>
                      ) : (
                        <motion.span key="v" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          Verify OTP
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </Button>
                </motion.div>

                {/* Resend */}
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.55 }}>
                  <Typography sx={{ textAlign: 'center', mt: 2.5, fontSize: '13.5px', color: '#6b7280' }}>
                    Didn't receive the code?{' '}
                    {resendTimer > 0 ? (
                      <Box component="span" sx={{ color: '#9ca3af' }}>
                        Resend in <Box component="span" sx={{ color: '#4F46E5', fontWeight: 700 }}>{resendTimer}s</Box>
                      </Box>
                    ) : (
                      <Box
                        component="span"
                        onClick={() => setResendTimer(30)}
                        sx={{ color: '#4F46E5', fontWeight: 700, cursor: 'pointer', '&:hover': { textDecoration: 'underline' } }}
                      >
                        Resend OTP
                      </Box>
                    )}
                  </Typography>
                </motion.div>
              </Box>
            </Box>
          </motion.div>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

export default OtpModal;
