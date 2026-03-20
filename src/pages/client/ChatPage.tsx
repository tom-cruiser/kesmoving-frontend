import { useEffect, useMemo, useRef, useState } from 'react';
import { Send, Bot, User, Loader2, PhoneCall, Sparkles, LifeBuoy } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { chatApi, supportApi } from '../../services/api';
import { getChatSocket } from '../../services/socket';
import type { Conversation, ChatMessage } from '../../types';
import DateDisplay from '../../components/common/DateDisplay';
import LoadingSpinner from '../../components/common/LoadingSpinner';

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
    const tempIdx = prev.findIndex((m) => m.clientTempId && m.clientTempId === incoming.clientTempId);
    if (tempIdx >= 0) {
      const clone = [...prev];
      clone[tempIdx] = { ...clone[tempIdx], ...incoming };
      return clone;
    }
  }

  return [...prev, incoming];
}

export default function ChatPage() {
  const { user } = useAuthStore();
  const [conversation, setConversation] = useState<Conversation | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [botThinking, setBotThinking] = useState(false);
  const [isEscalating, setIsEscalating] = useState(false);
  const [escalationNotice, setEscalationNotice] = useState('');
  const [lastHeartbeat, setLastHeartbeat] = useState<number>(Date.now());
  const [isConnected, setIsConnected] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const socketRef = useRef(getChatSocket());
  const typingTimerRef = useRef<number | null>(null);

  const chatId = conversation?._id;

  useEffect(() => {
    const init = async () => {
      try {
        const res = await chatApi.getMyConversations();
        const convs: Conversation[] = res.data.data || [];
        if (convs.length > 0) {
          const conv = convs[0];
          const fullRes = await chatApi.getConversation(conv._id);
          const full = fullRes.data.data as Conversation;
          setConversation(full);
          setMessages(full.messages || []);
          if (full.isEscalated || full.is_escalated) {
            setEscalationNotice('Connecting you to a human agent...');
          }
        }
      } catch {
        // no-op
      } finally {
        setLoading(false);
      }
    };

    init();
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket) return;

    const onConnect = () => setIsConnected(true);
    const onDisconnect = () => setIsConnected(false);
    const onHeartbeatAck = () => setLastHeartbeat(Date.now());

    socket.on('connect', onConnect);
    socket.on('disconnect', onDisconnect);
    socket.on('heartbeat_ack', onHeartbeatAck);

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
      window.clearInterval(heartbeatInterval);
    };
  }, []);

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket || !chatId) return;

    socket.emit('join:conversation', { conversationId: chatId });

    const handleMessageReceived = (msg: ChatMessage) => {
      if (msg.chatId && msg.chatId !== chatId) return;

      setMessages((prev) => upsertMessage(prev, msg));
      setTyping(false);

      if (msg.senderType !== 'Client' && msg._id) {
        socket.emit('message_seen', { chatId, messageIds: [msg._id] });
      }

      if (msg.senderType === 'Admin' || msg.senderType === 'Agent') {
        setConversation((prev) => (prev ? { ...prev, status: 'AgentHandling', isEscalated: true, is_escalated: true } : prev));
        setEscalationNotice('You are now connected to a support agent.');
      }
    };

    const handleTyping = ({ isTyping, userId }: { isTyping: boolean; userId: string }) => {
      if (!user?._id || userId === user._id) return;
      setTyping(isTyping);
    };

    const handleSeenUpdate = ({ messageIds, seenAt }: { messageIds: string[]; seenAt: string }) => {
      setMessages((prev) => prev.map((m) => (messageIds.includes(m._id) ? { ...m, isRead: true, seenAt } : m)));
    };

    const handleEscalation = ({ conversationId }: { conversationId: string }) => {
      if (conversationId !== chatId) return;
      setConversation((prev) => (prev ? { ...prev, isEscalated: true, is_escalated: true, status: 'WaitingForAgent' } : prev));
      setEscalationNotice('Connecting you to a human agent...');
      setIsEscalating(false);
    };

    const handleChatResolved = ({ conversationId, systemMessage }: { conversationId: string; systemMessage?: string }) => {
      if (conversationId !== chatId) return;

      setConversation((prev) => (prev
        ? { ...prev, isEscalated: false, is_escalated: false, status: 'BotHandling' }
        : prev));
      setEscalationNotice('');

      const msgText = systemMessage || 'This session has been resolved. Our AI assistant is back online to help you.';
      const systemMsg: ChatMessage = {
        _id: `system-resolved-${Date.now()}`,
        chatId,
        senderType: 'Bot',
        content: msgText,
        timestamp: new Date().toISOString(),
        metadata: { intent: 'resolution_notice' },
      };
      setMessages((prev) => upsertMessage(prev, systemMsg));
    };

    socket.on('message_received', handleMessageReceived);
    socket.on('typing', handleTyping);
    socket.on('seen_update', handleSeenUpdate);
    socket.on('escalation_triggered', handleEscalation);
    socket.on('chat_resolved', handleChatResolved);

    return () => {
      socket.emit('leave:conversation', { conversationId: chatId });
      socket.off('message_received', handleMessageReceived);
      socket.off('typing', handleTyping);
      socket.off('seen_update', handleSeenUpdate);
      socket.off('escalation_triggered', handleEscalation);
      socket.off('chat_resolved', handleChatResolved);
    };
  }, [chatId, user?._id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, typing, botThinking, escalationNotice]);

  const emitTyping = (isTyping: boolean) => {
    if (!chatId) return;
    socketRef.current?.emit('typing', { chatId, isTyping });
  };

  const onInputChange = (value: string) => {
    setInput(value);
    if (!chatId) return;

    emitTyping(true);
    if (typingTimerRef.current) window.clearTimeout(typingTimerRef.current);
    typingTimerRef.current = window.setTimeout(() => emitTyping(false), 800);
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const content = input.trim();
    const clientTempId = createClientTempId();
    setInput('');
    setSending(true);
    emitTyping(false);

    const optimisticMsg: ChatMessage = {
      _id: `temp-${clientTempId}`,
      chatId,
      senderType: 'Client',
      clientTempId,
      content,
      timestamp: new Date().toISOString(),
      sender: { _id: user?._id, firstName: user?.firstName, lastName: user?.lastName },
    };
    setMessages((prev) => upsertMessage(prev, optimisticMsg));

    try {
      let convId = chatId;
      if (!convId) {
        const res = await chatApi.startConversation({ subject: 'Support Chat', channel: 'web' });
        const conv = res.data.data as Conversation;
        setConversation(conv);
        convId = conv._id;
      }

      const currentlyEscalated = conversation ? (conversation.isEscalated || conversation.is_escalated) : false;
      if (!currentlyEscalated) setBotThinking(true);

      await chatApi.sendMessage(convId, { content, clientTempId });
    } catch {
      // no-op
    } finally {
      setBotThinking(false);
      setSending(false);
    }
  };

  const requestHumanSupport = async () => {
    if (isEscalating) return;

    setIsEscalating(true);
    setEscalationNotice('Connecting you to a human agent...');

    try {
      let convId = chatId;
      if (!convId) {
        const res = await chatApi.startConversation({ subject: 'Support Chat', channel: 'web' });
        const conv = res.data.data as Conversation;
        setConversation(conv);
        convId = conv._id;
      }

      socketRef.current?.emit('request_escalation', {
        conversationId: convId,
        reason: 'User clicked Request Human Support',
      });

      const res = await supportApi.escalate({
        conversationId: convId,
        reason: 'User clicked Request Human Support',
      });

      const updated = res.data.data as Conversation;
      setConversation(updated);
      setMessages(updated.messages || []);
    } finally {
      setIsEscalating(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const senderLabel: Record<string, string> = {
    Client: user?.firstName || 'You',
    Agent: 'Support Agent',
    Admin: 'Support Agent',
    Bot: 'NiceBot',
  };

  const isEscalated = !!conversation && (conversation.isEscalated || conversation.is_escalated || ['WaitingForAgent', 'AgentHandling'].includes(conversation.status));

  const lastOwnMessage = useMemo(() => [...messages].reverse().find((m) => m.senderType === 'Client'), [messages]);

  if (loading) {
    return <div className="flex justify-center py-16"><LoadingSpinner /></div>;
  }

  return (
    <div className="flex flex-col h-[calc(100vh-8rem)] max-w-2xl mx-auto animate-fade-in">
      <div className="flex items-center gap-3 p-4 border-b bg-white rounded-t-2xl">
        <div className="w-10 h-10 bg-primary-100 rounded-xl flex items-center justify-center">
          <Bot size={22} className="text-primary-600" />
        </div>
        <div className="flex-1">
          <h1 className="font-semibold text-slate-900">Support Chat</h1>
          <p className="text-xs text-slate-500">{isEscalated ? 'Human support mode' : 'AI-only mode'}</p>
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${isConnected ? 'bg-green-100 text-green-700' : 'bg-slate-100 text-slate-500'}`}>
          {isConnected ? 'Live' : 'Reconnecting...'}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-50">
        {messages.length === 0 && (
          <div className="text-center py-8">
            <Bot size={40} className="mx-auto text-slate-300 mb-3" />
            <p className="text-slate-500 font-medium">Hi {user?.firstName}!</p>
            <p className="text-sm text-slate-400 mt-1">How can I help you today?</p>
          </div>
        )}

        {escalationNotice && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
            {escalationNotice}
          </div>
        )}

        {messages.map((msg) => {
          const isOwn = msg.senderType === 'Client';
          const isHumanSupport = msg.senderType === 'Agent' || msg.senderType === 'Admin';
          const confidence = msg.metadata?.aiConfidence;
          const confidenceColor = confidence === undefined ? '' : confidence >= 0.7 ? 'text-emerald-500' : confidence >= 0.5 ? 'text-amber-500' : 'text-red-400';

          return (
            <div key={msg._id} className={`flex gap-2.5 ${isOwn ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-bold ${msg.senderType === 'Bot' ? 'bg-primary-100 text-primary-700' : isOwn ? 'bg-slate-200 text-slate-700' : 'bg-green-100 text-green-700'}`}>
                {msg.senderType === 'Bot' ? <Bot size={14} /> : isOwn ? <User size={14} /> : <PhoneCall size={14} />}
              </div>
              <div className="max-w-[75%] space-y-0.5">
                <p className={`text-xs text-slate-400 ${isOwn ? 'text-right' : ''}`}>{senderLabel[msg.senderType]}</p>
                <div className={`rounded-2xl px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap ${isOwn ? 'bg-primary-600 text-white rounded-tr-sm' : isHumanSupport ? 'bg-green-600 text-white rounded-tl-sm' : 'bg-white text-slate-800 shadow-sm border rounded-tl-sm'}`}>
                  {msg.content}
                </div>
                <div className={`flex items-center gap-2 ${isOwn ? 'flex-row-reverse' : ''}`}>
                  <p className="text-xs text-slate-300">
                    <DateDisplay date={msg.timestamp} format="p" />
                  </p>
                  {msg.senderType === 'Bot' && confidence !== undefined && (
                    <span className={`flex items-center gap-0.5 text-xs font-medium ${confidenceColor}`}>
                      <Sparkles size={10} />
                      {Math.round(confidence * 100)}%
                    </span>
                  )}
                  {isOwn && msg.isRead && <span className="text-[10px] text-emerald-600">Seen</span>}
                </div>
              </div>
            </div>
          );
        })}

        {(typing || botThinking) && !isEscalated && (
          <div className="flex gap-2.5">
            <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center">
              <Bot size={14} className="text-primary-700" />
            </div>
            <div className="bg-white border shadow-sm rounded-2xl rounded-tl-sm px-4 py-3 text-xs text-slate-400">
              {botThinking ? 'NiceBot is thinking...' : 'Typing...'}
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      <div className="p-3 bg-white border-t rounded-b-2xl space-y-2">
        {!isEscalated && (
          <button
            onClick={requestHumanSupport}
            disabled={isEscalating}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-amber-200 bg-amber-50 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100 disabled:opacity-60"
          >
            {isEscalating ? <Loader2 size={14} className="animate-spin" /> : <LifeBuoy size={14} />}
            Request Human Support
          </button>
        )}

        <div className="flex items-end gap-2 bg-slate-50 rounded-xl border border-slate-200 px-3 py-2">
          <textarea
            rows={1}
            className="flex-1 bg-transparent resize-none outline-none text-sm text-slate-800 placeholder-slate-400 max-h-32"
            placeholder="Type a message..."
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || sending}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${input.trim() && !sending ? 'bg-primary-600 text-white hover:bg-primary-700' : 'bg-slate-200 text-slate-400'}`}
          >
            {sending ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        {lastOwnMessage?.isRead && (
          <p className="text-[11px] text-right text-emerald-600">Seen by support</p>
        )}
        <p className="text-[10px] text-slate-400">Heartbeat: {new Date(lastHeartbeat).toLocaleTimeString()}</p>
      </div>
    </div>
  );
}
