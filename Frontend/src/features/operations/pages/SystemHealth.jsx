import React, { useState, useEffect } from 'react';
import { Activity, Database, Server, Clock, AlertTriangle, CheckCircle, RefreshCw } from 'lucide-react';
import healthService from '../../../services/healthService';

const SystemHealth = () => {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchHealth = async () => {
    setLoading(true);
    try {
      const data = await healthService.getSystemHealth();
      setHealthData(data);
      setError('');
    } catch (err) {
      setError('Failed to load system health metrics.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHealth();
    // Auto refresh every 30 seconds
    const interval = setInterval(fetchHealth, 30000);
    return () => clearInterval(interval);
  }, []);

  if (loading && !healthData) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-500 border-t-transparent"></div>
      </div>
    );
  }

  if (error && !healthData) {
    return (
      <div className="flex h-64 flex-col items-center justify-center text-rose-500">
        <AlertTriangle className="mb-4 h-12 w-12" />
        <p className="text-lg font-medium">{error}</p>
        <button onClick={fetchHealth} className="mt-4 flex items-center gap-2 text-sm text-slate-400 hover:text-white">
          <RefreshCw className="h-4 w-4" /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-text-main">System Health</h1>
          <p className="text-sm text-text-muted">Real-time infrastructure and background worker status.</p>
        </div>
        <button
          onClick={fetchHealth}
          className="flex items-center gap-2 rounded-lg bg-surface border border-border-main px-4 py-2 text-sm font-medium text-text-main shadow-sm transition-colors hover:bg-surface-hover"
        >
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {/* Database Health Card */}
        <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-blue-500/10 p-3 text-blue-500">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">DB Open Connections</p>
              <h3 className="text-2xl font-bold text-text-main">{healthData?.database?.open_connections || 0}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>In Use: {healthData?.database?.in_use || 0}</span>
            <span>Idle: {healthData?.database?.idle || 0}</span>
          </div>
        </div>

        {/* API Latency Card */}
        <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-emerald-500/10 p-3 text-emerald-500">
              <Activity className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">API Latency (1h Avg)</p>
              <h3 className="text-2xl font-bold text-text-main">{healthData?.api?.avg_latency_1h?.toFixed(2) || '0.00'} ms</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>Req (1h): {healthData?.api?.total_requests_1h || 0}</span>
          </div>
        </div>

        {/* Active Queue Card */}
        <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-teal-500/10 p-3 text-teal-500">
              <Server className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Recent Telemetry (1h)</p>
              <h3 className="text-2xl font-bold text-text-main">{healthData?.queue?.active_queue_events?.toLocaleString() || 0}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>Processed Active Queue</span>
          </div>
        </div>

        {/* DLQ Card */}
        <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="rounded-lg bg-rose-500/10 p-3 text-rose-500">
              <AlertTriangle className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-text-muted">Dead Letter Queue</p>
              <h3 className="text-2xl font-bold text-text-main">{healthData?.queue?.dead_letter_queue_events?.toLocaleString() || 0}</h3>
            </div>
          </div>
          <div className="mt-4 flex items-center justify-between text-xs text-text-muted">
            <span>Failed Events Count</span>
          </div>
        </div>
      </div>

      {/* Workers Status */}
      <div className="rounded-xl border border-border-main bg-surface p-6 shadow-sm">
        <h2 className="mb-4 text-lg font-medium text-text-main">Background Workers Status</h2>
        {(!healthData?.workers || healthData.workers.length === 0) ? (
          <p className="text-sm text-text-muted">No workers registered.</p>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {healthData.workers.map((worker) => (
              <div key={worker.name} className="flex flex-col rounded-lg border border-border-main bg-background p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-medium text-text-main">{worker.name}</span>
                  {worker.is_healthy ? (
                    <CheckCircle className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <AlertTriangle className="h-5 w-5 text-rose-500" />
                  )}
                </div>
                <div className="flex items-center gap-2 text-xs text-text-muted">
                  <Clock className="h-3 w-3" />
                  Last Ping: {new Date(worker.last_ping).toLocaleString()}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
};

export default SystemHealth;
