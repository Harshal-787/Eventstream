import React, { useEffect, useState } from 'react';
import { Box } from '../../components/ui/Box';
import { EmptyState } from '../../components/ui/EmptyState';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../components/ui/Table';
import { Badge } from '../../components/ui/Badge';
import { Users as UsersIcon, CheckCircle, XCircle, Edit, Trash2 } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Spinner } from '../../components/ui/Spinner';
import { userService } from '../../services/userService';
import { EditUserModal } from './EditUserModal';

export function Users() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editUser, setEditUser] = useState(null);

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

  if (loading) return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-(--color-text-main)">User Management</h1>
      </div>
      <Box>
        {users.length === 0 ? (
          <EmptyState 
            title="No Users Found" 
            description="Manage platform users and access permissions."
            icon={UsersIcon}
          />
        ) : (
          <Table>
            <TableHeader>
              <TableRow hover={false}>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell className="font-medium">{user.name}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell className="capitalize">{user.role}</TableCell>
                  <TableCell>
                    <Badge variant={user.status === 'active' ? 'success' : user.status === 'pending_approval' ? 'warning' : user.status === 'rejected' ? 'danger' : 'default'}>
                      {user.status === 'pending_approval' ? 'Pending Approval' : user.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right space-x-2">
                    <Button size="sm" variant="secondary" onClick={() => setEditUser(user)} title="Edit User">
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button size="sm" variant="danger" onClick={() => handleDelete(user.id)} title="Delete User">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    {user.status === 'pending_approval' && (
                      <>
                        <Button size="sm" variant="success" onClick={() => handleApprove(user.id)}>
                          <CheckCircle className="w-4 h-4 mr-1" /> Approve
                        </Button>
                        <Button size="sm" variant="danger" onClick={() => handleReject(user.id)}>
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

      <EditUserModal
        isOpen={!!editUser}
        onClose={() => setEditUser(null)}
        user={editUser}
        onUserUpdated={fetchUsers}
      />
    </div>
  );
}
