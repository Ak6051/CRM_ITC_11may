// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Typography,
//   Paper,
// } from '@mui/material';
// import { useSnackbar } from 'notistack';
// import { DataGrid } from '@mui/x-data-grid'; // Import DataGrid
// import Navbar from '../../components/hr components/HrNavbar';
// import Sidebar from '../../components/hr components/HrSidebar';

// const EmployeeReport = () => {
//   const [employees, setEmployees] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const { enqueueSnackbar } = useSnackbar();

//   useEffect(() => {
//     // Fetch the data from the API
//     const fetchEmployees = async () => {
//       try {
//         const response = await fetch(
//           'http://localhost:5000/api/form/employees-data'
//         );
//         const data = await response.json();
//         setEmployees(data);
//         setLoading(false);
//       } catch (error) {
//         enqueueSnackbar('Error fetching employees', { variant: 'error' });
//         setLoading(false);
//       }
//     };

//     fetchEmployees();
//   }, [enqueueSnackbar]);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   // Define columns for the DataGrid
//   const columns = [
//     { field: '_id', headerName: 'ID', width: 150 },
//     { field: 'name', headerName: 'Name', width: 180 },
//     { field: 'fathersName', headerName: 'Father\'s Name', width: 180 },
//     { field: 'occupation', headerName: 'Occupation', width: 180 },
//     { field: 'permanentAddress', headerName: 'Permanent Address', width: 220 },
//     { field: 'contactNo', headerName: 'Contact No.', width: 180 },
//     { field: 'education', headerName: 'Education', width: 180 },
//     { field: 'year', headerName: 'Year', width: 100 },
//     { field: 'percentage', headerName: 'Percentage', width: 120 },
//     { field: 'companyName', headerName: 'Company Name', width: 180 },
//     { field: 'designation', headerName: 'Designation', width: 180 },
//     { field: 'salary', headerName: 'Salary', width: 150 },
//   ];

//   // Map employee data to the correct format for the DataGrid
//   const rows = employees.map((employee) => ({
//     id: employee._id, // 'id' is a required field in the DataGrid
//     name: employee.name,
//     fathersName: employee.fathersName,
//     occupation: employee.occupation,
//     permanentAddress: employee.permanentAddress,
//     contactNo: employee.contactNo,
//     education: employee.education,
//     year: employee.year,
//     percentage: employee.percentage,
//     companyName: employee.companyName,
//     designation: employee.designation,
//     salary: employee.salary,
//   }));

//   return (
//     <div style={{ display: 'flex', height: '100vh',marginLeft:'-10px', backgroundColor: '#f5f5f5' }}>
//     {/* Sidebar is fixed */}
//     <div style={{ position: 'fixed',marginLeft:'-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
//       <Sidebar />
//     </div>

//     {/* Main content area */}
//     <Box
//       sx={{
//         flexGrow: 1,
//         display: 'flex',
//         flexDirection: 'column',
//         marginLeft: '250px',
//         height: '100vh',
//         overflow: 'hidden',
//       }}
//     >
//       {/* Navbar is fixed at the top */}
//       <Navbar />
//         <Box sx={{ padding: 2 }}>
//           <Typography variant="h6" gutterBottom>
//             Employee List
//           </Typography>
//           {/* DataGrid for displaying employees */}
//           <Paper sx={{ height: 400, width: '100%' }}>
//             <DataGrid
//               rows={rows} // Rows of data
//               columns={columns} // Columns configuration
//               pageSize={5} // Number of rows per page
//               rowsPerPageOptions={[5, 10, 25]} // Options for number of rows per page
//               checkboxSelection // Allows selection of rows
//               disableSelectionOnClick // Disable row selection when clicking on cells
//             />
//           </Paper>
//         </Box>
//       </Box>
//     </div>
//   );
// };

// export default EmployeeReport;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
} from '@mui/material';
import { useSnackbar } from 'notistack';
import { DataGrid } from '@mui/x-data-grid'; // Import DataGrid
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';

const EmployeeReport = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const { enqueueSnackbar } = useSnackbar();

  const [open, setOpen] = useState(false);
  const [isEdit, setIsEdit] = useState(false);
  const [formData, setFormData] = useState({
    id: '',
    name: '',
    fathersName: '',
    occupation: '',
    permanentAddress: '',
    contactNo: '',
    education: '',
    year: '',
    percentage: '',
    companyName: '',
    designation: '',
    salary: '',
  });

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/form/employees-data');
        const data = await response.json();
        setEmployees(data);
        setLoading(false);
      } catch (error) {
        enqueueSnackbar('Error fetching employees', { variant: 'error' });
        setLoading(false);
      }
    };

    fetchEmployees();
  }, [enqueueSnackbar]);

  const handleOpen = (employee = {}) => {
    setFormData(employee);
    setIsEdit(!!employee.id);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setFormData({
      id: '',
      name: '',
      fathersName: '',
      occupation: '',
      permanentAddress: '',
      contactNo: '',
      education: '',
      year: '',
      percentage: '',
      companyName: '',
      designation: '',
      salary: '',
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const { id } = formData; // Destructure id from formData
  const url = isEdit
    ? `http://localhost:5000/api/form/employees-data/${id}`
    : 'http://localhost:5000/api/form/employees-data';
  const method = isEdit ? 'PUT' : 'POST';

    try {
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });
      const data = await response.json();
      if (isEdit) {
        setEmployees(employees.map((emp) => (emp._id === data._id ? data : emp)));
        enqueueSnackbar('Employee updated successfully', { variant: 'success' });
      } else {
        setEmployees([...employees, data]);
        enqueueSnackbar('Employee added successfully', { variant: 'success' });
      }
      handleClose();
    } catch (error) {
      enqueueSnackbar(`Error ${isEdit ? 'updating' : 'adding'} employee`, { variant: 'error' });
    }
  };

  const handleDelete = async (id) => {
    try {
      await fetch(`http://localhost:5000/api/form/employees-data/${id}`, { method: 'DELETE' });
      setEmployees(employees.filter((emp) => emp._id !== id));
      enqueueSnackbar('Employee deleted successfully', { variant: 'success' });
    } catch (error) {
      enqueueSnackbar('Error deleting employee', { variant: 'error' });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  const columns = [
    { field: '_id', headerName: 'ID', width: 150 },
    { field: 'name', headerName: 'Name', width: 180 },
    { field: 'fathersName', headerName: 'Father\'s Name', width: 180 },
    { field: 'occupation', headerName: 'Occupation', width: 180 },
    { field: 'permanentAddress', headerName: 'Permanent Address', width: 220 },
    { field: 'contactNo', headerName: 'Contact No.', width: 180 },
    { field: 'education', headerName: 'Education', width: 180 },
    { field: 'year', headerName: 'Year', width: 100 },
    { field: 'percentage', headerName: 'Percentage', width: 120 },
    { field: 'companyName', headerName: 'Company Name', width: 180 },
    { field: 'designation', headerName: 'Designation', width: 180 },
    { field: 'salary', headerName: 'Salary', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <Button onClick={() => handleOpen(params.row)}>Edit</Button>
          <Button color="error" onClick={() => handleDelete(params.row.id)}>
            Delete
          </Button>
        </>
      ),
    },
  ];

  const rows = employees.map((employee) => ({
    id: employee._id,
    name: employee.name,
    fathersName: employee.fathersName,
    occupation: employee.occupation,
    permanentAddress: employee.permanentAddress,
    contactNo: employee.contactNo,
    education: employee.education,
    year: employee.year,
    percentage: employee.percentage,
    companyName: employee.companyName,
    designation: employee.designation,
    salary: employee.salary,
  }));

  return (
    <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
      <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
        <Navbar />
        <Box sx={{ padding: 2 }}>
          <Typography variant="h6" gutterBottom>
            Employee List
          </Typography>
          <Button variant="contained" onClick={() => handleOpen()}>Add Employee</Button>
          <Paper sx={{ height: 400, width: '100%', marginTop: 2 }}>
            <DataGrid rows={rows} columns={columns} pageSize={5} rowsPerPageOptions={[5, 10, 25]} checkboxSelection disableSelectionOnClick />
          </Paper>
        </Box>
      </Box>

      {/* Dialog for Add/Edit Employee */}
      <Dialog open={open} onClose={handleClose}>
        <DialogTitle>{isEdit ? 'Edit Employee' : 'Add Employee'}</DialogTitle>
        <DialogContent>
          <TextField label="Name" fullWidth value={formData.name} onChange={(e) => setFormData({ ...formData, name: e.target.value })} margin="dense" />
          <TextField label="Father's Name" fullWidth value={formData.fathersName} onChange={(e) => setFormData({ ...formData, fathersName: e.target.value })} margin="dense" />
          <TextField label="Occupation" fullWidth value={formData.occupation} onChange={(e) => setFormData({ ...formData, occupation: e.target.value })} margin="dense" />
          <TextField label="Permanent Address" fullWidth value={formData.permanentAddress} onChange={(e) => setFormData({ ...formData, permanentAddress: e.target.value })} margin="dense" />
          <TextField label="Contact No." fullWidth value={formData.contactNo} onChange={(e) => setFormData({ ...formData, contactNo: e.target.value })} margin="dense" />
          <TextField label="Education" fullWidth value={formData.education} onChange={(e) => setFormData({ ...formData, education: e.target.value })} margin="dense" />
          <TextField label="Year" fullWidth value={formData.year} onChange={(e) => setFormData({ ...formData, year: e.target.value })} margin="dense" />
          <TextField label="Percentage" fullWidth value={formData.percentage} onChange={(e) => setFormData({ ...formData, percentage: e.target.value })} margin="dense" />
          <TextField label="Company Name" fullWidth value={formData.companyName} onChange={(e) => setFormData({ ...formData, companyName: e.target.value })} margin="dense" />
          <TextField label="Designation" fullWidth value={formData.designation} onChange={(e) => setFormData({ ...formData, designation: e.target.value })} margin="dense" />
          <TextField label="Salary" fullWidth value={formData.salary} onChange={(e) => setFormData({ ...formData, salary: e.target.value })} margin="dense" />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleClose}>Cancel</Button>
          <Button onClick={handleSubmit}>{isEdit ? 'Update' : 'Add'}</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default EmployeeReport;
