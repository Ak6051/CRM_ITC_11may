
import React, { useEffect, useState } from 'react';
import io from 'socket.io-client';
import axios from 'axios';
import Navbar from "../../components/hr components/HrNavbar";
import Sidebar from "../../components/hr components/HrSidebar";
import { Box } from '@mui/material';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import CheckIcon from '@mui/icons-material/Check';

import { API_BASE_URL, SOCKET_URL } from '../../config/api.config';

const socket = io(SOCKET_URL);

const HrDashboardTask = () => {
  const [reminders, setReminders] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const fetchTasksAndUser = async () => {
      const token = sessionStorage.getItem('token');
      if (!token) return;

      try {
        const resTasks = await axios.get(`${API_BASE_URL}/assignedTask/my-tasks`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setReminders(resTasks.data);

        const resUser = await axios.get(`${API_BASE_URL}/assignedTask/me`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUserId(resUser.data._id);

        if (resUser.data._id) {
          socket.emit('join', resUser.data._id);
        }
      } catch (err) {
        console.error("❌ Error fetching tasks/user:", err.message);
      }
    };

    fetchTasksAndUser();

    const handleReminder = (data) => {
      console.log("🔔 Reminder received:", data);

      toast.info(`🔔 New Task: ${data.taskName} due on ${new Date(data.endDate).toLocaleDateString()}`, {
        position: "bottom-right",
        autoClose: 6000,
        pauseOnHover: true,
        draggable: true,
      });

      setReminders((prev) => {
        const exists = prev.some((item) => item._id === data._id);
        return exists ? prev : [...prev, data];
      });
    };

    socket.on('reminder', handleReminder);

    return () => {
      socket.off('reminder', handleReminder);
      // do NOT disconnect socket here unless you want to close connection
    };
  }, []);
  

  const completeTask = async (taskId) => {
    const token = sessionStorage.getItem('token');
    await axios.post(
      `${API_BASE_URL}/assignedTask/complete/${taskId}`,
      {},
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setReminders((prev) => prev.filter((task) => task._id !== taskId));
    toast.success("Task marked as completed!", { position: "bottom-right" });
  };

  // Columns for DataGrid
  const columns = [
    {
      field: 'taskName',
      headerName: 'Task Name',
      flex: 1,
      minWidth: 200,
    },
    {
      field: 'endDate',
      headerName: 'End Date',
      width: 130,
      renderCell: (params) => {
        let dateValue = params.value;
    
        // If the date is an object with $date, extract the string
        if (dateValue && typeof dateValue === 'object' && '$date' in dateValue) {
          dateValue = dateValue.$date;
        }
    
        const date = new Date(dateValue);
        return isNaN(date.getTime()) ? 'Invalid Date' : date.toLocaleDateString();
      },
    },
    
    
    {
      field: 'actions',
      headerName: 'Actions',
      type: 'actions',
      width: 150,
      getActions: (params) => [
        <GridActionsCellItem
          icon={<CheckIcon />}             // 👈 This is required
          label="Complete"
          onClick={() => completeTask(params.id)}
          key="complete"
        />,
      ],
    },
  ];

  // Prepare rows - note use _id for id
  const rows = reminders.map((task) => ({
    id: task._id,
    taskName: task.taskName,
    endDate: task.endDate,
  }));

  return (
    <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
      {/* Sidebar */}
      <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
        <Sidebar />
      </div>

      {/* Main Content */}
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

        <Box sx={{ mt: 10 }}>
          <h2>Reminders</h2>

          <div style={{ height: 400, width: '100%' }}>
            <DataGrid
              rows={rows}
              columns={columns}
              pageSize={5}
              rowsPerPageOptions={[5, 10]}
              disableSelectionOnClick
              autoHeight
            />
          </div>
        </Box>

        <ToastContainer />
      </Box>
    </div>
  );
};

export default HrDashboardTask;
