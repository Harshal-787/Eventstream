import React, { useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { useStreamStore } from '../store/useStreamStore';

export function StreamProvider({ children }) {
  const { setConnected, addLiveAlert, updateAlertStatus, addTelemetry } = useStreamStore();

  useEffect(() => {
    // Request notification permissions for desktop push notifications
    if (window.Notification && Notification.permission !== 'granted' && Notification.permission !== 'denied') {
      Notification.requestPermission();
    }

    const eventSource = new EventSource(`/api/v1/stream`, { withCredentials: true });

    eventSource.onopen = () => {
      setConnected(true);
      console.log('Connected to global real-time stream (Alerts & Telemetry)');
    };

    eventSource.addEventListener('alert', (event) => {
      try {
        const newAlert = JSON.parse(event.data);
        addLiveAlert(newAlert);
        
        // Push Notifications logic
        if (newAlert.severity === 'critical' || newAlert.severity === 'warning') {
          // Toast Notification
          toast.error(`NEW ALERT: ${newAlert.message} (Device ${newAlert.device_id})`, {
            duration: 5000,
            style: { border: '2px solid red', padding: '16px', color: 'white', backgroundColor: '#ef4444', fontWeight: 'bold' }
          });
          
          // Browser Push Notification
          if (window.Notification && Notification.permission === 'granted') {
            new Notification('EventStream Alert', {
              body: `${newAlert.type.toUpperCase()}: ${newAlert.message}`,
              icon: `${import.meta.env.BASE_URL}vite.svg`, // Assuming vite.svg is the public icon, can be customized
              requireInteraction: newAlert.severity === 'critical'
            });
          }
        }
      } catch (e) {
        console.error('Error parsing alert JSON', e);
      }
    });

    eventSource.addEventListener('alert_update', (event) => {
      try {
        const update = JSON.parse(event.data);
        updateAlertStatus(update.id, update.status);
      } catch (e) {
        console.error('Error parsing alert update JSON', e);
      }
    });

    eventSource.addEventListener('telemetry', (event) => {
      try {
        const data = JSON.parse(event.data);
        addTelemetry(data);
      } catch (e) {
        console.error('Error parsing telemetry JSON', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setConnected(false);
      eventSource.close();
      // Optional: Handle reconnection logic here with exponential backoff if desired
    };

    return () => {
      eventSource.close();
      setConnected(false);
    };
  }, []);

  return <>{children}</>;
}
