'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getTemplates, createTemplate, deleteTemplate } from '@/lib/db-actions';
import {
  FileText, Plus, Trash2, Tag, Copy, Sparkles, AlertCircle,
  X, Check, Search, Filter, MessageSquare, Send, Mail
} from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [selectedChannel, setSelectedChannel] = useState('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Promotions');
  const [channel, setChannel] = useState('sms');
  const [content, setContent] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getTemplates();
      setTemplates(list || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !content.trim()) return;

    await createTemplate({
      name: name.trim(),
      category,
      channel,
      content: content.trim(),
    });
    setName('');
    setContent('');
    setIsAddOpen(false);
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    await deleteTemplate(id);
    loadTemplates();
  };

  const insertTag = (tag: string) => {
    setContent((prev) => prev + tag);
  };

  const handleCopy = (id: string, text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const categories = ['All', 'Marketing', 'Transactional', 'Onboarding', 'Utility'];

  const filtered = templates.filter((tpl) => {
    const matchCat = selectedCat === 'All' || tpl.category?.toLowerCase() === selectedCat.toLowerCase();
    const matchChannel = selectedChannel === 'all' || (tpl.channel || 'sms') === selectedChannel;
    const matchSearch =
      tpl.name?.toLowerCase().includes(search.toLowerCase()) ||
      tpl.content?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchChannel && matchSearch;
  });

  const charCount = content.length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
      />
      <Topbar
        title="Message Templates"
        subtitle="Dynamic omnichannel template catalog for SMS, WhatsApp & Email"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold mb-2">
                <FileText className="w-3.5 h-3.5 text-blue-400" />
                <span>Omnichannel Template Assets</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Template Catalog</h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Standardize outbound communication with pre-approved templates and dynamic personalization tags.
              </p>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="zs-btn-primary shadow-md text-xs py-2.5 px-4 cursor-pointer self-start sm:self-auto flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>
          </div>

          {/* Filter Bar */}
          <div className="zs-card p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 sm:pb-0">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedCat === cat
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>

            <div className="relative w-full md:w-64">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search templates..."
                className="zs-input pl-8 py-1.5 text-xs"
              />
            </div>
          </div>

          {/* Templates Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((tpl) => {
              const isWA = tpl.channel === 'whatsapp';
              const isEmail = tpl.channel === 'email';

              return (
                <div key={tpl.id} className="zs-card p-5 flex flex-col justify-between">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-[var(--text-heading)]">{tpl.name}</span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        isWA
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : isEmail
                          ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/20'
                          : 'bg-blue-500/10 text-blue-500 border border-blue-500/20'
                      }`}>
                        {tpl.channel?.toUpperCase() || 'SMS'}
                      </span>
                    </div>

                    <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs text-[var(--text-secondary)] leading-relaxed font-mono">
                      {tpl.content}
                    </div>
                  </div>

                  <div className="pt-4 border-t border-[var(--border-color)] flex items-center justify-between mt-4">
                    <button
                      onClick={() => handleCopy(tpl.id, tpl.content)}
                      className="text-xs font-bold text-blue-500 hover:text-blue-600 flex items-center gap-1 cursor-pointer"
                    >
                      {copiedId === tpl.id ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedId === tpl.id ? 'Copied!' : 'Copy Content'}</span>
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

        </div>
      </main>

      {/* Add Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Create New Template</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Personalize with merge tags for instant dispatch</p>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Template Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. order_shipped_sms"
                  className="zs-input text-xs"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="zs-input text-xs"
                  >
                    <option value="sms">SMS (Telnyx)</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="zs-input text-xs"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Transactional">Transactional</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Utility">Utility</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Template Body</label>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => insertTag('{{name}}')}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    >
                      + {'{{name}}'}
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTag('{{phone}}')}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20"
                    >
                      + {'{{phone}}'}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hello {{name}}, your order has shipped!..."
                  className="zs-input text-xs resize-none"
                  required
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="zs-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary text-xs py-2 px-5"
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
