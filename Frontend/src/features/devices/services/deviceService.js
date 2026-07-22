import apiClient from '../../../services/apiClient';

export const deviceService = {
  getModels: async () => {
    const response = await apiClient.get('/devices/models');
    return response.data;
  },
  getDevices: async (buildingId, status) => {
    let url = '/devices?';
    if (buildingId) url += `building_id=${buildingId}&`;
    if (status) url += `status=${status}`;
    const response = await apiClient.get(url);
    return response.data;
  },
  createDevice: async (data) => {
    const response = await apiClient.post('/devices', data);
    return response.data;
  },
  deleteDevice: async (id) => {
    const response = await apiClient.delete(`/devices/${id}`);
    return response.data;
  },
  unassignDevice: async (id) => {
    const response = await apiClient.patch(`/devices/${id}/assign`, {
      building_id: null,
      floor_id: null,
      room_id: null,
      status: 'unassigned'
    });
    return response.data;
  },
  updateDeviceStatus: async (id, status) => {
    const response = await apiClient.patch(`/devices/${id}/status`, { status });
    return response.data;
  },
  toggleMaintenance: async (id, isMaintenance) => {
    const response = await apiClient.patch(`/devices/${id}/maintenance`, { is_maintenance: isMaintenance });
    return response.data;
  },
  createModel: async (modelData) => {
    const response = await apiClient.post('/devices/models', modelData);
    return response.data;
  },
  bulkCreateDevices: async (dataArray) => {
    const response = await apiClient.post('/devices/bulk', dataArray);
    return response.data;
  },
  assignDevice: async (id, data) => {
    const response = await apiClient.patch(`/devices/${id}/assign`, data);
    return response.data;
  },
  provisionDevice: async (id) => {
    const response = await apiClient.post(`/devices/${id}/provision`);
    return response.data;
  },
  getDeviceTwin: async (id) => {
    const response = await apiClient.get(`/devices/${id}/twin`);
    return response.data;
  },
  updateDeviceTwin: async (id, payload) => {
    const response = await apiClient.put(`/devices/${id}/twin`, payload);
    return response.data;
  },
  getSensorRequests: async (buildingId) => {
    let url = '/sensor-requests';
    if (buildingId) url += `?building_id=${buildingId}`;
    const response = await apiClient.get(url);
    return response.data;
  },
  createSensorRequest: async (data) => {
    const response = await apiClient.post('/sensor-requests', data);
    return response.data;
  },
  fulfillSensorRequest: async (id, assignedDeviceId = null, autoProvision = false) => {
    const payload = {};
    if (assignedDeviceId) payload.assigned_device_id = assignedDeviceId;
    if (autoProvision) payload.auto_provision = true;
    const response = await apiClient.post(`/sensor-requests/${id}/fulfill`, payload);
    return response.data;
  },
  deleteSensorRequest: async (id) => {
    const response = await apiClient.delete(`/sensor-requests/${id}`);
    return response.data;
  },
  
  // --- Device Groups ---
  getDeviceGroups: async () => {
    const response = await apiClient.get('/device-groups');
    return response.data;
  },
  createDeviceGroup: async (data) => {
    const response = await apiClient.post('/device-groups', data);
    return response.data;
  },
  updateDeviceGroup: async (id, data) => {
    const response = await apiClient.put(`/device-groups/${id}`, data);
    return response.data;
  },
  deleteDeviceGroup: async (id) => {
    const response = await apiClient.delete(`/device-groups/${id}`);
    return response.data;
  },
  getDeviceGroupMembers: async (id) => {
    const response = await apiClient.get(`/device-groups/${id}/members`);
    return response.data;
  },
  addDeviceGroupMembers: async (id, deviceIds) => {
    const response = await apiClient.post(`/device-groups/${id}/members`, { device_ids: deviceIds });
    return response.data;
  },
  removeDeviceGroupMember: async (id, deviceId) => {
    const response = await apiClient.delete(`/device-groups/${id}/members/${deviceId}`);
    return response.data;
  }
};
