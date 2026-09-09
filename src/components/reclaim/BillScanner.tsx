import React, { useRef, useState } from 'react';
import { ScanLine, Loader2, X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export type Verdict = 'clear' | 'review' | 'vampire';
export type BillFlag = { label: string; reason: string; severity?: 'confirm' | 'dispute' };
export type BillScan = {
  kind?: string;            // what the document looks like (e.g. "utility bill", "receipt")
  vendor: string;
  amount: number | null;
  amounts: number[];
  text: string;
  flags?: BillFlag[];
  verdict?: Verdict;        // AI's overall call: clear / review / vampire
};

/** Heuristic parse of raw OCR text (on-device fallback). */
export function parseBill(text: string): BillScan {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const grab = (s: string): number[] => {
    const re = /(?:[$£€]\s?)?((?:\d{1,3}(?:,\d{3})+|\d+)\.\d{2})/g;
    const out: number[] = [];
    let m: RegExpExecArray | null;
    while ((m = re.exec(s)) !== null) {
      const n = parseFloat(m[1].replace(/,/g, ''));
      if (!isNaN(n) && n > 0 && n < 1_000_000) out.push(n);
    }
    return out;
  };
  const all = grab(text);
  let total: number | null = null;
  const totalLine = lines.find((l) => /(total|amount\s*due|balance|due)/i.test(l) && grab(l).length > 0);
  if (totalLine) total = Math.max(...grab(totalLine));
  if (total === null && all.length) total = Math.max(...all);
  const vendor =
    lines.find(
      (l) =>
        /[A-Za-z]{3,}/.test(l) &&
        !/(total|amount|invoice|receipt|date|tel|phone|account|ref|vat|tax|www\.|@)/i.test(l) &&
        l.replace(/[^A-Za-z]/g, '').length >= 3
    ) || '';
  return { vendor: vendor.slice(0, 60), amount: total, amounts: Array.from(new Set(all)).sort((a, b) => b - a), text };
}

/** Map the Edge Function's structured JSON into a BillScan. */
function fromAI(bill: any): BillScan {
  const items = Array.isArray(bill?.line_items) ? bill.line_items : [];
  const nums = [bill?.total, ...items.map((i: any) => i?.amount)].filter((n: any) => typeof n === 'number' && n > 0) as number[];
  const verdict: Verdict | undefined =
    bill?.verdict === 'clear' || bill?.verdict === 'review' || bill?.verdict === 'vampire' ? bill.verdict : undefined;
  return {
    kind: typeof bill?.doc_type === 'string' ? bill.doc_type : '',
    vendor: typeof bill?.vendor === 'string' ? bill.vendor : '',
    amount: typeof bill?.total === 'number' ? bill.total : (nums[0] ?? null),
    amounts: Array.from(new Set(nums)).sort((a, b) => b - a),
    text: '',
    flags: Array.isArray(bill?.flags)
      ? bill.flags
          .filter((f: any) => f && f.label)
          .map((f: any) => ({
            label: String(f.label),
            reason: String(f.reason || ''),
            severity: f.severity === 'dispute' ? 'dispute' : f.severity === 'confirm' ? 'confirm' : undefined,
          }))
      : [],
    verdict,
  };
}

/** Downscale + re-encode so uploads stay small and reliable for the API. */
function readResized(file: File, maxDim = 1600): Promise<{ data: string; mediaType: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
      const w = Math.max(1, Math.round(img.width * scale));
      const h = Math.max(1, Math.round(img.height * scale));
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('canvas unavailable')); return; }
      ctx.drawImage(img, 0, 0, w, h);
      URL.revokeObjectURL(url);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.82);
      resolve({ data: dataUrl.split(',')[1], mediaType: 'image/jpeg' });
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('image load failed')); };
    img.src = url;
  });
}

/**
 * Reusable scan pipeline: AI vision first (Supabase `scan-bill`), with a
 * silent on-device OCR fallback. Used by both the Hub hero and the Money module.
 */
export async function scanDocument(
  file: File,
  onMode?: (m: 'ai' | 'ocr') => void,
  onProgress?: (p: number) => void,
): Promise<BillScan> {
  // 1) AI vision via the Supabase Edge Function.
  try {
    onMode?.('ai');
    const resized = await readResized(file);
    const { data, error } = await supabase.functions.invoke('scan-bill', {
      body: { imageBase64: resized.data, mediaType: resized.mediaType },
    });
    if (!error && data && data.bill && !data.error) return fromAI(data.bill);
  } catch {
    /* fall through to on-device OCR */
  }

  // 2) Fallback: on-device OCR (no backend needed).
  onMode?.('ocr');
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100));
    },
  });
  return parseBill(data.text || '');
}

const BillScanner: React.FC<{
  onDetect: (r: BillScan) => void;
  onClose?: () => void;
  title?: string;
  hint?: string;
}> = ({ onDetect, onClose, title = 'Scan a document', hint = 'Snap or upload a photo — we’ll read it and flag anything off.' }) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [mode, setMode] = useState<'ai' | 'ocr'>('ai');
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setBusy(true);
    setProgress(0);
    setMode('ai');
    setPreview(URL.createObjectURL(file));
    try {
      onDetect(await scanDocument(file, setMode, setProgress));
    } catch {
      setError('Could not read that image. Try a clearer, well-lit photo.');
    } finally {
      setBusy(false);
    }
  };

  const status = busy
    ? (mode === 'ai' ? 'Analysing with AI…' : `Reading on device… ${progress}%`)
    : error
      ? <span className="text-red-500">{error}</span>
      : hint;

  return (
    <div className="rounded-lg border border-dashed border-black/15 p-4 bg-gray-50/60">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.currentTarget.value = ''; }}
      />
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {preview ? (
            <img src={preview} alt="document" className="w-12 h-12 object-cover rounded-md border border-black/10 shrink-0" />
          ) : (
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-md" style={{ background: 'rgba(240,167,0,0.12)', color: '#f0a700' }}>
              <ScanLine className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm flex items-center gap-1.5">{title} <Sparkles className="w-3.5 h-3.5" style={{ color: '#f0a700' }} /></p>
            <p className="text-xs text-gray-500">{status}</p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <button type="button" onClick={() => inputRef.current?.click()} disabled={busy} className="btn-gold disabled:opacity-60">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <ScanLine className="w-4 h-4" />}
            {busy ? 'Scanning' : 'Scan'}
          </button>
          {onClose && <button type="button" onClick={onClose} className="text-gray-300 hover:text-gray-900"><X className="w-4 h-4" /></button>}
        </div>
      </div>
      {busy && (
        <div className="mt-3 h-1 rounded-full bg-gray-200 overflow-hidden">
          <div className={`h-full transition-all ${mode === 'ai' ? 'animate-pulse' : ''}`} style={{ width: mode === 'ai' ? '100%' : `${progress}%`, background: '#f0a700' }} />
        </div>
      )}
    </div>
  );
};

export default BillScanner;
