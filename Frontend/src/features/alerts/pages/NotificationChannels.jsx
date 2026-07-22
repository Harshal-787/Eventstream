import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import { Plus, Trash2, Edit2 } from 'lucide-react';
import notificationChannelService from '../../../services/notificationChannelService';
import { Button } from '../../../components/ui/Button';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';

const NotificationChannels = () => {
  const [channels, setChannels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingChannel, setEditingChannel] = useState(null);
  const [formData, setFormData] = useState({ name: '', type: 'slack', webhook_url: '', is_active: true });

  const fetchChannels = async () => {
    try {
      setLoading(true);
      const data = await notificationChannelService.getChannels();
      setChannels(data || []);
    } catch (err) {
      toast.error('Failed to load notification channels');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChannels();
  }, []);

  const handleOpenModal = (channel = null) => {
    if (channel) {
      setEditingChannel(channel);
      setFormData({ name: channel.name, type: channel.type, webhook_url: channel.webhook_url, is_active: channel.is_active });
    } else {
      setEditingChannel(null);
      setFormData({ name: '', type: 'slack', webhook_url: '', is_active: true });
    }
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingChannel) {
        await notificationChannelService.updateChannel(editingChannel.id, formData);
        toast.success('Channel updated successfully');
      } else {
        await notificationChannelService.createChannel(formData);
        toast.success('Channel created successfully');
      }
      setIsModalOpen(false);
      fetchChannels();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to save channel');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this channel?')) return;
    try {
      await notificationChannelService.deleteChannel(id);
      toast.success('Channel deleted');
      fetchChannels();
    } catch (err) {
      toast.error('Failed to delete channel');
    }
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-(--color-text-main)">Notification Channels</h1>
          <p className="text-(--color-text-muted) mt-1">Manage external webhook integrations (Slack, Teams, etc.)</p>
        </div>
        <Button onClick={() => handleOpenModal()} className="flex items-center gap-2">
          <Plus className="h-4 w-4" /> Add Channel
        </Button>
      </div>

      <div className="bg-(--color-surface) rounded-lg border border-(--color-border) overflow-hidden shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-(--color-background) border-b border-(--color-border)">
              <th className="p-4 font-semibold text-(--color-text-main)">Name</th>
              <th className="p-4 font-semibold text-(--color-text-main)">Type</th>
              <th className="p-4 font-semibold text-(--color-text-main)">Status</th>
              <th className="p-4 font-semibold text-(--color-text-main) text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan="4" className="p-4 text-center text-(--color-text-muted)">Loading...</td></tr>
            ) : channels.length === 0 ? (
              <tr><td colSpan="4" className="p-4 text-center text-(--color-text-muted)">No channels configured.</td></tr>
            ) : (
              channels.map((ch) => (
                <tr key={ch.id} className="border-b border-(--color-border) last:border-0 hover:bg-white/2 transition-colors">
                  <td className="p-4 text-(--color-text-main) font-medium">{ch.name}</td>
                  <td className="p-4">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 capitalize">
                      {ch.type}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ch.is_active ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
                      {ch.is_active ? 'Active' : 'Inactive'}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="icon" onClick={() => handleOpenModal(ch)} className="text-(--color-text-muted) hover:text-(--color-text-main)">
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(ch.id)} className="text-red-400 hover:text-red-300 ml-2">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={editingChannel ? "Edit Channel" : "Add Channel"}>
        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          <Input 
            label="Name" 
            value={formData.name} 
            onChange={(e) => setFormData({ ...formData, name: e.target.value })} 
            placeholder="e.g. Engineering Slack"
            required 
          />
          <div>
            <label className="block text-sm font-medium text-(--color-text-muted) mb-1">Type</label>
            <select
              value={formData.type}
              onChange={(e) => setFormData({ ...formData, type: e.target.value })}
              className="w-full bg-(--color-background) border border-(--color-border) rounded-md px-3 py-2 text-(--color-text-main) focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="slack">Slack Webhook</option>
              <option value="teams">Microsoft Teams</option>
              <option value="webhook">Generic Webhook</option>
            </select>
          </div>
          <Input 
            label="Webhook URL" 
            type="url"
            value={formData.webhook_url} 
            onChange={(e) => setFormData({ ...formData, webhook_url: e.target.value })} 
            placeholder="https://hooks.slack.com/services/..."
            required 
          />
          <div className="flex items-center gap-2 mt-4">
            <input 
              type="checkbox" 
              id="isActive"
              checked={formData.is_active} 
              onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
              className="rounded bg-(--color-background) border-(--color-border) text-blue-500 focus:ring-blue-500"
            />
            <label htmlFor="isActive" className="text-sm text-(--color-text-main)">Active</label>
          </div>
          
          <div className="flex justify-end gap-3 mt-6">
            <Button type="button" variant="secondary" onClick={() => setIsModalOpen(false)}>Cancel</Button>
            <Button type="submit">{editingChannel ? 'Update' : 'Create'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default NotificationChannels;
