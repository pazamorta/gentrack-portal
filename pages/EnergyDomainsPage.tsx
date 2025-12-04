import React, { useState } from 'react';
import { Button } from '../components/Button';
import { FeatureTab } from '../types';

// Energy domain cards for Water, Electricity, and Gas.
const getTabs = (): FeatureTab[] => [
  {
    id: 'water',
    title: 'Water',
    description:
      'Digitise your water network with real-time monitoring, leakage insights, and demand forecasting in a single SaaS control room.',
    cta: 'Optimise Water',
    image: `${import.meta.env.BASE_URL}Spark.gif`,
  },
  {
    id: 'electricity',
    title: 'Electricity',
    description:
      'Balance generation, grid constraints, and customer demand with AI-driven optimisation across your electricity portfolio.',
    cta: 'Optimise Electricity',
    image: 'https://files.peachworlds.com/website/d37bd39f-8985-4fc2-a8db-34643a6a4f3b/frame-170747934722.png',
  },
  {
    id: 'gas',
    title: 'Gas',
    description:
      'Track gas flows, contracts, and compliance end-to-end with configurable workflows purpose-built for energy retailers.',
    cta: 'Optimise Gas',
    image: 'https://files.peachworlds.com/website/0ec8a55d-4b44-4719-a5d7-2aec723b0eb4/22-95.png',
  },
];

export const EnergyDomainsPage: React.FC = () => {
  const tabs = getTabs();
  const [activeTabId, setActiveTabId] = useState(tabs[0].id);

  return (
    <section className="py-24 px-4 bg-background/50 backdrop-blur-sm border-t border-white/5 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h1 className="text-3xl md:text-5xl font-display font-medium mb-4">
            Energy Domains
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Image Section - Left */}
          <div className="order-1 lg:order-1">
            <div className="aspect-[4/3] rounded-3xl overflow-hidden border border-white/10 bg-surface/50 backdrop-blur-xl relative shadow-2xl">
              {tabs.map((tab) =>
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
              )}

              {/* Decorative Elements */}
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Cards Section - Right */}
          <div className="order-2 lg:order-2">
            <div className="grid grid-cols-1 gap-6">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTabId(tab.id)}
                  className={`group h-full cursor-pointer transition-all duration-300 p-8 rounded-3xl border text-left flex flex-col justify-between ${
                    activeTabId === tab.id
                      ? 'bg-surface/80 border-white/10 backdrop-blur-md shadow-xl'
                      : 'bg-surface/30 border-white/5 hover:bg-surface/50 hover:border-white/10 backdrop-blur-md'
                  }`}
                >
                  <div>
                    <h3
                      className={`text-2xl font-display font-bold mb-3 ${
                        activeTabId === tab.id ? 'text-white' : 'text-gray-300'
                      }`}
                    >
                      {tab.title}
                    </h3>
                    <p className="text-secondary leading-relaxed">
                      {tab.description}
                    </p>
                  </div>
                  <a
                    href="#get-started"
                    onClick={(e) => {
                      e.stopPropagation();
                    }}
                    className="mt-4 text-sm font-medium text-primary group-hover:underline inline-block"
                  >
                    {tab.cta} →
                  </a>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

