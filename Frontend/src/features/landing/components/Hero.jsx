import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { ArrowRight, ShieldCheck, Activity } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
  return (
    <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden bg-(--color-background)">
      
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-(--color-primary-50) dark:bg-(--color-primary-900)/20 rounded-full opacity-50 blur-[100px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-violet-50 dark:bg-violet-900/10 rounded-full opacity-50 blur-[80px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-12 items-center">
          
          {/* Copy */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
            className="text-center lg:text-left"
          >
            <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-(--color-primary-600) text-sm font-semibold mb-8 border border-indigo-100 dark:border-indigo-500/20">
              <Activity className="w-4 h-4 mr-2" />
              EventStream Core Platform v2.0
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-heading font-extrabold text-(--color-text-main) tracking-tight mb-6 leading-[1.1]">
              Smart Building <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-(--color-primary-600) to-(--color-accent-500)">Ecosystem.</span>
            </h1>
            <p className="text-lg sm:text-xl text-(--color-text-muted) font-medium mb-8 max-w-2xl mx-auto lg:mx-0 leading-relaxed">
              EventStream provides real-time ingestion, intelligent alerting, and comprehensive analytics for high-volume IoT sensor networks. Monitor your entire infrastructure from a single, beautiful pane of glass.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base rounded-xl shadow-[0_8px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_12px_25px_rgba(99,102,241,0.35)] hover:-translate-y-1 transition-all duration-300 group">
                  DEPLOY PLATFORM
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base rounded-xl hover:-translate-y-1 transition-all duration-300">
                  View Capabilities
                </Button>
              </a>
            </div>
            
            <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-6 text-sm text-(--color-text-muted) font-semibold">
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" />
                Enterprise Grade Security
              </div>
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-emerald-500" />
                Real-Time Processing
              </div>
            </div>
          </motion.div>

          {/* Floating UI Container */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="relative mx-auto w-full max-w-lg lg:max-w-none"
          >
            <div className="relative rounded-3xl overflow-hidden bg-white dark:bg-(--color-surface) border border-(--color-border-main) shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-[0_20px_60px_-15px_rgba(0,0,0,0.5)]">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/5 to-purple-500/5 pointer-events-none" />
              <div className="w-full h-auto aspect-[4/3] overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
                  alt="Modern Commercial Architecture" 
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                />
              </div>
              
              {/* Floating Widget */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6, duration: 0.5 }}
                className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-md rounded-2xl border border-white/20 dark:border-slate-700/50 shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-5 flex items-center justify-between"
              >
                <div>
                  <div className="text-xs text-(--color-text-muted) font-semibold uppercase tracking-wider mb-1">Facility Status</div>
                  <div className="text-sm font-bold text-(--color-text-main)">Global Headquarters</div>
                </div>
                <div className="flex items-center text-sm font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10 px-3 py-1.5 rounded-full">
                  <span className="relative flex h-2 w-2 mr-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                  </span>
                  All Systems Nominal
                </div>
              </motion.div>
            </div>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
