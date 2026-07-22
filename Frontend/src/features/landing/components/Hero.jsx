import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../../../components/ui/Button';
import { Star, TrendingUp, Building2, ShieldCheck, Activity, ArrowUpRight } from 'lucide-react';
import { motion } from 'framer-motion';

export function Hero() {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.15, delayChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, x: 60 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { type: "spring", stiffness: 80, damping: 20, mass: 1 }
    }
  };

  const imageVariants = {
    hidden: { opacity: 0, x: -100 },
    visible: { 
      opacity: 1, 
      x: 0, 
      transition: { type: "spring", stiffness: 80, damping: 20, mass: 1 } 
    }
  };

  return (
    <section className="relative pt-[140px] pb-16 lg:pt-[160px] lg:pb-24 overflow-hidden bg-background min-h-screen flex flex-col items-center">
      
      {/* Background Gradients */}
      <div className="absolute top-0 right-0 w-[1000px] h-[1000px] bg-primary-50 dark:bg-primary-900/20 rounded-full opacity-60 blur-[120px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[800px] h-[800px] bg-primary-100 dark:bg-primary-800/10 rounded-full opacity-60 blur-[100px] -translate-x-1/3 translate-y-1/3 pointer-events-none" />

      <div className="max-w-[1400px] w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10 flex flex-col items-center">
        
        {/* Copy - Centered */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="text-center max-w-5xl mx-auto mb-16"
        >
          <h1 className="text-4xl sm:text-6xl lg:text-[5.5rem] font-heading font-extrabold text-text-main tracking-tight mb-8 leading-[1.1]">
            The Future of Smart Facilities <br className="hidden sm:block" />
            with Latest Technology
          </h1>
          <p className="text-lg sm:text-2xl text-text-muted font-medium mb-12 max-w-3xl mx-auto leading-relaxed">
            Expert tech to elevate your building management. Let's take your operations further with real-time IoT monitoring.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-10">
            <Link to="/register" className="w-full sm:w-auto block sm:inline-block">
              <Button size="lg" className="w-full sm:w-auto text-lg rounded-full px-8 py-4 sm:px-10 sm:py-5 bg-primary-950 text-white hover:bg-primary-800 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:-translate-y-1 transition-all duration-300">
                Get Started
              </Button>
            </Link>
            <a href="#how-it-works" className="w-full sm:w-auto block sm:inline-block">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto text-lg rounded-full px-8 py-4 sm:px-10 sm:py-5 border-2 border-border-main bg-white/50 dark:bg-zinc-800/50 backdrop-blur-sm hover:border-primary-500 hover:bg-white dark:hover:bg-zinc-800 hover:-translate-y-1 transition-all duration-300">
                Try Demo
              </Button>
            </a>
          </div>

          {/* Ratings */}
          <div className="flex flex-col items-center justify-center space-y-2">
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-6 h-6 fill-amber-400 text-amber-400 drop-shadow-sm" />
              ))}
              <span className="ml-3 text-lg font-extrabold text-text-main">5.0</span>
            </div>
            <p className="text-sm text-text-muted font-semibold tracking-wide uppercase">from 50+ enterprise reviews</p>
          </div>
        </motion.div>

        {/* Bento Grid Cards */}
        <motion.div 
          variants={containerVariants}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 lg:h-[480px]"
        >
          {/* Card 1: Large Image (Spans 4 cols) */}
          <motion.div variants={imageVariants} className="lg:col-span-4 h-72 lg:h-full rounded-[2.5rem] overflow-hidden relative shadow-xl group">
            <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
            <img src="/hero_infrastructure.png" alt="Infrastructure" className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" />
            <div className="absolute bottom-6 left-6 z-20">
              <div className="bg-white/90 dark:bg-black/70 backdrop-blur-md px-4 py-2 rounded-full text-sm font-bold text-text-main">
                Infrastructure
              </div>
            </div>
          </motion.div>

          {/* Middle Column (Spans 4 cols, contains 2 stacked cards) */}
          <motion.div variants={containerVariants} className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/* Card 2: 100+ Clients */}
            <motion.div variants={itemVariants} className="flex-1 rounded-[2.5rem] bg-primary-950 text-white p-8 md:p-10 flex flex-col justify-between shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:scale-110 group-hover:opacity-20 transition-all duration-500">
                <Building2 className="w-24 h-24 lg:w-32 lg:h-32" />
              </div>
              <h3 className="text-5xl lg:text-7xl font-extrabold tracking-tight">100+</h3>
              <p className="text-xl font-medium text-primary-100 leading-snug max-w-[200px]">
                Our Esteemed <br/> Clients and <br/> Partners
              </p>
            </motion.div>

            {/* Card 4: 24/7 Monitoring */}
            <motion.div variants={itemVariants} className="flex-1 rounded-[2.5rem] bg-primary-100 dark:bg-primary-900/40 p-8 flex flex-col justify-center items-start shadow-xl border border-primary-200 dark:border-transparent group">
              <h3 className="text-4xl lg:text-5xl font-extrabold text-primary-950 dark:text-primary-100 mb-2 group-hover:scale-105 transition-transform origin-left">24/7</h3>
              <p className="text-xl font-bold text-primary-800 dark:text-primary-200 leading-snug">
                Real-time<br/>Monitoring
              </p>
            </motion.div>
          </motion.div>

          {/* Right Column (Spans 4 cols, contains 2 stacked cards) */}
          <motion.div variants={containerVariants} className="lg:col-span-4 flex flex-col gap-6 h-full">
            {/* Card 3: Active Sensors */}
            <motion.div variants={itemVariants} className="flex-1 rounded-[2.5rem] bg-white dark:bg-surface border border-border-main p-8 md:p-10 flex flex-col justify-between shadow-xl relative group hover:border-primary-400 transition-colors">
              <div className="flex justify-between items-start">
                <div className="w-14 h-14 bg-emerald-100 dark:bg-emerald-900/30 rounded-2xl flex items-center justify-center">
                  <ShieldCheck className="w-7 h-7 text-emerald-600 dark:text-emerald-400" />
                </div>
                <div className="flex items-center text-sm font-bold text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 dark:text-emerald-400 px-3 py-1.5 rounded-full">
                  <TrendingUp className="w-4 h-4 mr-1.5"/> 8%
                </div>
              </div>
              <div>
                <div className="text-sm font-bold text-text-muted uppercase tracking-wider mb-2">
                  Active Sensors
                </div>
                <h3 className="text-4xl lg:text-6xl font-extrabold text-text-main tracking-tight mb-2">5000+</h3>
                <p className="text-sm font-semibold text-text-muted">Increase of 126 this month</p>
              </div>
            </motion.div>

            {/* Card 5: Dark Action Card */}
            <motion.div variants={itemVariants} className="flex-1 rounded-[2.5rem] bg-primary-950 text-white p-8 md:p-10 flex flex-col justify-between shadow-xl group cursor-pointer hover:bg-primary-900 transition-colors">
              <div className="w-14 h-14 rounded-full border border-primary-700 flex items-center justify-center group-hover:bg-primary-800 transition-colors">
                <ArrowUpRight className="w-6 h-6 text-primary-300" />
              </div>
              <p className="text-xl lg:text-3xl font-bold leading-tight text-primary-50">
                Achieve Optimal Efficiency and Boost Productivity
              </p>
            </motion.div>
          </motion.div>

        </motion.div>

      </div>
    </section>
  );
}
