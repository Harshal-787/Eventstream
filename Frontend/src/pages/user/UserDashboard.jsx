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
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase tracking-tight text-(--color-brutal-text) border-b-4 border-(--color-brutal-border) pb-4 inline-block pr-12">My Buildings Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <Box className="p-6 flex flex-col justify-between    transition-all">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-(--color-text-muted) max-w-[100px]">My Buildings</h3>
            <div className="bg-(--color-brutal-bg) p-2 border-2 border-(--color-brutal-border) shadow-md">
              <Building2 className="text-(--color-brutal-text) w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-(--color-brutal-text)">{data.userBuildings || 0}</div>
        </Box>
        <Box className="p-6 flex flex-col justify-between    transition-all">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-(--color-text-muted) max-w-[100px]">Active Devices</h3>
            <div className="bg-(--color-brutal-bg) p-2 border-2 border-(--color-brutal-border) shadow-md">
              <Cpu className="text-(--color-brutal-text) w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-(--color-brutal-text)">{data.activeDevices || 0}</div>
        </Box>
        <Box className="p-6 flex flex-col justify-between    transition-all">
          <div className="flex justify-between items-start mb-6">
            <h3 className="text-xs font-black uppercase tracking-widest text-(--color-text-muted) max-w-[100px]">Active Alerts</h3>
            <div className="bg-(--color-brutal-bg) p-2 border-2 border-(--color-brutal-border) shadow-md">
              <AlertTriangle className="text-red-500 w-5 h-5" />
            </div>
          </div>
          <div className="text-4xl font-black text-red-600">{data.activeAlerts || 0}</div>
        </Box>
      </div>
    </div>
  );
}
