import React, { useState, useRef, useEffect } from 'react';
import { Badge } from './Badge';
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatusActionDropdown({ status, pendingLabel, onApprove, onReject }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  if (status !== 'pending_approval') {
    return (
      <Badge variant={status === 'active' ? 'success' : status === 'rejected' ? 'danger' : 'default'} className="capitalize">
        {status}
      </Badge>
    );
  }

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <button 
        type="button" 
        onClick={() => setIsOpen(!isOpen)}
        className="focus:outline-none inline-flex"
      >
        <Badge variant="warning" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center pr-1.5">
          {pendingLabel}
          <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", isOpen ? "rotate-180" : "")} />
        </Badge>
      </button>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-1 w-36 rounded-xl shadow-lg bg-surface z-50 border border-border-main overflow-hidden">
          <div className="py-1 flex flex-col" role="menu" aria-orientation="vertical">
            <button
              onClick={() => {
                onApprove();
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-text-main hover:bg-emerald-50 hover:text-emerald-700 dark:hover:bg-emerald-900/30 dark:hover:text-emerald-400 text-left w-full transition-colors"
              role="menuitem"
            >
              <CheckCircle className="w-4 h-4 mr-2 text-emerald-500" />
              Approve
            </button>
            <button
              onClick={() => {
                onReject();
                setIsOpen(false);
              }}
              className="flex items-center px-4 py-2 text-sm font-medium text-text-main hover:bg-red-50 hover:text-red-700 dark:hover:bg-red-900/30 dark:hover:text-red-400 text-left w-full transition-colors"
              role="menuitem"
            >
              <XCircle className="w-4 h-4 mr-2 text-red-500" />
              Reject
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
