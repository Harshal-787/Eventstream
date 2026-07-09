import React, { forwardRef } from 'react';
import { cn } from '../../lib/utils';

export const Input = forwardRef(({ className, type = "text", ...props }, ref) => {
  return (
    <input
      type={type}
      className={cn(
        "flex h-10 w-full border border-(--color-border-main) bg-(--color-background) px-3 py-2 text-sm placeholder:text-(--color-text-muted) focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:border-transparent disabled:cursor-not-allowed disabled:opacity-50 rounded-none transition-all text-(--color-text-main)",
        className
      )}
      ref={ref}
      {...props}
    />
  );
});

Input.displayName = "Input";
