import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Modal,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { DataGrid, GridToolbar } from '@mui/x-data-grid';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import {
  fetchSales,
  createSale,
  deleteSale,
  updateSale,
  fetchHRUsers,
} from '../../utils/JobReportService';
import * as XLSX from 'xlsx';

const JobReport = () => {
  const [sales, setSales] = useState([]);
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
    assignedHR: '', // New field for assigned HR
  });
  const [hrUsers, setHrUsers] = useState([]); // State to hold HR users
  const [open, setOpen] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  useEffect(() => {
    getSales();
    getHRUsers(); // Fetch HR users on mount
  }, []);

  const getSales = async () => {
    try {
      const response = await fetchSales();
      setSales(response.data);
    } catch (error) {
      console.error('Error fetching sales data:', error);
    }
  };

  const getHRUsers = async () => {
    try {
      const response = await fetchHRUsers(); // Fetch HR users
      setHrUsers(response.data);
    } catch (error) {
      console.error('Error fetching HR users:', error);
    }
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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
        assignedHR: '', // Reset assigned HR on form submit
      });
      setOpen(false);
      getSales();
    } catch (error) {
      console.error('Error saving sale:', error);
    }
  };

  const handleDelete = async (id) => {
    try {
      await deleteSale(id);
      getSales();
    } catch (error) {
      console.error('Error deleting sale:', error);
    }
  };

  const handleEdit = (sale) => {
    setFormData(sale);
    setSelectedId(sale._id);
    setEditMode(true);
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditMode(false);
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
      assignedHR: '', // Reset assigned HR on modal close
    });
  };

  const handleExport = () => {
    const worksheet = XLSX.utils.json_to_sheet(sales);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'SalesData');
    XLSX.writeFile(workbook, 'SalesData.xlsx');
  };

  const columns = [
    { field: 'LeadBy', headerName: 'Lead By', width: 130 },
    { field: 'companyName', headerName: 'Company Name', width: 130 },
    { field: 'phoneNumber', headerName: 'Phone Number', width: 130 },
    { field: 'address', headerName: 'Address', width: 130 },
    { field: 'websiteUrl', headerName: 'Website', width: 130 },
    { field: 'emailId', headerName: 'Email', width: 130 },
    { field: 'callStatus', headerName: 'Call Status', width: 130 },
    { field: 'meetingDate', headerName: 'Meeting Date', width: 130 },
    { field: 'meetingTime', headerName: 'Meeting Time', width: 130 },
    { field: 'contactPerson', headerName: 'Contact Person', width: 130 },
    { field: 'designation', headerName: 'Designation', width: 130 },
    { field: 'description', headerName: 'Description', width: 150 },
    { field: 'createdAt', headerName: 'Created At', width: 130 },
    { field: 'assignedHR', headerName: 'Assigned Hr', width: 180 },

    {
      field: 'actions',
      headerName: 'Actions',
      width: 180,
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
        <Box sx={{ p: 3 }}>
          <Typography variant="h4" gutterBottom>
             Job Openning Report
          </Typography>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              marginBottom: 2,
            }}
          >
            <Button
              variant="contained"
              color="primary"
              onClick={() => setOpen(true)}
            >
              Add New Sale
            </Button>
            <Button
              variant="contained"
              color="secondary"
              onClick={handleExport}
            >
              Export to Excel
            </Button>
          </Box>
          <Box sx={{ height: 500, width: '100%' }}>
            <DataGrid
              rows={sales}
              columns={columns}
              getRowId={(row) => row._id}
              pageSize={5}
              components={{
                Toolbar: GridToolbar,
              }}
            />
          </Box>

          <Modal open={open} onClose={handleClose}>
            <Box
              component="form"
              onSubmit={handleSubmit}
              sx={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                width: 700,
                bgcolor: 'background.paper',
                boxShadow: 24,
                p: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                overflowY: 'auto',
                maxHeight: '80vh',
              }}
            >
              <Typography variant="h6">
                {editMode ? 'Edit Sale' : 'Add New Sale'}
              </Typography>
              <TextField
                name="companyName"
                label="Company Name"
                value={formData.companyName}
                onChange={handleChange}
                required
              />
              <TextField
                name="phoneNumber"
                label="Phone Number"
                value={formData.phoneNumber}
                onChange={handleChange}
                required
              />
              <TextField
                name="address"
                label="Address"
                value={formData.address}
                onChange={handleChange}
                required
              />
              <TextField
                name="websiteUrl"
                label="Website"
                value={formData.websiteUrl}
                onChange={handleChange}
                required
              />
              <TextField
                name="emailId"
                label="Email"
                value={formData.emailId}
                onChange={handleChange}
                required
              />
              <TextField
                name="callStatus"
                label="Call Status"
                value={formData.callStatus}
                onChange={handleChange}
                required
              />
              <TextField
                name="meetingDate"
                label="Meeting Date"
                value={formData.meetingDate}
                onChange={handleChange}
              />
              <TextField
                name="meetingTime"
                label="Meeting Time"
                value={formData.meetingTime}
                onChange={handleChange}
              />
              <TextField
                name="contactPerson"
                label="Contact Person"
                value={formData.contactPerson}
                onChange={handleChange}
                required
              />
              <TextField
                name="designation"
                label="Designation"
                value={formData.designation}
                onChange={handleChange}
                required
              />
              <TextField
                name="description"
                label="Description"
                value={formData.description}
                onChange={handleChange}
                required
                multiline
              />

              {/* HR Assignment Dropdown */}
              <FormControl fullWidth>
                <InputLabel id="hr-select-label">Assign HR</InputLabel>
                <Select
                  labelId="hr-select-label"
                  name="assignedHR"
                  value={formData.assignedHR}
                  onChange={handleChange}
                  displayEmpty
                >
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                  {hrUsers.map((hr) => (
                    <MenuItem key={hr._id} value={hr._id}>
                      {hr.firstName} {hr.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <Button type="submit" variant="contained" color="primary">
                {editMode ? 'Update Sale' : 'Add Sale'}
              </Button>
            </Box>
          </Modal>
        </Box>
      </Box>
    </div>
  );
};

export default JobReport;
