import { useState, useEffect } from 'react';

// Custom hook to connect to the SSE Telemetry Stream
export const useTelemetry = (filterDeviceIds = null) => {
  const [telemetry, setTelemetry] = useState(null);
  const [telemetryMap, setTelemetryMap] = useState({});
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // We assume the user has a token in localStorage
    const token = localStorage.getItem('token');
    
    // Note: Standard EventSource doesn't support Authorization headers easily.
    // If your backend requires it, you can pass it as a query param like ?token=
    // Here we connect to the stream endpoint using relative path to utilize Vite proxy:
    const eventSource = new EventSource(`/api/v1/stream?token=${token}`);

    eventSource.onopen = () => {
      setIsConnected(true);
      console.log('Connected to real-time telemetry stream');
    };

    eventSource.addEventListener('telemetry', (event) => {
      try {
        const data = JSON.parse(event.data);
        // If filterDeviceIds is provided, only accept matching devices
        if (filterDeviceIds && filterDeviceIds.length > 0) {
          if (!filterDeviceIds.includes(data.device_id)) {
            return; // Ignore this payload
          }
        }
        
        setTelemetry(data);
        setTelemetryMap(prev => ({
          ...prev,
          [data.device_id]: data
        }));
      } catch (e) {
        console.error('Error parsing telemetry JSON', e);
      }
    });

    eventSource.onerror = (error) => {
      console.error('SSE Error:', error);
      setIsConnected(false);
      eventSource.close();
      
      // Auto-reconnect logic could go here, or rely on browser's native reconnect
    };

    return () => {
      eventSource.close();
    };
  }, []);

  return { telemetry, telemetryMap, isConnected };
};
