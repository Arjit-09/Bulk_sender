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
  const [groupName, setGroupName] = useState('US Verified Customers');
  const [country, setCountry] = useState('US');
  const [carrierType, setCarrierType] = useState('mobile');
  const [csvText, setCsvText] = useState('');
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
    let cleaned = val.replace(/[\s()\-.]/g, '');
    if (/^[2-9]\d{9}$/.test(cleaned)) {
      cleaned = '+1' + cleaned;
    } else if (cleaned.startsWith('1') && cleaned.length === 11) {
      cleaned = '+' + cleaned;
    } else if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    setPhone(cleaned);

    const isNANP = /^\+1[2-9]\d{9}$/.test(cleaned);
    const isE164 = /^\+[1-9]\d{6,14}$/.test(cleaned);

    if (cleaned && !isNANP && !isE164) {
      setPhoneError('Please enter a valid US/Canada phone number (e.g. +14155552671 or 4155552671)');
    } else {
      setPhoneError('');
    }
  };

  const handleCreateContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) return;

    try {
      await createContact({
        name: name.trim(),
        phone: phone.trim(),
        email: email.trim() || undefined,
        groupName: groupName.trim(),
        country,
        carrierType,
      });

      setName('');
      setPhone('');
      setEmail('');
      setIsAddOpen(false);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to create contact.');
    }
  };

  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!csvText.trim()) return;

    const lines = csvText.trim().split('\n');
    const parsedContacts = [];

    for (const line of lines) {
      const parts = line.split(',').map((p) => p.trim());
      if (parts.length >= 2) {
        let cleanPhone = parts[1].replace(/[\s()\-.]/g, '');
        if (/^[2-9]\d{9}$/.test(cleanPhone)) cleanPhone = '+1' + cleanPhone;
        else if (cleanPhone.startsWith('1') && cleanPhone.length === 11) cleanPhone = '+' + cleanPhone;
        else if (!cleanPhone.startsWith('+')) cleanPhone = '+' + cleanPhone;

        const isCA = cleanPhone.startsWith('+1416') || cleanPhone.startsWith('+1514') || cleanPhone.startsWith('+1604');

        parsedContacts.push({
          name: parts[0] || 'Customer',
          phone: cleanPhone,
          email: parts[2] || undefined,
          group: parts[3] || 'US Verified Customers',
          country: isCA ? 'CA' : 'US',
        });
      }
    }

    if (parsedContacts.length > 0) {
      await bulkImportContacts(parsedContacts);
      setCsvText('');
      setIsImportOpen(false);
      loadData();
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

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Audience & Contacts"
        subtitle="Manage verified US & Canadian mobile recipients, carrier classifications, and tags"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Banner */}
          <div className="p-6 rounded-3xl bg-slate-900 border border-slate-800 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 text-xs font-bold mb-2">
                <Users className="w-3.5 h-3.5 text-blue-400" />
                <span>North American Numbering Plan (+1)</span>
              </div>
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">Audience Directory (US & Canada)</h1>
              <p className="text-xs sm:text-sm text-slate-400 max-w-xl">
                Maintain clean, compliant phone numbers for Toll-Free (+1888) physical mobile delivery and Local 10DLC (+1479) routing.
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              <button
                onClick={() => setIsImportOpen(true)}
                className="zs-btn-secondary text-xs py-2.5 px-4 cursor-pointer flex items-center gap-1.5"
              >
                <Upload className="w-4 h-4" />
                <span>Bulk Import</span>
              </button>
              <button
                onClick={() => setIsAddOpen(true)}
                className="zs-btn-primary shadow-md text-xs py-2.5 px-4 cursor-pointer flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Add Contact</span>
              </button>
            </div>
          </div>

          {/* Table Card */}
          <div className="zs-card overflow-hidden">
            <div className="p-4 border-b border-[var(--border-color)] flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0">
                <button
                  onClick={() => setSelectedGroup('All')}
                  className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                    selectedGroup === 'All'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                  }`}
                >
                  All Contacts ({contacts.length})
                </button>
                {groups.map((g) => (
                  <button
                    key={g.id}
                    onClick={() => setSelectedGroup(g.name)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition-all ${
                      selectedGroup === g.name
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                    }`}
                  >
                    {g.name}
                  </button>
                ))}
              </div>

              <div className="relative w-full md:w-64">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search name, phone or email..."
                  className="zs-input pl-8 py-1.5 text-xs"
                />
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]">
                  <tr>
                    <th className="py-3 px-4">Contact</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Region</th>
                    <th className="py-3 px-4">Carrier Type</th>
                    <th className="py-3 px-4">Group Segment</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {contacts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-10 text-center text-[var(--text-muted)]">
                        No contacts found in this segment.
                      </td>
                    </tr>
                  ) : (
                    contacts.map((c) => (
                      <tr key={c.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                        <td className="py-3.5 px-4">
                          <p className="font-bold text-[var(--text-heading)]">{c.name}</p>
                          <p className="text-[11px] text-[var(--text-muted)]">{c.email || 'No email'}</p>
                        </td>
                        <td className="py-3.5 px-4 font-mono font-semibold text-blue-500">{c.phone}</td>
                        <td className="py-3.5 px-4">
                          <span className="font-semibold text-[var(--text-secondary)]">
                            {c.country === 'CA' ? '🇨🇦 Canada' : '🇺🇸 United States'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4">
                          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            c.carrierType === 'voip'
                              ? 'bg-amber-50 text-amber-800 border border-amber-200'
                              : 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          }`}>
                            {c.carrierType === 'voip' ? 'VoIP / Virtual' : 'Physical Mobile'}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 font-semibold text-[var(--text-secondary)]">
                          {c.group?.name || 'General'}
                        </td>
                        <td className="py-3.5 px-4">
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                            {c.status}
                          </span>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleDelete(c.id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>

        </div>
      </main>

      {/* Add Contact Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Add Contact to Directory</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Formatted for US and Canada (+1)</p>

            <form onSubmit={handleCreateContact} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Jessica Miller"
                  className="zs-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                  Phone Number (US / Canada)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+14155552671"
                  className="zs-input text-xs font-mono"
                  required
                />
                {phoneError && (
                  <p className="text-[11px] text-red-500 mt-1">{phoneError}</p>
                )}
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jessica@example.com"
                  className="zs-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Region</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="zs-input text-xs"
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="CA">🇨🇦 Canada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Carrier Type</label>
                  <select
                    value={carrierType}
                    onChange={(e) => setCarrierType(e.target.value)}
                    className="zs-input text-xs"
                  >
                    <option value="mobile">Physical Mobile</option>
                    <option value="voip">VoIP / Virtual</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Group / Segment</label>
                <input
                  type="text"
                  value={groupName}
                  onChange={(e) => setGroupName(e.target.value)}
                  className="zs-input text-xs"
                  placeholder="e.g. US Verified Customers"
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
                  Save Contact
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-lg bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Bulk Import Contacts (CSV / Paste)</h2>
            <p className="text-xs text-[var(--text-muted)] mb-3">Format: Name, Phone, Email, Group (one per line)</p>

            <form onSubmit={handleBulkImport} className="space-y-3">
              <textarea
                rows={6}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="David Tremblay, +14165550143, david@example.ca, Canada VIP Members&#10;Emily Watson, +12393753770, emily@textnow.me, VoIP Leads"
                className="zs-input text-xs font-mono resize-none"
                required
              />

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="zs-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary text-xs py-2 px-5"
                >
                  Import Contacts
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
