import React from 'react';
import { useAuthStore } from '../../store/useAuthStore';
import { Bell, Search, User } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';

export function Header() {
  const user = useAuthStore(state => state.user);

  return (
    <header className="h-16 bg-(--color-brutal-bg)/90 backdrop-blur-md border-b-2 border-(--color-brutal-border) flex items-center justify-between px-6 sticky top-0 z-10">
      <div className="flex items-center bg-(--color-background) border-2 border-(--color-brutal-border) px-3 py-1.5 w-64 shadow-md">
        <Search className="w-4 h-4 text-(--color-text-muted) mr-2" />
        <input 
          type="text" 
          placeholder="SEARCH..." 
          className="bg-transparent border-none outline-none text-xs font-bold uppercase tracking-wider w-full text-(--color-brutal-text) placeholder:text-(--color-text-muted)"
        />
      </div>

      <div className="flex items-center gap-4">
        <button className="relative p-2 text-(--color-text-muted) hover:text-(--color-brutal-text) hover:bg-(--color-brutal-hover) border-2 border-transparent hover:border-(--color-brutal-border) transition-all">
          <Bell className="w-5 h-5" />
          <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-red-500 border-2 border-(--color-brutal-bg)"></span>
        </button>
        
        <ThemeToggle />

        <div className="h-6 w-0.5 bg-(--color-brutal-border) mx-1"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-black uppercase tracking-wider text-(--color-brutal-text)">{user?.name || 'User'}</div>
            <div className="text-[10px] font-bold uppercase tracking-widest text-(--color-text-muted)">{user?.role || 'operator'}</div>
          </div>
          <div className="w-10 h-10 border-2 border-(--color-brutal-border) bg-(--color-brutal-bg) flex items-center justify-center text-(--color-brutal-text) group-hover:bg-(--color-brutal-inverse-bg) group-hover:text-(--color-brutal-text-inverse) transition-colors shadow-md">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
