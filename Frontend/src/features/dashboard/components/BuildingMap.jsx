import React, { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { buildingService } from '../../buildings/services/buildingService';
import { deviceService } from '../../devices/services/deviceService';
import { Badge } from '../../../components/ui/Badge';
import { Building2, Activity, MapPin } from 'lucide-react';
import { Spinner } from '../../../components/ui/Spinner';

// Fix for default marker icon in react-leaflet
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

export function BuildingMap() {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [devicesByBuilding, setDevicesByBuilding] = useState({});

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [buildingsRes, devicesRes] = await Promise.all([
        buildingService.getBuildings(),
        deviceService.getDevices() // Fetch all devices
      ]);
      
      const bData = buildingsRes.data || [];
      const dData = devicesRes.data || [];

      // Only keep buildings that have latitude and longitude
      const mappedBuildings = bData.filter(b => b.latitude && b.longitude);
      setBuildings(mappedBuildings);

      // Group devices by building
      const grouped = {};
      dData.forEach(d => {
        if (d.building_id) {
          if (!grouped[d.building_id]) {
            grouped[d.building_id] = { total: 0, offline: 0, active: 0 };
          }
          grouped[d.building_id].total++;
          if (d.status === 'offline') {
            grouped[d.building_id].offline++;
          } else if (d.status === 'active') {
            grouped[d.building_id].active++;
          }
        }
      });
      setDevicesByBuilding(grouped);
      setLoading(false);
    } catch (error) {
      console.error('Failed to load map data:', error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[500px] w-full bg-(--color-surface) rounded-2xl border border-(--color-border) shadow-sm">
        <Spinner size="lg" className="text-(--color-primary)" />
      </div>
    );
  }

  // Default center: if no buildings, default to New York, otherwise center of first building
  const center = buildings.length > 0 
    ? [buildings[0].latitude, buildings[0].longitude] 
    : [40.7128, -74.0060];

  return (
    <div className="bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm overflow-hidden h-[600px] flex flex-col relative z-0">
      <div className="p-4 border-b border-(--color-border-main) flex justify-between items-center bg-(--color-surface)">
        <div className="flex items-center gap-2">
          <MapPin className="w-5 h-5 text-(--color-primary)" />
          <h2 className="text-sm font-semibold text-(--color-text-main)">Global Building Overview</h2>
        </div>
        <div className="text-xs text-(--color-text-muted)">
          {buildings.length} Mapped {buildings.length === 1 ? 'Building' : 'Buildings'}
        </div>
      </div>
      
      <div className="flex-1 relative">
        <MapContainer center={center} zoom={12} style={{ height: '100%', width: '100%' }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
          
          {buildings.map(building => {
            const stats = devicesByBuilding[building.id] || { total: 0, offline: 0, active: 0 };
            return (
              <Marker key={building.id} position={[building.latitude, building.longitude]}>
                <Popup className="custom-popup">
                  <div className="p-1 min-w-[200px]">
                    <div className="flex items-center gap-2 border-b border-gray-100 pb-2 mb-2">
                      <Building2 className="w-4 h-4 text-indigo-600" />
                      <h3 className="font-semibold text-gray-900">{building.name}</h3>
                    </div>
                    <p className="text-xs text-gray-500 mb-3">{building.address}, {building.city}</p>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-slate-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-gray-500 font-medium">Total Devices</p>
                        <p className="text-lg font-bold text-slate-700">{stats.total}</p>
                      </div>
                      <div className="bg-red-50 p-2 rounded-lg text-center">
                        <p className="text-xs text-red-600 font-medium">Offline</p>
                        <p className="text-lg font-bold text-red-600">{stats.offline}</p>
                      </div>
                    </div>
                    
                    <div className="mt-3 text-center">
                      <Badge variant={building.status === 'active' ? 'success' : 'warning'}>
                        {building.status}
                      </Badge>
                    </div>
                  </div>
                </Popup>
              </Marker>
            );
          })}
        </MapContainer>
      </div>
    </div>
  );
}
