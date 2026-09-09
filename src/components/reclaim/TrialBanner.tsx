import React, { useState } from 'react';
import { getTrialStatus, UserProfile } from '@/context/AuthContext';

interface TrialBannerProps {
  profile: Pick<UserProfile, 'trial_end' | 'subscription_status'> | null;
  onUpgradeClick?: () => void;
}

export const TrialBanner: React.FC<TrialBannerProps> = ({ profile, onUpgradeClick }) => {
  const [dismissed, setDismissed] = useState(false);
  const { status, daysRemaining } = getTrialStatus(profile);

  // Subscribed users and dismissed banners — show nothing
  if (status === 'subscribed') return null;
  if (dismissed && status === 'active') return null;

  const GOLD   = '#f0a700';
  const BG     = '#181818';
  const RED    = '#ef4444';

  const isExpired  = status === 'expired';
  const isExpiring = status === 'expiring';

  const bgColor = isExpired ? 'rgba(239,68,68,0.12)' : isExpiring ? 'rgba(240,167,0,0.12)' : 'rgba(240,167,0,0.07)';
  const border  = isExpired ? '1px solid rgba(239,68,68,0.3)' : '1px solid rgba(240,167,0,0.2)';
  const dotColor = isExpired ? RED : GOLD;

  const message = isExpired
    ? 'Your 14-day trial has ended.'
    : isExpiring
      ? `Trial ends in ${daysRemaining} day${daysRemaining !== 1 ? 's' : ''}.`
      : `${daysRemaining} days remaining in your free trial.`;

  const ctaText = isExpired ? 'Join the waitlist' : 'Upgrade early';

  return (
    <div style={{
      width: '100%',
      background: bgColor,
      borderBottom: border,
      padding: '10px 24px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      gap: 12,
      fontFamily: 'Poppins, sans-serif',
      position: 'sticky',
      top: 0,
      zIndex: 100,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 7, height: 7,
          borderRadius: '50%',
          background: dotColor,
          flexShrink: 0,
          boxShadow: `0 0 6px ${dotColor}`,
          display: 'inline-block',
        }} />
        <span style={{ fontSize: 13, color: '#fff', fontWeight: 500 }}>
          {message}
        </span>
        {!isExpired && (
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.4)' }}>
            All four modules unlocked.
          </span>
        )}
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, flexShrink: 0 }}>
        {(isExpired || isExpiring) && (
          <button
            onClick={onUpgradeClick}
            style={{
              background: isExpired ? RED : GOLD,
              color: BG,
              border: 'none',
              borderRadius: 6,
              padding: '6px 16px',
              fontSize: 12,
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              cursor: 'pointer',
              letterSpacing: '0.04em',
              whiteSpace: 'nowrap',
            }}
          >
            {ctaText}
          </button>
        )}
        {!isExpired && (
          <button
            onClick={() => setDismissed(true)}
            style={{
              background: 'none',
              border: 'none',
              color: 'rgba(255,255,255,0.3)',
              cursor: 'pointer',
              fontSize: 16,
              lineHeight: 1,
              padding: '0 4px',
            }}
          >
            ✕
          </button>
        )}
      </div>
    </div>
  );
};

// ── Trial expiry wall ─────────────────────────────────────────────────────────
// Render this in place of module content when the trial is expired

export const TrialExpiredWall: React.FC<{ onWaitlistClick?: () => void }> = ({ onWaitlistClick }) => (
  <div style={{
    minHeight: '60vh',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    textAlign: 'center',
    padding: '60px 24px',
    fontFamily: 'Poppins, sans-serif',
  }}>
    <div style={{
      width: 56, height: 56,
      borderRadius: '50%',
      background: 'rgba(240,167,0,0.1)',
      border: '1px solid rgba(240,167,0,0.2)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 24,
      marginBottom: 24,
    }}>⏱</div>

    <h2 style={{ fontWeight: 700, fontSize: 24, color: '#fff', marginBottom: 10 }}>
      Your trial has ended
    </h2>
    <p style={{ fontWeight: 300, fontSize: 15, color: 'rgba(255,255,255,0.5)', maxWidth: 420, lineHeight: 1.7, marginBottom: 32 }}>
      You had full access to all four Reclaim modules for 14 days.
      Join the waitlist to be first when subscriptions open at $9.99/month.
    </p>

    <button
      onClick={onWaitlistClick}
      style={{
        background: '#f0a700',
        color: '#181818',
        border: 'none',
        borderRadius: 8,
        padding: '14px 32px',
        fontSize: 14,
        fontWeight: 700,
        fontFamily: 'Poppins, sans-serif',
        cursor: 'pointer',
        letterSpacing: '0.04em',
      }}
    >
      Join the waitlist
    </button>
  </div>
);

export default TrialBanner;
