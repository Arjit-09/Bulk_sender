'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getContacts, createContact, deleteContact, bulkImportContacts, getContactGroups } from '@/lib/db-actions';
import { Users, Plus, Upload, Search, Trash2, Phone, Mail, Tag, AlertCircle, CheckCircle2 } from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [groupName, setGroupName] = useState('VIP Customers');
  const [csvText, setCsvText] = useState('');
  const [formMsg, setFormMsg] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cList, gList] = await Promise.all([
        getContacts(search, selectedGroup),
        getContactGroups(),
      ]);
      setContacts(cList);
      setGroups(gList);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGroup]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    try {
      await createContact({ name, phone, email, groupName });
      setName('');
      setPhone('');
      setEmail('');
      setIsAddOpen(false);
      loadData();
    } catch (err: any) {
      setFormMsg(err.message || 'Error creating contact');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    // Parse simple CSV: Name, Phone, Email, Group
    const lines = csvText.split('\n');
    const parsed: Array<{ name: string; phone: string; email?: string; group?: string }> = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2 && parts[1]) {
        // Skip header row if present
        if (parts[0].toLowerCase() === 'name' || parts[1].toLowerCase() === 'phone') continue;
        parsed.push({
          name: parts[0],
          phone: parts[1],
          email: parts[2] || undefined,
          group: parts[3] || 'VIP Customers',
        });
      }
    }

    if (parsed.length === 0) {
      setFormMsg('No valid rows found. Format should be: Name, Phone, Email, Group');
      return;
    }

    try {
      await bulkImportContacts(parsed);
      setCsvText('');
      setIsImportOpen(false);
      loadData();
    } catch (err: any) {
      setFormMsg(err.message || 'Import failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    await deleteContact(id);
    loadData();
  };

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar onOpenQuickSend={() => setIsQuickSendOpen(true)} />
      <Topbar
        title="Contact Directory"
        subtitle="Manage phone numbers, groups, and CSV imports in PostgreSQL"
        dbConnected={true}
      />

      <main className="ml-64 pt-20 p-8 space-y-6">
        {/* Actions Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="w-4 h-4 text-[#94a3b8] absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search contacts by name, phone, email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#0f1129] border border-[#6366f1]/20 rounded-xl pl-10 pr-4 py-2 text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-[#6366f1]"
              />
            </div>
            <select
              value={selectedGroup}
              onChange={(e) => setSelectedGroup(e.target.value)}
              className="bg-[#0f1129] border border-[#6366f1]/20 rounded-xl px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="All">All Groups</option>
              {groups.map((g) => (
                <option key={g.id} value={g.name}>
                  {g.name} ({g._count?.contacts || 0})
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsImportOpen(true)}
              className="px-4 py-2 rounded-xl bg-[#12142e] border border-[#6366f1]/25 text-[#818cf8] hover:text-white hover:bg-[#181a35] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white text-xs font-semibold flex items-center gap-2 shadow-lg shadow-indigo-600/20 hover:scale-[1.02] transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Contacts Table */}
        <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-semibold text-white flex items-center gap-2">
                <Users className="w-4 h-4 text-[#818cf8]" />
                All Contacts ({contacts.length})
              </h3>
              <p className="text-xs text-[#94a3b8]">Stored securely in PostgreSQL database</p>
            </div>
          </div>

          {contacts.length === 0 ? (
            <div className="p-12 border border-dashed border-[#6366f1]/20 rounded-xl bg-[#12142e]/40 text-center flex flex-col items-center justify-center">
              <Users className="w-10 h-10 text-[#94a3b8] mb-2 opacity-50" />
              <p className="text-sm font-medium text-white">No Contacts Found</p>
              <p className="text-xs text-[#94a3b8] max-w-sm mt-1 mb-4">
                Add contacts manually or import your customer list via CSV to begin sending messages.
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#6366f1] text-white text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add First Contact</span>
                </button>
                <button
                  onClick={() => setIsImportOpen(true)}
                  className="px-4 py-2 rounded-xl bg-[#181a35] border border-[#6366f1]/20 text-[#818cf8] text-xs font-semibold flex items-center gap-2 cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>Import CSV Sample</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-[#6366f1]/15 text-[#94a3b8] font-medium uppercase tracking-wider">
                    <th className="pb-3">Name</th>
                    <th className="pb-3">Phone Number</th>
                    <th className="pb-3">Email Address</th>
                    <th className="pb-3">Group</th>
                    <th className="pb-3">Status</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#6366f1]/10 text-white">
                  {contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-[#181a35]/50 transition-colors">
                      <td className="py-3 font-semibold flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-[#6366f1]/20 text-[#818cf8] flex items-center justify-center font-bold text-[11px]">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <span>{c.name}</span>
                      </td>
                      <td className="py-3 text-[#94a3b8]">
                        <span className="flex items-center gap-1.5">
                          <Phone className="w-3 h-3 text-[#06b6d4]" />
                          {c.phone}
                        </span>
                      </td>
                      <td className="py-3 text-[#94a3b8]">
                        {c.email ? (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3 h-3 text-[#94a3b8]" />
                            {c.email}
                          </span>
                        ) : (
                          <span className="text-[#475569]">—</span>
                        )}
                      </td>
                      <td className="py-3">
                        <span className="px-2.5 py-1 rounded-full text-[10px] font-semibold bg-[#6366f1]/15 text-[#818cf8] border border-[#6366f1]/30 flex items-center gap-1 w-fit">
                          <Tag className="w-2.5 h-2.5" />
                          {c.group?.name || 'General'}
                        </span>
                      </td>
                      <td className="py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#10b981]/15 text-[#34d399] border border-[#10b981]/30">
                          {c.status}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg text-[#ef4444] hover:bg-[#ef4444]/15 transition-all cursor-pointer"
                          title="Delete contact"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>

      {/* Add Contact Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-md rounded-2xl bg-[#0f1129] border border-[#6366f1]/30 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Add New Contact</h3>
            {formMsg && <p className="text-xs text-[#ef4444]">{formMsg}</p>}
            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. John Doe"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Phone Number (E.164)</label>
                <input
                  type="text"
                  placeholder="+12025550143"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                  required
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Email (Optional)</label>
                <input
                  type="email"
                  placeholder="john@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                />
              </div>
              <div>
                <label className="block text-xs text-[#94a3b8] mb-1">Group / Tag</label>
                <input
                  type="text"
                  placeholder="VIP Customers, Newsletter, etc."
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-[#6366f1]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-3.5 py-1.5 rounded-xl text-xs text-[#94a3b8] hover:bg-[#181a35] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 rounded-xl bg-[#6366f1] text-white text-xs font-semibold cursor-pointer"
                >
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Import CSV Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-[#0f1129] border border-[#6366f1]/30 p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white">Import Contacts from CSV</h3>
            <p className="text-xs text-[#94a3b8]">
              Paste CSV text formatted as: <code>Name, Phone, Email, Group</code>
            </p>
            {formMsg && <p className="text-xs text-[#ef4444]">{formMsg}</p>}
            <form onSubmit={handleBulkImport} className="space-y-3">
              <textarea
                rows={6}
                placeholder={`Alice Johnson, +12025550143, alice@example.com, VIP Customers\nBob Martinez, +12025550187, bob@example.com, Newsletter\nCarol Williams, +12025550192, carol@example.com, Prospects`}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl p-3 text-xs font-mono text-white focus:outline-none focus:border-[#6366f1] resize-none"
                required
              />
              <div className="flex justify-between items-center pt-2">
                <button
                  type="button"
                  onClick={() => {
                    setCsvText(
                      `Alice Johnson, +12025550143, alice@example.com, VIP Customers\nBob Martinez, +12025550187, bob@example.com, Newsletter\nCarol Williams, +12025550192, carol@example.com, Prospects\nDavid Lee, +12025550124, david@example.com, VIP Customers\nEva Brown, +12025550165, eva@example.com, Newsletter`
                    );
                  }}
                  className="text-xs text-[#818cf8] hover:underline cursor-pointer"
                >
                  Load Sample CSV Rows
                </button>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => setIsImportOpen(false)}
                    className="px-3.5 py-1.5 rounded-xl text-xs text-[#94a3b8] hover:bg-[#181a35] cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-1.5 rounded-xl bg-[#6366f1] text-white text-xs font-semibold cursor-pointer"
                  >
                    Import to PostgreSQL
                  </button>
                </div>
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
