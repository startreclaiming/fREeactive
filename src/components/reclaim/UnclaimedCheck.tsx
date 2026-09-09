import React, { useState } from 'react';
import { Search, MapPin, Plus, Trash2, ArrowRight, ShieldCheck, ExternalLink, AlertCircle } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { isAlamedaZip } from '@/lib/alameda';

const GOLD = '#f0a700';
const SCO_SEARCH_URL = 'https://claimit.ca.gov/';

type Relationship = 'self' | 'family';
interface PersonInput { full_name: string; relationship: Relationship; }
interface Address { address_line: string; city: string; state: string; zip: string; }

export interface PendingSearch {
  relationship: Relationship;
  full_name: string;
  address_line: string;
  city: string;
  state: string;
  zip: string;
}

/**
 * UnclaimedCheck — the "check if you're owed money" flow.
 *
 * Anonymous-first: anyone can run the check with no account. The Alameda ZIP
 * gate scopes the trial. Results route to the official free SCO search today;
 * when the SCO dataset is loaded, the real match result renders in the same
 * panel. Saving (self + family) requires an account — if the user isn't signed
 * in, we hand the pending list to `onRegister` so the parent can route to
 * signup and persist afterwards.
 */
const UnclaimedCheck: React.FC<{
  onBack?: () => void;
  onRegister?: (pending: PendingSearch[]) => void;
}> = ({ onBack, onRegister }) => {
  const [step, setStep] = useState<'form' | 'blocked' | 'result'>('form');
  const [name, setName] = useState('');
  const [addr, setAddr] = useState<Address>({ address_line: '', city: '', state: 'CA', zip: '' });
  const [family, setFamily] = useState<PersonInput[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const runCheck = () => {
    setError(null);
    if (!name.trim()) { setError('Enter your full name.'); return; }
    if (!addr.address_line.trim() || !addr.city.trim() || !addr.zip.trim()) {
      setError('Enter your full address (street, city, ZIP).'); return;
    }
    if (!isAlamedaZip(addr.zip)) { setStep('blocked'); return; }
    setStep('result');
  };

  const addFamily = () => setFamily([...family, { full_name: '', relationship: 'family' }]);
  const setFamilyName = (i: number, v: string) =>
    setFamily(family.map((f, idx) => (idx === i ? { ...f, full_name: v } : f)));
  const removeFamily = (i: number) => setFamily(family.filter((_, idx) => idx !== i));

  const buildPending = (): PendingSearch[] => {
    const base = { address_line: addr.address_line.trim(), city: addr.city.trim(), state: addr.state, zip: addr.zip.trim() };
    const self: PendingSearch = { relationship: 'self', full_name: name.trim(), ...base };
    const fam = family
      .filter((f) => f.full_name.trim())
      .map((f) => ({ relationship: 'family' as Relationship, full_name: f.full_name.trim(), ...base }));
    return [self, ...fam];
  };

  const handleHandleIt = async () => {
    setError(null);
    setSaving(true);
    const pending = buildPending();
    const { data } = await supabase.auth.getSession();
    if (data.session) {
      // Signed in → save straight to their account.
      const { error: rpcErr } = await supabase.rpc('save_search_profiles', { p_profiles: pending });
      setSaving(false);
      if (rpcErr) { setError('Could not save right now. Please try again.'); return; }
      setSaved(true);
    } else {
      // Anonymous → hand the list to the parent to route through signup.
      setSaving(false);
      onRegister?.(pending);
    }
  };

  const input = "w-full border border-black/10 rounded-lg p-3 text-sm focus:outline-none focus:border-[#f0a700] focus:ring-1 focus:ring-[#f0a700] transition-all";

  // ── BLOCKED (outside Alameda) ──────────────────────────────────────────
  if (step === 'blocked') {
    return (
      <div className="reclaim-module max-w-xl">
        {onBack && <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>}
        <div className="card p-6 text-center">
          <MapPin className="w-9 h-9 mx-auto mb-3" style={{ color: GOLD }} />
          <h3 className="text-xl font-semibold mb-2">We're in Alameda County first</h3>
          <p className="text-gray-500 text-sm mb-5">
            Reclaim's free check currently covers Alameda County, California — and we're expanding
            across the Bay Area and statewide soon. The ZIP you entered isn't in the trial area yet.
          </p>
          <button onClick={() => { setStep('form'); setError(null); }}
            className="btn-gold">Try a different address</button>
        </div>
      </div>
    );
  }

  // ── RESULT ─────────────────────────────────────────────────────────────
  if (step === 'result') {
    return (
      <div className="reclaim-module max-w-xl">
        {onBack && <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>}

        <div className="card p-6 mb-6">
          <div className="flex items-center gap-2 mb-2" style={{ color: GOLD }}>
            <ShieldCheck className="w-5 h-5" />
            <span className="text-xs font-semibold tracking-[0.16em] uppercase">Alameda County · Check complete</span>
          </div>
          <h3 className="text-2xl font-semibold mb-1">{name.trim()}</h3>
          <p className="text-gray-500 text-sm">
            {addr.address_line.trim()}, {addr.city.trim()}, {addr.state} {addr.zip.trim()}
          </p>

          {/* Honest result: route to the official free search. The real match
              result renders here once the SCO dataset is connected. */}
          <div className="mt-5 p-4 rounded-lg" style={{ background: 'rgba(240,167,0,0.08)', border: '0.5px solid rgba(240,167,0,0.35)' }}>
            <p className="text-sm text-[#5c4200] leading-relaxed mb-3">
              California's State Controller holds billions in unclaimed property. Search the official,
              free database for your name now — no cost, no catch.
            </p>
            <a href={SCO_SEARCH_URL} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm font-semibold py-2.5 px-4 rounded-lg"
              style={{ background: GOLD, color: '#181818' }}>
              Search the official CA database <ExternalLink className="w-4 h-4" />
            </a>
          </div>
        </div>

        {/* The opt-in service path */}
        <div className="card p-6">
          <h4 className="text-lg font-semibold mb-1">Want Reclaim to handle it?</h4>
          <p className="text-gray-500 text-sm mb-4">
            We'll guide the claim end-to-end and watch for new property in your name — and you can
            check family members at the same address at the same time.
          </p>

          <p className="text-xs font-semibold tracking-[0.14em] uppercase text-gray-400 mb-2">People at {addr.city.trim() || 'this address'}</p>
          <div className="space-y-2 mb-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-semibold" style={{ background: 'rgba(240,167,0,0.15)', color: GOLD }}>1</span>
              <span className="font-medium">{name.trim()}</span>
              <span className="text-xs text-gray-400">(you)</span>
            </div>
            {family.map((f, i) => (
              <div key={i} className="flex items-center gap-2">
                <input className={input} placeholder="Family member's full name"
                  value={f.full_name} onChange={(e) => setFamilyName(i, e.target.value)} />
                <button onClick={() => removeFamily(i)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
              </div>
            ))}
          </div>
          <button onClick={addFamily} className="text-sm font-medium flex items-center gap-1.5 mb-5" style={{ color: GOLD }}>
            <Plus className="w-4 h-4" /> Add a family member
          </button>

          {error && <p className="text-sm text-red-600 mb-3 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}

          {saved ? (
            <div className="p-3 rounded-lg text-sm text-center" style={{ background: 'rgba(93,202,165,0.14)', color: '#11633a' }}>
              Saved to your account. We'll take it from here.
            </div>
          ) : (
            <button onClick={handleHandleIt} disabled={saving}
              className="btn-gold w-full disabled:opacity-60">
              {saving ? 'Saving…' : 'Yes — let Reclaim handle it'} <ArrowRight className="w-4 h-4" />
            </button>
          )}
          <p className="text-xs text-gray-400 text-center mt-3">
            Or just use the free link above — no account needed. Thanks for using Reclaim.
          </p>
        </div>
      </div>
    );
  }

  // ── FORM ───────────────────────────────────────────────────────────────
  return (
    <div className="reclaim-module max-w-xl">
      {onBack && <button onClick={onBack} className="text-sm text-gray-500 hover:text-gray-900 mb-4">← Back</button>}
      <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-2" style={{ color: GOLD }}>Free check · Alameda County</p>
      <h1 className="text-3xl md:text-4xl font-semibold mb-2">Check if you're owed money</h1>
      <p className="text-gray-500 mb-6 text-sm max-w-md">
        Enter your name and address. We'll check California's unclaimed-property records — free, no account needed.
      </p>

      <div className="card p-5 space-y-3">
        <input className={input} placeholder="Full name (as it might appear on records)"
          value={name} onChange={(e) => setName(e.target.value)} />
        <input className={input} placeholder="Street address"
          value={addr.address_line} onChange={(e) => setAddr({ ...addr, address_line: e.target.value })} />
        <div className="grid grid-cols-3 gap-2">
          <input className={`${input} col-span-2`} placeholder="City"
            value={addr.city} onChange={(e) => setAddr({ ...addr, city: e.target.value })} />
          <input className={input} placeholder="ZIP" maxLength={5}
            value={addr.zip} onChange={(e) => setAddr({ ...addr, zip: e.target.value })} />
        </div>
        {error && <p className="text-sm text-red-600 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" />{error}</p>}
        <button onClick={runCheck} className="btn-gold w-full">
          <Search className="w-4 h-4" /> Check for my money
        </button>
        <p className="text-xs text-gray-400 text-center">Alameda County, CA only during the trial.</p>
      </div>
    </div>
  );
};

export default UnclaimedCheck;
