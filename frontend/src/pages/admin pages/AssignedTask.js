import React, { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  Typography,
  TextField,
  Button,
  Card,
  CardContent,
  Grid,
  Divider,
  List,
  ListItem,
  ListItemText,
  Paper,
  useTheme
} from '@mui/material';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { io } from 'socket.io-client';
import { API_BASE_URL, SOCKET_URL } from '../../config/api.config';

function AssignedTask() {
  const theme = useTheme();
  const [taskName, setTaskName] = useState('');
  const [endDate, setEndDate] = useState('');
  const [tasks, setTasks] = useState([]);
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const token = sessionStorage.getItem("token");

  // 🔌 Initialize socket connection once
  useEffect(() => {
    if (!token) return;

    const socketInstance = io(SOCKET_URL, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      withCredentials: true,
      query: { token },
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    const onConnect = () => {
      setIsConnected(true);
      console.log('🔌 Connected to socket server');
      socketInstance.emit('register-user', token);
    };

    const onDisconnect = () => {
      setIsConnected(false);
      console.log('🔴 Disconnected from socket server');
    };

    socketInstance.on('connect', onConnect);
    socketInstance.on('disconnect', onDisconnect);

    setSocket(socketInstance);

    return () => {
      socketInstance.off('connect', onConnect);
      socketInstance.off('disconnect', onDisconnect);
      socketInstance.disconnect();
    };
  }, [token]);

  // 🔔 Task Reminder listener
  useEffect(() => {
    if (!socket || !token) return;

    const shownReminders = new Set();

    socket.emit('register-user', token);

    const handleReminder = (data) => {
      const uniqueKey = `${data.taskId}-${new Date(data.endDate).toISOString().split('T')[0]}`;
      if (!shownReminders.has(uniqueKey)) {
        shownReminders.add(uniqueKey);

        toast.info(`🔔 Reminder: ${data.taskName} due on ${new Date(data.endDate).toLocaleDateString()}`, {
          position: "bottom-right",
          autoClose: 5000,
          pauseOnHover: true,
          draggable: true,
        });

        setTimeout(() => {
          shownReminders.delete(uniqueKey);
        }, 60 * 60 * 1000); // 1 hour
      }
    };

    socket.on('task-reminder', handleReminder);

    fetchTasks();

    return () => {
      socket.off('task-reminder', handleReminder);
    };
  }, [socket, token]);

  const fetchTasks = async () => {
    try {
      const res = await axios.get(`${API_BASE_URL}/tasks`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTasks(res.data);
    } catch (error) {
      toast.error("Failed to fetch tasks");
    }
  };

  const handleAddTask = async () => {
    if (!taskName || !endDate) return;
    try {
      await axios.post(`${API_BASE_URL}/tasks`, {
        taskName,
        endDate,
      }, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setTaskName('');
      setEndDate('');
      fetchTasks();
    } catch (error) {
      toast.error("Failed to add task");
    }
  };

  const handleComplete = async (taskId) => {
    try {
      await axios.put(`${API_BASE_URL}/tasks/complete/${taskId}`, {}, {
        headers: { Authorization: `Bearer ${token}` }
      });
      fetchTasks();
    } catch (error) {
      toast.error("Failed to mark task complete");
    }
  };

  return (
    <>
      <div style={{ display: 'flex', height: '100vh', marginLeft: '-10px', backgroundColor: '#f5f5f5' }}>
        {/* Sidebar */}
        <div style={{ position: 'fixed', marginLeft: '-9px', height: '100vh', width: '250px', backgroundColor: '#3f51b5', color: 'white' }}>
          <Sidebar />
        </div>

        {/* Main content */}
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
          <Box sx={{ padding: 4 }}>
            <Typography variant="h4" fontWeight="bold" mb={3} color="primary">
              Task Manager & Daily Reminders
            </Typography>

            {/* Add Task */}
            <Card sx={{ mb: 4, background: '#ffffffdd', backdropFilter: 'blur(10px)', borderRadius: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Add New Task
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Task Name"
                      value={taskName}
                      onChange={(e) => setTaskName(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="End Date"
                      type="date"
                      InputLabelProps={{ shrink: true }}
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                    />
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Button fullWidth variant="contained" sx={{ height: '100%' }} onClick={handleAddTask}>
                      Add Task
                    </Button>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>

            {/* Task List */}
            <Paper elevation={3} sx={{ p: 3, borderRadius: 3 }}>
              <Typography variant="h6" mb={2}>Your Tasks</Typography>
              <Divider />
              <List>
                {tasks.map((task) => (
                  <ListItem key={task._id} sx={{ display: 'flex', justifyContent: 'space-between' }}>
                    <ListItemText
                      primary={task.taskName}
                      secondary={`Due: ${new Date(task.endDate).toLocaleDateString()}`}
                    />
                    {!task.isCompleted ? (
                      <Button variant="outlined" onClick={() => handleComplete(task._id)} color="success">
                        Mark Complete
                      </Button>
                    ) : (
                      <Typography variant="body2" color="gray">✅ Completed</Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Box>
        </Box>
      </div>

      <ToastContainer
        position="bottom-right"
        autoClose={5000}
        pauseOnHover
        draggable
      />
    </>
  );
}

export default AssignedTask;
