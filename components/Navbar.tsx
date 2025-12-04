import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X } from 'lucide-react';
import { Button } from './Button';

const navLinks = [
  { label: 'AI Assistant', href: '/#ai-assistant', isHash: true },
  { label: 'Energy Domains', href: '/energy-domains', isHash: false },
  { label: 'Solutions', href: '/solutions', isHash: false },
  { label: 'Platform', href: '/platform', isHash: false },
  { label: 'Insights', href: '/insights', isHash: false },
  { label: 'About', href: '/about', isHash: false },
];

export const Navbar: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleNavClick = (href: string, isHash: boolean) => {
    if (isHash) {
      // For hash links, navigate to home first if not already there
      if (location.pathname !== '/') {
        navigate(href);
      } else {
        // If already on home page, scroll to the element
        const hash = href.split('#')[1];
        if (hash) {
          const element = document.getElementById(hash);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }
      }
    }
    setIsOpen(false);
  };

  const handleAIAssistantClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    if (location.pathname !== '/') {
      // Navigate to home page first, then scroll
      navigate('/#ai-assistant');
    } else {
      // Already on home page, just scroll
      const element = document.getElementById('ai-assistant');
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    setIsOpen(false);
  };

  return (
    <nav className="fixed top-0 left-0 w-full z-50 flex justify-center pt-6 px-4">
      <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-full px-6 py-3 flex items-center justify-between w-full max-w-5xl">
        <div className="flex items-center gap-2">
           <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <span className="font-display font-bold text-2xl tracking-tight bg-gradient-to-r from-[#9F55FF] to-[#5588FF] bg-clip-text text-transparent">
              Oxygen
            </span>
           </Link>
        </div>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => (
            link.isHash ? (
              link.label === 'AI Assistant' ? (
                <a 
                  key={link.label} 
                  href={link.href}
                  onClick={handleAIAssistantClick}
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              ) : (
                <a 
                  key={link.label} 
                  href={link.href} 
                  className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
                >
                  {link.label}
                </a>
              )
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-sm font-medium text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            )
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
            <Button variant="primary" className="px-6 py-2 text-sm">Sign In</Button>
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
            link.isHash ? (
              link.label === 'AI Assistant' ? (
                <a 
                  key={link.label} 
                  href={link.href}
                  onClick={handleAIAssistantClick}
                  className="text-lg font-medium text-gray-200"
                >
                  {link.label}
                </a>
              ) : (
                <a 
                  key={link.label} 
                  href={link.href} 
                  className="text-lg font-medium text-gray-200"
                  onClick={() => handleNavClick(link.href, link.isHash)}
                >
                  {link.label}
                </a>
              )
            ) : (
              <Link
                key={link.label}
                to={link.href}
                className="text-lg font-medium text-gray-200"
                onClick={() => handleNavClick(link.href, link.isHash)}
              >
                {link.label}
              </Link>
            )
          ))}
          <div className="h-px bg-white/10 my-2"></div>
          <Button variant="primary" className="w-full justify-center">Sign In</Button>
        </div>
      )}
    </nav>
  );
};