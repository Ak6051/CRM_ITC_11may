

// import React, { useEffect, useState } from "react";
// import Navbar from "../../components/hr components/HrNavbar";
// import Sidebar from "../../components/hr components/HrSidebar";
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
//   Button,
//   MenuItem,
//   Select,
//   FormControl,
//   InputLabel,
//   CircularProgress,
// } from "@mui/material";
// import axios from "axios";

// const PaymentSection = () => {
//   const [sales, setSales] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [selectedSaleId, setSelectedSaleId] = useState(null);
//   const [error, setError] = useState("");

//   useEffect(() => {
//     const fetchAssignedSales = async () => {
//       try {
//         const token = localStorage.getItem("token");
//         if (token) {
//           const response = await axios.get(
//             "http://localhost:5000/api/sales/assigned-sales",
//             {
//               headers: {
//                 Authorization: `Bearer ${token}`,
//               },
//             }
//           );
//           setSales(response.data.data);
//         }
//       } catch (error) {
//         setError("Error fetching assigned sales. Please try again later.");
//         console.error("Error fetching assigned sales:", error);
//       } finally {
//         setLoading(false);
//       }
//     };
//     fetchAssignedSales();
//   }, []);

//   const handlePaymentStatusChange = (event, saleId) => {
//     const newPaymentStatus = event.target.value;
//     setSales((prevSales) =>
//       prevSales.map((sale) =>
//         sale._id === saleId ? { ...sale, paymentStatus: newPaymentStatus } : sale
//       )
//     );
//   };

//   const handlePaymentStatusUpdate = async (saleId, paymentStatus) => {
//     try {
//       const token = localStorage.getItem("token");
//       const response = await axios.put(
//         `http://localhost:5000/api/sales/update-payment-status/${saleId}`,
//         { paymentStatus },
//         {
//           headers: {
//             Authorization: `Bearer ${token}`,
//           },
//         }
//       );

//       if (response.data.success) {
//         alert(`Payment status updated to: ${paymentStatus}`);
//       } else {
//         alert("Failed to update payment status.");
//       }
//     } catch (error) {
//       console.error("Error updating payment status:", error);
//       alert("An error occurred while updating payment status.");
//     }
//   };

//   return (
//     <Box sx={{ display: "flex" }}>
//       <Sidebar />
//       <Box sx={{ flexGrow: 1 }}>
//         <Navbar />
//         <Container sx={{ mt: 4 }}>
//           <Typography variant="h4" align="center" gutterBottom>
//             Payment Status
//           </Typography>
//           {loading ? (
//             <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
//               <CircularProgress />
//             </Box>
//           ) : error ? (
//             <Typography align="center" color="error" sx={{ mt: 3 }}>
//               {error}
//             </Typography>
//           ) : sales.length === 0 ? (
//             <Typography align="center" color="textSecondary" sx={{ mt: 3 }}>
//               No sales assigned
//             </Typography>
//           ) : (
//             <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 3 }}>
//               <Table>
//                 <TableHead>
//                   <TableRow>
//                     <TableCell sx={{ fontWeight: "bold", fontSize: "16px" }}>
//                       Company Name
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: "bold", fontSize: "16px" }}>
//                       Payment Status
//                     </TableCell>
//                     <TableCell sx={{ fontWeight: "bold", fontSize: "16px" }}>
//                       Action
//                     </TableCell>
//                   </TableRow>
//                 </TableHead>
//                 <TableBody>
//                   {sales.map((sale) => (
//                     <TableRow
//                       key={sale._id}
//                       sx={{
//                         "&:hover": {
//                           backgroundColor: "#f4f4f4",
//                         },
//                       }}
//                     >
//                       <TableCell>{sale.companyName}</TableCell>
//                       <TableCell>
//                         <Typography
//                           variant="body1"
//                           sx={{
//                             color:
//                               sale.paymentStatus === "Payment Pending"
//                                 ? "orange"
//                                 : "green",
//                             fontWeight: "bold",
//                           }}
//                         >
//                           {sale.paymentStatus}
//                         </Typography>
//                       </TableCell>
//                       <TableCell>
//                         <FormControl fullWidth sx={{ minWidth: 150 }}>
//                           <InputLabel>Payment Status</InputLabel>
//                           <Select
//                             value={sale.paymentStatus}
//                             onChange={(event) =>
//                               handlePaymentStatusChange(event, sale._id)
//                             }
//                           >
//                             <MenuItem value="Payment Pending">Payment Pending</MenuItem>
//                             <MenuItem value="Payment Received">Payment Received</MenuItem>
//                           </Select>
//                         </FormControl>
//                         <Button
//                           variant="contained"
//                           color="primary"
//                           sx={{
//                             mt: 2,
//                             "&:hover": {
//                               backgroundColor: "#3b8eae",
//                             },
//                           }}
//                           onClick={() =>
//                             handlePaymentStatusUpdate(
//                               sale._id,
//                               sale.paymentStatus
//                             )
//                           }
//                         >
//                           Submit
//                         </Button>
//                       </TableCell>
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

// export default PaymentSection;




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
  MenuItem,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
} from "@mui/material";
import axios from "axios";

const PaymentSection = () => {
  const [sales, setSales] = useState([]);
  const [loading, setLoading] = useState(true);
  const [paymentStatus, setPaymentStatus] = useState({});
  const [error, setError] = useState("");

  useEffect(() => {
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
          const salesData = response.data.data;
          const initialPaymentStatus = salesData.reduce((acc, sale) => {
            acc[sale._id] = sale.paymentStatus;
            return acc;
          }, {});
          setSales(salesData);
          setPaymentStatus(initialPaymentStatus);
        }
      } catch (error) {
        setError("Error fetching assigned sales. Please try again later.");
        console.error("Error fetching assigned sales:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchAssignedSales();
  }, []);

  const handlePaymentStatusChange = (saleId) => (event) => {
    setPaymentStatus({
      ...paymentStatus,
      [saleId]: event.target.value,
    });
  };

  const handlePaymentStatusUpdate = async (saleId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await axios.put(
        `http://localhost:5000/api/sales/update-payment-status/${saleId}`,
        { paymentStatus: paymentStatus[saleId] },
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
        alert(  `Payment status updated to: ${paymentStatus[saleId]}`);
      } else {
        alert("Failed to update payment status.");
      }
    } catch (error) {
      console.error("Error updating payment status:", error);
      alert("An error occurred while updating payment status.");
    }
  };

  return (
    <Box sx={{ display: "flex" }}>
      <Sidebar />
      <Box sx={{ flexGrow: 1 }}>
        <Navbar />
        <Container sx={{ mt: 4 }}>
          <Typography variant="h4" align="center" gutterBottom>
            Payment Status
          </Typography>
          {loading ? (
            <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
              <CircularProgress />
            </Box>
          ) : error ? (
            <Typography align="center" color="error" sx={{ mt: 3 }}>
              {error}
            </Typography>
          ) : sales.length === 0 ? (
            <Typography align="center" color="textSecondary" sx={{ mt: 3 }}>
              No sales assigned
            </Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 3, boxShadow: 3 }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "16px" }}>
                      Company Name
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "16px" }}>
                      Payment Status
                    </TableCell>
                    <TableCell sx={{ fontWeight: "bold", fontSize: "16px" }}>
                      Action
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {sales.map((sale) => (
                    <TableRow
                      key={sale._id}
                      sx={{
                        "&:hover": {
                          backgroundColor: "#f4f4f4",
                        },
                      }}
                    >
                      <TableCell>{sale.companyName}</TableCell>
                      
                      
                      
                      <TableCell>
                        <FormControl fullWidth sx={{ minWidth: 150 }}>
                          <InputLabel>Payment Status</InputLabel>
                          <Select
                            value={paymentStatus[sale._id]}
                            onChange={handlePaymentStatusChange(sale._id)}
                          >
                            <MenuItem value="Payment Pending">
                              Payment Pending
                            </MenuItem>
                            <MenuItem value="Payment Received">
                              Payment Received
                            </MenuItem>
                          </Select>
                        </FormControl>
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="contained"
                          color="primary"
                          sx={{
                            mt: 2,
                            "&:hover": {
                              backgroundColor: "#3b8eae",
                            },
                          }}
                          onClick={() => handlePaymentStatusUpdate(sale._id)}
                        >
                          Submit
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </Container>
      </Box>
    </Box>
  );
};

export default PaymentSection;