import apiClient from './apiClient';

export const deviceService = {
  getDevices: async () => {
    const response = await apiClient.get('/devices');
    return response.data;
  },
  getDevice: async (id) => {
    const response = await apiClient.get(`/devices/${id}`);
    return response.data;
  },
  createDevice: async (data) => {
    const response = await apiClient.post('/devices', data);
    return response.data;
  },
  updateDevice: async (id, data) => {
    const response = await apiClient.patch(`/devices/${id}`, data);
    return response.data;
  },
  getDeviceEvents: async (id) => {
    const response = await apiClient.get(`/devices/${id}/events`);
    return response.data;
  }
};
