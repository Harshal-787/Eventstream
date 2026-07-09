import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/50 p-4">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-(--color-background) rounded-lg shadow-xl overflow-hidden flex flex-col border border-(--color-border)">
        <div className="flex items-center justify-between p-4 border-b border-(--color-border)">
          <h3 className="text-xl font-semibold text-(--color-text-main)">{title}</h3>
          <button 
            onClick={onClose}
            className="text-(--color-text-muted) hover:text-(--color-text-main) transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-6 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}
