import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { DashboardLayout } from './components/layout/DashboardLayout';
import { Login } from './pages/Login';
import { Register } from './pages/Register';
import { Reapply } from './pages/Reapply';
import { LandingPage } from './pages/LandingPage';
import { Spinner } from './components/ui/Spinner';

// Placeholder Pages
import { AdminDashboard } from './pages/admin/AdminDashboard';
import { UserDashboard } from './pages/user/UserDashboard';
import { Buildings } from './pages/shared/Buildings';
import { Devices } from './pages/shared/Devices';
import { SensorEvents } from './pages/shared/SensorEvents';
import { Alerts } from './pages/shared/Alerts';
import { AlertRules } from './pages/admin/AlertRules';
import { Users } from './pages/admin/Users';

export default function App() {
  const { checkAuth, isCheckingAuth, isAuthenticated, user } = useAuthStore();

  useEffect(() => {
    checkAuth();
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
      <Routes>
        <Route path="/" element={!isAuthenticated ? <LandingPage /> : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
        <Route path="/login" element={!isAuthenticated ? <Login /> : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
        <Route path="/register" element={!isAuthenticated ? <Register /> : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
        <Route path="/reapply" element={!isAuthenticated ? <Reapply /> : <Navigate to={user?.role === 'admin' ? '/admin/dashboard' : '/user/dashboard'} />} />
        
        {/* Admin Routes */}
        <Route path="/admin" element={<DashboardLayout role="admin" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<AdminDashboard />} />
          <Route path="buildings" element={<Buildings role="admin" />} />
          <Route path="devices" element={<Devices role="admin" />} />
          <Route path="events" element={<SensorEvents role="admin" />} />
          <Route path="alerts" element={<Alerts role="admin" />} />
          <Route path="alert-rules" element={<AlertRules />} />
          <Route path="users" element={<Users />} />
          <Route path="audit-logs" element={<div className="p-6">Audit Logs Placeholder</div>} />
        </Route>

        {/* User Routes */}
        <Route path="/user" element={<DashboardLayout role="user" />}>
          <Route index element={<Navigate to="dashboard" replace />} />
          <Route path="dashboard" element={<UserDashboard />} />
          <Route path="buildings" element={<Buildings role="user" />} />
          <Route path="devices" element={<Devices role="user" />} />
          <Route path="events" element={<SensorEvents role="user" />} />
          <Route path="alerts" element={<Alerts role="user" />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
