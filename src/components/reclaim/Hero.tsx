import React from 'react';
import { PLATFORM_STATS } from '@/lib/data';
import { Home, DollarSign, Scale, Users, ArrowRight, Shield, ChevronDown } from 'lucide-react';

interface HeroProps {
  onNavigate: (section: string) => void;
}

const NAVY = '#2d2d2d';
const GOLD = '#F5A623';

const pillars = [
  { key: 'home',      label: 'Home',      desc: 'Stop the Silent Drain',               icon: Home,       },
  { key: 'money',     label: 'Money',     desc: 'Recover Hidden Overcharges',           icon: DollarSign, },
  { key: 'rights',    label: 'Rights',    desc: 'Put the System to Work for You',       icon: Scale,      },
  { key: 'community', label: 'Community', desc: 'Build Your Own Community',             icon: Users,      },
];

const Hero: React.FC<HeroProps> = ({ onNavigate }) => {
  return (
    <section className="relative overflow-hidden" style={{ backgroundColor: NAVY }}>
      {/* Subtle glow accents */}
      <div
        className="absolute top-20 right-0 w-96 h-96 rounded-full opacity-10 blur-3xl pointer-events-none"
        style={{ backgroundColor: GOLD }}
      />
      <div
        className="absolute bottom-0 left-0 w-64 h-64 rounded-full opacity-5 blur-3xl pointer-events-none"
        style={{ backgroundColor: GOLD }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-6 lg:px-10">

        {/* Hero copy */}
        <div className="pt-20 pb-12 md:pt-28 md:pb-16 text-center">
          <div
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border mb-10 text-xs font-bold tracking-widest uppercase"
            style={{ borderColor: `${GOLD}40`, color: GOLD }}
          >
            <Shield className="w-3 h-3" />
            50 years of engineering in the making
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-7xl font-black text-white leading-[1.05] tracking-tight mb-6">
            <span className="block">Reclaim What's</span>
            <span className="block" style={{ color: GOLD }}>Rightfully Yours</span>
          </h1>

          <p className="text-lg md:text-xl text-gray-300 max-w-3xl mx-auto mb-10 leading-relaxed font-light">
            Your home. Your money. Your rights. Your community.
            Four pillars of empowerment that put expert-level tools in your hands —
            because you shouldn't need to be wealthy to protect what matters.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
            <button
              onClick={() => onNavigate('dashboard')}
              className="group inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl font-bold text-base tracking-wide transition-all hover:opacity-90 hover:-translate-y-0.5 shadow-lg"
              style={{ backgroundColor: GOLD, color: NAVY }}
            >
              Get Started Free
              <ArrowRight className="w-5 h-5 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <button
              onClick={() => {
                document.getElementById('pillars-section')?.scrollIntoView({ behavior: 'smooth' });
              }}
              className="inline-flex items-center justify-center gap-2 px-9 py-4 rounded-xl font-bold text-base tracking-wide border transition-all hover:bg-white/10"
              style={{ borderColor: 'rgba(255,255,255,0.2)', color: 'white' }}
            >
              Explore the Four Pillars
              <ChevronDown className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Four Pillar Cards */}
        <div id="pillars-section" className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-16">
          {pillars.map(p => (
            <button
              key={p.key}
              onClick={() => onNavigate(p.key)}
              className="group relative text-left rounded-2xl p-6 transition-all duration-300 hover:-translate-y-1"
              style={{
                backgroundColor: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.08)',
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.08)';
                (e.currentTarget as HTMLElement).style.borderColor = `${GOLD}40`;
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.08)';
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mb-5 transition-transform group-hover:scale-110"
                style={{ backgroundColor: GOLD }}
              >
                <p.icon className="w-6 h-6" style={{ color: NAVY }} />
              </div>
              <h3 className="text-white font-bold text-lg mb-2">{p.label}</h3>
              <p className="text-sm leading-relaxed mb-5" style={{ color: 'rgba(255,255,255,0.5)' }}>
                {p.desc}
              </p>
              <div
                className="flex items-center gap-1 text-xs font-semibold transition-colors group-hover:opacity-100"
                style={{ color: GOLD, opacity: 0.6 }}
              >
                <span>Explore</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </button>
          ))}
        </div>

        {/* Stats Bar */}
        <div
          className="py-10"
          style={{ borderTop: '1px solid rgba(255,255,255,0.08)' }}
        >
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {PLATFORM_STATS.map((stat, i) => (
              <div key={i} className="text-center">
                <div className="text-2xl md:text-3xl font-black text-white mb-1 tabular-nums">
                  {stat.value}
                </div>
                <div className="text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                  {stat.description}
                </div>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
};

export default Hero;
