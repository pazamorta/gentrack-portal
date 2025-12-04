import React from 'react';
import { ArrowRight } from 'lucide-react';

interface ButtonProps {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'outline' | 'link';
  className?: string;
  onClick?: () => void;
  icon?: boolean;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
  href?: string;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  className = '', 
  onClick,
  icon = true,
  type = 'button',
  disabled = false,
  href
}) => {
  const baseStyles = "inline-flex items-center justify-center font-medium transition-all duration-300 rounded-full";
  
  const variants = {
    primary: disabled 
      ? "bg-white/10 text-gray-500 cursor-not-allowed px-6 py-3"
      : "bg-white text-black hover:bg-gray-200 px-6 py-3 cursor-pointer",
    secondary: "bg-surface text-white hover:bg-gray-800 px-6 py-3 border border-gray-800 cursor-pointer",
    outline: "bg-transparent text-white border border-white/20 hover:border-white hover:bg-white/5 px-6 py-3 cursor-pointer",
    link: "bg-transparent text-white hover:text-gray-300 p-0 cursor-pointer"
  };

  if (href) {
    return (
      <a 
        href={href}
        className={`${baseStyles} ${variants[variant]} ${className}`}
        onClick={onClick}
      >
        <span className="mr-2">{children}</span>
        {icon && <ArrowRight size={16} />}
      </a>
    );
  }

  return (
    <button 
      type={type}
      className={`${baseStyles} ${variants[variant]} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      <span className="mr-2">{children}</span>
      {icon && <ArrowRight size={16} />}
    </button>
  );
};