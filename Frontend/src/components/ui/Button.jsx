import React from 'react';
import { cn } from '../../lib/utils';

export function Button({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  className, 
  disabled,
  type = 'button',
  ...props 
}) {
  const variants = {
    primary: "bg-gradient-to-b from-indigo-500 to-indigo-600 text-white hover:from-indigo-600 hover:to-indigo-700 shadow-md shadow-indigo-600/20 hover:shadow-lg hover:shadow-indigo-600/30 active:scale-[0.98] active:shadow-sm transition-all font-semibold rounded-xl border border-indigo-700/50",
    secondary: "bg-white dark:bg-(--color-surface-hover) text-slate-900 dark:text-white border border-slate-300 dark:border-zinc-600 hover:bg-slate-50 dark:hover:bg-zinc-700 shadow-sm hover:shadow-md active:scale-[0.98] transition-all font-semibold rounded-xl",
    danger: "bg-gradient-to-b from-rose-500 to-rose-600 text-white hover:from-rose-600 hover:to-rose-700 shadow-md shadow-rose-600/20 hover:shadow-lg hover:shadow-rose-600/30 active:scale-[0.98] active:shadow-sm transition-all font-semibold rounded-xl border border-rose-700/50",
    ghost: "bg-transparent text-slate-800 dark:text-(--color-text-main) hover:bg-slate-100 dark:hover:bg-(--color-surface-hover) active:scale-[0.98] transition-all font-semibold rounded-xl",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled ? true : undefined}
      className={cn(
        "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:opacity-60 disabled:pointer-events-none cursor-pointer",
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
