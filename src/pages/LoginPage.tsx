// src/pages/LoginPage.tsx
// Sri Ruchi Pachallu — Login & Signup Page
// Design matches the brand: chili red primary, saffron accents, Playfair Display headers.

import { useState, useCallback } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, Eye, EyeOff, User, Phone, Flame, ArrowRight, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

// ── Google Identity Services helper ───────────────────────────────────────────
declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient: (config: {
            client_id: string;
            scope: string;
            callback: (response: { access_token?: string; error?: string }) => void;
          }) => { requestAccessToken: () => void };
        };
      };
    };
  }
}

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

type Mode = 'login' | 'signup';

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, signup, googleLogin, refreshUser } = useAuth(); // Added refreshUser

  const redirectTo =
  
    (location.state as { redirectTo?: string })?.redirectTo ||
    localStorage.getItem('afterLoginRedirect') ||
    '/profile';

  const [mode, setMode] = useState<Mode>('login');
  const [showPass, setShowPass] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);

  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
  });

  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(f => ({ ...f, [k]: e.target.value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;
    setSubmitting(true);
    try {
      if (mode === 'login') {
        await login(form.email, form.password);
        toast.success('Welcome back! 🫙');
      } else {
        if (!form.first_name.trim()) {
          toast.error('First name is required');
          return;
        }
        await signup({
          email: form.email,
          password: form.password,
          first_name: form.first_name,
          last_name: form.last_name,
          phone: form.phone,
        });
        toast.success('Account created! Welcome to Sri Ruchi 🌶️');
      }
      localStorage.removeItem('afterLoginRedirect');
      navigate(redirectTo, { replace: true });
    } catch (err: unknown) {
      const message =
        (err as { detail?: string; email?: string[] })?.detail ||
        (err as { email?: string[] })?.email?.[0] ||
        (mode === 'login' ? 'Invalid email or password' : 'Signup failed. Try again.');
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleLogin = useCallback(() => {
    if (!window.google) {
      toast.error('Google Sign-In is not available. Please refresh the page.');
      return;
    }
    setGoogleLoading(true);
    const tokenClient = window.google.accounts.oauth2.initTokenClient({
      client_id: GOOGLE_CLIENT_ID,
      scope: 'email profile',
      callback: async (response) => {
        if (response.error || !response.access_token) {
          toast.error('Google login was cancelled or failed.');
          setGoogleLoading(false);
          return;
        }
        // Inside handleGoogleLogin callback (replace the try block):
      try {
        await googleLogin(response.access_token);
        // Wait for the context to refresh the user profile
        await refreshUser(); 
        
        toast.success('Signed in with Google! 🌶️');
        
        const nextPath = localStorage.getItem('afterLoginRedirect') || '/profile';
        localStorage.removeItem('afterLoginRedirect');
        navigate(nextPath, { replace: true });
      } catch {
        toast.error('Google login failed. Please try again.');
      }finally {
          setGoogleLoading(false);
        }
      },
    });
    tokenClient.requestAccessToken();
  }, [googleLogin, navigate, redirectTo]);

  return (
    <div className="min-h-screen bg-[oklch(0.985_0.018_85)] flex items-center justify-center px-4 py-20 relative overflow-hidden">
      {/* Background spice blobs */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute -top-32 -right-32 w-96 h-96 rounded-full bg-[oklch(0.86_0.17_85)]/40 blur-3xl" />
        <div className="absolute -bottom-32 -left-32 w-80 h-80 rounded-full bg-[oklch(0.52_0.21_28)]/15 blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[oklch(0.78_0.18_65)]/10 blur-3xl" />
        {/* Dot pattern */}
        <div
          className="absolute inset-0 opacity-30"
          style={{
            backgroundImage: 'radial-gradient(oklch(0.52 0.21 28 / 0.08) 1px, transparent 1px)',
            backgroundSize: '18px 18px',
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
        className="relative w-full max-w-md"
      >
        {/* Card */}
        <div className="bg-white/80 backdrop-blur-xl rounded-[2.5rem] border border-white/60 shadow-[0_20px_60px_-15px_oklch(0.52_0.21_28_/_0.2)] p-8 md:p-10">

          {/* Brand mark */}
          <div className="flex flex-col items-center mb-8">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-[oklch(0.52_0.21_28)] to-[oklch(0.65_0.22_45)] flex items-center justify-center shadow-[0_8px_24px_oklch(0.52_0.21_28_/_0.4)] mb-4">
              <Flame className="w-7 h-7 text-white" />
            </div>
            <h1 className="font-[Playfair_Display,serif] text-2xl font-extrabold text-[oklch(0.22_0.04_35)] text-center leading-tight">
              Sri Ruchi Pachallu
            </h1>
            <p className="text-xs text-[oklch(0.45_0.04_35)] mt-1 font-medium tracking-wide">
              {mode === 'login' ? 'Welcome back! 🫙' : 'Create your account'}
            </p>
          </div>

          {/* Mode toggle */}
          <div className="flex bg-[oklch(0.94_0.025_80)] rounded-2xl p-1 mb-8">
            {(['login', 'signup'] as Mode[]).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={[
                  'flex-1 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all',
                  mode === m
                    ? 'bg-white text-[oklch(0.52_0.21_28)] shadow-sm'
                    : 'text-[oklch(0.45_0.04_35)] hover:text-[oklch(0.22_0.04_35)]',
                ].join(' ')}
              >
                {m === 'login' ? 'Log In' : 'Sign Up'}
              </button>
            ))}
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence mode="wait">
              {mode === 'signup' && (
                <motion.div
                  key="signup-extra"
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.3 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="grid grid-cols-2 gap-3">
                    <InputField
                      icon={User}
                      type="text"
                      placeholder="First name *"
                      value={form.first_name}
                      onChange={set('first_name')}
                      required
                    />
                    <InputField
                      icon={User}
                      type="text"
                      placeholder="Last name"
                      value={form.last_name}
                      onChange={set('last_name')}
                    />
                  </div>
                  <InputField
                    icon={Phone}
                    type="tel"
                    placeholder="Phone number"
                    value={form.phone}
                    onChange={set('phone')}
                  />
                </motion.div>
              )}
            </AnimatePresence>

            <InputField
              icon={Mail}
              type="email"
              placeholder="Email address *"
              value={form.email}
              onChange={set('email')}
              required
            />

            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.65_0.04_35)]">
                <Lock className="w-4 h-4" />
              </div>
              <input
                type={showPass ? 'text' : 'password'}
                placeholder="Password *"
                value={form.password}
                onChange={set('password')}
                required
                minLength={6}
                className="w-full border border-[oklch(0.88_0.03_70)] rounded-xl pl-10 pr-12 py-3 text-sm text-[oklch(0.22_0.04_35)] placeholder-[oklch(0.65_0.04_35)] bg-white focus:ring-2 focus:ring-[oklch(0.52_0.21_28)] focus:border-transparent outline-none transition-all"
              />
              <button
                type="button"
                onClick={() => setShowPass(s => !s)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-[oklch(0.65_0.04_35)] hover:text-[oklch(0.22_0.04_35)] transition-colors"
              >
                {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-3.5 rounded-xl bg-[oklch(0.52_0.21_28)] hover:bg-[oklch(0.45_0.21_28)] disabled:opacity-60 text-white font-extrabold text-sm uppercase tracking-widest transition-all shadow-[0_8px_24px_oklch(0.52_0.21_28_/_0.35)] hover:shadow-[0_12px_32px_oklch(0.52_0.21_28_/_0.45)] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              {submitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> {mode === 'login' ? 'Logging in...' : 'Creating account...'}</>
              ) : (
                <>{mode === 'login' ? 'Log In' : 'Create Account'} <ArrowRight className="w-4 h-4" /></>
              )}
            </button>
          </form>

          {/* Divider */}
          <div className="flex items-center gap-3 my-6">
            <div className="flex-1 h-px bg-[oklch(0.88_0.03_70)]" />
            <span className="text-[10px] font-bold text-[oklch(0.65_0.04_35)] uppercase tracking-widest">or</span>
            <div className="flex-1 h-px bg-[oklch(0.88_0.03_70)]" />
          </div>

          {/* Google Button */}
          <button
            onClick={handleGoogleLogin}
            disabled={googleLoading}
            className="w-full py-3 rounded-xl border-2 border-[oklch(0.88_0.03_70)] hover:border-[oklch(0.65_0.04_35)] bg-white hover:bg-[oklch(0.97_0.01_85)] text-[oklch(0.22_0.04_35)] font-bold text-sm flex items-center justify-center gap-3 transition-all disabled:opacity-60"
          >
            {googleLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
            )}
            Continue with Google
          </button>

          {/* Footer note */}
          <p className="text-center text-xs text-[oklch(0.55_0.04_35)] mt-6">
            {mode === 'login' ? (
              <>New here?{' '}
                <button onClick={() => setMode('signup')} className="text-[oklch(0.52_0.21_28)] font-bold hover:underline">
                  Create an account
                </button>
              </>
            ) : (
              <>Already have an account?{' '}
                <button onClick={() => setMode('login')} className="text-[oklch(0.52_0.21_28)] font-bold hover:underline">
                  Log in
                </button>
              </>
            )}
          </p>

          <p className="text-center text-[10px] text-[oklch(0.65_0.04_35)] mt-4 leading-relaxed">
            By continuing, you agree to our{' '}
            <Link to="/terms" className="underline">Terms</Link> and{' '}
            <Link to="/privacy" className="underline">Privacy Policy</Link>.
          </p>
        </div>
      </motion.div>
    </div>
  );
}

// ── InputField helper ─────────────────────────────────────────────────────────

function InputField({
  icon: Icon,
  ...props
}: {
  icon: React.ElementType;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div className="relative">
      <div className="absolute left-4 top-1/2 -translate-y-1/2 text-[oklch(0.65_0.04_35)] pointer-events-none">
        <Icon className="w-4 h-4" />
      </div>
      <input
        {...props}
        className="w-full border border-[oklch(0.88_0.03_70)] rounded-xl pl-10 pr-4 py-3 text-sm text-[oklch(0.22_0.04_35)] placeholder-[oklch(0.65_0.04_35)] bg-white focus:ring-2 focus:ring-[oklch(0.52_0.21_28)] focus:border-transparent outline-none transition-all"
      />
    </div>
  );
}