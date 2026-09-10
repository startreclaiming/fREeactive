import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Settings, LogOut, ChevronDown } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenAuth: (tab?: 'login' | 'signup') => void;
}

const NAVY = '#181818';
const GOLD = '#f0a700';

// FREEactive is just the Hub — there's no module navigation to show right now
// (Home/Money/Resolve/Community/Vault are PROactive, not offered yet), so the
// nav is deliberately just the logo and an account menu, not a menu of sections.
const Navbar: React.FC<NavbarProps> = ({ onNavigate, onOpenAuth }) => {
  const { user, profile, signOut } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const handleSignOut = async () => {
    await signOut();
    setUserMenuOpen(false);
    onNavigate('hero');
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <nav className="sticky top-0 z-40" style={{ backgroundColor: NAVY }}>
      <div className="max-w-7xl mx-auto px-6 lg:px-10">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <button
            onClick={() => onNavigate('hero')}
            className="flex items-center transition-opacity hover:opacity-80"
          >
            <img src="/reclaim-logo-2.png" alt="Reclaim" className="h-6 md:h-7 w-auto object-contain" />
          </button>

          {/* Right: user or auth */}
          <div className="flex items-center gap-3">
            {user ? (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-xl transition-all hover:bg-white/10"
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ backgroundColor: GOLD, color: NAVY }}
                  >
                    {initials}
                  </div>
                  <span className="hidden sm:block text-sm font-semibold text-white max-w-[120px] truncate">
                    {profile?.display_name || user.email?.split('@')[0]}
                  </span>
                  <ChevronDown
                    className="w-4 h-4 transition-transform"
                    style={{
                      color: 'rgba(255,255,255,0.5)',
                      transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                    }}
                  />
                </button>

                {userMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-2 w-60 rounded-2xl overflow-hidden z-50 shadow-2xl"
                    style={{ backgroundColor: NAVY, border: '1px solid rgba(255,255,255,0.1)' }}
                  >
                    <div
                      className="px-4 py-3"
                      style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}
                    >
                      <p className="font-bold text-white text-sm truncate">
                        {profile?.display_name || 'User'}
                      </p>
                      <p className="text-xs truncate" style={{ color: 'rgba(255,255,255,0.4)' }}>
                        {user.email}
                      </p>
                    </div>
                    <div className="py-1">
                      <button
                        onClick={() => { onNavigate('profile'); setUserMenuOpen(false); }}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                        style={{ color: 'rgba(255,255,255,0.7)' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                      >
                        <Settings className="w-4 h-4" style={{ color: GOLD }} />
                        Profile & Settings
                      </button>
                    </div>
                    <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                      <button
                        onClick={handleSignOut}
                        className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                        style={{ color: '#fca5a5' }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(239,68,68,0.08)'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => onOpenAuth('login')}
                className="px-5 py-2 rounded-lg text-sm font-bold tracking-wide transition-all hover:opacity-90"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
