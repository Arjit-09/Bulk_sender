'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getInboxThreads, getMessagesForPhone, sendDirectMessage, simulateInboundReply, syncTwilioInbound } from '@/lib/db-actions';
import {
  Inbox, Send, User, MessageSquare, CheckCheck, Clock,
  AlertCircle, Bot, RefreshCw, Search, Phone, ArrowLeft,
  Sparkles, CheckCircle2
} from 'lucide-react';

function isVirtualOrInternational(phone: string): boolean {
  if (!phone) return false;
  const clean = phone.replace(/[\s()\-.]/g, '');
  // Not +1 North American → International (e.g. +91 India)
  if (!clean.startsWith('+1') && !/^[2-9]\d{9}$/.test(clean)) return true;
  // Known virtual numbers / VoIP (Onvoy, TextNow, etc.)
  if (
    clean.includes('2393753770') ||
    clean.includes('2393751625') ||
    clean.includes('8046341990') ||
    clean.startsWith('+1239375') ||
    clean.startsWith('1239375')
  ) {
    return true;
  }
  return false;
}

function getPhoneRegionLabel(phone: string): string {
  if (!phone) return 'Direct SMS';
  const clean = phone.replace(/[\s()\-.]/g, '');
  if (
    clean.includes('2393753770') ||
    clean.includes('2393751625') ||
    clean.includes('8046341990') ||
    clean.startsWith('+1239375') ||
    clean.startsWith('1239375')
  ) {
    return 'Virtual VoIP (US) • Local Route';
  }
  if (clean.startsWith('+1') || /^[2-9]\d{9}$/.test(clean)) {
    return 'US Mobile (+1) • Toll-Free Route';
  }
  if (clean.startsWith('+91')) {
    return 'India (+91) • Local Route';
  }
  if (clean.startsWith('+44')) {
    return 'UK (+44) • Local Route';
  }
  return `International (${clean.slice(0, 3)}) • Local Route`;
}

export default function InboxPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activePhone, setActivePhone] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [senderRoute, setSenderRoute] = useState<string>('+18884020949');
  // initialLoading is only true on the very first page load — never flashed during polling
  const [initialLoading, setInitialLoading] = useState(true);
  const [sendError, setSendError] = useState<string | null>(null);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [showThreadList, setShowThreadList] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activePhoneRef = useRef<string>('');

  // Keep ref in sync so callbacks don't go stale
  useEffect(() => { activePhoneRef.current = activePhone; }, [activePhone]);

  // Background thread refresh — never flashes loading spinner
  const refreshThreads = useCallback(async () => {
    try {
      const data = await getInboxThreads();
      setThreads(data || []);
      // Auto-select first thread only if nothing selected yet
      if (data && data.length > 0 && !activePhoneRef.current) {
        setActivePhone(data[0].phone);
      }
    } catch (err) {
      console.error(err);
    }
  }, []);

  // loadThreads = initial load (shows spinner once)
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

  // Periodic background poll — uses refreshThreads (no spinner), not loadThreads
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      refreshThreads();
    }, 6000);
    return () => clearInterval(interval);
  }, [loadMessages, refreshThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Automatically select the optimal sender number based on the recipient
  // Rule: Toll-Free for US local cellular numbers only; Local number for virtual VoIP & India
  useEffect(() => {
    if (activePhone) {
      if (isVirtualOrInternational(activePhone)) {
        setSenderRoute('+14795909259');
      } else {
        setSenderRoute('+18884020949');
      }
    }
  }, [activePhone]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePhone) return;
    const text = inputText;
    setInputText('');
    setSendError(null);

    const result = await sendDirectMessage(activePhone, text, senderRoute) as any;
    await loadMessages();
    await loadThreads();

    if (result?.error || result?.status === 'failed') {
      setSendError(
        result?.error ||
        'Message failed to dispatch. Verify provider credentials or destination number restrictions.'
      );
    }
  };

  const handleSimulateReply = async () => {
    if (!activePhone) return;
    const replies = [
      'Thanks! Got your message.',
      'Yes, please send more details.',
      'Confirmed! Looking forward to it.',
      'Can you call me regarding this?',
      'Thanks for reaching out!',
    ];
    const chosen = replies[Math.floor(Math.random() * replies.length)];
    await simulateInboundReply(activePhone, chosen);
    await loadMessages();
    await loadThreads();
  };

  const [syncing, setSyncing] = useState(false);
  const handleSyncTwilio = async () => {
    setSyncing(true);
    try {
      const res = await syncTwilioInbound();
      await loadMessages();
      await loadThreads();
      alert(res.count > 0 ? `Synced ${res.count} new inbound message(s)!` : 'No new inbound messages found.');
    } catch (e: any) {
      alert(e.message || 'Error syncing from Twilio/Telnyx');
    } finally {
      setSyncing(false);
    }
  };

  const filteredThreads = threads.filter((t) =>
    t.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.phone?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    t.lastMessage?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const activeThread = threads.find((t) => t.phone === activePhone);
  const isChatActive = Boolean(activePhone) && !showThreadList;

  return (
    <div className="min-h-screen" style={{ background: 'var(--bg-base)' }}>
      <Sidebar
        onOpenQuickSend={() => setIsQuickSendOpen(true)}
        isOpen={isSidebarOpen}
        onClose={() => setIsSidebarOpen(false)}
        orgName="ZenithServices"
        planName="Starter"
        userRole="SUPER_ADMIN"
      />
      <Topbar
        title="Two-Way SMS Inbox"
        subtitle="Real-time threaded customer messaging powered by PostgreSQL"
        dbConnected={true}
        onMenuToggle={() => setIsSidebarOpen(true)}
      />

      <main className="lg:ml-[260px] pt-20 px-4 sm:px-6 lg:px-8 pb-6 min-h-screen flex flex-col">
        <div className="max-w-[1500px] w-full mx-auto flex-1 flex flex-col min-h-0">

          {/* Inbox Container Card */}
          <div className="zs-card overflow-hidden shadow-md flex-1 flex flex-col md:flex-row min-h-[580px] max-h-[calc(100vh-6.5rem)]">

            {/* Left Thread List Column */}
            <div
              className={`
                ${isChatActive ? 'hidden' : 'flex'} md:flex
                w-full md:w-80 lg:w-96 md:shrink-0
                border-r border-[var(--border-subtle)] flex-col bg-[var(--bg-card)] min-w-0
              `}
            >
              {/* Thread List Header & Search */}
              <div className="p-4 border-b border-[var(--border-subtle)] space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                      <Inbox className="w-4 h-4" />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-[var(--text-heading)]">Conversations</h3>
                      <p className="text-[10px] text-[var(--text-muted)]">{threads.length} active threads</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsQuickSendOpen(true)}
                    className="p-1.5 rounded-lg bg-indigo-50 hover:bg-indigo-100 text-indigo-600 transition-all cursor-pointer"
                    title="Start new message"
                  >
                    <Send className="w-3.5 h-3.5" />
                  </button>
                </div>

                <div className="relative">
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] pointer-events-none" />
                  <input
                    type="text"
                    placeholder="Search messages or contacts…"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="zs-input !pl-9 py-1.5 text-xs"
                  />
                </div>
              </div>

              {/* Thread List Items */}
              <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-subtle)]">
                {initialLoading ? (
                  <div className="p-6 text-center text-xs text-[var(--text-muted)]">
                    <div className="inline-block w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin mb-2" />
                    <p>Loading messages…</p>
                  </div>
                ) : filteredThreads.length === 0 ? (
                  <div className="p-8 text-center text-xs text-[var(--text-muted)] flex flex-col items-center justify-center h-full">
                    <MessageSquare className="w-8 h-8 text-[var(--text-muted)] mb-2 opacity-40" />
                    <p className="font-semibold text-[var(--text-heading)]">No conversations yet</p>
                    <p className="mt-1 max-w-[200px]">Send an SMS to begin two-way customer communication.</p>
                  </div>
                ) : (
                  filteredThreads.map((t) => {
                    const isSelected = activePhone === t.phone;
                    const hasContactName = t.name && t.name !== t.phone;
                    const initial = hasContactName ? t.name.charAt(0).toUpperCase() : '📱';

                    return (
                      <button
                        key={t.phone}
                        onClick={() => {
                          setActivePhone(t.phone);
                          setShowThreadList(false);
                        }}
                        className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer border-l-3 ${
                          isSelected
                            ? 'bg-indigo-50/70 border-indigo-600'
                            : 'bg-transparent border-transparent hover:bg-[var(--bg-elevated)]'
                        }`}
                      >
                        <div className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs flex-shrink-0 shadow-xs ${
                          isSelected
                            ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white'
                            : 'bg-[var(--bg-elevated)] text-indigo-700'
                        }`}>
                          {initial}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-0.5">
                            <p className="text-xs font-bold text-[var(--text-heading)] truncate">
                              {hasContactName ? t.name : t.phone}
                            </p>
                            <span className="text-[10px] text-[var(--text-muted)] font-medium">
                              {new Date(t.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          {hasContactName ? (
                            <p className="text-[11px] font-mono text-indigo-600 truncate">{t.phone}</p>
                          ) : (
                            <p className="text-[10px] text-emerald-600 font-medium">{getPhoneRegionLabel(t.phone)}</p>
                          )}
                          <p className="text-xs text-[var(--text-secondary)] truncate mt-0.5">{t.lastMessage}</p>
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Chat Column */}
            <div
              className={`
                ${isChatActive ? 'flex' : 'hidden'} md:flex
                flex-1 flex-col bg-[var(--bg-surface)] min-w-0
              `}
            >
              {activePhone ? (
                <>
                  {/* Chat Header */}
                  <div className="h-16 px-4 sm:px-6 border-b border-[var(--border-subtle)] flex items-center justify-between bg-[var(--bg-card)] gap-2 flex-shrink-0">
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      {/* Mobile Back Button */}
                      <button
                        onClick={() => setShowThreadList(true)}
                        className="md:hidden p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)] transition-all cursor-pointer"
                        aria-label="Back to conversations"
                      >
                        <ArrowLeft className="w-4 h-4" />
                      </button>

                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs flex-shrink-0 shadow-xs">
                        {activeThread?.name && activeThread.name !== activePhone ? activeThread.name.charAt(0).toUpperCase() : '📱'}
                      </div>

                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-[var(--text-heading)] truncate">
                            {activeThread?.name && activeThread.name !== activePhone ? activeThread.name : activePhone}
                          </h4>
                          <span className="zs-badge zs-badge-success text-[10px] py-0.5">
                            Connected
                          </span>
                        </div>
                        {activeThread?.name && activeThread.name !== activePhone ? (
                          <p className="text-xs text-[var(--text-muted)] font-mono truncate">{activePhone}</p>
                        ) : (
                          <p className="text-[11px] text-emerald-600 font-medium truncate">{getPhoneRegionLabel(activePhone)}</p>
                        )}
                      </div>
                    </div>

                    {/* Chat Action Buttons */}
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button
                        onClick={handleSyncTwilio}
                        disabled={syncing}
                        className="zs-btn-secondary py-1.5 px-3 text-xs"
                        title="Fetch real inbound SMS from Twilio/Telnyx"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 text-indigo-600 ${syncing ? 'animate-spin' : ''}`} />
                        <span className="hidden sm:inline">{syncing ? 'Syncing…' : 'Sync SMS'}</span>
                      </button>

                      <button
                        onClick={handleSimulateReply}
                        className="zs-btn-secondary py-1.5 px-3 text-xs bg-cyan-50/60 border-cyan-200 text-cyan-800 hover:bg-cyan-100"
                        title="Simulate recipient replying via SMS"
                      >
                        <Bot className="w-3.5 h-3.5 text-cyan-600" />
                        <span className="hidden sm:inline">Simulate Reply</span>
                      </button>
                    </div>
                  </div>

                  {/* Messages Feed Viewport */}
                  <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-3 sm:space-y-4">

                    {/* Error Banner */}
                    {sendError && (
                      <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5 text-rose-500" />
                        <div className="flex-1">
                          <p className="font-semibold text-rose-800">Dispatch Failed</p>
                          <p>{sendError}</p>
                        </div>
                        <button
                          onClick={() => setSendError(null)}
                          className="text-rose-500 hover:text-rose-800 text-base leading-none font-bold ml-1 cursor-pointer"
                        >
                          ×
                        </button>
                      </div>
                    )}

                    {messages.length === 0 ? (
                      <div className="py-12 text-center text-xs text-[var(--text-muted)]">
                        No messages in this conversation yet. Send a greeting below!
                      </div>
                    ) : (
                      messages.map((m) => {
                        const isOutbound = m.direction === 'outbound';
                        const isFailed = m.status === 'failed';

                        return (
                          <div
                            key={m.id}
                            className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                          >
                            {!isOutbound && (
                              <span className="text-[10px] font-semibold text-cyan-700 mb-1 ml-1 flex items-center gap-1">
                                <span>← Customer Inbound</span>
                              </span>
                            )}

                            <div
                              className={`max-w-[85%] sm:max-w-md p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                                isOutbound
                                  ? isFailed
                                    ? 'bg-rose-100 border border-rose-300 text-rose-800 rounded-br-xs'
                                    : 'bg-gradient-to-r from-indigo-600 to-indigo-700 text-white shadow-md shadow-indigo-100 rounded-br-xs'
                                  : 'bg-[var(--bg-card)] border border-[var(--border-color)] text-[var(--text-primary)] shadow-xs rounded-bl-xs'
                              }`}
                            >
                              <p className="whitespace-pre-wrap break-words">{m.content}</p>
                            </div>

                            <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[var(--text-muted)] px-1">
                              <span>
                                {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {isOutbound && (
                                <span className={`flex items-center gap-0.5 ${
                                  isFailed ? 'text-rose-600 font-semibold' : m.status === 'delivered' ? 'text-emerald-600 font-medium' : 'text-[var(--text-muted)]'
                                }`}>
                                  •{' '}
                                  {isFailed ? (
                                    <><AlertCircle className="w-3 h-3 inline" /> failed</>
                                  ) : (
                                    <><CheckCheck className="w-3.5 h-3.5 inline text-indigo-500" /> {m.status}</>
                                  )}
                                </span>
                              )}
                              {!isOutbound && (
                                <span className="flex items-center gap-0.5 text-cyan-600 font-medium">
                                  • <CheckCheck className="w-3.5 h-3.5 inline" /> received
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Send Form Bar */}
                  <div className="p-3 sm:p-4 border-t border-[var(--border-subtle)] bg-[var(--bg-card)]">
                    {/* Route Selector & Quick Suggestion Chips */}
                    <div className="flex flex-col gap-2 mb-2">
                      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-0.5">
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <span className="text-[10px] text-[var(--text-muted)] font-medium">Route via:</span>
                          <button
                            type="button"
                            onClick={() => setSenderRoute('+18884020949')}
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                              senderRoute === '+18884020949'
                                ? 'bg-indigo-600 text-white shadow-xs'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-indigo-50 hover:text-indigo-600 border border-[var(--border-subtle)]'
                            }`}
                          >
                            <span>🇺🇸 Toll-Free (+18884020949)</span>
                            <span className="text-[9px] opacity-80 font-normal">[US Mobile]</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setSenderRoute('+14795909259')}
                            className={`px-2.5 py-0.5 rounded-md text-[11px] font-semibold transition-all cursor-pointer flex items-center gap-1 ${
                              senderRoute === '+14795909259'
                                ? 'bg-emerald-600 text-white shadow-xs'
                                : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] hover:bg-emerald-50 hover:text-emerald-700 border border-[var(--border-subtle)]'
                            }`}
                          >
                            <span>📱 Local (+14795909259)</span>
                            <span className="text-[9px] opacity-80 font-normal">[Virtual & India]</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                        <span className="text-[10px] text-[var(--text-muted)] flex-shrink-0">Quick reply:</span>
                        {[
                          'Thanks! Got your message.',
                          'Your request is being processed.',
                          'Can we assist you with anything else?',
                        ].map((chip) => (
                          <button
                            key={chip}
                            type="button"
                            onClick={() => setInputText(chip)}
                            className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] hover:bg-indigo-50 text-[11px] text-[var(--text-secondary)] hover:text-indigo-600 border border-[var(--border-subtle)] hover:border-indigo-200 transition-all cursor-pointer whitespace-nowrap flex-shrink-0"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    </div>

                    <form onSubmit={handleSend} className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Reply to ${activeThread?.name || activePhone}...`}
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        className="zs-input flex-1 py-2.5 text-xs sm:text-sm"
                      />
                      <button
                        type="submit"
                        className="zs-btn-primary flex-shrink-0 px-4 py-2.5"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Send</span>
                      </button>
                    </form>
                  </div>
                </>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-8 text-[var(--text-muted)]">
                  <div className="w-14 h-14 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-500 mb-3">
                    <Inbox className="w-7 h-7" />
                  </div>
                  <h4 className="text-base font-bold text-[var(--text-heading)]">Select a Conversation Thread</h4>
                  <p className="text-xs max-w-sm mt-1">
                    Choose an existing contact from the left list or launch a Quick Send message to initiate communication.
                  </p>
                </div>
              )}
            </div>

          </div>

        </div>
      </main>

      <QuickSendModal
        isOpen={isQuickSendOpen}
        onClose={() => setIsQuickSendOpen(false)}
        onSuccess={loadThreads}
      />
    </div>
  );
}
