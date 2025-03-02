// // import React, { useEffect } from 'react';
// // import { useNavigate } from 'react-router-dom';
// // import Navbar from '../../components/sales components/SalesNavbar';
// // import Sidebar from '../../components/sales components/Sidebar';
// // import { Container, Typography, Box } from '@mui/material';

// // const SalesDashboard = () => {
// //   const navigate = useNavigate();

// //   useEffect(() => {
// //     const token = localStorage.getItem('token');
// //     if (!token) {
// //       navigate('/login'); // Redirect to login if no token
// //     }
// //   }, [navigate]);

// //   return (
// //     <Box sx={{ display: 'flex' }}>
// //       <Sidebar />
// //       <Box sx={{ flexGrow: 1 }}>
// //         <Navbar />
// //         <Container maxWidth="md" sx={{ mt: 4 }}>
// //           <Typography variant="h4">Welcome to Your Dashboard</Typography>
// //           <Typography variant="body1" sx={{ mt: 2 }}>
// //             This is your user dashboard where you can manage your profile and
// //             settings.
// //           </Typography>
// //           {/* Add more dashboard content here */}
// //         </Container>
// //       </Box>
// //     </Box>
// //   );
// // };

// // export default SalesDashboard;
// import React, { useState, useEffect } from 'react';
// import {
//   Box,
//   Button,
//   TextField,
//   Dialog,
//   DialogActions,
//   DialogContent,
//   DialogTitle,
// } from '@mui/material';
// import { DataGrid } from '@mui/x-data-grid';
// import { DatePicker } from '@mui/x-date-pickers/DatePicker';
// import dayjs from 'dayjs';
// import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider'; // Add this import
// import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs'; // Add this import
// import {
//   createSale,
//   fetchSales,
//   updateSale,
// } from '../../utils/SaleReportService';
// import Navbar from '../../components/sales components/SalesNavbar';
// import Sidebar from '../../components/sales components/Sidebar';
// import * as XLSX from 'xlsx'; // Import xlsx library for exporting data

// const SalesDashboard = () => {
//   const [salesData, setSalesData] = useState([]);
//   const [filteredData, setFilteredData] = useState([]);
//   const [formData, setFormData] = useState({
//     companyName: '',
//     phoneNumber: '',
//     address: '',
//     websiteUrl: '',
//     emailId: '',
//     callStatus: '',
//     meetingDate: '',
//     meetingTime: '',
//     contactPerson: '',
//     designation: '',
//     description: '',
//     createdAt: '',
//   });
//   const [open, setOpen] = useState(false);
//   const [editMode, setEditMode] = useState(false);
//   const [selectedId, setSelectedId] = useState(null);

//   // State for date filtering
//   const [startDate, setStartDate] = useState(null);
//   const [endDate, setEndDate] = useState(null);

//   // Fetch sales data from the backend
//   const getSales = async () => {
//     try {
//       const response = await fetchSales();
//       const salesWithId = response.data.map((item) => ({
//         ...item,
//         id: item._id, // Add id field
//       }));
//       setSalesData(salesWithId);
//       setFilteredData(salesWithId); // Initialize filtered data
//     } catch (error) {
//       console.error('Error fetching sales data:', error);
//     }
//   };

//   useEffect(() => {
//     getSales();
//   }, []);

//   // Filter data based on date range
//   useEffect(() => {
//     if (startDate || endDate) {
//       const filtered = salesData.filter((sale) => {
//         const saleDate = dayjs(sale.createdAt);
//         if (startDate && !saleDate.isAfter(startDate, 'day')) return false;
//         if (endDate && !saleDate.isBefore(endDate, 'day')) return false;
//         return true;
//       });
//       setFilteredData(filtered);
//     } else {
//       setFilteredData(salesData);
//     }
//   }, [startDate, endDate, salesData]);

//   // Handle form input changes
//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   // Handle form submission
//   const handleSubmit = async (e) => {
//     e.preventDefault();
//     try {
//       if (editMode) {
//         await updateSale(selectedId, formData);
//       } else {
//         await createSale(formData);
//       }
//       setFormData({
//         companyName: '',
//         phoneNumber: '',
//         address: '',
//         websiteUrl: '',
//         emailId: '',
//         callStatus: '',
//         meetingDate: '',
//         meetingTime: '',
//         contactPerson: '',
//         designation: '',
//         description: '',
//       });
//       setOpen(false);
//       getSales();
//     } catch (error) {
//       console.error('Error saving sale:', error);
//     }
//   };

//   // Export filtered data to Excel
//   const exportToExcel = () => {
//     const ws = XLSX.utils.json_to_sheet(filteredData);
//     const wb = XLSX.utils.book_new();
//     XLSX.utils.book_append_sheet(wb, ws, 'SalesData');
//     XLSX.writeFile(wb, 'filtered_sales_data.xlsx');
//   };

//   // Open dialog for adding or editing sales data
//   const handleOpen = (data = null) => {
//     if (data) {
//       setEditMode(true);
//       setSelectedId(data.id);
//       setFormData({
//         companyName: data.companyName || '',
//         phoneNumber: data.phoneNumber || '',
//         address: data.address || '',
//         websiteUrl: data.websiteUrl || '',
//         emailId: data.emailId || '',
//         callStatus: data.callStatus || '',
//         meetingDate: data.meetingDate || '',
//         meetingTime: data.meetingTime || '',
//         contactPerson: data.contactPerson || '',
//         designation: data.designation || '',
//         description: data.description || '',
//         createdAt: data.createdAt || '',
//       });
//     } else {
//       setEditMode(false);
//       setSelectedId(null);
//       setFormData({
//         companyName: '',
//         phoneNumber: '',
//         address: '',
//         websiteUrl: '',
//         emailId: '',
//         callStatus: '',
//         meetingDate: '',
//         meetingTime: '',
//         contactPerson: '',
//         designation: '',
//         description: '',
//         createdAt: '',
//       });
//     }
//     setOpen(true);
//   };

//   // Close the dialog
//   const handleClose = () => {
//     setOpen(false);
//   };

//   // Table columns
//   const columns = [
//     { field: 'LeadBy', headerName: 'Lead By', width: 130 },
//     { field: 'companyName', headerName: 'Company Name', width: 130 },
//     { field: 'phoneNumber', headerName: 'Phone Number', width: 130 },
//     { field: 'address', headerName: 'Address', width: 200 },
//     { field: 'websiteUrl', headerName: 'Website URL', width: 150 },
//     { field: 'emailId', headerName: 'Email', width: 150 },
//     { field: 'callStatus', headerName: 'Call Status', width: 130 },
//     { field: 'meetingDate', headerName: 'Meeting Date', width: 130 },
//     { field: 'meetingTime', headerName: 'Meeting Time', width: 130 },
//     { field: 'contactPerson', headerName: 'Contact Person', width: 150 },
//     { field: 'designation', headerName: 'Designation', width: 150 },
//     { field: 'description', headerName: 'Description', width: 200 },
//     { field: 'createdAt', headerName: 'Created At', width: 200 },
//     {
//       field: 'actions',
//       headerName: 'Actions',
//       width: 150,
//       renderCell: (params) => (
//         <Button
//           variant="contained"
//           color="primary"
//           onClick={() => handleOpen(params.row)}
//         >
//           Edit
//         </Button>
//       ),
//     },
//   ];

//   return (
//     <LocalizationProvider dateAdapter={AdapterDayjs}>
//       {/* Wrap your component with LocalizationProvider */}
//       <div style={{ display: 'flex', height: '100vh',marginLeft:'-10px', backgroundColor: '#f5f5f5' }}>
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
//           <Box display="flex" alignItems="center" gap={2} mb={2}>
//             <DatePicker
//               label="Start Date"
//               value={startDate}
//               onChange={(date) => setStartDate(dayjs(date))}
//               renderInput={(params) => <TextField {...params} />}
//             />
//             <DatePicker
//               label="End Date"
//               value={endDate}
//               onChange={(date) => setEndDate(dayjs(date))}
//               renderInput={(params) => <TextField {...params} />}
//             />
//             <Button
//               variant="contained"
//               color="secondary"
//               onClick={() => {
//                 setStartDate(null);
//                 setEndDate(null);
//               }}
//             >
//               Reset Filter
//             </Button>
//           </Box>
//           <Button
//             variant="contained"
//             color="primary"
//             onClick={() => handleOpen()}
//             style={{ marginBottom: '1rem' }}
//           >
//             Add New Sale
//           </Button>
//           <Button
//             variant="contained"
//             color="primary"
//             onClick={exportToExcel}
//             style={{ marginBottom: '1rem' }}
//           >
//             Export Filtered Data
//           </Button>
//           <DataGrid
//             rows={filteredData}
//             columns={columns}
//             pageSize={5}
//             autoHeight
//           />

//           {/* Dialog for adding/editing sales data */}
//           <Dialog open={open} onClose={handleClose}>
//             <DialogTitle>{editMode ? 'Edit Sale' : 'Add Sale'}</DialogTitle>
//             <DialogContent>{/* Add your form fields here */}</DialogContent>
//             <DialogActions>
//               <Button onClick={handleClose} color="secondary">
//                 Cancel
//               </Button>
//               <Button onClick={handleSubmit} color="primary">
//                 {editMode ? 'Update' : 'Save'}
//               </Button>
//             </DialogActions>
//           </Dialog>
//         </Box>
//       </div>
//     </LocalizationProvider>
//   );
// };

// export default SalesDashboard;


import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import {
  createSale,
  fetchSales,
  updateSale,
} from '../../utils/SaleReportService';
import Navbar from '../../components/sales components/SalesNavbar';
import Sidebar from '../../components/sales components/Sidebar';
import * as XLSX from 'xlsx';

const SalesDashboard = () => {
  const [salesData, setSalesData] = useState([]);
  const [filteredData, setFilteredData] = useState([]);
  const [formData, setFormData] = useState({
    companyName: '',
    phoneNumber: '',
    address: '',
    websiteUrl: '',
    emailId: '',
    callStatus: '',
    meetingDate: '',
    meetingTime: '',
    contactPerson: '',
    designation: '',
    description: '',
    createdAt: '',
  });
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);
  const [startDate, setStartDate] = useState(null);
  const [endDate, setEndDate] = useState(null);

  useEffect(() => {
    const getSales = async () => {
      try {
        const response = await fetchSales();
        const salesWithId = response.data.map((item) => ({
          ...item,
          id: item._id,
        }));
        setSalesData(salesWithId);
        setFilteredData(salesWithId);
      } catch (error) {
        console.error('Error fetching sales data:', error);
      }
    };
    getSales();
  }, []);

  useEffect(() => {
    if (startDate || endDate) {
      const filtered = salesData.filter((sale) => {
        const saleDate = dayjs(sale.createdAt);
        return (!startDate || saleDate.isAfter(startDate, 'day')) &&
               (!endDate || saleDate.isBefore(endDate, 'day'));
      });
      setFilteredData(filtered);
    } else {
      setFilteredData(salesData);
    }
  }, [startDate, endDate, salesData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editMode) {
        await updateSale(selectedId, formData);
      } else {
        await createSale(formData);
      }
      setFormData({
        companyName: '',
        phoneNumber: '',
        address: '',
        websiteUrl: '',
        emailId: '',
        callStatus: '',
        meetingDate: '',
        meetingTime: '',
        contactPerson: '',
        designation: '',
        description: '',
      });
      setOpen(false);
      const response = await fetchSales();
      setSalesData(response.data.map((item) => ({ ...item, id: item._id })));
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const exportToExcel = () => {
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'SalesData');
    XLSX.writeFile(wb, 'filtered_sales_data.xlsx');
  };

  const handleOpen = (data = null) => {
    if (data) {
      setEditMode(true);
      setSelectedId(data.id);
      setFormData(data);
    } else {
      setEditMode(false);
      setSelectedId(null);
      setFormData({
        companyName: '',
        phoneNumber: '',
        address: '',
        websiteUrl: '',
        emailId: '',
        callStatus: '',
        meetingDate: '',
        meetingTime: '',
        contactPerson: '',
        designation: '',
        description: '',
        createdAt: '',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const columns = [
    { field: 'LeadBy', headerName: 'Lead By', width: 130 },
    { field: 'companyName', headerName: 'Company Name', width: 130 },
    { field: 'phoneNumber', headerName: 'Phone Number', width: 130 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'websiteUrl', headerName: 'Website URL', width: 150 },
    { field: 'emailId', headerName: 'Email', width: 150 },
    { field: 'callStatus', headerName: 'Call Status', width: 130 },
    { field: 'meetingDate', headerName: 'Meeting Date', width: 130 },
    { field: 'meetingTime', headerName: 'Meeting Time', width: 130 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 150 },
    { field: 'designation', headerName: 'Designation', width: 150 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'createdAt', headerName: 'Created At', width: 200 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 150,
      renderCell: (params) => (
        <Button
          variant="contained"
          color="primary"
          onClick={() => handleOpen(params.row)}
        >
          Edit
        </Button>
      ),
    },
  ];

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <div style={{ display: 'flex', height: '100vh', backgroundColor: '#f5f5f5' }}>
        <div style={{ position: 'fixed', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
          <Sidebar />
        </div>
        <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column', marginLeft: '250px', height: '100vh', overflow: 'hidden' }}>
          <Navbar />
          <Box display="flex" alignItems="center" gap={2} mt={2} mb={2} px={3}>
            <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
              Sales Dashboard
            </Typography>
            <DatePicker
              label="Start Date"
              value={startDate}
              onChange={(date) => setStartDate(dayjs(date))}
              renderInput={(params) => <TextField {...params} />}
            />
            <DatePicker
              label="End Date"
              value={endDate}
              onChange={(date) => setEndDate(dayjs(date))}
              renderInput={(params) => <TextField {...params} />}
            />
            <Button variant="contained" color="secondary" onClick={() => { setStartDate(null); setEndDate(null); }}>
              Reset Filter
            </Button>
          </Box>
          <Box px={3}>
            <Button variant="contained" color="primary" onClick={() => handleOpen()} sx={{ mr: 2, mb: 2 }}>
              Add New Sale
            </Button>
            <Button variant="contained" color="primary" onClick={exportToExcel} sx={{ mb: 2 }}>
              Export Filtered Data
            </Button>
          </Box>
          <Box px={3}>
            <DataGrid rows={filteredData} columns={columns} pageSize={5} autoHeight />
          </Box>
          <Dialog open={open} onClose={handleClose}>
            <DialogTitle>{editMode ? 'Edit Sale' : 'Add Sale'}</DialogTitle>
            <DialogContent>
              {/* Add your form fields here */}
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose} color="secondary">
                Cancel
              </Button>
              <Button onClick={handleSubmit} color="primary">
                {editMode ? 'Update' : 'Save'}
              </Button>
            </DialogActions>
          </Dialog>
        </Box>
      </div>
    </LocalizationProvider>
  );
};

export default SalesDashboard;