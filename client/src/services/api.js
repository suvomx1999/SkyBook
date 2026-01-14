import axios from 'axios';

const getBaseUrl = () => {
  let url = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';
  // Ensure it ends with /api if it's the production URL to avoid user configuration errors
  if (import.meta.env.VITE_API_URL && !url.endsWith('/api')) {
    url = `${url}/api`;
  }
  return url;
};

const API = axios.create({
  baseURL: getBaseUrl(),
});

// Add a request interceptor to include the token in headers
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export default API;
