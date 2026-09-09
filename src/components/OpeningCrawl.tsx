import React, { useEffect, useState } from 'react';
import reclaimLogo from '../assets/logos/reclaim-logo-2.png';

interface OpeningCrawlProps {
  onComplete: () => void;
  onSkip: () => void;
}

const BG = '#1e1e1e'; // VS Code dark theme
const GOLD = '#F5A623';
const WHITE = '#D4D4D4'; // VS Code text
const TEAL = '#4EC9B0'; // VS Code teal
const DIMMED_OPACITY = 0.4; // Dimmed text opacity

const MFONT: React.CSSProperties = {
  fontFamily: "'Cascadia Code', monospace",
  fontWeight: 300,
};

// Terminal feed lines
const TERMINAL_LINES = [
  { text: "TRANSMISSION RECEIVED.", color: TEAL, size: 'sm', pause: 600 },
  { text: "DECRYPTING...", color: TEAL, size: 'sm', pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "The secret war within America continues to escalate.", color: GOLD, size: 'md', pause: 600 },
  { text: "Their mission? To remove as much cash from our wallets as possible.", color: GOLD, size: 'md', pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "Economic cycles are artificially compressed.", color: WHITE, size: 'md', pause: 600 },
  { text: "Recessions were once decades apart.", color: WHITE, size: 'md', pause: 600 },
  { text: "Nowadays they're months apart.", color: WHITE, size: 'md', pause: 600 },
  { text: "Why? Artificially creating more frequent boom/bust cycles", color: WHITE, size: 'md', pause: 600 },
  { text: "generates more money for those who already have it.", color: WHITE, size: 'md', pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "Remember 2008?", color: GOLD, size: 'md', emphasis: true, pause: 600 },
  { text: "Between 6-8 million homes foreclosed.", color: WHITE, size: 'md', pause: 600 },
  { text: "Millions of American families displaced.", color: WHITE, size: 'md', pause: 600 },
  { text: "$10.2 trillion wiped from the American economy.", color: WHITE, size: 'md', pause: 600 },
  { text: "Yet only 1 individual was convicted.", color: GOLD, size: 'md', pause: 600 },
  { text: "Sentenced to 30 months.", color: GOLD, size: 'md', pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: 'Taxes go up to fund bailouts... "too big to fail" they cried.', color: WHITE, size: 'md', pause: 600 },
  { text: "As a result, the price of everything goes up.", color: WHITE, size: 'md', pause: 600 },
  { text: "You know what doesn't? Wages.", color: GOLD, size: 'md', emphasis: true, pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "Every sector — government, enterprise, healthcare, food, pharma.", color: WHITE, size: 'md', pause: 600 },
  { text: "They stopped fighting for market share long ago.", color: WHITE, size: 'md', pause: 600 },
  { text: "They battle for WALLET SHARE.", color: GOLD, size: 'md', emphasis: true, pause: 600 },
  { text: "Your wallet.", color: GOLD, size: 'md', emphasis: true, pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "And the system 'for the people, by the people' —", color: WHITE, size: 'md', pause: 600, redacted: true },
  { text: "caretakers of our constitution and fair treatment for all?", color: WHITE, size: 'md', pause: 600, redacted: true },
  { text: "Guarded by attorneys who won't talk for less than a $5K retainer.", color: WHITE, size: 'md', pause: 600, redacted: true },
  { text: "The judicial system is an industry.", color: GOLD, size: 'md', emphasis: true, pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "As they say: no money, no honey.", color: WHITE, size: 'sm', italic: true, pause: 1500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "THIS ISN'T FREEDOM.", color: GOLD, size: 'md', emphasis: true, pause: 600 },
  { text: "IT'S THINLY VEILED OPPRESSION", color: GOLD, size: 'md', emphasis: true, pause: 600 },
  { text: "MASQUERADING AS THE LAND OF OPPORTUNITY.", color: GOLD, size: 'md', emphasis: true, pause: 2500 },
  { text: "", color: WHITE, size: 'sm', pause: 0 },

  { text: "We've decrypted their system.", color: WHITE, size: 'md', pause: 600 },
  { text: "And now we're going to fight back.", color: GOLD, size: 'md', emphasis: true, pause: 2500 },
];

export default function OpeningCrawl({ onComplete, onSkip }: OpeningCrawlProps) {
  const [visibleLines, setVisibleLines] = useState<number[]>([]);
  const [typingLine, setTypingLine] = useState<number | null>(null);
  const [charCounts, setCharCounts] = useState<{ [key: number]: number }>({});
  const [showCursor, setShowCursor] = useState(true);
  const [showLogo, setShowLogo] = useState(false);
  const [showPillars, setShowPillars] = useState(false);
  const [showCTA, setShowCTA] = useState(false);
  const [showStats, setShowStats] = useState(false);
  const [unredactedLines, setUnredactedLines] = useState<Set<number>>(new Set());

  // Cursor blink
  useEffect(() => {
    const interval = setInterval(() => {
      setShowCursor(prev => !prev);
    }, 530);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    let currentTime = 0;
    const timeouts: NodeJS.Timeout[] = [];

    TERMINAL_LINES.forEach((line, index) => {
      // Start typing this line
      const startTypingTimeout = setTimeout(() => {
        setTypingLine(index);
        setVisibleLines(prev => [...prev, index]);

        // Typewriter effect
        const chars = line.text.length;
        const typeSpeed = line.text.length === 0 ? 0 : 55; // 55ms per character

        if (chars === 0) {
          // Blank line - instant
          setCharCounts(prev => ({ ...prev, [index]: 0 }));
          setTimeout(() => setTypingLine(null), 50);
        } else if (line.redacted) {
          // Show as redacted blocks first
          setCharCounts(prev => ({ ...prev, [index]: -1 })); // -1 = show redacted
          setTimeout(() => {
            setTypingLine(null);
            // Then unredact after pause
            setTimeout(() => {
              setUnredactedLines(prev => new Set([...prev, index]));
              // Type out the real text
              for (let i = 0; i <= chars; i++) {
                const charTimeout = setTimeout(() => {
                  setCharCounts(prev => ({ ...prev, [index]: i }));
                  if (i === chars) {
                    setTimeout(() => setTypingLine(null), 100);
                  }
                }, i * typeSpeed);
                timeouts.push(charTimeout);
              }
            }, 800); // Delay before unredacting
          }, 100);
        } else {
          for (let i = 0; i <= chars; i++) {
            const charTimeout = setTimeout(() => {
              setCharCounts(prev => ({ ...prev, [index]: i }));

              // When typing completes, dim previous lines
              if (i === chars) {
                setTimeout(() => {
                  setTypingLine(null);
                }, 100);
              }
            }, i * typeSpeed);
            timeouts.push(charTimeout);
          }
        }
      }, currentTime);

      timeouts.push(startTypingTimeout);
      currentTime += (line.text.length * 55) + line.pause + (line.redacted ? 1000 : 0);
    });

    // Show logo after all lines
    const logoTimeout = setTimeout(() => {
      setShowLogo(true);
    }, currentTime + 500);
    timeouts.push(logoTimeout);

    // Show pillars
    const pillarsTimeout = setTimeout(() => {
      setShowPillars(true);
    }, currentTime + 1500);
    timeouts.push(pillarsTimeout);

    // Show CTA
    const ctaTimeout = setTimeout(() => {
      setShowCTA(true);
    }, currentTime + 2500);
    timeouts.push(ctaTimeout);

    // Show stats
    const statsTimeout = setTimeout(() => {
      setShowStats(true);
    }, currentTime + 3500);
    timeouts.push(statsTimeout);

    // Auto-complete
    const completeTimeout = setTimeout(() => {
      onComplete();
    }, currentTime + 7000);
    timeouts.push(completeTimeout);

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [onComplete]);

  const getFontSize = (size: string) => {
    switch (size) {
      case 'sm': return 'clamp(0.75rem, 1.2vw, 0.9rem)';
      case 'md': return 'clamp(1.1rem, 2vw, 1.5rem)';
      case 'lg': return 'clamp(1.6rem, 3.2vw, 2.4rem)';
      case 'xl': return 'clamp(2rem, 4vw, 3rem)';
      default: return 'clamp(1.1rem, 2vw, 1.5rem)';
    }
  };

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: BG,
        overflow: 'hidden',
        zIndex: 9999,
      }}
    >
      {/* VS Code terminal panel tabs */}
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          right: 0,
          backgroundColor: '#1e1e1e',
          borderBottom: '1px solid #2d2d2d',
          zIndex: 100,
        }}
      >
        {/* Tab bar */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            height: '35px',
            borderBottom: '1px solid #2d2d2d',
          }}
        >
          {['PROBLEMS', 'OUTPUT', 'DEBUG CONSOLE', 'TERMINAL', 'PORTS'].map((tab) => (
            <div
              key={tab}
              style={{
                ...MFONT,
                padding: '0 12px',
                height: '100%',
                display: 'flex',
                alignItems: 'center',
                fontSize: '11px',
                letterSpacing: '0.02em',
                color: tab === 'TERMINAL' ? '#ffffff' : '#858585',
                backgroundColor: tab === 'TERMINAL' ? '#1e1e1e' : 'transparent',
                borderBottom: tab === 'TERMINAL' ? `2px solid ${GOLD}` : 'none',
                cursor: 'default',
              }}
            >
              {tab}
            </div>
          ))}
        </div>
        {/* Title bar with macOS-style dots */}
        <div
          style={{
            ...MFONT,
            fontSize: '12px',
            color: '#858585',
            padding: '6px 12px',
            letterSpacing: '0.02em',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
          }}
        >
          <div style={{ display: 'flex', gap: '6px' }}>
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#ff5f57' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#febc2e' }} />
            <div style={{ width: '12px', height: '12px', borderRadius: '50%', backgroundColor: '#28c840' }} />
          </div>
          <span>RECLAIM — CLASSIFIED FEED</span>
        </div>
      </div>

      {/* Subtle scanline overlay - very light */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0.03) 0px, transparent 1px, transparent 2px, rgba(0,0,0,0.03) 3px)',
          pointerEvents: 'none',
          opacity: 0.4,
          zIndex: 10,
        }}
      />

      {/* Skip button - VS Code style */}
      <button
        onClick={onSkip}
        style={{
          position: 'absolute',
          top: '8px',
          right: '16px',
          padding: '6px 16px',
          backgroundColor: '#3c3c3c',
          border: '1px solid #454545',
          color: '#cccccc',
          ...MFONT,
          fontSize: '12px',
          letterSpacing: '0.02em',
          cursor: 'pointer',
          borderRadius: '3px',
          transition: 'all 0.15s',
          zIndex: 1000,
        }}
        onMouseEnter={e => {
          e.currentTarget.style.backgroundColor = '#505050';
          e.currentTarget.style.borderColor = '#5a5a5a';
        }}
        onMouseLeave={e => {
          e.currentTarget.style.backgroundColor = '#3c3c3c';
          e.currentTarget.style.borderColor = '#454545';
        }}
      >
        Skip
      </button>

      {/* Terminal container - single viewport, no scrolling */}
      {!showLogo && (
        <div
          style={{
            position: 'absolute',
            top: '88px',
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: BG,
            padding: '20vh 48px 80px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-start',
            overflow: 'hidden',
          }}
        >
          <div style={{ textAlign: 'left' }}>
            {TERMINAL_LINES.map((line, index) => {
              const isVisible = visibleLines.includes(index);
              const isTyping = typingLine === index;
              const charCount = charCounts[index] || 0;
              const isRedacted = line.redacted && charCount === -1;
              const isUnredacted = unredactedLines.has(index);
              const displayText = isRedacted ? '█'.repeat(line.text.length) : line.text.substring(0, charCount);
              const isComplete = charCount === line.text.length;
              const isPrevious = isVisible && !isTyping && isComplete;

              if (!isVisible) return null;

              // Calculate how many lines back from current
              const currentTypingIndex = typingLine !== null ? typingLine : visibleLines[visibleLines.length - 1] || 0;
              const distanceFromCurrent = currentTypingIndex - index;

              // Hide lines more than 12 back
              if (distanceFromCurrent > 12) return null;

              // Blank line
              if (line.text.length === 0) {
                return <div key={index} style={{ height: '0.6em' }} />;
              }

              // Opacity: current line = 1, previous lines = 0.4
              const opacity = isPrevious ? DIMMED_OPACITY : 1;

              return (
                <div
                  key={index}
                  style={{
                    ...MFONT,
                    fontSize: getFontSize(line.size || 'md'),
                    lineHeight: 1.5,
                    color: isRedacted ? '#666666' : line.color,
                    opacity,
                    marginBottom: '0.2em',
                    fontStyle: line.italic ? 'italic' : 'normal',
                    fontWeight: line.emphasis ? 400 : 300,
                    letterSpacing: isRedacted ? '-0.15em' : line.size === 'sm' ? '0.02em' : line.emphasis ? '-0.01em' : '0',
                    transition: 'opacity 0.3s ease',
                  }}
                >
                  ● {displayText}
                  {isTyping && charCount < line.text.length && showCursor && !isRedacted && (
                    <span
                      style={{
                        display: 'inline',
                        color: GOLD,
                        marginLeft: '1px',
                      }}
                    >
                      ▊
                    </span>
                  )}
                </div>
              );
            })}

            {/* Prompt at bottom */}
            <div
              style={{
                ...MFONT,
                fontSize: getFontSize('md'),
                lineHeight: 1.5,
                color: WHITE,
                marginTop: '1.5em',
              }}
            >
              {'>'}
              {showCursor && (
                <span style={{ color: GOLD, marginLeft: '4px' }}>▊</span>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Logo reveal - fade in and center */}
      {showLogo && (
        <div
          style={{
            position: 'absolute',
            top: '88px',
            left: '0',
            right: '0',
            bottom: 0,
            padding: '10vh 48px 0',
            textAlign: 'center',
            animation: 'fadeIn 1.5s ease-out',
            backgroundColor: BG,
          }}
        >

          <img
            src={reclaimLogo}
            alt="Reclaim"
            style={{
              width: 'min(520px, 85vw)',
              height: 'auto',
              marginBottom: showPillars ? '2rem' : '0',
              transition: 'margin 0.6s ease',
            }}
          />

          {showPillars && (
            <>
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  width: 'min(520px, 85vw)',
                  margin: '0 auto',
                  animation: 'fadeIn 1s ease-out',
                }}
              >
                {['Home', 'Money', 'Rights', 'Community'].map((pillar, i) => (
                  <span
                    key={pillar}
                    style={{
                      ...MFONT,
                      color: '#cccccc',
                      fontSize: '13px',
                      letterSpacing: '0.15em',
                      textTransform: 'uppercase',
                      animation: `fadeIn 0.6s ease-out ${i * 0.1}s backwards`,
                    }}
                  >
                    {pillar}
                  </span>
                ))}
              </div>
              <div
                style={{
                  width: 'min(120px, 20vw)',
                  height: '1px',
                  backgroundColor: GOLD,
                  margin: '2.5rem auto',
                  animation: 'fadeIn 1s ease-out 0.5s backwards',
                }}
              />
            </>
          )}

          {showCTA && (
            <div style={{ display: 'flex', gap: '20px', justifyContent: 'center', marginTop: '2rem', animation: 'fadeIn 0.8s ease-out' }}>
              <button
                onClick={onComplete}
                style={{
                  ...MFONT,
                  padding: '12px 32px',
                  backgroundColor: GOLD,
                  color: '#1e1e1e',
                  border: 'none',
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#FFBD4A';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = GOLD;
                }}
              >
                Enter Platform
              </button>
              <button
                onClick={() => window.location.href = 'mailto:information@startreclaiming.com?subject=Reclaim%20Demo%20Request'}
                style={{
                  ...MFONT,
                  padding: '12px 32px',
                  backgroundColor: '#3c3c3c',
                  color: '#cccccc',
                  border: '1px solid #454545',
                  borderRadius: '2px',
                  fontSize: '13px',
                  fontWeight: 600,
                  letterSpacing: '0.02em',
                  cursor: 'pointer',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.backgroundColor = '#505050';
                  e.currentTarget.style.borderColor = '#5a5a5a';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.backgroundColor = '#3c3c3c';
                  e.currentTarget.style.borderColor = '#454545';
                }}
              >
                Schedule Demo
              </button>
            </div>
          )}

          {showStats && (
            <div
              style={{
                marginTop: '4rem',
                display: 'flex',
                gap: '3rem',
                justifyContent: 'center',
                flexWrap: 'wrap',
                animation: 'fadeIn 1s ease-out',
              }}
            >
              {[
                { value: '$3,200/yr', label: 'drained per household' },
                { value: '$42B fees', label: 'in bank fees annually' },
                { value: '77%', label: 'live paycheck to paycheck' },
                { value: '1 in 3', label: "can't cover $400" },
              ].map((stat, i) => (
                <div
                  key={i}
                  style={{
                    textAlign: 'center',
                    animation: `fadeIn 0.6s ease-out ${i * 0.15}s backwards`,
                  }}
                >
                  <div
                    style={{
                      ...MFONT,
                      fontSize: 'clamp(2.5rem, 5vw, 4rem)',
                      fontWeight: 600,
                      color: GOLD,
                      lineHeight: 1,
                      letterSpacing: '-0.01em',
                      marginBottom: '0.5rem',
                    }}
                  >
                    {stat.value}
                  </div>
                  <div
                    style={{
                      ...MFONT,
                      fontSize: 'clamp(0.7rem, 1vw, 0.85rem)',
                      color: '#858585',
                      letterSpacing: '0.02em',
                    }}
                  >
                    {stat.label}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
}
