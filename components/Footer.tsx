import React from 'react';
import { Button } from './Button';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-surface/30 backdrop-blur-xl py-24 px-4 border-t border-white/10 relative overflow-hidden">
      <div className="ocean">
        <div className="wave"></div>
        <div className="wave"></div>
      </div>
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-end gap-12 relative z-10">
        
        <div className="space-y-6 max-w-xl">
            <h2 className="text-4xl md:text-6xl font-display font-bold tracking-tighter text-white">Launch with Oxygen.</h2>
            <div className="flex flex-wrap gap-4">
                <Button href="#get-started">Get Started</Button>
                <Button variant="outline">Learn More</Button>
            </div>
            

        </div>

        <div className="flex flex-col items-start md:items-end gap-2 text-secondary text-sm">
            <p>© 2025 —  OXYGEN INC. All rights reserved</p>
            
        </div>

      </div>
    </footer>
  );
};