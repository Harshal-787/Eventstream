import React, { useEffect, useState } from 'react';
import { deviceService } from '../services/deviceService';
import { Box } from '../../../components/ui/Box';
import { Spinner } from '../../../components/ui/Spinner';
import { EmptyState } from '../../../components/ui/EmptyState';
import { Cpu, Plus, Upload, Server, Search, Filter, Inbox, CheckCircle, Package, Trash2, Settings2, RefreshCcw, LogOut, AlertTriangle, Key, Activity, Folder, Sparkles, X } from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import { Badge } from '../../../components/ui/Badge';
import { Input } from '../../../components/ui/Input';
import { Modal } from '../../../components/ui/Modal';
import { Select } from '../../../components/ui/Select';
import { Tabs } from '../../../components/ui/Tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../../../components/ui/Table';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'react-hot-toast';
import { useTelemetry } from '../../../hooks/useTelemetry';
import { useLiveAlerts } from '../../alerts/hooks/useLiveAlerts';
import { DeviceGroupsTab } from '../components/DeviceGroupsTab';
import { aiService } from '../../../services/aiService';
import ReactMarkdown from 'react-markdown';

export function Devices({ role }) {
  const [activeTab, setActiveTab] = useState('inventory'); // inventory, requests, models
  const [devices, setDevices] = useState([]);
  const [models, setModels] = useState([]);
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isBulkOpen, setIsBulkOpen] = useState(false);
  const [bulkCsvText, setBulkCsvText] = useState('');
  const [formData, setFormData] = useState({ hardware_id: '', model_id: '' });

  const { telemetryMap, isConnected } = useTelemetry();
  const { liveAlerts, alertUpdates } = useLiveAlerts();

  const [isFulfillOpen, setIsFulfillOpen] = useState(false);
  const [isModelModalOpen, setIsModelModalOpen] = useState(false);
  const [newModel, setNewModel] = useState({ 
    brand: '', 
    model_name: '', 
    sensor_type: '',
    connectivity_protocol: '',
    power_source: '',
    expected_battery_life_months: '',
    payload_decoder: '',
    ip_rating: '',
    min_operating_temp: '',
    max_operating_temp: '',
    documentation_url: '',
    image_url: ''
  });
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [fulfillDeviceId, setFulfillDeviceId] = useState('');

  // Phase 2 states
  const [isProvisionOpen, setIsProvisionOpen] = useState(false);
  const [provisionToken, setProvisionToken] = useState('');
  const [selectedDevice, setSelectedDevice] = useState(null);

  const [isTwinOpen, setIsTwinOpen] = useState(false);
  const [deviceTwin, setDeviceTwin] = useState(null);
  const [desiredStateInput, setDesiredStateInput] = useState('');
  const [configInput, setConfigInput] = useState('');

  const [healthDeviceId, setHealthDeviceId] = useState(null);
  const [healthResult, setHealthResult] = useState('');
  const [healthLoading, setHealthLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, [statusFilter, role, activeTab]);

  const fetchData = async () => {
    try {
      setLoading(true);
      if (activeTab === 'inventory') {
        const data = await deviceService.getDevices(null, statusFilter);
        setDevices(data || []);
      } else if (activeTab === 'requests') {
        const reqData = await deviceService.getSensorRequests();
        setRequests(reqData || []);
        
        // Also fetch unassigned devices for fulfillment if not already fetched
        if (devices.length === 0) {
           const dData = await deviceService.getDevices(null, 'unassigned');
           setDevices(dData || []);
        }
      } else if (activeTab === 'models') {
        const mData = await deviceService.getModels();
        setModels(mData || []);
      }
      
      // Always keep models updated for registration form
      if (role === 'admin' && models.length === 0 && activeTab !== 'models') {
        const mData = await deviceService.getModels();
        setModels(mData || []);
      }
    } catch (err) {
      console.error(err);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const filteredDevices = devices.filter(d => 
    !searchQuery || 
    (d.hardware_id && d.hardware_id.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.model_name && d.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (d.brand && d.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredModels = models.filter(m => 
    !searchQuery || 
    (m.model_name && m.model_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (m.brand && m.brand.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const handleBulkSubmit = async (e) => {
    e.preventDefault();
    try {
      // Parse CSV text: Expected format: HardwareID, ModelID, Name, Type
      const lines = bulkCsvText.split('\n').map(l => l.trim()).filter(l => l);
      if (lines.length === 0) return toast.error('CSV is empty');
      
      const payload = lines.map(line => {
        const [hardware_id, model_id, name, type] = line.split(',').map(s => s.trim());
        return {
          hardware_id,
          model_id: parseInt(model_id, 10),
          name: name || '',
          type: type || ''
        };
      });

      // We'll hit the API to create them
      const response = await fetch('/api/v1/devices/bulk', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token') || ''}`
        },
        body: JSON.stringify(payload)
      });
      if (!response.ok) throw new Error('Bulk upload failed');
      
      toast.success(`Successfully uploaded ${payload.length} devices`);
      setIsBulkOpen(false);
      setBulkCsvText('');
      fetchData();
    } catch (err) {
      toast.error('Failed to parse or upload CSV. Ensure format is: HardwareID, ModelID, Name, Type');
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const model = models.find(m => m.id.toString() === formData.model_id);
      await deviceService.createDevice({
        hardware_id: formData.hardware_id,
        name: `${model.brand} ${model.sensor_type}`,
        type: model.sensor_type,
        model_id: parseInt(formData.model_id)
      });
      toast.success('Device added to inventory');
      setIsRegisterOpen(false);
      setFormData({ hardware_id: '', model_id: '' });
      fetchData();
    } catch (err) {
      toast.error('Failed to register device');
    }
  };

  const handleFulfill = async (e, autoProvision = false) => {
    if (e) e.preventDefault();
    try {
      if (!autoProvision && !selectedRequest.hardware_id && !fulfillDeviceId) {
        toast.error('Please select a device from the inventory or use auto-provision');
        return;
      }
      await deviceService.fulfillSensorRequest(
        selectedRequest.id, 
        fulfillDeviceId ? parseInt(fulfillDeviceId) : null,
        autoProvision
      );
      toast.success(autoProvision ? 'Sensor auto-provisioned and deployed!' : 'Request fulfilled and sensor deployed!');
      setIsFulfillOpen(false);
      setFulfillDeviceId('');
      fetchData();
    } catch (err) {
      toast.error('Failed to fulfill request');
    }
  };

  const handleDeleteDevice = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sensor? This action cannot be undone.")) return;
    try {
      await deviceService.deleteDevice(id);
      toast.success('Sensor deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete sensor');
    }
  };

  const handleToggleMaintenance = async (device) => {
    const newMaintenanceStatus = !device.is_maintenance;
    try {
      await deviceService.toggleMaintenance(device.id, newMaintenanceStatus);
      toast.success(`Device maintenance mode ${newMaintenanceStatus ? 'enabled' : 'disabled'}`);
      fetchData();
    } catch (err) {
      toast.error('Failed to update maintenance mode');
    }
  };

  const handleDeleteRequest = async (id) => {
    if (!window.confirm("Are you sure you want to delete this sensor request?")) return;
    try {
      await deviceService.deleteSensorRequest(id);
      toast.success('Sensor request deleted');
      fetchData();
    } catch (err) {
      toast.error('Failed to delete sensor request');
    }
  };

  const handleUnassign = async (id) => {
    if (!window.confirm("Unassign this device and return it to the warehouse?")) return;
    try {
      await deviceService.unassignDevice(id);
      toast.success('Device unassigned successfully');
      fetchData();
    } catch (err) {
      toast.error('Failed to unassign device');
    }
  };

  const handleCreateModel = async (e) => {
    e.preventDefault();
    try {
      const payload = {
        ...newModel,
        expected_battery_life_months: newModel.expected_battery_life_months ? parseInt(newModel.expected_battery_life_months, 10) : null,
        min_operating_temp: newModel.min_operating_temp ? parseInt(newModel.min_operating_temp, 10) : null,
        max_operating_temp: newModel.max_operating_temp ? parseInt(newModel.max_operating_temp, 10) : null,
      };
      
      await deviceService.createModel(payload);
      toast.success('Device model added successfully');
      setIsModelModalOpen(false);
      setNewModel({ 
        brand: '', model_name: '', sensor_type: '',
        connectivity_protocol: '', power_source: '', expected_battery_life_months: '',
        payload_decoder: '', ip_rating: '', min_operating_temp: '', max_operating_temp: '',
        documentation_url: '', image_url: ''
      });
      fetchData();
    } catch (err) {
      toast.error('Failed to add device model');
    }
  };

  const handleProvision = async (device) => {
    try {
      const res = await deviceService.provisionDevice(device.id);
      setProvisionToken(res.token);
      setSelectedDevice(device);
      setIsProvisionOpen(true);
      fetchData(); // Refresh to update status
    } catch (err) {
      toast.error('Failed to generate provisioning token');
    }
  };

  const handleOpenTwin = async (device) => {
    try {
      setSelectedDevice(device);
      const twin = await deviceService.getDeviceTwin(device.id);
      setDeviceTwin(twin);
      setDesiredStateInput(twin.desired_state ? JSON.stringify(twin.desired_state, null, 2) : '{\n  \n}');
      setConfigInput(twin.configuration ? JSON.stringify(twin.configuration, null, 2) : '{\n  \n}');
      setIsTwinOpen(true);
    } catch (err) {
      toast.error('Failed to load device twin');
    }
  };

  const handleSaveTwin = async () => {
    try {
      let desiredParsed = null;
      let configParsed = null;
      if (desiredStateInput.trim()) desiredParsed = JSON.parse(desiredStateInput);
      if (configInput.trim()) configParsed = JSON.parse(configInput);

      await deviceService.updateDeviceTwin(selectedDevice.id, {
        desired_state: desiredParsed,
        configuration: configParsed
      });
      toast.success('Digital Twin updated');
      setIsTwinOpen(false);
    } catch (err) {
      toast.error('Invalid JSON format in twin configuration');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'fulfilled': return 'success';
      case 'unassigned': return 'warning';
      case 'pending': return 'warning';
      case 'maintenance': return 'error';
      case 'offline': return 'danger';
      case 'rejected': return 'danger';
      default: return 'neutral';
    }
  };

  const handleGenerateHealthReport = async (device) => {
    setHealthDeviceId(device.id);
    setHealthResult('');
    setHealthLoading(true);
    try {
      const data = await aiService.generateDeviceHealthSummary(device.id);
      setHealthResult(data.summary || JSON.stringify(data));
    } catch (err) {
      console.error(err);
      setHealthResult('**Error:** Failed to generate health summary. Ensure AI Settings are configured.');
    } finally {
      setHealthLoading(false);
    }
  };

  const renderLiveData = (device) => {
    const telemetry = telemetryMap[device.id];
    if (!telemetry) return <span className="text-xs text-text-muted">--</span>;

    const payload = telemetry.payload || {};
    
    switch (device.type) {
      case 'temperature':
        return (
          <div>
            <div className="text-sm font-bold text-text-main">{payload.temperature != null ? `${payload.temperature.toFixed(2)} °C` : '--'}</div>
            {payload.humidity != null && <div className="text-xs text-text-muted">{payload.humidity.toFixed(2)} %</div>}
          </div>
        );
      case 'humidity':
        return <div className="text-sm font-bold text-text-main">{payload.humidity?.toFixed(2) || '--'} %</div>;
      case 'temperature_humidity':
      case 'multisensor':
        return (
          <div className="text-sm font-bold text-text-main">
            {payload.temperature && <div>{payload.temperature.toFixed(2)} °C</div>}
            {payload.humidity && <div className="text-text-muted">{payload.humidity.toFixed(2)} %</div>}
            {payload.motion_detected !== undefined && (
              <div className={payload.motion_detected ? "text-amber-500" : "text-text-muted"}>
                {payload.motion_detected ? 'MOTION' : 'CLEAR'}
              </div>
            )}
          </div>
        );
      case 'smoke':
        return (
          <div className={`text-sm font-bold ${payload.smoke_detected ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
            {payload.smoke_detected ? 'SMOKE DETECTED' : 'CLEAR'}
          </div>
        );
      case 'water_leak':
        return (
          <div className={`text-sm font-bold ${payload.water_detected ? 'text-red-500 animate-pulse' : 'text-green-500'}`}>
            {payload.water_detected ? 'LEAK DETECTED' : 'DRY'}
          </div>
        );
      case 'door':
        return (
          <div className={`text-sm font-bold ${payload.door_open ? 'text-amber-500' : 'text-green-500'}`}>
            {payload.door_open ? 'OPEN' : 'CLOSED'}
          </div>
        );
      case 'motion':
        return (
          <div className={`text-sm font-bold ${payload.motion_detected ? 'text-amber-500 animate-pulse' : 'text-text-muted'}`}>
            {payload.motion_detected ? 'MOTION DETECTED' : 'CLEAR'}
          </div>
        );
      case 'air_quality':
        const aqi = payload.aqi || 0;
        let aqiColor = 'text-green-600';
        if (aqi > 100) aqiColor = 'text-red-600 animate-pulse';
        else if (aqi > 50) aqiColor = 'text-amber-600';
        return <div className={`text-sm font-bold ${aqiColor}`}>{aqi.toFixed(0)} AQI</div>;
      case 'power':
        return (
          <div className="text-sm font-bold text-text-main">
            {payload.power_usage?.toFixed(2) || '--'} kW
            <div className="text-xs text-text-muted">{payload.voltage?.toFixed(1) || '--'} V</div>
          </div>
        );
      default:
        // Fallback for legacy data without payload
        return (
          <div className="text-sm font-bold text-text-main">
            {telemetry.temperature && <div>{telemetry.temperature.toFixed(2)} °C</div>}
            {telemetry.humidity && <div className="text-text-muted">{telemetry.humidity.toFixed(2)} %</div>}
          </div>
        );
    }
  };

  if (loading && devices.length === 0 && requests.length === 0 && activeTab !== 'models') return <Spinner size="lg" />;

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-text-main">Device Management</h1>
          <p className="text-sm text-text-muted">Manage virtual sensors and fulfill deployments</p>
        </div>
        
        {role === 'admin' && activeTab === 'inventory' && (
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={() => setIsBulkOpen(true)}>
              <Upload className="w-4 h-4 mr-2" /> Bulk CSV
            </Button>
            <Button onClick={() => setIsRegisterOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add to Inventory
            </Button>
          </div>
        )}
        {role === 'admin' && activeTab === 'models' && (
          <div className="flex gap-2">
            <Button onClick={() => setIsModelModalOpen(true)}>
              <Plus className="w-4 h-4 mr-2" /> Add Model
            </Button>
          </div>
        )}
      </div>

      {role === 'admin' && (
        <Tabs 
          tabs={[
            { id: 'inventory', label: 'Warehouse Inventory', icon: Package },
            { id: 'requests', label: 'Sensor Requests', icon: Inbox, badge: requests.filter(r => r.status === 'pending').length || undefined },
            { id: 'models', label: 'Device Models', icon: Server },
            { id: 'groups', label: 'Device Groups', icon: Folder }
          ]}
          activeTab={activeTab}
          onChange={setActiveTab}
        />
      )}

      {(role === 'user' || activeTab === 'inventory') && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden"
        >
          <div className="p-4 border-b border-border-main bg-slate-50 dark:bg-surface flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-5 h-5 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="bg-transparent border-none text-sm font-semibold text-text-main focus:ring-0 cursor-pointer outline-none"
              >
                <option value="">All Statuses</option>
                {role === 'admin' && <option value="unassigned">Unassigned (Inventory)</option>}
                <option value="active">Deployed (Active)</option>
                <option value="maintenance">Maintenance</option>
              </select>
            </div>
            <div className="relative w-full sm:max-w-md">
              <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search hardware ID or model..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-11 pr-4 py-2.5 bg-white dark:bg-surface border border-slate-200 dark:border-border-main rounded-xl text-sm w-full font-medium focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 transition-all"
              />
            </div>
          </div>

          {filteredDevices.length === 0 ? (
            <EmptyState 
              title={role === 'admin' ? "Warehouse Empty" : "No Active Sensors"} 
              description={role === 'admin' ? "There are no devices matching the current filters." : "You do not have any sensors deployed to your buildings yet."}
              icon={Server}
              action={role === 'admin' && <Button onClick={() => setIsRegisterOpen(true)}>Register First Device</Button>}
              className="py-20"
            />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-surface border-b border-border-main">
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Hardware ID</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Brand / Model</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Type</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Location</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Live Data</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Health</TableHead>
                    {role === 'admin' && <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider text-right">Actions</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border-main">
                  {filteredDevices.map(device => {
                    const hasActiveAlert = liveAlerts.find(a => a.device_id === device.id && a.status === 'open');
                    return (
                    <TableRow key={device.id} className={`hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors ${hasActiveAlert ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <TableCell className="font-medium">
                        <div className="flex items-center gap-2">
                          <Cpu className="w-4 h-4 text-(--color-primary)" />
                          {device.hardware_id || `VIRT-${device.id.toString().padStart(4, '0')}`}
                          {telemetryMap[device.id] && (
                             <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" title="Live Connection Active" />
                          )}
                          {hasActiveAlert && (
                             <AlertTriangle className="w-4 h-4 text-red-500 animate-bounce" title="Critical Alert" />
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-text-main">{device.brand || 'Generic'}</div>
                        <div className="text-xs text-text-muted">{device.model_name || 'Standard'}</div>
                      </TableCell>
                      <TableCell className="capitalize">
                        {device.type}
                      </TableCell>
                      <TableCell>
                        {device.building_id ? (
                          <div>
                            <div className="text-sm font-medium text-text-main">{device.building_name}</div>
                            <div className="text-xs text-text-muted">{device.floor_name || 'Unmapped'} / {device.room_name || 'Unmapped'}</div>
                          </div>
                        ) : (
                          <span className="text-sm text-text-muted italic">Warehouse Shelf</span>
                        )}
                      </TableCell>
                      <TableCell>
                         {renderLiveData(device)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <Badge variant={getStatusColor(device.status)}>
                            {device.status}
                          </Badge>
                          {device.is_maintenance && (
                            <Badge variant="warning" className="text-[10px] uppercase">
                              Maintenance
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-2">
                          <div className="flex items-center gap-2" title="Health Score">
                            <div className="w-16 h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                              <div className={`h-full transition-all duration-500 ${device.health_score > 80 ? 'bg-emerald-500' : device.health_score > 50 ? 'bg-amber-500' : 'bg-rose-500'}`} style={{ width: `${device.health_score ?? 100}%` }} />
                            </div>
                            <span className={`text-[10px] font-bold ${device.health_score > 80 ? 'text-emerald-600' : device.health_score > 50 ? 'text-amber-600' : 'text-rose-600'}`}>{device.health_score ?? 100}</span>
                          </div>
                          {device.status === 'active' && (
                            <div className="flex items-center gap-2" title="Battery">
                              <div className="w-16 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
                                <div className={`h-full ${device.battery_pct > 20 ? 'bg-blue-500' : 'bg-red-500'}`} style={{ width: `${device.battery_pct || 100}%` }} />
                              </div>
                              <span className="text-[10px] font-medium text-text-muted">{device.battery_pct || 100}% ⚡</span>
                            </div>
                          )}
                        </div>
                      </TableCell>
                      {role === 'admin' && (
                        <TableCell className="py-4 text-right whitespace-nowrap">
                          {device.building_id && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-teal-600 hover:bg-teal-50 transition-colors mr-1" onClick={() => handleUnassign(device.id)} title="Unassign">
                              <LogOut className="w-4 h-4" />
                            </Button>
                          )}
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-amber-600 hover:bg-amber-50 transition-colors mr-1" onClick={() => handleProvision(device)} title="Provisioning Token">
                            <Key className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-emerald-600 hover:bg-emerald-50 transition-colors mr-1" onClick={() => handleOpenTwin(device)} title="Digital Twin">
                            <Activity className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-teal-600 hover:bg-teal-50 transition-colors mr-1" onClick={() => handleGenerateHealthReport(device)} title="AI Health Summary">
                            <Sparkles className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className={`h-8 w-8 rounded-md transition-colors mr-1 ${device.is_maintenance ? 'text-amber-500 bg-amber-50' : 'text-slate-600 hover:bg-slate-100'}`}
                            onClick={() => handleToggleMaintenance(device)} 
                            title={device.is_maintenance ? 'Disable Maintenance' : 'Enable Maintenance'}
                          >
                            <Settings2 className="w-4 h-4" />
                          </Button>
                          <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-rose-500 hover:bg-rose-50 transition-colors" onClick={() => handleDeleteDevice(device.id)} title="Delete Sensor">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </TableCell>
                      )}
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}

      {role === 'admin' && activeTab === 'groups' && (
        <DeviceGroupsTab role={role} devices={devices} />
      )}

      {role === 'admin' && activeTab === 'models' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden"
        >
          {models.length === 0 ? (
            <EmptyState 
              title="No Models Found" 
              description="Create a model to allow users to register sensors."
              className="py-20"
            />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-surface border-b border-border-main">
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">ID</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Brand</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Model Name</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Sensor Type</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Protocol</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Power</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">IP Rating</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Docs</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border-main">
                  {filteredModels.map(model => (
                    <TableRow key={model.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <TableCell className="font-medium text-text-muted">
                        {model.image_url ? (
                           <img src={model.image_url} alt={model.model_name} className="w-8 h-8 object-contain bg-white inline-block mr-2 border border-border-main" />
                        ) : null}
                        #{model.id}
                      </TableCell>
                      <TableCell className="font-bold">{model.brand}</TableCell>
                      <TableCell>{model.model_name}</TableCell>
                      <TableCell className="capitalize">{model.sensor_type.replace('_', ' ')}</TableCell>
                      <TableCell>{model.connectivity_protocol || 'N/A'}</TableCell>
                      <TableCell>{model.power_source || 'N/A'}</TableCell>
                      <TableCell>{model.ip_rating || 'N/A'}</TableCell>
                      <TableCell>
                        {model.documentation_url ? (
                          <a href={model.documentation_url} target="_blank" rel="noopener noreferrer" className="text-blue-500 hover:underline">Link</a>
                        ) : 'N/A'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}

      {role === 'admin' && activeTab === 'requests' && (
        <motion.div 
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-surface rounded-2xl border border-border-main shadow-sm overflow-hidden"
        >
          {requests.length === 0 ? (
            <EmptyState 
              title="No Pending Requests" 
              description="Users have not requested any new sensors."
              icon={Inbox}
              className="py-20"
            />
          ) : (
            <div className="overflow-x-auto custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50 dark:bg-surface border-b border-border-main">
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Date</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Requested By</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Hardware</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Location</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Status</TableHead>
                    <TableHead className="py-4 text-xs font-bold text-text-muted uppercase tracking-wider">Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="divide-y divide-border-main">
                  {requests.map(req => (
                    <TableRow key={req.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-colors">
                      <TableCell className="text-text-muted">
                        {new Date(req.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="font-medium">
                        {req.user_name || 'System User'}
                      </TableCell>
                      <TableCell>
                        {req.hardware_id ? (
                          <>
                            <div className="text-sm font-bold capitalize text-text-main">{req.brand} {req.model_name}</div>
                            <div className="text-xs text-text-muted">ID: {req.hardware_id}</div>
                          </>
                        ) : (
                          <>
                            <div className="text-sm font-bold capitalize text-text-main">IT Request</div>
                            <div className="text-xs text-text-muted">Needs {req.sensor_type}</div>
                          </>
                        )}
                      </TableCell>
                      <TableCell>
                        <div className="text-sm font-medium text-text-main">{req.building_name}</div>
                        <div className="text-xs text-text-muted">{req.floor_name} - {req.room_name}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant={getStatusColor(req.status)}>
                          {req.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="py-4">
                        <div className="flex items-center gap-2">
                          {req.status === 'pending' ? (
                            <Button 
                              size="sm" 
                              className="rounded-lg h-auto py-1.5 text-xs font-semibold"
                              onClick={() => { setSelectedRequest(req); setIsFulfillOpen(true); }}
                            >
                              <CheckCircle className="w-3 h-3 mr-2" /> Fulfill
                            </Button>
                          ) : (
                            <span className="text-xs text-text-muted">Completed</span>
                          )}
                          {role === 'admin' && (
                            <Button size="icon" variant="ghost" className="h-8 w-8 rounded-md text-rose-500 hover:bg-rose-50 transition-colors" onClick={() => handleDeleteRequest(req.id)} title="Delete Request">
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      )}

      {/* AI Health Modal */}
      <AnimatePresence>
        {healthDeviceId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl border border-gray-200 dark:border-gray-800 flex flex-col max-h-[85vh]"
            >
              <div className="flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 shrink-0">
                <h3 className="text-lg font-bold flex items-center gap-2 text-teal-600 dark:text-teal-400">
                  <Sparkles className="w-5 h-5" />
                  AI Device Health Summary
                </h3>
                <button onClick={() => setHealthDeviceId(null)} className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-slate-800 text-gray-500">
                  <X className="w-5 h-5" />
                </button>
              </div>
              
              <div className="p-6 overflow-y-auto flex-1">
                {healthLoading ? (
                  <div className="flex flex-col items-center justify-center py-12 space-y-4">
                    <div className="flex gap-1">
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-3 h-3 bg-teal-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <p className="text-sm font-medium text-gray-500 animate-pulse">Generating health report...</p>
                  </div>
                ) : (
                  <div className="prose prose-sm md:prose-base dark:prose-invert max-w-none">
                    <ReactMarkdown>{healthResult}</ReactMarkdown>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modals */}
      <Modal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} title="Add to Global Inventory">
        <form onSubmit={handleRegister} className="space-y-4">
          <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl">
            <p className="text-sm text-blue-400 font-medium">Virtual Provisioning</p>
            <p className="text-xs text-text-muted mt-1">This will register a virtual sensor to the global warehouse. You can assign it to a building later.</p>
          </div>
          
          <Select
            label="Device Model Catalog"
            value={formData.model_id}
            onChange={e => setFormData({ ...formData, model_id: e.target.value })}
            required
            options={[
              { value: '', label: 'Select a brand and model...' },
              ...models.map(m => ({
                value: m.id,
                label: `${m.brand} - ${m.model_name} (${m.sensor_type})`
              }))
            ]}
          />
          <Input
            label="Virtual Hardware ID (MAC/EUI)"
            value={formData.hardware_id}
            onChange={e => setFormData({ ...formData, hardware_id: e.target.value })}
            required
            placeholder="e.g. SIM-HONEYWELL-001"
          />
          <div className="pt-4 flex justify-end gap-3">
            <Button variant="secondary" type="button" onClick={() => setIsRegisterOpen(false)}>Cancel</Button>
            <Button type="submit">Register Device</Button>
          </div>
        </form>
      </Modal>

      <Modal isOpen={isFulfillOpen} onClose={() => setIsFulfillOpen(false)} title="Register & Deploy Sensor">
        {selectedRequest && (
          <form onSubmit={handleFulfill} className="space-y-4">
            <div className="p-4 bg-surface-hover border border-border-main rounded-xl mb-4">
              <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Hardware Information</p>
              {selectedRequest.hardware_id ? (
                <>
                  <p className="text-sm font-medium">{selectedRequest.brand} {selectedRequest.model_name}</p>
                  <p className="text-xs text-text-muted mt-1">MAC/EUI: {selectedRequest.hardware_id}</p>
                </>
              ) : (
                <p className="text-sm font-medium text-teal-400">IT Request (Pending Assignment)</p>
              )}
              <p className="text-xs text-text-muted mt-1">Type: <span className="capitalize font-bold">{selectedRequest.sensor_type}</span></p>
              
              <div className="mt-4 border-t border-border-main pt-4">
                <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">Deployment Target</p>
                <p className="text-sm font-medium">{selectedRequest.building_name} &rarr; {selectedRequest.floor_name} &rarr; {selectedRequest.room_name}</p>
              </div>

              <div className="mt-4 border-t border-border-main pt-4">
                <p className="text-xs text-text-muted uppercase font-bold tracking-wider mb-1">User Notes</p>
                <p className="text-sm italic">"{selectedRequest.reason}"</p>
              </div>
            </div>
            
            {selectedRequest.hardware_id ? (
              <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl">
                <p className="text-sm text-green-400 font-medium">Automatic Registration</p>
                <p className="text-xs text-text-muted mt-1">Clicking "Register & Deploy" will automatically add this hardware ID to your inventory and link it to the room.</p>
              </div>
            ) : (
              <div className="p-4 bg-teal-500/10 border border-teal-500/20 rounded-xl">
                <p className="text-sm text-teal-400 font-medium mb-3">Warehouse Assignment</p>
                
                <Select
                  label="Select Sensor from Inventory"
                  value={fulfillDeviceId}
                  onChange={e => setFulfillDeviceId(e.target.value)}
                  options={[
                    { value: '', label: 'Select a sensor (Optional)...' },
                    ...devices
                      .filter(d => d.status === 'unassigned' && d.type === selectedRequest.sensor_type)
                      .map(d => ({
                        value: d.id,
                        label: `${d.hardware_id} - ${d.brand} ${d.model_name}`
                      }))
                  ]}
                />
                
                {devices.filter(d => d.status === 'unassigned' && d.type === selectedRequest.sensor_type).length === 0 && (
                  <div className="mt-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-xl flex flex-col gap-2">
                    <p className="text-xs text-amber-400">You don't have any unassigned {selectedRequest.sensor_type} sensors in your warehouse.</p>
                    <Button type="button" size="sm" variant="secondary" onClick={() => handleFulfill(null, true)}>
                      1-Click Auto-Provision Virtual Sensor
                    </Button>
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 flex justify-end gap-3">
              <Button variant="secondary" type="button" onClick={() => setIsFulfillOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={!selectedRequest.hardware_id && !fulfillDeviceId && devices.filter(d => d.status === 'unassigned' && d.type === selectedRequest.sensor_type).length > 0}>
                {selectedRequest.hardware_id ? 'Register & Deploy' : 'Assign & Deploy'}
              </Button>
            </div>
          </form>
        )}
      </Modal>

      {/* Add Model Modal */}
      <Modal isOpen={isModelModalOpen} onClose={() => setIsModelModalOpen(false)} title="Add Device Model">
        <form onSubmit={handleCreateModel} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Manufacturer (Brand)"
              value={newModel.brand}
              onChange={e => setNewModel({ ...newModel, brand: e.target.value })}
              required
              placeholder="e.g. Honeywell"
            />
            <Input
              label="Model Name or Number"
              value={newModel.model_name}
              onChange={e => setNewModel({ ...newModel, model_name: e.target.value })}
              required
              placeholder="e.g. T6 Pro"
            />
          </div>
          <Select
            label="What does this sensor measure?"
            value={newModel.sensor_type}
            onChange={e => setNewModel({ ...newModel, sensor_type: e.target.value })}
            required
            options={[
              { value: '', label: 'Select type...' },
              { value: 'temperature', label: 'Temperature' },
              { value: 'humidity', label: 'Humidity' },
              { value: 'motion', label: 'Motion' },
              { value: 'smoke', label: 'Smoke' },
              { value: 'water_leak', label: 'Water Leak' },
              { value: 'door', label: 'Door' },
              { value: 'power', label: 'Power' }
            ]}
          />
          
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="How does it connect to the internet?"
              value={newModel.connectivity_protocol}
              onChange={e => setNewModel({ ...newModel, connectivity_protocol: e.target.value })}
              options={[
                { value: '', label: 'None / Select...' },
                { value: 'Wi-Fi', label: 'Wi-Fi' },
                { value: 'LoRaWAN', label: 'LoRaWAN' },
                { value: 'Zigbee', label: 'Zigbee' },
                { value: 'Bluetooth (BLE)', label: 'Bluetooth (BLE)' },
                { value: 'Cellular', label: 'Cellular (LTE-M/NB-IoT)' },
                { value: 'Ethernet', label: 'Ethernet/PoE' }
              ]}
            />
            <Select
              label="How is it powered?"
              value={newModel.power_source}
              onChange={e => setNewModel({ ...newModel, power_source: e.target.value })}
              options={[
                { value: '', label: 'None / Select...' },
                { value: 'Battery', label: 'Battery' },
                { value: 'Mains Power', label: 'Mains Power' },
                { value: 'PoE', label: 'PoE' },
                { value: 'Solar', label: 'Solar' }
              ]}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Battery Life (in months)"
              type="number"
              value={newModel.expected_battery_life_months}
              onChange={e => setNewModel({ ...newModel, expected_battery_life_months: e.target.value })}
              placeholder="e.g. 24"
            />
            <Input
              label="Weatherproof Rating (e.g. IP67)"
              value={newModel.ip_rating}
              onChange={e => setNewModel({ ...newModel, ip_rating: e.target.value })}
              placeholder="e.g. IP67"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Coldest Operating Temp (°C)"
              type="number"
              value={newModel.min_operating_temp}
              onChange={e => setNewModel({ ...newModel, min_operating_temp: e.target.value })}
              placeholder="e.g. -20"
            />
            <Input
              label="Hottest Operating Temp (°C)"
              type="number"
              value={newModel.max_operating_temp}
              onChange={e => setNewModel({ ...newModel, max_operating_temp: e.target.value })}
              placeholder="e.g. 60"
            />
          </div>

          <Input
            label="Data Format (Payload Decoder)"
            value={newModel.payload_decoder}
            onChange={e => setNewModel({ ...newModel, payload_decoder: e.target.value })}
            placeholder="e.g. CayenneLPP or custom-decoder-v2"
          />

          <Input
            label="Link to User Manual"
            value={newModel.documentation_url}
            onChange={e => setNewModel({ ...newModel, documentation_url: e.target.value })}
            placeholder="e.g. https://manufacturer.com/docs"
          />

          <Input
            label="Link to Product Image"
            value={newModel.image_url}
            onChange={e => setNewModel({ ...newModel, image_url: e.target.value })}
            placeholder="e.g. https://example.com/sensor.png"
          />

          <div className="flex justify-end gap-2 pt-4 border-t border-border-main">
            <Button type="button" variant="secondary" onClick={() => setIsModelModalOpen(false)}>Cancel</Button>
            <Button type="submit">Add Model</Button>
          </div>
        </form>
      </Modal>
      {/* Bulk CSV Upload Modal */}
      <Modal isOpen={isBulkOpen} onClose={() => setIsBulkOpen(false)} title="Bulk CSV Import">
        <form onSubmit={handleBulkSubmit} className="space-y-4">
          <div className="p-4 bg-surface-hover border border-border-main rounded-lg mb-4">
            <p className="text-sm font-medium text-text-main">Paste CSV Data</p>
            <p className="text-xs text-text-muted mt-1">Format: HardwareID, ModelID, Name, Type</p>
          </div>
          <textarea
            required
            value={bulkCsvText}
            onChange={(e) => setBulkCsvText(e.target.value)}
            placeholder="HW-1001, 1, Entrance Sensor, door&#10;HW-1002, 2, Office Temp, temperature"
            rows={8}
            className="w-full bg-background border border-border-main rounded-xl p-3 text-sm font-mono text-text-main focus:ring-2 focus:ring-(--color-primary) focus:outline-none transition-all shadow-inner"
          />
          <div className="flex justify-end gap-3 pt-4 border-t border-border-main">
            <Button type="button" variant="secondary" onClick={() => setIsBulkOpen(false)}>Cancel</Button>
            <Button type="submit">Import Devices</Button>
          </div>
        </form>
      </Modal>

      {/* Provisioning Modal */}
      <Modal isOpen={isProvisionOpen} onClose={() => setIsProvisionOpen(false)} title="Provision Device">
        <div className="space-y-4">
          <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-xl">
            <p className="text-sm font-medium text-amber-500">Security Token Generated</p>
            <p className="text-xs text-text-muted mt-1">This token must be programmed into the physical device. It is used to securely identify the device via Webhooks.</p>
          </div>
          <div className="bg-surface-hover border border-border-main p-4 rounded-xl flex items-center justify-between">
            <code className="text-sm font-mono text-text-main break-all">{provisionToken}</code>
            <Button size="sm" variant="secondary" onClick={() => {
              navigator.clipboard.writeText(provisionToken);
              toast.success('Token copied to clipboard');
            }}>Copy</Button>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-main">
            <Button onClick={() => setIsProvisionOpen(false)}>Done</Button>
          </div>
        </div>
      </Modal>

      {/* Digital Twin Modal */}
      <Modal isOpen={isTwinOpen} onClose={() => setIsTwinOpen(false)} title="Device Digital Twin">
        <div className="space-y-4">
          <div className="flex items-center gap-6 p-6 bg-surface-hover border border-border-main rounded-xl mb-4">
             <div className="relative w-24 h-24 flex items-center justify-center rounded-full border-8" style={{ borderColor: (deviceTwin?.health_score ?? 100) > 80 ? '#10b981' : (deviceTwin?.health_score ?? 100) > 50 ? '#f59e0b' : '#f43f5e' }}>
               <span className="text-3xl font-bold" style={{ color: (deviceTwin?.health_score ?? 100) > 80 ? '#10b981' : (deviceTwin?.health_score ?? 100) > 50 ? '#f59e0b' : '#f43f5e' }}>{deviceTwin?.health_score ?? 100}</span>
             </div>
             <div>
               <h3 className="text-lg font-bold text-text-main">Device Health Score</h3>
               <p className="text-sm text-text-muted">Calculated automatically based on uptime and open alerts.</p>
             </div>
          </div>
          <div className="p-4 bg-surface-hover border border-border-main rounded-xl mb-4">
            <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Reported State (Read-Only)</p>
            <pre className="text-xs font-mono text-text-main bg-slate-900/5 dark:bg-black/30 p-3 rounded-lg overflow-x-auto">
              {deviceTwin?.reported_state ? JSON.stringify(deviceTwin.reported_state, null, 2) : 'No state reported yet'}
            </pre>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Desired State (JSON)</p>
              <textarea
                value={desiredStateInput}
                onChange={e => setDesiredStateInput(e.target.value)}
                className="w-full bg-background border border-border-main rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-(--color-primary) focus:outline-none transition-all shadow-inner h-48"
              />
            </div>
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-text-muted mb-2">Configuration (JSON)</p>
              <textarea
                value={configInput}
                onChange={e => setConfigInput(e.target.value)}
                className="w-full bg-background border border-border-main rounded-xl p-3 text-xs font-mono focus:ring-2 focus:ring-(--color-primary) focus:outline-none transition-all shadow-inner h-48"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-4 border-t border-border-main">
            <Button type="button" variant="secondary" onClick={() => setIsTwinOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSaveTwin}>Sync Twin</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
