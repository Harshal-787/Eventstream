import React, { useState } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Box } from '../../../components/ui/Box';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { Activity, Building, Building2, Plus, Trash2, CheckCircle2 } from 'lucide-react';

export function Reapply() {
  const [step, setStep] = useState(1); // 1: User Details, 2: Building Selection, 3: Building Form, 4: Success
  const location = useLocation();
  const [name, setName] = useState('');
  const [email, setEmail] = useState(location.state?.email || '');
  const [password, setPassword] = useState(location.state?.password || '');
  const [type, setType] = useState(null); // 'single' or 'society'

  const [societyName, setSocietyName] = useState('');
  const [singleBuilding, setSingleBuilding] = useState({ name: '', address: '', city: '', state: '', zip_code: '' });
  const [wings, setWings] = useState([{ name: '', address: '', city: '', state: '', zip_code: '' }]);

  const { reapply, isLoading, error } = useAuthStore();
  
  const handleAddWing = () => {
    setWings([...wings, { name: '', address: '', city: '', state: '', zip_code: '' }]);
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
    
    let formattedBuildings = [];
    if (type === 'single') {
      formattedBuildings = [singleBuilding];
    } else if (type === 'society') {
      formattedBuildings = wings.map(w => ({
        name: `${societyName} - ${w.name}`,
        address: w.address,
        city: w.city,
        state: w.state,
        zip_code: w.zip_code
      }));
    }

    const payload = {
      name,
      email,
      password,
      buildings: formattedBuildings
    };

    try {
      await reapply(payload);
      setStep(4);
    } catch (err) {
      console.error(err);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background p-4">
        <Box className="w-full max-w-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-text-main">Re-application Received</h2>
          <p className="text-text-muted">
            Your account and building details have been submitted. You will be able to log in once an Admin has approved your account.
          </p>
          <div className="pt-4">
            <Link to="/login">
              <Button className="w-full">Return to Login</Button>
            </Link>
          </div>
        </Box>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-background p-4 py-12">
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-blue-500 rounded-sm flex items-center justify-center shadow-lg">
              <Activity className="text-white w-6 h-6" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-text-main tracking-tight">Fix Info & Re-apply</h1>
          <p className="text-text-muted mt-2">Get started with EventStream Go</p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 text-center">
            {error}
          </div>
        )}

        {step === 1 && (
          <Box className="p-8 max-w-md mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-text-main">Full Name or Manager Name</label>
                  <Input placeholder="John Doe" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-text-main">Confirm Email Address</label>
                  <Input placeholder="john@example.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-text-main">Confirm Password</label>
                  <Input placeholder="••••••••" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
              </div>
              <Button type="submit" className="w-full">Continue to Building Setup</Button>
              <div className="text-center text-sm text-text-muted mt-4">
                Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">Sign in</Link>
              </div>
            </form>
          </Box>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            <Box className="p-8 cursor-pointer hover:border-blue-500 transition-colors text-center space-y-4" onClick={() => { setType('single'); setStep(3); }}>
              <div className="mx-auto w-16 h-16 bg-blue-500/10 text-blue-500 rounded flex items-center justify-center">
                <Building className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-main">Single Building</h2>
              <p className="text-text-muted text-sm">Register a standalone commercial or residential building.</p>
            </Box>
            <Box className="p-8 cursor-pointer hover:border-blue-500 transition-colors text-center space-y-4" onClick={() => { setType('society'); setStep(3); }}>
              <div className="mx-auto w-16 h-16 bg-teal-500/10 text-teal-500 rounded flex items-center justify-center">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-bold text-text-main">Society / Multi-Wing</h2>
              <p className="text-text-muted text-sm">Register a society, campus, or complex with multiple wings or towers.</p>
            </Box>
            <div className="col-span-1 md:col-span-2 text-center mt-4">
              <Button variant="ghost" onClick={() => setStep(1)}>Back</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <Box className="p-6 md:p-8 max-w-2xl mx-auto">
            <div className="mb-6 flex justify-between items-center border-b border-border-main pb-4">
              <h2 className="text-xl font-bold text-text-main">
                {type === 'single' ? 'Register Your Building' : 'Register Your Society'}
              </h2>
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {type === 'single' ? (
                <div className="space-y-6">
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-text-main">Building Name</label>
                    <Input placeholder="e.g. Apex Tower" required value={singleBuilding.name} onChange={e => setSingleBuilding({...singleBuilding, name: e.target.value})} />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-text-main">Full Address</label>
                    <Input placeholder="123 Tech Park Blvd" required value={singleBuilding.address} onChange={e => setSingleBuilding({...singleBuilding, address: e.target.value})} />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-sm font-medium text-text-main">City</label>
                      <Input placeholder="San Francisco" required value={singleBuilding.city} onChange={e => setSingleBuilding({...singleBuilding, city: e.target.value})} />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-sm font-medium text-text-main">State</label>
                      <Input placeholder="CA" required value={singleBuilding.state} onChange={e => setSingleBuilding({...singleBuilding, state: e.target.value})} />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-sm font-medium text-text-main">Zip Code</label>
                      <Input placeholder="94105" required value={singleBuilding.zip_code} onChange={e => setSingleBuilding({...singleBuilding, zip_code: e.target.value})} />
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-text-main">Society / Complex Name</label>
                    <Input placeholder="e.g. Grand View Society" required value={societyName} onChange={e => setSocietyName(e.target.value)} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-border-main pb-2">
                      <h3 className="text-lg font-semibold text-text-main">Wings / Towers</h3>
                      <Button type="button" size="sm" variant="secondary" onClick={handleAddWing}><Plus className="w-4 h-4 mr-2"/> Add Wing</Button>
                    </div>
                    
                    {wings.map((wing, index) => (
                      <div key={index} className="p-4 border border-border-main bg-background relative space-y-4">
                        {wings.length > 1 && (
                          <button type="button" onClick={() => handleRemoveWing(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-400">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                        <h4 className="font-medium text-text-main">Wing #{index + 1}</h4>
                        <div className="space-y-1 text-left">
                          <label className="text-sm font-medium text-text-main">Wing Name</label>
                          <Input placeholder="e.g. A-Wing" required value={wing.name} onChange={e => handleWingChange(index, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-sm font-medium text-text-main">Full Address</label>
                          <Input placeholder="Address for this wing" required value={wing.address} onChange={e => handleWingChange(index, 'address', e.target.value)} />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1 text-left">
                            <label className="text-sm font-medium text-text-main">City</label>
                            <Input placeholder="City" required value={wing.city} onChange={e => handleWingChange(index, 'city', e.target.value)} />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-sm font-medium text-text-main">State</label>
                            <Input placeholder="State" required value={wing.state} onChange={e => handleWingChange(index, 'state', e.target.value)} />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-sm font-medium text-text-main">Zip Code</label>
                            <Input placeholder="Zip" required value={wing.zip_code} onChange={e => handleWingChange(index, 'zip_code', e.target.value)} />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-border-main flex justify-end">
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Submitting...' : 'Submit Registration'}
                </Button>
              </div>
            </form>
          </Box>
        )}
      </div>
    </div>
  );
}
