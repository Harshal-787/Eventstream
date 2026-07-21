import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Input } from '../../../components/ui/Input';
import { Button } from '../../../components/ui/Button';
import { useAuthStore } from '../store/useAuthStore';
import { Building, Building2, Plus, Trash2, CheckCircle2, ArrowLeft } from 'lucide-react';
import { AddressAutocomplete } from '../../../components/ui/AddressAutocomplete';
import { Logo } from '../../../components/ui/Logo';
import { motion, AnimatePresence } from 'framer-motion';

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
      <div className="min-h-screen w-full flex bg-background font-sans">
        {/* Left Panel - Branding */}
        <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 flex-col justify-between overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-(--color-accent-500) rounded-full blur-[120px] opacity-40 mix-blend-screen" />
            <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
            <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')] opacity-10 bg-cover bg-center mix-blend-overlay" />
          </div>
          <div className="relative z-10 p-12 flex items-center">
            <Logo className="w-10 h-10 text-white" hideText={false} />
            <span className="font-heading font-extrabold text-2xl tracking-tight text-white ml-3">
              Event<span className="text-primary-400">Stream</span>
            </span>
          </div>
        </div>
        
        {/* Right Panel - Success */}
        <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto">
          <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24">
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-md text-center space-y-6"
            >
              <div className="flex justify-center mb-6">
                <div className="w-20 h-20 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-100 dark:border-emerald-500/20">
                  <CheckCircle2 className="w-10 h-10 text-emerald-500" />
                </div>
              </div>
              <h2 className="text-3xl font-heading font-extrabold text-text-main">Registration Received</h2>
              <p className="text-text-muted text-lg">
                Your account and building details have been successfully submitted. You will be able to log in once an Admin has approved your account.
              </p>
              <div className="pt-8">
                <Link to="/login">
                  <Button className="w-full rounded-xl py-6 text-base font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all">
                    Return to Sign In
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 flex-col justify-between overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] right-[-10%] w-[500px] h-[500px] bg-(--color-accent-500) rounded-full blur-[120px] opacity-40 mix-blend-screen" />
          <div className="absolute bottom-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-500 rounded-full blur-[120px] opacity-40 mix-blend-screen" />
          <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070')] opacity-10 bg-cover bg-center mix-blend-overlay" />
        </div>
        
        <div className="relative z-10 p-12 flex items-center">
          <Logo className="w-10 h-10 text-white" hideText={false} />
          <span className="font-heading font-extrabold text-2xl tracking-tight text-white ml-3">
            Event<span className="text-primary-400">Stream</span>
          </span>
        </div>

        <div className="relative z-10 p-12 max-w-xl">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-4xl lg:text-5xl font-heading font-extrabold text-white mb-6 leading-tight">
              Start monitoring your facilities today.
            </h2>
            <p className="text-teal-200 text-lg font-medium leading-relaxed">
              Create an account to register your buildings, add sensors, and begin streaming real-time operational data.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto">
        <div className="absolute top-6 left-6 z-10 lg:hidden">
          <Logo className="w-8 h-8" hideText={true} />
        </div>
        <div className="absolute top-6 right-6 z-10">
          <Link to="/">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 dark:hover:text-white gap-2 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to site
            </Button>
          </Link>
        </div>

        <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24 w-full">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className={`w-full ${step === 3 ? 'max-w-2xl' : 'max-w-md'}`}
          >
            <div className="text-left mb-8">
              <h1 className="text-3xl font-heading font-extrabold text-text-main tracking-tight mb-2">Create Account</h1>
              <p className="text-base text-text-muted font-medium">Get started with EventStream</p>
            </div>

            <AnimatePresence mode="wait">
              {error && (
                <motion.div 
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mb-6 p-4 rounded-xl text-sm font-semibold text-rose-700 bg-rose-50 border border-rose-200 shadow-sm"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); setStep(2); }} className="space-y-6">
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Full Name or Manager Name</label>
                    <Input placeholder="Enter your full name" type="text" value={name} onChange={(e) => setName(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Email Address</label>
                    <Input placeholder="name@company.com" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Password</label>
                    <Input placeholder="Create a password" type="password" value={password} onChange={(e) => setPassword(e.target.value)} required className="rounded-xl" />
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-text-main">Contact Number</label>
                      <Input placeholder="+1 234 567 8900" type="tel" value={contactNumber} onChange={(e) => setContactNumber(e.target.value)} required className="rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-semibold text-text-main">Driving License</label>
                      <Input placeholder="DL12345678" type="text" value={drivingLicense} onChange={(e) => setDrivingLicense(e.target.value)} className="rounded-xl" />
                    </div>
                  </div>
                </motion.div>
                <Button type="submit" className="w-full rounded-xl py-6 text-base font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all mt-4">
                  Continue to Building Setup
                </Button>
                <div className="text-center text-sm font-medium text-text-muted pt-6">
                  Already have an account? <Link to="/login" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Sign in</Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <motion.div 
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full space-y-6"
              >
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div 
                    className="p-8 cursor-pointer rounded-2xl transition-all text-center space-y-4 border border-border-main bg-surface hover:border-primary-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 group" 
                    onClick={() => { setType('single'); setStep(3); }}
                  >
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 text-blue-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Building className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-text-main">Single Building</h2>
                    <p className="text-sm font-medium text-text-muted">Register a standalone commercial or residential building.</p>
                  </div>
                  <div 
                    className="p-8 cursor-pointer rounded-2xl transition-all text-center space-y-4 border border-border-main bg-surface hover:border-primary-500 hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 group" 
                    onClick={() => { setType('society'); setStep(3); }}
                  >
                    <div className="mx-auto w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-500/10 text-teal-500 flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                      <Building2 className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-text-main">Society / Multi-Wing</h2>
                    <p className="text-sm font-medium text-text-muted">Register a society, campus, or complex with multiple wings.</p>
                  </div>
                </div>
                <div className="text-center pt-4">
                  <Button variant="ghost" onClick={() => setStep(1)} className="font-semibold text-slate-500 hover:text-slate-900 flex items-center justify-center gap-2 mx-auto">
                    <ArrowLeft className="w-4 h-4" />
                    Back to Account Setup
                  </Button>
                </div>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div 
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="w-full"
              >
                <div className="mb-8 flex justify-between items-center border-b border-border-main pb-6">
                  <h2 className="text-2xl font-bold text-text-main">
                    {type === 'single' ? 'Register Your Building' : 'Register Your Society'}
                  </h2>
                  <Button variant="ghost" size="sm" onClick={() => setStep(2)}>Back</Button>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-8">
                  {type === 'single' ? (
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-main">Building Name</label>
                        <Input placeholder="e.g. Apex Tower" required value={singleBuilding.name} onChange={e => setSingleBuilding({...singleBuilding, name: e.target.value})} className="rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-main">Full Address</label>
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
                          className="rounded-xl"
                        />
                      </div>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-text-main">City</label>
                          <Input placeholder="San Francisco" required value={singleBuilding.city} onChange={e => setSingleBuilding({...singleBuilding, city: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-text-main">State</label>
                          <Input placeholder="CA" required value={singleBuilding.state} onChange={e => setSingleBuilding({...singleBuilding, state: e.target.value})} className="rounded-xl" />
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-semibold text-text-main">Zip Code</label>
                          <Input placeholder="94105" required value={singleBuilding.zip_code} onChange={e => setSingleBuilding({...singleBuilding, zip_code: e.target.value})} className="rounded-xl" />
                        </div>
                      </div>
                      
                      <div className="pt-6 border-t border-border-main">
                        <h3 className="text-lg font-semibold text-text-main mb-6">Additional Identifiers <span className="text-sm font-normal text-text-muted">(Optional)</span></h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main">UBID</label>
                            <Input placeholder="e.g. 849VQGGV" value={singleBuilding.ubid} onChange={e => setSingleBuilding({...singleBuilding, ubid: e.target.value})} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main">Parcel Number (APN)</label>
                            <Input placeholder="Assessor's Number" value={singleBuilding.parcel_number} onChange={e => setSingleBuilding({...singleBuilding, parcel_number: e.target.value})} className="rounded-xl" />
                          </div>
                          <div className="space-y-2">
                            <label className="text-sm font-semibold text-text-main">BIN</label>
                            <Input placeholder="Bldg ID Number" value={singleBuilding.bin} onChange={e => setSingleBuilding({...singleBuilding, bin: e.target.value})} className="rounded-xl" />
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-8">
                      <div className="space-y-2">
                        <label className="text-sm font-semibold text-text-main">Society / Complex Name</label>
                        <Input placeholder="e.g. Grand View Society" required value={societyName} onChange={e => setSocietyName(e.target.value)} className="rounded-xl" />
                      </div>
                      
                      <div className="space-y-6">
                        <div className="flex items-center justify-between border-b border-border-main pb-4">
                          <h3 className="text-lg font-semibold text-text-main">Wings / Towers</h3>
                          <Button type="button" size="sm" variant="secondary" onClick={handleAddWing} className="rounded-lg"><Plus className="w-4 h-4 mr-2"/> Add Wing</Button>
                        </div>
                        
                        {wings.map((wing, index) => (
                          <div key={index} className="p-6 rounded-2xl border border-border-main bg-surface relative space-y-6">
                            {wings.length > 1 && (
                              <button type="button" onClick={() => handleRemoveWing(index)} className="absolute top-4 right-4 text-rose-500 hover:text-rose-600 transition-colors">
                                <Trash2 className="w-5 h-5" />
                              </button>
                            )}
                            <h4 className="font-bold text-text-main text-lg">Wing #{index + 1}</h4>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-text-main">Wing Name</label>
                              <Input placeholder="e.g. A-Wing" required value={wing.name} onChange={e => handleWingChange(index, 'name', e.target.value)} className="rounded-xl" />
                            </div>
                            <div className="space-y-2">
                              <label className="text-sm font-semibold text-text-main">Full Address</label>
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
                                className="rounded-xl"
                              />
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-main">City</label>
                                <Input placeholder="City" required value={wing.city} onChange={e => handleWingChange(index, 'city', e.target.value)} className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-main">State</label>
                                <Input placeholder="State" required value={wing.state} onChange={e => handleWingChange(index, 'state', e.target.value)} className="rounded-xl" />
                              </div>
                              <div className="space-y-2">
                                <label className="text-sm font-semibold text-text-main">Zip Code</label>
                                <Input placeholder="Zip" required value={wing.zip_code} onChange={e => handleWingChange(index, 'zip_code', e.target.value)} className="rounded-xl" />
                              </div>
                            </div>

                            <div className="pt-4 border-t border-border-main">
                              <h5 className="text-sm font-semibold text-text-main mb-4">Additional Identifiers <span className="font-normal text-text-muted">(Optional)</span></h5>
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold text-text-main">UBID</label>
                                  <Input placeholder="UBID" value={wing.ubid} onChange={e => handleWingChange(index, 'ubid', e.target.value)} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold text-text-main">Parcel Number</label>
                                  <Input placeholder="APN" value={wing.parcel_number} onChange={e => handleWingChange(index, 'parcel_number', e.target.value)} className="rounded-xl" />
                                </div>
                                <div className="space-y-2">
                                  <label className="text-sm font-semibold text-text-main">BIN</label>
                                  <Input placeholder="BIN" value={wing.bin} onChange={e => handleWingChange(index, 'bin', e.target.value)} className="rounded-xl" />
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="pt-8 border-t border-border-main flex justify-end">
                    <Button type="submit" disabled={isLoading} className="w-full sm:w-auto rounded-xl py-6 px-10 text-base font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all">
                      {isLoading ? 'Submitting...' : 'Submit Registration'}
                    </Button>
                  </div>
                </form>
              </motion.div>
            )}

          </motion.div>
        </div>
      </div>
    </div>
  );
}
