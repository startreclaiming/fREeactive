import React, { useState, useRef, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Home, DollarSign, Scale, Users, LayoutDashboard, FolderOpen, Menu, X, LogOut, Settings, ChevronDown } from 'lucide-react';

interface NavbarProps {
  activeSection: string;
  onNavigate: (section: string) => void;
  onOpenAuth: (tab?: 'login' | 'signup') => void;
}

const NAVY = '#181818';
const GOLD = '#f0a700';

const navItems = [
  { key: 'home',      label: 'Home',      icon: Home,            },
  { key: 'money',     label: 'Money',     icon: DollarSign,      },
  { key: 'resolve',   label: 'Resolve',   icon: Scale,           },
  { key: 'community', label: 'Community', icon: Users,           },
  { key: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, },
  { key: 'vault',     label: 'Doc Vault', icon: FolderOpen,      },
];

const Navbar: React.FC<NavbarProps> = ({ activeSection, onNavigate, onOpenAuth }) => {
  const { user, profile, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);
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

          {/* Desktop Nav */}
          <div className="hidden lg:flex items-center gap-1">
            {navItems.map(item => {
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => onNavigate(item.key)}
                  className="flex items-center gap-2 px-3.5 py-2 rounded-lg text-sm font-semibold transition-all"
                  style={{
                    color: active ? GOLD : 'rgba(255,255,255,0.6)',
                    backgroundColor: active ? 'rgba(240,167,0,0.12)' : 'transparent',
                  }}
                  onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.6)'; }}
                >
                  <item.icon className="w-4 h-4" />
                  <span className="hidden xl:inline">{item.label}</span>
                </button>
              );
            })}
          </div>

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
                      {[
                        { label: 'Dashboard',        icon: LayoutDashboard, key: 'dashboard' },
                        { label: 'Profile & Settings', icon: Settings,       key: 'profile'   },
                        { label: 'Document Vault',   icon: FolderOpen,      key: 'vault'     },
                      ].map(item => (
                        <button
                          key={item.key}
                          onClick={() => { onNavigate(item.key); setUserMenuOpen(false); }}
                          className="flex items-center gap-3 w-full px-4 py-2.5 text-sm transition-colors"
                          style={{ color: 'rgba(255,255,255,0.7)' }}
                          onMouseEnter={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.05)'; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLElement).style.backgroundColor = 'transparent'; }}
                        >
                          <item.icon className="w-4 h-4" style={{ color: GOLD }} />
                          {item.label}
                        </button>
                      ))}
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

            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileOpen(!mobileOpen)}
              className="lg:hidden p-2 rounded-lg transition-colors hover:bg-white/10"
              style={{ color: 'rgba(255,255,255,0.7)' }}
            >
              {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileOpen && (
        <div
          className="lg:hidden"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)', backgroundColor: NAVY }}
        >
          <div className="px-4 py-3 space-y-1">
            {navItems.map(item => {
              const active = activeSection === item.key;
              return (
                <button
                  key={item.key}
                  onClick={() => { onNavigate(item.key); setMobileOpen(false); }}
                  className="flex items-center gap-3 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-all"
                  style={{
                    color: active ? GOLD : 'rgba(255,255,255,0.6)',
                    backgroundColor: active ? 'rgba(240,167,0,0.12)' : 'transparent',
                  }}
                >
                  <item.icon className="w-5 h-5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
