

// import React, { useState } from 'react';
// import {
//   TextField,
//   Button,
//   Container,
//   Box,
//   Typography,
//   Select,
//   MenuItem,
//   FormControl,
//   InputLabel,
//   Grid,
//   CircularProgress,
//   InputAdornment,
//   Tooltip,
// } from '@mui/material';
// import {
//   Person,
//   Email,
//   Lock,
//   Phone,
//   Home,
//   Male,
//   Female,
// } from '@mui/icons-material';
// import { styled } from '@mui/system';
// import api from '../utils/api';
// import { useNavigate } from 'react-router-dom';

// const StyledContainer = styled(Container)(({ theme }) => ({
//   backgroundColor: theme.palette.background.paper,
//   borderRadius: '20px',
//   boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
//   padding: theme.spacing(6),
//   marginTop: theme.spacing(12),
//   maxWidth: '600px',
//   [theme.breakpoints.down('sm')]: {
//     padding: theme.spacing(4),
//   },
// }));

// const StyledButton = styled(Button)(({ theme }) => ({
//   height: '55px',
//   borderRadius: '30px',
//   fontSize: '17px',
//   backgroundColor: theme.palette.primary.main,
//   color: theme.palette.common.white,
//   fontWeight: 700,
//   transition: 'background-color 0.3s ease, transform 0.2s ease',
//   '&:hover': {
//     backgroundColor: theme.palette.primary.dark,
//     transform: 'translateY(-3px)',
//   },
//   '&:active': {
//     transform: 'translateY(1px)',
//   },
// }));

// const StyledTextField = styled(TextField)(({ theme }) => ({
//   '& label.Mui-focused': {
//     color: theme.palette.primary.main,
//   },
//   '& .MuiOutlinedInput-root': {
//     '& fieldset': {
//       borderColor: theme.palette.grey[400],
//     },
//     '&:hover fieldset': {
//       borderColor: theme.palette.primary.light,
//     },
//     '&.Mui-focused fieldset': {
//       borderColor: theme.palette.primary.main,
//     },
//   },
//   '& .MuiInputBase-input': {
//     padding: theme.spacing(2),
//   },
// }));

// const FormHeading = styled(Typography)(({ theme }) => ({
//   fontWeight: 800,
//   fontSize: '2rem',
//   marginBottom: theme.spacing(4),
//   textAlign: 'center',
// }));

// const FormSubtext = styled(Typography)(({ theme }) => ({
//   fontWeight: 400,
//   fontSize: '1rem',
//   color: theme.palette.text.secondary,
//   marginBottom: theme.spacing(3),
//   textAlign: 'center',
// }));

// const RegisterForm = () => {
//   const [firstName, setFirstName] = useState('');
//   const [lastName, setLastName] = useState('');
//   const [email, setEmail] = useState('');
//   const [password, setPassword] = useState('');
//   const [mobileNo, setMobileNo] = useState('');
//   const [role, setRole] = useState('');
//   const [address, setAddress] = useState('');
//   const [gender, setGender] = useState('');
//   const [loading, setLoading] = useState(false);
//   const navigate = useNavigate();

//   const handleRegister = async (e) => {
//     e.preventDefault();
//     setLoading(true);
//     try {
//       const res = await api.post('/auth/register', {
//         firstName,
//         lastName,
//         email,
//         password,
//         mobileNo,
//         role,
//         address,
//         gender,
//       });
//       setLoading(false);
//       if (res.status === 201) {
//         alert('Registration successful');
//         navigate('/login');
//       }
//     } catch (err) {
//       setLoading(false);
//       alert('Registration failed');
//     }
//   };

//   return (
//     <StyledContainer>
//       <FormHeading>Create Your Account</FormHeading>
//       <FormSubtext>Please fill out the form to get started.</FormSubtext>

//       <Box
//         component="form"
//         onSubmit={handleRegister}
//         noValidate
//         sx={{ width: '100%' }}
//       >
//         <Grid container spacing={3}>
//           <Grid item xs={12} sm={6}>
//             <Tooltip title="Enter your first name">
//               <StyledTextField
//                 fullWidth
//                 label="First Name"
//                 value={firstName}
//                 onChange={(e) => setFirstName(e.target.value)}
//                 variant="outlined"
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Person />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Tooltip>
//           </Grid>
//           <Grid item xs={12} sm={6}>
//             <Tooltip title="Enter your last name">
//               <StyledTextField
//                 fullWidth
//                 label="Last Name"
//                 value={lastName}
//                 onChange={(e) => setLastName(e.target.value)}
//                 variant="outlined"
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Person />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Tooltip>
//           </Grid>
//           <Grid item xs={12}>
//             <Tooltip title="Enter your email address">
//               <StyledTextField
//                 fullWidth
//                 label="Email"
//                 type="email"
//                 value={email}
//                 onChange={(e) => setEmail(e.target.value)}
//                 variant="outlined"
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Email />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Tooltip>
//           </Grid>
//           <Grid item xs={12}>
//             <Tooltip title="Choose a strong password">
//               <StyledTextField
//                 fullWidth
//                 label="Password"
//                 type="password"
//                 value={password}
//                 onChange={(e) => setPassword(e.target.value)}
//                 variant="outlined"
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Lock />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Tooltip>
//           </Grid>
//           <Grid item xs={12}>
//             <Tooltip title="Enter your mobile number">
//               <StyledTextField
//                 fullWidth
//                 label="Mobile Number"
//                 value={mobileNo}
//                 onChange={(e) => setMobileNo(e.target.value)}
//                 variant="outlined"
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Phone />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Tooltip>
//           </Grid>
//           <Grid item xs={12}>
//             <Tooltip title="Enter your address">
//               <StyledTextField
//                 fullWidth
//                 label="Address"
//                 value={address}
//                 onChange={(e) => setAddress(e.target.value)}
//                 variant="outlined"
//                 required
//                 InputProps={{
//                   startAdornment: (
//                     <InputAdornment position="start">
//                       <Home />
//                     </InputAdornment>
//                   ),
//                 }}
//               />
//             </Tooltip>
//           </Grid>
//           <Grid item xs={12}>
//             <FormControl fullWidth variant="outlined" required>
//               <InputLabel>Gender</InputLabel>
//               <Select
//                 value={gender}
//                 onChange={(e) => setGender(e.target.value)}
//                 label="Gender"
//               >
//                 <MenuItem value="Male">
//                   <Male /> Male
//                 </MenuItem>
//                 <MenuItem value="Female">
//                   <Female /> Female
//                 </MenuItem>
//                 <MenuItem value="Other">Other</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12}>
//             <FormControl fullWidth variant="outlined" required>
//               <InputLabel>Role</InputLabel>
//               <Select
//                 value={role}
//                 onChange={(e) => setRole(e.target.value)}
//                 label="Role"
//                 startAdornment={
//                   <InputAdornment position="start">
//                     <Person />
//                   </InputAdornment>
//                 }
//               >
//                 <MenuItem value="Sales">Sales</MenuItem>
//                 <MenuItem value="HR">HR</MenuItem>
//               </Select>
//             </FormControl>
//           </Grid>
//           <Grid item xs={12}>
//             <StyledButton
//               type="submit"
//               fullWidth
//               variant="contained"
//               disabled={loading}
//               startIcon={
//                 loading && <CircularProgress size={24} sx={{ color: '#fff' }} />
//               }
//             >
//               {loading ? 'Registering...' : 'Register'}
//             </StyledButton>
//           </Grid>
//         </Grid>
//       </Box>
//       <Typography variant="body2" align="center" sx={{ mt: 2 }}>
//         Already have an account?
//         <Button
//           onClick={() => navigate('/login')}
//           sx={{ textDecoration: 'underline' }}
//         >
//           Login
//         </Button>
//       </Typography>
//     </StyledContainer>
//   );
// };

// export default RegisterForm;



import React from 'react';
import {
  TextField,
  Button,
  Container,
  Box,
  Typography,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Grid,
  CircularProgress,
  InputAdornment,
  Tooltip,
} from '@mui/material';
import {
  Person,
  Email,
  Lock,
  Phone,
  Home,
  Male,
  Female,
} from '@mui/icons-material';
import { styled } from '@mui/system';
import { useNavigate } from 'react-router-dom';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import api from '../utils/api';

const StyledContainer = styled(Container)(({ theme }) => ({
  backgroundColor: theme.palette.background.paper,
  borderRadius: '20px',
  boxShadow: '0 12px 40px rgba(0, 0, 0, 0.15)',
  padding: theme.spacing(6),
  marginTop: theme.spacing(12),
  maxWidth: '600px',
}));

const StyledButton = styled(Button)(({ theme }) => ({
  height: '55px',
  borderRadius: '30px',
  fontSize: '17px',
  backgroundColor: theme.palette.primary.main,
  color: theme.palette.common.white,
  fontWeight: 700,
  '&:hover': {
    backgroundColor: theme.palette.primary.dark,
    transform: 'translateY(-3px)',
  },
}));

const StyledTextField = styled(TextField)(({ theme }) => ({
  '& .MuiInputBase-input': {
    padding: theme.spacing(2),
  },
}));

const FormHeading = styled(Typography)(({ theme }) => ({
  fontWeight: 800,
  fontSize: '2rem',
  marginBottom: theme.spacing(4),
  textAlign: 'center',
}));

const FormSubtext = styled(Typography)(({ theme }) => ({
  fontSize: '1rem',
  color: theme.palette.text.secondary,
  marginBottom: theme.spacing(3),
  textAlign: 'center',
}));

const validationSchema = Yup.object({
  firstName: Yup.string().required('First Name is required'),
  lastName: Yup.string().required('Last Name is required'),
  email: Yup.string().email('Invalid email').required('Email is required'),
  password: Yup.string()
    .min(6, 'Password should be at least 6 characters')
    .required('Password is required'),
  mobileNo: Yup.string()
    .matches(/^[0-9]{10}$/, 'Mobile number must be 10 digits')
    .required('Mobile number is required'),
  address: Yup.string().required('Address is required'),
  role: Yup.string().required('Role is required'),
  gender: Yup.string().required('Gender is required'),
});

const RegisterForm = () => {
  const navigate = useNavigate();

  const formik = useFormik({
    initialValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      mobileNo: '',
      address: '',
      role: '',
      gender: '',
    },
    validationSchema,
    onSubmit: async (values, { setSubmitting }) => {
      try {
        const res = await api.post('/auth/register', values);
        if (res.status === 201) {
          alert('Registration successful');
          navigate('/login');
        }
      } catch (err) {
        alert('Registration failed');
      } finally {
        setSubmitting(false);
      }
    },
  });

  return (
    <StyledContainer>
      <FormHeading>Create Your Account</FormHeading>
      <FormSubtext>Please fill out the form to get started.</FormSubtext>

      <Box component="form" onSubmit={formik.handleSubmit} noValidate>
        <Grid container spacing={3}>
          <Grid item xs={12} sm={6}>
            <Tooltip title="Enter your first name">
              <StyledTextField
                fullWidth
                label="First Name"
                name="firstName"
                value={formik.values.firstName}
                onChange={formik.handleChange}
                error={formik.touched.firstName && Boolean(formik.errors.firstName)}
                helperText={formik.touched.firstName && formik.errors.firstName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12} sm={6}>
            <Tooltip title="Enter your last name">
              <StyledTextField
                fullWidth
                label="Last Name"
                name="lastName"
                value={formik.values.lastName}
                onChange={formik.handleChange}
                error={formik.touched.lastName && Boolean(formik.errors.lastName)}
                helperText={formik.touched.lastName && formik.errors.lastName}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Person />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Tooltip title="Enter your email">
              <StyledTextField
                fullWidth
                label="Email"
                name="email"
                value={formik.values.email}
                onChange={formik.handleChange}
                error={formik.touched.email && Boolean(formik.errors.email)}
                helperText={formik.touched.email && formik.errors.email}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Email />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Tooltip title="Enter your password">
              <StyledTextField
                fullWidth
                label="Password"
                name="password"
                type="password"
                value={formik.values.password}
                onChange={formik.handleChange}
                error={formik.touched.password && Boolean(formik.errors.password)}
                helperText={formik.touched.password && formik.errors.password}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Lock />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Tooltip title="Enter 10-digit mobile number">
              <StyledTextField
                fullWidth
                label="Mobile Number"
                name="mobileNo"
                value={formik.values.mobileNo}
                onChange={formik.handleChange}
                error={formik.touched.mobileNo && Boolean(formik.errors.mobileNo)}
                helperText={formik.touched.mobileNo && formik.errors.mobileNo}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Phone />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <Tooltip title="Enter your address">
              <StyledTextField
                fullWidth
                label="Address"
                name="address"
                value={formik.values.address}
                onChange={formik.handleChange}
                error={formik.touched.address && Boolean(formik.errors.address)}
                helperText={formik.touched.address && formik.errors.address}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Home />
                    </InputAdornment>
                  ),
                }}
              />
            </Tooltip>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth error={formik.touched.gender && Boolean(formik.errors.gender)}>
              <InputLabel>Gender</InputLabel>
              <Select
                name="gender"
                value={formik.values.gender}
                onChange={formik.handleChange}
                label="Gender"
              >
                <MenuItem value="Male"><Male /> Male</MenuItem>
                <MenuItem value="Female"><Female /> Female</MenuItem>
                <MenuItem value="Other">Other</MenuItem>
              </Select>
              <Typography variant="caption" color="error">
                {formik.touched.gender && formik.errors.gender}
              </Typography>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <FormControl fullWidth error={formik.touched.role && Boolean(formik.errors.role)}>
              <InputLabel>Role</InputLabel>
              <Select
                name="role"
                value={formik.values.role}
                onChange={formik.handleChange}
                label="Role"
              >
                <MenuItem value="Sales">Sales</MenuItem>
                <MenuItem value="HR">HR</MenuItem>
              </Select>
              <Typography variant="caption" color="error">
                {formik.touched.role && formik.errors.role}
              </Typography>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <StyledButton
              type="submit"
              fullWidth
              variant="contained"
              disabled={formik.isSubmitting}
              startIcon={
                formik.isSubmitting && <CircularProgress size={24} sx={{ color: '#fff' }} />
              }
            >
              {formik.isSubmitting ? 'Registering...' : 'Register'}
            </StyledButton>
          </Grid>
        </Grid>
      </Box>

      <Typography variant="body2" align="center" sx={{ mt: 2 }}>
        Already have an account?
        <Button onClick={() => navigate('/login')} sx={{ textDecoration: 'underline' }}>
          Login
        </Button>
      </Typography>
    </StyledContainer>
  );
};

export default RegisterForm;
