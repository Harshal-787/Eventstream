import React from 'react';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { Features } from '../components/Features';
import { Footer } from '../components/Footer';
import { Thermometer, Droplets, Wind, Zap, Fingerprint, Map } from 'lucide-react';
import { motion } from 'framer-motion';

export function LandingPage() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <div className="min-h-screen bg-(--color-background) font-sans overflow-x-hidden">
      <Header />
      
      <main>
        <Hero />
        <Features />
        
        {/* Use Cases / Sensors Section */}
        <section id="use-cases" className="py-24 bg-(--color-surface) relative">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-50/50 to-white/50 dark:from-slate-900/50 dark:to-slate-950/50 pointer-events-none" />
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={itemVariants}
              className="text-center max-w-3xl mx-auto mb-16"
            >
              <h2 className="text-3xl md:text-4xl font-heading font-extrabold text-(--color-text-main) mb-6">
                Supported Sensor Modalities
              </h2>
              <p className="text-(--color-text-muted) text-lg sm:text-xl">
                EventStream is built to handle diverse data streams, making it the perfect unified backend for comprehensive smart building monitoring.
              </p>
            </motion.div>

            <motion.div 
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-100px" }}
              variants={containerVariants}
              className="grid grid-cols-2 md:grid-cols-3 gap-6 lg:gap-8"
            >
              {[
                { name: 'Temperature', icon: Thermometer, color: 'text-rose-500', bg: 'bg-rose-50 dark:bg-rose-500/10' },
                { name: 'Humidity', icon: Droplets, color: 'text-cyan-500', bg: 'bg-cyan-50 dark:bg-cyan-500/10' },
                { name: 'Air Quality', icon: Wind, color: 'text-slate-500', bg: 'bg-slate-50 dark:bg-zinc-500/10' },
                { name: 'Power Usage', icon: Zap, color: 'text-amber-500', bg: 'bg-amber-50 dark:bg-amber-500/10' },
                { name: 'Door Access', icon: Fingerprint, color: 'text-(--color-accent-500)', bg: 'bg-violet-50 dark:bg-violet-500/10' },
                { name: 'Motion', icon: Map, color: 'text-emerald-500', bg: 'bg-emerald-50 dark:bg-emerald-500/10' },
              ].map((sensor, i) => (
                <motion.div 
                  variants={itemVariants}
                  key={i} 
                  className="flex flex-col items-center p-8 bg-(--color-surface) rounded-2xl border border-(--color-border-main) shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group"
                >
                  <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300 ${sensor.bg} ${sensor.color}`}>
                    <sensor.icon className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-lg font-semibold text-(--color-text-main)">{sensor.name}</h4>
                </motion.div>
              ))}
            </motion.div>
          </div>
        </section>

        {/* Call to Action */}
        <section id="how-it-works" className="py-32 bg-(--color-primary-900) relative overflow-hidden">
          {/* Decorative background elements */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-(--color-accent-500) rounded-full opacity-20 blur-3xl translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500 rounded-full opacity-20 blur-3xl -translate-x-1/2 translate-y-1/2" />
          
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
            >
              <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-8">
                Ready to upgrade your infrastructure?
              </h2>
              <p className="text-xl text-indigo-200 mb-12 max-w-2xl mx-auto">
                Join leading facility managers and smart society administrators who rely on EventStream for their daily operations.
              </p>
              <a href="/register">
                <button className="bg-white text-(--color-primary-900) font-bold py-4 px-10 rounded-xl text-lg shadow-[0_8px_30px_rgba(255,255,255,0.2)] hover:shadow-[0_8px_30px_rgba(255,255,255,0.4)] hover:-translate-y-1 transition-all duration-300">
                  Create Your Free Account
                </button>
              </a>
            </motion.div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
