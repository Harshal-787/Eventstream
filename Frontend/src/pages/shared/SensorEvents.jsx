import React from 'react';
import { Box } from '../../components/ui/Box';
import { EmptyState } from '../../components/ui/EmptyState';
import { Activity } from 'lucide-react';

export function SensorEvents({ role }) {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-(--color-text-main)">Sensor Event History</h1>
      <Box>
        <EmptyState 
          title="No Event History" 
          description="Awaiting incoming sensor events."
          icon={Activity}
        />
      </Box>
    </div>
  );
}
