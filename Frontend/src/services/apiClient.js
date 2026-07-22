import axios from 'axios';

const apiClient = axios.create({
  baseURL: '/api/v1', // Assuming a proxy or same-domain deployment
  withCredentials: true, // Send HTTP-Only cookies with every request
  headers: {
    'Content-Type': 'application/json',
  },
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
