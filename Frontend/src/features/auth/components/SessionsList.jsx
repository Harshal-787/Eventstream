import React, { useEffect, useState } from 'react';
import { Box } from '../../../components/ui/Box';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { Monitor, Smartphone, Globe, ShieldOff, AlertCircle } from 'lucide-react';
import apiClient from '../../../services/apiClient';
import toast from 'react-hot-toast';

export const SessionsList = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSessionId, setCurrentSessionId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [revoking, setRevoking] = useState(null);

  const fetchSessions = async () => {
    try {
      const { data } = await apiClient.get('/auth/sessions');
      setSessions(data.sessions || []);
      setCurrentSessionId(data.current_session_id);
    } catch (error) {
      toast.error('Failed to load active sessions');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  const handleRevoke = async (id) => {
    if (id === currentSessionId) {
      toast.error("Cannot revoke current session from here. Log out instead.");
      return;
    }

    setRevoking(id);
    try {
      await apiClient.delete(`/auth/sessions/${id}`);
      toast.success('Session revoked successfully');
      setSessions(prev => prev.filter(s => s.id !== id));
    } catch (error) {
      toast.error('Failed to revoke session');
    } finally {
      setRevoking(null);
    }
  };

  const getDeviceIcon = (deviceInfo = '') => {
    const info = deviceInfo.toLowerCase();
    if (info.includes('mobile') || info.includes('android') || info.includes('iphone')) return <Smartphone size={20} />;
    if (info.includes('windows') || info.includes('mac') || info.includes('linux')) return <Monitor size={20} />;
    return <Globe size={20} />;
  };

  const formatTime = (timeString) => {
    const date = new Date(timeString);
    const now = new Date();
    const diff = now - date;
    
    if (diff < 60000) return 'Just now';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <Box className="p-6 flex justify-center">
        <Spinner />
      </Box>
    );
  }

  return (
    <Box className="p-6 max-w-3xl">
      <div className="flex items-center gap-3 mb-6">
        <div className="h-10 w-10 rounded-xl bg-indigo-500/10 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400 flex items-center justify-center border border-indigo-500/20">
          <ShieldOff size={24} />
        </div>
        <div>
          <h2 className="text-xl font-bold text-(--color-text-main) tracking-tight">Active Sessions</h2>
          <p className="text-sm text-(--color-text-muted) font-medium">Manage devices currently logged into your account</p>
        </div>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8 text-slate-500 flex flex-col items-center">
          <AlertCircle size={32} className="mb-2 opacity-50" />
          <p>No active sessions found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {sessions.map(session => {
            const isCurrent = session.id === currentSessionId;
            return (
              <div 
                key={session.id} 
                className={`flex items-center justify-between p-4 rounded-xl border transition-colors ${
                  isCurrent ? 'bg-indigo-50 dark:bg-indigo-500/10 border-indigo-200 dark:border-indigo-500/20' : 'bg-slate-50 dark:bg-(--color-surface-hover) border-slate-200 dark:border-(--color-border-main) hover:border-slate-300 dark:hover:border-zinc-600'
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl flex-shrink-0 ${isCurrent ? 'bg-indigo-100 dark:bg-indigo-500/20 text-indigo-600 dark:text-indigo-400' : 'bg-slate-200 dark:bg-(--color-surface-hover) text-slate-600 dark:text-(--color-text-muted)'}`}>
                    {getDeviceIcon(session.device_info)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-bold text-(--color-text-main) truncate max-w-[200px] md:max-w-[400px]" title={session.device_info || 'Unknown Device'}>
                      {session.device_info || 'Unknown Device'}
                      {isCurrent && <span className="ml-2 text-xs font-bold text-indigo-600 dark:text-indigo-400 uppercase tracking-wider bg-indigo-100 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 px-2 py-0.5 rounded-md">Current</span>}
                    </p>
                    <div className="flex items-center gap-2 mt-1 text-xs text-(--color-text-muted) font-medium">
                      <span>IP: {session.ip_address || 'Unknown'}</span>
                      <span>•</span>
                      <span>Last active: {formatTime(session.last_active_at)}</span>
                    </div>
                  </div>
                </div>

                {!isCurrent && (
                  <Button 
                    variant="danger" 
                    size="sm" 
                    onClick={() => handleRevoke(session.id)}
                    loading={revoking === session.id}
                    className="flex-shrink-0"
                  >
                    Revoke
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Box>
  );
};
