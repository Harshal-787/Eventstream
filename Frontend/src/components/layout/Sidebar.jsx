import React from 'react';
import { NavLink } from 'react-router-dom';
import { cn } from '../../lib/utils';
import { 
  LayoutDashboard, 
  Building2, 
  Cpu, 
  Activity, 
  Bell, 
  BarChart3, 
  Settings,
  Users,
  LogOut,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

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
    { title: 'Users', icon: Users, path: '/admin/users' },
    { title: 'Audit Logs', icon: BarChart3, path: '/admin/audit-logs' },
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
        "bg-(--color-brutal-bg) border-r-2 border-(--color-brutal-border) h-screen sticky top-0 flex flex-col z-20 transition-all duration-300 relative",
        isCollapsed ? "w-16" : "w-64"
      )}
    >
      {/* Collapse Toggle */}
      <button
        onClick={() => setIsCollapsed(!isCollapsed)}
        className="absolute -right-3.5 top-5 bg-(--color-brutal-bg) border-2 border-(--color-brutal-border) text-(--color-brutal-text) hover:bg-(--color-brutal-hover) w-7 h-7 flex items-center justify-center z-50 cursor-pointer shadow-md transition-transform   "
      >
        {isCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>

      <div className="h-16 flex items-center px-4 border-b-2 border-(--color-brutal-border) overflow-hidden shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 shrink-0 bg-(--color-brutal-inverse-bg) flex items-center justify-center text-(--color-brutal-text-inverse) font-black text-lg">
            E
          </div>
          {!isCollapsed && (
            <span className="font-black text-lg text-(--color-brutal-text) tracking-tight uppercase truncate">EventStream</span>
          )}
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 space-y-1 overflow-x-hidden">
        {!isCollapsed && (
          <div className="text-[10px] font-black text-(--color-text-muted) uppercase tracking-widest mb-2 px-5">
            {role === 'admin' ? 'Admin Panel' : 'Customer View'}
          </div>
        )}
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            title={isCollapsed ? item.title : undefined}
            className={({ isActive }) => cn(
              "flex items-center gap-3 py-3 text-sm font-bold uppercase tracking-wider transition-colors border-l-4",
              isCollapsed ? "px-5 justify-center border-transparent" : "px-5",
              isActive 
                ? "bg-(--color-brutal-hover) text-(--color-brutal-text) border-(--color-brutal-border)" 
                : "text-(--color-text-muted) hover:bg-(--color-surface-hover) hover:text-(--color-brutal-text) border-transparent"
            )}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!isCollapsed && <span className="truncate">{item.title}</span>}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t-2 border-(--color-brutal-border)">
        <button
          onClick={logout}
          title={isCollapsed ? "Logout" : undefined}
          className={cn(
            "flex items-center w-full text-sm font-bold uppercase tracking-wider text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-2 border-transparent hover:border-red-600",
            isCollapsed ? "justify-center p-2" : "gap-3 px-3 py-2"
          )}
        >
          <LogOut className="w-5 h-5 shrink-0" />
          {!isCollapsed && <span>Logout</span>}
        </button>
      </div>
    </aside>
  );
}
