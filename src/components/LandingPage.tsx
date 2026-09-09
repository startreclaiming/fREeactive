import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
// The project does not provide TypeScript declarations for CSS side-effect imports.
// @ts-expect-error CSS is handled by the bundler at runtime.
import './LandingPage.css';

const A = (file: string) => `/${file}`;

interface LandingPageProps {
  /** Enter the app as a guest — no account required. */
  onCTA: () => void;
  /** Explicit "I already have an account" path — the only route to the sign-in screen. */
  onSignIn?: () => void;
  onCheck?: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onCTA, onSignIn }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const navRef  = useRef<HTMLElement>(null);
  const [chooserOpen, setChooserOpen] = useState(false);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

  // A phone that scans this lands directly in the Ubiquitous Capture Hub (guest mode) —
  // device-based routing in App.tsx sends any mobile hit on "/" straight there.
  useEffect(() => {
    QRCode.toDataURL(window.location.origin + '/', { margin: 1, width: 240, color: { dark: '#181818', light: '#ffffff' } })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(null));
  }, []);

  useEffect(() => {
    const nav = navRef.current;
    const onScroll = () => { if (nav) nav.classList.toggle('scrolled', window.scrollY > 60); };
    window.addEventListener('scroll', onScroll, { passive: true });

    const scope: ParentNode = rootRef.current ?? document;
    const fadeEls = scope.querySelectorAll<HTMLElement>('.fade-up');
    const obs = new IntersectionObserver(
      (entries) => { entries.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); } }); },
      { threshold: 0.12 }
    );
    fadeEls.forEach((el) => obs.observe(el));
    return () => { window.removeEventListener('scroll', onScroll); obs.disconnect(); };
  }, []);

  const contactUs  = () => { window.location.href = 'mailto:information@startreclaiming.com?subject=' + encodeURIComponent('Reclaim — Contact / Request more information'); };
  const enterAsGuest = () => { setChooserOpen(false); onCTA(); };
  const signIn       = () => { setChooserOpen(false); onSignIn?.(); };

  // Consistent inline SVGs — same 48×48 viewBox, same 2px gold stroke, no raster variance.
  const ICON_HOME = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <path d="M8 24L24 10L40 24V40H29V30H19V40H8V24Z" stroke="#f0a700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="20" y1="40" x2="28" y2="40" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
  const ICON_MONEY = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <rect x="10" y="8" width="24" height="32" rx="2" stroke="#f0a700" strokeWidth="2" strokeLinejoin="round"/>
      <path d="M34 10L40 10V16" stroke="#f0a700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M40 32V38H34" stroke="#f0a700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="6"  y1="24" x2="44" y2="24" stroke="#f0a700" strokeWidth="1.5" strokeDasharray="3 2" strokeLinecap="round"/>
      <line x1="15" y1="18" x2="29" y2="18" stroke="#f0a700" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="15" y1="22" x2="25" y2="22" stroke="#f0a700" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
  const ICON_RIGHTS = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <line x1="24" y1="8"  x2="24" y2="40" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
      <line x1="14" y1="40" x2="34" y2="40" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
      <line x1="10" y1="16" x2="38" y2="16" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
      <path d="M10 16L6 26H14L10 16Z"  stroke="#f0a700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M38 16L34 26H42L38 16Z" stroke="#f0a700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
  const ICON_COMMUNITY = (
    <svg width="48" height="48" viewBox="0 0 48 48" fill="none" aria-hidden="true">
      <circle cx="24" cy="14" r="6"  stroke="#f0a700" strokeWidth="2"/>
      <path d="M13 40C13 33.4 18 28 24 28C30 28 35 33.4 35 40" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="10" cy="18" r="4"  stroke="#f0a700" strokeWidth="2"/>
      <path d="M3 38C3 33 6.1 29 10 29"  stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
      <circle cx="38" cy="18" r="4"  stroke="#f0a700" strokeWidth="2"/>
      <path d="M45 38C45 33 41.9 29 38 29" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );

  const modules = [
    { href: '#home-mod',      name: 'Home',      img: 'home',      lines: ['Smart Maintenance.',      'Peace of mind.'],        icon: ICON_HOME,      gold: false },
    { href: '#money-mod',     name: 'Money',     img: 'money',     lines: ['Scan your bill.',         'Secure the refund.'],    icon: ICON_MONEY,     gold: true  },
    { href: '#rights-mod',    name: 'Resolve',   img: 'rights',    lines: ['Exercise your rights.',   "It's your system."],     icon: ICON_RIGHTS,    gold: false },
    { href: '#community-mod', name: 'Community', img: 'community', lines: ['Better together,',        'safer together.'],       icon: ICON_COMMUNITY, gold: false },
  ];

  return (
    <div className="reclaim-landing" ref={rootRef}>

      {/* ─── NAV ──────────────────────────────────────────────── */}
      <nav id="nav" ref={navRef}>
        <a href="#" style={{ display: 'flex', alignItems: 'center' }}>
          <img src={A('reclaim-chevron-transparent.png')} alt="Reclaim" className="nav-logo"
            style={{ height: '32px', width: 'auto', transition: 'opacity 0.2s' }}
            onMouseOver={(e: React.MouseEvent<HTMLImageElement>) => (e.currentTarget.style.opacity = '0.7')}
            onMouseOut={(e: React.MouseEvent<HTMLImageElement>)  => (e.currentTarget.style.opacity = '1')} />
        </a>
        <div className="nav-links">
          <a href="#home-mod"      className="nav-link">Home</a>
          <a href="#money-mod"     className="nav-link">Money</a>
          <a href="#rights-mod"    className="nav-link">Resolve</a>
          <a href="#community-mod" className="nav-link">Community</a>
          <button type="button" className="nav-cta" onClick={() => setChooserOpen(true)}>Continue to Site</button>
        </div>
      </nav>

      {/* ─── HERO ─────────────────────────────────────────────── */}
      <section className="hero">
        <img src={A('reclaim-chevron-transparent.png')} className="hero-deco"      alt="" />
        <img src={A('reclaim-chevron-transparent.png')} className="hero-deco-left" alt="" />

        <h1 className="hero-tagline fade-up" style={{ color: '#f5a623' }}>Take Aim. Reclaim</h1>

        {/* Stats strip */}
        <div className="hero-stats fade-up" data-delay="1">
          <div className="hero-stat">
            <span className="hero-stat-num">$165B</span>
            <span className="hero-stat-desc">&ldquo;Annoyance Economy&rdquo; — 100hrs trapped within</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">$2.5B</span>
            <span className="hero-stat-desc">Unused warranties due to lost paperwork</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num" style={{ color: '#e05c5c' }}>– $1,222</span>
            <span className="hero-stat-desc">Lost to hidden fees, taxes and vampire charges</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">75%</span>
            <span className="hero-stat-desc">Americans do not know their neighbors</span>
          </div>
          <div className="hero-stat-divider" />
          <div className="hero-stat">
            <span className="hero-stat-num">40%</span>
            <span className="hero-stat-desc">American adults fear walking alone at night</span>
          </div>
        </div>

        <p className="hero-sub fade-up" data-delay="2">
          Delivering peace of mind so you can focus on what matters most, Reclaim is the
          operating system for American households. Four AI&nbsp;powered modules in one app.
        </p>

        {qrDataUrl && (
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 16,
            background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(240,167,0,0.25)',
            borderRadius: 16, padding: '14px 20px', margin: '8px auto 0',
          }}>
            <img src={qrDataUrl} alt="Scan to open Reclaim on your phone" width={96} height={96} style={{ borderRadius: 8 }} />
            <div style={{ textAlign: 'left' }}>
              <p style={{ margin: 0, fontWeight: 700, color: '#fff', fontSize: 14 }}>Scan to open on your phone</p>
              <p style={{ margin: '4px 0 0', color: 'rgba(255,255,255,0.5)', fontSize: 12, maxWidth: 220 }}>
                Goes straight to Scan / Talk / Type — no download, no account.
              </p>
            </div>
          </div>
        )}

        {/* Product mockups — one phone per module */}
        <div className="hero-phones" style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: '16px', flexWrap: 'wrap', width: '100%', maxWidth: '1120px', margin: '8px auto 0' }}>
          {modules.map((m) => (
            <a key={m.name} href={m.href} title={m.name} style={{ display: 'block' }}>
              <img src={A(`reclaim-phone-${m.img}.png`)} alt={`${m.name} module`} style={{ height: '380px', width: 'auto', display: 'block' }} />
            </a>
          ))}
        </div>

        <div className="scroll-indicator">
          <div className="scroll-line"></div>
          <span className="scroll-label">Explore</span>
        </div>
      </section>

      {/* ─── HOW IT WORKS ─────────────────────────────────────── */}
      <section className="intake-section">
        <p className="intake-eyebrow fade-up">How it works</p>
        <h2 className="intake-h fade-up" data-delay="1">Three ways in.<br />One AI brain.</h2>
        <p className="intake-sub fade-up" data-delay="2">
          Reclaim removes the guesswork. However you share a problem, the AI takes it from there.
        </p>

        <div className="intake-cards">
          <div className="intake-card fade-up" data-delay="1">
            <div className="intake-card-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <path d="M4 4h7M21 4h7M4 21v7M25 21v7M9 9h14v14H9z" stroke="#f0a700" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                <line x1="4" y1="16" x2="28" y2="16" stroke="#f0a700" strokeWidth="1.5" strokeDasharray="3 2" opacity="0.5"/>
              </svg>
            </div>
            <h3 className="intake-card-title">Scan or upload</h3>
            <p className="intake-card-desc">Point your camera at any bill, invoice, statement or letter. Reclaim's AI reads every line and looks for what you'd miss.</p>
          </div>
          <div className="intake-card fade-up" data-delay="2">
            <div className="intake-card-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="11" y="3" width="10" height="16" rx="5" stroke="#f0a700" strokeWidth="2"/>
                <path d="M6 16a10 10 0 0020 0" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
                <line x1="16" y1="26" x2="16" y2="30" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
                <line x1="11" y1="30" x2="21" y2="30" stroke="#f0a700" strokeWidth="2" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="intake-card-title">Speak</h3>
            <p className="intake-card-desc">Tell Reclaim what's wrong — a leaking pipe, a suspicious charge, a letter you don't understand. AI hears it and routes it.</p>
          </div>
          <div className="intake-card fade-up" data-delay="3">
            <div className="intake-card-icon">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                <rect x="3" y="7" width="26" height="18" rx="3" stroke="#f0a700" strokeWidth="2"/>
                <line x1="8"  y1="13" x2="24" y2="13" stroke="#f0a700" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8"  y1="17" x2="20" y2="17" stroke="#f0a700" strokeWidth="1.5" strokeLinecap="round"/>
                <line x1="8"  y1="21" x2="16" y2="21" stroke="#f0a700" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
            </div>
            <h3 className="intake-card-title">Type</h3>
            <p className="intake-card-desc">Describe the problem in plain language. AI determines what kind of issue it is and takes you straight to the right action.</p>
          </div>
        </div>


      </section>

      {/* ─── MODULE 1: HOME ───────────────────────────────────── */}
      <div className="module-divider"></div>
      <section className="module module--dark" id="home-mod">
        <div className="module-wrap">
          <div className="module-copy">
            <p className="module-label fade-up" data-delay="0"><span className="module-label-line"></span>01 / Home</p>
            <h2 className="module-h fade-up" data-delay="1">Anticipate the failure.<br />Prevent the insurance claim.</h2>
            <p className="module-desc fade-up" data-delay="2">
              Scan a serial number, speak a problem, or type what's broken. Reclaim logs it, tracks
              the warranty, flags what's due for service, and helps you stay ahead of the failure
              before it becomes a claim — or an emergency.
            </p>
          </div>
          <div className="module-visual">
            <div className="module-bg-num">01</div>
            <div className="home-visual fade-up" data-delay="2">
              <img className="home-visual-photo"
                src="https://images.unsplash.com/photo-1484154218962-a197022b5858?w=900&q=80&fit=crop&auto=format"
                alt="Modern kitchen" />
              <div className="home-visual-overlay"></div>
              <div className="home-label-badge">
                <div className="home-label-badge-title">Household Inventory</div>
                <div className="home-label-badge-sub">12 appliances tracked</div>
              </div>
              <div className="home-phone">
                <div className="home-phone-frame">
                  <div className="home-phone-screen">
                    <div className="home-phone-statusbar"><span>9:41</span><span>●●●</span></div>
                    <div className="home-phone-viewfinder">
                      <img className="home-phone-viewfinder-img"
                        src="https://images.unsplash.com/photo-1556911220-bff31c812dba?w=400&q=70&fit=crop&auto=format"
                        alt="Oven" />
                      <div className="scan-frame">
                        <div className="scan-box"><span></span><div className="scan-line"></div></div>
                      </div>
                      <div className="scan-tag">Samsung — Oven</div>
                    </div>
                    <div className="home-phone-bottombar"><div className="home-phone-bottombar-pill"></div></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODULE 2: MONEY ──────────────────────────────────── */}
      <div className="module-divider dark-on-light"></div>
      <section className="module module--light" id="money-mod">
        <div className="module-wrap flip">
          <div className="module-copy">
            <p className="module-label fade-up" data-delay="0"><span className="module-label-line"></span>02 / Money</p>
            <h2 className="module-h fade-up" data-delay="1">Vampire charges drain your money quietly.<br />Reclaim makes them visible.</h2>
            <p className="module-desc fade-up" data-delay="2">
              Billing errors, duplicate charges, unused subscriptions, rate hikes buried in the fine
              print. Scan any document and Reclaim returns a verdict — along with exactly which
              charges to dispute and how to get your money back.
            </p>

          </div>
          <div className="module-visual">
            <div className="module-bg-num">02</div>
            <div className="money-visual fade-up" data-delay="2">
              <svg viewBox="0 0 560 448" fill="none" xmlns="http://www.w3.org/2000/svg"
                style={{ width: '100%', height: 'auto', display: 'block' }}>
                <rect x="40" y="24"  width="480" height="400" rx="16" fill="#f7f7f5" stroke="#e2e2de" strokeWidth="1.5" />
                <rect x="40" y="24"  width="480" height="72"  rx="16" fill="#1a1a1a" />
                <rect x="40" y="72"  width="480" height="24"        fill="#1a1a1a" />
                <text x="72"  y="68"  fontFamily="'DM Sans',sans-serif" fontSize="22" fontWeight="600" fill="white">INVOICE #4821</text>
                <text x="380" y="68"  fontFamily="'DM Sans',sans-serif" fontSize="13" fill="rgba(255,255,255,0.5)">Healthcare · 2026</text>
                <text x="72"  y="132" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#666">Procedure fee</text>
                <text x="460" y="132" textAnchor="end" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#1a1a1a">$1,240.00</text>
                <line x1="72" y1="142" x2="488" y2="142" stroke="#e8e8e5" strokeWidth="1" />
                <text x="72"  y="166" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#666">Facility charge</text>
                <text x="460" y="166" textAnchor="end" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#1a1a1a">$380.00</text>
                <line x1="72" y1="176" x2="488" y2="176" stroke="#e8e8e5" strokeWidth="1" />
                <text x="72"  y="200" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#e05c5c" fontWeight="600">⚠ Vampire charge — duplicate billing</text>
                <text x="460" y="200" textAnchor="end" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#e05c5c">$380.00</text>
                <line x1="72" y1="210" x2="488" y2="210" stroke="#e8e8e5" strokeWidth="1" />
                <text x="72"  y="238" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#999">Subtotal</text>
                <text x="460" y="238" textAnchor="end" fontFamily="'DM Sans',sans-serif" fontSize="13" fill="#1a1a1a">$2,000.00</text>
                <line x1="72" y1="252" x2="488" y2="252" stroke="#d0d0cc" strokeWidth="1.5" />
                <text x="72"  y="278" fontFamily="'DM Sans',sans-serif" fontSize="15" fontWeight="600" fill="#1a1a1a">Total Due</text>
                <text x="460" y="278" textAnchor="end" fontFamily="'DM Sans',sans-serif" fontSize="15" fontWeight="600" fill="#1a1a1a">$2,000.00</text>
                <g transform="translate(280,260) rotate(-18)">
                  <rect x="-110" y="-36" width="220" height="72" rx="8" fill="none" stroke="#f0a700" strokeWidth="4" />
                  <text x="0" y="14" textAnchor="middle" fontFamily="'Barlow Condensed',sans-serif" fontSize="44" fontWeight="700" fill="#f0a700" letterSpacing="4">REFUNDED</text>
                </g>
                <rect x="72" y="308" width="416" height="60" rx="10" fill="#1a1a1a" />
                <text x="100" y="344" fontFamily="'DM Sans',sans-serif" fontSize="14" fill="rgba(255,255,255,0.55)">Amount returned to you</text>
                <text x="460" y="344" textAnchor="end" fontFamily="'Barlow Condensed',sans-serif" fontSize="26" fontWeight="600" fill="#f0a700">+ $380.00</text>
                <circle cx="456" cy="392" r="28" fill="#f0a700" />
                <circle cx="447" cy="387" r="3.5" fill="#1a1a1a" />
                <circle cx="465" cy="387" r="3.5" fill="#1a1a1a" />
                <path d="M447 400 Q456 410 465 400" stroke="#1a1a1a" strokeWidth="2.5" strokeLinecap="round" fill="none" />
                <text x="100" y="396" fontFamily="'Barlow Condensed',sans-serif" fontSize="11" letterSpacing="2" fill="#999">RECLAIM FOUND THIS FOR YOU</text>
              </svg>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODULE 3: RIGHTS ─────────────────────────────────── */}
      <div className="module-divider"></div>
      <section className="module module--dark" id="rights-mod">
        <div className="module-wrap">
          <div className="module-copy">
            <p className="module-label fade-up" data-delay="0"><span className="module-label-line"></span>03 / Resolve</p>
            <h2 className="module-h fade-up" data-delay="1">Navigate with confidence.<br />Understand what you're entitled to.</h2>
            <p className="module-desc fade-up" data-delay="2">
              Americans lost $12.5 billion to fraud in 2024 — up 25% in a single year. Reclaim
              gives every household the AI-backed clarity to navigate insurance claims, tenancy
              disputes, healthcare billing, and legal situations correctly. Fewer costly mistakes.
              Better outcomes. The system working the way it was designed to.
            </p>
          </div>
          <div className="module-visual">
            <div className="module-bg-num">03</div>
            <div className="rights-photo-visual fade-up" data-delay="2">
              <img className="rights-photo-bg"
                src="https://images.unsplash.com/photo-1589994965851-a8f479c573a9?w=900&q=80&fit=crop&auto=format"
                alt="Courthouse" />
              <div className="rights-photo-overlay"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── MODULE 4: COMMUNITY ──────────────────────────────── */}
      <section className="module module--gold" id="community-mod">
        <img src={A('reclaim-chevron-transparent.png')} className="module--gold-deco" alt="" />
        <div className="module-wrap">
          <div className="module-copy">
            <p className="module-label fade-up" data-delay="0"><span className="module-label-line"></span>04 / Community</p>
            <h2 className="module-h fade-up" data-delay="1">Reconnect.<br />Recalibrate.<br />Reclaim your community.</h2>
            <p className="module-desc fade-up" data-delay="2">
              The strongest households don't stand alone. Connect with neighbors, coordinate care, and
              rebuild the fabric that makes communities genuinely resilient.
            </p>
          </div>
          <div className="module-visual">
            <div className="module-bg-num">04</div>
            <div className="community-photo-visual fade-up" data-delay="2">
              <img className="community-photo-bg" src={A('community.png')} alt="Community" />
              <div className="community-photo-overlay"></div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── PARTNERS ─────────────────────────────────────────── */}
      <section className="partners">
        <p className="partners-eyebrow fade-up">Built for homeowners. Distributed by partners.</p>
        <h3 className="partners-headline fade-up" data-delay="1">
          State Farm improves loss ratios. Kaiser reduces billing disputes.<br />Realtors close better-prepared buyers.
        </h3>
        <div className="partners-list fade-up" data-delay="2">
          <span className="partner">State Farm</span>
          <span className="partner">Kaiser Permanente</span>
          <span className="partner">USAA</span>
          <span className="partner">Redfin</span>
          <span className="partner">Keller Williams</span>
        </div>
      </section>

      {/* ─── CTA ──────────────────────────────────────────────── */}
      <section className="cta-section" id="get-access">
        <img src={A('reclaim-chevron-transparent.png')} className="cta-deco" alt="" />
        <p className="cta-eyebrow fade-up">Early Access</p>
        <h2 className="cta-headline fade-up" data-delay="1">Reclaim what's yours.</h2>
        <div className="cta-form fade-up" data-delay="2">
          <button type="button" className="cta-btn-submit" onClick={() => setChooserOpen(true)}>Continue to Site</button>
        </div>
        <p className="cta-note fade-up" data-delay="3">No spam. Just clarity.</p>
      </section>

      {/* ─── FOOTER ───────────────────────────────────────────── */}
      <footer>
        <img src={A('reclaim-chevron-transparent.png')} alt="Reclaim" className="footer-logo" />
        <div className="footer-links">
          <a href="#" className="footer-link">Privacy</a>
          <a href="#" className="footer-link">Terms</a>
          <a href="#" className="footer-link">Contact</a>
          <a href="#" className="footer-link">Partners</a>
        </div>
        <p className="footer-copy">© 2026 Reclaim. All rights reserved.</p>
      </footer>

      {/* ─── CHOOSER ──────────────────────────────────────────── */}
      {chooserOpen && (
        <div className="chooser-backdrop" onClick={() => setChooserOpen(false)}>
          <div className="chooser-card" onClick={(e: React.MouseEvent<HTMLDivElement>) => e.stopPropagation()}>
            <button type="button" className="chooser-close" aria-label="Close" onClick={() => setChooserOpen(false)}>×</button>
            <p className="chooser-eyebrow">Welcome to Reclaim</p>
            <h3 className="chooser-title">How would you like to continue?</h3>
            <button type="button" className="chooser-btn chooser-btn-secondary" onClick={enterAsGuest}>Open the app — no account needed</button>
            {onSignIn && (
              <button type="button" className="chooser-btn chooser-btn-secondary" onClick={signIn}>Already have an account? Sign in</button>
            )}
            <button type="button" className="chooser-btn chooser-btn-secondary" onClick={contactUs}>Contact Us / Request more information</button>
          </div>
        </div>
      )}
    </div>
  );
};

export default LandingPage;
