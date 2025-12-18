import React from 'react';

const aboutCards = [
  {
    title: "Partnering with Business",
    desc: "We work with leading enterprises worldwide to reshape their energy strategy for a more sustainable future.",
  },
  {
    title: "Dedicated Account Teams",
    desc: "Your business gets specific energy experts. Real humans who understand your industry and your goals.",
  },
  {
    title: "Global Reach, Local Supply",
    desc: "A global energy major with deep local roots. We deliver reliable supply across three continents.",
  },
];

export const AboutSection: React.FC = () => {
  return (
    <section id="about" className="py-24 px-4 bg-background/50 backdrop-blur-sm relative z-10 border-t border-white/5">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h2 className="text-3xl md:text-5xl font-display font-medium mb-4">
            About Us
          </h2>
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
  );
};


