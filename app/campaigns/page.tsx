'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getCampaigns, createAndRunCampaign, deleteCampaign, getTemplates, getContactGroups } from '@/lib/db-actions';
import {
  Send, Plus, Play, Trash2, Users, FileText, CheckCircle2,
  Clock, AlertCircle, Search, Filter, Sparkles, X, ChevronRight,
  TrendingUp, DollarSign, MessageSquare
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

  // Form states
  const [campaignName, setCampaignName] = useState('');
  const [targetGroup, setTargetGroup] = useState('All Contacts');
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
    if (!confirm('Are you sure you want to delete this campaign and its message logs?')) return;
    try {
      await deleteCampaign(id);
      await loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Filtered campaigns
  const filteredCampaigns = campaigns.filter((c) => {
    const matchSearch = c.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.groupName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchStatus = statusFilter === 'all' || c.status?.toLowerCase() === statusFilter;
    return matchSearch && matchStatus;
  });

  // Dynamic Aggregated KPIs
  const totalSent = campaigns.reduce((acc, c) => acc + (c.sentCount || 0), 0);
  const totalDelivered = campaigns.reduce((acc, c) => acc + (c.delivCount || 0), 0);
  const totalSpent = campaigns.reduce((acc, c) => acc + (c.cost || 0), 0);
  const overallSuccessRate = totalSent > 0 ? Math.round((totalDelivered / totalSent) * 100) : 0;

  const charCount = customMsg.length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        orgName="Acme Corp"
        planName="Growth"
        userRole="SUPER_ADMIN"
      />
      <Topbar
        title="SMS Campaigns"
        subtitle="Schedule and launch high-volume targeted SMS campaigns"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Send className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">SMS Campaigns</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Dispatch bulk SMS with personalization tags and real-time delivery tracking
                </p>
              </div>
            </div>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="zs-btn-primary self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Campaign</span>
            </button>
          </div>

          {/* KPI Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Campaigns</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Send className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">{campaigns.length}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Recorded in PostgreSQL</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Messages Sent</span>
                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
                  <MessageSquare className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">{totalSent.toLocaleString()}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Across all campaigns</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Delivered Rate</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <div className="flex items-baseline gap-2">
                <p className="text-2xl font-bold text-[var(--text-heading)]">{overallSuccessRate}%</p>
                <span className="text-xs text-emerald-600 font-semibold">{totalDelivered} delivered</span>
              </div>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Carrier verified receipts</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Spent</span>
                <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-600">
                  <DollarSign className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">${totalSpent.toFixed(4)}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Calculated per SMS rate</p>
            </div>
          </div>

          {/* Search & Filter Toolbar */}
          <div className="zs-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search campaigns by name or target group…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="zs-input pl-9.5 text-xs sm:text-sm py-2"
              />
            </div>

            <div className="zs-tab-list self-start sm:self-auto">
              {(['all', 'completed', 'running', 'scheduled'] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={`zs-tab capitalize text-xs ${statusFilter === s ? 'active' : ''}`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Campaign List / Cards */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="zs-card p-5 h-44 skeleton" />
              ))}
            </div>
          ) : filteredCampaigns.length === 0 ? (
            <div className="zs-card p-12 text-center flex flex-col items-center justify-center border-dashed">
              <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                <Send className="w-7 h-7" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-heading)]">No campaigns found</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 mb-5">
                {searchQuery || statusFilter !== 'all'
                  ? 'No campaigns match your current filters. Try resetting the search query.'
                  : 'Launch targeted SMS broadcasts to your contacts with dynamic name tags and real-time delivery receipts.'}
              </p>
              <button
                onClick={() => setIsCreateOpen(true)}
                className="zs-btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Launch First Campaign</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCampaigns.map((camp) => {
                const deliveryPercent =
                  camp.sentCount > 0 ? Math.round((camp.delivCount / camp.sentCount) * 100) : 0;

                const isCompleted = camp.status === 'completed';

                return (
                  <div
                    key={camp.id}
                    className="zs-card p-5 space-y-4 hover:border-indigo-300 transition-all shadow-xs hover:shadow-md animate-fade-in"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-100">
                            {camp.groupName || 'All Contacts'}
                          </span>
                        </div>
                        <h3 className="text-base font-bold text-[var(--text-heading)] truncate" title={camp.name}>
                          {camp.name}
                        </h3>
                        <p className="text-xs text-[var(--text-muted)] mt-0.5 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Created {new Date(camp.createdAt).toLocaleDateString()}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span
                          className={`zs-badge ${
                            isCompleted ? 'zs-badge-success' : 'zs-badge-info animate-pulse'
                          }`}
                        >
                          {camp.status}
                        </span>
                        <button
                          onClick={() => handleDelete(camp.id)}
                          className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                          title="Delete campaign"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {/* Delivery Rate Bar */}
                    <div className="space-y-1.5">
                      <div className="flex justify-between text-xs">
                        <span className="text-[var(--text-secondary)] font-medium">Delivery Rate</span>
                        <span className="font-bold text-indigo-600">{deliveryPercent}%</span>
                      </div>
                      <div className="zs-progress-track">
                        <div
                          className="zs-progress-bar"
                          style={{ width: `${deliveryPercent}%` }}
                        />
                      </div>
                    </div>

                    {/* Metrics Footer */}
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-[var(--border-subtle)] text-center">
                      <div className="p-2 rounded-xl bg-[var(--bg-elevated)]">
                        <span className="block text-[10px] text-[var(--text-muted)] font-medium">Sent</span>
                        <span className="text-sm font-bold text-[var(--text-heading)]">{camp.sentCount}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-emerald-50/70 border border-emerald-100">
                        <span className="block text-[10px] text-emerald-700 font-medium">Delivered</span>
                        <span className="text-sm font-bold text-emerald-700">{camp.delivCount}</span>
                      </div>
                      <div className="p-2 rounded-xl bg-[var(--bg-elevated)]">
                        <span className="block text-[10px] text-[var(--text-muted)] font-medium">Cost</span>
                        <span className="text-sm font-bold text-[var(--text-heading)]">${(camp.cost || 0).toFixed(4)}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-xl">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Create & Launch Campaign</h3>
                <p className="text-xs text-[var(--text-muted)]">Dispatches SMS directly to contacts in the chosen group</p>
              </div>
            </div>

            <form onSubmit={handleLaunchCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Summer Flash Sale"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Target Contact Group</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="All Contacts">All Contacts (Broadcast to entire list)</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Select Template (Optional)</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    const tpl = templates.find((t) => t.id === e.target.value);
                    if (tpl) setCustomMsg(tpl.content);
                  }}
                  className="zs-input cursor-pointer"
                >
                  <option value="">Custom Message (No Template)</option>
                  {templates.map((tpl) => (
                    <option key={tpl.id} value={tpl.id}>
                      {tpl.name} ({tpl.category})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">
                    Message Content (use <code className="text-indigo-600 font-mono">{'{{name}}'}</code> for personalization)
                  </label>
                  <span className="text-[11px] font-medium text-indigo-600">
                    {charCount} chars • {segments} segment{segments > 1 ? 's' : ''}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Hi {{name}}, here is your exclusive SMS offer..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="zs-input resize-none"
                  required
                />
              </div>

              {/* Dynamic tag inserters */}
              <div className="flex items-center gap-2 pt-1">
                <span className="text-[11px] text-[var(--text-muted)]">Insert tags:</span>
                <button
                  type="button"
                  onClick={() => setCustomMsg((prev) => prev + ' {{name}}')}
                  className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-mono font-medium hover:bg-indigo-100 cursor-pointer"
                >
                  + {'{{name}}'}
                </button>
                <button
                  type="button"
                  onClick={() => setCustomMsg((prev) => prev + ' {{code}}')}
                  className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-600 border border-indigo-200 text-xs font-mono font-medium hover:bg-indigo-100 cursor-pointer"
                >
                  + {'{{code}}'}
                </button>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="zs-btn-primary"
                >
                  <Play className="w-3.5 h-3.5" />
                  <span>{submitting ? 'Launching…' : 'Launch Campaign'}</span>
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
