import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Input } from "../../../components/ui/Input";
import { Button } from "../../../components/ui/Button";
import { ArrowLeft } from "lucide-react";
import apiClient from "../../../services/apiClient";
import toast from "react-hot-toast";
import { Logo } from "../../../components/ui/Logo";
import { motion, AnimatePresence } from "framer-motion";

export function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;

    try {
      setIsLoading(true);
      await apiClient.post('/auth/forgot-password', { email });
      toast.success("If an account exists, a reset code has been sent.");
      navigate(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      toast.error(err.response?.data?.error || "Failed to request password reset code.");
    } finally {
      setIsLoading(false);
    }
  };

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
              Get back to managing your infrastructure.
            </h2>
            <p className="text-teal-200 text-lg font-medium leading-relaxed">
              We'll send you a secure 6-digit code to reset your password and restore access to your account.
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
              <h1 className="text-3xl font-heading font-extrabold text-text-main tracking-tight mb-2">Forgot Password</h1>
              <p className="text-base text-text-muted font-medium">Request a secure password reset code.</p>
            </div>

            <AnimatePresence mode="wait">
              <motion.form 
                onSubmit={handleSubmit} 
                className="space-y-6"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-text-main">Email address</label>
                  <Input
                    type="email"
                    placeholder="name@company.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                
                <Button
                  type="submit"
                  className="w-full rounded-xl py-6 text-base font-bold shadow-[0_4px_14px_0_rgb(0,0,0,0.1)] hover:shadow-[0_6px_20px_rgba(99,102,241,0.23)] hover:-translate-y-0.5 transition-all mt-4"
                  disabled={isLoading}
                >
                  {isLoading ? "Sending Code..." : "Send Reset Code"}
                </Button>
              </motion.form>
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
