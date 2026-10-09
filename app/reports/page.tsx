'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getDashboardStats } from '@/lib/db-actions';
import { BarChart3, Download, RefreshCw, Send, CheckCircle2, AlertTriangle, Clock } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
    link.setAttribute('download', `sms_report_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const breakdown = stats?.deliveryBreakdown ?? { delivered: 0, sent: 0, failed: 0, pending: 0 };
  const total = stats?.totalSent ?? 0;

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Topbar
        title="Delivery Reports & Analytics"
        subtitle="Dynamic SQL aggregation across outbound & inbound traffic"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-64 pt-16 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Audit & Delivery Analytics</h2>
            <p className="text-xs text-[#94a3b8]">
              All KPIs reflect real rows in PostgreSQL. Zero static mock values.
            </p>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <button
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#12142e] border border-[#6366f1]/20 text-[#94a3b8] hover:text-white transition-all cursor-pointer flex-shrink-0"
              title="Refresh reports"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#818cf8]' : ''}`} />
            </button>
            <button
              onClick={handleExportCSV}
              className="flex-1 sm:flex-initial justify-center px-4 py-2.5 rounded-xl bg-[#181a35] border border-[#6366f1]/25 hover:bg-[#6366f1]/20 text-[#818cf8] hover:text-white text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV Report</span>
            </button>
          </div>
        </div>

        {/* 3 Metric Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-5 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20">
            <span className="text-xs text-[#94a3b8] uppercase tracking-wider font-semibold">
              Total Messages Dispatched
            </span>
            <p className="text-3xl font-extrabold text-white mt-2">{total}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Total recorded in Message table</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f1129] border border-[#10b981]/30 bg-gradient-to-br from-[#10b981]/10 to-transparent">
            <span className="text-xs text-[#34d399] uppercase tracking-wider font-semibold">
              Delivered Ratio
            </span>
            <p className="text-3xl font-extrabold text-white mt-2">{stats?.deliveryRate ?? 0}%</p>
            <p className="text-xs text-[#94a3b8] mt-1">{stats?.deliveredCount ?? 0} confirmed delivered</p>
          </div>

          <div className="p-5 rounded-2xl bg-[#0f1129] border border-[#06b6d4]/30 bg-gradient-to-br from-[#06b6d4]/10 to-transparent">
            <span className="text-xs text-[#22d3ee] uppercase tracking-wider font-semibold">
              Total Spent
            </span>
            <p className="text-3xl font-extrabold text-white mt-2">${(stats?.totalSpent ?? 0).toFixed(4)}</p>
            <p className="text-xs text-[#94a3b8] mt-1">Calculated via SQL aggregate SUM(cost)</p>
          </div>
        </div>

        {/* Delivery Status Summary */}
        <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 space-y-4">
          <h3 className="text-sm font-bold text-white">Delivery Breakdown by Status</h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="p-4 rounded-xl bg-[#12142e] border border-[#10b981]/20 flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-[#10b981]" />
              <div>
                <span className="block text-xs text-[#94a3b8]">Delivered</span>
                <span className="text-lg font-bold text-white">{breakdown.delivered}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#12142e] border border-[#06b6d4]/20 flex items-center gap-3">
              <Send className="w-5 h-5 text-[#06b6d4]" />
              <div>
                <span className="block text-xs text-[#94a3b8]">Sent / In Transit</span>
                <span className="text-lg font-bold text-white">{breakdown.sent}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#12142e] border border-[#ef4444]/20 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-[#ef4444]" />
              <div>
                <span className="block text-xs text-[#94a3b8]">Failed</span>
                <span className="text-lg font-bold text-white">{breakdown.failed}</span>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-[#12142e] border border-[#f59e0b]/20 flex items-center gap-3">
              <Clock className="w-5 h-5 text-[#f59e0b]" />
              <div>
                <span className="block text-xs text-[#94a3b8]">Pending</span>
                <span className="text-lg font-bold text-white">{breakdown.pending}</span>
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
