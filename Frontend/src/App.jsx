import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './features/auth/store/useAuthStore';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './features/auth/pages/Login';
import { Register } from './features/auth/pages/Register';
import { Reapply } from './features/auth/pages/Reapply';
import { ForgotPassword } from './features/auth/pages/ForgotPassword';
import { ResetPassword } from './features/auth/pages/ResetPassword';
import { LandingPage } from './features/landing/pages/LandingPage';
import { Spinner } from './components/ui/Spinner';
import { Toaster } from 'react-hot-toast';

import { SessionProvider } from './features/auth/providers/SessionProvider';

// Placeholder Pages
import { AdminDashboard } from './features/dashboard/pages/AdminDashboard';
import { UserDashboard } from './features/dashboard/pages/UserDashboard';
import { Buildings } from './features/buildings/pages/Buildings';
import { BuildingDetails } from './features/buildings/pages/BuildingDetails';
import { Devices } from './features/devices/pages/Devices';
import { SensorEvents } from './features/events/pages/SensorEvents';
import { Alerts } from './features/alerts/pages/Alerts';
import { AlertRules } from './features/alerts/pages/AlertRules';
import { Users } from './features/users/pages/Users';
import AuditLogs from './features/audit/pages/AuditLogs';

export default function App() {
  const { checkAuth, isCheckingAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
    
    const handleAuthError = () => {
      useAuthStore.getState().logout();
    };
    window.addEventListener('auth-error', handleAuthError);

    // Silent Token Refresh every 5 minutes (300000ms)
    const refreshInterval = setInterval(() => {
      const state = useAuthStore.getState();
      if (state.isAuthenticated) {
        import('./services/apiClient').then(({ default: apiClient }) => {
          apiClient.post('/auth/refresh').catch(() => {
            // If refresh fails (e.g. token expired beyond refresh limit), logout
            state.logout();
          });
        });
      }
    }, 300000);

    return () => {
      window.removeEventListener('auth-error', handleAuthError);
      clearInterval(refreshInterval);
    };
  }, [checkAuth]);

  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-(--color-background)">
        <Spinner size="xl" />
      </div>
    );
  }

  return (
    <BrowserRouter>
      <SessionProvider>
        <Routes>
          <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to={user?.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
          <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user?.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
          <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={user?.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
          <Route path="/reapply" element={!isAuthenticated ? <Reapply /> : <Navigate to={user?.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
          <Route path="/forgot-password" element={!isAuthenticated ? <ForgotPassword /> : <Navigate to={user?.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
          <Route path="/reset-password" element={!isAuthenticated ? <ResetPassword /> : <Navigate to={user?.role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
          
          {/* Admin Routes */}
          <Route path="/admin" element={<DashboardLayout role="admin" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<AdminDashboard />} />
            <Route path="buildings" element={<Buildings role="admin" />} />
            <Route path="buildings/:id" element={<BuildingDetails role="admin" />} />
            <Route path="devices" element={<Devices role="admin" />} />
            <Route path="events" element={<SensorEvents role="admin" />} />
            <Route path="alerts" element={<Alerts role="admin" />} />
            <Route path="alert-rules" element={<AlertRules />} />
            <Route path="users" element={<Users />} />
            <Route path="audit-logs" element={<AuditLogs />} />
          </Route>

          {/* User Routes */}
          <Route path="/user" element={<DashboardLayout role="user" />}>
            <Route index element={<Navigate to="dashboard" replace />} />
            <Route path="dashboard" element={<UserDashboard />} />
            <Route path="buildings" element={<Buildings role="user" />} />
            <Route path="buildings/:id" element={<BuildingDetails role="user" />} />
            <Route path="devices" element={<Devices role="user" />} />
            <Route path="events" element={<SensorEvents role="user" />} />
            <Route path="alerts" element={<Alerts role="user" />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster position="top-right" />
      </SessionProvider>
    </BrowserRouter>
  );
}
