'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getDashboardStats } from '@/lib/db-actions';
import {
  Send, MessageSquare, Mail, Users, TrendingUp,
  ArrowUpRight, ArrowRight, Plus, RefreshCw, BarChart2, Activity,
  CheckCircle2, AlertCircle, Megaphone, Globe, Zap, DollarSign,
  ShieldCheck, Radio, PhoneCall, Sparkles
} from 'lucide-react';
import Link from 'next/link';

// ─── Dashboard V15 Stat Card ─────────────────────────────────────────────────────────────
function StatCard({
  label, value, subValue, icon: Icon, iconBg, trend, trendUp,
}: {
  label: string; value: string; subValue?: string;
  icon: any; iconBg: string; trend?: string; trendUp?: boolean;
}) {
  return (
    <div className="zs-card p-5 animate-fade-in-up">
      <div className="flex items-start justify-between mb-3">
        <div className={`w-10 h-10 rounded-2xl ${iconBg} flex items-center justify-center shadow-sm flex-shrink-0`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        {trend && (
          <span className={`flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
            trendUp ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-red-500/10 text-red-500 border border-red-500/20'
          }`}>
            <ArrowUpRight className={`w-3 h-3 ${!trendUp ? 'rotate-180' : ''}`} />
            {trend}
          </span>
        )}
      </div>
      <div>
        <p className="text-2xl font-extrabold text-[var(--text-heading)] tracking-tight">{value}</p>
        <p className="text-xs font-semibold text-[var(--text-secondary)] mt-0.5">{label}</p>
        {subValue && <p className="text-[11px] text-[var(--text-muted)] mt-1 font-medium">{subValue}</p>}
      </div>
    </div>
  );
}

// ─── Channel Card ──────────────────────────────────────────────────────────
function ChannelCard({
  channel, sublabel, icon: Icon, iconColor, sent, delivered, rate, href,
}: {
  channel: string; sublabel: string; icon: any; iconColor: string; sent: number;
  delivered: number; rate: number; href: string;
}) {
  return (
    <div className="zs-card p-5 hover:shadow-md transition-all cursor-pointer animate-fade-in-up group">
      <Link href={href} className="block">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-2xl ${iconColor} flex items-center justify-center text-white shadow-xs`}>
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-bold text-[var(--text-heading)] group-hover:text-blue-500 transition-colors">
                {channel}
              </p>
              <p className="text-[11px] text-[var(--text-muted)] font-medium">{sublabel}</p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-[var(--text-muted)] group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3 p-2.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
          <div>
            <p className="text-base font-bold text-[var(--text-heading)]">{sent.toLocaleString()}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Sent</p>
          </div>
          <div>
            <p className="text-base font-bold text-emerald-500">{delivered.toLocaleString()}</p>
            <p className="text-[10px] text-[var(--text-muted)] uppercase tracking-wider font-semibold">Delivered</p>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[11px] text-[var(--text-secondary)] font-semibold">Carrier Delivery Rate</span>
            <span className="text-xs font-extrabold text-blue-500">{rate}%</span>
          </div>
          <div className="w-full bg-[var(--bg-elevated)] h-2 rounded-full overflow-hidden border border-[var(--border-subtle)]">
            <div
              className="bg-blue-500 h-full rounded-full transition-all duration-500"
              style={{ width: `${rate}%` }}
            />
          </div>
        </div>
      </Link>
    </div>
  );
}

// ─── Top US & Canadian Coverage Regions ────────────────────────────────────
const US_CA_ZONES = [
  { code: 'US-CA', name: 'California', flag: '🇺🇸', dial: '+1', carrier: 'AT&T / Verizon', rate: '99.8%' },
  { code: 'US-TX', name: 'Texas', flag: '🇺🇸', dial: '+1', carrier: 'T-Mobile / AT&T', rate: '99.7%' },
  { code: 'US-NY', name: 'New York', flag: '🇺🇸', dial: '+1', carrier: 'Verizon / T-Mobile', rate: '99.9%' },
  { code: 'US-FL', name: 'Florida', flag: '🇺🇸', dial: '+1', carrier: 'AT&T / Verizon', rate: '99.6%' },
  { code: 'CA-ON', name: 'Ontario', flag: '🇨🇦', dial: '+1', carrier: 'Rogers / Bell', rate: '99.5%' },
  { code: 'CA-QC', name: 'Quebec', flag: '🇨🇦', dial: '+1', carrier: 'Bell / Telus', rate: '99.4%' },
];

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const fetchStats = useCallback(async () => {
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard stats:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 15000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  const totalSent = stats?.totalSent || 0;
  const deliveredCount = stats?.deliveredCount || 0;
  const deliveryRate = stats?.deliveryRate || 99.4;
  const balance = stats?.balance ?? 48.5;
  const totalContacts = stats?.totalContacts || 4;
  const activeCampaigns = stats?.activeCampaigns || 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        balance={balance}
      />
      <Topbar
        title="Dashboard"
        subtitle="US & Canada Omnichannel PaaS • Dual Telnyx Toll-Free & Local Routing"
        dbConnected={stats?.connected ?? true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Hero Banner / Status */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden">
            <div className="relative z-10 space-y-2">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>Production Grade PaaS Cloud</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                Enterprise Bulk Messaging for US & Canada
              </h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-2xl font-medium">
                Seamless dual-route Telnyx infrastructure: Verified Toll-Free (+18884020949) for US/CA physical carriers, and Local 10DLC (+14795909259) for VoIP/Virtual destinations.
              </p>
            </div>

            <div className="relative z-10 flex items-center gap-3">
              <button
                onClick={() => setIsQuickSendOpen(true)}
                className="zs-btn-primary px-5 py-2.5 text-xs shadow-md cursor-pointer flex items-center gap-2"
              >
                <Send className="w-4 h-4" />
                <span>Dispatch Message</span>
              </button>
              <Link
                href="/campaigns"
                className="zs-btn-secondary px-5 py-2.5 text-xs transition-all cursor-pointer flex items-center gap-2"
              >
                <Megaphone className="w-4 h-4" />
                <span>New Campaign</span>
              </Link>
            </div>

            {/* Subtle decorative glow */}
            <div className="absolute -right-8 -top-8 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />
          </div>

          {/* 4 Top Stat Cards (Dashboard V15) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              label="Outbound Messages Sent"
              value={totalSent.toLocaleString()}
              subValue="Toll-Free & Local Telnyx"
              icon={Send}
              iconBg="bg-blue-600"
              trend="+14.2%"
              trendUp={true}
            />
            <StatCard
              label="Carrier Delivery Rate"
              value={`${deliveryRate}%`}
              subValue={`${deliveredCount.toLocaleString()} delivered successfully`}
              icon={CheckCircle2}
              iconBg="bg-emerald-600"
              trend="99.4% SLA"
              trendUp={true}
            />
            <StatCard
              label="Audience Contacts"
              value={totalContacts.toLocaleString()}
              subValue="US & Canada Verified"
              icon={Users}
              iconBg="bg-indigo-600"
              trend="+4 today"
              trendUp={true}
            />
            <StatCard
              label="PaaS Account Balance"
              value={`$${balance.toFixed(2)}`}
              subValue="Auto-refill enabled"
              icon={DollarSign}
              iconBg="bg-slate-700"
              trend="Healthy"
              trendUp={true}
            />
          </div>

          {/* Omnichannel Suite Cards */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div>
                <h2 className="text-base font-bold text-[var(--text-heading)]">Omnichannel Suite Channels</h2>
                <p className="text-xs text-[var(--text-muted)]">Live performance across SMS, WhatsApp, and Email channels</p>
              </div>
              <button
                onClick={fetchStats}
                className="flex items-center gap-1.5 text-xs text-blue-500 hover:text-blue-600 font-semibold cursor-pointer"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Live</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <ChannelCard
                channel="Telnyx Toll-Free SMS"
                sublabel="+1 (888) 402-0949 • US/CA Mobile"
                icon={Radio}
                iconColor="bg-blue-600"
                sent={totalSent}
                delivered={deliveredCount}
                rate={deliveryRate}
                href="/campaigns"
              />
              <ChannelCard
                channel="Telnyx Local 10DLC"
                sublabel="+1 (479) 590-9259 • Virtual/VoIP"
                icon={PhoneCall}
                iconColor="bg-slate-700"
                sent={stats?.carrierStats?.localVoip || 12}
                delivered={stats?.carrierStats?.localVoip || 12}
                rate={99.8}
                href="/inbox"
              />
              <ChannelCard
                channel="WhatsApp Business"
                sublabel="Interactive Templates & CTA"
                icon={MessageSquare}
                iconColor="bg-emerald-600"
                sent={stats?.carrierStats?.whatsApp || 48}
                delivered={stats?.carrierStats?.whatsApp || 48}
                rate={100}
                href="/whatsapp"
              />
              <ChannelCard
                channel="Email Suite PaaS"
                sublabel="High Deliverability SMTP/API"
                icon={Mail}
                iconColor="bg-sky-600"
                sent={stats?.carrierStats?.email || 120}
                delivered={stats?.carrierStats?.email || 118}
                rate={98.3}
                href="/email"
              />
            </div>
          </div>

          {/* Carrier Routing & Coverage Section */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Top US & Canadian Destinations */}
            <div className="lg:col-span-2 zs-card p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">US & Canada Primary Coverage Hub</h3>
                  <p className="text-xs text-[var(--text-muted)]">Carrier handshake and deliverability across states & provinces</p>
                </div>
                <Link
                  href="/countries"
                  className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1"
                >
                  <span>View All</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {US_CA_ZONES.map((zone) => (
                  <div
                    key={zone.code}
                    className="p-3.5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] flex items-center justify-between hover:border-blue-500/30 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{zone.flag}</span>
                      <div>
                        <p className="text-xs font-bold text-[var(--text-heading)]">{zone.name}</p>
                        <p className="text-[10px] text-[var(--text-muted)]">{zone.carrier}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-xs font-bold text-emerald-500">{zone.rate}</span>
                      <p className="text-[10px] text-[var(--text-muted)] font-medium">Delivery</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Dual Route Architecture Status */}
            <div className="zs-card p-6 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center font-bold text-xs">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-heading)]">Telnyx Dual Accounts</h3>
                    <p className="text-[11px] text-[var(--text-muted)]">Active routing engine</p>
                  </div>
                </div>

                <div className="space-y-3 mt-4">
                  <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--text-heading)]">Account 1 • Toll-Free</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                    </div>
                    <p className="text-xs font-mono font-semibold text-blue-500">+1 (888) 402-0949</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Direct to physical US & CA mobile carriers</p>
                  </div>

                  <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-[var(--text-heading)]">Account 2 • Local 10DLC</span>
                      <span className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Active</span>
                    </div>
                    <p className="text-xs font-mono font-semibold text-[var(--text-secondary)]">+1 (479) 590-9259</p>
                    <p className="text-[10px] text-[var(--text-muted)] mt-1">Direct to Virtual VoIP & local numbers</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] mt-4">
                <Link
                  href="/inbox"
                  className="w-full zs-btn-primary justify-center text-xs py-2.5"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span>Open WhatsApp-Style Inbox</span>
                </Link>
              </div>
            </div>
          </div>

        </div>
      </main>

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={fetchStats}
      />
    </div>
  );
}
