import React, { useEffect, useRef, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';

const SUPABASE_URL = 'https://cjfheftldokpokqmckri.supabase.co';

interface AlamedaLandingProps {
  onCheck?: () => void;
  onContinue?: () => void;
}

const DARK_BG = '#181818';
const GOLD = '#f0a700';
const GREY = '#888';

const ZIP_DATA: { zip: number; lat: number; lng: number; records: number; amount: number }[] = [
  {zip:94501,lat:37.7652,lng:-122.2416,records:44583,amount:1691823.56},
  {zip:94502,lat:37.7305,lng:-122.2436,records:7556,amount:270376.40},
  {zip:94536,lat:37.5485,lng:-121.9886,records:49356,amount:1778553.36},
  {zip:94537,lat:37.5485,lng:-121.9886,records:1380,amount:58970.15},
  {zip:94538,lat:37.5091,lng:-121.9480,records:55185,amount:2031240.63},
  {zip:94539,lat:37.5230,lng:-121.9180,records:31306,amount:1134304.41},
  {zip:94540,lat:37.6688,lng:-122.0808,records:1136,amount:46719.49},
  {zip:94541,lat:37.6688,lng:-122.0808,records:40719,amount:1492470.51},
  {zip:94542,lat:37.6580,lng:-122.0540,records:10501,amount:396832.24},
  {zip:94543,lat:37.6850,lng:-122.1080,records:434,amount:17484.07},
  {zip:94544,lat:37.6280,lng:-122.0660,records:47785,amount:1714061.53},
  {zip:94545,lat:37.6390,lng:-122.1050,records:23886,amount:887436.28},
  {zip:94546,lat:37.7280,lng:-122.0680,records:28916,amount:1041663.39},
  {zip:94550,lat:37.6819,lng:-121.7681,records:32715,amount:1207049.04},
  {zip:94551,lat:37.6610,lng:-121.7320,records:21396,amount:726499.71},
  {zip:94552,lat:37.7280,lng:-122.0540,records:7134,amount:250555.87},
  {zip:94555,lat:37.5780,lng:-122.0640,records:20426,amount:720672.56},
  {zip:94557,lat:37.6688,lng:-122.0808,records:373,amount:15169.18},
  {zip:94560,lat:37.5316,lng:-122.0402,records:29795,amount:1062103.00},
  {zip:94566,lat:37.6604,lng:-121.8758,records:29671,amount:1123018.72},
  {zip:94568,lat:37.7022,lng:-121.9358,records:31028,amount:1099163.02},
  {zip:94577,lat:37.7249,lng:-122.1561,records:33790,amount:1243161.01},
  {zip:94578,lat:37.7110,lng:-122.1280,records:25908,amount:939492.25},
  {zip:94579,lat:37.7010,lng:-122.1480,records:11254,amount:391281.42},
  {zip:94580,lat:37.6940,lng:-122.1180,records:16247,amount:565312.92},
  {zip:94586,lat:37.6604,lng:-121.8758,records:953,amount:35886.97},
  {zip:94587,lat:37.5934,lng:-122.0439,records:44202,amount:1569637.47},
  {zip:94588,lat:37.7022,lng:-121.8680,records:27194,amount:1002385.55},
  {zip:94601,lat:37.7780,lng:-122.2280,records:31033,amount:1172892.45},
  {zip:94602,lat:37.8040,lng:-122.2200,records:19749,amount:739689.27},
  {zip:94603,lat:37.7480,lng:-122.1780,records:20875,amount:758575.26},
  {zip:94604,lat:37.8044,lng:-122.2712,records:2255,amount:92018.30},
  {zip:94605,lat:37.7700,lng:-122.1780,records:32042,amount:1180903.28},
  {zip:94606,lat:37.7920,lng:-122.2480,records:25212,amount:985907.27},
  {zip:94607,lat:37.8050,lng:-122.2880,records:20724,amount:801808.59},
  {zip:94608,lat:37.8313,lng:-122.2852,records:27823,amount:1075516.25},
  {zip:94609,lat:37.8350,lng:-122.2630,records:20026,amount:775019.41},
  {zip:94610,lat:37.8120,lng:-122.2480,records:26249,amount:1004491.30},
  {zip:94611,lat:37.8244,lng:-122.2117,records:31623,amount:1224266.76},
  {zip:94612,lat:37.8044,lng:-122.2712,records:17954,amount:734110.54},
  {zip:94613,lat:37.7480,lng:-122.1780,records:373,amount:15513.39},
  {zip:94614,lat:37.8044,lng:-122.2712,records:536,amount:24245.49},
  {zip:94615,lat:37.8044,lng:-122.2712,records:110,amount:4312.71},
  {zip:94617,lat:37.7960,lng:-122.2780,records:126,amount:5785.78},
  {zip:94618,lat:37.8430,lng:-122.2380,records:12376,amount:470043.03},
  {zip:94619,lat:37.7950,lng:-122.1980,records:16923,amount:631596.46},
  {zip:94620,lat:37.8244,lng:-122.2317,records:581,amount:24368.54},
  {zip:94621,lat:37.7480,lng:-122.1980,records:20407,amount:759235.00},
  {zip:94622,lat:37.8044,lng:-122.2712,records:23,amount:1031.85},
  {zip:94623,lat:37.8044,lng:-122.2712,records:1166,amount:49360.49},
  {zip:94624,lat:37.8044,lng:-122.2712,records:179,amount:7086.93},
  {zip:94649,lat:37.8044,lng:-122.2712,records:25,amount:838.33},
  {zip:94659,lat:37.8044,lng:-122.2712,records:12,amount:529.95},
  {zip:94660,lat:37.8044,lng:-122.2712,records:52,amount:2287.84},
  {zip:94661,lat:37.8244,lng:-122.2317,records:183,amount:7521.50},
  {zip:94662,lat:37.8044,lng:-122.2712,records:668,amount:26102.68},
  {zip:94701,lat:37.8716,lng:-122.2727,records:838,amount:35024.63},
  {zip:94702,lat:37.8650,lng:-122.2830,records:13610,amount:510937.53},
  {zip:94703,lat:37.8620,lng:-122.2680,records:15715,amount:597574.73},
  {zip:94704,lat:37.8680,lng:-122.2580,records:23296,amount:914606.86},
  {zip:94705,lat:37.8560,lng:-122.2480,records:13192,amount:513344.74},
  {zip:94706,lat:37.8869,lng:-122.2977,records:13577,amount:506795.24},
  {zip:94707,lat:37.8920,lng:-122.2680,records:9617,amount:368183.09},
  {zip:94708,lat:37.8950,lng:-122.2480,records:8280,amount:320535.73},
  {zip:94709,lat:37.8780,lng:-122.2630,records:10625,amount:419629.83},
  {zip:94710,lat:37.8480,lng:-122.2980,records:7394,amount:290016.81},
  {zip:94712,lat:37.8716,lng:-122.2727,records:384,amount:15039.11},
  {zip:94720,lat:37.8719,lng:-122.2585,records:2759,amount:106713.92},
];

const TOTAL_AMOUNT = 551147544.45; // Live total from alameda_property_cache, validated June 2026

interface SearchResult {
  id: number;
  owner_name: string;
  holder_name?: string;
  last_known_address?: string;
  amount?: number;
  property_type?: string;
  zipcode?: number;
}

type SheetState = 'peek' | 'half' | 'full';
type ClaimStep = 'list' | 'email' | 'sent';

const AlamedaLanding: React.FC<AlamedaLandingProps> = ({ onCheck, onContinue }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);

  const [searchName, setSearchName] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [searched, setSearched] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);

  const [sheetState, setSheetState] = useState<SheetState>('peek');
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());
  const [claimStep, setClaimStep] = useState<ClaimStep>('list');
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [showDonateModal, setShowDonateModal] = useState(false);
  const [showAlertsModal, setShowAlertsModal] = useState(false);
  const [alertsEmail, setAlertsEmail] = useState('');
  const [alertsPassword, setAlertsPassword] = useState('');
  const [alertsPlan, setAlertsPlan] = useState<'trial' | 'paid' | null>(null);
  const [alertsSubmitting, setAlertsSubmitting] = useState(false);
  const [alertsError, setAlertsError] = useState<string | null>(null);
  const [alertsDone, setAlertsDone] = useState(false);

  const dragStartY = useRef<number | null>(null);
  const dragStartState = useRef<SheetState>('peek');

  useEffect(() => {
    const loadScript = (src: string): Promise<void> =>
      new Promise((resolve, reject) => {
        if (document.querySelector(`script[src="${src}"]`)) { resolve(); return; }
        const s = document.createElement('script');
        s.src = src; s.onload = () => resolve(); s.onerror = reject;
        document.head.appendChild(s);
      });
    const loadCSS = (href: string) => {
      if (document.querySelector(`link[href="${href}"]`)) return;
      const l = document.createElement('link');
      l.rel = 'stylesheet'; l.href = href;
      document.head.appendChild(l);
    };

    loadCSS('https://unpkg.com/leaflet@1.9.4/dist/leaflet.css');
    loadScript('https://unpkg.com/leaflet@1.9.4/dist/leaflet.js')
      .then(() => loadScript('https://unpkg.com/leaflet.heat@0.2.0/dist/leaflet-heat.js'))
      .then(() => {
        if (!mapRef.current || mapInstance.current) return;
        const L = (window as any).L;

        const map = L.map(mapRef.current, { zoomControl: false, attributionControl: false, maxZoom: 15 })
          .setView([37.72, -122.05], 11);

        L.tileLayer('https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}', { maxZoom: 15, attribution: '© Esri' }).addTo(map);

        const maxAmt = Math.max(...ZIP_DATA.map(z => z.amount));
        const heatData: [number, number, number][] = [];

        ZIP_DATA.forEach(z => {
          const intensity = maxAmt > 0 ? Math.min(z.amount / maxAmt, 1) : 0;
          const pts = Math.min(Math.max(Math.round(intensity * 30), 4), 30);
          for (let i = 0; i < pts; i++) {
            heatData.push([
              z.lat + (Math.random() - 0.5) * 0.025,
              z.lng + (Math.random() - 0.5) * 0.025,
              Math.max(intensity, 0.15),
            ]);
          }
        });

        L.heatLayer(heatData, {
          radius: 28, blur: 32, maxZoom: 15,
          gradient: { 0.2: '#22c55e', 0.4: '#84cc16', 0.55: '#eab308', 0.7: '#f97316', 0.85: '#ef4444', 1.0: '#dc2626' },
        }).addTo(map);

        mapInstance.current = map;
      });

    return () => {
      if (mapInstance.current) { mapInstance.current.remove(); mapInstance.current = null; }
    };
  }, []);

  const doSearch = useCallback(async () => {
    const name = searchName.trim();
    if (!name) return;
    setSearching(true);
    setSearched(true);
    setSearchError(null);
    setSelectedIds(new Set());
    setClaimStep('list');
    setSheetState('half');

    const runQuery = () => supabase
      .from('alameda_property_cache')
      .select('id, owner_name, holder_name, last_known_address, amount, property_type, zipcode')
      .ilike('owner_name', `%${name}%`)
      .gt('amount', 10)
      .limit(75);

    const withTimeout = <T,>(promise: PromiseLike<T>, ms: number): Promise<T> =>
      new Promise((resolve, reject) => {
        const timer = setTimeout(() => reject(new Error('timeout')), ms);
        Promise.resolve(promise).then(
          (val) => { clearTimeout(timer); resolve(val); },
          (err) => { clearTimeout(timer); reject(err); }
        );
      });

    let lastError: any = null;
    const maxAttempts = 3;

    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
      try {
        const { data, error } = await withTimeout(runQuery(), 8000);
        if (error) {
          lastError = error;
          continue;
        }
        setResults(data || []);
        setSearchError(null);
        supabase.from('search_log').insert({
          search_term: name,
          result_count: (data || []).length,
        }).then(() => {}, () => {});
        setSearching(false);
        return;
      } catch (err: any) {
        lastError = err;
        // brief backoff before retrying
        if (attempt < maxAttempts) {
          await new Promise(r => setTimeout(r, 400 * attempt));
        }
      }
    }

    setSearchError(lastError?.message || 'Search failed. Please try again.');
    setResults([]);
    setSearching(false);
  }, [searchName]);

  const fmtAmt = (v: number | undefined) => {
    const n = Number(v);
    return Number.isFinite(n) ? '$' + n.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '—';
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

  const sendClaimEmail = async () => {
    if (!email.trim() || selectedProperties.length === 0) return;
    setSending(true);
    setSendError(null);
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/send-claim-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), properties: selectedProperties }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to send');
      setClaimStep('sent');
      setTimeout(() => setShowDonateModal(true), 3000);
    } catch (err: any) {
      setSendError(err?.message || 'Failed to send email');
    }
    setSending(false);
  };

  const resetAll = () => {
    setClaimStep('list');
    setSelectedIds(new Set());
    setSearchName('');
    setSearched(false);
    setResults([]);
    setEmail('');
    setSheetState('peek');
  };

  const sheetHeights: Record<SheetState, string> = {
    peek: '120px',
    half: '50vh',
    full: '88vh',
  };

  const onDragStart = (clientY: number) => {
    dragStartY.current = clientY;
    dragStartState.current = sheetState;
  };

  const onDragMove = (clientY: number) => {
    if (dragStartY.current === null) return;
    const delta = dragStartY.current - clientY;
    if (delta > 60 && dragStartState.current === 'peek') setSheetState('half');
    if (delta > 60 && dragStartState.current === 'half') setSheetState('full');
    if (delta < -60 && dragStartState.current === 'full') setSheetState('half');
    if (delta < -60 && dragStartState.current === 'half') setSheetState('peek');
  };

  const onDragEnd = () => {
    dragStartY.current = null;
  };

  useEffect(() => {
    if (!document.querySelector('link[href*="Poppins"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap';
      document.head.appendChild(link);
    }
  }, []);

  return (
    <div style={{ position: 'relative' as const, width: '100%', height: '100vh', overflow: 'hidden', background: DARK_BG, fontFamily: "'Poppins', sans-serif" }}>

      <div ref={mapRef} style={{ position: 'absolute' as const, top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }} />

      <div style={{
        position: 'absolute' as const, top: 0, left: 0, right: 0, height: 140,
        background: 'linear-gradient(to bottom, rgba(0,0,0,0.55), transparent)',
        pointerEvents: 'none' as const, zIndex: 400,
      }} />

      <div style={{
        position: 'absolute' as const, top: 0, left: 0, right: 0, zIndex: 500,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '16px 16px 0',
      }}>
        <span style={{ color: GOLD, fontWeight: 700, fontSize: 15, letterSpacing: 1, textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}>
          RECL◀IM
        </span>
        <button
          onClick={onContinue}
          style={{
            background: 'rgba(20,20,20,0.7)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)',
            color: '#fff', fontSize: 11, padding: '8px 14px', borderRadius: 20, cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          ← Home
        </button>
      </div>

      <div style={{
        position: 'absolute' as const, top: 60, left: 16, right: 16, zIndex: 500,
      }}>
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(24,24,24,0.88)', backdropFilter: 'blur(10px)',
          border: '1px solid rgba(255,255,255,0.1)', borderRadius: 28,
          padding: '6px 8px 6px 18px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        }}>
          <span style={{ color: GOLD, fontSize: 16 }}>⌕</span>
          <input
            type="text"
            value={searchName}
            onChange={e => setSearchName(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') doSearch(); }}
            placeholder="Search your name…"
            style={{
              flex: 1, background: 'transparent', border: 'none', outline: 'none',
              color: '#fff', fontFamily: 'inherit', fontSize: 14, padding: '10px 4px',
            }}
          />
          <button
            onClick={doSearch}
            disabled={searching}
            style={{
              background: GOLD, color: '#111', border: 'none', borderRadius: 22,
              padding: '10px 20px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit',
              whiteSpace: 'nowrap' as const,
            }}
          >
            {searching ? '···' : 'Search'}
          </button>
        </div>

        {!searched && (
          <div style={{
            marginTop: 10, display: 'inline-block', background: 'rgba(24,24,24,0.8)', backdropFilter: 'blur(8px)',
            border: '1px solid rgba(240,167,0,0.25)', borderRadius: 20, padding: '8px 16px',
          }}>
            <span style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>${(TOTAL_AMOUNT / 1000000).toFixed(1)}M</span>
            <span style={{ color: '#ccc', fontSize: 12, marginLeft: 6 }}>waiting to be claimed in Alameda County</span>
          </div>
        )}
      </div>

      <div
        style={{
          position: 'absolute' as const, left: 0, right: 0, bottom: 0, zIndex: 600,
          height: sheetHeights[sheetState],
          background: '#141414',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          borderTopLeftRadius: 20, borderTopRightRadius: 20,
          boxShadow: '0 -8px 30px rgba(0,0,0,0.5)',
          transition: dragStartY.current === null ? 'height 0.28s cubic-bezier(0.22, 1, 0.36, 1)' : 'none',
          display: 'flex', flexDirection: 'column' as const,
          touchAction: 'none' as const,
        }}
      >
        <div
          onMouseDown={e => onDragStart(e.clientY)}
          onMouseMove={e => { if (dragStartY.current !== null) onDragMove(e.clientY); }}
          onMouseUp={onDragEnd}
          onMouseLeave={onDragEnd}
          onTouchStart={e => onDragStart(e.touches[0].clientY)}
          onTouchMove={e => onDragMove(e.touches[0].clientY)}
          onTouchEnd={onDragEnd}
          style={{ padding: '10px 0 6px', display: 'flex', justifyContent: 'center', cursor: 'grab', flexShrink: 0 }}
        >
          <div style={{ width: 40, height: 4, borderRadius: 4, background: 'rgba(255,255,255,0.25)' }} />
        </div>

        <div style={{ flex: 1, overflowY: 'auto' as const, padding: '4px 16px 20px' }}>

          {sheetState === 'peek' && !searched && (
            <div onClick={() => setSheetState('half')} style={{ textAlign: 'center' as const, padding: '10px 0', cursor: 'pointer' }}>
              <div style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>1 in 3 households have unclaimed property</div>
              <div style={{ color: GREY, fontSize: 11, marginTop: 4 }}>Search your name to check — it's free</div>
            </div>
          )}
          {sheetState === 'peek' && searched && results.length > 0 && claimStep === 'list' && (
            <div onClick={() => setSheetState('half')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 4px', cursor: 'pointer' }}>
              <span style={{ color: '#fff', fontSize: 14, fontWeight: 600 }}>{results.length} matches found</span>
              <span style={{ color: GOLD, fontSize: 13 }}>Drag up ↑</span>
            </div>
          )}

          {sheetState !== 'peek' && claimStep === 'list' && (
            <>
              {!searched && (
                <div style={{ textAlign: 'center' as const, padding: 28, color: '#666', fontSize: 13 }}>
                  Search your name above to check for unclaimed property.
                </div>
              )}
              {searchError && <div style={{ textAlign: 'center' as const, padding: 16, color: '#ef4444', fontSize: 12 }}>Error: {searchError}</div>}
              {searched && !searchError && results.length === 0 && !searching && (
                <div style={{ textAlign: 'center' as const, padding: 28, color: '#666', fontSize: 13 }}>No results for "{searchName}". Try a different spelling.</div>
              )}
              {results.length > 0 && (
                <div style={{ color: '#888', fontSize: 11, padding: '4px 4px 12px' }}>
                  {results.length} matches · tap any that may be yours
                </div>
              )}

              {results.map(r => {
                const isSelected = selectedIds.has(r.id);
                return (
                  <div
                    key={r.id}
                    onClick={() => toggleSelect(r.id)}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                      padding: '16px', background: isSelected ? 'rgba(240,167,0,0.14)' : '#1e1e1e',
                      borderRadius: 14, marginBottom: 10, cursor: 'pointer',
                      border: isSelected ? `1.5px solid ${GOLD}` : '1.5px solid transparent',
                      boxShadow: isSelected ? '0 4px 16px rgba(240,167,0,0.15)' : '0 2px 8px rgba(0,0,0,0.2)',
                      transition: 'all 0.15s ease',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, flex: 1 }}>
                      <div style={{
                        width: 26, height: 26, borderRadius: '50%', flexShrink: 0,
                        background: isSelected ? GOLD : 'rgba(255,255,255,0.08)',
                        border: isSelected ? 'none' : '1.5px solid rgba(255,255,255,0.2)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 14, color: '#111', fontWeight: 700,
                      }}>
                        {isSelected ? '✓' : ''}
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: 14, color: '#fff', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>{r.owner_name}</div>
                        <div style={{ fontSize: 11, color: '#777', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const }}>
                          {[r.last_known_address, r.holder_name].filter(Boolean).join(' · ')}
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: 17, fontWeight: 700, color: GOLD, whiteSpace: 'nowrap' as const, marginLeft: 10 }}>
                      {fmtAmt(r.amount)}
                    </div>
                  </div>
                );
              })}
              <div style={{ height: selectedIds.size > 0 ? 90 : 8 }} />
            </>
          )}

          {claimStep === 'email' && (
            <div style={{ padding: '8px 2px' }}>
              <h3 style={{ color: '#fff', fontSize: 17, fontWeight: 700, margin: '6px 0 4px' }}>Almost there</h3>
              <p style={{ color: '#999', fontSize: 12, lineHeight: 1.6, margin: '0 0 16px' }}>
                We'll email your claim guide with everything needed to file with the State Controller's Office. We'll never spam you.
              </p>

              <div style={{ background: '#1e1e1e', borderRadius: 14, padding: 14, marginBottom: 16 }}>
                {selectedProperties.map(p => (
                  <div key={p.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', fontSize: 12 }}>
                    <span style={{ color: '#bbb', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' as const, marginRight: 8 }}>{p.owner_name}</span>
                    <span style={{ color: GOLD, fontWeight: 600, flexShrink: 0 }}>{fmtAmt(p.amount)}</span>
                  </div>
                ))}
                <div style={{ display: 'flex', justifyContent: 'space-between', paddingTop: 10, marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.08)' }}>
                  <span style={{ color: '#fff', fontWeight: 700, fontSize: 13 }}>Total</span>
                  <span style={{ color: '#4caf50', fontWeight: 700, fontSize: 15 }}>{fmtAmt(totalSelected)}</span>
                </div>
              </div>

              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') sendClaimEmail(); }}
                placeholder="your@email.com"
                style={{
                  width: '100%', boxSizing: 'border-box' as const, background: '#1e1e1e',
                  border: '1px solid rgba(255,255,255,0.12)', borderRadius: 12,
                  padding: '14px 16px', color: '#fff', fontFamily: 'inherit', fontSize: 15, outline: 'none', marginBottom: 12,
                }}
              />
              {sendError && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{sendError}</div>}

              <button
                onClick={() => setClaimStep('list')}
                style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, marginBottom: 10, cursor: 'pointer', fontFamily: 'inherit' }}
              >
                ← back to results
              </button>
            </div>
          )}

          {claimStep === 'sent' && (
            <div style={{ textAlign: 'center' as const, padding: '20px 8px' }}>
              <div style={{ fontSize: 40, marginBottom: 10 }}>🎉</div>
              <h3 style={{ color: '#4caf50', fontSize: 17, fontWeight: 700, margin: '0 0 6px' }}>Your claim guide is on its way!</h3>
              <p style={{ color: '#999', fontSize: 12, lineHeight: 1.6, margin: '0 0 20px' }}>
                Check <strong style={{ color: '#fff' }}>{email}</strong> — we sent everything you need to claim <strong style={{ color: '#4caf50' }}>{fmtAmt(totalSelected)}</strong>.
              </p>
              <button
                onClick={resetAll}
                style={{ background: 'none', border: '1px solid rgba(255,255,255,0.15)', color: '#aaa', borderRadius: 20, padding: '10px 22px', cursor: 'pointer', fontFamily: 'inherit', fontSize: 12 }}
              >
                Search again
              </button>
            </div>
          )}
        </div>

        {claimStep === 'list' && selectedIds.size > 0 && (
          <div style={{
            position: 'absolute' as const, left: 16, right: 16, bottom: 'calc(16px + env(safe-area-inset-bottom, 0px))',
            background: GOLD, borderRadius: 16, padding: '14px 18px',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            boxShadow: '0 8px 24px rgba(240,167,0,0.35)', cursor: 'pointer',
          }} onClick={() => setClaimStep('email')}>
            <div>
              <div style={{ color: '#111', fontWeight: 700, fontSize: 14 }}>{selectedIds.size} selected</div>
              <div style={{ color: 'rgba(17,17,17,0.7)', fontSize: 12, fontWeight: 600 }}>{fmtAmt(totalSelected)}</div>
            </div>
            <div style={{ color: '#111', fontWeight: 700, fontSize: 14 }}>
              Claim now →
            </div>
          </div>
        )}

        {claimStep === 'email' && (
          <div style={{ padding: '0 16px calc(16px + env(safe-area-inset-bottom, 0px))' }}>
            <button
              onClick={sendClaimEmail}
              disabled={sending || !email.trim()}
              style={{
                width: '100%', background: (sending || !email.trim()) ? '#555' : GOLD, color: '#111',
                border: 'none', borderRadius: 16, padding: '16px', fontWeight: 700, fontSize: 14,
                cursor: (sending || !email.trim()) ? 'not-allowed' : 'pointer', fontFamily: 'inherit',
                boxShadow: (sending || !email.trim()) ? 'none' : '0 8px 24px rgba(240,167,0,0.35)',
              }}
            >
              {sending ? 'Sending…' : 'Send my claim guide →'}
            </button>
          </div>
        )}
      </div>

      {showDonateModal && (
        <div
          onClick={() => { setShowDonateModal(false); setShowAlertsModal(true); }}
          style={{
            position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a1a', border: '1px solid rgba(240,167,0,0.3)', borderRadius: 20,
              padding: 28, maxWidth: 380, width: '100%', textAlign: 'center' as const,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)',
            }}
          >
            <div style={{ fontSize: 36, marginBottom: 10 }}>💛</div>
            <h3 style={{ color: GOLD, fontSize: 19, fontWeight: 700, margin: '0 0 8px' }}>Support Reclaim</h3>
            <p style={{ color: '#aaa', fontSize: 12, lineHeight: 1.6, margin: '0 0 18px' }}>
              You just found <strong style={{ color: '#4caf50' }}>{fmtAmt(totalSelected)}</strong>. This tool is free — a small contribution helps us keep building it.
            </p>

            {totalSelected >= 100 && (
              <button
                onClick={() => { window.open('https://buy.stripe.com/cNiaEZ63iajO31CcV9bsc02', '_blank'); setShowDonateModal(false); setShowAlertsModal(true); }}
                style={{
                  width: '100%', background: 'rgba(240,167,0,0.12)', border: `1.5px solid ${GOLD}`,
                  borderRadius: 12, padding: '14px 16px', marginBottom: 16, cursor: 'pointer',
                  textAlign: 'left' as const, display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                }}
              >
                <div>
                  <div style={{ color: GOLD, fontWeight: 700, fontSize: 13 }}>Give back 10%</div>
                  <div style={{ color: '#999', fontSize: 11, marginTop: 2 }}>Suggested for larger finds like yours</div>
                </div>
                <div style={{ color: '#fff', fontWeight: 700, fontSize: 18 }}>{fmtAmt(totalSelected * 0.1)}</div>
              </button>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10, marginBottom: 16 }}>
              {[10, 20, 50].map((amt) => (
                <button
                  key={amt}
                  onClick={() => { window.open('https://buy.stripe.com/cNiaEZ63iajO31CcV9bsc02', '_blank'); setShowDonateModal(false); setShowAlertsModal(true); }}
                  style={{
                    background: GOLD, color: '#111', border: 'none', borderRadius: 12,
                    padding: '16px 0', fontWeight: 700, fontSize: 17, cursor: 'pointer', fontFamily: 'inherit',
                  }}
                >
                  ${amt}
                </button>
              ))}
            </div>

            <button
              onClick={() => { setShowDonateModal(false); setShowAlertsModal(true); }}
              style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
            >
              Maybe later
            </button>
          </div>
        </div>
      )}

      {/* ── ALERTS / ACCOUNT SIGNUP MODAL ── */}
      {showAlertsModal && (
        <div
          onClick={() => { setShowAlertsModal(false); onContinue && onContinue(); }}
          style={{
            position: 'fixed' as const, top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 2000, padding: 20,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: '#1a1a1a', border: '1px solid rgba(240,167,0,0.3)', borderRadius: 20,
              padding: 28, maxWidth: 420, width: '100%', textAlign: 'center' as const,
              boxShadow: '0 20px 60px rgba(0,0,0,0.6)', maxHeight: '85vh', overflowY: 'auto' as const,
              position: 'relative' as const,
            }}
          >
            <button
              onClick={() => { setShowAlertsModal(false); onContinue && onContinue(); }}
              style={{
                position: 'absolute' as const, top: 14, right: 16,
                background: 'none', border: 'none', color: '#666', fontSize: 20,
                cursor: 'pointer', fontFamily: 'inherit', lineHeight: 1,
              }}
            >✕</button>
            {alertsDone ? (
              <>
                <div style={{ fontSize: 36, marginBottom: 10 }}>🎉</div>
                <h3 style={{ color: '#4caf50', fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>You're all set!</h3>
                <p style={{ color: '#aaa', fontSize: 13, lineHeight: 1.6, margin: '0 0 20px' }}>
                  Check <strong style={{ color: '#fff' }}>{alertsEmail}</strong> to confirm your account. We'll alert you the moment new property shows up in your name.
                </p>
                <button
                  onClick={() => { setShowAlertsModal(false); onContinue && onContinue(); }}
                  style={{ background: GOLD, color: '#111', border: 'none', borderRadius: 10, padding: '12px 28px', fontWeight: 700, fontSize: 13, cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Done
                </button>
              </>
            ) : (
              <>
                <div style={{ fontSize: 32, marginBottom: 10 }}>🔔</div>
                <h3 style={{ color: GOLD, fontSize: 18, fontWeight: 700, margin: '0 0 8px' }}>Want alerts when more property shows up in your name?</h3>
                <p style={{ color: '#aaa', fontSize: 12, lineHeight: 1.6, margin: '0 0 22px' }}>
                  New unclaimed property gets reported to the state every year. Create a free account and we'll watch for your name automatically.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginBottom: 18 }}>
                  <button
                    onClick={() => setAlertsPlan('trial')}
                    style={{
                      background: alertsPlan === 'trial' ? 'rgba(240,167,0,0.15)' : '#222',
                      border: `1.5px solid ${alertsPlan === 'trial' ? GOLD : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 12, padding: '16px 12px', cursor: 'pointer', textAlign: 'left' as const,
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>14-Day Free Trial</div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>All 4 modules, no card required</div>
                  </button>
                  <button
                    onClick={() => setAlertsPlan('paid')}
                    style={{
                      background: alertsPlan === 'paid' ? 'rgba(240,167,0,0.15)' : '#222',
                      border: `1.5px solid ${alertsPlan === 'paid' ? GOLD : 'rgba(255,255,255,0.1)'}`,
                      borderRadius: 12, padding: '16px 12px', cursor: 'pointer', textAlign: 'left' as const,
                    }}
                  >
                    <div style={{ color: '#fff', fontWeight: 700, fontSize: 14 }}>$50 / 6 months</div>
                    <div style={{ color: '#888', fontSize: 11, marginTop: 4 }}>Lock in early pricing now</div>
                  </button>
                </div>

                {alertsPlan && (
                  <div style={{ textAlign: 'left' as const }}>
                    <input
                      type="email"
                      value={alertsEmail}
                      onChange={e => setAlertsEmail(e.target.value)}
                      placeholder="your@email.com"
                      style={{
                        width: '100%', boxSizing: 'border-box' as const, background: '#222',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                        padding: '12px 14px', color: '#fff', fontFamily: 'inherit', fontSize: 14, outline: 'none', marginBottom: 10,
                      }}
                    />
                    <input
                      type="password"
                      value={alertsPassword}
                      onChange={e => setAlertsPassword(e.target.value)}
                      placeholder="Create a password"
                      style={{
                        width: '100%', boxSizing: 'border-box' as const, background: '#222',
                        border: '1px solid rgba(255,255,255,0.12)', borderRadius: 10,
                        padding: '12px 14px', color: '#fff', fontFamily: 'inherit', fontSize: 14, outline: 'none', marginBottom: 10,
                      }}
                    />

                    {alertsError && <div style={{ color: '#ef4444', fontSize: 12, marginBottom: 10 }}>{alertsError}</div>}

                    <button
                      onClick={async () => {
                        if (!alertsEmail.trim() || alertsPassword.length < 6) {
                          setAlertsError('Enter a valid email and a password with at least 6 characters.');
                          return;
                        }
                        setAlertsSubmitting(true);
                        setAlertsError(null);
                        try {
                          const { error } = await supabase.auth.signUp({
                            email: alertsEmail.trim(),
                            password: alertsPassword,
                          });
                          if (error) throw error;

                          if (alertsPlan === 'paid') {
                            window.open('https://buy.stripe.com/cNiaEZ63iajO31CcV9bsc02', '_blank');
                          }
                          setAlertsDone(true);
                        } catch (err: any) {
                          setAlertsError(err?.message || 'Something went wrong. Please try again.');
                        }
                        setAlertsSubmitting(false);
                      }}
                      disabled={alertsSubmitting}
                      style={{
                        width: '100%', background: alertsSubmitting ? '#555' : GOLD, color: '#111',
                        border: 'none', borderRadius: 10, padding: '14px', fontWeight: 700, fontSize: 14,
                        cursor: alertsSubmitting ? 'not-allowed' : 'pointer', fontFamily: 'inherit', marginBottom: 12,
                      }}
                    >
                      {alertsSubmitting
                        ? 'Creating account…'
                        : alertsPlan === 'paid'
                          ? 'Create account & pay $50 →'
                          : 'Start my free trial →'}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => { setShowAlertsModal(false); onContinue && onContinue(); }}
                  style={{ background: 'none', border: 'none', color: '#888', fontSize: 12, cursor: 'pointer', fontFamily: 'inherit', textDecoration: 'underline' }}
                >
                  No thanks
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AlamedaLanding;
