import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { FileText, Download } from 'lucide-react';
import reportService from '../../../services/reportService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';

const Reports = () => {
  const [deviceId, setDeviceId] = useState('');
  const [buildingId, setBuildingId] = useState('');
  const [loading, setLoading] = useState({ telemetry: false, building: false });

  const handleDownloadTelemetry = async (e) => {
    e.preventDefault();
    if (!deviceId) return;
    try {
      setLoading(prev => ({ ...prev, telemetry: true }));
      const data = await reportService.downloadTelemetryCSV(deviceId);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `telemetry_device_${deviceId}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error('Failed to download telemetry report');
    } finally {
      setLoading(prev => ({ ...prev, telemetry: false }));
    }
  };

  const handleDownloadBuilding = async (e) => {
    e.preventDefault();
    if (!buildingId) return;
    try {
      setLoading(prev => ({ ...prev, building: true }));
      const data = await reportService.downloadBuildingHealthPDF(buildingId);
      const url = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `building_health_${buildingId}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Report downloaded successfully');
    } catch (err) {
      toast.error('Failed to download building report');
    } finally {
      setLoading(prev => ({ ...prev, building: false }));
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-(--color-text-main)">Reporting Engine</h1>
        <p className="text-(--color-text-muted) mt-1">Generate and download data extracts for analytics or audits.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Telemetry Report Card */}
        <div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-blue-500/10 rounded-lg text-blue-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-(--color-text-main)">Telemetry Extract (CSV)</h3>
              <p className="text-sm text-(--color-text-muted)">Download recent raw telemetry for a specific device.</p>
            </div>
          </div>
          <form onSubmit={handleDownloadTelemetry} className="mt-auto space-y-4">
            <Input 
              label="Device ID"
              type="number"
              value={deviceId}
              onChange={(e) => setDeviceId(e.target.value)}
              placeholder="Enter device ID (e.g. 1)"
              required
            />
            <Button type="submit" disabled={loading.telemetry} className="w-full flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              {loading.telemetry ? 'Generating...' : 'Download CSV'}
            </Button>
          </form>
        </div>

        {/* Building Health Report Card */}
        <div className="bg-(--color-surface) rounded-lg border border-(--color-border) p-6 flex flex-col h-full">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-3 bg-purple-500/10 rounded-lg text-purple-400">
              <FileText className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-(--color-text-main)">Building Health (PDF)</h3>
              <p className="text-sm text-(--color-text-muted)">Executive summary of device health and battery across a building.</p>
            </div>
          </div>
          <form onSubmit={handleDownloadBuilding} className="mt-auto space-y-4">
            <Input 
              label="Building ID"
              type="number"
              value={buildingId}
              onChange={(e) => setBuildingId(e.target.value)}
              placeholder="Enter building ID (e.g. 1)"
              required
            />
            <Button type="submit" disabled={loading.building} className="w-full flex items-center justify-center gap-2">
              <Download className="h-4 w-4" />
              {loading.building ? 'Generating...' : 'Download PDF'}
            </Button>
          </form>
        </div>

      </div>
    </div>
  );
};

export default Reports;
