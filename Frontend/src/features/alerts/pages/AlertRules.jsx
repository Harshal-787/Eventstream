import React, { useState, useEffect } from 'react';
import apiClient from '../../../services/apiClient';
import { Settings, Plus, Trash2, Edit2, X, AlertTriangle, ShieldAlert } from 'lucide-react';
import toast from 'react-hot-toast';
import { Button } from '../../../components/ui/Button';
import { motion, AnimatePresence } from 'framer-motion';

const DEVICE_METRICS = {
  all: [
    { key: 'temperature', label: 'Temperature (°C)' },
    { key: 'humidity', label: 'Humidity (%)' },
    { key: 'smoke_detected', label: 'Smoke Detected (True/False)' },
    { key: 'water_detected', label: 'Water Leak (True/False)' },
    { key: 'motion_detected', label: 'Motion Detected (True/False)' },
    { key: 'door_open', label: 'Door Open (True/False)' },
    { key: 'power_usage', label: 'Power Usage (W)' },
    { key: 'voltage', label: 'Voltage (V)' },
    { key: 'aqi', label: 'Air Quality Index (AQI)' }
  ],
  temperature: [
    { key: 'temperature', label: 'Temperature (°C)' },
    { key: 'humidity', label: 'Humidity (%)' }
  ],
  humidity: [
    { key: 'humidity', label: 'Humidity (%)' }
  ],
  smoke: [
    { key: 'smoke_detected', label: 'Smoke Detected (True/False)' }
  ],
  water_leak: [
    { key: 'water_detected', label: 'Water Leak (True/False)' }
  ],
  motion: [
    { key: 'motion_detected', label: 'Motion Detected (True/False)' }
  ],
  door: [
    { key: 'door_open', label: 'Door Open (True/False)' }
  ],
  power: [
    { key: 'power_usage', label: 'Power Usage (W)' },
    { key: 'voltage', label: 'Voltage (V)' }
  ],
  multisensor: [
    { key: 'temperature', label: 'Temperature (°C)' },
    { key: 'humidity', label: 'Humidity (%)' },
    { key: 'motion_detected', label: 'Motion Detected (True/False)' }
  ],
  air_quality: [
    { key: 'aqi', label: 'Air Quality Index (AQI)' }
  ]
};

export function AlertRules() {
  const [rules, setRules] = useState([]);
  const [devices, setDevices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingRule, setEditingRule] = useState(null);

  const [formData, setFormData] = useState({
    name: '',
    device_type: 'all',
    metric: 'temperature',
    operator: '>',
    threshold: '',
    bool_value: 'true',
    severity: 'medium',
    is_active: true,
    target_type: 'global',
    target_id: ''
  });

  const uniqueBuildings = Array.from(new Set(devices.filter(d => d.building_id).map(d => JSON.stringify({id: d.building_id, name: d.building_name})))).map(s => JSON.parse(s));
  const uniqueRooms = Array.from(new Set(devices.filter(d => d.room_id).map(d => JSON.stringify({id: d.room_id, name: d.room_name, building_name: d.building_name})))).map(s => JSON.parse(s));

  useEffect(() => {
    fetchRules();
    fetchDevices();
  }, []);

  const fetchDevices = async () => {
    try {
      const res = await apiClient.get('/devices?limit=1000');
      setDevices(res.data.data || res.data || []);
    } catch (err) {
      console.error('Failed to load devices', err);
    }
  };

  const fetchRules = async () => {
    try {
      setLoading(true);
      const res = await apiClient.get('/alert-rules');
      setRules(res.data.data || []);
    } catch (err) {
      toast.error('Failed to load alert rules');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        name: formData.name,
        device_type: formData.device_type,
        metric: formData.metric,
        operator: formData.operator,
        severity: formData.severity,
        is_active: formData.is_active,
        target_type: formData.target_type,
        target_id: formData.target_id ? parseInt(formData.target_id) : null
      };

      if (formData.operator === '==' || formData.operator === '!=') {
        if (formData.bool_value === 'true' || formData.bool_value === 'false') {
           payload.bool_value = formData.bool_value === 'true';
        } else {
           payload.threshold = parseFloat(formData.threshold);
        }
      } else {
        payload.threshold = parseFloat(formData.threshold);
      }

      if (editingRule) {
        await apiClient.put(`/alert-rules/${editingRule.id}`, payload);
        toast.success('Rule updated successfully');
      } else {
        await apiClient.post('/alert-rules', payload);
        toast.success('Rule created successfully');
      }
      setShowModal(false);
      setEditingRule(null);
      fetchRules();
    } catch (err) {
      toast.error('Failed to save rule');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    try {
      await apiClient.delete(`/alert-rules/${id}`);
      toast.success('Rule deleted');
      fetchRules();
    } catch (err) {
      toast.error('Failed to delete rule');
    }
  };

  const openModal = (rule = null) => {
    if (rule) {
      setEditingRule(rule);
      setFormData({
        name: rule.name,
        device_type: rule.device_type,
        metric: rule.metric,
        operator: rule.operator,
        threshold: rule.threshold != null ? rule.threshold.toString() : '',
        bool_value: rule.bool_value != null ? rule.bool_value.toString() : 'true',
        severity: rule.severity,
        is_active: rule.is_active,
        target_type: rule.target_type || 'global',
        target_id: rule.target_id || ''
      });
    } else {
      setEditingRule(null);
      setFormData({
        name: '',
        device_type: 'all',
        metric: 'temperature',
        operator: '>',
        threshold: '',
        bool_value: 'true',
        severity: 'medium',
        is_active: true,
        target_type: 'global',
        target_id: ''
      });
    }
    setShowModal(true);
  };

  return (
    <div className="space-y-6 lg:space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-12 font-sans">
      <div className="flex flex-col md:flex-row items-start md:items-end justify-between border-b border-(--color-border-main) pb-6">
        <div className="space-y-2">
          <h1 className="text-3xl lg:text-4xl font-heading font-extrabold tracking-tight text-(--color-text-main)">Alert Rules</h1>
          <p className="text-(--color-text-muted) font-medium">Configure rules to trigger real-time alerts</p>
        </div>
        <Button onClick={() => openModal()} className="mt-4 md:mt-0 rounded-xl shadow-md">
          <Plus className="w-5 h-5 mr-2" />
          Create Rule
        </Button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-sm overflow-hidden"
      >
        {loading ? (
          <div className="p-12 flex items-center justify-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
          </div>
        ) : rules.length === 0 ? (
          <div className="p-16 text-center flex flex-col items-center">
            <div className="w-20 h-20 bg-slate-50 dark:bg-(--color-surface-hover) rounded-full flex items-center justify-center mb-6">
              <ShieldAlert className="w-10 h-10 text-slate-400" />
            </div>
            <h3 className="text-xl font-bold text-(--color-text-main) mb-2">No Rules Configured</h3>
            <p className="text-(--color-text-muted) font-medium max-w-md">Create a rule to start evaluating telemetry and receiving automated alerts when conditions are met.</p>
            <Button onClick={() => openModal()} className="mt-6 rounded-xl" variant="secondary">
              Create Your First Rule
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto custom-scrollbar">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 dark:bg-(--color-surface) border-b border-(--color-border-main)">
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Rule Name</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Scope</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Target</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Condition</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Severity</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Status</th>
                  <th className="p-4 text-xs font-bold text-(--color-text-muted) uppercase tracking-wider text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-(--color-border-main)">
                {rules.map((rule) => (
                  <tr
                    key={rule.id}
                    className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors"
                  >
                    <td className="p-4 font-bold text-(--color-text-main)">{rule.name}</td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        rule.target_type === 'global' ? 'bg-slate-100 text-slate-700' :
                        rule.target_type === 'building' ? 'bg-blue-100 text-blue-700' :
                        rule.target_type === 'room' ? 'bg-emerald-100 text-emerald-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {rule.target_type}
                      </span>
                    </td>
                    <td className="p-4">
                      {rule.target_type === 'global' ? (
                        <span className="text-(--color-text-muted) italic text-sm">All {rule.device_type === 'all' ? 'Devices' : rule.device_type + 's'}</span>
                      ) : (
                        <div className="flex flex-col">
                          <span className="font-semibold text-sm text-(--color-text-main)">{rule.target_name}</span>
                          {rule.hardware_id && <span className="text-xs font-mono text-(--color-text-muted)">ID: {rule.hardware_id}</span>}
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="bg-slate-100 dark:bg-(--color-surface-hover) rounded-md px-3 py-1.5 inline-flex items-center gap-2 border border-slate-200 dark:border-(--color-border-main)">
                        <span className="font-mono text-sm font-semibold text-indigo-600 dark:text-indigo-400">{rule.metric}</span>
                        <span className="text-(--color-text-muted) font-bold">{rule.operator}</span>
                        <span className="font-mono text-sm font-bold text-(--color-text-main)">{rule.bool_value != null ? rule.bool_value.toString() : rule.threshold}</span>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`px-2.5 py-1 rounded-md text-xs font-bold uppercase ${
                        rule.severity === 'critical' ? 'bg-rose-50 text-rose-700 border border-rose-200' :
                        rule.severity === 'high' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                        rule.severity === 'medium' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200' :
                        'bg-sky-50 text-sky-700 border border-sky-200'
                      }`}>
                        {rule.severity}
                      </span>
                    </td>
                    <td className="p-4">
                      {rule.is_active ? (
                        <div className="flex items-center gap-1.5 text-emerald-600 text-sm font-semibold">
                          <div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 text-slate-400 text-sm font-semibold">
                          <div className="w-2 h-2 rounded-full bg-slate-300"></div> Disabled
                        </div>
                      )}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openModal(rule)} className="h-8 w-8 p-0 rounded-lg hover:bg-indigo-50 hover:text-indigo-600">
                          <Edit2 className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleDelete(rule.id)} className="h-8 w-8 p-0 rounded-lg hover:bg-rose-50 hover:text-rose-600 text-(--color-text-muted)">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </motion.div>

      {/* Modal */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              className="w-full max-w-xl bg-(--color-surface) rounded-2xl shadow-2xl border border-(--color-border-main) overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-5 flex justify-between items-center border-b border-(--color-border-main) bg-slate-50 dark:bg-(--color-surface)">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center">
                    <Settings className="w-5 h-5" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-(--color-text-main)">{editingRule ? 'Edit Alert Rule' : 'Create Alert Rule'}</h2>
                    <p className="text-xs text-(--color-text-muted) font-medium">Define conditions to trigger notifications</p>
                  </div>
                </div>
                <button onClick={() => setShowModal(false)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-(--color-surface-hover) text-(--color-text-muted) transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1 min-h-0 custom-scrollbar">
                <div>
                  <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Rule Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-(--color-background) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    placeholder="e.g. Server Room Temperature Alert"
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Target Device Type</label>
                    <select
                      value={formData.device_type}
                      onChange={(e) => {
                        const newType = e.target.value;
                        const validMetrics = DEVICE_METRICS[newType] || DEVICE_METRICS['all'];
                        setFormData({...formData, device_type: newType, metric: validMetrics[0].key});
                      }}
                      className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-(--color-background) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    >
                      <option value="all">All Devices</option>
                      <option value="temperature">Temperature Sensor</option>
                      <option value="humidity">Humidity Sensor</option>
                      <option value="smoke">Smoke Detector</option>
                      <option value="water_leak">Water Leak Sensor</option>
                      <option value="motion">Motion Sensor</option>
                      <option value="door">Door Contact</option>
                      <option value="power">Power Monitor</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Alert Severity</label>
                    <select
                      value={formData.severity}
                      onChange={(e) => setFormData({...formData, severity: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-(--color-background) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    >
                      <option value="low">Low (Info)</option>
                      <option value="medium">Medium (Warning)</option>
                      <option value="high">High (Urgent)</option>
                      <option value="critical">Critical (Emergency)</option>
                    </select>
                  </div>
                </div>

                <div className="bg-slate-50 dark:bg-(--color-surface-hover) p-4 rounded-xl border border-slate-200 dark:border-(--color-border-main) space-y-4">
                  <h4 className="text-xs font-bold text-(--color-text-muted) uppercase tracking-wider">Condition Criteria</h4>
                  
                  <div>
                    <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Sensor Metric to Monitor</label>
                    <select
                      required
                      value={formData.metric}
                      onChange={(e) => setFormData({...formData, metric: e.target.value})}
                      className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-white dark:bg-(--color-surface) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    >
                      {(DEVICE_METRICS[formData.device_type] || DEVICE_METRICS['all']).map(m => (
                        <option key={m.key} value={m.key}>{m.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Operator</label>
                      <select
                        value={formData.operator}
                        onChange={(e) => setFormData({...formData, operator: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-white dark:bg-(--color-surface) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                      >
                        <option value=">">Greater Than (&gt;)</option>
                        <option value="<">Less Than (&lt;)</option>
                        <option value="==">Equals (==)</option>
                        <option value="!=">Not Equals (!=)</option>
                      </select>
                    </div>
                    
                    {/* Condition Value */}
                    {formData.operator === '==' || formData.operator === '!=' ? (
                      <div>
                        <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Trigger Value</label>
                        <select
                          required
                          value={formData.bool_value === 'true' || formData.bool_value === 'false' ? formData.bool_value : 'custom'}
                          onChange={(e) => {
                            const val = e.target.value;
                            if (val === 'true' || val === 'false') {
                              setFormData({...formData, bool_value: val, threshold: ''});
                            } else {
                              setFormData({...formData, bool_value: '', threshold: '0'});
                            }
                          }}
                          className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-white dark:bg-(--color-surface) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        >
                          <option value="true">True / Detected / On</option>
                          <option value="false">False / Clear / Off</option>
                          <option value="custom">Custom Numeric Value...</option>
                        </select>
                        {formData.bool_value !== 'true' && formData.bool_value !== 'false' && (
                           <input
                             type="number"
                             step="any"
                             required
                             value={formData.threshold}
                             onChange={(e) => setFormData({...formData, threshold: e.target.value, bool_value: ''})}
                             className="w-full mt-2 px-4 py-2 rounded-xl border border-(--color-border-main) bg-white dark:bg-(--color-surface) font-medium focus:outline-none focus:border-indigo-500 text-sm"
                             placeholder="Enter numeric value"
                           />
                        )}
                      </div>
                    ) : (
                      <div>
                        <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Threshold Value</label>
                        <input
                          type="number"
                          step="any"
                          required
                          value={formData.threshold}
                          onChange={(e) => setFormData({...formData, threshold: e.target.value, bool_value: ''})}
                          className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-white dark:bg-(--color-surface) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                          placeholder="e.g. 35.5"
                        />
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Target Scope</label>
                    <select
                      value={formData.target_type}
                      onChange={(e) => setFormData({...formData, target_type: e.target.value, target_id: ''})}
                      className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-(--color-background) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                    >
                      <option value="global">Global (All Devices)</option>
                      <option value="building">Specific Building</option>
                      <option value="room">Specific Room</option>
                      <option value="device">Specific Sensor</option>
                    </select>
                  </div>

                  {formData.target_type === 'building' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Select Building</label>
                      <select
                        value={formData.target_id}
                        onChange={(e) => setFormData({...formData, target_id: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-(--color-background) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        required
                      >
                        <option value="">-- Choose Building --</option>
                        {uniqueBuildings.map(b => (
                          <option key={b.id} value={b.id}>{b.name}</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {formData.target_type === 'room' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Select Room</label>
                      <select
                        value={formData.target_id}
                        onChange={(e) => setFormData({...formData, target_id: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-(--color-background) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        required
                      >
                        <option value="">-- Choose Room --</option>
                        {uniqueRooms.map(r => (
                          <option key={r.id} value={r.id}>{r.name} ({r.building_name})</option>
                        ))}
                      </select>
                    </motion.div>
                  )}

                  {formData.target_type === 'device' && (
                    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      <label className="block text-sm font-semibold text-(--color-text-main) mb-1.5">Select Sensor</label>
                      <select
                        value={formData.target_id}
                        onChange={(e) => setFormData({...formData, target_id: e.target.value})}
                        className="w-full px-4 py-2.5 rounded-xl border border-(--color-border-main) bg-(--color-background) font-medium focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm"
                        required
                      >
                        <option value="">-- Choose Sensor --</option>
                        {devices
                          .filter(d => formData.device_type === 'all' || d.type === formData.device_type)
                          .map(d => (
                            <option key={d.id} value={d.id}>{d.name} {d.room_name ? `(${d.room_name}, ${d.building_name})` : ''}</option>
                          ))
                        }
                      </select>
                    </motion.div>
                  )}
                </div>
                
                <div className="pt-2">
                  <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border border-slate-200 dark:border-(--color-border-main) bg-slate-50 dark:bg-(--color-surface-hover) hover:bg-slate-100 dark:hover:bg-(--color-surface-hover) transition-colors">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({...formData, is_active: e.target.checked})}
                      className="w-5 h-5 rounded border-slate-300 text-indigo-600 focus:ring-indigo-600 transition duration-150 ease-in-out cursor-pointer"
                    />
                    <span className="font-semibold text-sm text-(--color-text-main)">
                      Rule is Active
                      <p className="text-xs text-(--color-text-muted) font-medium">When active, this rule will continuously evaluate live telemetry data.</p>
                    </span>
                  </label>
                </div>

                <div className="flex justify-end gap-3 pt-6 border-t border-(--color-border-main)">
                  <Button variant="ghost" onClick={() => setShowModal(false)} type="button" className="rounded-xl px-5 text-slate-600 hover:text-slate-800 hover:bg-slate-100">
                    Cancel
                  </Button>
                  <Button type="submit" className="rounded-xl px-8 shadow-md">
                    {editingRule ? 'Save Changes' : 'Create Rule'}
                  </Button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
