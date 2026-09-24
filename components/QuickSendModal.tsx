'use client';

import { useState, useEffect } from 'react';
import { X, Send, User, Sparkles, AlertCircle } from 'lucide-react';
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

  // Auto-format phone: ensure it starts with + and has country code
  const handlePhoneChange = (val: string) => {
    // Strip spaces and dashes
    let cleaned = val.replace(/[\s\-]/g, '');
    // If user typed digits only (no +), auto-prepend +
    if (cleaned && !cleaned.startsWith('+')) {
      cleaned = '+' + cleaned;
    }
    setPhone(cleaned);
    // Validate E.164: + followed by 7-15 digits
    if (cleaned && !/^\+[1-9]\d{6,14}$/.test(cleaned)) {
      setPhoneError('Must be E.164 format: +[country code][number] e.g. +918920856958 or +12025550199');
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
    // Block if phone format is invalid
    if (!/^\+[1-9]\d{6,14}$/.test(phone)) {
      setStatusMsg(
        `❌ Invalid phone format: "${phone}". Use E.164 with country code, e.g. +918920856958 (India) or +12025550199 (US).`
      );
      return;
    }

    setSending(true);
    setStatusMsg('');

    try {
      const res = await sendDirectMessage(phone, message);
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-in fade-in">
      <div className="w-full max-w-lg rounded-2xl bg-[#0f1129] border border-[#6366f1]/30 shadow-2xl p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 text-[#94a3b8] hover:text-white p-1 rounded-lg hover:bg-[#181a35] transition-all cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-[#6366f1] to-[#06b6d4] flex items-center justify-center">
            <Send className="w-5 h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">Quick Send SMS</h2>
            <p className="text-xs text-[#94a3b8]">Live dispatch saved directly to PostgreSQL</p>
          </div>
        </div>

        {statusMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#ef4444]/15 border border-[#ef4444]/30 text-xs text-[#f87171] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>{statusMsg}</span>
          </div>
        )}

        <form onSubmit={handleSend} className="space-y-4">
          {/* Recipient Input & Contact Picker */}
          <div>
            <label className="block text-xs font-medium text-[#94a3b8] mb-1.5">
              Recipient Phone Number (E.164)
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="+918920856958 or +12025550199"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                className={`flex-1 bg-[#0d0f26] border rounded-xl px-3.5 py-2.5 text-sm text-white focus:outline-none transition-all placeholder:text-[#475569] ${
                  phoneError ? 'border-[#ef4444]/60 focus:border-[#ef4444]' : 'border-[#6366f1]/25 focus:border-[#6366f1]'
                }`}
                required
              />
              {contacts.length > 0 && (
                <select
                  onChange={(e) => setPhone(e.target.value)}
                  className="bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-2.5 py-2 text-xs text-[#94a3b8] focus:outline-none cursor-pointer"
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
              <p className="mt-1.5 text-[11px] text-[#ef4444] flex items-center gap-1">
                <span>⚠️</span> {phoneError}
              </p>
            ) : (
              <p className="mt-1.5 text-[11px] text-[#64748b]">
                💡 Include country code: <span className="text-[#818cf8] font-mono">+91</span> for India, <span className="text-[#818cf8] font-mono">+1</span> for US
              </p>
            )}
          </div>

          {/* Template Quick Insert */}
          {templates.length > 0 && (
            <div>
              <span className="text-[11px] text-[#94a3b8] block mb-1.5 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-[#06b6d4]" /> Insert Template:
              </span>
              <div className="flex flex-wrap gap-1.5">
                {templates.slice(0, 3).map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => applyTemplate(tpl.content)}
                    className="px-2.5 py-1 rounded-lg bg-[#181a35] hover:bg-[#6366f1]/20 border border-[#6366f1]/20 text-[11px] text-[#818cf8] transition-all cursor-pointer"
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
              <label className="text-xs font-medium text-[#94a3b8]">Message Body</label>
              <span className="text-[11px] text-[#818cf8]">
                {charCount} chars • {segments} {segments === 1 ? 'segment' : 'segments'}
              </span>
            </div>
            <textarea
              rows={4}
              placeholder="Type your SMS message here..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl p-3 text-sm text-white focus:outline-none focus:border-[#6366f1] transition-all placeholder:text-[#475569] resize-none"
              required
            />
          </div>

          {/* Send Button */}
          <div className="pt-2 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#94a3b8] hover:text-white hover:bg-[#181a35] transition-all cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={sending}
              className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white font-medium text-xs flex items-center gap-2 shadow-lg shadow-indigo-600/30 hover:shadow-indigo-600/50 hover:scale-[1.02] transition-all cursor-pointer disabled:opacity-50"
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
