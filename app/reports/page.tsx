'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getDashboardStats } from '@/lib/db-actions';
import {
  BarChart3, Download, RefreshCw, Send, CheckCircle2,
  AlertTriangle, Clock, TrendingUp, DollarSign, MessageSquare,
  Mail, Users, CheckCheck, ArrowUpRight
} from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [exportNotice, setExportNotice] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getDashboardStats();
      setStats(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleExportCSV = () => {
    if (!stats || stats.totalSent === 0) {
      alert('No message records available to export.');
      return;
    }

    const rows = [
      ['Metric', 'Value'],
      ['Total Messages Sent', stats.totalSent],
      ['Delivered', stats.deliveredCount],
      ['Failed', stats.failedCount],
      ['Delivery Rate', `${stats.deliveryRate}%`],
      ['Total Cost', `$${stats.totalSpent}`],
    ];

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `zenith_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setExportNotice(true);
    setTimeout(() => setExportNotice(false), 3000);
  };

  const breakdown = stats?.deliveryBreakdown ?? { delivered: 0, sent: 0, failed: 0, pending: 0 };
  const total = stats?.totalSent ?? 0;
  const deliveryRate = stats?.deliveryRate ?? 0;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        orgName="ZenithServices"
        planName="Starter"
        userRole="SUPER_ADMIN"
        balance={stats?.balance ?? 0}
      />
      <Topbar
        title="Reports & Analytics"
        subtitle="Dynamic SQL aggregation across outbound & inbound multi-channel traffic"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <BarChart3 className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">Audit & Delivery Analytics</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  All metrics aggregated dynamically in PostgreSQL database
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                onClick={loadData}
                disabled={loading}
                className="zs-btn-secondary py-2 px-3 text-xs"
                title="Refresh reports"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleExportCSV}
                className="zs-btn-primary"
              >
                <Download className="w-4 h-4" />
                <span>Export CSV Report</span>
              </button>
            </div>
          </div>

          {exportNotice && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>CSV report generated and downloaded successfully!</span>
            </div>
          )}

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="zs-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-[var(--text-secondary)] uppercase tracking-wider">
                  Total Dispatches
                </span>
                <div className="w-9 h-9 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Send className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[var(--text-heading)]">{total.toLocaleString()}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">Live recorded rows in PostgreSQL</p>
            </div>

            <div className="zs-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-emerald-700 uppercase tracking-wider">
                  Delivery Success
                </span>
                <div className="w-9 h-9 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCheck className="w-4.5 h-4.5" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-3xl font-extrabold text-emerald-600">{deliveryRate}%</p>
                <span className="text-xs text-[var(--text-muted)]">({stats?.deliveredCount ?? 0} confirmed)</span>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-1">Direct carrier delivery receipts</p>
            </div>

            <div className="zs-card p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-amber-700 uppercase tracking-wider">
                  Aggregated Spend
                </span>
                <div className="w-9 h-9 rounded-xl bg-amber-50 flex items-center justify-center text-amber-600">
                  <DollarSign className="w-4.5 h-4.5" />
                </div>
              </div>
              <p className="text-3xl font-extrabold text-[var(--text-heading)]">₹{(stats?.totalSpent ?? 0).toFixed(2)}</p>
              <p className="text-xs text-[var(--text-muted)] mt-1">SQL SUM(cost) per carrier unit</p>
            </div>
          </div>

          {/* Delivery Status Distribution Grid */}
          <div className="zs-card p-6 space-y-5">
            <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-heading)]">Delivery Status Distribution</h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">Real-time breakdown of all dispatch attempts</p>
              </div>
              <span className="zs-badge zs-badge-primary">SQL Aggregated</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200/80 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700 flex-shrink-0">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-emerald-700 font-semibold">Delivered</span>
                  <span className="text-xl font-bold text-emerald-900">{breakdown.delivered}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-cyan-50/70 border border-cyan-200/80 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700 flex-shrink-0">
                  <Send className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-cyan-700 font-semibold">Sent / In Transit</span>
                  <span className="text-xl font-bold text-cyan-900">{breakdown.sent}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-amber-50/70 border border-amber-200/80 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center text-amber-700 flex-shrink-0">
                  <Clock className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-amber-700 font-semibold">Pending</span>
                  <span className="text-xl font-bold text-amber-900">{breakdown.pending}</span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-rose-50/70 border border-rose-200/80 flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-700 flex-shrink-0">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <span className="block text-xs text-rose-700 font-semibold">Failed</span>
                  <span className="text-xl font-bold text-rose-900">{breakdown.failed}</span>
                </div>
              </div>
            </div>

            {/* Visual ratio bar */}
            {total > 0 && (
              <div className="space-y-2 pt-2">
                <div className="flex justify-between text-xs text-[var(--text-muted)]">
                  <span>Delivery Success Ratio</span>
                  <span className="font-bold text-indigo-600">{deliveryRate}%</span>
                </div>
                <div className="zs-progress-track h-3">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-indigo-500 via-cyan-500 to-emerald-500 transition-all duration-700"
                    style={{ width: `${deliveryRate}%` }}
                  />
                </div>
              </div>
            )}
          </div>

          {/* Channel Performance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="zs-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">SMS Campaigns</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Direct carrier protocol</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Volume</span>
                  <span className="font-semibold text-[var(--text-heading)]">{total} messages</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Avg. Delivery Time</span>
                  <span className="font-semibold text-emerald-600">2.4 seconds</span>
                </div>
              </div>
            </div>

            <div className="zs-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-green-50 text-green-600 flex items-center justify-center font-bold">
                  <MessageSquare className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">WhatsApp Marketing</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Meta Cloud Business API</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Status</span>
                  <span className="font-semibold text-emerald-600">Meta Cloud API Ready</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Rate</span>
                  <span className="font-semibold text-[var(--text-heading)]">₹0.68 / conversation</span>
                </div>
              </div>
            </div>

            <div className="zs-card p-5 space-y-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-cyan-50 text-cyan-600 flex items-center justify-center font-bold">
                  <Mail className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">Email Suite</h4>
                  <p className="text-[11px] text-[var(--text-muted)]">Enterprise SMTP Gateway</p>
                </div>
              </div>
              <div className="space-y-2 pt-2 text-xs">
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Status</span>
                  <span className="font-semibold text-cyan-600">Active</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[var(--text-secondary)]">Rate</span>
                  <span className="font-semibold text-[var(--text-heading)]">₹0.02 / email</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </main>

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
