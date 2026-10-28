'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getTemplates, createTemplate, deleteTemplate } from '@/lib/db-actions';
import {
  FileText, Plus, Trash2, Tag, Copy, Sparkles, AlertCircle,
  X, Check, Search, Filter, MessageSquare, Send
} from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('All');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Promotions');
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

    await createTemplate({ name: name.trim(), category, content: content.trim() });
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

  const categories = ['All', 'Promotions', 'Onboarding', 'Transactional', 'Reminders'];

  const filtered = templates.filter((tpl) => {
    const matchCat = selectedCat === 'All' || tpl.category?.toLowerCase() === selectedCat.toLowerCase();
    const matchSearch = tpl.name?.toLowerCase().includes(search.toLowerCase()) ||
      tpl.content?.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const charCount = content.length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        orgName="ZenithServices"
        planName="Starter"
        userRole="SUPER_ADMIN"
        balance={0}
      />
      <Topbar
        title="Message Templates"
        subtitle="Dynamic message library with personalization tags for SMS, WhatsApp & Email"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">Template Library</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Reusable templates stored in PostgreSQL for automated broadcast assembly
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="zs-btn-primary self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>
          </div>

          {/* Search & Category Filter */}
          <div className="zs-card p-3 sm:p-4 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
              <input
                type="text"
                placeholder="Search templates…"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="zs-input pl-9.5 text-xs sm:text-sm py-2"
              />
            </div>

            <div className="zs-tab-list overflow-x-auto self-start sm:self-auto">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCat(cat)}
                  className={`zs-tab text-xs ${selectedCat === cat ? 'active' : ''}`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>

          {/* Templates Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="zs-card p-5 h-48 skeleton" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="zs-card p-12 text-center flex flex-col items-center justify-center border-dashed">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                <FileText className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-[var(--text-heading)]">No Templates Found</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 mb-5">
                Create reusable message templates with dynamic tags like {'{{name}}'} to speed up your bulk broadcasts.
              </p>
              <button
                onClick={() => setIsAddOpen(true)}
                className="zs-btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Create First Template</span>
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filtered.map((tpl) => {
                const count = tpl.content.length;
                const segs = Math.ceil(count / 160) || 1;
                const isCopied = copiedId === tpl.id;

                return (
                  <div
                    key={tpl.id}
                    className="zs-card p-5 flex flex-col justify-between space-y-4 hover:border-indigo-300 transition-all shadow-xs hover:shadow-md animate-fade-in"
                  >
                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-700 border border-indigo-100">
                          {tpl.category}
                        </span>
                        <div className="flex items-center gap-1">
                          <button
                            onClick={() => handleCopy(tpl.id, tpl.content)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-indigo-600 hover:bg-indigo-50 transition-all cursor-pointer"
                            title="Copy message content"
                          >
                            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            onClick={() => handleDelete(tpl.id)}
                            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                            title="Delete template"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h3 className="text-sm font-bold text-[var(--text-heading)]">{tpl.name}</h3>

                      <div className="p-3 rounded-xl bg-[var(--bg-elevated)] text-xs text-[var(--text-primary)] border border-[var(--border-subtle)] font-mono leading-relaxed whitespace-pre-wrap">
                        {tpl.content}
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-[var(--text-muted)] pt-3 border-t border-[var(--border-subtle)]">
                      <span className="font-medium">{count} characters</span>
                      <span className="text-indigo-600 font-semibold">{segs} {segs === 1 ? 'segment' : 'segments'}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

        </div>
      </main>

      {/* Add Template Modal */}
      {isAddOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-lg">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <FileText className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Create Message Template</h3>
                <p className="text-xs text-[var(--text-muted)]">Saved in PostgreSQL for fast campaign assembly</p>
              </div>
            </div>

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. VIP Welcome Onboarding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="Promotions">Promotions</option>
                  <option value="Onboarding">Onboarding</option>
                  <option value="Transactional">Transactional</option>
                  <option value="Reminders">Reminders</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">Message Body</label>
                  <span className="text-[11px] font-medium text-indigo-600">
                    {charCount} chars • {segments} segment{segments > 1 ? 's' : ''}
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Hi {{name}}, welcome to our platform! Use code {{code}} for 20% off. Reply STOP to opt out."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="zs-input resize-none"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1.5">Insert Dynamic Tag:</span>
                <div className="flex flex-wrap gap-1.5">
                  {['{{name}}', '{{phone}}', '{{code}}', '{{link}}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTag(tag)}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-indigo-50 border border-[var(--border-subtle)] hover:border-indigo-200 text-xs font-mono font-medium text-indigo-600 transition-all cursor-pointer"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary"
                >
                  <Plus className="w-4 h-4" />
                  <span>Save Template</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadTemplates}
      />
    </div>
  );
}
