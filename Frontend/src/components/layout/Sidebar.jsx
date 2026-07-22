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
  LogOut
} from 'lucide-react';
import { useAuthStore } from '../../store/useAuthStore';

export function Sidebar({ role }) {
  const logout = useAuthStore(state => state.logout);

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
    <aside className="w-64 bg-(--color-surface) border-r border-(--color-border-main) h-screen sticky top-0 flex flex-col z-20">
      <div className="h-16 flex items-center px-6 border-b border-(--color-border-main)">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-(--color-primary-600) flex items-center justify-center text-white font-bold text-lg">
            E
          </div>
          <span className="font-bold text-lg text-(--color-text-main) tracking-tight">EventStream Go</span>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        <div className="text-xs font-semibold text-(--color-text-muted) uppercase tracking-wider mb-2 px-3">
          {role === 'admin' ? 'Admin Panel' : 'Customer View'}
        </div>
        {menu.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => cn(
              "flex items-center gap-3 px-3 py-2 text-sm font-medium transition-colors",
              isActive 
                ? "bg-(--color-primary-50) text-(--color-primary-700) dark:bg-(--color-primary-900)/20 dark:text-(--color-primary-500) border-l-2 border-(--color-primary-600)" 
                : "text-(--color-text-muted) hover:bg-(--color-surface-hover) hover:text-(--color-text-main) border-l-2 border-transparent"
            )}
          >
            <item.icon className="w-5 h-5" />
            {item.title}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-(--color-border-main)">
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2 w-full text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Logout
        </button>
      </div>
    </aside>
  );
}
