import React from 'react';
import { IMAGES } from '@/lib/data';
import { Home, DollarSign, Scale, Users, ArrowRight, CheckCircle } from 'lucide-react';

interface FeaturesSectionProps {
  onNavigate: (section: string) => void;
}

const NAVY = '#2d2d2d';
const GOLD = '#F5A623';

const features = [
  {
    pillar: 'home',
    tag: 'Home Protection',
    headline: 'Stop the Silent Drain',
    outcome: 'Prevent $3,000–$8,000 in emergency repairs annually',
    description:
      'Stop paying thousands for repairs you can handle yourself. Step-by-step guides with difficulty ratings and real cost estimates put the power back where it belongs.',
    image: IMAGES.home[0],
    icon: Home,
    highlights: [
      '40+ DIY maintenance guides, searchable by category',
      'Difficulty ratings from beginner to expert',
      'Seasonal maintenance calendar, personalized',
      'Real cost estimates and tool lists',
    ],
  },
  {
    pillar: 'money',
    tag: 'Money Recovery',
    headline: 'Recover Hidden Overcharges',
    outcome: 'Average user recovers $1,200 in Year 1',
    description:
      'Companies count on you not reading the fine print. Our AI-powered bill analyzer finds overcharges, hidden fees, and billing errors — then generates dispute letters to get your money back.',
    image: IMAGES.money[0],
    icon: DollarSign,
    highlights: [
      'AI bill analysis across medical, utilities, and banking',
      '8 dispute templates with 73% average success rate',
      'Credit report error detection and correction',
      'Bank fee reversal — 85% success on overdraft fees',
    ],
  },
  {
    pillar: 'rights',
    tag: 'Legal Rights',
    headline: 'Put the System to Work for You',
    outcome: 'Legal tools that used to cost $350/hour, now free',
    description:
      'Justice shouldn\'t have a price tag. Access 15+ legal document templates, court filing guides, and accountability tools that keep the system honest.',
    image: IMAGES.rights[0],
    icon: Scale,
    highlights: [
      '15+ legal templates for common disputes',
      'Small claims court filing guides, step by step',
      'FOIA request generators and consumer protection tools',
      'Tenant rights, wage theft, and civil rights resources',
    ],
  },
  {
    pillar: 'community',
    tag: 'Community Network',
    headline: 'Build Your Own Community',
    outcome: '42,000+ verified neighbors exchanging real help',
    description:
      'Strong communities protect themselves. Connect with neighbors, share vetted contractors, report incidents, and pool resources — because we\'re stronger together.',
    image: IMAGES.community[0],
    icon: Users,
    highlights: [
      'Trust-verified local neighbor network',
      'Vetted contractor recommendations and reviews',
      'Neighborhood incident reporting and alerts',
      'Resource sharing and mutual aid coordination',
    ],
  },
];

const FeaturesSection: React.FC<FeaturesSectionProps> = ({ onNavigate }) => {
  return (
    <section className="py-24 bg-white">
      <div className="max-w-6xl mx-auto px-6 lg:px-10">

        {/* Section header */}
        <div className="text-center mb-20">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-5"
            style={{ color: GOLD }}
          >
            Four Pillars
          </p>
          <h2
            className="text-4xl md:text-5xl font-black leading-tight mb-5"
            style={{ color: NAVY }}
          >
            Every tool your household needs.<br className="hidden md:block" />
            One platform.
          </h2>
          <p className="text-lg text-gray-500 max-w-2xl mx-auto leading-relaxed">
            Expert-level protection across home, money, rights, and community —
            because you shouldn't need to be wealthy to fight back.
          </p>
        </div>

        {/* Feature rows */}
        <div className="space-y-28">
          {features.map((feature, idx) => {
            const isReversed = idx % 2 === 1;
            return (
              <div
                key={feature.pillar}
                className={`grid md:grid-cols-2 gap-12 md:gap-20 items-center ${
                  isReversed ? 'md:[&>*:first-child]:order-2' : ''
                }`}
              >
                {/* Text */}
                <div>
                  <p
                    className="text-xs font-bold tracking-widest uppercase mb-3"
                    style={{ color: GOLD }}
                  >
                    {feature.tag}
                  </p>
                  <h3
                    className="text-3xl md:text-4xl font-black mb-3 leading-tight"
                    style={{ color: NAVY }}
                  >
                    {feature.headline}
                  </h3>
                  <p className="text-sm font-semibold mb-5" style={{ color: NAVY }}>
                    {feature.outcome}
                  </p>
                  <p className="text-gray-600 leading-relaxed mb-7 text-sm">
                    {feature.description}
                  </p>
                  <ul className="space-y-3 mb-8">
                    {feature.highlights.map((h, i) => (
                      <li key={i} className="flex items-start gap-3 text-sm text-gray-700">
                        <CheckCircle
                          className="w-4 h-4 flex-shrink-0 mt-0.5"
                          style={{ color: GOLD }}
                        />
                        {h}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => onNavigate(feature.pillar)}
                    className="group inline-flex items-center gap-2 px-7 py-3 rounded-xl font-bold text-sm tracking-wide transition-all hover:opacity-90 hover:-translate-y-0.5"
                    style={{ backgroundColor: NAVY, color: 'white' }}
                  >
                    Explore {feature.pillar.charAt(0).toUpperCase() + feature.pillar.slice(1)}
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>

                {/* Image */}
                <div className="relative rounded-2xl overflow-hidden aspect-[4/3] shadow-xl">
                  <img
                    src={feature.image}
                    alt={feature.headline}
                    className="w-full h-full object-cover"
                  />
                  {/* Overlay with icon badge */}
                  <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgba(19,30,58,0.7) 0%, transparent 60%)' }} />
                  <div className="absolute bottom-5 left-5">
                    <div
                      className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                      style={{ backgroundColor: GOLD }}
                    >
                      <feature.icon className="w-5 h-5" style={{ color: NAVY }} />
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default FeaturesSection;
