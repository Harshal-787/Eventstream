import React, { useEffect, useState } from 'react';
import { alertService } from '../../services/alertService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Box } from '../../components/ui/Box';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { BellRing } from 'lucide-react';

export function Alerts({ role }) {
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleAcknowledge = async (id) => {
    try {
      await alertService.acknowledgeAlert(id);
      fetchAlerts();
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-(--color-text-main)">Alert Management</h1>
      </div>

      <Box>
        {alerts.length === 0 ? (
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
                <TableHead>Message</TableHead>
                <TableHead>Severity</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Time</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {alerts.map((alert) => (
                <TableRow key={alert.id}>
                  <TableCell className="font-medium">{alert.alert_type}</TableCell>
                  <TableCell>{alert.message}</TableCell>
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
                  <TableCell className="text-(--color-text-muted)">{new Date(alert.created_at).toLocaleString()}</TableCell>
                  <TableCell className="text-right">
                    {alert.status === 'open' && (
                      <Button size="sm" variant="secondary" onClick={() => handleAcknowledge(alert.id)}>
                        Acknowledge
                      </Button>
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
