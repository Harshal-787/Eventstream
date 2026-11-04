import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  Cpu, 
  Activity, 
  Bell, 
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  Webhook,
  Server,
  ActivitySquare,
  Sparkles
} from 'lucide-react';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { Logo } from '../ui/Logo';

export function Sidebar({ role }) {
  const logout = useAuthStore(state => state.logout);
  const [isCollapsed, setIsCollapsed] = React.useState(false);

  const adminMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/admin/dashboard' },
    { title: 'Buildings', icon: Building2, path: '/admin/buildings' },
    { title: 'Devices', icon: Cpu, path: '/admin/devices' },
    { title: 'Events', icon: Activity, path: '/admin/events' },
    { title: 'Alerts', icon: Bell, path: '/admin/alerts' },
    { title: 'Alert Rules', icon: Settings, path: '/admin/alert-rules' },
    { title: 'Channels', icon: Webhook, path: '/admin/notification-channels' },
    { title: 'Escalation Policies', icon: Settings, path: '/admin/escalation-policies' },
    { title: 'Reports', icon: FileText, path: '/admin/reports' },
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Audit Logs', icon: ClipboardList, path: '/admin/audit-logs' },
    { title: 'API Management', icon: Server, path: '/admin/api-management' },
    { title: 'AI Integrations', icon: Sparkles, path: '/admin/ai-settings' },
    { title: 'System Health', icon: ActivitySquare, path: '/admin/operations/health' },
  ];

  const userMenu = [
    { title: 'Dashboard', icon: LayoutDashboard, path: '/user/dashboard' },
    { title: 'Buildings', icon: Building2, path: '/user/buildings' },
    { title: 'Devices', icon: Cpu, path: '/user/devices' },
    { title: 'Events', icon: Activity, path: '/user/events' },
    { title: 'Alerts', icon: Bell, path: '/user/alerts' },
  ];

  const menu = role === 'admin' ? adminMenu : userMenu;

  return (
    <aside 
      className={cn(
        "bg-surface border-r border-border-main h-screen sticky top-0 flex flex-col z-40 transition-all duration-300 relative shadow-sm",
        isCollapsed ? "w-20" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-[26px] bg-white dark:bg-surface-hover border border-border-main text-slate-600 dark:text-text-main hover:text-teal-600 w-7 h-7 rounded-full flex items-center justify-center z-50 cursor-pointer shadow-sm transition-transform hover:scale-110"
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4 ml-0.5" /> : <ChevronLeft className="w-4 h-4 mr-0.5" />}
      </button>

      <div className={cn("h-20 flex items-center shrink-0 border-b border-border-main/50", isCollapsed ? "justify-center px-0" : "px-6")}>
        <div className="flex items-center gap-3">
          <Logo className={isCollapsed ? "w-8 h-8" : "w-8 h-8"} hideText={isCollapsed} />
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-6 space-y-1 overflow-x-hidden px-3 scrollbar-hide">
        {!isCollapsed && (
          <div className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4 px-3">
            {role === 'admin' ? 'Admin Panel' : 'Customer View'}
          </div>
        )}
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.title : undefined}
            className={({ isActive }) => cn(
              "flex items-center gap-3 py-2.5 rounded-xl text-sm font-semibold transition-all duration-200 group relative",
              isCollapsed ? "px-0 justify-center" : "px-3",
              isActive 
                ? "bg-teal-50 dark:bg-teal-500/10 text-primary-600" 
                : "text-text-muted hover:bg-slate-100 dark:hover:bg-slate-800/50 hover:text-text-main"
            )}
          >
            {({ isActive }) => (
              <>
                {isActive && !isCollapsed && (
                  <span className="absolute left-0 w-1 h-6 bg-primary-500 rounded-r-full" />
                )}
                <item.icon className={cn("w-5 h-5 shrink-0 transition-colors", isActive ? "text-primary-600" : "text-text-muted group-hover:text-text-main")} strokeWidth={isActive ? 2.5 : 2} />
                {!isCollapsed && <span className="truncate">{item.title}</span>}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-border-main/50">
        <button
          onClick={logout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center w-full text-sm font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors rounded-xl",
            isCollapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" strokeWidth={2} />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
