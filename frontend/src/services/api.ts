import axios from 'axios';

// Force production URL for now while debugging env vars
const API_BASE_URL = import.meta.env.VITE_API_URL || 
  (window.location.hostname.includes('onrender.com') 
    ? 'https://inversiones-castillo.onrender.com/api' 
    : 'http://localhost:8000/api');

// API configuration confirmed working - debug logs removed

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token && config.headers) {
    config.headers.Authorization = `Token ${token}`;
  }
  
  // Set Content-Type for non-FormData requests
  if (config.data && !(config.data instanceof FormData)) {
    config.headers = config.headers || {};
    config.headers['Content-Type'] = 'application/json';
  }
  
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    console.error('API Error Response:', error.response?.data);
    console.error('API Error Status:', error.response?.status);
    console.error('API Error Headers:', error.response?.headers);
    
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default api;