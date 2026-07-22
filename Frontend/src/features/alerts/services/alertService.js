import apiClient from '../../../services/apiClient';

export const alertService = {
  getAlerts: async () => {
    const response = await apiClient.get('/alerts');
    return response.data.data;
  },
  getAlert: async (id) => {
    const response = await apiClient.get(`/alerts/${id}`);
    return response.data;
  },
  acknowledgeAlert: async (id) => {
    const response = await apiClient.post(`/alerts/${id}/acknowledge`);
    return response.data;
  },
  resolveAlert: async (id) => {
    const response = await apiClient.post(`/alerts/${id}/resolve`);
    return response.data;
  },
  deleteAlert: async (id) => {
    const response = await apiClient.delete(`/alerts/${id}`);
    return response.data;
  },
  clearAllAlerts: async () => {
    const response = await apiClient.delete('/alerts/clear');
    return response.data;
  }
};

export const alertRuleService = {
  getRules: async () => {
    const response = await apiClient.get('/alert-rules');
    return response.data;
  },
  createRule: async (data) => {
    const response = await apiClient.post('/alert-rules', data);
    return response.data;
  },
  updateRule: async (id, data) => {
    const response = await apiClient.patch(`/alert-rules/${id}`, data);
    return response.data;
  }
};
