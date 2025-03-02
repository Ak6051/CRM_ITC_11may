


// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import Navbar from '../../components/admin components/AdminNavbar';
// import Sidebar from '../../components/admin components/AdminSidebar';
// import { Box, Paper } from '@mui/material';
// import { DataGrid } from '@mui/x-data-grid';

// const ClosedSaleData = () => {
//   const [sales, setSales] = useState([]);

//   useEffect(() => {
//     const fetchSales = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/report');
//         const processedData = response.data.map(sale => ({
//           ...sale,
//           meetingDate: sale.meetingDate ? new Date(sale.meetingDate).toLocaleDateString() : 'N/A',
//           startDate: sale.startDate ? new Date(sale.startDate).toLocaleDateString() : 'N/A',
//           endDate: sale.endDate ? new Date(sale.endDate).toLocaleDateString() : 'N/A',
//           createdAt: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A',
//         }));
//         setSales(processedData);
//       } catch (error) {
//         console.error('Error fetching sales data:', error);
//       }
//     };

//     fetchSales();
//   }, []);

//   const columns = [
//     { field: 'LeadBy', headerName: 'Lead By', width: 150 },
//     { field: 'companyName', headerName: 'Company Name', width: 200 },
//     { field: 'phoneNumber', headerName: 'Phone Number', width: 150 },
//     { field: 'address', headerName: 'Address', width: 200 },
//     { field: 'websiteUrl', headerName: 'Website URL', width: 200 },
//     { field: 'emailId', headerName: 'Email', width: 200 },
//     { field: 'callStatus', headerName: 'Call Status', width: 150 },
//     { field: 'meetingDate', headerName: 'Meeting Date', width: 150 },
//     { field: 'meetingTime', headerName: 'Meeting Time', width: 150 },
//     { field: 'contactPerson', headerName: 'Contact Person', width: 150 },
//     { field: 'designation', headerName: 'Designation', width: 150 },
//     { field: 'description', headerName: 'Description', width: 200 },
//     { field: 'startDate', headerName: 'Start Date', width: 150 },
//     { field: 'jobStatus', headerName: 'Job Status', width: 150 },
//     { field: 'endDate', headerName: 'End Date', width: 150 },
//     { field: 'paymentStatus', headerName: 'Payment Status', width: 150 },
//     { field: 'createdAt', headerName: 'Created At', width: 150 },
    
//   ];

//   return (
//     <div style={{ display: 'flex', height: '100vh',marginLeft:'-10px', backgroundColor: '#f5f5f5' }}>
//       {/* Sidebar is fixed */}
//       <div style={{ position: 'fixed',marginLeft:'-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
//         <Sidebar />
//       </div>

//       {/* Main content area */}
//       <Box
//         sx={{
//           flexGrow: 1,
//           display: 'flex',
//           flexDirection: 'column',
//           marginLeft: '250px',
//           height: '100vh',
//           overflow: 'hidden',
//         }}
//       >
//         {/* Navbar is fixed at the top */}
//         <Navbar />

//         {/* Content area scrollable */}
//         <div style={{ flexGrow: 1, overflowY: 'auto', marginTop: '15px' }}>
//           <Paper sx={{ margin: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
//             <div style={{ flexGrow: 1, overflow: 'auto' }}>
//               <DataGrid
//                 rows={sales}
//                 columns={columns}
//                 getRowId={(row) => row._id}
//                 pageSize={10}
//                 rowsPerPageOptions={[10, 20, 50]}
//                 checkboxSelection
//                 disableSelectionOnClick
//                 sx={{
//                   '& .MuiDataGrid-root': {
//                     border: 'none',
//                     fontSize: '0.9rem',
//                     backgroundColor: '#ffffff',
//                   },
//                   '& .MuiDataGrid-cell': {
//                     padding: '8px',
//                   },
//                   '& .MuiDataGrid-columnHeaders': {
//                     backgroundColor: '#e0e0e0',
//                     fontWeight: 'bold',
//                   },
//                   '& .MuiDataGrid-footerContainer': {
//                     backgroundColor: '#f5f5f5',
//                   },
//                 }}
//               />
//             </div>
//           </Paper>
//         </div>
//       </Box>
//     </div>
//   );
// };

// export default ClosedSaleData;


import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import { Box, Paper, Button, Dialog, DialogActions, DialogContent, DialogTitle, TextField } from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const ClosedSaleData = () => {
  const [sales, setSales] = useState([]);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [editData, setEditData] = useState({});

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/report');
      const processedData = response.data.map(sale => ({
        ...sale,
        meetingDate: sale.meetingDate ? new Date(sale.meetingDate).toLocaleDateString() : 'N/A',
        startDate: sale.startDate ? new Date(sale.startDate).toLocaleDateString() : 'N/A',
        endDate: sale.endDate ? new Date(sale.endDate).toLocaleDateString() : 'N/A',
        createdAt: sale.createdAt ? new Date(sale.createdAt).toLocaleDateString() : 'N/A',
      }));
      setSales(processedData);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/sales/${id}`);
      fetchSales();
    } catch (error) {
      console.error('Error deleting sale data:', error);
    }
  };

  const handleEditOpen = (row) => {
    setEditData(row);
    setOpenEditDialog(true);
  };

  const handleEditClose = () => {
    setOpenEditDialog(false);
    setEditData({});
  };

  const handleEditSave = async () => {
    try {
      await axios.put(`http://localhost:5000/api/sales/${editData._id}`, editData);
      fetchSales();
      handleEditClose();
    } catch (error) {
      console.error('Error updating sale data:', error);
    }
  };

  const handleChange = (field, value) => {
    setEditData({ ...editData, [field]: value });
  };

  const columns = [
    { field: 'LeadBy', headerName: 'Lead By', width: 150 },
    { field: 'companyName', headerName: 'Company Name', width: 200 },
    { field: 'phoneNumber', headerName: 'Phone Number', width: 150 },
    { field: 'address', headerName: 'Address', width: 200 },
    { field: 'websiteUrl', headerName: 'Website URL', width: 200 },
    { field: 'emailId', headerName: 'Email', width: 200 },
    { field: 'callStatus', headerName: 'Call Status', width: 150 },
    { field: 'meetingDate', headerName: 'Meeting Date', width: 150 },
    { field: 'meetingTime', headerName: 'Meeting Time', width: 150 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 150 },
    { field: 'designation', headerName: 'Designation', width: 150 },
    { field: 'description', headerName: 'Description', width: 200 },
    { field: 'startDate', headerName: 'Start Date', width: 150 },
    { field: 'jobStatus', headerName: 'Job Status', width: 150 },
    { field: 'endDate', headerName: 'End Date', width: 150 },
    { field: 'paymentStatus', headerName: 'Payment Status', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 150 },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params) => (
        <>
          <Button onClick={() => handleEditOpen(params.row)}>Edit</Button>
          <Button onClick={() => handleDelete(params.row._id)} style={{ marginLeft: 10 }}>Delete</Button>
        </>
      ),
    },
  ];

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

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
        <Navbar />

        <div style={{ flexGrow: 1, overflowY: 'auto', marginTop: '15px' }}>
          <Paper sx={{ margin: 2, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            <div style={{ flexGrow: 1, overflow: 'auto' }}>
              <DataGrid
                rows={sales}
                columns={columns}
                getRowId={(row) => row._id}
                pageSize={10}
                rowsPerPageOptions={[10, 20, 50]}
                checkboxSelection
                disableSelectionOnClick
                sx={{
                  '& .MuiDataGrid-root': {
                    border: 'none',
                    fontSize: '0.9rem',
                    backgroundColor: '#ffffff',
                  },
                  '& .MuiDataGrid-cell': {
                    padding: '8px',
                  },
                  '& .MuiDataGrid-columnHeaders': {
                    backgroundColor: '#e0e0e0',
                    fontWeight: 'bold',
                  },
                  '& .MuiDataGrid-footerContainer': {
                    backgroundColor: '#f5f5f5',
                  },
                }}
              />
            </div>
          </Paper>
        </div>
      </Box>

      {/* Edit Dialog */}
      <Dialog open={openEditDialog} onClose={handleEditClose}>
        <DialogTitle>Edit Sale</DialogTitle>
        <DialogContent>
          <TextField
            label="Lead By"
            fullWidth
            margin="normal"
            value={editData.LeadBy || ''}
            onChange={(e) => handleChange('LeadBy', e.target.value)}
          />
          <TextField
            label="Company Name"
            fullWidth
            margin="normal"
            value={editData.companyName || ''}
            onChange={(e) => handleChange('companyName', e.target.value)}
          />
          <TextField
            label="Phone Number"
            fullWidth
            margin="normal"
            value={editData.phoneNumber || ''}
            onChange={(e) => handleChange('phoneNumber', e.target.value)}
          />
          <TextField
            label="Address"
            fullWidth
            margin="normal"
            value={editData.address || ''}
            onChange={(e) => handleChange('address', e.target.value)}
          />
           <TextField
            label="Email"
            fullWidth
            margin="normal"
            value={editData.emailId|| ''}
            onChange={(e) => handleChange('emailId', e.target.value)}
          />
            <TextField
            label="Contact Person"
            fullWidth
            margin="normal"
            value={editData.contactPerson|| ''}
            onChange={(e) => handleChange('contactPerson', e.target.value)}
          />
               <TextField
            label="Designation"
            fullWidth
            margin="normal"
            value={editData.designation|| ''}
            onChange={(e) => handleChange('designation', e.target.value)}
          />
              <TextField
            label="Description"
            fullWidth
            margin="normal"
            value={editData.description|| ''}
            onChange={(e) => handleChange('description', e.target.value)}
          />
         
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>
    </div>
  );
};

export default ClosedSaleData;
