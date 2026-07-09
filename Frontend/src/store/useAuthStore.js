import { create } from 'zustand';
import { authService } from '../services/authService';

export const useAuthStore = create((set) => ({
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isCheckingAuth: true,
  error: null,

  register: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.register(payload);
      set({ isLoading: false });
      return data; // Return the response so Register.jsx can show the success message
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Registration failed',
        isLoading: false,
      });
      throw err;
    }
  },

  reapply: async (payload) => {
    set({ isLoading: true, error: null });
    try {
      const data = await authService.reapply(payload);
      set({ isLoading: false });
      return data;
    } catch (err) {
      set({
        error: err.response?.data?.error || 'Re-application failed',
        isLoading: false,
      });
      throw err;
    }
  },

  login: async (email, password) => {
    try {
      set({ isLoading: true, error: null });
      const data = await authService.login(email, password);
      
      if (data.require_otp) {
        set({ isLoading: false });
        return { require_otp: true, email: data.email };
      }

      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return { require_otp: false };
    } catch (error) {
      set({ 
        error: error.response?.data?.error || 'Login failed', 
        isLoading: false 
      });
      if (error.response?.data?.status === 'rejected') {
        throw { isRejected: true, message: error.response.data.error };
      }
      throw error;
    }
  },

  verifyOtp: async (email, otp) => {
    try {
      set({ isLoading: true, error: null });
      const data = await authService.verifyOtp(email, otp);
      set({ user: data.user, isAuthenticated: true, isLoading: false });
      return true;
    } catch (error) {
      set({
        error: error.response?.data?.error || 'Invalid OTP',
        isLoading: false
      });
      throw error;
    }
  },

  logout: () => {
    authService.logout();
    set({ user: null, isAuthenticated: false });
  },

  checkAuth: async () => {
    try {
      set({ isCheckingAuth: true });
      const token = localStorage.getItem('token');
      if (!token) {
        set({ user: null, isAuthenticated: false, isCheckingAuth: false });
        return;
      }
      const data = await authService.getMe();
      set({ user: data, isAuthenticated: true, isCheckingAuth: false });
    } catch (error) {
      set({ user: null, isAuthenticated: false, isCheckingAuth: false });
      localStorage.removeItem('token');
    }
  }
}));
