import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1', // Assuming a proxy or same-domain deployment
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach the Bearer token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

// Response interceptor for generic error handling (e.g., 401 Unauthorized)
apiClient.interceptors.response.use((response) => {
  return response;
}, (error) => {
  if (error.response && error.response.status === 401) {
    // Optionally clear local storage and redirect to login
    localStorage.removeItem('token');
    window.dispatchEvent(new Event('auth-error'));
  }
  return Promise.reject(error);
});

export default apiClient;
