import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Store } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';

export default function LiveChatWidget() {
  const {
    messages,
    isChatOpen,
    setIsChatOpen,
    unreadCount,
    isTyping,
    currentRoomId,
    sendMessage,
    sendTyping
  } = useChat();
  const { user } = useAuth();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, isTyping]);

  const handleSend = (e) => {
    e?.preventDefault();
    if (!inputText.trim()) return;

    sendMessage(inputText.trim());
    setInputText('');
    sendTyping(false);
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    sendTyping(e.target.value.length > 0);
  };

  return (
    <>
      {/* Floating Trigger Button (Desktop & Tablet) */}
      {!isChatOpen && (
        <button
          onClick={() => setIsChatOpen(true)}
          className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2.5 px-4 py-3 rounded-full bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 text-white font-bold text-sm shadow-2xl shadow-orange-500/40 hover:scale-105 active:scale-95 transition-all duration-300 group border-2 border-white/40"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 group-hover:rotate-6 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                {unreadCount}
              </span>
            )}
          </div>
          <span>Chat Trực Tiếp Với Quán</span>
          <span className="w-2 h-2 rounded-full bg-emerald-300 animate-ping" />
        </button>
      )}

      {/* Chat Window Dialog */}
      {isChatOpen && (
        <div className="fixed bottom-0 md:bottom-6 right-0 md:right-6 z-50 w-full md:w-[380px] h-[520px] max-h-[85vh] bg-white md:rounded-3xl shadow-2xl border border-slate-200/80 flex flex-col overflow-hidden animate-scale-up">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-orange-600 to-amber-500 p-4 text-white flex items-center justify-between shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center font-black">
                  🍲
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-orange-600" />
              </div>
              <div>
                <h4 className="font-bold text-sm leading-tight">Chủ Quán Bếp Việt</h4>
                <p className="text-[11px] text-orange-100 flex items-center gap-1">
                  <span>Trực tuyến</span> • Trả lời trực tiếp ngay
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 rounded-full bg-black/15 hover:bg-black/25 flex items-center justify-center text-white transition"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current User Session Bar */}
          <div className="bg-orange-50/80 px-4 py-1.5 text-[11px] text-orange-800 border-b border-orange-100 flex items-center justify-between">
            <span className="truncate">
              👤 Đang chat với tên:{' '}
              <strong className="text-orange-950">
                {user ? `${user.name} (${user.phone})` : `Khách (${currentRoomId?.slice(-4) || 'Ẩn danh'})`}
              </strong>
            </span>
            <span className="text-[10px] text-emerald-600 font-bold bg-emerald-100 px-1.5 py-0.5 rounded">
              Real-time
            </span>
          </div>

          {/* Real Messages Stream */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#FAF8F5]">
            {messages.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                <div className="w-12 h-12 rounded-2xl bg-orange-100 text-orange-500 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6" />
                </div>
                <p className="text-xs font-semibold text-slate-700">Chưa có tin nhắn nào</p>
                <p className="text-[11px] text-slate-400 max-w-xs">
                  Hãy nhập câu hỏi bên dưới để nhắn tin trực tiếp với chủ quán. Chủ quán sẽ phản hồi bạn ngay lập tức!
                </p>
              </div>
            ) : (
              messages.map((msg, index) => {
                const isMe = msg.sender_role === 'customer';
                return (
                  <div
                    key={msg.id || index}
                    className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
                  >
                    <div className={`flex items-end gap-2 max-w-[85%] ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
                      {!isMe && (
                        <div className="w-6 h-6 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center text-[10px] shrink-0 font-bold">
                          Bếp
                        </div>
                      )}
                      <div
                        className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                          isMe
                            ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white rounded-br-xs'
                            : 'bg-white text-slate-800 border border-slate-100 rounded-bl-xs'
                        }`}
                      >
                        {msg.message}
                      </div>
                    </div>
                    <span className="text-[10px] text-slate-400 mt-1 px-1">
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

            {/* Typing indicator */}
            {isTyping && (
              <div className="flex items-center gap-2 text-xs text-slate-400 italic">
                <div className="flex gap-1 items-center bg-white px-3 py-1.5 rounded-full shadow-sm border border-slate-100">
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0.2s]" />
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-bounce [animation-delay:0.4s]" />
                </div>
                <span>Quán đang nhập tin...</span>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Real Input Bar */}
          <form
            onSubmit={handleSend}
            className="p-3 bg-white border-t border-slate-100 flex items-center gap-2 shrink-0"
          >
            <input
              type="text"
              placeholder="Nhập tin nhắn gửi chủ quán..."
              value={inputText}
              onChange={handleInputChange}
              className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-100 focus:bg-white border border-transparent focus:border-orange-500 focus:ring-2 focus:ring-orange-100 text-xs outline-none transition"
              autoFocus
            />
            <button
              type="submit"
              disabled={!inputText.trim()}
              className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white transition ${
                inputText.trim()
                  ? 'bg-orange-500 hover:bg-orange-600 active:scale-95 shadow-md shadow-orange-500/25'
                  : 'bg-slate-300 cursor-not-allowed'
              }`}
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
