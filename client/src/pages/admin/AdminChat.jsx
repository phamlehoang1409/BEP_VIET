import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  User,
  Phone,
  Clock,
  Sparkles,
  Search,
  CheckCheck,
  RefreshCw,
  Loader2
} from 'lucide-react';
import { getChatRooms, getChatMessages, markChatRead, sendChatMessage, getSocket } from '../../api';
import { useToast } from '../../components/Toast';

const ADMIN_QUICK_TEMPLATES = [
  'Dạ chào bạn! Bếp Việt có thể giúp gì cho bạn ạ?',
  'Quán đã tiếp nhận đơn và đang chuẩn bị món ăn nóng sốt cho bạn nhé!',
  'Món ăn đã nấu xong, shipper đang hỏa tốc giao tới bạn ạ!',
  'Dạ vâng, quán đã ghi nhận yêu cầu thêm gia vị của bạn rồi ạ.'
];

export default function AdminChat() {
  const location = useLocation();
  const { showToast } = useToast();
  const [rooms, setRooms] = useState([]);
  const [activeRoomId, setActiveRoomId] = useState(location.state?.customerPhone || '');
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState('');
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sending, setSending] = useState(false);
  const [searchPhone, setSearchPhone] = useState('');

  const messagesEndRef = useRef(null);
  const activeRoomRef = useRef(activeRoomId);
  activeRoomRef.current = activeRoomId;

  const socket = getSocket();

  const fetchRooms = async (autoSelect = false) => {
    try {
      const res = await getChatRooms();
      if (res.success && res.rooms) {
        setRooms(res.rooms);
        if (autoSelect && !activeRoomRef.current && res.rooms.length > 0) {
          setActiveRoomId(res.rooms[0].room_id);
        }
      }
    } catch (err) {
      console.error('Error fetching chat rooms:', err);
    } finally {
      setLoadingRooms(false);
    }
  };

  const fetchMessages = async (roomId) => {
    if (!roomId) return;
    try {
      setLoadingMessages(true);
      const res = await getChatMessages(roomId);
      if (res.success && res.messages) {
        setMessages(res.messages);
        markChatRead(roomId, 'admin').catch(() => {});
      }
    } catch (err) {
      console.error('Error fetching room messages:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

function playChatNotificationSound() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5
    gain.gain.setValueAtTime(0.12, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.3);
  } catch {
    // Ignore audio restriction gracefully
  }
}

  // Join admin room & initial fetch
  useEffect(() => {
    if (socket) {
      socket.emit('join_admin_room');
      const handleConnect = () => socket.emit('join_admin_room');
      socket.on('connect', handleConnect);
      return () => socket.off('connect', handleConnect);
    }
  }, [socket]);

  useEffect(() => {
    fetchRooms(true);
  }, []);

  // When activeRoomId changes, fetch messages & mark read
  useEffect(() => {
    if (activeRoomId) {
      fetchMessages(activeRoomId);
    }
  }, [activeRoomId]);

  // Periodic polling for rooms list (every 3.5s)
  useEffect(() => {
    const timer = setInterval(() => {
      fetchRooms(false);
    }, 3500);
    return () => clearInterval(timer);
  }, []);

  // Periodic polling for active room messages (every 2.5s)
  useEffect(() => {
    if (!activeRoomId) return;

    let isMounted = true;
    const pollMessages = async () => {
      try {
        const res = await getChatMessages(activeRoomId);
        if (!isMounted || !res.success || !res.messages) return;

        setMessages((prev) => {
          if (
            prev.length === res.messages.length &&
            prev.length > 0 &&
            prev[prev.length - 1]?.id === res.messages[res.messages.length - 1]?.id
          ) {
            return prev;
          }

          // Check if any new message from customer arrived
          const prevIds = new Set(prev.map((m) => m.id));
          const newCustomerMsgs = res.messages.filter(
            (m) => !prevIds.has(m.id) && m.sender_role === 'customer'
          );

          if (newCustomerMsgs.length > 0) {
            playChatNotificationSound();
            markChatRead(activeRoomId, 'admin').catch(() => {});
          }

          return res.messages;
        });
      } catch (e) {}
    };

    const timer = setInterval(pollMessages, 2500);
    return () => {
      isMounted = false;
      clearInterval(timer);
    };
  }, [activeRoomId]);

  // Handle incoming socket messages in real-time
  useEffect(() => {
    if (!socket) return;

    const handleNewMessage = (newMsg) => {
      const currentActive = activeRoomRef.current;

      // If message is in currently open room
      if (newMsg.room_id === currentActive) {
        setMessages((prev) => {
          if (newMsg.id && prev.some((m) => m.id === newMsg.id)) return prev;
          return [...prev, newMsg];
        });
        markChatRead(currentActive, 'admin').catch(() => {});
        if (newMsg.sender_role === 'customer') {
          playChatNotificationSound();
        }
      } else if (!currentActive) {
        // No room open yet, auto select this customer
        setActiveRoomId(newMsg.room_id);
        if (newMsg.sender_role === 'customer') {
          playChatNotificationSound();
        }
      } else {
        // Message from another customer conversation
        if (newMsg.sender_role === 'customer') {
          playChatNotificationSound();
          showToast(`💬 Tin nhắn mới từ khách hàng ${newMsg.sender_name || newMsg.room_id}: "${newMsg.message}"`, 'info');
        }
      }

      // Always update sidebar rooms list
      fetchRooms(false);
    };

    socket.on('new_message', handleNewMessage);
    return () => socket.off('new_message', handleNewMessage);
  }, [socket, showToast]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send admin message: ALWAYS via HTTP API with optimistic UI and socket broadcast
  const sendAdminMessage = async (text) => {
    if (!text || !text.trim() || !activeRoomId || sending) return;
    const content = text.trim();
    setSending(true);

    const payload = {
      room_id: activeRoomId,
      sender_role: 'admin',
      sender_phone: '0909999999',
      sender_name: 'Bếp Việt (Chủ Quán)',
      message: content
    };

    // Optimistic UI update
    const tempId = 'temp_' + Date.now();
    const tempMsg = {
      id: tempId,
      ...payload,
      created_at: new Date().toISOString()
    };

    setMessages((prev) => [...prev, tempMsg]);
    setReplyText('');

    try {
      // 1. Guaranteed HTTP REST API write to Supabase
      const res = await sendChatMessage(payload);
      if (res.success && res.message) {
        setMessages((prev) =>
          prev.map((m) => (m.id === tempId ? res.message : m))
        );
      }

      // 2. Also emit to socket if connected
      if (socket?.connected) {
        socket.emit('chat_message', payload);
      }

      // 3. Refresh sidebar rooms
      fetchRooms(false);
    } catch (err) {
      console.error('Error sending admin message:', err);
      showToast(err.message || 'Không thể gửi tin nhắn!', 'error');
      setMessages((prev) => prev.filter((m) => m.id !== tempId));
    } finally {
      setSending(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    sendAdminMessage(replyText);
  };

  const handleTemplateSend = (text) => {
    sendAdminMessage(text);
  };

  const filteredRooms = rooms.filter(
    (r) =>
      r.room_id.includes(searchPhone) ||
      (r.customer_name && r.customer_name.toLowerCase().includes(searchPhone.toLowerCase()))
  );

  return (
    <div className="space-y-6 h-[calc(100vh-120px)] flex flex-col">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[11px] font-black uppercase tracking-wider text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              💬 Live Chat
            </span>
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-bold">Online</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            Trung Tâm Hỗ Trợ Khách Hàng
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Trò chuyện trực tiếp, tư vấn món ăn và theo dõi tiến trình đơn hàng
          </p>
        </div>

        <button
          onClick={() => fetchRooms(false)}
          className="self-start flex items-center gap-1.5 px-4 py-2.5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-bold transition border border-slate-700 shadow-lg"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          <span>Làm Mới</span>
        </button>
      </div>

      {/* CHAT INTERFACE: 2 Columns */}
      <div className="flex-1 bg-slate-800/80 border border-slate-700/60 rounded-3xl overflow-hidden shadow-2xl flex flex-col md:flex-row">
        {/* LEFT COLUMN: Customer Conversation Rooms */}
        <div className="w-full md:w-80 bg-slate-900/90 border-r border-slate-700/60 flex flex-col shrink-0">
          {/* Search bar */}
          <div className="p-4 border-b border-slate-800">
            <div className="relative">
              <input
                type="text"
                placeholder="Tìm SĐT hoặc tên khách..."
                value={searchPhone}
                onChange={(e) => setSearchPhone(e.target.value)}
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-800 text-xs text-white placeholder-slate-500 outline-none focus:border-orange-500 border border-slate-700"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
            </div>
          </div>

          {/* Room list */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50">
            {loadingRooms ? (
              <div className="p-4 text-center text-xs text-slate-500">Đang tải cuộc trò chuyện...</div>
            ) : filteredRooms.length === 0 ? (
              <div className="p-8 text-center text-xs text-slate-500">
                Chưa có khách hàng nhắn tin. Khi khách hàng nhắn tin ở trang chủ, cuộc trò chuyện sẽ lập tức xuất hiện tại đây!
              </div>
            ) : (
              filteredRooms.map((room) => {
                const isActive = room.room_id === activeRoomId;
                return (
                  <div
                    key={room.room_id}
                    onClick={() => setActiveRoomId(room.room_id)}
                    className={`p-3.5 cursor-pointer transition flex items-center justify-between ${
                      isActive ? 'bg-orange-500/15 border-l-4 border-orange-500' : 'hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-500/20 text-amber-400 flex items-center justify-center font-bold text-xs shrink-0 border border-amber-500/20">
                        <User className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <h4 className="font-bold text-xs text-white truncate">
                          {room.customer_name || `Khách ${room.room_id.slice(-4)}`}
                        </h4>
                        <p className="text-[11px] text-slate-400 truncate mt-0.5">
                          {room.last_message || 'Bắt đầu cuộc trò chuyện'}
                        </p>
                      </div>
                    </div>

                    <div className="text-right shrink-0 ml-2">
                      <span className="text-[10px] text-slate-500 block">
                        {room.last_activity
                          ? new Date(room.last_activity).toLocaleTimeString('vi-VN', {
                              hour: '2-digit',
                              minute: '2-digit'
                            })
                          : ''}
                      </span>
                      {room.unread_count > 0 && (
                        <span className="inline-block bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full mt-1">
                          {room.unread_count}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* RIGHT COLUMN: Active Chat Room */}
        <div className="flex-1 flex flex-col bg-slate-900/40">
          {activeRoomId ? (
            <>
              {/* Header */}
              <div className="p-4 bg-gradient-to-r from-slate-900 via-slate-900 to-slate-800 border-b border-amber-500/20 flex items-center justify-between shadow-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/25 to-orange-500/25 text-amber-400 flex items-center justify-center font-black text-xs border border-amber-500/30 shadow-md">
                    <Phone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-sm text-white flex items-center gap-2">
                      <span>{rooms.find((r) => r.room_id === activeRoomId)?.customer_name || `Khách hàng: ${activeRoomId}`}</span>
                      {rooms.find((r) => r.room_id === activeRoomId)?.customer_name && (
                        <span className="text-xs text-slate-400 font-normal">({activeRoomId})</span>
                      )}
                    </h3>
                    <p className="text-[11px] text-emerald-400 flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 inline-block animate-ping" />
                      Kênh chat trực tiếp 2 chiều (Cloud Database & Real-time)
                    </p>
                  </div>
                </div>
              </div>

              {/* Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3">
                {loadingMessages ? (
                  <div className="text-center text-xs text-slate-500 py-10">Đang tải tin nhắn...</div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-xs text-slate-500 py-10">
                    Chưa có tin nhắn trong cuộc trò chuyện này. Hãy gửi tin nhắn đầu tiên cho khách!
                  </div>
                ) : (
                  messages.map((msg, idx) => {
                    const isFromAdmin = msg.sender_role === 'admin';
                    return (
                      <div
                        key={msg.id || idx}
                        className={`flex flex-col ${isFromAdmin ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[75%] p-3 rounded-2xl text-xs leading-relaxed ${
                            isFromAdmin
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-br-xs shadow-lg shadow-amber-500/20'
                              : 'bg-slate-800/90 text-slate-200 border border-slate-700/60 rounded-bl-xs shadow-sm'
                          }`}
                        >
                          <p className="font-black text-[10px] opacity-75 mb-0.5">
                            {isFromAdmin ? 'Bếp Việt (Chủ Quán)' : msg.sender_name || 'Khách hàng'}
                          </p>
                          <p>{msg.message}</p>
                        </div>
                        <span className="text-[9px] text-slate-500 mt-1 px-1">
                          {msg.created_at
                            ? new Date(msg.created_at).toLocaleTimeString('vi-VN', {
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Vừa xong'}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Templates */}
              <div className="px-4 py-2.5 bg-gradient-to-r from-slate-900 to-slate-900/95 border-t border-amber-500/10 flex gap-2 overflow-x-auto no-scrollbar shrink-0">
                {ADMIN_QUICK_TEMPLATES.map((tmpl, idx) => (
                  <button
                    key={idx}
                    disabled={sending}
                    onClick={() => handleTemplateSend(tmpl)}
                    className="whitespace-nowrap text-[11px] font-semibold bg-slate-800/80 hover:bg-amber-500/15 hover:text-amber-300 hover:border-amber-500/30 text-slate-300 px-3.5 py-2 rounded-xl border border-slate-700/60 transition shrink-0 disabled:opacity-50 shadow-sm"
                  >
                    {tmpl}
                  </button>
                ))}
              </div>

              {/* Input Form */}
              <form onSubmit={handleSend} className="p-3 bg-slate-900 border-t border-slate-800 flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Nhập câu trả lời gửi trực tiếp cho khách hàng..."
                  value={replyText}
                  onChange={(e) => setReplyText(e.target.value)}
                  className="flex-1 px-4 py-3 rounded-2xl bg-slate-800/90 text-sm text-white placeholder-slate-500 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-400/10 border border-slate-700/60 transition"
                />
                <button
                  type="submit"
                  disabled={!replyText.trim() || sending}
                  className={`w-9 h-9 rounded-xl flex items-center justify-center text-white transition ${
                    replyText.trim() && !sending
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-lg shadow-amber-500/30 active:scale-95'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin text-orange-400" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                </button>
              </form>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-slate-500 text-xs p-8 text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mb-4">
                <MessageSquare className="w-8 h-8 text-amber-400/60" />
              </div>
              <p className="text-sm font-bold text-slate-400 mb-1">Chưa Có Cuộc Trò Chuyện</p>
              <p className="text-[11px] text-slate-500 max-w-xs">Chọn khách hàng ở bên trái để bắt đầu trò chuyện, hoặc đợi tin nhắn mới từ khách hàng.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
