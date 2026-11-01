'use client';

import { useState, useEffect } from 'react';
import { X, Send, Sparkles, AlertCircle, PhoneCall, ShieldCheck, MessageSquare } from 'lucide-react';
import { sendDirectMessage, getContacts, getTemplates } from '@/lib/db-actions';
import { inspectDestination, RouteInspection } from '@/lib/telnyx';

interface QuickSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSent?: () => void;
}

export default function QuickSendModal({ isOpen, onClose, onSuccess, onSent }: QuickSendModalProps) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [channel, setChannel] = useState<'sms' | 'whatsapp'>('sms');
  const [routePreference, setRoutePreference] = useState<'auto' | 'toll_free' | 'local'>('auto');
  const [contacts, setContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [inspection, setInspection] = useState<RouteInspection | null>(null);

  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[\s()\-.]/g, '');
    setPhone(cleaned);

    if (cleaned.length >= 10) {
      const formatted = cleaned.startsWith('+') ? cleaned : (cleaned.length === 10 ? '+1' + cleaned : '+' + cleaned);
      const res = inspectDestination(formatted);
      setInspection(res);
    } else {
      setInspection(null);
    }
  };

  useEffect(() => {
    if (isOpen) {
      getContacts().then(setContacts);
      getTemplates().then(setTemplates);
      setStatusMsg('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const charCount = message.length;
  const segments = Math.ceil(charCount / 160) || 1;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !message) {
      setStatusMsg('Please provide a phone number and message content.');
      return;
    }

    let targetPhone = phone.trim().replace(/[\s()\-.]/g, '');
    if (/^[2-9]\d{9}$/.test(targetPhone)) {
      targetPhone = '+1' + targetPhone;
    } else if (/^1[2-9]\d{9}$/.test(targetPhone)) {
      targetPhone = '+' + targetPhone;
    } else if (!targetPhone.startsWith('+')) {
      targetPhone = '+' + targetPhone;
    }

    setSending(true);
    setStatusMsg('');

    try {
      const res = await sendDirectMessage(
        targetPhone,
        message,
        undefined,
        routePreference,
        channel
      );

      if (res && (res as any).error) {
        setStatusMsg(`Notice: ${(res as any).error}`);
        (onSuccess || onSent)?.();
      } else {
        setPhone('');
        setMessage('');
        (onSuccess || onSent)?.();
        onClose();
      }
    } catch (err: any) {
      setStatusMsg(err.message || 'Failed to dispatch message.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
      <div className="relative w-full max-w-lg bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border-color)]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[var(--text-heading)]">Direct Omnichannel Dispatch</h2>
              <p className="text-[11px] text-[var(--text-muted)]">US & Canada Dual-Route Telnyx + WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)]"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSend} className="p-6 space-y-4">
          {/* Channel Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-[var(--bg-elevated)] rounded-xl border border-[var(--border-subtle)]">
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                channel === 'sms'
                  ? 'bg-[var(--bg-card)] text-blue-500 shadow-sm border border-blue-500/30'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telnyx SMS (US & CA)</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all ${
                channel === 'whatsapp'
                  ? 'bg-[var(--bg-card)] text-emerald-600 shadow-sm border border-emerald-200/50'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-primary)]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Suite</span>
            </button>
          </div>

          {/* Telnyx Route Preference (if SMS) */}
          {channel === 'sms' && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
                Telnyx Sender Route
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRoutePreference('auto')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    routePreference === 'auto'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <p>Smart Auto</p>
                  <p className="text-[10px] text-[var(--text-muted)]">AI Carrier Inspect</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRoutePreference('toll_free')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    routePreference === 'toll_free'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <p>Toll-Free</p>
                  <p className="text-[10px] text-[var(--text-muted)]">+1 (888) 402-0949</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRoutePreference('local')}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition-all text-center ${
                    routePreference === 'local'
                      ? 'border-blue-500 bg-blue-500/10 text-blue-500 font-bold'
                      : 'border-[var(--border-color)] text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <p>Local 10DLC</p>
                  <p className="text-[10px] text-[var(--text-muted)]">+1 (479) 590-9259</p>
                </button>
              </div>
            </div>
          )}

          {/* Recipient Phone */}
          <div>
            <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1.5">
              Recipient Phone Number (US & Canada)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="e.g. +14155552671 or 4155552671"
              className="zs-input text-xs font-mono"
              required
            />
            {inspection && (
              <div className="mt-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-blue-400 flex items-center justify-between">
                <span className="font-semibold">{inspection.carrierLabel}</span>
                <span className="font-mono text-[10px] bg-[var(--bg-elevated)] px-1.5 py-0.5 rounded border border-blue-500/20 text-[var(--text-primary)]">
                  {inspection.suggestedSender}
                </span>
              </div>
            )}
          </div>

          {/* Templates fast select */}
          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-[var(--text-secondary)] mb-1">
                Insert Saved Template
              </label>
              <select
                onChange={(e) => {
                  const t = templates.find((tpl) => tpl.id === e.target.value);
                  if (t) setMessage(t.content);
                }}
                className="zs-input text-xs"
                defaultValue=""
              >
                <option value="">-- Choose a template --</option>
                {templates.map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.name} ({tpl.channel.toUpperCase()})
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Message Content */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Message Text</label>
              <span className="text-[10px] text-[var(--text-muted)] font-mono">
                {charCount} chars • {segments} segment{segments > 1 ? 's' : ''}
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here... Use {{name}} for dynamic tags."
              className="zs-input text-xs resize-none"
              required
            />
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
            <button
              type="button"
              onClick={onClose}
              className="zs-btn-secondary text-xs py-2 px-4"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="zs-btn-primary text-xs py-2 px-5"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Dispatching...' : 'Send Message Now'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
