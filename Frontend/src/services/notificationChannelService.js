import apiClient from './apiClient';

const notificationChannelService = {
  getChannels: async () => {
    const response = await apiClient.get('/notification-channels');
    return response.data;
  },

  createChannel: async (channel) => {
    const response = await apiClient.post('/notification-channels', channel);
    return response.data;
  },

  updateChannel: async (id, channel) => {
    const response = await apiClient.put(`/notification-channels/${id}`, channel);
    return response.data;
  },

  deleteChannel: async (id) => {
    const response = await apiClient.delete(`/notification-channels/${id}`);
    return response.data;
  },
};

export default notificationChannelService;
