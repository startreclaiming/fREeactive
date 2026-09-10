import React, { useState } from 'react';
import {
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Bell,
  ArrowRight,
  FileText,
  ChevronRight,
  Coins
} from 'lucide-react';

import supabase from '../../lib/supabase';

interface UnclaimedProperty {
  id: number;
  owner_name: string;
  holder_name?: string;
  last_known_address?: string;
  amount: number;
  property_type?: string;
  zipcode?: number;
}

interface DashboardProps {
  onBack: () => void;
  onNavigate: (section: string) => void;
  onOpenAuth?: () => void;
}

type FunnelStep = 'search' | 'lead-capture' | 'success-upsell';

export default function Dashboard({ onBack, onNavigate, onOpenAuth }: DashboardProps) {
  const [currentStep, setCurrentStep] = useState<FunnelStep>('search');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [zipCode, setZipCode] = useState('');

  const [results, setResults] = useState<UnclaimedProperty[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  const [emailCapture, setEmailCapture] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);

  const inputClass = "w-full px-4 py-3 bg-[#1c1c1c] border border-neutral-800 rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#f0a700] transition-colors text-sm";
  const labelClass = "block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2";

  const fmtAmt = (v: number | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
  };

  const executeSearch = async (query: string, zip: string): Promise<{ data: UnclaimedProperty[]; error: string | null }> => {
    try {
      let q = supabase
        .from('alameda_property_cache')
        .select('id, owner_name, holder_name, last_known_address, amount, property_type, zipcode')
        .ilike('owner_name', `%${query}%`)
        .limit(25);
      const zipDigits = zip.replace(/\D/g, '').slice(0, 5);
      if (zipDigits) {
        q = q.eq('zipcode', parseInt(zipDigits, 10));
      }
      const { data, error } = await q;
      if (error) return { data: [], error: error.message };
      return { data: (data as UnclaimedProperty[]) || [], error: null };
    } catch (err: any) {
      return { data: [], error: err?.message || 'Search failed' };
    }
  };

  const handleSearchExecution = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setErrorMsg('Enter at least 2 characters to search.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');
    setResults([]);
    setSelectedIds(new Set());

    const { data, error } = await executeSearch(searchQuery, zipCode);
    if (error) {
      setErrorMsg(error);
    } else if (data.length === 0) {
      setErrorMsg(`No results for "${searchQuery}". Try a different name or remove the ZIP filter.`);
    }
    setResults(data);
    setIsLoading(false);
  };

  const handleClearForm = () => {
    setSearchQuery('');
    setZipCode('');
    setResults([]);
    setSelectedIds(new Set());
    setErrorMsg('');
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedProperties = results.filter(r => selectedIds.has(r.id));
  const totalSelected = selectedProperties.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  const sendClaimEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailCapture.trim() || selectedProperties.length === 0) return;

    setSending(true);
    setSendError(null);
    try {
      // There's no email-sending provider wired into this project, so rather than
      // hit a nonexistent edge function (which 404'd on every submission), save the
      // request server-side — the UI is honest about this being a saved request,
      // not a sent email, until real delivery exists.
      const { error } = await supabase
        .from('claim_leads')
        .insert({ email: emailCapture.trim(), properties: selectedProperties });
      if (error) throw new Error(error.message);
      setCurrentStep('success-upsell');
    } catch (err: any) {
      setSendError(err?.message || 'Something went wrong saving your request. Please try again.');
    }
    setSending(false);
  };

  return (
    <div className="w-full min-h-screen bg-[#181818] text-white font-sans antialiased selection:bg-[#f0a700] selection:text-black">

      {/* ── PHASE 1: SEARCH + SELECT ───────────── */}
      {currentStep === 'search' && (
        <div className="w-full max-w-6xl mx-auto px-4 py-12">

          <div className="flex items-center justify-between mb-10 border-b border-neutral-900 pb-6">
            <button
              onClick={onBack}
              className="text-xs font-bold text-gray-400 hover:text-white transition-colors tracking-widest uppercase flex items-center gap-2"
            >
              ← Back
            </button>
            <div className="text-right">
              <span className="text-xs font-mono text-gray-500 bg-neutral-900 px-3 py-1.5 rounded border border-neutral-800">
                ALAMEDA COUNTY · UNCLAIMED PROPERTY
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

            <div className="bg-[#222222] border border-neutral-800 rounded-xl p-6 shadow-xl">
              <div className="flex items-center gap-2 mb-6">
                <div className="p-2 bg-[#f0a700]/10 border border-[#f0a700]/20 rounded-lg text-[#f0a700]">
                  <Search className="w-4 h-4" />
                </div>
                <h3 className="text-lg font-black tracking-wide text-white">Search the Ledger</h3>
              </div>

              <form onSubmit={handleSearchExecution} className="space-y-4">
                <div>
                  <label className={labelClass}>Full Name / Company Name *</label>
                  <input
                    type="text"
                    required
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="e.g. Johnson"
                    className={inputClass}
                  />
                </div>

                <div>
                  <label className={labelClass}>ZIP Code (optional)</label>
                  <input
                    type="text"
                    value={zipCode}
                    onChange={(e) => setZipCode(e.target.value)}
                    placeholder="Narrow by ZIP"
                    className={inputClass}
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                    <span>{errorMsg}</span>
                  </div>
                )}

                <div className="pt-2 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={handleClearForm}
                    className="w-full bg-[#2d2d2d] hover:bg-[#3d3d3d] text-white font-bold py-3 px-4 rounded-lg text-xs transition-all uppercase tracking-wider"
                  >
                    Clear
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="w-full bg-[#f0a700] hover:brightness-105 text-[#181818] font-bold py-3 px-4 rounded-lg text-xs transition-all uppercase tracking-wider flex items-center justify-center gap-2 shadow-md"
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search Ledger'}
                  </button>
                </div>
              </form>
            </div>

            <div className="lg:col-span-2">
              {isLoading ? (
                <div className="w-full h-64 bg-[#222222]/40 border border-neutral-800/60 rounded-xl flex flex-col items-center justify-center text-gray-400 gap-3">
                  <Loader2 className="w-8 h-8 animate-spin text-[#f0a700]" />
                  <span className="text-xs font-mono uppercase tracking-widest">Searching the ledger...</span>
                </div>
              ) : results.length > 0 ? (
                <div className="bg-[#222222] border border-neutral-800 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-4 bg-[#2a2a2a] border-b border-neutral-800 flex justify-between items-center">
                    <span className="text-xs font-bold text-gray-300 uppercase tracking-wider">
                      Matches Found ({results.length})
                    </span>
                    <span className="text-xs text-gray-400">Tap any rows that may be yours</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-neutral-800 text-[10px] font-bold text-gray-400 uppercase tracking-widest bg-[#1c1c1c]">
                          <th className="p-4">Owner Name</th>
                          <th className="p-4">Held By</th>
                          <th className="p-4">Last Known Address</th>
                          <th className="p-4 text-right">Amount</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-neutral-800/60 text-xs">
                        {results.map((item) => {
                          const isSelected = selectedIds.has(item.id);
                          return (
                            <tr
                              key={item.id}
                              onClick={() => toggleSelect(item.id)}
                              className={`cursor-pointer transition-colors ${isSelected ? 'bg-[#f0a700]/10' : 'hover:bg-neutral-800/30'}`}
                              style={isSelected ? { boxShadow: 'inset 3px 0 0 #f0a700' } : undefined}
                            >
                              <td className="p-4 font-bold text-white max-w-[160px] truncate">{item.owner_name}</td>
                              <td className="p-4 text-gray-400 max-w-[160px] truncate">{item.holder_name || '—'}</td>
                              <td className="p-4 text-gray-400 max-w-[200px] truncate">{item.last_known_address || '—'}</td>
                              <td className="p-4 text-right font-mono font-bold text-[#f0a700]">
                                ${fmtAmt(item.amount)}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>

                  {selectedIds.size > 0 && (
                    <div className="p-4 bg-[#1c1c1c] border-t border-neutral-800 flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {selectedIds.size} selected · <span className="text-[#f0a700] font-bold">${fmtAmt(totalSelected)}</span> total
                      </span>
                      <button
                        onClick={() => setCurrentStep('lead-capture')}
                        className="px-4 py-2 bg-[#f0a700] hover:brightness-105 text-[#181818] font-bold text-[11px] rounded transition-all whitespace-nowrap uppercase tracking-wider flex items-center gap-1"
                      >
                        Help me claim these <ArrowRight className="w-3 h-3" />
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="w-full h-64 bg-[#222222]/20 border border-dashed border-neutral-800 rounded-xl flex flex-col items-center justify-center text-gray-500 p-6 text-center">
                  <FileText className="w-8 h-8 mb-2 text-neutral-700" />
                  <p className="text-sm font-medium text-gray-400">No search yet</p>
                  <p className="text-xs text-gray-500 max-w-xs mt-1">
                    Search by name to check for unclaimed property in Alameda County.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── PHASE 2: EMAIL CAPTURE ────────────────────────────── */}
      {currentStep === 'lead-capture' && (
        <div className="w-full max-w-xl mx-auto px-4 py-24">
          <div className="bg-[#222222] border border-neutral-800 rounded-2xl p-8 shadow-2xl relative">
            <button
              onClick={() => setCurrentStep('search')}
              className="absolute top-6 right-6 text-xs font-bold text-gray-500 hover:text-white transition-colors"
            >
              ✕ Cancel
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-[#f0a700]/10 border border-[#f0a700]/20 rounded-full flex items-center justify-center mx-auto mb-3 text-[#f0a700]">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="text-xl font-black text-white tracking-wide">Get your claim guide</h3>
              <p className="text-gray-400 text-xs mt-2 max-w-sm mx-auto leading-relaxed">
                We'll save the details on your {selectedProperties.length} selected propert{selectedProperties.length !== 1 ? 'ies' : 'y'} and follow up with step-by-step instructions to file with the California State Controller's Office.
              </p>
            </div>

            <div className="bg-[#1c1c1c] border border-neutral-800 rounded-lg p-4 mb-6 font-mono text-xs text-left space-y-2 max-h-40 overflow-y-auto">
              {selectedProperties.map(p => (
                <div key={p.id} className="flex justify-between gap-3">
                  <span className="text-gray-400 truncate">{p.owner_name}</span>
                  <span className="text-[#f0a700] font-bold shrink-0">${fmtAmt(p.amount)}</span>
                </div>
              ))}
              <div className="flex justify-between border-t border-neutral-800 pt-2 mt-2">
                <span className="text-gray-500">TOTAL</span>
                <span className="text-white font-bold">${fmtAmt(totalSelected)}</span>
              </div>
            </div>

            <form onSubmit={sendClaimEmail} className="space-y-4">
              <div>
                <label className={labelClass}>Your Email</label>
                <input
                  type="email"
                  required
                  value={emailCapture}
                  onChange={(e) => setEmailCapture(e.target.value)}
                  placeholder="you@example.com"
                  className={inputClass}
                  autoFocus
                />
              </div>

              {sendError && (
                <div className="p-3 bg-red-950/30 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{sendError}</span>
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-[#f0a700] hover:brightness-105 text-[#181818] font-bold py-4 rounded-lg text-xs uppercase tracking-wider flex items-center justify-center gap-2 shadow-lg disabled:opacity-60"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save my claim request'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ── PHASE 3: SENT + DONATION ────────── */}
      {currentStep === 'success-upsell' && (
        <div className="w-full max-w-2xl mx-auto px-4 py-24">
          <div className="w-full text-center p-8 bg-[#222222] border border-neutral-800 rounded-2xl shadow-2xl transition-all">

            <div className="w-14 h-14 bg-emerald-950/40 border border-emerald-800/60 rounded-full flex items-center justify-center mx-auto mb-4 text-emerald-400 shadow-inner">
              <CheckCircle2 className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-white mb-2 tracking-wide">
              Your claim request is saved!
            </h3>
            <p className="text-gray-400 text-xs max-w-md mx-auto mb-8 leading-relaxed">
              We've saved your request for <span className="text-white font-semibold underline decoration-[#f0a700]">{emailCapture}</span> covering <span className="text-[#f0a700] font-bold">${fmtAmt(totalSelected)}</span>. We'll follow up with everything you need to file your claim.
            </p>

            <hr className="border-neutral-800/80 my-6" />

            <div className="bg-[#1c1c1c] border border-neutral-800 rounded-xl p-6 text-left shadow-lg">
              <div className="flex items-start gap-4">
                <div className="p-3 bg-[#f0a700]/10 border border-[#f0a700]/20 rounded-lg text-[#f0a700] shrink-0">
                  <Bell className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-white font-bold text-sm mb-1 tracking-wide">
                    Did Reclaim help you?
                  </h4>
                  <p className="text-gray-400 text-xs leading-relaxed mb-4">
                    We're a small team helping every household reclaim what's theirs — completely free. If we found you money, consider supporting us so we can keep this free for everyone.
                  </p>
                  <button
                    onClick={() => onNavigate('landing')}
                    className="px-5 py-2.5 bg-[#f0a700] hover:brightness-105 text-[#181818] font-bold text-xs rounded transition-all uppercase tracking-wider flex items-center gap-1 shadow-md"
                  >
                    <span>Support Reclaim</span>
                    <ChevronRight className="w-3 h-3" />
                  </button>
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-neutral-800/40 mt-6">
              <button
                onClick={() => {
                  setCurrentStep('search');
                  handleClearForm();
                  setEmailCapture('');
                }}
                className="mt-2 inline-flex items-center gap-1 text-xs font-bold text-[#f0a700] hover:underline transition-all group"
              >
                <span>Search again</span>
                <ArrowRight className="w-3 h-3 transform group-hover:translate-x-0.5 transition-transform" />
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}
