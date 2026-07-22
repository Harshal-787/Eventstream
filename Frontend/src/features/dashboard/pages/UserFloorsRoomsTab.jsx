import React, { useState, useEffect } from 'react';
import { buildingService } from '../../buildings/services/buildingService';
import { Box } from '../../../components/ui/Box';
import { Select } from '../../../components/ui/Select';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Layers } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../auth/store/useAuthStore';

export function UserFloorsRoomsTab({ buildings }) {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const role = user?.role?.toLowerCase() === 'admin' ? 'admin' : 'user';
  const [selectedBuildingId, setSelectedBuildingId] = useState('');
  const [floors, setFloors] = useState([]);
  const [rooms, setRooms] = useState([]);

  // Modals state
  const [isFloorModalOpen, setIsFloorModalOpen] = useState(false);
  const [editingFloor, setEditingFloor] = useState(null);
  const [floorName, setFloorName] = useState('');
  const [floorLevel, setFloorLevel] = useState(1);
  const [floorPlanURL, setFloorPlanURL] = useState('');

  const [isRoomModalOpen, setIsRoomModalOpen] = useState(false);
  const [editingRoom, setEditingRoom] = useState(null);
  const [roomName, setRoomName] = useState('');
  const [roomType, setRoomType] = useState('office');
  const [selectedFloorForRoom, setSelectedFloorForRoom] = useState('');

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

  const handleSaveFloor = async (e) => {
    e.preventDefault();
    try {
      if (editingFloor) {
        await buildingService.updateFloor(editingFloor.id, { name: floorName, level: parseInt(floorLevel), floor_plan_url: floorPlanURL || null });
        toast.success('Floor updated');
      } else {
        await buildingService.createFloor(selectedBuildingId, { name: floorName, level: parseInt(floorLevel), floor_plan_url: floorPlanURL || null });
        toast.success('Floor created');
      }
      setIsFloorModalOpen(false);
      setEditingFloor(null);
      fetchFloorsAndRooms();
    } catch (err) { toast.error('Failed to save floor'); }
  };

  const handleDeleteFloor = async (floorId) => {
    if (!window.confirm("Delete this floor and all its rooms?")) return;
    try {
      await buildingService.deleteFloor(floorId);
      toast.success('Floor deleted');
      fetchFloorsAndRooms();
    } catch (err) { toast.error('Failed to delete floor'); }
  };

  const handleSaveRoom = async (e) => {
    e.preventDefault();
    try {
      if (editingRoom) {
        await buildingService.updateRoom(editingRoom.id, { name: roomName, type: roomType });
        toast.success('Room updated');
      } else {
        await buildingService.createRoom(selectedFloorForRoom, { name: roomName, type: roomType });
        toast.success('Room created');
      }
      setIsRoomModalOpen(false);
      setEditingRoom(null);
      fetchFloorsAndRooms();
    } catch (err) { toast.error('Failed to save room'); }
  };

  const handleDeleteRoom = async (roomId) => {
    if (!window.confirm("Delete this room?")) return;
    try {
      await buildingService.deleteRoom(roomId);
      toast.success('Room deleted');
      fetchFloorsAndRooms();
    } catch (err) { toast.error('Failed to delete room'); }
  };

  const openFloorModal = (floor = null) => {
    if (floor) {
      setEditingFloor(floor);
      setFloorName(floor.name);
      setFloorLevel(floor.level);
      setFloorPlanURL(floor.floor_plan_url || '');
    } else {
      setEditingFloor(null);
      setFloorName('');
      setFloorLevel(1);
      setFloorPlanURL('');
    }
    setIsFloorModalOpen(true);
  };

  const openRoomModal = (room = null) => {
    if (room) {
      setEditingRoom(room);
      setRoomName(room.name);
      setRoomType(room.type);
      setSelectedFloorForRoom(room.floor_id.toString());
    } else {
      setEditingRoom(null);
      setRoomName('');
      setRoomType('office');
      setSelectedFloorForRoom(floors.length > 0 ? floors[0].id.toString() : '');
    }
    setIsRoomModalOpen(true);
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
        <Box className="p-6 border-2 border-border-main shadow-md max-w-3xl">
          <div className="flex items-center justify-between mb-6 border-b border-border-main pb-4">
            <h3 className="text-lg font-bold text-text-main flex items-center">
              <Layers className="w-5 h-5 mr-2 text-primary-600" />
              Floors & Rooms
            </h3>
            <div className="flex gap-2">
              <Button size="sm" variant="secondary" onClick={() => openFloorModal()}>Add Floor</Button>
              <Button size="sm" variant="secondary" onClick={() => openRoomModal()}>Add Room</Button>
            </div>
          </div>
          
          <div className="space-y-4">
            {floors.length === 0 ? (
              <p className="text-sm text-text-muted">No floors configured.</p>
            ) : (
              floors.map(floor => (
                <div key={floor.id} className="border border-border p-3 bg-surface-hover group/floor">
                  <div className="flex justify-between items-center">
                    <p className="font-bold text-sm text-text-main">{floor.name} (Lvl {floor.level})</p>
                    <div className="flex gap-2 opacity-0 group-hover/floor:opacity-100 transition-opacity">
                      {floor.floor_plan_url && (
                        <button onClick={() => navigate(`/${role}/floors/${floor.id}/map`)} className="text-xs text-primary hover:text-primary-600 font-bold">View Map</button>
                      )}
                      <button onClick={() => openFloorModal(floor)} className="text-xs text-text-muted hover:text-primary">Edit</button>
                      <button onClick={() => handleDeleteFloor(floor.id)} className="text-xs text-text-muted hover:text-danger">Delete</button>
                    </div>
                  </div>
                  <div className="mt-2 pl-4 border-l-2 border-primary space-y-1">
                    {rooms.filter(r => r.floor_id === floor.id).map(room => (
                      <div key={room.id} className="text-sm text-text-muted flex justify-between items-center group/room">
                        <span>{room.name}</span>
                        <div className="flex items-center gap-2">
                          <div className="flex gap-2 opacity-0 group-hover/room:opacity-100 transition-opacity mr-2">
                            <button onClick={() => openRoomModal(room)} className="text-[10px] uppercase tracking-wider font-bold text-text-muted hover:text-primary">Edit</button>
                            <button onClick={() => handleDeleteRoom(room.id)} className="text-[10px] uppercase tracking-wider font-bold text-text-muted hover:text-danger">Delete</button>
                          </div>
                          <span className="text-[10px] font-bold uppercase tracking-wider bg-background px-1.5 py-0.5 rounded border border-border">{room.type}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            )}
          </div>
        </Box>
      )}

      <Modal isOpen={isFloorModalOpen} onClose={() => setIsFloorModalOpen(false)} title={editingFloor ? "Edit Floor" : "Create Floor"}>
        <form onSubmit={handleSaveFloor} className="space-y-4">
          <Input label="Floor Name (e.g. Ground Floor)" value={floorName} onChange={e => setFloorName(e.target.value)} required />
          <Input type="number" label="Level Number (e.g. 1)" value={floorLevel} onChange={e => setFloorLevel(e.target.value)} required />
          <Input label="Floor Plan URL (optional blueprint image link)" value={floorPlanURL} onChange={e => setFloorPlanURL(e.target.value)} placeholder="https://example.com/blueprint.png" />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsFloorModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingFloor ? "Save Changes" : "Create"}</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isRoomModalOpen} onClose={() => setIsRoomModalOpen(false)} title={editingRoom ? "Edit Room" : "Create Room"}>
        <form onSubmit={handleSaveRoom} className="space-y-4">
          <Select label="Floor" value={selectedFloorForRoom} onChange={e => setSelectedFloorForRoom(e.target.value)} required disabled={!!editingRoom}
            options={[ {value: '', label: 'Select Floor'}, ...floors.map(f => ({ value: f.id, label: f.name })) ]} />
          <Input label="Room Name" value={roomName} onChange={e => setRoomName(e.target.value)} required />
          <Select label="Type" value={roomType} onChange={e => setRoomType(e.target.value)}
            options={[ {value: 'office', label: 'Office'}, {value: 'server_room', label: 'Server Room'}, {value: 'lobby', label: 'Lobby'}, {value: 'restroom', label: 'Restroom'} ]} />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsRoomModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingRoom ? "Save Changes" : "Create"}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
