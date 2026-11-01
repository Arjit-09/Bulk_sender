'use client';

import { useState, useEffect, useCallback } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  getSettings,
  updateSettings,
  checkDatabaseConnection,
  clearAllData,
  testSmsConnection,
} from '@/lib/db-actions';
import {
  Settings, Database, Key, RefreshCw, AlertCircle,
  CheckCircle2, Trash2, Send, Radio, Phone,
  MessageSquare, Mail, Lock, Zap, Server, Globe, Eye, EyeOff,
} from 'lucide-react';

function FieldGroup({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <label className="block text-xs font-medium text-[var(--text-secondary)]">{label}</label>
      {children}
      {hint && <p className="text-[11px] text-[var(--text-muted)]">{hint}</p>}
    </div>
  );
}

function SectionCard({
  icon: Icon,
  iconColor,
  iconBg,
  title,
  subtitle,
  badge,
  children,
}: {
  icon: any;
  iconColor: string;
  iconBg: string;
  title: string;
  subtitle: string;
  badge?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="zs-settings-section">
      <div className="zs-settings-header">
        <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: iconBg }}>
          <Icon className="w-4 h-4" style={{ color: iconColor }} />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="text-sm font-semibold text-[var(--text-heading)]">{title}</h3>
          <p className="text-xs text-[var(--text-muted)] mt-0.5">{subtitle}</p>
        </div>
        {badge && (
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-color)]">
            {badge}
          </span>
        )}
      </div>
      <div className="zs-settings-body">{children}</div>
    </div>
  );
}

function PasswordInput({ value, onChange, placeholder, className }: any) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative">
      <input
        type={show ? 'text' : 'password'}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className={`zs-input text-xs font-mono pr-9 ${className || ''}`}
      />
      <button
        type="button"
        onClick={() => setShow(!show)}
        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
      >
        {show ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
      </button>
    </div>
  );
}

export default function SettingsPage() {
  const [dbStatus, setDbStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'sms' | 'whatsapp' | 'email' | 'system'>('sms');

  // SMS/Telnyx
  const [tollFreeNumber, setTollFreeNumber] = useState('+18884020949');
  const [tollFreeApiKey, setTollFreeApiKey] = useState('');
  const [tollFreeProfileId, setTollFreeProfileId] = useState('4001a0fd-9be4-4b36-a8ef-7dfd7462992b');
  const [localNumber, setLocalNumber] = useState('+14795909259');
  const [localApiKey, setLocalApiKey] = useState('');
  const [localProfileId, setLocalProfileId] = useState('4001a0c9-9e1c-444e-ad71-a18b1bdeb2da');

  // WhatsApp
  const [waPhoneId, setWaPhoneId] = useState('');
  const [waBusinessId, setWaBusinessId] = useState('');
  const [waApiKey, setWaApiKey] = useState('');
  const [waWebhookToken, setWaWebhookToken] = useState('');

  // Email
  const [emailProvider, setEmailProvider] = useState('smtp');
  const [emailFromAddr, setEmailFromAddr] = useState('');
  const [emailFromName, setEmailFromName] = useState('');
  const [smtpHost, setSmtpHost] = useState('');
  const [smtpPort, setSmtpPort] = useState('587');
  const [smtpUser, setSmtpUser] = useState('');
  const [smtpPass, setSmtpPass] = useState('');

  // SMS Test
  const [testPhone, setTestPhone] = useState('');
  const [testRoute, setTestRoute] = useState<'toll_free' | 'local'>('toll_free');
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [s, db] = await Promise.all([getSettings(), checkDatabaseConnection()]);
      setDbStatus(db);
      if (s) {
        setTollFreeNumber(s.tollFreeNumber || '+18884020949');
        setTollFreeApiKey(s.tollFreeApiKey || '');
        setTollFreeProfileId(s.tollFreeProfileId || '');
        setLocalNumber(s.localNumber || '+14795909259');
        setLocalApiKey(s.localApiKey || '');
        setLocalProfileId(s.localProfileId || '');
        setWaPhoneId(s.waPhoneNumberId || '');
        setWaBusinessId(s.waBusinessId || '');
        setWaApiKey(s.waApiKey || '');
        setWaWebhookToken(s.waWebhookToken || '');
        setEmailProvider(s.emailProvider || 'smtp');
        setEmailFromAddr(s.emailFromAddr || '');
        setEmailFromName(s.emailFromName || '');
        setSmtpHost(s.smtpHost || '');
        setSmtpPort(String(s.smtpPort || 587));
        setSmtpUser(s.smtpUser || '');
        setSmtpPass(s.smtpPass || '');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateSettings({
        tollFreeNumber, tollFreeApiKey, tollFreeProfileId,
        localNumber, localApiKey, localProfileId,
        waPhoneNumberId: waPhoneId,
        waBusinessId, waApiKey, waWebhookToken,
        emailProvider, emailFromAddr, emailFromName,
        smtpHost, smtpPort: Number(smtpPort), smtpUser, smtpPass,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch {
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
      const res = await testSmsConnection(testPhone, {
        routePreference: testRoute,
        fromPhone: testRoute === 'local' ? localNumber : tollFreeNumber,
      });
      setTestResult({
        success: res?.success || false,
        message: res?.success
          ? `Delivered via ${testRoute === 'local' ? 'Local 10DLC' : 'Toll-Free'}. SID: ${res.sid || 'OK'}`
          : res?.error || 'Delivery failed.',
      });
    } catch (err: any) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setTesting(false);
    }
  };

  const isConnected = dbStatus?.connected ?? false;
  const tabs = [
    { id: 'sms', label: 'SMS / Telnyx', icon: Phone },
    { id: 'whatsapp', label: 'WhatsApp', icon: MessageSquare },
    { id: 'email', label: 'Email', icon: Mail },
    { id: 'system', label: 'System', icon: Server },
  ] as const;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} onOpenQuickSend={() => setIsQuickSendOpen(true)} />
      <Topbar
        title="Settings"
        subtitle="Manage API credentials, channels, and system configuration"
        dbConnected={isConnected}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-16 min-h-screen">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 space-y-6">

          {/* Page Header */}
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-[var(--text-heading)]">Platform Configuration</h2>
              <p className="text-sm text-[var(--text-muted)] mt-0.5">
                Configure your messaging providers and delivery channels
              </p>
            </div>
            {saveSuccess && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium bg-green-50 text-green-700 border border-green-200">
                <CheckCircle2 className="w-3.5 h-3.5" />
                Changes saved
              </div>
            )}
          </div>

          {/* Tab Navigation */}
          <div className="flex gap-1 border-b border-[var(--border-color)]">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-medium border-b-2 transition-colors -mb-px ${
                    activeTab === tab.id
                      ? 'border-blue-500 text-blue-600'
                      : 'border-transparent text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5" />
                  {tab.label}
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSave} className="space-y-4">

            {/* ── SMS / Telnyx Tab ── */}
            {activeTab === 'sms' && (
              <div className="space-y-4">
                <SectionCard
                  icon={Radio}
                  iconColor="#3b82f6"
                  iconBg="rgba(59,130,246,0.12)"
                  title="Account 1 — Toll-Free (+1-888)"
                  subtitle="Primary route for physical US & Canada mobile numbers"
                  badge="Primary"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Toll-Free Number (E.164)">
                      <input type="text" value={tollFreeNumber} onChange={e => setTollFreeNumber(e.target.value)}
                        className="zs-input text-xs font-mono" placeholder="+18884020949" />
                    </FieldGroup>
                    <FieldGroup label="Messaging Profile ID" hint="From Telnyx Portal → Messaging Profiles">
                      <input type="text" value={tollFreeProfileId} onChange={e => setTollFreeProfileId(e.target.value)}
                        className="zs-input text-xs font-mono" placeholder="4001a0fd-..." />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Account 1 API Key" hint="Starts with KEY... · Found in Telnyx API Keys section">
                    <PasswordInput value={tollFreeApiKey} onChange={(e: any) => setTollFreeApiKey(e.target.value)} placeholder="KEY01A1010..." />
                  </FieldGroup>
                </SectionCard>

                <SectionCard
                  icon={Phone}
                  iconColor="#6b7280"
                  iconBg="rgba(107,114,128,0.12)"
                  title="Account 2 — Local 10DLC (+1-479)"
                  subtitle="Secondary route for VoIP, virtual numbers & specialized delivery"
                  badge="Secondary"
                >
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Local Number (E.164)">
                      <input type="text" value={localNumber} onChange={e => setLocalNumber(e.target.value)}
                        className="zs-input text-xs font-mono" placeholder="+14795909259" />
                    </FieldGroup>
                    <FieldGroup label="Messaging Profile ID">
                      <input type="text" value={localProfileId} onChange={e => setLocalProfileId(e.target.value)}
                        className="zs-input text-xs font-mono" placeholder="4001a0c9-..." />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Account 2 API Key" hint="Separate API key from second Telnyx account">
                    <PasswordInput value={localApiKey} onChange={(e: any) => setLocalApiKey(e.target.value)} placeholder="KEY01A188C..." />
                  </FieldGroup>
                </SectionCard>

                {/* Live SMS Test */}
                <SectionCard
                  icon={Zap}
                  iconColor="#f59e0b"
                  iconBg="rgba(245,158,11,0.12)"
                  title="Live Route Test"
                  subtitle="Send a real test message to verify carrier delivery"
                >
                  <div className="flex flex-col sm:flex-row gap-3">
                    <div className="flex-1">
                      <FieldGroup label="Route">
                        <select value={testRoute} onChange={e => setTestRoute(e.target.value as any)} className="zs-input text-xs">
                          <option value="toll_free">Toll-Free (+1-888)</option>
                          <option value="local">Local 10DLC (+1-479)</option>
                        </select>
                      </FieldGroup>
                    </div>
                    <div className="flex-[2]">
                      <FieldGroup label="Destination Number">
                        <input type="text" value={testPhone} onChange={e => setTestPhone(e.target.value)}
                          className="zs-input text-xs font-mono" placeholder="+12025551234" />
                      </FieldGroup>
                    </div>
                    <div className="flex items-end">
                      <button type="button" onClick={handleTestSms} disabled={testing || !testPhone}
                        className="zs-btn-secondary text-xs px-4 py-2 disabled:opacity-40">
                        <Send className="w-3.5 h-3.5" />
                        {testing ? 'Sending…' : 'Send Test'}
                      </button>
                    </div>
                  </div>
                  {testResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-xs ${
                      testResult.success ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {testResult.success
                        ? <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                        : <AlertCircle className="w-4 h-4 flex-shrink-0" />}
                      <span>{testResult.message}</span>
                    </div>
                  )}
                </SectionCard>
              </div>
            )}

            {/* ── WhatsApp Tab ── */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-4">
                <SectionCard
                  icon={MessageSquare}
                  iconColor="#25D366"
                  iconBg="rgba(37,211,102,0.12)"
                  title="WhatsApp Business API"
                  subtitle="Meta Cloud API — send WhatsApp messages using verified business templates"
                >
                  <div className="p-3 rounded-lg border text-xs text-[var(--text-secondary)]" style={{ background: 'rgba(37,211,102,0.05)', borderColor: 'rgba(37,211,102,0.2)' }}>
                    <strong className="text-[var(--text-primary)]">How to get these credentials:</strong>
                    {' '}Go to <span className="font-mono">business.facebook.com</span> → WhatsApp Manager → API Setup. You'll need a verified business account with an approved phone number.
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="Phone Number ID" hint="From Meta Business Manager → WhatsApp → API Setup">
                      <input type="text" value={waPhoneId} onChange={e => setWaPhoneId(e.target.value)}
                        className="zs-input text-xs font-mono" placeholder="109283748291029" />
                    </FieldGroup>
                    <FieldGroup label="WhatsApp Business Account ID (WABA ID)">
                      <input type="text" value={waBusinessId} onChange={e => setWaBusinessId(e.target.value)}
                        className="zs-input text-xs font-mono" placeholder="109283748291028" />
                    </FieldGroup>
                  </div>
                  <FieldGroup label="Permanent System Access Token" hint="Generate in Meta Business → System Users with admin role">
                    <PasswordInput value={waApiKey} onChange={(e: any) => setWaApiKey(e.target.value)} placeholder="EAAG..." />
                  </FieldGroup>
                  <FieldGroup label="Webhook Verify Token" hint="Custom string to verify webhook callbacks from Meta">
                    <input type="text" value={waWebhookToken} onChange={e => setWaWebhookToken(e.target.value)}
                      className="zs-input text-xs font-mono" placeholder="zenith_wa_webhook_token" />
                  </FieldGroup>
                  <div className="p-3 rounded-lg border text-xs" style={{ background: 'var(--bg-elevated)', borderColor: 'var(--border-color)' }}>
                    <p className="font-medium text-[var(--text-primary)] mb-1">Webhook URL to set in Meta:</p>
                    <code className="font-mono text-blue-500">https://zenithtech.site/api/webhooks/whatsapp</code>
                  </div>
                </SectionCard>
              </div>
            )}

            {/* ── Email Tab ── */}
            {activeTab === 'email' && (
              <div className="space-y-4">
                <SectionCard
                  icon={Mail}
                  iconColor="#6366f1"
                  iconBg="rgba(99,102,241,0.12)"
                  title="Email Sender Configuration"
                  subtitle="Configure SMTP or API-based email delivery for campaigns and notifications"
                >
                  <FieldGroup label="Email Provider">
                    <select value={emailProvider} onChange={e => setEmailProvider(e.target.value)} className="zs-input text-xs">
                      <option value="smtp">SMTP (Mailgun, SendGrid, Gmail)</option>
                      <option value="sendgrid">SendGrid API</option>
                      <option value="resend">Resend API</option>
                      <option value="mailgun">Mailgun API</option>
                    </select>
                  </FieldGroup>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <FieldGroup label="From Email Address">
                      <input type="email" value={emailFromAddr} onChange={e => setEmailFromAddr(e.target.value)}
                        className="zs-input text-xs" placeholder="notifications@zenithtech.site" />
                    </FieldGroup>
                    <FieldGroup label="Display Name">
                      <input type="text" value={emailFromName} onChange={e => setEmailFromName(e.target.value)}
                        className="zs-input text-xs" placeholder="ZenithTech Platform" />
                    </FieldGroup>
                  </div>
                </SectionCard>

                {emailProvider === 'smtp' && (
                  <SectionCard
                    icon={Server}
                    iconColor="#9ca3af"
                    iconBg="rgba(156,163,175,0.12)"
                    title="SMTP Server Settings"
                    subtitle="Configure your SMTP host, port, and authentication"
                  >
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div className="sm:col-span-2">
                        <FieldGroup label="SMTP Host">
                          <input type="text" value={smtpHost} onChange={e => setSmtpHost(e.target.value)}
                            className="zs-input text-xs font-mono" placeholder="smtp.mailgun.org" />
                        </FieldGroup>
                      </div>
                      <FieldGroup label="Port" hint="587 (TLS), 465 (SSL), 25">
                        <input type="number" value={smtpPort} onChange={e => setSmtpPort(e.target.value)}
                          className="zs-input text-xs font-mono" placeholder="587" />
                      </FieldGroup>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FieldGroup label="SMTP Username">
                        <input type="text" value={smtpUser} onChange={e => setSmtpUser(e.target.value)}
                          className="zs-input text-xs font-mono" placeholder="apikey or username" />
                      </FieldGroup>
                      <FieldGroup label="SMTP Password / API Key">
                        <PasswordInput value={smtpPass} onChange={(e: any) => setSmtpPass(e.target.value)} placeholder="••••••••••••••••" />
                      </FieldGroup>
                    </div>
                  </SectionCard>
                )}
              </div>
            )}

            {/* ── System Tab ── */}
            {activeTab === 'system' && (
              <div className="space-y-4">
                <SectionCard
                  icon={Database}
                  iconColor="#22c55e"
                  iconBg="rgba(34,197,94,0.12)"
                  title="Database Connection"
                  subtitle="PostgreSQL connection status and diagnostics"
                >
                  <div className={`flex items-start gap-3 p-3 rounded-lg border text-xs ${
                    isConnected
                      ? 'border-green-200 bg-green-50 text-green-700'
                      : 'border-red-200 bg-red-50 text-red-700'
                  }`}>
                    {isConnected
                      ? <CheckCircle2 className="w-4 h-4 flex-shrink-0 mt-0.5 text-green-600" />
                      : <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />}
                    <div>
                      <p className="font-medium">{isConnected ? 'PostgreSQL Connected' : 'Connection Failed'}</p>
                      <p className="opacity-75 mt-0.5">
                        {isConnected
                          ? 'All models (Contact, Message, Campaign, Template) are active.'
                          : dbStatus?.error || 'Check your DATABASE_URL in .env'}
                      </p>
                    </div>
                  </div>
                  <button type="button" onClick={loadData} className="zs-btn-ghost text-xs">
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                    Test Connection
                  </button>
                </SectionCard>

                <SectionCard
                  icon={Trash2}
                  iconColor="#ef4444"
                  iconBg="rgba(239,68,68,0.12)"
                  title="Reset Database"
                  subtitle="Clear all data and test zero-states. This cannot be undone."
                >
                  <button
                    type="button"
                    onClick={async () => {
                      if (!confirm('This will delete ALL contacts, messages, and campaigns. Continue?')) return;
                      await clearAllData();
                      alert('Database cleared.');
                      loadData();
                    }}
                    className="zs-btn-danger text-xs"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Clear All Data
                  </button>
                </SectionCard>
              </div>
            )}

            {/* Save Button */}
            {activeTab !== 'system' && (
              <div className="flex justify-end pt-2">
                <button type="submit" disabled={saving} className="zs-btn-primary text-xs px-5 py-2 disabled:opacity-50">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            )}
          </form>
        </div>
      </main>

      <QuickSendModal isOpen={isQuickSendOpen} onClose={() => setIsQuickSendOpen(false)} />
    </div>
  );
}
