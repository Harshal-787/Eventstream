import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ className, label, type = "text", ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-text-main">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border border-border-main bg-surface px-4 py-2 text-sm text-text-main transition-all placeholder:text-gray-400 focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 disabled:cursor-not-allowed disabled:opacity-50 rounded-xl shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";
