import apiClient from '../../../services/apiClient';

export const failedEventsService = {
  getFailedEvents: async (page = 1, limit = 50) => {
    const response = await apiClient.get(`/failed-events?page=${page}&limit=${limit}`);
    return response.data;
  }
};
