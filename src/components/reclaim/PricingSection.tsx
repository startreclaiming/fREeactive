import React from 'react';
import { Home, DollarSign, Scale, Users, Check, Sparkles } from 'lucide-react';
import { ModuleHeader } from './moduleUI';
import { useAuth } from '@/context/AuthContext';
import { useEntitlement } from '@/lib/entitlement';
import { trackEvent } from '@/lib/usageTracking';
import './modules.css';

// Single universal payment link, used everywhere in the app (per the user's explicit
// choice) — same URL as CompletionPrompt.tsx's "contribute" button and
// AlamedaLanding.tsx's support CTAs. Not a dedicated $9.99/mo Stripe price.
const PROACTIVE_CHECKOUT_URL = 'https://buy.stripe.com/cNiaEZ63iajO31CcV9bsc02';

const ROWS = [
  {
    icon: Home, name: 'Reclaim Home', trigger: 'Appliance / Barcode Scan',
    free: 'DIY Maintenance Guide & Recall Lookup',
    pro: 'Predictive Failure Alerts & Warranty Tracking',
  },
  {
    icon: DollarSign, name: 'Reclaim Money', trigger: 'Bill Photo / PDF OCR',
    free: 'Single Statement Overcharge Audit & Dispute',
    pro: '24/7 API Account Sync & Auto-Dispute Filing',
  },
  {
    icon: Scale, name: 'Reclaim Resolve', trigger: 'Voice Dictation / Document',
    free: 'Chronological Timeline & Judicial Form Draft',
    pro: 'Permanent Audit Vault & Court Deadline Tracking',
  },
  {
    icon: Users, name: 'Reclaim Community', trigger: '200-Yard Scout Zone Map',
    free: 'Unclaimed Property Map & Local Tool Swap',
    pro: 'Emergency Outage Alerting & Block Resilience Circle',
  },
];

const PricingSection: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const { user } = useAuth();
  const { isProActive, isSubscribed, trialStatus, trialDaysRemaining, loading } = useEntitlement();

  // A real <a target="_blank"> rather than window.open() — script-triggered popups
  // are handled inconsistently on mobile browsers and can hijack the current tab
  // with no way back into the app; a genuine link always opens as a real new tab.
  const upgradeUrl = new URL(PROACTIVE_CHECKOUT_URL);
  if (user?.id) upgradeUrl.searchParams.set('client_reference_id', user.id);
  if (user?.email) upgradeUrl.searchParams.set('prefilled_email', user.email);

  const handleUpgradeClick = () => {
    trackEvent('pricing_upgrade_clicked', 'general');
  };

  return (
    <div className="reclaim-module">
      <ModuleHeader onBack={onBack} icon={<Sparkles className="w-5 h-5" />} eyebrow="Pricing"
        title="FREEactive vs. PROactive"
        blurb="Every module works free, forever. PROactive adds automation that watches things for you instead of waiting for you to ask." />

      <div className="overflow-x-auto mb-8">
        <table className="w-full text-sm border-separate" style={{ borderSpacing: 0 }}>
          <thead>
            <tr className="text-left text-xs font-semibold tracking-wide uppercase text-gray-400">
              <th className="pb-3 pr-4">Domain</th>
              <th className="pb-3 pr-4">FREEactive</th>
              <th className="pb-3">PROactive · $9.99/mo</th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((r) => (
              <tr key={r.name} className="align-top">
                <td className="py-3 pr-4 border-t border-black/5">
                  <div className="flex items-center gap-2 font-semibold"><r.icon className="w-4 h-4" style={{ color: '#f0a700' }} /> {r.name}</div>
                  <p className="text-xs text-gray-400 mt-1">{r.trigger}</p>
                </td>
                <td className="py-3 pr-4 border-t border-black/5 text-gray-600">{r.free}</td>
                <td className="py-3 border-t border-black/5 text-gray-600">{r.pro}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {loading ? (
        <div className="card p-6">
          <p className="text-sm text-gray-400">Checking your account…</p>
        </div>
      ) : isProActive ? (
        <div className="card p-5 flex items-center gap-3">
          <span className="inline-flex items-center justify-center w-10 h-10 rounded-full" style={{ background: 'rgba(16,163,74,0.1)', color: '#10a34a' }}><Check className="w-5 h-5" /></span>
          <div>
            <p className="font-semibold">{isSubscribed ? "You're subscribed to PROactive" : `You're in your free trial — ${trialDaysRemaining} day${trialDaysRemaining === 1 ? '' : 's'} left`}</p>
            <p className="text-sm text-gray-500">All PROactive automation is unlocked{isSubscribed ? '.' : ' for now — upgrade any time to keep it after your trial.'}</p>
          </div>
        </div>
      ) : (
        <div className="card p-6">
          <p className="font-semibold mb-1">{trialStatus === 'expired' ? 'Your trial has ended' : 'Ready for PROactive?'}</p>
          <p className="text-sm text-gray-500 mb-4">$9.99/month, cancel any time. No account required to keep using every FREEactive feature.</p>
          <a href={upgradeUrl.toString()} target="_blank" rel="noopener noreferrer" onClick={handleUpgradeClick} className="btn-gold">Upgrade to PROactive</a>
        </div>
      )}
    </div>
  );
};

export default PricingSection;
