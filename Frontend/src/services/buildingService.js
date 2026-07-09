import apiClient from './apiClient';

export const buildingService = {
  getBuildings: async () => {
    const response = await apiClient.get('/buildings');
    return response.data.data;
  },
  getBuilding: async (id) => {
    const response = await apiClient.get(`/buildings/${id}`);
    return response.data.data;
  },
  createBuilding: async (data) => {
    const response = await apiClient.post('/buildings', data);
    return response.data.data;
  },
  updateBuilding: async (id, data) => {
    const response = await apiClient.patch(`/buildings/${id}`, data);
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/buildings/${id}/status`, { status });
    return response.data;
  },
  updateBuilding: async (id, payload) => {
    const response = await apiClient.patch(`/buildings/${id}`, payload);
    return response.data;
  },
  deleteBuilding: async (id) => {
    const response = await apiClient.delete(`/buildings/${id}`);
    return response.data;
  },
  getFloors: async (buildingId) => {
    const response = await apiClient.get(`/buildings/${buildingId}/floors`);
    return response.data;
  }
};
