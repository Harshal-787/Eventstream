import React from 'react';
import { Outlet, Navigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { useAuthStore } from '../../features/auth/store/useAuthStore';
import { Spinner } from '../ui/Spinner';
import { StreamProvider } from '../../providers/StreamProvider';

export function DashboardLayout({ role }) {
  const { isAuthenticated, isLoading, user } = useAuthStore();

  if (isLoading) {
    return <div className="h-screen w-screen flex items-center justify-center bg-(--color-background)"><Spinner size="xl" /></div>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return (
    <StreamProvider>
      <div className="flex h-screen overflow-hidden bg-(--color-background) font-sans">
        <Sidebar role={role} />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-(--color-primary-50) dark:bg-(--color-primary-900)/10 rounded-full opacity-50 blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
          
          <Header />
          <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 md:p-8">
            <div className="max-w-[1600px] mx-auto w-full h-full">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </StreamProvider>
  );
}
