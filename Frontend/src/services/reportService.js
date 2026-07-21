import apiClient from './apiClient';

const reportService = {
  downloadReport: async (type, format, filters = {}) => {
    let url = `/reports/export?type=${type}&format=${format}&_t=${Date.now()}`;
    if (filters.buildingId) url += `&building_id=${filters.buildingId}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    
    const response = await apiClient.get(url, {
      responseType: 'blob'
    });
    return response.data;
  },

  getSchedules: async () => {
    const response = await apiClient.get('/reports/schedules');
    return response.data;
  },

  createSchedule: async (data) => {
    const response = await apiClient.post('/reports/schedules', data);
    return response.data;
  },

  deleteSchedule: async (id) => {
    const response = await apiClient.delete(`/reports/schedules/${id}`);
    return response.data;
  }
};

export default reportService;
