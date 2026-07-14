import { create } from 'zustand';

export const useStreamStore = create((set) => ({
  isConnected: false,
  liveAlerts: [],
  alertUpdates: {},
  telemetry: null,
  telemetryMap: {},

  setConnected: (status) => set({ isConnected: status }),
  
  addLiveAlert: (alert) => set((state) => ({ 
      liveAlerts: [alert, ...state.liveAlerts] 
  })),
  
  updateAlertStatus: (id, status) => set((state) => ({
      alertUpdates: { ...state.alertUpdates, [id]: status }
  })),
  
  addTelemetry: (data) => set((state) => ({
      telemetry: data,
      telemetryMap: { ...state.telemetryMap, [data.device_id]: data }
  }))
}));
