import React from 'react';
import { motion } from 'framer-motion';
import { ArrowUpRight, Activity, Cpu, Map, Bell, Bot, Layers } from 'lucide-react';

const services = [
  {
    icon: Activity,
    title: 'Real-time Telemetry',
    description: 'Monitor thousands of sensors simultaneously with sub-second latency and absolute precision.'
  },
  {
    icon: Cpu,
    title: 'Hardware Agnostic',
    description: 'Seamlessly integrate any sensor from any manufacturer using our universal payload decoders.'
  },
  {
    icon: Bell,
    title: 'Instant Alerting',
    description: 'Configure complex rule-based alerts to notify your teams via Email, SMS, or Webhooks instantly.'
  },
  {
    icon: Bot,
    title: 'AI Root Cause Analysis',
    description: 'Let our autonomous agents analyze anomalies and predict maintenance needs before they happen.'
  },
  {
    icon: Map,
    title: 'Digital Twin Mapping',
    description: 'Visualize your entire building infrastructure with interactive indoor floor plans and live statuses.'
  },
  {
    icon: Layers,
    title: 'Role-Based Access',
    description: 'Secure your operations with enterprise-grade RBAC, ensuring data is only seen by authorized personnel.'
  }
];

export function ServicesGrid() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -50, scale: 0.95 },
    visible: { 
      opacity: 1, 
      x: 0,
      scale: 1,
      transition: { type: "spring", stiffness: 100, damping: 20 }
    }
  };

  return (
    <section id="product" className="min-h-screen flex flex-col justify-center py-20 bg-primary-950 text-white relative overflow-hidden">
      {/* Background accents */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-primary-800/20 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-primary-600/10 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-4xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-heading font-extrabold mb-6 leading-[1.1] tracking-tight"
          >
            Efficient and Integrated <br/> IoT Services
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-primary-200 text-xl md:text-2xl font-medium"
          >
            Simplify operations with our powerful, unified smart building backend.
          </motion.p>
        </div>

        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8"
        >
          {services.map((service, index) => (
            <motion.div 
              key={index}
              variants={itemVariants}
              className="bg-white/[0.03] backdrop-blur-xl border border-white/[0.08] hover:border-primary-500/50 hover:bg-white/[0.06] p-10 rounded-[2rem] transition-all duration-300 group cursor-pointer relative overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative z-10 flex justify-between items-start mb-16">
                <div className="w-16 h-16 rounded-2xl bg-primary-900/50 flex items-center justify-center border border-white/[0.05] group-hover:scale-110 group-hover:rotate-3 transition-transform duration-500">
                  <service.icon className="w-8 h-8 text-primary-400" strokeWidth={1.5} />
                </div>
                <div className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center group-hover:bg-primary-500 group-hover:border-transparent transition-all duration-300">
                  <ArrowUpRight className="w-5 h-5 text-primary-400 group-hover:text-primary-950 transition-colors" />
                </div>
              </div>
              <h3 className="relative z-10 text-2xl font-bold mb-4">{service.title}</h3>
              <p className="relative z-10 text-primary-200 text-base leading-relaxed font-medium">
                {service.description}
              </p>
            </motion.div>
          ))}
        </motion.div>

      </div>
    </section>
  );
}
