import React from 'react';

const solutionCards = [
  {
    title: "Transform core utility operations",
    desc: "Transform core utility operations with modular solutions for customer engagement, billing, finance and collections that scale from mid-market to enterprise.",
  },
  {
    title: "Reduce cost-to-serve",
    desc: "Reduce cost-to-serve with preconfigured best-practice journeys for energy retailers, water suppliers and network operators.",
  },
  {
    title: "Accelerate innovation",
    desc: "Accelerate innovation with a portfolio that spans end-to-end CX, business and data applications, and distributed energy resource management.",
  },
];

export const SolutionsPage: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-background/50 backdrop-blur-sm relative z-10 border-t border-white/5 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h1 className="text-3xl md:text-5xl font-display font-medium mb-4">
            Solutions
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* GIF Section - Left */}
          <div className="order-1 lg:order-1">
            <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-surface/50 backdrop-blur-xl shadow-2xl">
              <img
                src={`${import.meta.env.BASE_URL}Solutions.gif`}
                alt="Solutions visualization"
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Cards Section - Right */}
          <div className="order-2 lg:order-2">
            <div className="grid grid-cols-1 gap-6">
              {solutionCards.map((card, i) => (
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
        </div>
      </div>
    </section>
  );
};

