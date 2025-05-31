import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
    baseURL: 'http://localhost:5000/api/panel',
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add request interceptor to add token to all requests
api.interceptors.request.use(
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

// Add response interceptor to handle token expiration
api.interceptors.response.use(
    (response) => {
        return response;
    },
    (error) => {
        // Check if error is due to token expiration (401 Unauthorized)
        if (error.response && error.response.status === 401) {
            // Clear token and redirect to login
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('role');
            sessionStorage.removeItem('tokenExpiration');
            
            // Only redirect if we're not already on the login page
            if (window.location.pathname !== '/login') {
                window.location.href = '/login';
            }
        }
        return Promise.reject(error);
    }
);

// Function to check if token is expired
export const isTokenExpired = () => {
    const tokenExpiration = sessionStorage.getItem('tokenExpiration');
    if (!tokenExpiration) return true;
    
    const expirationTime = parseInt(tokenExpiration);
    const currentTime = new Date().getTime();
    
    // Return true if token will expire in the next 5 minutes
    return currentTime >= (expirationTime - 5 * 60 * 1000);
};

// Function to refresh token
export const refreshToken = async () => {
    try {
        const token = sessionStorage.getItem('token');
        if (!token) {
            throw new Error('No token available');
        }
        const response = await axios.post('http://localhost:5000/api/auth/refresh-token', {}, {
            headers: { Authorization: `Bearer ${token}` }
          });
        
        if (response.data.token) {
            // Update token in sessionStorage with new expiration (1 hour)
            const expirationTime = new Date().getTime() + 60 * 60 * 1000;
            sessionStorage.setItem('token', response.data.token);
            sessionStorage.setItem('tokenExpiration', expirationTime.toString());
            return response.data.token;
        }
        throw new Error('No token in refresh response');
    } catch (error) {
        console.error('Error refreshing token:', error);
        // Only clear storage and redirect if we're not already on the login page
        if (window.location.pathname !== '/login') {
            sessionStorage.removeItem('token');
            sessionStorage.removeItem('role');
            sessionStorage.removeItem('tokenExpiration');
            window.location.href = '/login';
        }
        throw error;
    }
};

api.interceptors.request.use(async (config) => {
    // ✅ Skip token refresh on login or refresh-token endpoints
    if (
      config.url.includes('/auth/login') ||
      config.url.includes('/auth/refresh-token')
    ) {
      return config;
    }
  
    // ✅ Only refresh if token is expired
    if (isTokenExpired()) {
      try {
        const newToken = await refreshToken();
        config.headers.Authorization = `Bearer ${newToken}`;
      } catch (error) {
        console.error('Failed to refresh token:', error);
      }
    }
  
    return config;
  });
  

export default api;
