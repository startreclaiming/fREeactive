import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import Navbar from './reclaim/Navbar';
import HubSection from './reclaim/HubSection';
import HomeSection from './reclaim/HomeSection';
import MoneySection from './reclaim/MoneySection';
import ResolveSection from './reclaim/ResolveSection';
import CommunityFabric from '@/components/CommunityFabric';
import Dashboard from './reclaim/Dashboard';
import DocumentVault from './reclaim/DocumentVault';
import UserProfile from './reclaim/UserProfile';
import AuthModal from './reclaim/AuthModal';
import AIChatComponent from './reclaim/AIChat';
import Footer from './reclaim/Footer';
import { TrialBanner } from './reclaim/TrialBanner';
import PricingSection from './reclaim/PricingSection';

type Section = 'hero' | 'home' | 'money' | 'resolve' | 'community' | 'dashboard' | 'vault' | 'profile' | 'pricing';

const AppLayout: React.FC = () => {
  const { user, profile } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>(() => {
    try { return (sessionStorage.getItem('reclaim_active_section') as Section) || 'hero'; }
    catch { return 'hero'; }
  });

  // Remember the current screen so an iOS camera-reload returns here, not Hub.
  useEffect(() => {
    try { sessionStorage.setItem('reclaim_active_section', activeSection); } catch { /* ignore */ }
  }, [activeSection]);

  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalTab, setAuthModalTab] = useState<'login' | 'signup'>('login');

  const navigate = (section: string) => {
    // Redirect to auth for protected sections if not logged in
    if (!user && ['dashboard', 'vault', 'profile'].includes(section)) {
      // Dashboard and vault show their own sign-in prompts, profile needs auth
      if (section === 'profile') {
        setAuthModalTab('login');
        setAuthModalOpen(true);
        return;
      }
    }
    setActiveSection(section as Section);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openAuth = (tab: 'login' | 'signup' = 'login') => {
    setAuthModalTab(tab);
    setAuthModalOpen(true);
  };

  const communityish = activeSection === 'community';
  const chatVisible = ['home', 'money', 'resolve'].includes(activeSection) || communityish;
  const chatPillar = (communityish
    ? 'community'
    : (['home', 'money', 'resolve'].includes(activeSection) ? activeSection : 'home')) as 'home' | 'money' | 'resolve' | 'community';

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
          <HubSection onNavigate={navigate} />
        </div>
      )}

      {activeSection === 'home' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <HomeSection onBack={() => navigate('hero')} onNavigate={navigate} />
        </div>
      )}

      {activeSection === 'money' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <MoneySection onBack={() => navigate('hero')} onNavigate={navigate} />
        </div>
      )}

      {activeSection === 'resolve' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <ResolveSection onBack={() => navigate('hero')} />
        </div>
      )}

      {activeSection === 'community' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <button onClick={() => navigate('hero')} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>
          <CommunityFabric />
        </div>
      )}

      {activeSection === 'dashboard' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Dashboard onBack={() => navigate('hero')} onNavigate={navigate} onOpenAuth={() => openAuth('signup')} />
        </div>
      )}

      {activeSection === 'vault' && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <DocumentVault onBack={() => navigate('hero')} onOpenAuth={() => openAuth('signup')} onNavigate={navigate} />
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

      {chatVisible && (
        <AIChatComponent pillar={chatPillar} />
      )}

      <Footer onNavigate={navigate} />
    </div>
  );
};

export default AppLayout;
