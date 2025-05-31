import React, { useState } from 'react';
import {
  Box,
  Button,
  Container,
  TextField,
  Typography,
  InputAdornment,
} from '@mui/material';
import { Email, Lock, Numbers } from '@mui/icons-material';
import api from '../utils/forgotapi'; // axios instance
import { useNavigate } from 'react-router-dom';

const ForgotPassword = () => {
  const [step, setStep] = useState(1); // 1: enter email, 2: enter OTP + new password
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [message, setMessage] = useState('');
  const navigate = useNavigate();

  const handleSendOtp = async () => {
    try {
      const res = await api.post('/send-otp', { email });
      setMessage(res.data.message);
      setStep(2);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error sending OTP');
    }
  };

  const handleVerifyOtp = async () => {
    try {
      const res = await api.post('/verify-otp', {
        email,
        otp,
        newPassword,
      });
      setMessage(res.data.message);
  
      // Clear form
      setStep(1);
      setEmail('');
      setOtp('');
      setNewPassword('');
  
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate('/login'); // Change route if your login path is different
      }, 3000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error verifying OTP');
    }
  };

  return (
    <Container maxWidth="sm" sx={{ mt: 8 }}>
      <Box
        sx={{
          p: 4,
          borderRadius: 2,
          boxShadow: 3,
          bgcolor: 'background.paper',
        }}
      >
        <Typography variant="h5" fontWeight="bold" textAlign="center" mb={2}>
          Forgot Password
        </Typography>

        {step === 1 ? (
          <>
            <TextField
              label="Email"
              type="email"
              fullWidth
              required
              margin="normal"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Email />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleSendOtp}
            >
              Send OTP
            </Button>
          </>
        ) : (
          <>
            <TextField
              label="OTP"
              fullWidth
              required
              margin="normal"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Numbers />
                  </InputAdornment>
                ),
              }}
            />
            <TextField
              label="New Password"
              type="password"
              fullWidth
              required
              margin="normal"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <Lock />
                  </InputAdornment>
                ),
              }}
            />
            <Button
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 2 }}
              onClick={handleVerifyOtp}
            >
              Reset Password
            </Button>
          </>
        )}

        {message && (
          <Typography
            variant="body2"
            textAlign="center"
            color="success.main"
            mt={2}
          >
            {message}
          </Typography>
        )}
      </Box>
    </Container>
  );
};

export default ForgotPassword;