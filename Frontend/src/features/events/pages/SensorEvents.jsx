import { useState, useEffect, useCallback } from "react";
import apiClient from "../../../services/apiClient";
import { Button } from "../../../components/ui/Button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

export function SensorEvents({ role }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  
  const [filters, setFilters] = useState({
    start_date: '',
    end_date: '',
    building_id: '',
    device_id: ''
  });
  
  const [buildings, setBuildings] = useState([]);
  const [devices, setDevices] = useState([]);

  const limit = 50;

  const fetchEvents = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: limit.toString(),
      });
      if (filters.start_date) params.append("start_date", new Date(filters.start_date).toISOString());
      if (filters.end_date) params.append("end_date", new Date(filters.end_date).toISOString());
      if (filters.building_id) params.append("building_id", filters.building_id);
      if (filters.device_id) params.append("device_id", filters.device_id);

      const res = await apiClient.get(`/events?${params.toString()}`);
      setEvents(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch sensor events:", error);
    } finally {
      setLoading(false);
    }
  }, [page, filters]);

  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        const [bRes, dRes] = await Promise.all([
          apiClient.get('/buildings'),
          apiClient.get('/devices')
        ]);
        setBuildings(Array.isArray(bRes.data) ? bRes.data : bRes.data.data || []);
        setDevices(Array.isArray(dRes.data) ? dRes.data : dRes.data.data || []);
      } catch (err) {
        console.error("Failed to fetch metadata", err);
      }
    };
    fetchMetadata();
  }, []);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => {
      const next = { ...prev, [name]: value };
      if (name === 'building_id') {
        next.device_id = ''; // reset device when building changes
      }
      return next;
    });
    setPage(1); // reset to first page on filter change
  };

  const clearFilters = () => {
    setFilters({
      start_date: '',
      end_date: '',
      building_id: '',
      device_id: ''
    });
    setPage(1);
  };

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

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-border-main pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-text-main">
            Sensor Events
          </h1>
          <p className="text-text-muted font-medium">
            Historical telemetry logs and sensor activity
          </p>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-surface rounded-2xl border border-border-main shadow-sm space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4 items-end">
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase">Building</label>
            <select
              name="building_id"
              value={filters.building_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-slate-50 dark:bg-surface-hover text-text-main font-medium focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
            >
              <option value="">All Buildings</option>
              {buildings.map(b => (
                <option key={b.id} value={b.id}>{b.name}</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase">Device</label>
            <select
              name="device_id"
              value={filters.device_id}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-slate-50 dark:bg-surface-hover text-text-main font-medium focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
            >
              <option value="">All Devices</option>
              {devices
                .filter(d => !filters.building_id || d.building_id == filters.building_id)
                .map(d => (
                <option key={d.id} value={d.id}>{d.name} ({d.hardware_id})</option>
              ))}
            </select>
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase">Start Date</label>
            <input
              type="datetime-local"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-slate-50 dark:bg-surface-hover text-text-main font-medium focus:ring-2 focus:ring-teal-500/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex-1 w-full space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase">End Date</label>
            <input
              type="datetime-local"
              name="end_date"
              value={filters.end_date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-slate-50 dark:bg-surface-hover text-text-main font-medium focus:ring-2 focus:ring-teal-500/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex-none pb-0.5">
            <Button variant="secondary" onClick={clearFilters}>
              Clear Filters
            </Button>
          </div>
        </div>
      </motion.div>

      {events.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-surface rounded-2xl border border-border-main shadow-sm"
        >
          <h2 className="text-lg font-bold text-text-main mb-6">Telemetry Visualization</h2>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={[...events].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" vertical={false} opacity={0.5} />
                <XAxis 
                  dataKey="timestamp" 
                  tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}
                  axisLine={false}
                  tickLine={false}
                  dy={10}
                />
                <YAxis 
                  tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }} 
                  axisLine={false} 
                  tickLine={false} 
                />
                <Tooltip 
                  contentStyle={sleekTooltip}
                  labelFormatter={(t) => new Date(t).toLocaleString()}
                />
                <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} iconType="circle" />
                
                {/* Dynamically plot numeric payload fields if present */}
                {Array.from(new Set(events.flatMap(e => Object.keys(e.payload || {}).filter(k => typeof e.payload[k] === 'number')))).map((key, index) => {
                  const colors = ['#6366f1', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899'];
                  return (
                    <Line 
                      key={key} 
                      type="monotone" 
                      dataKey={(e) => e.payload && typeof e.payload[key] === 'number' ? e.payload[key] : null} 
                      name={key}
                      stroke={colors[index % colors.length]} 
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6, strokeWidth: 2, fill: colors[index % colors.length] }}
                    />
                  );
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Dynamically plot boolean payload fields if present */}
      {(() => {
        const booleanKeys = Array.from(new Set(events.flatMap(e => Object.keys(e.payload || {}).filter(k => typeof e.payload[k] === 'boolean'))));
        if (booleanKeys.length === 0) return null;
        
        return (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="p-6 bg-surface rounded-2xl border border-border-main shadow-sm"
          >
            <h2 className="text-lg font-bold text-text-main mb-6">Binary Status Timeline</h2>
            <div className="h-48 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={[...events].reverse()} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="var(--color-border-main)" vertical={false} opacity={0.5} />
                  <XAxis 
                    dataKey="timestamp" 
                    tickFormatter={(t) => new Date(t).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }}
                    axisLine={false}
                    tickLine={false}
                    dy={10}
                  />
                  <YAxis 
                    domain={[0, 1]}
                    ticks={[0, 1]}
                    tickFormatter={(val) => val === 1 ? 'ON' : 'OFF'}
                    tick={{ fill: 'var(--color-text-muted)', fontSize: 12, fontWeight: 500 }} 
                    axisLine={false} 
                    tickLine={false}
                  />
                  <Tooltip 
                    contentStyle={sleekTooltip}
                    labelFormatter={(t) => new Date(t).toLocaleString()}
                    formatter={(val, name) => [val === 1 ? 'Active/True' : 'Inactive/False', name]}
                  />
                  <Legend wrapperStyle={{ fontSize: '12px', fontWeight: 600, paddingTop: '10px' }} iconType="circle" />
                  
                  {booleanKeys.map((key, index) => {
                    const colors = ['#ef4444', '#14b8a6', '#f97316', '#8b5cf6', '#3b82f6'];
                    return (
                      <Line 
                        key={key} 
                        type="stepAfter" 
                        dataKey={(e) => e.payload && typeof e.payload[key] === 'boolean' ? (e.payload[key] ? 1 : 0) : null} 
                        name={key}
                        stroke={colors[index % colors.length]} 
                        strokeWidth={3}
                        dot={true}
                        activeDot={{ r: 6, strokeWidth: 2, fill: colors[index % colors.length] }}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            </div>
          </motion.div>
        );
      })()}

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="p-12 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-teal-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-text-muted font-medium">No events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-surface border-b border-border-main">
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Timestamp</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Device ID</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-text-muted uppercase tracking-wider">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border-main">
                {events.map((evt) => (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap text-sm text-text-main font-medium">
                      {new Date(evt.timestamp).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </td>
                    <td className="p-4 font-mono text-sm font-semibold text-text-main">
                      #{evt.device_id}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${evt.status === 'ok' ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400' : 'bg-rose-50 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400'}`}>
                        {evt.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {evt.payload ? Object.entries(evt.payload).map(([key, val]) => (
                          <div key={key} className="text-xs bg-slate-100 dark:bg-surface-hover text-text-main px-2 py-1 rounded-md font-mono border border-slate-200 dark:border-border-main">
                            <span className="font-semibold text-text-muted mr-1">{key}:</span>
                            {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : (typeof val === 'number' ? val.toFixed(2) : val)}
                          </div>
                        )) : (
                          <span className="text-text-muted text-sm font-medium">NO PAYLOAD</span>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
        {/* Pagination Controls */}
        <div className="p-4 border-t border-border-main bg-slate-50 dark:bg-surface flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-text-muted font-medium">
            Showing <span className="font-bold text-text-main">{total === 0 ? 0 : (page - 1) * limit + 1}</span> to <span className="font-bold text-text-main">{Math.min(page * limit, total)}</span> of <span className="font-bold text-text-main">{total}</span> entries
          </span>
          <div className="flex gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={page === 1}
              onClick={() => setPage(page - 1)}
            >
              Previous
            </Button>
            <Button
              variant="secondary"
              size="sm"
              disabled={page * limit >= total}
              onClick={() => setPage(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
