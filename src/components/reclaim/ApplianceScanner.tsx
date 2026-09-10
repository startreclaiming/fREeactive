import React, { useRef, useState } from 'react';
import { ScanLine, Loader2, X, Sparkles } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { readResized } from '@/lib/imageResize';

export type ApplianceScan = {
  brand: string;
  modelName: string;
  modelNumber: string | null;
  serialNumber: string | null;
  category: string;
  manufactureYear: string | null;
};

const CATEGORIES = ['Appliance', 'Electronics', 'HVAC', 'Plumbing', 'Furniture', 'Other'];

/** Heuristic parse of raw OCR text (on-device fallback) — rating plates rarely OCR cleanly,
 * so this just looks for obvious "model"/"serial" labels and otherwise leaves fields blank
 * for the user to fill in rather than guessing. */
function parseRatingPlate(text: string): ApplianceScan {
  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const grab = (label: RegExp) => {
    const line = lines.find((l) => label.test(l));
    if (!line) return null;
    const parts = line.split(/[:#]/);
    return parts.length > 1 ? parts.slice(1).join(':').trim() : null;
  };
  return {
    brand: '',
    modelName: '',
    modelNumber: grab(/model/i),
    serialNumber: grab(/serial/i),
    category: 'Other',
    manufactureYear: null,
  };
}

function fromAI(appliance: unknown): ApplianceScan {
  const a = (appliance || {}) as Record<string, unknown>;
  return {
    brand: typeof a.brand === 'string' ? a.brand : '',
    modelName: typeof a.modelName === 'string' ? a.modelName : '',
    modelNumber: typeof a.modelNumber === 'string' ? a.modelNumber : null,
    serialNumber: typeof a.serialNumber === 'string' ? a.serialNumber : null,
    category: typeof a.category === 'string' && CATEGORIES.includes(a.category) ? a.category : 'Other',
    manufactureYear: typeof a.manufactureYear === 'string' ? a.manufactureYear : null,
  };
}

export async function scanAppliance(
  file: File,
  onMode?: (m: 'ai' | 'ocr') => void,
  onProgress?: (p: number) => void,
): Promise<ApplianceScan> {
  try {
    onMode?.('ai');
    const resized = await readResized(file);
    const { data, error } = await supabase.functions.invoke('scan-appliance', {
      body: { imageBase64: resized.data, mediaType: resized.mediaType },
    });
    if (!error && data && data.appliance && !data.error) return fromAI(data.appliance);
  } catch {
    /* fall through to on-device OCR */
  }

  onMode?.('ocr');
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(file, 'eng', {
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(Math.round(m.progress * 100));
    },
  });
  return parseRatingPlate(data.text || '');
}

const ApplianceScanner: React.FC<{
  onDetect: (r: ApplianceScan) => void;
  onClose?: () => void;
}> = ({ onDetect, onClose }) => {
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
      onDetect(await scanAppliance(file, setMode, setProgress));
    } catch {
      setError('Could not read that rating plate. Try a clearer, well-lit photo.');
    } finally {
      setBusy(false);
    }
  };

  const status = busy
    ? (mode === 'ai' ? 'Analysing with AI…' : `Reading on device… ${progress}%`)
    : error
      ? <span className="text-red-500">{error}</span>
      : 'Photo of the rating/serial plate — usually inside a door or on the back.';

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
            <img src={preview} alt="appliance rating plate" className="w-12 h-12 object-cover rounded-md border border-black/10 shrink-0" />
          ) : (
            <span className="inline-flex items-center justify-center w-12 h-12 rounded-md" style={{ background: 'rgba(240,167,0,0.12)', color: '#f0a700' }}>
              <ScanLine className="w-5 h-5" />
            </span>
          )}
          <div className="min-w-0">
            <p className="font-semibold text-sm flex items-center gap-1.5">Scan an appliance <Sparkles className="w-3.5 h-3.5" style={{ color: '#f0a700' }} /></p>
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

export default ApplianceScanner;
