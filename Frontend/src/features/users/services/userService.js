import apiClient from '../../../services/apiClient';

export const userService = {
  getUsers: async () => {
    const response = await apiClient.get('/users');
    return response.data.data;
  },
  updateStatus: async (id, status) => {
    const response = await apiClient.patch(`/users/${id}/status`, { status });
    return response.data;
  },
  updateUser: async (id, name) => {
    const response = await apiClient.patch(`/users/${id}`, { name });
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await apiClient.delete(`/users/${id}`);
    return response.data;
  }
};
