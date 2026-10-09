'use client';

import { useState, useEffect } from 'react';
import { Search, Bell, Database, CheckCircle2, AlertCircle, Sun, Moon, Menu } from 'lucide-react';
import Link from 'next/link';

interface TopbarProps {
  title: string;
  subtitle?: string;
  dbConnected?: boolean;
  onMenuToggle?: () => void;
}

export default function Topbar({ title, subtitle, dbConnected = false, onMenuToggle }: TopbarProps) {
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');

  useEffect(() => {
    const saved = localStorage.getItem('theme') || 'dark';
    setTheme(saved as 'dark' | 'light');
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    localStorage.setItem('theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header className="h-16 fixed top-0 right-0 left-0 lg:left-64 bg-[#0a0b1a]/80 backdrop-blur-md border-b border-[#6366f1]/15 px-4 sm:px-8 flex items-center justify-between z-20 transition-all">
      {/* Left: Hamburger (mobile only) + Page Title */}
      <div className="flex items-center gap-3 min-w-0">
        {/* Hamburger button — only on mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden p-2 rounded-xl bg-[#12142e] border border-[#6366f1]/20 text-[#94a3b8] hover:text-white hover:bg-[#181a35] transition-all cursor-pointer flex-shrink-0"
          aria-label="Open navigation menu"
        >
          <Menu className="w-4 h-4" />
        </button>

        <div className="min-w-0">
          <h1 className="text-sm sm:text-base lg:text-lg font-bold text-white tracking-tight truncate">
            {title}
          </h1>
          {subtitle && (
            <p className="text-[10px] sm:text-xs text-[#94a3b8] truncate hidden sm:block">{subtitle}</p>
          )}
        </div>
      </div>

      {/* Right controls */}
      <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0">
        {/* Database Status Indicator — hide label on very small screens */}
        <Link
          href="/settings"
          className={`flex items-center gap-1.5 sm:gap-2 px-2 sm:px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            dbConnected
              ? 'bg-[#10b981]/10 text-[#10b981] border-[#10b981]/30 hover:bg-[#10b981]/20'
              : 'bg-[#f59e0b]/10 text-[#f59e0b] border-[#f59e0b]/30 hover:bg-[#f59e0b]/20'
          }`}
          title={dbConnected ? 'PostgreSQL Active & Synced' : 'Click to configure PostgreSQL connection'}
        >
          <Database className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{dbConnected ? 'PostgreSQL Active' : 'Postgres Setup'}</span>
          {dbConnected ? (
            <CheckCircle2 className="w-3.5 h-3.5" />
          ) : (
            <AlertCircle className="w-3.5 h-3.5 animate-pulse" />
          )}
        </Link>

        {/* Theme Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl bg-[#12142e] border border-[#6366f1]/20 text-[#94a3b8] hover:text-white hover:bg-[#181a35] transition-all cursor-pointer"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun className="w-4 h-4 text-[#f59e0b]" /> : <Moon className="w-4 h-4 text-[#818cf8]" />}
        </button>

        {/* User profile chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-[#6366f1]/20">
          <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#06b6d4] flex items-center justify-center font-bold text-xs text-white shadow-md flex-shrink-0">
            AS
          </div>
          <div className="hidden sm:block text-left">
            <span className="block text-xs font-semibold text-white">arjit</span>
            <span className="block text-[10px] text-[#94a3b8]">Administrator</span>
          </div>
        </div>
      </div>
    </header>
  );
}
