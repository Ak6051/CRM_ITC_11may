// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Button,
//   TextField,
//   Typography,
//   Modal,
//   Select,
//   MenuItem,
//   InputLabel,
//   FormControl,
// } from '@mui/material';
// import { DataGrid, GridToolbar } from '@mui/x-data-grid';
// import Navbar from '../../components/admin components/AdminNavbar';
// import Sidebar from '../../components/admin components/AdminSidebar';
// import * as XLSX from 'xlsx';
// import {
//   fetchEmployees,
//   newcreateEmployee,
//   updateEmployee,
//   deleteEmployee,
//   getCompanyNames,
// } from '../../utils/HrEmployeeReportService';

// const HrEmployeeReport = () => {
//   const [employees, setEmployees] = useState([]);
//   const [companies, setCompanies] = useState([]);
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
//     photo: '',
//     signature: '',
//     assignedCompany: '',
//   });
//   const [open, setOpen] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);

//   useEffect(() => {
//     getEmployees();
//     fetchCompanies();
//   }, []);

//   const getEmployees = async () => {
//     try {
//       const response = await fetchEmployees();
//       setEmployees(response.data);
//     } catch (error) {
//       console.error('Error fetching employees:', error);
//     }
//   };

//   const fetchCompanies = async () => {
//     try {
//       const response = await getCompanyNames();
//       setCompanies(response.data);
//     } catch (error) {
//       console.error('Error fetching company names:', error);
//     }
//   };

//   const handleChange = (e) => {
//     setFormData({ ...formData, [e.target.name]: e.target.value });
//   };

//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (editMode) {
//         await updateEmployee(selectedId, formData);
//       } else {
//         await newcreateEmployee(formData);
//       }
//       setFormData({
//         name: '',
//         fathersName: '',
//         occupation: '',
//         permanentAddress: '',
//         correspondentAddress: '',
//         contactNo: '',
//         education: '',
//         boardUniversity: '',
//         year: '',
//         percentage: '',
//         height: '',
//         weight: '',
//         birthDate: '',
//         age: '',
//         bloodGroup: '',
//         identityCard: '',
//         companyName: '',
//         designation: '',
//         companyMobileNo: '',
//         salary: '',
//         willingToWork: '',
//         preferredLocation: '',
//         preferredDesignation: '',
//         expectedSalary: '',
//         photo: '',
//         signature: '',
//         assignedCompany: '',
//       });
//       setOpen();
//       getEmployees();
//     } catch (error) {
//       console.error('Error saving employee:', error);
//     }
//   };

//   const handleDelete = async (id) => {
//     try {
//       await deleteEmployee(id);
//       getEmployees();
//     } catch (error) {
//       console.error('Error deleting employee:', error);
//     }
//   };

//   const handleEdit = (employee) => {
//     setFormData(employee);
//     setSelectedId(employee._id);
//     setEditMode(true);
//     setOpen(true);
//   };

//   const handleClose = () => {
//     setOpen(false);
//     setEditMode(false);
//     setFormData({
//       name: '',
//       fathersName: '',
//       occupation: '',
//       permanentAddress: '',
//       correspondentAddress: '',
//       contactNo: '',
//       education: '',
//       boardUniversity: '',
//       year: '',
//       percentage: '',
//       height: '',
//       weight: '',
//       birthDate: '',
//       age: '',
//       bloodGroup: '',
//       identityCard: '',
//       companyName: '',
//       designation: '',
//       companyMobileNo: '',
//       salary: '',
//       willingToWork: '',
//       preferredLocation: '',
//       preferredDesignation: '',
//       expectedSalary: '',
//       photo: '',
//       signature: '',
//       assignedCompany: '',
//     });
//   };

//   const handleExport = () => {
//     const worksheet = XLSX.utils.json_to_sheet(employees);
//     const workbook = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(workbook, worksheet, 'EmployeeData');
//     XLSX.writeFile(workbook, 'EmployeeData.xlsx');
//   };

//   const columns = [
//     { field: 'name', headerName: 'Name', width: 150 },
//     { field: 'fathersName', headerName: "Father's Name", width: 150 },
//     { field: 'occupation', headerName: 'Occupation', width: 150 },
//     { field: 'permanentAddress', headerName: 'Permanent Address', width: 200 },
//     {
//       field: 'correspondentAddress',
//       headerName: 'Correspondent Address',
//       width: 200,
//     },
//     { field: 'contactNo', headerName: 'Contact No', width: 130 },
//     { field: 'education', headerName: 'Education', width: 130 },
//     { field: 'boardUniversity', headerName: 'Board/University', width: 180 },
//     { field: 'year', headerName: 'Year', width: 120 },
//     { field: 'percentage', headerName: 'Percentage', width: 120 },
//     { field: 'height', headerName: 'Height (cm)', width: 120 },
//     { field: 'weight', headerName: 'Weight (kg)', width: 120 },
//     { field: 'birthDate', headerName: 'Birth Date', width: 150 },
//     { field: 'age', headerName: 'Age', width: 80 },
//     { field: 'bloodGroup', headerName: 'Blood Group', width: 120 },
//     { field: 'identityCard', headerName: 'Identity Card No', width: 150 },
//     { field: 'companyName', headerName: 'Company Name', width: 180 },
//     { field: 'designation', headerName: 'Designation', width: 150 },
//     { field: 'companyMobileNo', headerName: 'Company Mobile No', width: 150 },
//     { field: 'salary', headerName: 'Salary', width: 130 },
//     { field: 'willingToWork', headerName: 'Willing to Work', width: 160 },
//     {
//       field: 'preferredLocation',
//       headerName: 'Preferred Location',
//       width: 180,
//     },
//     {
//       field: 'preferredDesignation',
//       headerName: 'Preferred Designation',
//       width: 200,
//     },
//     { field: 'expectedSalary', headerName: 'Expected Salary', width: 150 },
//     { field: 'photo', headerName: 'Photo', width: 120 },
//     { field: 'signature', headerName: 'Signature', width: 120 },
//     { field: 'assignedCompany', headerName: 'Assigned Company', width: 180 },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       width: 200,
//       renderCell: (params) => (
//         <>
//           <Button
//             onClick={() => handleEdit(params.row)}
//             variant="contained"
//             color="primary"
//             size="small"
//           >
//             Edit
//           </Button>
//           <Button
//             onClick={() => handleDelete(params.row._id)}
//             variant="contained"
//             color="secondary"
//             size="small"
//             style={{ marginLeft: 8 }}
//           >
//             Delete
//           </Button>
//         </>
//       ),
//     },
//   ];

//   return (
//     <div style={{ display: 'flex' }}>
//       <Sidebar />
//       <Box sx={{ flexGrow: 1 }}>
//         <Navbar />
//         <Box sx={{ p: 3 }}>
//           <Typography variant="h4" gutterBottom>
//             HR Employee Report
//           </Typography>
//           <Box
//             sx={{
//               display: 'flex',
//               justifyContent: 'space-between',
//               marginBottom: 2,
//             }}
//           >
//             <Button
//               variant="contained"
//               color="primary"
//               onClick={() => setOpen(true)}
//             >
//               Add New Employee
//             </Button>
//             <Button
//               variant="contained"
//               color="secondary"
//               onClick={handleExport}
//               sx={{ ml: 2, mb: 2 }}
//             >
//               Export to Excel
//             </Button>
//           </Box>
//           <Box sx={{ height: 500, width: '100%' }}>
//             <DataGrid
//               rows={employees}
//               columns={columns}
//               getRowId={(row) => row._id}
//               pageSize={5}
//               components={{
//                 Toolbar: GridToolbar,
//               }}
//             />
//           </Box>

//           {/* Modal for Add/Edit Form */}
//           <Modal open={open} onClose={handleClose}>
//             <Box
//               component="form"
//               onSubmit={handleSubmit}
//               sx={{
//                 position: 'absolute',
//                 top: '50%',
//                 left: '50%',
//                 transform: 'translate(-50%, -50%)',
//                 width: 700,
//                 bgcolor: 'background.paper',
//                 boxShadow: 24,
//                 p: 4,
//                 display: 'flex',
//                 flexDirection: 'column',
//                 gap: 2,
//                 overflowY: 'auto',
//                 maxHeight: '80vh',
//               }}
//             >
//               <Typography variant="h6">
//                 {editMode ? 'Edit Employee' : 'Add Employee'}
//               </Typography>

//               <TextField
//                 fullWidth
//                 name="name"
//                 label="Name"
//                 value={formData.name}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="fathersName"
//                 label="Father's Name"
//                 value={formData.fathersName}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="occupation"
//                 label="Occupation"
//                 value={formData.occupation}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="permanentAddress"
//                 label="Permanent Address"
//                 value={formData.permanentAddress}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="correspondentAddress"
//                 label="Correspondent Address"
//                 value={formData.correspondentAddress}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="contactNo"
//                 label="Contact No"
//                 value={formData.contactNo}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="education"
//                 label="Education"
//                 value={formData.education}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="boardUniversity"
//                 label="Board/University"
//                 value={formData.boardUniversity}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="year"
//                 label="Year"
//                 value={formData.year}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="percentage"
//                 label="Percentage"
//                 value={formData.percentage}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="height"
//                 label="Height (cm)"
//                 value={formData.height}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="weight"
//                 label="Weight (kg)"
//                 value={formData.weight}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="birthDate"
//                 label="Birth Date"
//                 type="date"
//                 value={formData.birthDate}
//                 onChange={handleChange}
//                 InputLabelProps={{
//                   shrink: true,
//                 }}
//               />

//               <TextField
//                 fullWidth
//                 name="age"
//                 label="Age"
//                 value={formData.age}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="bloodGroup"
//                 label="Blood Group"
//                 value={formData.bloodGroup}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="identityCard"
//                 label="Identity Card No"
//                 value={formData.identityCard}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="companyName"
//                 label="Company Name"
//                 value={formData.companyName}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="designation"
//                 label="Designation"
//                 value={formData.designation}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="companyMobileNo"
//                 label="Company Mobile No"
//                 value={formData.companyMobileNo}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="salary"
//                 label="Salary"
//                 value={formData.salary}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="willingToWork"
//                 label="Willing to Work"
//                 value={formData.willingToWork}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="preferredLocation"
//                 label="Preferred Location"
//                 value={formData.preferredLocation}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="preferredDesignation"
//                 label="Preferred Designation"
//                 value={formData.preferredDesignation}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="expectedSalary"
//                 label="Expected Salary"
//                 value={formData.expectedSalary}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="photo"
//                 label="Photo URL"
//                 value={formData.photo}
//                 onChange={handleChange}
//               />

//               <TextField
//                 fullWidth
//                 name="signature"
//                 label="Signature URL"
//                 value={formData.signature}
//                 onChange={handleChange}
//               />

//               <FormControl fullWidth>
//                 <InputLabel id="employee-select-company">
//                   Assigned Company
//                 </InputLabel>
//                 <Select
//                   labelId="employee-select-company"
//                   name="assignedCompany"
//                   value={formData.assignedCompany}
//                   onChange={handleChange}
//                   displayEmpty
//                 >
//                   <menuItem value="">
//                     <em>None</em>
//                   </menuItem>
//                   {companies.map((company) => (
//                     <MenuItem key={company._id} value={company.companyName}>
//                       {company.companyName}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>

//               <Button variant="contained" color="primary">
//                 {editMode ? 'Update Employee' : 'Add Employee'}
//               </Button>
//             </Box>
//           </Modal>
//         </Box>
//       </Box>
//     </div>
//   );
// };

// export default HrEmployeeReport;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Modal,
  Grid,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import * as XLSX from 'xlsx';
import {
  fetchEmployees,
  newcreateEmployee,
  updateEmployee,
  deleteEmployee,
  getCompanyNames,
} from '../../utils/HrEmployeeReportService';

const HrEmployeeReport = () => {
  const [employees, setEmployees] = useState([]);
  const [companies, setCompanies] = useState([]);
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
    photo: '',
    signature: '',
    assignedCompany: '',
  });
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getEmployees();
    fetchCompanies();
  }, []);

  const getEmployees = async () => {
    try {
      const response = await fetchEmployees();
      setEmployees(response.data);
    } catch (error) {
      console.error('Error fetching employees:', error);
    }
  };

  const fetchCompanies = async () => {
    try {
      const response = await getCompanyNames();
      setCompanies(response.data);
    } catch (error) {
      console.error('Error fetching company names:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await updateEmployee(selectedId, formData);
      } else {
        await newcreateEmployee(formData);
      }
      resetForm();
      getEmployees();
    } catch (error) {
      console.error('Error saving employee:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteEmployee(id);
      getEmployees();
    } catch (error) {
      console.error('Error deleting employee:', error);
    }
  };

  const handleEdit = (employee) => {
    setFormData(employee);
    setSelectedId(employee._id);
    setEditMode(true);
    setOpen(true);
  };

  const resetForm = () => {
    setFormData({
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
      photo: '',
      signature: '',
      assignedCompany: '',
    });
    setEditMode(false);
    setOpen(false);
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(employees);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'EmployeeData');
    XLSX.writeFile(workbook, 'EmployeeData.xlsx');
  };

  const columns = [
    { field: 'name', headerName: 'Name', width: 150 },
    { field: 'fathersName', headerName: "Father's Name", width: 150 },
    { field: 'occupation', headerName: 'Occupation', width: 150 },
    { field: 'permanentAddress', headerName: 'Permanent Address', width: 200 },
    {
      field: 'correspondentAddress',
      headerName: 'Correspondent Address',
      width: 200,
    },
    { field: 'contactNo', headerName: 'Contact No', width: 130 },
    { field: 'education', headerName: 'Education', width: 130 },
    { field: 'boardUniversity', headerName: 'Board/University', width: 180 },
    { field: 'year', headerName: 'Year', width: 120 },
    { field: 'percentage', headerName: 'Percentage', width: 120 },
    { field: 'height', headerName: 'Height (cm)', width: 120 },
    { field: 'weight', headerName: 'Weight (kg)', width: 120 },
    { field: 'birthDate', headerName: 'Birth Date', width: 150 },
    { field: 'age', headerName: 'Age', width: 80 },
    { field: 'bloodGroup', headerName: 'Blood Group', width: 120 },
    { field: 'identityCard', headerName: 'Identity Card No', width: 150 },
    { field: 'companyName', headerName: 'Company Name', width: 180 },
    { field: 'designation', headerName: 'Designation', width: 150 },
    { field: 'companyMobileNo', headerName: 'Company Mobile No', width: 150 },
    { field: 'salary', headerName: 'Salary', width: 130 },
    { field: 'willingToWork', headerName: 'Willing to Work', width: 160 },
    {
      field: 'preferredLocation',
      headerName: 'Preferred Location',
      width: 180,
    },
    {
      field: 'preferredDesignation',
      headerName: 'Preferred Designation',
      width: 200,
    },
    { field: 'expectedSalary', headerName: 'Expected Salary', width: 150 },
    { field: 'photo', headerName: 'Photo', width: 120 },
    { field: 'signature', headerName: 'Signature', width: 120 },
    { field: 'assignedCompany', headerName: 'Assigned Company', width: 180 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <Button
            onClick={() => handleEdit(params.row)}
            variant="contained"
            color="primary"
            size="small"
          >
            Edit
          </Button>
          <Button
            onClick={() => handleDelete(params.row._id)}
            variant="contained"
            color="secondary"
            size="small"
            style={{ marginLeft: 8 }}
          >
            Delete
          </Button>
        </>
      ),
    },
  ];

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
        <div>
          <Box sx={{ padding: 2 }}>
            <Typography variant="h4" gutterBottom>
              HR Employee Report
            </Typography>
            <Button
              variant="contained"
              onClick={() => setOpen(true)}
              sx={{ mb: 2 }}
            >
              Add New Employee
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleExport}
              sx={{ ml: 2, mb: 2 }}
            >
              Export to Excel
            </Button>
            <DataGrid
              rows={employees}
              columns={columns}
              getRowId={(row) => row._id}
              autoHeight
              components={{ Toolbar: GridToolbar }}
            />
          </Box>

          {/* Modal for Add/Edit Form */}
          <Modal open={open} onClose={resetForm}>
            <Box
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                borderRadius: 2,
                width: '600px',
                maxHeight: '80vh', // Set the max height to 80% of the viewport height
                overflowY: 'auto', // Enable vertical scrolling
              }}
            >
              <Typography variant="h6" gutterBottom>
                {editMode ? 'Edit Employee' : 'Add Employee'}
              </Typography>
              <form onSubmit={handleSubmit}>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="name"
                      label="Name"
                      value={formData.name}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="fathersName"
                      label="Father's Name"
                      value={formData.fathersName}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="occupation"
                      label="Occupation"
                      value={formData.occupation}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="permanentAddress"
                      label="Permanent Address"
                      value={formData.permanentAddress}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="correspondentAddress"
                      label="Correspondent Address"
                      value={formData.correspondentAddress}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="contactNo"
                      label="Contact No"
                      value={formData.contactNo}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="education"
                      label="Education"
                      value={formData.education}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="boardUniversity"
                      label="Board/University"
                      value={formData.boardUniversity}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="year"
                      label="Year"
                      value={formData.year}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="percentage"
                      label="Percentage"
                      value={formData.percentage}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="height"
                      label="Height (cm)"
                      value={formData.height}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="weight"
                      label="Weight (kg)"
                      value={formData.weight}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="birthDate"
                      label="Birth Date"
                      type="date"
                      value={formData.birthDate}
                      onChange={handleChange}
                      InputLabelProps={{
                        shrink: true,
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="age"
                      label="Age"
                      value={formData.age}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="bloodGroup"
                      label="Blood Group"
                      value={formData.bloodGroup}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="identityCard"
                      label="Identity Card No"
                      value={formData.identityCard}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="companyName"
                      label="Company Name"
                      value={formData.companyName}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="designation"
                      label="Designation"
                      value={formData.designation}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="companyMobileNo"
                      label="Company Mobile No"
                      value={formData.companyMobileNo}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="salary"
                      label="Salary"
                      value={formData.salary}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="willingToWork"
                      label="Willing to Work"
                      value={formData.willingToWork}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="preferredLocation"
                      label="Preferred Location"
                      value={formData.preferredLocation}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="preferredDesignation"
                      label="Preferred Designation"
                      value={formData.preferredDesignation}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="expectedSalary"
                      label="Expected Salary"
                      value={formData.expectedSalary}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="photo"
                      label="Photo URL"
                      value={formData.photo}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      name="signature"
                      label="Signature URL"
                      value={formData.signature}
                      onChange={handleChange}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <FormControl fullWidth>
                      <InputLabel>Assigned Company</InputLabel>
                      <Select
                        name="assignedCompany"
                        value={formData.assignedCompany}
                        onChange={handleChange}
                      >
                        {companies.map((company) => (
                          <MenuItem
                            key={company._id}
                            value={company.companyName}
                          >
                            {company.companyName}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} sx={{ mt: 2 }}>
                    <Button variant="contained" color="primary" type="submit">
                      {editMode ? 'Update Employee' : 'Add Employee'}
                    </Button>
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={resetForm}
                      sx={{ ml: 2 }}
                    >
                      Cancel
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </Box>
          </Modal>
        </div>
      </Box>
    </div>
  );
};

export default HrEmployeeReport;
