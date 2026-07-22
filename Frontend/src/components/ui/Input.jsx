import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ className, label, type = "text", ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-(--color-text-main)">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border border-(--color-border-main) bg-(--color-surface) px-4 py-2 text-sm text-(--color-text-main) transition-all placeholder:text-gray-400 focus:outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 disabled:cursor-not-allowed disabled:opacity-50 rounded-xl shadow-sm",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";
