import React, { useState, useEffect } from 'react';
import { buildingService } from '../../buildings/services/buildingService';
import { deviceService } from '../../devices/services/deviceService';
import { Box } from '../../../components/ui/Box';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Cpu } from 'lucide-react';
import { toast } from 'react-hot-toast';

export function UserRequestSensorTab({ buildings }) {
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [requestData, setRequestData] = useState({ 
    sensor_type: 'temperature', 
    reason: '', 
    floor_id: '', 
    room_id: '',
    brand: '',
    model_name: '',
    hardware_id: '',
    is_byod: true // true = Bring Your Own Hardware, false = Request from IT
  });

  useEffect(() => {
    if (selectedBuildingId) {
      fetchFloorsAndRooms();
    } else {
      setFloors([]);
      setRooms([]);
    }
  }, [selectedBuildingId]);

  const fetchFloorsAndRooms = async () => {
    try {
      const fData = await buildingService.getFloors(selectedBuildingId);
      setFloors(fData || []);
      
      if (fData && fData.length > 0) {
        let allRooms = [];
        for (const f of fData) {
          const rData = await buildingService.getRooms(f.id);
          if (rData) allRooms = [...allRooms, ...rData];
        }
        setRooms(allRooms);
      } else {
        setRooms([]);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleRequestSensor = async (e) => {
    e.preventDefault();
    if (!selectedBuildingId) return;

    try {
      await deviceService.createSensorRequest({
        building_id: parseInt(selectedBuildingId),
        floor_id: parseInt(requestData.floor_id),
        room_id: parseInt(requestData.room_id),
        sensor_type: requestData.sensor_type,
        reason: requestData.reason,
        brand: requestData.is_byod ? requestData.brand : '',
        model_name: requestData.is_byod ? requestData.model_name : '',
        hardware_id: requestData.is_byod ? requestData.hardware_id : ''
      });
      toast.success(requestData.is_byod ? 'Hardware Registration Request sent to Admin' : 'Sensor Request sent to Admin');
      
      // Reset form
      setRequestData({
        ...requestData,
        reason: '', 
        floor_id: '', 
        room_id: '',
        brand: '',
        model_name: '',
        hardware_id: ''
      });
    } catch (err) { toast.error('Failed to request sensor'); }
  };

  return (
    <div className="space-y-6">
      <div className="max-w-md">
        <Select 
          label="Select Building" 
          value={selectedBuildingId} 
          onChange={(e) => setSelectedBuildingId(e.target.value)}
          options={[
            { value: '', label: 'Select a building...' },
            ...buildings.map(b => ({ value: b.id, label: b.name }))
          ]}
        />
      </div>

      {selectedBuildingId && (
        <Box className="p-6 max-w-3xl">
          <div className="flex items-center mb-6 border-b border-(--color-border-main) pb-4">
            <Cpu className="w-5 h-5 mr-2 text-(--color-primary-600)" />
            <h3 className="text-lg font-bold text-(--color-text-main)">
              Register Physical Sensor
            </h3>
          </div>
          
          <form onSubmit={handleRequestSensor} className="space-y-6">
            <div className="flex space-x-4 mb-4">
              <button 
                type="button"
                onClick={() => setRequestData({...requestData, is_byod: true})}
                className={`flex-1 py-2 px-4 rounded-xl border text-sm font-bold transition-colors ${requestData.is_byod ? 'bg-(--color-primary-600) text-white border-(--color-primary-600)' : 'bg-transparent text-(--color-text-muted) border-(--color-border-main) hover:bg-slate-100 dark:hover:bg-(--color-surface-hover)'}`}
              >
                I have my own hardware
              </button>
              <button 
                type="button"
                onClick={() => setRequestData({...requestData, is_byod: false})}
                className={`flex-1 py-2 px-4 rounded-xl border text-sm font-bold transition-colors ${!requestData.is_byod ? 'bg-(--color-primary-600) text-white border-(--color-primary-600)' : 'bg-transparent text-(--color-text-muted) border-(--color-border-main) hover:bg-slate-100 dark:hover:bg-(--color-surface-hover)'}`}
              >
                Request from IT
              </button>
            </div>

            {requestData.is_byod ? (
              <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                <p className="text-sm text-blue-600 dark:text-blue-400 font-bold">Bring Your Own Hardware</p>
                <p className="text-xs text-(--color-text-muted) mt-1">Submit the details of the physical sensor you installed. An Admin will review and provision it.</p>
              </div>
            ) : (
              <div className="p-4 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                <p className="text-sm text-purple-600 dark:text-purple-400 font-bold">Request from IT</p>
                <p className="text-xs text-(--color-text-muted) mt-1">Tell us what type of sensor you need for your room. An Admin will assign one from the warehouse inventory.</p>
              </div>
            )}

            <Select label="Sensor Type" value={requestData.sensor_type} onChange={e => setRequestData({...requestData, sensor_type: e.target.value})}
              options={[ 
                {value: 'temperature', label: 'Temperature'},
                {value: 'humidity', label: 'Humidity'},
                {value: 'temperature_humidity', label: 'Temperature & Humidity'}, 
                {value: 'water_leak', label: 'Water Leak (Moisture)'},
                {value: 'door', label: 'Door Access'},
                {value: 'motion', label: 'Motion'}, 
                {value: 'smoke', label: 'Smoke / Fire'}, 
                {value: 'air_quality', label: 'Air Quality'},
                {value: 'multisensor', label: 'Multisensor'},
                {value: 'power', label: 'Power Consumption'} 
              ]} />
            
            {requestData.is_byod && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Brand (e.g., Honeywell)" value={requestData.brand} onChange={e => setRequestData({...requestData, brand: e.target.value})} required placeholder="Brand" />
                  <Input label="Model Name" value={requestData.model_name} onChange={e => setRequestData({...requestData, model_name: e.target.value})} required placeholder="Model Name" />
                </div>
                <Input label="Hardware ID / MAC Address" value={requestData.hardware_id} onChange={e => setRequestData({...requestData, hardware_id: e.target.value})} required placeholder="e.g. 00:11:22:33:44:55" />
              </>
            )}

            <div className="grid grid-cols-2 gap-4">
              <Select label="Floor" value={requestData.floor_id} onChange={e => setRequestData({...requestData, floor_id: e.target.value})} required
                options={[ {value: '', label: 'Select Floor'}, ...floors.map(f => ({ value: f.id, label: f.name })) ]} />
              
              <Select label="Room" value={requestData.room_id} onChange={e => setRequestData({...requestData, room_id: e.target.value})} required
                options={[ {value: '', label: 'Select Room'}, ...rooms.filter(r => requestData.floor_id ? r.floor_id.toString() === requestData.floor_id : true).map(r => ({ value: r.id, label: r.name })) ]} />
            </div>
            
            <Input label="Installation Notes / Reason" value={requestData.reason} onChange={e => setRequestData({...requestData, reason: e.target.value})} required placeholder="Notes on placement, etc." />
            
            <div className="pt-4 flex justify-end">
              <Button type="submit">{requestData.is_byod ? 'Submit Hardware' : 'Send Request'}</Button>
            </div>
          </form>
        </Box>
      )}
    </div>
  );
}
