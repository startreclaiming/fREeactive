import React from 'react';
import { ArrowLeft } from 'lucide-react';

export const GOLD = '#f0a700';

export const ModuleHeader: React.FC<{
  icon: React.ReactNode; eyebrow: string; title: string; blurb: string; onBack?: () => void;
}> = ({ icon, eyebrow, title, blurb, onBack }) => (
  <>
    {onBack && (
      <button onClick={onBack} className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" /> Back
      </button>
    )}
    <div className="flex items-center gap-3 mb-1">
      <span className="inline-flex items-center justify-center w-10 h-10 rounded-lg" style={{ background: 'rgba(240,167,0,0.12)', color: GOLD }}>{icon}</span>
      <p className="text-xs font-semibold tracking-[0.22em] uppercase" style={{ color: GOLD }}>{eyebrow}</p>
    </div>
    <h1 className="text-4xl md:text-5xl font-semibold mb-2">{title}</h1>
    <p className="text-gray-500 mb-8 max-w-xl">{blurb}</p>
  </>
);

export const Stat: React.FC<{ label: string; value: React.ReactNode; accent?: boolean }> = ({ label, value, accent }) => (
  <div className="card p-4">
    <p className="text-3xl font-semibold mod-display" style={{ color: accent ? GOLD : '#1d1d1f' }}>{value}</p>
    <p className="text-sm text-gray-500 mt-1">{label}</p>
  </div>
);

export const Badge: React.FC<{ tone: 'green' | 'gold' | 'gray' | 'blue'; children: React.ReactNode }> = ({ tone, children }) => {
  const tones: Record<string, string> = {
    green: 'bg-emerald-50 text-emerald-700',
    gold: 'bg-[#fff6e0] text-[#8a6200]',
    gray: 'bg-gray-100 text-gray-500',
    blue: 'bg-blue-50 text-blue-700',
  };
  return <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full ${tones[tone]}`}>{children}</span>;
};

export const Empty: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="rounded-xl border border-dashed border-black/10 p-10 text-center text-gray-400">{children}</div>
);
