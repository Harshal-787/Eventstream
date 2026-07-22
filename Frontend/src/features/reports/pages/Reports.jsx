import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, Download, FileSpreadsheet, File, Clock, Calendar, Trash2 } from 'lucide-react';
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
  const [modalConfig, setModalConfig] = useState({ isOpen: false, reportId: null, format: null, isSchedule: false });
  const [activeTab, setActiveTab] = useState('generate');
  const [schedules, setSchedules] = useState([]);
  const [scheduleData, setScheduleData] = useState({ frequency: 'weekly', recipients: '' });

  // Filter states
  const [filters, setFilters] = useState({
    buildingId: '',
    timeRange: 'all_time'
  });

  const fetchSchedules = async () => {
    try {
      const data = await reportService.getSchedules();
      setSchedules(data);
    } catch (err) {
      toast.error('Failed to load schedules');
    }
  };

  useEffect(() => {
    fetchSchedules();
  }, []);

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

  const openModal = (reportId, format, isSchedule = false) => {
    setModalConfig({ isOpen: true, reportId, format, isSchedule });
    clearFilters(); // Reset filters when opening modal
    setScheduleData({ frequency: 'weekly', recipients: '' });
  };

  const closeModal = () => {
    setModalConfig({ isOpen: false, reportId: null, format: null, isSchedule: false });
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

  const handleCreateSchedule = async () => {
    const { reportId, format } = modalConfig;
    if (!reportId || !format || !scheduleData.recipients) return;

    try {
      setLoading(prev => ({ ...prev, schedule_create: true }));
      const recipients = scheduleData.recipients.split(',').map(e => e.trim()).filter(e => e);
      
      await reportService.createSchedule({
        report_type: reportId,
        format: format,
        frequency: scheduleData.frequency,
        recipients: recipients
      });
      
      toast.success('Report schedule created successfully');
      fetchSchedules();
      closeModal();
      setActiveTab('schedules');
    } catch (err) {
      toast.error('Failed to create report schedule');
    } finally {
      setLoading(prev => ({ ...prev, schedule_create: false }));
    }
  };

  const handleDeleteSchedule = async (id) => {
    if (!window.confirm('Are you sure you want to delete this schedule?')) return;
    try {
      await reportService.deleteSchedule(id);
      toast.success('Schedule deleted');
      fetchSchedules();
    } catch (err) {
      toast.error('Failed to delete schedule');
    }
  };

  const activeReport = reportTypes.find(r => r.id === modalConfig.reportId);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Reporting Engine</h1>
          <p className="text-text-muted mt-1">Generate and download comprehensive system reports in multiple formats.</p>
        </div>
      </div>

      <div className="flex border-b border-border-main mb-6">
        <button
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'generate'
              ? 'border-text-main text-text-main'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
          onClick={() => setActiveTab('generate')}
        >
          Generate Reports
        </button>
        <button
          className={`px-4 py-2 border-b-2 font-medium text-sm transition-colors ${
            activeTab === 'schedules'
              ? 'border-text-main text-text-main'
              : 'border-transparent text-text-muted hover:text-text-main'
          }`}
          onClick={() => setActiveTab('schedules')}
        >
          Scheduled Reports
        </button>
      </div>

      {activeTab === 'generate' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reportTypes.map((report) => (
            <div key={report.id} className="bg-surface rounded-lg border border-border-main p-6 flex flex-col h-full hover:border-blue-500/30 transition-colors">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
                  <FileText className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-text-main">{report.title}</h3>
                </div>
              </div>
              <p className="text-sm text-text-muted mb-6 flex-grow">{report.desc}</p>
              
              <div className="flex flex-col gap-2 mt-auto">
                <div className="grid grid-cols-3 gap-2">
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
                <Button 
                  variant="ghost" 
                  size="sm"
                  onClick={() => openModal(report.id, 'pdf', true)}
                  className="w-full mt-2 text-xs text-blue-500 hover:text-blue-400 bg-blue-500/5 hover:bg-blue-500/10"
                >
                  <Clock className="h-3 w-3 mr-2" />
                  Schedule Delivery (PDF)
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'schedules' && (
        <div className="bg-surface rounded-lg border border-border-main overflow-hidden">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 dark:bg-slate-900/50 border-b border-border-main">
                <th className="p-4 font-medium text-sm text-text-muted">Report Type</th>
                <th className="p-4 font-medium text-sm text-text-muted">Format</th>
                <th className="p-4 font-medium text-sm text-text-muted">Frequency</th>
                <th className="p-4 font-medium text-sm text-text-muted">Recipients</th>
                <th className="p-4 font-medium text-sm text-text-muted">Last Run</th>
                <th className="p-4 font-medium text-sm text-text-muted text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {schedules.length === 0 ? (
                <tr>
                  <td colSpan="6" className="p-8 text-center text-text-muted">
                    <div className="flex flex-col items-center">
                      <Calendar className="h-12 w-12 text-slate-300 dark:text-slate-700 mb-4" />
                      <p>No report schedules found.</p>
                      <Button variant="outline" className="mt-4" onClick={() => setActiveTab('generate')}>
                        Go Create One
                      </Button>
                    </div>
                  </td>
                </tr>
              ) : (
                schedules.map(sched => (
                  <tr key={sched.id} className="border-b border-border-main hover:bg-slate-50 dark:hover:bg-slate-800/50">
                    <td className="p-4 text-sm font-medium text-text-main">
                      {reportTypes.find(r => r.id === sched.report_type)?.title || sched.report_type}
                    </td>
                    <td className="p-4 text-sm text-text-muted uppercase">{sched.format}</td>
                    <td className="p-4 text-sm text-text-main capitalize">{sched.frequency}</td>
                    <td className="p-4 text-sm text-text-muted">
                      {Array.isArray(sched.recipients) ? sched.recipients.join(', ') : 'No recipients'}
                    </td>
                    <td className="p-4 text-sm text-text-muted">
                      {sched.last_run_at ? new Date(sched.last_run_at).toLocaleString() : 'Never'}
                    </td>
                    <td className="p-4 text-right">
                      <button 
                        onClick={() => handleDeleteSchedule(sched.id)}
                        className="p-2 text-red-500 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete Schedule"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Pre-Download Modal */}
      {activeReport && (
        <Modal 
          isOpen={modalConfig.isOpen} 
          onClose={closeModal}
          title={`Export ${activeReport.title}`}
        >
          <div className="space-y-6">
            <p className="text-sm text-text-muted">
              {modalConfig.isSchedule 
                ? `Configure the schedule parameters for the ${modalConfig.format?.toUpperCase()} report.`
                : `Configure parameters before generating your ${modalConfig.format?.toUpperCase()} report.`}
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
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-border-main">
                  <p className="text-sm text-text-muted">🏢 Building filter is not applicable for this report type.</p>
                </div>
              )}

              {activeReport.supportsTime && !modalConfig.isSchedule ? (
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
              ) : activeReport.supportsTime && modalConfig.isSchedule ? (
                <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                  <p className="text-sm text-blue-600 dark:text-blue-400">
                    The time range for scheduled reports is determined automatically by the schedule frequency (e.g., Weekly reports cover the past 7 days).
                  </p>
                </div>
              ) : (
                <div className="bg-slate-50 dark:bg-slate-900/50 p-4 rounded-lg border border-border-main">
                  <p className="text-sm text-text-muted">📅 Time range filter is not applicable for this report type.</p>
                </div>
              )}

              {modalConfig.isSchedule && (
                <div className="space-y-4 pt-4 border-t border-border-main">
                  <h4 className="font-medium text-sm text-text-main">Schedule Settings</h4>
                  <Select
                    label="Frequency"
                    value={scheduleData.frequency}
                    onChange={(e) => setScheduleData(prev => ({ ...prev, frequency: e.target.value }))}
                    options={[
                      { value: 'daily', label: 'Daily (Every 24h)' },
                      { value: 'weekly', label: 'Weekly (Every 7d)' },
                      { value: 'monthly', label: 'Monthly (Every 30d)' },
                    ]}
                  />
                  
                  <div className="space-y-1.5">
                    <label className="block text-sm font-medium text-text-main">
                      Recipients (comma separated emails)
                    </label>
                    <input
                      type="text"
                      className="w-full bg-surface border border-border-main rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:ring-2 focus:ring-blue-500/50"
                      placeholder="admin@example.com, user@example.com"
                      value={scheduleData.recipients}
                      onChange={(e) => setScheduleData(prev => ({ ...prev, recipients: e.target.value }))}
                    />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Button variant="outline" onClick={closeModal}>Cancel</Button>
              {modalConfig.isSchedule ? (
                <Button 
                  onClick={handleCreateSchedule}
                  disabled={loading.schedule_create || !scheduleData.recipients}
                >
                  {loading.schedule_create ? 'Saving...' : 'Save Schedule'}
                </Button>
              ) : (
                <Button 
                  onClick={handleDownload}
                  disabled={loading[`${modalConfig.reportId}_${modalConfig.format}`]}
                >
                  {loading[`${modalConfig.reportId}_${modalConfig.format}`] ? 'Generating...' : 'Generate Report'}
                </Button>
              )}
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default Reports;
