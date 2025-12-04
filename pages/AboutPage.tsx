import React from 'react';
import { Testimonials } from '../components/Testimonials';
import { Stats } from '../components/Stats';

const aboutCards = [
  {
    title: "Partnering with leading utilities",
    desc: "Partnering with leading utilities worldwide to reshape and renew the industry for a more sustainable future.",
  },
  {
    title: "Cross-functional teams",
    desc: "Cross-functional teams combining deep utilities expertise with modern product, cloud and data engineering capabilities.",
  },
  {
    title: "A global company",
    desc: "A global company built on long-term partnerships, innovation ecosystems and trusted delivery across three continents.",
  },
];

export const AboutPage: React.FC = () => {
  return (
    <>
      <section className="py-24 px-4 bg-background/50 backdrop-blur-sm relative z-10 border-t border-white/5">
        <div className="max-w-6xl mx-auto">
          <div className="mb-16">
            <h1 className="text-3xl md:text-5xl font-display font-medium mb-4">
              About
            </h1>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {aboutCards.map((card, i) => (
              <div
                key={i}
                className="bg-surface/30 border border-white/5 rounded-3xl p-8 flex flex-col justify-between overflow-hidden group hover:border-white/10 transition-colors backdrop-blur-md"
              >
                <div className="relative z-10">
                  <h3 className="text-2xl font-bold mb-3">{card.title}</h3>
                  <p className="text-secondary leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      <Testimonials />
      <Stats />
    </>
  );
};

