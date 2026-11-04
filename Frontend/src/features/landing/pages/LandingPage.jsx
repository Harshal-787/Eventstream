import React from 'react';
import { Link } from 'react-router-dom';
import { Header } from '../components/Header';
import { Hero } from '../components/Hero';
import { ServicesGrid } from '../components/ServicesGrid';
import { Benefits } from '../components/Benefits';
import { Pricing } from '../components/Pricing';
import { Integrations } from '../components/Integrations';
import { Footer } from '../components/Footer';

export function LandingPage() {
  return (
    <div className="min-h-screen bg-background font-sans overflow-x-hidden">
      <Header />
      
      <main>
        <Hero />
        <ServicesGrid />
        <Benefits />
        <Pricing />
        <Integrations />
        
        {/* Call to Action Footer Section like the video */}
        <section className="py-24 bg-primary-950 relative overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MCIgaGVpZ2h0PSI0MCI+CjxwYXRoIGQ9Ik0wIDBoNDB2NDBIMHoiIGZpbGw9Im5vbmUiLz4KPHBhdGggZD0iTTAgMTBoNDBNMTAgMHY0ME0wIDIwaDQwTTIwIDB2NDBNMCAzMGg0ME0zMCAwdjQwIiBzdHJva2U9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiIHN0cm9rZS13aWR0aD0iMSIvPgo8L3N2Zz4=')] opacity-50"></div>
          
          <div className="relative z-10 max-w-3xl mx-auto px-4">
            <h2 className="text-4xl sm:text-5xl font-heading font-extrabold text-white mb-6">
              From Idea to Production in Days
            </h2>
            <p className="text-lg text-primary-200 mb-10 max-w-2xl mx-auto font-medium">
              Accelerate your operations with our technology. Reduce downtime and optimize costs. Get a special offer now!
            </p>
            <Link to="/register">
              <button className="bg-white text-primary-950 font-bold py-4 px-10 rounded-full text-lg shadow-lg hover:shadow-xl hover:bg-primary-50 hover:-translate-y-1 transition-all duration-300">
                Work With Us
              </button>
            </Link>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
