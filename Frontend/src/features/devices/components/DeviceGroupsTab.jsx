import React, { useEffect, useState } from 'react';
import { deviceService } from '../services/deviceService';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Folder, Plus, Trash2, Users } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { motion } from 'framer-motion';

export function DeviceGroupsTab({ role, devices }) {
  const [groups, setGroups] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: '', description: '' });

  const [selectedGroup, setSelectedGroup] = useState(null);
  const [isMembersOpen, setIsMembersOpen] = useState(false);
  const [members, setMembers] = useState([]);
  const [addDeviceIds, setAddDeviceIds] = useState('');

  useEffect(() => {
    fetchGroups();
  }, []);

  const fetchGroups = async () => {
    try {
      setLoading(true);
      const data = await deviceService.getDeviceGroups();
      setGroups(data || []);
    } catch (err) {
      toast.error('Failed to load device groups');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateGroup = async (e) => {
    e.preventDefault();
    try {
      await deviceService.createDeviceGroup(newGroup);
      toast.success('Device group created');
      setIsCreateOpen(false);
      setNewGroup({ name: '', description: '' });
      fetchGroups();
    } catch (err) {
      toast.error('Failed to create device group');
    }
  };

  const handleDeleteGroup = async (id) => {
    if (!window.confirm('Are you sure you want to delete this group?')) return;
    try {
      await deviceService.deleteDeviceGroup(id);
      toast.success('Group deleted');
      fetchGroups();
    } catch (err) {
      toast.error('Failed to delete group');
    }
  };

  const openMembers = async (group) => {
    setSelectedGroup(group);
    setIsMembersOpen(true);
    fetchMembers(group.id);
  };

  const fetchMembers = async (id) => {
    try {
      const data = await deviceService.getDeviceGroupMembers(id);
      setMembers(data || []);
    } catch (err) {
      toast.error('Failed to load members');
    }
  };

  const handleAddMembers = async (e) => {
    e.preventDefault();
    const ids = addDeviceIds.split(',').map(s => parseInt(s.trim(), 10)).filter(id => !isNaN(id));
    if (ids.length === 0) return toast.error('Enter valid numeric device IDs');
    
    try {
      await deviceService.addDeviceGroupMembers(selectedGroup.id, ids);
      toast.success('Members added');
      setAddDeviceIds('');
      fetchMembers(selectedGroup.id);
    } catch (err) {
      toast.error('Failed to add members');
    }
  };

  const handleRemoveMember = async (deviceId) => {
    try {
      await deviceService.removeDeviceGroupMember(selectedGroup.id, deviceId);
      toast.success('Member removed');
      fetchMembers(selectedGroup.id);
    } catch (err) {
      toast.error('Failed to remove member');
    }
  };

  if (loading && groups.length === 0) return <Spinner size="lg" />;

  return (
    <div className="space-y-4">
      <div className="flex justify-end mb-4">
        {role === 'admin' && (
          <Button onClick={() => setIsCreateOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Group
          </Button>
        )}
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm overflow-hidden"
      >
        {groups.length === 0 ? (
          <EmptyState 
            title="No Device Groups" 
            description="Create groups to organize devices."
            icon={Folder}
            className="py-20"
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="bg-slate-50 dark:bg-(--color-surface) border-b border-(--color-border-main)">
                <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Name</TableHead>
                <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Description</TableHead>
                <TableHead className="py-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody className="divide-y divide-(--color-border-main)">
              {groups.map(g => (
                <TableRow key={g.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                  <TableCell className="font-medium">
                    <div className="flex items-center gap-2 text-(--color-text-main)">
                      <Folder className="w-4 h-4 text-indigo-500" />
                      {g.name}
                    </div>
                  </TableCell>
                  <TableCell className="text-(--color-text-muted)">{g.description || '--'}</TableCell>
                  <TableCell className="text-right">
                    <Button size="sm" variant="secondary" className="mr-2" onClick={() => openMembers(g)}>
                      <Users className="w-4 h-4 mr-2" /> Members
                    </Button>
                    {role === 'admin' && (
                      <Button size="icon" variant="ghost" className="h-8 w-8 text-rose-500 hover:bg-rose-50" onClick={() => handleDeleteGroup(g.id)}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </motion.div>

      {/* Create Group Modal */}
      <Modal isOpen={isCreateOpen} onClose={() => setIsCreateOpen(false)} title="Create Device Group">
        <form onSubmit={handleCreateGroup} className="space-y-4">
          <Input
            label="Group Name"
            value={newGroup.name}
            onChange={e => setNewGroup({ ...newGroup, name: e.target.value })}
            required
            placeholder="e.g. HVAC Systems"
          />
          <Input
            label="Description"
            value={newGroup.description}
            onChange={e => setNewGroup({ ...newGroup, description: e.target.value })}
            placeholder="Optional details"
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsCreateOpen(false)}>Cancel</Button>
            <Button type="submit">Create</Button>
          </div>
        </form>
      </Modal>

      {/* Manage Members Modal */}
      <Modal isOpen={isMembersOpen} onClose={() => setIsMembersOpen(false)} title={`Manage Group: ${selectedGroup?.name}`}>
        <div className="space-y-6">
          <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-(--color-border-main)">
            <h4 className="text-sm font-semibold mb-3">Add Members</h4>
            <form onSubmit={handleAddMembers} className="flex gap-2">
              <Input
                className="flex-1"
                placeholder="Comma-separated Device IDs (e.g. 1, 2, 5)"
                value={addDeviceIds}
                onChange={e => setAddDeviceIds(e.target.value)}
                required
              />
              <Button type="submit">Add</Button>
            </form>
          </div>

          <div>
            <h4 className="text-sm font-semibold mb-3">Current Members</h4>
            {members.length === 0 ? (
              <p className="text-sm text-(--color-text-muted)">No devices in this group.</p>
            ) : (
              <div className="border border-(--color-border-main) rounded-xl overflow-hidden max-h-[300px] overflow-y-auto">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-slate-50 dark:bg-(--color-surface)">
                      <TableHead className="py-2 text-xs">Device ID</TableHead>
                      <TableHead className="py-2 text-xs">Name</TableHead>
                      <TableHead className="py-2 text-xs text-right">Remove</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map(m => (
                      <TableRow key={m.device_id}>
                        <TableCell className="py-2 text-sm">{m.device_id}</TableCell>
                        <TableCell className="py-2 text-sm font-medium">{devices.find(d => d.id === m.device_id)?.name || m.device_id}</TableCell>
                        <TableCell className="py-2 text-right">
                          <Button size="icon" variant="ghost" className="h-6 w-6 text-rose-500 hover:bg-rose-50" onClick={() => handleRemoveMember(m.device_id)}>
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
}
