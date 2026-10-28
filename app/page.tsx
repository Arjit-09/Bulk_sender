'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getDashboardStats } from '@/lib/db-actions';
import {
  Send, MessageSquare, Mail, Users, TrendingUp,
  ArrowUpRight, ArrowRight, Plus, RefreshCw, BarChart2, Activity,
  CheckCircle2, AlertCircle, Megaphone, Globe, Zap, IndianRupee
} from 'lucide-react';
import Link from 'next/link';

// ─── Stat Card ─────────────────────────────────────────────────────────────
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

// ─── Channel Card ──────────────────────────────────────────────────────────
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

// ─── India Regional Zones ──────────────────────────────────────────────────
const INDIA_ZONES = [
  { code: 'IN-DL', name: 'Delhi NCR', flag: '🇮🇳', dial: '+91', circle: 'North' },
  { code: 'IN-MH', name: 'Mumbai / Maharashtra', flag: '🇮🇳', dial: '+91', circle: 'West' },
  { code: 'IN-KA', name: 'Bengaluru / Karnataka', flag: '🇮🇳', dial: '+91', circle: 'South' },
  { code: 'IN-TG', name: 'Hyderabad / Telangana', flag: '🇮🇳', dial: '+91', circle: 'South' },
  { code: 'IN-TN', name: 'Chennai / Tamil Nadu', flag: '🇮🇳', dial: '+91', circle: 'South' },
  { code: 'IN-WB', name: 'Kolkata / West Bengal', flag: '🇮🇳', dial: '+91', circle: 'East' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);

  const loadStats = useCallback(async () => {
    setLoading(true);
    try {
      const s = await getDashboardStats();
      setStats(s);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadStats();
  }, [loadStats]);

  const balance = stats?.balance ?? 0;
  const totalSent = stats?.totalSent ?? 0;
  const deliveredCount = stats?.deliveredCount ?? 0;
  const totalContacts = stats?.totalContacts ?? 0;
  const deliveryRate = stats?.deliveryRate ?? 0;
  const activeCampaigns = stats?.activeCampaigns ?? 0;
  const recentCampaigns = stats?.recentCampaigns ?? [];

  const timeOfDay = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 17) return 'Good afternoon';
    return 'Good evening';
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        balance={balance}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        orgName="ZenithServices"
        planName="Growth"
        userRole="SUPER_ADMIN"
      />
      <Topbar
        title="Dashboard"
        subtitle="ZenithServices Omnichannel Marketing Platform — India"
        dbConnected={stats?.connected ?? false}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />
      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Welcome Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-indigo-500 to-cyan-500 p-6 sm:p-8 text-white shadow-xl shadow-indigo-200 animate-fade-in">
            <div className="relative z-10">
              <div className="flex items-start justify-between gap-4 flex-wrap">
                <div>
                  <p className="text-indigo-100 text-sm font-medium mb-1">{timeOfDay()} 👋</p>
                  <h2 className="text-2xl sm:text-3xl font-bold mb-2">Welcome back, Admin</h2>
                  <p className="text-indigo-100 text-sm max-w-md">
                    {totalSent > 0
                      ? `You've reached ${totalSent.toLocaleString()} contacts across India this month. Keep going!`
                      : 'Your platform is ready. Start your first campaign to reach Indian customers via SMS, WhatsApp & Email.'}
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
                    onClick={loadStats}
                    className="flex items-center gap-2 px-4 py-2.5 bg-white/20 hover:bg-white/30 rounded-xl font-medium text-sm transition-all backdrop-blur-sm"
                  >
                    <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                </div>
              </div>
            </div>
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/3 translate-x-1/4 pointer-events-none" />
            <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 pointer-events-none" />
          </div>

          {/* DB not connected notice */}
          {stats && !stats.connected && (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 flex items-start gap-3 text-xs text-amber-900">
              <AlertCircle className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Database not connected: </span>
                {stats.error}. Go to <Link href="/settings" className="font-bold underline">Settings</Link> to configure your database.
              </div>
            </div>
          )}

          {/* KPI Stats */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Total Messages Sent"
              value={totalSent.toLocaleString()}
              subValue="All channels combined"
              icon={Send}
              iconBg="stat-icon-sms"
            />
            <StatCard
              label="Messages Delivered"
              value={deliveredCount.toLocaleString()}
              subValue={`${deliveryRate}% delivery rate`}
              icon={CheckCircle2}
              iconBg="stat-icon-wa"
            />
            <StatCard
              label="Active Campaigns"
              value={activeCampaigns.toString()}
              subValue="Currently running"
              icon={BarChart2}
              iconBg="stat-icon-email"
            />
            <StatCard
              label="Total Contacts"
              value={totalContacts.toLocaleString()}
              subValue="In your database"
              icon={Users}
              iconBg="stat-icon-users"
            />
          </div>

          {/* Channel Performance */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-[var(--text-heading)]">Channel Performance</h3>
              <Link href="/reports" className="text-xs text-indigo-600 font-semibold hover:underline flex items-center gap-1">
                View Reports <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <ChannelCard channel="SMS (India)" icon={Send} color="stat-icon-sms" sent={totalSent} delivered={deliveredCount} rate={deliveryRate} href="/campaigns" />
              <ChannelCard channel="WhatsApp" icon={MessageSquare} color="stat-icon-wa" sent={0} delivered={0} rate={0} href="/whatsapp" />
              <ChannelCard channel="Email Suite" icon={Mail} color="stat-icon-email" sent={0} delivered={0} rate={0} href="/email" />
            </div>
          </div>

          {/* India Coverage + Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* India Telecom Circles */}
            <div className="zs-card p-5 animate-fade-in-up delay-200">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                    <Globe className="w-4 h-4 text-indigo-500" />
                    India Coverage
                  </h3>
                  <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Target telecom circles (+91)</p>
                </div>
                <Link href="/countries" className="zs-btn-ghost text-xs py-1.5 px-3">
                  Manage
                </Link>
              </div>
              <div className="space-y-2">
                {INDIA_ZONES.map((z) => (
                  <div key={z.code} className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-[var(--bg-surface)] transition-colors">
                    <span className="text-2xl">{z.flag}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-[var(--text-primary)]">{z.name}</p>
                      <p className="text-[11px] text-[var(--text-muted)]">{z.dial} · {z.circle} Circle</p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-full">Active</span>
                    </div>
                    <div className="w-1.5 h-1.5 rounded-full bg-green-500 flex-shrink-0" />
                  </div>
                ))}
              </div>
            </div>

            {/* Recent Campaigns */}
            <div className="zs-card p-5 animate-fade-in-up delay-300">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-[var(--text-heading)] flex items-center gap-2">
                  <Activity className="w-4 h-4 text-indigo-500" />
                  Recent Campaigns
                </h3>
                <Link href="/campaigns" className="text-xs text-indigo-600 font-semibold hover:underline">
                  View all →
                </Link>
              </div>
              {recentCampaigns.length === 0 ? (
                <div className="text-center py-10">
                  <Megaphone className="w-10 h-10 text-[var(--text-muted)] mx-auto mb-3 opacity-25" />
                  <p className="text-sm font-semibold text-[var(--text-heading)]">No campaigns yet</p>
                  <p className="text-xs text-[var(--text-muted)] mt-1">Your campaigns will appear here once created.</p>
                  <Link href="/campaigns" className="zs-btn-primary mt-4 mx-auto inline-flex">
                    <Plus className="w-3.5 h-3.5" />
                    Create Campaign
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentCampaigns.slice(0, 5).map((c: any) => (
                    <div key={c.id} className="flex gap-3 p-3 rounded-xl hover:bg-[var(--bg-surface)] transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center flex-shrink-0 mt-0.5">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[var(--text-primary)]">{c.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[10px] text-[var(--text-muted)]">{c.sentCount || 0} sent</span>
                          <span className={`zs-badge text-[9px] px-2 py-0.5 ${
                            c.status === 'completed' ? 'zs-badge-success' :
                            c.status === 'running' ? 'zs-badge-info' :
                            'zs-badge-warning'
                          }`}>
                            {c.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="zs-card p-5 animate-fade-in-up delay-400">
            <h3 className="text-sm font-bold text-[var(--text-heading)] mb-4 flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'SMS Campaign', icon: Send, href: '/campaigns', color: 'hover:bg-indigo-50 hover:border-indigo-200 hover:text-indigo-700' },
                { label: 'WhatsApp Blast', icon: MessageSquare, href: '/whatsapp', color: 'hover:bg-green-50 hover:border-green-200 hover:text-green-700' },
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

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadStats}
      />
    </div>
  );
}
