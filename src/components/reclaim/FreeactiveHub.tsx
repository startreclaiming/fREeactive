import React, { useCallback, useRef, useState } from 'react';
import { Camera, Mic, Keyboard, DollarSign, Send, X, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { readResized } from '@/lib/imageResize';
import { trackEvent, Pillar } from '@/lib/usageTracking';
import CompletionPrompt from './CompletionPrompt';
import './modules.css';

/**
 * The entire FREEactive product: take an input (photo, voice, or typed text),
 * let the AI ask one clarifying question if it needs to, then deliver an answer.
 * No dashboards, no trackers, no forms — those are PROactive features that
 * aren't offered yet. Nothing here is persisted; closing the tab clears it.
 */

type ChatMessage = { role: 'user' | 'assistant'; content: string; imagePreview?: string };

const DOMAIN_PATTERNS: [Exclude<Pillar, 'general'>, RegExp][] = [
  ['money', /\b(bill|charge|fee|payment|subscription|invoice|receipt|bank|credit|debit|overcharg|money|owe|paid|refund|dollar|pound|cost|price)\b/i],
  ['home', /\b(leak|broke|broken|fix|repair|appliance|boiler|plumb|heat|cool|roof|pipe|furnace|hvac|water heater|washing|dishwasher|fridge|damp|crack|door|window|lock)\b/i],
  ['resolve', /\b(legal|rights|dispute|contract|notice|eviction|council|letter|claim|court|landlord|tenant|complaint|deadline|sued|refusal)\b/i],
  ['community', /\b(neighbou?r|community|local|area|street|noise|parking|petition|block|council)\b/i],
];
const guessPillar = (text: string): Pillar => (DOMAIN_PATTERNS.find(([, re]) => re.test(text))?.[0]) || 'general';

const FreeactiveHub: React.FC<{ onNavigate: (section: string) => void }> = ({ onNavigate }) => {
  const [mode, setMode] = useState<'idle' | 'chat'>('idle');
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [pillar, setPillar] = useState<Pillar>('general');
  // Whether this conversation started from a photo — kept even on follow-up turns
  // that don't resend the image, so the assistant keeps the appliance-scan framing
  // (manufacturer/model/lifespan/maintenance) rather than a generic chat response.
  const [scanOrigin, setScanOrigin] = useState(false);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [listening, setListening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const askAI = useCallback(async (opts: { prompt?: string; imageBase64?: string; mediaType?: string; pillar: Pillar; scanOrigin: boolean; history: ChatMessage[] }) => {
    setLoading(true);
    setError(null);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('ai-assistant', {
        body: {
          prompt: opts.prompt,
          imageBase64: opts.imageBase64,
          mediaType: opts.mediaType,
          pillar: opts.pillar === 'general' ? undefined : opts.pillar,
          scanOrigin: opts.scanOrigin,
          history: opts.history.map((m) => ({ role: m.role, content: m.content })),
        },
      });
      if (fnError || !data?.response) throw new Error('empty response');
      setMessages((m) => [...m, { role: 'assistant', content: data.response }]);
    } catch {
      setError("Couldn't get a response just now — try again in a moment.");
    } finally {
      setLoading(false);
    }
  }, []);

  const submitText = useCallback((raw: string) => {
    const text = raw.trim();
    if (!text || loading) return;
    const isFirst = messages.length === 0;
    const effectivePillar = isFirst ? guessPillar(text) : pillar;
    const history = messages;
    if (isFirst) {
      setPillar(effectivePillar);
      setScanOrigin(false);
      setMode('chat');
      setDone(false);
      trackEvent('freeactive_started', effectivePillar);
    }
    setInput('');
    setMessages((m) => [...m, { role: 'user', content: text }]);
    askAI({ prompt: text, pillar: effectivePillar, scanOrigin: isFirst ? false : scanOrigin, history });
  }, [messages, pillar, scanOrigin, loading, askAI]);

  const beginWithImage = async (file: File) => {
    setMode('chat');
    setDone(false);
    setError(null);
    setLoading(true);
    setScanOrigin(true);
    setPillar('general');
    trackEvent('freeactive_started', 'general');
    try {
      const resized = await readResized(file);
      setMessages([{ role: 'user', content: 'Shared a photo', imagePreview: `data:image/jpeg;base64,${resized.data}` }]);
      await askAI({ imageBase64: resized.data, mediaType: resized.mediaType, pillar: 'general', scanOrigin: true, history: [] });
    } catch {
      setLoading(false);
      setError("Couldn't read that photo — try again with a clearer shot.");
    }
  };

  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    e.currentTarget.value = '';
    if (f) beginWithImage(f);
  };

  const handleMic = () => {
    const SR = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SR) { setError("Voice isn't available in this browser — try typing instead."); return; }
    const r = new SR();
    r.continuous = false; r.interimResults = false; r.lang = 'en-US';
    r.onstart = () => setListening(true);
    r.onend = () => setListening(false);
    r.onerror = () => { setListening(false); setError("Couldn't hear that — try again or type instead."); };
    r.onresult = (e: any) => {
      const t = e.results[0][0].transcript;
      if (t.trim()) submitText(t);
    };
    r.start();
  };

  const finish = () => {
    trackEvent('freeactive_completed', pillar);
    setDone(true);
  };

  const reset = () => {
    setMode('idle'); setMessages([]); setPillar('general'); setScanOrigin(false); setInput(''); setError(null); setDone(false);
  };

  if (mode === 'chat') {
    const lastIsAnswer = !loading && messages.length > 0 && messages[messages.length - 1].role === 'assistant';
    return (
      <div className="reclaim-module max-w-xl mx-auto">
        <button onClick={reset} className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-700 mb-4">
          <X className="w-4 h-4" /> Start over
        </button>

        <div className="space-y-4 mb-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div
                className="max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                style={m.role === 'user' ? { background: '#f0a700', color: '#181818' } : { background: '#f3f4f6', color: '#1f2937' }}
              >
                {m.imagePreview && <img src={m.imagePreview} alt="" className="rounded-lg mb-2 max-h-40 object-cover" />}
                {m.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="px-4 py-3 rounded-2xl inline-flex items-center" style={{ background: '#f3f4f6' }}>
                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
              </div>
            </div>
          )}
        </div>

        {error && <p className="text-sm text-red-600 mb-4">{error}</p>}

        {done ? (
          <div>
            <CompletionPrompt pillar={pillar === 'general' ? 'home' : pillar} shareText="I just got instant help from Reclaim." />
            <button onClick={reset} className="w-full mt-3 text-sm text-gray-400 hover:text-gray-700">Back to start</button>
          </div>
        ) : (
          <>
            {lastIsAnswer && (
              <button onClick={finish} className="btn-gold w-full mb-3">That answers it — I'm done</button>
            )}
            <div className="flex items-center gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && submitText(input)}
                placeholder={messages.length === 0 ? 'What do you need help with?' : 'Type a reply…'}
                disabled={loading}
                className="input flex-1"
                autoFocus
              />
              <button onClick={() => submitText(input)} disabled={loading || !input.trim()} className="btn-gold disabled:opacity-50 !py-2.5 !px-3">
                <Send className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto text-center py-6">
      <p className="text-xs font-semibold tracking-[0.22em] uppercase mb-2" style={{ color: '#f0a700' }}>Reclaim</p>
      <h1 className="text-3xl md:text-4xl font-semibold mb-2">How can I help?</h1>
      <p className="text-gray-500 mb-8">Snap a photo, talk, or type — I'll take it from there.</p>

      <input ref={fileInputRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={handleFile} />

      <div className="grid grid-cols-2 landscape:grid-cols-4 gap-4">
        <BigButton icon={<Camera className="w-8 h-8" />} label="Scan" onClick={() => fileInputRef.current?.click()} />
        <BigButton icon={<Mic className="w-8 h-8" />} label={listening ? 'Listening…' : 'Talk'} onClick={handleMic} active={listening} />
        <BigButton icon={<Keyboard className="w-8 h-8" />} label="Type" onClick={() => setMode('chat')} />
        <BigButton icon={<DollarSign className="w-8 h-8" />} label="Am I owed money?" onClick={() => onNavigate('dashboard')} />
      </div>

      {error && <p className="text-sm text-red-600 mt-6">{error}</p>}
    </div>
  );
};

const BigButton: React.FC<{ icon: React.ReactNode; label: string; onClick: () => void; active?: boolean }> = ({ icon, label, onClick, active }) => (
  <button
    onClick={onClick}
    className="card flex flex-col items-center justify-center gap-3 aspect-square p-6 hover:-translate-y-0.5 transition-transform"
    style={active ? { borderColor: '#f0a700' } : undefined}
  >
    <span className="inline-flex items-center justify-center w-16 h-16 rounded-2xl" style={{ background: 'rgba(240,167,0,0.12)', color: '#f0a700' }}>
      {icon}
    </span>
    <span className="font-semibold text-sm">{label}</span>
  </button>
);

export default FreeactiveHub;
