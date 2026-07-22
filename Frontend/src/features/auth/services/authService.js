import apiClient from '../../../services/apiClient';

export const authService = {
  login: async (email, password) => {
    const response = await apiClient.post('/auth/login', { email, password });
    return response.data;
  },
  register: async (payload) => {
    const response = await apiClient.post('/auth/register', payload);
    return response.data;
  },
  reapply: async (payload) => {
    const response = await apiClient.post('/auth/reapply', payload);
    return response.data;
  },

  getMe: async () => {
    const response = await apiClient.get('/auth/me');
    return response.data;
  },

  verifyOtp: async (email, otp) => {
    const response = await apiClient.post('/auth/verify-otp', { email, otp });
    return response.data;
  },

  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch(err) {
      console.error('Logout failed:', err);
    }
  }
};
