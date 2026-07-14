import { useStreamStore } from '../../../store/useStreamStore';

// Custom hook to consume live alerts from the global stream store
export const useLiveAlerts = () => {
  const { liveAlerts, alertUpdates, isConnected } = useStreamStore();
  return { liveAlerts, alertUpdates, isConnected };
};
