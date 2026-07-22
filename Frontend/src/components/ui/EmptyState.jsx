import React from 'react';
import { Box } from './Box';
import { cn } from '../../lib/utils';
import { Inbox } from 'lucide-react';

export function EmptyState({ title, description, icon: Icon = Inbox, action, className }) {
  return (
    <Box className={cn("flex flex-col items-center justify-center p-12 text-center", className)}>
      <div className="bg-background p-4 rounded-2xl border border-border-main mb-4">
        <Icon className="w-8 h-8 text-text-muted" />
      </div>
      <h3 className="text-lg font-medium text-text-main mb-1">{title}</h3>
      <p className="text-sm text-text-muted max-w-sm mb-6">{description}</p>
      {action && <div>{action}</div>}
    </Box>
  );
}
