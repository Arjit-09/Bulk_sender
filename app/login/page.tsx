'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';
import {
  Sparkles, Shield, Crown, User, Lock, Mail, ArrowRight,
  Eye, EyeOff, CheckCircle2, Zap, Globe, MessageSquare, Phone
} from 'lucide-react';

const CREDENTIALS = [
  {
    role: 'SUPER_ADMIN' as UserRole,
    name: 'Arjit Sharma',
    email: 'arjit@zenithtech.site',
    password: 'SuperAdmin@2026',
    avatar: 'AS',
    label: 'Super Admin',
    desc: 'Full Platform Control',
    icon: Crown,
    gradient: 'from-blue-600 via-blue-500 to-cyan-400',
    glow: 'rgba(0,117,255,0.5)',
    border: 'border-blue-500/40',
    activeBg: 'bg-blue-600/20',
    textColor: 'text-cyan-300',
  },
  {
    role: 'ADMIN' as UserRole,
    name: 'Operations Admin',
    email: 'admin@zenithtech.site',
    password: 'Admin@2026',
    avatar: 'OA',
    label: 'Admin',
    desc: 'Campaign & Reports',
    icon: Shield,
    gradient: 'from-indigo-600 to-blue-500',
    glow: 'rgba(99,102,241,0.4)',
    border: 'border-indigo-500/30',
    activeBg: 'bg-indigo-600/15',
    textColor: 'text-indigo-300',
  },
  {
    role: 'MEMBER' as UserRole,
    name: 'Campaign Manager',
    email: 'user@zenithtech.site',
    password: 'Member@2026',
    avatar: 'CM',
    label: 'Member',
    desc: 'Send & View Only',
    icon: User,
    gradient: 'from-slate-600 to-slate-500',
    glow: 'rgba(100,116,139,0.3)',
    border: 'border-slate-500/30',
    activeBg: 'bg-slate-600/15',
    textColor: 'text-slate-300',
  },
];

export default function LoginPage() {
  const router = useRouter();
  const { switchRole } = useAuth();

  const [email, setEmail] = useState('arjit@zenithtech.site');
  const [password, setPassword] = useState('SuperAdmin@2026');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedRole, setSelectedRole] = useState<UserRole>('SUPER_ADMIN');
  const [loginSuccess, setLoginSuccess] = useState(false);

  // Auto-fill credentials when a role card is clicked
  const handleRoleSelect = (cred: typeof CREDENTIALS[0]) => {
    setSelectedRole(cred.role);
    setEmail(cred.email);
    setPassword(cred.password);
    setError('');
  };

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Find matching credential
    const matched = CREDENTIALS.find(
      (c) => c.email === email && c.password === password
    );

    if (matched) {
      setLoginSuccess(true);
      switchRole(matched.role);
      setTimeout(() => router.push('/'), 800);
    } else {
      setLoading(false);
      setError('Invalid email or password. Use the credentials shown below.');
    }
  };

  const handleQuickLogin = (cred: typeof CREDENTIALS[0]) => {
    setLoginSuccess(true);
    switchRole(cred.role);
    setTimeout(() => router.push('/'), 500);
  };

  return (
    <div className="min-h-screen flex bg-[#060b26] relative overflow-hidden">

      {/* ── Animated Background Blobs ── */}
      <div
        className="absolute top-[-120px] left-[-120px] w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,117,255,0.18) 0%, transparent 70%)' }}
      />
      <div
        className="absolute bottom-[-100px] right-[-100px] w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(0,210,255,0.12) 0%, transparent 70%)' }}
      />
      <div
        className="absolute top-1/2 left-1/3 w-[300px] h-[300px] rounded-full pointer-events-none"
        style={{ background: 'radial-gradient(circle, rgba(117,81,255,0.08) 0%, transparent 70%)' }}
      />

      {/* ── Left Panel: Brand Info (hidden on mobile) ── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] flex-col justify-between p-12 xl:p-16 relative">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center"
            style={{ boxShadow: '0 0 20px rgba(0,117,255,0.6)' }}
          >
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <span className="text-sm font-black text-white tracking-widest uppercase">VISION UI</span>
            <span className="text-sm font-black text-cyan-400 tracking-widest uppercase ml-1">PAAS</span>
          </div>
        </div>

        {/* Hero text */}
        <div className="space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-600/15 border border-blue-500/30 text-cyan-400 text-xs font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            Enterprise Omnichannel Cloud Platform
          </div>

          <h1 className="text-4xl xl:text-5xl font-black text-white leading-[1.1] tracking-tight">
            Dispatch Messages<br />
            at{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
              Scale
            </span>
          </h1>

          <p className="text-slate-400 text-base leading-relaxed max-w-md font-medium">
            Dual Telnyx routing • Toll-Free & Local 10DLC • WhatsApp Business API • High-deliverability Email
          </p>

          {/* Feature chips */}
          <div className="grid grid-cols-2 gap-3 max-w-sm">
            {[
              { icon: Phone, label: 'SMS Campaigns', desc: 'US & Canada' },
              { icon: MessageSquare, label: 'WhatsApp API', desc: 'Business Cloud' },
              { icon: Mail, label: 'Email Suite', desc: 'High SLA SMTP' },
              { icon: Globe, label: 'Coverage Hub', desc: '50+ States & Provinces' },
            ].map((f, i) => (
              <div key={i} className="flex items-center gap-2.5 p-3 rounded-2xl bg-white/[0.03] border border-white/5">
                <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center flex-shrink-0">
                  <f.icon className="w-4 h-4" />
                </div>
                <div>
                  <p className="text-xs font-bold text-white">{f.label}</p>
                  <p className="text-[10px] text-slate-400">{f.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer stats */}
        <div className="flex items-center gap-6 text-xs">
          {[
            { label: 'Delivery Rate', value: '99.4%' },
            { label: 'Messages / Day', value: '50K+' },
            { label: 'US / CA States', value: '52' },
          ].map((s, i) => (
            <div key={i}>
              <p className="font-black text-white text-lg font-mono">{s.value}</p>
              <p className="text-slate-400 font-medium">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right Panel: Login Form ── */}
      <div className="w-full lg:w-1/2 xl:w-[45%] flex items-center justify-center p-6 sm:p-10 lg:p-12">
        <div className="w-full max-w-[420px] space-y-6">

          {/* Mobile brand */}
          <div className="flex items-center gap-3 lg:hidden">
            <div
              className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center"
              style={{ boxShadow: '0 0 20px rgba(0,117,255,0.5)' }}
            >
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div>
              <span className="text-sm font-black text-white tracking-widest uppercase">VISION UI</span>
              <span className="text-sm font-black text-cyan-400 tracking-widest uppercase ml-1">PAAS</span>
            </div>
          </div>

          {/* Heading */}
          <div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Sign in to your<br />workspace
            </h2>
            <p className="text-slate-400 text-sm mt-2 font-medium">
              Select a role or enter credentials below
            </p>
          </div>

          {/* ── Quick Role Cards ── */}
          <div className="space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest">
              ⚡ Quick access — select a role
            </p>
            <div className="grid grid-cols-3 gap-2.5">
              {CREDENTIALS.map((cred) => {
                const Icon = cred.icon;
                const isActive = selectedRole === cred.role;
                return (
                  <div
                    key={cred.role}
                    onClick={() => handleRoleSelect(cred)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => e.key === 'Enter' && handleRoleSelect(cred)}
                    className={`relative p-3 rounded-2xl border text-center transition-all cursor-pointer group ${
                      isActive
                        ? `${cred.border} ${cred.activeBg}`
                        : 'border-white/8 bg-white/[0.02] hover:bg-white/5 hover:border-white/15'
                    }`}
                    style={isActive ? { boxShadow: `0 0 16px ${cred.glow}` } : {}}
                  >
                    {isActive && (
                      <CheckCircle2 className="w-3 h-3 absolute top-1.5 right-1.5 text-cyan-400" />
                    )}
                    {/* Avatar circle */}
                    <div
                      className={`w-9 h-9 rounded-xl bg-gradient-to-tr ${cred.gradient} flex items-center justify-center mx-auto mb-2`}
                      style={{ boxShadow: isActive ? `0 0 10px ${cred.glow}` : 'none' }}
                    >
                      <Icon className="w-4 h-4 text-white" />
                    </div>
                    <p className={`text-xs font-black ${isActive ? cred.textColor : 'text-slate-300'} truncate`}>
                      {cred.name.split(' ')[0]}
                    </p>
                    <p className={`text-[9px] font-bold mt-0.5 ${isActive ? cred.textColor : 'text-slate-500'}`}>
                      {cred.label}
                    </p>
                    {isActive && (
                      <button
                        onClick={(e) => { e.stopPropagation(); handleQuickLogin(cred); }}
                        className="mt-2 w-full py-1 rounded-lg bg-blue-600 text-white text-[9px] font-black hover:bg-blue-500 transition-colors"
                      >
                        1-Click Login →
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Divider */}
          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-white/10" />
            <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
              or sign in with credentials
            </span>
            <div className="h-px flex-1 bg-white/10" />
          </div>

          {/* ── Credentials Form ── */}
          <form onSubmit={handleLogin} className="space-y-4">
            {/* Email */}
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">Email Address</label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(''); }}
                  className="vision-input pl-10 py-3 text-sm bg-white/[0.04] border-white/10 text-white placeholder:text-slate-500 focus:border-blue-500"
                  placeholder="name@zenithtech.site"
                  required
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Password */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-slate-300">Password</label>
                <span className="text-[10px] text-cyan-400 font-bold cursor-pointer hover:text-cyan-300">
                  Auto-filled from role card ↑
                </span>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(''); }}
                  className="vision-input pl-10 pr-10 py-3 text-sm bg-white/[0.04] border-white/10 text-white font-mono placeholder:text-slate-500 focus:border-blue-500"
                  required
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Error */}
            {error && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 text-xs font-bold flex items-center gap-2">
                <span>⚠</span> {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              disabled={loading || loginSuccess}
              className="w-full vision-btn-primary py-3.5 text-sm font-black shadow-xl flex items-center justify-center gap-2 cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
              style={{ boxShadow: '0 4px 25px rgba(0,117,255,0.5)' }}
            >
              {loginSuccess ? (
                <>
                  <CheckCircle2 className="w-4 h-4 animate-bounce" />
                  <span>Redirecting to dashboard...</span>
                </>
              ) : loading ? (
                <span>Authenticating...</span>
              ) : (
                <>
                  <Zap className="w-4 h-4" />
                  <span>Sign In to Workspace</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Credential hint box */}
          <div className="p-4 rounded-2xl bg-white/[0.02] border border-white/8 space-y-2">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-widest mb-2">
              🔐 Demo Credentials
            </p>
            {CREDENTIALS.map((c) => (
              <div key={c.role} className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div
                    className={`w-5 h-5 rounded-md bg-gradient-to-tr ${c.gradient} flex items-center justify-center`}
                  >
                    <c.icon className="w-2.5 h-2.5 text-white" />
                  </div>
                  <span className="text-[11px] font-bold text-slate-300">{c.label}</span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-mono text-slate-400">{c.email}</p>
                  <p className="text-[10px] font-mono text-cyan-400 font-bold">{c.password}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="text-center text-[11px] text-slate-500 font-medium">
            🛡 Protected by Enterprise 2FA & Multi-Tenant IAM
          </p>
        </div>
      </div>
    </div>
  );
}
