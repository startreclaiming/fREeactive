import React, { useState } from 'react';
import { Plus, Trash2, DollarSign, ScanLine, FileText, Printer, Mail, FolderPlus, ArrowLeft } from 'lucide-react';
import { useStored, uid } from './moduleUtils';
import { ModuleHeader, Stat, Badge, Empty } from './moduleUI';
import BillScanner, { BillScan, BillFlag } from './BillScanner';
import CompletionPrompt from './CompletionPrompt';
import { DISPUTE_TEMPLATES } from '@/lib/data';
import { trackEvent } from '@/lib/usageTracking';
import './modules.css';

type Status = 'reviewing' | 'disputing' | 'recovered';
type Charge = {
  id: string; name: string; amount: number; frequency: 'monthly' | 'annual' | 'one-off'; status: Status;
  vendor?: string; flags?: BillFlag[];
};

const annualised = (c: Charge) => (c.frequency === 'monthly' ? c.amount * 12 : c.amount);
const money = (n: number) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const NEXT: Record<Status, Status> = { reviewing: 'disputing', disputing: 'recovered', recovered: 'reviewing' };
const TONE: Record<Status, 'gold' | 'blue' | 'green'> = { reviewing: 'gold', disputing: 'blue', recovered: 'green' };

/** Best-effort match against the existing dispute-template library, for encouraging context — not the letter text itself. */
function matchTemplate(name: string) {
  const n = name.toLowerCase();
  return (
    DISPUTE_TEMPLATES.find((t) => n.includes(t.category.toLowerCase())) ||
    DISPUTE_TEMPLATES.find((t) => t.title.toLowerCase().split(' ').some((w) => w.length > 3 && n.includes(w))) ||
    null
  );
}

const MoneySection: React.FC<{ onBack?: () => void; onNavigate?: (section: string) => void }> = ({ onBack, onNavigate }) => {
  const [charges, setCharges] = useStored<Charge[]>('reclaim_money_charges', []);
  const [form, setForm] = useState<Omit<Charge, 'id' | 'status'>>({ name: '', amount: 0, frequency: 'monthly' });
  const [scanOpen, setScanOpen] = useState(false);
  const [detected, setDetected] = useState<BillScan | null>(null);
  const [letterFor, setLetterFor] = useState<string | null>(null);

  const onScan = (r: BillScan) => {
    setForm({ name: r.vendor || form.name, amount: r.amount ?? form.amount, frequency: form.frequency, vendor: r.vendor, flags: r.flags });
    setDetected(r);
    trackEvent('scan_completed', 'money', { verdict: r.verdict });
  };

  const add = () => {
    if (!form.name.trim() || !form.amount) return;
    setCharges([{ id: uid(), status: 'reviewing', ...form, name: form.name.trim() }, ...charges]);
    setForm({ name: '', amount: 0, frequency: 'monthly' });
    setDetected(null);
  };
  const remove = (id: string) => setCharges(charges.filter((c) => c.id !== id));
  const cycle = (id: string) => setCharges(charges.map((c) => (c.id === id ? { ...c, status: NEXT[c.status] } : c)));

  const underReview = charges.filter((c) => c.status !== 'recovered').reduce((s, c) => s + annualised(c), 0);
  const recovered = charges.filter((c) => c.status === 'recovered').reduce((s, c) => s + annualised(c), 0);

  const letterCharge = charges.find((c) => c.id === letterFor) || null;
  if (letterCharge) {
    return <DisputeLetterView charge={letterCharge} onBack={() => setLetterFor(null)} onNavigate={onNavigate} />;
  }

  return (
    <div className="reclaim-module">
      <ModuleHeader onBack={onBack} icon={<DollarSign className="w-5 h-5" />} eyebrow="Money"
        title="Recovery Tracker"
        blurb="Clawback rogue fees, taxes and subscriptions. Log anything worth challenging and track what you claw back — the average household recovers around $400 a year." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Annualised under review" value={money(underReview)} accent />
        <Stat label="Recovered / year" value={money(recovered)} />
        <Stat label="Items tracked" value={charges.length} />
      </div>

      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Flag a charge</h3>
          <button type="button" onClick={() => setScanOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: '#f0a700' }}>
            <ScanLine className="w-4 h-4" /> {scanOpen ? 'Hide scanner' : 'Scan a bill'}
          </button>
        </div>

        {scanOpen && (
          <div className="mb-4">
            <BillScanner onDetect={onScan} onClose={() => setScanOpen(false)} />
          </div>
        )}

        {detected && (
          <div className="mb-4 text-sm">
            <p className="text-gray-500 mb-1">Read from your bill — tap an amount to use it:</p>
            <div className="flex flex-wrap gap-2">
              {detected.amounts.slice(0, 6).map((a) => (
                <button key={a} type="button" onClick={() => setForm({ ...form, amount: a })}
                  className={`px-2.5 py-1 rounded-full border text-xs ${form.amount === a ? 'border-transparent text-[#1d1d1f]' : 'border-black/10 text-gray-600 hover:border-black/30'}`}
                  style={form.amount === a ? { background: '#f0a700' } : undefined}>
                  {money(a)}
                </button>
              ))}
              {detected.amounts.length === 0 && <span className="text-gray-400">No amounts detected — enter it manually below.</span>}
            </div>
            {form.amount > 0 && (
              <p className="mt-3 font-medium" style={{ color: '#f0a700' }}>Estimated annual impact: {money(form.amount * 12)}/year if this is a recurring charge.</p>
            )}
            {detected.flags && detected.flags.length > 0 && (
              <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="font-semibold text-[#8a6200] mb-1">⚠ Possible issues to dispute</p>
                <ul className="space-y-1">
                  {detected.flags.map((f, i) => (
                    <li key={i} className="text-[#8a6200]"><span className="font-medium">{f.label}</span> — {f.reason}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <input className="input" placeholder="What is it? (e.g. broadband, gym, bank fee)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Company name (for the dispute letter)" value={form.vendor || ''} onChange={(e) => setForm({ ...form, vendor: e.target.value })} />
          <input className="input" type="number" min={0} step="0.01" placeholder="Amount" value={form.amount || ''} onChange={(e) => setForm({ ...form, amount: Number(e.target.value) })} />
          <select className="input" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value as Charge['frequency'] })}>
            <option value="monthly">per month</option>
            <option value="annual">per year</option>
            <option value="one-off">one-off</option>
          </select>
          <button onClick={add} className="btn-gold lg:col-span-4"><Plus className="w-4 h-4" /> Track this</button>
        </div>
      </div>

      {charges.length === 0 ? <Empty>Nothing flagged yet. Add a fee or subscription you want to challenge.</Empty> : (
        <div className="space-y-3">
          {charges.map((c) => (
            <div key={c.id} className="card p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="font-semibold truncate">{c.name}</p>
                <p className="text-sm text-gray-500">{money(c.amount)} {c.frequency} · {money(annualised(c))}/yr</p>
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button onClick={() => setLetterFor(c.id)} className="text-sm font-medium px-3 py-1.5 rounded-lg border border-black/10 inline-flex items-center gap-1.5 hover:bg-gray-50"><FileText className="w-3.5 h-3.5" /> Letter</button>
                <button onClick={() => cycle(c.id)} title="Click to advance status">
                  <Badge tone={TONE[c.status]}>{c.status}</Badge>
                </button>
                <button onClick={() => remove(c.id)} className="text-gray-300 hover:text-red-500 transition-colors"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Dispute letter: printable + mailto + route to vault ─────────────── */
const DisputeLetterView: React.FC<{ charge: Charge; onBack: () => void; onNavigate?: (section: string) => void }> = ({ charge, onBack, onNavigate }) => {
  const template = matchTemplate(charge.name);
  const today = new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' });
  const vendor = charge.vendor || charge.name;
  const annual = annualised(charge);

  const bodyText =
    `To Whom It May Concern at ${vendor},\n\n` +
    `I am writing to formally dispute a charge of ${money(charge.amount)} (${charge.frequency}) on my account, identified as "${charge.name}".\n\n` +
    (charge.flags && charge.flags.length
      ? `Specifically: ${charge.flags.map((f) => `${f.label} — ${f.reason}`).join('; ')}.\n\n`
      : `This charge appears to be an error, an unauthorized increase, or a fee I did not agree to.\n\n`) +
    `I am requesting a full review and correction of this charge, and a refund of any amount improperly billed. Please respond in writing within 30 days.\n\n` +
    `Sincerely,\n[Your name]`;

  const handlePrint = () => { trackEvent('dispute_letter_exported', 'money'); window.print(); };
  const handleMail = () => {
    trackEvent('dispute_letter_mailto', 'money');
    window.location.href = `mailto:?subject=${encodeURIComponent(`Dispute: ${charge.name}`)}&body=${encodeURIComponent(bodyText)}`;
  };

  return (
    <div className="reclaim-module">
      <style>{`@media print { .no-print { display: none !important; } .reclaim-module { max-width: none !important; } }`}</style>
      <button onClick={onBack} className="no-print inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 mb-6"><ArrowLeft className="w-4 h-4" /> Back to tracker</button>

      <div className="card p-6 mb-6">
        <p className="text-xs font-semibold tracking-[0.18em] uppercase text-gray-400 mb-1">Dispute Letter</p>
        <h2 className="text-2xl font-semibold mb-1">{vendor}</h2>
        <p className="text-sm text-gray-400 mb-4">{today}</p>
        <pre className="whitespace-pre-wrap text-sm font-sans leading-relaxed">{bodyText}</pre>
      </div>

      {template && (
        <div className="no-print card p-4 mb-6 text-sm">
          <p className="font-semibold">Similar disputes: {template.title}</p>
          <p className="text-gray-500">{template.description}</p>
          <p className="mt-1"><span className="font-medium" style={{ color: '#f0a700' }}>{template.successRate} success rate</span> · avg. recovery {template.avgRecovery}</p>
        </div>
      )}

      <div className="no-print card p-4 mb-6">
        <p className="font-semibold text-sm mb-1">Estimated annual recovery if resolved</p>
        <p className="text-2xl font-semibold" style={{ color: '#f0a700' }}>{money(annual)}/year</p>
      </div>

      <div className="no-print flex flex-wrap gap-3 mb-6">
        <button onClick={handlePrint} className="btn-gold inline-flex items-center gap-2"><Printer className="w-4 h-4" /> Print / Save as PDF</button>
        <button onClick={handleMail} className="text-sm font-medium px-4 py-2.5 rounded-lg border border-black/10 inline-flex items-center gap-2 hover:bg-gray-50"><Mail className="w-4 h-4" /> Send via email</button>
        <button onClick={() => onNavigate?.('vault')} className="text-sm font-medium px-4 py-2.5 rounded-lg border border-black/10 inline-flex items-center gap-2 hover:bg-gray-50"><FolderPlus className="w-4 h-4" /> Route to Money Vault</button>
      </div>

      <div className="no-print">
        <CompletionPrompt pillar="money" shareText={`I just found a ${money(charge.amount)} charge to dispute with Reclaim.`} />
      </div>
    </div>
  );
};

export default MoneySection;
