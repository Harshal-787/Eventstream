import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { ArrowRight, ShieldCheck, Zap } from 'lucide-react';

export function Hero() {
  return (
    <section className="relative pt-24 pb-16 lg:pt-32 lg:pb-24 overflow-hidden border-b-4 border-(--color-brutal-border)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center">
          
          {/* Copy */}
          <div className="text-center lg:text-left">
            <div className="inline-flex items-center px-3 py-1 bg-(--color-brutal-bg) text-(--color-brutal-text) border-2 border-(--color-brutal-border) shadow-md text-xs font-black mb-8 uppercase tracking-widest">
              <Zap className="w-3.5 h-3.5 mr-2" />
              EventStream Core Platform
            </div>
            <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-(--color-brutal-text) tracking-tighter uppercase mb-6 leading-none">
              Smart Building <br />
              <span className="text-(--color-primary-600)">Ecosystem.</span>
            </h1>
            <p className="text-lg sm:text-xl text-(--color-text-muted) font-bold tracking-wider mb-8 max-w-2xl mx-auto lg:mx-0">
              EventStream Go provides real-time ingestion, intelligent alerting, and comprehensive analytics for high-volume IoT sensor networks. Monitor temperature, motion, smoke, and power from a single pane of glass.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start space-y-4 sm:space-y-0 sm:space-x-4">
              <Link to="/register" className="w-full sm:w-auto">
                <Button size="lg" className="w-full sm:w-auto text-base group">
                  DEPLOY EVENTSTREAM
                  <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                </Button>
              </Link>
              <a href="#features" className="w-full sm:w-auto">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto text-base">
                  VIEW CAPABILITIES
                </Button>
              </a>
            </div>
            
            <div className="mt-10 flex items-center justify-center lg:justify-start space-x-6 text-sm text-(--color-text-muted) font-medium">
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-(--color-primary-500)" />
                Enterprise Grade
              </div>
              <div className="flex items-center">
                <ShieldCheck className="w-5 h-5 mr-2 text-(--color-primary-500)" />
                Real-Time Processing
              </div>
            </div>
          </div>

          {/* Boxy Image Container */}
          <div className="relative mx-auto w-full max-w-lg lg:max-w-none">
            <div className="relative overflow-hidden border-4 border-(--color-brutal-border) bg-(--color-brutal-bg) p-2 shadow-md">
              <div className="w-full h-auto aspect-[4/3] overflow-hidden border-2 border-(--color-brutal-border)">
                <img 
                  src="https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop" 
                  alt="Modern Commercial Architecture" 
                  className="w-full h-full object-cover transition-transform duration-1000 hover:scale-105"
                />
              </div>
              <div className="absolute bottom-6 left-6 right-6 bg-(--color-brutal-bg) border-2 border-(--color-brutal-border) shadow-md p-4 flex items-center justify-between">
                <div>
                  <div className="text-xs text-(--color-text-muted) font-black uppercase tracking-wider mb-1">Facility Status</div>
                  <div className="text-sm font-black uppercase text-(--color-brutal-text)">Global Headquarters</div>
                </div>
                <div className="flex items-center text-sm font-black uppercase text-green-500">
                  <div className="w-3 h-3 border-2 border-green-700 bg-green-500 mr-2 animate-pulse"></div>
                  Optimal
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
