'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getTemplates, createTemplate, deleteTemplate } from '@/lib/db-actions';
import { FileText, Plus, Trash2, Tag, Copy, Sparkles, AlertCircle } from 'lucide-react';

export default function TemplatesPage() {
  const [templates, setTemplates] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Promotions');
  const [content, setContent] = useState('');

  const loadTemplates = useCallback(async () => {
    setLoading(true);
    try {
      const list = await getTemplates();
      setTemplates(list);
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
    if (!name || !content) return;

    await createTemplate({ name, category, content });
    setName('');
    setContent('');
    setIsAddOpen(false);
    loadTemplates();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this template?')) return;
    await deleteTemplate(id);
    loadTemplates();
  };

  const insertTag = (tag: string) => {
    setContent((prev) => prev + tag);
  };

  const charCount = content.length;
  const segments = Math.ceil(charCount / 160) || 1;

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar onOpenQuickSend={() => setIsQuickSendOpen(true)} />
      <Topbar
        title="SMS Templates"
        subtitle="Reusable message templates with dynamic variable tags"
        dbConnected={true}
      />

      <main className="ml-64 pt-20 p-8 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Template Library</h2>
            <p className="text-xs text-[#94a3b8]">Stored in PostgreSQL database for fast campaign assembly.</p>
          </div>
          <button
            onClick={() => setIsAddOpen(true)}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Create Template</span>
          </button>
        </div>

        {templates.length === 0 ? (
          <div className="p-12 border border-dashed border-[#6366f1]/20 rounded-2xl bg-[#0f1129] text-center flex flex-col items-center justify-center">
            <FileText className="w-12 h-12 text-[#94a3b8] mb-3 opacity-50" />
            <p className="text-base font-bold text-white">No Templates Found</p>
            <p className="text-xs text-[#94a3b8] max-w-sm mt-1 mb-5">
              Create message templates with tags like {'{{name}}'} to speed up bulk broadcasts.
            </p>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-5 py-2.5 rounded-xl bg-[#6366f1] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Create First Template</span>
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((tpl) => {
              const count = tpl.content.length;
              const segs = Math.ceil(count / 160) || 1;

              return (
                <div
                  key={tpl.id}
                  className="p-5 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 flex flex-col justify-between space-y-4 hover:border-[#6366f1]/40 transition-all shadow-lg"
                >
                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30">
                        {tpl.category}
                      </span>
                      <button
                        onClick={() => handleDelete(tpl.id)}
                        className="p-1 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/15 transition-all cursor-pointer"
                        title="Delete template"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                    <h3 className="text-sm font-bold text-white">{tpl.name}</h3>
                    <p className="text-xs text-[#94a3b8] bg-[#0d0f26] p-3 rounded-xl border border-[#6366f1]/15 font-mono leading-relaxed">
                      {tpl.content}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#94a3b8] pt-2 border-t border-[#6366f1]/15">
                    <span>{count} chars</span>
                    <span className="text-[#06b6d4] font-medium">{segs} {segs === 1 ? 'segment' : 'segments'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* Add Template Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f1129] border border-[#6366f1]/30 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Create SMS Template</h3>

            <form onSubmit={handleCreate} className="space-y-3">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Template Name</label>
                <input
                  type="text"
                  placeholder="e.g. Welcome Onboarding"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Category</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="Onboarding">Onboarding</option>
                  <option value="Promotions">Promotions</option>
                  <option value="Transactional">Transactional</option>
                  <option value="Reminders">Reminders</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="text-xs text-[#94a3b8]">Message Body</label>
                  <span className="text-[11px] text-[#818cf8]">
                    {charCount} chars • {segments} segment(s)
                  </span>
                </div>
                <textarea
                  rows={4}
                  placeholder="Hi {{name}}, welcome to our platform! Use code {{code}} for 20% off. Reply STOP to opt out."
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-[#6366f1] resize-none"
                  required
                />
              </div>

              <div>
                <span className="text-[11px] text-[#94a3b8] block mb-1">Insert Dynamic Variable:</span>
                <div className="flex gap-2">
                  {['{{name}}', '{{phone}}', '{{code}}', '{{link}}'].map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => insertTag(tag)}
                      className="px-2.5 py-1 rounded-lg bg-[#181a35] hover:bg-[#6366f1]/20 border border-[#6366f1]/20 text-[11px] text-[#818cf8] cursor-pointer"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs text-[#94a3b8] hover:bg-[#181a35] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#6366f1] text-white text-xs font-semibold cursor-pointer shadow-lg shadow-indigo-600/30"
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
        onSuccess={loadTemplates}
      />
    </div>
  );
}
