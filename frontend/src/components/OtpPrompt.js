import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Typography,
  IconButton,
  Box,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import api from '../utils/api';

const OtpModal = ({ open, onClose, email, onSuccess }) => {
  const [otp, setOtp] = useState('');
  const [error, setError] = useState('');

  const handleVerify = async () => {
    if (!otp.trim()) {
      setError('OTP is required');
      return;
    }

    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      console.log('OTP verification response:', res.data); // Debug log
      
      const { token, role, userId } = res.data;
      const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;

      // Use window.sessionStorage explicitly
      if (userId) {
        window.sessionStorage.setItem('userId', userId);
      }
      window.sessionStorage.setItem('token', token);
      window.sessionStorage.setItem('role', role);
      window.sessionStorage.setItem('tokenExpiration', expirationTime.toString());
      
      console.log('Stored in sessionStorage after OTP:', { 
        userId: window.sessionStorage.getItem('userId'),
        token: window.sessionStorage.getItem('token'),
        role: window.sessionStorage.getItem('role'),
        expiration: window.sessionStorage.getItem('tokenExpiration')
      }); // Debug log

      onClose(); // Close modal
      onSuccess(role); // Navigate
    } catch (err) {
      console.error('OTP verification error:', err);
      setError('Invalid or expired OTP');
    }
  };

  return (
    <Dialog
      open={open}
      onClose={() => {}} // Prevent outside click closing
      maxWidth="xs"
      fullWidth
      disableEscapeKeyDown // Prevent ESC closing
      PaperProps={{
        sx: {
          position: 'absolute',
          top: '0%',
          left: '48%',
          transform: 'translateX(-50%)',
          borderRadius: 3,
          p: 2,
        },
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <DialogTitle>
          <Typography variant="h6" color="primary">OTP Verification</Typography>
        </DialogTitle>
        <IconButton onClick={onClose} sx={{ mr: 1 }}>
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent>
        <Typography variant="body2" gutterBottom>
          Enter the OTP sent to your email.
        </Typography>
        <TextField
          fullWidth
          variant="outlined"
          label="OTP"
          value={otp}
          onChange={(e) => setOtp(e.target.value)}
          error={!!error}
          helperText={error}
          autoFocus
        />
      </DialogContent>

      <DialogActions>
        <Button onClick={handleVerify} variant="contained" color="primary" fullWidth>
          Verify
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default OtpModal;
