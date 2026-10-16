'use client';

import { useEffect, useState } from 'react';
import { Bell, Sun, Moon, Menu, Search, ChevronDown, Zap } from 'lucide-react';

interface TopbarProps {
  title: string;
  subtitle?: string;
  dbConnected?: boolean;
  onMenuToggle?: () => void;
}

export default function Topbar({ title, subtitle, dbConnected = false, onMenuToggle }: TopbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const saved = localStorage.getItem('zs-theme') as 'light' | 'dark' || 'light';
    setTheme(saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('zs-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header className="zs-topbar fixed top-0 right-0 left-0 lg:left-[260px] h-[64px] z-30 flex items-center px-4 sm:px-6 lg:px-8 gap-4 border-b border-[var(--border-color)]">
      {/* Mobile Menu Toggle */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
        aria-label="Toggle navigation"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page Title & Breadcrumb */}
      <div className="flex-1 min-w-0">
        <h1 className="text-base sm:text-lg font-bold text-[var(--text-heading)] truncate tracking-tight">{title}</h1>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] hidden sm:block truncate mt-0.5">{subtitle}</p>
        )}
      </div>

      {/* Global Search Bar */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-muted)] hover:border-[var(--border-color)] transition-all w-56">
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs select-none">Search campaigns, contacts…</span>
        <kbd className="ml-auto text-[10px] font-mono px-1.5 py-0.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-[var(--text-muted)]">⌘K</kbd>
      </div>

      {/* DB Status Badge */}
      <div className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${
        dbConnected
          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80'
          : 'bg-rose-50 text-rose-600 border border-rose-200/80'
      }`}>
        <div className={`w-1.5 h-1.5 rounded-full ${dbConnected ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'}`} />
        <span>{dbConnected ? 'DB Live' : 'DB Offline'}</span>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-2">
        {/* Notifications */}
        <button 
          className="relative p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          title="Notifications"
          aria-label="Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-indigo-600 rounded-full border-2 border-[var(--bg-card)]" />
        </button>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
          aria-label="Toggle theme"
          title={`Switch to ${theme === 'light' ? 'Dark' : 'Light'} theme`}
        >
          {theme === 'light' ? <Moon className="w-4 h-4 text-slate-600" /> : <Sun className="w-4 h-4 text-amber-400" />}
        </button>

        <div className="h-6 w-[1px] bg-[var(--border-color)] hidden sm:block" />

        {/* User Profile */}
        <div className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl bg-[var(--bg-card)] border border-[var(--border-color)] shadow-xs select-none">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-[11px] font-bold shadow-xs flex-shrink-0">
            A
          </div>
          <div className="hidden sm:block text-left leading-tight pr-1">
            <p className="text-xs font-semibold text-[var(--text-primary)]">Admin</p>
            <p className="text-[10px] text-indigo-600 font-medium">Super Admin</p>
          </div>
          <ChevronDown className="hidden sm:block w-3 h-3 text-[var(--text-muted)]" />
        </div>
      </div>
    </header>
  );
}
