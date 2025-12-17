import React from 'react';

export const Features: React.FC = () => {
  return (
    <section className="py-24 px-4 bg-background/50 backdrop-blur-sm relative z-0" id="features">
      <div className="max-w-6xl mx-auto">
        {/* Numbers Video - Full Width */}
        <div className="relative w-full perspective-1000 group">
          <div className="relative z-10 transform transition-transform duration-700 hover:scale-[1.02]">
            <video 
              src={`${import.meta.env.BASE_URL}Numbers.mp4`}
              autoPlay
              loop
              muted
              playsInline
              className="w-full h-auto rounded-2xl shadow-2xl border border-white/10 bg-surface/50 backdrop-blur-sm"
            />
          </div>
          {/* Glow effect behind */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[120%] h-[120%] bg-purple-500/20 blur-[100px] -z-10 rounded-full opacity-50 pointer-events-none"></div>
        </div>
      </div>
    </section>
  );
};