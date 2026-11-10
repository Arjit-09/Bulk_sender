'use client';

import { useState } from 'react';
import Link from 'next/link';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { useAuth, UserRole } from '@/lib/auth-context';
import {
  Shield, Users, Building2, BarChart2, Settings, Search,
  MoreHorizontal, CheckCircle2, XCircle, Clock, TrendingUp,
  Mail, Send, MessageSquare, Eye, Edit2, Trash2, Plus, X,
  Key, Lock, AlertTriangle
} from 'lucide-react';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  status: 'active' | 'invited' | 'suspended';
  lastLogin: string;
  avatar: string;
}

const INITIAL_MEMBERS: TeamMember[] = [
  {
    id: 'm1',
    name: 'Arjit Sharma',
    email: 'superadmin@zenithtech.site',
    role: 'SUPER_ADMIN',
    status: 'active',
    lastLogin: 'Just now',
    avatar: 'AS',
  },
  {
    id: 'm2',
    name: 'Operations Admin',
    email: 'admin@zenithtech.site',
    role: 'ADMIN',
    status: 'active',
    lastLogin: '10 mins ago',
    avatar: 'OA',
  },
  {
    id: 'm3',
    name: 'Campaign Manager',
    email: 'user@zenithtech.site',
    role: 'MEMBER',
    status: 'active',
    lastLogin: '1 hour ago',
    avatar: 'CM',
  },
];

export default function AdminPage() {
  const { role, isSuperAdmin, isAdmin, switchRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'members' | 'security' | 'audit'>('members');
  const [members, setMembers] = useState<TeamMember[]>(INITIAL_MEMBERS);
  const [search, setSearch] = useState('');

  // Invite modal
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<UserRole>('MEMBER');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newM: TeamMember = {
      id: 'm_' + Date.now(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'invited',
      lastLogin: 'Never',
      avatar: inviteName.slice(0, 2).toUpperCase(),
    };

    setMembers([...members, newM]);
    setInviteName('');
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  const handleRemoveMember = (id: string) => {
    setMembers(members.filter((m) => m.id !== id));
  };

  const handleChangeRole = (id: string, newR: UserRole) => {
    setMembers(members.map((m) => (m.id === id ? { ...m, role: newR } : m)));
  };

  return (
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Admin Console"
        subtitle="Workspace RBAC governance, team member roles, and security policies"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* RBAC Permission Banner if viewed by standard MEMBER */}
          {!isAdmin && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-heading)]">You are currently logged in as MEMBER</p>
                  <p className="text-[11px] text-[var(--text-muted)]">Admin actions are restricted. Switch to ADMIN or SUPER_ADMIN to test full management.</p>
                </div>
              </div>
              <button
                onClick={() => switchRole('ADMIN')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-xs cursor-pointer"
              >
                Switch to Admin
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
                <Shield className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-heading)]">Organization Administration</h1>
                <p className="text-xs text-[var(--text-muted)]">Control access permissions across Toll-Free SMS, Local 10DLC, and WhatsApp suites</p>
              </div>
            </div>

            <button
              onClick={() => setIsInviteOpen(true)}
              className="zs-btn-primary text-xs py-2.5 px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <button
              onClick={() => setActiveTab('members')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'members'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Team Members ({members.length})
            </button>
            <button
              onClick={() => setActiveTab('security')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'security'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Security & Rate Limits
            </button>
          </div>

          {/* Members Table */}
          {activeTab === 'members' && (
            <div className="zs-card overflow-hidden">
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-heading)]">Active Users & Role Assignments</h3>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search members..."
                    className="zs-input text-xs"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-3 px-4">User</th>
                      <th className="py-3 px-4">Role (RBAC)</th>
                      <th className="py-3 px-4">Account Status</th>
                      <th className="py-3 px-4">Last Activity</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {members
                      .filter((m) => m.name.toLowerCase().includes(search.toLowerCase()) || m.email.toLowerCase().includes(search.toLowerCase()))
                      .map((m) => (
                        <tr key={m.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-700 text-slate-200 font-bold flex items-center justify-center text-xs">
                                {m.avatar}
                              </div>
                              <div>
                                <p className="font-bold text-[var(--text-heading)]">{m.name}</p>
                                <p className="text-[11px] text-[var(--text-muted)]">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <select
                              value={m.role}
                              onChange={(e) => handleChangeRole(m.id, e.target.value as UserRole)}
                              className="zs-input text-xs py-1 px-2 font-bold w-auto"
                            >
                              <option value="SUPER_ADMIN">SUPER_ADMIN (PaaS Owner)</option>
                              <option value="ADMIN">ADMIN (Workspace Mgr)</option>
                              <option value="MEMBER">MEMBER (Standard Agent)</option>
                            </select>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {m.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-[var(--text-muted)]">{m.lastLogin}</td>
                          <td className="py-3.5 px-4 text-right">
                            <button
                              onClick={() => handleRemoveMember(m.id)}
                              className="p-1.5 text-slate-400 hover:text-red-500 rounded-lg hover:bg-red-50 transition-colors cursor-pointer"
                              title="Revoke Access"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Security Tab */}
          {activeTab === 'security' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="zs-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Lock className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Telnyx API Dispatch Throttling</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Controls throughput per second across Toll-Free and Local 10DLC routes to prevent carrier filtering.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">Toll-Free (+1888) MPS</span>
                    <span className="font-mono font-bold text-blue-500">50 msgs / sec</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">Local 10DLC (+1479) MPS</span>
                    <span className="font-mono font-bold text-blue-500">10 msgs / sec</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">Auto STOP Opt-Out Compliance</span>
                    <span className="font-bold text-emerald-600">Enforced</span>
                  </div>
                </div>
              </div>

              <div className="zs-card p-6 space-y-4">
                <div className="flex items-center gap-2">
                  <Key className="w-5 h-5 text-blue-500" />
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Access Control Audit Policies</h3>
                </div>
                <p className="text-xs text-[var(--text-muted)] leading-relaxed">
                  Enforces multi-factor authentication (MFA) and IP restriction for administrative key changes.
                </p>

                <div className="space-y-3 pt-2">
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">2FA Requirement for Admins</span>
                    <span className="text-xs font-bold text-emerald-600">Enabled</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">Session Inactivity Timeout</span>
                    <span className="font-mono font-bold">30 Minutes</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs">
                    <span className="font-semibold text-[var(--text-secondary)]">Audit Log Retention</span>
                    <span className="font-bold">90 Days</span>
                  </div>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Invite Modal */}
      {isInviteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Invite Workspace Teammate</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Assign role and permissions for campaign and inbox management</p>

            <form onSubmit={handleInvite} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Full Name</label>
                <input
                  type="text"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  placeholder="e.g. Sarah Connor"
                  className="zs-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Email Address</label>
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  placeholder="sarah@zenithtech.site"
                  className="zs-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Role Assignment</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value as UserRole)}
                  className="zs-input text-xs"
                >
                  <option value="MEMBER">MEMBER (Standard Agent - Send & View)</option>
                  <option value="ADMIN">ADMIN (Manage Teammates & Billing)</option>
                  <option value="SUPER_ADMIN">SUPER_ADMIN (PaaS Owner - Full Access)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[var(--border-color)]">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="zs-btn-secondary text-xs py-2 px-4"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary text-xs py-2 px-5"
                >
                  Send Invitation
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
