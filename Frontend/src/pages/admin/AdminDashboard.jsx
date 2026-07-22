import React, { useEffect, useState, useMemo } from 'react';
import { Box } from '../../components/ui/Box';
import { Spinner } from '../../components/ui/Spinner';
import { Building2, Cpu, AlertTriangle, Radio, Server, Clock, Activity, Battery, Wifi } from 'lucide-react';
import { useTelemetry } from '../../hooks/useTelemetry';
import { useLiveAlerts } from '../../hooks/useLiveAlerts';
import { deviceService } from '../../services/deviceService';
import { buildingService } from '../../services/buildingService';
import { alertService } from '../../services/alertService';
import {
  PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  AreaChart, Area, CartesianGrid, Radar, RadarChart, PolarGrid, PolarAngleAxis,
  ComposedChart, Line, Legend
} from 'recharts';

const STATUS_COLORS = { open: '#ef4444', acknowledged: '#f59e0b', resolved: '#10b981' };
const BATTERY_COLORS = { Good: '#10b981', Low: '#f59e0b', Critical: '#ef4444' };
const SIGNAL_COLORS = { Strong: '#3b82f6', Fair: '#06b6d4', Weak: '#ef4444', Offline: '#6b7280' };

export function AdminDashboard() {
  const [buildings, setBuildings] = useState([]);
  const [devices, setDevices] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [liveEvents, setLiveEvents] = useState([]);

  // Live SSE
  const { telemetry, isConnected } = useTelemetry();
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

  const brutalTooltip = { border: '2px solid var(--color-brutal-border)', borderRadius: 0, fontWeight: 'bold', backgroundColor: 'white', color: 'var(--color-brutal-text)', boxShadow: '4px 4px 0px 0px var(--color-brutal-border)' };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between border-b-2 border-[var(--color-brutal-border)] pb-6">
        <div>
            <h1 className="text-5xl font-black uppercase tracking-tighter text-[var(--color-brutal-text)]">
              Global Command
            </h1>
            <p className="text-[var(--color-brutal-text)] font-bold mt-2 tracking-wide uppercase border-2 border-[var(--color-brutal-border)] inline-block px-3 py-1 bg-[var(--color-brutal-bg)] shadow-[2px_2px_0px_0px_var(--color-brutal-border)]">
                Analytics Engine
            </p>
        </div>
        
        <div className={`mt-4 md:mt-0 px-6 py-3 border-2 border-[var(--color-brutal-border)] font-black flex items-center gap-3 shadow-[4px_4px_0px_0px_var(--color-brutal-border)] ${isConnected ? 'bg-green-300 text-black' : 'bg-red-300 text-black'}`}>
          <Radio className={`w-6 h-6 ${isConnected ? 'animate-pulse' : ''}`} />
          {isConnected ? 'LIVE FEED ACTIVE' : 'STREAM OFFLINE'}
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Facilities" value={buildings.length} icon={Building2} bg="bg-white" />
        <StatCard title="Uptime" value={`${uptimePercentage}%`} icon={Server} bg="bg-white" />
        <StatCard title="Critical" value={criticalAlerts} icon={AlertTriangle} bg={criticalAlerts > 0 ? "bg-red-50 text-red-900" : "bg-white"} />
        <StatCard title="Avg Response" value={avgResTime} icon={Clock} bg="bg-white" />
      </div>

      {/* Main Charts Grid Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Anomaly Radar */}
        <Box className="p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-4 tracking-tighter text-[var(--color-brutal-text)]">Anomaly Vector</h3>
          <div className="h-[280px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="70%" data={anomalyRadar}>
                <PolarGrid stroke="var(--color-brutal-border)" strokeWidth={2} />
                <PolarAngleAxis dataKey="subject" tick={{fontSize: 12, fill: 'var(--color-brutal-text)', fontWeight: 900}} />
                <Radar name="Incidents" dataKey="incidents" stroke="var(--color-brutal-border)" strokeWidth={4} fill="#8b5cf6" fillOpacity={0.8} />
                <Tooltip contentStyle={brutalTooltip} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </Box>

        {/* Alert Status Breakdown */}
        <Box className="p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-4 tracking-tighter text-[var(--color-brutal-text)]">Alert Status</h3>
          <div className="h-[280px]">
            {combinedAlerts.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <p className="text-(--color-text-muted) font-black tracking-widest uppercase text-center mt-12">No Incidents</p>
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={alertStatusDist} innerRadius={60} outerRadius={110} paddingAngle={0} dataKey="value" nameKey="name" stroke="var(--color-brutal-border)" strokeWidth={3} label={{fontWeight: 900, fill: 'var(--color-brutal-text)'}}>
                    {alertStatusDist.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={STATUS_COLORS[entry.name] || '#ccc'} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={brutalTooltip} />
                  <Legend iconType="square" wrapperStyle={{ fontWeight: 900, textTransform: 'uppercase' }} />
                </PieChart>
              </ResponsiveContainer>
            )}
          </div>
        </Box>

        {/* Battery & Signal Health Stacked */}
        <Box className="p-6 bg-white flex flex-col gap-6 transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
            <h3 className="text-xl font-black uppercase mb-2 tracking-tighter text-[var(--color-brutal-text)]">Hardware Vitals</h3>
            
            {/* Battery Mini-Bar */}
            <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold flex items-center gap-2 text-[var(--color-brutal-text)]"><Battery size={16}/> Power</span>
                </div>
                <div className="h-12 flex border-2 border-[var(--color-brutal-border)] w-full overflow-hidden shadow-[2px_2px_0px_0px_var(--color-brutal-border)]">
                    {deviceHealthDist.battery.map(b => (
                        b.value > 0 && <div key={b.name} style={{width: `${(b.value/devices.length)*100}%`, backgroundColor: BATTERY_COLORS[b.name]}} className="h-full flex items-center justify-center font-bold text-xs border-r-2 border-[var(--color-brutal-border)] last:border-r-0" title={`${b.name}: ${b.value}`}>
                            {b.value}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase text-[var(--color-brutal-text)]">
                    {deviceHealthDist.battery.map(b => (
                        <div key={b.name} className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-[var(--color-brutal-border)]" style={{backgroundColor: BATTERY_COLORS[b.name]}}></div>{b.name}</div>
                    ))}
                </div>
            </div>

            {/* Signal Mini-Bar */}
            <div className="flex-1">
                <div className="flex justify-between items-center mb-2">
                    <span className="font-bold flex items-center gap-2 text-[var(--color-brutal-text)]"><Wifi size={16}/> Connectivity</span>
                </div>
                <div className="h-12 flex border-2 border-[var(--color-brutal-border)] w-full overflow-hidden shadow-[2px_2px_0px_0px_var(--color-brutal-border)]">
                    {deviceHealthDist.signal.map(s => (
                        s.value > 0 && <div key={s.name} style={{width: `${(s.value/devices.length)*100}%`, backgroundColor: SIGNAL_COLORS[s.name]}} className="h-full flex items-center justify-center font-bold text-xs border-r-2 border-[var(--color-brutal-border)] last:border-r-0 text-white" title={`${s.name}: ${s.value}`}>
                            {s.value}
                        </div>
                    ))}
                </div>
                <div className="flex gap-4 mt-2 text-[10px] font-bold uppercase text-[var(--color-brutal-text)]">
                    {deviceHealthDist.signal.map(s => (
                        <div key={s.name} className="flex items-center gap-1"><div className="w-3 h-3 border-2 border-[var(--color-brutal-border)]" style={{backgroundColor: SIGNAL_COLORS[s.name]}}></div>{s.name}</div>
                    ))}
                </div>
            </div>
        </Box>
      </div>

      {/* Main Charts Grid Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Incident Volume History */}
        <Box className="p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <h3 className="text-xl font-black uppercase mb-6 tracking-tighter text-[var(--color-brutal-text)]">Incident Timeline</h3>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={alertTimeline} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--color-border-main)" vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} tickLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} />
                <YAxis tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} tickLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} />
                <Tooltip contentStyle={brutalTooltip} />
                <Area type="step" dataKey="count" stroke="var(--color-brutal-border)" strokeWidth={4} fill="#f59e0b" fillOpacity={1} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Box>

        {/* Live Telemetry Pulse */}
        <Box className="p-6 bg-white transition-transform hover:-translate-y-1 duration-300 hover:shadow-xl">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-black uppercase tracking-tighter text-[var(--color-brutal-text)]">Live Telemetry Pulse</h3>
            <span className="flex items-center gap-2 text-sm font-black bg-white text-[var(--color-brutal-text)] border-2 border-[var(--color-brutal-border)] px-2 py-1 shadow-[2px_2px_0px_0px_var(--color-brutal-border)]">
                <Activity size={16}/> REAL-TIME
            </span>
          </div>
          <div className="h-[250px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={liveEvents} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="0" stroke="var(--color-border-main)" strokeOpacity={0.2} vertical={false} />
                <XAxis dataKey="time" tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} tickLine={false} minTickGap={30} />
                <YAxis domain={['dataMin - 1', 'dataMax + 1']} tick={{fontSize: 12, fill: 'var(--color-text-main)', fontWeight: 900}} axisLine={{stroke: 'var(--color-border-main)', strokeWidth: 2}} tickLine={false} width={40} />
                <Tooltip contentStyle={brutalTooltip} />
                <Area type="step" dataKey="temp" stroke="var(--color-brutal-border)" strokeWidth={4} fillOpacity={1} fill="#3b82f6" isAnimationActive={false} />
              </AreaChart>
            </ResponsiveContainer>
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
