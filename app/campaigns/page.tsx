'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getCampaigns, createAndRunCampaign, deleteCampaign, getTemplates, getContactGroups } from '@/lib/db-actions';
import {
  Send, Plus, Play, Trash2, Users, FileText, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Sparkles, X, ChevronRight,
  TrendingUp, DollarSign, MessageSquare, Mail, Phone,
} from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Filter & Search states
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'running' | 'draft'>('all');
  const [channelFilter, setChannelFilter] = useState<'all' | 'sms' | 'whatsapp' | 'email'>('all');

  // Form states
  const [campaignName, setCampaignName] = useState('');
  const [targetGroup, setTargetGroup] = useState('All Contacts');
  const [channel, setChannel] = useState<'sms' | 'whatsapp' | 'email'>('sms');
  const [senderRoute, setSenderRoute] = useState<'toll_free' | 'local'>('toll_free');
  const [selectedTemplateId, setSelectedTemplateId] = useState('');
  const [customMsg, setCustomMsg] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [campList, tplList, grpList] = await Promise.all([
        getCampaigns(),
        getTemplates(),
        getContactGroups(),
      ]);
      setCampaigns(campList || []);
      setTemplates(tplList || []);
      setGroups(grpList || []);
    } catch (err) {
      console.error('Error loading campaigns:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName.trim()) return;
    setSubmitting(true);
    try {
      await createAndRunCampaign({
        name: campaignName.trim(),
        channel,
        senderRoute: channel === 'whatsapp' ? 'whatsapp' : channel === 'email' ? 'email' : senderRoute,
        groupName: targetGroup,
        templateId: selectedTemplateId || undefined,
        customMessage: customMsg || undefined,
      });
      setCampaignName('');
      setSelectedTemplateId('');
      setCustomMsg('');
      setIsCreateOpen(false);
      await loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to launch campaign. Please check settings.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await deleteCampaign(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch =
      c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status?.toLowerCase() === statusFilter;
    const matchChannel = channelFilter === 'all' || (c.channel || 'sms') === channelFilter;
    return matchSearch && matchStatus && matchChannel;
  });

  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivCount || 0), 0);
  const avgDeliveryRate = totalSent > 0 ? ((totalDelivered / totalSent) * 100).toFixed(1) : '99.4';

  return (
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Omnichannel Campaigns"
        subtitle="Schedule and monitor high-volume SMS, WhatsApp & Email broadcasts"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
        actions={
          <button
            onClick={() => setIsCreateOpen(true)}
            className="vision-btn-primary text-xs py-2 px-3.5 shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Campaign</span>
          </button>
        }
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">

        {/* Hero Card */}
        <div className="vision-hero-card p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-xs font-bold mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>High-Throughput Campaign Engine</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Campaign Operations Console
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Deploy target audience broadcasts via Telnyx Toll-Free (+1888) for US &amp; Canadian physical mobile, Local 10DLC (+1479) for VoIP/Virtual, or WhatsApp Suite.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={() => setIsCreateOpen(true)}
              className="vision-btn-primary text-xs py-2.5 px-4 w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Campaign</span>
            </button>
          </div>
        </div>

        {/* 4 KPIs */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="vision-card p-5">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Total Campaigns</p>
            <p className="text-2xl font-black text-white font-mono mt-1">{campaigns.length}</p>
            <span className="text-[10px] font-bold text-cyan-400">Omnichannel Active</span>
          </div>
          <div className="vision-card p-5">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Broadcasts Delivered</p>
            <p className="text-2xl font-black text-emerald-400 font-mono mt-1">{totalDelivered.toLocaleString()}</p>
            <span className="text-[10px] text-slate-400">US &amp; Canada Carriers</span>
          </div>
          <div className="vision-card p-5">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Aggregate SLA Rate</p>
            <p className="text-2xl font-black text-white font-mono mt-1">{avgDeliveryRate}%</p>
            <span className="text-[10px] font-bold text-emerald-400">Carrier Verified</span>
          </div>
          <div className="vision-card p-5">
            <p className="text-[11px] font-black text-slate-400 uppercase tracking-wider">Audience Segments</p>
            <p className="text-2xl font-black text-cyan-300 font-mono mt-1">{groups.length || 5}</p>
            <span className="text-[10px] text-slate-400">Contact Groups Target</span>
          </div>
        </div>

        {/* Campaigns Table Card */}
        <div className="vision-card overflow-hidden">
          {/* Filter Bar */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 sm:pb-0 no-scrollbar flex-nowrap w-full md:w-auto">
              {[
                { key: 'all', label: 'All Channels' },
                { key: 'sms', label: 'SMS (Telnyx)' },
                { key: 'whatsapp', label: 'WhatsApp' },
                { key: 'email', label: 'Email Suite' },
              ].map((f) => (
                <button
                  key={f.key}
                  onClick={() => setChannelFilter(f.key as any)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer flex-shrink-0 text-xs ${
                    channelFilter === f.key
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(0,117,255,0.6)]'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search campaigns..."
                className="vision-input text-xs"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          {/* Desktop Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="py-3.5 px-4">Campaign Name</th>
                  <th className="py-3.5 px-4">Channel &amp; Route</th>
                  <th className="py-3.5 px-4">Target Audience</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4">Delivery Stats</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {filteredCampaigns.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-400">
                      <p className="font-bold text-white">No campaigns found</p>
                      <p className="text-[11px] mt-0.5">Click &quot;Create New Campaign&quot; to launch your first dispatch.</p>
                    </td>
                  </tr>
                ) : (
                  filteredCampaigns.map((camp) => (
                    <tr key={camp.id} className="hover:bg-white/[0.02] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <p className="text-sm">{camp.name}</p>
                        <p className="text-[10px] text-slate-400 font-normal">
                          {new Date(camp.createdAt).toLocaleDateString()}
                        </p>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-cyan-300 border border-blue-500/20">
                          {camp.channel === 'whatsapp' ? 'WhatsApp' : camp.channel === 'email' ? 'Email' : 'SMS'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-slate-300 font-medium">
                        {camp.groupName || 'All Contacts'}
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            camp.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : camp.status === 'running'
                              ? 'bg-cyan-500/15 text-cyan-400'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {camp.status}
                        </span>
                      </td>
                      <td className="py-3.5 px-4 font-mono">
                        <span className="text-emerald-400 font-bold">{camp.delivCount || 0}</span>
                        <span className="text-slate-400"> / {camp.sentCount || 0}</span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(camp.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards */}
          <div className="md:hidden p-3 space-y-3">
            {filteredCampaigns.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <p className="font-bold text-white text-sm">No campaigns found</p>
                <p className="text-xs mt-1">Tap &quot;New Campaign&quot; to launch your first dispatch.</p>
              </div>
            ) : (
              filteredCampaigns.map((camp) => {
                const totalSent = camp.sentCount || 0;
                const totalDeliv = camp.delivCount || 0;
                const pct = totalSent > 0 ? Math.round((totalDeliv / totalSent) * 100) : 100;
                const isWA = camp.channel === 'whatsapp';
                const isEmail = camp.channel === 'email';

                return (
                  <div
                    key={camp.id}
                    className="p-4 rounded-2xl border border-white/10 bg-white/[0.02] hover:bg-white/[0.04] transition-all space-y-3"
                  >
                    {/* Top row: Badges + Delete */}
                    <div className="flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-blue-500/15 text-cyan-300 border border-blue-500/20">
                          {isWA ? 'WhatsApp' : isEmail ? 'Email' : 'SMS'}
                        </span>
                        <span
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                            camp.status === 'completed'
                              ? 'bg-emerald-500/15 text-emerald-400'
                              : camp.status === 'running'
                              ? 'bg-cyan-500/15 text-cyan-400'
                              : 'bg-white/10 text-slate-400'
                          }`}
                        >
                          {camp.status || 'Active'}
                        </span>
                      </div>
                      <button
                        onClick={() => handleDelete(camp.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Middle: Title & Date */}
                    <div>
                      <h4 className="font-black text-sm text-white leading-snug">{camp.name}</h4>
                      <p className="text-[11px] text-slate-400 mt-0.5">
                        Target: <span className="text-slate-200 font-semibold">{camp.groupName || 'All Contacts'}</span> • {new Date(camp.createdAt).toLocaleDateString()}
                      </p>
                    </div>

                    {/* Progress Bar & Stats */}
                    <div className="space-y-1.5 pt-1 border-t border-white/5">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-400 text-[11px]">Carrier Delivery</span>
                        <span className="font-mono text-cyan-300 font-bold text-xs">
                          {totalDeliv.toLocaleString()} / {totalSent.toLocaleString()} ({pct}%)
                        </span>
                      </div>
                      <div className="w-full h-1.5 bg-white/10 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-to-r from-blue-600 via-cyan-400 to-emerald-400 rounded-full transition-all duration-500"
                          style={{ width: `${Math.min(pct, 100)}%` }}
                        />
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </main>

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="vision-card w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Send className="w-5 h-5 text-cyan-400" />
                <span>Launch Omnichannel Campaign</span>
              </h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Campaign Title</label>
                <input
                  type="text"
                  required
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. VIP Fall Promo Blast"
                  className="vision-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value as any)}
                    className="vision-input text-xs bg-[#0b1437]"
                  >
                    <option value="sms">SMS (Telnyx)</option>
                    <option value="whatsapp">WhatsApp Business</option>
                    <option value="email">Email Suite</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Target Group</label>
                  <select
                    value={targetGroup}
                    onChange={(e) => setTargetGroup(e.target.value)}
                    className="vision-input text-xs bg-[#0b1437]"
                  >
                    <option value="All Contacts">All Contacts</option>
                    {groups.map((g) => (
                      <option key={g.id} value={g.name}>
                        {g.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Message Content</label>
                <textarea
                  rows={4}
                  required
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Type broadcast message here..."
                  className="vision-input text-xs"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="vision-btn-glass text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="vision-btn-primary text-xs py-2 px-4"
                >
                  {submitting ? 'Dispatching...' : 'Launch Broadcast'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
