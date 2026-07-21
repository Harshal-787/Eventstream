import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, Download, FileSpreadsheet, File } from 'lucide-react';
import reportService from '../../../services/reportService';
import { buildingService } from '../../buildings/services/buildingService';
import { Button } from '../../../components/ui/Button';
import { Select } from '../../../components/ui/Select';
import { Modal } from '../../../components/ui/Modal';

const reportTypes = [
  { id: 'event_statistics', title: 'Event Statistics', desc: 'Aggregated telemetry event counts by sensor type over time.', supportsBuilding: true, supportsTime: true },
  { id: 'alert_trends', title: 'Alert Trends', desc: 'Summary of alerts grouped by severity and current status.', supportsBuilding: true, supportsTime: true },
  { id: 'device_availability', title: 'Device Availability', desc: 'List of devices, current statuses, and last communication times.', supportsBuilding: true, supportsTime: false },
  { id: 'device_health', title: 'Device Health', desc: 'Detailed view of device battery percentages and signal strengths.', supportsBuilding: true, supportsTime: false },
  { id: 'building_performance', title: 'Building Performance', desc: 'Aggregated device counts and open alert metrics per building.', supportsBuilding: false, supportsTime: false },
  { id: 'sensor_activity', title: 'Sensor Activity', desc: 'Raw extract of recent telemetry data across all sensors.', supportsBuilding: true, supportsTime: true },
  { id: 'user_activity', title: 'User Activity', desc: 'List of users and their system interactions.', supportsBuilding: false, supportsTime: true },
  { id: 'audit_logs', title: 'Audit Logs', desc: 'Detailed tabular extract of all system audit logs.', supportsBuilding: false, supportsTime: true },
];

const Reports = () => {
  const [loading, setLoading] = useState({});
  const [buildings, setBuildings] = useState([]);
  const [modalConfig, setModalConfig] = useState({ isOpen: false, reportId: null, format: null });
  
  // Filter states
  const [filters, setFilters] = useState({
    buildingId: '',
    timeRange: 'all_time'
  });

  useEffect(() => {
    const fetchBuildings = async () => {
      try {
        const data = await buildingService.getBuildings();
        setBuildings(data);
      } catch (err) {
        toast.error('Failed to load buildings for filters');
      }
    };
    fetchBuildings();
  }, []);

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const clearFilters = () => {
    setFilters({ buildingId: '', timeRange: 'all_time' });
  };

  const openModal = (reportId, format) => {
    setModalConfig({ isOpen: true, reportId, format });
    clearFilters(); // Reset filters when opening modal
  };

  const closeModal = () => {
    setModalConfig({ isOpen: false, reportId: null, format: null });
  };

  const handleDownload = async () => {
    const { reportId, format } = modalConfig;
    if (!reportId || !format) return;

    try {
      setLoading(prev => ({ ...prev, [`${reportId}_${format}`]: true }));
      
      // calculate dates based on timeRange
      const apiFilters = {};
      if (filters.buildingId) apiFilters.buildingId = filters.buildingId;
      
      if (filters.timeRange !== 'all_time') {
        const end = new Date();
        const start = new Date();
        if (filters.timeRange === '24h') start.setHours(start.getHours() - 24);
        if (filters.timeRange === '7d') start.setDate(start.getDate() - 7);
        if (filters.timeRange === '30d') start.setDate(start.getDate() - 30);
        
        apiFilters.startDate = start.toISOString();
        apiFilters.endDate = end.toISOString();
      }

      const data = await reportService.downloadReport(reportId, format, apiFilters);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      
      let ext = format;
      if (format === 'excel') ext = 'xlsx';
      
      const timeStr = filters.timeRange || 'all_time';
      const bStr = filters.buildingId ? `_b${filters.buildingId}` : '';
      link.setAttribute('download', `${reportId}${bStr}_${timeStr}.${ext}`);
      
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`${format.toUpperCase()} report downloaded successfully`);
      closeModal();
    } catch (err) {
      toast.error(`Failed to download ${format.toUpperCase()} report`);
    } finally {
      setLoading(prev => ({ ...prev, [`${reportId}_${format}`]: false }));
    }
  };

  const activeReport = reportTypes.find(r => r.id === modalConfig.reportId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-main)">Reporting Engine</h1>
          <p className="text-(--color-text-muted) mt-1">Generate and download comprehensive system reports in multiple formats.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reportTypes.map((report) => (
          <div key={report.id} className="bg-(--color-surface) rounded-lg border border-(--color-border) p-6 flex flex-col h-full hover:border-blue-500/30 transition-colors">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                <FileText className="h-6 w-6" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-(--color-text-main)">{report.title}</h3>
              </div>
            </div>
            <p className="text-sm text-(--color-text-muted) mb-6 flex-grow">{report.desc}</p>
            
            <div className="grid grid-cols-3 gap-2 mt-auto">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => openModal(report.id, 'csv')}
                disabled={loading[`${report.id}_csv`]}
                className="flex items-center justify-center gap-1 text-xs"
              >
                <File className="h-3 w-3" />
                CSV
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openModal(report.id, 'excel')}
                disabled={loading[`${report.id}_excel`]}
                className="flex items-center justify-center gap-1 text-xs text-green-500 hover:text-green-400 border-green-500/20 hover:border-green-500/50"
              >
                <FileSpreadsheet className="h-3 w-3" />
                Excel
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => openModal(report.id, 'pdf')}
                disabled={loading[`${report.id}_pdf`]}
                className="flex items-center justify-center gap-1 text-xs text-red-500 hover:text-red-400 border-red-500/20 hover:border-red-500/50"
              >
                <Download className="h-3 w-3" />
                PDF
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Pre-Download Modal */}
      {activeReport && (
        <Modal 
          isOpen={modalConfig.isOpen} 
          onClose={closeModal}
          title={`Export ${activeReport.title}`}
        >
          <div className="space-y-6">
            <p className="text-sm text-(--color-text-muted)">
              Configure parameters before generating your {modalConfig.format?.toUpperCase()} report.
            </p>
            
            <div className="space-y-4">
              {activeReport.supportsBuilding ? (
                <Select
                  label="Target Building"
                  value={filters.buildingId}
                  onChange={(e) => handleFilterChange('buildingId', e.target.value)}
                  options={[
                    { value: '', label: '🏢 All Buildings (Portfolio-wide)' },
                    ...buildings.map(b => ({ value: b.id, label: b.name }))
                  ]}
                />
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-(--color-border)">
                  <p className="text-sm text-(--color-text-muted)">🏢 Building filter is not applicable for this report type.</p>
                </div>
              )}

              {activeReport.supportsTime ? (
                <Select
                  label="Time Range"
                  value={filters.timeRange}
                  onChange={(e) => handleFilterChange('timeRange', e.target.value)}
                  options={[
                    { value: 'all_time', label: '📅 All Time' },
                    { value: '24h', label: '🕒 Last 24 Hours' },
                    { value: '7d', label: '📆 Last 7 Days' },
                    { value: '30d', label: '🗓️ Last 30 Days' },
                  ]}
                />
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-(--color-border)">
                  <p className="text-sm text-(--color-text-muted)">📅 Time range filter is not applicable for this report type.</p>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              <Button 
                onClick={handleDownload}
                disabled={loading[`${modalConfig.reportId}_${modalConfig.format}`]}
              >
                {loading[`${modalConfig.reportId}_${modalConfig.format}`] ? 'Generating...' : 'Generate Report'}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Reports;
