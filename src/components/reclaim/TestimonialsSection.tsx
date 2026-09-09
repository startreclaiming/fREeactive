import React from 'react';
import { Star, Quote, Home, DollarSign, Scale, Users } from 'lucide-react';

const NAVY = '#2d2d2d';
const GOLD = '#F5A623';

const testimonials = [
  {
    name: 'Maria Gonzalez',
    location: 'Austin, TX',
    icon: DollarSign,
    quote: 'I found $1,200 in overcharges on my medical bills that I never would have caught. The dispute letter generator got me a full refund in 3 weeks.',
    result: '$1,200 recovered',
  },
  {
    name: 'James Mitchell',
    location: 'Detroit, MI',
    icon: Home,
    quote: 'Saved over $800 by fixing my own plumbing and HVAC issues. The step-by-step guides made it easy even for a complete beginner.',
    result: '$800+ saved',
  },
  {
    name: 'Aisha Johnson',
    location: 'Atlanta, GA',
    icon: Scale,
    quote: 'Filed a small claims case against my landlord for withholding my deposit. Won the full amount plus damages. The templates were invaluable.',
    result: '$3,500 won',
  },
  {
    name: 'Robert Chen',
    location: 'Portland, OR',
    icon: Users,
    quote: 'Our neighborhood camera network helped identify a package thief. Three different camera angles gave police everything they needed.',
    result: 'Justice served',
  },
  {
    name: 'Sarah Williams',
    location: 'Chicago, IL',
    icon: DollarSign,
    quote: 'Got three credit report errors removed that were tanking my score. My credit jumped 85 points in two months — completely changed my options.',
    result: '+85 credit points',
  },
  {
    name: 'David Park',
    location: 'Seattle, WA',
    icon: Scale,
    quote: 'Used the FOIA request template to pull records from my city council. Found they were misusing public funds. Accountability matters.',
    result: 'Transparency won',
  },
];

const TestimonialsSection: React.FC = () => {
  return (
    <section className="py-24 px-6 md:px-10" style={{ backgroundColor: '#f8f9fa' }}>
      <div className="max-w-6xl mx-auto">

        <div className="text-center mb-16">
          <p
            className="text-xs font-bold tracking-widest uppercase mb-5"
            style={{ color: GOLD }}
          >
            Real Results
          </p>
          <h2
            className="text-4xl md:text-5xl font-black leading-tight"
            style={{ color: NAVY }}
          >
            Real people.<br className="hidden md:block" />
            Real outcomes.
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className="rounded-2xl p-6 bg-white border transition-all hover:-translate-y-0.5 hover:shadow-md"
              style={{ borderColor: '#e5e7eb' }}
            >
              {/* Stars */}
              <div className="flex items-center gap-1 mb-5">
                {[...Array(5)].map((_, j) => (
                  <Star key={j} className="w-3.5 h-3.5 fill-current" style={{ color: GOLD }} />
                ))}
              </div>

              {/* Quote */}
              <div className="relative mb-5">
                <Quote
                  className="absolute -top-1 -left-0.5 w-7 h-7 opacity-10"
                  style={{ color: NAVY }}
                />
                <p className="text-gray-600 text-sm leading-relaxed pl-3">
                  {t.quote}
                </p>
              </div>

              {/* Result badge */}
              <div
                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold mb-5"
                style={{ backgroundColor: `${GOLD}15`, color: NAVY }}
              >
                <t.icon className="w-3.5 h-3.5" style={{ color: GOLD }} />
                {t.result}
              </div>

              {/* Author */}
              <div
                className="flex items-center gap-3 pt-4"
                style={{ borderTop: '1px solid #f0f0f0' }}
              >
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
                  style={{ backgroundColor: NAVY, color: GOLD }}
                >
                  {t.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-bold text-sm" style={{ color: NAVY }}>{t.name}</p>
                  <p className="text-xs text-gray-400">{t.location}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default TestimonialsSection;
