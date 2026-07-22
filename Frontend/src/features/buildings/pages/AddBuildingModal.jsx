import React, { useState, useEffect } from 'react';
import { Modal } from '../../../components/ui/Modal';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { Building, Building2, Plus, Trash2 } from 'lucide-react';
import { userService } from '../../users/services/userService';
import { buildingService } from '../services/buildingService';
import { Box } from '../../../components/ui/Box';
import { AddressAutocomplete } from '../../../components/ui/AddressAutocomplete';

export function AddBuildingModal({ isOpen, onClose, onBuildingAdded }) {
  const [step, setStep] = useState(1); // 1: Type Selection, 2: Form
  const [type, setType] = useState('single');
  const [users, setUsers] = useState([]);
  const [ownerId, setOwnerId] = useState('');
  
  const [societyName, setSocietyName] = useState('');
  const [singleBuilding, setSingleBuilding] = useState({ name: '', address: '', city: '', state: '', zip_code: '', latitude: null, longitude: null, ubid: '', parcel_number: '', bin: '' });
  const [wings, setWings] = useState([{ name: '', address: '', city: '', state: '', zip_code: '', latitude: null, longitude: null, ubid: '', parcel_number: '', bin: '' }]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setType('single');
      setOwnerId('');
      setSocietyName('');
      setSingleBuilding({ name: '', address: '', city: '', state: '', zip_code: '', latitude: null, longitude: null, ubid: '', parcel_number: '', bin: '' });
      setWings([{ name: '', address: '', city: '', state: '', zip_code: '', latitude: null, longitude: null, ubid: '', parcel_number: '', bin: '' }]);
      
      const fetchUsers = async () => {
        try {
          const data = await userService.getUsers();
          setUsers(data || []);
        } catch (err) {
          console.error('Failed to load users for assignment', err);
        }
      };
      fetchUsers();
    }
  }, [isOpen]);

  const handleAddWing = () => {
    setWings([...wings, { name: '', address: '', city: '', state: '', zip_code: '', latitude: null, longitude: null, ubid: '', parcel_number: '', bin: '' }]);
  };

  const handleRemoveWing = (index) => {
    setWings(wings.filter((_, i) => i !== index));
  };

  const handleWingChange = (index, field, value) => {
    const newWings = [...wings];
    newWings[index][field] = value;
    setWings(newWings);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!ownerId) {
      alert("Please select an owner for this building.");
      return;
    }

    setLoading(true);
    let formattedBuildings = [];
    if (type === 'single') {
      formattedBuildings = [singleBuilding];
    } else {
      formattedBuildings = wings.map(w => ({
        name: `${societyName} - ${w.name}`,
        address: w.address,
        city: w.city,
        state: w.state,
        zip_code: w.zip_code,
        latitude: w.latitude,
        longitude: w.longitude,
        ubid: w.ubid || undefined,
        parcel_number: w.parcel_number || undefined,
        bin: w.bin || undefined
      }));
    }

    try {
      // Backend expects /api/v1/buildings POST which accepts one building at a time.
      // Wait, register allowed multiple buildings. The regular building create endpoint only allows one.
      for (const b of formattedBuildings) {
        await buildingService.createBuilding({
          name: b.name,
          address: b.address,
          city: b.city,
          state: b.state,
          zip_code: b.zip_code,
          latitude: b.latitude,
          longitude: b.longitude,
          ubid: b.ubid || undefined,
          parcel_number: b.parcel_number || undefined,
          bin: b.bin || undefined,
          owner_id: parseInt(ownerId) // Admin endpoint should support passing owner_id
        });
      }
      onBuildingAdded();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to add building. Check console for details.");
    } finally {
      setLoading(false);
    }
  };

  if (step === 1) {
    return (
      <Modal isOpen={isOpen} onClose={onClose} title="Select Building Type">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Box className="p-6 cursor-pointer hover:border-blue-500 transition-colors text-center space-y-3" onClick={() => { setType('single'); setStep(2); }}>
            <div className="mx-auto w-12 h-12 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center">
              <Building className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-text-main">Single Building</h2>
            <p className="text-text-muted text-sm">Standalone commercial or residential building.</p>
          </Box>
          <Box className="p-6 cursor-pointer hover:border-blue-500 transition-colors text-center space-y-3" onClick={() => { setType('society'); setStep(2); }}>
            <div className="mx-auto w-12 h-12 bg-teal-500/10 text-teal-500 rounded flex items-center justify-center">
              <Building2 className="w-6 h-6" />
            </div>
            <h2 className="text-lg font-bold text-text-main">Society / Multi-Wing</h2>
            <p className="text-text-muted text-sm">Complex with multiple wings or towers.</p>
          </Box>
        </div>
      </Modal>
    );
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={type === 'single' ? "Add Single Building" : "Add Society"}>
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label className="text-sm font-medium text-text-main">Assign Customer / Owner (Mandatory)</label>
          <select 
            className="appearance-none flex h-11 w-full border border-border-main bg-surface px-4 py-2 pr-10 text-sm text-text-main transition-all focus:outline-none focus:border-teal-500 focus:ring-1 focus:ring-teal-500 rounded-xl shadow-sm cursor-pointer"
            required
            value={ownerId}
            onChange={(e) => setOwnerId(e.target.value)}
          >
            <option value="" disabled>Select a user...</option>
            {users.filter(u => u.role !== 'admin').map(user => (
              <option key={user.id} value={user.id}>{user.name} ({user.email})</option>
            ))}
          </select>
        </div>

        {type === 'single' ? (
          <div className="space-y-4">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-main">Building Name</label>
              <Input placeholder="e.g. Apex Tower" required value={singleBuilding.name} onChange={e => setSingleBuilding({...singleBuilding, name: e.target.value})} />
            </div>
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-main">Full Address</label>
              <AddressAutocomplete
                value={singleBuilding.address}
                onChange={e => setSingleBuilding({...singleBuilding, address: e.target.value})}
                onSelectAddress={(data) => setSingleBuilding({
                  ...singleBuilding,
                  address: data.address_line1,
                  city: data.city,
                  state: data.state,
                  zip_code: data.zip_code,
                  latitude: data.lat,
                  longitude: data.lon
                })}
                required
              />
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-main">City</label>
                <Input placeholder="City" required value={singleBuilding.city} onChange={e => setSingleBuilding({...singleBuilding, city: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-main">State</label>
                <Input placeholder="State" required value={singleBuilding.state} onChange={e => setSingleBuilding({...singleBuilding, state: e.target.value})} />
              </div>
              <div className="space-y-1">
                <label className="text-sm font-medium text-text-main">Zip Code</label>
                <Input placeholder="Zip" required value={singleBuilding.zip_code} onChange={e => setSingleBuilding({...singleBuilding, zip_code: e.target.value})} />
              </div>
            </div>

            <div className="pt-4 border-t border-border-main">
              <h3 className="text-sm font-semibold text-text-main mb-3">Additional Identifiers (Optional)</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-main">UBID</label>
                  <Input placeholder="UBID" value={singleBuilding.ubid} onChange={e => setSingleBuilding({...singleBuilding, ubid: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-main">Parcel Number (APN)</label>
                  <Input placeholder="APN" value={singleBuilding.parcel_number} onChange={e => setSingleBuilding({...singleBuilding, parcel_number: e.target.value})} />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-medium text-text-main">BIN</label>
                  <Input placeholder="BIN" value={singleBuilding.bin} onChange={e => setSingleBuilding({...singleBuilding, bin: e.target.value})} />
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="space-y-1">
              <label className="text-sm font-medium text-text-main">Society Name</label>
              <Input placeholder="e.g. Grand View Society" required value={societyName} onChange={e => setSocietyName(e.target.value)} />
            </div>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-border-main pb-2">
                <h3 className="text-md font-semibold text-text-main">Wings</h3>
                <Button type="button" size="sm" variant="secondary" onClick={handleAddWing}><Plus className="w-4 h-4 mr-1"/> Add Wing</Button>
              </div>
              
              {wings.map((wing, index) => (
                <div key={index} className="p-3 border border-border-main bg-background rounded-md space-y-3 relative">
                  {wings.length > 1 && (
                    <button type="button" onClick={() => handleRemoveWing(index)} className="absolute top-3 right-3 text-red-500 hover:text-red-400">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-main">Wing #{index + 1} Name</label>
                    <Input placeholder="e.g. A-Wing" required value={wing.name} onChange={e => handleWingChange(index, 'name', e.target.value)} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-xs font-medium text-text-main">Address</label>
                    <AddressAutocomplete
                      value={wing.address}
                      onChange={e => handleWingChange(index, 'address', e.target.value)}
                      onSelectAddress={(data) => {
                        const newWings = [...wings];
                        newWings[index].address = data.address_line1;
                        newWings[index].city = data.city;
                        newWings[index].state = data.state;
                        newWings[index].zip_code = data.zip_code;
                        newWings[index].latitude = data.lat;
                        newWings[index].longitude = data.lon;
                        setWings(newWings);
                      }}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-3 gap-2">
                    <Input placeholder="City" required value={wing.city} onChange={e => handleWingChange(index, 'city', e.target.value)} />
                    <Input placeholder="State" required value={wing.state} onChange={e => handleWingChange(index, 'state', e.target.value)} />
                    <Input placeholder="Zip" required value={wing.zip_code} onChange={e => handleWingChange(index, 'zip_code', e.target.value)} />
                  </div>

                  <div className="pt-3 mt-2 border-t border-border-main">
                    <h5 className="text-xs font-semibold text-text-main mb-2">Additional Identifiers (Optional)</h5>
                    <div className="grid grid-cols-3 gap-2">
                      <Input placeholder="UBID" value={wing.ubid} onChange={e => handleWingChange(index, 'ubid', e.target.value)} />
                      <Input placeholder="APN" value={wing.parcel_number} onChange={e => handleWingChange(index, 'parcel_number', e.target.value)} />
                      <Input placeholder="BIN" value={wing.bin} onChange={e => handleWingChange(index, 'bin', e.target.value)} />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between pt-4 border-t border-border-main">
          <Button variant="ghost" type="button" onClick={() => setStep(1)}>Back</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Adding...' : 'Add Building'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
