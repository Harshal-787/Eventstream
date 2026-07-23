import React, { useEffect, useState } from 'react';
import { alertService } from '../services/alertService';
import apiClient from '../../../services/apiClient';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { BellRing, AlertCircle, ShieldAlert, Download, Trash2, CheckCircle2, AlertOctagon, Sparkles, X } from 'lucide-react';
import { useLiveAlerts } from '../hooks/useLiveAlerts';
import { motion, AnimatePresence } from 'framer-motion';
import { aiService } from '../../../services/aiService';
import ReactMarkdown from 'react-markdown';

export function Alerts({ role }) {
  const [alerts, setAlerts] = useState([]);
  const [displayAlerts, setDisplayAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  
  const { liveAlerts, alertUpdates } = useLiveAlerts();
  
  const [filters, setFilters] = useState({
    status: '',
    severity: '',
    building_id: '',
    start_date: '',
    end_date: ''
  });
  const [buildings, setBuildings] = useState([]);

  const [rcaAlertId, setRcaAlertId] = useState(null);
  const [rcaResult, setRcaResult] = useState('');
  const [rcaLoading, setRcaLoading] = useState(false);

  useEffect(() => {
    fetchAlerts();
  }, [filters]); // Refetch on filter change

  useEffect(() => {
    // Fetch buildings for filter
    apiClient.get('/buildings').then(res => setBuildings(res.data.data || [])).catch(err => console.error(err));
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts(filters);
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({
      status: '',
      severity: '',
      building_id: '',
      start_date: '',
      end_date: ''
    });
  };

  useEffect(() => {
    // Combine fetched alerts and live alerts, ensuring no duplicates
    const allAlerts = [...liveAlerts, ...alerts];
    
    // Deduplicate by ID
    const uniqueAlertsMap = new Map();
    allAlerts.forEach(a => {
        if (!uniqueAlertsMap.has(a.id)) {
            uniqueAlertsMap.set(a.id, a);
        }
    });

    const uniqueAlerts = Array.from(uniqueAlertsMap.values());

    // Apply alert updates
    const finalAlerts = uniqueAlerts.map(a => {
        if (alertUpdates[a.id]) {
            return { ...a, status: alertUpdates[a.id] };
        }
        return a;
    });

    // Apply local filter overrides on live incoming events that might bypass query logic initially
    const strictlyFiltered = finalAlerts.filter(a => {
      if (filters.status && a.status !== filters.status) return false;
      if (filters.severity && a.severity !== filters.severity) return false;
      if (filters.building_id && a.building_id !== parseInt(filters.building_id)) return false;
      return true;
    });

    // Sort by triggered_at descending
    strictlyFiltered.sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at));

    setDisplayAlerts(strictlyFiltered);

  }, [alerts, liveAlerts, alertUpdates, filters]);

  const handleAcknowledge = async (id) => {
    try {
      await alertService.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleResolve = async (id) => {
    try {
      await alertService.resolveAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this alert permanently?")) return;
    try {
      await alertService.deleteAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleClearAll = async () => {
    if (!window.confirm("Are you sure you want to permanently delete ALL alerts from the system? This action cannot be undone.")) return;
    try {
      await alertService.clearAllAlerts();
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  const handleRCA = async (id) => {
    setRcaAlertId(id);
    setRcaResult('');
    setRcaLoading(true);
    try {
      const data = await aiService.analyzeAlertRCA(id);
      setRcaResult(data.summary || data.analysis || JSON.stringify(data));
    } catch (err) {
      console.error(err);
      const backendError = err.response?.data?.error || err.message;
      setRcaResult(`**Error:** Failed to generate root cause analysis. ${backendError}`);
    } finally {
      setRcaLoading(false);
    }
  };

  if (loading && displayAlerts.length === 0) return (
    <div className="flex h-[50vh] items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-teal-600"></div>
    </div>
  );

  const openAlertsCount = displayAlerts.filter(a => a.status === 'open').length;
  const criticalCount = displayAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  const filteredAlerts = displayAlerts.filter(a => 
    !searchQuery || 
    (a.type && a.type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.alert_type && a.alert_type.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.message && a.message.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.model_name && a.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.device_name && a.device_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (a.hardware_id && a.hardware_id.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const downloadCSV = () => {
    if (!filteredAlerts.length) return;
    
    const headers = ["Type", "Message", "Device", "Device ID", "Building", "Location", "Severity", "Status", "Time"];
    const csvRows = filteredAlerts.map(alert => {
      const type = alert.type || alert.alert_type || "";
      const msg = alert.message ? alert.message.replace(/"/g, '""') : "";
      const device = alert.model_name || alert.device_name || "Unknown Device";
      const deviceId = alert.hardware_id || alert.device_id || "";
      const building = alert.building_name || "Unassigned";
      const loc = [alert.floor_name, alert.room_name].filter(Boolean).join(' - ') || "No location set";
      const time = new Date(alert.triggered_at).toISOString();
      
      return `"${type}","${msg}","${device}","${deviceId}","${building}","${loc}","${alert.severity}","${alert.status}","${time}"`;
    });
    
    const csvString = [headers.join(","), ...csvRows].join("\n");
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `alerts_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const SeverityBadge = ({ severity }) => {
    const config = {
      critical: { bg: 'bg-rose-50 dark:bg-rose-500/10', text: 'text-rose-700 dark:text-rose-400', border: 'border-rose-200 dark:border-rose-500/20' },
      high: { bg: 'bg-orange-50 dark:bg-orange-500/10', text: 'text-orange-700 dark:text-orange-400', border: 'border-orange-200 dark:border-orange-500/20' },
      medium: { bg: 'bg-amber-50 dark:bg-amber-500/10', text: 'text-amber-700 dark:text-amber-400', border: 'border-amber-200 dark:border-amber-500/20' },
      low: { bg: 'bg-sky-50 dark:bg-sky-500/10', text: 'text-sky-700 dark:text-sky-400', border: 'border-sky-200 dark:border-sky-500/20' }
    };
    const style = config[severity] || config.medium;
    return (
      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase border ${style.bg} ${style.text} ${style.border}`}>
        {severity}
      </span>
    );
  };

  const StatusBadge = ({ status }) => {
    const config = {
      open: { bg: 'bg-rose-100 dark:bg-rose-500/20', text: 'text-rose-800 dark:text-rose-400', dot: 'bg-rose-500' },
      acknowledged: { bg: 'bg-teal-100 dark:bg-teal-500/20', text: 'text-teal-800 dark:text-teal-400', dot: 'bg-teal-500' },
      resolved: { bg: 'bg-emerald-100 dark:bg-emerald-500/20', text: 'text-emerald-800 dark:text-emerald-400', dot: 'bg-emerald-500' }
    };
    const style = config[status] || config.open;
    return (
      <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase ${style.bg} ${style.text}`}>
        <div className={`w-1.5 h-1.5 rounded-full ${style.dot}`}></div>
        {status}
      </div>
    );
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end border-b border-border-main pb-6 gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            {role === 'admin' ? (
              <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
                <ShieldAlert className="w-7 h-7" />
              </div>
            ) : (
              <div className="w-12 h-12 rounded-2xl bg-amber-100 text-amber-600 flex items-center justify-center">
                <AlertCircle className="w-7 h-7" />
              </div>
            )}
            <h1 className="text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-text-main">
              {role === 'admin' ? 'System Alerts' : 'Notifications'}
            </h1>
          </div>
          <p className="text-text-muted font-medium ml-15">
            {role === 'admin' 
              ? 'Global oversight and resolution for all facility alerts.' 
              : 'Live updates and alerts for your managed locations.'}
          </p>
        </div>
        
        {/* Quick Stats Badges & Clear All */}
        <div className="flex flex-col sm:flex-row gap-4 items-stretch sm:items-center w-full lg:w-auto">
          <div className="flex gap-4">
            <div className="bg-surface border border-border-main rounded-2xl p-4 flex-1 sm:min-w-[120px] shadow-sm flex flex-col justify-center items-center">
              <p className="text-xs uppercase font-bold text-text-muted mb-1">Open Alerts</p>
              <p className={`text-3xl font-black ${openAlertsCount > 0 ? 'text-rose-500' : 'text-text-main'}`}>{openAlertsCount}</p>
            </div>
            <div className="bg-surface border border-border-main rounded-2xl p-4 flex-1 sm:min-w-[120px] shadow-sm flex flex-col justify-center items-center">
              <p className="text-xs uppercase font-bold text-text-muted mb-1">Critical</p>
              <p className={`text-3xl font-black ${criticalCount > 0 ? 'text-orange-500' : 'text-text-main'}`}>{criticalCount}</p>
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <Button variant="primary" onClick={downloadCSV} disabled={filteredAlerts.length === 0} className="w-full sm:w-auto justify-center rounded-xl">
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
            {role === 'admin' && displayAlerts.length > 0 && (
              <Button variant="danger" className="w-full sm:w-auto justify-center rounded-xl" onClick={handleClearAll}>
                <Trash2 className="w-4 h-4 mr-2" />
                Clear All
              </Button>
            )}
          </div>
        </div>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="p-6 bg-surface rounded-2xl border border-border-main shadow-sm space-y-4"
      >
        <div className="flex flex-col md:flex-row gap-4 flex-wrap items-end">
          <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-slate-50 dark:bg-surface-hover text-text-main font-medium focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
            >
              <option value="">All Statuses</option>
              <option value="open">Open</option>
              <option value="acknowledged">Acknowledged</option>
              <option value="resolved">Resolved</option>
            </select>
          </div>
          <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase">Severity</label>
            <select
              name="severity"
              value={filters.severity}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-slate-50 dark:bg-surface-hover text-text-main font-medium focus:ring-2 focus:ring-teal-500/50 outline-none transition-all"
            >
              <option value="">All Severities</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>
          {role === 'admin' && (
            <div className="flex-1 min-w-[140px] space-y-1">
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
          )}
          <div className="flex-1 min-w-[140px] space-y-1">
            <label className="text-xs font-bold text-text-muted uppercase">Start Date</label>
            <input
              type="datetime-local"
              name="start_date"
              value={filters.start_date}
              onChange={handleFilterChange}
              className="w-full px-4 py-2.5 rounded-xl border border-border-main bg-slate-50 dark:bg-surface-hover text-text-main font-medium focus:ring-2 focus:ring-teal-500/50 outline-none transition-all [color-scheme:light] dark:[color-scheme:dark]"
            />
          </div>
          <div className="flex-1 min-w-[140px] space-y-1">
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
              Clear
            </Button>
          </div>
        </div>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-border-main bg-surface">
          <div className="relative max-w-md">
            <svg className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"></circle><line x1="21" y1="21" x2="16.65" y2="16.65"></line></svg>
            <input 
              type="text" 
              placeholder="Search alerts by type, message, device..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white dark:bg-surface-hover border border-border-main rounded-xl text-sm w-full font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all text-text-main"
            />
          </div>
        </div>

        {filteredAlerts.length === 0 ? (
          <EmptyState 
            title="No Alerts Found" 
            description="There are currently no active alerts matching your criteria."
            icon={BellRing}
            className="py-20"
          />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-surface border-b border-border-main">
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type & Details</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Device</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Location</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Severity</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Time</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-main">
                {filteredAlerts.map((alert) => (
                  <TableRow 
                      key={alert.id} 
                      className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${liveAlerts.find(la => la.id === alert.id) && alert.status === 'open' ? 'bg-rose-50/50 dark:bg-rose-900/10' : ''}`}
                  >
                    <TableCell className="py-4 align-top">
                      <div className="flex items-start gap-3">
                        {alert.status === 'open' && alert.severity === 'critical' ? (
                          <div className="mt-0.5"><AlertOctagon className="w-5 h-5 text-rose-500" /></div>
                        ) : alert.status === 'resolved' ? (
                          <div className="mt-0.5"><CheckCircle2 className="w-5 h-5 text-emerald-500" /></div>
                        ) : (
                          <div className="mt-0.5"><AlertCircle className="w-5 h-5 text-amber-500" /></div>
                        )}
                        <div className="flex flex-col">
                          <span className="font-bold text-text-main">{alert.type || alert.alert_type}</span>
                          <span className="text-sm text-text-muted mt-0.5 max-w-xs md:max-w-md line-clamp-2" title={alert.message}>{alert.message}</span>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <div className="flex flex-col">
                        <span className="font-semibold text-sm text-text-main">{alert.model_name || alert.device_name || 'Unknown Device'}</span>
                        <span className="text-xs text-text-muted font-mono mt-0.5">ID: {alert.hardware_id || alert.device_id || 'N/A'}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <div className="flex flex-col text-sm">
                        <span className="font-semibold text-text-main">{alert.building_name || 'Unassigned'}</span>
                        <span className="text-xs text-text-muted mt-0.5">
                          {[alert.floor_name, alert.room_name].filter(Boolean).join(' - ') || 'No location set'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <SeverityBadge severity={alert.severity} />
                    </TableCell>
                    <TableCell className="py-4 align-top">
                      <StatusBadge status={alert.status} />
                    </TableCell>
                    <TableCell className="py-4 align-top text-sm font-medium text-text-muted whitespace-nowrap">
                      {new Date(alert.triggered_at).toLocaleString([], {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </TableCell>
                    <TableCell className="py-4 align-top text-right">
                      <div className="flex justify-end gap-2 flex-wrap min-w-[200px]">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="rounded-lg text-xs font-semibold py-1.5 h-auto text-teal-600 border-teal-200 hover:bg-teal-50 flex items-center gap-1" 
                          onClick={() => handleRCA(alert.id)}
                        >
                          <Sparkles className="w-3 h-3" />
                          RCA
                        </Button>
                        {alert.status === 'open' && (
                          <Button size="sm" variant="secondary" className="rounded-lg text-xs font-semibold py-1.5 h-auto" onClick={() => handleAcknowledge(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button size="sm" variant="outline" className="rounded-lg text-xs font-semibold py-1.5 h-auto text-teal-600 border-teal-200 hover:bg-teal-50" onClick={() => handleResolve(alert.id)}>
                            Resolve
                          </Button>
                        )}
                        {alert.status === 'resolved' && (
                          <span className="text-xs font-bold text-slate-400 uppercase mt-1 px-2">Resolved</span>
                        )}
                        {role === 'admin' && (
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-rose-500 hover:bg-rose-50 rounded-md" onClick={() => handleDelete(alert.id)} title="Delete Alert">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      {/* RCA Modal */}
      <AnimatePresence>
        {rcaAlertId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-5 h-5" />
                  AI Root Cause Analysis
                </h3>
                <button onClick={() => setRcaAlertId(null)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {rcaLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Analyzing telemetry data and alert history...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                    <ReactMarkdown>{rcaResult}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
