'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getCampaigns, createAndRunCampaign, deleteCampaign, getTemplates, getContactGroups } from '@/lib/db-actions';
import { Megaphone, Plus, Play, Trash2, Users, FileText, CheckCircle2, Clock, AlertTriangle } from 'lucide-react';

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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
      setCampaigns(campList);
      setTemplates(tplList);
      setGroups(grpList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleLaunchCampaign = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!campaignName) return;
    setSubmitting(true);
    try {
      await createAndRunCampaign({
        name: campaignName,
        groupName: targetGroup,
        templateId: selectedTemplateId || undefined,
        customMessage: customMsg || undefined,
      });
      setCampaignName('');
      setSelectedTemplateId('');
      setCustomMsg('');
      setIsCreateOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign and its message logs?')) return;
    await deleteCampaign(id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Topbar
        title="Campaigns Management"
        subtitle="Schedule and launch high-volume targeted SMS campaigns"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-64 pt-16 p-4 sm:p-6 lg:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Active & Past Campaigns</h2>
            <p className="text-xs text-[#94a3b8]">
              Delivery numbers, costs, and progress calculated dynamically in PostgreSQL.
            </p>
          </div>
          <button
            onClick={() => setIsCreateOpen(true)}
            className="w-full sm:w-auto justify-center px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Campaign</span>
          </button>
        </div>

        {/* Campaign List */}
        {campaigns.length === 0 ? (
          <div className="p-12 border border-dashed border-[#6366f1]/20 rounded-2xl bg-[#0f1129] text-center flex flex-col items-center justify-center">
            <Megaphone className="w-12 h-12 text-[#94a3b8] mb-3 opacity-50" />
            <p className="text-base font-bold text-white">No Campaigns in PostgreSQL</p>
            <p className="text-xs text-[#94a3b8] max-w-sm mt-1 mb-5">
              Launch targeted campaigns to your contacts with dynamic name tags and real-time delivery receipts.
            </p>
            <button
              onClick={() => setIsCreateOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#6366f1] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Launch First Campaign</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {campaigns.map((camp) => {
              const deliveryPercent =
                camp.sentCount > 0 ? Math.round((camp.delivCount / camp.sentCount) * 100) : 0;

              return (
                <div
                  key={camp.id}
                  className="p-5 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 space-y-4 hover:border-[#6366f1]/40 transition-all shadow-lg"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[#818cf8]">
                        {camp.groupName}
                      </span>
                      <h3 className="text-base font-bold text-white mt-0.5">{camp.name}</h3>
                      <p className="text-xs text-[#94a3b8]">
                        Created {new Date(camp.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                          camp.status === 'completed'
                            ? 'bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30'
                            : 'bg-[#06b6d4]/15 text-[#22d3ee] border border-[#06b6d4]/30 animate-pulse'
                        }`}
                      >
                        {camp.status}
                      </span>
                      <button
                        onClick={() => handleDelete(camp.id)}
                        className="p-1 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/15 transition-all cursor-pointer"
                        title="Delete campaign"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div className="space-y-1.5">
                    <div className="flex justify-between text-xs text-[#94a3b8]">
                      <span>Delivery Success Rate</span>
                      <span className="text-white font-bold">{deliveryPercent}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#181a35] overflow-hidden">
                      <div
                        style={{ width: `${deliveryPercent}%` }}
                        className="h-full bg-gradient-to-r from-[#6366f1] to-[#10b981] transition-all duration-500"
                      />
                    </div>
                  </div>

                  {/* Dynamic Metrics */}
                  <div className="grid grid-cols-3 gap-2 pt-2 border-t border-[#6366f1]/15 text-center">
                    <div className="p-2 rounded-xl bg-[#12142e]">
                      <span className="block text-[10px] text-[#94a3b8]">Sent</span>
                      <span className="text-sm font-bold text-white">{camp.sentCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#12142e]">
                      <span className="block text-[10px] text-[#34d399]">Delivered</span>
                      <span className="text-sm font-bold text-[#34d399]">{camp.delivCount}</span>
                    </div>
                    <div className="p-2 rounded-xl bg-[#12142e]">
                      <span className="block text-[10px] text-[#94a3b8]">Total Cost</span>
                      <span className="text-sm font-bold text-white">${camp.cost.toFixed(4)}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f1129] border border-[#6366f1]/30 p-4 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-base font-bold text-white">Create & Run Campaign</h3>
            <p className="text-xs text-[#94a3b8]">
              Dispatches SMS directly to contacts in the chosen group and records dynamic logs.
            </p>

            <form onSubmit={handleLaunchCampaign} className="space-y-3">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Summer Flash Sale"
                  value={campaignName}
                  onChange={(e) => setCampaignName(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Target Contact Group</label>
                <select
                  value={targetGroup}
                  onChange={(e) => setTargetGroup(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
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
                <label className="block text-xs text-[#94a3b8] mb-1">Select Template (Optional)</label>
                <select
                  value={selectedTemplateId}
                  onChange={(e) => {
                    setSelectedTemplateId(e.target.value);
                    const tpl = templates.find((t) => t.id === e.target.value);
                    if (tpl) setCustomMsg(tpl.content);
                  }}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
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
                <label className="block text-xs text-[#94a3b8] mb-1">
                  Message Content (use <code className="text-[#818cf8]">{'{{name}}'}</code> for personalization)
                </label>
                <textarea
                  rows={4}
                  placeholder="Hi {{name}}, here is your exclusive SMS offer..."
                  value={customMsg}
                  onChange={(e) => setCustomMsg(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#6366f1] resize-none"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94a3b8] hover:bg-[#181a35] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
                >
                  <Play className="w-3.5 h-3.5" />
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
        onSuccess={loadData}
      />
    </div>
  );
}
