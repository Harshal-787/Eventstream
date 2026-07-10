import React from 'react';
import { X } from 'lucide-react';

export function Modal({ isOpen, onClose, title, children }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto overflow-x-hidden bg-black/60 p-4 backdrop-blur-sm">
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-(--color-brutal-bg) shadow-md flex flex-col border-2 border-(--color-brutal-border) rounded-none text-(--color-brutal-text)">
        <div className="flex items-center justify-between p-5 border-b-2 border-(--color-brutal-border) bg-(--color-background)">
          <h3 className="text-xl font-bold uppercase tracking-tight text-(--color-brutal-text)">{title}</h3>
          <button 
            onClick={onClose}
            className="text-(--color-text-muted) hover:text-(--color-brutal-text) hover:bg-(--color-brutal-hover) transition-colors p-1"
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
