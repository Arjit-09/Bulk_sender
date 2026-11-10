'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Send,
  MessageSquare,
  Mail,
  Inbox,
  Users,
  FileText,
  BarChart2,
  Settings,
  CreditCard,
  Shield,
  Crown,
  Globe,
  X,
  CheckCircle2,
  Phone,
  HelpCircle,
  ChevronDown,
  Sparkles,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface SidebarProps {
  balance?: number;
  onOpenQuickSend?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navSections = [
  {
    title: 'GENERAL',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    title: 'CHANNELS',
    items: [
      { label: 'SMS Campaigns', href: '/campaigns', icon: Phone, badge: 'SMS' },
      { label: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, badge: 'WA' },
      { label: 'Email Suite', href: '/email', icon: Mail, badge: 'Email' },
    ],
  },
  {
    title: 'AUDIENCE & INBOX',
    items: [
      { label: 'Live Inbox', href: '/inbox', icon: Inbox, badge: '2-Way' },
      { label: 'Contacts', href: '/contacts', icon: Users },
      { label: 'Coverage Hub', href: '/countries', icon: Globe },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Templates', href: '/templates', icon: FileText },
      { label: 'Reports', href: '/reports', icon: BarChart2 },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { label: 'Admin Console', href: '/admin', icon: Shield },
      { label: 'Super Admin', href: '/super-admin', icon: Crown },
      { label: 'Billing & Wallets', href: '/billing', icon: CreditCard },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

export default function Sidebar({
  balance = 24.843,
  onOpenQuickSend,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, role, switchRole, availableUsers } = useAuth();
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 lg:hidden bg-black/80 backdrop-blur-sm transition-opacity duration-300"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Permanently Docked Left Navigation Panel */}
      <aside
        style={{ width: 'var(--sidebar-width, 260px)', backgroundColor: '#060b26' }}
        className={`fixed top-0 bottom-0 left-0 z-50 flex flex-col border-r border-white/10 shadow-2xl transition-transform duration-300 ease-in-out ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand Header */}
        <div className="h-16 sm:h-[72px] flex items-center justify-between px-5 border-b border-white/10 flex-shrink-0 bg-[#060b26]">
          <Link href="/" className="flex items-center gap-3 min-w-0" onClick={handleNavClick}>
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-[0_0_15px_rgba(0,117,255,0.7)]">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <div className="min-w-0">
              <span className="text-base font-black text-white tracking-widest block truncate uppercase">
                VISION UI
              </span>
              <span className="text-[11px] font-bold text-cyan-400 block truncate tracking-wider">
                SMS & CLOUD PAAS
              </span>
            </div>
          </Link>

          {/* Mobile Close Button */}
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Close Navigation"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Quick Send CTA */}
        <div className="px-4 pt-4 pb-2 flex-shrink-0 bg-[#060b26]">
          <button
            onClick={() => {
              if (onOpenQuickSend) onOpenQuickSend();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl text-xs sm:text-sm font-black text-white bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-400 shadow-[0_0_20px_rgba(0,117,255,0.4)] hover:shadow-[0_0_25px_rgba(0,210,255,0.7)] transition-all duration-200 transform hover:-translate-y-0.5 cursor-pointer"
          >
            <Send className="w-4 h-4" />
            <span>Dispatch Quick SMS</span>
          </button>
        </div>

        {/* Scrollable Navigation Area */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-5 sidebar-scroll">
          {navSections.map((sec, idx) => (
            <div key={idx}>
              <p className="px-3 mb-2 text-[11px] font-black tracking-widest text-slate-400 uppercase">
                {sec.title}
              </p>
              <div className="space-y-1">
                {sec.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className={`flex items-center justify-between px-3 py-2.5 rounded-2xl text-xs sm:text-sm font-bold transition-all duration-200 ${
                        isActive
                          ? 'bg-[#1a1f37] text-white shadow-[0_4px_16px_rgba(0,0,0,0.6)] border border-blue-500/40'
                          : 'text-slate-300 hover:bg-white/5 hover:text-white'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-7 h-7 sm:w-8 sm:h-8 rounded-xl flex items-center justify-center flex-shrink-0 transition-colors ${
                            isActive
                              ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(0,117,255,0.8)]'
                              : 'bg-[#1a1f37] text-slate-300'
                          }`}
                        >
                          <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </div>
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge && (
                        <span
                          className={`text-[9px] font-black px-2 py-0.5 rounded-full ${
                            isActive
                              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-400/40'
                              : 'bg-white/10 text-slate-300'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Vision UI Documentation Box */}
          <div className="pt-2 pb-2">
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-950/60 to-indigo-950/40 border border-blue-500/30 text-xs">
              <div className="w-8 h-8 rounded-xl bg-blue-600/40 text-cyan-300 flex items-center justify-center mb-2.5">
                <HelpCircle className="w-4 h-4" />
              </div>
              <p className="font-extrabold text-white text-xs sm:text-sm">Need help?</p>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                Check our documentation for carrier routing & REST APIs
              </p>
              <Link
                href="/admin"
                onClick={handleNavClick}
                className="mt-3 block text-center py-2 px-3 rounded-xl bg-white/10 hover:bg-white/20 text-white font-black text-[10px] tracking-wider transition-colors"
              >
                DOCUMENTATION
              </Link>
            </div>
          </div>
        </div>

        {/* User Profile Strip at Bottom (Pinned) */}
        <div className="p-3 sm:p-4 border-t border-white/10 bg-[#04081c] flex-shrink-0">
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-2xl text-white hover:bg-white/5 transition-colors cursor-pointer"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl sm:rounded-2xl bg-gradient-to-tr from-cyan-500 to-blue-600 text-white font-black text-xs flex items-center justify-center flex-shrink-0 shadow-[0_0_10px_rgba(0,210,255,0.5)]">
                  {user?.avatar || 'AS'}
                </div>
                <div className="min-w-0 text-left">
                  <p className="text-xs sm:text-sm font-black text-white truncate leading-tight">
                    {user?.name || 'Arjit Sharma'}
                  </p>
                  <p className="text-[11px] text-cyan-400 truncate font-mono font-bold mt-0.5">
                    {balance.toFixed(3)} Credits
                  </p>
                </div>
              </div>
              <ChevronDown className="w-4 h-4 text-slate-400 flex-shrink-0" />
            </button>

            {roleMenuOpen && (
              <div className="absolute bottom-full left-0 right-0 mb-2 p-2 bg-[#0b1437] rounded-2xl shadow-2xl z-50 border border-blue-500/40 backdrop-blur-2xl">
                <p className="px-3 py-1.5 text-[10px] font-black text-slate-400 uppercase tracking-wider">
                  Switch Active Role
                </p>
                {availableUsers?.map((u) => (
                  <button
                    key={u.role}
                    onClick={() => {
                      switchRole(u.role);
                      setRoleMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                      role === u.role
                        ? 'bg-blue-600/30 text-cyan-300 border border-blue-500/30'
                        : 'text-slate-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-left">
                      <p className="leading-tight">{u.name}</p>
                      <p className="text-[10px] text-slate-400 font-normal">{u.role}</p>
                    </div>
                    {role === u.role && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </aside>
    </>
  );
}
