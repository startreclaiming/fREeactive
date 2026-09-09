import React, { useCallback, useRef, useState } from 'react';
import {
  Scale, Plus, Trash2, ChevronRight, Mic, Square, Loader2, Printer,
  ExternalLink, ArrowLeft, Pencil, Check,
} from 'lucide-react';
import { useStored, uid } from './moduleUtils';
import { ModuleHeader, Stat, Badge, Empty } from './moduleUI';
import { supabase } from '@/lib/supabase';
import { courtFormFor, COURT_FORMS_URL } from '@/lib/courtForms';
import CompletionPrompt from './CompletionPrompt';
import { trackEvent } from '@/lib/usageTracking';
import './modules.css';

type IStatus = 'open' | 'in-progress' | 'resolved';
type TimelineEvent = { id: string; date: string | null; description: string; category: string };
type Case = {
  id: string;
  topic: string;
  title: string;
  status: IStatus;
  declarantName: string;
  citations: string;
  transcript: string;
  events: TimelineEvent[];
  createdAt: string;
};
type LibraryIssue = { id: string; topic: string; note: string; status: IStatus };

const TOPICS = [
  { name: 'Tenancy & Housing', blurb: 'Deposits, repairs, notice periods, and what your landlord must legally do.' },
  { name: 'Family / Domestic Violence', blurb: 'Custody, support, and protective orders when you need the court\'s help fast.' },
  { name: 'Consumer Rights', blurb: 'Refunds, faulty goods, and protections when something you bought fails.' },
  { name: 'Utilities & Billing', blurb: 'Disputing meter readings, back-bills, and switching providers fairly.' },
  { name: 'Employment', blurb: 'Pay, leave, contracts, and what you are entitled to at work.' },
  { name: 'Benefits & Entitlements', blurb: 'Support you may qualify for and how to claim what is yours.' },
];
const NEXT: Record<IStatus, IStatus> = { open: 'in-progress', 'in-progress': 'resolved', resolved: 'open' };
const TONE: Record<IStatus, 'gold' | 'blue' | 'green'> = { open: 'gold', 'in-progress': 'blue', resolved: 'green' };

const HABITABILITY_CITATION = 'California Civil Code §1941.1 (conditions that can render a rental unit untenantable) — verify against your specific facts; this is not legal advice.';

/** Naive on-device fallback if the structuring edge function is unavailable: one event per sentence, no dates. */
function heuristicEvents(transcript: string): TimelineEvent[] {
  return transcript
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter((s) => s.length > 3)
    .map((description) => ({ id: uid(), date: null, description, category: 'Account' }));
}

async function structureTranscript(transcript: string, priorEvents: TimelineEvent[]): Promise<TimelineEvent[]> {
  try {
    const { data, error } = await supabase.functions.invoke('structure-timeline', {
      body: { transcript, priorEvents: priorEvents.map(({ date, description, category }) => ({ date, description, category })) },
    });
    if (!error && data && Array.isArray(data.events) && data.events.length) {
      return data.events.map((e: { date?: string | null; description?: string; category?: string }) => ({
        id: uid(), date: e.date ?? null, description: String(e.description || ''), category: String(e.category || 'Account'),
      }));
    }
  } catch { /* fall through to heuristic */ }
  return [...priorEvents, ...heuristicEvents(transcript)];
}

const ResolveSection: React.FC<{ onBack?: () => void }> = ({ onBack }) => {
  const [tab, setTab] = useState<'builder' | 'library'>('builder');

  /* ── Case Builder (new, wireframe-primary capability) ─────────────── */
  const [cases, setCases] = useStored<Case[]>('reclaim_resolve_cases', []);
  const [activeCaseId, setActiveCaseId] = useState<string | null>(null);
  const active = cases.find((c) => c.id === activeCaseId) || null;

  const createCase = (topic: string) => {
    const c: Case = {
      id: uid(), topic, title: topic, status: 'open', declarantName: '', citations: '',
      transcript: '', events: [], createdAt: new Date().toISOString(),
    };
    setCases([c, ...cases]);
    setActiveCaseId(c.id);
  };
  const updateCase = (id: string, patch: Partial<Case>) => setCases(cases.map((c) => (c.id === id ? { ...c, ...patch } : c)));
  const removeCase = (id: string) => { setCases(cases.filter((c) => c.id !== id)); if (activeCaseId === id) setActiveCaseId(null); };

  if (tab === 'builder' && active) {
    return (
      <CaseWorkspace
        item={active}
        onBack={() => setActiveCaseId(null)}
        onUpdate={(patch) => updateCase(active.id, patch)}
        onDelete={() => removeCase(active.id)}
      />
    );
  }

  const openCount = cases.filter((c) => c.status !== 'resolved').length;

  return (
    <div className="reclaim-module">
      <ModuleHeader onBack={onBack} icon={<Scale className="w-5 h-5" />} eyebrow="Resolve"
        title="Build Your Case"
        blurb="Speak or type what's happening. Reclaim turns it into a chronological timeline and a court-ready packet — no account needed." />

      <div className="flex gap-2 mb-8 border-b border-black/10">
        <button onClick={() => setTab('builder')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === 'builder' ? 'border-[#f0a700] text-[#1d1d1f]' : 'border-transparent text-gray-400'}`}>Case Builder</button>
        <button onClick={() => setTab('library')} className={`px-4 py-2.5 text-sm font-semibold border-b-2 -mb-px transition-colors ${tab === 'library' ? 'border-[#f0a700] text-[#1d1d1f]' : 'border-transparent text-gray-400'}`}>Rights Library</button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Cases open" value={openCount} accent />
        <Stat label="Cases resolved" value={cases.filter((c) => c.status === 'resolved').length} />
        <Stat label="Events logged" value={cases.reduce((s, c) => s + c.events.length, 0)} />
      </div>

      <h3 className="text-2xl font-semibold mb-4">Start a case</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {TOPICS.map((t) => (
          <button key={t.name} onClick={() => createCase(t.name)} className="card p-4 flex items-start justify-between gap-3 text-left hover:-translate-y-0.5 transition-transform">
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-gray-500 mt-1">{t.blurb}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
          </button>
        ))}
      </div>

      {cases.length > 0 && (
        <>
          <h3 className="text-2xl font-semibold mb-4">Your cases</h3>
          <div className="space-y-3">
            {cases.map((c) => (
              <button key={c.id} onClick={() => setActiveCaseId(c.id)} className="w-full card p-4 flex items-center justify-between gap-4 text-left hover:-translate-y-0.5 transition-transform">
                <div className="min-w-0">
                  <p className="text-xs font-semibold tracking-wide uppercase text-gray-400">{c.topic}</p>
                  <p className="font-semibold mt-1">{c.title}</p>
                  <p className="text-sm text-gray-500">{c.events.length} event{c.events.length === 1 ? '' : 's'} logged</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <Badge tone={TONE[c.status]}>{c.status}</Badge>
                  <ChevronRight className="w-4 h-4 text-gray-300" />
                </div>
              </button>
            ))}
          </div>
        </>
      )}

      {tab === 'library' && <RightsLibrary />}
    </div>
  );
};

/* ── Case workspace: voice/type entry → timeline → packet export ────── */
const CaseWorkspace: React.FC<{
  item: Case; onBack: () => void; onUpdate: (patch: Partial<Case>) => void; onDelete: () => void;
}> = ({ item, onBack, onUpdate, onDelete }) => {
  const [listening, setListening] = useState(false);
  const [liveText, setLiveText] = useState('');
  const [manualNote, setManualNote] = useState('');
  const [structuring, setStructuring] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPacket, setShowPacket] = useState(false);
  const [editingEvent, setEditingEvent] = useState<string | null>(null);
  const recognitionRef = useRef<any>(null);

  const handleTranscript = useCallback(async (text: string) => {
    if (!text.trim()) return;
    setStructuring(true);
    setError(null);
    try {
      const events = await structureTranscript(text, item.events);
      onUpdate({ transcript: `${item.transcript}\n${text}`.trim(), events });
      trackEvent('resolve_timeline_built', 'resolve', { eventCount: events.length });
    } catch {
      setError('Could not structure that account. Your words are saved below — try again in a moment.');
    } finally {
      setStructuring(false);
    }
  }, [item.events, item.transcript, onUpdate]);

  const startListening = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError('Voice not supported in this browser. Type your account below instead.'); return; }
    const r = new SR();
    recognitionRef.current = r;
    r.continuous = true; r.interimResults = true; r.lang = 'en-US';
    let finalText = '';
    r.onstart = () => { setListening(true); setLiveText(''); };
    r.onend = () => { setListening(false); if (finalText.trim()) handleTranscript(finalText); };
    r.onerror = () => { setListening(false); setError('Microphone not available. Try typing instead.'); };
    r.onresult = (e: any) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalText += t + ' '; else interim += t;
      }
      setLiveText(finalText + interim);
    };
    r.start();
  };
  const stopListening = () => recognitionRef.current?.stop();

  const submitManual = () => { const t = manualNote.trim(); if (!t) return; setManualNote(''); handleTranscript(t); };

  const removeEvent = (id: string) => onUpdate({ events: item.events.filter((e) => e.id !== id) });
  const editEvent = (id: string, patch: Partial<TimelineEvent>) => onUpdate({ events: item.events.map((e) => (e.id === id ? { ...e, ...patch } : e)) });

  if (showPacket) {
    return <PacketView item={item} onBack={() => setShowPacket(false)} onUpdate={onUpdate} />;
  }

  return (
    <div className="reclaim-module">
      <ModuleHeader onBack={onBack} icon={<Scale className="w-5 h-5" />} eyebrow={item.topic}
        title={item.title} blurb="Speak your account hands-free, or type it — Reclaim keeps it in chronological order." />

      {/* Hands-free Voice Entry */}
      <div className="card p-6 mb-6 flex flex-col items-center text-center">
        <button
          onClick={listening ? stopListening : startListening}
          disabled={structuring}
          className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-3 transition-colors disabled:opacity-50"
          style={{ background: listening ? '#dc2626' : '#f0a700', color: '#181818' }}
        >
          {structuring ? <Loader2 className="w-6 h-6 animate-spin" /> : listening ? <Square className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
        </button>
        <p className="font-semibold text-sm">{structuring ? 'Analyzing…' : listening ? 'Listening — tap to stop & analyze' : 'Tap to talk'}</p>
        {liveText && <p className="text-sm text-gray-500 mt-3 max-w-md italic">"{liveText}"</p>}
      </div>

      {/* Type fallback */}
      <div className="card p-4 mb-6 flex items-center gap-2">
        <input value={manualNote} onChange={(e) => setManualNote(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && submitManual()}
          placeholder="…or type what happened" className="input flex-1" />
        <button onClick={submitManual} disabled={!manualNote.trim() || structuring} className="btn-gold disabled:opacity-50">Add</button>
      </div>

      {error && <p className="text-sm text-red-600 mb-6">{error} <button onClick={() => setError(null)} className="underline ml-1">Dismiss</button></p>}

      {/* Structured Event Vault */}
      <h3 className="text-xl font-semibold mb-4">Structured Event Vault</h3>
      {item.events.length === 0 ? (
        <Empty>No events yet. Talk or type above to build your timeline.</Empty>
      ) : (
        <div className="space-y-2 mb-8">
          {item.events.map((e) => (
            <div key={e.id} className="card p-3 flex items-start gap-3">
              {editingEvent === e.id ? (
                <>
                  <input value={e.date || ''} onChange={(ev) => editEvent(e.id, { date: ev.target.value || null })} placeholder="Date" className="input w-28 text-sm shrink-0" />
                  <input value={e.description} onChange={(ev) => editEvent(e.id, { description: ev.target.value })} className="input flex-1 text-sm" />
                  <button onClick={() => setEditingEvent(null)} className="text-emerald-600 shrink-0"><Check className="w-4 h-4" /></button>
                </>
              ) : (
                <>
                  <span className="text-xs font-semibold text-gray-400 shrink-0 w-24">{e.date || 'undated'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">{e.description}</p>
                    <span className="text-xs text-gray-400">{e.category}</span>
                  </div>
                  <button onClick={() => setEditingEvent(e.id)} className="text-gray-300 hover:text-gray-600 shrink-0"><Pencil className="w-3.5 h-3.5" /></button>
                  <button onClick={() => removeEvent(e.id)} className="text-gray-300 hover:text-red-500 shrink-0"><Trash2 className="w-3.5 h-3.5" /></button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-wrap gap-3">
        <button onClick={() => setShowPacket(true)} disabled={item.events.length === 0} className="btn-gold disabled:opacity-40">Build Judicial Packet</button>
        <button onClick={onDelete} className="text-sm text-gray-400 hover:text-red-500 transition-colors flex items-center gap-1.5"><Trash2 className="w-3.5 h-3.5" /> Delete case</button>
      </div>
    </div>
  );
};

/* ── Court-Ready Evidence Vault: printable packet + official-form pointer ─ */
const PacketView: React.FC<{ item: Case; onBack: () => void; onUpdate: (patch: Partial<Case>) => void }> = ({ item, onBack, onUpdate }) => {
  const form = courtFormFor(item.topic);
  const suggestedCitation = item.topic === 'Tenancy & Housing' ? HABITABILITY_CITATION : '';

  return (
    <div className="reclaim-module">
      <style>{`@media print { .no-print { display: none !important; } .reclaim-module { max-width: none !important; } }`}</style>
      <button onClick={onBack} className="no-print inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"><ArrowLeft className="w-4 h-4" /> Back to case</button>

      <div className="card p-6 mb-6" id="packet-print-area">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-400 mb-1">Declaration</p>
        <h2 className="text-2xl font-semibold mb-4">{item.topic}</h2>

        <label className="text-sm text-gray-500 flex flex-col gap-1 mb-4 no-print">
          Your name (as it should appear on the declaration)
          <input className="input" value={item.declarantName} onChange={(e) => onUpdate({ declarantName: e.target.value })} placeholder="Full legal name" />
        </label>
        {item.declarantName && <p className="mb-4">I, {item.declarantName}, declare under penalty of perjury that the following is a true and accurate chronological account:</p>}

        <h3 className="font-semibold mb-2">Chronological Timeline</h3>
        <ol className="list-decimal list-inside space-y-1 mb-6">
          {item.events.map((e) => (
            <li key={e.id} className="text-sm"><span className="font-medium">{e.date || 'Date not specified'}</span> — {e.description}</li>
          ))}
        </ol>

        <h3 className="font-semibold mb-2">Citations & References</h3>
        <p className="text-sm text-gray-600 mb-1">{suggestedCitation || 'Add any statute, ordinance, or lease/contract clause you\'re relying on.'}</p>
        <textarea className="input no-print mt-2" rows={2} placeholder="Additional citations…" value={item.citations} onChange={(e) => onUpdate({ citations: e.target.value })} />
        {item.citations && <p className="text-sm text-gray-600 mt-2">{item.citations}</p>}
      </div>

      <div className="card p-4 mb-6 flex items-start gap-3">
        <Scale className="w-5 h-5 shrink-0 mt-0.5" style={{ color: '#f0a700' }} />
        <div>
          <p className="font-semibold text-sm">Likely relevant form: {form.code}</p>
          <p className="text-sm text-gray-500 mb-2">{form.name}</p>
          <a href={COURT_FORMS_URL} target="_blank" rel="noreferrer" className="text-sm font-medium inline-flex items-center gap-1" style={{ color: '#f0a700' }}>
            Search official CA court forms <ExternalLink className="w-3.5 h-3.5" />
          </a>
        </div>
      </div>

      <div className="no-print flex flex-wrap gap-3 mb-6">
        <button onClick={() => window.print()} className="btn-gold inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print / Save as PDF</button>
      </div>

      <div className="no-print">
        <CompletionPrompt pillar="resolve" shareText="I just built a court-ready case timeline with Reclaim." />
      </div>
    </div>
  );
};

/* ── Rights Library (existing content, now a secondary tab) ─────────── */
const RightsLibrary: React.FC = () => {
  const [issues, setIssues] = useStored<LibraryIssue[]>('reclaim_rights_issues', []);
  const [form, setForm] = useState<{ topic: string; note: string }>({ topic: TOPICS[0].name, note: '' });

  const add = () => {
    if (!form.note.trim()) return;
    setIssues([{ id: uid(), topic: form.topic, note: form.note.trim(), status: 'open' }, ...issues]);
    setForm({ topic: TOPICS[0].name, note: '' });
  };
  const remove = (id: string) => setIssues(issues.filter((i) => i.id !== id));
  const cycle = (id: string) => setIssues(issues.map((i) => (i.id === id ? { ...i, status: NEXT[i.status] } : i)));

  return (
    <div className="mt-4">
      <h3 className="text-2xl font-semibold mb-4">Rights library</h3>
      <div className="grid sm:grid-cols-2 gap-3 mb-10">
        {TOPICS.map((t) => (
          <div key={t.name} className="card p-4 flex items-start justify-between gap-3">
            <div>
              <p className="font-semibold">{t.name}</p>
              <p className="text-sm text-gray-500 mt-1">{t.blurb}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-gray-300 mt-1 shrink-0" />
          </div>
        ))}
      </div>

      <h3 className="text-2xl font-semibold mb-4">Your issues</h3>
      <div className="card p-5 mb-6">
        <div className="grid gap-3">
          <select className="input" value={form.topic} onChange={(e) => setForm({ ...form, topic: e.target.value })}>
            {TOPICS.map((t) => <option key={t.name}>{t.name}</option>)}
          </select>
          <textarea className="input" placeholder="Describe the situation you're dealing with…" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
          <button onClick={add} className="btn-gold"><Plus className="w-4 h-4" /> Log issue</button>
        </div>
      </div>

      {issues.length === 0 ? <Empty>No issues logged yet.</Empty> : (
        <div className="space-y-3">
          {issues.map((i) => (
            <div key={i.id} className="card p-4 flex items-start justify-between gap-4">
              <div className="min-w-0">
                <p className="text-xs font-semibold tracking-wide uppercase text-gray-400">{i.topic}</p>
                <p className="mt-1">{i.note}</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => cycle(i.id)} title="Click to advance status"><Badge tone={TONE[i.status]}>{i.status}</Badge></button>
                <button onClick={() => remove(i.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResolveSection;
