import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuthStore } from "../store/useAuthStore";
import { Box } from "../components/ui/Box";
import { Input } from "../components/ui/Input";
import { Button } from "../components/ui/Button";
import { Activity, ArrowLeft } from "lucide-react";

export function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [otp, setOtp] = useState("");
  const [step, setStep] = useState(1); // 1 = credentials, 2 = OTP
  
  const login = useAuthStore(state => state.login);
  const verifyOtp = useAuthStore(state => state.verifyOtp);
  const error = useAuthStore(state => state.error);
  const isLoading = useAuthStore(state => state.isLoading);
  const navigate = useNavigate();

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
          window.location.reload(); 
        }
      } else {
        if (!otp || otp.length !== 6) {
          useAuthStore.setState({ error: "Please enter the 6-digit code." });
          return;
        }
        
        await verifyOtp(form.email, otp);
        window.location.reload(); 
      }
    } catch (err) {
      if (err.isRejected) {
        navigate('/reapply', { state: { email: form.email, password: form.password } });
      }
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center bg-(--color-background) p-4 py-12 relative">
      <div className="absolute top-6 left-6 lg:top-8 lg:left-8">
        <Link to="/">
          <Button variant="ghost" size="sm" className="text-(--color-text-muted) hover:text-(--color-text-main)">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to site
          </Button>
        </Link>
      </div>

      <div className="w-full max-w-3xl">
        <div className="text-center mb-8 relative">
          <div className="flex justify-center mb-4">
            <div className="w-12 h-12 bg-(--color-primary-600) flex items-center justify-center text-white">
              <Activity className="w-8 h-8" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-(--color-text-main) tracking-tight">Sign In</h1>
          <p className="text-(--color-text-muted) mt-2">Sign in to your dashboard</p>
        </div>

        {error && (
          <div className="mb-6 p-4 text-sm text-red-500 bg-red-500/10 border border-red-500/20 text-center max-w-md mx-auto">
            {error}
          </div>
        )}

        <Box className="p-8 max-w-md mx-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 ? (
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-(--color-text-main)">Email address</label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-1 text-left">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-(--color-text-main)">Password</label>
                    <a href="#" className="text-xs text-blue-500 hover:text-blue-400 font-medium">Forgot password?</a>
                  </div>
                  <Input
                    type="password"
                    placeholder="Enter your password"
                    value={form.password}
                    onChange={(e) => setForm({ ...form, password: e.target.value })}
                    required
                  />
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-1 text-left">
                  <label className="text-sm font-medium text-(--color-text-main)">6-Digit Verification Code</label>
                  <div className="text-sm text-(--color-text-muted) mb-2">We've sent a code to your email.</div>
                  <Input
                    type="text"
                    required
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="000000"
                    maxLength={6}
                    className="text-center tracking-widest text-lg font-mono"
                  />
                </div>
              </div>
            )}
            
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? (step === 1 ? "Signing in..." : "Verifying...") : (step === 1 ? "Sign In" : "Verify & Login")}
            </Button>

            <div className="text-center text-sm text-(--color-text-muted) mt-4">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-500 hover:text-blue-400 font-medium">Create one</Link>
            </div>
          </form>
        </Box>
      </div>
    </div>
  );
}
