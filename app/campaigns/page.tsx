'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getCampaigns, createAndRunCampaign, deleteCampaign, getTemplates, getContactGroups } from '@/lib/db-actions';
import {
  Send, Plus, Play, Trash2, Users, FileText, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Sparkles, X, ChevronRight,
  TrendingUp, DollarSign, MessageSquare, Mail, Radio, PhoneCall
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
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'running' | 'scheduled'>('all');
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
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
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
      />

      <main className="lg:ml-[240px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold mb-2">
                <Sparkles className="w-3.5 h-3.5 text-blue-400" />
                <span>PaaS High-Throughput Engine</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Campaign Operations Console</h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Deploy target audience broadcasts via Telnyx Toll-Free (+1888) for US & Canadian physical mobile, Local 10DLC (+1479) for VoIP/Virtual, or WhatsApp Suite.
              </p>
            </div>

            <button
              onClick={() => setIsCreateOpen(true)}
              className="zs-btn-primary shadow-md text-xs py-2.5 px-5 self-start sm:self-auto cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Campaign</span>
            </button>
          </div>

          {/* KPIs */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Total Campaigns Dispatched</p>
              <p className="text-2xl font-black text-[var(--text-heading)] mt-1">{campaigns.length}</p>
              <span className="text-[11px] font-bold text-blue-500">Omnichannel Active</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Broadcasts Delivered</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">{totalDelivered.toLocaleString()}</p>
              <span className="text-[11px] text-[var(--text-muted)]">US & Canada Carriers</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Aggregate Success Rate</p>
              <p className="text-2xl font-black text-[var(--text-heading)] mt-1">{avgDeliveryRate}%</p>
              <span className="text-[11px] font-bold text-emerald-600">Above 99% SLA</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Audience Segments</p>
              <p className="text-2xl font-black text-blue-500 mt-1">{groups.length || 4}</p>
              <span className="text-[11px] text-[var(--text-muted)]">Target Contact Groups</span>
            </div>
          </div>

          {/* Campaigns Table Card */}
          <div className="zs-card overflow-hidden">
            {/* Filter toolbar */}
            <div className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <button
                  onClick={() => setChannelFilter('all')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    channelFilter === 'all'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }`}
                >
                  All Channels
                </button>
                <button
                  onClick={() => setChannelFilter('sms')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    channelFilter === 'sms'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }`}
                >
                  SMS (Telnyx)
                </button>
                <button
                  onClick={() => setChannelFilter('whatsapp')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    channelFilter === 'whatsapp'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-emerald-50'
                  }`}
                >
                  WhatsApp
                </button>
                <button
                  onClick={() => setChannelFilter('email')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    channelFilter === 'email'
                      ? 'bg-cyan-600 text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-cyan-50'
                  }`}
                >
                  Email
                </button>
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search campaigns..."
                  className="zs-input pl-8 py-1.5 text-xs"
                />
              </div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]">
                  <tr>
                    <th className="py-3 px-4">Campaign Name</th>
                    <th className="py-3 px-4">Channel & Route</th>
                    <th className="py-3 px-4">Target Group</th>
                    <th className="py-3 px-4 text-right">Sent</th>
                    <th className="py-3 px-4 text-right">Delivered</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {filteredCampaigns.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">
                        No campaigns found. Click &quot;Create New Campaign&quot; to launch your first broadcast.
                      </td>
                    </tr>
                  ) : (
                    filteredCampaigns.map((c) => {
                      const isWA = c.channel === 'whatsapp';
                      const isEmail = c.channel === 'email';

                      return (
                        <tr key={c.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[var(--text-heading)]">{c.name}</p>
                            <p className="text-[10px] text-[var(--text-muted)] font-mono">
                              Created {new Date(c.createdAt).toLocaleDateString()}
                            </p>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isWA
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : isEmail
                                ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                                : c.senderRoute === 'local'
                                ? 'bg-slate-500/10 text-slate-400 border border-slate-500/20'
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}>
                              {isWA
                                ? 'WhatsApp Business'
                                : isEmail
                                ? 'Email Suite'
                                : c.senderRoute === 'local'
                                ? 'Local 10DLC (+1479)'
                                : 'Toll-Free (+1888)'}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 font-semibold text-[var(--text-secondary)]">{c.groupName}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold">{c.sentCount}</td>
                          <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">{c.delivCount}</td>
                          <td className="py-3.5 px-4">
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              c.status === 'completed'
                                ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
                                : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                            }`}>
                              {c.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleDelete(c.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)] mb-4">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-heading)]">Create & Launch Campaign</h2>
                <p className="text-xs text-[var(--text-muted)]">Target audience broadcast with route selection</p>
              </div>
              <button
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Campaign Name</label>
                <input
                  type="text"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  placeholder="e.g. US Holiday Special Blast"
                  className="zs-input text-xs"
                  required
                />
              </div>

              {/* Channel Selector */}
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Dispatch Channel</label>
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setChannel('sms')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      channel === 'sms'
                        ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    SMS (Telnyx)
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('whatsapp')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      channel === 'whatsapp'
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-700'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    WhatsApp
                  </button>
                  <button
                    type="button"
                    onClick={() => setChannel('email')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold border transition-all text-center ${
                      channel === 'email'
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-700'
                        : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                    }`}
                  >
                    Email
                  </button>
                </div>
              </div>

              {/* SMS Route Selector if SMS */}
              {channel === 'sms' && (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Telnyx Sender Route</label>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setSenderRoute('toll_free')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                        senderRoute === 'toll_free'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <p className="font-bold">Toll-Free (+18884020949)</p>
                      <p className="text-[10px] text-[var(--text-muted)]">US & CA physical mobile</p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setSenderRoute('local')}
                      className={`p-2.5 rounded-xl text-xs font-semibold border transition-all text-left ${
                        senderRoute === 'local'
                          ? 'border-blue-500 bg-blue-500/10 text-blue-500'
                          : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <p className="font-bold">Local 10DLC (+14795909259)</p>
                      <p className="text-[10px] text-[var(--text-muted)]">VoIP / Virtual & local numbers</p>
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Target Contact Group</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="zs-input text-xs"
                >
                  <option value="All Contacts">All Contacts</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Choose Saved Template (Optional)</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    const t = templates.find((tpl) => tpl.id === e.target.value);
                    if (t) setCustomMsg(t.content);
                  }}
                  className="zs-input text-xs"
                >
                  <option value="">-- Manual Message --</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.channel.toUpperCase()})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Broadcast Content</label>
                <textarea
                  rows={4}
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  placeholder="Hi {{name}}, exclusive update..."
                  className="zs-input text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="zs-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="zs-btn-primary text-xs py-2 px-5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Launching...' : 'Launch Campaign'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
      />
    </div>
  );
}
