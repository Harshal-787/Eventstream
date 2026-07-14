import React, { useEffect, useState, useMemo } from 'react';
import { Spinner } from '../../../components/ui/Spinner';
import { Building2, Cpu, AlertTriangle, Activity, Wrench, CheckCircle } from 'lucide-react';
import { useTelemetry } from '../../../hooks/useTelemetry';
import { useLiveAlerts } from '../../alerts/hooks/useLiveAlerts';
import { useAuthStore } from '../../auth/store/useAuthStore';
import { deviceService } from '../../devices/services/deviceService';
import { buildingService } from '../../buildings/services/buildingService';
import { alertService } from '../../alerts/services/alertService';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, AreaChart, Area
} from 'recharts';
import { motion } from 'framer-motion';
import { SessionsList } from '../../auth/components/SessionsList';

const SENSOR_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
const STATUS_COLORS = { 'Online': '#10b981', 'Offline': '#ef4444' };

export function UserDashboard() {
  const { user } = useAuthStore();
  const [buildings, setBuildings] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);

  const { telemetry } = useTelemetry();
  const { liveAlerts, alertUpdates } = useLiveAlerts();
  const [acknowledgedIssues, setAcknowledgedIssues] = useState(new Set());

  const handleAcknowledgeIssue = (id) => {
      setAcknowledgedIssues(prev => {
          const next = new Set(prev);
          next.add(id);
          return next;
      });
  };

  const handleResolveIssue = async (issue) => {
      try {
          if (issue.type === 'offline') {
              await deviceService.updateDevice(issue.device_id, { status: 'active' });
          } else if (issue.type === 'battery') {
              await deviceService.updateDevice(issue.device_id, { battery_pct: 100 });
          }
          const dRes = await deviceService.getDevices();
          setDevices(dRes || []);
      } catch (err) {
          console.error("Failed to resolve issue:", err);
      }
  };

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bRes, dRes, aRes] = await Promise.all([
          buildingService.getBuildings(),
          deviceService.getDevices(),
          alertService.getAlerts()
        ]);
        setBuildings(bRes || []);
        setDevices(dRes || []);
        setAlerts(aRes || []);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  useEffect(() => {
    if (telemetry) {
      setLiveEvents(prev => {
        const tempVal = typeof telemetry.temperature === 'number' ? parseFloat(telemetry.temperature.toFixed(2)) : null;
        const humVal = typeof telemetry.humidity === 'number' ? parseFloat(telemetry.humidity.toFixed(2)) : null;
        const next = [...prev, { time: new Date().toLocaleTimeString(), temp: tempVal, hum: humVal }];
        if (next.length > 15) return next.slice(next.length - 15);
        return next;
      });
    }
  }, [telemetry]);

  const combinedAlerts = useMemo(() => {
    const all = [...liveAlerts, ...alerts];
    const unique = new Map();
    all.forEach(a => { if (!unique.has(a.id)) unique.set(a.id, a); });
    return Array.from(unique.values()).map(a => {
        if (alertUpdates[a.id]) return { ...a, status: alertUpdates[a.id] };
        return a;
    });
  }, [alerts, liveAlerts, alertUpdates]);

  const activeDevices = devices.filter(d => d.status === 'active').length;
  const criticalAlerts = combinedAlerts.filter(a => a.severity === 'critical' && a.status === 'open').length;
  const healthScore = devices.length === 0 ? 100 : Math.max(0, 100 - (criticalAlerts * 5) - (devices.filter(d => d.status === 'offline').length * 2));

  const sensorDist = useMemo(() => {
    const counts = {};
    devices.forEach(d => {
      const type = (d.type || 'Unknown').replace('_', ' ').toUpperCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [devices]);

  const severityTimeline = useMemo(() => {
    const dist = {};
    combinedAlerts.forEach(a => {
      const d = new Date(a.triggered_at);
      const hour = d.getHours() + ':00';
      if (!dist[hour]) dist[hour] = { time: hour, Critical: 0, Warning: 0 };
      if (a.severity === 'critical') dist[hour].Critical++;
      else dist[hour].Warning++;
    });
    return Object.values(dist).sort((a,b) => parseInt(a.time) - parseInt(b.time));
  }, [combinedAlerts]);

  const fleetStatus = useMemo(() => {
    let online = 0, offline = 0;
    devices.forEach(d => {
      if (d.status === 'offline') offline++;
      else online++;
    });
    return [
      { name: 'Online', value: online },
      { name: 'Offline', value: offline }
    ];
  }, [devices]);

  const maintenanceQueue = useMemo(() => {
      const issues = [];
      devices.forEach(d => {
          if (d.status === 'offline') {
              issues.push({ id: `off-${d.id}`, title: `${d.name || 'Device'} is Offline`, priority: 'High', loc: `Bldg ${d.building_id}`, type: 'offline', device_id: d.id });
          } else if (d.battery_pct !== null && d.battery_pct < 20) {
              issues.push({ id: `bat-${d.id}`, title: `Low Battery (${d.battery_pct}%) on ${d.name}`, priority: 'Medium', loc: `Bldg ${d.building_id}`, type: 'battery', device_id: d.id });
          }
      });
      return issues.slice(0, 5);
  }, [devices]);

  const sleekTooltip = { 
    borderRadius: '12px', 
    border: 'none', 
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
    padding: '12px', 
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-main)',
    fontWeight: 600
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans relative">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-(--color-border-main) pb-6">
        <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-(--color-text-main)">
              Facility Operations
            </h1>
            <p className="text-(--color-text-muted) font-medium flex items-center gap-2">
                Operator: <span className="font-bold text-(--color-text-main)">{user?.name}</span>
            </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Facilities" value={buildings.length} icon={Building2} />
        <StatCard title="Active Sensors" value={activeDevices} icon={Cpu} />
        <StatCard title="Critical Incidents" value={criticalAlerts} icon={AlertTriangle} isAlert={criticalAlerts > 0} />
        <StatCard title="Health Score" value={`${healthScore}%`} icon={Activity} />
      </div>

      {/* Analytics Grid - Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sensor Fleet Distribution */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h3 className="text-lg font-bold text-(--color-text-main) mb-6">Fleet Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sensorDist} innerRadius={60} outerRadius={90} paddingAngle={4} dataKey="value" nameKey="name" stroke="none">
                  {sensorDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENSOR_COLORS[index % SENSOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={sleekTooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Incident Severity Timeline */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h3 className="text-lg font-bold text-(--color-text-main) mb-6">Incident Timeline</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }} barSize={24}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 500}} axisLine={{stroke: 'var(--color-border-main)'}} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 500}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={sleekTooltip} cursor={{fill: 'var(--color-surface-hover)'}} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600 }} iconType="circle" />
                <Bar dataKey="Critical" stackId="a" fill="#ef4444" radius={[0, 0, 4, 4]} />
                <Bar dataKey="Warning" stackId="a" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Fleet Connectivity */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h3 className="text-lg font-bold text-(--color-text-main) mb-6">Fleet Connectivity</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fleetStatus} innerRadius={0} outerRadius={90} dataKey="value" nameKey="name" stroke="none">
                  {fleetStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={sleekTooltip} />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      {/* Main Layout - Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dual Axis Environmental Matrix */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="lg:col-span-2 p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h3 className="text-lg font-bold text-(--color-text-main) mb-6 flex items-center gap-2">
            Environmental Matrix <span className="px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-xs font-semibold ml-2">Live</span>
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={liveEvents} margin={{ top: 20, right: 20, bottom: 20, left: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} axisLine={{stroke: 'var(--color-border-main)'}} tickLine={false} minTickGap={30} dy={10} />
                <YAxis yAxisId="left" tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} axisLine={false} tickLine={false} orientation="left" stroke="#6366f1" />
                <YAxis yAxisId="right" tick={{fontSize: 12, fill: 'var(--color-text-muted)'}} axisLine={false} tickLine={false} orientation="right" stroke="#10b981" />
                <Tooltip contentStyle={sleekTooltip} />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '20px' }} iconType="circle" />
                <Bar yAxisId="left" dataKey="temp" name="Temperature (°C)" barSize={16} fill="#6366f1" radius={[4, 4, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="hum" name="Humidity (%)" stroke="#10b981" strokeWidth={3} dot={{ strokeWidth: 2, r: 4, fill: '#fff' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Maintenance Priority Queue */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm flex flex-col"
        >
          <h3 className="text-lg font-bold text-(--color-text-main) mb-6 flex items-center gap-2">
            <Wrench className="w-5 h-5 text-(--color-text-muted)" /> Maintenance Queue
          </h3>
          <div className="flex-1 overflow-y-auto pr-2 space-y-3 custom-scrollbar">
            {maintenanceQueue.length === 0 ? (
                <div className="h-40 flex flex-col items-center justify-center text-(--color-text-muted) border-2 border-dashed border-(--color-border-main) rounded-xl p-4 text-center">
                    <CheckCircle className="w-8 h-8 text-emerald-500 mb-2" />
                    <span className="font-semibold text-sm">All clear</span>
                    <span className="text-xs">No active issues detected</span>
                </div>
            ) : (
                maintenanceQueue.map(issue => {
                    const isAcked = acknowledgedIssues.has(issue.id);
                    return (
                    <div key={issue.id} className={`group relative p-4 rounded-xl border ${isAcked ? 'bg-slate-50 border-slate-200' : 'bg-white border-(--color-border-main) shadow-sm hover:border-indigo-200'} transition-all`}>
                        <div className="flex justify-between items-start mb-2">
                            <h4 className={`font-semibold text-sm flex items-center gap-2 ${isAcked ? 'text-slate-500' : 'text-(--color-text-main)'}`}>
                                {isAcked && <CheckCircle className="w-4 h-4 text-emerald-500" />}
                                {issue.title}
                            </h4>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${issue.priority === 'High' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                                {issue.priority}
                            </span>
                        </div>
                        <p className="text-xs text-(--color-text-muted) font-medium">{issue.loc}</p>
                        
                        {!isAcked && (
                          <div className="mt-4 pt-3 border-t border-(--color-border-main) flex items-center gap-2">
                            <button 
                                onClick={() => handleAcknowledgeIssue(issue.id)}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors"
                            >
                                Acknowledge
                            </button>
                            <button 
                                onClick={() => handleResolveIssue(issue)}
                                className="flex-1 px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 transition-colors"
                            >
                                Resolve
                            </button>
                          </div>
                        )}
                    </div>
                    );
                })
            )}
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 gap-6">
        <SessionsList />
      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, isAlert = false }) {
  return (
    <motion.div 
      whileHover={{ y: -4 }}
      className={`p-6 rounded-2xl border flex flex-col justify-between shadow-sm relative overflow-hidden ${isAlert ? 'bg-rose-50 border-rose-200' : 'bg-(--color-surface) border-(--color-border-main)'}`}
    >
      {isAlert && <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500 rounded-full blur-3xl opacity-10 -translate-y-1/2 translate-x-1/2 pointer-events-none" />}
      <div className="flex justify-between items-start mb-4 relative z-10">
        <p className={`text-sm font-semibold ${isAlert ? 'text-rose-800' : 'text-(--color-text-muted)'}`}>{title}</p>
        <div className={`p-2.5 rounded-xl ${isAlert ? 'bg-rose-100 text-rose-600' : 'bg-indigo-50 text-indigo-600'}`}>
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
      <div className="relative z-10">
        <p className={`text-3xl font-heading font-extrabold ${isAlert ? 'text-rose-900' : 'text-(--color-text-main)'}`}>{value}</p>
      </div>
    </motion.div>
  );
}
