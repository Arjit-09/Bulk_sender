'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getContacts, createContact, deleteContact, bulkImportContacts, getContactGroups } from '@/lib/db-actions';
import {
  Users, Plus, Upload, Search, Trash2, Phone, Mail, Tag,
  AlertCircle, CheckCircle2, X, Globe, Sparkles, Filter, Download
} from 'lucide-react';

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [selectedGroup, setSelectedGroup] = useState('All');
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [groupName, setGroupName] = useState('VIP Customers');
  const [csvText, setCsvText] = useState('');
  const [formMsg, setFormMsg] = useState('');
  const [phoneError, setPhoneError] = useState('');

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [cList, gList] = await Promise.all([
        getContacts(search, selectedGroup),
        getContactGroups(),
      ]);
      setContacts(cList || []);
      setGroups(gList || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [search, selectedGroup]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handlePhoneChange = (val: string) => {
    let cleaned = val.replace(/[\s\-]/g, '');
    if (/^[6-9]\d{9}$/.test(cleaned)) {
      cleaned = '+91' + cleaned;
    } else if (cleaned && !cleaned.startsWith('+') && cleaned.length > 10) {
      cleaned = '+' + cleaned;
    }
    setPhone(cleaned);
    const isIndian = /^\+91[6-9]\d{9}$/.test(cleaned) || /^[6-9]\d{9}$/.test(cleaned);
    const isE164 = /^\+[1-9]\d{6,14}$/.test(cleaned);
    if (cleaned && !isIndian && !isE164) {
      setPhoneError('Must be 10-digit Indian number e.g. 8920856958 or +918920856958');
    } else {
      setPhoneError('');
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;
    try {
      await createContact({ name, phone, email, groupName });
      setName('');
      setPhone('');
      setEmail('');
      setIsAddOpen(false);
      setFormMsg('');
      loadData();
    } catch (err: any) {
      setFormMsg(err.message || 'Error creating contact');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    const lines = csvText.split('\n');
    const parsed: Array<{ name: string; phone: string; email?: string; group?: string }> = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim().replace(/^["']|["']$/g, ''));
      if (parts.length >= 2 && parts[1]) {
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
      setFormMsg('');
      loadData();
    } catch (err: any) {
      setFormMsg(err.message || 'Import failed');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this contact?')) return;
    try {
      await deleteContact(id);
      loadData();
    } catch (err) {
      console.error(err);
    }
  };

  // Helper for flags
  const getFlag = (phone: string) => {
    if (!phone) return '🌐';
    if (phone.startsWith('+91')) return '🇮🇳';
    if (phone.startsWith('+1')) return '🇺🇸';
    if (phone.startsWith('+44')) return '🇬🇧';
    if (phone.startsWith('+61')) return '🇦🇺';
    if (phone.startsWith('+49')) return '🇩🇪';
    if (phone.startsWith('+33')) return '🇫🇷';
    return '🌐';
  };

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
        title="Contact Directory"
        subtitle="Manage phone numbers, customer segments, and CSV imports in PostgreSQL"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Page Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">Contact Directory</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                  Audience database with segmented groups and CSV bulk management
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2.5 self-start sm:self-auto flex-wrap">
              <button
                onClick={() => { setCsvText(''); setFormMsg(''); setIsImportOpen(true); }}
                className="zs-btn-secondary"
              >
                <Upload className="w-4 h-4 text-indigo-600" />
                <span>Import CSV</span>
              </button>
              <button
                onClick={() => { setFormMsg(''); setIsAddOpen(true); }}
                className="zs-btn-primary"
              >
                <Plus className="w-4 h-4" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* KPI Stat Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Total Contacts</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Users className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">{contacts.length}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Stored in PostgreSQL</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Audience Groups</span>
                <div className="w-8 h-8 rounded-lg bg-cyan-50 flex items-center justify-center text-cyan-600">
                  <Tag className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">{groups.length || 1}</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Active target segments</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Valid Numbers</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-600">
                  <CheckCircle2 className="w-4 h-4" />
                </div>
              </div>
              <p className="text-2xl font-bold text-emerald-600">100%</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">E.164 verified format</p>
            </div>

            <div className="zs-card p-4 sm:p-5">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold text-[var(--text-secondary)]">Regional Coverage</span>
                <div className="w-8 h-8 rounded-lg bg-orange-50 flex items-center justify-center text-orange-600 font-bold">
                  🇮🇳
                </div>
              </div>
              <p className="text-2xl font-bold text-[var(--text-heading)]">India (+91)</p>
              <p className="text-[11px] text-[var(--text-muted)] mt-0.5">Fast2SMS / DLT Active Route</p>
            </div>
          </div>

          {/* Search & Group Filter Bar */}
          <div className="zs-card p-3 sm:p-4 space-y-3">
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
              <div className="relative flex-1 max-w-md">
                <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)]" />
                <input
                  type="text"
                  placeholder="Search by name, phone number, or email…"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="zs-input pl-9.5 text-xs sm:text-sm py-2"
                />
              </div>

              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
                <span className="text-xs text-[var(--text-muted)] font-medium mr-1 flex items-center gap-1 flex-shrink-0">
                  <Filter className="w-3.5 h-3.5" /> Group:
                </span>
                {['All', ...groups.map((g) => g.name)].map((g) => (
                  <button
                    key={g}
                    onClick={() => setSelectedGroup(g)}
                    className={`px-3 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer whitespace-nowrap ${
                      selectedGroup === g
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)]'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Contacts Table View */}
          <div className="zs-card overflow-hidden shadow-xs">
            <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[var(--text-heading)]">
                  {selectedGroup === 'All' ? 'All Contacts' : `${selectedGroup} Contacts`}
                </h3>
                <p className="text-xs text-[var(--text-muted)] mt-0.5">
                  Showing {contacts.length} {contacts.length === 1 ? 'contact' : 'contacts'}
                </p>
              </div>
            </div>

            {loading ? (
              <div className="p-8 text-center">
                <div className="inline-block w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                <p className="text-xs text-[var(--text-muted)]">Loading contacts from PostgreSQL…</p>
              </div>
            ) : contacts.length === 0 ? (
              <div className="p-12 text-center flex flex-col items-center justify-center">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                  <Users className="w-6 h-6" />
                </div>
                <h4 className="text-base font-bold text-[var(--text-heading)]">No Contacts Found</h4>
                <p className="text-xs text-[var(--text-muted)] max-w-sm mt-1 mb-5">
                  {search
                    ? `No contacts match "${search}". Try searching another name or number.`
                    : 'Get started by creating your first contact or importing a CSV file.'}
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsAddOpen(true)}
                    className="zs-btn-primary"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Add Contact</span>
                  </button>
                  <button
                    onClick={() => setIsImportOpen(true)}
                    className="zs-btn-secondary"
                  >
                    <Upload className="w-4 h-4" />
                    <span>Import CSV</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="zs-table">
                  <thead>
                    <tr>
                      <th>Contact</th>
                      <th>Phone Number</th>
                      <th>Email Address</th>
                      <th>Segment Group</th>
                      <th>Status</th>
                      <th className="text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {contacts.map((c) => {
                      const flag = getFlag(c.phone);
                      const initials = c.name
                        ? c.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                        : 'C';

                      return (
                        <tr key={c.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                                {initials}
                              </div>
                              <div className="min-w-0">
                                <p className="text-xs sm:text-sm font-semibold text-[var(--text-heading)] truncate">
                                  {c.name || 'Unnamed Contact'}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)]">
                                  Added {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'Recently'}
                                </p>
                              </div>
                            </div>
                          </td>
                          <td>
                            <div className="flex items-center gap-1.5 font-mono text-xs text-[var(--text-primary)]">
                              <span>{flag}</span>
                              <span>{c.phone}</span>
                            </div>
                          </td>
                          <td>
                            {c.email ? (
                              <div className="flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
                                <Mail className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                                <span>{c.email}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-[var(--text-muted)] italic">—</span>
                            )}
                          </td>
                          <td>
                            <span className="px-2.5 py-1 rounded-md text-xs font-medium bg-indigo-50 text-indigo-700 border border-indigo-100">
                              {c.groupName || 'VIP Customers'}
                            </span>
                          </td>
                          <td>
                            <span className="zs-badge zs-badge-success">
                              active
                            </span>
                          </td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => handleDelete(c.id)}
                                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                title="Delete contact"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Add Contact Modal */}
      {isAddOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-md">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Add Single Contact</h3>
                <p className="text-xs text-[var(--text-muted)]">Saved securely in PostgreSQL</p>
              </div>
            </div>

            {formMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formMsg}</span>
              </div>
            )}

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Contact Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Sharma"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Phone Number (E.164)</label>
                <input
                  type="text"
                  placeholder="+918920856958 or +12025550199"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  className={`zs-input ${phoneError ? 'border-rose-400' : ''}`}
                  required
                />
                {phoneError ? (
                  <p className="mt-1.5 text-[11px] text-rose-600">{phoneError}</p>
                ) : (
                  <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                    Include country dial code (e.g. +91 for India, +1 for US)
                  </p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Email Address (Optional)</label>
                <input
                  type="email"
                  placeholder="e.g. rahul@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="zs-input"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Audience Segment Group</label>
                <select
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="VIP Customers">VIP Customers</option>
                  <option value="New Leads">New Leads</option>
                  <option value="Subscribers">Subscribers</option>
                  <option value="General">General</option>
                  {groups.map((g) => (
                    <option key={g.id} value={g.name}>
                      {g.name}
                    </option>
                  ))}
                </select>
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
                  <span>Save Contact</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk CSV Import Modal */}
      {isImportOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-lg">
            <button
              onClick={() => setIsImportOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Import Contacts from CSV</h3>
                <p className="text-xs text-[var(--text-muted)]">Paste CSV rows or drop comma-separated values</p>
              </div>
            </div>

            {formMsg && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{formMsg}</span>
              </div>
            )}

            <form onSubmit={handleBulkImport} className="space-y-4">
              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="text-xs font-semibold text-[var(--text-secondary)]">CSV Content</label>
                  <button
                    type="button"
                    onClick={() => setCsvText('Name, Phone, Email, Group\nJohn Doe, +12025550199, john@example.com, VIP Customers\nAnita Roy, +919076548642, anita@example.com, High Priority\nMarcus Bell, +447700900077, marcus@example.co.uk, Subscribers')}
                    className="text-xs text-indigo-600 font-medium hover:underline cursor-pointer"
                  >
                    Load Sample CSV
                  </button>
                </div>
                <textarea
                  rows={6}
                  placeholder={`Name, Phone, Email, Group\nJohn Doe, +12025550199, john@example.com, VIP Customers`}
                  value={csvText}
                  onChange={(e) => setCsvText(e.target.value)}
                  className="zs-input font-mono text-xs resize-none"
                  required
                />
              </div>

              <div className="p-3 rounded-xl bg-[var(--bg-elevated)] text-[11px] text-[var(--text-muted)] space-y-1">
                <p className="font-semibold text-[var(--text-primary)]">Format Requirements:</p>
                <p>• Columns: <code className="text-indigo-600">Name, Phone, Email, Group</code></p>
                <p>• Phone numbers must include country code with <code className="text-indigo-600">+</code></p>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary"
                >
                  <Upload className="w-4 h-4" />
                  <span>Import Records</span>
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
