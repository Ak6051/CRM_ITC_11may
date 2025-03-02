// import React, { useState } from 'react';
// import {
//   Box,
//   TextField,
//   Button,
//   Card,
//   CardContent,
//   Typography,
//   Grid,
//   Avatar,
// } from '@mui/material';
// import PhotoCamera from '@mui/icons-material/PhotoCamera';
// import EditIcon from '@mui/icons-material/Edit';
// import Navbar from '../../components/hr components/HrNavbar';
// import Sidebar from '../../components/hr components/HrSidebar';

// const EmployeeForm = () => {
//   const [formData, setFormData] = useState({
//     name: '',
//     fathersName: '',
//     occupation: '',
//     permanentAddress: '',
//     correspondentAddress: '',
//     contactNo: '',
//     education: '',
//     boardUniversity: '',
//     year: '',
//     percentage: '',
//     height: '',
//     weight: '',
//     birthDate: '',
//     age: '',
//     bloodGroup: '',
//     identityCard: '',
//     companyName: '',
//     designation: '',
//     companyMobileNo: '',
//     salary: '',
//     willingToWork: '',
//     preferredLocation: '',
//     preferredDesignation: '',
//     expectedSalary: '',
//     photo: null,
//     signature: null,
//   });

//   const [photoPreview, setPhotoPreview] = useState(null);
//   const [signaturePreview, setSignaturePreview] = useState(null);

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleFileChange = (e) => {
//     const { name, files } = e.target;
//     const file = files[0];

//     if (file) {
//       setFormData({ ...formData, [name]: file });

//       const previewUrl = URL.createObjectURL(file);
//       if (name === 'photo') setPhotoPreview(previewUrl);
//       if (name === 'signature') setSignaturePreview(previewUrl);
//     }
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     const formDataObj = new FormData();
//     Object.keys(formData).forEach((key) => {
//       if (formData[key] !== null) {
//         formDataObj.append(key, formData[key]);
//       }
//     });

//     try {
//       const response = await fetch('http://localhost:5000/api/form/employee', {
//         method: 'POST',
//         body: formDataObj,
//       });

//       if (response.ok) {
//         const result = await response.json();
//         console.log(result.message);
//         alert('Employee data saved successfully!');
//       } else {
//         console.log('Error in submitting form');
//       }
//     } catch (error) {
//       console.log('Error:', error);
//     }
//   };

//   return (
//     <div style={{ display: 'flex', height: '100vh' }}>
//       <Sidebar />
//       <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
//         <Navbar />
//         <Card
//           style={{
//             maxWidth: 800,
//             margin: '40px auto',
//             padding: '20px 5px',
//             borderRadius: '30px',
//             overflow: 'auto',
//             maxHeight: '85vh',
//           }}
//         >
//           <CardContent>
//             <Typography variant="h4" gutterBottom align="center">
//               Employee Details Form
//             </Typography>
//             <form onSubmit={handleSubmit}>
//               <Grid container spacing={3}>
//                 {/* Photo Upload with Preview */}
//                 <Grid item xs={12} style={{ textAlign: 'center' }}>
//                   <Avatar
//                     src={photoPreview}
//                     alt="Profile Photo"
//                     sx={{ width: 100, height: 100, margin: 'auto', mb: 2 }}
//                   />
//                   <Button
//                     variant="outlined"
//                     component="label"
//                     color="secondary"
//                     startIcon={<PhotoCamera />}
//                   >
//                     Upload Photo
//                     <input
//                       type="file"
//                       name="photo"
//                       accept="image/*"
//                       hidden
//                       onChange={handleFileChange}
//                     />
//                   </Button>
//                 </Grid>

//                 {/* Basic Details */}
//                 <Grid item xs={12}>
//                   <Typography variant="h6">Basic Details</Typography>
//                 </Grid>
//                 {[
//                   { label: 'Name', name: 'name' },
//                   { label: "Father's Name", name: 'fathersName' },
//                   { label: 'Occupation', name: 'occupation' },
//                   { label: 'Contact No.', name: 'contactNo' },
//                   { label: 'Height', name: 'height' },
//                   { label: 'Weight', name: 'weight' },
//                   { label: 'Birth Date', name: 'birthDate', type: 'date' },
//                   { label: 'Age', name: 'age' },
//                   { label: 'Blood Group', name: 'bloodGroup' },
//                   { label: 'Identity Card', name: 'identityCard' },
//                 ].map((field, index) => (
//                   <Grid item xs={6} key={index}>
//                     <TextField
//                       name={field.name}
//                       label={field.label}
//                       fullWidth
//                       type={field.type || 'text'}
//                       onChange={handleChange}
//                     />
//                   </Grid>
//                 ))}

//                 {/* Address Fields */}
//                 <Grid item xs={12}>
//                   <TextField
//                     name="permanentAddress"
//                     label="Permanent Address"
//                     fullWidth
//                     onChange={handleChange}
//                   />
//                 </Grid>
//                 <Grid item xs={12}>
//                   <TextField
//                     name="correspondentAddress"
//                     label="Correspondent Address"
//                     fullWidth
//                     onChange={handleChange}
//                   />
//                 </Grid>
//                 {/* Education Details */}
//                 <Grid item xs={12}>
//                   <Typography variant="h6">Education Details</Typography>
//                 </Grid>
//                 {[
//                   { label: 'Education', name: 'education', xs: 4 },
//                   { label: 'Board/University', name: 'boardUniversity', xs: 4 },
//                   { label: 'Year', name: 'year', xs: 2 },
//                   { label: 'Percentage (%)', name: 'percentage', xs: 2 },
//                 ].map((field, index) => (
//                   <Grid item xs={field.xs} key={index}>
//                     <TextField
//                       name={field.name}
//                       label={field.label}
//                       fullWidth
//                       onChange={handleChange}
//                     />
//                   </Grid>
//                 ))}

//                 {/* Company Details */}
//                 <Grid item xs={12}>
//                   <Typography variant="h6">Company Details</Typography>
//                 </Grid>
//                 {[
//                   { label: 'Company Name', name: 'companyName' },
//                   { label: 'Designation', name: 'designation' },
//                   { label: 'Company Mobile No.', name: 'companyMobileNo' },
//                   { label: 'Salary', name: 'salary' },
//                 ].map((field, index) => (
//                   <Grid item xs={6} key={index}>
//                     <TextField
//                       name={field.name}
//                       label={field.label}
//                       fullWidth
//                       onChange={handleChange}
//                     />
//                   </Grid>
//                 ))}

//                 {/* Job Preferences */}
//                 <Grid item xs={12}>
//                   <Typography variant="h6">Job Preferences</Typography>
//                 </Grid>
//                 {[
//                   { label: 'Willing to Work', name: 'willingToWork' },
//                   { label: 'Preferred Location', name: 'preferredLocation' },
//                   {
//                     label: 'Preferred Designation',
//                     name: 'preferredDesignation',
//                   },
//                   { label: 'Expected Salary', name: 'expectedSalary' },
//                 ].map((field, index) => (
//                   <Grid item xs={6} key={index}>
//                     <TextField
//                       name={field.name}
//                       label={field.label}
//                       fullWidth
//                       onChange={handleChange}
//                     />
//                   </Grid>
//                 ))}

//                 {/* Digital Signature Upload with Preview */}
//                 <Grid
//                   item
//                   xs={12}
//                   style={{ textAlign: 'center', marginTop: '20px' }}
//                 >
//                   <Avatar
//                     src={signaturePreview}
//                     alt="Signature"
//                     sx={{ width: 100, height: 100, margin: 'auto', mb: 2 }}
//                   />
//                   <Button
//                     variant="outlined"
//                     component="label"
//                     color="secondary"
//                     startIcon={<EditIcon />}
//                   >
//                     Upload Signature
//                     <input
//                       type="file"
//                       name="signature"
//                       accept="image/*"
//                       hidden
//                       onChange={handleFileChange}
//                     />
//                   </Button>
//                 </Grid>

//                 {/* Submit Button */}
//                 <Grid
//                   item
//                   xs={12}
//                   style={{ textAlign: 'center', marginTop: '20px' }}
//                 >
//                   <Button variant="contained" color="primary" type="submit">
//                     Submit
//                   </Button>
//                 </Grid>
//               </Grid>
//             </form>
//           </CardContent>
//         </Card>
//       </Box>
//     </div>
//   );
// };

// export default EmployeeForm;
import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Card,
  CardContent,
  Typography,
  Grid,
  Avatar,
  FormHelperText,
} from '@mui/material';
import PhotoCamera from '@mui/icons-material/PhotoCamera';
import EditIcon from '@mui/icons-material/Edit';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';

const EmployeeForm = () => {
  const [formData, setFormData] = useState({
    name: '',
    fathersName: '',
    occupation: '',
    permanentAddress: '',
    correspondentAddress: '',
    contactNo: '',
    education: '',
    boardUniversity: '',
    year: '',
    percentage: '',
    height: '',
    weight: '',
    birthDate: '',
    age: '',
    bloodGroup: '',
    identityCard: '',
    companyName: '',
    designation: '',
    companyMobileNo: '',
    salary: '',
    willingToWork: '',
    preferredLocation: '',
    preferredDesignation: '',
    expectedSalary: '',
    photo: null,
    signature: null,
  });

  const [errors, setErrors] = useState({});
  const [photoPreview, setPhotoPreview] = useState(null);
  const [signaturePreview, setSignaturePreview] = useState(null);

  const validate = () => {
    const newErrors = {};
    const regexContactNo = /^[0-9]{10}$/; // Regex for 10 digit contact number
    const regexPercentage = /^(100|[1-9]?[0-9])(\.\d{1,2})?$/; // Regex for percentage (e.g., 95 or 95.50)
    const regexSalary = /^[0-9]+(\.[0-9]{1,2})?$/; // Regex for salary (e.g., 1000 or 1000.00)

    // Validate required fields
    if (!formData.name) newErrors.name = 'Name is required';
    if (!formData.fathersName)
      newErrors.fathersName = "Father's Name is required";
    if (!formData.contactNo || !regexContactNo.test(formData.contactNo))
      newErrors.contactNo = 'Contact No. must be a valid 10-digit number';
    if (!formData.permanentAddress)
      newErrors.permanentAddress = 'Permanent Address is required';
    if (!formData.correspondentAddress)
      newErrors.correspondentAddress = 'Correspondent Address is required';
    if (!formData.education) newErrors.education = 'Education is required';
    if (!formData.boardUniversity)
      newErrors.boardUniversity = 'Board/University is required';
    if (!formData.year) newErrors.year = 'Year is required';
    if (!formData.percentage || !regexPercentage.test(formData.percentage))
      newErrors.percentage = 'Percentage must be a valid number (0-100)';
    if (!formData.height) newErrors.height = 'Height is required';
    if (!formData.weight) newErrors.weight = 'Weight is required';
    if (!formData.birthDate) newErrors.birthDate = 'Birth Date is required';
    if (!formData.age) newErrors.age = 'Age is required';
    if (!formData.bloodGroup) newErrors.bloodGroup = 'Blood Group is required';
    if (!formData.identityCard)
      newErrors.identityCard = 'Identity Card is required';
    if (!formData.companyName)
      newErrors.companyName = 'Company Name is required';
    if (!formData.designation)
      newErrors.designation = 'Designation is required';
    if (
      !formData.companyMobileNo ||
      !regexContactNo.test(formData.companyMobileNo)
    )
      newErrors.companyMobileNo =
        'Company Mobile No. must be a valid 10-digit number';
    if (!formData.salary || !regexSalary.test(formData.salary))
      newErrors.salary = 'Salary must be a valid number';
    if (!formData.willingToWork)
      newErrors.willingToWork = 'Willing to Work is required';
    if (!formData.preferredLocation)
      newErrors.preferredLocation = 'Preferred Location is required';
    if (!formData.preferredDesignation)
      newErrors.preferredDesignation = 'Preferred Designation is required';
    if (!formData.expectedSalary || !regexSalary.test(formData.expectedSalary))
      newErrors.expectedSalary = 'Expected Salary must be a valid number';

    // Check if photo and signature are uploaded
    if (!formData.photo) newErrors.photo = 'Photo is required';
    if (!formData.signature) newErrors.signature = 'Signature is required';

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0; // Return true if no errors
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    const { name, files } = e.target;
    const file = files[0];

    if (file) {
      setFormData({ ...formData, [name]: file });

      const previewUrl = URL.createObjectURL(file);
      if (name === 'photo') setPhotoPreview(previewUrl);
      if (name === 'signature') setSignaturePreview(previewUrl);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validate()) return; // Only submit if validation is successful

    const formDataObj = new FormData();
    Object.keys(formData).forEach((key) => {
      if (formData[key] !== null) {
        formDataObj.append(key, formData[key]);
      }
    });

    try {
      const response = await fetch('http://localhost:5000/api/form/employee', {
        method: 'POST',
        body: formDataObj,
      });

      if (response.ok) {
        const result = await response.json();
        console.log(result.message);
        alert('Employee data saved successfully!');
      } else {
        console.log('Error in submitting form');
      }
    } catch (error) {
      console.log('Error:', error);
    }
  };
  return (
    <div style={{ display: 'flex', height: '100vh',marginLeft:'-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar is fixed */}
      <div style={{ position: 'fixed',marginLeft:'-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

      {/* Main content area */}
      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          marginLeft: '250px',
          height: '100vh',
          overflow: 'hidden',
        }}
      >
        {/* Navbar is fixed at the top */}
        <Navbar />
        <Card
          style={{
            maxWidth: 800,
            margin: '40px auto',
            padding: '20px 5px',
            borderRadius: '30px',
            overflow: 'auto',
            maxHeight: '85vh',
          
          }}
        >
          <CardContent>
            <Typography variant="h4" gutterBottom align="center">
              Employee Details Form
            </Typography>
            <form onSubmit={handleSubmit}>
              <Grid container spacing={3}>
                {/* Photo Upload with Preview */}
                <Grid item xs={12} style={{ textAlign: 'center' }}>
                  <Avatar
                    src={photoPreview}
                    alt="Profile Photo"
                    sx={{ width: 100, height: 100, margin: 'auto', mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    color="secondary"
                    startIcon={<PhotoCamera />}
                  >
                    Upload Photo
                    <input
                      type="file"
                      name="photo"
                      accept="image/*"
                      hidden
                      onChange={handleFileChange}
                    />
                    {errors.photo && (
                      <FormHelperText error>{errors.photo}</FormHelperText>
                    )}
                  </Button>
                </Grid>

                {/* Basic Details */}
                <Grid item xs={12}>
                  <Typography variant="h6">Basic Details</Typography>
                </Grid>
                {[
                  { label: 'Name', name: 'name' },
                  { label: "Father's Name", name: 'fathersName' },
                  { label: 'Occupation', name: 'occupation' },
                  { label: 'Contact No.', name: 'contactNo' },
                  { label: 'Height', name: 'height' },
                  { label: 'Weight', name: 'weight' },
                  { label: 'Birth Date', name: 'birthDate', type: 'date' },
                  { label: 'Age', name: 'age' },
                  { label: 'Blood Group', name: 'bloodGroup' },
                  { label: 'Identity Card', name: 'identityCard' },
                ].map((field, index) => (
                  <Grid item xs={6} key={index}>
                    <TextField
                      name={field.name}
                      label={field.label}
                      fullWidth
                      type={field.type || 'text'}
                      onChange={handleChange}
                      error={!!errors[field.name]}
                      helperText={errors[field.name]}
                    />
                  </Grid>
                ))}

                {/* Section 2: Address Details */}
                <Grid item xs={12}>
                  <Typography variant="h6">Address Details</Typography>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="permanentAddress"
                    label="Permanent Address"
                    fullWidth
                    onChange={handleChange}
                    error={!!errors.permanentAddress}
                    helperText={errors.permanentAddress}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    name="correspondentAddress"
                    label="Correspondent Address"
                    fullWidth
                    onChange={handleChange}
                    error={!!errors.correspondentAddress}
                    helperText={errors.correspondentAddress}
                  />
                </Grid>
                {/* Education Details */}
                <Grid item xs={12}>
                  <Typography variant="h6">Education Details</Typography>
                </Grid>
                {[
                  { label: 'Education', name: 'education', xs: 4 },
                  { label: 'Board/University', name: 'boardUniversity', xs: 4 },
                  { label: 'Year', name: 'year', xs: 2 },
                  { label: 'Percentage (%)', name: 'percentage', xs: 2 },
                ].map((field, index) => (
                  <Grid item xs={6} key={index}>
                    <TextField
                      name={field.name}
                      label={field.label}
                      fullWidth
                      onChange={handleChange}
                      error={!!errors[field.name]}
                      helperText={errors[field.name]}
                    />
                  </Grid>
                ))}

                {/* Company Details */}
                <Grid item xs={12}>
                  <Typography variant="h6">Company Details</Typography>
                </Grid>
                {[
                  { label: 'Company Name', name: 'companyName' },
                  { label: 'Designation', name: 'designation' },
                  { label: 'Company Mobile No.', name: 'companyMobileNo' },
                  { label: 'Salary', name: 'salary' },
                ].map((field, index) => (
                  <Grid item xs={6} key={index}>
                    <TextField
                      name={field.name}
                      label={field.label}
                      fullWidth
                      onChange={handleChange}
                      error={!!errors[field.name]}
                      helperText={errors[field.name]}
                    />
                  </Grid>
                ))}

                {/* Job Preferences */}
                <Grid item xs={12}>
                  <Typography variant="h6">Job Preferences</Typography>
                </Grid>
                {[
                  { label: 'Willing to Work', name: 'willingToWork' },
                  { label: 'Preferred Location', name: 'preferredLocation' },
                  {
                    label: 'Preferred Designation',
                    name: 'preferredDesignation',
                  },
                  { label: 'Expected Salary', name: 'expectedSalary' },
                ].map((field, index) => (
                  <Grid item xs={6} key={index}>
                    <TextField
                      name={field.name}
                      label={field.label}
                      fullWidth
                      onChange={handleChange}
                      error={!!errors[field.name]}
                      helperText={errors[field.name]}
                    />
                  </Grid>
                ))}

                {/* Digital Signature Upload with Preview */}
                <Grid
                  item
                  xs={12}
                  style={{ textAlign: 'center', marginTop: '20px' }}
                >
                  <Avatar
                    src={signaturePreview}
                    alt="Signature"
                    sx={{ width: 100, height: 100, margin: 'auto', mb: 2 }}
                  />
                  <Button
                    variant="outlined"
                    component="label"
                    color="secondary"
                    startIcon={<EditIcon />}
                  >
                    Upload Signature
                    <input
                      type="file"
                      name="signature"
                      accept="image/*"
                      hidden
                      onChange={handleFileChange}
                    />
                  </Button>
                </Grid>

                {/* Submit Button */}
                <Grid
                  item
                  xs={12}
                  style={{ textAlign: 'center', marginTop: '20px' }}
                >
                  <Button variant="contained" color="primary" type="submit">
                    Submit
                  </Button>
                </Grid>
              </Grid>
            </form>
          </CardContent>
        </Card>
      </Box>
    </div>
  );
};

export default EmployeeForm;
