import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  X, 
  Save, 
  Clock,
  Webhook
} from 'lucide-react';
import apiClient from '../../../services/apiClient';
import { toast } from 'react-hot-toast';

export default function EscalationPolicies() {
  const [policies, setPolicies] = useState([]);
  const [channels, setChannels] = useState([]);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPolicy, setEditingPolicy] = useState(null);
  
  const [formData, setFormData] = useState({
    name: '',
    wait_minutes: 0,
    notification_channel_id: ''
  });

  useEffect(() => {
    fetchPolicies();
    fetchChannels();
  }, []);

  const fetchPolicies = async () => {
    try {
      const res = await apiClient.get('/escalation-policies');
      setPolicies(res.data || []);
    } catch (error) {
      toast.error('Failed to load escalation policies');
    }
  };

  const fetchChannels = async () => {
    try {
      const res = await apiClient.get('/notification-channels');
      setChannels(res.data || []);
    } catch (error) {
      console.error('Failed to load channels', error);
    }
  };

  const filteredPolicies = policies.filter(p => 
    p.name.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name || !formData.notification_channel_id) {
      toast.error("Name and Channel are required");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        wait_minutes: parseInt(formData.wait_minutes) || 0,
        notification_channel_id: parseInt(formData.notification_channel_id)
      };

      if (editingPolicy) {
        await apiClient.put(`/escalation-policies/${editingPolicy.id}`, payload);
        toast.success('Policy updated successfully');
      } else {
        await apiClient.post('/escalation-policies', payload);
        toast.success('Policy created successfully');
      }
      setIsModalOpen(false);
      fetchPolicies();
    } catch (error) {
      toast.error(error.response?.data?.error || 'Operation failed');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this policy?')) return;
    try {
      await apiClient.delete(`/escalation-policies/${id}`);
      toast.success('Policy deleted');
      fetchPolicies();
    } catch (error) {
      toast.error('Failed to delete policy');
    }
  };

  const openModal = (policy = null) => {
    if (policy) {
      setEditingPolicy(policy);
      setFormData({
        name: policy.name,
        wait_minutes: policy.wait_minutes,
        notification_channel_id: policy.notification_channel_id
      });
    } else {
      setEditingPolicy(null);
      setFormData({
        name: '',
        wait_minutes: 0,
        notification_channel_id: ''
      });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Escalation Policies</h1>
          <p className="text-sm text-text-muted mt-1">Manage delays and channel routing for alerts.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Policy
        </button>
      </div>

      <div className="bg-surface border border-border-main rounded-2xl overflow-hidden">
        <div className="p-4 border-b border-border-main flex gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="w-5 h-5 text-text-muted absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search policies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50/50 dark:bg-surface border-b border-border-main">
              <tr>
                <th className="p-4 font-bold text-text-muted uppercase tracking-wider text-xs">Name</th>
                <th className="p-4 font-bold text-text-muted uppercase tracking-wider text-xs">Wait Time</th>
                <th className="p-4 font-bold text-text-muted uppercase tracking-wider text-xs">Target Channel</th>
                <th className="p-4 font-bold text-text-muted uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border-main">
              {filteredPolicies.map((policy) => {
                const channel = channels.find(c => c.id === policy.notification_channel_id);
                return (
                  <tr key={policy.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">
                    <td className="p-4 font-semibold text-text-main">{policy.name}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2 text-text-muted">
                        <Clock className="w-4 h-4" />
                        <span>{policy.wait_minutes} min</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <Webhook className="w-4 h-4 text-primary-500" />
                        <span className="font-medium text-text-main">{channel ? channel.name : 'Unknown Channel'}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => openModal(policy)}
                          className="p-2 text-text-muted hover:text-primary-600 hover:bg-primary-50 dark:hover:bg-primary-500/10 rounded-lg transition-colors"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(policy.id)}
                          className="p-2 text-text-muted hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 rounded-lg transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
              {filteredPolicies.length === 0 && (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-text-muted">
                    No escalation policies found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-surface rounded-2xl w-full max-w-md shadow-xl border border-border-main overflow-hidden">
            <div className="flex justify-between items-center p-6 border-b border-border-main">
              <h2 className="text-xl font-bold text-text-main">
                {editingPolicy ? 'Edit Policy' : 'Create Policy'}
              </h2>
              <button onClick={() => setIsModalOpen(false)} className="text-text-muted hover:text-text-main">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Policy Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  placeholder="e.g., Immediate Slack, Delayed SMS"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Wait Time (Minutes)</label>
                <input
                  type="number"
                  min="0"
                  value={formData.wait_minutes}
                  onChange={(e) => setFormData({...formData, wait_minutes: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  required
                />
                <p className="text-xs text-text-muted mt-1">Set 0 for instant notifications.</p>
              </div>

              <div>
                <label className="block text-sm font-semibold text-text-main mb-1.5">Target Channel</label>
                <select
                  value={formData.notification_channel_id}
                  onChange={(e) => setFormData({...formData, notification_channel_id: e.target.value})}
                  className="w-full px-4 py-2 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-border-main rounded-xl focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 text-sm"
                  required
                >
                  <option value="">Select a channel...</option>
                  {channels.map(c => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
              </div>

              <div className="pt-4 flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-text-muted hover:text-text-main transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2 rounded-xl text-sm font-semibold transition-colors flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {editingPolicy ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
