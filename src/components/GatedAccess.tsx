import React from 'react';


const DARK_GREY = '#2d2d2d';
const GOLD = '#F5A623';
const WHITE = '#ffffff';

export default function GatedAccess() {
  const handleCTA = () => {
    window.location.href = 'mailto:information@startreclaiming.com?subject=Start%20Reclaiming';
  };

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{
        backgroundColor: DARK_GREY,
        fontFamily: "'Cascadia Code', 'Courier New', monospace"
      }}
    >
      {/* Hero Section */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <div className="w-full max-w-6xl">

          {/* Logo */}
          <div className="text-center mb-8">
            <img
              src="/reclaim-logo-2.png"
              alt="Reclaim"
              style={{
                width: 'min(500px, 90vw)',
                height: 'auto',
                objectFit: 'contain',
                display: 'block',
                margin: '0 auto',
              }}
            />
          </div>

          {/* Tagline */}
          <h1
            className="text-center text-3xl md:text-4xl font-bold mb-12"
            style={{ color: WHITE }}
          >
            Take aim. Reclaim.
          </h1>

          {/* CTA Button */}
          <div className="text-center mb-20">
            <button
              onClick={handleCTA}
              className="px-8 py-4 rounded-lg font-bold text-lg transition-all hover:opacity-90 active:scale-[0.98]"
              style={{
                backgroundColor: GOLD,
                color: DARK_GREY
              }}
            >
              Start Reclaiming
            </button>
          </div>

          {/* Module Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-5xl mx-auto mb-16">

            {/* HOME */}
            <div
              className="p-8 rounded-lg"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(245,166,35,0.2)`
              }}
            >
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: GOLD }}
              >
                HOME
              </h2>
              <p style={{ color: WHITE, lineHeight: '1.6' }}>
                Anticipate the failure. Prevent the insurance claim.
              </p>
            </div>

            {/* MONEY */}
            <div
              className="p-8 rounded-lg"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(245,166,35,0.2)`
              }}
            >
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: GOLD }}
              >
                MONEY
              </h2>
              <p style={{ color: WHITE, lineHeight: '1.6' }}>
                Clawback* rogue fees, taxes and subscriptions.
              </p>
            </div>

            {/* RIGHTS */}
            <div
              className="p-8 rounded-lg"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(245,166,35,0.2)`
              }}
            >
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: GOLD }}
              >
                RIGHTS
              </h2>
              <p style={{ color: WHITE, lineHeight: '1.6' }}>
                Navigate with confidence. Understand what you're entitled to.
              </p>
            </div>

            {/* COMMUNITY */}
            <div
              className="p-8 rounded-lg"
              style={{
                backgroundColor: 'rgba(255,255,255,0.05)',
                border: `1px solid rgba(245,166,35,0.2)`
              }}
            >
              <h2
                className="text-2xl font-bold mb-4"
                style={{ color: GOLD }}
              >
                COMMUNITY
              </h2>
              <p style={{ color: WHITE, lineHeight: '1.6' }}>
                Reconnect. Recalibrate. Reclaim your community.
              </p>
            </div>

          </div>

        </div>
      </div>

      {/* Footer */}
      <div className="px-8 py-6 text-center">
        <p
          className="text-sm mb-2"
          style={{ color: 'rgba(255,255,255,0.6)' }}
        >
          *No real claws are used when recovering households an average of $400 per year.
        </p>
        <span
          className="text-xs"
          style={{ color: 'rgba(255,255,255,0.3)' }}
        >
          © 2025 Reclaim
        </span>
      </div>
    </div>
  );
}
