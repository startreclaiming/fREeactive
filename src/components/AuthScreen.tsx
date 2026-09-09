import React, { useState } from 'react';
import { Loader2, AlertCircle, CheckCircle2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { validateInviteCode } from '../lib/inviteCode';

type Mode = 'signup' | 'signin';

export default function AuthScreen({ onBack }: { onBack?: () => void }) {
  const [mode, setMode] = useState<Mode>('signup');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [msg, setMsg] = useState('');

  // Reusable utility styles for input text inputs
  const field = "w-full px-4 py-3 bg-[#2d2d2d] border border-neutral-800 rounded-lg text-white placeholder-gray-500 focus:outline-none focus:border-[#f0a700] transition-colors text-sm";

  const reset = () => {
    setError('');
    setMsg('');
  };

  /* ── REGISTRATION ENGINE ───────────────────────────────────────── */
  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!code.trim())  { setError('Enter your invite code.'); return; }
    if (!name.trim())  { setError('Enter your name.'); return; }
    if (!email.trim()) { setError('Enter your email.'); return; }
    if (password.length < 8) { setError('Password must be at least 8 characters.'); return; }

    setLoading(true);

    const inviteResult = await validateInviteCode(code);
    if (!inviteResult.valid) {
      setError(inviteResult.error || "That invite code isn't valid.");
      setLoading(false);
      return;
    }

    // Run user account creation through Supabase Auth
    const { data, error: signErr } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { display_name: name.trim() } },
    });
    if (signErr) { setError(signErr.message); setLoading(false); return; }

    // Profile provisioning happens automatically via a DB trigger on auth.users insert
    // (see supabase/migrations/00000000000003_user_profiles.sql) — it reads the
    // display_name back out of the signUp() metadata above.
    if (data.session && data.user) {
      setLoading(false);
      return;
    }

    setMsg('Account created successfully! Check your email to verify.');
    setLoading(false);
  };

  /* ── AUTHENTICATION ENGINE ─────────────────────────────────────── */
  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    reset();
    if (!email.trim() || !password) {
      setError('Enter both email and password.');
      return;
    }

    setLoading(true);
    const { error: signInErr } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInErr) {
      setError(signInErr.message);
      setLoading(false);
      return;
    }

    setLoading(false);
  };

  /* ── CORE RENDER INTERFACE ─────────────────────────────────────── */
 return (
    <div className="min-h-screen bg-[#181818] flex flex-col items-center justify-center px-4 relative">
      {onBack && (
        <button 
          onClick={onBack}
          className="absolute top-8 left-8 text-sm text-gray-400 hover:text-white transition-colors flex items-center gap-2"
        >
          ← Back
        </button>
      )}
      <div className="w-full max-w-md bg-[#222222] rounded-xl p-8 border border-neutral-800 shadow-2xl flex flex-col items-center">
        <div className="text-center mb-8 w-full flex flex-col items-center">
          <img src="/reclaim-logo-2.png" alt="Reclaim" style={{ height: '40px' }} />
        </div>

        {error && (
          <div className="w-full mb-4 p-3 bg-red-950/40 border border-red-800 text-red-400 text-sm rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {msg && (
          <div className="w-full mb-4 p-3 bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-sm rounded-lg flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{msg}</span>
          </div>
        )}

        {mode === 'signup' ? (
          /* ── SIGN UP FORM VIEW ── */
          <form onSubmit={handleSignUp} className="w-full space-y-4">
            <input 
              type="text" 
              value={code} 
              onChange={(e) => setCode(e.target.value)} 
              placeholder="Invite code" 
              className={field} 
            />
            <input 
              type="text" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              placeholder="Your name" 
              className={field} 
            />
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              placeholder="Email" 
              className={field} 
            />
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              placeholder="Create a password (8+ characters)" 
              className={field} 
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f0a700] hover:brightness-105 text-[#181818] font-bold py-4 rounded-lg transition-all tracking-wide disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'CREATE ACCOUNT'}
            </button>

            <p className="text-center text-sm text-gray-400 mt-4">
              Already have an account?{' '}
              <button 
                type="button" 
                onClick={() => { setMode('signin'); reset(); }} 
                className="text-[#f0a700] hover:underline"
              >
                Sign in
              </button>
            </p>
          </form>
        ) : (
          /* ── SIGN IN FORM VIEW ── */
          <form onSubmit={handleSignIn} className="w-full space-y-4">
            <input 
              type="email" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email" 
              className={field} 
              autoFocus 
            />
            <input 
              type="password" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password" 
              className={field} 
            />
            
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#f0a700] hover:brightness-105 text-[#181818] font-bold py-4 rounded-lg transition-all tracking-wide disabled:opacity-70 flex items-center justify-center gap-2 shadow-lg"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'SIGN IN'}
            </button>

            <p className="text-center text-sm text-gray-400 mt-4">
              Need an account?{' '}
              <button 
                type="button" 
                onClick={() => { setMode('signup'); reset(); }} 
                className="text-[#f0a700] hover:underline"
              >
                Create an account
              </button>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
