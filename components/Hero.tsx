import React from 'react';
import { Button } from './Button';
import { Sparkles } from 'lucide-react';
import { ChatInterface } from './ChatInterface';

export const Hero: React.FC = () => {
  return (
    <section className="relative z-30 min-h-screen flex items-center justify-center px-4 pt-16 pb-20 overflow-visible">
      <div className="max-w-5xl w-full text-center z-10 space-y-8 flex flex-col items-center">
        
        {/* Badge */}


        {/* Heading */}
        <h1 className="text-5xl md:text-7xl lg:text-8xl font-display font-bold tracking-tighter leading-[1.1] bg-clip-text text-transparent bg-gradient-to-b from-white to-white/50 animate-fade-in-up delay-100 pb-4 px-4">
          Powering Business <br className="hidden md:block" />
          with Smart Energy
        </h1>

        {/* Subheading */}




        {/* AI Chat Interface - target for "AI Assistant" nav link */}
        <div
          id="ai-assistant"
          className="relative w-full max-w-2xl z-50 animate-fade-in-up delay-300 mt-16"
          style={{ scrollMarginTop: '100px' }}
        >
            <ChatInterface />
        </div>

      </div>
    </section>
  );
};