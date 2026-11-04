import React from 'react';
import { motion } from 'framer-motion';
import { Activity, Wifi, Database, Cloud, Radio, Smartphone } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

export function Integrations() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.8 },
    visible: { 
      opacity: 1, 
      scale: 1, 
      transition: { duration: 0.5, ease: "easeOut" }
    }
  };

  return (
    <section id="integrations" className="min-h-screen flex flex-col justify-center py-24 bg-white dark:bg-background overflow-hidden relative">
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Copy */}
          <div>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-heading font-extrabold text-text-main mb-6 leading-tight"
            >
              Empowering Top Facilities with Seamless Integrations
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-text-muted text-lg sm:text-xl font-medium mb-10 leading-relaxed"
            >
              Experience seamless connections with our innovative solutions, designed to effortlessly integrate with your existing IoT infrastructure, enhance productivity, and drive your business towards greater success.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <Button onClick={() => window.location.href='/register'} size="lg" className="rounded-full px-8 bg-emerald-100 text-emerald-700 hover:bg-emerald-200 shadow-none font-bold">
                Work With Us
              </Button>
            </motion.div>
          </div>

        {/* Right: Floating Nodes */}
          <div className="relative h-[400px] w-full bg-emerald-50/50 dark:bg-surface rounded-[3rem] border border-border-main flex items-center justify-center p-8">
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, margin: "-50px" }}
              className="relative w-full h-full flex items-center justify-center"
            >
              {/* Center Logo */}
              <motion.div 
                initial={{ scale: 0, rotate: -180 }}
                whileInView={{ scale: 1, rotate: 0 }}
                transition={{ duration: 0.8, type: 'spring', damping: 15 }}
                className="w-20 h-20 bg-primary-950 rounded-2xl flex items-center justify-center z-10 shadow-2xl relative"
              >
                <motion.div 
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                  className="absolute inset-0 bg-primary-500 rounded-2xl opacity-20 blur-xl"
                />
                <Activity className="w-10 h-10 text-primary-400 relative z-10" />
              </motion.div>

              {/* Connecting Lines (CSS only for visual) */}
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-20 dark:opacity-10" viewBox="0 0 100 100" preserveAspectRatio="none">
                <line x1="50" y1="50" x2="20" y2="20" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2"/>
                <line x1="50" y1="50" x2="80" y2="25" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2"/>
                <line x1="50" y1="50" x2="85" y2="70" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2"/>
                <line x1="50" y1="50" x2="15" y2="65" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2"/>
                <line x1="50" y1="50" x2="50" y2="85" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2"/>
              </svg>

              {/* Surrounding Nodes */}
              {[
                { icon: Wifi, color: "text-blue-500", pos: "top-[10%] left-[15%]", size: "w-14 h-14" },
                { icon: Database, color: "text-teal-500", pos: "top-[15%] right-[15%]", size: "w-16 h-16" },
                { icon: Cloud, color: "text-sky-500", pos: "bottom-[20%] right-[10%]", size: "w-14 h-14" },
                { icon: Radio, color: "text-rose-500", pos: "bottom-[25%] left-[10%]", size: "w-16 h-16" },
                { icon: Smartphone, color: "text-amber-500", pos: "bottom-[5%] left-[45%]", size: "w-12 h-12" }
              ].map((Node, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0, x: (i % 2 === 0 ? -50 : 50), y: (i % 3 === 0 ? -50 : 50) }}
                  whileInView={{ opacity: 1, scale: 1, x: 0, y: 0 }}
                  transition={{ duration: 0.6, delay: 0.3 + (i * 0.1), type: "spring" }}
                  className={`absolute ${Node.pos} ${Node.size} bg-white dark:bg-zinc-800 rounded-full shadow-lg flex items-center justify-center border border-border-main`}
                >
                  <Node.icon className={`w-1/2 h-1/2 ${Node.color}`} />
                </motion.div>
              ))}

            </motion.div>
          </div>

        </div>
      </div>
    </section>
  );
}
