import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ className, label, type = "text", ...props }, ref) => {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-(--color-brutal-text)">
          {label}
        </label>
      )}
      <input
        type={type}
        className={cn(
          "flex h-11 w-full border-2 border-(--color-border-main) bg-(--color-background) px-4 py-2 text-sm text-(--color-brutal-text) transition-all placeholder:text-gray-400 focus:outline-none focus:border-(--color-brutal-border) focus:bg-(--color-brutal-bg) focus:ring-0 disabled:cursor-not-allowed disabled:opacity-50 rounded-none",
          className
        )}
        ref={ref}
        {...props}
      />
    </div>
  );
});

Input.displayName = "Input";
