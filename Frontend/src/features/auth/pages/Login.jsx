import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ArrowLeft } from "lucide-react";
import { Logo } from "../../../components/ui/Logo";
import { motion, AnimatePresence } from "framer-motion";

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP
  
  const login = useAuthStore(state => state.login);
  const verifyOtp = useAuthStore(state => state.verifyOtp);
  const error = useAuthStore(state => state.error);
  const isLoading = useAuthStore(state => state.isLoading);
  const navigate = useNavigate();

  useEffect(() => {
    useAuthStore.setState({ error: null });
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    useAuthStore.setState({ error: null });

    try {
      if (step === 1) {
        if (!form.email || !form.password) {
          useAuthStore.setState({ error: "All fields are required." });
          return;
        }
        
        const result = await login(form.email, form.password);
        if (result && result.require_otp) {
          setStep(2);
        } else {
          const role = useAuthStore.getState().user?.role;
          navigate(role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
        }
      } else {
        if (!otp || otp.length !== 6) {
          useAuthStore.setState({ error: "Please enter the 6-digit code." });
          return;
        }
        
        await verifyOtp(form.email, otp);
        const role = useAuthStore.getState().user?.role;
        navigate(role?.toLowerCase() === 'admin' ? '/admin/dashboard' : '/user/dashboard', { replace: true });
      }
    } catch (err) {
      if (err.isRejected) {
        navigate('/reapply', { state: { email: form.email, password: form.password } });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-background font-sans">
      {/* Left Panel - Branding */}
      <div className="hidden lg:flex lg:w-1/2 relative bg-primary-900 flex-col justify-between overflow-hidden">
        {/* Dynamic Background */}
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
              Welcome back to your command center.
            </h2>
            <p className="text-teal-200 text-lg font-medium leading-relaxed">
              Sign in to monitor real-time sensor streams, manage building alerts, and access powerful analytics across your entire portfolio.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="w-full lg:w-1/2 flex flex-col relative overflow-y-auto">
        <div className="absolute top-6 left-6 z-10 lg:hidden flex items-center">
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

        <div className="flex-1 flex flex-col justify-center items-center p-8 sm:p-12 lg:p-24">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="w-full max-w-md"
          >
            <div className="text-left mb-8">
              <h1 className="text-3xl font-heading font-extrabold text-text-main tracking-tight mb-2">Sign in to your account</h1>
              <p className="text-base text-text-muted font-medium">Please enter your credentials to access the dashboard</p>
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

            <form onSubmit={handleSubmit} className="space-y-6">
              {step === 1 ? (
                <motion.div 
                  key="step1"
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Email address</label>
                    <Input
                      type="email"
                      placeholder="name@company.com"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-semibold text-text-main">Password</label>
                      <Link to="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700 font-semibold transition-colors">Forgot password?</Link>
                    </div>
                    <Input
                      type="password"
                      placeholder="Enter your password"
                      value={form.password}
                      onChange={(e) => setForm({ ...form, password: e.target.value })}
                      required
                      className="rounded-xl"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div 
                  key="step2"
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-5"
                >
                  <div className="space-y-2">
                    <label className="text-sm font-semibold text-text-main">Two-Factor Authentication</label>
                    <div className="text-sm text-text-muted mb-4">We've sent a 6-digit code to your email.</div>
                    <Input
                      type="text"
                      required
                      value={otp}
                      onChange={(e) => setOtp(e.target.value)}
                      placeholder="000000"
                      maxLength={6}
                      className="text-center tracking-[0.5em] text-xl font-mono rounded-xl h-14"
                    />
                  </div>
                </motion.div>
              )}
              
              <Button
                type="submit"
                className="w-full rounded-xl py-6 text-base font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? (step === 1 ? "Authenticating..." : "Verifying...") : (step === 1 ? "Sign In" : "Verify & Login")}
              </Button>

              <div className="text-center text-sm font-medium text-text-muted pt-6">
                Don't have an account?{' '}
                <Link to="/register" className="text-primary-600 font-bold hover:text-primary-700 transition-colors">Create one</Link>
              </div>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
