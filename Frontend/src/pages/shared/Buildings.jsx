import React, { useEffect, useState } from 'react';
import { buildingService } from '../../services/buildingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Box } from '../../components/ui/Box';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { EmptyState } from '../../components/ui/EmptyState';
import { Badge } from '../../components/ui/Badge';
import { Building2, Plus, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { AddBuildingModal } from './AddBuildingModal';
import { EditBuildingModal } from './EditBuildingModal';

export function Buildings({ role }) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState(null);

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

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-(--color-text-main)">Buildings</h1>
        {role === 'admin' && (
          <Button onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Building</Button>
        )}
      </div>

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
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {buildings.map((bldg) => (
                <TableRow key={bldg.id}>
                  <TableCell className="font-medium">{bldg.name}</TableCell>
                  <TableCell>{bldg.address}</TableCell>
                  <TableCell>{bldg.city}, {bldg.state} {bldg.zip_code}</TableCell>
                  <TableCell>
                    <Badge variant={bldg.status === 'active' ? 'success' : bldg.status === 'pending_approval' ? 'warning' : bldg.status === 'rejected' ? 'danger' : 'default'}>
                      {bldg.status === 'pending_approval' ? 'Pending Setup' : bldg.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditBuilding(bldg)} title="Edit Details">
                      <Edit className="w-4 h-4" />
                    </Button>
                    {role === 'admin' && (
                      <Button size="sm" variant="danger" onClick={() => handleDelete(bldg.id)} title="Delete Building">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                    {role === 'admin' && bldg.status === 'pending_approval' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleApprove(bldg.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(bldg.id)}>
                          <XCircle className="w-4 h-4 mr-1" /> Reject
                        </Button>
                      </>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </Box>

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
