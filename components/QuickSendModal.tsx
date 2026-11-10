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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in-up">
      <div className="relative w-full max-w-lg vision-card border border-blue-500/30 shadow-2xl overflow-hidden p-6 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-white/10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-600 to-cyan-400 text-white flex items-center justify-center shadow-md">
              <Send className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black text-white">Direct Omnichannel Dispatch</h2>
              <p className="text-[11px] text-slate-400">US &amp; Canada Dual-Route Telnyx + WhatsApp</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSend} className="space-y-4">
          {/* Channel Selector */}
          <div className="grid grid-cols-2 gap-2 p-1 bg-white/[0.03] rounded-xl border border-white/5">
            <button
              type="button"
              onClick={() => setChannel('sms')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                channel === 'sms'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Send className="w-3.5 h-3.5" />
              <span>Telnyx SMS (US &amp; CA)</span>
            </button>
            <button
              type="button"
              onClick={() => setChannel('whatsapp')}
              className={`flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                channel === 'whatsapp'
                  ? 'bg-emerald-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>WhatsApp Suite</span>
            </button>
          </div>

          {/* Telnyx Route Preference (if SMS) */}
          {channel === 'sms' && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1.5">
                Telnyx Sender Route
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setRoutePreference('auto')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    routePreference === 'auto'
                      ? 'border-blue-500 bg-blue-600/20 text-cyan-300'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <p>Smart Auto</p>
                  <p className="text-[10px] text-slate-400 font-normal">AI Carrier Inspect</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRoutePreference('toll_free')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    routePreference === 'toll_free'
                      ? 'border-blue-500 bg-blue-600/20 text-cyan-300'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <p>Toll-Free</p>
                  <p className="text-[10px] text-slate-400 font-mono font-normal">+1 (888)</p>
                </button>
                <button
                  type="button"
                  onClick={() => setRoutePreference('local')}
                  className={`p-2 rounded-xl text-xs font-bold border transition-all text-center cursor-pointer ${
                    routePreference === 'local'
                      ? 'border-blue-500 bg-blue-600/20 text-cyan-300'
                      : 'border-white/10 text-slate-400 hover:bg-white/5'
                  }`}
                >
                  <p>Local 10DLC</p>
                  <p className="text-[10px] text-slate-400 font-mono font-normal">+1 (479)</p>
                </button>
              </div>
            </div>
          )}

          {/* Recipient Phone */}
          <div>
            <label className="block text-xs font-bold text-slate-300 mb-1">
              Recipient Phone Number (US &amp; Canada)
            </label>
            <input
              type="text"
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              placeholder="e.g. +14155552671"
              className="vision-input text-xs font-mono bg-[#0b1437]"
              required
            />
            {inspection && (
              <div className="mt-2 p-2 rounded-xl bg-blue-500/10 border border-blue-500/20 text-[11px] text-cyan-400 flex items-center justify-between">
                <span className="font-semibold">{inspection.carrierLabel}</span>
                <span className="font-mono text-[10px] bg-white/5 px-2 py-0.5 rounded border border-blue-500/20 text-white">
                  {inspection.suggestedSender}
                </span>
              </div>
            )}
          </div>

          {/* Templates fast select */}
          {templates.length > 0 && (
            <div>
              <label className="block text-xs font-bold text-slate-300 mb-1">
                Insert Saved Template
              </label>
              <select
                onChange={(e) => {
                  const t = templates.find((tpl) => tpl.id === e.target.value);
                  if (t) setMessage(t.content);
                }}
                className="vision-input text-xs bg-[#0b1437]"
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
            <div className="flex items-center justify-between mb-1">
              <label className="text-xs font-bold text-slate-300">Message Text</label>
              <span className="text-[10px] text-slate-400 font-mono">
                {charCount} chars • {segments} segment{segments > 1 ? 's' : ''}
              </span>
            </div>
            <textarea
              rows={4}
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your message here..."
              className="vision-input text-xs bg-[#0b1437] resize-none"
              required
            />
          </div>

          {statusMsg && (
            <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>{statusMsg}</span>
            </div>
          )}

          {/* Submit Action */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-white/10">
            <button
              type="button"
              onClick={onClose}
              className="vision-btn-glass text-xs py-2 px-4"
              disabled={sending}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="vision-btn-primary text-xs py-2 px-5 shadow-lg"
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
