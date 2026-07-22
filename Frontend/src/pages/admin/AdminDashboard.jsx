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
    <div className="space-y-8">
      <h1 className="text-3xl font-black uppercase tracking-tight text-(--color-brutal-text) border-b-4 border-(--color-brutal-border) pb-4 inline-block pr-12">Platform Overview</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
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
    <Box className="p-6 flex flex-col justify-between    transition-all">
      <div className="flex justify-between items-start mb-6">
        <p className="text-xs font-black uppercase tracking-widest text-(--color-text-muted) max-w-[100px]">{title}</p>
        <div className="bg-(--color-brutal-bg) p-2 border-2 border-(--color-brutal-border) shadow-md">
          <Icon className={`w-5 h-5 text-(--color-brutal-text) ${className || ''}`} />
        </div>
      </div>
      <div>
        <p className={`text-4xl font-black ${className || 'text-(--color-brutal-text)'}`}>{value}</p>
      </div>
    </Box>
  );
}
