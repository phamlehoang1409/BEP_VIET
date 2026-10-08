import React, { useState, useRef, useEffect } from 'react';
import {
  MessageSquare,
  X,
  Send,
  User,
  Store,
  Lock,
  ArrowRight,
  ShieldCheck,
  Trash2,
  Bot,
  Sparkles,
  Plus,
  Star,
  Flame,
  ShoppingBag,
  RotateCcw
} from 'lucide-react';
import { useChat } from '../context/ChatContext';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { sendChatbotMessage } from '../api';
import { formatVND } from '../utils/vietnamData';
import ConfirmModal from './ConfirmModal';

const INITIAL_BOT_MESSAGE = {
  id: 'welcome',
  sender: 'bot',
  text: 'Xin chào! Em là **Bếp Việt AI Assistant** 🤖. Em có thể tư vấn món ăn ngon, kiểm tra giá, gợi ý combo hoặc giải đáp các thắc mắc về đơn hàng & khuyến mãi cho Quý khách 24/7 ạ!',
  suggestedFoods: [],
  quickReplies: ['Món bán chạy nhất 🔥', 'Thực đơn dưới 50k 💰', 'Món cay sa tế 🌶️', 'Mã giảm giá hôm nay 🎁'],
  time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
};

export default function LiveChatWidget() {
  const {
    messages: liveMessages,
    isChatOpen,
    setIsChatOpen,
    unreadCount,
    isTyping: isMerchantTyping,
    sendMessage: sendLiveMessage,
    sendTyping: sendLiveTyping,
    clearCurrentChat
  } = useChat();
  const { user, setIsAuthModalOpen } = useAuth();
  const { addToCart, showStoreClosedModal, storeSettings } = useCart();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState('ai_bot'); // 'ai_bot' | 'merchant'
  const [inputText, setInputText] = useState('');
  const [showEndChatModal, setShowEndChatModal] = useState(false);
  const [endingChat, setEndingChat] = useState(false);

  // ChatBot State
  const [botMessages, setBotMessages] = useState([INITIAL_BOT_MESSAGE]);
  const [isBotThinking, setIsBotThinking] = useState(false);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isChatOpen) {
      scrollToBottom();
    }
  }, [liveMessages, botMessages, isChatOpen, isMerchantTyping, isBotThinking, activeTab]);

  const handleOpenChat = () => {
    setIsChatOpen(true);
  };

  const handleSendBotQuery = async (queryText) => {
    const text = (queryText || inputText).trim();
    if (!text) return;

    const userMsg = {
      id: Date.now().toString(),
      sender: 'user',
      text,
      time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
    };

    setBotMessages((prev) => [...prev, userMsg]);
    setInputText('');
    setIsBotThinking(true);

    try {
      const res = await sendChatbotMessage(text);
      if (res.success) {
        const botReply = {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: res.reply,
          suggestedFoods: res.suggestedFoods || [],
          quickReplies: res.quickReplies || [],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        };
        setBotMessages((prev) => [...prev, botReply]);
      }
    } catch (err) {
      setBotMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 1).toString(),
          sender: 'bot',
          text: 'Dạ hiện tại em đang gặp chút gián đoạn kết nối, Quý khách vui lòng thử lại hoặc chuyển sang tab **"Chat Với Chủ Quán"** để được hỗ trợ trực tiếp nhé!',
          suggestedFoods: [],
          quickReplies: ['Thực đơn 🍜', 'Chat chủ quán 👨‍🍳'],
          time: new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
        }
      ]);
    } finally {
      setIsBotThinking(false);
    }
  };

  const handleSend = (e) => {
    e?.preventDefault();
    if (activeTab === 'ai_bot') {
      handleSendBotQuery();
    } else {
      if (!user) {
        showToast('Quý khách vui lòng đăng nhập để gửi tin nhắn cho chủ quán', 'error');
        setIsAuthModalOpen(true);
        return;
      }
      if (!inputText.trim()) return;
      sendLiveMessage(inputText.trim());
      setInputText('');
      sendLiveTyping(false);
    }
  };

  const handleInputChange = (e) => {
    setInputText(e.target.value);
    if (activeTab === 'merchant') {
      sendLiveTyping(e.target.value.length > 0);
    }
  };

  const handleAddFoodFromBot = (food) => {
    if (storeSettings && storeSettings.is_currently_open === false) {
      showStoreClosedModal();
      return;
    }
    if (!food.is_available) {
      showToast('Món ăn hiện đang tạm hết!', 'error');
      return;
    }
    addToCart(food, 1);
    showToast(`Đã thêm 1 phần "${food.name}" vào giỏ hàng!`, 'success');
  };

  const handleConfirmEndChat = async () => {
    setEndingChat(true);
    try {
      await clearCurrentChat();
      showToast('Đã kết thúc cuộc trò chuyện và xóa toàn bộ tin nhắn!', 'success');
      setShowEndChatModal(false);
    } catch (e) {
      showToast('Không thể xóa tin nhắn', 'error');
    } finally {
      setEndingChat(false);
    }
  };

  return (
    <>
      {/* Floating Trigger Button */}
      {!isChatOpen && (
        <button
          onClick={handleOpenChat}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 px-4 py-3 sm:px-5 sm:py-3.5 rounded-full bg-gradient-to-r from-[#161922] via-[#202534] to-[#161922] text-amber-300 font-black text-xs sm:text-sm shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:scale-105 active:scale-95 transition-all duration-300 group border border-amber-500/40"
        >
          <div className="relative flex items-center gap-1.5">
            <div className="w-7 h-7 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center">
              <Bot className="w-4 h-4 text-purple-400 group-hover:rotate-12 transition-transform" />
            </div>
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 bg-rose-600 text-white text-[10px] font-black w-4 h-4 rounded-full flex items-center justify-center animate-bounce shadow">
                {unreadCount}
              </span>
            )}
          </div>
          <span className="tracking-tight">Chat Hỗ Trợ 24/7</span>
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse shadow-sm shadow-emerald-400/50" />
        </button>
      )}

      {/* Chat Window Dialog */}
      {isChatOpen && (
        <div className="fixed bottom-0 md:bottom-6 right-0 md:right-6 z-50 w-full md:w-[410px] h-[580px] max-h-[90vh] bg-[#0D0F17] md:rounded-3xl shadow-[0_25px_60px_rgba(0,0,0,0.8)] border border-amber-500/30 flex flex-col overflow-hidden animate-scale-up text-white">
          {/* Header */}
          <div className="bg-gradient-to-r from-[#161922] to-[#202534] p-3.5 text-white flex items-center justify-between border-b border-amber-500/20 shadow-md">
            <div className="flex items-center gap-2.5">
              <div className="relative">
                <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-600 to-amber-500 flex items-center justify-center font-black text-white shadow-md shadow-purple-500/20">
                  {activeTab === 'ai_bot' ? <Bot className="w-5 h-5" /> : '🍜'}
                </div>
                <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#161922]" />
              </div>
              <div>
                <h4 className="font-black text-xs sm:text-sm leading-tight text-white flex items-center gap-1.5">
                  <span>{activeTab === 'ai_bot' ? 'Bếp Việt AI Assistant' : 'Chủ Quán Bếp Việt'}</span>
                  <span className="text-[10px] bg-amber-400/15 text-amber-400 px-1.5 py-0.2 rounded border border-amber-400/30 font-bold">
                    {activeTab === 'ai_bot' ? 'AI 24/7' : 'VIP'}
                  </span>
                </h4>
                <p className="text-[10px] sm:text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <span>{activeTab === 'ai_bot' ? 'Sẵn sàng tư vấn tức thì' : 'Phản hồi trong 1-2 phút'}</span>
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1.5">
              {activeTab === 'merchant' && liveMessages.length > 0 && (
                <button
                  onClick={() => setShowEndChatModal(true)}
                  title="Kết thúc & Xóa sạch tin nhắn"
                  className="w-8 h-8 rounded-full bg-slate-800/80 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 flex items-center justify-center transition border border-slate-700/60 active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
              <button
                onClick={() => setIsChatOpen(false)}
                className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Mode Switcher Tabs */}
          <div className="flex bg-[#0A0C13] border-b border-slate-800 p-1">
            <button
              onClick={() => setActiveTab('ai_bot')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 ${
                activeTab === 'ai_bot'
                  ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-md shadow-purple-600/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Bot className="w-3.5 h-3.5 text-amber-300" />
              <span>Trợ Lý AI Bot (Tức Thì)</span>
            </button>

            <button
              onClick={() => setActiveTab('merchant')}
              className={`flex-1 py-2 rounded-xl text-xs font-black transition flex items-center justify-center gap-1.5 relative ${
                activeTab === 'merchant'
                  ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 shadow-md shadow-amber-500/20'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              <span>Chat Với Chủ Quán</span>
              {unreadCount > 0 && (
                <span className="w-2 h-2 rounded-full bg-rose-500" />
              )}
            </button>
          </div>

          {/* TAB 1: AI CHATBOT */}
          {activeTab === 'ai_bot' && (
            <>
              {/* Bot Message List */}
              <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0C13]">
                {botMessages.map((msg) => {
                  const isUser = msg.sender === 'user';
                  return (
                    <div
                      key={msg.id}
                      className={`flex flex-col ${isUser ? 'items-end' : 'items-start'}`}
                    >
                      <div className={`flex items-end gap-2 max-w-[90%] ${isUser ? 'flex-row-reverse' : 'flex-row'}`}>
                        {!isUser && (
                          <div className="w-7 h-7 rounded-xl bg-purple-600/30 text-purple-300 border border-purple-500/40 flex items-center justify-center text-[10px] shrink-0 font-black">
                            <Bot className="w-4 h-4 text-purple-300" />
                          </div>
                        )}
                        <div
                          className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-sm ${
                            isUser
                              ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 font-bold rounded-br-xs'
                              : 'bg-[#161926] text-slate-200 border border-slate-700/80 rounded-bl-xs'
                          }`}
                        >
                          <div className="whitespace-pre-line">{msg.text}</div>

                          {/* Recommended Food Cards embedded in chat */}
                          {msg.suggestedFoods && msg.suggestedFoods.length > 0 && (
                            <div className="mt-3 space-y-2 pt-2 border-t border-slate-700/60">
                              <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 flex items-center gap-1">
                                <Sparkles className="w-3 h-3" /> Món Ăn Phù Hợp:
                              </span>
                              {msg.suggestedFoods.map((f) => (
                                <div
                                  key={f.id}
                                  className="p-2.5 rounded-xl bg-slate-900/90 border border-slate-700/80 flex items-center justify-between gap-2 text-slate-200"
                                >
                                  <div className="flex items-center gap-2">
                                    <img
                                      src={f.image}
                                      alt={f.name}
                                      referrerPolicy="no-referrer"
                                      className="w-10 h-10 rounded-lg object-cover border border-slate-700"
                                    />
                                    <div>
                                      <h6 className="font-bold text-[11px] text-white line-clamp-1">{f.name}</h6>
                                      <span className="text-amber-400 font-black text-[11px]">{formatVND(f.price)}</span>
                                    </div>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleAddFoodFromBot(f)}
                                    className="px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-[10px] flex items-center gap-1 shrink-0 transition active:scale-95 shadow-sm"
                                  >
                                    <Plus className="w-3 h-3" />
                                    <span>Chọn</span>
                                  </button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                      <span className="text-[9px] text-slate-500 mt-1 px-1">{msg.time}</span>
                    </div>
                  );
                })}

                {/* Bot Thinking Loader */}
                {isBotThinking && (
                  <div className="flex items-center gap-2 text-xs text-purple-400">
                    <div className="flex gap-1 items-center bg-[#161926] px-3.5 py-2 rounded-2xl border border-purple-500/30">
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.2s]" />
                      <span className="w-1.5 h-1.5 rounded-full bg-purple-400 animate-bounce [animation-delay:0.4s]" />
                    </div>
                    <span className="text-[11px] font-semibold text-purple-300">Bếp Việt AI đang soạn câu trả lời...</span>
                  </div>
                )}

                <div ref={messagesEndRef} />
              </div>

              {/* Quick Reply Pills */}
              {botMessages[botMessages.length - 1]?.quickReplies?.length > 0 && !isBotThinking && (
                <div className="px-3 py-1.5 bg-[#121522] border-t border-slate-800 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
                  {botMessages[botMessages.length - 1].quickReplies.map((qr, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleSendBotQuery(qr)}
                      className="px-2.5 py-1 rounded-full bg-slate-800 hover:bg-slate-700 text-amber-300 text-[10px] font-bold border border-slate-700 whitespace-nowrap transition active:scale-95"
                    >
                      {qr}
                    </button>
                  ))}
                </div>
              )}

              {/* Bot Input Bar */}
              <form
                onSubmit={handleSend}
                className="p-3 bg-[#141722] border-t border-slate-800 flex items-center gap-2 shrink-0"
              >
                <input
                  type="text"
                  placeholder="Hỏi AI: 'Gợi ý món cay dưới 60k', 'Quán mấy giờ đóng cửa?'..."
                  value={inputText}
                  onChange={handleInputChange}
                  className="flex-1 px-4 py-2.5 rounded-2xl bg-slate-900 border border-slate-700 focus:border-purple-400 text-xs text-white placeholder-slate-500 outline-none transition"
                  autoFocus
                />
                <button
                  type="submit"
                  disabled={!inputText.trim()}
                  className={`w-9 h-9 rounded-2xl flex items-center justify-center text-white transition ${
                    inputText.trim()
                      ? 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 active:scale-95 shadow-md shadow-purple-600/25 font-bold'
                      : 'bg-slate-800 text-slate-600 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </form>
            </>
          )}

          {/* TAB 2: LIVE MERCHANT CHAT */}
          {activeTab === 'merchant' && (
            <>
              {!user ? (
                <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4 bg-[#0D0F17]">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center">
                    <Lock className="w-7 h-7" />
                  </div>
                  <div className="space-y-1">
                    <h4 className="text-base font-black text-white">Yêu Cầu Đăng Nhập</h4>
                    <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
                      Để lưu trữ lịch sử tin nhắn và chủ quán phục vụ chu đáo nhất, Quý khách vui lòng đăng nhập trước khi nhắn tin.
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
                  <div className="bg-[#141722] px-4 py-2 text-[11px] text-slate-300 border-b border-slate-800 flex items-center justify-between">
                    <span className="truncate">
                      👤 Khách: <strong className="text-amber-300">{user.name}</strong> ({user.phone})
                    </span>
                    <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                      Trực tuyến
                    </span>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-[#0A0C13]">
                    {liveMessages.length === 0 ? (
                      <div className="h-full flex flex-col items-center justify-center text-center p-6 text-slate-400 space-y-2">
                        <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-400 flex items-center justify-center border border-amber-500/20">
                          <MessageSquare className="w-6 h-6" />
                        </div>
                        <p className="text-xs font-bold text-slate-200">Kính chào {user.name}!</p>
                        <p className="text-[11px] text-slate-400 max-w-xs">
                          Quý khách có yêu cầu riêng về món ăn hoặc thời gian giao hàng, hãy nhắn tin trực tiếp cho chủ quán tại đây nhé!
                        </p>
                      </div>
                    ) : (
                      liveMessages.map((msg, index) => {
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

                    {isMerchantTyping && (
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

                  <form
                    onSubmit={handleSend}
                    className="p-3 bg-[#141722] border-t border-slate-800 flex items-center gap-2 shrink-0"
                  >
                    <input
                      type="text"
                      placeholder="Nhập tin nhắn gửi chủ quán..."
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
            </>
          )}
        </div>
      )}

      {/* Confirm End Chat Modal */}
      <ConfirmModal
        isOpen={showEndChatModal}
        title="Kết Thúc Cuộc Trò Chuyện?"
        message="Quý khách có chắc chắn muốn kết thúc trò chuyện và xóa toàn bộ dữ liệu tin nhắn khỏi hệ thống không?"
        confirmText="Kết Thúc & Xóa"
        cancelText="Tiếp Tục Chat"
        confirmType="danger"
        loading={endingChat}
        onConfirm={handleConfirmEndChat}
        onCancel={() => setShowEndChatModal(false)}
      />
    </>
  );
}
