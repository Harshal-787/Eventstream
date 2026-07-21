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
    <section id="pricing" className="min-h-screen flex flex-col justify-center py-20 bg-primary-950 text-white relative">
      <div className="max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-100px" }}
            transition={{ duration: 0.8, type: "spring" }}
            className="text-3xl md:text-5xl font-heading font-extrabold mb-6"
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

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          {plans.map((plan, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, x: index === 0 ? -50 : index === 2 ? 50 : 0, scale: index === 1 ? 0.9 : 1 }}
              whileInView={{ opacity: 1, x: 0, scale: 1 }}
              viewport={{ once: true, margin: "-100px" }}
              transition={{ duration: 0.8, type: "spring", delay: index * 0.15 }}
              className={`rounded-[2rem] p-8 md:p-10 ${plan.highlighted ? 'bg-primary-800 border-2 border-primary-500 shadow-2xl relative z-10 md:-mx-4 md:py-12' : 'bg-primary-900 border border-primary-800'}`}
            >
              <h3 className="text-3xl font-extrabold mb-4">{plan.name}</h3>
              <p className="text-primary-100 text-sm leading-relaxed font-medium mb-8 min-h-[60px]">
                {plan.description}
              </p>
              
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold">{plan.price}</span>
                {plan.period && <span className="text-primary-200 ml-2 font-medium">{plan.period}</span>}
              </div>
              
              <Button 
                variant={plan.highlighted ? 'primary' : 'outline'} 
                className={`w-full rounded-full py-6 text-lg mb-10 ${plan.highlighted ? 'bg-primary-400 text-primary-950 hover:bg-primary-300' : 'border-border-main text-white hover:bg-primary-800'}`}
              >
                Get Started
              </Button>
              
              <div className="space-y-4">
                {plan.highlighted && <div className="text-xs font-bold uppercase tracking-wider text-primary-300 mb-4">Features</div>}
                {plan.features.map((feature, i) => (
                  <div key={i} className="flex items-center text-sm font-medium text-primary-50">
                    <CheckCircle2 className={`w-5 h-5 mr-3 ${plan.highlighted ? 'text-primary-400' : 'text-primary-500'}`} />
                    {feature}
                  </div>
                ))}
              </div>
            </motion.div>
          ))}
        </div>

      </div>
    </section>
  );
}
