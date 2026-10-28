'use client';

import { useState, useEffect } from 'react';
import { X, Send, Sparkles, AlertCircle, PhoneCall } from 'lucide-react';
import { sendDirectMessage, getContacts, getTemplates } from '@/lib/db-actions';

interface QuickSendModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onSent?: () => void;
}

export default function QuickSendModal({ isOpen, onClose, onSuccess, onSent }: QuickSendModalProps) {
  const [phone, setPhone] = useState('');
  const [message, setMessage] = useState('');
  const [contacts, setContacts] = useState<any[]>([]);
  const [templates, setTemplates] = useState<any[]>([]);
  const [sending, setSending] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  const [phoneError, setPhoneError] = useState('');

  // Validate phone — accept any E.164, warn if not US/CA
  const handlePhoneChange = (val: string) => {
    const cleaned = val.replace(/[\s()\-.]/g, '');
    setPhone(cleaned);

    const isE164 = /^\+[1-9]\d{6,14}$/.test(cleaned);
    const isTenDigit = /^[2-9]\d{9}$/.test(cleaned);

    if (cleaned && cleaned.length > 5 && !isE164 && !isTenDigit) {
      setPhoneError('Enter a valid phone number in E.164 format (e.g. +14155552671 or +918920856958)');
    } else {
      setPhoneError('');
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
    // Auto-prefix 10-digit US/CA numbers
    if (/^[2-9]\d{9}$/.test(targetPhone)) {
      targetPhone = '+1' + targetPhone;
    } else if (/^1[2-9]\d{9}$/.test(targetPhone)) {
      targetPhone = '+' + targetPhone;
    } else if (!targetPhone.startsWith('+')) {
      targetPhone = '+' + targetPhone;
    }

    if (!/^\+[1-9]\d{6,14}$/.test(targetPhone)) {
      setStatusMsg(
        `❌ Invalid number: "${phone}". Please enter a valid phone number in E.164 format.`
      );
      return;
    }

    setSending(true);
    setStatusMsg('');

    try {
      const res = await sendDirectMessage(targetPhone, message);
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

  const applyTemplate = (tplContent: string) => {
    setMessage(tplContent);
  };

  return (
    <div className="zs-modal-overlay p-4">
      <div className="zs-modal p-6 relative max-w-lg">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[var(--text-muted)] hover:text-[var(--text-primary)] p-1.5 rounded-xl hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center shadow-md shadow-indigo-200">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-[var(--text-heading)]">Quick Send SMS</h2>
            <p className="text-xs text-[var(--text-muted)]">Via Telnyx Toll-Free · US & Canada Only</p>
          </div>
        </div>

        {/* Provider Badge */}
        <div className="mb-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-emerald-500 flex items-center justify-center flex-shrink-0">
            <PhoneCall className="w-3.5 h-3.5 text-white" />
          </div>
          <div>
            <p className="text-xs font-bold text-emerald-800">🇺🇸 🇨🇦 Telnyx Verified Toll-Free</p>
            <p className="text-[11px] text-emerald-700 font-mono">Sender: +1 (888) 402-0949 · Attempts delivery to any country</p>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          {/* Recipient Input & Contact Picker */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">
                Recipient Phone Number
              </label>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="+14155552671 or 10-digit US/CA number"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`zs-input flex-1 ${phoneError ? 'border-rose-400 focus:border-rose-500' : ''}`}
                required
              />
              {contacts.length > 0 && (
                <select
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-xl px-2.5 py-2 text-xs text-[var(--text-secondary)] focus:outline-none cursor-pointer hover:border-[var(--border-strong)]"
                >
                  <option value="">Pick Contact</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.phone}>
                      {c.name} ({c.phone})
                    </option>
                  ))}
                </select>
              )}
            </div>
            {phoneError ? (
              <p className="mt-1.5 text-[11px] text-rose-600 flex items-center gap-1">
                <span>⚠️</span> {phoneError}
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-[var(--text-muted)]">
                💡 Sent via <span className="text-emerald-600 font-mono font-semibold">+18884020949</span> (Telnyx Toll-Free) · For non-US/CA numbers, Telnyx will try but carrier may reject
              </p>
            )}
          </div>

          {/* Template Quick Insert */}
          {templates.length > 0 && (
            <div>
              <span className="text-[11px] font-semibold text-[var(--text-secondary)] block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-cyan-600" /> Insert Saved Template:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {templates.slice(0, 4).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.content)}
                    className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] hover:bg-indigo-50 border border-[var(--border-color)] hover:border-indigo-200 text-[11px] text-indigo-700 font-medium transition-all cursor-pointer"
                  >
                    {tpl.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Message Textarea */}
          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="text-xs font-semibold text-[var(--text-secondary)]">Message Body</label>
              <span className="text-[11px] font-medium text-indigo-600">
                {charCount} chars • {segments} {segments === 1 ? 'segment' : 'segments'}
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Type your SMS message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="zs-input resize-none"
              required
            />
          </div>

          {/* Actions */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="zs-btn-secondary"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="zs-btn-primary"
            >
              <Send className="w-3.5 h-3.5" />
              <span>{sending ? 'Dispatching...' : 'Dispatch Message'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
