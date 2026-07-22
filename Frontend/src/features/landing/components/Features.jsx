import React from 'react';
import { Activity, BellRing, Database, LineChart, Shield, Zap } from 'lucide-react';
import { motion } from 'framer-motion';

const featureList = [
  {
    name: 'Real-Time Ingestion',
    description: 'Process thousands of sensor events per second with high availability and exceptionally low latency.',
    icon: Zap,
    color: 'text-amber-500',
    bg: 'bg-amber-50 dark:bg-amber-500/10',
  },
  {
    name: 'Intelligent Alerting',
    description: 'Define custom thresholds and complex rules to automatically generate alerts when anomalies occur.',
    icon: BellRing,
    color: 'text-rose-500',
    bg: 'bg-rose-50 dark:bg-rose-500/10',
  },
  {
    name: 'Device Monitoring',
    description: 'Keep track of device health, heartbeats, and online status to ensure continuous operational coverage.',
    icon: Activity,
    color: 'text-emerald-500',
    bg: 'bg-emerald-50 dark:bg-emerald-500/10',
  },
  {
    name: 'Actionable Analytics',
    description: 'Visualize historical trends, power usage, and environmental conditions to optimize operations.',
    icon: LineChart,
    color: 'text-blue-500',
    bg: 'bg-blue-50 dark:bg-blue-500/10',
  },
  {
    name: 'Robust Data Storage',
    description: 'Securely store and retrieve massive volumes of sensor history for strict compliance and auditing.',
    icon: Database,
    color: 'text-indigo-500',
    bg: 'bg-indigo-50 dark:bg-indigo-500/10',
  },
  {
    name: 'Enterprise Security',
    description: 'Role-based access control ensures that only authorized personnel can manage building parameters.',
    icon: Shield,
    color: 'text-violet-500',
    bg: 'bg-violet-50 dark:bg-violet-500/10',
  },
];

export function Features() {
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
      transition: { duration: 0.5 }
    }
  };

  return (
    <section id="features" className="py-24 bg-(--color-background) relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-3xl md:text-4xl font-heading font-extrabold text-(--color-text-main) mb-6"
          >
            Engineered for Scale
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-(--color-text-muted) text-lg sm:text-xl"
          >
            A comprehensive suite of tools designed to give you unparalleled visibility and control over your physical infrastructure.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          {featureList.map((feature, index) => (
            <motion.div 
              variants={itemVariants}
              key={index}
              className="bg-(--color-surface) p-8 rounded-2xl border border-(--color-border-main) shadow-[0_4px_20px_rgb(0,0,0,0.03)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300 group"
            >
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${feature.bg} ${feature.color} group-hover:scale-110 transition-transform duration-300`}>
                <feature.icon className="w-7 h-7" strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold text-(--color-text-main) mb-3">{feature.name}</h3>
              <p className="text-(--color-text-muted) leading-relaxed">
                {feature.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

        {/* Dashboard Mockup Integration */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-100px" }}
          transition={{ duration: 0.7 }}
          className="mt-32 relative rounded-3xl border border-(--color-border-main) bg-(--color-surface) overflow-hidden shadow-[0_20px_60px_-15px_rgba(0,0,0,0.05)]"
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
            <div className="p-10 lg:p-16 flex flex-col justify-center border-b lg:border-b-0 lg:border-r border-(--color-border-main)">
              <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-blue-50 dark:bg-blue-500/10 text-blue-600 text-xs font-bold mb-6 tracking-wide w-max">
                <span className="w-2 h-2 rounded-full bg-blue-500 mr-2 animate-pulse"></span>
                LIVE DATA
              </div>
              <h3 className="text-3xl sm:text-4xl font-heading font-extrabold text-(--color-text-main) mb-6">Unmatched Visibility</h3>
              <p className="text-(--color-text-muted) text-lg mb-8 leading-relaxed">
                Our intuitive analytics dashboard brings your data to life. Monitor live feeds, track historical trends across multi-wing societies, and respond to critical alerts before they escalate into emergencies.
              </p>
              <ul className="space-y-5">
                {['Live Sensor Event Graphs', 'Global Device Status Summary', 'Historical Event Auditing'].map((item, i) => (
                  <li key={i} className="flex items-center text-(--color-text-main) font-semibold">
                    <div className="w-8 h-8 rounded-full bg-indigo-50 dark:bg-indigo-500/10 text-(--color-primary-600) flex items-center justify-center mr-4">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-full w-full bg-slate-50 dark:bg-(--color-surface) min-h-[400px] p-8 lg:p-12 flex items-center justify-center">
              <div className="relative w-full rounded-2xl border border-(--color-border-main) shadow-xl bg-(--color-surface) overflow-hidden group">
                {/* Browser bar mockup */}
                <div className="absolute top-0 left-0 w-full h-10 border-b border-(--color-border-main) bg-slate-50 dark:bg-(--color-surface) flex items-center px-4 space-x-2 z-10">
                  <div className="w-3 h-3 rounded-full bg-rose-400"></div>
                  <div className="w-3 h-3 rounded-full bg-amber-400"></div>
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                </div>
                <div className="pt-10 bg-(--color-surface) overflow-hidden flex flex-col">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                    alt="Analytics Dashboard showing data" 
                    className="w-full h-auto object-cover opacity-90 transition-transform duration-700 group-hover:scale-105"
                  />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

      </div>
    </section>
  );
}
