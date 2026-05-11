import React, { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Button,
  IconButton,
  Avatar,
  Divider,
  Alert,
  CircularProgress,
  Chip,
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SecurityIcon from '@mui/icons-material/Security';
import RouterIcon from '@mui/icons-material/Router';
import Navbar from '../../components/admin components/AdminNavbar';
import Sidebar from '../../components/admin components/AdminSidebar';
import axios from 'axios';
import { API_BASE_URL } from '../../config/api.config';
import dayjs from 'dayjs';

const IpWhitelistPanel = () => {
  const [entries, setEntries] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newIp, setNewIp] = useState('');
  const [addLoading, setAddLoading] = useState(false);
  const [addError, setAddError] = useState('');
  const [addSuccess, setAddSuccess] = useState('');
  const [removeErrors, setRemoveErrors] = useState({}); // keyed by entry _id

  useEffect(() => {
    fetchWhitelist();
  }, []);

  const fetchWhitelist = async () => {
    setLoading(true);
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/security/whitelist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries(response.data.entries || response.data);
    } catch (error) {
      console.error('Error fetching whitelist:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    if (!newIp.trim()) {
      setAddError('Please enter an IP address or CIDR range.');
      return;
    }
    setAddLoading(true);
    setAddError('');
    setAddSuccess('');
    try {
      const token = sessionStorage.getItem('token');
      const response = await axios.post(
        `${API_BASE_URL}/security/whitelist`,
        { ip: newIp.trim() },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEntries((prev) => [...prev, response.data.entry || response.data]);
      setNewIp('');
      setAddSuccess('IP address added successfully.');
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Failed to add IP address. Please try again.';
      setAddError(msg);
    } finally {
      setAddLoading(false);
    }
  };

  const handleRemove = async (id) => {
    setRemoveErrors((prev) => ({ ...prev, [id]: '' }));
    try {
      const token = sessionStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/security/whitelist/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setEntries((prev) => prev.filter((entry) => entry._id !== id));
    } catch (error) {
      const msg =
        error.response?.data?.message ||
        'Failed to remove entry. Please try again.';
      setRemoveErrors((prev) => ({ ...prev, [id]: msg }));
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleAdd();
    }
  };

  return (
    <div style={{ display: 'flex', minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      <div
        style={{
          position: 'fixed',
          height: '100vh',
          width: '250px',
          backgroundColor: '#3f51b5',
          color: 'white',
          zIndex: 1000,
        }}
      >
        <Sidebar />
      </div>

      <Box
        sx={{
          flexGrow: 1,
          display: 'flex',
          flexDirection: 'column',
          ml: '250px',
          minHeight: '100vh',
        }}
      >
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: '250px',
            right: 0,
            zIndex: 999,
            bgcolor: '#fff',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          }}
        >
          <Navbar />
        </Box>

        <Box sx={{ p: 4, mt: '64px' }}>
          {/* Header */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '24px',
              p: 4,
              mb: 4,
              background: 'linear-gradient(135deg, #1a237e 0%, #3949ab 100%)',
              position: 'relative',
              overflow: 'hidden',
              '&::before': {
                content: '""',
                position: 'absolute',
                top: '-50%',
                right: '-10%',
                width: '400px',
                height: '400px',
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
              },
            }}
          >
            <Box sx={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 56,
                  height: 56,
                  background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(10px)',
                }}
              >
                <SecurityIcon sx={{ fontSize: 30, color: '#fff' }} />
              </Avatar>
              <Box>
                <Typography variant="h4" sx={{ fontWeight: 900, color: '#fff', mb: 0.5, letterSpacing: '-0.5px' }}>
                  IP Whitelist Management
                </Typography>
                <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  Manage allowed IP addresses and CIDR ranges for HR login access
                </Typography>
              </Box>
            </Box>
          </Paper>

          {/* Add New Entry */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '20px',
              p: 3,
              mb: 4,
              border: '2px solid #e0e7ff',
              background: '#fff',
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
                }}
              >
                <AddIcon sx={{ color: '#fff' }} />
              </Avatar>
              <Box>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  Add IP Address / CIDR Range
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  Enter a valid IPv4, IPv6, or CIDR range (e.g. 192.168.1.0/24)
                </Typography>
              </Box>
            </Box>

            <Divider sx={{ mb: 2.5 }} />

            <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-start', flexWrap: 'wrap' }}>
              <TextField
                label="IP Address or CIDR Range"
                placeholder="e.g. 203.0.113.42 or 10.0.0.0/8"
                value={newIp}
                onChange={(e) => {
                  setNewIp(e.target.value);
                  setAddError('');
                  setAddSuccess('');
                }}
                onKeyDown={handleKeyDown}
                size="small"
                sx={{ flex: 1, minWidth: 260 }}
                error={Boolean(addError)}
              />
              <Button
                variant="contained"
                startIcon={addLoading ? <CircularProgress size={16} color="inherit" /> : <AddIcon />}
                onClick={handleAdd}
                disabled={addLoading}
                sx={{
                  textTransform: 'none',
                  fontWeight: 700,
                  borderRadius: '10px',
                  px: 3,
                  background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
                  '&:hover': {
                    background: 'linear-gradient(135deg, #1a237e 0%, #0d1b6e 100%)',
                  },
                }}
              >
                {addLoading ? 'Adding…' : 'Add'}
              </Button>
            </Box>

            {addError && (
              <Alert severity="error" sx={{ mt: 2, borderRadius: '10px' }}>
                {addError}
              </Alert>
            )}
            {addSuccess && (
              <Alert severity="success" sx={{ mt: 2, borderRadius: '10px' }}>
                {addSuccess}
              </Alert>
            )}
          </Paper>

          {/* Whitelist Table */}
          <Paper
            elevation={0}
            sx={{
              borderRadius: '20px',
              border: '2px solid #e0e7ff',
              background: '#fff',
              overflow: 'hidden',
            }}
          >
            <Box sx={{ p: 3, display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar
                sx={{
                  width: 44,
                  height: 44,
                  background: 'linear-gradient(135deg, #3949ab 0%, #1a237e 100%)',
                }}
              >
                <RouterIcon sx={{ color: '#fff' }} />
              </Avatar>
              <Box sx={{ flex: 1 }}>
                <Typography variant="h6" sx={{ fontWeight: 800, color: '#1e293b' }}>
                  Current Whitelist Entries
                </Typography>
                <Typography variant="caption" sx={{ color: '#64748b' }}>
                  {entries.length} {entries.length === 1 ? 'entry' : 'entries'} configured
                </Typography>
              </Box>
              <Chip
                label={`${entries.length} / 50+`}
                size="small"
                sx={{
                  bgcolor: '#e0e7ff',
                  color: '#3949ab',
                  fontWeight: 700,
                }}
              />
            </Box>

            <Divider />

            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 6 }}>
                <CircularProgress sx={{ color: '#3949ab' }} />
              </Box>
            ) : entries.length === 0 ? (
              <Box sx={{ textAlign: 'center', py: 8 }}>
                <SecurityIcon sx={{ fontSize: 56, color: '#cbd5e1', mb: 2 }} />
                <Typography variant="h6" sx={{ color: '#94a3b8', fontWeight: 600 }}>
                  No entries in whitelist
                </Typography>
                <Typography variant="body2" sx={{ color: '#cbd5e1', mt: 0.5 }}>
                  When the whitelist is empty, HR login is unrestricted. Add an IP to enforce access control.
                </Typography>
              </Box>
            ) : (
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>IP / CIDR</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Added By</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }}>Date Added</TableCell>
                      <TableCell sx={{ fontWeight: 700, color: '#1e293b' }} align="center">
                        Remove
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {entries.map((entry) => (
                      <React.Fragment key={entry._id}>
                        <TableRow
                          sx={{
                            '&:hover': { bgcolor: '#f8fafc' },
                            transition: 'background 0.2s',
                          }}
                        >
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                              <RouterIcon sx={{ fontSize: 18, color: '#3949ab' }} />
                              <Typography
                                variant="body2"
                                sx={{ fontWeight: 600, color: '#1e293b', fontFamily: 'monospace' }}
                              >
                                {entry.ip}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                              {entry.addedBy?.firstName && entry.addedBy?.lastName
                                ? `${entry.addedBy.firstName} ${entry.addedBy.lastName}`
                                : entry.addedBy?.email || entry.addedBy || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" sx={{ color: '#475569' }}>
                              {entry.createdAt
                                ? dayjs(entry.createdAt).format('YYYY-MM-DD HH:mm:ss')
                                : '—'}
                            </Typography>
                          </TableCell>
                          <TableCell align="center">
                            <IconButton
                              size="small"
                              onClick={() => handleRemove(entry._id)}
                              sx={{
                                color: '#ef4444',
                                bgcolor: '#fee2e2',
                                borderRadius: '8px',
                                '&:hover': {
                                  bgcolor: '#fecaca',
                                },
                              }}
                              title={`Remove ${entry.ip}`}
                            >
                              <DeleteIcon fontSize="small" />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                        {removeErrors[entry._id] && (
                          <TableRow>
                            <TableCell colSpan={4} sx={{ py: 0, border: 0 }}>
                              <Alert severity="error" sx={{ borderRadius: '8px', mb: 1 }}>
                                {removeErrors[entry._id]}
                              </Alert>
                            </TableCell>
                          </TableRow>
                        )}
                      </React.Fragment>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Paper>
        </Box>
      </Box>
    </div>
  );
};

export default IpWhitelistPanel;
