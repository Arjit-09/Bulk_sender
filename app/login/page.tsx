'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth, UserRole, PRESET_USERS } from '@/lib/auth-context';
import {
  Lock, Mail, ArrowRight, Eye, EyeOff, ShieldCheck,
  CheckCircle2, Radio, Server, Activity, ChevronRight
} from 'lucide-react';

const DEMO_ACCOUNTS = [
  {
    role: 'SUPER_ADMIN' as UserRole,
    name: 'Arjit Sharma',
    email: 'arjit@zenithtech.site',
    password: 'SuperAdmin@2026',
    title: 'Super Admin',
    desc: 'Full platform access & settings',
  },
  {
    role: 'ADMIN' as UserRole,
    name: 'Operations Admin',
    email: 'admin@zenithtech.site',
    password: 'Admin@2026',
    title: 'Operations Admin',
    desc: 'Campaign management & reports',
  },
  {
    role: 'MEMBER' as UserRole,
    name: 'Campaign Manager',
    email: 'user@zenithtech.site',
    password: 'Member@2026',
    title: 'Campaign Member',
    desc: 'Inbox & messaging dispatch',
  },
];

function LoginFormContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, isLoggedIn } = useAuth();

  const redirectUrl = searchParams.get('redirect') || '/';

  const [email, setEmail] = useState('arjit@zenithtech.site');
  const [password, setPassword] = useState('SuperAdmin@2026');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedDemoIndex, setSelectedDemoIndex] = useState(0);

  // If already logged in, redirect to dashboard
  useEffect(() => {
    if (isLoggedIn) {
      router.replace(redirectUrl);
    }
  }, [isLoggedIn, redirectUrl, router]);

  const handleSelectDemo = (acc: typeof DEMO_ACCOUNTS[0], index: number) => {
    setSelectedDemoIndex(index);
    setEmail(acc.email);
    setPassword(acc.password);
    setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Verify credentials
    const matched = DEMO_ACCOUNTS.find(
      (acc) => acc.email.toLowerCase() === email.trim().toLowerCase() && acc.password === password
    );

    if (matched) {
      const userObj = PRESET_USERS[matched.role];
      login(userObj);
      setTimeout(() => {
        router.push(redirectUrl);
      }, 500);
    } else {
      setLoading(false);
      setError('Invalid email or password. Please verify your credentials or select a demo account.');
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-[#070b19] text-slate-100 antialiased selection:bg-blue-600 selection:text-white">

      {/* ─── LEFT PANEL: ENTERPRISE BRAND & LIVE INFRASTRUCTURE STATUS (Desktop) ─── */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 xl:p-16 border-r border-slate-800/80 bg-gradient-to-br from-[#0a0f24] via-[#070b19] to-[#040714] relative overflow-hidden">
        {/* Subtle grid background */}
        <div
          className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, #ffffff 1px, transparent 0)`,
            backgroundSize: '32px 32px',
          }}
        />

        {/* Ambient glow */}
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute bottom-10 right-10 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Brand Header */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
            <Radio className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-lg font-black text-white tracking-wider block">ZENITH</span>
            <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Enterprise Messaging Cloud</span>
          </div>
        </div>

        {/* Value Proposition Hero */}
        <div className="relative z-10 max-w-lg space-y-6 my-auto py-8">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-800/80 border border-slate-700/60 text-xs font-semibold text-cyan-300">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Tier-1 Carrier Interconnects Operational</span>
          </div>

          <h1 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
            High-throughput SMS, WhatsApp &amp; transactional dispatch at scale.
          </h1>

          <p className="text-sm xl:text-base text-slate-400 leading-relaxed font-normal">
            Direct routing across US, Canadian and international mobile operators. Automated 10DLC campaign compliance, sub-second latency, and two-way carrier webhook processing.
          </p>

          {/* Metric Cards */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t border-slate-800/80">
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xl font-bold font-mono text-white">99.98%</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Carrier SLA</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xl font-bold font-mono text-cyan-300">&lt;45ms</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">Delivery Latency</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-900/60 border border-slate-800">
              <p className="text-xl font-bold font-mono text-emerald-400">10DLC</p>
              <p className="text-[11px] text-slate-400 font-medium mt-0.5">TCR Compliant</p>
            </div>
          </div>
        </div>

        {/* Enterprise Trust Footer */}
        <div className="relative z-10 flex items-center justify-between text-xs text-slate-500 pt-6 border-t border-slate-800/80">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-slate-400" />
            <span>256-bit TLS • SOC2 Type II Certified</span>
          </div>
          <span>&copy; {new Date().getFullYear()} Zenith Technologies Inc.</span>
        </div>
      </div>

      {/* ─── RIGHT PANEL: CLEAN ENTERPRISE SIGN-IN FORM ─── */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 sm:p-12 xl:p-16 relative">
        <div className="w-full max-w-md space-y-8">

          {/* Mobile Brand Mark */}
          <div className="lg:hidden flex items-center gap-3 mb-6">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center shadow-lg shadow-blue-600/30">
              <Radio className="w-4 h-4 text-white" />
            </div>
            <div>
              <span className="text-base font-black text-white tracking-wider block">ZENITH</span>
              <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest block">Enterprise Messaging</span>
            </div>
          </div>

          {/* Header */}
          <div className="space-y-2">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
              Sign in to your account
            </h2>
            <p className="text-xs sm:text-sm text-slate-400">
              Enter your corporate email and password to access the dispatch console.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs font-medium flex items-start gap-2.5">
              <span className="text-base leading-none">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          {/* Sign In Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                Work Email Address
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="name@company.com"
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-medium"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-xs font-semibold text-slate-300">
                  Password
                </label>
                <button
                  type="button"
                  tabIndex={-1}
                  onClick={() => alert('For password resets, contact your organization Super Administrator.')}
                  className="text-xs text-blue-400 hover:text-blue-300 font-medium transition-colors"
                >
                  Forgot password?
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full rounded-xl bg-slate-900/90 border border-slate-700/80 px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all font-mono"
                  style={{ paddingLeft: '2.5rem', paddingRight: '2.5rem' }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors p-0.5"
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="w-4 h-4 rounded border-slate-700 bg-slate-900 text-blue-600 focus:ring-blue-500/20"
                />
                <span>Remember this workstation</span>
              </label>

              <span className="text-[11px] text-slate-500">
                Single Sign-On (SSO) active
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-blue-600 hover:bg-blue-500 active:bg-blue-700 text-white font-bold text-sm shadow-lg shadow-blue-600/20 hover:shadow-blue-600/30 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
            >
              {loading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Authenticating session...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Console</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* ─── PROFESSIONAL DEMO ACCOUNT SELECTOR (Discreet & Non-AI) ─── */}
          <div className="pt-6 border-t border-slate-800/80 space-y-3">
            <div className="flex items-center justify-between text-xs text-slate-400">
              <span className="font-semibold text-slate-300">Quick-fill demo account:</span>
              <span className="text-[10px] text-slate-500">Tap to auto-fill</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {DEMO_ACCOUNTS.map((acc, idx) => {
                const isSelected = selectedDemoIndex === idx;
                return (
                  <button
                    key={acc.role}
                    type="button"
                    onClick={() => handleSelectDemo(acc, idx)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-blue-600/10 border-blue-500/60 text-white'
                        : 'bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-900 hover:text-slate-200'
                    }`}
                  >
                    <p className="text-[11px] font-bold truncate leading-tight text-white">{acc.name}</p>
                    <p className="text-[10px] text-cyan-400 font-semibold mt-0.5 truncate">{acc.title}</p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Legal / Security badge */}
          <div className="text-center text-[11px] text-slate-500 space-y-1">
            <p>Protected by enterprise multi-tenant IAM &amp; rate-limiting protection.</p>
            <p>
              By signing in, you acknowledge compliance with{' '}
              <a href="/terms" className="text-slate-400 hover:text-white underline">Terms</a> &amp;{' '}
              <a href="/privacy" className="text-slate-400 hover:text-white underline">Carrier Acceptable Use Policy</a>.
            </p>
          </div>

        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#070b19] flex items-center justify-center text-slate-400 text-sm">
          Loading authentication console...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}
