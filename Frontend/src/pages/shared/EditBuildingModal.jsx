import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { buildingService } from '../../services/buildingService';

export function EditBuildingModal({ isOpen, onClose, building, onBuildingUpdated }) {
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zipCode, setZipCode] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen && building) {
      setName(building.name || '');
      setAddress(building.address || '');
      setCity(building.city || '');
      setState(building.state || '');
      setZipCode(building.zip_code || '');
    }
  }, [isOpen, building]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!building) return;

    setLoading(true);
    try {
      await buildingService.updateBuilding(building.id, {
        name,
        address,
        city,
        state,
        zip_code: zipCode
      });
      onBuildingUpdated();
      onClose();
    } catch (err) {
      console.error(err);
      alert("Failed to update building details.");
    } finally {
      setLoading(false);
    }
  };

  if (!building) return null;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Edit Building Details">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-1">
          <label className="text-sm font-medium text-(--color-text-main)">Name</label>
          <Input 
            placeholder="Building or Wing Name" 
            required 
            value={name} 
            onChange={(e) => setName(e.target.value)} 
          />
        </div>
        <div className="space-y-1">
          <label className="text-sm font-medium text-(--color-text-main)">Address</label>
          <Input 
            placeholder="Address" 
            required 
            value={address} 
            onChange={(e) => setAddress(e.target.value)} 
          />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div className="space-y-1">
            <label className="text-sm font-medium text-(--color-text-main)">City</label>
            <Input 
              placeholder="City" 
              required 
              value={city} 
              onChange={(e) => setCity(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-(--color-text-main)">State</label>
            <Input 
              placeholder="State" 
              required 
              value={state} 
              onChange={(e) => setState(e.target.value)} 
            />
          </div>
          <div className="space-y-1">
            <label className="text-sm font-medium text-(--color-text-main)">Zip Code</label>
            <Input 
              placeholder="Zip Code" 
              required 
              value={zipCode} 
              onChange={(e) => setZipCode(e.target.value)} 
            />
          </div>
        </div>
        
        <div className="flex justify-between pt-4 border-t border-(--color-border)">
          <Button variant="ghost" type="button" onClick={onClose}>Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
