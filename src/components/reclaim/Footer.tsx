import React, { useState } from 'react';
import { Mail, ArrowRight, CheckCircle2 } from 'lucide-react';

interface FooterProps {
  onNavigate: (section: string) => void;
}

const NAVY = '#181818';
const GOLD = '#f0a700';

// Kept deliberately minimal to match the rest of the app right now — no links
// into Home/Money/Resolve/Community-style feature lists, since those sections
// are a PROactive tier that isn't offered yet and those links would just dead-end.
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

  return (
    <footer style={{ backgroundColor: NAVY }}>

      {/* Newsletter strip */}
      <div style={{ borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <h3 className="text-xl font-black text-white mb-1">Stay in the loop</h3>
              <p className="text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                We'll let you know when new features launch.
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

      {/* Brand */}
      <div className="max-w-6xl mx-auto px-6 lg:px-10 py-10">
        <img src="/reclaim-logo-2.png" alt="Reclaim" className="h-6 w-auto object-contain mb-3" />
        <p className="text-xs leading-relaxed max-w-sm" style={{ color: 'rgba(255,255,255,0.35)' }}>
          Instant help with your home, money, and rights — free.
        </p>
      </div>

      {/* Bottom bar */}
      <div style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
        <div className="max-w-6xl mx-auto px-6 lg:px-10 py-5">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <p className="text-xs" style={{ color: 'rgba(255,255,255,0.25)' }}>
              © 2026 Reclaim. All rights reserved.
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
            </div>
          </div>
        </div>
      </div>

    </footer>
  );
};

export default Footer;
