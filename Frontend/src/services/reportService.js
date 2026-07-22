import apiClient from './apiClient';

const reportService = {
  downloadTelemetryCSV: async (deviceId) => {
    const response = await apiClient.get(`/reports/telemetry/${deviceId}`, {
      responseType: 'blob'
    });
    return response.data;
  },

  downloadBuildingHealthPDF: async (buildingId) => {
    const response = await apiClient.get(`/reports/building-health/${buildingId}`, {
      responseType: 'blob'
    });
    return response.data;
  },
};

export default reportService;
