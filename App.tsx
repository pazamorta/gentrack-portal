import React, { Suspense } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { Scene } from './components/Scene';
import { Features } from './components/Features';
import { Showcase } from './components/Showcase';
import { SolutionsSection } from './components/SolutionsSection';
import { PlatformSection } from './components/PlatformSection';
import { InsightsSection } from './components/InsightsSection';
import { AboutSection } from './components/AboutSection';
import { Testimonials } from './components/Testimonials';
import { Stats } from './components/Stats';
import { B2BForm } from './components/B2BForm';
import { Footer } from './components/Footer';

const App: React.FC = () => {
  return (
    <div className="relative min-h-screen text-primary font-sans selection:bg-white/20">
      
      {/* 3D Background - z-0 */}
      <Suspense fallback={null}>
        <Scene />
      </Suspense>

      {/* Content - z-10 */}
      <div className="relative z-10">
        <Navbar />
        <main>
          <Hero />
          <Features />
          <Showcase />
          <SolutionsSection />
          <PlatformSection />
          <InsightsSection />
          <AboutSection />
          <Testimonials />
          <Stats />
          <B2BForm />
        </main>
        <Footer />
      </div>
    </div>
  );
};

export default App;