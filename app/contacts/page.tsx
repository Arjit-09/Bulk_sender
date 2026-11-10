'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  getContacts,
  createContact,
  deleteContact,
  bulkImportContacts,
  getContactGroups,
} from '@/lib/db-actions';
import {
  Users,
  Plus,
  Upload,
  Search,
  Trash2,
  X,
  Sparkles,
  Download,
  Filter,
  Phone,
  Mail,
  Shield,
  MessageSquare,
} from 'lucide-react';
import Link from 'next/link';

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
      setPhoneError('Please enter a valid phone number (e.g. +14155552671)');
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
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />

      {/* Topbar */}
      <Topbar
        title="Audience & Contacts"
        subtitle="Manage verified mobile recipients and carrier classifications"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
        actions={
          <button
            onClick={() => setIsAddOpen(true)}
            className="vision-btn-primary text-xs py-2 px-3.5 shadow-md flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add Contact</span>
          </button>
        }
      />

      {/* Main Content Area */}
      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">

        {/* Vision UI Glowing Hero Banner */}
        <div className="vision-hero-card p-5 sm:p-7 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative z-10 space-y-1">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 text-cyan-300 border border-blue-400/30 text-xs font-bold mb-1">
              <Users className="w-3.5 h-3.5" />
              <span>North American Numbering Plan (+1)</span>
            </span>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
              Audience Directory (US &amp; Canada)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 max-w-xl font-medium leading-relaxed">
              Maintain clean, verified phone numbers for Toll-Free (+1888) physical mobile delivery and Local 10DLC (+1479) routing.
            </p>
          </div>

          <div className="flex items-center gap-2.5 self-stretch sm:self-auto relative z-10">
            <button
              onClick={() => setIsImportOpen(true)}
              className="vision-btn-glass text-xs py-2.5 px-3.5 sm:px-4 flex-1 sm:flex-initial flex items-center justify-center gap-2 cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>Bulk Import</span>
            </button>
            <button
              onClick={() => setIsAddOpen(true)}
              className="vision-btn-primary text-xs py-2.5 px-3.5 sm:px-4 flex-1 sm:flex-initial flex items-center justify-center gap-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Add Contact</span>
            </button>
          </div>
        </div>

        {/* Contacts Card Container */}
        <div className="vision-card overflow-hidden">
          {/* Header Controls: Filter Tabs & Search */}
          <div className="p-4 sm:p-5 border-b border-white/10 flex flex-col md:flex-row md:items-center justify-between gap-3">
            {/* Horizontal Filter Tabs */}
            <div className="flex items-center gap-1.5 overflow-x-auto text-xs pb-1 sm:pb-0 no-scrollbar flex-nowrap w-full md:w-auto">
              <button
                onClick={() => setSelectedGroup('All')}
                className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 text-xs ${
                  selectedGroup === 'All'
                    ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(0,117,255,0.6)]'
                    : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                }`}
              >
                All Contacts ({contacts.length})
              </button>
              {groups.map((g) => (
                <button
                  key={g.id}
                  onClick={() => setSelectedGroup(g.name)}
                  className={`px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer flex-shrink-0 text-xs ${
                    selectedGroup === g.name
                      ? 'bg-blue-600 text-white shadow-[0_0_12px_rgba(0,117,255,0.6)]'
                      : 'bg-white/5 border border-white/10 text-slate-300 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {g.name}
                </button>
              ))}
            </div>

            {/* Search Bar */}
            <div className="relative w-full md:w-72">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, phone or email..."
                className="vision-input text-xs"
                style={{ paddingLeft: '2.75rem' }}
              />
            </div>
          </div>

          {/* Desktop & Tablet View: Structured Responsive Table */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-xs min-w-[760px]">
              <thead className="text-[10px] font-bold text-slate-400 uppercase tracking-wider border-b border-white/10 bg-white/[0.02]">
                <tr>
                  <th className="py-3.5 px-4">Contact</th>
                  <th className="py-3.5 px-4">Phone Number</th>
                  <th className="py-3.5 px-4">Region</th>
                  <th className="py-3.5 px-4">Carrier Type</th>
                  <th className="py-3.5 px-4">Group Segment</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contacts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-400">
                      <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-400" />
                      <p className="font-bold text-white">No contacts found</p>
                      <p className="text-[11px] mt-0.5">Click &quot;Add Contact&quot; to create a new recipient.</p>
                    </td>
                  </tr>
                ) : (
                  contacts.map((c) => (
                    <tr key={c.id} className="hover:bg-white/[0.03] transition-colors">
                      <td className="py-3.5 px-4 font-bold text-white">
                        <div>
                          <p className="text-sm">{c.name}</p>
                          {c.email && (
                            <p className="text-[11px] text-slate-400 font-normal">{c.email}</p>
                          )}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-cyan-400 text-sm">
                        {c.phone}
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 font-medium text-slate-300">
                          {c.country === 'CA' ? '🇨🇦 Canada' : '🇺🇸 United States'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span
                          className={`inline-flex px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                            c.carrierType === 'voip'
                              ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                              : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                          }`}
                        >
                          {c.carrierType === 'voip' ? 'VoIP / Virtual' : 'Physical Mobile'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex px-2.5 py-0.5 rounded-full bg-white/5 text-slate-300 text-[11px] font-semibold border border-white/5">
                          {c.group?.name || 'Default Group'}
                        </span>
                      </td>
                      <td className="py-3.5 px-4">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 text-[10px] font-bold">
                          active
                        </span>
                      </td>
                      <td className="py-3.5 px-4 text-right">
                        <button
                          onClick={() => handleDelete(c.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer"
                          title="Delete contact"
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

          {/* Mobile View: High-Quality Contact Cards (Tailored for 375px screens) */}
          <div className="md:hidden divide-y divide-white/10">
            {contacts.length === 0 ? (
              <div className="p-8 text-center text-slate-400">
                <Users className="w-8 h-8 mx-auto mb-2 opacity-30 text-blue-400" />
                <p className="font-bold text-white">No contacts found</p>
                <p className="text-xs mt-1">Tap &quot;Add Contact&quot; to get started.</p>
              </div>
            ) : (
              contacts.map((c) => (
                <div key={c.id} className="p-4 space-y-2.5 hover:bg-white/[0.02] transition-colors">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-xs text-white shadow-md flex-shrink-0">
                        {c.name ? c.name.slice(0, 2).toUpperCase() : 'US'}
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-black text-sm text-white truncate">{c.name}</h4>
                        <p className="font-mono text-xs font-bold text-cyan-400 mt-0.5">{c.phone}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                      title="Delete contact"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {c.email && (
                    <div className="flex items-center gap-1.5 text-xs text-slate-300">
                      <Mail className="w-3.5 h-3.5 text-slate-500" />
                      <span className="truncate">{c.email}</span>
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap pt-1">
                    <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-300 bg-white/5 px-2 py-0.5 rounded-lg border border-white/5">
                      {c.country === 'CA' ? '🇨🇦 Canada' : '🇺🇸 United States'}
                    </span>
                    <span
                      className={`inline-flex px-2 py-0.5 rounded-lg text-[10px] font-extrabold uppercase tracking-wider ${
                        c.carrierType === 'voip'
                          ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                          : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                      }`}
                    >
                      {c.carrierType === 'voip' ? 'VoIP' : 'Mobile'}
                    </span>
                    <span className="inline-flex px-2 py-0.5 rounded-lg bg-blue-500/10 text-cyan-300 text-[10px] font-bold border border-blue-500/20">
                      {c.group?.name || 'Default Group'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </main>

      {/* Add Contact Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="vision-card w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                <span>Add Verified Recipient</span>
              </h3>
              <button onClick={() => setIsAddOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContact} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Full Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. John Doe"
                  className="vision-input text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Phone Number (+1)</label>
                <input
                  type="tel"
                  required
                  value={phone}
                  onChange={(e) => handlePhoneChange(e.target.value)}
                  placeholder="+14155552671"
                  className="vision-input text-xs font-mono"
                />
                {phoneError && <p className="text-[11px] text-rose-400 mt-1">{phoneError}</p>}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-300 mb-1">Email (Optional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="john@example.com"
                  className="vision-input text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Country</label>
                  <select
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                    className="vision-input text-xs bg-[#0b1437]"
                  >
                    <option value="US">🇺🇸 United States</option>
                    <option value="CA">🇨🇦 Canada</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-300 mb-1">Carrier Type</label>
                  <select
                    value={carrierType}
                    onChange={(e) => setCarrierType(e.target.value)}
                    className="vision-input text-xs bg-[#0b1437]"
                  >
                    <option value="mobile">Physical Mobile</option>
                    <option value="voip">VoIP / Virtual</option>
                  </select>
                </div>
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
                  Save Recipient
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bulk Import Modal */}
      {isImportOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="vision-card w-full max-w-lg p-6 space-y-4 animate-scale-in">
            <div className="flex items-center justify-between pb-3 border-b border-white/10">
              <h3 className="text-base font-black text-white flex items-center gap-2">
                <Upload className="w-5 h-5 text-cyan-400" />
                <span>Bulk Import Contacts (CSV)</span>
              </h3>
              <button onClick={() => setIsImportOpen(false)} className="text-slate-400 hover:text-white p-1">
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-slate-300">
              Paste CSV rows format: <code className="text-cyan-300 font-mono">Name, Phone, Email, Group</code>
            </p>

            <form onSubmit={handleBulkImport} className="space-y-4">
              <textarea
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="Emily Virtual, +12393753770, emily@textnow.me, VoIP Group&#10;David Thompson, +14165550143, david@ca.com, Canada VIP"
                rows={6}
                className="vision-input font-mono text-xs"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsImportOpen(false)}
                  className="vision-btn-glass text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="vision-btn-primary text-xs py-2 px-4"
                >
                  Import All Contacts
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Quick Send Modal */}
      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
