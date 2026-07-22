import React from 'react';
import { cn } from '../../lib/utils';

export function Box({ children, className, ...props }) {
  return (
    <div
      className={cn(
        "bg-(--color-brutal-bg) border-2 border-(--color-brutal-border) shadow-md text-(--color-brutal-text)",
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}
