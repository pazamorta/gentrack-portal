import React, { useState } from 'react';
import { Button } from './Button';
import { FeatureTab } from '../types';

// Energy domain cards for Water, Electricity, and Gas.
// These drive both the left-hand marketing boxes and the right-hand visual.
const getTabs = (): FeatureTab[] => [
  {
    id: 'water',
    title: 'Water Supply',
    description:
      'Consolidated water management for large portfolios. Smart metering and efficiency services.',
    cta: 'Get Water Quote',
    image: `${import.meta.env.BASE_URL}Spark.gif`,
  },
  {
    id: 'electricity',
    title: 'Electricity',
    description:
      'Corporate PPAs and renewable supply contracts. Direct access to wholesale markets.',
    cta: 'View Electric Plans',
    image: `${import.meta.env.BASE_URL}Platform.gif`,
    video: `${import.meta.env.BASE_URL}Wind.mp4`,
  },
  {
    id: 'gas',
    title: 'Commercial Gas',
    description:
      'Reliable gas supply with Green Gas options. Fixed and flexible procurement strategies.',
    cta: 'Gas Solutions',
    image: `${import.meta.env.BASE_URL}Solutions.gif`,
  },
];

export const Showcase: React.FC = () => {
  const tabs = getTabs();
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  return (
    // Linked from the "Energy Domains" item in the navbar
    <section
      className="py-24 px-4 bg-background/50 backdrop-blur-sm border-t border-white/5"
      id="energy-domains"
    >
      <div className="max-w-6xl mx-auto flex flex-col lg:flex-row gap-16 items-center">
        
        {/* Left Side: Energy domain boxes */}
        <div className="flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTabId(tab.id)}
                className={`group h-full cursor-pointer transition-all duration-300 p-6 rounded-2xl border text-left flex flex-col justify-between ${
                  activeTabId === tab.id
                    ? 'bg-surface/80 border-white/10 backdrop-blur-md shadow-xl'
                    : 'bg-transparent border-transparent hover:bg-surface/30'
                }`}
              >
                <div>
                  <h3
                    className={`text-xl font-display font-semibold mb-3 ${
                      activeTabId === tab.id ? 'text-white' : 'text-gray-300'
                    }`}
                  >
                    {tab.title}
                  </h3>
                  <p className="text-sm text-secondary leading-relaxed">
                    {tab.description}
                  </p>
                </div>
                <a
                  href="#get-started"
                  onClick={(e) => {
                    e.stopPropagation();
                    // Pre-fill energy domain when navigating from specific domain
                    // This could be enhanced to pre-fill the form
                  }}
                  className="mt-4 text-sm font-medium text-primary group-hover:underline inline-block"
                >
                  {tab.cta} →
                </a>
              </button>
            ))}
          </div>
        </div>

        {/* Right Side: Image Display */}
        <div className="flex-1 w-full relative">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-surface/50 backdrop-blur-xl relative shadow-2xl">
                {tabs.map((tab) => (
                     tab.video ? (
                        <video 
                            key={tab.id}
                            src={tab.video}
                            autoPlay
                            loop
                            muted
                            playsInline
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                                activeTabId === tab.id ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                     ) : (
                        <img 
                            key={tab.id}
                            src={tab.image} 
                            alt={tab.title}
                            className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-700 ${
                                activeTabId === tab.id ? 'opacity-100' : 'opacity-0'
                            }`}
                        />
                     )
                ))}
                
                {/* Decorative Elements */}
                <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none"></div>
            </div>
        </div>

      </div>
    </section>
  );
};