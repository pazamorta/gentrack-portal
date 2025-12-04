import { ReactNode } from 'react';

export interface NavItem {
  label: string;
  href: string;
}

export interface TestimonialData {
  quote: string;
  name: string;
  role: string;
  image: string;
}

export interface PricingTier {
  name: string;
  price: string;
  description: string;
  features: string[];
  cta: string;
}

export interface FeatureTab {
  id: string;
  title: string;
  description: string;
  cta: string;
  image: string;
  video?: string;
}
