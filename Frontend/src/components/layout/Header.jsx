import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, Search, User } from 'lucide-react';

export function Header() {
  const user = useAuthStore(state => state.user);

  return (
    <header className="h-16 bg-(--color-surface)/80 backdrop-blur-md border-b border-(--color-border-main) flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center bg-(--color-background) border border-(--color-border-main) px-3 py-1.5 w-64">
        <Search className="w-4 h-4 text-(--color-text-muted) mr-2" />
        <input 
          type="text" 
          placeholder="Search..." 
          className="bg-transparent border-none outline-none text-sm w-full text-(--color-text-main) placeholder:text-(--color-text-muted)"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-(--color-text-muted) hover:text-(--color-text-main) transition-colors">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border border-(--color-surface)"></span>
        </button>
        
        <div className="h-6 w-px bg-(--color-border-main) mx-1"></div>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-medium text-(--color-text-main)">{user?.name || 'User'}</div>
            <div className="text-xs text-(--color-text-muted) capitalize">{user?.role || 'operator'}</div>
          </div>
          <div className="w-8 h-8 bg-(--color-primary-100) dark:bg-(--color-primary-900) flex items-center justify-center rounded-none text-(--color-primary-700) dark:text-(--color-primary-400)">
            <User className="w-4 h-4" />
          </div>
        </div>
      </div>
    </header>
  );
}
