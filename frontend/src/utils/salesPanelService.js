import axios from 'axios';
import { API_BASE_URL } from '../config/api.config';

const API_URL = `${API_BASE_URL}/panel`;

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
    const token = sessionStorage.getItem('token');
    
    // If no token exists, redirect to login
    if (!token) {
      redirectToLogin();
      return [];
    }
    
    const response = await axios.get(`${API_URL}/all-sales`, {
      headers: { 
        Authorization: `Bearer ${token}`,
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      validateStatus: function (status) {
        return status >= 200 && status < 500; // Resolve only if the status code is less than 500
      }
    });
    
    // If unauthorized or token expired
    if (response.status === 401) {
      redirectToLogin();
      return [];
    }
    
    // If other error
    if (response.status >= 400) {
      console.error('Error fetching sales data:', response.data?.message || 'Unknown error');
      return [];
    }
    
    return response.data || [];
  } catch (error) {
    console.error('Error in fetchMySales:', error);
    if (error.response?.status === 401) {
      redirectToLogin();
    }
    return [];
  }
};

// Helper function to handle redirection to login
const redirectToLogin = () => {
  // Clear any existing session data
  sessionStorage.removeItem('token');
  sessionStorage.removeItem('tokenExpiration');
  sessionStorage.removeItem('userRole');
  
  // Redirect to login page
  window.location.href = '/login';
};

export const createMySale = async (formData, isMultipart = false) => {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return { error: true, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/panel/create-sale`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: isMultipart ? formData : JSON.stringify(formData)
    });

    if (response.status === 401) {
      redirectToLogin();
      return { error: true, message: 'Session expired' };
    }

    return await response.json();
  } catch (error) {
    console.error('Error in createMySale:', error);
    if (error.response?.status === 401) {
      redirectToLogin();
    }
    return { error: true, message: error.message || 'Failed to create sale' };
  }
};

export const updateMySale = async (id, formData, isMultipart = false) => {
  try {
    const token = sessionStorage.getItem('token');
    if (!token) {
      redirectToLogin();
      return { error: true, message: 'Not authenticated' };
    }

    const response = await fetch(`${API_BASE_URL}/panel/update-sale/${id}`, {
      method: 'PUT',
      headers: {
        Authorization: `Bearer ${token}`,
        ...(isMultipart ? {} : { 'Content-Type': 'application/json' }),
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache',
        'Expires': '0'
      },
      body: isMultipart ? formData : JSON.stringify(formData)
    });

    if (response.status === 401) {
      redirectToLogin();
      return { error: true, message: 'Session expired' };
    }

    return await response.json();
  } catch (error) {
    console.error('Error in updateMySale:', error);
    if (error.response?.status === 401) {
      redirectToLogin();
    }
    return { error: true, message: error.message || 'Failed to update sale' };
  }
};
