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
    primary: "bg-(--color-brutal-inverse-bg) text-(--color-brutal-text-inverse) border-2 border-(--color-brutal-border) hover:opacity-90 shadow-md    transition-all font-black uppercase tracking-wider",
    secondary: "bg-(--color-brutal-bg) text-(--color-brutal-text) border-2 border-(--color-brutal-border) hover:bg-(--color-brutal-hover) shadow-md    transition-all font-bold uppercase tracking-wider",
    danger: "bg-red-500 text-white border-2 border-(--color-brutal-border) hover:bg-red-600 shadow-md    transition-all font-bold uppercase tracking-wider",
    ghost: "bg-transparent text-(--color-brutal-text) hover:bg-(--color-brutal-hover) border-2 border-transparent hover:border-(--color-brutal-border) transition-all font-bold uppercase tracking-wider",
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
        "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-0 disabled:opacity-50 disabled:pointer-events-none cursor-pointer",
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
