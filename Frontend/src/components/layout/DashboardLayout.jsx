import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../store/useAuthStore';
import { Spinner } from '../ui/Spinner';

export function DashboardLayout({ role }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-(--color-background)"><Spinner size="xl" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // Optional: Enforce role-based routing if user.role doesn't match the layout route
  // if (role === 'admin' && user?.role !== 'admin') {
  //   return <Navigate to="/user/dashboard" replace />;
  // }

  return (
    <div className="flex h-screen overflow-hidden bg-(--color-background)">
      <Sidebar role={role} />
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-(--color-background) p-6">
          <div className="max-w-7xl mx-auto w-full">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
