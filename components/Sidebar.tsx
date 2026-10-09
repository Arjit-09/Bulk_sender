'use client';

import Link from 'next/link';
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
  CreditCard,
  ShieldCheck,
  X
} from 'lucide-react';

interface SidebarProps {
  balance?: number;
  onOpenQuickSend?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ balance = 25.0, onOpenQuickSend, isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    { label: 'Campaigns', href: '/campaigns', icon: Megaphone },
    { label: 'Contacts', href: '/contacts', icon: Users },
    { label: 'Inbox', href: '/inbox', icon: Inbox },
    { label: 'Templates', href: '/templates', icon: FileText },
    { label: 'Reports', href: '/reports', icon: BarChart3 },
    { label: 'Settings', href: '/settings', icon: Settings },
  ];

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar Panel */}
      <aside
        className={`
          w-64 h-screen fixed left-0 top-0 bg-[#0f1129] border-r border-[#6366f1]/20
          flex flex-col justify-between z-50 transition-transform duration-300 select-none
          ${isOpen ? 'translate-x-0' : '-translate-x-full'}
          lg:translate-x-0 lg:z-30
        `}
      >
        {/* Top Section */}
        <div>
          {/* Brand Logo */}
          <div className="h-16 flex items-center px-6 border-b border-[#6366f1]/15 gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#06b6d4] flex items-center justify-center shadow-lg shadow-indigo-500/30 flex-shrink-0">
              <Send className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <span className="font-bold text-lg bg-gradient-to-r from-white via-indigo-200 to-indigo-400 bg-clip-text text-transparent block truncate">
                PulseSMS
              </span>
              <span className="block text-[10px] uppercase tracking-wider text-[#06b6d4] font-semibold">
                Enterprise Hub
              </span>
            </div>
            {/* Close button — only shown on mobile */}
            <button
              onClick={onClose}
              className="lg:hidden ml-auto p-1.5 rounded-lg text-[#94a3b8] hover:text-white hover:bg-[#181a35] transition-all cursor-pointer"
              aria-label="Close navigation"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Quick Send CTA */}
          <div className="p-4">
            <button
              onClick={() => {
                if (onOpenQuickSend) onOpenQuickSend();
                handleNavClick();
              }}
              className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] hover:from-[#4f46e5] hover:to-[#4338ca] text-white font-medium text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Send className="w-4 h-4" />
              <span>Quick Send SMS</span>
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="px-3 space-y-1 mt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={handleNavClick}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30 shadow-sm shadow-indigo-500/20'
                      : 'text-[#94a3b8] hover:text-white hover:bg-[#181a35]'
                  }`}
                >
                  <Icon className={`w-4 h-4 flex-shrink-0 ${isActive ? 'text-[#818cf8]' : 'text-[#94a3b8]'}`} />
                  <span>{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bottom Account & Balance Card */}
        <div className="p-4 border-t border-[#6366f1]/15">
          <div className="p-3 rounded-xl bg-[#181a35] border border-[#6366f1]/15 space-y-2">
            <div className="flex items-center justify-between text-xs text-[#94a3b8]">
              <span className="flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-[#06b6d4]" />
                Account Balance
              </span>
              <span className="font-semibold text-white">${balance.toFixed(2)}</span>
            </div>
            <div className="flex items-center justify-between text-[11px] text-[#10b981]">
              <span className="flex items-center gap-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                PostgreSQL Ready
              </span>
              <Link href="/settings" onClick={handleNavClick} className="text-[#818cf8] hover:underline">
                Top up
              </Link>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
