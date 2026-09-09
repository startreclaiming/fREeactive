import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2, Home, DollarSign, Scale, Users } from 'lucide-react';

interface FooterProps {
  onNavigate: (section: string) => void;
}

const NAVY = '#181818';
const GOLD = '#f0a700';

const Footer: React.FC<FooterProps> = ({ onNavigate }) => {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (email.includes('@')) {
      setSubscribed(true);
      setEmail('');
      setTimeout(() => setSubscribed(false), 4000);
    }
  };

  const columns = [
    {
      icon: Home,
      label: 'Home',
      section: 'home',
      links: ['DIY Guides', 'Maintenance Calendar', 'Tool Library', 'Safety Checks', 'Energy Savings'],
    },
    {
      icon: DollarSign,
      label: 'Money',
      section: 'money',
      links: ['Bill Analyzer', 'Dispute Letters', 'Credit Reports', 'Fee Recovery', 'Budget Tools'],
    },
    {
      icon: Scale,
      label: 'Resolve',
      section: 'resolve',
      links: ['Legal Templates', 'Court Guides', 'FOIA Requests', 'Know Your Rights', 'Attorney Check'],
    },
    {
      icon: Users,
      label: 'Community',
      section: 'community',
      links: ['Incident Reports', 'Resource Sharing', 'Camera Network', 'Neighborhood Map', 'Events'],
    },
  ];

  return (
    <footer style={{ backgroundColor: NAVY }}>

      {/* Newsletter strip */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-white mb-1">Stay Empowered</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Weekly tips on protecting your home, money, rights, and community.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="flex gap-3 w-full md:w-auto">
              <div className="relative flex-1 md:w-64">
                <Mail
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4"
                  style={{ color: 'rgba(255,255,255,0.3)' }}
                />
                <input
                  type="email"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  placeholder="your@email.com"
                  className="w-full pl-10 pr-4 py-3 rounded-xl text-white placeholder-gray-600 text-sm outline-none transition-all"
                  style={{
                    backgroundColor: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}
                  onFocus={e => { (e.target as HTMLElement).style.borderColor = GOLD; }}
                  onBlur={e => { (e.target as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)'; }}
                />
              </div>
              <button
                type="submit"
                className="px-5 py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:opacity-90 flex items-center gap-2 whitespace-nowrap"
                style={{ backgroundColor: GOLD, color: NAVY }}
              >
                {subscribed
                  ? <><CheckCircle2 className="w-4 h-4" /> Done!</>
                  : <>Subscribe <ArrowRight className="w-4 h-4" /></>
                }
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Main footer links */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">

          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <img src="/reclaim-logo-2.png" alt="Reclaim" className="h-6 w-auto object-contain mb-4" />
            <p className="text-xs leading-relaxed" style={{ color: 'rgba(255,255,255,0.35)' }}>
              Empowering citizens to reclaim their homes, money, rights, and community.
            </p>
          </div>

          {/* Pillar columns */}
          {columns.map(col => (
            <div key={col.label}>
              <h4
                className="font-bold text-sm mb-4 flex items-center gap-2"
                style={{ color: GOLD }}
              >
                <col.icon className="w-3.5 h-3.5" />
                {col.label}
              </h4>
              <ul className="space-y-2">
                {col.links.map(link => (
                  <li key={link}>
                    <button
                      onClick={() => onNavigate(col.section)}
                      className="text-xs transition-colors text-left"
                      style={{ color: 'rgba(255,255,255,0.35)' }}
                      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.35)'; }}
                    >
                      {link}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © 2025 Reclaim. All rights reserved.
            </p>
            <div className="flex items-center gap-5">
              <button
                className="text-xs transition-colors"
                style={{ color: 'rgba(255,255,255,0.25)' }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
                onClick={() => onNavigate('pricing')}
              >
                Pricing
              </button>
              {['Privacy Policy', 'Terms of Service', 'Contact'].map(link => (
                <button
                  key={link}
                  className="text-xs transition-colors"
                  style={{ color: 'rgba(255,255,255,0.25)' }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'white'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'rgba(255,255,255,0.25)'; }}
                >
                  {link}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
