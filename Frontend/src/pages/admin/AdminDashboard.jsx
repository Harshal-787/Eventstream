import React, { useEffect, useState } from 'react';
import { dashboardService } from '../../services/dashboardService';
import { Box } from '../../components/ui/Box';
import { EmptyState } from '../../components/ui/EmptyState';
import { Spinner } from '../../components/ui/Spinner';
import { Building2, Cpu, Activity, AlertTriangle } from 'lucide-react';

export function AdminDashboard() {
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
        description="The backend API for dashboard metrics is currently unreachable or under development." 
      />
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-text-main)">Platform Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Buildings" value={data.totalBuildings || 0} icon={Building2} />
        <StatCard title="Total Devices" value={data.totalDevices || 0} icon={Cpu} />
        <StatCard title="Events Received" value={data.totalEvents || 0} icon={Activity} />
        <StatCard title="Critical Alerts" value={data.criticalAlerts || 0} icon={AlertTriangle} className="text-red-600" />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, className }) {
  return (
    <Box className="p-6 flex items-center justify-between">
      <div>
        <p className="text-sm font-medium text-(--color-text-muted) mb-1">{title}</p>
        <p className={`text-3xl font-bold ${className || 'text-(--color-text-main)'}`}>{value}</p>
      </div>
      <div className="bg-(--color-background) p-3 rounded-none border border-(--color-border-main)">
        <Icon className={`w-6 h-6 text-(--color-text-muted) ${className || ''}`} />
      </div>
    </Box>
  );
}
