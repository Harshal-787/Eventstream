import React from 'react';
import { cn } from '../../lib/utils';

export function Box({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-(--color-surface) border border-(--color-border-main) rounded-2xl shadow-sm overflow-hidden",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
