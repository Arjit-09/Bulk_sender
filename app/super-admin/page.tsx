'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { useAuth } from '@/lib/auth-context';
import {
  Crown, Building2, Users, Globe, CreditCard, Activity, TrendingUp,
  CheckCircle2, XCircle, AlertCircle, MoreHorizontal, Search,
  Send, MessageSquare, Mail, Settings, Eye, Edit2, Trash2, Plus,
  ArrowUpRight, Shield, Zap, Star, X, Key, Server
} from 'lucide-react';

interface ClientOrganization {
  id: string;
  name: string;
  slug: string;
  plan: 'Starter' | 'Growth' | 'Enterprise';
  status: 'active' | 'trial' | 'past_due';
  members: number;
  smsCount: number;
  waCount: number;
  emailCount: number;
  mrr: number;
  country: string;
}

const INITIAL_ORGS: ClientOrganization[] = [
  {
    id: 'org_1',
    name: 'ZenithTech PaaS HQ',
    slug: 'zenith-hq',
    plan: 'Enterprise',
    status: 'active',
    members: 8,
    smsCount: 142000,
    waCount: 42000,
    emailCount: 380000,
    mrr: 1499,
    country: '🇺🇸 US',
  },
  {
    id: 'org_2',
    name: 'Pacific Coast Logistics',
    slug: 'pacific-logistics',
    plan: 'Growth',
    status: 'active',
    members: 4,
    smsCount: 48000,
    waCount: 12000,
    emailCount: 85000,
    mrr: 499,
    country: '🇺🇸 US',
  },
  {
    id: 'org_3',
    name: 'Toronto FinTech Group',
    slug: 'toronto-fintech',
    plan: 'Enterprise',
    status: 'active',
    members: 12,
    smsCount: 95000,
    waCount: 28000,
    emailCount: 240000,
    mrr: 1299,
    country: '🇨🇦 Canada',
  },
  {
    id: 'org_4',
    name: 'Austin SaaS HealthCloud',
    slug: 'austin-health',
    plan: 'Starter',
    status: 'trial',
    members: 2,
    smsCount: 5200,
    waCount: 1400,
    emailCount: 18000,
    mrr: 99,
    country: '🇺🇸 US',
  },
];

export default function SuperAdminPage() {
  const { role, isSuperAdmin, switchRole } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'tenants' | 'telnyx' | 'revenue'>('tenants');
  const [search, setSearch] = useState('');
  const [orgs, setOrgs] = useState<ClientOrganization[]>(INITIAL_ORGS);

  // New org modal
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newOrgName, setNewOrgName] = useState('');
  const [newOrgPlan, setNewOrgPlan] = useState<'Starter' | 'Growth' | 'Enterprise'>('Growth');
  const [newOrgCountry, setNewOrgCountry] = useState('🇺🇸 US');

  const handleCreateOrg = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newOrgName.trim()) return;

    const newO: ClientOrganization = {
      id: 'org_' + Date.now(),
      name: newOrgName.trim(),
      slug: newOrgName.toLowerCase().replace(/[^a-z0-9]/g, '-'),
      plan: newOrgPlan,
      status: 'active',
      members: 1,
      smsCount: 0,
      waCount: 0,
      emailCount: 0,
      mrr: newOrgPlan === 'Enterprise' ? 1299 : newOrgPlan === 'Growth' ? 499 : 99,
      country: newOrgCountry,
    };

    setOrgs([newO, ...orgs]);
    setNewOrgName('');
    setIsAddOpen(false);
  };

  const totalMrr = orgs.reduce((acc, curr) => acc + curr.mrr, 0);
  const totalSms = orgs.reduce((acc, curr) => acc + curr.smsCount, 0);

  return (
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Super Admin Platform Console"
        subtitle="Global Product-as-a-Service multi-tenant management and infrastructure control"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:pl-[260px] pl-0 w-full min-h-screen pt-20 sm:pt-24 pb-16 px-3.5 sm:px-6 lg:px-8 max-w-[1600px] mx-auto space-y-5 sm:space-y-6 overflow-x-hidden">
        <div className="max-w-[1500px] mx-auto space-y-6">

          {/* RBAC Notice if not Super Admin */}
          {!isSuperAdmin && (
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <Crown className="w-5 h-5 text-amber-500 flex-shrink-0" />
                <div>
                  <p className="text-xs font-bold text-[var(--text-heading)]">Super Admin Role Required for PaaS Infrastructure</p>
                  <p className="text-[11px] text-[var(--text-muted)]">You are currently logged in as {role}. Switch to SUPER_ADMIN to unlock full multi-tenant controls.</p>
                </div>
              </div>
              <button
                onClick={() => switchRole('SUPER_ADMIN')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 text-white font-bold text-xs hover:bg-blue-500 shadow-xs cursor-pointer"
              >
                Switch to Super Admin
              </button>
            </div>
          )}

          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/10">
                <Crown className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-[var(--text-heading)]">PaaS Master Control Center</h1>
                <p className="text-xs text-[var(--text-muted)]">Manage client organizations, global Telnyx accounts, and recurring subscription revenue</p>
              </div>
            </div>

            <button
              onClick={() => setIsAddOpen(true)}
              className="zs-btn-primary text-xs py-2.5 px-4"
            >
              <Plus className="w-4 h-4" />
              <span>Provision New Organization</span>
            </button>
          </div>

          {/* Platform Stat Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Active PaaS Tenants</p>
              <p className="text-2xl font-black text-[var(--text-heading)] mt-1">{orgs.length}</p>
              <span className="text-[11px] font-bold text-emerald-600">100% Operational</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Monthly Recurring Revenue</p>
              <p className="text-2xl font-black text-blue-500 mt-1">${totalMrr.toLocaleString()}</p>
              <span className="text-[11px] text-[var(--text-muted)]">+18.5% MoM expansion</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Global Outbound Dispatches</p>
              <p className="text-2xl font-black text-[var(--text-heading)] mt-1">{totalSms.toLocaleString()}</p>
              <span className="text-[11px] font-bold text-sky-600">US & Canada High-Volume</span>
            </div>
            <div className="zs-card p-5">
              <p className="text-xs font-semibold text-[var(--text-muted)]">Carrier Uptime SLA</p>
              <p className="text-2xl font-black text-emerald-600 mt-1">99.98%</p>
              <span className="text-[11px] text-[var(--text-muted)]">Dual-Telnyx Redundant</span>
            </div>
          </div>

          {/* Tab Selector */}
          <div className="flex items-center gap-2 border-b border-[var(--border-color)] pb-2">
            <button
              onClick={() => setActiveTab('tenants')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'tenants'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Client Organizations ({orgs.length})
            </button>
            <button
              onClick={() => setActiveTab('telnyx')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'telnyx'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Global Telnyx Dual Accounts
            </button>
            <button
              onClick={() => setActiveTab('revenue')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'revenue'
                  ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-xs'
                  : 'text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              Subscription Billing
            </button>
          </div>

          {/* Tenants Tab */}
          {activeTab === 'tenants' && (
            <div className="zs-card overflow-hidden">
              <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between">
                <h3 className="text-sm font-bold text-[var(--text-heading)]">PaaS Tenant Workspaces</h3>
                <div className="relative w-64">
                  <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="text"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    placeholder="Search organizations..."
                    className="zs-input text-xs"
                    style={{ paddingLeft: '2.5rem' }}
                  />
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[var(--bg-elevated)] text-[var(--text-muted)] font-bold uppercase tracking-wider border-b border-[var(--border-color)]">
                    <tr>
                      <th className="py-3 px-4">Organization Name</th>
                      <th className="py-3 px-4">Region</th>
                      <th className="py-3 px-4">Subscription Plan</th>
                      <th className="py-3 px-4 text-right">Team Seats</th>
                      <th className="py-3 px-4 text-right">SMS Volume</th>
                      <th className="py-3 px-4 text-right">MRR ($)</th>
                      <th className="py-3 px-4">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[var(--border-subtle)]">
                    {orgs
                      .filter((o) => o.name.toLowerCase().includes(search.toLowerCase()))
                      .map((o) => (
                        <tr key={o.id} className="hover:bg-[var(--bg-elevated)] transition-colors">
                          <td className="py-3.5 px-4">
                            <p className="font-bold text-[var(--text-heading)]">{o.name}</p>
                            <p className="text-[11px] text-[var(--text-muted)] font-mono">{o.slug}.zenithtech.site</p>
                          </td>
                          <td className="py-3.5 px-4 font-semibold">{o.country}</td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 border border-blue-500/20">
                              {o.plan}
                            </span>
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-semibold">{o.members}</td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-blue-500">
                            {o.smsCount.toLocaleString()}
                          </td>
                          <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-600">
                            ${o.mrr}
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                              {o.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Telnyx Dual Accounts Global Infrastructure */}
          {activeTab === 'telnyx' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Account 1 */}
              <div className="zs-card p-6 space-y-4 border border-[var(--border-color)]">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-blue-500" />
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-heading)]">Telnyx Account 1 • Toll-Free</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">Verified US & Canadian Cellular Route</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Toll-Free Phone Number</p>
                    <p className="font-mono font-bold text-blue-500">+1 (888) 402-0949</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Messaging Profile ID</p>
                    <p className="font-mono text-[var(--text-secondary)]">4001a0fd-9be4-4b36-a8ef-7dfd7462992b</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">API Key Authority</p>
                    <p className="font-mono text-emerald-600">KEY01A1010...BLFOCK81xR8SR (Verified Active)</p>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Designed for high-throughput broadcast messages directly to physical AT&T, Verizon, T-Mobile, Bell, Rogers, and Telus subscribers.
                  </p>
                </div>
              </div>

              {/* Account 2 */}
              <div className="zs-card p-6 space-y-4 border-2 border-amber-200/80">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Server className="w-5 h-5 text-amber-500" />
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-heading)]">Telnyx Account 2 • Local 10DLC</h3>
                      <p className="text-[11px] text-[var(--text-muted)]">Virtual VoIP & Local Route</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
                    Connected
                  </span>
                </div>

                <div className="space-y-3 pt-2 text-xs">
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Local 10DLC Phone Number</p>
                    <p className="font-mono font-bold text-amber-600">+1 (479) 590-9259</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Messaging Profile ID</p>
                    <p className="font-mono text-[var(--text-secondary)]">4001a0c9-9e1c-444e-ad71-a18b1bdeb2da</p>
                  </div>
                  <div className="p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">API Key Authority</p>
                    <p className="font-mono text-emerald-600">KEY01A188C...KA1FZgzvozxV (Verified Active)</p>
                  </div>
                  <p className="text-[11px] text-[var(--text-muted)] leading-relaxed">
                    Dedicated route for VoIP virtual numbers (TextNow, Google Voice, Bandwidth, Onvoy) and local specialized direct messaging.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="zs-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-[var(--text-heading)]">Global PaaS Subscription Plans</h3>
              <p className="text-xs text-[var(--text-muted)]">Pricing tiers and billing thresholds configured across client organizations.</p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
                <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">Starter Cloud</h4>
                  <p className="text-2xl font-black text-blue-500">$99 <span className="text-xs font-medium text-[var(--text-muted)]">/ mo</span></p>
                  <ul className="text-xs space-y-1 text-[var(--text-secondary)] pt-2">
                    <li>• 10,000 Included SMS Messages</li>
                    <li>• Dual Telnyx Routing</li>
                    <li>• WhatsApp Live Simulator</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-blue-500/5 border-2 border-blue-500/50 space-y-2">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-600 text-white">Popular</span>
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">Growth Omnichannel</h4>
                  <p className="text-2xl font-black text-blue-500">$499 <span className="text-xs font-medium text-[var(--text-muted)]">/ mo</span></p>
                  <ul className="text-xs space-y-1 text-[var(--text-secondary)] pt-2">
                    <li>• 60,000 Included SMS Messages</li>
                    <li>• WhatsApp Business API Verified</li>
                    <li>• High-Throughput Toll-Free MPS</li>
                  </ul>
                </div>

                <div className="p-5 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] space-y-2">
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">Enterprise PaaS</h4>
                  <p className="text-2xl font-black text-blue-500">$1,299 <span className="text-xs font-medium text-[var(--text-muted)]">/ mo</span></p>
                  <ul className="text-xs space-y-1 text-[var(--text-secondary)] pt-2">
                    <li>• Unlimited Multi-Tenant Seats</li>
                    <li>• Custom DKIM/SPF Email Suite</li>
                    <li>• 24/7 Priority Carrier Escalation</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* New Tenant Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-md bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-6">
            <h2 className="text-sm font-bold text-[var(--text-heading)] mb-1">Provision New PaaS Organization</h2>
            <p className="text-xs text-[var(--text-muted)] mb-4">Set up isolated tenant workspace with dual Telnyx dispatch capabilities</p>

            <form onSubmit={handleCreateOrg} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Company / Organization Name</label>
                <input
                  type="text"
                  value={newOrgName}
                  onChange={(e) => setNewOrgName(e.target.value)}
                  placeholder="e.g. Chicago Retail Cloud"
                  className="zs-input text-xs"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Operating Market</label>
                <select
                  value={newOrgCountry}
                  onChange={(e) => setNewOrgCountry(e.target.value)}
                  className="zs-input text-xs"
                >
                  <option value="🇺🇸 US">🇺🇸 United States</option>
                  <option value="🇨🇦 Canada">🇨🇦 Canada</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">Subscription Tier</label>
                <select
                  value={newOrgPlan}
                  onChange={(e) => setNewOrgPlan(e.target.value as any)}
                  className="zs-input text-xs"
                >
                  <option value="Starter">Starter ($99/mo)</option>
                  <option value="Growth">Growth ($499/mo)</option>
                  <option value="Enterprise">Enterprise ($1,299/mo)</option>
                </select>
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
                  Provision Tenant
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
