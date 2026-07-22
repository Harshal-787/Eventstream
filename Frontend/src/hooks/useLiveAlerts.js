import { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';

// Custom hook to connect to the SSE Alert Stream
export const useLiveAlerts = () => {
  const [liveAlerts, setLiveAlerts] = useState([]);
  const [alertUpdates, setAlertUpdates] = useState({}); // Map of id -> status
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    
    // Connect to the same SSE stream endpoint
    const eventSource = new EventSource(`/api/v1/stream?token=${token}`);

    eventSource.onopen = () => {
      setIsConnected(true);
    };

    // Listen for NEW alerts
    eventSource.addEventListener('alert', (event) => {
      try {
        const newAlert = JSON.parse(event.data);
        setLiveAlerts(prev => [newAlert, ...prev]);
        
        // Trigger a toast notification for critical alerts
        if (newAlert.severity === 'critical') {
            toast.error(`NEW ALERT: ${newAlert.message} (Device ${newAlert.device_id})`, {
                duration: 5000,
                style: { border: '2px solid red', padding: '16px', color: 'white', backgroundColor: '#ef4444', fontWeight: 'bold' }
            });
        }
      } catch (e) {
        console.error('Error parsing alert JSON', e);
      }
    });

    // Listen for alert STATUS UPDATES
    eventSource.addEventListener('alert_update', (event) => {
        try {
          const update = JSON.parse(event.data);
          setAlertUpdates(prev => ({
              ...prev,
              [update.id]: update.status
          }));
        } catch (e) {
          console.error('Error parsing alert update JSON', e);
        }
      });

    eventSource.onerror = (error) => {
      setIsConnected(false);
      eventSource.close();
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { liveAlerts, alertUpdates, isConnected };
};
