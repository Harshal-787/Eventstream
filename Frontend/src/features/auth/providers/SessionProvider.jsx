import React, { useEffect, createContext } from 'react';
import { useAuthStore } from '../store/useAuthStore';
import toast from 'react-hot-toast';

export const SessionContext = createContext();

export const SessionProvider = ({ children }) => {
  const { isAuthenticated, logout } = useAuthStore();

  useEffect(() => {
    if (!isAuthenticated) return;

    // 1. Cross-tab logout detection
    const channel = new BroadcastChannel('auth-session');
    
    channel.onmessage = (event) => {
      if (event.data === 'logout') {
        logout();
        toast.error('Session ended in another tab.');
      }
    };

    // 2. Idle Timeout Detection (e.g. 30 minutes)
    let timeoutId;
    const MAX_IDLE_TIME = 30 * 60 * 1000;

    const resetTimer = () => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => {
        logout();
        channel.postMessage('logout');
        toast.error('Session expired due to inactivity.');
      }, MAX_IDLE_TIME);
    };

    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart'];
    events.forEach(event => document.addEventListener(event, resetTimer, true));
    
    resetTimer();

    return () => {
      channel.close();
      clearTimeout(timeoutId);
      events.forEach(event => document.removeEventListener(event, resetTimer, true));
    };
  }, [isAuthenticated, logout]);

  return (
    <SessionContext.Provider value={{}}>
      {children}
    </SessionContext.Provider>
  );
};
