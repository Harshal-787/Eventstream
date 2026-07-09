import React, { useEffect, useState } from 'react';
import { deviceService } from '../../services/deviceService';
import { Box } from '../../components/ui/Box';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Cpu, Plus } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function Devices({ role }) {
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      const data = await deviceService.getDevices();
      setDevices(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-(--color-text-main)">Devices</h1>
        {role === 'admin' && (
          <Button><Plus className="w-4 h-4 mr-2" /> Register Device</Button>
        )}
      </div>

      <Box>
        {devices.length === 0 ? (
          <EmptyState 
            title="No Devices Found" 
            description="There are no devices registered in your accessible buildings."
            icon={Cpu}
            action={role === 'admin' && <Button variant="secondary">Register Device</Button>}
          />
        ) : (
          <div className="p-6">Device list will appear here</div>
        )}
      </Box>
    </div>
  );
}
