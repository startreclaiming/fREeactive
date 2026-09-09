import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { AuthProvider } from "@/context/AuthContext";
import Index from "./pages/Index";
import NotFound from "./pages/NotFound";
import LandingPage from "@/components/LandingPage";
import GatedAccess from "@/components/GatedAccess";
import AuthScreen from "@/components/AuthScreen";
import UnclaimedCheck, { PendingSearch } from "@/components/reclaim/UnclaimedCheck";
import Dashboard from "@/components/reclaim/Dashboard";
import AlamedaLanding from "@/components/AlamedaLanding";
import { supabase } from "@/lib/supabase";
import { isMobileDevice } from "@/lib/device";
import { useState, useEffect } from "react";
const queryClient = new QueryClient();
type AppView = 'landing' | 'alameda' | 'check' | 'gated' | 'auth' | 'app';

// /alameda is a real, shareable URL (flyers, ads). Detect it on first load.
// Mobile visitors hitting the root skip the marketing landing page entirely and
// land straight in the guest app (Ubiquitous Capture Hub) — no sign-up required.
// Desktop visitors still see the marketing landing page (with a QR code for mobile entry).
const getInitialView = (): AppView => {
  if (typeof window === 'undefined') return 'landing';
  if (/^\/alameda\/?$/i.test(window.location.pathname)) return 'alameda';
  if (isMobileDevice()) return 'app';
  return 'landing';
};

// Stash key for an anonymous search captured before the user registers.
const PENDING_KEY = 'reclaim_pending_search';
const stashPending = (p: PendingSearch[]) => {
  try { sessionStorage.setItem(PENDING_KEY, JSON.stringify(p)); } catch { /* ignore */ }
};
const flushPending = async () => {
  try {
    const raw = sessionStorage.getItem(PENDING_KEY);
    if (!raw) return;
    const profiles = JSON.parse(raw);
    if (Array.isArray(profiles) && profiles.length) {
      await supabase.rpc('save_search_profiles', { p_profiles: profiles });
    }
    sessionStorage.removeItem(PENDING_KEY);
  } catch { /* best-effort; leave stash for a later retry */ }
};

const App = () => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<AppView>(getInitialView);
  // Session management — runs once on mount
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) setView('app');
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setSession(session);
      if (session) {
        // If they captured a search before registering, save it now.
        flushPending();
        setView('app');
      } else if (event === 'SIGNED_OUT') {
        // Only redirect on an actual sign-out (e.g. inactivity timeout), not on the
        // initial "no session" check — that would yank anonymous visitors off public
        // views like /alameda or /check. Mobile guests return to the guest Hub, not
        // the desktop marketing page they never saw.
        setView(isMobileDevice() ? 'app' : 'landing');
      }
    });
    return () => subscription.unsubscribe();
  }, []);
  // Inactivity timeout — locks after 2 minutes of no activity
  useEffect(() => {
    if (!session) return;
    let inactivityTimer: NodeJS.Timeout;
    const resetTimer = () => {
      clearTimeout(inactivityTimer);
      inactivityTimer = setTimeout(async () => {
        await supabase.auth.signOut();
      }, 120000);
    };
    resetTimer();
    const activityEvents = ['mousemove', 'keydown', 'scroll', 'touchstart', 'click'];
    activityEvents.forEach(event => window.addEventListener(event, resetTimer));
    return () => {
      clearTimeout(inactivityTimer);
      activityEvents.forEach(event => window.removeEventListener(event, resetTimer));
    };
  }, [session]);
  // Dark loading screen while session is resolved
  if (loading) {
    return <div style={{ background: '#2d2d2d', minHeight: '100vh' }} />;
  }
  // ── ALAMEDA (public, served at /alameda) — campaign landing ──
  if (view === 'alameda') {
    return (
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AlamedaLanding
            onCheck={() => setView('check')}
            onContinue={() => setView('landing')}
          />
        </TooltipProvider>
      </ThemeProvider>
    );
  }
  // ── LANDING (public) ──
  if (view === 'landing') {
    return (
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <LandingPage onCTA={() => setView('app')} onSignIn={() => setView('auth')} onCheck={() => setView('check')} />
        </TooltipProvider>
      </ThemeProvider>
    );
  }
  // ── CHECK (public, no login) — the Alameda discovery funnel ──
  if (view === 'check') {
    return (
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <Dashboard
            onBack={() => setView('alameda')}
            onNavigate={(section) => {
              if (section === 'landing') setView('landing');
              else if (section === 'trial-signup') setView('auth');
              else setView('app');
            }}
            onOpenAuth={() => setView('auth')}
          />
        </TooltipProvider>
      </ThemeProvider>
    );
  }
  // ── GATED ACCESS (passcode entry) ──
  if (view === 'gated') {
    return (
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <GatedAccess onBack={() => setView('landing')} />
        </TooltipProvider>
      </ThemeProvider>
    );
  }
  // ── AUTHENTICATION (registered users) ──
  if (view === 'auth') {
    return (
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <AuthScreen onBack={() => setView('landing')} />
        </TooltipProvider>
      </ThemeProvider>
    );
  }
  // ── APP (authenticated dashboard) ──
  return (
    <ThemeProvider defaultTheme="light">
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </BrowserRouter>
          </TooltipProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ThemeProvider>
  );
};
export default App;
