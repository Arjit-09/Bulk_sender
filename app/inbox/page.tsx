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
  Inbox, Send, User, MessageSquare, CheckCheck, Clock,
  AlertCircle, Bot, RefreshCw, Search, Phone, ArrowLeft,
  Sparkles, CheckCircle2, Trash2, MoreVertical, Copy,
  PhoneCall, ShieldCheck, ChevronRight, X, ExternalLink,
  Smile, Paperclip
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

export default function WhatsAppStyleInboxPage() {
  const [threads, setThreads] = useState<InboxThread[]>([]);
  const [activePhone, setActivePhone] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [channelFilter, setChannelFilter] = useState<'all' | 'toll_free' | 'local' | 'whatsapp'>('all');
  const [replyRoute, setReplyRoute] = useState<'auto' | 'toll_free' | 'local' | 'whatsapp'>('auto');

  // Loading & Modals
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showThreadMenu, setShowThreadMenu] = useState(false);
  const [deleteConfirmModal, setDeleteConfirmModal] = useState<'thread' | 'message' | null>(null);
  const [pendingDeleteMsgId, setPendingDeleteMsgId] = useState<string | null>(null);
  const [copiedNotice, setCopiedNotice] = useState(false);
  const [showContactDetails, setShowContactDetails] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePhoneRef = useRef<string>('');

  useEffect(() => {
    activePhoneRef.current = activePhone;
  }, [activePhone]);

  // Load threads
  const refreshThreads = useCallback(async () => {
    try {
      const data = await getInboxThreads();
      setThreads(data || []);
      if (data && data.length > 0 && !activePhoneRef.current) {
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

  // Load messages for selected contact
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

  // Background polling every 5s for real-time inbox sync
  useEffect(() => {
    const interval = setInterval(() => {
      refreshThreads();
      loadMessages();
    }, 5000);
    return () => clearInterval(interval);
  }, [refreshThreads, loadMessages]);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle Send
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePhone || isSending) return;

    const text = inputText.trim();
    setInputText('');
    setIsSending(true);
    setSendError(null);

    // Optimistic message append
    const tempMsg = {
      id: 'temp_' + Date.now(),
      toPhone: activePhone,
      fromPhone: replyRoute === 'local' ? '+14795909259' : '+18884020949',
      content: text,
      direction: 'outbound',
      status: 'sent',
      sentAt: new Date(),
      channel: replyRoute === 'whatsapp' ? 'whatsapp' : 'sms',
    };
    setMessages((prev) => [...prev, tempMsg]);

    try {
      const isWA = replyRoute === 'whatsapp';
      const routePref = replyRoute === 'whatsapp' ? 'toll_free' : replyRoute;
      const res = await sendDirectMessage(activePhone, text, undefined, routePref, isWA ? 'whatsapp' : 'sms');

      if (res && (res as any).error) {
        setSendError((res as any).error);
      }
      await refreshThreads();
      await loadMessages();
    } catch (err: any) {
      setSendError(err.message || 'Failed to dispatch message');
    } finally {
      setIsSending(false);
    }
  };

  // Handle individual message deletion
  const handleDeleteMessage = async (msgId: string) => {
    // Optimistic removal
    setMessages((prev) => prev.filter((m) => m.id !== msgId));
    setPendingDeleteMsgId(null);
    setDeleteConfirmModal(null);

    try {
      await deleteMessage(msgId);
      await refreshThreads();
    } catch (err) {
      console.error('Delete message error:', err);
    }
  };

  // Handle conversation thread deletion
  const handleDeleteConversation = async () => {
    if (!activePhone) return;

    const phoneToDelete = activePhone;
    setThreads((prev) => prev.filter((t) => t.phone !== phoneToDelete));
    setMessages([]);
    setActivePhone('');
    setShowThreadMenu(false);
    setDeleteConfirmModal(null);

    try {
      await deleteInboxThread(phoneToDelete);
      const remaining = await getInboxThreads();
      setThreads(remaining || []);
      if (remaining && remaining.length > 0) {
        setActivePhone(remaining[0].phone);
      }
    } catch (err) {
      console.error('Delete thread error:', err);
    }
  };

  // Copy text to clipboard
  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedNotice(true);
    setTimeout(() => setCopiedNotice(false), 2000);
  };

  // Active contact info
  const activeThread = threads.find((t) => t.phone === activePhone);

  // Filter threads
  const filteredThreads = threads.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.phone.includes(searchQuery) ||
      t.lastMessage.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (channelFilter === 'toll_free') return t.senderRoute === 'toll_free';
    if (channelFilter === 'local') return t.senderRoute === 'local';
    if (channelFilter === 'whatsapp') return t.channel === 'whatsapp';
    return true;
  });

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
      />
      <Topbar
        title="Live Inbox"
        subtitle="Two-way conversations across SMS, WhatsApp & Email"
        dbConnected
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[240px] pt-16 px-3 sm:px-6 pb-6 h-[calc(100vh-1rem)]">
        <div className="max-w-[1500px] mx-auto h-[calc(100vh-85px)] zs-card flex overflow-hidden border border-[var(--border-color)] shadow-xl">

          {/* ══════════════════════════════════════════════════════
              LEFT PANE: WhatsApp Conversation Thread List
          ══════════════════════════════════════════════════════ */}
          <div className={`w-full md:w-[360px] lg:w-[390px] border-r border-[var(--border-color)] flex flex-col bg-[var(--bg-card)] ${
            activePhone ? 'hidden md:flex' : 'flex'
          }`}>
            {/* Thread List Header */}
            <div className="p-3.5 border-b border-[var(--border-color)] bg-[var(--bg-card)] space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: 'rgba(59,130,246,0.1)' }}>
                    <MessageSquare className="w-4 h-4 text-blue-500" />
                  </div>
                  <div>
                    <h2 className="text-sm font-semibold text-[var(--text-heading)]">Conversations</h2>
                    <p className="text-[10px] text-[var(--text-muted)]">SMS · WhatsApp · Email</p>
                  </div>
                </div>

                <button
                  onClick={refreshThreads}
                  className="p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                  title="Sync messages"
                >
                  <RefreshCw className="w-4 h-4" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search name, phone or text..."
                  className="zs-input pl-8 py-1.5 text-xs"
                />
              </div>

              {/* Channel Filter Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-[11px] no-scrollbar">
                {(['all', 'toll_free', 'local', 'whatsapp'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setChannelFilter(f)}
                    className="px-2.5 py-1 rounded-md font-medium transition-all whitespace-nowrap cursor-pointer text-[11px]"
                    style={{
                      background: channelFilter === f ? 'var(--text-heading)' : 'var(--bg-elevated)',
                      color: channelFilter === f ? 'var(--bg-base)' : 'var(--text-secondary)',
                    }}
                  >
                    {f === 'all' ? `All (${threads.length})` : f === 'toll_free' ? 'Toll-Free' : f === 'local' ? 'Local 10DLC' : 'WhatsApp'}
                  </button>
                ))}
              </div>
            </div>

            {/* Conversation List */}
            <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
              {filteredThreads.length === 0 ? (
                <div className="p-8 text-center text-[var(--text-muted)] space-y-2">
                  <Inbox className="w-8 h-8 mx-auto opacity-30" />
                  <p className="text-xs font-semibold">No conversations</p>
                  <p className="text-[11px]">Send a message to see threads here.</p>
                </div>
              ) : (
                filteredThreads.map((thread) => {
                  const isSelected = thread.phone === activePhone;
                  const isWA = thread.channel === 'whatsapp';
                  const isLocal = thread.senderRoute === 'local';

                  return (
                    <div
                      key={thread.phone}
                      onClick={() => setActivePhone(thread.phone)}
                      className="p-3.5 cursor-pointer transition-colors flex items-start gap-3 relative"
                      style={{
                        background: isSelected ? 'var(--bg-elevated)' : 'transparent',
                        borderLeft: isSelected ? '2px solid #3b82f6' : '2px solid transparent',
                      }}
                    >
                      {/* Avatar */}
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs flex-shrink-0"
                        style={{
                          background: isWA ? 'rgba(37,211,102,0.15)' : isLocal ? 'rgba(107,114,128,0.15)' : 'rgba(59,130,246,0.15)',
                          color: isWA ? '#25D366' : isLocal ? '#6b7280' : '#3b82f6',
                        }}
                      >
                        {thread.name ? thread.name.slice(0, 2).toUpperCase() : 'US'}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-xs font-semibold text-[var(--text-heading)] truncate">
                            {thread.name || thread.phone}
                          </p>
                          <span className="text-[10px] text-[var(--text-muted)]">
                            {new Date(thread.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>

                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span className="text-[10px] font-mono text-[var(--text-muted)] truncate">
                            {thread.phone}
                          </span>
                          <span
                            className="text-[9px] font-medium px-1.5 py-0.5 rounded"
                            style={{
                              background: isWA ? 'rgba(37,211,102,0.1)' : isLocal ? 'rgba(107,114,128,0.1)' : 'rgba(59,130,246,0.1)',
                              color: isWA ? '#16a34a' : isLocal ? '#4b5563' : '#1d4ed8',
                            }}
                          >
                            {isWA ? 'WhatsApp' : isLocal ? 'Local' : 'Toll-Free'}
                          </span>
                        </div>

                        <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">
                          {thread.direction === 'outbound' && 'You: '}
                          {thread.lastMessage}
                        </p>
                      </div>

                      {thread.unreadCount > 0 && (
                        <span className="w-2 h-2 rounded-full bg-blue-500 flex-shrink-0 self-center" />
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* ══════════════════════════════════════════════════════
              CENTER PANE: WhatsApp Live Chat Conversation
          ══════════════════════════════════════════════════════ */}
          <div className={`flex-1 flex flex-col bg-[var(--bg-base)] ${
            !activePhone ? 'hidden md:flex' : 'flex'
          }`}>
            {activePhone ? (
              <>
                {/* Chat Top Header */}
                <div className="h-16 px-4 border-b border-[var(--border-color)] bg-[var(--bg-card)] flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <button
                      onClick={() => setActivePhone('')}
                      className="md:hidden p-1.5 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>

                    <div className="w-9 h-9 rounded-lg flex items-center justify-center font-semibold text-xs flex-shrink-0" style={{ background: 'rgba(59,130,246,0.12)', color: '#3b82f6' }}>
                      {activeThread?.name ? activeThread.name.slice(0, 2).toUpperCase() : 'US'}
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-[var(--text-heading)]">
                          {activeThread?.name || activePhone}
                        </h3>
                        <span className="text-[11px]">
                          {activeThread?.country === 'CA' ? '🇨🇦 Canada' : '🇺🇸 US'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-[10px] text-[var(--text-muted)] font-mono">
                        <span>{activePhone}</span>
                        <span>•</span>
                        <span className="text-blue-500 font-semibold">
                          {activeThread?.channel === 'whatsapp'
                            ? 'WhatsApp Session'
                            : activeThread?.senderRoute === 'local'
                            ? 'Local 10DLC Route (+14795909259)'
                            : 'Toll-Free Route (+18884020949)'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Header Actions */}
                  <div className="flex items-center gap-2 relative">
                    <button
                      onClick={() => setShowContactDetails(!showContactDetails)}
                      className="p-2 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                      title="Contact info"
                    >
                      <User className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setShowThreadMenu(!showThreadMenu)}
                      className="p-2 rounded-xl hover:bg-[var(--bg-elevated)] text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* WhatsApp-Style Thread Dropdown Menu */}
                    {showThreadMenu && (
                      <div className="absolute right-0 top-full mt-1 w-52 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl shadow-xl z-50 p-1.5 animate-fade-in-up">
                        <button
                          onClick={() => {
                            setShowThreadMenu(false);
                            setDeleteConfirmModal('thread');
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors cursor-pointer"
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
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] rounded-xl transition-colors cursor-pointer"
                        >
                          <Clock className="w-4 h-4" />
                          <span>Clear Chat History</span>
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Chat Message Stream */}
                <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-[var(--bg-surface)]">
                  {/* Notice banner */}
                  <div className="flex justify-center">
                    <span className="text-[10px] bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-muted)] px-3 py-1 rounded-full shadow-2xs font-medium">
                      🔒 End-to-end Carrier Encrypted • US & Canada Telecommunications
                    </span>
                  </div>

                  {messages.map((msg) => {
                    const isOutbound = msg.direction === 'outbound';
                    const isWA = msg.channel === 'whatsapp';

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className="max-w-[78%] sm:max-w-[68%] p-3 relative group/bubble"
                          style={{
                            background: isOutbound
                              ? isWA ? '#25D366' : '#3b82f6'
                              : 'var(--bg-card)',
                            color: isOutbound ? '#fff' : 'var(--text-primary)',
                            borderRadius: isOutbound ? '1rem 1rem 0.25rem 1rem' : '1rem 1rem 1rem 0.25rem',
                            border: isOutbound ? 'none' : '1px solid var(--border-color)',
                          }}
                        >
                          {/* Sender name (inbound) */}
                          {!isOutbound && (
                            <p className="text-[10px] font-semibold mb-1" style={{ color: '#6b7280' }}>
                              {activeThread?.name || msg.fromPhone}
                            </p>
                          )}

                          {/* Message Body */}
                          <p className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap">
                            {msg.content}
                          </p>

                          {/* Timestamp + Delivery Status */}
                          <div className="flex items-center justify-end gap-1 mt-1.5">
                            <span className="text-[10px]" style={{ opacity: 0.7 }}>
                              {new Date(msg.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>

                            {/* Delivery status ticks - ONLY for outbound */}
                            {isOutbound && (
                              <span title={msg.status} className="flex items-center">
                                {msg.status === 'delivered' ? (
                                  <CheckCheck className="w-3.5 h-3.5" style={{ color: isWA ? '#dcfce7' : '#bfdbfe' }} />
                                ) : msg.status === 'sent' ? (
                                  <CheckCheck className="w-3.5 h-3.5" style={{ opacity: 0.5, color: '#fff' }} />
                                ) : msg.status === 'failed' ? (
                                  <AlertCircle className="w-3.5 h-3.5 text-red-300" />
                                ) : (
                                  <Clock className="w-3.5 h-3.5" style={{ opacity: 0.6 }} />
                                )}
                              </span>
                            )}

                            {/* Status text for outbound */}
                            {isOutbound && (
                              <span className="text-[9px] capitalize" style={{ opacity: 0.7 }}>
                                {msg.status}
                              </span>
                            )}
                          </div>

                          {/* Hover actions */}
                          <div className={`absolute top-1 ${isOutbound ? '-left-8' : '-right-8'} opacity-0 group-hover/bubble:opacity-100 transition-opacity flex gap-1`}>
                            <button
                              onClick={() => { setPendingDeleteMsgId(msg.id); setDeleteConfirmModal('message'); }}
                              className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm text-[var(--text-muted)] hover:text-red-500 transition-colors"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => handleCopy(msg.content)}
                              className="p-1 rounded bg-[var(--bg-card)] border border-[var(--border-color)] shadow-sm text-[var(--text-muted)] hover:text-blue-500 transition-colors"
                            >
                              <Copy className="w-3 h-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Chat Input Bar */}
                <div className="p-3 bg-[var(--bg-card)] border-t border-[var(--border-color)] space-y-2">
                  {/* Route Selector Pill for reply */}
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-[var(--text-muted)]">Reply via:</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setReplyRoute('auto')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            replyRoute === 'auto'
                              ? 'bg-blue-600 text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                          }`}
                        >
                          Smart Auto
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyRoute('toll_free')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            replyRoute === 'toll_free'
                              ? 'bg-blue-600 text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                          }`}
                        >
                          Toll-Free (+1888)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyRoute('local')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            replyRoute === 'local'
                              ? 'bg-blue-600 text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-[var(--border-color)]'
                          }`}
                        >
                          Local 10DLC (+1479)
                        </button>
                        <button
                          type="button"
                          onClick={() => setReplyRoute('whatsapp')}
                          className={`px-2 py-0.5 rounded-lg text-[10px] font-bold transition-all ${
                            replyRoute === 'whatsapp'
                              ? 'bg-emerald-600 text-white'
                              : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-emerald-500/20'
                          }`}
                        >
                          WhatsApp
                        </button>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={async () => {
                        await simulateInboundReply(activePhone, 'Got your message, thanks!', replyRoute === 'whatsapp' ? 'whatsapp' : 'sms');
                        await loadMessages();
                        await refreshThreads();
                      }}
                      className="text-[10px] text-[var(--text-muted)] hover:text-[var(--text-primary)] flex items-center gap-1 cursor-pointer transition-colors"
                    >
                      <Bot className="w-3 h-3" />
                      <span>Simulate Reply</span>
                    </button>
                  </div>

                  {sendError && (
                    <div className="p-2 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-center gap-2">
                      <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />
                      <span>{sendError}</span>
                    </div>
                  )}

                  {/* Input Form */}
                  <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                    <input
                      type="text"
                      value={inputText}
                      onChange={(e) => setInputText(e.target.value)}
                      placeholder="Type a message... (Press Enter to send)"
                      className="flex-1 zs-input text-xs py-2.5"
                    />
                    <button
                      type="submit"
                      disabled={isSending || !inputText.trim()}
                      className="zs-btn-primary py-2.5 px-4 text-xs shadow-md"
                    >
                      <Send className="w-3.5 h-3.5" />
                      <span>{isSending ? 'Sending...' : 'Send'}</span>
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center p-8 text-center text-[var(--text-muted)] space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-color)] flex items-center justify-center text-blue-500 shadow-xs">
                  <MessageSquare className="w-8 h-8" />
                </div>
                <h3 className="text-base font-bold text-[var(--text-heading)]">ZenithTech Omnichannel Inbox</h3>
                <p className="text-xs max-w-sm">
                  Select a contact from the left pane to view the conversation stream, delete messages, or dispatch via Toll-Free and Local numbers.
                </p>
              </div>
            )}
          </div>

          {/* ══════════════════════════════════════════════════════
              RIGHT PANE: Contact Details (Toggleable)
          ══════════════════════════════════════════════════════ */}
          {showContactDetails && activePhone && (
            <div className="w-80 border-l border-[var(--border-color)] bg-[var(--bg-card)] p-5 flex flex-col justify-between animate-fade-in-up">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-[var(--border-color)]">
                  <h3 className="text-xs font-bold text-[var(--text-heading)] uppercase tracking-wider">
                    Contact Details
                  </h3>
                  <button
                    onClick={() => setShowContactDetails(false)}
                    className="p-1 rounded-lg hover:bg-[var(--bg-elevated)] text-[var(--text-muted)]"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="text-center space-y-2">
                  <div className="w-16 h-16 rounded-2xl bg-slate-700 text-white font-bold text-xl flex items-center justify-center mx-auto shadow-md">
                    {activeThread?.name ? activeThread.name.slice(0, 2).toUpperCase() : 'US'}
                  </div>
                  <h4 className="text-sm font-bold text-[var(--text-heading)]">
                    {activeThread?.name || activePhone}
                  </h4>
                  <p className="text-xs font-mono text-[var(--text-muted)]">{activePhone}</p>
                </div>

                <div className="space-y-2 pt-2">
                  <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Region / Market</p>
                    <p className="font-bold text-[var(--text-heading)]">
                      {activeThread?.country === 'CA' ? '🇨🇦 Canada (+1)' : '🇺🇸 United States (+1)'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Carrier Route</p>
                    <p className="font-bold text-blue-500">
                      {activeThread?.senderRoute === 'local' ? 'Local 10DLC (+14795909259)' : 'Toll-Free (+18884020949)'}
                    </p>
                  </div>
                  <div className="p-3 rounded-2xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-xs space-y-1">
                    <p className="text-[10px] text-[var(--text-muted)] uppercase font-semibold">Total Messages</p>
                    <p className="font-bold text-[var(--text-heading)]">{messages.length} messages exchanged</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-[var(--border-color)] space-y-2">
                <button
                  onClick={() => setDeleteConfirmModal('thread')}
                  className="w-full py-2.5 rounded-xl bg-red-50 text-red-600 font-bold text-xs hover:bg-red-100 transition-colors flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Delete Thread & Messages</span>
                </button>
              </div>
            </div>
          )}

        </div>
      </main>

      {/* Delete Confirmation Modal (WhatsApp Style) */}
      {deleteConfirmModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in-up">
          <div className="w-full max-w-sm bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] shadow-2xl p-5 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[var(--text-heading)]">
                  {deleteConfirmModal === 'thread' ? 'Delete Conversation?' : 'Delete Message?'}
                </h3>
                <p className="text-xs text-[var(--text-muted)]">
                  {deleteConfirmModal === 'thread'
                    ? 'All messages in this thread will be permanently deleted.'
                    : 'This message will be deleted from your conversation.'}
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-[var(--border-color)]">
              <button
                onClick={() => {
                  setDeleteConfirmModal(null);
                  setPendingDeleteMsgId(null);
                }}
                className="zs-btn-secondary text-xs py-2 px-3"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  if (deleteConfirmModal === 'thread') {
                    handleDeleteConversation();
                  } else if (pendingDeleteMsgId) {
                    handleDeleteMessage(pendingDeleteMsgId);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-red-600 text-white font-bold text-xs hover:bg-red-700 shadow-xs cursor-pointer"
              >
                Delete for me
              </button>
            </div>
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
