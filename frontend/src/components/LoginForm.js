// import React, { useState, useEffect } from 'react';
// import {
//   TextField,
//   Button,
//   Container,
//   Box,
//   Typography,
//   Link,
//   InputAdornment,
// } from '@mui/material';
// import { Email, Lock } from '@mui/icons-material';
// import api from '../utils/api';
// import { useNavigate } from 'react-router-dom';

// const LoginForm = () => {
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const navigate = useNavigate();

  
//   const handleLogin = async (e) => {
//     e.preventDefault();
//     try {
//       const res = await api.post('/auth/login', { email, password });
//       const { token, role } = res.data;

//       // Store in sessionStorage with expiration time (1 hour from now)
//       const expirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour in milliseconds
//       sessionStorage.setItem('token', token);
//       sessionStorage.setItem('role', role);
//       sessionStorage.setItem('tokenExpiration', expirationTime.toString());

//       if (role === 'admin') {
//         navigate('/job-report');
//       } else if (role === 'Sales') {
//         navigate('/sales-dashboard');
//       } else if (role === 'HR') {
//         navigate('/hr-dashboard');
//       } else if (role === 'User') {
//         navigate('/user-dashboard');
//       }
//     } catch (err) {
//       alert('Invalid credentials');
//     }
//   };

//   return (
//     <Container
//       maxWidth="sm"
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}
//     >
//       <Box
//         sx={{
//           p: 4,
//           borderRadius: 2,
//           boxShadow: 3,
//           bgcolor: 'background.paper',
//           width: '100%',
//         }}
//       >
//         <Typography
//           component="h1"
//           variant="h5"
//           sx={{ fontWeight: 'bold', textAlign: 'center' }}
//         >
//           Login
//         </Typography>
//         <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
//           <TextField
//             margin="normal"
//             required
//             fullWidth
//             label="Email"
//             autoComplete="email"
//             value={email}
//             onChange={(e) => setEmail(e.target.value)}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Email />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           <TextField
//             margin="normal"
//             required
//             fullWidth
//             label="Password"
//             type="password"
//             autoComplete="current-password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Lock />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//             color="primary"
//             sx={{
//               mt: 3,
//               mb: 2,
//               height: '55px',
//               borderRadius: '30px',
//               fontWeight: 700,
//             }}
//           >
//             Login
//           </Button>
//           <Typography variant="body2" align="center">
//             {"Don't have an account? "}
//             <Link href="/register" variant="body2" color="primary">
//               Register
//             </Link>
//           </Typography>
//           <Typography variant="body2" align="center" sx={{ mt: 2 }}>
//             <Link href="/forgot-password" variant="body2" color="primary">
//               Forgot Password?
//             </Link>
//           </Typography>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default LoginForm;



// 2nd use me h

// import React, { useState, useEffect } from 'react';
// import {
//   TextField,
//   Button,
//   Container,
//   Box,
//   Typography,
//   Link,
//   InputAdornment,
// } from '@mui/material';
// import { Email, Lock } from '@mui/icons-material';
// import api from '../utils/api';
// import { useNavigate } from 'react-router-dom';

// const LoginForm = () => {
//   const [email, setEmail] = useState('');
//   const [emailError, setEmailError] = useState('');
//   const [password, setPassword] = useState('');
//   const navigate = useNavigate();

//   const validateEmail = (email) => {
//     const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
//     return re.test(email);
//   };

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     // Validate email
//     if (!validateEmail(email)) {
//       setEmailError('Please enter a valid email address');
//       return;
//     } else {
//       setEmailError('');
//     }

//     try {
//       const res = await api.post('/auth/login', { email, password });
//       const { token, role } = res.data;

//       const expirationTime = new Date().getTime() + 60 * 60 * 1000;
//       sessionStorage.setItem('token', token);
//       sessionStorage.setItem('role', role);
//       sessionStorage.setItem('tokenExpiration', expirationTime.toString());

//       if (role === 'admin') {
//         navigate('/job-report');
//       } else if (role === 'Sales') {
//         navigate('/sales-dashboard');
//       } else if (role === 'HR') {
//         navigate('/hr-dashboard');
//       } else if (role === 'User') {
//         navigate('/user-dashboard');
//       }
//     } catch (err) {
//       alert('Invalid credentials');
//     }
//   };

//   return (
//     <Container
//       maxWidth="sm"
//       sx={{
//         minHeight: '100vh',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}
//     >
//       <Box
//         sx={{
//           p: 4,
//           borderRadius: 2,
//           boxShadow: 3,
//           bgcolor: 'background.paper',
//           width: '100%',
//         }}
//       >
//         <Typography
//           component="h1"
//           variant="h5"
//           sx={{ fontWeight: 'bold', textAlign: 'center' }}
//         >
//           Login
//         </Typography>
//         <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 1 }}>
//           <TextField
//             margin="normal"
//             required
//             fullWidth
//             label="Email"
//             autoComplete="email"
//             value={email}
//             error={Boolean(emailError)}
//             helperText={emailError}
//             onChange={(e) => {
//               setEmail(e.target.value);
//               if (emailError && validateEmail(e.target.value)) {
//                 setEmailError('');
//               }
//             }}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Email />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           <TextField
//             margin="normal"
//             required
//             fullWidth
//             label="Password"
//             type="password"
//             autoComplete="current-password"
//             value={password}
//             onChange={(e) => setPassword(e.target.value)}
//             InputProps={{
//               startAdornment: (
//                 <InputAdornment position="start">
//                   <Lock />
//                 </InputAdornment>
//               ),
//             }}
//           />
//           <Button
//             type="submit"
//             fullWidth
//             variant="contained"
//             color="primary"
//             sx={{
//               mt: 3,
//               mb: 2,
//               height: '55px',
//               borderRadius: '30px',
//               fontWeight: 700,
//             }}
//           >
//             Login
//           </Button>
//           <Typography variant="body2" align="center">
//             {"Don't have an account? "}
//             <Link href="/register" variant="body2" color="primary">
//               Register
//             </Link>
//           </Typography>
//           <Typography variant="body2" align="center" sx={{ mt: 2 }}>
//             <Link href="/forgot-password" variant="body2" color="primary">
//               Forgot Password?
//             </Link>
//           </Typography>
//         </Box>
//       </Box>
//     </Container>
//   );
// };

// export default LoginForm;


import React, { useState } from 'react';
import {
  TextField,
  Button,
  Container,
  Box,
  Typography,
  Link,
  InputAdornment,
} from '@mui/material';
import { Email, Lock } from '@mui/icons-material';
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../assets/loginlogo.png'; // Add your logo image here
import bgimage from "../assets/loginbgimage.webp"

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    } else {
      setEmailError('');
    }

    try {
      const res = await api.post('/auth/login', { email, password });
      const { token, role } = res.data;
      const expirationTime = new Date().getTime() + 60 * 60 * 1000;

      sessionStorage.setItem('token', token);
      sessionStorage.setItem('role', role);
      sessionStorage.setItem('tokenExpiration', expirationTime.toString());

      if (role === 'admin') navigate('/job-report');
      else if (role === 'Sales') navigate('/sales-dashboard');
      else if (role === 'HR') navigate('/hr-dashboard');
      else navigate('/user-dashboard');
    } catch {
      alert('Invalid credentials');
    }
  };

  return (
    <Box
      sx={{
        backgroundImage: `url(${bgimage})`,
// Replace with your bg image path
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        minHeight: '100vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Container maxWidth="sm">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
        >
          <Box
  sx={{
    p: 4,
    borderRadius: 3,
    boxShadow: 5,
    bgcolor: 'rgba(255, 255, 255, 0.1)',  // More transparent
    backdropFilter: 'blur(10px)',          // Stronger blur for glass effect
    WebkitBackdropFilter: 'blur(10px)',    // Support for Safari
    textAlign: 'center',
    border: '1px solid rgba(255, 255, 255, 0.3)', // Optional: nice soft border
  }}
>

          
            <motion.img
              src={Logo}
              alt="Company Logo"
              width="100"
              style={{ marginBottom: 20 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            />

            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
            Connecting Talent With Opportunities
            </Typography>

            <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 2 }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Email"
                value={email}
                error={Boolean(emailError)}
                helperText={emailError}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (emailError && validateEmail(e.target.value)) setEmailError('');
                }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                sx={{
                  mt: 3,
                  mb: 2,
                  height: '50px',
                  borderRadius: '30px',
                  fontWeight: 600,
                }}
              >
                Login
              </Button>

              <Typography variant="body2">
                {"Don't have an account? "}
                <Link href="/register">Register</Link>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <Link href="/forgot-password">Forgot Password?</Link>
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Container>
    </Box>
  );
};

export default LoginForm;
