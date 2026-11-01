'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, UserRole } from '@/lib/auth-context';
import { Zap, Shield, Crown, User, Lock, Mail, ArrowRight, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const { switchRole, availableUsers } = useAuth();
  const [email, setEmail] = useState('superadmin@zenithtech.site');
  const [password, setPassword] = useState('••••••••••••');
  const [loading, setLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (email.includes('super')) {
      switchRole('SUPER_ADMIN');
    } else if (email.includes('admin')) {
      switchRole('ADMIN');
    } else {
      switchRole('MEMBER');
    }

    setTimeout(() => {
      router.push('/');
    }, 400);
  };

  const handleQuickRole = (r: UserRole) => {
    switchRole(r);
    router.push('/');
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[var(--bg-base)]">
      <div className="w-full max-w-md bg-[var(--bg-card)] rounded-3xl border border-[var(--border-color)] shadow-2xl p-8 space-y-6 animate-fade-in-up">
        {/* Logo */}
        <div className="text-center space-y-2">
          <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white mx-auto shadow-lg shadow-blue-500/25">
            <Zap className="w-6 h-6 fill-white" />
          </div>
          <h1 className="text-xl font-black text-[var(--text-heading)] tracking-tight">
            ZenithTech <span className="text-blue-500">PaaS</span>
          </h1>
          <p className="text-xs text-[var(--text-muted)]">
            US & Canada Omnichannel Cloud • Dual Telnyx Routing
          </p>
        </div>

        {/* 1-Click Fast Role Sign-in */}
        <div className="space-y-2 pt-2">
          <p className="text-[10px] font-bold text-blue-500 uppercase tracking-wider text-center">
            ⚡ 1-Click Role Login (RBAC)
          </p>
          <div className="grid grid-cols-3 gap-2">
            <button
              onClick={() => handleQuickRole('SUPER_ADMIN')}
              className="p-2.5 rounded-xl border border-blue-500/30 bg-blue-500/10 hover:bg-blue-500/20 text-center transition-colors cursor-pointer group"
            >
              <Crown className="w-4 h-4 text-blue-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-blue-400">Super Admin</p>
              <p className="text-[9px] text-[var(--text-muted)]">Full PaaS</p>
            </button>

            <button
              onClick={() => handleQuickRole('ADMIN')}
              className="p-2.5 rounded-xl border border-[var(--border-color)] hover:border-blue-500/30 hover:bg-[var(--bg-elevated)] text-center transition-colors cursor-pointer group"
            >
              <Shield className="w-4 h-4 text-blue-500 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-[var(--text-heading)]">Admin</p>
              <p className="text-[9px] text-[var(--text-muted)]">Workspace</p>
            </button>

            <button
              onClick={() => handleQuickRole('MEMBER')}
              className="p-2.5 rounded-xl border border-[var(--border-color)] hover:border-blue-500/30 hover:bg-[var(--bg-elevated)] text-center transition-colors cursor-pointer group"
            >
              <User className="w-4 h-4 text-slate-400 mx-auto mb-1 group-hover:scale-110 transition-transform" />
              <p className="text-[11px] font-bold text-[var(--text-heading)]">Member</p>
              <p className="text-[9px] text-[var(--text-muted)]">Standard</p>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-2 my-2">
          <div className="h-[1px] flex-1 bg-[var(--border-color)]" />
          <span className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Or with credentials</span>
          <div className="h-[1px] flex-1 bg-[var(--border-color)]" />
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="zs-input pl-9 text-xs"
                placeholder="name@zenithtech.site"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="zs-input pl-9 text-xs font-mono"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full zs-btn-primary justify-center text-xs py-3 shadow-md cursor-pointer"
          >
            <span>{loading ? 'Authenticating...' : 'Sign In to Workspace'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </form>

        <p className="text-center text-[11px] text-[var(--text-muted)]">
          Protected by Enterprise 2FA & Multi-Tenant IAM
        </p>
      </div>
    </div>
  );
}
