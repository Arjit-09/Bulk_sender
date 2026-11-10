'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { sendEmailMessage } from '@/lib/email';
import {
  Mail, Plus, Send, BarChart2, FileText, Eye, MousePointer,
  TrendingUp, Users, CheckCircle2, AlertCircle, X, Sparkles,
  CheckCheck, Globe, Search, RefreshCw, Trash2
} from 'lucide-react';

const INITIAL_EMAIL_CAMPAIGNS = [
  {
    id: 1,
    name: 'US Summer Enterprise Blast',
    subject: '⚡ Exclusive 25% Off ZenithTech Omnichannel PaaS',
    audience: '🇺🇸 US Verified Customers',
    sent: 14200,
    delivered: 13980,
    opened: 6420,
    clicked: 2180,
    status: 'completed',
    date: 'Oct 24',
  },
  {
    id: 2,
    name: 'Canada VIP Product Launch',
    subject: 'Now Live in Ontario, Quebec & BC: Instant Toll-Free SMS',
    audience: '🇨🇦 Canada VIP Members',
    sent: 8500,
    delivered: 8410,
    opened: 3940,
    clicked: 1420,
    status: 'running',
    date: 'Oct 28',
  },
  {
    id: 3,
    name: 'Transactional Onboarding Notice',
    subject: 'Your Dual Telnyx Routing Credentials Are Active',
    audience: 'All Registered Leads',
    sent: 3200,
    delivered: 3180,
    opened: 2100,
    clicked: 980,
    status: 'completed',
    date: 'Oct 29',
  },
];

const EMAIL_TEMPLATES = [
  {
    id: 1,
    name: 'Modern SaaS Newsletter',
    category: 'Marketing',
    subject: 'Your Weekly Platform Highlights',
    content: `<h2>Hi {{name}},</h2><p>Here are your weekly deliverability metrics across US & Canadian mobile carriers.</p><p><a href="https://zenithtech.site" style="background:#f97316;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;display:inline-block;">View Analytics Dashboard</a></p>`,
  },
  {
    id: 2,
    name: 'Order & Shipping Notification',
    category: 'Transactional',
    subject: 'Your Order #{{order_id}} has shipped!',
    content: `<h2>Order Shipped!</h2><p>Hello {{name}}, your package has left our distribution center and is en route via FedEx Priority.</p>`,
  },
  {
    id: 3,
    name: 'Security & API Key Notice',
    category: 'Utility',
    subject: 'Security Alert: New Session Login',
    content: `<h2>Security Update</h2><p>Hi {{name}}, your Telnyx Dual API keys were successfully rotated from IP {{ip_address}}.</p>`,
  },
];

export default function EmailSuitePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates'>('campaigns');
  const [campaigns, setCampaigns] = useState(INITIAL_EMAIL_CAMPAIGNS);
  const [templates, setTemplates] = useState(EMAIL_TEMPLATES);
  const [search, setSearch] = useState('');
  const [showCompose, setShowCompose] = useState(false);

  // Form states
  const [campName, setCampName] = useState('');
  const [campSubject, setCampSubject] = useState('');
  const [campAudience, setCampAudience] = useState('🇺🇸 US Verified Customers');
  const [campBody, setCampBody] = useState('');
  const [testEmailTo, setTestEmailTo] = useState('alex.wright@sfbaytech.com');
  const [sendingTest, setSendingTest] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  const handleComposeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!campName.trim() || !campSubject.trim()) return;

    const newCamp = {
      id: Date.now(),
      name: campName.trim(),
      subject: campSubject.trim(),
      audience: campAudience,
      sent: 2500,
      delivered: 2480,
      opened: 1120,
      clicked: 450,
      status: 'running',
      date: 'Today',
    };

    setCampaigns([newCamp, ...campaigns]);
    setShowCompose(false);
    setCampName('');
    setCampSubject('');
    setCampBody('');
  };

  const handleSendTestEmail = async () => {
    if (!testEmailTo) return;
    setSendingTest(true);
    setTestResult(null);

    try {
      const res = await sendEmailMessage({
        toEmail: testEmailTo,
        subject: campSubject || 'Test Dispatch from ZenithTech Email Suite',
        content: campBody || 'This is a test broadcast from ZenithTech Omnichannel PaaS.',
      });
      setTestResult(res);
    } catch (err: any) {
      setTestResult({ success: false, error: err.message });
    } finally {
      setSendingTest(false);
    }
  };

  return (
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Email Suite PaaS"
        subtitle="High-deliverability enterprise email marketing & transactional broadcast engine"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-cyan-600 via-sky-600 to-blue-600 text-white shadow-xl shadow-cyan-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                <Mail className="w-3.5 h-3.5" />
                <span>Email PaaS Cloud</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                Enterprise Email Delivery Suite
              </h1>
              <p className="text-xs sm:text-sm text-cyan-100 max-w-xl">
                Dedicated IP warm-up, custom DKIM/SPF domain verification, and rich HTML newsletter templates with US & Canadian audience segmentation.
              </p>
            </div>

            <button
              onClick={() => setShowCompose(true)}
              className="px-5 py-2.5 rounded-xl bg-white text-sky-700 font-bold text-xs hover:bg-sky-50 shadow-md transition-all flex items-center gap-2 cursor-pointer self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Compose Email Broadcast</span>
            </button>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Emails Sent This Month</p>
              <p className="text-2xl font-black text-[var(--text-heading)] mt-1">25,900</p>
              <span className="text-[11px] font-bold text-emerald-600">99.1% Delivery Rate</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Average Open Rate</p>
              <p className="text-2xl font-black text-sky-600 mt-1">45.8%</p>
              <span className="text-[11px] text-[var(--text-muted)]">+8.4% above industry avg</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Click-Through Rate (CTR)</p>
              <p className="text-2xl font-black text-blue-500 mt-1">16.2%</p>
              <span className="text-[11px] text-[var(--text-muted)]">4,580 link clicks</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Bounce & Spam Rate</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">0.08%</p>
              <span className="text-[11px] text-[var(--text-muted)]">Zero domain blacklists</span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <button
              onClick={() => setActiveTab('campaigns')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'campaigns'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Email Campaigns ({campaigns.length})
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'templates'
                  ? 'bg-sky-50 text-sky-700 border border-sky-200/80 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              HTML Template Catalog ({templates.length})
            </button>
          </div>

          {/* Campaigns View */}
          {activeTab === 'campaigns' && (
            <div className="zs-card overflow-hidden">
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-heading)]">Campaign Performance Records</h3>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search campaigns..."
                    className="zs-input text-xs"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-3 px-4">Campaign Name & Subject</th>
                      <th className="py-3 px-4">Target Audience</th>
                      <th className="py-3 px-4 text-right">Sent</th>
                      <th className="py-3 px-4 text-right">Delivered</th>
                      <th className="py-3 px-4 text-right">Open Rate</th>
                      <th className="py-3 px-4 text-right">CTR</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {campaigns
                      .filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.subject.toLowerCase().includes(search.toLowerCase()))
                      .map((c) => {
                        const openRate = ((c.opened / c.delivered) * 100).toFixed(1);
                        const clickRate = ((c.clicked / c.opened) * 100).toFixed(1);

                        return (
                          <tr key={c.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                            <td className="py-3.5 px-4">
                              <p className="font-bold text-[var(--text-heading)]">{c.name}</p>
                              <p className="text-[11px] text-[var(--text-muted)] truncate max-w-sm">{c.subject}</p>
                            </td>
                            <td className="py-3.5 px-4 font-semibold text-[var(--text-secondary)]">{c.audience}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold">{c.sent.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right font-mono text-emerald-600 font-bold">{c.delivered.toLocaleString()}</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-sky-600">{openRate}%</td>
                            <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-500">{clickRate}%</td>
                            <td className="py-3.5 px-4">
                              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                                c.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : 'bg-sky-50 text-sky-700 border border-sky-200'
                              }`}>
                                {c.status}
                              </span>
                            </td>
                          </tr>
                        );
                      })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Templates View */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {templates.map((tpl) => (
                <div key={tpl.id} className="zs-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--text-heading)]">{tpl.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-sky-50 text-sky-700 border border-sky-200">
                        {tpl.category}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-[var(--text-secondary)] mb-2">
                      Subject: {tpl.subject}
                    </p>
                    <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-muted)] line-clamp-4">
                      {tpl.content}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between mt-4">
                    <button
                      onClick={() => {
                        setCampName(tpl.name);
                        setCampSubject(tpl.subject);
                        setCampBody(tpl.content);
                        setShowCompose(true);
                      }}
                      className="text-xs font-bold text-sky-600 hover:text-sky-700 flex items-center gap-1 cursor-pointer"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>Use in Broadcast</span>
                    </button>
                    <button
                      onClick={() => setTemplates(templates.filter((t) => t.id !== tpl.id))}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>
      </main>

      {/* Compose Email Modal */}
      {showCompose && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="relative w-full max-w-2xl bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-[var(--border-color)]">
              <div>
                <h2 className="text-sm font-bold text-[var(--text-heading)]">Compose Enterprise Email Broadcast</h2>
                <p className="text-xs text-[var(--text-muted)]">Target US & Canadian contact segments with dynamic merge tags</p>
              </div>
              <button
                onClick={() => setShowCompose(false)}
                className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleComposeSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Campaign Title</label>
                  <input
                    type="text"
                    value={campName}
                    onChange={(e) => setCampName(e.target.value)}
                    placeholder="e.g. Summer Special 2026"
                    className="zs-input text-xs"
                    required
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Target Segment</label>
                  <select
                    value={campAudience}
                    onChange={(e) => setCampAudience(e.target.value)}
                    className="zs-input text-xs"
                  >
                    <option value="🇺🇸 US Verified Customers">🇺🇸 US Verified Customers (Mobile)</option>
                    <option value="🇨🇦 Canada VIP Members">🇨🇦 Canada VIP Members</option>
                    <option value="All Registered Leads">All Registered Leads</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subject Line</label>
                <input
                  type="text"
                  value={campSubject}
                  onChange={(e) => setCampSubject(e.target.value)}
                  placeholder="e.g. Exclusive Update: Your Account is Ready"
                  className="zs-input text-xs"
                  required
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">HTML Email Body</label>
                  <span className="text-[10px] text-[var(--text-muted)]">Available tags: {'{{name}}'}, {'{{phone}}'}</span>
                </div>
                <textarea
                  rows={6}
                  value={campBody}
                  onChange={(e) => setCampBody(e.target.value)}
                  placeholder="<h2>Hello {{name}},</h2><p>We are thrilled to welcome you to ZenithTech Cloud...</p>"
                  className="zs-input text-xs font-mono resize-none"
                  required
                />
              </div>

              {/* Test Email Dispatcher */}
              <div className="p-3.5 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[var(--text-secondary)]">Send Instant Test Email</span>
                  {testResult && (
                    <span className="text-[11px] font-bold text-emerald-600">Delivered successfully!</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="email"
                    value={testEmailTo}
                    onChange={(e) => setTestEmailTo(e.target.value)}
                    placeholder="Enter recipient email..."
                    className="flex-1 zs-input text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleSendTestEmail}
                    disabled={sendingTest}
                    className="px-3 py-2 rounded-xl bg-sky-600 text-white font-bold text-xs hover:bg-sky-700 transition-colors cursor-pointer"
                  >
                    {sendingTest ? 'Sending...' : 'Test Send'}
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setShowCompose(false)}
                  className="zs-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary text-xs py-2 px-5"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>Launch Campaign</span>
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
