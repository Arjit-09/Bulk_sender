'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import {
  Send, MessageSquare, Mail, Users, TrendingUp, Globe, Zap,
  ArrowUpRight, ArrowRight, Plus, RefreshCw, BarChart2, Activity,
  CheckCircle2, Clock, AlertCircle, Megaphone
} from 'lucide-react';
import Link from 'next/link';

// ─── Stat Card Component ──────────────────────────────────────────────────────
function StatCard({
  label, value, subValue, icon: Icon, iconBg, trend, trendUp,
}: {
  label: string; value: string; subValue?: string;
  icon: any; iconBg: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="zs-card p-5 animate-fade-in-up">
      <div className="flex items-start justify-between mb-4">
        <div className={`w-10 h-10 rounded-xl ${iconBg} flex items-center justify-center shadow-sm flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-lg ${
            trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'
          }`}>
            <ArrowUpRight className={`w-3 h-3 ${!trendUp ? 'rotate-180' : ''}`} />
            {trend}
          </span>
        )}
      </div>
      <div className="space-y-1">
        <p className="text-2xl font-bold text-[var(--text-heading)]">{value}</p>
        <p className="text-xs font-medium text-[var(--text-secondary)]">{label}</p>
        {subValue && <p className="text-[11px] text-[var(--text-muted)]">{subValue}</p>}
      </div>
    </div>
  );
}

// ─── Channel Overview Card ────────────────────────────────────────────────────
function ChannelCard({
  channel, icon: Icon, color, sent, delivered, rate, href,
}: {
  channel: string; icon: any; color: string; sent: number;
  delivered: number; rate: number; href: string;
}) {
  return (
    <div className="zs-card p-5 hover:shadow-md transition-shadow cursor-pointer animate-fade-in-up">
      <Link href={href} className="block">
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-9 h-9 rounded-xl ${color} flex items-center justify-center`}>
            <Icon className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
          </div>
          <div>
            <p className="text-sm font-bold text-[var(--text-heading)]">{channel}</p>
            <p className="text-[11px] text-[var(--text-muted)]">This month</p>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] ml-auto" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div>
            <p className="text-lg font-bold text-[var(--text-heading)]">{sent.toLocaleString()}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Sent</p>
          </div>
          <div>
            <p className="text-lg font-bold text-[var(--text-heading)]">{delivered.toLocaleString()}</p>
            <p className="text-[11px] text-[var(--text-muted)]">Delivered</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] text-[var(--text-muted)]">Delivery Rate</span>
            <span className="text-xs font-bold text-indigo-600">{rate}%</span>
          </div>
          <div className="zs-progress-track">
            <div className="zs-progress-bar" style={{ width: `${rate}%` }} />
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── India Regional Coverage Card ─────────────────────────────────────────────
const COUNTRIES = [
  { code: 'IN-DL', name: 'Delhi NCR', flag: '🇮🇳', dial: '+91', msgs: 14200 },
  { code: 'IN-MH', name: 'Mumbai / Maharashtra', flag: '🇮🇳', dial: '+91', msgs: 11800 },
  { code: 'IN-KA', name: 'Bengaluru / Karnataka', flag: '🇮🇳', dial: '+91', msgs: 9400 },
  { code: 'IN-TG', name: 'Hyderabad / Telangana', flag: '🇮🇳', dial: '+91', msgs: 7100 },
  { code: 'IN-TN', name: 'Chennai / Tamil Nadu', flag: '🇮🇳', dial: '+91', msgs: 5800 },
  { code: 'IN-WB', name: 'Kolkata / West Bengal', flag: '🇮🇳', dial: '+91', msgs: 4200 },
];

// ─── Activity Feed ────────────────────────────────────────────────────────────
const ACTIVITY = [
  { id: 1, type: 'sms', msg: 'Diwali Festive campaign sent to 2,400 contacts in Delhi NCR via Fast2SMS', time: '2m ago', status: 'success' },
  { id: 2, type: 'email', msg: 'Newsletter dispatched to Mumbai subscribers — 5,800 recipients', time: '15m ago', status: 'success' },
  { id: 3, type: 'wa', msg: 'WhatsApp promo to Bengaluru contacts — delivery in progress', time: '1h ago', status: 'pending' },
  { id: 4, type: 'sms', msg: 'Order updates dispatched via Fast2SMS India Route — 1,200 contacts', time: '3h ago', status: 'success' },
];

const typeIcons: Record<string, any> = { sms: Send, email: Mail, wa: MessageSquare };
const typeColors: Record<string, string> = {
  sms: 'bg-indigo-100 text-indigo-700',
  email: 'bg-cyan-100 text-cyan-700',
  wa: 'bg-green-100 text-green-700',
};

export default function DashboardPage() {
  const [loading, setLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const refresh = useCallback(() => {
    setLoading(true);
    setTimeout(() => setLoading(false), 800);
  }, []);

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        balance={87.50}
        onOpenQuickSend={() => {}}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        orgName="Acme Corp"
        planName="Growth"
        userRole="SUPER_ADMIN"
      />
      <Topbar
        title="Dashboard"
        subtitle="ZenithServices Omnichannel Marketing Platform"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />
      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">
        {/* Welcome Banner */}
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 p-6 sm:p-8 text-white shadow-xl shadow-indigo-200 animate-fade-in">
          <div className="relative z-10">
            <div className="flex items-start justify-between gap-4 flex-wrap">
              <div>
                <p className="text-indigo-100 text-sm font-medium mb-1">Good morning 👋</p>
                <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, Admin</h2>
                <p className="text-indigo-100 text-sm max-w-md">
                  Your campaigns are performing great. You've reached 24,600 contacts across 6 countries this month.
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link
                  href="/campaigns"
                  className="flex items-center gap-2 px-4 py-2.5 bg-white text-indigo-700 rounded-xl font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                >
                  <Megaphone className="w-4 h-4" />
                  New Campaign
                </Link>
                <button
                  onClick={refresh}
                  className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-all backdrop-blur-sm"
                >
                  <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                  Refresh
                </button>
              </div>
            </div>
          </div>
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
          <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
        </div>

        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Messages Sent"
            value="24,600"
            subValue="All channels combined"
            icon={Send}
            iconBg="stat-icon-sms"
            trend="+12.4%"
            trendUp={true}
          />
          <StatCard
            label="WhatsApp Delivered"
            value="8,240"
            subValue="98.2% delivery rate"
            icon={MessageSquare}
            iconBg="stat-icon-wa"
            trend="+8.1%"
            trendUp={true}
          />
          <StatCard
            label="Email Opens"
            value="14,820"
            subValue="42.6% open rate"
            icon={Mail}
            iconBg="stat-icon-email"
            trend="+5.7%"
            trendUp={true}
          />
          <StatCard
            label="Active Contacts"
            value="38,450"
            subValue="Across 6 countries"
            icon={Users}
            iconBg="stat-icon-users"
            trend="+3.2%"
            trendUp={true}
          />
        </div>

        {/* Channel Overview Row */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-[var(--text-heading)]">Channel Performance</h3>
            <Link href="/reports" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
              View Reports <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <ChannelCard channel="SMS Campaigns" icon={Send} color="stat-icon-sms" sent={8900} delivered={8640} rate={97.1} href="/campaigns" />
            <ChannelCard channel="WhatsApp" icon={MessageSquare} color="stat-icon-wa" sent={8400} delivered={8240} rate={98.1} href="/whatsapp" />
            <ChannelCard channel="Email Suite" icon={Mail} color="stat-icon-email" sent={7300} delivered={6950} rate={95.2} href="/email" />
          </div>
        </div>

        {/* Country Coverage + Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* Country Coverage */}
          <div className="zs-card p-5 animate-fade-in-up delay-200">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <Globe className="w-4 h-4 text-indigo-500" />
                  Country Coverage
                </h3>
                <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Active target regions</p>
              </div>
              <Link href="/countries" className="zs-btn-ghost text-xs py-1.5 px-3">
                Manage
              </Link>
            </div>
            <div className="space-y-2">
              {COUNTRIES.map((c) => (
                <div key={c.code} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-surface)] transition-colors">
                  <span className="text-2xl">{c.flag}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[var(--text-primary)]">{c.name}</p>
                    <p className="text-[11px] text-[var(--text-muted)]">{c.dial}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[var(--text-primary)]">{c.msgs.toLocaleString()}</p>
                    <p className="text-[10px] text-[var(--text-muted)]">msgs/mo</p>
                  </div>
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                </div>
              ))}
            </div>
          </div>

          {/* Activity Feed */}
          <div className="zs-card p-5 animate-fade-in-up delay-300">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                <Activity className="w-4 h-4 text-indigo-500" />
                Recent Activity
              </h3>
              <span className="text-[11px] text-[var(--text-muted)]">Live feed</span>
            </div>
            <div className="space-y-3">
              {ACTIVITY.map((a) => {
                const Icon = typeIcons[a.type];
                const colors = typeColors[a.type];
                return (
                  <div key={a.id} className="flex gap-3 p-3 rounded-xl hover:bg-[var(--bg-surface)] transition-colors">
                    <div className={`w-8 h-8 rounded-lg ${colors} flex items-center justify-center flex-shrink-0 mt-0.5`}>
                      <Icon className="w-3.5 h-3.5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[var(--text-primary)] leading-relaxed">{a.msg}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[10px] text-[var(--text-muted)]">{a.time}</span>
                        <span className={`zs-badge text-[9px] px-2 py-0.5 ${
                          a.status === 'success' ? 'zs-badge-success' :
                          a.status === 'pending' ? 'zs-badge-warning' :
                          'zs-badge-info'
                        }`}>
                          {a.status}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Quick Actions Row */}
        <div className="zs-card p-5 animate-fade-in-up delay-400">
          <h3 className="text-sm font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-amber-500" />
            Quick Actions
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Send SMS Blast', icon: Send, href: '/campaigns', color: 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700' },
              { label: 'WhatsApp Campaign', icon: MessageSquare, href: '/whatsapp', color: 'hover:bg-green-50 hover:border-green-200 hover:text-green-700' },
              { label: 'Email Newsletter', icon: Mail, href: '/email', color: 'hover:bg-cyan-50 hover:border-cyan-200 hover:text-cyan-700' },
              { label: 'Add Contacts', icon: Users, href: '/contacts', color: 'hover:bg-amber-50 hover:border-amber-200 hover:text-amber-700' },
            ].map((q) => (
              <Link
                key={q.label}
                href={q.href}
                className={`flex flex-col items-center gap-2 p-4 rounded-xl border border-[var(--border-color)] text-[var(--text-secondary)] text-xs font-medium transition-all text-center ${q.color}`}
              >
                <q.icon className="w-5 h-5" />
                {q.label}
              </Link>
            ))}
          </div>
        </div>

      </div>
    </main>
    </div>
  );
}
