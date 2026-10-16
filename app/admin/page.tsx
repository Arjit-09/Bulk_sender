'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  Shield, Users, Building2, BarChart2, Settings, Search,
  MoreHorizontal, CheckCircle2, XCircle, Clock, TrendingUp,
  Mail, Send, MessageSquare, Eye, Edit2, Trash2, Plus, X
} from 'lucide-react';

const INITIAL_MEMBERS = [
  { id: 1, name: 'Arjit Sharma', email: 'arjit@acme.com', role: 'ADMIN', status: 'active', lastLogin: '2m ago', campaigns: 14, avatar: 'AS' },
  { id: 2, name: 'Priya Mehta', email: 'priya@acme.com', role: 'MEMBER', status: 'active', lastLogin: '1h ago', campaigns: 8, avatar: 'PM' },
  { id: 3, name: 'Rahul Das', email: 'rahul@acme.com', role: 'VIEWER', status: 'active', lastLogin: '1d ago', campaigns: 0, avatar: 'RD' },
  { id: 4, name: 'Sara Johnson', email: 'sara@acme.com', role: 'MEMBER', status: 'invited', lastLogin: 'Never', campaigns: 0, avatar: 'SJ' },
];

const RECENT_CAMPAIGNS = [
  { id: 1, name: 'Summer SMS Blast', channel: 'sms', by: 'Arjit Sharma', status: 'completed', sent: 8240, date: 'Oct 14' },
  { id: 2, name: 'Diwali WhatsApp', channel: 'whatsapp', by: 'Priya Mehta', status: 'scheduled', sent: 0, date: 'Oct 20' },
  { id: 3, name: 'Newsletter Oct', channel: 'email', by: 'Arjit Sharma', status: 'running', sent: 12400, date: 'Oct 15' },
];

const ROLE_BADGES: Record<string, string> = {
  ADMIN: 'zs-badge-primary',
  MEMBER: 'zs-badge-info',
  VIEWER: 'zs-badge-neutral',
};

const CHANNEL_ICONS: Record<string, any> = {
  sms: Send, whatsapp: MessageSquare, email: Mail
};

const CHANNEL_COLORS: Record<string, string> = {
  sms: 'bg-indigo-100 text-indigo-700',
  whatsapp: 'bg-green-100 text-green-700',
  email: 'bg-cyan-100 text-cyan-700',
};

const STATUS_STYLES: Record<string, string> = {
  completed: 'zs-badge-success',
  running: 'zs-badge-info',
  scheduled: 'zs-badge-warning',
  active: 'zs-badge-success',
  invited: 'zs-badge-warning',
};

export default function AdminPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'members' | 'campaigns' | 'settings'>('overview');
  const [members, setMembers] = useState(INITIAL_MEMBERS);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteName, setInviteName] = useState('');
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('MEMBER');

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteName.trim() || !inviteEmail.trim()) return;

    const newM = {
      id: Date.now(),
      name: inviteName.trim(),
      email: inviteEmail.trim(),
      role: inviteRole,
      status: 'invited',
      lastLogin: 'Never',
      campaigns: 0,
      avatar: inviteName.slice(0, 2).toUpperCase(),
    };

    setMembers([...members, newM]);
    setInviteName('');
    setInviteEmail('');
    setIsInviteOpen(false);
  };

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        orgName="Acme Corp"
        planName="Growth"
        userRole="ADMIN"
        balance={87.50}
      />
      <Topbar
        title="Admin Panel"
        subtitle="Manage team members, roles, permissions, and organization settings"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
                <Shield className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">Organization Administration</h1>
                <p className="text-xs sm:text-sm text-[var(--text-muted)]">Acme Corp workspace settings & team governance</p>
              </div>
            </div>

            <button
              onClick={() => setIsInviteOpen(true)}
              className="zs-btn-primary self-start sm:self-auto"
            >
              <Plus className="w-4 h-4" />
              <span>Invite Team Member</span>
            </button>
          </div>

          {/* Tabs */}
          <div className="zs-tab-list max-w-md">
            {(['overview', 'members', 'campaigns', 'settings'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`zs-tab capitalize text-xs ${activeTab === t ? 'active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="space-y-6 animate-fade-in">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Team Members', value: members.length.toString(), icon: Users, color: 'stat-icon-sms' },
                  { label: 'Active Campaigns', value: '3', icon: BarChart2, color: 'stat-icon-wa' },
                  { label: 'Total Contacts', value: '4,200', icon: Mail, color: 'stat-icon-email' },
                  { label: 'Plan Consumption', value: '42%', icon: TrendingUp, color: 'stat-icon-users' },
                ].map((s, i) => (
                  <div key={s.label} className="zs-card p-5 animate-fade-in-up">
                    <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3 shadow-xs`}>
                      <s.icon className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
                    </div>
                    <p className="text-2xl font-bold text-[var(--text-heading)]">{s.value}</p>
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">{s.label}</p>
                  </div>
                ))}
              </div>

              {/* Recent Campaigns Table */}
              <div className="zs-card overflow-hidden shadow-xs">
                <div className="p-4 sm:p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">Organization Campaigns</h3>
                  <span className="text-xs text-[var(--text-muted)]">Audited log</span>
                </div>
                <div className="overflow-x-auto">
                  <table className="zs-table">
                    <thead>
                      <tr>
                        <th>Campaign</th>
                        <th>Channel</th>
                        <th>Created By</th>
                        <th className="text-right">Sent</th>
                        <th>Status</th>
                        <th>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {RECENT_CAMPAIGNS.map((c) => {
                        const Icon = CHANNEL_ICONS[c.channel];
                        return (
                          <tr key={c.id}>
                            <td className="font-semibold text-[var(--text-heading)]">{c.name}</td>
                            <td>
                              <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2 py-0.5 rounded-md ${CHANNEL_COLORS[c.channel]}`}>
                                <Icon className="w-3 h-3" />
                                <span className="uppercase">{c.channel}</span>
                              </span>
                            </td>
                            <td className="text-[var(--text-secondary)]">{c.by}</td>
                            <td className="text-right font-mono text-xs">{c.sent.toLocaleString()}</td>
                            <td><span className={`zs-badge ${STATUS_STYLES[c.status]}`}>{c.status}</span></td>
                            <td className="text-xs text-[var(--text-muted)]">{c.date}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Members Tab */}
          {activeTab === 'members' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">
                  {members.length} team members with role-based permissions
                </p>
                <button
                  onClick={() => setIsInviteOpen(true)}
                  className="zs-btn-primary py-2 text-xs"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Invite Member</span>
                </button>
              </div>

              <div className="zs-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="zs-table">
                    <thead>
                      <tr>
                        <th>Team Member</th>
                        <th>Assigned Role</th>
                        <th>Account Status</th>
                        <th>Campaigns Run</th>
                        <th>Last Active</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {members.map((m) => (
                        <tr key={m.id}>
                          <td>
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-400 to-cyan-400 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                                {m.avatar}
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-[var(--text-heading)]">{m.name}</p>
                                <p className="text-[11px] text-[var(--text-muted)]">{m.email}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className={`zs-badge ${ROLE_BADGES[m.role] || 'zs-badge-neutral'}`}>{m.role}</span></td>
                          <td><span className={`zs-badge ${STATUS_STYLES[m.status] || 'zs-badge-neutral'}`}>{m.status}</span></td>
                          <td className="font-semibold text-xs text-[var(--text-primary)]">{m.campaigns}</td>
                          <td className="text-xs text-[var(--text-muted)]">{m.lastLogin}</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => alert(`Editing permissions for ${m.name}`)}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-indigo-600 transition-colors cursor-pointer"
                                title="Edit permissions"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Campaigns / Settings Tabs */}
          {(activeTab === 'campaigns' || activeTab === 'settings') && (
            <div className="zs-card p-12 text-center animate-fade-in">
              <Settings className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-[var(--text-heading)] capitalize">{activeTab} Governance</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
                Configure team-wide campaign approval workflows, budget caps, and daily dispatch limits.
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Invite Member Modal */}
      {isInviteOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-md">
            <button
              onClick={() => setIsInviteOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-200">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Invite Team Member</h3>
                <p className="text-xs text-[var(--text-muted)]">Grant access to Acme Corp workspace</p>
              </div>
            </div>

            <form onSubmit={handleInvite} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Maya Patel"
                  value={inviteName}
                  onChange={(e) => setInviteName(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Email Address</label>
                <input
                  type="email"
                  placeholder="maya@acme.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Role Permission Level</label>
                <select
                  value={inviteRole}
                  onChange={(e) => setInviteRole(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="MEMBER">Member (Can create & launch campaigns)</option>
                  <option value="ADMIN">Admin (Full workspace control & billing)</option>
                  <option value="VIEWER">Viewer (Read-only access to analytics)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInviteOpen(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Send Invitation</span>
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
