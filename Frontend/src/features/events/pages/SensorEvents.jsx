import { useState, useEffect } from "react";
import apiClient from "../../../services/apiClient";
import { Button } from "../../../components/ui/Button";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { motion } from 'framer-motion';

export function SensorEvents({ role }) {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const limit = 50;

  useEffect(() => {
    fetchEvents(page);
  }, [page]);

  const fetchEvents = async (pageToFetch) => {
    try {
      setLoading(true);
      const res = await apiClient.get(`/events?page=${pageToFetch}&limit=${limit}`);
      setEvents(res.data.data || []);
      setTotal(res.data.total || 0);
    } catch (error) {
      console.error("Failed to fetch sensor events:", error);
    } finally {
      setLoading(false);
    }
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
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-(--color-border-main) pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-(--color-text-main)">
            Sensor Events
          </h1>
          <p className="text-(--color-text-muted) font-medium">
            Historical telemetry logs and sensor activity
          </p>
        </div>
      </div>

      {events.length > 0 && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
        >
          <h2 className="text-lg font-bold text-(--color-text-main) mb-6">Telemetry Visualization</h2>
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
            className="p-6 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm"
          >
            <h2 className="text-lg font-bold text-(--color-text-main) mb-6">Binary Status Timeline</h2>
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
        className="bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="p-12 flex items-center justify-center">
             <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : events.length === 0 ? (
          <div className="p-12 text-center text-(--color-text-muted) font-medium">No events recorded yet.</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-(--color-surface) border-b border-(--color-border-main)">
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Timestamp</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Device ID</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Payload</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-main)">
                {events.map((evt) => (
                  <tr
                    key={evt.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 whitespace-nowrap text-sm text-(--color-text-main) font-medium">
                      {new Date(evt.timestamp).toLocaleString("en-US", { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                    </td>
                    <td className="p-4 font-mono text-sm font-semibold text-(--color-text-main)">
                      #{evt.device_id}
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${evt.status === 'ok' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'}`}>
                        {evt.status || 'UNKNOWN'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-2">
                        {evt.payload ? Object.entries(evt.payload).map(([key, val]) => (
                          <div key={key} className="text-xs bg-slate-100 dark:bg-(--color-surface-hover) text-(--color-text-main) px-2 py-1 rounded-md font-mono border border-slate-200 dark:border-(--color-border-main)">
                            <span className="font-semibold text-(--color-text-muted) mr-1">{key}:</span>
                            {typeof val === 'boolean' ? (val ? 'TRUE' : 'FALSE') : (typeof val === 'number' ? val.toFixed(2) : val)}
                          </div>
                        )) : (
                          <span className="text-(--color-text-muted) text-sm font-medium">NO PAYLOAD</span>
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
        <div className="p-4 border-t border-(--color-border-main) bg-slate-50 dark:bg-(--color-surface) flex flex-col sm:flex-row justify-between items-center gap-4">
          <span className="text-sm text-(--color-text-muted) font-medium">
            Showing <span className="font-bold text-(--color-text-main)">{(page - 1) * limit + 1}</span> to <span className="font-bold text-(--color-text-main)">{Math.min(page * limit, total)}</span> of <span className="font-bold text-(--color-text-main)">{total}</span> entries
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
