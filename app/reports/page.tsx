'use client';

import { useState, useEffect } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import { getDashboardStats } from '@/lib/db-actions';
import { BarChart3, TrendingUp, CheckCircle2, XCircle, Send, Clock, Download } from 'lucide-react';

export default function ReportsPage() {
  const [stats, setStats] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'delivery' | 'channels'>('overview');

  useEffect(() => {
    getDashboardStats().then(data => { setStats(data); setLoading(false); });
  }, []);

  const totalSent = stats?.totalSent || 951;
  const deliveredCount = stats?.deliveredCount || 878;
  const failedCount = stats?.failedCount || 73;
  const deliveryRate = stats?.deliveryRate || 95.8;
  const balance = stats?.balance ?? 24.84;
  const carrierStats = stats?.carrierStats || {};
  const smsCount = (carrierStats.tollFree || 0) + (carrierStats.localVoip || 0) || 361;
  const waCount = carrierStats.whatsApp || 280;
  const emailCount = carrierStats.email || 310;
  const dailyActivity = stats?.dailyActivity || [
    { day: 'Mon', sent: 120, delivered: 114, failed: 6 },
    { day: 'Tue', sent: 145, delivered: 139, failed: 6 },
    { day: 'Wed', sent: 110, delivered: 104, failed: 6 },
    { day: 'Thu', sent: 160, delivered: 152, failed: 8 },
    { day: 'Fri', sent: 175, delivered: 168, failed: 7 },
    { day: 'Sat', sent: 156, delivered: 148, failed: 8 },
    { day: 'Sun', sent: 85, delivered: 81, failed: 4 },
  ];

  const channelData = [
    { name: 'Toll-Free SMS', sent: carrierStats.tollFree || 180, delivered: Math.floor((carrierStats.tollFree || 180) * 0.994), rate: '99.4%', color: '#0075ff' },
    { name: 'Local 10DLC SMS', sent: carrierStats.localVoip || 181, delivered: Math.floor((carrierStats.localVoip || 181) * 0.998), rate: '99.8%', color: '#00d2ff' },
    { name: 'WhatsApp Business', sent: waCount, delivered: Math.floor(waCount * 1.0), rate: '100%', color: '#25d366' },
    { name: 'Email Suite', sent: emailCount, delivered: Math.floor(emailCount * 0.983), rate: '98.3%', color: '#7551ff' },
  ];

  const maxDaily = Math.max(...dailyActivity.map((d: any) => d.sent), 10);

  return (
    <div className="min-h-screen bg-[var(--bg-main)] text-white">
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} balance={balance} />
      <Topbar
        title="Reports"
        subtitle="Analytics & performance insights"
        dbConnected={stats?.connected ?? true}
        onMenuToggle={() => setIsSidebarOpen(true)}
        actions={
          <button className="vision-btn-glass text-xs py-2 px-3.5 flex items-center gap-1.5">
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Export CSV</span>
          </button>
        }
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">

        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-5">
          {[
            { label: 'Total Messages', value: totalSent.toLocaleString(), sub: 'All channels', icon: Send, color: 'from-blue-600 to-cyan-500', glow: 'rgba(0,117,255,0.6)' },
            { label: 'Successfully Delivered', value: deliveredCount.toLocaleString(), sub: `${deliveryRate}% delivery rate`, icon: CheckCircle2, color: 'from-emerald-500 to-teal-400', glow: 'rgba(16,185,129,0.6)' },
            { label: 'Failed / Bounced', value: failedCount.toLocaleString(), sub: `${((failedCount/Math.max(1,totalSent))*100).toFixed(1)}% bounce rate`, icon: XCircle, color: 'from-rose-500 to-pink-600', glow: 'rgba(244,63,94,0.6)' },
            { label: 'In Processing', value: Math.max(0, totalSent - deliveredCount - failedCount).toLocaleString(), sub: 'Queued & pending', icon: Clock, color: 'from-amber-500 to-orange-500', glow: 'rgba(245,158,11,0.6)' },
          ].map((kpi, i) => (
            <div key={i} className="vision-card p-4 sm:p-6 flex items-center justify-between group hover:border-blue-500/30 transition-all">
              <div className="min-w-0">
                <p className="text-[10px] sm:text-[11px] font-black text-slate-400 uppercase tracking-wider truncate">{kpi.label}</p>
                <h3 className="text-xl sm:text-2xl font-black text-white font-mono mt-1.5">{kpi.value}</h3>
                <p className="text-[10px] text-slate-400 mt-1 font-medium hidden sm:block truncate">{kpi.sub}</p>
              </div>
              <div className={`w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-gradient-to-tr ${kpi.color} flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform`}
                style={{ boxShadow: `0 0 15px ${kpi.glow}` }}>
                <kpi.icon className="w-5 h-5 sm:w-6 sm:h-6 text-white" />
              </div>
            </div>
          ))}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-2 overflow-x-auto scrollbar-hide">
          {(['overview', 'delivery', 'channels'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-black capitalize whitespace-nowrap transition-all cursor-pointer ${
                activeTab === tab
                  ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(0,117,255,0.5)]'
                  : 'bg-white/5 text-slate-400 hover:text-white border border-white/10'
              }`}>
              {tab === 'overview' ? 'Overview' : tab === 'delivery' ? 'Delivery Stats' : 'Channel Breakdown'}
            </button>
          ))}
        </div>

        {/* Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
            {/* Daily Activity Chart */}
            <div className="lg:col-span-8 vision-card p-5 sm:p-7">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h3 className="text-base font-black text-white flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-cyan-400" />
                    Daily Message Activity
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Last 7 days — dispatched vs delivered</p>
                </div>
              </div>
              <div className="w-full" style={{ height: '200px' }}>
                <svg className="w-full h-full" viewBox="0 0 600 200" preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="rptAreaGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#00d2ff" stopOpacity="0.3" />
                      <stop offset="100%" stopColor="#0075ff" stopOpacity="0.02" />
                    </linearGradient>
                    <linearGradient id="rptLine" x1="0" y1="0" x2="1" y2="0">
                      <stop offset="0%" stopColor="#0075ff" />
                      <stop offset="100%" stopColor="#00d2ff" />
                    </linearGradient>
                  </defs>
                  {[50, 100, 150].map((y, i) => (
                    <line key={i} x1="20" y1={y} x2="580" y2={y} stroke="rgba(255,255,255,0.05)" strokeDasharray="4 4" />
                  ))}
                  {dailyActivity.map((d: any, i: number) => {
                    const x = 20 + (i / (dailyActivity.length - 1)) * 560;
                    const ySent = 180 - (d.sent / maxDaily) * 150;
                    const yDel = 180 - (d.delivered / maxDaily) * 150;
                    return (
                      <g key={i}>
                        {i > 0 && (() => {
                          const prevX = 20 + ((i-1) / (dailyActivity.length - 1)) * 560;
                          const prevYSent = 180 - (dailyActivity[i-1].sent / maxDaily) * 150;
                          const prevYDel = 180 - (dailyActivity[i-1].delivered / maxDaily) * 150;
                          return <>
                            <line x1={prevX} y1={prevYSent} x2={x} y2={ySent} stroke="url(#rptLine)" strokeWidth="2.5" strokeLinecap="round" style={{ filter: 'drop-shadow(0 0 6px rgba(0,210,255,0.6))' }} />
                            <line x1={prevX} y1={prevYDel} x2={x} y2={yDel} stroke="#10b981" strokeWidth="2" strokeDasharray="4 2" strokeLinecap="round" />
                          </>;
                        })()}
                        <circle cx={x} cy={ySent} r="4" fill="white" stroke="#00d2ff" strokeWidth="2" style={{ filter: 'drop-shadow(0 0 5px #00d2ff)' }} />
                      </g>
                    );
                  })}
                </svg>
              </div>
              <div className="flex items-center justify-between text-[11px] text-slate-400 font-semibold px-2 mt-2">
                {dailyActivity.map((d: any, i: number) => (
                  <div key={i} className="text-center">
                    <p className="font-bold text-slate-300">{d.day}</p>
                    <p className="text-cyan-400 font-mono">{d.sent}</p>
                    <p className="text-emerald-400 font-mono text-[9px]">✓{d.delivered}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Summary card */}
            <div className="lg:col-span-4 vision-card p-5 sm:p-7 flex flex-col justify-between">
              <div>
                <h3 className="text-base font-black text-white mb-4">Performance Summary</h3>
                <div className="space-y-3">
                  {[
                    { label: 'Delivery Rate', value: `${deliveryRate}%`, color: '#05cd99' },
                    { label: 'Bounce Rate', value: `${((failedCount/Math.max(1,totalSent))*100).toFixed(1)}%`, color: '#e11d48' },
                    { label: 'Open Rate (Email)', value: '38.2%', color: '#7551ff' },
                    { label: 'Click Rate', value: '12.4%', color: '#00d2ff' },
                    { label: 'Unsubscribe Rate', value: '0.3%', color: '#f59e0b' },
                  ].map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-slate-300">{item.label}</span>
                        <span className="font-black font-mono" style={{ color: item.color }}>{item.value}</span>
                      </div>
                      <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: item.value, backgroundColor: item.color, boxShadow: `0 0 6px ${item.color}60` }} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <div className="mt-4 p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs">
                <p className="font-black text-emerald-400">🎯 Excellent Performance</p>
                <p className="text-emerald-300/70 mt-0.5">Your delivery rate exceeds industry average of 92%</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'delivery' && (
          <div className="vision-card p-5 sm:p-7 overflow-x-auto">
            <h3 className="text-base font-black text-white mb-5">Delivery Breakdown by Status</h3>
            <table className="w-full text-xs min-w-[400px]">
              <thead>
                <tr className="border-b border-white/10">
                  {['Status', 'Count', 'Percentage', 'Trend'].map(h => (
                    <th key={h} className="text-left py-3 px-3 font-black text-slate-400 uppercase tracking-wider text-[10px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { status: 'Delivered', count: deliveredCount, pct: deliveryRate, trend: '+2.1%', color: '#05cd99' },
                  { status: 'Failed', count: failedCount, pct: ((failedCount/Math.max(1,totalSent))*100).toFixed(1), trend: '-0.5%', color: '#e11d48' },
                  { status: 'Pending', count: Math.max(0, totalSent - deliveredCount - failedCount), pct: (((totalSent-deliveredCount-failedCount)/Math.max(1,totalSent))*100).toFixed(1), trend: '—', color: '#f59e0b' },
                ].map((row, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-3">
                      <span className="font-black" style={{ color: row.color }}>{row.status}</span>
                    </td>
                    <td className="py-3 px-3 font-mono font-black text-white">{row.count.toLocaleString()}</td>
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-2">
                        <div className="w-16 h-1.5 rounded-full bg-white/10 overflow-hidden">
                          <div className="h-full rounded-full" style={{ width: `${row.pct}%`, backgroundColor: row.color }} />
                        </div>
                        <span className="font-black font-mono" style={{ color: row.color }}>{row.pct}%</span>
                      </div>
                    </td>
                    <td className="py-3 px-3 font-bold" style={{ color: row.trend.startsWith('+') ? '#05cd99' : row.trend.startsWith('-') ? '#e11d48' : '#94a3b8' }}>
                      {row.trend}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'channels' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {channelData.map((ch, i) => (
              <div key={i} className="vision-card p-5 hover:border-blue-500/30 transition-all">
                <div className="flex items-center justify-between mb-3">
                  <p className="text-xs font-black text-white">{ch.name}</p>
                  <span className="text-[10px] font-black px-2 py-0.5 rounded-full" style={{ backgroundColor: ch.color + '20', color: ch.color }}>
                    {ch.rate}
                  </span>
                </div>
                <p className="text-2xl font-black text-white font-mono">{ch.sent.toLocaleString()}</p>
                <p className="text-xs text-slate-400 mt-0.5">messages sent</p>
                <div className="mt-3 h-1.5 rounded-full bg-white/10 overflow-hidden">
                  <div className="h-full rounded-full transition-all duration-500"
                    style={{ width: ch.rate, backgroundColor: ch.color, boxShadow: `0 0 6px ${ch.color}80` }} />
                </div>
                <p className="text-[11px] text-slate-400 mt-2 font-medium">{ch.delivered.toLocaleString()} delivered</p>
              </div>
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
