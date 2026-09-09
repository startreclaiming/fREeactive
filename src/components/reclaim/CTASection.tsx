import React from 'react';
import { ArrowRight, ChevronRight, Home, DollarSign, Scale, Users } from 'lucide-react';

interface CTASectionProps {
  onNavigate: (section: string) => void;
}

const NAVY = '#2d2d2d';
const GOLD = '#F5A623';

const pillars = [
  { icon: Home,       label: 'Home'      },
  { icon: DollarSign, label: 'Money'     },
  { icon: Scale,      label: 'Rights'    },
  { icon: Users,      label: 'Community' },
];

const CTASection: React.FC<CTASectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-32 px-6 md:px-10" style={{ backgroundColor: NAVY }}>
      {/* Subtle glow */}
      <div
        className="absolute left-1/2 -translate-x-1/2 w-96 h-64 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: GOLD }}
      />

      <div className="relative max-w-3xl mx-auto text-center">
        {/* Pillar icon row */}
        <div className="flex items-center justify-center gap-3 mb-12">
          {pillars.map((p, i) => (
            <div
              key={i}
              className="w-12 h-12 rounded-xl flex items-center justify-center shadow-lg"
              style={{ backgroundColor: GOLD }}
            >
              <p.icon className="w-6 h-6" style={{ color: NAVY }} />
            </div>
          ))}
        </div>

        <p
          className="text-xs font-bold tracking-widest uppercase mb-6"
          style={{ color: GOLD }}
        >
          Ready to Start
        </p>

        <h2 className="text-4xl md:text-6xl font-black text-white leading-tight mb-6">
          Ready to take back<br />
          <span style={{ color: GOLD }}>what's yours?</span>
        </h2>

        <p className="text-xl text-gray-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          You don't need to be wealthy to protect your home, recover your money,
          defend your rights, or strengthen your community.
          You just need the right tools.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={() => onNavigate('dashboard')}
            className="group inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-base tracking-wide transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
            style={{ backgroundColor: GOLD, color: NAVY }}
          >
            Start Reclaiming Now
            <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
          </button>
          <button
            onClick={() => onNavigate('home')}
            className="inline-flex items-center justify-center gap-2 px-10 py-4 rounded-xl font-bold text-base tracking-wide border transition-all hover:bg-white/10"
            style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
          >
            Explore the Platform
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-6 text-xs font-medium"
          style={{ color: 'rgba(255,255,255,0.35)' }}
        >
          <span>100% Free to Start</span>
          <span className="w-1 h-1 rounded-full bg-current" />
          <span>No Credit Card Required</span>
          <span className="w-1 h-1 rounded-full bg-current" />
          <span>Your Data Stays Private</span>
        </div>
      </div>
    </section>
  );
};

export default CTASection;
