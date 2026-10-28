'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getSettings, updateSettings, checkDatabaseConnection, clearAllData, testSmsConnection } from '@/lib/db-actions';
import {
  Settings, Database, ShieldCheck, Key, RefreshCw, AlertCircle,
  CheckCircle2, Trash2, DollarSign, Send, Radio, Sparkles,
  Phone, Globe, Zap, Server, Lock
} from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Provider & Form states
  const [provider, setProvider] = useState<'fast2sms' | 'telnyx' | 'twilio'>('telnyx');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromPhone, setFromPhone] = useState('+18884020949');
  const [balance, setBalance] = useState(0);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, db] = await Promise.all([
        getSettings(),
        checkDatabaseConnection(),
      ]);
      setSettings(s);
      setDbStatus(db);
      if (s) {
        setProvider('telnyx');
        setAccountSid(s.accountSid || '');
        setAuthToken(s.authToken || '');
        const tollFree = '+18884020949';
        setFromPhone(s.fromPhone && !s.fromPhone.includes('479') && !s.fromPhone.includes('482') ? s.fromPhone : tollFree);
        setBalance(s.balance ?? 25.0);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);

    try {
      await updateSettings({
        provider,
        accountSid: provider === 'twilio' ? accountSid : undefined,
        authToken,
        fromPhone,
        balance,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
      loadData();
    } catch (err) {
      console.error(err);
      alert('Failed to save settings.');
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone) return;
    setTesting(true);
    setTestResult(null);

    try {
      const res = await testSmsConnection(testPhone);
      if (res && res.success) {
        setTestResult({
          success: true,
          message: `Test SMS dispatched! Provider Message SID: ${res.sid || 'Accepted by Gateway'}`,
        });
      } else {
        setTestResult({
          success: false,
          message: res?.error || 'Test SMS dispatch failed. Check carrier logs.',
        });
      }
    } catch (err: unknown) {
      setTestResult({
        success: false,
        message: (err as Error)?.message || 'Unexpected network error testing SMS.',
      });
    } finally {
      setTesting(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Warning: This will clear all contacts, campaigns, and message history so you can test clean zero-states. Proceed?')) {
      return;
    }
    await clearAllData();
    alert('Database successfully reset to 0 records!');
    loadData();
  };

  const isConnected = dbStatus?.connected ?? false;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        balance={balance ?? 0}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        orgName="ZenithServices"
        planName="Growth"
        userRole="SUPER_ADMIN"
      />
      <Topbar
        title="Settings & Gateways"
        subtitle="Manage Telnyx / Twilio API keys, webhooks, sender IDs, and database connections"
        dbConnected={isConnected}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-12 min-h-screen">
        <div className="max-w-[1200px] mx-auto space-y-6">

          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white shadow-lg shadow-indigo-200">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-heading)]">Platform Settings</h1>
              <p className="text-xs sm:text-sm text-[var(--text-muted)]">
                Carrier integrations, API secrets, and infrastructure diagnostics
              </p>
            </div>
          </div>

          {/* Database Diagnostics Card */}
          <div className="zs-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center text-indigo-600 flex-shrink-0">
                  <Database className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">PostgreSQL Database Connection</h3>
                  <p className="text-xs text-[var(--text-muted)]">Live connection pooling & Prisma ORM health</p>
                </div>
              </div>
              <button
                onClick={loadData}
                className="p-2 rounded-xl bg-[var(--bg-elevated)] hover:bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)] transition-all cursor-pointer"
                title="Test database connection"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-indigo-600' : ''}`} />
              </button>
            </div>

            <div
              className={`p-4 rounded-xl border flex items-start gap-3 ${
                isConnected
                  ? 'bg-emerald-50/70 border-emerald-200 text-emerald-800'
                  : 'bg-amber-50/70 border-amber-200 text-amber-800'
              }`}
            >
              {isConnected ? (
                <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              )}
              <div className="text-xs space-y-1">
                <p className="font-bold text-[var(--text-heading)]">
                  {isConnected ? 'PostgreSQL Database Connected Successfully' : 'PostgreSQL Authentication Issue'}
                </p>
                <p className="text-[var(--text-muted)]">
                  {isConnected
                    ? 'All SaaS models (Organization, Campaign, Message, Contact, Template) are connected and querying your live database.'
                    : `Prisma status: ${dbStatus?.error || 'Authentication pending'}.`}
                </p>
              </div>
            </div>
          </div>

          {/* SMS Gateway Configuration Card */}
          <div className="zs-card p-5 sm:p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cyan-50 flex items-center justify-center text-cyan-600 flex-shrink-0">
                  <Key className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[var(--text-heading)]">SMS Gateway Credentials</h3>
                  <p className="text-xs text-[var(--text-muted)]">
                    Live Telnyx API integration with verified Toll-Free number
                  </p>
                </div>
              </div>

              {/* Provider Switcher Tabs */}
              <div className="zs-tab-list self-start sm:self-auto">
                <button
                  type="button"
                  onClick={() => setProvider('telnyx')}
                  className="zs-tab text-xs font-semibold active"
                >
                  <span>🇺🇸 🇨🇦 Telnyx Verified Toll-Free</span>
                </button>
              </div>
            </div>

            {saveSuccess && (
              <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2 animate-fade-in">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>Gateway settings successfully saved and active in PostgreSQL!</span>
              </div>
            )}

            <form onSubmit={handleSave} className="space-y-4">
              {provider === 'fast2sms' ? (
                <>
                  <div className="p-3.5 rounded-xl bg-orange-50/80 border border-orange-200 text-xs text-orange-900 flex items-start gap-2.5">
                    <span className="text-lg">🇮🇳</span>
                    <div>
                      <span className="font-semibold">Fast2SMS India Route:</span> Sends instant bulk SMS to Indian mobile numbers (+91) via the Quick SMS route without requiring TRAI DLT registration.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Fast2SMS Authorization API Key
                    </label>
                    <input
                      type="password"
                      placeholder="Enter Fast2SMS API Key"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="zs-input font-mono text-xs"
                      required
                    />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Located in Fast2SMS ➔ Dev API ➔ API Key
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Target Country & Sender Route
                    </label>
                    <div className="zs-input font-mono text-xs bg-[var(--bg-surface)] text-[var(--text-secondary)] flex items-center justify-between">
                      <span>🇮🇳 India (+91) — Route Quick (q)</span>
                      <span className="zs-badge-success text-[10px]">Active</span>
                    </div>
                  </div>
                </>
              ) : provider === 'telnyx' ? (
                <>
                  <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-800 flex items-start gap-2.5">
                    <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                    <div>
                      <span className="font-semibold">Using Telnyx API v2:</span> Enter your Telnyx API Key starting with <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">KEY...</code> and your verified toll-free sender number <code className="bg-emerald-100 px-1 py-0.5 rounded font-mono font-bold">+18884020949</code>.
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Telnyx API Key (starts with KEY...)
                    </label>
                    <input
                      type="password"
                      placeholder="KEY018xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="zs-input font-mono text-xs"
                    />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Located in Telnyx Portal ➔ Account Settings ➔ API Keys
                    </p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                      Telnyx Sender Phone Number (E.164)
                    </label>
                    <input
                      type="text"
                      placeholder="+18884020949"
                      value={fromPhone}
                      onChange={(e) => setFromPhone(e.target.value)}
                      className="zs-input font-mono text-xs"
                    />
                    <p className="text-[11px] text-[var(--text-muted)] mt-1">
                      Your verified Toll-Free number: <strong className="text-emerald-700 font-mono">+18884020949</strong>
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Twilio Account SID</label>
                    <input
                      type="text"
                      placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                      value={accountSid}
                      onChange={(e) => setAccountSid(e.target.value)}
                      className="zs-input font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Twilio Auth Token</label>
                    <input
                      type="password"
                      placeholder="••••••••••••••••••••••••••••••••"
                      value={authToken}
                      onChange={(e) => setAuthToken(e.target.value)}
                      className="zs-input font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">Twilio Sender Number (E.164)</label>
                    <input
                      type="text"
                      placeholder="+18005550199"
                      value={fromPhone}
                      onChange={(e) => setFromPhone(e.target.value)}
                      className="zs-input font-mono text-xs"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                  Account Display Balance ($ USD)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={balance}
                  onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                  className="zs-input font-mono text-xs"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  disabled={saving}
                  className="zs-btn-primary"
                >
                  <Lock className="w-3.5 h-3.5" />
                  <span>{saving ? 'Saving…' : 'Save Gateway Configuration'}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Live Test Send SMS Card */}
          <div className="zs-card p-5 sm:p-6 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                <Send className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-heading)]">Test Live SMS Dispatch</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Verify your active {provider.toUpperCase()} credentials with an instant test message
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="text"
                  placeholder="+12025550199 or +91XXXXXXXXXX"
                  value={testPhone}
                  onChange={(e) => setTestPhone(e.target.value)}
                  className="zs-input flex-1 font-mono text-xs"
                />
                <button
                  type="button"
                  onClick={handleTestSms}
                  disabled={testing}
                  className="zs-btn-primary flex-shrink-0"
                >
                  {testing ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      <span>Sending Test…</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Send Test SMS</span>
                    </>
                  )}
                </button>
              </div>
              <p className="text-[11px] text-[var(--text-muted)]">
                💡 US (+1) numbers deliver immediately. Indian (+91) numbers require TRAI DLT approved template headers.
              </p>
            </div>

            {testResult && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  testResult.success
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}
              >
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-emerald-600" />
                ) : (
                  <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-600" />
                )}
                <div>
                  <span className="font-bold">{testResult.success ? 'Success!' : 'Error:'}</span>{' '}
                  <span>{testResult.message}</span>
                </div>
              </div>
            )}
          </div>

          {/* Danger Zone: Database Reset */}
          <div className="zs-card p-5 sm:p-6 border-rose-200/80 bg-rose-50/20 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600 flex-shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-rose-800">Clean State Reset</h3>
                <p className="text-xs text-[var(--text-muted)]">
                  Clear all sample campaigns, messages, and contacts to test a clean zero-record state.
                </p>
              </div>
            </div>
            <button
              onClick={handleResetData}
              className="px-4 py-2 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-300 text-xs font-semibold text-rose-700 transition-all cursor-pointer"
            >
              Reset to Zero Data
            </button>
          </div>

        </div>
      </main>

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
}
