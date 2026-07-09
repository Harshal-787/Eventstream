import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Box } from '../../components/ui/Box';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { Building2, Cpu, AlertTriangle } from 'lucide-react';

export function UserDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const summary = await dashboardService.getSummary();
        setData(summary);
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <Spinner size="lg" />;
  
  if (error || !data) {
    return (
      <EmptyState 
        title="Dashboard Data Unavailable" 
        description="We could not retrieve your building summaries at this time." 
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-text-main)">My Buildings Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Box className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-(--color-text-main)">My Buildings</h3>
            <Building2 className="text-(--color-text-muted) w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-(--color-text-main)">{data.userBuildings || 0}</div>
        </Box>
        <Box className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-(--color-text-main)">Active Devices</h3>
            <Cpu className="text-(--color-text-muted) w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-(--color-text-main)">{data.activeDevices || 0}</div>
        </Box>
        <Box className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-semibold text-(--color-text-main)">Active Alerts</h3>
            <AlertTriangle className="text-red-500 w-5 h-5" />
          </div>
          <div className="text-3xl font-bold text-red-600">{data.activeAlerts || 0}</div>
        </Box>
      </div>
    </div>
  );
}
