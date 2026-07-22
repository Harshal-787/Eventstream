import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ArrowLeft } from "lucide-react";
import apiClient from "../../../services/apiClient";
import toast from "react-hot-toast";
import { Logo } from "../../../components/ui/Logo";
import { motion } from "framer-motion";

export function ResetPassword() {
  const [searchParams] = useSearchParams();
  const emailParam = searchParams.get("email");
  
  const [otp, setOtp] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password || !confirmPassword || !otp) return;

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.");
      return;
    }

    try {
      setIsLoading(true);
      await apiClient.post('/auth/reset-password', { email: emailParam, otp, password });
      toast.success("Password has been successfully reset. You can now log in.");
      navigate("/login");
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to reset password. The code may be invalid or expired.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!emailParam) {
    return (
      <div className="min-h-screen w-full flex bg-background font-sans items-center justify-center">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md p-8 bg-surface border border-border-main rounded-2xl shadow-xl text-center space-y-6"
        >
          <div className="mx-auto w-16 h-16 rounded-full bg-rose-50 text-rose-500 flex items-center justify-center mb-6">
            <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-text-main">Missing Information</h2>
          <p className="text-text-muted font-medium">We could not find the email address associated with your reset request.</p>
          <Link to="/forgot-password" className="block pt-4">
            <Button className="w-full rounded-xl shadow-md">Start Over</Button>
          </Link>
        </motion.div>
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
              Secure your account.
            </h2>
            <p className="text-teal-200 text-lg font-medium leading-relaxed">
              Create a new, strong password to protect your building data and analytics.
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
          <Link to="/login">
            <Button variant="ghost" className="text-slate-500 hover:text-slate-900 dark:hover:text-white gap-2 font-medium">
              <ArrowLeft className="w-4 h-4" />
              Back to login
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
              <h1 className="text-3xl font-heading font-extrabold text-text-main tracking-tight mb-2">Reset Password</h1>
              <p className="text-base text-text-muted font-medium">Create a new secure password</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-main">Reset Code</label>
                  <Input
                    type="text"
                    placeholder="Enter 6-digit code"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                    maxLength={6}
                    className="rounded-xl font-mono text-center tracking-widest text-lg"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-main">New Password</label>
                  <Input
                    type="password"
                    placeholder="Enter new password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-main">Confirm Password</label>
                  <Input
                    type="password"
                    placeholder="Confirm new password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>
              
              <Button
                type="submit"
                className="w-full rounded-xl py-6 text-base font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all mt-4"
                disabled={isLoading}
              >
                {isLoading ? "Updating..." : "Reset Password"}
              </Button>
            </form>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
