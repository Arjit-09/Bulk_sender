'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Megaphone,
  Users,
  Inbox,
  FileText,
  BarChart3,
  Settings,
  Send,
  MessageSquare,
  Mail,
  Globe,
  CreditCard,
  Shield,
  Crown,
  ChevronDown,
  Zap,
  X,
  Building2,
} from 'lucide-react';
import { useState } from 'react';

interface SidebarProps {
  balance?: number;
  onOpenQuickSend?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
  orgName?: string;
  planName?: string;
  userRole?: string;
}

const navSections = [
  {
    label: 'Overview',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    label: 'Channels',
    items: [
      { label: 'SMS Campaigns', href: '/campaigns', icon: Send, badge: 'SMS', badgeColor: 'bg-indigo-100 text-indigo-700' },
      { label: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, badge: 'WA', badgeColor: 'bg-green-100 text-green-700' },
      { label: 'Email Suite', href: '/email', icon: Mail, badge: 'EMAIL', badgeColor: 'bg-cyan-100 text-cyan-700' },
    ],
  },
  {
    label: 'Audience',
    items: [
      { label: 'Contacts', href: '/contacts', icon: Users },
      { label: 'Country Targeting', href: '/countries', icon: Globe },
      { label: 'Inbox', href: '/inbox', icon: Inbox },
    ],
  },
  {
    label: 'Content',
    items: [
      { label: 'Templates', href: '/templates', icon: FileText },
      { label: 'Reports & Analytics', href: '/reports', icon: BarChart3 },
    ],
  },
  {
    label: 'Account',
    items: [
      { label: 'Billing & Plans', href: '/billing', icon: CreditCard },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const adminItems = [
  { label: 'Admin Panel', href: '/admin', icon: Shield },
  { label: 'Super Admin', href: '/super-admin', icon: Crown },
];

export default function Sidebar({
  balance = 0,
  onOpenQuickSend,
  isOpen = false,
  onClose,
  orgName = 'ZenithServices',
  planName = 'Starter',
  userRole = 'ADMIN',
}: SidebarProps) {
  const pathname = usePathname();
  const [orgOpen, setOrgOpen] = useState(false);

  const isAdmin = userRole === 'ADMIN' || userRole === 'SUPER_ADMIN';
  const isSuperAdmin = userRole === 'SUPER_ADMIN';

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  const planColors: Record<string, string> = {
    Starter: 'text-slate-500',
    Growth: 'text-indigo-600',
    Enterprise: 'text-amber-600',
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          w-[260px] h-screen fixed left-0 top-0 zs-sidebar
          flex flex-col z-50 transition-transform duration-300 select-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-30
        `}
      >
        {/* Brand Header */}
        <div className="h-[64px] flex items-center px-4 border-b border-[var(--border-color)] gap-3 flex-shrink-0">
          <div className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-indigo-200">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-bold text-[15px] gradient-text block truncate">
              ZenithServices
            </span>
            <span className="block text-[10px] uppercase tracking-widest text-[var(--text-muted)] font-semibold">
              Marketing Platform
            </span>
          </div>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)] transition-all cursor-pointer"
            aria-label="Close navigation"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Org Switcher */}
        <div className="px-3 pt-3 pb-2 flex-shrink-0">
          <button
            onClick={() => setOrgOpen(!orgOpen)}
            className="w-full flex items-center gap-2.5 p-2.5 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-color)] hover:border-[var(--border-strong)] transition-all cursor-pointer group"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center flex-shrink-0">
              <Building2 className="w-4 h-4 text-white" />
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-[var(--text-primary)] truncate">{orgName}</p>
              <p className={`text-[10px] font-medium ${planColors[planName] || 'text-indigo-600'}`}>
                {planName} Plan
              </p>
            </div>
            <ChevronDown className={`w-3.5 h-3.5 text-[var(--text-muted)] flex-shrink-0 transition-transform ${orgOpen ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Quick Send Button */}
        <div className="px-3 pb-2 flex-shrink-0">
          <button
            onClick={() => { if (onOpenQuickSend) onOpenQuickSend(); handleNavClick(); }}
            className="zs-btn-primary w-full justify-center text-sm py-2.5"
          >
            <Send className="w-3.5 h-3.5" />
            <span>Quick Send</span>
          </button>
        </div>

        {/* Nav Sections */}
        <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4 mt-1">
          {navSections.map((section) => (
            <div key={section.label}>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[var(--text-muted)] px-2 mb-1">
                {section.label}
              </p>
              <div className="space-y-0.5">
                {section.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-indigo-50 text-indigo-700 border border-indigo-100 shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-indigo-600' : 'text-[var(--text-muted)]'}`} />
                      <span className="flex-1">{item.label}</span>
                      {(item as any).badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded-md ${(item as any).badgeColor}`}>
                          {(item as any).badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Admin section */}
          {isAdmin && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-amber-500 px-2 mb-1">
                Administration
              </p>
              <div className="space-y-0.5">
                {adminItems.map((item) => {
                  if (item.href === '/super-admin' && !isSuperAdmin) return null;
                  const Icon = item.icon;
                  const isActive = pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                        isActive
                          ? 'bg-amber-50 text-amber-700 border border-amber-100 shadow-sm'
                          : 'text-[var(--text-secondary)] hover:text-amber-700 hover:bg-amber-50'
                      }`}
                    >
                      <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-amber-600' : 'text-[var(--text-muted)]'}`} />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </nav>

        {/* Bottom Balance Card */}
        <div className="p-3 border-t border-[var(--border-color)] flex-shrink-0">
          <div className="p-3 rounded-xl bg-gradient-to-br from-indigo-50 to-cyan-50 border border-indigo-100">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-[var(--text-secondary)] font-medium flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                Account Balance
              </span>
              <span className="font-bold text-sm text-[var(--text-primary)]">₹{Number(balance).toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
            </div>
            <div className="zs-progress-track">
              <div
                className="zs-progress-bar"
                style={{ width: `${Math.min((balance / 100) * 100, 100)}%` }}
              />
            </div>
            <div className="flex items-center justify-between mt-2 text-[10px]">
              <span className="text-green-600 font-medium flex items-center gap-1">
                <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse-soft" />
                Active
              </span>
              <Link href="/billing" onClick={handleNavClick} className="text-indigo-600 font-semibold hover:underline">
                Top up →
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
