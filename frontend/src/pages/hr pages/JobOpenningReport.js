import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';
import {
  Container,
  Typography,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Checkbox,
  FormControlLabel,
} from '@mui/material';
import { Visibility } from '@mui/icons-material';
import axios from 'axios';

const JobOpenningReport = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hrForms, setHrForms] = useState([]);
  const [selectedCVs, setSelectedCVs] = useState([]); // State for selected CVs (multiple selections)
  const navigate = useNavigate();

  // Fetch Assigned Sales
  useEffect(() => {
    const savedSales = localStorage.getItem('salesData');
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }
  
    const fetchAssignedSales = async () => {
      try {
        const token = localStorage.getItem('token');
        if (token) {
          const response = await axios.get(
            'http://localhost:5000/api/sales/assigned-sales',
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );
  
          setSales(response.data.data);
          localStorage.setItem('salesData', JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error('Error fetching assigned sales:', error);
      }
      
    };
  
    fetchAssignedSales();
  }, []);

  // Fetch HR Forms
  useEffect(() => {
    const fetchHRForms = async () => {
      try {
        const response = await axios.get(
          'http://localhost:5000/api/hrform/fetch'
        );
        setHrForms(response.data);
      } catch (error) {
        console.error('Failed to fetch HR forms:', error);
      }
    };

    fetchHRForms();
  }, []);

  const handleCheckboxChange = (form, file) => {
    const isSelected = selectedCVs.find(
      (cv) => cv.formId === form._id && cv.filePath === file.path
    );

    if (isSelected) {
      setSelectedCVs(
        selectedCVs.filter(
          (cv) => !(cv.formId === form._id && cv.filePath === file.path)
        )
      );
    } else {
      setSelectedCVs([
        ...selectedCVs,
        {
          formId: form._id,
          companyName: form.companyName,
          websiteUrl: form.websiteUrl,
          createdAt: form.createdAt,
          filePath: file.path,
        },
      ]);
    }
  };

  const handleForward = async () => {
    try {
      const token = localStorage.getItem('token');
      if (token) {
        await axios.post(
          'http://localhost:5000/api/form/forward',
          { selectedCVs },
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        alert('CVs forwarded successfully!');
        setSelectedCVs([]); // Clear the selected CVs
      } else {
        console.error('No token found');
      }
    } catch (error) {
      console.error('Error forwarding CVs:', error);
    }
  };


  return (
    <Box sx={{ display: 'flex' }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <Container>
          <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
            Job Openning Report
          </Typography>

          {/* Sales Section */}
          <Typography variant="h4" align="center" gutterBottom>
            Sales Data
          </Typography>
          {sales.length === 0 ? (
            <Typography align="center" color="textSecondary">
              No sales assigned
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Company Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Lead By
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Phone
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Address
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Website
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Call Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Meeting Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Meeting Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Contact Person
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Designation
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Description
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow key={sale._id}>
                      <TableCell>{sale.companyName}</TableCell>
                      <TableCell>{sale.LeadBy}</TableCell>
                      <TableCell>{sale.phoneNumber}</TableCell>
                      <TableCell>{sale.emailId}</TableCell>
                      <TableCell>{sale.address}</TableCell>
                      <TableCell>{sale.websiteUrl}</TableCell>
                      <TableCell>{sale.callStatus}</TableCell>
                      <TableCell>
                        {new Date(sale.meetingDate).toLocaleDateString()}
                      </TableCell>
                      <TableCell>{sale.meetingTime}</TableCell>
                      <TableCell>{sale.contactPerson}</TableCell>
                      <TableCell>{sale.designation}</TableCell>
                      <TableCell>{sale.description}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}

          {/* HR Forms Section */}
          <Typography variant="h4" gutterBottom sx={{ mt: 4 }}>
            HR Form Submissions
          </Typography>
          {hrForms.length === 0 ? (
            <Typography align="center" color="textSecondary">
              No HR form data available.
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Company Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      Website URL
                    </TableCell>
                    <TableCell
                      sx={{ fontWeight: 'bold', fontSize: 'medium' }}
                      align="center"
                    >
                      Employee Count
                    </TableCell>
                    <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
                      CV Files
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {hrForms.map((form) => (
                    <TableRow key={form._id}>
                      <TableCell>{form.companyName}</TableCell>
                      <TableCell>{form.websiteUrl}</TableCell>
                      <TableCell align="center">{form.employeeCount}</TableCell>
                      <TableCell>
                        {form.cvFiles.map((file, index) => (
                          <div
                            key={index}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              marginBottom: 4,
                            }}
                          >
                            <Checkbox
                              checked={!!selectedCVs.find(
                                (cv) =>
                                  cv.formId === form._id &&
                                  cv.filePath === file.path
                              )}
                              onChange={() => handleCheckboxChange(form, file)}
                            />
                            <Button
                              variant="outlined"
                              size="small"
                              color="primary"
                              startIcon={<Visibility />}
                              href={`http://localhost:5000/${file.path}`}
                              target="_blank"
                              style={{ marginRight: 8 }}
                            >
                              View
                            </Button>
                          </div>
                        ))}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
          <Button
            variant="contained"
            color="primary"
            onClick={handleForward}
            disabled={selectedCVs.length === 0}
            sx={{ mt: 3 }}
          >
            Forward
          </Button>
        </Container>
      </Box>
    </Box>
  );
};

export default JobOpenningReport;
