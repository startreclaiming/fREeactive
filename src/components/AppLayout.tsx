import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from './reclaim/Navbar';
import FreeactiveHub from './reclaim/FreeactiveHub';
import Dashboard from './reclaim/Dashboard';
import UserProfile from './reclaim/UserProfile';
import AuthModal from './reclaim/AuthModal';
import Footer from './reclaim/Footer';
import { TrialBanner } from './reclaim/TrialBanner';
import PricingSection from './reclaim/PricingSection';

// Home/Money/Resolve/Community/Doc Vault are PROactive (paid) features that aren't
// offered yet — their components still exist on disk for when that tier launches,
// but they're intentionally not wired into the app shell right now. FREEactive is
// just the Hub (scan/talk/type) and the free Alameda money-search ('dashboard').
type Section = 'hero' | 'dashboard' | 'profile' | 'pricing';

const AppLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>(() => {
    try {
      const stored = sessionStorage.getItem('reclaim_active_section');
      const valid: Section[] = ['hero', 'dashboard', 'profile', 'pricing'];
      return (valid as string[]).includes(stored || '') ? (stored as Section) : 'hero';
    } catch { return 'hero'; }
  });

  // Remember the current screen so an iOS camera-reload returns here, not Hub.
  useEffect(() => {
    try { sessionStorage.setItem('reclaim_active_section', activeSection); } catch { /* ignore */ }
  }, [activeSection]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  const navigate = (section: string) => {
    // Profile needs an account; Dashboard (the free money search) doesn't.
    if (!user && section === 'profile') {
      setAuthModalTab('login');
      setAuthModalOpen(true);
      return;
    }
    setActiveSection(section as Section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  return (
    <div className="min-h-screen bg-white">
      <Navbar activeSection={activeSection} onNavigate={navigate} onOpenAuth={openAuth} />

      {/* Wait for `profile` too, not just `user` — right after sign-in there's a brief
          window where user is set but profile hasn't resolved yet; showing the banner
          then would read profile as null and falsely claim "14 days remaining". */}
      {user && profile && <TrialBanner profile={profile} onUpgradeClick={() => navigate('pricing')} />}

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        defaultTab={authModalTab}
      />

      {activeSection === 'hero' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FreeactiveHub onNavigate={navigate} />
        </div>
      )}

      {activeSection === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard onBack={() => navigate('hero')} onNavigate={navigate} onOpenAuth={() => openAuth('signup')} />
        </div>
      )}

      {activeSection === 'profile' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <UserProfile onBack={() => navigate('hero')} onNavigate={navigate} />
        </div>
      )}

      {activeSection === 'pricing' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <PricingSection onBack={() => navigate('hero')} />
        </div>
      )}

      <Footer onNavigate={navigate} />
    </div>
  );
};

export default AppLayout;
