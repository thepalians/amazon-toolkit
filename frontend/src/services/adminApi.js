import axios from 'axios';

const adminApi = axios.create({
  baseURL: process.env.REACT_APP_API_URL || '/api',
  timeout: 30000,
});

// Attach admin JWT token
adminApi.interceptors.request.use((config) => {
  const token = localStorage.getItem('adminToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle 401 — redirect to admin login
adminApi.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      window.location.href = '/amazon-seller-toolkit/admin/login';
    }
    return Promise.reject(error);
  }
);

export default adminApi;
