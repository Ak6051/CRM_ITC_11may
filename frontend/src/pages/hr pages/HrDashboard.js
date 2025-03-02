// import React, { useEffect, useState } from 'react';

// import Navbar from '../../components/hr components/HrNavbar';
// import Sidebar from '../../components/hr components/HrSidebar';
// import {
//   Container,
//   Typography,
//   Box,
//   Table,
//   TableBody,
//   TableCell,
//   TableContainer,
//   TableHead,
//   TableRow,
//   Paper,
// } from '@mui/material';
// import axios from 'axios';

// const HrDashboard = () => {
//   const [sales, setSales] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchAssignedSales = async () => {
//       try {
//         const token = localStorage.getItem('token'); // Token from localStorage

//         if (token) {
//           const response = await axios.get(
//             'http://localhost:5000/api/sales/assigned-sales',
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           );

//           if (Array.isArray(response.data.data)) {
//             setSales(response.data.data);
//           } else {
//             setSales(response.data); // Fallback in case array is directly in data
//           }
//         } else {
//           console.error('No token found');
//         }

//         setLoading(false);
//       } catch (error) {
//         console.error('Error fetching assigned sales:', error);
//         setLoading(false);
//       }
//     };

//     fetchAssignedSales();
//   }, []);

//   if (loading) {
//     return <div>Loading...</div>;
//   }

//   return (
//     <Box sx={{ display: 'flex' }}>
//       <Sidebar />
//       <Box sx={{ flexGrow: 1 }}>
//         <Navbar />
//         <Container sx={{ mt: 4 }}>
//           <Typography variant="h4" align="center" gutterBottom>
//             Your Assigned Sales
//           </Typography>
//           {sales.length === 0 ? (
//             <Typography align="center" color="textSecondary">
//               No sales assigned
//             </Typography>
//           ) : (
//             <TableContainer component={Paper} sx={{ mt: 3 }}>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Company Name
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Lead By
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Phone
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Email
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Address
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Website
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Call Status
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Meeting Date
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Meeting Time
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Contact Person
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: 'bold', fontSize: 'medium' }}>
//                       Designation
//                     </TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {sales.map((sale) => (
//                     <TableRow key={sale._id}>
//                       <TableCell>{sale.companyName}</TableCell>
//                       <TableCell>{sale.LeadBy}</TableCell>
//                       <TableCell>{sale.phoneNumber}</TableCell>
//                       <TableCell>{sale.emailId}</TableCell>
//                       <TableCell>{sale.address}</TableCell>
//                       <TableCell>{sale.websiteUrl}</TableCell>
//                       <TableCell>{sale.callStatus}</TableCell>
//                       <TableCell>
//                         {new Date(sale.meetingDate).toLocaleDateString()}
//                       </TableCell>
//                       <TableCell>{sale.meetingTime}</TableCell>
//                       <TableCell>{sale.contactPerson}</TableCell>
//                       <TableCell>{sale.designation}</TableCell>
//                     </TableRow>
//                   ))}
//                 </TableBody>
//               </Table>
//             </TableContainer>
//           )}
//         </Container>
//       </Box>
//     </Box>
//   );
// };

// export default HrDashboard;
import React, { useEffect, useState } from "react";

import Navbar from "../../components/hr components/HrNavbar";
import Sidebar from "../../components/hr components/HrSidebar";
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
} from "@mui/material";
import axios from "axios";

const HrDashboard = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const savedSales = localStorage.getItem("salesData");
    if (savedSales) {
      setSales(JSON.parse(savedSales));
    }

    const fetchAssignedSales = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get(
            "http://localhost:5000/api/sales/assigned-sales",
            {
              headers: {
                Authorization: `Bearer ${token}`,
              },
            }
          );

          setSales(response.data.data);
          localStorage.setItem("salesData", JSON.stringify(response.data.data));
        }
      } catch (error) {
        console.error("Error fetching assigned sales:", error);
      }
    };

    fetchAssignedSales();
  }, []);

  

  const handleJobStatusChange = async (saleId, status) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/sales/update-job-status/${saleId}`,
        { jobStatus: status, newStartDate: new Date() },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        const updatedSale = response.data.data;
        setSales((prevSales) =>
          prevSales.map((sale) =>
            sale._id === saleId ? { ...sale, ...updatedSale } : sale
          )
        );
      }
    } catch (error) {
      console.error("Error updating job status:", error);
    }
  };

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
        <Container sx={{ mt: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Your Assigned Company
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
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Company Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Lead By
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Phone
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Email
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Address
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Website
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Call Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Meeting Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Meeting Time
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Contact Person
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Designation
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                       Start Date
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                       End Date
                    </TableCell>
                    
                    <TableCell sx={{ fontWeight: "bold", fontSize: "medium" }}>
                      Status
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
                      <TableCell>
                        {new Date(sale.startDate).toLocaleString()}{" "}
                        {/* Start Date */}
                      </TableCell>
                      
                      {/* <TableCell>
                        {new Date(sale.latestStartDate).toLocaleString()}
                      </TableCell> */}
                      <TableCell>
                        {sale.jobStatus === "Closed" && sale.endDate
                          ? new Date(sale.endDate).toLocaleString()
                          : sale.jobStatus === "Closed"
                          ? "Close"
                          : "Not Closed Yet"}
                      </TableCell>
                     
                      <TableCell>
                        {sale.jobStatus === "Closed" ? (
                          <Button
                            variant="contained"
                            color="secondary"
                            onClick={() => handleJobStatusChange(sale._id, "Open")}
                          >
                            Reopen Job
                          </Button>
                        ) : (
                          <Button
                            variant="contained"
                            color="primary"
                            onClick={() => handleJobStatusChange(sale._id, "Closed")}
                          >
                            Mark Closed
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </Box>
    </div>
  );
};

export default HrDashboard;
