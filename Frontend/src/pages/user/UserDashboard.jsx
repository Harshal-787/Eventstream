import React, { useEffect, useState, useMemo } from 'react';
import { Box } from '../../components/ui/Box';
import { Spinner } from '../../components/ui/Spinner';
import { Building2, Cpu, AlertTriangle, Activity, Wrench, ArrowRight } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';
import { useLiveAlerts } from '../../hooks/useLiveAlerts';
import { useAuthStore } from '../../store/useAuthStore';
import { deviceService } from '../../services/deviceService';
import { buildingService } from '../../services/buildingService';
import { alertService } from '../../services/alertService';
import {
  ComposedChart, Line, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, AreaChart, Area
} from 'recharts';

const SENSOR_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#6366f1'];
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

  // Live telemetry for User Dual-Axis Chart
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

  // --- NEW ANALYTICS ---

  // 1. Sensor Fleet Distribution (Donut Chart)
  const sensorDist = useMemo(() => {
    const counts = {};
    devices.forEach(d => {
      const type = (d.type || 'Unknown').replace('_', ' ').toUpperCase();
      counts[type] = (counts[type] || 0) + 1;
    });
    return Object.keys(counts).map(k => ({ name: k, value: counts[k] }));
  }, [devices]);

  // 2. Alert Severity Timeline (Stacked Bar Chart)
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

  // 3. Fleet Status (Donut Chart)
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

  // --- END NEW ANALYTICS ---

  const maintenanceQueue = useMemo(() => {
      const issues = [];
      devices.forEach(d => {
          if (d.status === 'offline') {
              issues.push({ id: `off-${d.id}`, title: `${d.name || 'Device'} is Offline`, priority: 'High', loc: `Bldg ${d.building_id}` });
          } else if (d.battery_pct !== null && d.battery_pct < 20) {
              issues.push({ id: `bat-${d.id}`, title: `Low Battery (${d.battery_pct}%) on ${d.name}`, priority: 'Medium', loc: `Bldg ${d.building_id}` });
          }
      });
      return issues.slice(0, 5);
  }, [devices]);

  const brutalTooltip = { border: '2px solid var(--color-brutal-border)', borderRadius: 0, fontWeight: 'bold', backgroundColor: 'white', color: 'var(--color-brutal-text)', boxShadow: '4px 4px 0px 0px var(--color-brutal-border)' };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-[var(--color-brutal-border)] pb-6">
        <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[var(--color-brutal-text)]">
              Facility Ops
            </h1>
            <p className="text-[var(--color-brutal-text)] font-bold mt-2 tracking-wide uppercase border-2 border-[var(--color-brutal-border)] inline-block px-3 py-1 bg-[var(--color-brutal-bg)] shadow-[2px_2px_0px_0px_var(--color-brutal-border)]">
                Operator: {user?.name}
            </p>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Facilities" value={buildings.length} icon={Building2} bg="bg-white" />
        <StatCard title="Active Sensors" value={activeDevices} icon={Cpu} bg="bg-white" />
        <StatCard title="Critical Incidents" value={criticalAlerts} icon={AlertTriangle} bg={criticalAlerts > 0 ? "bg-red-50 text-red-900" : "bg-white"} />
        <StatCard title="Health Score" value={`${healthScore}%`} icon={Activity} bg={healthScore > 90 ? "bg-white" : healthScore > 70 ? "bg-yellow-50 text-yellow-900" : "bg-red-50 text-red-900"} />
      </div>

      {/* Analytics Grid - Top Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Sensor Fleet Distribution */}
        <Box className="p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-4 tracking-tighter text-[var(--color-brutal-text)]">Fleet Distribution</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={sensorDist} innerRadius={50} outerRadius={90} paddingAngle={2} dataKey="value" nameKey="name" stroke="var(--color-brutal-border)" strokeWidth={2}>
                  {sensorDist.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={SENSOR_COLORS[index % SENSOR_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={brutalTooltip} />
                <Legend iconType="square" wrapperStyle={{ fontWeight: 900, fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Box>

        {/* Incident Severity Timeline */}
        <Box className="p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-4 tracking-tighter text-[var(--color-brutal-text)]">Incident Timeline</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={severityTimeline} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--color-border-main)" vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} tickLine={false} />
                <Tooltip contentStyle={brutalTooltip} />
                <Legend wrapperStyle={{ fontWeight: 900, fontSize: '12px' }} iconType="square" />
                <Bar dataKey="Critical" stackId="a" fill="#ef4444" stroke="var(--color-brutal-border)" strokeWidth={2} />
                <Bar dataKey="Warning" stackId="a" fill="#f59e0b" stroke="var(--color-brutal-border)" strokeWidth={2} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Box>

        {/* Fleet Connectivity */}
        <Box className="p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-4 tracking-tighter text-[var(--color-brutal-text)]">Fleet Connectivity</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={fleetStatus} innerRadius={0} outerRadius={90} dataKey="value" nameKey="name" stroke="var(--color-brutal-border)" strokeWidth={2}>
                  {fleetStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                  ))}
                </Pie>
                <Tooltip contentStyle={brutalTooltip} />
                <Legend iconType="square" wrapperStyle={{ fontWeight: 900, fontSize: '12px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Box>

      </div>

      {/* Main Layout - Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Dual Axis Environmental Matrix */}
        <Box className="lg:col-span-2 p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-6 tracking-tighter text-[var(--color-brutal-text)] flex items-center gap-2">
            Environmental Matrix (Live)
          </h3>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={liveEvents} margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--color-border-main)" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} tickLine={false} minTickGap={30} />
                <YAxis yAxisId="left" tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} orientation="left" stroke="#3b82f6" />
                <YAxis yAxisId="right" tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} orientation="right" stroke="#f59e0b" />
                <Tooltip contentStyle={brutalTooltip} />
                <Legend wrapperStyle={{ fontWeight: 900, paddingTop: '20px' }} iconType="square" />
                <Bar yAxisId="left" dataKey="temp" name="Temperature (°C)" barSize={20} fill="#3b82f6" stroke="var(--color-brutal-border)" strokeWidth={2} />
                <Line yAxisId="right" type="step" dataKey="hum" name="Humidity (%)" stroke="#f59e0b" strokeWidth={4} dot={{ strokeWidth: 2, r: 4, fill: 'white' }} />
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </Box>

        {/* Maintenance Priority Queue */}
        <Box className="p-6 bg-white flex flex-col transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-6 tracking-tighter flex items-center gap-2 text-[var(--color-brutal-text)]">
            <Wrench size={24} /> Maint. Priority
          </h3>
          <div className="flex-1 overflow-y-auto pr-2">
            {maintenanceQueue.length === 0 ? (
                <div className="h-full flex items-center justify-center font-bold text-[var(--color-text-muted)] border-4 border-dashed border-[var(--color-border-main)] uppercase tracking-widest text-sm p-4 text-center">
                    No active issues detected
                </div>
            ) : (
                <div className="space-y-4">
                    {maintenanceQueue.map(issue => (
                        <div key={issue.id} className="relative group border-2 border-[var(--color-brutal-border)] p-4 bg-white overflow-hidden shadow-[2px_2px_0px_0px_var(--color-brutal-border)]">
                            <div className="flex justify-between items-start mb-2 relative z-10">
                                <h4 className="font-black text-sm uppercase text-[var(--color-brutal-text)] pr-12">{issue.title}</h4>
                                <span className={`absolute top-0 right-0 text-[10px] font-black px-2 py-0.5 border-l-2 border-b-2 border-[var(--color-brutal-border)] uppercase bg-white ${issue.priority === 'High' ? 'text-red-600' : 'text-yellow-600'}`}>
                                    {issue.priority}
                                </span>
                            </div>
                            <p className="text-xs font-bold text-[var(--color-text-muted)] relative z-10">{issue.loc}</p>
                            
                            {/* Hover Overlay */}
                            <div className="absolute inset-0 bg-yellow-300 translate-y-full group-hover:translate-y-0 transition-transform duration-300 flex items-center justify-center border-t-2 border-[var(--color-brutal-border)] z-20 cursor-pointer">
                                <span className="font-black uppercase flex items-center gap-2 text-black">Dispatch Team <ArrowRight size={16}/></span>
                            </div>
                        </div>
                    ))}
                </div>
            )}
          </div>
        </Box>

      </div>
    </div>
  );
}

function StatCard({ title, value, icon: Icon, bg }) {
  return (
    <Box className={`p-6 flex flex-col justify-between transition-transform duration-300 hover:-translate-y-1 hover:shadow-xl ${bg}`}>
      <div className="flex justify-between items-start mb-6">
        <p className="text-sm font-black uppercase tracking-widest text-[var(--color-text-muted)] max-w-[120px]">{title}</p>
        <div className="bg-[var(--color-brutal-bg)] p-3 border-2 border-[var(--color-brutal-border)] shadow-[2px_2px_0px_0px_var(--color-brutal-border)]">
          <Icon className="w-6 h-6 text-[var(--color-brutal-text)]" />
        </div>
      </div>
      <div>
        <p className="text-5xl font-black text-[var(--color-brutal-text)] tracking-tight drop-shadow-[2px_2px_0px_var(--color-surface)]">{value}</p>
      </div>
    </Box>
  );
}
