import { useStreamStore } from '../store/useStreamStore';
import { useMemo } from 'react';

// Custom hook to consume telemetry from the global stream store
export const useTelemetry = (filterDeviceIds = null) => {
  const { telemetry, telemetryMap, isConnected } = useStreamStore();

  // If filterDeviceIds is provided, we return a filtered version of the maps
  const filteredTelemetryMap = useMemo(() => {
    if (!filterDeviceIds || filterDeviceIds.length === 0) return telemetryMap;
    const filtered = {};
    for (const id of filterDeviceIds) {
      if (telemetryMap[id]) {
        filtered[id] = telemetryMap[id];
      }
    }
    return filtered;
  }, [telemetryMap, filterDeviceIds]);

  return { 
    telemetry: filterDeviceIds && filterDeviceIds.length > 0 && telemetry && !filterDeviceIds.includes(telemetry.device_id) ? null : telemetry, 
    telemetryMap: filteredTelemetryMap, 
    isConnected 
  };
};
