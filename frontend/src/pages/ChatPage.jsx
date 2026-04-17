/**
 * ChatPage — Real-time DM system
 */

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import useAuthStore from '../context/authStore';
import { useSocket } from '../hooks/useSocket';
import api, { API_URL } from '../utils/api';
import { formatLastSeen } from '../utils/rankUtils';
import toast from 'react-hot-toast';

// ─── Helpers ──────────────────────────────────────────────────────────────────
function formatTime(date) {
  return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

function formatConvTime(date) {
  if (!date) return '';
  const diff = Date.now() - new Date(date).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'now';
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  return `${Math.floor(hrs / 24)}d`;
}

function avatarSrc(avatar) {
  if (!avatar) return null;
  return avatar.startsWith('/uploads') ? `${API_URL}${avatar}` : avatar;
}

// ─── Avatar ───────────────────────────────────────────────────────────────────
function Avatar({ user, size = 10, showOnline = false }) {
  const src = avatarSrc(user?.avatar);
  return (
    <div className="relative flex-shrink-0">
      <div
        className={`w-${size} h-${size} rounded-full bg-gradient-to-br from-pp-orange/20 to-pp-orange/5 border-2 shadow-sm flex items-center justify-center overflow-hidden`}
        style={{ borderColor: 'var(--pp-surface)' }}
      >
        {src
          ? <img src={src} alt="" className="w-full h-full object-cover" />
          : <span className="font-bold text-pp-orange" style={{ fontSize: size * 3.5 + 'px' }}>
              {user?.username?.[0]?.toUpperCase()}
            </span>
        }
      </div>
      {showOnline && (
        <span
          className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 ${user?.isOnline ? 'bg-green-400' : 'bg-gray-300 dark:bg-gray-600'}`}
          style={{ borderColor: 'var(--pp-surface)' }}
        />
      )}
    </div>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────
function MessageBubble({ message, isOwn, showAvatar }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.18 }}
      className={`flex items-end gap-2 ${isOwn ? 'flex-row-reverse' : 'flex-row'}`}
    >
      {/* Avatar spacer / avatar */}
      <div className="w-7 flex-shrink-0">
        {!isOwn && showAvatar && (
          <Avatar user={message.sender} size={7} />
        )}
      </div>

      <div className={`flex flex-col gap-1 max-w-xs lg:max-w-md ${isOwn ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 text-sm leading-relaxed shadow-sm ${
            isOwn
              ? 'bg-gradient-to-br from-pp-orange to-orange-600 text-white rounded-2xl rounded-br-md'
              : 'text-gray-800 border rounded-2xl rounded-bl-md'
          }`}
          style={isOwn ? undefined : {
            backgroundColor: 'var(--pp-surface)',
            borderColor: 'var(--pp-border)',
          }}
        >
          {message.content}
        </div>
        <span className="text-[10px] px-1" style={{ color: 'var(--pp-subtle)' }}>
          {formatTime(message.createdAt)}
          {isOwn && message.optimistic && <span className="ml-1 opacity-60">·</span>}
        </span>
      </div>
    </motion.div>
  );
}

// ─── Typing Dots ──────────────────────────────────────────────────────────────
function TypingIndicator({ partner }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 4 }}
      className="flex items-end gap-2"
    >
      <Avatar user={partner} size={7} />
      <div
        className="border rounded-2xl rounded-bl-md px-4 py-3 shadow-sm flex items-center gap-1"
        style={{ backgroundColor: 'var(--pp-surface)', borderColor: 'var(--pp-border)' }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full bg-gray-400 dark:bg-gray-500"
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}

// ─── Conversation Item ────────────────────────────────────────────────────────
function ConversationItem({ conv, isActive, onClick, currentUserId }) {
  const other = conv.participants?.find((p) => p._id !== currentUserId);
  const lastMsg = conv.lastMessage;

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all text-left group border ${
        isActive
          ? 'bg-gradient-to-r from-pp-orange/15 to-pp-orange/5 border-pp-orange/30'
          : 'hover:bg-gray-50 border-transparent'
      }`}
    >
      <Avatar user={other} size={11} showOnline />
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-1">
          <span className={`font-semibold text-sm truncate ${isActive ? 'text-pp-orange' : 'text-gray-900'}`}>
            {other?.username}
          </span>
          <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--pp-subtle)' }}>
            {formatConvTime(lastMsg?.createdAt)}
          </span>
        </div>
        <div className="flex items-center justify-between gap-1 mt-0.5">
          <span className="text-xs truncate" style={{ color: 'var(--pp-subtle)' }}>
            {lastMsg?.content || 'Say hello! 👋'}
          </span>
          {conv.unreadCount > 0 && (
            <span className="bg-pp-orange text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1 flex-shrink-0">
              {conv.unreadCount}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ─── Date Divider ─────────────────────────────────────────────────────────────
function DateDivider({ date }) {
  const d = new Date(date);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  let label;
  if (d.toDateString() === today.toDateString()) label = 'Today';
  else if (d.toDateString() === yesterday.toDateString()) label = 'Yesterday';
  else label = d.toLocaleDateString([], { weekday: 'long', month: 'short', day: 'numeric' });

  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--pp-border)' }} />
      <span className="text-[10px] font-medium uppercase tracking-wider px-2" style={{ color: 'var(--pp-subtle)' }}>{label}</span>
      <div className="flex-1 h-px" style={{ backgroundColor: 'var(--pp-border)' }} />
    </div>
  );
}

// ─── Group messages by day and add avatar grouping ────────────────────────────
function groupMessages(messages) {
  const result = [];
  let lastDate = null;
  let lastSenderId = null;

  messages.forEach((msg, i) => {
    const msgDate = new Date(msg.createdAt).toDateString();
    if (msgDate !== lastDate) {
      result.push({ type: 'divider', date: msg.createdAt, id: `div-${i}` });
      lastDate = msgDate;
      lastSenderId = null;
    }
    const showAvatar = msg.sender?._id !== lastSenderId;
    result.push({ type: 'message', message: msg, showAvatar, id: msg._id });
    lastSenderId = msg.sender?._id || msg.sender;
  });

  return result;
}

// ─── Main Page ────────────────────────────────────────────────────────────────
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
  const textareaRef = useRef(null);

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
    // Auto-resize
    const ta = textareaRef.current;
    if (ta) { ta.style.height = 'auto'; ta.style.height = Math.min(ta.scrollHeight, 112) + 'px'; }
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
    if (textareaRef.current) { textareaRef.current.style.height = 'auto'; }
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

  const grouped = groupMessages(messages);

  return (
    <div
      className="flex overflow-hidden"
      style={{ height: 'calc(100vh - 56px)', backgroundColor: 'var(--pp-bg)' }}
    >

      {/* ── Conversation sidebar ───────────────────────────────── */}
      <aside
        className={`
          flex-shrink-0 flex flex-col border-r backdrop-blur-md
          ${activeConvId ? 'hidden sm:flex w-72' : 'flex w-full sm:w-72'}
        `}
        style={{ backgroundColor: 'var(--pp-surface)', borderColor: 'var(--pp-border)' }}
      >
        {/* Sidebar header */}
        <div className="px-5 py-4 border-b" style={{ borderColor: 'var(--pp-border)' }}>
          <h2 className="font-hero text-lg text-gray-900 tracking-wide">Messages</h2>
          <p className="text-xs mt-0.5" style={{ color: 'var(--pp-subtle)' }}>
            {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
          </p>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-0.5">
          {loadingConvs ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center gap-3 px-3 py-3 animate-pulse">
                <div className="w-11 h-11 rounded-full flex-shrink-0" style={{ backgroundColor: 'var(--pp-input-bg)' }} />
                <div className="flex-1 space-y-2">
                  <div className="h-3 rounded-full w-2/3" style={{ backgroundColor: 'var(--pp-input-bg)' }} />
                  <div className="h-3 rounded-full w-1/2" style={{ backgroundColor: 'var(--pp-input-bg)' }} />
                </div>
              </div>
            ))
          ) : conversations.length === 0 ? (
            <div className="text-center py-16 px-6">
              <div
                className="w-16 h-16 rounded-2xl flex items-center justify-center text-3xl mx-auto mb-4"
                style={{ backgroundColor: 'var(--pp-orange-light)' }}
              >💬</div>
              <p className="font-semibold text-gray-700 text-sm">No conversations yet</p>
              <p className="text-xs mt-1" style={{ color: 'var(--pp-subtle)' }}>Connect with players to start chatting!</p>
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

      {/* ── Chat window ───────────────────────────────────────── */}
      {activeConvId ? (
        <div
          className="flex-1 flex flex-col min-w-0"
          style={{ backgroundColor: 'var(--pp-bg)' }}
        >

          {/* Chat header */}
          <div
            className="flex items-center gap-3 px-4 py-3 border-b backdrop-blur-md flex-shrink-0"
            style={{
              backgroundColor: 'var(--pp-surface)',
              borderColor: 'var(--pp-border)',
              boxShadow: '0 1px 12px rgba(0,0,0,0.04)',
            }}
          >
            <button
              onClick={() => { setActiveConvId(null); navigate('/chat'); }}
              className="sm:hidden text-gray-400 hover:text-gray-700 p-1.5 rounded-xl hover:bg-gray-100 transition-colors mr-1"
            >
              ←
            </button>
            {partner && (
              <>
                <Avatar user={partner} size={10} showOnline />
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-gray-900 text-sm truncate">{partner.username}</div>
                  <div className="text-xs mt-0.5">
                    <AnimatePresence mode="wait">
                      {partnerTyping ? (
                        <motion.span
                          key="typing"
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="text-pp-orange font-medium"
                        >
                          typing...
                        </motion.span>
                      ) : partner.isOnline ? (
                        <motion.span key="online" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-green-500 font-medium">
                          Online
                        </motion.span>
                      ) : (
                        <motion.span key="offline" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-gray-400">
                          {formatLastSeen(partner.lastSeen)}
                        </motion.span>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
                <button
                  onClick={() => navigate(`/profile/${partner.username}`)}
                  className="text-xs text-gray-400 hover:text-pp-orange transition-colors px-3 py-1.5 rounded-xl hover:bg-pp-orange-light border border-transparent hover:border-orange-200 font-medium"
                >
                  Profile →
                </button>
              </>
            )}
          </div>

          {/* Messages area */}
          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-1">
            {loadingMsgs ? (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3">
                  <div className="animate-spin w-7 h-7 border-2 border-pp-orange border-t-transparent rounded-full" />
                  <span className="text-xs text-gray-400">Loading messages...</span>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center gap-3">
                <div
                  className="w-20 h-20 rounded-3xl shadow-md flex items-center justify-center text-4xl border"
                  style={{ backgroundColor: 'var(--pp-surface)', borderColor: 'var(--pp-border)' }}
                >
                  👋
                </div>
                <div>
                  <p className="font-semibold text-gray-700 text-sm">Say hello to {partner?.username}!</p>
                  <p className="text-xs mt-1" style={{ color: 'var(--pp-subtle)' }}>Good luck out there, duo 🎮</p>
                </div>
              </div>
            ) : (
              <>
                {grouped.map((item) =>
                  item.type === 'divider' ? (
                    <DateDivider key={item.id} date={item.date} />
                  ) : (
                    <MessageBubble
                      key={item.id}
                      message={item.message}
                      showAvatar={item.showAvatar}
                      isOwn={item.message.sender?._id === user?._id || item.message.sender === user?._id}
                    />
                  )
                )}
                <AnimatePresence>
                  {partnerTyping && <TypingIndicator key="typing" partner={partner} />}
                </AnimatePresence>
              </>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input bar */}
          <div
            className="flex-shrink-0 px-4 py-3 border-t backdrop-blur-md"
            style={{ backgroundColor: 'var(--pp-surface)', borderColor: 'var(--pp-border)' }}
          >
            <div
              className="flex items-end gap-2 rounded-2xl border shadow-sm px-4 py-2"
              style={{
                backgroundColor: 'var(--pp-input-bg)',
                borderColor: 'var(--pp-border)',
                boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
              }}
            >
              <textarea
                ref={textareaRef}
                rows={1}
                value={input}
                onChange={handleInputChange}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${partner?.username || ''}…`}
                className="flex-1 resize-none bg-transparent outline-none text-sm text-gray-800 py-1.5 min-h-[28px] max-h-28"
                style={{ color: 'inherit' }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim() || sending}
                className={`flex-shrink-0 w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-150 ${
                  input.trim() && !sending
                    ? 'bg-pp-orange hover:bg-orange-600 text-white shadow-sm hover:shadow-md hover:scale-105'
                    : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                }`}
              >
                {sending ? (
                  <div className="w-4 h-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"/>
                  </svg>
                )}
              </button>
            </div>
            <p className="text-[10px] text-center mt-1.5" style={{ color: 'var(--pp-subtle)' }}>
              Enter to send · Shift+Enter for new line
            </p>
          </div>
        </div>
      ) : (
        /* No conversation selected */
        <div
          className="flex-1 hidden sm:flex items-center justify-center"
          style={{ backgroundColor: 'var(--pp-bg)' }}
        >
          <div className="text-center">
            <motion.div
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
              className="w-24 h-24 rounded-3xl shadow-lg flex items-center justify-center text-5xl mx-auto mb-6 border"
              style={{ backgroundColor: 'var(--pp-surface)', borderColor: 'var(--pp-border)' }}
            >
              💬
            </motion.div>
            <h3 className="font-hero text-xl text-gray-800 mb-2 tracking-wide">Your Messages</h3>
            <p className="text-sm" style={{ color: 'var(--pp-subtle)' }}>Select a conversation to start chatting</p>
          </div>
        </div>
      )}
    </div>
  );
}
