/**
 * ChatPage — Real-time DM system
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import useAuthStore from '../context/authStore';
import { useSocket } from '../hooks/useSocket';
import api from '../utils/api';
import { formatLastSeen } from '../utils/rankUtils';
import toast from 'react-hot-toast';

function MessageBubble({ message, isOwn }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {!isOwn && (
        <div className="w-7 h-7 rounded-full bg-pp-input-bg border border-pp-border flex-shrink-0 flex items-center justify-center text-xs overflow-hidden">
          {message.sender?.avatar
            ? <img src={message.sender.avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-gray-600 font-bold">{message.sender?.username?.[0]?.toUpperCase()}</span>
          }
        </div>
      )}
      <div className={`max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
        {!isOwn && <span className="text-xs text-gray-400 px-1">{message.sender?.username}</span>}
        <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
          isOwn
            ? 'bg-pp-orange text-white rounded-br-sm'
            : 'bg-pp-input-bg text-gray-800 border border-pp-border rounded-bl-sm'
        }`}>
          {message.content}
        </div>
        <span className="text-xs text-gray-400 px-1">
          {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

function ConversationItem({ conv, isActive, onClick, currentUserId }) {
  const other = conv.participants?.find((p) => p._id !== currentUserId);
  const lastMsg = conv.lastMessage;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all text-left ${
        isActive
          ? 'bg-pp-orange-light border border-orange-200'
          : 'hover:bg-pp-input-bg border border-transparent'
      }`}
    >
      <div className="relative flex-shrink-0">
        <div className="w-10 h-10 rounded-full bg-pp-input-bg border border-pp-border flex items-center justify-center text-base overflow-hidden">
          {other?.avatar
            ? <img src={other.avatar} alt="" className="w-full h-full object-cover" />
            : <span className="text-gray-600 font-bold text-sm">{other?.username?.[0]?.toUpperCase()}</span>
          }
        </div>
        <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${other?.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-semibold text-sm text-gray-900 truncate">{other?.username}</span>
          {conv.unreadCount > 0 && (
            <span className="bg-pp-orange text-white text-xs rounded-full w-4 h-4 flex items-center justify-center flex-shrink-0 ml-1">
              {conv.unreadCount}
            </span>
          )}
        </div>
        <div className="text-xs text-gray-400 truncate mt-0.5">
          {lastMsg?.content || 'Start chatting!'}
        </div>
      </div>
    </button>
  );
}

export default function ChatPage() {
  const { conversationId: paramConvId } = useParams();
  const { user } = useAuthStore();
  const navigate = useNavigate();
  const { on, emit } = useSocket();

  const [conversations, setConversations] = useState([]);
  const [activeConvId, setActiveConvId] = useState(paramConvId || null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [typing, setTyping] = useState(false);
  const [partnerTyping, setPartnerTyping] = useState(false);
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  const activeConv = conversations.find((c) => c._id === activeConvId);
  const partner = activeConv?.participants?.find((p) => p._id !== user?._id);

  useEffect(() => {
    api.get('/chat/conversations')
      .then(({ data }) => setConversations(data.conversations))
      .catch(() => {})
      .finally(() => setLoadingConvs(false));
  }, []);

  useEffect(() => {
    if (!activeConvId) return;
    setLoadingMsgs(true);
    setMessages([]);
    emit('join_conversation', activeConvId);
    api.get(`/chat/${activeConvId}/messages`)
      .then(({ data }) => setMessages(data.messages))
      .catch(() => toast.error('Failed to load messages'))
      .finally(() => setLoadingMsgs(false));
    return () => emit('leave_conversation', activeConvId);
  }, [activeConvId]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  useEffect(() => {
    const cleanup = on('new_message', ({ message, conversationId }) => {
      if (conversationId === activeConvId) setMessages((prev) => [...prev, message]);
      setConversations((prev) =>
        prev.map((c) => c._id === conversationId
          ? { ...c, lastMessage: message, unreadCount: c._id === activeConvId ? 0 : (c.unreadCount || 0) + 1 }
          : c
        )
      );
    });
    return cleanup;
  }, [on, activeConvId]);

  useEffect(() => {
    const cleanup = on('message_received', (msg) => {
      if (msg.conversationId === activeConvId) {
        setMessages((prev) => {
          if (prev.some((m) => m.tempId === msg.tempId)) return prev;
          return [...prev, { ...msg, _id: msg.tempId || Date.now() }];
        });
      }
    });
    return cleanup;
  }, [on, activeConvId]);

  useEffect(() => {
    const c1 = on('typing', ({ conversationId }) => { if (conversationId === activeConvId) setPartnerTyping(true); });
    const c2 = on('stop_typing', ({ conversationId }) => { if (conversationId === activeConvId) setPartnerTyping(false); });
    return () => { c1?.(); c2?.(); };
  }, [on, activeConvId]);

  const handleInputChange = (e) => {
    setInput(e.target.value);
    if (!typing) { setTyping(true); emit('typing_start', { conversationId: activeConvId }); }
    clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setTyping(false);
      emit('typing_stop', { conversationId: activeConvId });
    }, 1500);
  };

  const handleSend = async () => {
    const content = input.trim();
    if (!content || !activeConvId || sending) return;
    setInput('');
    emit('typing_stop', { conversationId: activeConvId });
    const tempMsg = {
      _id: `temp_${Date.now()}`,
      content,
      sender: { _id: user._id, username: user.username, avatar: user.avatar },
      createdAt: new Date().toISOString(),
      optimistic: true,
    };
    setMessages((prev) => [...prev, tempMsg]);
    setSending(true);
    try {
      await api.post(`/chat/${activeConvId}/send`, { content });
    } catch {
      toast.error('Message failed to send');
      setMessages((prev) => prev.filter((m) => m._id !== tempMsg._id));
      setInput(content);
    } finally { setSending(false); }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const selectConversation = (convId) => {
    setActiveConvId(convId);
    navigate(`/chat/${convId}`, { replace: true });
    setPartnerTyping(false);
  };

  return (
    <div className="flex h-full overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      {/* Conversation list */}
      <aside className={`
        flex-shrink-0 border-r border-pp-border flex flex-col bg-white
        ${activeConvId ? 'hidden sm:flex w-72' : 'flex w-full sm:w-72'}
      `}>
        <div className="p-4 border-b border-pp-border">
          <h2 className="font-display font-bold text-gray-900 tracking-wide">MESSAGES</h2>
        </div>
        <div className="flex-1 overflow-y-auto p-2 space-y-1">
          {loadingConvs ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 p-3 animate-pulse">
                <div className="w-10 h-10 rounded-full bg-pp-input-bg" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 bg-pp-input-bg rounded w-2/3" />
                  <div className="h-3 bg-pp-input-bg rounded w-1/2" />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="text-center py-10 px-4">
              <div className="text-3xl mb-3">💬</div>
              <p className="text-gray-500 text-sm">No conversations yet.</p>
              <p className="text-gray-400 text-xs mt-1">Connect with players to start chatting!</p>
            </div>
          ) : (
            conversations.map((conv) => (
              <ConversationItem
                key={conv._id}
                conv={conv}
                isActive={conv._id === activeConvId}
                onClick={() => selectConversation(conv._id)}
                currentUserId={user?._id}
              />
            ))
          )}
        </div>
      </aside>

      {/* Chat window */}
      {activeConvId ? (
        <div className="flex-1 flex flex-col min-w-0 bg-pp-bg">
          {/* Header */}
          <div className="flex items-center gap-3 px-4 py-3 border-b border-pp-border bg-white flex-shrink-0 shadow-sm">
            <button onClick={() => { setActiveConvId(null); navigate('/chat'); }} className="sm:hidden text-gray-400 hover:text-gray-900 mr-1">←</button>
            {partner && (
              <>
                <div className="relative">
                  <div className="w-9 h-9 rounded-full bg-pp-input-bg border border-pp-border flex items-center justify-center overflow-hidden">
                    {partner.avatar
                      ? <img src={partner.avatar} alt="" className="w-full h-full object-cover" />
                      : <span className="text-gray-600 font-bold text-sm">{partner.username?.[0]?.toUpperCase()}</span>
                    }
                  </div>
                  <span className={`absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 border-white ${partner.isOnline ? 'bg-green-500' : 'bg-gray-300'}`} />
                </div>
                <div>
                  <div className="font-semibold text-gray-900 text-sm">{partner.username}</div>
                  <div className="text-xs text-gray-400">
                    {partnerTyping
                      ? <span className="text-pp-orange animate-pulse">typing...</span>
                      : partner.isOnline ? '🟢 Online' : `⚫ ${formatLastSeen(partner.lastSeen)}`
                    }
                  </div>
                </div>
              </>
            )}
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin w-6 h-6 border-2 border-pp-orange border-t-transparent rounded-full" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="text-4xl mb-3">👋</div>
                <p className="text-gray-600 text-sm">Start your conversation with {partner?.username}!</p>
                <p className="text-gray-400 text-xs mt-1">Good luck out there, duo!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <MessageBubble
                  key={msg._id}
                  message={msg}
                  isOwn={msg.sender?._id === user?._id || msg.sender === user?._id}
                />
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="flex-shrink-0 p-4 border-t border-pp-border bg-white">
            <div className="flex items-end gap-3">
              <textarea
                ref={inputRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder="Type a message... (Enter to send)"
                className="input flex-1 resize-none min-h-[42px] max-h-28 py-2.5 rounded-2xl"
                style={{ height: 'auto' }}
                onInput={(e) => {
                  e.target.style.height = 'auto';
                  e.target.style.height = Math.min(e.target.scrollHeight, 112) + 'px';
                }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className="btn-primary p-2.5 aspect-square flex-shrink-0 disabled:opacity-40 rounded-xl"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 hidden sm:flex items-center justify-center bg-pp-bg">
          <div className="text-center">
            <div className="text-6xl mb-4">💬</div>
            <h3 className="font-display font-bold text-xl text-gray-900 mb-2">SELECT A CONVERSATION</h3>
            <p className="text-gray-400 text-sm">Choose from the left to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
