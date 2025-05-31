import axios from 'axios';

const API_URL = 'http://localhost:5000/api/allType';

// Function to check if token is valid
export const isTokenValid = () => {
  const token = sessionStorage.getItem('token');
  const expirationTime = sessionStorage.getItem('tokenExpiration');
  
  if (!token || !expirationTime) {
    return false;
  }
  
  const currentTime = new Date().getTime();
  return currentTime < parseInt(expirationTime);
};

// Fetch all job openings (admin only)
export const fetchSales = async () => {
  try {
    // Check if token is valid
    if (!isTokenValid()) {
      console.error('Token is invalid or expired');
      return [];
    }
    
    const response = await axios.get(`${API_URL}/my-jobs`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }, // Include token in the request headers
    });
    return response.data; // This will contain the list of jobs
  } catch (error) {
    console.error('Error fetching job openings:', error);
    return [];
  }
};



export const fetchAllSales = async () => {
  try {
    const token = sessionStorage.getItem('token');
    const expirationTime = sessionStorage.getItem('tokenExpiration');

    if (!token || !expirationTime) {
      console.error('No authentication token found or token expired');
      throw new Error('Authentication required');
    }

    const currentTime = new Date().getTime();

    if (currentTime >= parseInt(expirationTime)) {
      // Token expired, try to refresh
      try {
        const refreshResponse = await axios.post('http://localhost:5000/api/auth/refresh-token', {}, {
          headers: { Authorization: `Bearer ${token}` }
        });

        if (refreshResponse.data.token) {
          const newToken = refreshResponse.data.token;
          const newExpirationTime = new Date().getTime() + 60 * 60 * 1000; // 1 hour
          sessionStorage.setItem('token', newToken);
          sessionStorage.setItem('tokenExpiration', newExpirationTime.toString());

          // Re-run original request with new token
          const refreshedResponse = await axios.get(`${API_URL}/all`, {
            headers: {
              Authorization: `Bearer ${newToken}`,
              'Content-Type': 'application/json'
            }
          });

          return refreshedResponse.data;
        } else {
          throw new Error('Failed to refresh token');
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
        sessionStorage.removeItem('token');
        sessionStorage.removeItem('tokenExpiration');
        sessionStorage.removeItem('role');
        throw new Error('Token expired');
      }
    } else {
      // Token is still valid
      const response = await axios.get(`${API_URL}/all`, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        }
      });
      return response.data;
    }
  } catch (error) {
    console.error('Error fetching sales:', error);
    throw error;
  }
};







export const createSale = async (jobData ,isMultipart = false) => {
    try {
      const response = await axios.post(`${API_URL}/create`, jobData, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
                ...(isMultipart ? { 'Content-Type': 'multipart/form-data' } : {}),

        },
      });
      console.log('Job created successfully:', response.data);
      return response.data; // This will contain the job created response
    } catch (error) {
      console.error('Error creating job opening:', error);
    }
  };

  export const updateSale = async (jobId, jobData, isMultipart = false) => {
    try {
      const response = await axios.put(`${API_URL}/edit/${jobId}`, jobData, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
          ...(isMultipart ? { 'Content-Type': 'multipart/form-data' } : {}),
        },
      });
      console.log('Job updated successfully:', response.data);
      return response.data; // This will contain the updated job
    } catch (error) {
      console.error('Error updating job opening:', error);
    }
  };

  export const deleteSale = async (jobId) => {
    try {
      const response = await axios.delete(`${API_URL}/delete/${jobId}`, {
        headers: {
          Authorization: `Bearer ${sessionStorage.getItem('token')}`,
        },
      });
      console.log('Job deleted successfully:', response.data);
      return response.data; // Confirmation of deletion
    } catch (error) {
      console.error('Error deleting job opening:', error);
    }
  };
  

export const fetchHRUsers = async () => {
    return await axios.get('http://localhost:5000/api/hr/hr-users'); // Adjust the path according to your setup
};

