import React from 'react';
import { ChevronDown } from 'lucide-react';

export function Select({ label, options, className = '', ...props }) {
  return (
    <div className="space-y-2">
      {label && (
        <label className="block text-xs font-bold uppercase tracking-wider text-(--color-brutal-text)">
          {label}
        </label>
      )}
      <div className="relative">
        <select
          className={`appearance-none flex h-11 w-full border-2 border-(--color-border-main) bg-(--color-background) px-4 py-2 pr-10 text-sm text-(--color-brutal-text) transition-all focus:outline-none focus:border-(--color-brutal-border) focus:bg-(--color-brutal-bg) focus:ring-0 rounded-none cursor-pointer ${className}`}
          {...props}
        >
          {options && options.map((opt, i) => (
            <option key={i} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-4 text-gray-500">
          <ChevronDown className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
