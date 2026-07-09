import React from 'react';
import { Header } from '../components/landing/Header';
import { Hero } from '../components/landing/Hero';
import { Features } from '../components/landing/Features';
import { Footer } from '../components/landing/Footer';
import { Thermometer, Droplets, Wind, Zap, Fingerprint, Map } from 'lucide-react';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-(--color-background) font-sans overflow-x-hidden selection:bg-blue-500/30 selection:text-blue-200">
      <Header />
      
      <main>
        <Hero />
        <Features />
        
        {/* Use Cases / Sensors Section */}
        <section id="use-cases" className="py-24 bg-(--color-surface) border-b border-(--color-border-main)">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-4xl font-extrabold text-(--color-text-main) mb-6 tracking-tight">Supported Sensor Modalities</h2>
              <p className="text-(--color-text-muted) text-lg sm:text-xl">
                EventStream Go is built to handle diverse data streams, making it the perfect unified backend for comprehensive building monitoring.
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-px bg-(--color-border-main) border border-(--color-border-main)">
              {[
                { name: 'Temperature', icon: Thermometer, color: 'text-red-500', bg: 'bg-red-500/10 dark:bg-red-900/30' },
                { name: 'Humidity', icon: Droplets, color: 'text-blue-500', bg: 'bg-blue-500/10 dark:bg-blue-900/30' },
                { name: 'Air Quality', icon: Wind, color: 'text-gray-500', bg: 'bg-gray-500/10 dark:bg-gray-800/50' },
                { name: 'Power Consumption', icon: Zap, color: 'text-yellow-500', bg: 'bg-yellow-500/10 dark:bg-yellow-900/30' },
                { name: 'Door Access', icon: Fingerprint, color: 'text-purple-500', bg: 'bg-purple-500/10 dark:bg-purple-900/30' },
                { name: 'Motion', icon: Map, color: 'text-green-500', bg: 'bg-green-500/10 dark:bg-green-900/30' },
              ].map((sensor, i) => (
                <div 
                  key={i} 
                  className="flex flex-col items-center p-8 bg-(--color-background) hover:bg-(--color-surface) transition-colors group"
                >
                  <div className={`w-16 h-16 flex items-center justify-center mb-6 border border-(--color-border-main) group-hover:scale-110 transition-transform ${sensor.bg} ${sensor.color}`}>
                    <sensor.icon className="w-8 h-8" />
                  </div>
                  <h4 className="text-lg font-bold text-(--color-text-main)">{sensor.name}</h4>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Call to Action */}
        <section id="how-it-works" className="py-32 bg-(--color-surface-hover) relative overflow-hidden border-b border-(--color-border-main)">
          <div className="absolute inset-0 opacity-10 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PHBhdGggZD0iTTAgMGgyMHYyMEgwem0xMCAxMGgxMHYxMEgxMHoiIGZpbGw9IiNjdXJyZW50Q29sb3IiIGZpbGwtb3BhY2l0eT0iLjA1IiBmaWxsLXJ1bGU9ImV2ZW5vZGQiLz48L3N2Zz4=')]" />
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
            <h2 className="text-4xl sm:text-5xl font-extrabold text-(--color-text-main) mb-8 tracking-tight">Ready to upgrade your infrastructure?</h2>
            <p className="text-xl text-(--color-text-muted) mb-12">
              Join leading facility managers and smart society administrators who rely on EventStream Go for their daily operations.
            </p>
            <a href="/register">
              <button className="bg-(--color-primary-600) hover:bg-(--color-primary-700) text-white font-bold py-4 px-12 text-lg border-2 border-(--color-primary-700) shadow-[4px_4px_0_0_rgba(13,148,136,0.3)] hover:shadow-none hover:translate-x-1 hover:translate-y-1 transition-all">
                Create Your Free Account
              </button>
            </a>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
