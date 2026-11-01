'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getTemplates, createTemplate, deleteTemplate, getContactGroups } from '@/lib/db-actions';
import { sendWhatsAppMessage } from '@/lib/whatsapp';
import {
  MessageSquare, Plus, Send, Sparkles, CheckCircle2, Clock,
  Smartphone, ExternalLink, Phone, ArrowRight, Trash2,
  Users, CheckCheck, AlertCircle, RefreshCw, Layers
} from 'lucide-react';
import Link from 'next/link';

interface WhatsAppTemplate {
  id: string;
  name: string;
  category: string;
  content: string;
  metaHeader?: string;
  metaFooter?: string;
  metaButtons?: string;
}

const INITIAL_WA_TEMPLATES = [
  {
    id: 'wa_tpl_1',
    name: 'Order Confirmation & Tracking',
    category: 'Transactional',
    metaHeader: 'Order Confirmation #US-8492',
    content: 'Hi {{name}}, your order has shipped via FedEx Priority! Your estimated delivery date is tomorrow before 5:00 PM.',
    metaFooter: 'ZenithTech PaaS • Reply STOP to unsubscribe',
    metaButtons: JSON.stringify([
      { type: 'URL', text: 'Track Shipment 📦', url: 'https://zenithtech.site/track' },
      { type: 'QUICK_REPLY', text: 'Speak to Support' },
    ]),
  },
  {
    id: 'wa_tpl_2',
    name: 'VIP Welcome & Access Pass',
    category: 'Marketing',
    metaHeader: 'Welcome to ZenithTech Cloud ✨',
    content: 'Hello {{name}}! Your enterprise messaging workspace is now fully provisioned with dual Telnyx routes.',
    metaFooter: 'Official WhatsApp Business Partner',
    metaButtons: JSON.stringify([
      { type: 'URL', text: 'Launch Portal 🚀', url: 'https://zenithtech.site/dashboard' },
      { type: 'QUICK_REPLY', text: 'Schedule Demo' },
    ]),
  },
  {
    id: 'wa_tpl_3',
    name: 'Appointment Reminder',
    category: 'Utility',
    metaHeader: 'Appointment Reminder',
    content: 'Hi {{name}}, this is a reminder for your consultation on Monday at 10:00 AM EST.',
    metaFooter: 'Reply 1 to confirm, 2 to reschedule',
    metaButtons: JSON.stringify([
      { type: 'QUICK_REPLY', text: 'Confirm' },
      { type: 'QUICK_REPLY', text: 'Reschedule' },
    ]),
  },
];

export default function WhatsAppSuitePage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'campaigns' | 'templates' | 'simulator'>('simulator');
  const [templates, setTemplates] = useState<WhatsAppTemplate[]>(INITIAL_WA_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<WhatsAppTemplate>(INITIAL_WA_TEMPLATES[0]);

  // Form states for test send
  const [testPhone, setTestPhone] = useState('+14155552671');
  const [testName, setTestName] = useState('Alexander');
  const [sending, setSending] = useState(false);
  const [sendResult, setSendResult] = useState<any>(null);

  // Template creation modal
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('Marketing');
  const [newTplHeader, setNewTplHeader] = useState('');
  const [newTplBody, setNewTplBody] = useState('');
  const [newTplFooter, setNewTplFooter] = useState('');
  const [newTplButtonText, setNewTplButtonText] = useState('Open Portal');
  const [newTplButtonUrl, setNewTplButtonUrl] = useState('https://zenithtech.site');

  const handleTestSend = async (e: React.FormEvent) => {
    e.preventDefault();
    setSending(true);
    setSendResult(null);

    const interpolated = selectedTemplate.content.replace(/\{\{name\}\}/gi, testName);

    try {
      const res = await sendWhatsAppMessage({
        toPhone: testPhone,
        content: `[${selectedTemplate.metaHeader || 'ZenithTech'}]\n\n${interpolated}\n\n_${selectedTemplate.metaFooter || ''}_`,
      });
      setSendResult(res);
    } catch (err: any) {
      setSendResult({ success: false, error: err.message });
    } finally {
      setSending(false);
    }
  };

  const handleCreateTemplate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTplName.trim() || !newTplBody.trim()) return;

    const buttons = [
      { type: 'URL', text: newTplButtonText, url: newTplButtonUrl },
      { type: 'QUICK_REPLY', text: 'Contact Us' },
    ];

    const newTpl: WhatsAppTemplate = {
      id: 'wa_' + Date.now(),
      name: newTplName.trim(),
      category: newTplCategory,
      content: newTplBody.trim(),
      metaHeader: newTplHeader.trim() || undefined,
      metaFooter: newTplFooter.trim() || undefined,
      metaButtons: JSON.stringify(buttons),
    };

    setTemplates([newTpl, ...templates]);
    setSelectedTemplate(newTpl);
    setIsCreateOpen(false);
    setNewTplName('');
    setNewTplHeader('');
    setNewTplBody('');
    setNewTplFooter('');
  };

  const parsedButtons = selectedTemplate.metaButtons
    ? JSON.parse(selectedTemplate.metaButtons)
    : [];

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="WhatsApp Business Suite"
        subtitle="Meta Cloud API • Verified Templates & Interactive Call-To-Action Broadcasts"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header Banner */}
          <div className="p-6 rounded-3xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-xl shadow-emerald-600/15 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-white/20 text-white text-xs font-bold">
                <MessageSquare className="w-3.5 h-3.5" />
                <span>WhatsApp Cloud PaaS</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight">
                WhatsApp Business Messaging Suite
              </h1>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-xl">
                Deploy rich media templates, dynamic variables, and one-click quick-reply CTA buttons with direct inbox sync.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsCreateOpen(true)}
                className="px-4 py-2.5 rounded-xl bg-white text-emerald-700 font-bold text-xs hover:bg-emerald-50 shadow-md transition-all flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                <span>New WhatsApp Template</span>
              </button>
            </div>
          </div>

          {/* Metric Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">WhatsApp Broadcasts Sent</p>
              <p className="text-2xl font-black text-[var(--text-heading)] mt-1">8,420</p>
              <span className="text-[11px] font-bold text-emerald-600">99.8% Delivered</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Read Receipt Rate</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">97.4%</p>
              <span className="text-[11px] text-[var(--text-muted)]">Within 15 minutes</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">CTA Button Click Rate</p>
              <p className="text-2xl font-black text-blue-500 mt-1">31.2%</p>
              <span className="text-[11px] text-[var(--text-muted)]">High conversion engagement</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Verified Templates</p>
              <p className="text-2xl font-black text-[var(--text-heading)] mt-1">{templates.length}</p>
              <span className="text-[11px] text-emerald-600 font-bold">100% Meta Approved</span>
            </div>
          </div>

          {/* Tab Navigation */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <button
              onClick={() => setActiveTab('simulator')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'simulator'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Interactive Live Phone Simulator
            </button>
            <button
              onClick={() => setActiveTab('templates')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'templates'
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200/80 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Template Catalog ({templates.length})
            </button>
          </div>

          {/* Interactive Live Simulator View */}
          {activeTab === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Template Controls & Dispatch Form */}
              <div className="lg:col-span-7 space-y-5">
                <div className="zs-card p-6">
                  <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Select Template to Preview & Test</h2>
                  <p className="text-xs text-[var(--text-muted)] mb-4">Choose from verified business templates and customize test recipient parameters.</p>

                  <div className="space-y-3 mb-6">
                    {templates.map((tpl) => (
                      <div
                        key={tpl.id}
                        onClick={() => setSelectedTemplate(tpl)}
                        className={`p-3.5 rounded-2xl border cursor-pointer transition-all flex items-center justify-between ${
                          selectedTemplate.id === tpl.id
                            ? 'border-emerald-500 bg-emerald-50/50 shadow-xs'
                            : 'border-[var(--border-color)] hover:border-emerald-300 bg-[var(--bg-card)]'
                        }`}
                      >
                        <div className="min-w-0 pr-3">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-[var(--text-heading)]">{tpl.name}</span>
                            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                              {tpl.category}
                            </span>
                          </div>
                          <p className="text-xs text-[var(--text-muted)] truncate mt-1">{tpl.content}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          {selectedTemplate.id === tpl.id && (
                            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 flex-shrink-0" />
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Dispatch Parameters */}
                  <form onSubmit={handleTestSend} className="space-y-4 pt-4 border-t border-[var(--border-color)]">
                    <h3 className="text-xs font-bold text-[var(--text-secondary)] uppercase tracking-wider">
                      Live Test Dispatch
                    </h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                          Test Contact Name (Variable {'{{name}}'})
                        </label>
                        <input
                          type="text"
                          value={testName}
                          onChange={(e) => setTestName(e.target.value)}
                          className="zs-input text-xs"
                          placeholder="e.g. Alexander"
                          required
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                          Destination Phone Number
                        </label>
                        <input
                          type="text"
                          value={testPhone}
                          onChange={(e) => setTestPhone(e.target.value)}
                          className="zs-input text-xs font-mono"
                          placeholder="+14155552671"
                          required
                        />
                      </div>
                    </div>

                    {sendResult && (
                      <div className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
                        sendResult.success
                          ? 'bg-emerald-50 border border-emerald-200 text-emerald-800'
                          : 'bg-red-50 border border-red-200 text-red-800'
                      }`}>
                        {sendResult.success ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                            <span>WhatsApp message delivered successfully! Recorded in central Inbox.</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0" />
                            <span>Error: {sendResult.error}</span>
                          </>
                        )}
                      </div>
                    )}

                    <div className="flex items-center justify-between pt-2">
                      <Link
                        href="/inbox"
                        className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                      >
                        <span>Open in WhatsApp Inbox</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>

                      <button
                        type="submit"
                        disabled={sending}
                        className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-bold text-xs shadow-md shadow-emerald-600/25 hover:from-emerald-500 hover:to-teal-500 flex items-center gap-2 cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{sending ? 'Sending to WhatsApp...' : 'Dispatch Live Message'}</span>
                      </button>
                    </div>
                  </form>
                </div>
              </div>

              {/* Realistic WhatsApp Phone Simulator */}
              <div className="lg:col-span-5 flex justify-center">
                <div className="w-[340px] h-[640px] bg-slate-900 rounded-[42px] p-3 shadow-2xl border-4 border-slate-700 relative flex flex-col overflow-hidden">
                  {/* Phone Notch */}
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-36 h-5 bg-slate-900 rounded-b-2xl z-30" />

                  {/* Phone Screen */}
                  <div className="flex-1 bg-[#efeae2] rounded-[32px] overflow-hidden flex flex-col relative">
                    {/* WhatsApp Header */}
                    <div className="bg-[#075e54] text-white px-4 py-3 pt-6 flex items-center justify-between shadow-xs">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-white text-emerald-800 font-bold flex items-center justify-center text-xs">
                          ZT
                        </div>
                        <div>
                          <div className="flex items-center gap-1">
                            <p className="text-xs font-bold leading-tight">ZenithTech Cloud</p>
                            <CheckCircle2 className="w-3 h-3 text-emerald-300 fill-emerald-300" />
                          </div>
                          <p className="text-[10px] text-emerald-100">Official Business Account</p>
                        </div>
                      </div>
                    </div>

                    {/* Chat Stream (Subtle Doodle Pattern) */}
                    <div className="flex-1 p-3 overflow-y-auto space-y-3">
                      {/* Date Pill */}
                      <div className="flex justify-center my-2">
                        <span className="text-[10px] bg-white/80 text-slate-600 px-2.5 py-0.5 rounded-full shadow-2xs font-medium">
                          TODAY
                        </span>
                      </div>

                      {/* WhatsApp Business Chat Bubble */}
                      <div className="max-w-[92%] ml-auto bg-[#dcf8c6] rounded-2xl rounded-tr-xs p-3 shadow-xs text-slate-800 space-y-2 border border-emerald-100">
                        {/* Header */}
                        {selectedTemplate.metaHeader && (
                          <p className="text-xs font-extrabold text-[#075e54] border-b border-emerald-200/60 pb-1">
                            {selectedTemplate.metaHeader}
                          </p>
                        )}

                        {/* Body */}
                        <p className="text-xs leading-relaxed">
                          {selectedTemplate.content.replace(/\{\{name\}\}/gi, testName || 'Customer')}
                        </p>

                        {/* Footer */}
                        {selectedTemplate.metaFooter && (
                          <p className="text-[10px] text-slate-500 pt-1">
                            {selectedTemplate.metaFooter}
                          </p>
                        )}

                        {/* Timestamp & Double Blue Checkmark */}
                        <div className="flex items-center justify-end gap-1 pt-1 text-[10px] text-slate-500">
                          <span>10:42 AM</span>
                          <CheckCheck className="w-3.5 h-3.5 text-blue-500" />
                        </div>
                      </div>

                      {/* Interactive WhatsApp Action Buttons */}
                      {parsedButtons.length > 0 && (
                        <div className="max-w-[92%] ml-auto space-y-1.5 pt-1">
                          {parsedButtons.map((btn: any, idx: number) => (
                            <div
                              key={idx}
                              className="bg-white rounded-xl py-2 px-3 text-center text-xs font-bold text-[#00a884] shadow-xs border border-emerald-100 flex items-center justify-center gap-1.5 hover:bg-emerald-50 transition-colors"
                            >
                              {btn.type === 'URL' ? <ExternalLink className="w-3.5 h-3.5" /> : <MessageSquare className="w-3.5 h-3.5" />}
                              <span>{btn.text}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Bottom WhatsApp Chat Input Bar */}
                    <div className="bg-[#f0f2f5] px-3 py-2 flex items-center gap-2 border-t border-slate-200">
                      <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-slate-400 border border-slate-200">
                        Message
                      </div>
                      <div className="w-8 h-8 rounded-full bg-[#00a884] text-white flex items-center justify-center shadow-xs">
                        <Send className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Templates Catalog Tab */}
          {activeTab === 'templates' && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((tpl) => (
                <div key={tpl.id} className="zs-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--text-heading)]">{tpl.name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                        {tpl.category}
                      </span>
                    </div>
                    {tpl.metaHeader && (
                      <p className="text-xs font-semibold text-emerald-800 mb-1">{tpl.metaHeader}</p>
                    )}
                    <p className="text-xs text-[var(--text-secondary)] leading-relaxed mb-3">{tpl.content}</p>
                    {tpl.metaFooter && (
                      <p className="text-[10px] text-[var(--text-muted)] italic">{tpl.metaFooter}</p>
                    )}
                  </div>

                  <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between mt-4">
                    <button
                      onClick={() => {
                        setSelectedTemplate(tpl);
                        setActiveTab('simulator');
                      }}
                      className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1"
                    >
                      <span>Preview in Phone</span>
                      <Smartphone className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTemplates(templates.filter((t) => t.id !== tpl.id))}
                      className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors"
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

      {/* New Template Modal */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Create Verified WhatsApp Template</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Compliant with Meta WhatsApp Cloud API standards</p>

            <form onSubmit={handleCreateTemplate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Template Name</label>
                <input
                  type="text"
                  value={newTplName}
                  onChange={(e) => setNewTplName(e.target.value)}
                  placeholder="e.g. shipping_notification"
                  className="zs-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                <select
                  value={newTplCategory}
                  onChange={(e) => setNewTplCategory(e.target.value)}
                  className="zs-input text-xs"
                >
                  <option value="Marketing">Marketing Broadcast</option>
                  <option value="Transactional">Transactional Alert</option>
                  <option value="Utility">Utility Reminder</option>
                  <option value="Authentication">Authentication OTP</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Header (Optional)</label>
                <input
                  type="text"
                  value={newTplHeader}
                  onChange={(e) => setNewTplHeader(e.target.value)}
                  placeholder="e.g. Order Update"
                  className="zs-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Message Body</label>
                <textarea
                  rows={3}
                  value={newTplBody}
                  onChange={(e) => setNewTplBody(e.target.value)}
                  placeholder="Use {{name}} for customer name..."
                  className="zs-input text-xs resize-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Footer Text (Optional)</label>
                <input
                  type="text"
                  value={newTplFooter}
                  onChange={(e) => setNewTplFooter(e.target.value)}
                  placeholder="e.g. ZenithTech PaaS • Reply STOP"
                  className="zs-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">CTA Button Text</label>
                  <input
                    type="text"
                    value={newTplButtonText}
                    onChange={(e) => setNewTplButtonText(e.target.value)}
                    className="zs-input text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">CTA Button URL</label>
                  <input
                    type="url"
                    value={newTplButtonUrl}
                    onChange={(e) => setNewTplButtonUrl(e.target.value)}
                    className="zs-input text-xs"
                  />
                </div>
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
                  className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md"
                >
                  Save Template
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
