import React from 'react';
import { ShieldCheck, Zap, TrendingUp } from 'lucide-react';

const features = [
  {
    icon: ShieldCheck,
    title: "Resilient Operations",
    description: "Safeguard critical infrastructure with enterprise-grade security and real-time compliance monitoring."
  },
  {
    icon: Zap,
    title: "Unified Utility Core",
    description: "Manage electricity, gas, and water lifecycles in one seamless, cloud-native platform."
  },
  {
    icon: TrendingUp,
    title: "Future-Proof Scale",
    description: "Adapt to market changes and launch green energy products instantly with flexible, API-first tools."
  }
];

export const Features: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-background/50 backdrop-blur-sm relative z-10" id="features">
      <div className="max-w-6xl mx-auto">
        <div className="mb-12">
            <h2 className="text-3xl md:text-5xl font-display font-medium mb-4">Your all-in-one SaaS engine.</h2>
            <p className="text-secondary text-lg max-w-2xl">Smarter power, gas and water for every business, at any scale.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div 
              key={index} 
              className="bg-surface/30 border border-white/5 p-8 rounded-3xl hover:bg-surface/50 hover:border-white/10 transition-all duration-300 group backdrop-blur-md"
            >
              <div className="mb-6 group-hover:scale-105 transition-transform duration-300 text-[#69F0C9]">
                <feature.icon size={64} strokeWidth={1.5} />
              </div>
              <h3 className="text-xl font-bold mb-3 font-display">{feature.title}</h3>
              <p className="text-secondary leading-relaxed">
                {feature.description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};