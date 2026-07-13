import React, { useEffect, useState } from 'react';
import { alertService } from '../../services/alertService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Box } from '../../components/ui/Box';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { BellRing } from 'lucide-react';
import { useLiveAlerts } from '../../hooks/useLiveAlerts';
import { AlertCircle, ShieldAlert } from 'lucide-react';

export function Alerts({ role }) {
  const [alerts, setAlerts] = useState([]);
  const [displayAlerts, setDisplayAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { liveAlerts, alertUpdates } = useLiveAlerts();

  useEffect(() => {
    fetchAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const data = await alertService.getAlerts();
      setAlerts(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
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

    // Sort by triggered_at descending
    finalAlerts.sort((a, b) => new Date(b.triggered_at) - new Date(a.triggered_at));

    setDisplayAlerts(finalAlerts);

  }, [alerts, liveAlerts, alertUpdates]);

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

  if (loading) return <Spinner size="lg" />;

  const openAlertsCount = displayAlerts.filter(a => a.status === 'open').length;
  const criticalCount = displayAlerts.filter(a => a.severity === 'critical' && a.status !== 'resolved').length;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-(--color-brutal-border) pb-4 mb-6">
        <div>
          <h1 className="text-3xl font-black text-(--color-text-main) uppercase tracking-tighter flex items-center gap-3">
            {role === 'admin' ? <ShieldAlert className="text-red-500 w-8 h-8" /> : <AlertCircle className="text-yellow-500 w-8 h-8" />}
            {role === 'admin' ? 'System Alert Command' : 'Building Notifications'}
          </h1>
          <p className="text-(--color-text-muted) font-medium mt-1">
            {role === 'admin' 
              ? 'Global oversight and resolution for all facility alerts.' 
              : 'Live updates and alerts for your managed locations.'}
          </p>
        </div>
        
        {/* Quick Stats Badges & Clear All */}
        <div className="flex flex-col md:flex-row gap-4 mt-4 md:mt-0 items-center">
          {role === 'admin' && displayAlerts.length > 0 && (
            <Button variant="danger" className="md:mr-4 font-black" onClick={handleClearAll}>
              CLEAR ALL DATABASE ALERTS
            </Button>
          )}
          <div className="flex gap-4">
            <div className="bg-(--color-surface) border-2 border-(--color-brutal-border) p-3 text-center min-w-[100px]">
              <p className="text-[10px] uppercase font-bold text-(--color-text-muted)">Open</p>
              <p className={`text-2xl font-black ${openAlertsCount > 0 ? 'text-red-500' : 'text-(--color-text-main)'}`}>{openAlertsCount}</p>
            </div>
            <div className="bg-(--color-surface) border-2 border-(--color-brutal-border) p-3 text-center min-w-[100px]">
              <p className="text-[10px] uppercase font-bold text-(--color-text-muted)">Critical</p>
              <p className={`text-2xl font-black ${criticalCount > 0 ? 'text-orange-500' : 'text-(--color-text-main)'}`}>{criticalCount}</p>
            </div>
          </div>
        </div>
      </div>

      <Box className="bg-white overflow-hidden transition-transform duration-300">
        {displayAlerts.length === 0 ? (
          <EmptyState 
            title="No Alerts Found" 
            description="There are currently no active alerts matching your criteria."
            icon={BellRing}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Type</TableHead>
                <TableHead>Device</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">{role === 'admin' ? 'Actions' : 'Action Required'}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayAlerts.map((alert) => (
                <TableRow 
                    key={alert.id} 
                    // Add a pulse animation if it's a new open critical alert (we assume ones in liveAlerts are new)
                    className={liveAlerts.find(la => la.id === alert.id) && alert.status === 'open' ? 'animate-pulse bg-red-50 dark:bg-red-900/20' : ''}
                >
                  <TableCell className="font-medium whitespace-nowrap">
                    <div className="flex flex-col">
                      <span className="font-bold">{alert.type || alert.alert_type}</span>
                      <span className="text-xs text-(--color-text-muted) truncate max-w-[200px]" title={alert.message}>{alert.message}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col">
                      <span className="font-semibold text-sm">{alert.model_name || alert.device_name || 'Unknown Device'}</span>
                      <span className="text-xs text-(--color-text-muted) font-mono">ID: {alert.hardware_id || alert.device_id || 'N/A'}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col text-sm">
                      <span className="font-semibold">{alert.building_name || 'Unassigned'}</span>
                      <span className="text-xs text-(--color-text-muted)">
                        {[alert.floor_name, alert.room_name].filter(Boolean).join(' - ') || 'No location set'}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'warning' ? 'warning' : 'info'}>
                      {alert.severity}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={alert.status === 'open' ? 'danger' : 'success'}>
                      {alert.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-(--color-text-muted)">{new Date(alert.triggered_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {role === 'admin' ? (
                      <div className="flex justify-end gap-2">
                        {alert.status === 'open' && (
                          <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(alert.id)}>
                            Acknowledge
                          </Button>
                        )}
                        {alert.status === 'acknowledged' && (
                          <Button size="sm" variant="outline" onClick={() => handleResolve(alert.id)}>
                            Resolve
                          </Button>
                        )}
                        {alert.status === 'resolved' && (
                          <span className="text-xs font-bold text-(--color-text-muted) uppercase">Resolved</span>
                        )}
                        <Button size="icon" variant="ghost" className="text-red-500 hover:bg-red-50" onClick={() => handleDelete(alert.id)}>
                          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"></path><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"></path><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"></path></svg>
                        </Button>
                      </div>
                    ) : (
                      <div className="text-xs font-bold uppercase text-(--color-text-muted)">
                        {alert.status === 'resolved' ? 'Resolved' : 'Pending Admin'}
                      </div>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
    </div>
  );
}
