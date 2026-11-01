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
  ChevronDown,
  Zap,
  X,
  CheckCircle2,
  Phone,
} from 'lucide-react';
import { useState } from 'react';
import { useAuth } from '@/lib/auth-context';

interface SidebarProps {
  balance?: number;
  onOpenQuickSend?: () => void;
  isOpen?: boolean;
  onClose?: () => void;
}

const navItems = [
  {
    section: 'Main',
    items: [
      { label: 'Dashboard', href: '/', icon: LayoutDashboard },
    ],
  },
  {
    section: 'Channels',
    items: [
      { label: 'SMS Campaigns', href: '/campaigns', icon: Phone, badge: 'SMS' },
      { label: 'WhatsApp', href: '/whatsapp', icon: MessageSquare, badge: 'WA' },
      { label: 'Email Suite', href: '/email', icon: Mail, badge: 'Email' },
    ],
  },
  {
    section: 'Inbox & Audience',
    items: [
      { label: 'Live Inbox', href: '/inbox', icon: Inbox, badge: '2-Way' },
      { label: 'Contacts', href: '/contacts', icon: Users },
      { label: 'Coverage Map', href: '/countries', icon: Globe },
    ],
  },
  {
    section: 'Content',
    items: [
      { label: 'Templates', href: '/templates', icon: FileText },
      { label: 'Reports', href: '/reports', icon: BarChart2 },
    ],
  },
  {
    section: 'Admin',
    items: [
      { label: 'Admin Console', href: '/admin', icon: Shield },
      { label: 'Super Admin', href: '/super-admin', icon: Crown },
      { label: 'Billing', href: '/billing', icon: CreditCard },
      { label: 'Settings', href: '/settings', icon: Settings },
    ],
  },
];

const badgeColors: Record<string, string> = {
  SMS: 'bg-blue-500/20 text-blue-300',
  WA: 'bg-green-500/20 text-green-300',
  Email: 'bg-purple-500/20 text-purple-300',
  '2-Way': 'bg-slate-500/20 text-slate-300',
};

export default function Sidebar({
  balance = 48.5,
  onOpenQuickSend,
  isOpen = false,
  onClose,
}: SidebarProps) {
  const pathname = usePathname();
  const { user, role, switchRole, availableUsers } = useAuth();
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const handleNavClick = () => {
    if (onClose) onClose();
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        style={{ backgroundColor: '#111827', borderRight: '1px solid rgba(255,255,255,0.06)' }}
        className={`fixed top-0 bottom-0 left-0 w-[240px] z-50 flex flex-col transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        {/* Brand */}
        <div className="h-[64px] flex items-center justify-between px-4" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/" className="flex items-center gap-2.5 min-w-0" onClick={handleNavClick}>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(59,130,246,0.15)' }}>
              <Zap className="w-4 h-4 text-blue-400" />
            </div>
            <div className="min-w-0">
              <span className="text-sm font-bold text-white tracking-tight block truncate">
                ZenithTech
              </span>
              <span className="text-[10px] font-medium block truncate" style={{ color: '#6b7280' }}>
                Omnichannel PaaS
              </span>
            </div>
          </Link>
          <button
            onClick={onClose}
            className="lg:hidden p-1.5 rounded-md transition-colors"
            style={{ color: '#6b7280' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Quick Send */}
        <div className="px-3 pt-3 pb-1">
          <button
            onClick={() => {
              if (onOpenQuickSend) onOpenQuickSend();
              if (onClose) onClose();
            }}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-semibold text-white transition-all"
            style={{ background: '#3b82f6' }}
            onMouseEnter={e => (e.currentTarget.style.background = '#2563eb')}
            onMouseLeave={e => (e.currentTarget.style.background = '#3b82f6')}
          >
            <Send className="w-3.5 h-3.5" />
            Quick Send
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-4">
          {navItems.map((group, idx) => (
            <div key={idx}>
              <p
                className="px-2 mb-1 text-[10px] font-semibold uppercase tracking-wider"
                style={{ color: '#4b5563' }}
              >
                {group.section}
              </p>
              <div className="space-y-0.5">
                {group.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={handleNavClick}
                      className="flex items-center justify-between px-2 py-1.5 rounded-md text-xs font-medium transition-all group"
                      style={{
                        backgroundColor: isActive ? '#1f2937' : 'transparent',
                        color: isActive ? '#f9fafb' : '#9ca3af',
                      }}
                      onMouseEnter={e => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = '#1f2937';
                          e.currentTarget.style.color = '#f9fafb';
                        }
                      }}
                      onMouseLeave={e => {
                        if (!isActive) {
                          e.currentTarget.style.backgroundColor = 'transparent';
                          e.currentTarget.style.color = '#9ca3af';
                        }
                      }}
                    >
                      <div className="flex items-center gap-2.5">
                        {isActive && (
                          <div
                            className="absolute left-0 w-0.5 h-5 rounded-r"
                            style={{ background: '#3b82f6' }}
                          />
                        )}
                        <Icon
                          className="w-3.5 h-3.5 flex-shrink-0"
                          style={{ color: isActive ? '#60a5fa' : '#6b7280' }}
                        />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 rounded ${badgeColors[item.badge] || 'bg-gray-700 text-gray-300'}`}>
                          {item.badge}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </div>
            </div>
          ))}
        </nav>

        {/* Balance Strip */}
        <div className="px-3 py-2" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <div className="flex items-center justify-between px-2 py-1.5 rounded-md" style={{ background: 'rgba(255,255,255,0.04)' }}>
            <span className="text-[10px] font-medium" style={{ color: '#6b7280' }}>Balance</span>
            <span className="text-xs font-bold text-white">${balance.toFixed(2)}</span>
          </div>
        </div>

        {/* User Profile */}
        <div className="px-3 py-2 relative" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <button
            onClick={() => setUserDropdownOpen(!userDropdownOpen)}
            className="w-full flex items-center justify-between px-2 py-1.5 rounded-md transition-colors"
            style={{ background: userDropdownOpen ? 'rgba(255,255,255,0.06)' : 'transparent' }}
          >
            <div className="flex items-center gap-2 min-w-0">
              <div
                className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold text-white flex-shrink-0"
                style={{ background: '#374151' }}
              >
                {user?.avatar || 'U'}
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-white truncate">{user?.name || 'Admin'}</p>
                <p className="text-[10px] truncate" style={{ color: '#6b7280' }}>
                  {role?.replace('_', ' ') || 'Admin'}
                </p>
              </div>
            </div>
            <ChevronDown className="w-3 h-3 flex-shrink-0" style={{ color: '#6b7280' }} />
          </button>

          {userDropdownOpen && (
            <div
              className="absolute bottom-full left-2 right-2 mb-1 p-1.5 rounded-lg shadow-xl z-50"
              style={{ background: '#1f2937', border: '1px solid rgba(255,255,255,0.08)' }}
            >
              <p className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider" style={{ color: '#6b7280' }}>
                Switch Role
              </p>
              {availableUsers?.map((u) => (
                <button
                  key={u.role}
                  onClick={() => { switchRole(u.role); setUserDropdownOpen(false); }}
                  className="w-full flex items-center justify-between px-2 py-1.5 rounded-md text-xs transition-colors"
                  style={{
                    color: role === u.role ? '#f9fafb' : '#9ca3af',
                    background: role === u.role ? 'rgba(59,130,246,0.15)' : 'transparent',
                  }}
                >
                  <div className="text-left">
                    <p className="font-medium">{u.name}</p>
                    <p className="text-[10px] opacity-60">{u.role}</p>
                  </div>
                  {role === u.role && <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />}
                </button>
              ))}
            </div>
          )}
        </div>
      </aside>
    </>
  );
}
