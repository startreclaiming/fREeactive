import React, { useState } from 'react';
import { Share2, HeartHandshake, Mail, Check, Loader2 } from 'lucide-react';
import { trackEvent, Pillar } from '@/lib/usageTracking';
import { supabase } from '@/lib/supabase';

const GOLD = '#f0a700';

// Single shared "contribute to ongoing development" checkout — same link everywhere,
// regardless of which module the user just finished. Not tied to the PROactive
// subscription (that's a separate Stripe flow with its own webhook, see Phase 6).
const CONTRIBUTE_URL = 'https://buy.stripe.com/cNiaEZ63iajO31CcV9bsc02';

interface CompletionPromptProps {
  pillar: Pillar;
  /** What just happened, for the share text (e.g. "I just found a $30.50 overcharge with Reclaim"). */
  shareText: string;
}

const CompletionPrompt: React.FC<CompletionPromptProps> = ({ pillar, shareText }) => {
  const [copied, setCopied] = useState(false);
  const [emailOpen, setEmailOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const handleShare = async () => {
    trackEvent('share_clicked', pillar);
    const shareData = { title: 'Reclaim', text: shareText, url: window.location.origin };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch { /* user cancelled */ }
      return;
    }
    try {
      await navigator.clipboard.writeText(`${shareText} ${shareData.url}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard blocked */ }
  };

  const handleContribute = () => {
    trackEvent('contribute_clicked', pillar);
    window.open(CONTRIBUTE_URL, '_blank', 'noopener,noreferrer');
  };

  // No password, no account form — just an email, matching the wireframe's own
  // "1-Tap Session Unlock" pattern ("No password. No credit card."). This creates/signs
  // in a real Supabase account behind the scenes via a passwordless magic link.
  const handleEmailSubmit = async () => {
    if (!email.trim()) return;
    setSending(true);
    setEmailError(null);
    trackEvent('save_email_submitted', pillar);
    const { error } = await supabase.auth.signInWithOtp({ email: email.trim() });
    setSending(false);
    if (error) { setEmailError('Could not send that link — try again in a moment.'); return; }
    setSent(true);
  };

  return (
    <div className="flex flex-col gap-2 mt-4">
      <button onClick={handleShare} className="w-full card p-3 flex items-center gap-3 text-left hover:-translate-y-0.5 transition-transform">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: 'rgba(240,167,0,0.12)', color: GOLD }}>
          {copied ? <Check className="w-4 h-4" /> : <Share2 className="w-4 h-4" />}
        </span>
        <span className="text-sm font-medium">{copied ? 'Link copied' : 'Share this with your block'}</span>
      </button>

      <button onClick={handleContribute} className="w-full card p-3 flex items-center gap-3 text-left hover:-translate-y-0.5 transition-transform">
        <span className="inline-flex items-center justify-center w-9 h-9 rounded-lg shrink-0" style={{ background: 'rgba(240,167,0,0.12)', color: GOLD }}>
          <HeartHandshake className="w-4 h-4" />
        </span>
        <span className="text-sm font-medium">Contribute to ongoing development</span>
      </button>

      {!emailOpen && !sent && (
        <button onClick={() => setEmailOpen(true)} className="w-full p-2 flex items-center justify-center gap-2 text-xs text-gray-400 hover:text-gray-600 transition-colors">
          <Mail className="w-3.5 h-3.5" /> Email me a copy, or get ongoing alerts
        </button>
      )}

      {emailOpen && !sent && (
        <div className="card p-3 flex items-center gap-2">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleEmailSubmit()}
            placeholder="you@email.com"
            className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 px-1"
            autoFocus
          />
          <button onClick={handleEmailSubmit} disabled={!email.trim() || sending} className="btn-gold disabled:opacity-50 !py-2 !px-3">
            {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
          </button>
        </div>
      )}
      {emailError && <p className="text-xs text-red-500 px-1">{emailError}</p>}
      {sent && <p className="text-xs text-gray-500 text-center py-1">Check your inbox for a link — no password needed.</p>}
    </div>
  );
};

export default CompletionPrompt;
