import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { useStreamStore } from '../../store/useStreamStore';
import { Bell, Search, User, X } from 'lucide-react';
import { ThemeToggle } from '../ui/ThemeToggle';
import { useNavigate, Link } from 'react-router-dom';
import { Badge } from '../ui/Badge';
import { motion, AnimatePresence } from 'framer-motion';

export function Header() {
  const user = useAuthStore(state => state.user);
  const { liveAlerts, alertUpdates } = useStreamStore();
  const navigate = useNavigate();

  const [isAlertsOpen, setIsAlertsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchOpen, setIsSearchOpen] = useState(false);

  const activeAlerts = liveAlerts.filter(a => alertUpdates[a.id] !== 'resolved' && alertUpdates[a.id] !== 'acknowledged');
  const unreadCount = activeAlerts.length;

  const alertsRef = useRef(null);
  const searchRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (alertsRef.current && !alertsRef.current.contains(event.target)) setIsAlertsOpen(false);
      if (searchRef.current && !searchRef.current.contains(event.target)) setIsSearchOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const searchOptions = [
    { name: 'Dashboard', keywords: ['dashboard', 'home', 'main'], path: `/${user?.role}/dashboard` },
    { name: 'Devices & Sensors', keywords: ['devices', 'sensors', 'hardware', 'inventory'], path: `/${user?.role}/devices` },
    { name: 'Buildings & Locations', keywords: ['buildings', 'locations', 'floors', 'rooms'], path: `/${user?.role}/buildings` },
    { name: 'Live Alerts', keywords: ['alerts', 'notifications', 'live', 'issues'], path: `/${user?.role}/alerts` },
    ...(user?.role === 'admin' ? [
      { name: 'User Management', keywords: ['users', 'user', 'people', 'accounts', 'management'], path: '/admin/users' },
      { name: 'Audit Logs', keywords: ['audit', 'logs', 'history', 'activity'], path: '/admin/audit-logs' }
    ] : [])
  ];

  const filteredSearch = searchOptions.filter(opt => {
    const query = searchQuery.toLowerCase();
    return opt.name.toLowerCase().includes(query) || opt.keywords.some(k => k.includes(query));
  });

  return (
    <header className="h-20 bg-(--color-surface) border-b border-(--color-border-main) flex items-center justify-between px-6 md:px-8 sticky top-0 z-30 shadow-sm transition-all">
      <div className="relative w-full max-w-md" ref={searchRef}>
        <div className="flex items-center bg-(--color-surface) border border-(--color-border-main) rounded-xl px-4 py-2.5 w-full shadow-[0_2px_10px_rgb(0,0,0,0.02)] focus-within:ring-2 focus-within:ring-(--color-primary-500)/20 focus-within:border-(--color-primary-400) transition-all">
          <Search className="w-4 h-4 text-(--color-text-muted) mr-3" />
          <input 
            type="text" 
            placeholder="Search resources, alerts, devices..." 
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            onFocus={() => setIsSearchOpen(true)}
            className="bg-transparent border-none outline-none text-sm font-medium w-full text-(--color-text-main) placeholder:text-(--color-text-muted)"
          />
        </div>
        <AnimatePresence>
          {isSearchOpen && searchQuery && (
            <motion.div 
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 5 }}
              className="absolute top-full left-0 mt-2 w-full bg-(--color-surface) border border-(--color-border-main) rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto py-2"
            >
              {filteredSearch.length === 0 ? (
                <div className="p-4 text-sm text-(--color-text-muted) font-medium text-center">No matching resources found</div>
              ) : (
                <ul className="px-2 space-y-1">
                  {filteredSearch.map((opt, i) => (
                    <li key={i}>
                      <button
                        className="w-full text-left px-3 py-2.5 text-sm font-semibold text-(--color-text-main) rounded-lg hover:bg-slate-100 dark:hover:bg-(--color-surface-hover) transition-colors"
                        onClick={() => {
                          navigate(opt.path);
                          setIsSearchOpen(false);
                          setSearchQuery('');
                        }}
                      >
                        {opt.name}
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex items-center gap-5 ml-auto">
        <div className="relative" ref={alertsRef}>
          <button 
            className="relative p-2.5 rounded-full text-slate-600 dark:text-(--color-text-main) hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-(--color-surface-hover) transition-all"
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
                className="absolute top-[calc(100%+8px)] right-0 w-80 sm:w-96 bg-(--color-surface) border border-(--color-border-main) rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden origin-top-right"
              >
                <div className="p-4 border-b border-(--color-border-main) flex items-center justify-between bg-slate-50/50 dark:bg-(--color-surface)">
                  <span className="font-bold text-sm text-(--color-text-main)">Notifications</span>
                  <button onClick={() => setIsAlertsOpen(false)} className="text-(--color-text-muted) hover:text-(--color-text-main) p-1 rounded-md hover:bg-slate-200 dark:hover:bg-(--color-surface-hover) transition-colors">
                    <X className="w-4 h-4" />
                  </button>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {activeAlerts.length === 0 ? (
                    <div className="p-8 text-center text-sm text-(--color-text-muted) font-medium">You're all caught up!</div>
                  ) : (
                    <ul className="divide-y divide-(--color-border-main)">
                      {activeAlerts.slice(0, 5).map((alert) => (
                        <li key={alert.id} className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors cursor-pointer group" onClick={() => navigate(`/${user?.role}/alerts`)}>
                          <div className="flex justify-between items-start mb-1.5">
                            <span className="text-sm font-bold text-(--color-text-main) group-hover:text-(--color-primary-600) transition-colors">{alert.type || alert.alert_type}</span>
                            <Badge variant={alert.severity === 'critical' ? 'danger' : alert.severity === 'high' ? 'warning' : 'info'}>
                              {alert.severity}
                            </Badge>
                          </div>
                          <p className="text-xs text-(--color-text-muted) line-clamp-2 leading-relaxed">{alert.message}</p>
                          <p className="text-[11px] text-slate-400 mt-2 font-medium">{new Date(alert.triggered_at).toLocaleTimeString()}</p>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                {activeAlerts.length > 5 && (
                  <div className="p-3 border-t border-(--color-border-main) bg-slate-50 dark:bg-(--color-surface) text-center">
                    <Link to={`/${user?.role}/alerts`} className="text-sm font-semibold text-(--color-primary-600) hover:text-(--color-primary-700) transition-colors" onClick={() => setIsAlertsOpen(false)}>
                      View All Notifications ({activeAlerts.length})
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        
        <ThemeToggle />

        <div className="h-8 w-px bg-(--color-border-main) mx-1 hidden sm:block"></div>
        
        <div className="flex items-center gap-3 cursor-pointer group pl-2">
          <div className="text-right hidden sm:block">
            <div className="text-sm font-bold text-(--color-text-main)">{user?.name || 'User'}</div>
            <div className="text-xs font-medium text-(--color-text-muted) capitalize">{user?.role || 'operator'}</div>
          </div>
          <div className="w-10 h-10 rounded-full border-2 border-transparent bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center text-(--color-primary-600) group-hover:border-(--color-primary-200) dark:group-hover:border-(--color-primary-800) transition-all">
            <User className="w-5 h-5" />
          </div>
        </div>
      </div>
    </header>
  );
}
