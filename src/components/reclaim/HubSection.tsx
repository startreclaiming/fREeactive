import React, { useRef, useState, useCallback } from 'react';
import {
  DollarSign, Scale, Users, ArrowRight, ScanLine, Loader2,
  Sparkles, Mic, Send, ShieldCheck, AlertTriangle, Droplet,
  Wrench, ChevronRight, X,
} from 'lucide-react';
import { readStored, useStored, uid } from './moduleUtils';
import { scanDocument, BillScan, Verdict } from './BillScanner';
import CompletionPrompt from './CompletionPrompt';
import { trackEvent, Pillar } from '@/lib/usageTracking';
import { useEntitlement } from '@/lib/entitlement';
import './modules.css';

const GOLD = '#f0a700';
const fmt = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });

type AnyRec = Record<string, unknown>;

type Action = { label: string; section?: string; primary?: boolean };
type RouteResult = {
  module: Pillar;
  confirmation: string;
  actions: Action[];
};
type ScanRecord = {
  id: string; date: string; kind: string; vendor: string;
  amount: number | null; verdict: Verdict; flags: { label: string; reason: string }[];
};

const VERDICT_META: Record<Verdict, { dot: string; bg: string; border: string; fg: string; title: string; icon: React.ReactNode }> = {
  clear:   { dot: '#16a34a', bg: '#eafaf0', border: '#bfe8cf', fg: '#11633a', title: 'No vampires found',   icon: <ShieldCheck className="w-4 h-4" /> },
  review:  { dot: GOLD,      bg: '#fffbe9', border: '#fae0a8', fg: '#8a6200', title: 'Confirm these charges', icon: <AlertTriangle className="w-4 h-4" /> },
  vampire: { dot: '#dc2626', bg: '#fdeaea', border: '#f5c2c2', fg: '#a31515', title: 'Vampires found',       icon: <Droplet className="w-4 h-4" /> },
};

const PATTERNS: [Pillar, RegExp][] = [
  ['money',    /\b(bill|charge|fee|payment|subscription|invoice|receipt|bank|credit|debit|overcharg|money|owe|paid|refund|dollar|pound|cost|price)\b/i],
  ['home',     /\b(leak|broke|broken|fix|repair|appliance|boiler|plumb|heat|cool|roof|pipe|furnace|hvac|water heater|washing|dishwasher|fridge|damp|crack|door|window|lock)\b/i],
  ['resolve',  /\b(legal|rights|dispute|contract|notice|eviction|council|letter|claim|court|landlord|tenant|complaint|deadline|solicitor|sued|refusal)\b/i],
  ['community', /\b(neighbou?r|community|local|area|street|noise|parking|petition|block|council)\b/i],
];

const MODULE_ACTIONS: Record<Pillar, Action[]> = {
  money:      [{ label: 'Check for vampire charges', section: 'money', primary: true }, { label: 'Log it to Money', section: 'money' }, { label: 'Get AI advice', section: 'money' }],
  home:       [{ label: 'Help me diagnose this',     section: 'home', primary: true }, { label: 'Log it to Home', section: 'home' }, { label: 'Get AI advice', section: 'home' }],
  resolve:    [{ label: 'Understand my rights',      section: 'resolve', primary: true }, { label: 'Draft a response', section: 'resolve' }, { label: 'Log this issue', section: 'resolve' }],
  community:  [{ label: 'Get local advice',          section: 'community', primary: true }, { label: 'Log to Community', section: 'community' }],
  general:    [{ label: 'Check for overcharges',     section: 'money', primary: true }, { label: 'Log an issue', section: 'home' }, { label: 'Get AI advice', section: 'money' }],
};

function routeText(input: string): RouteResult {
  const found = PATTERNS.find(([, re]) => re.test(input));
  const module = found ? found[0] : 'general';
  const labels: Record<Pillar, string> = {
    money: 'a Money question', home: 'a Home issue',
    resolve: 'a Resolve matter', community: 'a Community topic', general: 'something I can help with',
  };
  return {
    module,
    confirmation: `It sounds like you have ${labels[module]}. Here's what I can do:`,
    actions: MODULE_ACTIONS[module],
  };
}

function routeScan(r: BillScan): RouteResult {
  const v = r.verdict ?? 'review';
  const m = VERDICT_META[v];
  const who = r.vendor ? ` from ${r.vendor}` : '';
  const amt = r.amount != null ? ` — ${fmt(r.amount)}` : '';
  const what = r.kind ? r.kind : 'document';
  const confirmation = `I've read your ${what}${who}${amt}. ${m.title}.`;
  const actions: Action[] =
    v === 'clear'
      ? [{ label: 'Log it to Money', section: 'money', primary: true }, { label: 'Dismiss', primary: false }]
      : v === 'vampire'
        ? [{ label: 'Fight this charge', section: 'money', primary: true }, { label: 'Log to Money', section: 'money' }, { label: 'Dismiss' }]
        : [{ label: 'Review charges in Money', section: 'money', primary: true }, { label: 'Log it', section: 'money' }, { label: 'Dismiss' }];
  return { module: 'money', confirmation, actions };
}

const HubSection: React.FC<{ onNavigate: (section: string) => void }> = ({ onNavigate }) => {
  const { isProActive } = useEntitlement();
  const charges  = readStored<AnyRec[]>('reclaim_money_charges', [], isProActive);
  const homeItems = readStored<AnyRec[]>('reclaim_home_items', [], isProActive);
  const [scans, setScans] = useStored<ScanRecord[]>('reclaim_scans', []);

  const recovered = charges
    .filter((c) => c.status === 'recovered')
    .reduce((s, c) => s + (c.frequency === 'monthly' ? Number(c.amount || 0) * 12 : Number(c.amount || 0)), 0);

  const vampireAlerts = scans.filter((s) => s.verdict === 'vampire').slice(0, 2);
  // HomeSection's Item stores purchaseDate + warrantyMonths, not a precomputed
  // warrantyExpiry field — derive the expiry date the same way HomeSection does.
  const expiringItems = homeItems
    .map((i) => {
      const purchaseDate = i.purchaseDate as string | undefined;
      const warrantyMonths = Number(i.warrantyMonths);
      if (!purchaseDate || !warrantyMonths) return null;
      const expiry = new Date(purchaseDate);
      expiry.setMonth(expiry.getMonth() + warrantyMonths);
      const days = (expiry.getTime() - Date.now()) / 86400000;
      return days >= 0 && days <= 30 ? { item: i, expiry } : null;
    })
    .filter((x): x is { item: AnyRec; expiry: Date } => x !== null)
    .slice(0, 2);

  const inputRef  = useRef<HTMLInputElement>(null);
  const textRef   = useRef<HTMLInputElement>(null);
  const [showType, setShowType]   = useState(false);
  const [inputText, setInputText] = useState('');
  const [scanning, setScanning]   = useState(false);
  const [scanMode, setScanMode]   = useState<'ai' | 'ocr'>('ai');
  const [scanProg, setScanProg]   = useState(0);
  const [listening, setListening] = useState(false);
  const [route, setRoute]         = useState<RouteResult | null>(null);
  const [scanRec, setScanRec]     = useState<ScanRecord | null>(null);
  const [error, setError]         = useState<string | null>(null);

  const handleScanFile = useCallback(async (file: File) => {
    setRoute(null); setScanRec(null); setError(null); setScanning(true);
    setScanMode('ai'); setScanProg(0);
    try {
      const r = await scanDocument(file, setScanMode, setScanProg);
      const verdict: Verdict = r.verdict ?? (r.flags?.some((f: any) => f.severity === 'dispute') ? 'vampire' : r.flags?.length ? 'review' : 'review');
      const rec: ScanRecord = { id: uid(), date: new Date().toISOString(), kind: r.kind || 'document', vendor: r.vendor || 'Unknown', amount: r.amount, verdict, flags: r.flags || [] };
      setScanRec(rec);
      setScans([rec, ...scans].slice(0, 50));
      const routed = routeScan(r);
      setRoute(routed);
      // No scan content (vendor, amount, verdict) in analytics — FREEactive is meant
      // to be single-shot instant analysis, not a place that quietly rebuilds a
      // content history for anonymous users, even in an insert-only events table.
      trackEvent('scan_completed', routed.module);
    } catch { setError('Could not read that one. Try a clearer, well-lit photo.'); }
    finally { setScanning(false); }
  }, [scans, setScans]);

  const handleText = useCallback(() => {
    const t = inputText.trim();
    if (!t) return;
    const routed = routeText(t);
    setRoute(routed);
    trackEvent('text_submitted', routed.module);
    setShowType(false);
    setInputText('');
  }, [inputText]);

  const handleSpeak = useCallback(() => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Voice not supported in this browser. Try typing instead.'); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onend   = () => setListening(false);
    r.onerror = () => { setListening(false); setError('Microphone not available. Try typing instead.'); };
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      const routed = routeText(t);
      setRoute(routed);
      trackEvent('voice_submitted', routed.module);
    };
    r.start();
  }, []);

  const handleAction = (a: Action) => {
    if (a.section) onNavigate(a.section);
    setRoute(null); setScanRec(null);
  };

  const dismiss = () => { setRoute(null); setScanRec(null); setError(null); };

  const pillars = [
    { key: 'money',     name: 'Money',     icon: <DollarSign className="w-5 h-5" />, stat: `${fmt(recovered)} recovered/yr` },
    { key: 'home',      name: 'Home',      icon: <Wrench     className="w-5 h-5" />, stat: `${homeItems.length} items tracked` },
    { key: 'resolve',   name: 'Resolve',   icon: <Scale      className="w-5 h-5" />, stat: '' },
    { key: 'community', name: 'Community', icon: <Users      className="w-5 h-5" />, stat: 'Your fabric' },
  ];

  return (
    <div className="reclaim-module">
      {/* ── Intake Zone ─────────────────────────────────────────── */}
      <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-2" style={{ color: GOLD }}>Your Reclaim</p>
      <h1 className="text-4xl md:text-5xl font-semibold mb-2">How can I help?</h1>
      <p className="text-gray-500 mb-7 text-base max-w-xl">Scan a document, speak, or type — I'll figure out the rest.</p>

      {/* Input buttons */}
      {!route && !scanning && (
        <div className="space-y-3 max-w-xl mb-2">
          {/* Scan */}
          <input ref={inputRef} type="file" accept="image/*" className="hidden"
            onChange={(e) => { const f = e.target.files?.[0]; if (f) handleScanFile(f); e.currentTarget.value = ''; }} />
          <button onClick={() => inputRef.current?.click()}
            className="w-full card p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 transition-transform group">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: 'rgba(240,167,0,0.12)', color: GOLD }}>
              <ScanLine className="w-5 h-5" />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">Scan or upload a document</p>
              <p className="text-xs text-gray-400">Photo of any bill, invoice, letter or statement</p>
            </div>
            <Sparkles className="w-4 h-4 shrink-0" style={{ color: GOLD }} />
          </button>

          {/* Speak */}
          <button onClick={handleSpeak} disabled={listening}
            className="w-full card p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 transition-transform group disabled:opacity-60">
            <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: 'rgba(240,167,0,0.12)', color: GOLD }}>
              <Mic className={`w-5 h-5 ${listening ? 'animate-pulse' : ''}`} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm">{listening ? 'Listening…' : 'Speak'}</p>
              <p className="text-xs text-gray-400">Tell me what you need — I'll route it</p>
            </div>
          </button>

          {/* Type */}
          {!showType ? (
            <button onClick={() => { setShowType(true); setTimeout(() => textRef.current?.focus(), 50); }}
              className="w-full card p-4 flex items-center gap-4 text-left hover:-translate-y-0.5 transition-transform group">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl shrink-0" style={{ background: 'rgba(240,167,0,0.12)', color: GOLD }}>
                <Send className="w-5 h-5" />
              </span>
              <p className="text-sm text-gray-400 flex-1">Type your question or describe a problem…</p>
            </button>
          ) : (
            <div className="card p-3 flex items-center gap-2">
              <input ref={textRef} value={inputText} onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleText()}
                placeholder="e.g. my water heater is leaking…"
                className="flex-1 text-sm bg-transparent outline-none placeholder-gray-400 px-1" />
              <button onClick={handleText} disabled={!inputText.trim()}
                className="btn-gold disabled:opacity-50 !py-2 !px-3"><Send className="w-4 h-4" /></button>
              <button onClick={() => { setShowType(false); setInputText(''); }} className="text-gray-300 hover:text-gray-600"><X className="w-4 h-4" /></button>
            </div>
          )}
        </div>
      )}

      {/* Scanning progress */}
      {scanning && (
        <div className="card p-5 max-w-xl mb-4 flex items-center gap-4">
          <Loader2 className="w-5 h-5 animate-spin shrink-0" style={{ color: GOLD }} />
          <div className="flex-1">
            <p className="font-semibold text-sm mb-2">{scanMode === 'ai' ? 'Analysing with AI…' : `Reading on device… ${scanProg}%`}</p>
            <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
              <div className={`h-full transition-all ${scanMode === 'ai' ? 'animate-pulse' : ''}`}
                style={{ width: scanMode === 'ai' ? '100%' : `${scanProg}%`, background: GOLD }} />
            </div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && <p className="text-sm text-red-600 mb-4 max-w-xl">{error} <button onClick={() => setError(null)} className="underline ml-1">Dismiss</button></p>}

      {/* AI Confirmation */}
      {route && !scanning && (
        <div className="max-w-xl mb-8" style={{ ...(scanRec ? { background: VERDICT_META[scanRec.verdict].bg, border: `0.5px solid ${VERDICT_META[scanRec.verdict].border}` } : { background: '#fffbe9', border: '0.5px solid #fae0a8' }), borderRadius: 12, padding: '16px 18px' }}>
          <div className="flex items-start gap-3 mb-4">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full shrink-0" style={{ background: GOLD, color: '#181818' }}>
              <Sparkles className="w-4 h-4" />
            </span>
            <div>
              <p className="text-xs font-semibold mb-1" style={{ color: '#8a6200' }}>Reclaim AI</p>
              <div className="text-sm leading-relaxed" style={{ color: '#5c4200' }}>
                {scanRec && (
                  <span className="flex items-center gap-1.5 font-semibold mb-1" style={{ color: VERDICT_META[scanRec.verdict].fg }}>
                    {VERDICT_META[scanRec.verdict].icon} {VERDICT_META[scanRec.verdict].title}
                  </span>
                )}
                {route.confirmation}
                {scanRec && scanRec.flags.length > 0 && (
                  <ul className="mt-2 space-y-1">
                    {scanRec.flags.map((f, i) => (
                      <li key={i}><span className="font-semibold">{f.label}</span>{f.reason ? ` — ${f.reason}` : ''}</li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            <button onClick={dismiss} className="ml-auto text-gray-300 hover:text-gray-500 shrink-0"><X className="w-4 h-4" /></button>
          </div>
          <div className="flex flex-col gap-2 pl-11">
            {route.actions.map((a, i) => (
              a.label === 'Dismiss' ? (
                <button key={i} onClick={dismiss} className="text-sm text-gray-400 hover:text-gray-600 text-left">Dismiss ×</button>
              ) : (
                <button key={i} onClick={() => handleAction(a)}
                  className={`text-sm font-semibold py-2.5 px-4 rounded-lg border text-left flex items-center gap-2 transition-colors ${a.primary ? 'text-[#181818] border-transparent' : 'border-[#fae0a8] bg-white/60'}`}
                  style={a.primary ? { background: GOLD } : { color: '#8a6200' }}>
                  {a.label} {a.section && <ArrowRight className="w-3.5 h-3.5 ml-auto" />}
                </button>
              )
            ))}
          </div>
          {scanRec && (
            <div className="pl-11">
              <CompletionPrompt
                pillar={route.module}
                shareText={`I just used Reclaim and it found: ${VERDICT_META[scanRec.verdict].title.toLowerCase()}${scanRec.vendor ? ` from ${scanRec.vendor}` : ''}.`}
              />
            </div>
          )}
        </div>
      )}

      {/* ── Active Alerts ────────────────────────────────────────── */}
      {(vampireAlerts.length > 0 || expiringItems.length > 0) && (
        <div className="mb-8 max-w-xl">
          <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">Active alerts</p>
          <div className="card divide-y divide-black/5">
            {vampireAlerts.map((s) => (
              <button key={s.id} onClick={() => onNavigate('money')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left transition-colors">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: '#dc2626' }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Vampire found — {s.vendor}{s.amount != null ? ` · ${fmt(s.amount)}` : ''}</p>
                  <p className="text-xs text-gray-400">{new Date(s.date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            ))}
            {expiringItems.map(({ item, expiry }, i) => (
              <button key={i} onClick={() => onNavigate('home')} className="w-full flex items-center gap-3 p-4 hover:bg-gray-50 text-left transition-colors">
                <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: GOLD }} />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">Warranty expiring — {String(item.name || 'item')}</p>
                  <p className="text-xs text-gray-400">Expires {expiry.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-gray-300 shrink-0" />
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Toolkit ──────────────────────────────────────────────── */}
      <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-400 mb-3">Your toolkit</p>
      <div className="grid sm:grid-cols-2 gap-4">
        {pillars.map((p) => (
          <button key={p.key} onClick={() => onNavigate(p.key)}
            className="card p-5 text-left group hover:-translate-y-0.5 transition-transform">
            <div className="flex items-center justify-between mb-3">
              <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl" style={{ background: 'rgba(240,167,0,0.12)', color: GOLD }}>{p.icon}</span>
              <ArrowRight className="w-5 h-5 text-gray-300 group-hover:text-gray-900 transition-colors" />
            </div>
            <h3 className="text-xl font-semibold mb-1">{p.name}</h3>
            {p.stat && <p className="text-sm font-medium mt-2" style={{ color: GOLD }}>{p.stat}</p>}
          </button>
        ))}
      </div>
    </div>
  );
};

export default HubSection;
