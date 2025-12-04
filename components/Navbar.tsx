import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';

const navLinks = [
  { label: 'AI Assistant', href: '#ai-assistant' },
  { label: 'Energy Domains', href: '#energy-domains' },
  { label: 'Solutions', href: '#solutions' },
  { label: 'Platform', href: '#platform' },
  { label: 'Insights', href: '#insights' },
  { label: 'About', href: '#about' },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 px-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
        <div className="flex items-center gap-2">
           <a href="#" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-[#9F55FF] to-[#5588FF] bg-clip-text text-transparent">
              Oxygen
            </span>
           </a>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href} 
              className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
            >
              {link.label}
            </a>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
            <a href="#get-started" className="text-sm font-medium flex items-center gap-1 hover:text-gray-300 transition-colors">
                Learn More <span className="text-xs">→</span>
            </a>
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="md:hidden text-white"
          onClick={() => setIsOpen(!isOpen)}
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Mobile Menu Overlay */}
      {isOpen && (
        <div className="absolute top-24 left-4 right-4 bg-surface/95 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col gap-4 md:hidden animate-in fade-in slide-in-from-top-4">
          {navLinks.map((link) => (
            <a 
              key={link.label} 
              href={link.href} 
              className="text-lg font-medium text-gray-200"
              onClick={() => setIsOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <div className="h-px bg-white/10 my-2"></div>
          <a href="#get-started" className="text-lg font-medium flex items-center gap-2">
            Learn More <span>→</span>
          </a>
        </div>
      )}
    </nav>
  );
};