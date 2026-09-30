import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, User, Store, Lock, ArrowRight, ShieldCheck } from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useToast } from './Toast';

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
  const { user, setIsAuthModalOpen } = useAuth();
  const { showToast } = useToast();
  const [inputText, setInputText] = useState('');
  const messagesEndRef = useRef(null);

  // Auto scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen && user) {
      scrollToBottom();
    }
  }, [messages, isChatOpen, isTyping, user]);

  const handleOpenChat = () => {
    if (!user) {
      showToast('Quý khách vui lòng đăng nhập để kết nối trò chuyện trực tiếp với chủ quán', 'info');
      setIsAuthModalOpen(true);
      return;
    }
    setIsChatOpen(true);
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (!user) {
      showToast('Quý khách vui lòng đăng nhập để gửi tin nhắn', 'error');
      setIsAuthModalOpen(true);
      return;
    }
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
          onClick={handleOpenChat}
          className="hidden md:flex fixed bottom-6 right-6 z-40 items-center gap-2.5 px-5 py-3 rounded-full bg-gradient-to-r from-[#161922] via-[#202534] to-[#161922] text-amber-300 font-black text-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 group border border-amber-500/40"
        >
          <div className="relative">
            <MessageSquare className="w-5 h-5 text-amber-400 group-hover:rotate-6 transition-transform" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="tracking-tight">Chat Với Chủ Quán</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
        </button>
      )}

      {/* Chat Window Dialog */}
      {isChatOpen && (
        <div className="fixed bottom-0 md:bottom-6 right-0 md:right-6 z-50 w-full md:w-[390px] h-[530px] max-h-[85vh] bg-[#0D0F17] md:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-amber-500/30 flex flex-col overflow-hidden animate-scale-up text-white">
          {/* Chat Header */}
          <div className="bg-gradient-to-r from-[#161922] to-[#202534] p-4 text-white flex items-center justify-between border-b border-amber-500/20 shadow-md">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center font-black text-amber-400">
                  🍜
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-emerald-400 border-2 border-[#161922]" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm leading-tight text-amber-300 flex items-center gap-1.5">
                  <span>Chủ Quán Bếp Việt</span>
                  <span className="text-[10px] bg-amber-400/15 text-amber-400 px-1.5 py-0.2 rounded border border-amber-400/30">VIP</span>
                </h4>
                <p className="text-[11px] text-slate-400 flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>Trực tuyến</span> • Phản hồi trong 1 phút
                </p>
              </div>
            </div>

            <button
              onClick={() => setIsChatOpen(false)}
              className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/60"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Current User Session Bar or Login Required Gate */}
          {!user ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#0D0F17]">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                <Lock className="w-7 h-7" />
              </div>
              <div className="space-y-1">
                <h4 className="text-base font-black text-white">Yêu Cầu Đăng Nhập</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                  Để bảo mật thông tin và phục vụ chu đáo nhất, Quý khách vui lòng đăng nhập trước khi trò chuyện với chủ quán.
                </p>
              </div>
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full max-w-xs flex items-center justify-center gap-2 py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-black text-xs shadow-lg shadow-amber-500/20 active:scale-95 transition"
              >
                <span>Đăng Nhập Bằng Số Điện Thoại</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <>
              {/* Logged in User Bar */}
              <div className="bg-[#141722] px-4 py-2 text-[11px] text-slate-300 border-b border-slate-800 flex items-center justify-between">
                <span className="truncate">
                  👤 Đang chat: <strong className="text-amber-300">{user.name}</strong> ({user.phone})
                </span>
                <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                  Kết nối trực tiếp
                </span>
              </div>

              {/* Real Messages Stream */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0C13]">
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                    <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                      <MessageSquare className="w-6 h-6" />
                    </div>
                    <p className="text-xs font-bold text-slate-200">Kính chào {user.name}!</p>
                    <p className="text-[11px] text-slate-400 max-w-xs">
                      Quý khách có thắc mắc về món Mì Indomie thượng hạng, thời gian giao hàng hoặc đặt bàn, hãy nhắn tin ngay cho chủ quán nhé!
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
                            <div className="w-6 h-6 rounded-xl bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center justify-center text-[10px] shrink-0 font-bold">
                              Quán
                            </div>
                          )}
                          <div
                            className={`p-3 rounded-2xl text-xs leading-relaxed shadow-sm ${
                              isMe
                                ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-medium rounded-br-xs'
                                : 'bg-[#181C28] text-slate-200 border border-slate-700/80 rounded-bl-xs'
                            }`}
                          >
                            {msg.message}
                          </div>
                        </div>
                        <span className="text-[10px] text-slate-500 mt-1 px-1">
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
                  <div className="flex items-center gap-2 text-xs text-amber-400 italic">
                    <div className="flex gap-1 items-center bg-[#181C28] px-3 py-1.5 rounded-full border border-amber-500/20">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span>Chủ quán đang nhập tin...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Real Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-[#141722] border-t border-slate-800 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Nhập câu hỏi gửi trực tiếp tới chủ quán..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 focus:border-amber-400 text-xs text-white placeholder-slate-500 outline-none transition"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-slate-950 transition ${
                    inputText.trim()
                      ? 'bg-gradient-to-r from-amber-400 to-orange-400 hover:from-amber-500 hover:to-orange-500 active:scale-95 shadow-md shadow-amber-500/25 font-bold'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}
        </div>
      )}
    </>
  );
}
