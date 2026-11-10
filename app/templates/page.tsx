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
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
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
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="vision-btn-primary text-xs py-2 px-3.5 shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>New Template</span>
          </button>
        }
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">

        {/* Hero Banner */}
        <div className="vision-hero-card p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-xs font-bold mb-1">
              <FileText className="w-3.5 h-3.5" />
              <span>Omnichannel Template Assets</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Template Catalog &amp; Personalization
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Standardize outbound communication with pre-approved templates and dynamic personalization tags for SMS, WhatsApp &amp; Email.
            </p>
          </div>

          <div className="relative z-10">
            <button
              onClick={() => setIsAddOpen(true)}
              className="vision-btn-primary text-xs py-2.5 px-4 w-full sm:w-auto flex items-center justify-center gap-2 cursor-pointer shadow-lg"
            >
              <Plus className="w-4 h-4" />
              <span>Create New Template</span>
            </button>
          </div>
        </div>

        {/* Filter Toolbar */}
        <div className="vision-card p-4 sm:p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto text-xs pb-1 sm:pb-0 no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCat(cat)}
                className={`px-3.5 py-1.5 rounded-xl font-bold whitespace-nowrap transition-all cursor-pointer ${
                  selectedCat === cat
                    ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(0,117,255,0.6)]'
                    : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          <div className="relative w-full md:w-64">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search templates..."
              className="vision-input text-xs"
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filtered.length === 0 ? (
            <div className="col-span-full vision-card p-12 text-center text-slate-400">
              <FileText className="w-10 h-10 mx-auto mb-2 opacity-30 text-blue-400" />
              <p className="font-bold text-white text-base">No templates found</p>
              <p className="text-xs mt-1">Click &quot;Create New Template&quot; to author your first reusable copy.</p>
            </div>
          ) : (
            filtered.map((tpl) => (
              <div key={tpl.id} className="vision-card p-5 space-y-3 flex flex-col justify-between">
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-blue-500/15 text-cyan-300 border border-blue-500/30">
                        {tpl.category || 'General'}
                      </span>
                      <h3 className="font-extrabold text-sm text-white mt-1.5">{tpl.name}</h3>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                      {tpl.channel || 'SMS'}
                    </span>
                  </div>

                  <p className="text-xs text-slate-300 font-mono bg-white/[0.02] p-3 rounded-xl border border-white/5 mt-3 leading-relaxed whitespace-pre-wrap">
                    {tpl.content}
                  </p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs">
                  <span className="text-[10px] text-slate-500 font-mono">
                    {tpl.content.length} chars • {Math.ceil(tpl.content.length / 160)} seg
                  </span>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleCopy(tpl.id, tpl.content)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-cyan-300 hover:bg-white/10 transition-colors"
                      title="Copy template"
                    >
                      {copiedId === tpl.id ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                    </button>
                    <button
                      onClick={() => handleDelete(tpl.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete template"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

      </main>

      {/* Create Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="vision-card w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Create New Template</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Template Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Account Security OTP Alert"
                  className="vision-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="vision-input text-xs bg-[#0b1437]"
                  >
                    <option value="Marketing">Marketing</option>
                    <option value="Transactional">Transactional</option>
                    <option value="Onboarding">Onboarding</option>
                    <option value="Utility">Utility</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Channel</label>
                  <select
                    value={channel}
                    onChange={(e) => setChannel(e.target.value)}
                    className="vision-input text-xs bg-[#0b1437]"
                  >
                    <option value="sms">SMS</option>
                    <option value="whatsapp">WhatsApp</option>
                    <option value="email">Email</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-300">Message Content</label>
                  <span className="text-[10px] text-slate-400 font-mono">
                    {charCount} / 160 ({segments} seg)
                  </span>
                </div>
                <textarea
                  rows={4}
                  required
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  placeholder="Hello {name}, your ZenithTech security passcode is {code}."
                  className="vision-input text-xs font-mono"
                />
              </div>

              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] text-slate-400 font-bold">Tags:</span>
                {['{name}', '{phone}', '{company}', '{code}'].map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => insertTag(t)}
                    className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/5 border border-white/10 text-cyan-300 hover:bg-white/10"
                  >
                    {t}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="vision-btn-glass text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vision-btn-primary text-xs py-2 px-4"
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
