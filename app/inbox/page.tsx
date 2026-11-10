'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import {
  getInboxThreads,
  getMessagesForPhone,
  sendDirectMessage,
  simulateInboundReply,
  syncTelnyxInbound,
  deleteMessage,
  deleteInboxThread,
  clearInboxThread,
} from '@/lib/db-actions';
import {
  Inbox,
  Send,
  User,
  MessageSquare,
  CheckCheck,
  Check,
  Clock,
  AlertCircle,
  Bot,
  RefreshCw,
  Search,
  ArrowLeft,
  Sparkles,
  Trash2,
  MoreVertical,
  Copy,
  ShieldCheck,
  X,
  Phone,
  Smile,
  Paperclip,
  CheckCircle2,
} from 'lucide-react';

interface InboxThread {
  phone: string;
  name: string;
  lastMessage: string;
  lastTimestamp: Date;
  direction: string;
  status: string;
  unreadCount: number;
  channel: string;
  senderRoute?: string;
  country?: string;
  carrierType?: string;
}

function MessageStatusBadge({ status }: { status: string }) {
  if (status === 'delivered') {
    return (
      <div className="inline-flex items-center gap-1 text-[#38bdf8]" title="Carrier Delivered">
        <CheckCheck className="w-3.5 h-3.5" />
        <span className="text-[9px] font-bold">Delivered</span>
      </div>
    );
  }
  if (status === 'sent') {
    return (
      <div className="inline-flex items-center gap-1 text-slate-300" title="Sent (Carrier Processing)">
        <Check className="w-3.5 h-3.5" />
        <span className="text-[9px] font-medium">Sent</span>
      </div>
    );
  }
  if (status === 'failed') {
    return (
      <div className="inline-flex items-center gap-1 text-rose-400" title="Delivery Failed">
        <AlertCircle className="w-3.5 h-3.5" />
        <span className="text-[9px] font-bold">Failed</span>
      </div>
    );
  }
  // pending
  return (
    <div className="inline-flex items-center gap-1 text-amber-300/80" title="Processing...">
      <Clock className="w-3 h-3 animate-spin-slow" />
      <span className="text-[9px]">Sending...</span>
    </div>
  );
}

export default function WhatsAppStyleInboxPage() {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [activePhone, setActivePhone] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'toll_free' | 'local' | 'whatsapp'>('all');
  const [replyRoute, setReplyRoute] = useState<'auto' | 'toll_free' | 'local' | 'whatsapp'>('auto');
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<'thread' | 'message' | null>(null);
  const [pendingDeleteMsgId, setPendingDeleteMsgId] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePhoneRef = useRef<string>('');

  useEffect(() => {
    activePhoneRef.current = activePhone;
  }, [activePhone]);

  const refreshThreads = useCallback(async () => {
    try {
      const data = await getInboxThreads();
      setThreads(data || []);
      // On desktop, auto-select first thread if none selected
      if (data && data.length > 0 && !activePhoneRef.current && window.innerWidth >= 768) {
        setActivePhone(data[0].phone);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  const loadThreads = useCallback(async () => {
    setInitialLoading(true);
    await refreshThreads();
    setInitialLoading(false);
  }, [refreshThreads]);

  const loadMessages = useCallback(async () => {
    if (!activePhone) return;
    try {
      const msgs = await getMessagesForPhone(activePhone);
      setMessages(msgs || []);
    } catch (err) {
      console.error(err);
    }
  }, [activePhone]);

  useEffect(() => {
    loadThreads();
  }, [loadThreads]);

  useEffect(() => {
    loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const interval = setInterval(() => {
      refreshThreads();
      loadMessages();
    }, 6000);
    return () => clearInterval(interval);
  }, [refreshThreads, loadMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePhone || isSending) return;
    const text = inputText.trim();
    setInputText('');
    setIsSending(true);

    const tempMsg = {
      id: 'temp_' + Date.now(),
      contactId: null,
      channel: replyRoute === 'whatsapp' ? 'whatsapp' : 'sms',
      senderRoute: replyRoute === 'auto' ? 'toll_free' : replyRoute,
      direction: 'outbound',
      toPhone: activePhone,
      fromPhone: '+18884020949',
      content: text,
      status: 'delivered', // Delivered by default per user request
      cost: 0.015,
      sentAt: new Date(),
    };

    setMessages((prev) => [...prev, tempMsg]);

    try {
      await sendDirectMessage(activePhone, text, replyRoute);
      await loadMessages();
      await refreshThreads();
    } catch (err) {
      console.error(err);
    } finally {
      setIsSending(false);
    }
  };

  const handleSimulateInbound = async () => {
    if (!activePhone) return;
    const sampleReplies = [
      'Thanks for the quick notification, confirmed!',
      'Can you please send me the invoice breakdown as well?',
      'Yes, the OTP code worked properly, thank you!',
      'Great, our team will review the campaign metrics today.',
    ];
    const reply = sampleReplies[Math.floor(Math.random() * sampleReplies.length)];
    await simulateInboundReply(activePhone, reply);
    await loadMessages();
    await refreshThreads();
  };

  const handleDeleteMessage = async (msgId: string) => {
    try {
      await deleteMessage(msgId);
      setMessages((prev) => prev.filter((m) => m.id !== msgId));
      setDeleteConfirmModal(null);
      setPendingDeleteMsgId(null);
      await refreshThreads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleDeleteThread = async () => {
    if (!activePhone) return;
    try {
      await deleteInboxThread(activePhone);
      setDeleteConfirmModal(null);
      setActivePhone('');
      await refreshThreads();
    } catch (err) {
      console.error(err);
    }
  };

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  const activeThread = threads.find((t) => t.phone === activePhone);

  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.phone.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.name && t.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (t.lastMessage && t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (channelFilter === 'whatsapp') return t.channel === 'whatsapp';
    if (channelFilter === 'toll_free') return t.senderRoute === 'toll_free' || (!t.senderRoute && t.channel === 'sms');
    if (channelFilter === 'local') return t.senderRoute === 'local';
    return true;
  });

  return (
    <div className="min-h-screen text-white bg-[var(--bg-main)]">
      {/* Sidebar */}
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />

      {/* Topbar */}
      <Topbar
        title="Live Inbox"
        subtitle="Two-way conversations across SMS, WhatsApp & Email"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      {/* Main Responsive Chat Layout: Fixed Height & Split View */}
      <main className="lg:pl-[260px] pl-0 w-full pt-16 sm:pt-[72px] h-screen flex flex-col overflow-hidden">
        <div className="inbox-container flex-1 flex overflow-hidden m-2 sm:m-4 rounded-2xl border border-white/10 bg-[#060b26] shadow-2xl relative">

          {/* ═══ LEFT PANE: THREAD LIST (Mobile: Full Width when no active chat) ═══ */}
          <div
            className={`w-full md:w-[320px] lg:w-[360px] flex flex-col flex-shrink-0 border-r border-white/10 bg-[#060b26] ${
              activePhone ? 'hidden md:flex' : 'flex'
            }`}
          >
            {/* Header / Search Controls */}
            <div className="p-3.5 sm:p-4 border-b border-white/10 space-y-3 bg-[#060b26] flex-shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-blue-600/20 text-cyan-400 flex items-center justify-center">
                    <MessageSquare className="w-4 h-4" />
                  </div>
                  <div>
                    <h2 className="text-sm font-black text-white">Conversations</h2>
                    <p className="text-[10px] text-slate-400">SMS • WhatsApp • Email</p>
                  </div>
                </div>
                <button
                  onClick={refreshThreads}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                  title="Sync threads"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Search input */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone or text..."
                  className="vision-input text-xs bg-[#0b1437]"
                  style={{ paddingLeft: '2.5rem' }}
                />
              </div>

              {/* Channel filter pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                {[
                  { key: 'all', label: 'All Channels' },
                  { key: 'toll_free', label: 'Toll-Free' },
                  { key: 'local', label: 'Local 10DLC' },
                  { key: 'whatsapp', label: 'WhatsApp' },
                ].map((f) => (
                  <button
                    key={f.key}
                    onClick={() => setChannelFilter(f.key as any)}
                    className={`px-2.5 py-1 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                      channelFilter === f.key
                        ? 'bg-blue-600 text-white shadow-[0_0_10px_rgba(0,117,255,0.6)]'
                        : 'bg-white/5 text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation Threads Scrollable List */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/5 sidebar-scroll">
              {initialLoading ? (
                <div className="p-4 space-y-3">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-10 h-10 rounded-xl bg-white/10 flex-shrink-0" />
                      <div className="flex-1 space-y-2">
                        <div className="h-3 bg-white/10 rounded w-3/4" />
                        <div className="h-2.5 bg-white/5 rounded w-1/2" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-slate-400 space-y-2">
                  <Inbox className="w-8 h-8 mx-auto opacity-30 text-blue-400" />
                  <p className="text-sm font-bold text-white">No conversations found</p>
                  <p className="text-xs">Dispatch a message to start chatting.</p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = thread.phone === activePhone;
                  const isWA = thread.channel === 'whatsapp';
                  return (
                    <div
                      key={thread.phone}
                      onClick={() => setActivePhone(thread.phone)}
                      className={`p-3.5 cursor-pointer flex items-start gap-3 transition-all ${
                        isSelected
                          ? 'bg-blue-600/15 border-l-4 border-blue-500'
                          : 'hover:bg-white/[0.03] border-l-4 border-transparent'
                      }`}
                    >
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center font-black text-xs text-white flex-shrink-0 shadow-md ${
                          isWA
                            ? 'bg-gradient-to-tr from-blue-600 to-cyan-400'
                            : 'bg-gradient-to-tr from-blue-600 to-cyan-400'
                        }`}
                      >
                        {thread.name ? thread.name.slice(0, 2).toUpperCase() : 'US'}
                      </div>

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-black text-white truncate">
                            {thread.name || thread.phone}
                          </p>
                          <span className="text-[10px] text-slate-400 flex-shrink-0 ml-1">
                            {new Date(thread.lastTimestamp).toLocaleTimeString([], {
                              hour: '2-digit',
                              minute: '2-digit',
                            })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-cyan-400 truncate">
                            {thread.phone}
                          </span>
                          <span
                            className={`text-[9px] font-bold px-1.5 py-0.2 rounded bg-blue-500/15 text-cyan-300`}
                          >
                            {isWA ? 'WA' : thread.senderRoute === 'local' ? '10DLC' : 'TF'}
                          </span>
                        </div>

                        <p className="text-xs text-slate-300 truncate mt-1">
                          {thread.direction === 'outbound' && (
                            <span className="text-cyan-400 font-semibold">You: </span>
                          )}
                          {thread.lastMessage}
                        </p>
                      </div>

                      {thread.unreadCount > 0 && (
                        <div className="w-5 h-5 rounded-full bg-blue-600 text-[10px] font-black text-white flex items-center justify-center self-center flex-shrink-0 shadow-[0_0_8px_rgba(0,117,255,0.7)]">
                          {thread.unreadCount}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ═══ RIGHT PANE: ACTIVE CHAT VIEW (WhatsApp-Style) ═══ */}
          <div
            className={`flex-1 flex flex-col overflow-hidden bg-[#070e2c] ${
              !activePhone ? 'hidden md:flex' : 'flex'
            }`}
          >
            {activePhone ? (
              <>
                {/* Active Chat Top Header */}
                <div className="h-14 sm:h-16 px-4 flex items-center justify-between flex-shrink-0 border-b border-white/10 bg-[#060b26]">
                  <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
                    {/* Back button (Mobile only) */}
                    <button
                      onClick={() => setActivePhone('')}
                      className="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="Back to conversations"
                    >
                      <ArrowLeft className="w-5 h-5" />
                    </button>

                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-cyan-400 flex items-center justify-center font-black text-xs text-white shadow-md flex-shrink-0">
                      {activeThread?.name ? activeThread.name.slice(0, 2).toUpperCase() : 'US'}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5">
                        <h3 className="text-xs sm:text-sm font-black text-white truncate">
                          {activeThread?.name || activePhone}
                        </h3>
                        <span>{activeThread?.country === 'CA' ? '🇨🇦' : '🇺🇸'}</span>
                      </div>
                      <div className="flex items-center gap-1.5 text-[10px] text-slate-400">
                        <span className="font-mono text-cyan-400 font-bold">{activePhone}</span>
                        <span>•</span>
                        <span className="text-emerald-400 font-semibold">
                          {activeThread?.channel === 'whatsapp'
                            ? 'WhatsApp Business'
                            : activeThread?.senderRoute === 'local'
                            ? 'Local 10DLC'
                            : 'Toll-Free (+1888)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Top Chat Action Controls */}
                  <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0 relative">
                    <button
                      onClick={handleSimulateInbound}
                      className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-600/20 text-purple-300 border border-purple-500/30 text-xs font-bold hover:bg-purple-600/30 transition-all cursor-pointer"
                      title="Simulate customer reply for testing"
                    >
                      <Bot className="w-3.5 h-3.5 text-purple-400" />
                      <span>Simulate Reply</span>
                    </button>

                    <button
                      onClick={() => setShowThreadMenu(!showThreadMenu)}
                      className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                      title="More options"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown Menu */}
                    {showThreadMenu && (
                      <div className="absolute right-0 top-full mt-2 w-52 p-1.5 rounded-2xl bg-[#0b1437] border border-blue-500/30 shadow-2xl z-50 animate-scale-in">
                        <button
                          onClick={() => {
                            setShowThreadMenu(false);
                            setDeleteConfirmModal('thread');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-rose-400 hover:bg-rose-500/10 rounded-xl transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-4 h-4" />
                          <span>Delete Conversation</span>
                        </button>
                        <button
                          onClick={async () => {
                            setShowThreadMenu(false);
                            await clearInboxThread(activePhone);
                            setMessages([]);
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Clear Chat History</span>
                        </button>
                        <button
                          onClick={async () => {
                            setShowThreadMenu(false);
                            await syncTelnyxInbound();
                            await refreshThreads();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-bold text-slate-300 hover:bg-white/5 rounded-xl transition-colors cursor-pointer"
                        >
                          <RefreshCw className="w-4 h-4" />
                          <span>Sync Carrier Webhooks</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Messages Container with WhatsApp Wallpaper Aesthetic */}
                <div className="flex-1 p-3.5 sm:p-5 overflow-y-auto space-y-3.5 sidebar-scroll">
                  {/* Carrier Encrypted Notice */}
                  <div className="flex justify-center">
                    <span className="text-[10px] px-3.5 py-1 rounded-full bg-white/5 border border-white/10 text-slate-400 font-medium shadow-xs">
                      🔒 End-to-end Carrier Encrypted • US &amp; Canada Telecommunications
                    </span>
                  </div>

                  {messages.map((msg) => {
                    const isOut = msg.direction === 'outbound';
                    const isWA = msg.channel === 'whatsapp';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isOut ? 'items-end' : 'items-start'} animate-fade-in-up`}
                      >
                        <div
                          className={`relative max-w-[85%] sm:max-w-[70%] p-3.5 rounded-2xl shadow-md transition-all ${
                            isOut
                              ? 'bg-gradient-to-tr from-blue-600 via-blue-500 to-cyan-500 text-white rounded-tr-xs'
                              : 'bg-[#10193d] border border-white/10 text-slate-100 rounded-tl-xs'
                          }`}
                        >
                          {/* Contact name on Inbound */}
                          {!isOut && (
                            <p className="text-[11px] font-extrabold text-cyan-300 mb-1">
                              {activeThread?.name || msg.fromPhone}
                            </p>
                          )}

                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap font-medium">
                            {msg.content}
                          </p>

                          {/* Timestamp + WhatsApp-Style Status Icon */}
                          <div className="flex items-center justify-end gap-1.5 mt-1.5 text-right opacity-90">
                            <span className="text-[10px] text-white/80 font-mono">
                              {new Date(msg.sentAt).toLocaleTimeString([], {
                                hour: '2-digit',
                                minute: '2-digit',
                              })}
                            </span>
                            {isOut && <MessageStatusBadge status={msg.status} />}
                          </div>

                          {/* Action Hover: WhatsApp-Style Delete & Copy */}
                          <div
                            className={`absolute top-1 ${
                              isOut ? '-left-16' : '-right-16'
                            } hidden group-hover:flex items-center gap-1 bg-[#0b1437] p-1 rounded-xl border border-white/10 shadow-lg`}
                          >
                            <button
                              onClick={() => {
                                setPendingDeleteMsgId(msg.id);
                                setDeleteConfirmModal('message');
                              }}
                              className="p-1 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleCopy(msg.content)}
                              className="p-1 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors cursor-pointer"
                              title="Copy text"
                            >
                              <Copy className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Input Area */}
                <div className="p-3 sm:p-4 border-t border-white/10 bg-[#060b26] space-y-2.5 flex-shrink-0">
                  {/* Route selector pills */}
                  <div className="flex items-center gap-2 overflow-x-auto no-scrollbar text-xs">
                    <span className="text-[11px] font-bold text-slate-400 whitespace-nowrap">
                      Reply via:
                    </span>
                    {[
                      { key: 'auto', label: 'Smart Auto (+1888)' },
                      { key: 'toll_free', label: 'Toll-Free' },
                      { key: 'local', label: 'Local 10DLC' },
                      { key: 'whatsapp', label: 'WhatsApp' },
                    ].map((r) => (
                      <button
                        key={r.key}
                        type="button"
                        onClick={() => setReplyRoute(r.key as any)}
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                          replyRoute === r.key
                            ? 'bg-blue-600 text-white shadow-[0_0_8px_rgba(0,117,255,0.6)]'
                            : 'bg-white/5 text-slate-400 hover:text-white'
                        }`}
                      >
                        {r.label}
                      </button>
                    ))}
                  </div>

                  {/* Send Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder={`Type message to ${activeThread?.name || activePhone}...`}
                      className="vision-input flex-1 py-2.5 text-xs sm:text-sm bg-[#0b1437]"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputText.trim()}
                      className="vision-btn-primary py-2.5 px-4 text-xs sm:text-sm shadow-lg flex items-center gap-1.5 flex-shrink-0 disabled:opacity-50 cursor-pointer"
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-slate-400">
                <div className="w-16 h-16 rounded-3xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-400 mb-4 shadow-[0_0_20px_rgba(0,117,255,0.3)]">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-extrabold text-white">No Conversation Selected</h3>
                <p className="text-xs max-w-sm mt-1 leading-relaxed">
                  Choose a recipient from the left list to review real-time message logs, carrier deliverability, or dispatch responses.
                </p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Delete Confirmation Modal (WhatsApp Style) */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <div className="vision-card w-full max-w-sm p-6 space-y-4 animate-scale-in">
            <div className="w-12 h-12 rounded-2xl bg-rose-500/20 border border-rose-500/30 text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>
            <div className="text-center space-y-1">
              <h3 className="text-base font-black text-white">
                {deleteConfirmModal === 'thread' ? 'Delete Conversation?' : 'Delete Message?'}
              </h3>
              <p className="text-xs text-slate-300">
                {deleteConfirmModal === 'thread'
                  ? 'This will permanently remove this conversation from your live inbox.'
                  : 'This message will be deleted for everyone in this conversation.'}
              </p>
            </div>
            <div className="flex gap-2.5 pt-2">
              <button
                onClick={() => {
                  setDeleteConfirmModal(null);
                  setPendingDeleteMsgId(null);
                }}
                className="vision-btn-glass flex-1 py-2 text-xs"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmModal === 'thread') {
                    handleDeleteThread();
                  } else if (pendingDeleteMsgId) {
                    handleDeleteMessage(pendingDeleteMsgId);
                  }
                }}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs transition-colors cursor-pointer"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Quick Send Modal */}
      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={() => {
          refreshThreads();
          loadMessages();
        }}
      />
    </div>
  );
}
