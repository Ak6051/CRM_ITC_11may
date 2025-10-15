// import React, { useState, useEffect } from 'react';
// import axios from 'axios';
// import Sidebar from '../../components/admin components/AdminSidebar';
// import Navbar from '../../components/admin components/AdminNavbar';
// import {
//   Box,
//   Card,
//   CardContent,
//   Typography,
//   TextField,
//   Button,
//   MenuItem,
//   Select,
//   InputLabel,
//   FormControl,
// } from '@mui/material';

// const HrAssignedTask = () => {
//   const [hrList, setHrList] = useState([]);
//   const [taskName, setTaskName] = useState('');
//   const [endDate, setEndDate] = useState('');
//   const [assignedTo, setAssignedTo] = useState('');

//   useEffect(() => {
//     const fetchHRs = async () => {
//       const token = sessionStorage.getItem('token');
//       const res = await axios.get(`${API_BASE_URL}/panel/hr-users`, 
//         headers: { Authorization: `Bearer ${token}` },
//       });
//       setHrList(res.data);
//     };
//     fetchHRs();
//   }, []);

//   const assignTask = async () => {
//     const token = sessionStorage.getItem('token');
//     await axios.post(
//       `${API_BASE_URL}/assignedTask/assign`,
//       { assignedTo, taskName, endDate },
//       { headers: { Authorization: `Bearer ${token}` } }
//     );
//     alert('Task assigned successfully');
//     setTaskName('');
//     setEndDate('');
//     setAssignedTo('');
//   };

//   return (
//     <Box sx={{ display: 'flex', backgroundColor: '#f5f5f5', height: '100vh' }}>
//       {/* Sidebar */}
//       <Box
//         sx={{
//           width: '250px',
//           position: 'fixed',
//           height: '100vh',
//           bgcolor: '#3f51b5',
//           color: 'white',
//         }}
//       >
//         <Sidebar />
//       </Box>

//       {/* Main Content */}
//       <Box
//         sx={{
//           marginLeft: '250px',
//           width: '100%',
//           display: 'flex',
//           flexDirection: 'column',
//         }}
//       >
//         <Navbar />

//         <Box
//           sx={{
//             marginTop: 10,
//             display: 'flex',
//             justifyContent: 'center',
//             alignItems: 'center',
//             height: '80vh',
//           }}
//         >
//           <Card sx={{ width: 500, p: 3, boxShadow: 4 }}>
//             <CardContent>
//               <Typography variant="h5" gutterBottom fontWeight="bold">
//                 Assign Task to HR
//               </Typography>

//               <FormControl fullWidth margin="normal">
//                 <InputLabel>Select HR</InputLabel>
//                 <Select
//                   value={assignedTo}
//                   label="Select HR"
//                   onChange={(e) => setAssignedTo(e.target.value)}
//                 >
//                   {hrList.map((hr) => (
//                     <MenuItem key={hr._id} value={hr._id}>
//                       {hr.firstName} {hr.lastName}
//                     </MenuItem>
//                   ))}
//                 </Select>
//               </FormControl>

//               <TextField
//                 fullWidth
//                 margin="normal"
//                 label="Task Name"
//                 value={taskName}
//                 onChange={(e) => setTaskName(e.target.value)}
//               />

//               <TextField
//                 fullWidth
//                 margin="normal"
//                 type="date"
//                 label="End Date"
//                 InputLabelProps={{ shrink: true }}
//                 value={endDate}
//                 onChange={(e) => setEndDate(e.target.value)}
//               />

//               <Button
//                 variant="contained"
//                 color="primary"
//                 fullWidth
//                 onClick={assignTask}
//                 sx={{ mt: 2, py: 1.2 }}
//               >
//                 Assign Task
//               </Button>
//             </CardContent>
//           </Card>
//         </Box>
//       </Box>
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import Sidebar from '../../components/admin components/AdminSidebar';
import Navbar from '../../components/admin components/AdminNavbar';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  MenuItem,
  Select,
  InputLabel,
  FormControl,
} from '@mui/material';
import { DataGrid } from '@mui/x-data-grid';

const HrAssignedTask = () => {
  const [hrList, setHrList] = useState([]);
  const [assignedTasks, setAssignedTasks] = useState([]);
  const [taskName, setTaskName] = useState('');
  const [endDate, setEndDate] = useState('');
  const [assignedTo, setAssignedTo] = useState('');

  useEffect(() => {
    const token = sessionStorage.getItem('token');

    const fetchHRs = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/panel/hr-users`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setHrList(res.data);
      } catch (err) {
        console.error('Error fetching HRs:', err);
      }
    };

    const fetchTasks = async () => {
      try {
        const res = await axios.get(`${API_BASE_URL}/assignedTask`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setAssignedTasks(res.data);
      } catch (err) {
        console.error('Error fetching tasks:', err);
      }
    };

    fetchHRs();
    fetchTasks();
  }, []);

  const assignTask = async () => {
    const token = sessionStorage.getItem('token');
    try {
      await axios.post(
        `${API_BASE_URL}/assignedTask/assign`,
        { assignedTo, taskName, endDate },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      alert('Task assigned successfully');

      // Clear form
      setTaskName('');
      setEndDate('');
      setAssignedTo('');

      // Refresh tasks
      const res = await axios.get(`${API_BASE_URL}/assignedTask`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAssignedTasks(res.data);
    } catch (err) {
      console.error('Error assigning task:', err);
    }
  };

  return (
    <Box sx={{ display: 'flex', backgroundColor: '#f5f5f5', minHeight: '100vh' }}>
      {/* Sidebar */}
      <Box
        sx={{
          width: '250px',
          position: 'fixed',
          height: '100vh',
          bgcolor: '#3f51b5',
          color: 'white',
        }}
      >
        <Sidebar />
      </Box>

      {/* Main Content */}
      <Box
        sx={{
          marginLeft: '250px',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <Navbar />

        {/* Form Section */}
        <Box
          sx={{
            marginTop: 10,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: 'auto',
          }}
        >
          <Card sx={{ width: 500, p: 3, boxShadow: 4 }}>
            <CardContent>
              <Typography variant="h5" gutterBottom fontWeight="bold">
                Assign Task to HR
              </Typography>

              <FormControl fullWidth margin="normal">
                <InputLabel>Select HR</InputLabel>
                <Select
                  value={assignedTo}
                  label="Select HR"
                  onChange={(e) => setAssignedTo(e.target.value)}
                >
                  {hrList.map((hr) => (
                    <MenuItem key={hr._id} value={hr._id}>
                      {hr.firstName} {hr.lastName}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                fullWidth
                margin="normal"
                label="Task Name"
                value={taskName}
                onChange={(e) => setTaskName(e.target.value)}
              />

              <TextField
                fullWidth
                margin="normal"
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />

              <Button
                variant="contained"
                color="primary"
                fullWidth
                onClick={assignTask}
                sx={{ mt: 2, py: 1.2 }}
              >
                Assign Task
              </Button>
            </CardContent>
          </Card>
        </Box>

        {/* DataGrid Section */}
        <Box sx={{ width: '95%', margin: 'auto', mt: 5, mb: 5 }}>
          <Typography variant="h6" gutterBottom fontWeight="bold">
            Assigned Tasks
          </Typography>
          <DataGrid
            rows={assignedTasks.map((task) => ({
              id: task._id,
              assignedTo: `${task.assignedTo?.firstName || ''} ${task.assignedTo?.lastName || ''}`,
              role: task.assignedTo?.role || 'N/A',
              taskName: task.taskName,
              endDate: new Date(task.endDate).toLocaleDateString(),
              isCompleted: task.isCompleted ? 'Yes' : 'No',
            }))}
            columns={[
              { field: 'assignedTo', headerName: 'Assigned To', flex: 1 },
              { field: 'role', headerName: 'Role', flex: 1 },
              { field: 'taskName', headerName: 'Task Name', flex: 1 },
              { field: 'endDate', headerName: 'End Date', flex: 1 },
              { field: 'isCompleted', headerName: 'Completed', flex: 1 },
            ]}
            autoHeight
            pageSize={5}
            rowsPerPageOptions={[5, 10]}
            sx={{
              backgroundColor: 'white',
              borderRadius: 2,
              boxShadow: 2,
            }}
          />
        </Box>
      </Box>
    </Box>
  );
};

export default HrAssignedTask;
