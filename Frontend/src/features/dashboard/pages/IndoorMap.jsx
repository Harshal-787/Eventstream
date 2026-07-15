import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapContainer, ImageOverlay, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import apiClient from '../../../services/apiClient';
import { Box } from '../../../components/ui/Box';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { toast } from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';

export function IndoorMap({ role = 'admin' }) {
  const { id } = useParams();
  const navigate = useNavigate();
  const [floor, setFloor] = useState(null);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);

  // We need the floor data to get the floor_plan_url and building_id.
  // Actually, we don't have a GET /api/v1/floors/:id endpoint.
  // Let's just fetch all devices first and see if we can get floor info.
  // Wait, the API returns a list of floors for a building. Since we only have floor ID,
  // we might need to add a GET /api/v1/floors/:id endpoint to the backend, OR 
  // fetch buildings -> floors. 
  // Let's assume we can fetch devices for the floor. Since we don't have `GET /api/v1/floors/:id`, 
  // we can just fetch all devices, filter by floor, or I can quickly add `GET /api/v1/floors/:id` to the backend.
  // For now, I will add `GET /api/v1/floors/:id` to the backend.

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // We will need to implement GET /api/v1/floors/:id on backend!
      const floorRes = await apiClient.get(`/floors/${id}`);
      setFloor(floorRes.data);

      const devRes = await apiClient.get(`/devices?status=`); 
      // Filter manually for now or use query params if backend supports floor_id filter (currently supports building_id)
      const floorDevices = devRes.data.filter(d => d.floor_id === parseInt(id));
      setDevices(floorDevices);
    } catch (err) {
      toast.error('Failed to load map data');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDragEnd = async (e, device) => {
    const marker = e.target;
    const position = marker.getLatLng();
    // position is an object { lat, lng } which represents y and x in image coordinate space
    const x = position.lng;
    const y = position.lat;

    try {
      // Update device mapping using Assignment endpoint (which now supports map_x and map_y)
      await apiClient.patch(`/devices/${device.id}/assign`, {
        map_x: x,
        map_y: y,
        building_id: device.building_id,
        floor_id: device.floor_id,
        room_id: device.room_id
      });
      toast.success('Device location updated');
    } catch (err) {
      toast.error('Failed to update location');
      marker.setLatLng([device.map_y || 0, device.map_x || 0]); // Revert
    }
  };

  if (loading) {
    return <div className="p-8 flex justify-center"><Spinner /></div>;
  }

  if (!floor || !floor.floor_plan_url) {
    return (
      <Box className="p-8 max-w-2xl mx-auto text-center space-y-4 mt-8">
        <h2 className="text-xl font-bold text-(--color-text-main)">No Floor Plan Found</h2>
        <p className="text-(--color-text-muted)">
          This floor does not have a blueprint image uploaded. Please edit the floor and add a Floor Plan URL.
        </p>
        <Button onClick={() => navigate(`/${role}/dashboard`)}>Go Back</Button>
      </Box>
    );
  }

  // Use arbitrary bounds for the image projection
  const bounds = [[0, 0], [1000, 1000]]; // We map the image to a 1000x1000 coordinate system

  return (
    <div className="h-[calc(100vh-64px)] w-full flex flex-col bg-(--color-background)">
      <div className="p-4 border-b border-(--color-border-main) bg-(--color-surface) flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate(`/${role}/dashboard`)}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h2 className="text-xl font-bold text-(--color-text-main)">Floor Map: {floor.name}</h2>
        </div>
        <div className="text-sm text-(--color-text-muted)">
          Drag devices to set their real-world location.
        </div>
      </div>
      
      <div className="flex-1 relative">
        <MapContainer 
          bounds={bounds} 
          crs={L.CRS.Simple} // Simple CRS is for flat images like maps
          minZoom={-1}
          style={{ height: '100%', width: '100%', background: '#111' }}
        >
          <ImageOverlay
            url={floor.floor_plan_url}
            bounds={bounds}
          />
          
          {devices.map(dev => (
            <Marker 
              key={dev.id}
              position={[dev.map_y || 500, dev.map_x || 500]} // Default to center if unmapped
              draggable={true}
              eventHandlers={{
                dragend: (e) => handleDragEnd(e, dev),
              }}
              icon={L.divIcon({
                className: 'custom-icon',
                html: `<div style="background-color: ${dev.status === 'offline' ? '#dc2626' : '#22c55e'}; width: 14px; height: 14px; border-radius: 50%; border: 2px solid white; box-shadow: 0 0 4px rgba(0,0,0,0.5);"></div>`,
                iconSize: [14, 14],
                iconAnchor: [7, 7]
              })}
            >
              <Popup>
                <div className="text-sm font-bold">{dev.name}</div>
                <div className="text-xs text-gray-500">{dev.type} - {dev.status}</div>
                <div className="text-xs mt-1">Room: {dev.room_name || 'Unassigned'}</div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}
