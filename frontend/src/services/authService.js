import axios from 'axios';
import { toast } from 'react-toastify';

import API_BASE_URL from '../api.config';

const API_URL = process.env.REACT_APP_API_URL || API_BASE_URL;

const AuthService = {
  // Initialize axios with token interceptor
  initialize() {
    axios.interceptors.request.use(
      (config) => {
        const token = sessionStorage.getItem('token');
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
      },
      (error) => {
        return Promise.reject(error);
      }
    );

    axios.interceptors.response.use(
      (response) => {
        // Check for new token in headers
        const newToken = response.headers['x-access-token'];
        if (newToken) {
          sessionStorage.setItem('token', newToken);
        }
        return response;
      },
      (error) => {
        if (error.response?.status === 401) {
          // Token expired or invalid
          sessionStorage.removeItem('token');
          window.location.href = '/login';
          toast.error('Session expired. Please login again.');
        }
        return Promise.reject(error);
      }
    );
  },

  login(email, password) {
    return axios.post(`${API_URL}/api/auth/login`, { email, password })
      .then(response => {
        sessionStorage.setItem('token', response.data.token);
        return response.data;
      });
  },

  logout() {
    sessionStorage.removeItem('token');
    window.location.href = '/login';
  },

  getCurrentUser() {
    return sessionStorage.getItem('token');
  },

  isAuthenticated() {
    const token = sessionStorage.getItem('token');
    if (!token) return false;

    try {
      const decoded = JSON.parse(atob(token.split('.')[1]));
      const currentTime = Math.floor(Date.now() / 1000);
      return decoded.exp > currentTime;
    } catch (error) {
      return false;
    }
  }
};

// Initialize the service when the app starts
AuthService.initialize();

export default AuthService;
