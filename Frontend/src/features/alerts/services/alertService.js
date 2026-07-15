import apiClient from '../../../services/apiClient';

export const alertService = {
  getAlerts: async (filters = {}) => {
    const params = new URLSearchParams();
    if (filters.status) params.append('status', filters.status);
    if (filters.severity) params.append('severity', filters.severity);
    if (filters.building_id) params.append('building_id', filters.building_id);
    if (filters.start_date) params.append('start_date', new Date(filters.start_date).toISOString());
    if (filters.end_date) params.append('end_date', new Date(filters.end_date).toISOString());
    
    const response = await apiClient.get(`/alerts?${params.toString()}`);
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
