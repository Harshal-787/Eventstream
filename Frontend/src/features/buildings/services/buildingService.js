import apiClient from '../../../services/apiClient';

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
  },
  createFloor: async (buildingId, data) => {
    const response = await apiClient.post(`/buildings/${buildingId}/floors`, data);
    return response.data;
  },
  getRooms: async (floorId) => {
    const response = await apiClient.get(`/floors/${floorId}/rooms`);
    return response.data;
  },
  createRoom: async (floorId, data) => {
    const response = await apiClient.post(`/floors/${floorId}/rooms`, data);
    return response.data;
  },
  updateFloor: async (floorId, data) => {
    const response = await apiClient.patch(`/floors/${floorId}`, data);
    return response.data;
  },
  deleteFloor: async (floorId) => {
    const response = await apiClient.delete(`/floors/${floorId}`);
    return response.data;
  },
  updateRoom: async (roomId, data) => {
    const response = await apiClient.patch(`/rooms/${roomId}`, data);
    return response.data;
  },
  deleteRoom: async (roomId) => {
    const response = await apiClient.delete(`/rooms/${roomId}`);
    return response.data;
  }
};
