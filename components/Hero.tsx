import React from 'react';
import { Button } from './Button';
import { Sparkles } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

export const Hero: React.FC = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center px-4 pt-32 pb-20 overflow-hidden">
      <div className="max-w-5xl w-full text-center z-10 space-y-8 flex flex-col items-center">
        
        {/* Badge */}


        {/* Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 animate-fade-in-up delay-100">
          Sustainable Energy <br className="hidden md:block" />
          for Every Scale
        </h1>

        {/* Dashboard Image */}
        <div className="relative w-full max-w-4xl mx-auto perspective-1000 animate-fade-in-up delay-200 group">
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

        {/* Subheading */}
        <p className="text-lg md:text-xl text-secondary max-w-2xl mx-auto leading-relaxed animate-fade-in-up delay-300">
          Power your operations with smarter energy. Optimise in real-time, anticipate performance, and grow sustainably at every scale.
        </p>

        {/* CTAs */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 animate-fade-in-up delay-400 pt-4">
            <Button href="#get-started">Get Started</Button>
            <Button variant="outline">See It in Action</Button>
        </div>

        {/* AI Chat Interface - target for "AI Assistant" nav link */}
        <div
          id="ai-assistant"
          className="w-full max-w-2xl z-20 animate-fade-in-up delay-300 mt-16"
          style={{ scrollMarginTop: '100px' }}
        >
            <ChatInterface />
        </div>

      </div>
    </section>
  );
};