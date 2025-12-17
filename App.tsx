import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';

import { Footer } from './components/Footer';
import { EnergyDomainsPage } from './pages/EnergyDomainsPage';
import { SolutionsPage } from './pages/SolutionsPage';
import { PlatformPage } from './pages/PlatformPage';
import { InsightsPage } from './pages/InsightsPage';
import { AboutPage } from './pages/AboutPage';
import { ScrollToHashElement } from './components/ScrollToHashElement';

import { GetStartedPage } from './pages/GetStartedPage';
import { OAuthCallbackPage } from './pages/OAuthCallbackPage';
import { ScrollToTop } from './components/ScrollToTop';

const HomePage: React.FC = () => {
  return (
    <>
      <Hero />
    </>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <ScrollToTop />
      <div className="relative min-h-screen text-primary font-sans selection:bg-white/20">
        


        {/* Content - z-10 */}
        <div className="relative z-10">
          <Navbar />
          <main>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/energy-domains" element={<EnergyDomainsPage />} />
              <Route path="/solutions" element={<SolutionsPage />} />
              <Route path="/platform" element={<PlatformPage />} />
              <Route path="/insights" element={<InsightsPage />} />
              <Route path="/about" element={<AboutPage />} />
              <Route path="/get-started" element={<GetStartedPage />} />
              <Route path="/oauth/callback" element={<OAuthCallbackPage />} />
            </Routes>
          </main>
          <Footer />
        </div>
        <ScrollToHashElement />
      </div>
    </BrowserRouter>
  );
};

export default App;