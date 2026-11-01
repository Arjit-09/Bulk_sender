'use client';

import { useEffect, useState } from 'react';
import { Bell, Sun, Moon, Menu, Search, ChevronDown, CheckCircle2, Database } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

interface TopbarProps {
  title: string;
  subtitle?: string;
  dbConnected?: boolean;
  onMenuToggle?: () => void;
  actions?: React.ReactNode;
}

export default function Topbar({ title, subtitle, dbConnected = true, onMenuToggle, actions }: TopbarProps) {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const { user, role, switchRole, availableUsers } = useAuth();

  useEffect(() => {
    const saved = (localStorage.getItem('zs-theme') as 'light' | 'dark') || 'light';
    setTheme(saved);
    document.documentElement.setAttribute('data-theme', saved);
  }, []);

  const toggleTheme = () => {
    const next = theme === 'light' ? 'dark' : 'light';
    setTheme(next);
    localStorage.setItem('zs-theme', next);
    document.documentElement.setAttribute('data-theme', next);
  };

  return (
    <header
      className="zs-topbar fixed top-0 right-0 left-0 lg:left-[240px] h-[64px] z-30 flex items-center px-4 sm:px-6 gap-3"
    >
      {/* Mobile hamburger */}
      <button
        onClick={onMenuToggle}
        className="lg:hidden p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
        aria-label="Toggle menu"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Title */}
      <div className="flex-1 min-w-0">
        <h1 className="text-sm font-semibold text-[var(--text-heading)] truncate">
          {title}
        </h1>
        {subtitle && (
          <p className="text-xs text-[var(--text-muted)] truncate mt-0.5 hidden sm:block">{subtitle}</p>
        )}
      </div>

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-color)] text-[var(--text-muted)] w-48 lg:w-60 cursor-text transition-all hover:border-[var(--border-strong)]">
        <Search className="w-3.5 h-3.5 flex-shrink-0" />
        <span className="text-xs select-none flex-1">Search…</span>
        <kbd className="text-[10px] font-mono px-1 py-0.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded text-[var(--text-muted)]">⌘K</kbd>
      </div>

      {/* DB Status */}
      <div
        className="hidden xl:flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-medium"
        style={{
          background: dbConnected ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
          color: dbConnected ? '#16a34a' : '#dc2626',
        }}
      >
        <Database className="w-3 h-3" />
        <span>{dbConnected ? 'PostgreSQL Active' : 'DB Offline'}</span>
        <span
          className="w-1.5 h-1.5 rounded-full"
          style={{ background: dbConnected ? '#22c55e' : '#ef4444', animation: 'pulse-dot 2s infinite' }}
        />
      </div>

      {/* Extra actions slot */}
      {actions}

      {/* Divider */}
      <div className="h-5 w-px bg-[var(--border-color)] hidden sm:block" />

      {/* Notifications */}
      <button
        className="relative p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
        aria-label="Notifications"
      >
        <Bell className="w-4 h-4" />
        <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-blue-500 rounded-full" />
      </button>

      {/* Theme toggle */}
      <button
        onClick={toggleTheme}
        className="p-2 rounded-lg text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] transition-colors"
        aria-label="Toggle theme"
      >
        {theme === 'light'
          ? <Moon className="w-4 h-4" />
          : <Sun className="w-4 h-4 text-amber-400" />}
      </button>

      {/* User */}
      <div className="relative">
        <button
          onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-color)] hover:border-[var(--border-strong)] transition-all select-none"
        >
          <div
            className="w-6 h-6 rounded-md flex items-center justify-center text-[11px] font-bold text-white flex-shrink-0"
            style={{ background: '#374151' }}
          >
            {user?.avatar || 'U'}
          </div>
          <div className="hidden sm:block text-left leading-tight">
            <p className="text-xs font-semibold text-[var(--text-primary)]">{user?.name || 'Admin'}</p>
            <p className="text-[10px] text-[var(--text-muted)]">{role?.replace('_', ' ')}</p>
          </div>
          <ChevronDown className="hidden sm:block w-3 h-3 text-[var(--text-muted)]" />
        </button>

        {roleMenuOpen && (
          <div className="absolute right-0 top-full mt-2 w-52 p-1.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl shadow-lg z-50 animate-fade-in-up">
            <div className="px-3 py-2 border-b border-[var(--border-subtle)] mb-1">
              <p className="text-xs font-semibold text-[var(--text-heading)]">{user?.name}</p>
              <p className="text-[11px] text-[var(--text-muted)]">{user?.email}</p>
            </div>
            <p className="px-2 py-1 text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">
              Switch Role
            </p>
            {availableUsers?.map((u) => (
              <button
                key={u.role}
                onClick={() => { switchRole(u.role); setRoleMenuOpen(false); }}
                className="w-full flex items-center justify-between px-3 py-1.5 rounded-lg text-xs transition-colors text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
              >
                <div className="text-left">
                  <p className="font-medium">{u.name}</p>
                  <p className="text-[10px] text-[var(--text-muted)]">{u.role}</p>
                </div>
                {role === u.role && <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
