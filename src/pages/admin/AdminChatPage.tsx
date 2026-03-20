import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { chatApi, supportApi } from '../../services/api';
import { getChatSocket } from '../../services/socket';
import { Bot, User, PhoneCall, Send, Loader2, MessageCircle, AlertTriangle } from 'lucide-react';
import type { Conversation, ChatMessage } from '../../types';
import DateDisplay from '../../components/common/DateDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';
import toast from 'react-hot-toast';

function createClientTempId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `tmp-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

function upsertMessage(prev: ChatMessage[], incoming: ChatMessage) {
  if (!incoming?._id) return prev;

  const byId = prev.findIndex((m) => m._id === incoming._id);
  if (byId >= 0) {
    const clone = [...prev];
    clone[byId] = { ...clone[byId], ...incoming };
    return clone;
  }

  if (incoming.clientTempId) {
    const tmpIdx = prev.findIndex((m) => m.clientTempId && m.clientTempId === incoming.clientTempId);
    if (tmpIdx >= 0) {
      const clone = [...prev];
      clone[tmpIdx] = { ...clone[tmpIdx], ...incoming };
      return clone;
    }
  }

  return [...prev, incoming];
}

export default function AdminChatPage() {
  const [activeConv, setActiveConv] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());
  const [showResolveModal, setShowResolveModal] = useState(false);
  const [resolving, setResolving] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(getChatSocket());
  const typingTimerRef = useRef<number | null>(null);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['admin-conversations-escalated'],
    queryFn: () => chatApi.getAllConversations({ isEscalated: true }),
    refetchInterval: 15000,
  });

  const conversations: Conversation[] = data?.data?.data || [];
  const escalated = useMemo(() => conversations.filter((conv) => conv.isEscalated || conv.is_escalated), [conversations]);
  const chatId = activeConv?._id;

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onHeartbeatAck = () => setLastHeartbeat(Date.now());

    const handleEscalationTriggered = () => {
      refetch();
      toast('New escalated chat received', { icon: '🚨' });
    };

    const handleConversationUpdated = () => {
      refetch();
    };

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('heartbeat_ack', onHeartbeatAck);
    socket.on('escalation_triggered', handleEscalationTriggered);
    socket.on('conversation_updated', handleConversationUpdated);

    if (socket.connected) setIsConnected(true);

    const heartbeatInterval = window.setInterval(() => {
      if (!socket.connected) {
        socket.connect();
        return;
      }
      socket.emit('heartbeat', { ts: Date.now() });
    }, 20000);

    return () => {
      socket.off('connect', onConnect);
      socket.off('disconnect', onDisconnect);
      socket.off('heartbeat_ack', onHeartbeatAck);
      socket.off('escalation_triggered', handleEscalationTriggered);
      socket.off('conversation_updated', handleConversationUpdated);
      window.clearInterval(heartbeatInterval);
    };
  }, [refetch]);

  useEffect(() => {
    if (!activeConv) return;

    const loadConversation = async () => {
      const res = await chatApi.getConversation(activeConv._id);
      const full = res.data.data as Conversation;
      setActiveConv(full);
      setMessages(full.messages || []);
    };

    loadConversation();
  }, [activeConv?._id]);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    socket.emit('join:conversation', { conversationId: chatId });

    const handleMessageReceived = (msg: ChatMessage) => {
      if (msg.chatId && msg.chatId !== chatId) return;
      setMessages((prev) => upsertMessage(prev, msg));
      setTyping(false);

      if ((msg.senderType === 'Client' || msg.senderType === 'Bot') && msg._id) {
        socket.emit('message_seen', { chatId, messageIds: [msg._id] });
      }
    };

    const handleTyping = ({ isTyping, userId }: { isTyping: boolean; userId: string }) => {
      // On admin side typing indicator should represent remote participant.
      if (!userId) return;
      setTyping(isTyping);
    };

    const handleSeenUpdate = ({ messageIds, seenAt }: { messageIds: string[]; seenAt: string }) => {
      setMessages((prev) => prev.map((m) => (messageIds.includes(m._id) ? { ...m, isRead: true, seenAt } : m)));
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('typing', handleTyping);
    socket.on('seen_update', handleSeenUpdate);

    return () => {
      socket.emit('leave:conversation', { conversationId: chatId });
      socket.off('message_received', handleMessageReceived);
      socket.off('typing', handleTyping);
      socket.off('seen_update', handleSeenUpdate);
    };
  }, [chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing]);

  const emitTyping = (isTypingState: boolean) => {
    if (!chatId) return;
    socketRef.current?.emit('typing', { chatId, isTyping: isTypingState });
  };

  const onInputChange = (value: string) => {
    setInput(value);
    if (!chatId) return;

    emitTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => emitTyping(false), 800);
  };

  const claimConversation = async (conv: Conversation) => {
    try {
      await chatApi.claimConversation(conv._id);
      const updated = await chatApi.getConversation(conv._id);
      setActiveConv(updated.data.data as Conversation);
      refetch();
      toast.success('Conversation claimed');
    } catch {
      toast.error('Failed to claim conversation');
    }
  };

  const sendAdminResponse = async () => {
    if (!input.trim() || !chatId || sending) return;

    const content = input.trim();
    const clientTempId = createClientTempId();
    setInput('');
    setSending(true);
    emitTyping(false);

    const optimisticMessage: ChatMessage = {
      _id: `temp-${clientTempId}`,
      chatId,
      senderType: 'Admin',
      clientTempId,
      content,
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => upsertMessage(prev, optimisticMessage));

    try {
      socketRef.current?.emit('admin_response', { conversationId: chatId, content, clientTempId });
    } finally {
      setSending(false);
    }
  };

  const resolveConversation = async () => {
    if (!activeConv) return;
    try {
      setResolving(true);
      socketRef.current?.emit('chat_resolved', { conversationId: activeConv._id });
      await supportApi.resolve({ conversationId: activeConv._id });
      setActiveConv(null);
      setMessages([]);
      refetch();
      setShowResolveModal(false);
      toast.success('Resolved and handed back to AI');
    } catch {
      toast.error('Failed to resolve conversation');
    } finally {
      setResolving(false);
    }
  };

  const statusColor: Record<string, string> = {
    WaitingForAgent: 'text-red-600 bg-red-50',
    AgentHandling: 'text-green-600 bg-green-50',
    BotHandling: 'text-blue-600 bg-blue-50',
    Open: 'text-slate-600 bg-slate-50',
  };

  return (
    <div className="space-y-4 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-slate-900">Support Chat</h1>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      <div className="grid lg:grid-cols-3 gap-4 h-[calc(100vh-12rem)]">
        <div className="card overflow-y-auto p-0">
          <div className="p-4 border-b sticky top-0 bg-white">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-slate-800 text-sm">Escalated Chats</h3>
              <span className="bg-red-100 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full">{escalated.length}</span>
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-8"><LoadingSpinner /></div>
          ) : escalated.length === 0 ? (
            <div className="text-center py-8 px-4">
              <MessageCircle size={32} className="mx-auto text-slate-300 mb-2" />
              <p className="text-slate-400 text-sm">No escalated conversations</p>
            </div>
          ) : (
            <div className="divide-y">
              {escalated.map((conv) => (
                <button
                  key={conv._id}
                  onClick={() => setActiveConv(conv)}
                  className={`w-full text-left p-4 hover:bg-slate-50 transition-colors ${activeConv?._id === conv._id ? 'bg-primary-50 border-l-2 border-l-primary-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-slate-900 text-sm">
                      {typeof conv.client === 'object' && conv.client !== null
                        ? `${(conv.client as { firstName?: string }).firstName || ''} ${(conv.client as { lastName?: string }).lastName || ''}`
                        : 'Client'}
                    </span>
                    <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[conv.status] || 'bg-slate-50 text-slate-500'}`}>{conv.status}</span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">{conv.subject || 'Support Request'}</p>
                  {conv.status === 'WaitingForAgent' && (
                    <div className="flex items-center gap-1 mt-1 text-xs text-amber-600">
                      <AlertTriangle size={11} />
                      Waiting for admin takeover
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="lg:col-span-2 card p-0 flex flex-col overflow-hidden">
          {!activeConv ? (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-400">
              <MessageCircle size={48} className="mb-3 text-slate-200" />
              <p className="font-medium">Select an escalated conversation</p>
            </div>
          ) : (
            <>
              <div className="p-4 border-b flex items-center justify-between bg-white">
                <div>
                  <p className="font-semibold text-slate-900 text-sm">
                    {typeof activeConv.client === 'object' && activeConv.client !== null
                      ? `${(activeConv.client as { firstName?: string }).firstName || ''} ${(activeConv.client as { lastName?: string }).lastName || ''}`
                      : 'Client'}
                  </p>
                  <p className="text-xs text-slate-500">{activeConv.subject || 'Support Request'}</p>
                </div>
                <div className="flex gap-2">
                  {activeConv.status === 'WaitingForAgent' && (
                    <button onClick={() => claimConversation(activeConv)} className="btn-primary text-xs">Take Over</button>
                  )}
                  {activeConv.status === 'AgentHandling' && (
                    <button onClick={() => setShowResolveModal(true)} className="btn-secondary text-xs">Resolve &amp; Hand back to AI</button>
                  )}
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50">
                {messages.map((msg) => {
                  const isAdmin = msg.senderType === 'Admin' || msg.senderType === 'Agent';
                  const isBot = msg.senderType === 'Bot';

                  return (
                    <div key={msg._id} className={`flex gap-2 ${isAdmin ? 'flex-row-reverse' : ''}`}>
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 ${isBot ? 'bg-primary-100 text-primary-700' : isAdmin ? 'bg-green-100 text-green-700' : 'bg-slate-200 text-slate-700'}`}>
                        {isBot ? <Bot size={14} /> : isAdmin ? <PhoneCall size={14} /> : <User size={14} />}
                      </div>
                      <div className="max-w-[70%]">
                        <p className={`text-xs text-slate-400 mb-0.5 ${isAdmin ? 'text-right' : ''}`}>
                          {msg.senderType === 'Bot' ? 'AI' : isAdmin ? 'Support Agent' : 'Client'}
                        </p>
                        <div className={`rounded-2xl px-3 py-2 text-sm ${isAdmin ? 'bg-primary-600 text-white rounded-tr-sm' : 'bg-white border shadow-sm rounded-tl-sm text-slate-800'}`}>
                          {msg.content}
                        </div>
                        <p className={`text-xs text-slate-300 mt-0.5 ${isAdmin ? 'text-right' : ''}`}>
                          <DateDisplay date={msg.timestamp} format="p" />
                          {isAdmin && msg.isRead && <span className="ml-1 text-emerald-600">Seen</span>}
                        </p>
                      </div>
                    </div>
                  );
                })}

                {typing && (
                  <div className="flex gap-2">
                    <div className="w-7 h-7 rounded-full bg-slate-200 flex items-center justify-center"><User size={14} /></div>
                    <div className="bg-white border rounded-2xl px-3 py-2 text-slate-400 text-sm">Typing...</div>
                  </div>
                )}

                <div ref={bottomRef} />
              </div>

              {activeConv.status === 'AgentHandling' && (
                <div className="p-3 border-t bg-white">
                  <div className="flex items-center gap-2 bg-slate-50 rounded-xl border px-3 py-2">
                    <input
                      className="flex-1 bg-transparent outline-none text-sm"
                      placeholder="Type a live support response..."
                      value={input}
                      onChange={(e) => onInputChange(e.target.value)}
                      onKeyDown={(e) => { if (e.key === 'Enter') sendAdminResponse(); }}
                    />
                    <button
                      onClick={sendAdminResponse}
                      disabled={!input.trim() || sending}
                      className={`p-1.5 rounded-lg ${input.trim() && !sending ? 'bg-primary-600 text-white' : 'bg-slate-200 text-slate-400'}`}
                    >
                      {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
                    </button>
                  </div>
                  <p className="text-[10px] text-slate-400 mt-1">Heartbeat: {new Date(lastHeartbeat).toLocaleTimeString()}</p>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showResolveModal && activeConv && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center bg-slate-900/40 p-4">
          <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-xl">
            <h3 className="text-base font-semibold text-slate-900">Resolve ticket and re-activate AI?</h3>
            <p className="mt-2 text-sm text-slate-600">
              This will close the human takeover for this conversation and return control to the AI assistant with a summary of the admin intervention.
            </p>
            <div className="mt-4 flex justify-end gap-2">
              <button
                onClick={() => setShowResolveModal(false)}
                disabled={resolving}
                className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={resolveConversation}
                disabled={resolving}
                className="px-3 py-1.5 text-sm rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-70"
              >
                {resolving ? 'Resolving...' : 'Resolve & Hand back to AI'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
