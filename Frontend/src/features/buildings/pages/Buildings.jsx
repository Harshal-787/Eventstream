import React, { useEffect, useState } from 'react';
import { buildingService } from '../services/buildingService';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Box } from '../../../components/ui/Box';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Badge } from '../../../components/ui/Badge';
import { Building2, Plus, Edit, Trash2, Eye, Layers, Cpu, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AddBuildingModal } from './AddBuildingModal';
import { EditBuildingModal } from './EditBuildingModal';
import { StatusActionDropdown } from '../../../components/ui/StatusActionDropdown';
import { Tabs } from '../../../components/ui/Tabs';
import { UserFloorsRoomsTab } from '../../dashboard/pages/UserFloorsRoomsTab';
import { UserRequestSensorTab } from '../../dashboard/pages/UserRequestSensorTab';

export function Buildings({ role }) {
  const [buildings, setBuildings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editBuilding, setEditBuilding] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  
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

  const filteredBuildings = buildings.filter(b => 
    !searchQuery || 
    (b.name && b.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.address && b.address.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (b.city && b.city.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <Spinner size="lg" />;

  const userTabs = [
    { id: 'buildings', label: 'My Buildings', icon: Building2 },
    { id: 'floors', label: 'Floors & Rooms', icon: Layers },
    { id: 'request', label: 'Request Sensor', icon: Cpu }
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-4 mb-2">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-main)">Buildings</h1>
        </div>
        <div className="flex gap-2">
          {role === 'admin' && (
            <Button onClick={() => setIsAddModalOpen(true)}><Plus className="w-4 h-4 mr-2" /> Add Building</Button>
          )}
        </div>
      </div>

      {role === 'user' && (
        <Tabs tabs={userTabs} activeTab={activeTab} onChange={setActiveTab} />
      )}

      {/* Admin View or User "buildings" tab */}
      {(role === 'admin' || activeTab === 'buildings') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-(--color-border-main) bg-slate-50 dark:bg-(--color-surface)">
            <div className="relative max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search buildings..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-white dark:bg-(--color-surface) border border-slate-200 dark:border-(--color-border-main) rounded-xl text-sm w-full font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all"
              />
            </div>
          </div>
          
        {filteredBuildings.length === 0 ? (
          <EmptyState 
            title="No Buildings Found" 
            description="Get started by adding your first smart building to the platform."
            icon={Building2}
            action={role === 'admin' && <Button variant="secondary" onClick={() => setIsAddModalOpen(true)}>Add Building</Button>}
            className="py-20"
          />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-(--color-surface) border-b border-(--color-border-main)">
                  <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Name</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Address</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Location</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Assigned User</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Status</TableHead>
                  {role === 'admin' && <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Details</TableHead>}
                  <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-(--color-border-main)">
                {filteredBuildings.map((bldg, index) => (
                  <TableRow 
                    key={bldg.id}
                    as={motion.tr}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <TableCell className="py-4 font-bold text-(--color-text-main)">{bldg.name}</TableCell>
                    <TableCell className="py-4 text-sm text-(--color-text-muted) font-medium">{bldg.address}</TableCell>
                    <TableCell className="py-4 text-sm text-(--color-text-muted) font-medium">{bldg.city}, {bldg.state} {bldg.zip_code}</TableCell>
                    <TableCell className="py-4 text-sm font-semibold text-(--color-text-main)">{bldg.owner_name || '-'}</TableCell>
                    <TableCell className="py-4">
                      <StatusActionDropdown
                        status={bldg.status}
                        pendingLabel="Pending Setup"
                        onApprove={() => handleApprove(bldg.id)}
                        onReject={() => handleReject(bldg.id)}
                      />
                    </TableCell>
                    {role === 'admin' && (
                      <TableCell className="py-4">
                        <Link to={`/${role}/buildings/${bldg.id}`}>
                          <Button size="sm" variant="secondary" className="rounded-lg h-auto py-1.5"><Eye className="w-4 h-4 mr-2" /> Details</Button>
                        </Link>
                      </TableCell>
                    )}
                    <TableCell className="py-4 text-right space-x-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-indigo-600 hover:bg-indigo-50 transition-colors" onClick={() => setEditBuilding(bldg)} title="Edit Details">
                        <Edit className="w-4 h-4" />
                      </Button>
                      {role === 'admin' && (
                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-rose-500 hover:bg-rose-50 transition-colors" onClick={() => handleDelete(bldg.id)} title="Delete Building">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
        </motion.div>
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
