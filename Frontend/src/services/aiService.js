import api from './apiClient';

export const aiService = {
  // Configuration
  getConfig: async () => {
    const response = await api.get('/ai/config');
    return response.data;
  },
  setConfig: async (config) => {
    const response = await api.post('/ai/config', config);
    return response.data;
  },
  getModels: async (providerType, apiKey, baseUrl) => {
    const response = await api.post('/ai/models', { provider_type: providerType, api_key: apiKey, base_url: baseUrl });
    return response.data;
  },

  // AI Actions
  generateEventSummary: async (deviceId) => {
    const url = deviceId ? `/ai/summary?device_id=${deviceId}` : '/ai/summary';
    const response = await api.get(url);
    return response.data;
  },
  analyzeAlertRCA: async (alertId) => {
    const response = await api.get(`/ai/alerts/${alertId}/rca`);
    return response.data;
  },
  predictMaintenance: async (deviceId) => {
    const response = await api.get(`/ai/devices/${deviceId}/predictive-maintenance`);
    return response.data;
  },
  generateDeviceHealthSummary: async (deviceId) => {
    const response = await api.get(`/ai/devices/${deviceId}/health-summary`);
    return response.data;
  },
  generateExecutiveReport: async () => {
    const response = await api.get('/ai/executive-report');
    return response.data;
  },
  generateIncidentSummary: async (incidentId) => {
    const response = await api.get(`/ai/incidents/${incidentId}/summary`);
    return response.data;
  },
  chat: async (prompt) => {
    const response = await api.post('/ai/chat', { prompt });
    return response.data;
  }
};
