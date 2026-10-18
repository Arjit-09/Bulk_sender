'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  Crown, Building2, Users, Globe, CreditCard, Activity, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, MoreHorizontal, Search,
  Send, MessageSquare, Mail, Settings, Eye, Edit2, Trash2, Plus,
  ArrowUpRight, Shield, Zap, Star, X
} from 'lucide-react';

const INITIAL_ORGS = [
  { id: 1, name: 'Zenith Tech Services', slug: 'zenith-tech', plan: 'Enterprise', status: 'active', members: 4, sms: 12400, wa: 8840, email: 42400, contacts: 14200, revenue: 9999, logo: 'ZT', country: '🇮🇳' },
  { id: 2, name: 'Delhi Retailers Hub', slug: 'delhi-retail', plan: 'Growth', status: 'active', members: 3, sms: 4800, wa: 2100, email: 18000, contacts: 3400, revenue: 4999, logo: 'DR', country: '🇮🇳' },
  { id: 3, name: 'Bengaluru CloudWorks', slug: 'blr-cloud', plan: 'Enterprise', status: 'active', members: 12, sms: 84000, wa: 42000, email: 380000, contacts: 92000, revenue: 19999, logo: 'BC', country: '🇮🇳' },
  { id: 4, name: 'Mumbai Logistics Co', slug: 'mumbai-logistics', plan: 'Starter', status: 'trial', members: 2, sms: 1200, wa: 600, email: 8000, contacts: 950, revenue: 0, logo: 'ML', country: '🇮🇳' },
];

const PLAN_COLORS: Record<string, string> = {
  Starter: 'zs-badge-neutral',
  Growth: 'zs-badge-primary',
  Enterprise: 'bg-amber-100 text-amber-700 border border-amber-200',
};

const STATUS_STYLES: Record<string, string> = {
  active: 'zs-badge-success',
  trial: 'zs-badge-info',
  past_due: 'zs-badge-danger',
  cancelled: 'zs-badge-neutral',
};

const PLATFORM_STATS = [
  { label: 'Total Organizations', value: '5', trend: '+2 this week', icon: Building2, color: 'stat-icon-sms' },
  { label: 'Platform Users', value: '31', trend: '+8 this month', icon: Users, color: 'stat-icon-wa' },
  { label: 'Monthly Recurring Revenue', value: '$477', trend: '+12.4% MoM', icon: CreditCard, color: 'stat-icon-email' },
  { label: 'Messages Sent (All Channels)', value: '534K', trend: 'This month', icon: Send, color: 'stat-icon-users' },
];

export default function SuperAdminPage() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'organizations' | 'plans' | 'system' | 'logs'>('organizations');
  const [search, setSearch] = useState('');
  const [organizations, setOrganizations] = useState(INITIAL_ORGS);

  // New Org Modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState('Growth');
  const [newOrgCountry, setNewOrgCountry] = useState('🇮🇳 India');

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const slug = newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-');
    const newO = {
      id: Date.now(),
      name: newOrgName.trim(),
      slug,
      plan: newOrgPlan,
      status: 'active',
      members: 1,
      sms: 0,
      wa: 0,
      email: 0,
      contacts: 0,
      revenue: newOrgPlan === 'Growth' ? 99 : newOrgPlan === 'Enterprise' ? 349 : 29,
      logo: newOrgName.slice(0, 2).toUpperCase(),
      country: newOrgCountry.split(' ')[0] || '🌐',
    };

    setOrganizations([newO, ...organizations]);
    setNewOrgName('');
    setIsAddOpen(false);
  };

  const filtered = organizations.filter(o =>
    o.name.toLowerCase().includes(search.toLowerCase()) ||
    o.plan.toLowerCase().includes(search.toLowerCase()) ||
    o.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        orgName="ZenithServices HQ"
        planName="Enterprise"
        userRole="SUPER_ADMIN"
        balance={87.50}
      />
      <Topbar
        title="Super Admin"
        subtitle="Platform-wide multi-tenant management & revenue tracking console"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* Hero Header Banner */}
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 p-6 sm:p-8 text-white shadow-xl shadow-amber-200 animate-fade-in">
            <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center backdrop-blur-sm shadow-xs flex-shrink-0">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">Super Admin Console</h1>
                  <p className="text-amber-100 text-xs sm:text-sm mt-0.5">Platform multi-tenancy, billing subscriptions, and audit control</p>
                </div>
              </div>

              <div className="flex items-center gap-2 self-start sm:self-auto">
                <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm rounded-xl px-3.5 py-2 text-xs font-semibold shadow-xs">
                  <Shield className="w-3.5 h-3.5" />
                  <span>Master Access Enabled</span>
                </div>
              </div>
            </div>
            <div className="absolute right-0 top-0 w-56 h-56 bg-white/10 rounded-full -translate-y-1/4 translate-x-1/4 pointer-events-none" />
          </div>

          {/* Platform KPIs */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {PLATFORM_STATS.map((s, i) => (
              <div key={s.label} className="zs-card p-5 animate-fade-in-up">
                <div className={`w-9 h-9 rounded-xl ${s.color} flex items-center justify-center mb-3 shadow-xs`}>
                  <s.icon className="w-4.5 h-4.5 text-white" style={{ width: '18px', height: '18px' }} />
                </div>
                <p className="text-2xl font-bold text-[var(--text-heading)]">{s.value}</p>
                <p className="text-xs text-[var(--text-muted)] leading-tight">{s.label}</p>
                <p className="text-[10px] font-semibold text-emerald-600 mt-1 flex items-center gap-0.5">
                  <ArrowUpRight className="w-3 h-3" /> {s.trend}
                </p>
              </div>
            ))}
          </div>

          {/* Tabs */}
          <div className="zs-tab-list max-w-md">
            {(['organizations', 'plans', 'system', 'logs'] as const).map((t) => (
              <button
                key={t}
                onClick={() => setActiveTab(t)}
                className={`zs-tab capitalize text-xs ${activeTab === t ? 'active' : ''}`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Organizations Tab */}
          {activeTab === 'organizations' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
                <div className="relative max-w-xs w-full">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-muted)]" />
                  <input
                    className="zs-input pl-9.5 text-xs sm:text-sm py-2"
                    placeholder="Search organizations…"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                  />
                </div>
                <button
                  onClick={() => setIsAddOpen(true)}
                  className="zs-btn-primary text-xs py-2 self-start sm:self-auto"
                >
                  <Plus className="w-4 h-4" />
                  <span>Add Organization</span>
                </button>
              </div>

              <div className="zs-card overflow-hidden shadow-xs">
                <div className="overflow-x-auto">
                  <table className="zs-table">
                    <thead>
                      <tr>
                        <th>Organization</th>
                        <th>Subscription Plan</th>
                        <th>Status</th>
                        <th className="text-right">Seats</th>
                        <th className="text-right">SMS Sent</th>
                        <th className="text-right">WA Messages</th>
                        <th className="text-right">Emails</th>
                        <th className="text-right">MRR</th>
                        <th className="text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filtered.map((org) => (
                        <tr key={org.id}>
                          <td>
                            <div className="flex items-center gap-2.5">
                              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-xs">
                                {org.logo}
                              </div>
                              <div>
                                <p className="text-xs sm:text-sm font-semibold text-[var(--text-heading)]">
                                  {org.country} {org.name}
                                </p>
                                <p className="text-[10px] text-[var(--text-muted)] font-mono">{org.slug}</p>
                              </div>
                            </div>
                          </td>
                          <td><span className={`zs-badge ${PLAN_COLORS[org.plan] || 'zs-badge-neutral'}`}>{org.plan}</span></td>
                          <td><span className={`zs-badge ${STATUS_STYLES[org.status] || 'zs-badge-neutral'}`}>{org.status}</span></td>
                          <td className="text-right font-medium text-xs text-[var(--text-secondary)]">{org.members}</td>
                          <td className="text-right font-mono text-xs text-[var(--text-primary)]">{org.sms.toLocaleString()}</td>
                          <td className="text-right font-mono text-xs text-[var(--text-primary)]">{org.wa.toLocaleString()}</td>
                          <td className="text-right font-mono text-xs text-[var(--text-primary)]">{org.email.toLocaleString()}</td>
                          <td className="text-right font-bold text-xs text-emerald-600">${org.revenue}/mo</td>
                          <td className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                onClick={() => alert(`Viewing tenant: ${org.name}`)}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-indigo-600 transition-colors cursor-pointer"
                                title="View details"
                              >
                                <Eye className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => alert(`Editing plan for ${org.name}`)}
                                className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-indigo-600 transition-colors cursor-pointer"
                                title="Edit tenant"
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

          {/* Plans Management */}
          {activeTab === 'plans' && (
            <div className="space-y-4 animate-fade-in">
              <div className="flex items-center justify-between">
                <p className="text-xs sm:text-sm text-[var(--text-secondary)]">Manage subscription plans available across the SaaS platform.</p>
                <button
                  onClick={() => alert('Plan creator opened')}
                  className="zs-btn-primary text-xs py-2"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Plan</span>
                </button>
              </div>
              {['Starter', 'Growth', 'Enterprise'].map((plan) => (
                <div key={plan} className="zs-card p-5 flex items-center gap-4 hover:border-indigo-300 transition-all">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-xs flex-shrink-0 ${
                    plan === 'Enterprise' ? 'bg-gradient-to-br from-amber-400 to-orange-500' :
                    plan === 'Growth' ? 'bg-gradient-to-br from-indigo-500 to-violet-600' :
                    'bg-gradient-to-br from-slate-400 to-slate-500'
                  }`}>
                    {plan === 'Enterprise' ? <Crown className="w-5 h-5 text-white" /> : plan === 'Growth' ? <TrendingUp className="w-5 h-5 text-white" /> : <Zap className="w-5 h-5 text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-[var(--text-heading)]">{plan} Plan</p>
                    <p className="text-xs text-[var(--text-muted)] truncate">
                      {plan === 'Starter' ? '$29/mo · 1,000 SMS · 500 WA · 5,000 Email' :
                       plan === 'Growth' ? '$99/mo · 10,000 SMS · 5,000 WA · 50,000 Email' :
                       '$349/mo · Unlimited everything'}
                    </p>
                  </div>
                  <span className="zs-badge zs-badge-success flex-shrink-0">Active</span>
                  <div className="flex gap-2 flex-shrink-0">
                    <button
                      onClick={() => alert(`Configure ${plan} tier`)}
                      className="zs-btn-secondary text-xs py-1.5 px-3"
                    >
                      Edit Tier
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* System & Logs */}
          {(activeTab === 'system' || activeTab === 'logs') && (
            <div className="zs-card p-12 text-center animate-fade-in">
              <Activity className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-3 opacity-40" />
              <h3 className="text-base font-bold text-[var(--text-heading)] capitalize">{activeTab} Monitor</h3>
              <p className="text-xs text-[var(--text-muted)] max-w-sm mx-auto mt-1">
                {activeTab === 'system'
                  ? 'Real-time CPU, RAM, PostgreSQL connection pool metrics, and active background worker queues.'
                  : 'Immutable security audit trail capturing admin actions, plan modifications, and API token usage.'}
              </p>
            </div>
          )}

        </div>
      </main>

      {/* Add Organization Modal */}
      {isAddOpen && (
        <div className="zs-modal-overlay p-4">
          <div className="zs-modal p-6 relative max-w-md">
            <button
              onClick={() => setIsAddOpen(false)}
              className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center text-white shadow-md shadow-amber-200">
                <Building2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-[var(--text-heading)]">Provision Organization</h3>
                <p className="text-xs text-[var(--text-muted)]">Create new tenant workspace</p>
              </div>
            </div>

            <form onSubmit={handleCreateOrg} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Company Name</label>
                <input
                  type="text"
                  placeholder="e.g. Nexus Global"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  className="zs-input"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Primary Country</label>
                <select
                  value={newOrgCountry}
                  onChange={(e) => setNewOrgCountry(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="🇮🇳 India">🇮🇳 India</option>
                  <option value="🇺🇸 United States">🇺🇸 United States</option>
                  <option value="🇬🇧 United Kingdom">🇬🇧 United Kingdom</option>
                  <option value="🇩🇪 Germany">🇩🇪 Germany</option>
                  <option value="🇦🇺 Australia">🇦🇺 Australia</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Subscription Plan</label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value)}
                  className="zs-input cursor-pointer"
                >
                  <option value="Starter">Starter ($29/mo)</option>
                  <option value="Growth">Growth ($99/mo)</option>
                  <option value="Enterprise">Enterprise ($349/mo)</option>
                </select>
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="zs-btn-secondary"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="zs-btn-primary bg-gradient-to-r from-amber-500 to-orange-500"
                >
                  <Plus className="w-4 h-4" />
                  <span>Provision Tenant</span>
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
