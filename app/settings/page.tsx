'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getSettings, updateSettings, checkDatabaseConnection, clearAllData, testSmsConnection } from '@/lib/db-actions';
import { Settings, Database, ShieldCheck, Key, RefreshCw, AlertCircle, CheckCircle2, Trash2, DollarSign, Send, Radio, Sparkles } from 'lucide-react';

export default function SettingsPage() {
  const [settings, setSettings] = useState<any>(null);
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Provider & Form states
  const [provider, setProvider] = useState<'telnyx' | 'twilio'>('telnyx');
  const [accountSid, setAccountSid] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [fromPhone, setFromPhone] = useState('+14795909259');
  const [balance, setBalance] = useState(25.0);

  // Test SMS state
  const [testPhone, setTestPhone] = useState('+918920856958');
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
        // Auto-detect provider
        if (s.provider === 'telnyx' || s.authToken?.startsWith('KEY')) {
          setProvider('telnyx');
        } else if (s.accountSid?.startsWith('AC')) {
          setProvider('twilio');
        } else {
          setProvider('telnyx');
        }

        setAccountSid(s.accountSid || '');
        setAuthToken(s.authToken || '');
        setFromPhone(s.fromPhone || '+14795909259');
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
        accountSid: provider === 'telnyx' ? '' : accountSid,
        authToken,
        fromPhone,
        balance: Number(balance),
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleTestSms = async () => {
    if (!testPhone.trim()) {
      alert('Please enter a destination phone number (e.g. +91XXXXXXXXXX or +1XXXXXXXXXX)');
      return;
    }
    setTesting(true);
    setTestResult(null);
    try {
      // Auto-save whatever is currently typed in the form
      await updateSettings({
        provider,
        accountSid: provider === 'telnyx' ? '' : accountSid,
        authToken,
        fromPhone,
        balance: Number(balance),
      });

      const res = await testSmsConnection(testPhone.trim(), {
        apiKey: authToken,
        fromPhone,
        provider,
      });

      if (res.success) {
        setTestResult({
          success: true,
          message: `SMS queued/sent successfully via ${provider.toUpperCase()}! Message ID: ${res.sid || 'ok'} (Cost: ~$${res.cost || 0.004})`,
        });
      } else {
        setTestResult({
          success: false,
          message: res.error || 'Failed to send SMS.',
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
    alert('Database successfully reset to 0 records! Check Dashboard to see clean zero-states.');
    loadData();
  };

  const isConnected = dbStatus?.connected ?? false;

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar balance={balance} onOpenQuickSend={() => setIsQuickSendOpen(true)} />
      <Topbar
        title="Settings & SMS Gateways"
        subtitle="Configure Telnyx or Twilio live credentials & test SMS delivery"
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
                  : `Prisma status: ${dbStatus?.error || 'Authentication failed'}.`}
              </p>
            </div>
          </div>
        </div>

        {/* SMS Gateway Configuration Card */}
        <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 space-y-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-[#06b6d4]/20 flex items-center justify-center text-[#22d3ee]">
                <Key className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">SMS Gateway Configuration</h3>
                <p className="text-xs text-[#94a3b8]">
                  Select your active provider and enter credentials to send live SMS.
                </p>
              </div>
            </div>

            {/* Provider Switcher Tabs */}
            <div className="flex bg-[#0d0f26] p-1 rounded-xl border border-[#6366f1]/20">
              <button
                type="button"
                onClick={() => setProvider('telnyx')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                  provider === 'telnyx'
                    ? 'bg-[#10b981] text-white shadow-lg shadow-emerald-500/30'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Telnyx (Recommended)</span>
              </button>
              <button
                type="button"
                onClick={() => setProvider('twilio')}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  provider === 'twilio'
                    ? 'bg-[#6366f1] text-white shadow-lg shadow-indigo-600/30'
                    : 'text-[#94a3b8] hover:text-white'
                }`}
              >
                Twilio
              </button>
            </div>
          </div>

          {saveSuccess && (
            <div className="p-3 rounded-xl bg-[#10b981]/15 border border-[#10b981]/30 text-xs text-[#34d399] flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>SMS Gateway settings updated and active!</span>
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-4">
            {provider === 'telnyx' ? (
              <>
                <div className="p-3.5 rounded-xl bg-[#10b981]/10 border border-[#10b981]/20 text-xs text-[#34d399] flex items-start gap-2">
                  <Sparkles className="w-4 h-4 flex-shrink-0 mt-0.5" />
                  <div>
                    <span className="font-semibold text-white">Using Telnyx API v2:</span> Enter your Telnyx API Key starting with <code className="text-white bg-[#000]/30 px-1 py-0.5 rounded">KEY...</code> and your Telnyx number <code className="text-white bg-[#000]/30 px-1 py-0.5 rounded">+14795909259</code>.
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                    Telnyx API Key (starts with KEY...)
                  </label>
                  <input
                    type="password"
                    placeholder="KEY018xxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                    value={authToken}
                    onChange={(e) => setAuthToken(e.target.value)}
                    className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                  />
                  <p className="text-[11px] text-[#64748b] mt-1">
                    Found in Telnyx Portal ➔ Account Settings ➔ API Keys
                  </p>
                </div>

                <div>
                  <label className="block text-xs font-medium text-[#94a3b8] mb-1">
                    Telnyx Sender Phone Number (E.164)
                  </label>
                  <input
                    type="text"
                    placeholder="+14795909259"
                    value={fromPhone}
                    onChange={(e) => setFromPhone(e.target.value)}
                    className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
                  />
                </div>
              </>
            ) : (
              <>
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
              </>
            )}

            <div>
              <label className="block text-xs text-[#94a3b8] mb-1">Dashboard Display Balance ($ USD)</label>
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

        {/* Live Test Send SMS Card */}
        <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#10b981]/30 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#10b981]/20 flex items-center justify-center text-[#34d399]">
              <Send className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Test Live SMS Dispatch</h3>
              <p className="text-xs text-[#94a3b8]">
                Send a real test text message to verify your {provider.toUpperCase()} credentials immediately.
              </p>
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex flex-col sm:flex-row gap-3">
              <input
                type="text"
                placeholder="+12025550199 or +1XXXXXXXXXX"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
                className="flex-1 bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-[#10b981]"
              />
              <button
                type="button"
                onClick={handleTestSms}
                disabled={testing}
                className="px-5 py-2.5 rounded-xl bg-[#10b981] hover:bg-[#059669] text-white text-xs font-semibold transition-all cursor-pointer shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {testing ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Sending Test...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Send Test SMS</span>
                  </>
                )}
              </button>
            </div>
            <p className="text-[11px] text-[#64748b]">
              💡 <strong>Tip:</strong> US (+1) destination numbers deliver immediately. Indian (+91) numbers require TRAI enterprise DLT registration on Indian telecom portals.
            </p>
          </div>

          {testResult && (
            <div
              className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                testResult.success
                  ? 'bg-[#10b981]/15 border-[#10b981]/30 text-[#34d399]'
                  : 'bg-[#ef4444]/15 border-[#ef4444]/30 text-[#f87171]'
              }`}
            >
              {testResult.success ? (
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#10b981]" />
              ) : (
                <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-[#ef4444]" />
              )}
              <div className="space-y-1">
                <span className="font-bold">{testResult.success ? 'Success!' : 'Error:'}</span>
                <p>{testResult.message}</p>
              </div>
            </div>
          )}
        </div>

        {/* Database Clean State Reset */}
        <div className="p-6 rounded-2xl bg-[#0f1129] border border-[#ef4444]/20 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#ef4444]/20 flex items-center justify-center text-[#f87171]">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-white">Reset Database to Clean State</h3>
              <p className="text-xs text-[#94a3b8]">
                Clear all sample campaigns, messages, and contacts to test a clean zero-record state.
              </p>
            </div>
          </div>
          <button
            onClick={handleResetData}
            className="px-4 py-2 rounded-xl bg-[#ef4444]/10 border border-[#ef4444]/30 text-xs font-semibold text-[#f87171] hover:bg-[#ef4444] hover:text-white transition-all cursor-pointer"
          >
            Clear All Data
          </button>
        </div>
      </main>

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadData}
        onSent={loadData}
      />
    </div>
  );
}
