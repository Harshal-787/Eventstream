import React from 'react';
import { cn } from '../../lib/utils';

export function Badge({ children, variant = 'default', className, ...props }) {
  const variants = {
    default: "bg-gray-100 text-gray-900 border-(--color-brutal-border) dark:bg-gray-800 dark:text-gray-100",
    success: "bg-emerald-400 text-black border-(--color-brutal-border) dark:bg-emerald-600 dark:text-white",
    warning: "bg-amber-400 text-black border-(--color-brutal-border) dark:bg-amber-600 dark:text-white",
    danger: "bg-red-500 text-white border-(--color-brutal-border) dark:bg-red-700",
    info: "bg-blue-400 text-black border-(--color-brutal-border) dark:bg-blue-600 dark:text-white",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center px-2 py-0.5 text-[10px] font-black tracking-widest uppercase border-2",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
