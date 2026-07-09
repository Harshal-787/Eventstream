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
    primary: "bg-(--color-primary-600) text-white hover:bg-(--color-primary-700) border border-transparent",
    secondary: "bg-(--color-surface) text-(--color-text-main) border border-(--color-border-main) hover:bg-(--color-surface-hover)",
    danger: "bg-red-600 text-white hover:bg-red-700 border border-transparent",
    ghost: "bg-transparent text-(--color-text-main) hover:bg-(--color-surface-hover) border border-transparent",
  };

  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-4 py-2 text-sm",
    lg: "px-6 py-3 text-base",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={cn(
        "inline-flex items-center justify-center font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-(--color-primary-500) focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none rounded-none cursor-pointer",
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
