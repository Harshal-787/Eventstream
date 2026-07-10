import React, { useEffect, useState } from 'react';
import { buildingService } from '../../services/buildingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Box } from '../../components/ui/Box';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Building2, Plus, Edit, Trash2, Eye, Layers, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { AddBuildingModal } from './AddBuildingModal';
import { EditBuildingModal } from './EditBuildingModal';
import { StatusActionDropdown } from '../../components/ui/StatusActionDropdown';
import { Tabs } from '../../components/ui/Tabs';
import { UserFloorsRoomsTab } from '../user/UserFloorsRoomsTab';
import { UserRequestSensorTab } from '../user/UserRequestSensorTab';

export function Buildings({ role }) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState(null);
  
  // Tab state for Users
  const [activeTab, setActiveTab] = useState('buildings');

  useEffect(() => {
    fetchBuildings();
  }, []);

  const fetchBuildings = async () => {
    try {
      setLoading(true);
      const data = await buildingService.getBuildings();
      setBuildings(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (id) => {
    try {
      await buildingService.updateStatus(id, 'active');
      fetchBuildings();
    } catch (err) {
      console.error('Failed to approve building', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await buildingService.updateStatus(id, 'rejected');
      fetchBuildings();
    } catch (err) {
      console.error('Failed to reject building', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this building?")) return;
    try {
      await buildingService.deleteBuilding(id);
      fetchBuildings();
    } catch (err) {
      console.error('Failed to delete building', err);
    }
  };

  if (loading) return <Spinner size="lg" />;

  const userTabs = [
    { id: 'buildings', label: 'My Buildings', icon: Building2 },
    { id: 'floors', label: 'Floors & Rooms', icon: Layers },
    { id: 'request', label: 'Request Sensor', icon: Cpu }
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-(--color-text-main)">Buildings</h1>
        {role === 'admin' && (
          <Button onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Building</Button>
        )}
      </div>

      {role === 'user' && (
        <Tabs tabs={userTabs} activeTab={activeTab} onChange={setActiveTab} />
      )}

      {/* Admin View or User "buildings" tab */}
      {(role === 'admin' || activeTab === 'buildings') && (
        <Box>
        {buildings.length === 0 ? (
          <EmptyState 
            title="No Buildings Found" 
            description="Get started by adding your first smart building to the platform."
            icon={Building2}
            action={role === 'admin' && <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>Add Building</Button>}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Name</TableHead>
                <TableHead>Address</TableHead>
                <TableHead>Location</TableHead>
                <TableHead>Assigned User</TableHead>
                <TableHead>Status</TableHead>
                {role === 'admin' && <TableHead>Details</TableHead>}
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings.map((bldg) => (
                <TableRow key={bldg.id}>
                  <TableCell className="font-medium">{bldg.name}</TableCell>
                  <TableCell>{bldg.address}</TableCell>
                  <TableCell>{bldg.city}, {bldg.state} {bldg.zip_code}</TableCell>
                  <TableCell>{bldg.owner_name || '-'}</TableCell>
                  <TableCell>
                    <StatusActionDropdown
                      status={bldg.status}
                      pendingLabel="Pending Setup"
                      onApprove={() => handleApprove(bldg.id)}
                      onReject={() => handleReject(bldg.id)}
                    />
                  </TableCell>
                  {role === 'admin' && (
                    <TableCell>
                      <Link to={`/${role}/buildings/${bldg.id}`}>
                        <Button size="sm" variant="secondary"><Eye className="w-4 h-4 mr-2" /> More Details</Button>
                      </Link>
                    </TableCell>
                  )}
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditBuilding(bldg)} title="Edit Details">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {role === 'admin' && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(bldg.id)} title="Delete Building">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>
      )}

      {role === 'user' && activeTab === 'floors' && (
        <UserFloorsRoomsTab buildings={buildings} />
      )}

      {role === 'user' && activeTab === 'request' && (
        <UserRequestSensorTab buildings={buildings} />
      )}

      {role === 'admin' && (
        <AddBuildingModal 
          isOpen={isAddModalOpen} 
          onClose={() => setIsAddModalOpen(false)} 
          onBuildingAdded={fetchBuildings} 
        />
      )}

      <EditBuildingModal
        isOpen={!!editBuilding}
        onClose={() => setEditBuilding(null)}
        building={editBuilding}
        onBuildingUpdated={fetchBuildings}
      />
    </div>
  );
}
