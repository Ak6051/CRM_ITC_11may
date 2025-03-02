// // import React, { useEffect, useState } from 'react';
// // import { DataGrid } from '@mui/x-data-grid';
// // import { Box, Button } from '@mui/material';
// // import axios from 'axios';
// // import Navbar from '../../components/hr components/HrNavbar';
// // import Sidebar from '../../components/hr components/HrSidebar';

// // const LineUpPage = () => {
// //   const [data, setData] = useState([]);
// //   const [loading, setLoading] = useState(true);

// //   // Fetch data from the API
// //   useEffect(() => {
// //     const fetchData = async () => {
// //       try {
// //         const response = await axios.get('http://localhost:5000/api/form/fetch-forwarded-cvs');
// //         setData(response.data);
// //       } catch (error) {
// //         console.error('Error fetching forwarded CVs:', error);
// //       } finally {
// //         setLoading(false);
// //       }
// //     };

// //     fetchData();
// //   }, []);

// //   // Define DataGrid columns
// //   const columns = [
// //     { field: 'companyName', headerName: 'Company Name', width: 200 },
// //     { field: 'websiteUrl', headerName: 'Website URL', width: 200 },
// //     {
// //       field: 'filePath',
// //       headerName: 'CV',
// //       width: 150,
// //       renderCell: (params) => {
// //         const fileUrl =` http://localhost:5000/${params.value.replace(/\\/g, '/')}`;
// //         return (
// //           <Button
// //             variant="contained"
// //             color="primary"
// //             onClick={() => window.open(fileUrl, '_blank')}
// //           >
// //             View CV
// //           </Button>
// //         );
// //       },
// //     },
// //     {
// //       field: 'createdAt',
// //       headerName: 'Created At',
// //       width: 200,
// //       valueGetter: (params) =>
// //         params.row?.createdAt ? new Date(params.row.createdAt).toLocaleString() : 'N/A',
// //     },
// //   ];

// //   // Flatten the data for the DataGrid
// //   const rows = data.flatMap((item, index) =>
// //     item.forwardedCVs.map((cv, idx) => ({
// //       id: `${item._id}-${idx}`,
// //       companyName: cv.companyName,
// //       websiteUrl: cv.websiteUrl,
// //       filePath: cv.filePath,
// //       createdAt: item.createdAt, // Safely pass createdAt from parent object
// //     }))
// //   );

// //   return (
// //     <div style={{ display: 'flex', height: '100vh' }}>
// //       <Sidebar />
// //       <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
// //         <Navbar />
// //         <Box sx={{ height: 400, width: '100%' }}>
// //           <DataGrid
// //             rows={rows}
// //             columns={columns}
// //             pageSize={5}
// //             rowsPerPageOptions={[5]}
// //             loading={loading}
// //             disableSelectionOnClick
// //           />
// //         </Box>
// //       </Box>
// //     </div>
// //   );
// // };

// // export default LineUpPage;

// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import Navbar from '../../components/hr components/HrNavbar';
// import Sidebar from '../../components/hr components/HrSidebar';

// const LineUpPage = () => {
//   const [data, setData] = useState([]);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/form/fetch-forwarded-cvs');
//         console.log('API Response:', response.data); // Debug API response
//         setData(response.data);
//       } catch (error) {
//         console.error('Error fetching forwarded CVs:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const rows = data.flatMap((item) =>
//     item.forwardedCVs.map((cv, index) => ({
//       id: `${item._id}-${index}`,
//       companyName: cv.companyName || 'N/A',
//       websiteUrl: cv.websiteUrl || 'N/A',
//       filePath: cv.filePath || 'N/A',
//       createdAt: item.createdAt || null,
//     }))
//   );

//   useEffect(() => {
//     console.log('Flattened Rows:', rows); // Debug flattened rows
//   }, [data]);

//   return (
//     <div style={{ display: 'flex', height: '100vh' }}>
//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main Content */}
//       <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
//         {/* Navbar */}
//         <Navbar />

//         {/* Table Content */}
//         <h1>Line Up Data</h1>
//         <div style={{ padding: '20px', overflowX: 'auto' }}>
//           {loading ? (
//             <p>Loading...</p>
//           ) : rows.length === 0 ? (
//             <p>No data available.</p>
//           ) : (
//             <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
//               <thead>
//                 <tr>
//                   <th>Company Name</th>
//                   <th>Website URL</th>
//                   <th>CV</th>
//                   <th>Created At</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((row) => (
//                   <tr key={row.id}>
//                     <td>{row.companyName}</td>
//                     <td>
//                       <a href={row.websiteUrl} target="_blank" rel="noopener noreferrer">
//                         {row.websiteUrl}
//                       </a>
//                     </td>
//                     <td>
//                       <a
//                         href={`http://localhost:5000/${row.filePath.replace(/\\/g, '/')}`}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                       >
//                         View CV
//                       </a>
//                     </td>
//                     <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A'}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LineUpPage;



// import React, { useEffect, useState } from 'react';
// import axios from 'axios';
// import Navbar from '../../components/hr components/HrNavbar';
// import Sidebar from '../../components/hr components/HrSidebar';

// const LineUpPage = () => {
//   const [data, setData] = useState([]);
//   const [rows, setRows] = useState([]);
//   const [filter, setFilter] = useState('');
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         const response = await axios.get('http://localhost:5000/api/form/fetch-forwarded-cvs');
//         const flattenedData = response.data.flatMap((item) =>
//           item.forwardedCVs.map((cv, index) => ({
//             id: `${item._id}-${index}`,
//             companyName: cv.companyName || 'N/A',
//             websiteUrl: cv.websiteUrl || 'N/A',
//             filePath: cv.filePath || 'N/A',
//             createdAt: item.createdAt || null,
//           }))
//         );
//         setData(flattenedData);
//         setRows(flattenedData); // Initialize rows with full data
//       } catch (error) {
//         console.error('Error fetching forwarded CVs:', error);
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   const handleFilterChange = (event) => {
//     const searchText = event.target.value.toLowerCase();
//     setFilter(searchText);

//     const filteredRows = data.filter((row) =>
//       row.companyName.toLowerCase().includes(searchText) ||
//       row.websiteUrl.toLowerCase().includes(searchText) ||
//       (row.createdAt && new Date(row.createdAt).toLocaleString().toLowerCase().includes(searchText))
//     );

//     setRows(filteredRows);
//   };

//   return (
//     <div style={{ display: 'flex', height: '100vh' }}>
//       {/* Sidebar */}
//       <Sidebar />

//       {/* Main Content */}
//       <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
//         {/* Navbar */}
//         <Navbar />

//         {/* Filter Input */}
//         <div style={{ padding: '10px' }}>
//           <input
//             type="text"
//             placeholder="Filter by Company Name, Website, or Date..."
//             value={filter}
//             onChange={handleFilterChange}
//             style={{
//               width: '100%',
//               padding: '8px',
//               fontSize: '16px',
//               marginBottom: '10px',
//               border: '1px solid #ccc',
//               borderRadius: '4px',
//             }}
//           />
//         </div>

//         {/* Table Content */}
//         <div style={{ padding: '20px', overflowX: 'auto' }}>
//           {loading ? (
//             <p>Loading...</p>
//           ) : rows.length === 0 ? (
//             <p>No data available.</p>
//           ) : (
//             <table border="1" style={{ width: '100%', borderCollapse: 'collapse' }}>
//               <thead>
//                 <tr>
//                   <th>Company Name</th>
//                   <th>Website URL</th>
//                   <th>CV</th>
//                   <th>Created At</th>
//                 </tr>
//               </thead>
//               <tbody>
//                 {rows.map((row) => (
//                   <tr key={row.id}>
//                     <td>{row.companyName}</td>
//                     <td>
//                       <a href={row.websiteUrl} target="_blank" rel="noopener noreferrer">
//                         {row.websiteUrl}
//                       </a>
//                     </td>
//                     <td>
//                       <a
//                         href={`http://localhost:5000/${row.filePath.replace(/\\/g, '/')}`}
//                         target="_blank"
//                         rel="noopener noreferrer"
//                       >
//                         View CV
//                       </a>
//                     </td>
//                     <td>{row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A'}</td>
//                   </tr>
//                 ))}
//               </tbody>
//             </table>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// };

// export default LineUpPage;

import React, { useEffect, useState } from 'react';
import axios from 'axios';
import Navbar from '../../components/hr components/HrNavbar';
import Sidebar from '../../components/hr components/HrSidebar';

const LineUpPage = () => {
  const [data, setData] = useState([]);
  const [rows, setRows] = useState([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get('http://localhost:5000/api/form/fetch-forwarded-cvs');
        const flattenedData = response.data.flatMap((item) =>
          item.forwardedCVs.map((cv, index) => ({
            id: `${item._id}-${index}`,
            companyName: cv.companyName || 'N/A',
            websiteUrl: cv.websiteUrl || 'N/A',
            filePath: cv.filePath || 'N/A',
            createdAt: item.createdAt || null,
          }))
        );
        setData(flattenedData);
        setRows(flattenedData); // Initialize rows with full data
      } catch (error) {
        console.error('Error fetching forwarded CVs:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleFilterChange = (event) => {
    const searchText = event.target.value.toLowerCase();
    setFilter(searchText);

    const filteredRows = data.filter((row) =>
      row.companyName.toLowerCase().includes(searchText) ||
      row.websiteUrl.toLowerCase().includes(searchText) ||
      (row.createdAt && new Date(row.createdAt).toLocaleString().toLowerCase().includes(searchText))
    );

    setRows(filteredRows);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#f4f4f4' }}>
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content */}
      <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        {/* Navbar */}
        <Navbar />

        {/* Filter Section */}
        <div style={{ padding: '20px', background: '#fff', boxShadow: '0 2px 4px rgba(0,0,0,0.1)', marginBottom: '20px' }}>
          <input
            type="text"
            placeholder="Search by Company Name, Website, or Date..."
            value={filter}
            onChange={handleFilterChange}
            style={{
              width: '100%',
              padding: '10px 15px',
              fontSize: '16px',
              borderRadius: '5px',
              border: '1px solid #ccc',
              outline: 'none',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.1)',
            }}
          />
        </div>

        {/* Table Section */}
        <div style={{ padding: '20px', background: '#fff', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', overflowX: 'auto' }}>
          {loading ? (
            <p style={{ textAlign: 'center', fontSize: '18px', color: '#555' }}>Loading...</p>
          ) : rows.length === 0 ? (
            <p style={{ textAlign: 'center', fontSize: '18px', color: '#555' }}>No data available.</p>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Arial, sans-serif' }}>
              <thead>
                <tr style={{ background: '#007bff', color: '#fff', textAlign: 'left' }}>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>Company Name</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>Website URL</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>CV</th>
                  <th style={{ padding: '10px', border: '1px solid #ddd' }}>Created At</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={row.id} style={{ background: '#f9f9f9', borderBottom: '1px solid #ddd' }}>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>{row.companyName}</td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <a href={row.websiteUrl} target="_blank" rel="noopener noreferrer" style={{ color: '#007bff', textDecoration: 'none' }}>
                        {row.websiteUrl}
                      </a>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      <a
                        href={`http://localhost:5000/${row.filePath.replace(/\\/g, '/')}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{
                          background: '#007bff',
                          color: '#fff',
                          padding: '5px 10px',
                          borderRadius: '4px',
                          textDecoration: 'none',
                        }}
                      >
                        View CV
                      </a>
                    </td>
                    <td style={{ padding: '10px', border: '1px solid #ddd' }}>
                      {row.createdAt ? new Date(row.createdAt).toLocaleString() : 'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default LineUpPage;
