import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Box } from '../components/ui/Box';
import { Input } from '../components/ui/Input';
import { Button } from '../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { Activity, Building, Building2, Plus, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AddressAutocomplete } from '../components/ui/AddressAutocomplete';

export function Register() {
  const [step, setStep] = useState(1); // 1: User Details, 2: Building Selection, 3: Building Form, 4: Success
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [drivingLicense, setDrivingLicense] = useState('');
  const [type, setType] = useState(null); // 'single' or 'society'

  const [societyName, setSocietyName] = useState('');
  const [singleBuilding, setSingleBuilding] = useState({ name: '', address: '', city: '', state: '', zip_code: '', latitude: null, longitude: null, ubid: '', parcel_number: '', bin: '' });
  const [wings, setWings] = useState([{ name: '', address: '', city: '', state: '', zip_code: '', latitude: null, longitude: null, ubid: '', parcel_number: '', bin: '' }]);

  const { register, isLoading, error } = useAuthStore();
  
  useEffect(() => {
    useAuthStore.setState({ error: null });
  }, []);

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
    
    let formattedBuildings = [];
    if (type === 'single') {
      formattedBuildings = [singleBuilding];
    } else if (type === 'society') {
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

    const payload = {
      name,
      email,
      password,
      contact_number: contactNumber,
      driving_license: drivingLicense,
      buildings: formattedBuildings
    };

    try {
      await register(payload);
      setStep(4);
    } catch (err) {
      console.error(err);
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-(--color-background) p-4">
        <Box className="w-full max-w-md p-8 text-center space-y-6">
          <div className="flex justify-center">
            <CheckCircle2 className="w-16 h-16 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-(--color-text-main)">Registration Received</h2>
          <p className="text-(--color-text-muted)">
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
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-(--color-background) p-4 py-12 relative">
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
        <Link to="/">
          <Button variant="secondary" size="sm">
            <ArrowLeft className="w-4 h-4 mr-2" />
            BACK TO SITE
          </Button>
        </Link>
      </div>
      <div className="w-full max-w-3xl">
        <div className="text-center mb-8 relative">
          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 bg-(--color-brutal-inverse-bg) flex items-center justify-center text-(--color-brutal-text-inverse) shadow-md border-2 border-(--color-brutal-border)">
              <Activity className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-4xl font-black text-(--color-brutal-text) tracking-tighter uppercase mb-2">Create Account</h1>
          <p className="text-sm font-bold uppercase tracking-widest text-(--color-text-muted)">Get started with EventStream</p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm font-bold uppercase tracking-wide text-white bg-red-600 border-2 border-red-800 text-center max-w-md mx-auto shadow-[4px_4px_0px_0px_#7f1d1d]">
            {error}
          </div>
        )}

        {step === 1 && (
          <Box className="p-8 max-w-md mx-auto">
            <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-(--color-text-main)">Full Name or Manager Name</label>
                  <Input placeholder="Enter your full name" type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-(--color-text-main)">Email Address</label>
                  <Input placeholder="name@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
                </div>
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-(--color-text-main)">Password</label>
                  <Input placeholder="Enter your password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-(--color-text-main)">Contact Number</label>
                    <Input placeholder="+1 234 567 8900" type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-(--color-text-main)">Driving License</label>
                    <Input placeholder="DL12345678" type="text" value={drivingLicense} onChange={(e) => setDrivingLicense(e.target.value)} />
                  </div>
                </div>
              </div>
              <Button type="submit" className="w-full">Continue to Building Setup</Button>
              <div className="text-center text-sm text-(--color-text-muted) mt-4">
                Already have an account? <Link to="/login" className="text-blue-500 hover:text-blue-400 font-medium">Sign in</Link>
              </div>
            </form>
          </Box>
        )}

        {step === 2 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto w-full">
            <Box className="p-8 cursor-pointer   transition-all text-center space-y-4 border-2 border-(--color-brutal-border) bg-(--color-brutal-bg)" onClick={() => { setType('single'); setStep(3); }}>
              <div className="mx-auto w-16 h-16 bg-(--color-brutal-inverse-bg) text-(--color-brutal-text-inverse) flex items-center justify-center border-2 border-(--color-brutal-border) shadow-md">
                <Building className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-(--color-brutal-text)">Single Building</h2>
              <p className="text-sm font-bold tracking-wider text-(--color-text-muted)">Register a standalone commercial or residential building.</p>
            </Box>
            <Box className="p-8 cursor-pointer   transition-all text-center space-y-4 border-2 border-(--color-brutal-border) bg-(--color-brutal-bg)" onClick={() => { setType('society'); setStep(3); }}>
              <div className="mx-auto w-16 h-16 bg-(--color-brutal-inverse-bg) text-(--color-brutal-text-inverse) flex items-center justify-center border-2 border-(--color-brutal-border) shadow-md">
                <Building2 className="w-8 h-8" />
              </div>
              <h2 className="text-xl font-black uppercase tracking-tight text-(--color-brutal-text)">Society / Multi-Wing</h2>
              <p className="text-sm font-bold tracking-wider text-(--color-text-muted)">Register a society, campus, or complex with multiple wings.</p>
            </Box>
            <div className="col-span-1 md:col-span-2 text-center mt-6">
              <Button variant="secondary" onClick={() => setStep(1)}>BACK</Button>
            </div>
          </div>
        )}

        {step === 3 && (
          <Box className="p-6 md:p-8 max-w-2xl mx-auto">
            <div className="mb-6 flex justify-between items-center border-b border-(--color-border) pb-4">
              <h2 className="text-xl font-bold text-(--color-text-main)">
                {type === 'single' ? 'Register Your Building' : 'Register Your Society'}
              </h2>
              <Button variant="ghost" onClick={() => setStep(2)}>Back</Button>
            </div>
            
            <form onSubmit={handleSubmit}>
              {type === 'single' ? (
                <div className="space-y-6">
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-(--color-text-main)">Building Name</label>
                    <Input placeholder="e.g. Apex Tower" required value={singleBuilding.name} onChange={e => setSingleBuilding({...singleBuilding, name: e.target.value})} />
                  </div>
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-(--color-text-main)">Full Address</label>
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-1 text-left">
                      <label className="text-sm font-medium text-(--color-text-main)">City</label>
                      <Input placeholder="San Francisco" required value={singleBuilding.city} onChange={e => setSingleBuilding({...singleBuilding, city: e.target.value})} />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-sm font-medium text-(--color-text-main)">State</label>
                      <Input placeholder="CA" required value={singleBuilding.state} onChange={e => setSingleBuilding({...singleBuilding, state: e.target.value})} />
                    </div>
                    <div className="space-y-1 text-left">
                      <label className="text-sm font-medium text-(--color-text-main)">Zip Code</label>
                      <Input placeholder="94105" required value={singleBuilding.zip_code} onChange={e => setSingleBuilding({...singleBuilding, zip_code: e.target.value})} />
                    </div>
                  </div>
                  
                  <div className="pt-4 border-t border-(--color-border-main)">
                    <h3 className="text-lg font-semibold text-(--color-text-main) mb-4">Additional Identifiers (Optional)</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1 text-left">
                        <label className="text-sm font-medium text-(--color-text-main)">UBID</label>
                        <Input placeholder="e.g. 849VQGGV+V42-005-004" value={singleBuilding.ubid} onChange={e => setSingleBuilding({...singleBuilding, ubid: e.target.value})} />
                        <p className="text-xs text-(--color-text-muted)">Unique Building Identifier</p>
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="text-sm font-medium text-(--color-text-main)">Parcel Number (APN)</label>
                        <Input placeholder="Assessor's Parcel Number" value={singleBuilding.parcel_number} onChange={e => setSingleBuilding({...singleBuilding, parcel_number: e.target.value})} />
                        <p className="text-xs text-(--color-text-muted)">Assigned by local county assessor</p>
                      </div>
                      <div className="space-y-1 text-left">
                        <label className="text-sm font-medium text-(--color-text-main)">BIN</label>
                        <Input placeholder="Building Identification Number" value={singleBuilding.bin} onChange={e => setSingleBuilding({...singleBuilding, bin: e.target.value})} />
                        <p className="text-xs text-(--color-text-muted)">Assigned by city/state govt</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="space-y-8">
                  <div className="space-y-1 text-left">
                    <label className="text-sm font-medium text-(--color-text-main)">Society / Complex Name</label>
                    <Input placeholder="e.g. Grand View Society" required value={societyName} onChange={e => setSocietyName(e.target.value)} />
                  </div>
                  
                  <div className="space-y-4">
                    <div className="flex items-center justify-between border-b border-(--color-border) pb-2">
                      <h3 className="text-lg font-semibold text-(--color-text-main)">Wings / Towers</h3>
                      <Button type="button" size="sm" variant="secondary" onClick={handleAddWing}><Plus className="w-4 h-4 mr-2"/> Add Wing</Button>
                    </div>
                    
                    {wings.map((wing, index) => (
                      <div key={index} className="p-4 border border-(--color-border-main) rounded-md bg-(--color-background) relative space-y-4">
                        {wings.length > 1 && (
                          <button type="button" onClick={() => handleRemoveWing(index)} className="absolute top-2 right-2 text-red-500 hover:text-red-400">
                            <Trash2 className="w-5 h-5" />
                          </button>
                        )}
                        <h4 className="font-medium text-(--color-text-main)">Wing #{index + 1}</h4>
                        <div className="space-y-1 text-left">
                          <label className="text-sm font-medium text-(--color-text-main)">Wing Name</label>
                          <Input placeholder="e.g. A-Wing" required value={wing.name} onChange={e => handleWingChange(index, 'name', e.target.value)} />
                        </div>
                        <div className="space-y-1 text-left">
                          <label className="text-sm font-medium text-(--color-text-main)">Full Address</label>
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-1 text-left">
                            <label className="text-sm font-medium text-(--color-text-main)">City</label>
                            <Input placeholder="City" required value={wing.city} onChange={e => handleWingChange(index, 'city', e.target.value)} />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-sm font-medium text-(--color-text-main)">State</label>
                            <Input placeholder="State" required value={wing.state} onChange={e => handleWingChange(index, 'state', e.target.value)} />
                          </div>
                          <div className="space-y-1 text-left">
                            <label className="text-sm font-medium text-(--color-text-main)">Zip Code</label>
                            <Input placeholder="Zip" required value={wing.zip_code} onChange={e => handleWingChange(index, 'zip_code', e.target.value)} />
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-(--color-border-main)">
                          <h5 className="text-sm font-semibold text-(--color-text-main) mb-3">Additional Identifiers (Optional)</h5>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1 text-left">
                              <label className="text-sm font-medium text-(--color-text-main)">UBID</label>
                              <Input placeholder="UBID" value={wing.ubid} onChange={e => handleWingChange(index, 'ubid', e.target.value)} />
                            </div>
                            <div className="space-y-1 text-left">
                              <label className="text-sm font-medium text-(--color-text-main)">Parcel Number (APN)</label>
                              <Input placeholder="APN" value={wing.parcel_number} onChange={e => handleWingChange(index, 'parcel_number', e.target.value)} />
                            </div>
                            <div className="space-y-1 text-left">
                              <label className="text-sm font-medium text-(--color-text-main)">BIN</label>
                              <Input placeholder="BIN" value={wing.bin} onChange={e => handleWingChange(index, 'bin', e.target.value)} />
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="mt-8 pt-4 border-t border-(--color-border) flex justify-end">
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
