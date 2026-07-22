import apiClient from './apiClient';

export const dashboardService = {
  getSummary: async () => {
    const response = await apiClient.get('/dashboard/summary');
    return response.data;
  },
  getRecentEvents: async () => {
    const response = await apiClient.get('/dashboard/recent-events');
    return response.data;
  },
  getRecentAlerts: async () => {
    const response = await apiClient.get('/dashboard/recent-alerts');
    return response.data;
  },
  getDeviceStatus: async () => {
    const response = await apiClient.get('/dashboard/device-status');
    return response.data;
  },
  getEventTrends: async () => {
    const response = await apiClient.get('/dashboard/event-trends');
    return response.data;
  }
};
