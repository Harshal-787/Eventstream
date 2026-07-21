import apiClient from './apiClient';

const healthService = {
  getSystemHealth: async () => {
    const response = await apiClient.get('/system/health');
    return response.data;
  },
};

export default healthService;
