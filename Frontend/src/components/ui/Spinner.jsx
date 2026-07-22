import React from 'react';
import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Spinner({ className, size = 'md' }) {
  const sizes = {
    sm: "w-4 h-4",
    md: "w-6 h-6",
    lg: "w-8 h-8",
    xl: "w-12 h-12",
  };
  
  return (
    <div className="flex justify-center items-center h-full w-full p-4">
      <Loader2 className={cn("animate-spin text-primary-500", sizes[size], className)} />
    </div>
  );
}
