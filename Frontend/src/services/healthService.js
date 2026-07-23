import apiClient from './apiClient';

const healthService = {
  getSystemHealth: async () => {
    const response = await apiClient.get('/system/health');
    return response.data;
  },
  getSimulationStatus: async () => {
    const response = await apiClient.get('/system/simulation');
    return response.data;
  },
  toggleSimulationStatus: async (enabled) => {
    const response = await apiClient.post('/system/simulation/toggle', { enabled });
    return response.data;
  },
};

export default healthService;
