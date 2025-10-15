// // import React, { useState } from 'react';
// // import {
// //   TextField,
// //   Button,
// //   Container,
// //   Box,
// //   Typography,
// //   Link,
// //   InputAdornment,
// //   CircularProgress,
// // } from '@mui/material';
// // import { Email, Lock } from '@mui/icons-material';
// // import api from '../utils/api';
// // import { useNavigate } from 'react-router-dom';
// // import { motion } from 'framer-motion';
// // import Logo from '../assets/loginlogo.png'; // Add your logo image here
// // import bgimage from "../assets/bg2.jpg"
// // import { toast } from 'react-toastify';
// // import OtpModal from './OtpPrompt'; 


// // const LoginForm = () => {
// //   const [email, setEmail] = useState('');
// //   const [emailError, setEmailError] = useState('');
// //   const [password, setPassword] = useState('');
// //   const [showOtpModal, setShowOtpModal] = useState(false);
// //   const [isLoading, setIsLoading] = useState(false);

// //   const navigate = useNavigate();

// //   const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);



// //   const handleLogin = async (e) => {
// //     e.preventDefault();
  
// //     if (!validateEmail(email)) {
// //       setEmailError('Please enter a valid email address');
// //       return;
// //     }
    
// //     setIsLoading(true);
// //     try {
// //       const res = await api.post('/auth/pre-login', { email, password });
      
// //       console.log('Pre-login response:', res.data); // Debug log
  
// //       if (res.data.otpRequired) {
// //         setShowOtpModal(true);
        
// //       } else {
// //         // For admin users who don't need OTP
// //         const { token, role, userId } = res.data;
// //         const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;
  
// //         // Store in sessionStorage
// //         window.sessionStorage.setItem('token', token);
// //         window.sessionStorage.setItem('role', role);
// //         window.sessionStorage.setItem('tokenExpiration', expirationTime.toString());
        
// //         // Store userId in sessionStorage for socket connection
// //         if (userId) {
// //           window.sessionStorage.setItem('userId', userId);
// //         }
        
// //         console.log('Stored in sessionStorage:', { 
// //           token: window.sessionStorage.getItem('token'),
// //           role: window.sessionStorage.getItem('role'),
// //           expiration: window.sessionStorage.getItem('tokenExpiration')
// //         }); // Debug log
  
// //         navigateToDashboard(role);
// //       }
// //     } catch (err) {
// //       console.error('Login error:', err);
// //       alert('Invalid credentials or OTP verification failed');
// //       setIsLoading(false);
// //     }
// //   };

// //   const handleOtpSubmit = async (otp) => {
// //     try {
// //       const res = await api.post('/auth/verify-otp', { email, otp });
// //       const { token, role, userId } = res.data;
// //       const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000; // 4 hours

// //       // Store in sessionStorage
// //       window.sessionStorage.setItem('token', token);
// //       window.sessionStorage.setItem('role', role);
// //       window.sessionStorage.setItem('tokenExpiration', expirationTime.toString());
      
// //       // Store userId in sessionStorage for socket connection
// //       if (userId) {
// //         window.sessionStorage.setItem('userId', userId);
// //       }

// //       setIsLoading(false); // Reset loading state before navigation
// //       navigateToDashboard(role);
// //     } catch (err) {
// //       console.error('OTP verification error:', err);
// //       alert('Invalid OTP');
// //       setIsLoading(false); // Reset loading state on error
// //     }
// //   };

// //   const navigateToDashboard = (role) => {
// //     if (role === 'admin') navigate('/job-report');
// //     else if (role === 'Sales') navigate('/sales-dashboard');
// //     else if (role === 'HR') navigate('/hr-dashboard');
// //     else navigate('/user-dashboard');
// //   };
  

// //   return (
// //     <Box
// //       sx={{
// //         backgroundImage: `url(${bgimage})`,
// // // Replace with your bg image path
// //         backgroundSize: 'cover',
// //         backgroundPosition: 'center',
// //         minHeight: '100vh',
// //         display: 'flex',
// //         justifyContent: 'center',
// //         alignItems: 'center',
// //       }}
// //     >
// //       <Container maxWidth="sm">
// //         <motion.div
// //           initial={{ opacity: 0, y: 50 }}
// //           animate={{ opacity: 1, y: 0 }}
// //           transition={{ duration: 0.8 }}
// //         >
// //           <Box
// //   sx={{
// //     p: 4,
// //     borderRadius: 3,
// //     boxShadow: 5,
// //     marginBottom: '160px',
// //     bgcolor: 'rgba(255, 255, 255, 0.1)',  // More transparent
// //     backdropFilter: 'blur(10px)',          // Stronger blur for glass effect
// //     WebkitBackdropFilter: 'blur(10px)',    // Support for Safari
// //     textAlign: 'center',
// //     border: '1px solid rgba(255, 255, 255, 0.3)', // Optional: nice soft border
// //   }}
// // >

          
// //             <motion.img
// //               src={Logo}
// //               alt="Company Logo"
// //               width="100"
// //               style={{ marginBottom: 20 }}
// //               initial={{ opacity: 0, scale: 0.8 }}
// //               animate={{ opacity: 1, scale: 1 }}
// //               transition={{ duration: 1 }}
// //             />

// //             <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold' }}>
// //             Connecting Talent With Opportunities
// //             </Typography>

// //             <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 2 }}>
// //               <TextField
// //                 margin="normal"
// //                 required
// //                 fullWidth
// //                 label="Email"
// //                 value={email}
// //                 error={Boolean(emailError)}
// //                 helperText={emailError}
// //                 onChange={(e) => {
// //                   setEmail(e.target.value);
// //                   if (emailError && validateEmail(e.target.value)) setEmailError('');
// //                 }}
// //                 InputProps={{
// //                   startAdornment: (
// //                     <InputAdornment position="start">
// //                       <Email />
// //                     </InputAdornment>
// //                   ),
// //                 }}
// //               />
// //               <TextField
// //                 margin="normal"
// //                 required
// //                 fullWidth
// //                 label="Password"
// //                 type="password"
// //                 value={password}
// //                 onChange={(e) => setPassword(e.target.value)}
// //                 InputProps={{
// //                   startAdornment: (
// //                     <InputAdornment position="start">
// //                       <Lock />
// //                     </InputAdornment>
// //                   ),
// //                 }}
// //               />
// //               <Button
// //                 type="submit"
// //                 fullWidth
// //                 variant="contained"
// //                 color="primary"
// //                 disabled={isLoading}
// //                 sx={{
// //                   mt: 3,
// //                   mb: 2,
// //                   height: '50px',
// //                   borderRadius: '30px',
// //                   fontWeight: 600,
// //                 }}
// //               >
// //                 {isLoading ? (
// //                   <>
// //                     <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
// //                     Signing in...
// //                   </>
// //                 ) : (
// //                   'Login'
// //                 )}
// //               </Button>

// //               <Typography variant="body2" sx={{ color: 'blue' }}>
// //                 {"Don't have an account? "}
// //                 <Link href="/register" sx={{ color: 'blue' }}>Register</Link>
// //               </Typography>
// //               <Typography variant="body2" sx={{ mt: 1 }}>
// //                 <Link href="/forgot-password" sx={{ color: 'blue' }}>Forgot Password?</Link>
// //               </Typography>
// //             </Box>
// //           </Box>
// //         </motion.div>
// //       </Container>
// //       <OtpModal
// //         open={showOtpModal}
// //         onClose={() => {
// //           setShowOtpModal(false);
// //           setIsLoading(false); // Reset loading state when modal is closed
// //         }}
// //         email={email}
// //         onSubmit={handleOtpSubmit}
// //         onSuccess={navigateToDashboard}
// //       />
// //     </Box>
// //   );
// // };

// // export default LoginForm;


// import React, { useState } from 'react';
// import {
//   TextField,
//   Button,
//   Container,
//   Box,
//   Typography,
//   Link,
//   InputAdornment,
//   CircularProgress,
// } from '@mui/material';
// import { Email, Lock } from '@mui/icons-material';
// import api from '../utils/api';
// import { useNavigate } from 'react-router-dom';
// import { motion } from 'framer-motion';
// import Logo from '../assets/loginlogo.png';
// import bgvideo from "../assets/large1.mp4"; // ✅ Use your video file here
// import { toast } from 'react-toastify';
// import OtpModal from './OtpPrompt';

// const LoginForm = () => {
//   const [email, setEmail] = useState('');
//   const [emailError, setEmailError] = useState('');
//   const [password, setPassword] = useState('');
//   const [showOtpModal, setShowOtpModal] = useState(false);
//   const [isLoading, setIsLoading] = useState(false);

//   const navigate = useNavigate();

//   const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

//   const handleLogin = async (e) => {
//     e.preventDefault();

//     if (!validateEmail(email)) {
//       setEmailError('Please enter a valid email address');
//       return;
//     }

//     setIsLoading(true);
//     try {
//       const res = await api.post('/auth/pre-login', { email, password });

//       if (res.data.otpRequired) {
//         setShowOtpModal(true);
//       } else {
//         const { token, role, userId } = res.data;
//         const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;

//         window.sessionStorage.setItem('token', token);
//         window.sessionStorage.setItem('role', role);
//         window.sessionStorage.setItem('tokenExpiration', expirationTime.toString());

//         if (userId) {
//           window.sessionStorage.setItem('userId', userId);
//         }

//         navigateToDashboard(role);
//       }
//     } catch (err) {
//       console.error('Login error:', err);
//       alert('Invalid credentials or OTP verification failed');
//       setIsLoading(false);
//     }
//   };

//   const handleOtpSubmit = async (otp) => {
//     try {
//       const res = await api.post('/auth/verify-otp', { email, otp });
//       const { token, role, userId } = res.data;
//       const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;

//       window.sessionStorage.setItem('token', token);
//       window.sessionStorage.setItem('role', role);
//       window.sessionStorage.setItem('tokenExpiration', expirationTime.toString());

//       if (userId) {
//         window.sessionStorage.setItem('userId', userId);
//       }

//       setIsLoading(false);
//       navigateToDashboard(role);
//     } catch (err) {
//       console.error('OTP verification error:', err);
//       alert('Invalid OTP');
//       setIsLoading(false);
//     }
//   };

//   const navigateToDashboard = (role) => {
//     if (role === 'admin') navigate('/job-report');
//     else if (role === 'Sales') navigate('/sales-dashboard');
//     else if (role === 'HR') navigate('/hr-dashboard');
//     else navigate('/user-dashboard');
//   };

//   return (
//     <Box
//       sx={{
//         position: 'relative',
//         minHeight: '100vh',
//         overflow: 'hidden',
//         display: 'flex',
//         justifyContent: 'center',
//         alignItems: 'center',
//       }}
//     >
//       {/* ✅ Video Background */}
//       <video
//         autoPlay
//         loop
//         muted
//         playsInline
//         style={{
//           position: 'absolute',
//           top: 0,
//           left: 0,
//           width: '100%',
//           height: '100%',
//           objectFit: 'cover',
//           zIndex: -1,
//         }}
//       >
//         <source src={bgvideo} type="video/mp4" />
//         Your browser does not support the video tag.
//       </video>

//       {/* ✅ Login Form Container */}
//       <Container maxWidth="sm">
//         <motion.div
//           initial={{ opacity: 0, y: 50 }}
//           animate={{ opacity: 1, y: 0 }}
//           transition={{ duration: 0.8 }}
//         >
//           <Box
//             sx={{
//               p: 4,
//               borderRadius: 3,
//               marginTop: '100px',
//               boxShadow: 5,
//               marginBottom: '160px',
//               bgcolor: 'rgba(255, 255, 255, 0.15)', // Glass effect
//               backdropFilter: 'blur(10px)',
//               WebkitBackdropFilter: 'blur(10px)',
//               textAlign: 'center',
//               border: '1px solid rgba(255, 255, 255, 0.3)',
//             }}
//           >
//             <motion.img
//               src={Logo}
//               alt="Company Logo"
//               width="150"
//               style={{ marginBottom: 20 }}
//               initial={{ opacity: 0, scale: 0.8 }}
//               animate={{ opacity: 1, scale: 1 }}
//               transition={{ duration: 1 }}
//             />

//             <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', fontSize: '24px' , fontFamily: 'Lora' }}>
//               Connecting Talent With Opportunities
//             </Typography>

//             {/* ✅ Login Form */}
//             <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 2 }}>
//               <TextField
//                 margin="normal"
//                 required
//                 fullWidth
//                 label="Email"
//                 value={email}
//                 error={Boolean(emailError)}
//                 helperText={emailError}
//                 onChange={(e) => {
//                   setEmail(e.target.value);
//                   if (emailError && validateEmail(e.target.value)) setEmailError('');
//                 }}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Email />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//               <TextField
//                 margin="normal"
//                 required
//                 fullWidth
//                 label="Password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Lock />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//               <Button
//                 type="submit"
//                 fullWidth
//                 variant="contained"
//                 color="primary"
//                 disabled={isLoading}
//                 sx={{
//                   mt: 3,
//                   mb: 2,
//                   height: '50px',
//                   borderRadius: '30px',
//                   fontWeight: 600,
//                 }}
//               >
//                 {isLoading ? (
//                   <>
//                     <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
//                     Signing in...
//                   </>
//                 ) : (
//                   'Login'
//                 )}
//               </Button>

//               <Typography variant="body2" sx={{ color: 'black' , fontWeight: 'bold' , fontSize: '18px' }}>
//                 {"Don't have an account? "}
//                 <Link href="/register" sx={{ color: 'black' , fontWeight: 'bold' , fontSize: '18px' }}>
//                   Register
//                 </Link>
//               </Typography>
//               <Typography variant="body2" sx={{ mt: 1 }}>
//                 <Link href="/forgot-password" sx={{ color: 'black' , fontWeight: 'bold' , fontSize: '18px' }}>
//                   Forgot Password?
//                 </Link>
//               </Typography>
//             </Box>
//           </Box>
//         </motion.div>
//       </Container>

//       {/* ✅ OTP Modal */}
//       <OtpModal
//         open={showOtpModal}
//         onClose={() => {
//           setShowOtpModal(false);
//           setIsLoading(false);
//         }}
//         email={email}
//         onSubmit={handleOtpSubmit}
//         onSuccess={navigateToDashboard}
//       />
//     </Box>
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
  IconButton,
  CircularProgress,
} from '@mui/material';
import { Email, Lock, Visibility, VisibilityOff } from '@mui/icons-material'; // 👈 add icons
import api from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import Logo from '../assets/loginlogo.png';
import bgvideo from "../assets/large1.mp4";
import OtpModal from './OtpPrompt';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false); // 👈 state for show/hide
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const navigate = useNavigate();

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }
    setIsLoading(true);
    try {
      const res = await api.post('/auth/pre-login', { email, password });
      if (res.data.otpRequired) {
        setShowOtpModal(true);
      } else {
        const { token, role, userId } = res.data;
        const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;
        window.sessionStorage.setItem('token', token);
        window.sessionStorage.setItem('role', role);
        window.sessionStorage.setItem('tokenExpiration', expirationTime.toString());
        if (userId) window.sessionStorage.setItem('userId', userId);
        navigateToDashboard(role);
      }
    } catch (err) {
      console.error('Login error:', err);
      alert('Invalid credentials or OTP verification failed');
      setIsLoading(false);
    }
  };

  const handleOtpSubmit = async (otp) => {
    try {
      const res = await api.post('/auth/verify-otp', { email, otp });
      const { token, role, userId } = res.data;
      const expirationTime = new Date().getTime() + 4 * 60 * 60 * 1000;
      window.sessionStorage.setItem('token', token);
      window.sessionStorage.setItem('role', role);
      window.sessionStorage.setItem('tokenExpiration', expirationTime.toString());
      if (userId) window.sessionStorage.setItem('userId', userId);
      setIsLoading(false);
      navigateToDashboard(role);
    } catch (err) {
      console.error('OTP verification error:', err);
      alert('Invalid OTP');
      setIsLoading(false);
    }
  };

  const navigateToDashboard = (role) => {
    if (role === 'admin') navigate('/job-report');
    else if (role === 'Sales') navigate('/sales-dashboard');
    else if (role === 'HR') navigate('/hr-dashboard');
    else navigate('/user-dashboard');
  };

  return (
    <Box
      sx={{
        position: 'relative',
        minHeight: '100vh',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      {/* ✅ Background Video */}
      <video
        autoPlay
        loop
        muted
        playsInline
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          objectFit: 'cover',
          zIndex: -1,
        }}
      >
        <source src={bgvideo} type="video/mp4" />
      </video>

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
              marginTop: '100px',
              boxShadow: 5,
              marginBottom: '160px',
              bgcolor: 'rgba(255, 255, 255, 0.15)',
              backdropFilter: 'blur(10px)',
              WebkitBackdropFilter: 'blur(10px)',
              textAlign: 'center',
              border: '1px solid rgba(255, 255, 255, 0.3)',
            }}
          >
            <motion.img
              src={Logo}
              alt="Company Logo"
              width="150"
              style={{ marginBottom: 20 }}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 1 }}
            />

            <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', fontSize: '24px' }}>
              Connecting Talent With Opportunities
            </Typography>

            <Box component="form" onSubmit={handleLogin} noValidate sx={{ mt: 2 }}>
              {/* Email */}
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

              {/* Password with Eye Icon */}
              <TextField
                margin="normal"
                required
                fullWidth
                label="Password"
                type={showPassword ? 'text' : 'password'} // 👈 toggle here
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                  endAdornment: (
                    <InputAdornment position="end">
                      <IconButton onClick={() => setShowPassword(!showPassword)} edge="end">
                        {showPassword ? <VisibilityOff /> : <Visibility />}
                      </IconButton>
                    </InputAdornment>
                  ),
                }}
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                color="primary"
                disabled={isLoading}
                sx={{
                  mt: 3,
                  mb: 2,
                  height: '50px',
                  borderRadius: '30px',
                  fontWeight: 600,
                }}
              >
                {isLoading ? (
                  <>
                    <CircularProgress size={24} color="inherit" sx={{ mr: 1 }} />
                    Signing in...
                  </>
                ) : (
                  'Login'
                )}
              </Button>

              <Typography variant="body2" sx={{ color: 'black', fontWeight: 'bold', fontSize: '18px' }}>
                {"Don't have an account? "}
                <Link href="/register" sx={{ color: 'black', fontWeight: 'bold', fontSize: '18px' }}>
                  Register
                </Link>
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                <Link href="/forgot-password" sx={{ color: 'black', fontWeight: 'bold', fontSize: '18px' }}>
                  Forgot Password?
                </Link>
              </Typography>
            </Box>
          </Box>
        </motion.div>
      </Container>

      {/* OTP Modal */}
      <OtpModal
        open={showOtpModal}
        onClose={() => {
          setShowOtpModal(false);
          setIsLoading(false);
        }}
        email={email}
        onSubmit={handleOtpSubmit}
        onSuccess={navigateToDashboard}
      />
    </Box>
  );
};

export default LoginForm;
