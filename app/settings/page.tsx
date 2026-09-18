'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getSettings, updateSettings, checkDatabaseConnection, clearAllData } from '@/lib/db-actions';
import { Settings, Database, ShieldCheck, Key, RefreshCw, AlertCircle, CheckCircle2, Trash2, DollarSign } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Form states
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromPhone, setFromPhone] = useState('');
  const [balance, setBalance] = useState(25.0);

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
        setAccountSid(s.accountSid || '');
        setAuthToken(s.authToken || '');
        setFromPhone(s.fromPhone || '');
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
        accountSid,
        authToken,
        fromPhone,
        balance: Number(balance),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleResetData = async () => {
    if (!confirm('Warning: This will clear all contacts, campaigns, and message history so you can test clean zero-states. Proceed?')) {
      return;
    }
    await clearAllData();
    alert('Database successfully reset to 0 records! Check Dashboard to see clean zero-states.');
    loadData();
  };

  const isConnected = dbStatus?.connected ?? false;

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar balance={balance} onOpenQuickSend={() => setIsQuickSendOpen(true)} />
      <Topbar
        title="Settings & System Configuration"
        subtitle="PostgreSQL database diagnostics & secure server credentials"
        dbConnected={isConnected}
      />

      <main className="ml-64 pt-20 p-8 space-y-6 max-w-4xl">
        {/* Database Diagnostics Card */}
        <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#6366f1]/20 flex items-center justify-center text-[#818cf8]">
                <Database className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">PostgreSQL Diagnostics</h3>
                <p className="text-xs text-[#94a3b8]">Live connection test to PostgreSQL instance</p>
              </div>
            </div>
            <button
              onClick={loadData}
              className="p-2 rounded-xl bg-[#12142e] border border-[#6366f1]/20 text-[#94a3b8] hover:text-white transition-all cursor-pointer"
              title="Test database connection"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin text-[#818cf8]' : ''}`} />
            </button>
          </div>

          <div
            className={`p-4 rounded-xl border flex items-start gap-3 ${
              isConnected
                ? 'bg-[#10b981]/10 border-[#10b981]/30 text-[#34d399]'
                : 'bg-[#f59e0b]/10 border-[#f59e0b]/30 text-[#fbbf24]'
            }`}
          >
            {isConnected ? (
              <CheckCircle2 className="w-5 h-5 text-[#10b981] flex-shrink-0 mt-0.5" />
            ) : (
              <AlertCircle className="w-5 h-5 text-[#f59e0b] flex-shrink-0 mt-0.5" />
            )}
            <div className="text-xs space-y-1">
              <p className="font-bold text-white">
                {isConnected ? 'PostgreSQL Connected Successfully' : 'PostgreSQL Authentication Required'}
              </p>
              <p className="text-[#94a3b8]">
                {isConnected
                  ? 'All models (Contact, Message, Campaign, Template) are connected and querying your live database.'
                  : `Prisma status: ${dbStatus?.error || 'Authentication failed for user arjit'}.`}
              </p>
              {!isConnected && (
                <div className="mt-2 p-2.5 rounded-lg bg-[#0d0f26] border border-[#6366f1]/20 text-white font-mono text-[11px]">
                  DATABASE_URL="postgresql://arjit:YOUR_PASSWORD@localhost:5432/arjit?schema=public"
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Twilio & Provider Settings Form */}
        <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 flex items-center justify-center text-[#22d3ee]">
              <Key className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">SMS Gateway Secrets (Server-Only)</h3>
              <p className="text-xs text-[#94a3b8]">
                Stored securely on server side. Never exposed to browser bundle.
              </p>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#34d399] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>Settings updated successfully!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Twilio Account SID</label>
              <input
                type="text"
                placeholder="ACXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX"
                value={accountSid}
                onChange={(e) => setAccountSid(e.target.value)}
                className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Twilio Auth Token</label>
              <input
                type="password"
                placeholder="••••••••••••••••••••••••••••••••"
                value={authToken}
                onChange={(e) => setAuthToken(e.target.value)}
                className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Sender Phone Number (E.164)</label>
              <input
                type="text"
                placeholder="+18005550199"
                value={fromPhone}
                onChange={(e) => setFromPhone(e.target.value)}
                className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Simulated Account Balance ($ USD)</label>
              <input
                type="number"
                step="0.01"
                value={balance}
                onChange={(e) => setBalance(parseFloat(e.target.value) || 0)}
                className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#6366f1]"
              />
            </div>

            <div className="flex justify-end pt-2">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2.5 rounded-xl bg-[#6366f1] text-white text-xs font-semibold hover:bg-[#4f46e5] transition-all cursor-pointer shadow-lg shadow-indigo-600/30 disabled:opacity-50"
              >
                {saving ? 'Saving...' : 'Save Configuration'}
              </button>
            </div>
          </form>
        </div>

        {/* Database Reset for Testing */}
        <div className="p-6 rounded-2xl bg-[#ef4444]/10 border border-[#ef4444]/30 space-y-3">
          <div className="flex items-center gap-3">
            <Trash2 className="w-5 h-5 text-[#ef4444]" />
            <div>
              <h3 className="text-sm font-bold text-white">Reset Database for Clean Testing</h3>
              <p className="text-xs text-[#94a3b8]">
                Wipe all contacts, message logs, and campaigns to verify 100% clean zero-states and watch KPIs recalculate dynamically.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-xl bg-[#ef4444] hover:bg-[#dc2626] text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-red-600/30"
          >
            Clear All Data & Test Zero-States
          </button>
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
