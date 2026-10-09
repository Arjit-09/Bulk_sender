'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import StatCard from '@/components/StatCard';
import DynamicVolumeChart from '@/components/DynamicVolumeChart';
import DynamicDeliveryGauge from '@/components/DynamicDeliveryGauge';
import QuickSendModal from '@/components/QuickSendModal';
import { getDashboardStats } from '@/lib/db-actions';
import { Send, CheckCircle2, TrendingUp, Users, Megaphone, Plus, RefreshCw, AlertCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function DashboardPage() {
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const loadStats = useCallback(async () => {
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
    loadStats();
  }, [loadStats]);

  const totalSent = stats?.totalSent ?? 0;
  const deliveredCount = stats?.deliveredCount ?? 0;
  const deliveryRate = stats?.deliveryRate ?? 0;
  const totalContacts = stats?.totalContacts ?? 0;
  const balance = stats?.balance ?? 25.0;
  const isConnected = stats?.connected ?? false;
  const recentCampaigns = stats?.recentCampaigns ?? [];
  const dailyActivity = stats?.dailyActivity ?? [];
  const deliveryBreakdown = stats?.deliveryBreakdown ?? {
    delivered: 0,
    sent: 0,
    failed: 0,
    pending: 0,
  };

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar
        balance={balance}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Topbar
        title="Dashboard & Analytics Overview"
        subtitle="Live PostgreSQL metrics • 100% Dynamic data"
        dbConnected={isConnected}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      {/* Main Content Area */}
      <main className="lg:ml-64 pt-16 p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Connection Notice if PostgreSQL credentials not yet configured */}
        {!isConnected && (
          <div className="p-4 rounded-2xl bg-[#f59e0b]/10 border border-[#f59e0b]/30 flex flex-col sm:flex-row sm:items-start justify-between gap-4">
            <div className="flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-[#f59e0b] mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-bold text-white">PostgreSQL Configuration Needed</h4>
                <p className="text-xs text-[#94a3b8] mt-1">
                  Database authentication is required for user <code className="text-[#fbbf24]">arjit</code> on localhost:5432. 
                  Set your PostgreSQL password in <code className="text-[#818cf8]">.env</code> or visit Settings to verify your connection string.
                </p>
              </div>
            </div>
            <Link
              href="/settings"
              className="px-3.5 py-1.5 rounded-xl bg-[#f59e0b]/20 hover:bg-[#f59e0b]/30 text-[#fbbf24] text-xs font-semibold whitespace-nowrap transition-colors self-start sm:self-auto"
            >
              Configure DB &rarr;
            </Link>
          </div>
        )}

        {/* Header Actions */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">System Performance</h2>
            <p className="text-xs text-[#94a3b8]">
              All KPIs, charts, and metrics change dynamically with database row updates.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={loadStats}
              disabled={loading}
              className="p-2.5 rounded-xl bg-[#12142e] border border-[#6366f1]/20 text-[#94a3b8] hover:text-white hover:bg-[#181a35] transition-all cursor-pointer"
              title="Refresh live metrics"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#818cf8]' : ''}`} />
            </button>
            <button
              onClick={() => setIsQuickSendOpen(true)}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Send className="w-3.5 h-3.5" />
              <span>Send Message</span>
            </button>
          </div>
        </div>

        {/* Top 4 Dynamic KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            label="Total Messages Sent"
            value={totalSent.toLocaleString()}
            subValue={totalSent === 0 ? 'No outbound messages yet' : `${totalSent} logged in database`}
            icon={Send}
            color="primary"
          />
          <StatCard
            label="Delivered SMS"
            value={deliveredCount.toLocaleString()}
            subValue={totalSent > 0 ? `${deliveryRate}% success rate` : 'Awaiting dispatch'}
            icon={CheckCircle2}
            color="success"
          />
          <StatCard
            label="Delivery Success Rate"
            value={`${deliveryRate}%`}
            subValue={totalSent > 0 ? 'Dynamic SQL aggregation' : '0.0% initial baseline'}
            icon={TrendingUp}
            color="info"
          />
          <StatCard
            label="Active Contacts"
            value={totalContacts.toLocaleString()}
            subValue={totalContacts === 0 ? '0 contacts in directory' : 'Validated recipients'}
            icon={Users}
            color="warning"
          />
        </div>

        {/* Dynamic Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <DynamicVolumeChart data={dailyActivity} />
          </div>
          <div>
            <DynamicDeliveryGauge rate={deliveryRate} breakdown={deliveryBreakdown} />
          </div>
        </div>

        {/* Recent Campaigns Table */}
        <div className="p-4 sm:p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Megaphone className="w-4 h-4 text-[#818cf8]" />
                Recent Campaigns
              </h3>
              <p className="text-xs text-[#94a3b8]">Live status and progress across dispatch jobs</p>
            </div>
            <Link
              href="/campaigns"
              className="text-xs text-[#818cf8] hover:text-[#a5b4fc] flex items-center gap-1 font-medium"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {recentCampaigns.length === 0 ? (
            <div className="p-8 border border-dashed border-[#6366f1]/20 rounded-xl bg-[#12142e]/40 text-center flex flex-col items-center justify-center">
              <Megaphone className="w-8 h-8 text-[#94a3b8] mb-2 opacity-50" />
              <p className="text-sm font-medium text-white">No Campaigns Created Yet</p>
              <p className="text-xs text-[#94a3b8] max-w-sm mt-1 mb-4">
                Launch your first targeted bulk SMS campaign with variable placeholders and live delivery tracking.
              </p>
              <Link
                href="/campaigns"
                className="px-4 py-2 rounded-xl bg-[#6366f1]/20 hover:bg-[#6366f1]/30 border border-[#6366f1]/30 text-[#818cf8] text-xs font-semibold flex items-center gap-2 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create First Campaign</span>
              </Link>
            </div>
          ) : (
            <div className="overflow-x-auto -mx-4 sm:mx-0">
              <div className="min-w-[600px] px-4 sm:px-0">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#6366f1]/15 text-[#94a3b8] font-medium uppercase tracking-wider">
                      <th className="pb-3">Campaign Name</th>
                      <th className="pb-3">Target Group</th>
                      <th className="pb-3">Status</th>
                      <th className="pb-3 text-right">Sent</th>
                      <th className="pb-3 text-right">Delivered</th>
                      <th className="pb-3 text-right">Cost</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#6366f1]/10 text-white">
                    {recentCampaigns.map((camp: any) => (
                      <tr key={camp.id} className="hover:bg-[#181a35]/50 transition-colors">
                        <td className="py-3 font-semibold">{camp.name}</td>
                        <td className="py-3 text-[#94a3b8]">{camp.groupName}</td>
                        <td className="py-3">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase ${
                              camp.status === 'completed'
                                ? 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30'
                                : camp.status === 'running'
                                ? 'bg-[#06b6d4]/15 text-[#22d3ee] border border-[#06b6d4]/30 animate-pulse'
                                : 'bg-[#f59e0b]/15 text-[#fbbf24] border border-[#f59e0b]/30'
                            }`}
                          >
                            {camp.status}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium">{camp.sentCount}</td>
                        <td className="py-3 text-right font-medium text-[#10b981]">{camp.delivCount}</td>
                        <td className="py-3 text-right text-[#94a3b8]">${camp.cost.toFixed(4)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quick Send Modal */}
      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={() => {
          loadStats();
        }}
      />
    </div>
  );
}
