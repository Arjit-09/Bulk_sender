'use client';

import { useEffect, useState } from 'react';
import { Menu, Search, Sun, Moon, Sparkles } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import Link from 'next/link';

interface TopbarProps {
  title: string;
  subtitle?: string;
  dbConnected?: boolean;
  onMenuToggle?: () => void;
  actions?: React.ReactNode;
}

export default function Topbar({
  title,
  subtitle,
  dbConnected = true,
  onMenuToggle,
  actions,
}: TopbarProps) {
  const { user } = useAuth();
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    const saved = (localStorage.getItem('zs-theme') as 'light' | 'dark') || 'dark';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('zs-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header
      className="fixed top-0 left-0 right-0 lg:left-[260px] z-30 h-16 sm:h-[72px] bg-[#000000] border-b border-white/10 px-3.5 sm:px-6 lg:px-8 flex items-center justify-between gap-2.5 transition-all duration-300 shadow-[0_4px_25px_rgba(0,0,0,0.5)]"
    >
      {/* Left side: Hamburger (Mobile) + Breadcrumb & Title */}
      <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0 flex-1">
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl text-slate-300 hover:text-white hover:bg-white/10 transition-colors flex-shrink-0 cursor-pointer"
          aria-label="Toggle Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <div className="min-w-0 truncate">
          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400 font-medium">
            <span>Pages</span>
            <span className="text-slate-600">/</span>
            <span className="text-slate-200 font-bold truncate">{title}</span>
          </div>
          <h1 className="text-base sm:text-lg font-black text-white tracking-tight leading-tight truncate">
            {title}
          </h1>
        </div>
      </div>

      {/* Right side: Search, Theme Toggle, Actions, PostgreSQL Status, Profile */}
      <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
        {/* Search (Desktop) */}
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 border border-white/10 text-slate-300 w-40 lg:w-52 focus-within:border-blue-500 focus-within:bg-white/10 transition-all">
          <Search className="w-3.5 h-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search..."
            className="w-full bg-transparent text-xs text-white outline-none placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* PostgreSQL Database Indicator (Large screens) */}
        {dbConnected && (
          <div className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_#10b981]" />
            <span>PostgreSQL Active</span>
          </div>
        )}

        {/* Actions (Desktop only to prevent mobile topbar collapse) */}
        {actions && (
          <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
            {actions}
          </div>
        )}

        {/* Light / Dark Mode Switcher */}
        <button
          onClick={toggleTheme}
          className="theme-switch-btn flex-shrink-0"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
          aria-label="Toggle light/dark theme"
        >
          {theme === 'dark' ? (
            <>
              <Sun className="w-4 h-4 text-amber-300 animate-spin-slow" />
              <span className="hidden sm:inline font-bold text-xs">Light</span>
            </>
          ) : (
            <>
              <Moon className="w-4 h-4 text-cyan-300" />
              <span className="hidden sm:inline font-bold text-xs">Dark</span>
            </>
          )}
        </button>

        {/* User Pill / Profile Avatar */}
        <Link
          href="/login"
          className="flex items-center gap-2.5 pl-1 sm:pl-2 sm:border-l sm:border-white/15 flex-shrink-0 group"
          title="Account / Switch User"
        >
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 text-white font-black text-xs sm:text-sm flex items-center justify-center shadow-[0_0_12px_rgba(0,117,255,0.6)] group-hover:scale-105 transition-transform">
            {user?.avatar || 'AS'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs sm:text-sm font-black text-white truncate group-hover:text-cyan-300 transition-colors">
              {user?.name || 'Arjit Sharma'}
            </p>
            <p className="text-[10px] text-cyan-400 truncate font-mono font-bold">
              {user?.role === 'SUPER_ADMIN' ? 'Super Admin' : user?.role === 'ADMIN' ? 'Admin' : 'Member'}
            </p>
          </div>
        </Link>
      </div>
    </header>
  );
}
