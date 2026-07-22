import React, { useEffect, useState, useMemo } from 'react';
import { Spinner } from '../../../components/ui/Spinner';
import { Building2, Cpu, AlertTriangle, Radio, Server, Clock, Activity, Battery, Wifi } from 'lucide-react';
import { useTelemetry } from '../../../hooks/useTelemetry';
import { useLiveAlerts } from '../../alerts/hooks/useLiveAlerts';
import { deviceService } from '../../devices/services/deviceService';
import { buildingService } from '../../buildings/services/buildingService';
import { alertService } from '../../alerts/services/alertService';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis,
  Legend
} from 'recharts';
import { motion } from 'framer-motion';
import { SessionsList } from '../../auth/components/SessionsList';
import { failedEventsService } from '../services/failedEventsService';
import { BuildingMap } from '../components/BuildingMap';

const STATUS_COLORS = { open: '#ef4444', acknowledged: '#f59e0b', resolved: '#10b981' };
const BATTERY_COLORS = { Good: '#10b981', Low: '#f59e0b', Critical: '#ef4444' };
const SIGNAL_COLORS = { Strong: '#6366f1', Fair: '#06b6d4', Weak: '#ef4444', Offline: '#94a3b8' };

export function AdminDashboard() {
  const [buildings, setBuildings] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [failedEvents, setFailedEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);

  // Live SSE
  const { telemetry, isConnected } = useTelemetry();
  const { liveAlerts, alertUpdates } = useLiveAlerts();

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [bRes, dRes, aRes, fRes] = await Promise.all([
          buildingService.getBuildings(),
          deviceService.getDevices(),
          alertService.getAlerts(),
          failedEventsService.getFailedEvents(1, 5) // Fetch 5 most recent for widget
        ]);
        setBuildings(bRes || []);
        setDevices(dRes || []);
        setAlerts(aRes || []);
        setFailedEvents(fRes.data || []);
      } catch (err) {
        console.error("Error fetching dashboard data", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  // Track live telemetry for a rolling sparkline
  useEffect(() => {
    if (telemetry) {
      setLiveEvents(prev => {
        const tempVal = typeof telemetry.temperature === 'number' ? parseFloat(telemetry.temperature.toFixed(2)) : 0;
        const humVal = typeof telemetry.humidity === 'number' ? parseFloat(telemetry.humidity.toFixed(2)) : 0;
        const next = [...prev, { time: new Date().toLocaleTimeString(), temp: tempVal, hum: humVal }];
        if (next.length > 20) return next.slice(next.length - 20);
        return next;
      });
    }
  }, [telemetry]);

  // Merge live alerts
  const combinedAlerts = useMemo(() => {
    const all = [...liveAlerts, ...alerts];
    const unique = new Map();
    all.forEach(a => {
        if (!unique.has(a.id)) unique.set(a.id, a);
    });
    return Array.from(unique.values()).map(a => {
        if (alertUpdates[a.id]) return { ...a, status: alertUpdates[a.id] };
        return a;
    });
  }, [alerts, liveAlerts, alertUpdates]);

  // Derived Metrics
  const activeDevices = devices.filter(d => d.status === 'active').length;
  const offlineDevices = devices.filter(d => d.status === 'offline').length;
  const criticalAlerts = combinedAlerts.filter(a => a.severity === 'critical' && a.status === 'open').length;
  const uptimePercentage = devices.length === 0 ? 100 : (((devices.length - offlineDevices) / devices.length) * 100).toFixed(2);
  
  const avgResTime = useMemo(() => {
    const resolved = combinedAlerts.filter(a => a.status === 'resolved' && a.triggered_at && a.resolved_at);
    if (resolved.length === 0) return 'N/A';
    const totalMs = resolved.reduce((acc, a) => acc + (new Date(a.resolved_at) - new Date(a.triggered_at)), 0);
    const avgMins = (totalMs / resolved.length) / 60000;
    if (avgMins < 60) return `${Math.round(avgMins)}m`;
    return `${(avgMins / 60).toFixed(1)}h`;
  }, [combinedAlerts]);

  // Chart Data: Alert Status Breakdown (Donut)
  const alertStatusDist = useMemo(() => {
    const dist = { open: 0, acknowledged: 0, resolved: 0 };
    combinedAlerts.forEach(a => { if (dist[a.status] !== undefined) dist[a.status]++ });
    return Object.keys(dist).map(key => ({ name: key, value: dist[key] }));
  }, [combinedAlerts]);

  // Chart Data: Battery & Signal Health (Bar)
  const deviceHealthDist = useMemo(() => {
    const batDist = { Good: 0, Low: 0, Critical: 0 };
    const sigDist = { Strong: 0, Fair: 0, Weak: 0, Offline: 0 };

    devices.forEach(d => {
      // Battery
      const pct = d.battery_pct !== null && d.battery_pct !== undefined ? d.battery_pct : 100;
      if (pct > 50) batDist.Good++;
      else if (pct > 20) batDist.Low++;
      else batDist.Critical++;

      // Signal
      const sig = d.signal_strength || 'Fair'; // Mock if null
      if (d.status === 'offline') sigDist.Offline++;
      else if (sig === 'Strong' || sig === 'Excellent') sigDist.Strong++;
      else if (sig === 'Fair' || sig === 'Good') sigDist.Fair++;
      else sigDist.Weak++;
    });

    return {
      battery: Object.keys(batDist).map(k => ({ name: k, value: batDist[k] })),
      signal: Object.keys(sigDist).map(k => ({ name: k, value: sigDist[k] }))
    };
  }, [devices]);

  // Chart Data: Anomaly Radar
  const anomalyRadar = useMemo(() => {
    const dist = { 'Temp': 0, 'Humid': 0, 'Motion': 0, 'Smoke': 0, 'Power': 0, 'Water': 0, 'Air': 0 };
    combinedAlerts.forEach(a => {
      const t = (a.type || '').toLowerCase();
      if (t.includes('temp')) dist['Temp']++;
      else if (t.includes('humid')) dist['Humid']++;
      else if (t.includes('motion')) dist['Motion']++;
      else if (t.includes('smoke') || t.includes('fire')) dist['Smoke']++;
      else if (t.includes('power')) dist['Power']++;
      else if (t.includes('leak') || t.includes('water')) dist['Water']++;
      else if (t.includes('air')) dist['Air']++;
    });
    return Object.keys(dist).map(key => ({ subject: key, incidents: dist[key], fullMark: Math.max(...Object.values(dist)) || 10 }));
  }, [combinedAlerts]);

  // Chart Data: Alert Frequency Timeline
  const alertTimeline = useMemo(() => {
    const dist = {};
    combinedAlerts.forEach(a => {
      const d = new Date(a.triggered_at);
      const hour = d.getHours() + ':00';
      dist[hour] = (dist[hour] || 0) + 1;
    });
    const sortedKeys = Object.keys(dist).sort((a,b) => parseInt(a) - parseInt(b));
    return sortedKeys.map(key => ({ time: key, count: dist[key] }));
  }, [combinedAlerts]);

  const sleekTooltip = { 
    borderRadius: '12px', 
    border: 'none', 
    boxShadow: '0 10px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)', 
    padding: '12px', 
    backgroundColor: 'var(--color-surface)',
    color: 'var(--color-text-main)',
    fontWeight: 600,
    fontSize: '12px'
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-(--color-border-main) pb-6 gap-4">
        <div className="space-y-2">
            <h1 className="text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-(--color-text-main)">
              Global Command
            </h1>
            <p className="text-(--color-text-muted) font-medium flex items-center gap-2">
                Administration Engine
            </p>
        </div>
        
        <div className={`px-4 py-2 rounded-full font-bold text-xs flex items-center gap-2 shadow-sm ${isConnected ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-rose-50 text-rose-700 border border-rose-200'}`}>
          <Radio className={`w-4 h-4 ${isConnected ? 'animate-pulse text-emerald-500' : ''}`} />
          {isConnected ? 'LIVE FEED ACTIVE' : 'STREAM OFFLINE'}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Facilities" value={buildings.length} icon={Building2} />
        <StatCard title="Global Uptime" value={`${uptimePercentage}%`} icon={Server} isAlert={uptimePercentage < 98} />
        <StatCard title="Critical Events" value={criticalAlerts} icon={AlertTriangle} isAlert={criticalAlerts > 0} />
        <StatCard title="Avg Response" value={avgResTime} icon={Clock} />
      </div>

      {/* Main Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Anomaly Radar */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h3 className="text-lg font-bold mb-4 text-(--color-text-main)">Anomaly Vector</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="65%" data={anomalyRadar}>
                <PolarGrid stroke="var(--color-border-main)" />
                <PolarAngleAxis dataKey="subject" tick={{fontSize: 11, fill: 'var(--color-text-muted)', fontWeight: 600}} />
                <Radar name="Incidents" dataKey="incidents" stroke="#6366f1" strokeWidth={2} fill="#818cf8" fillOpacity={0.4} />
                <Tooltip contentStyle={sleekTooltip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Alert Status Breakdown */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h3 className="text-lg font-bold mb-4 text-(--color-text-main)">Alert Status</h3>
          <div className="h-[280px]">
            {combinedAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-(--color-text-muted) font-medium text-sm text-center bg-slate-50 p-4 rounded-xl border border-slate-100">No Incidents Recorded</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={alertStatusDist} innerRadius={70} outerRadius={100} paddingAngle={4} dataKey="value" nameKey="name" stroke="none" label={{fontSize: 11, fontWeight: 600, fill: 'var(--color-text-muted)'}}>
                    {alertStatusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#cbd5e1'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={sleekTooltip} />
                  <Legend iconType="circle" wrapperStyle={{ fontSize: '12px', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'capitalize' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </motion.div>

        {/* Battery & Signal Health Stacked */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm flex flex-col gap-6"
        >
            <h3 className="text-lg font-bold mb-2 text-(--color-text-main)">Hardware Vitals</h3>
            
            {/* Battery Mini-Bar */}
            <div className="flex-1">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-sm flex items-center gap-2 text-(--color-text-main)"><Battery size={16} className="text-indigo-500"/> Power Reserves</span>
                </div>
                <div className="h-6 flex rounded-full w-full overflow-hidden shadow-inner">
                    {deviceHealthDist.battery.map(b => (
                        b.value > 0 && <div key={b.name} style={{width: `${(b.value/devices.length)*100}%`, backgroundColor: BATTERY_COLORS[b.name]}} className="h-full flex items-center justify-center font-bold text-[10px] text-white/90" title={`${b.name}: ${b.value}`}>
                            {b.value > (devices.length * 0.1) ? b.value : ''}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs font-semibold text-(--color-text-muted)">
                    {deviceHealthDist.battery.map(b => (
                        <div key={b.name} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: BATTERY_COLORS[b.name]}}></div>{b.name}</div>
                    ))}
                </div>
            </div>

            {/* Signal Mini-Bar */}
            <div className="flex-1">
                <div className="flex justify-between items-center mb-3">
                    <span className="font-semibold text-sm flex items-center gap-2 text-(--color-text-main)"><Wifi size={16} className="text-sky-500"/> Connectivity</span>
                </div>
                <div className="h-6 flex rounded-full w-full overflow-hidden shadow-inner">
                    {deviceHealthDist.signal.map(s => (
                        s.value > 0 && <div key={s.name} style={{width: `${(s.value/devices.length)*100}%`, backgroundColor: SIGNAL_COLORS[s.name]}} className="h-full flex items-center justify-center font-bold text-[10px] text-white/90" title={`${s.name}: ${s.value}`}>
                            {s.value > (devices.length * 0.1) ? s.value : ''}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-3 text-xs font-semibold text-(--color-text-muted)">
                    {deviceHealthDist.signal.map(s => (
                        <div key={s.name} className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full" style={{backgroundColor: SIGNAL_COLORS[s.name]}}></div>{s.name}</div>
                    ))}
                </div>
            </div>
        </motion.div>
      </div>

      {/* Building Map Full Width Row */}
      <div className="grid grid-cols-1 gap-6">
        <BuildingMap />
      </div>

      {/* Main Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Incident Volume History */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h3 className="text-lg font-bold mb-6 text-(--color-text-main)">Incident Volume Timeline</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={alertTimeline} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" vertical={false} opacity={0.5} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 500}} axisLine={false} tickLine={false} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 500}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={sleekTooltip} />
                <Area type="monotone" dataKey="count" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Live Telemetry Pulse */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-(--color-text-main)">Live Telemetry Pulse</h3>
            <span className="flex items-center gap-1.5 text-xs font-bold bg-indigo-50 text-indigo-600 rounded-full px-3 py-1 border border-indigo-100">
                <Activity size={14}/> REAL-TIME
            </span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveEvents} margin={{ top: 10, right: 30, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorTemp" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" strokeOpacity={0.5} vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 500}} axisLine={false} tickLine={false} minTickGap={30} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 12, fill: 'var(--color-text-muted)', fontWeight: 500}} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={sleekTooltip} />
                <Area type="monotone" dataKey="temp" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorTemp)" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SessionsList />
        
        {/* Failed Events Widget */}
        <motion.div 
          whileHover={{ y: -4 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm flex flex-col"
        >
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-lg font-bold text-(--color-text-main) flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-rose-500" />
              Recent Failed Events
            </h3>
            <span className="flex items-center gap-1.5 text-xs font-bold bg-rose-50 text-rose-600 rounded-full px-3 py-1 border border-rose-100 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20">
              <Activity size={14}/> {failedEvents.length > 0 ? 'NEEDS ATTENTION' : 'ALL CLEAR'}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            {failedEvents.length === 0 ? (
               <div className="flex flex-col items-center justify-center h-full text-(--color-text-muted) py-8">
                 <div className="w-12 h-12 bg-slate-50 dark:bg-(--color-surface-hover) rounded-full flex items-center justify-center mb-3">
                   <Server className="w-6 h-6 opacity-50" />
                 </div>
                 <p className="text-sm font-medium">No failed events logged.</p>
               </div>
            ) : (
              <div className="space-y-3">
                {failedEvents.map(event => (
                  <div key={event.id} className="p-3 bg-slate-50 dark:bg-(--color-surface-hover) rounded-xl border border-(--color-border-main) text-sm">
                    <div className="flex justify-between items-start mb-1">
                      <span className="font-bold text-rose-600 dark:text-rose-400">{event.error_reason}</span>
                      <span className="text-xs font-semibold text-(--color-text-muted)">
                        {new Date(event.attempted_at).toLocaleString([], { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <div className="font-mono text-xs text-(--color-text-muted) break-all line-clamp-2">
                      {typeof event.payload === 'object' ? JSON.stringify(event.payload) : event.payload}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
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
        <div className={`p-2.5 rounded-xl ${isAlert ? 'bg-rose-100 text-rose-600' : 'bg-slate-100 dark:bg-(--color-surface-hover) text-(--color-text-main)'}`}>
          <Icon className="w-5 h-5" strokeWidth={2.5} />
        </div>
      </div>
      <div className="relative z-10">
        <p className={`text-3xl font-heading font-extrabold ${isAlert ? 'text-rose-900' : 'text-(--color-text-main)'}`}>{value}</p>
      </div>
    </motion.div>
  );
}
