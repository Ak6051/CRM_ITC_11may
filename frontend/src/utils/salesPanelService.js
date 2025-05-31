import axios from 'axios';

const API_URL = 'http://localhost:5000/api/panel';

export const isTokenValid = () => {
  const token = sessionStorage.getItem('token');
  const expirationTime = sessionStorage.getItem('tokenExpiration');
  
  if (!token || !expirationTime) {
    return false;
  }
  
  const currentTime = new Date().getTime();
  return currentTime < parseInt(expirationTime);
};


export const fetchMySales = async () => {
  try {
    // Check if token is valid
    if (!isTokenValid()) {
      console.error('Token is invalid or expired');
      return [];
    }
    
    const response = await axios.get(`${API_URL}/all-sales`, {
      headers: { Authorization: `Bearer ${sessionStorage.getItem('token')}` }, // Include token in the request headers
    });
    return response.data; // This will contain the list of jobs
  } catch (error) {
    console.error('Error fetching job openings:', error);
    return [];
  }
};

export const createMySale = async (formData, isMultipart = false) => {
  const token = sessionStorage.getItem('token');
  const response = await fetch('http://localhost:5000/api/panel/create-sale', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' })
    },
    body: isMultipart ? formData : JSON.stringify(formData)
  });

  return await response.json();
};

export const updateMySale = async (id, formData, isMultipart = false) => {
  const token = sessionStorage.getItem('token');
  const response = await fetch(`http://localhost:5000/api/panel/update-sale/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      ...(isMultipart ? {} : { 'Content-Type': 'application/json' })
    },
    body: isMultipart ? formData : JSON.stringify(formData)
  });

  return await response.json();
};
