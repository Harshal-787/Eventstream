import React from 'react';
import { Box } from '../../components/ui/Box';
import { EmptyState } from '../../components/ui/EmptyState';
import { Settings } from 'lucide-react';
import { Button } from '../../components/ui/Button';

export function AlertRules() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-(--color-text-main)">Alert Rules Configuration</h1>
        <Button>Create Rule</Button>
      </div>
      <Box>
        <EmptyState 
          title="No Alert Rules" 
          description="Configure alert rules to trigger notifications when sensor thresholds are breached."
          icon={Settings}
        />
      </Box>
    </div>
  );
}
