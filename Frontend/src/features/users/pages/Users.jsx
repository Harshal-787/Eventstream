import React, { useEffect, useState } from 'react';
import { Box } from '../../../components/ui/Box';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { Badge } from '../../../components/ui/Badge';
import { Users as UsersIcon, Edit, Trash2, Search } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '../../../components/ui/Button';
import { Spinner } from '../../../components/ui/Spinner';
import { userService } from '../services/userService';
import { EditUserModal } from './EditUserModal';
import { StatusActionDropdown } from '../../../components/ui/StatusActionDropdown';

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await userService.getUsers();
      setUsers(data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleApprove = async (id) => {
    try {
      await userService.updateStatus(id, 'active');
      fetchUsers();
    } catch (err) {
      console.error('Failed to approve user', err);
    }
  };

  const handleReject = async (id) => {
    try {
      await userService.updateStatus(id, 'rejected');
      fetchUsers();
    } catch (err) {
      console.error('Failed to reject user', err);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to permanently delete this user?")) return;
    try {
      await userService.deleteUser(id);
      fetchUsers();
    } catch (err) {
      console.error('Failed to delete user', err);
    }
  };

  const filteredUsers = users.filter(u =>
    !searchQuery ||
    (u.name && u.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (u.email && u.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-text-main">User Management</h1>
      </div>
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden"
      >
        <div className="p-4 border-b border-border-main bg-slate-50 dark:bg-surface">
          <div className="relative max-w-md">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-11 pr-4 py-2.5 bg-white dark:bg-surface border border-slate-200 dark:border-border-main rounded-xl text-sm w-full font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
            />
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <EmptyState
            title="No Users Found"
            description="Manage platform users and access permissions."
            icon={UsersIcon}
            className="py-20"
          />
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 dark:bg-surface border-b border-border-main">
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Name</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Email</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Contact</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">License</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Role</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</TableHead>
                  <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody className="divide-y divide-border-main">
                {filteredUsers.map((user, index) => (
                  <TableRow
                    key={user.id}
                    as={motion.tr}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <TableCell className="py-4 font-bold text-text-main">{user.name}</TableCell>
                    <TableCell className="py-4 text-sm text-text-muted font-medium">{user.email}</TableCell>
                    <TableCell className="py-4 text-sm text-text-muted font-medium">{user.contact_number || '-'}</TableCell>
                    <TableCell className="py-4 text-sm text-text-muted font-medium">{user.driving_license || '-'}</TableCell>
                    <TableCell className="py-4 capitalize text-sm font-semibold text-text-main">{user.role}</TableCell>
                    <TableCell className="py-4">
                      <StatusActionDropdown
                        status={user.status}
                        pendingLabel="Pending Approval"
                        onApprove={() => handleApprove(user.id)}
                        onReject={() => handleReject(user.id)}
                      />
                    </TableCell>
                    <TableCell className="py-4 text-right space-x-2">
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-teal-600 hover:bg-teal-50 transition-colors" onClick={() => setEditUser(user)} title="Edit User">
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-rose-500 hover:bg-rose-50 transition-colors" onClick={() => handleDelete(user.id)} title="Delete User">
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>

      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
