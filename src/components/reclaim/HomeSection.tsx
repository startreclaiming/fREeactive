import React, { useState } from 'react';
import { Plus, Trash2, Home, ShieldCheck, AlertTriangle, ScanLine, CalendarClock, Search, FolderPlus, BookOpen } from 'lucide-react';
import { useStored, uid } from './moduleUtils';
import { ModuleHeader, Stat, Badge, Empty } from './moduleUI';
import ApplianceScanner, { ApplianceScan } from './ApplianceScanner';
import CompletionPrompt from './CompletionPrompt';
import { healthIndexScore, healthTone, typicalLifespanFor } from '@/lib/applianceHealth';
import { recallsFor, RECALLS_URL } from '@/lib/recalls';
import { DIY_GUIDES } from '@/lib/data';
import { trackEvent } from '@/lib/usageTracking';
import './modules.css';

type Item = {
  id: string; name: string; category: string; brand: string; purchaseDate: string; warrantyMonths: number;
  modelNumber?: string; serialNumber?: string; nextServiceDate?: string;
};
const CATEGORIES = ['Appliance', 'Electronics', 'HVAC', 'Plumbing', 'Furniture', 'Other'];

// Which DIY_GUIDES categories are relevant to each item category (names don't line up 1:1).
const GUIDE_CATEGORY_MAP: Record<string, string[]> = {
  Appliance: ['Kitchen', 'Plumbing', 'Safety'],
  Electronics: ['Electrical', 'Safety'],
  HVAC: ['HVAC'],
  Plumbing: ['Plumbing', 'Bathroom'],
  Furniture: ['Storage', 'Walls & Ceilings'],
  Other: [],
};

const monthsLeft = (purchase: string, months: number): number | null => {
  if (!purchase || !months) return null;
  const end = new Date(purchase);
  end.setMonth(end.getMonth() + months);
  return Math.round((end.getTime() - Date.now()) / (1000 * 60 * 60 * 24 * 30.44));
};

const HomeSection: React.FC<{ onBack?: () => void; onNavigate?: (section: string) => void }> = ({ onBack, onNavigate }) => {
  const [items, setItems] = useStored<Item[]>('reclaim_home_items', []);
  const [form, setForm] = useState<Omit<Item, 'id'>>({ name: '', category: 'Appliance', brand: '', purchaseDate: '', warrantyMonths: 12 });
  const [scanOpen, setScanOpen] = useState(false);
  const [lastScan, setLastScan] = useState<ApplianceScan | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);

  const onScan = (r: ApplianceScan) => {
    setForm({
      ...form,
      name: r.modelName || form.name,
      brand: r.brand || form.brand,
      category: r.category || form.category,
      modelNumber: r.modelNumber || undefined,
      serialNumber: r.serialNumber || undefined,
      purchaseDate: !form.purchaseDate && r.manufactureYear ? `${r.manufactureYear}-01-01` : form.purchaseDate,
    });
    setLastScan(r);
    // No appliance content (category/brand) in analytics — see moduleUtils.ts's
    // useStored for why FREEactive must stay single-shot/no-persistence.
    trackEvent('scan_completed', 'home');
  };

  const add = () => {
    if (!form.name.trim()) return;
    setItems([{ id: uid(), ...form, name: form.name.trim(), brand: form.brand.trim() }, ...items]);
    setForm({ name: '', category: 'Appliance', brand: '', purchaseDate: '', warrantyMonths: 12 });
    setLastScan(null);
    setScanOpen(false);
  };
  const remove = (id: string) => setItems(items.filter((i) => i.id !== id));
  const scheduleService = (id: string) => {
    const next = new Date();
    next.setMonth(next.getMonth() + 6);
    setItems(items.map((i) => (i.id === id ? { ...i, nextServiceDate: next.toISOString().slice(0, 10) } : i)));
    trackEvent('schedule_maintenance', 'home');
  };
  const searchManual = (item: Item) => {
    trackEvent('search_manual', 'home');
    const q = encodeURIComponent(`${item.brand} ${item.name} manual pdf`);
    window.open(`https://www.google.com/search?q=${q}`, '_blank', 'noopener,noreferrer');
  };
  const addToVault = () => onNavigate?.('vault');

  const expiringSoon = items.filter((i) => { const m = monthsLeft(i.purchaseDate, i.warrantyMonths); return m !== null && m >= 0 && m <= 2; }).length;
  const avgHealth = items.length
    ? Math.round(items.reduce((s, i) => s + (healthIndexScore(i.category, i.purchaseDate) ?? 100), 0) / items.length)
    : null;

  return (
    <div className="reclaim-module">
      <ModuleHeader onBack={onBack} icon={<Home className="w-5 h-5" />} eyebrow="Home"
        title="Household Inventory"
        blurb="Anticipate the failure. Scan an appliance's rating plate to log it, track its health, and catch recalls before they cost you." />

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <Stat label="Items tracked" value={items.length} />
        <Stat label="Warranties expiring soon" value={expiringSoon} accent />
        <Stat label="Home health" value={avgHealth !== null ? `${avgHealth}%` : '—'} />
      </div>

      <div className="card p-5 mb-8">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-xl font-semibold">Add an item</h3>
          <button type="button" onClick={() => setScanOpen((v) => !v)}
            className="inline-flex items-center gap-1.5 text-sm font-medium" style={{ color: '#f0a700' }}>
            <ScanLine className="w-4 h-4" /> {scanOpen ? 'Hide scanner' : 'Scan an appliance'}
          </button>
        </div>

        {scanOpen && (
          <div className="mb-4">
            <ApplianceScanner onDetect={onScan} onClose={() => setScanOpen(false)} />
          </div>
        )}

        {lastScan && (lastScan.brand || lastScan.modelName) && (
          <p className="text-sm text-gray-500 mb-4">Recognized <span className="font-medium text-gray-700">{[lastScan.brand, lastScan.modelName].filter(Boolean).join(' ')}</span> — check the details below, then add it.</p>
        )}

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
          <input className="input" placeholder="Name (e.g. Samsung oven)" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <input className="input" placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
          <select className="input" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}>
            {CATEGORIES.map((c) => <option key={c}>{c}</option>)}
          </select>
          <label className="text-sm text-gray-500 flex flex-col gap-1">Purchase date
            <input type="date" className="input" value={form.purchaseDate} onChange={(e) => setForm({ ...form, purchaseDate: e.target.value })} />
          </label>
          <label className="text-sm text-gray-500 flex flex-col gap-1">Warranty (months)
            <input type="number" min={0} className="input" value={form.warrantyMonths} onChange={(e) => setForm({ ...form, warrantyMonths: Number(e.target.value) })} />
          </label>
          <button onClick={add} className="btn-gold self-end"><Plus className="w-4 h-4" /> Add item</button>
        </div>

        {lastScan && (lastScan.brand || lastScan.modelName) && (
          <div className="mt-4">
            <CompletionPrompt pillar="home" shareText={`I just scanned my ${[lastScan.brand, lastScan.modelName].filter(Boolean).join(' ')} into Reclaim to track its warranty and health.`} />
          </div>
        )}
      </div>

      {items.length === 0 ? <Empty>No items yet. Scan or add your first appliance above.</Empty> : (
        <div className="space-y-3">
          {items.map((i) => {
            const m = monthsLeft(i.purchaseDate, i.warrantyMonths);
            const warrantyStatus = m === null ? null : m < 0 ? 'expired' : m <= 2 ? 'soon' : 'active';
            const health = healthIndexScore(i.category, i.purchaseDate);
            const recalls = recallsFor(i.category, i.brand);
            const guides = DIY_GUIDES.filter((g) => (GUIDE_CATEGORY_MAP[i.category] || []).includes(g.category)).slice(0, 2);
            const isOpen = expanded === i.id;
            return (
              <div key={i.id} className="card p-4">
                <button onClick={() => setExpanded(isOpen ? null : i.id)} className="w-full flex items-center justify-between gap-4 text-left">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{i.name}{i.brand ? <span className="text-gray-400 font-normal"> · {i.brand}</span> : null}</p>
                    <p className="text-sm text-gray-500">{i.category}{i.purchaseDate ? ` · bought ${i.purchaseDate}` : ''}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {health !== null && <Badge tone={healthTone(health)}><ShieldCheck className="w-3.5 h-3.5" /> {health}% health</Badge>}
                    {warrantyStatus === 'active' && <Badge tone="green">{m}mo warranty</Badge>}
                    {warrantyStatus === 'soon' && <Badge tone="gold"><AlertTriangle className="w-3.5 h-3.5" /> expires {m}mo</Badge>}
                    {warrantyStatus === 'expired' && <Badge tone="gray">warranty ended</Badge>}
                  </div>
                </button>

                {recalls.length > 0 && (
                  <div className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
                    <p className="font-semibold text-[#8a6200] mb-1 flex items-center gap-1.5"><AlertTriangle className="w-4 h-4" /> Possible recall pattern</p>
                    {recalls.map((r, idx) => <p key={idx} className="text-[#8a6200]">{r.note}</p>)}
                    <a href={RECALLS_URL} target="_blank" rel="noreferrer" className="underline text-[#8a6200]">Check recalls.gov for this exact model</a>
                  </div>
                )}

                {isOpen && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <p className="text-xs text-gray-400 mb-3">Typical lifespan for {i.category.toLowerCase()}: ~{typicalLifespanFor(i.category)} years{i.nextServiceDate ? ` · next service ${i.nextServiceDate}` : ''}</p>

                    {guides.length > 0 && (
                      <div className="mb-4">
                        <p className="text-xs font-semibold tracking-wide uppercase text-gray-400 mb-2 flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" /> Relevant DIY guides</p>
                        <div className="space-y-1">
                          {guides.map((g) => (
                            <p key={g.id} className="text-sm"><span className="font-medium">{g.title}</span> — {g.estimatedCost}, {g.timeEstimate}</p>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex flex-wrap gap-2">
                      <button onClick={() => scheduleService(i.id)} className="text-sm font-medium px-3 py-2 rounded-lg border border-black/10 inline-flex items-center gap-1.5 hover:bg-gray-50"><CalendarClock className="w-3.5 h-3.5" /> Schedule maintenance</button>
                      <button onClick={() => searchManual(i)} className="text-sm font-medium px-3 py-2 rounded-lg border border-black/10 inline-flex items-center gap-1.5 hover:bg-gray-50"><Search className="w-3.5 h-3.5" /> Search for manual</button>
                      <button onClick={addToVault} className="text-sm font-medium px-3 py-2 rounded-lg border border-black/10 inline-flex items-center gap-1.5 hover:bg-gray-50"><FolderPlus className="w-3.5 h-3.5" /> Add to vault</button>
                      <button onClick={() => remove(i.id)} className="text-sm text-gray-400 hover:text-red-500 transition-colors inline-flex items-center gap-1.5 ml-auto"><Trash2 className="w-3.5 h-3.5" /> Remove</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default HomeSection;
