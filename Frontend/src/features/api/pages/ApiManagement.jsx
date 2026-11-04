import React, { useState, useEffect } from 'react';
import { Key, Activity, Copy, CheckCircle, Trash2, Plus, RefreshCw, Server, Shield } from 'lucide-react';
import { Badge } from '../../../components/ui/Badge';
import apiClient from '../../../services/apiClient';

export default function ApiManagement() {
  const [keys, setKeys] = useState([]);
  const [logs, setLogs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCopied, setIsCopied] = useState(null);
  const [newKeyName, setNewKeyName] = useState('');
  const [newlyCreatedKey, setNewlyCreatedKey] = useState(null);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [keysRes, logsRes] = await Promise.all([
        apiClient.get('/api-keys'),
        apiClient.get('/api-logs?limit=50')
      ]);
      
      setKeys(keysRes.data || []);
      setLogs(logsRes.data || []);
    } catch (err) {
      console.error('Failed to fetch API data', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleCreateKey = async (e) => {
    e.preventDefault();
    if (!newKeyName.trim()) {
      alert('Please enter a name for the new API key.');
      return;
    }

    try {
      setIsLoading(true);
      const res = await apiClient.post('/api-keys', { name: newKeyName, scopes: ['read', 'write'] });
      setNewlyCreatedKey(res.data.token);
      setNewKeyName('');
      alert('API Key created successfully!');
      await fetchData();
    } catch (err) {
      console.error('Failed to create key', err);
      alert(`Failed to create key: ${err.response?.data?.error || err.message || 'Unknown error'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRevoke = async (id) => {
    if (!window.confirm('Are you sure you want to revoke this API key?')) return;
    try {
      await apiClient.delete(`/api-keys/${id}`);
      fetchData();
    } catch (err) {
      console.error('Failed to revoke key', err);
    }
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setIsCopied(id);
    setTimeout(() => setIsCopied(null), 2000);
  };

  const calculateSuccessRate = () => {
    if (logs.length === 0) return 0;
    const successes = logs.filter(l => l.status_code >= 200 && l.status_code < 300).length;
    return Math.round((successes / logs.length) * 100);
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-text-main flex items-center gap-3">
          <Server className="w-8 h-8 text-primary-500" />
          API Management
        </h1>
        <p className="text-text-muted mt-2 font-medium">Manage API keys and monitor external API usage</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-surface border border-border-main rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-main text-sm text-slate-500 uppercase tracking-wider">Active Keys</h3>
            <div className="p-2 bg-teal-50 dark:bg-teal-500/10 rounded-lg"><Key className="w-5 h-5 text-teal-500" /></div>
          </div>
          <div className="text-3xl font-black text-text-main">{keys.length}</div>
        </div>

        <div className="bg-surface border border-border-main rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-main text-sm text-slate-500 uppercase tracking-wider">Total Requests (24h)</h3>
            <div className="p-2 bg-sky-50 dark:bg-sky-500/10 rounded-lg"><Activity className="w-5 h-5 text-sky-500" /></div>
          </div>
          <div className="text-3xl font-black text-text-main">{logs.length}</div>
        </div>

        <div className="bg-surface border border-border-main rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-text-main text-sm text-slate-500 uppercase tracking-wider">Success Rate</h3>
            <div className="p-2 bg-emerald-50 dark:bg-emerald-500/10 rounded-lg"><Shield className="w-5 h-5 text-emerald-500" /></div>
          </div>
          <div className="text-3xl font-black text-text-main">{calculateSuccessRate()}%</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-main flex justify-between items-center">
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Key className="w-5 h-5" /> API Keys
            </h2>
          </div>
          
          <div className="p-6 border-b border-border-main bg-slate-50 dark:bg-surface-hover">
            <form onSubmit={handleCreateKey} className="flex gap-3">
              <input
                type="text"
                placeholder="New key name (e.g., Mobile App)"
                value={newKeyName}
                onChange={e => setNewKeyName(e.target.value)}
                className="flex-1 bg-white dark:bg-surface border border-border-main rounded-xl px-4 py-2.5 text-sm font-medium focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 outline-none transition-all text-text-main"
              />
              <button
                type="submit"
                onClick={handleCreateKey}
                className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2.5 rounded-xl text-sm font-bold shadow-sm shadow-primary-500/20 transition-all flex items-center gap-2 shrink-0"
              >
                <Plus className="w-4 h-4" /> Create
              </button>
            </form>
            
            {newlyCreatedKey && (
              <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 rounded-xl">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <h4 className="text-emerald-800 dark:text-emerald-400 font-bold text-sm">API Key Created Successfully</h4>
                    <p className="text-emerald-600 dark:text-emerald-500/80 text-xs mt-1">
                      Please copy your API key now. You won't be able to see it again!
                    </p>
                    <div className="mt-3 flex items-center gap-2 bg-white dark:bg-surface p-2 rounded-lg border border-emerald-100 dark:border-emerald-500/20">
                      <code className="text-sm font-mono text-text-main flex-1 break-all">{newlyCreatedKey}</code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(newlyCreatedKey, 'new')}
                        className="p-2 text-slate-400 hover:text-text-main transition-colors shrink-0"
                      >
                        {isCopied === 'new' ? <CheckCircle className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto p-2">
            {keys.length === 0 ? (
              <div className="p-8 text-center text-text-muted font-medium text-sm">No API keys found.</div>
            ) : (
              <ul className="space-y-2">
                {keys.map(key => (
                  <li key={key.id} className="p-4 rounded-xl border border-border-main hover:border-slate-300 dark:hover:border-slate-600 transition-colors">
                    <div className={`flex justify-between items-start ${!key.is_active ? 'opacity-50' : ''}`}>
                      <div>
                        <div className="font-bold text-text-main text-sm flex items-center gap-2">
                          {key.name}
                          {!key.is_active && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-rose-100 text-rose-600 dark:bg-rose-500/20 dark:text-rose-400">REVOKED</span>
                          )}
                        </div>
                        <div className="text-xs text-text-muted mt-1 font-mono bg-slate-100 dark:bg-slate-800 px-2 py-1 rounded inline-flex items-center gap-2">
                          {key.preview}****************
                        </div>
                        <div className="text-[11px] text-slate-400 mt-2 font-medium">Created: {new Date(key.created_at).toLocaleDateString()}</div>
                      </div>
                      {key.is_active && (
                        <button 
                          onClick={() => handleRevoke(key.id)}
                          className="p-2 text-rose-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        <div className="bg-surface border border-border-main rounded-2xl shadow-sm overflow-hidden flex flex-col">
          <div className="p-6 border-b border-border-main flex justify-between items-center">
            <h2 className="text-lg font-bold text-text-main flex items-center gap-2">
              <Activity className="w-5 h-5" /> Recent Requests
            </h2>
            <button onClick={fetchData} className="p-2 text-slate-400 hover:text-text-main hover:bg-slate-100 dark:hover:bg-surface-hover rounded-lg transition-all" title="Refresh Logs">
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-primary-500' : ''}`} />
            </button>
          </div>
          
          <div className="flex-1 overflow-y-auto max-h-[500px]">
            {logs.length === 0 ? (
              <div className="p-8 text-center text-text-muted font-medium text-sm">No recent requests logged.</div>
            ) : (
              <table className="w-full text-left text-sm whitespace-nowrap">
                <thead className="bg-slate-50 dark:bg-surface-hover sticky top-0 border-b border-border-main">
                  <tr>
                    <th className="px-4 py-3 font-semibold text-slate-500">Method</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Endpoint</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Status</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">Time</th>
                    <th className="px-4 py-3 font-semibold text-slate-500">IP</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border-main">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-slate-50 dark:hover:bg-surface-hover/50 transition-colors">
                      <td className="px-4 py-3">
                        <span className={`font-mono text-xs font-bold px-2 py-1 rounded ${
                          log.method === 'GET' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' :
                          log.method === 'POST' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' :
                          'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-400'
                        }`}>
                          {log.method}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium text-text-main truncate max-w-[150px]" title={log.endpoint}>{log.endpoint}</td>
                      <td className="px-4 py-3">
                        <Badge variant={log.status_code >= 200 && log.status_code < 300 ? 'success' : log.status_code >= 400 ? 'danger' : 'info'}>
                          {log.status_code}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-text-muted">{new Date(log.created_at).toLocaleTimeString()}</td>
                      <td className="px-4 py-3 text-text-muted font-mono text-xs">{log.ip_address || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
