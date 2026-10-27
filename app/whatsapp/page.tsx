'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  MessageSquare, Plus, Send, CheckCircle2, Clock, AlertCircle,
  Users, FileText, BarChart2, Zap, X,
  CheckCheck, Sparkles, TrendingUp, Search, RefreshCw,
  Key, ExternalLink, Info
} from 'lucide-react';
import { sendWhatsAppMessageAction, getWaSettingsStatus } from '@/lib/db-actions';

// ─── Types ───────────────────────────────────────────────────────────────────
interface WaCampaign {
  id: number;
  name: string;
  region: string;
  template: string;
  sent: number;
  delivered: number;
  read: number;
  status: 'completed' | 'running' | 'scheduled' | 'failed';
  date: string;
}

interface WaTemplate {
  id: number;
  name: string;
  status: 'approved' | 'pending' | 'rejected';
  category: string;
  body: string;
}

const STATUS_STYLES: Record<string, string> = {
  completed: 'zs-badge-success',
  running:   'zs-badge-info',
  scheduled: 'zs-badge-warning',
  failed:    'zs-badge-danger',
  approved:  'zs-badge-success',
  pending:   'zs-badge-warning',
  rejected:  'zs-badge-danger',
};

const INITIAL_TEMPLATES: WaTemplate[] = [
  { id: 1, name: 'hello_world', status: 'approved', category: 'UTILITY', body: 'Hello World! This is your first WhatsApp template from Meta.' },
  { id: 2, name: 'welcome_message', status: 'approved', category: 'UTILITY', body: 'Hi {{1}}, welcome to ZenithServices! We are excited to have you on board.' },
  { id: 3, name: 'festival_promo', status: 'pending', category: 'MARKETING', body: 'Exclusive Festive Offer! Get 25% off storewide with code {{1}} valid until Sunday.' },
  { id: 4, name: 'order_update', status: 'approved', category: 'UTILITY', body: 'Your order {{1}} has been {{2}}. Track at: {{3}}' },
];

export default function WhatsAppPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'send' | 'setup'>('campaigns');
  const [templates] = useState<WaTemplate[]>(INITIAL_TEMPLATES);
  const [campaigns, setCampaigns] = useState<WaCampaign[]>([]);
  const [search, setSearch] = useState('');
  const [waConfigured, setWaConfigured] = useState<boolean | null>(null);

  // Send tab state
  const [sendPhone, setSendPhone] = useState('');
  const [sendTemplate, setSendTemplate] = useState('hello_world');
  const [sendParam1, setSendParam1] = useState('');
  const [sendParam2, setSendParam2] = useState('');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<{ success: boolean; message: string } | null>(null);

  // New campaign modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newCampName, setNewCampName] = useState('');
  const [newCampRegion, setNewCampRegion] = useState('🇮🇳 Pan India');
  const [newCampTemplate, setNewCampTemplate] = useState('hello_world');

  const checkWaConfig = useCallback(async () => {
    try {
      const status = await getWaSettingsStatus();
      setWaConfigured(status.configured);
    } catch {
      setWaConfigured(false);
    }
  }, []);

  useEffect(() => {
    checkWaConfig();
  }, [checkWaConfig]);

  const handleSendWhatsApp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sendPhone) return;
    setSending(true);
    setSendResult(null);

    try {
      const params = [sendParam1, sendParam2].filter(Boolean);
      const result = await sendWhatsAppMessageAction(sendPhone, sendTemplate, params);
      setSendResult({
        success: result.success,
        message: result.success
          ? `Message sent! ID: ${result.messageId || 'Accepted'}`
          : result.error || 'Failed to send WhatsApp message',
      });
    } catch (err: unknown) {
      setSendResult({
        success: false,
        message: (err as Error)?.message || 'Unexpected error',
      });
    } finally {
      setSending(false);
    }
  };

  const handleCreateCampaign = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCampName.trim()) return;
    const tpl = templates.find(t => t.name === newCampTemplate);
    const newCamp: WaCampaign = {
      id: Date.now(),
      name: newCampName.trim(),
      region: newCampRegion,
      template: newCampTemplate,
      sent: 0, delivered: 0, read: 0,
      status: 'scheduled',
      date: new Date().toLocaleDateString('en-IN', { day: '2-digit', month: 'short' }),
    };
    setCampaigns(prev => [newCamp, ...prev]);
    setNewCampName('');
    setIsCreateOpen(false);
  };

  const filtered = campaigns.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase())
  );

  const approvedTemplates = templates.filter(t => t.status === 'approved');

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        orgName="ZenithServices"
        planName="Growth"
        userRole="SUPER_ADMIN"
        balance={0}
      />
      <Topbar
        title="WhatsApp Business"
        subtitle="Meta Cloud API — Send template & transactional messages to Indian numbers"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-lg shadow-green-200">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">WhatsApp Business</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">Powered by Meta WhatsApp Cloud API</p>
              </div>
            </div>
            {activeTab === 'campaigns' && (
              <button onClick={() => setIsCreateOpen(true)} className="zs-btn-primary self-start sm:self-auto">
                <Plus className="w-4 h-4" />
                <span>New Campaign</span>
              </button>
            )}
          </div>

          {/* WhatsApp not configured banner */}
          {waConfigured === false && (
            <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="text-sm font-semibold text-amber-900">WhatsApp not configured</p>
                <p className="text-xs text-amber-700 mt-0.5">
                  Add your Meta WhatsApp Cloud API credentials in the{' '}
                  <button onClick={() => setActiveTab('setup')} className="font-bold underline">Setup tab</button>{' '}
                  or in your <code className="bg-amber-100 px-1 rounded">.env</code> file to start sending messages.
                </p>
              </div>
              <button
                onClick={() => setActiveTab('setup')}
                className="px-3 py-1.5 bg-amber-600 text-white text-xs font-semibold rounded-xl flex-shrink-0"
              >
                Setup
              </button>
            </div>
          )}

          {/* Stats Row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[
              { label: 'Campaigns Created', value: campaigns.length.toString(), icon: BarChart2, color: 'stat-icon-wa' },
              { label: 'Messages Sent', value: campaigns.reduce((s, c) => s + c.sent, 0).toLocaleString(), icon: Send, color: 'stat-icon-sms' },
              { label: 'Delivered', value: campaigns.reduce((s, c) => s + c.delivered, 0).toLocaleString(), icon: CheckCheck, color: 'stat-icon-email' },
              { label: 'Approved Templates', value: approvedTemplates.length.toString(), icon: FileText, color: 'stat-icon-users' },
            ].map((s) => (
              <div key={s.label} className="zs-card p-4 animate-fade-in-up">
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3 shadow-xs`}>
                  <s.icon className="w-4 h-4 text-white" style={{ width: '16px', height: '16px' }} />
                </div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="zs-tab-list max-w-lg">
            {(['campaigns', 'templates', 'send', 'setup'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`zs-tab capitalize text-xs ${activeTab === t ? 'active' : ''}`}
              >
                {t === 'send' ? '⚡ Quick Send' : t === 'setup' ? '🔧 Setup' : t.charAt(0).toUpperCase() + t.slice(1)}
              </button>
            ))}
          </div>

          {/* ── Campaigns Tab ─────────────────────────────────────────── */}
          {activeTab === 'campaigns' && (
            <div className="space-y-4 animate-fade-in">
              <div className="relative">
                <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search WhatsApp campaigns…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="zs-input pl-9"
                />
              </div>

              {filtered.length === 0 ? (
                <div className="zs-card p-16 text-center">
                  <MessageSquare className="w-14 h-14 text-[var(--text-muted)] mx-auto mb-4 opacity-25" />
                  <h3 className="text-base font-bold text-[var(--text-heading)]">No WhatsApp campaigns yet</h3>
                  <p className="text-xs text-[var(--text-muted)] max-w-xs mx-auto mt-1">
                    Create your first campaign using an approved Meta template.
                  </p>
                  <button
                    onClick={() => setIsCreateOpen(true)}
                    className="zs-btn-primary mt-4 mx-auto"
                  >
                    <Plus className="w-4 h-4" />
                    Create First Campaign
                  </button>
                </div>
              ) : (
                <div className="zs-card overflow-hidden shadow-xs">
                  <div className="overflow-x-auto">
                    <table className="zs-table">
                      <thead>
                        <tr>
                          <th>Campaign Name</th>
                          <th>Region</th>
                          <th>Template</th>
                          <th className="text-right">Sent</th>
                          <th className="text-right">Delivered</th>
                          <th className="text-right">Read</th>
                          <th>Status</th>
                          <th>Date</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((c) => (
                          <tr key={c.id}>
                            <td className="font-semibold text-[var(--text-heading)]">{c.name}</td>
                            <td className="text-xs text-[var(--text-muted)]">{c.region}</td>
                            <td><code className="text-[11px] bg-green-50 text-green-700 px-2 py-0.5 rounded-md">{c.template}</code></td>
                            <td className="text-right font-mono text-xs">{c.sent.toLocaleString()}</td>
                            <td className="text-right font-mono text-xs">{c.delivered.toLocaleString()}</td>
                            <td className="text-right font-mono text-xs">{c.read.toLocaleString()}</td>
                            <td><span className={`zs-badge ${STATUS_STYLES[c.status]}`}>{c.status}</span></td>
                            <td className="text-xs text-[var(--text-muted)]">{c.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* ── Templates Tab ─────────────────────────────────────────── */}
          {activeTab === 'templates' && (
            <div className="space-y-4 animate-fade-in">
              <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 flex items-start gap-3 text-xs text-blue-900">
                <Info className="w-4 h-4 flex-shrink-0 mt-0.5 text-blue-600" />
                <div>
                  <span className="font-semibold">Meta Template Approval: </span>
                  WhatsApp messages can only be initiated using pre-approved templates from your Meta Business account.
                  Create and submit templates at{' '}
                  <a href="https://business.facebook.com/wa/manage/message-templates/" target="_blank" rel="noopener noreferrer" className="font-semibold underline inline-flex items-center gap-1">
                    WhatsApp Manager <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {templates.map((t) => (
                  <div key={t.id} className="zs-card p-5 space-y-3">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-bold text-[var(--text-heading)] font-mono">{t.name}</p>
                        <span className="text-[10px] font-semibold text-[var(--text-muted)] uppercase tracking-wider">{t.category}</span>
                      </div>
                      <span className={`zs-badge flex-shrink-0 ${STATUS_STYLES[t.status]}`}>{t.status}</span>
                    </div>
                    <p className="text-xs text-[var(--text-secondary)] bg-[var(--bg-surface)] p-3 rounded-xl leading-relaxed border border-[var(--border-subtle)]">
                      {t.body}
                    </p>
                    {t.status === 'approved' && (
                      <button
                        onClick={() => { setActiveTab('send'); setSendTemplate(t.name); }}
                        className="text-xs font-semibold text-green-700 hover:underline flex items-center gap-1"
                      >
                        <Zap className="w-3 h-3" />
                        Use this template →
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Quick Send Tab ─────────────────────────────────────────── */}
          {activeTab === 'send' && (
            <div className="animate-fade-in max-w-xl">
              <div className="zs-card p-6 space-y-5">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-heading)]">Send WhatsApp Message</h3>
                    <p className="text-xs text-[var(--text-muted)]">Uses Meta Cloud API — requires approved template</p>
                  </div>
                </div>

                <form onSubmit={handleSendWhatsApp} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Recipient Phone (+91XXXXXXXXXX)
                    </label>
                    <input
                      type="text"
                      placeholder="+919876543210"
                      value={sendPhone}
                      onChange={(e) => setSendPhone(e.target.value)}
                      className="zs-input font-mono text-sm"
                      required
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Template Name
                    </label>
                    <select
                      value={sendTemplate}
                      onChange={(e) => setSendTemplate(e.target.value)}
                      className="zs-input cursor-pointer"
                    >
                      {approvedTemplates.map((t) => (
                        <option key={t.id} value={t.name}>{t.name} ({t.category})</option>
                      ))}
                    </select>
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Only approved templates are listed. Create more at WhatsApp Manager.
                    </p>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                        {'{{1}}'} Parameter
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Arjit"
                        value={sendParam1}
                        onChange={(e) => setSendParam1(e.target.value)}
                        className="zs-input text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                        {'{{2}}'} Parameter
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. SAVE25"
                        value={sendParam2}
                        onChange={(e) => setSendParam2(e.target.value)}
                        className="zs-input text-xs"
                      />
                    </div>
                  </div>

                  <button type="submit" disabled={sending} className="zs-btn-primary w-full justify-center">
                    {sending ? (
                      <><RefreshCw className="w-3.5 h-3.5 animate-spin" /><span>Sending…</span></>
                    ) : (
                      <><Send className="w-3.5 h-3.5" /><span>Send WhatsApp Message</span></>
                    )}
                  </button>
                </form>

                {sendResult && (
                  <div className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                    sendResult.success
                      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                      : 'bg-rose-50 border-rose-200 text-rose-800'
                  }`}>
                    {sendResult.success
                      ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                      : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                    }
                    <span>{sendResult.message}</span>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Setup Tab ─────────────────────────────────────────────── */}
          {activeTab === 'setup' && (
            <div className="animate-fade-in space-y-5 max-w-2xl">
              <div className="zs-card p-6 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center text-green-600">
                    <Key className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-[var(--text-heading)]">Meta WhatsApp Cloud API Setup</h3>
                    <p className="text-xs text-[var(--text-muted)]">Add credentials to your <code>.env</code> file</p>
                  </div>
                </div>

                <div className="space-y-3">
                  {[
                    {
                      step: '1',
                      title: 'Create a Meta Developer App',
                      desc: 'Go to developers.facebook.com → My Apps → Create App → Business type → Add WhatsApp product.',
                      link: 'https://developers.facebook.com/apps',
                      linkText: 'Open Meta Developer Console',
                    },
                    {
                      step: '2',
                      title: 'Get API Credentials',
                      desc: 'In your app → WhatsApp → API Setup. Copy your Phone Number ID, WhatsApp Business Account ID, and Access Token.',
                      link: null,
                      linkText: null,
                    },
                    {
                      step: '3',
                      title: 'Add to .env file',
                      desc: 'Add these 3 variables to your .env file in the project root and restart the server.',
                      link: null,
                      linkText: null,
                    },
                    {
                      step: '4',
                      title: 'Create Message Templates',
                      desc: 'In WhatsApp Manager → Message Templates, create and submit templates for approval. Use "hello_world" for immediate testing.',
                      link: 'https://business.facebook.com/wa/manage/message-templates/',
                      linkText: 'WhatsApp Manager',
                    },
                  ].map((s) => (
                    <div key={s.step} className="flex gap-3 p-4 rounded-xl bg-[var(--bg-surface)] border border-[var(--border-subtle)]">
                      <div className="w-7 h-7 rounded-full bg-green-100 text-green-700 font-bold text-xs flex items-center justify-center flex-shrink-0">
                        {s.step}
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-[var(--text-heading)]">{s.title}</p>
                        <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{s.desc}</p>
                        {s.link && (
                          <a href={s.link} target="_blank" rel="noopener noreferrer"
                            className="mt-1 text-xs font-semibold text-green-700 hover:underline inline-flex items-center gap-1">
                            {s.linkText} <ExternalLink className="w-3 h-3" />
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                <div className="p-4 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">Required .env variables:</p>
                  <pre className="text-[11px] text-green-700 font-mono leading-relaxed overflow-x-auto">{`WHATSAPP_PHONE_NUMBER_ID="your_phone_number_id"
WHATSAPP_BUSINESS_ACCOUNT_ID="your_waba_id"
WHATSAPP_ACCESS_TOKEN="your_access_token"
WHATSAPP_VERIFY_TOKEN="zenith_webhook_verify_2024"`}</pre>
                </div>

                <div className="p-3.5 rounded-xl bg-indigo-50 border border-indigo-200 text-xs text-indigo-900 flex items-start gap-2">
                  <Sparkles className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold">Cost: </span>
                    WhatsApp Cloud API pricing for India — approximately ₹0.40–0.70 per marketing conversation (24-hr window).
                    Utility/Auth messages cost less. No per-message fee after the first message in a 24hr window.
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Create Campaign Modal */}
      {isCreateOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-md">
            <button
              onClick={() => setIsCreateOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 to-emerald-600 flex items-center justify-center text-white shadow-md">
                <MessageSquare className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">New WhatsApp Campaign</h3>
                <p className="text-xs text-[var(--text-muted)]">Schedule bulk WhatsApp outreach</p>
              </div>
            </div>

            <form onSubmit={handleCreateCampaign} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Campaign Name</label>
                <input
                  type="text"
                  placeholder="e.g. Diwali Offer Blast"
                  value={newCampName}
                  onChange={(e) => setNewCampName(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Target Region</label>
                <select
                  value={newCampRegion}
                  onChange={(e) => setNewCampRegion(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  {['🇮🇳 Pan India', '🇮🇳 Delhi NCR', '🇮🇳 Mumbai', '🇮🇳 Bengaluru', '🇮🇳 Chennai', '🇮🇳 Hyderabad', '🇮🇳 Kolkata', '🇮🇳 Pune'].map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Message Template</label>
                <select
                  value={newCampTemplate}
                  onChange={(e) => setNewCampTemplate(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  {approvedTemplates.map((t) => (
                    <option key={t.id} value={t.name}>{t.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button type="button" onClick={() => setIsCreateOpen(false)} className="zs-btn-secondary">Cancel</button>
                <button type="submit" className="zs-btn-primary">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>Create Campaign</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QuickSendModal isOpen={isQuickSendOpen} onClose={() => setIsQuickSendOpen(false)} />
    </div>
  );
}
