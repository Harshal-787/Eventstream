import apiClient from './apiClient';

const reportService = {
  downloadReport: async (type, format, filters = {}) => {
    let url = `/reports/export?type=${type}&format=${format}`;
    if (filters.buildingId) url += `&building_id=${filters.buildingId}`;
    if (filters.startDate) url += `&start_date=${filters.startDate}`;
    if (filters.endDate) url += `&end_date=${filters.endDate}`;
    
    const response = await apiClient.get(url, {
      responseType: 'blob'
    });
    return response.data;
  },
};

export default reportService;
