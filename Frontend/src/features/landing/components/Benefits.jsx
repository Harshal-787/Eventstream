import React from 'react';
import { motion } from 'framer-motion';
import { Activity, ShieldCheck, Zap } from 'lucide-react';

export function Benefits() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.2 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -20 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { duration: 0.6, ease: "easeOut" }
    }
  };

  return (
    <section id="use-cases" className="min-h-screen flex flex-col justify-center py-24 bg-white dark:bg-background overflow-hidden relative">
      <div className="absolute top-1/2 -right-1/4 w-[800px] h-[800px] bg-emerald-50 dark:bg-emerald-900/10 rounded-full blur-[120px] pointer-events-none" />
      
      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center">
          
          {/* Left: Animated Dashboard Mockup */}
          <motion.div 
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={containerVariants}
            className="relative lg:pl-10"
          >
            <div className="bg-white dark:bg-surface rounded-[3rem] border border-border-main p-6 sm:p-10 shadow-[0_20px_60px_-15px_rgba(0,0,0,0.1)] dark:shadow-2xl relative z-10">
              
              {/* Header */}
              <div className="flex justify-between items-start mb-10">
                <div>
                  <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">Total Sensors</div>
                  <div className="text-3xl sm:text-4xl font-extrabold text-text-main flex items-center tracking-tight">
                    4,285 <span className="ml-2 sm:ml-4 text-xs sm:text-sm font-bold text-emerald-700 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/40 px-2 py-1 sm:px-3 rounded-full flex items-center"><TrendingUpIcon className="w-3 h-3 sm:w-4 sm:h-4 mr-1"/> 12%</span>
                  </div>
                </div>
              </div>

              {/* Stats List */}
              <div className="space-y-6 mb-12">
                {[
                  { label: 'Active', value: '85%', color: 'bg-emerald-500' },
                  { label: 'Maintenance', value: '10%', color: 'bg-amber-500' },
                  { label: 'Offline', value: '5%', color: 'bg-rose-500' }
                ].map((stat, i) => (
                  <motion.div variants={itemVariants} key={i} className="flex items-center justify-between group">
                    <span className="text-sm sm:text-base font-semibold text-text-muted w-20 sm:w-28 flex-shrink-0">{stat.label}</span>
                    <div className="flex-1 mx-6 h-2.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                      <motion.div 
                        initial={{ width: 0 }}
                        whileInView={{ width: stat.value }}
                        transition={{ duration: 1.2, delay: 0.5 + (i * 0.2), ease: "easeOut" }}
                        className={`h-full ${stat.color}`} 
                      />
                    </div>
                    <span className="text-sm sm:text-base font-extrabold text-text-main w-10 sm:w-12 text-right flex-shrink-0">{stat.value}</span>
                  </motion.div>
                ))}
              </div>

              {/* Floating Chart Widget */}
              <motion.div 
                initial={{ opacity: 0, y: 30, x: 20 }}
                whileInView={{ opacity: 1, y: 0, x: 0 }}
                transition={{ duration: 0.8, delay: 0.6, ease: "easeOut" }}
                className="absolute -bottom-12 -right-4 sm:-right-12 bg-white/90 dark:bg-surface-hover/90 backdrop-blur-xl rounded-[2rem] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.15)] dark:shadow-[0_20px_50px_rgba(0,0,0,0.5)] border border-border-main w-80 hidden sm:block"
              >
                <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-900/50 rounded-2xl flex items-center justify-center mb-6">
                  <Activity className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-widest mb-2">System Uptime</div>
                <div className="text-3xl font-extrabold text-text-main mb-6 tracking-tight">99.99%</div>
                
                {/* Mock Bar Chart */}
                <div className="flex items-end space-x-3 h-20">
                  {[40, 60, 30, 80, 50, 90, 100].map((h, i) => (
                    <motion.div 
                      key={i}
                      initial={{ height: 0 }}
                      whileInView={{ height: `${h}%` }}
                      transition={{ duration: 0.7, delay: 0.8 + (i * 0.1), ease: "easeOut" }}
                      className={`w-full rounded-t-md ${i === 6 ? 'bg-emerald-500' : 'bg-primary-100 dark:bg-primary-900'}`}
                    />
                  ))}
                </div>
              </motion.div>
            </div>
          </motion.div>

          {/* Right: Copy */}
          <div className="lg:pl-8 mt-20 lg:mt-0">
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="text-3xl md:text-5xl font-heading font-extrabold text-text-main mb-8 leading-[1.15] tracking-tight"
            >
              Key Benefits of Our System for Your Business Efficiency
            </motion.h2>
            <motion.p 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-text-muted text-xl mb-14 leading-relaxed max-w-2xl"
            >
              Our platform boosts productivity, cuts costs, and drives business growth through automated intelligence.
            </motion.p>

            <div className="space-y-10">
              {[
                { icon: ShieldCheck, title: "Prevent Costly Downtime", desc: "Identify failing equipment before it breaks down with predictive maintenance alerts." },
                { icon: Zap, title: "Optimize Energy Usage", desc: "Track power consumption across your entire facility to reduce waste and lower bills." },
                { icon: Activity, title: "AI-Driven Insights", desc: "Leverage autonomous agents to generate daily health summaries and RCA reports." }
              ].map((item, index) => (
                <motion.div 
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay: 0.2 + (index * 0.15) }}
                  className="flex group cursor-pointer"
                >
                  <div className="flex-shrink-0 mt-1">
                    <div className="w-14 h-14 rounded-2xl bg-primary-50 dark:bg-primary-900/40 flex items-center justify-center group-hover:bg-primary-500 transition-colors duration-500">
                      <item.icon className="w-7 h-7 text-primary-600 dark:text-primary-400 group-hover:text-white transition-colors duration-500" />
                    </div>
                  </div>
                  <div className="ml-6">
                    <h4 className="text-2xl font-bold text-text-main mb-3 group-hover:text-primary-600 transition-colors duration-300">{item.title}</h4>
                    <p className="text-text-muted text-lg leading-relaxed">{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}

function TrendingUpIcon(props) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="22 7 13.5 15.5 8.5 10.5 2 17" />
      <polyline points="16 7 22 7 22 13" />
    </svg>
  );
}
