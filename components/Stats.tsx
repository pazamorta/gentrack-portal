import React from 'react';

export const Stats: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-background relative border-t border-white/5">
      <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div className="space-y-2">
            <div className="text-5xl md:text-6xl font-display font-bold text-white">99.99%</div>
            <div className="text-secondary">Always On, Always Reliable</div>
        </div>
        <div className="space-y-2">
            <div className="text-5xl md:text-6xl font-display font-bold text-white">50k+</div>
            <div className="text-secondary">Businesses Powered</div>
        </div>
        <div className="space-y-2">
            <div className="text-5xl md:text-6xl font-display font-bold text-white">24/7</div>
            <div className="text-secondary">Dedicated B2B Support</div>
        </div>
      </div>
    </section>
  );
};