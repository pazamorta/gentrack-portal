import React from 'react';

const platformCards = [
  {
    title: "Cloud-native platform",
    desc: "Cloud-native platform designed for utilities, running natively on hyperscale cloud to deliver security, resilience and performance.",
  },
  {
    title: "Composable architecture",
    desc: "Composable architecture with an integration layer that connects legacy and modern systems into a single, unified ecosystem.",
  },
  {
    title: "Utilities best-practice library",
    desc: "Utilities best-practice library, packaging decades of industry experience into ready-to-run processes and configurations.",
  },
];

export const PlatformPage: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-background/50 backdrop-blur-sm relative z-10 border-t border-white/5 min-h-screen">
      <div className="max-w-6xl mx-auto">
        <div className="mb-16">
          <h1 className="text-3xl md:text-5xl font-display font-medium mb-4">
            Platform
          </h1>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* GIF Section - Left */}
          <div className="order-1 lg:order-1">
            <div className="relative w-full rounded-3xl overflow-hidden border border-white/10 bg-surface/50 backdrop-blur-xl shadow-2xl">
              <video
                src={`${import.meta.env.BASE_URL}Wind.mp4`}
                autoPlay
                loop
                muted
                playsInline
                className="w-full h-auto"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/50 to-transparent pointer-events-none"></div>
            </div>
          </div>

          {/* Cards Section - Right */}
          <div className="order-2 lg:order-2">
            <div className="grid grid-cols-1 gap-6">
              {platformCards.map((card, i) => (
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


