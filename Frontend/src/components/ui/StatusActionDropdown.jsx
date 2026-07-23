import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Badge } from './Badge';
import { ChevronDown, CheckCircle, XCircle } from 'lucide-react';
import { cn } from '../../lib/utils';

export function StatusActionDropdown({ status, pendingLabel, onApprove, onReject }) {
  const [isOpen, setIsOpen] = useState(false);
  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);
  const [dropdownStyle, setDropdownStyle] = useState({});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && !dropdownRef.current.contains(event.target) &&
        buttonRef.current && !buttonRef.current.contains(event.target)
      ) {
        setIsOpen(false);
      }
    };

    const handleScrollOrResize = () => {
      if (isOpen && buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setDropdownStyle({
          top: rect.bottom + window.scrollY + 4 + 'px',
          left: rect.left + window.scrollX + 'px',
        });
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    window.addEventListener('resize', handleScrollOrResize);
    window.addEventListener('scroll', handleScrollOrResize, true);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('resize', handleScrollOrResize);
      window.removeEventListener('scroll', handleScrollOrResize, true);
    };
  }, [isOpen]);

  const handleToggle = () => {
    if (!isOpen && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      setDropdownStyle({
        top: rect.bottom + window.scrollY + 4 + 'px',
        left: rect.left + window.scrollX + 'px',
      });
    }
    setIsOpen(!isOpen);
  };

  if (status !== 'pending_approval') {
    return (
      <Badge variant={status === 'active' ? 'success' : status === 'rejected' ? 'danger' : 'default'} className="capitalize">
        {status}
      </Badge>
    );
  }

  const dropdownMenu = (
    <div
      ref={dropdownRef}
      style={{ ...dropdownStyle, position: 'absolute' }}
      className="w-36 rounded-xl shadow-lg bg-surface z-50 border border-border-main overflow-hidden"
    >
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
  );

  return (
    <div className="relative inline-block text-left">
      <button 
        ref={buttonRef}
        type="button" 
        onClick={handleToggle}
        className="focus:outline-none inline-flex"
      >
        <Badge variant="warning" className="cursor-pointer hover:opacity-80 transition-opacity flex items-center pr-1.5">
          {pendingLabel}
          <ChevronDown className={cn("w-3 h-3 ml-1 transition-transform", isOpen ? "rotate-180" : "")} />
        </Badge>
      </button>

      {isOpen && createPortal(dropdownMenu, document.body)}
    </div>
  );
}
