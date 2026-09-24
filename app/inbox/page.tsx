'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from '@/components/Sidebar';
import Topbar from '@/components/Topbar';
import QuickSendModal from '@/components/QuickSendModal';
import { getInboxThreads, getMessagesForPhone, sendDirectMessage, simulateInboundReply, syncTwilioInbound } from '@/lib/db-actions';
import { Inbox, Send, User, MessageSquare, CheckCheck, Clock, AlertCircle, Bot, RefreshCw } from 'lucide-react';

export default function InboxPage() {
  const [threads, setThreads] = useState<any[]>([]);
  const [activePhone, setActivePhone] = useState<string>('');
  const [messages, setMessages] = useState<any[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [isQuickSendOpen, setIsQuickSendOpen] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const loadThreads = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getInboxThreads();
      setThreads(data);
      if (data.length > 0 && !activePhone) {
        setActivePhone(data[0].phone);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [activePhone]);

  const loadMessages = useCallback(async () => {
    if (!activePhone) return;
    try {
      const msgs = await getMessagesForPhone(activePhone);
      setMessages(msgs);
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

  // Auto-refresh messages every 3 seconds to catch live inbound SMS replies
  useEffect(() => {
    const interval = setInterval(() => {
      loadMessages();
      loadThreads();
    }, 3000);
    return () => clearInterval(interval);
  }, [loadMessages, loadThreads]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || !activePhone) return;
    const text = inputText;
    setInputText('');

    await sendDirectMessage(activePhone, text);
    await loadMessages();
    await loadThreads();
  };

  const handleSimulateReply = async () => {
    if (!activePhone) return;
    const replies = [
      'Thanks! Got your message.',
      'Yes, please send more details.',
      'Confirmed! See you then.',
      'STOP',
      'What are your store hours?',
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
      alert(res.count > 0 ? `Synced ${res.count} new inbound reply/replies from Twilio!` : 'No new inbound replies on your Twilio number.');
    } catch (e: any) {
      alert(e.message || 'Error syncing from Twilio');
    } finally {
      setSyncing(false);
    }
  };

  const activeThread = threads.find((t) => t.phone === activePhone);

  return (
    <div className="min-h-screen bg-[#0a0b1a]">
      <Sidebar onOpenQuickSend={() => setIsQuickSendOpen(true)} />
      <Topbar
        title="Two-Way SMS Inbox"
        subtitle="Real-time threaded customer messaging powered by PostgreSQL"
        dbConnected={true}
      />

      <main className="ml-64 pt-20 p-8 h-[calc(100vh-80px)] flex flex-col">
        <div className="flex-1 flex rounded-2xl bg-[#0f1129] border border-[#6366f1]/20 overflow-hidden shadow-2xl">
          {/* Left Column: Thread List */}
          <div className="w-80 border-r border-[#6366f1]/15 flex flex-col bg-[#0d0f26]">
            <div className="p-4 border-b border-[#6366f1]/15 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Inbox className="w-4 h-4 text-[#818cf8]" />
                <h3 className="text-sm font-bold text-white">Conversations</h3>
              </div>
              <span className="text-xs px-2 py-0.5 rounded-full bg-[#6366f1]/15 text-[#818cf8] font-semibold">
                {threads.length}
              </span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-[#6366f1]/10">
              {threads.length === 0 ? (
                <div className="p-6 text-center text-xs text-[#94a3b8] flex flex-col items-center justify-center h-full">
                  <MessageSquare className="w-8 h-8 text-[#94a3b8] mb-2 opacity-50" />
                  <p className="font-semibold text-white">No Conversations</p>
                  <p className="mt-1">Send a Quick SMS to initiate a customer message thread.</p>
                </div>
              ) : (
                threads.map((t) => (
                  <button
                    key={t.phone}
                    onClick={() => setActivePhone(t.phone)}
                    className={`w-full p-3.5 text-left flex items-start gap-3 transition-colors cursor-pointer ${
                      activePhone === t.phone
                        ? 'bg-[#181a35] border-l-2 border-[#6366f1]'
                        : 'hover:bg-[#141630]'
                    }`}
                  >
                    <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-[#6366f1]/30 to-[#06b6d4]/30 text-[#818cf8] flex items-center justify-center font-bold text-xs flex-shrink-0">
                      {t.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-white truncate">{t.name}</p>
                        <span className="text-[10px] text-[#94a3b8]">
                          {new Date(t.lastTimestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <p className="text-[11px] text-[#06b6d4] truncate">{t.phone}</p>
                      <p className="text-xs text-[#94a3b8] truncate mt-0.5">{t.lastMessage}</p>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right Column: Chat Window */}
          <div className="flex-1 flex flex-col bg-[#0a0b1a]">
            {activePhone ? (
              <>
                {/* Chat Header */}
                <div className="h-16 px-6 border-b border-[#6366f1]/15 flex items-center justify-between bg-[#0f1129]">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#6366f1] to-[#06b6d4] flex items-center justify-center text-white font-bold text-xs">
                      {activeThread?.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-white">{activeThread?.name || activePhone}</h4>
                      <p className="text-xs text-[#94a3b8]">{activePhone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={handleSyncTwilio}
                      disabled={syncing}
                      className="px-3 py-1.5 rounded-xl bg-[#6366f1]/15 hover:bg-[#6366f1]/25 border border-[#6366f1]/30 text-[#818cf8] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      title="Fetch real inbound SMS replies from Twilio API"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                      <span>{syncing ? 'Syncing...' : 'Sync Twilio Inbound'}</span>
                    </button>
                    <button
                      onClick={handleSimulateReply}
                      className="px-3 py-1.5 rounded-xl bg-[#06b6d4]/15 hover:bg-[#06b6d4]/25 border border-[#06b6d4]/30 text-[#22d3ee] text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer"
                      title="Simulate recipient replying via SMS"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>Simulate Reply</span>
                    </button>
                  </div>
                </div>

                {/* Messages Stream */}
                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                  {messages.map((m) => {
                    const isOutbound = m.direction === 'outbound';
                    return (
                      <div
                        key={m.id}
                        className={`flex flex-col ${isOutbound ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-md p-3.5 rounded-2xl text-xs ${
                            isOutbound
                              ? 'bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white rounded-br-xs shadow-md'
                              : 'bg-[#181a35] text-[#f1f5f9] border border-[#6366f1]/20 rounded-bl-xs'
                          }`}
                        >
                          <p>{m.content}</p>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 text-[10px] text-[#94a3b8]">
                          <span>
                            {new Date(m.sentAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                          {isOutbound && (
                            <span className="flex items-center gap-0.5 text-[#34d399]">
                              • <CheckCheck className="w-3 h-3 inline" /> {m.status}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input Bar */}
                <form onSubmit={handleSend} className="p-4 border-t border-[#6366f1]/15 bg-[#0f1129] flex gap-3">
                  <input
                    type="text"
                    placeholder={`Message ${activeThread?.name || activePhone}...`}
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    className="flex-1 bg-[#0d0f26] border border-[#6366f1]/25 rounded-xl px-4 py-2.5 text-xs text-white placeholder:text-[#475569] focus:outline-none focus:border-[#6366f1]"
                  />
                  <button
                    type="submit"
                    className="px-4 py-2.5 rounded-xl bg-[#6366f1] hover:bg-[#4f46e5] text-white text-xs font-semibold flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/30 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>Send</span>
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-[#94a3b8]">
                <Inbox className="w-12 h-12 mb-2 opacity-40 text-[#818cf8]" />
                <p className="text-sm font-semibold text-white">Select a conversation thread</p>
                <p className="text-xs max-w-xs mt-1">
                  Choose a contact from the left panel or send a quick SMS to begin messaging.
                </p>
              </div>
            )}
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
