/**
 * AuthModal.tsx
 * Sign in / sign up modal for Reclaim.
 * Uses the invite code gate for sign-up (FOUNDMONEY or RECLAIM).
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { validateInviteCode } from '../../lib/inviteCode';
import { X, Loader2, Eye, EyeOff } from 'lucide-react';

const GOLD = '#f0a700';
const BG   = '#181818';

interface AuthModalProps {
  isOpen?:    boolean;
  onClose?:   () => void;
  onSuccess?: () => void;
  defaultTab?: 'login' | 'signup';
}

type Mode = 'signin' | 'signup';

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess, defaultTab }) => {
  const { signIn, signUp } = useAuth();

  const [mode,       setMode]       = useState<Mode>('signin');
  const [email,      setEmail]      = useState('');
  const [password,   setPassword]   = useState('');
  const [invite,     setInvite]     = useState('');
  const [showPass,   setShowPass]   = useState(false);
  const [loading,    setLoading]    = useState(false);
  const [error,      setError]      = useState<string | null>(null);
  const [success,    setSuccess]    = useState<string | null>(null);

  // Sync to the caller's requested tab each time the modal opens — otherwise
  // callers that open it via openAuth('signup') always land on Sign In first.
  useEffect(() => {
    if (isOpen) setMode(defaultTab === 'signup' ? 'signup' : 'signin');
  }, [isOpen, defaultTab]);

  if (!isOpen) return null;

  const inp: React.CSSProperties = {
    width: '100%',
    background: 'rgba(255,255,255,0.06)',
    border: '1px solid rgba(255,255,255,0.12)',
    borderRadius: 8,
    padding: '12px 16px',
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins, sans-serif',
    outline: 'none',
    boxSizing: 'border-box',
    transition: 'border-color 0.15s',
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!email.trim() || !password.trim()) {
      setError('Please enter your email and password.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (mode === 'signup') {
      if (!invite.trim()) {
        setError('An invite code is required to create an account.');
        return;
      }
      setLoading(true);
      const inviteResult = await validateInviteCode(invite);
      if (!inviteResult.valid) {
        setError(inviteResult.error || "That invite code isn't valid.");
        setLoading(false);
        return;
      }
    } else {
      setLoading(true);
    }

    const { error: authError } = mode === 'signin'
      ? await signIn(email.trim(), password)
      : await signUp(email.trim(), password);

    setLoading(false);

    if (authError) {
      // Make Supabase error messages friendlier
      if (authError.includes('Invalid login')) {
        setError('Email or password is incorrect. Try again.');
      } else if (authError.includes('already registered')) {
        setError('That email is already registered. Sign in instead.');
      } else {
        setError(authError);
      }
      return;
    }

    if (mode === 'signup') {
      setSuccess('Account created! Check your email to confirm, then sign in.');
    } else {
      onSuccess?.();
    }
  };

  const switchMode = (m: Mode) => {
    setMode(m);
    setError(null);
    setSuccess(null);
  };

  return (
    <div
      onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        background: 'rgba(0,0,0,0.85)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        padding: 16,
        fontFamily: 'Poppins, sans-serif',
      }}
    >
      <div style={{
        background: '#1c1c1c',
        border: '1px solid rgba(240,167,0,0.2)',
        borderRadius: 16,
        padding: '40px 32px',
        width: '100%',
        maxWidth: 420,
        position: 'relative',
      }}>
        {/* Close */}
        {onClose && (
          <button onClick={onClose} style={{
            position: 'absolute', top: 14, right: 18,
            background: 'none', border: 'none',
            color: 'rgba(255,255,255,0.3)', fontSize: 22,
            cursor: 'pointer', lineHeight: 1,
          }}>
            <X size={20} />
          </button>
        )}

        {/* Logo */}
        <div style={{ marginBottom: 24 }}>
          <img src="/reclaim-logo-2.png" alt="Reclaim" style={{ height: 32 }} />
        </div>

        {/* Tabs */}
        <div style={{
          display: 'flex',
          background: 'rgba(255,255,255,0.05)',
          borderRadius: 8,
          padding: 4,
          marginBottom: 28,
        }}>
          {(['signin', 'signup'] as Mode[]).map((m) => (
            <button
              key={m}
              onClick={() => switchMode(m)}
              style={{
                flex: 1,
                padding: '8px 0',
                border: 'none',
                borderRadius: 6,
                fontSize: 13,
                fontWeight: 600,
                fontFamily: 'Poppins, sans-serif',
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: mode === m ? GOLD : 'transparent',
                color:      mode === m ? BG   : 'rgba(255,255,255,0.4)',
              }}
            >
              {m === 'signin' ? 'Sign in' : 'Create account'}
            </button>
          ))}
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {/* Email */}
          <div>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', marginBottom: 6,
            }}>
              Email address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={inp}
            />
          </div>

          {/* Password */}
          <div>
            <label style={{
              display: 'block', fontSize: 10, fontWeight: 600,
              letterSpacing: '0.1em', textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.35)', marginBottom: 6,
            }}>
              Password {mode === 'signup' && <span style={{ color: 'rgba(255,255,255,0.2)', fontWeight: 400 }}>(min 8 chars)</span>}
            </label>
            <div style={{ position: 'relative' }}>
              <input
                type={showPass ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                style={{ ...inp, paddingRight: 44 }}
              />
              <button
                type="button"
                onClick={() => setShowPass(!showPass)}
                style={{
                  position: 'absolute', right: 12, top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none', border: 'none',
                  color: 'rgba(255,255,255,0.3)', cursor: 'pointer',
                }}
              >
                {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>

          {/* Invite code (signup only) */}
          {mode === 'signup' && (
            <div>
              <label style={{
                display: 'block', fontSize: 10, fontWeight: 600,
                letterSpacing: '0.1em', textTransform: 'uppercase',
                color: 'rgba(255,255,255,0.35)', marginBottom: 6,
              }}>
                Invite code
              </label>
              <input
                type="text"
                value={invite}
                onChange={(e) => setInvite(e.target.value.toUpperCase())}
                placeholder="XXXXXXXXX"
                style={{ ...inp, letterSpacing: '0.15em', fontWeight: 600 }}
              />
            </div>
          )}

          {/* Error / success */}
          {error && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(239,68,68,0.1)',
              border: '1px solid rgba(239,68,68,0.25)',
              borderRadius: 8, color: '#f87171', fontSize: 13,
            }}>
              {error}
            </div>
          )}
          {success && (
            <div style={{
              padding: '10px 14px',
              background: 'rgba(16,163,74,0.1)',
              border: '1px solid rgba(16,163,74,0.25)',
              borderRadius: 8, color: '#4ade80', fontSize: 13,
            }}>
              {success}
            </div>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              background: GOLD,
              color: BG,
              border: 'none',
              borderRadius: 8,
              padding: '14px 24px',
              fontSize: 14,
              fontWeight: 700,
              fontFamily: 'Poppins, sans-serif',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              marginTop: 4,
              transition: 'filter 0.15s',
            }}
            onMouseEnter={(e) => { if (!loading) e.currentTarget.style.filter = 'brightness(1.1)'; }}
            onMouseLeave={(e) => { e.currentTarget.style.filter = 'brightness(1)'; }}
          >
            {loading && <Loader2 size={16} className="animate-spin" />}
            {mode === 'signin' ? 'Sign in' : 'Create account'}
          </button>
        </form>

        {/* Footer note */}
        <p style={{
          marginTop: 20, textAlign: 'center',
          fontSize: 11, color: 'rgba(255,255,255,0.2)',
          lineHeight: 1.6,
        }}>
          {mode === 'signup'
            ? 'New accounts include a 14-day free trial with access to all four modules.'
            : 'Don\'t have an account? Switch to "Create account" above.'}
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
