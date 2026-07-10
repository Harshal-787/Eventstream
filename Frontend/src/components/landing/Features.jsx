import React from 'react';
import { Activity, BellRing, Database, LineChart, Shield, Zap } from 'lucide-react';

const featureList = [
  {
    name: 'Real-Time Ingestion',
    description: 'Process thousands of sensor events per second with high availability and low latency.',
    icon: Zap,
  },
  {
    name: 'Intelligent Alerting',
    description: 'Define custom thresholds and complex rules to automatically generate alerts when anomalies occur.',
    icon: BellRing,
  },
  {
    name: 'Device Monitoring',
    description: 'Keep track of device health, heartbeats, and online status to ensure continuous coverage.',
    icon: Activity,
  },
  {
    name: 'Actionable Analytics',
    description: 'Visualize historical trends, power usage, and environmental conditions to optimize operations.',
    icon: LineChart,
  },
  {
    name: 'Robust Data Storage',
    description: 'Securely store and retrieve large volumes of sensor history for compliance and auditing.',
    icon: Database,
  },
  {
    name: 'Enterprise Security',
    description: 'Role-based access control ensures that only authorized personnel can manage building parameters.',
    icon: Shield,
  },
];

export function Features() {
  return (
    <section id="features" className="py-24 bg-(--color-background) border-b border-(--color-border-main)">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <h2 className="text-4xl font-black uppercase text-(--color-brutal-text) mb-6 tracking-tighter">Engineered for Scale</h2>
          <p className="text-(--color-text-muted) text-lg sm:text-xl">
            A comprehensive suite of tools designed to give you unparalleled visibility and control over your physical infrastructure.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {featureList.map((feature, index) => (
            <div 
              key={index}
              className="bg-(--color-brutal-bg) p-8 border-2 border-(--color-brutal-border) shadow-md hover:-translate-y-1 hover:-translate-x-1 hover:shadow-xl transition-all duration-300 group"
            >
              <div className="w-12 h-12 bg-(--color-brutal-inverse-bg) text-(--color-brutal-text-inverse) flex items-center justify-center mb-6 border-2 border-(--color-brutal-border) shadow-md group-hover:scale-125 group-hover:-translate-y-2 transition-all duration-300">
                <feature.icon className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-black uppercase text-(--color-brutal-text) mb-3">{feature.name}</h3>
              <p className="text-(--color-text-muted) font-bold tracking-wider leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>

        {/* Dashboard Mockup Integration */}
        <div className="mt-32 relative border-4 border-(--color-brutal-border) bg-(--color-brutal-bg) overflow-hidden shadow-md">
          <div className="grid grid-cols-1 lg:grid-cols-2 items-stretch">
            <div className="p-10 lg:p-16 flex flex-col justify-center border-b-4 lg:border-b-0 lg:border-r-4 border-(--color-brutal-border)">
              <div className="inline-flex items-center px-3 py-1 bg-yellow-400 text-black border-2 border-(--color-brutal-border) shadow-md text-xs font-black mb-6 uppercase tracking-wider w-max">
                Live Data
              </div>
              <h3 className="text-3xl sm:text-4xl font-black uppercase text-(--color-brutal-text) mb-6 tracking-tighter">Unmatched Visibility</h3>
              <p className="text-(--color-text-muted) font-bold tracking-wider text-lg mb-8 leading-relaxed">
                Our intuitive analytics dashboard brings your data to life. Monitor live feeds, track historical trends across multi-wing societies, and respond to critical alerts before they escalate into emergencies.
              </p>
              <ul className="space-y-4">
                {['Live Sensor Event Graphs', 'Global Device Status Summary', 'Historical Event Auditing'].map((item, i) => (
                  <li key={i} className="flex items-center text-(--color-brutal-text) font-black uppercase tracking-wider">
                    <div className="w-6 h-6 bg-(--color-brutal-inverse-bg) text-(--color-brutal-text-inverse) flex items-center justify-center mr-4 border-2 border-(--color-brutal-border)">
                      <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="square" strokeLinejoin="miter" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    {item}
                  </li>
                ))}
              </ul>
            </div>
            <div className="relative h-full w-full bg-(--color-background) min-h-[400px] p-8 lg:p-12 flex items-center justify-center">
              <div className="relative w-full border-4 border-(--color-brutal-border) shadow-md bg-(--color-brutal-bg)">
                <div className="absolute top-0 left-0 w-full h-8 border-b-4 border-(--color-brutal-border) bg-(--color-brutal-bg) flex items-center px-2 space-x-2 z-10">
                  <div className="w-3 h-3 border-2 border-(--color-brutal-border) bg-(--color-brutal-border)"></div>
                  <div className="w-3 h-3 border-2 border-(--color-brutal-border) bg-(--color-brutal-border)"></div>
                  <div className="w-3 h-3 border-2 border-(--color-brutal-border) bg-(--color-brutal-border)"></div>
                </div>
                <div className="pt-6 bg-(--color-surface) overflow-hidden flex flex-col">
                  <img 
                    src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop" 
                    alt="Analytics Dashboard showing data" 
                    className="w-full h-auto object-cover grayscale opacity-90 contrast-125 mix-blend-luminosity dark:mix-blend-normal dark:grayscale-0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}
