import React from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2 } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

const plans = [
  {
    name: 'Starter',
    description: 'This package offers the basic features you need to get started with IoT monitoring.',
    price: '$0',
    features: [
      'Up to 50 active sensors',
      'Basic dashboard analytics',
      'Email alerts',
      'Community support'
    ]
  },
  {
    name: 'Professional',
    description: 'Designed for greater flexibility, this solution offers advanced tools for custom tailoring to your needs.',
    price: '$299',
    period: '/ month',
    highlighted: true,
    features: [
      'Up to 1,000 active sensors',
      'Custom alert rules & webhooks',
      'AI-driven daily summaries',
      'Priority 24/7 support',
      'Predictive maintenance'
    ]
  },
  {
    name: 'Enterprise',
    description: 'This package provides full access to all premium features and dedicated hardware provisioning.',
    price: 'Custom',
    features: [
      'Unlimited sensor deployment',
      'Dedicated account manager',
      'On-premise deployment options',
      'Custom payload decoders',
      'Hardware provisioning'
    ]
  }
];

export function Pricing() {
  return (
    <section id="pricing" className="min-h-screen flex flex-col justify-center py-20 bg-primary-950 text-white relative border-t border-primary-900">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-3xl md:text-5xl font-heading font-extrabold mb-6 text-white"
          >
            Tailored Plans for Your <br/> Facility Scale
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring", delay: 0.1 }}
            className="text-primary-200 text-lg sm:text-xl font-medium"
          >
            Flexible pricing for any building size or sensor count.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-0 items-center max-w-6xl mx-auto px-4">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.5, delay: index * 0.15 }}
              className={`relative flex flex-col rounded-[2.5rem] p-8 md:p-10 transition-all duration-300
                ${plan.highlighted 
                  ? 'bg-primary-800 border-2 border-primary-500 shadow-2xl z-20 scale-105 md:scale-110 md:-mx-4 h-full min-h-[600px]' 
                  : 'bg-primary-900/90 border border-primary-800 z-10 scale-95 opacity-95 h-full min-h-[550px]'
                }`}
            >
              {plan.highlighted && (
                <div className="absolute -top-5 left-1/2 -translate-x-1/2">
                  <span className="bg-primary-500 text-white text-sm font-extrabold uppercase tracking-widest py-1.5 px-6 rounded-full shadow-[0_0_20px_rgba(var(--color-primary-500),0.5)]">
                    Most Popular
                  </span>
                </div>
              )}
              
              <div className="mb-8">
                <h3 className="text-3xl font-extrabold mb-4 text-white">{plan.name}</h3>
                <p className="text-primary-200 text-sm leading-relaxed min-h-[60px]">
                  {plan.description}
                </p>
              </div>
              
              <div className="flex items-baseline mb-10">
                <span className="text-5xl font-black tracking-tight text-white">{plan.price}</span>
                {plan.period && <span className="text-primary-300 ml-2 font-bold">{plan.period}</span>}
              </div>
              
              <div className="flex-grow space-y-5 mb-8">
                <div className="text-xs font-bold uppercase tracking-wider text-primary-300 mb-6">What's included</div>
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-start text-sm font-medium text-primary-50">
                    <CheckCircle2 className={`w-5 h-5 mr-3 shrink-0 mt-0.5 ${plan.highlighted ? 'text-primary-400' : 'text-primary-500'}`} />
                    <span className="leading-snug">{feature}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-auto pt-8 border-t border-primary-800">
                <Button 
                  onClick={() => window.location.href='/register'}
                  variant={plan.highlighted ? 'primary' : 'outline'} 
                  className={`w-full py-4 text-base rounded-2xl shadow-none transition-all font-bold ${
                    plan.highlighted 
                    ? 'bg-primary-500 hover:bg-primary-400 text-white shadow-[0_4px_14px_0_rgba(var(--color-primary-500),0.39)]' 
                    : 'border-primary-700 text-white hover:bg-primary-800'
                  }`}
                >
                  Get Started
                </Button>
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
