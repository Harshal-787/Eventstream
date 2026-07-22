import React from 'react';
import { cn } from '../../lib/utils';

export function Table({ className, children, ...props }) {
  return (
    <div className="w-full overflow-auto">
      <table className={cn("w-full text-sm text-left", className)} {...props}>
        {children}
      </table>
    </div>
  );
}

export function TableHeader({ className, children, ...props }) {
  return (
    <thead className={cn("text-xs text-text-muted uppercase bg-background border-b border-border-main", className)} {...props}>
      {children}
    </thead>
  );
}

export function TableBody({ className, children, ...props }) {
  return (
    <tbody className={cn("divide-y divide-border-main", className)} {...props}>
      {children}
    </tbody>
  );
}

export function TableRow({ className, children, hover = true, ...props }) {
  return (
    <tr className={cn(
      "bg-surface transition-colors", 
      hover && "hover:bg-surface-hover",
      className
    )} {...props}>
      {children}
    </tr>
  );
}

export function TableHead({ className, children, ...props }) {
  return (
    <th className={cn("px-4 py-3 font-medium tracking-wider", className)} {...props}>
      {children}
    </th>
  );
}

export function TableCell({ className, children, ...props }) {
  return (
    <td className={cn("px-4 py-3 whitespace-nowrap text-text-main", className)} {...props}>
      {children}
    </td>
  );
}
