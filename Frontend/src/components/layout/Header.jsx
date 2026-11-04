import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useStreamStore } from '../../store/useStreamStore';
import { Bell, Search, User, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';
import { GlobalSearch } from './GlobalSearch';

export function Header() {
  const user = useAuthStore(state => state.user);
  const { liveAlerts, alertUpdates } = useStreamStore();
  const navigate = useNavigate();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);

  const activeAlerts = liveAlerts.filter(a => alertUpdates[a.id] !== 'resolved' && alertUpdates[a.id] !== 'acknowledged');
  const unreadCount = activeAlerts.length;

  const alertsRef = useRef(null);
  const profileRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) setIsAlertsOpen(false);
      if (profileRef.current && !profileRef.current.contains(event.target)) setIsProfileOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <header className="h-20 bg-surface border-b border-border-main flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 shadow-sm transition-all">
      <div className="relative w-full max-w-md">
        <button 
          onClick={() => setIsSearchOpen(true)}
          className="flex items-center justify-between bg-surface hover:bg-slate-50 dark:hover:bg-surface-hover border border-border-main rounded-xl px-4 py-2 w-full shadow-sm transition-all text-left"
        >
          <div className="flex items-center text-text-muted">
            <Search className="w-4 h-4 mr-3" />
            <span className="text-sm font-medium">Search globally...</span>
          </div>
          <div className="flex items-center gap-1 ml-auto">
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-text-muted border border-border-main">Ctrl</kbd>
            <span className="text-text-muted text-xs">+</span>
            <kbd className="px-1.5 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-text-muted border border-border-main">K</kbd>
          </div>
        </button>
        <GlobalSearch isOpen={isSearchOpen} onClose={() => setIsSearchOpen(false)} />
      </div>

      <div className="flex items-center gap-5 ml-auto">
        <div className="relative" ref={alertsRef}>
          <button 
            className="relative p-2.5 rounded-full text-slate-600 dark:text-text-main hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-surface-hover transition-all"
            onClick={() => setIsAlertsOpen(!isAlertsOpen)}
          >
            <Bell className="w-5 h-5" strokeWidth={2.5} />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-4 h-4 bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-white dark:border-slate-900">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>

          <AnimatePresence>
            {isAlertsOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+8px)] right-0 w-80 sm:w-96 bg-surface border border-border-main rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden origin-top-right"
              >
                <div className="p-4 border-b border-border-main flex items-center justify-between bg-slate-50/50 dark:bg-surface">
                  <span className="font-bold text-sm text-text-main">Notifications</span>
                  <button onClick={() => setIsAlertsOpen(false)} className="text-text-muted hover:text-text-main p-1 rounded-md hover:bg-slate-200 dark:hover:bg-surface-hover transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {activeAlerts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-text-muted font-medium">You're all caught up!</div>
                  ) : (
                    <ul className="divide-y divide-border-main">
                      {activeAlerts.slice(0, 5).map((alert) => (
                        <li key={alert.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => navigate(`/${user?.role}/alerts`)}>
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-sm font-bold text-text-main group-hover:text-primary-600 transition-colors">{alert.type || alert.alert_type}</span>
                            <Badge variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'info'}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-text-muted line-clamp-2 leading-relaxed">{alert.message}</p>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">{new Date(alert.triggered_at).toLocaleTimeString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {activeAlerts.length > 5 && (
                  <div className="p-3 border-t border-border-main bg-slate-50 dark:bg-surface text-center">
                    <Link to={`/${user?.role}/alerts`} className="text-sm font-semibold text-primary-600 hover:text-primary-700 transition-colors" onClick={() => setIsAlertsOpen(false)}>
                      View All Notifications ({activeAlerts.length})
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <ThemeToggle />

        <div className="h-8 w-px bg-border-main mx-1 hidden sm:block"></div>
        
        <div className="relative" ref={profileRef}>
          <button 
            onClick={() => setIsProfileOpen(!isProfileOpen)}
            className="flex items-center gap-3 cursor-pointer group pl-2 text-left"
            title="Profile Options"
          >
            <div className="hidden sm:block text-right">
              <div className="text-sm font-bold text-text-main">{user?.name || 'User'}</div>
              <div className="text-xs font-medium text-text-muted capitalize">{user?.role || 'operator'}</div>
            </div>
            <div className="w-10 h-10 rounded-full border-2 border-transparent bg-teal-50 dark:bg-teal-500/10 flex items-center justify-center text-primary-600 group-hover:border-primary-200 dark:group-hover:border-primary-800 transition-all">
              <User className="w-5 h-5" />
            </div>
          </button>
          
          <AnimatePresence>
            {isProfileOpen && (
              <motion.div 
                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 10, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+8px)] right-0 w-56 bg-surface border border-border-main rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden origin-top-right"
              >
                <div className="p-4 border-b border-border-main bg-slate-50/50 dark:bg-surface">
                  <div className="font-bold text-sm text-text-main truncate">{user?.name || 'User'}</div>
                  <div className="text-xs text-text-muted truncate">{user?.email || 'admin@example.com'}</div>
                </div>
                <div className="p-2">
                  <button 
                    onClick={() => {
                      useAuthStore.getState().logout();
                      navigate('/login');
                    }}
                    className="w-full flex items-center gap-3 px-3 py-2 text-sm font-medium text-rose-600 hover:text-rose-700 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                  >
                    Log Out
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </header>
  );
}
