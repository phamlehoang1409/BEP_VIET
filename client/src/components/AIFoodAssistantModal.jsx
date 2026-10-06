import React, { useState, useEffect } from 'react';
import { Sparkles, X, Bot, Plus, ArrowRight, Check, Flame, Clock, Heart, RefreshCw, ShoppingBag } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { formatVND } from '../utils/vietnamData';
import confetti from 'canvas-confetti';

const MOOD_OPTIONS = [
  { id: 'spicy', label: '🌶️ Thèm cay nồng bùng nổ', desc: 'Mì cay sa tế, sốt cay ngọt đậm đà đánh thức vị giác' },
  { id: 'protein', label: '🥩 Đậm đà ngập thịt & trứng', desc: 'Bò Mỹ mềm thơm, xá xíu mật ong, trứng lòng đào béo ngậy' },
  { id: 'late_night', label: '🌙 Ăn đêm ấm bụng dịu nhẹ', desc: 'Khẩu phần vừa vặn, không ngấy, chế biến nóng hổi cấp tốc' },
  { id: 'budget', label: '💰 Tiết kiệm (Dưới 50k)', desc: 'Ngon - Bổ - Rẻ no nê chuẩn giá học sinh sinh viên' },
  { id: 'vip_combo', label: '👑 Set VIP Trọn Gói Đầy Đủ', desc: 'Mì Indomie đặc biệt + Nước giải khát + Đồ ăn vặt' },
];

export default function AIFoodAssistantModal({ isOpen, onClose, foods = [] }) {
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const [selectedMood, setSelectedMood] = useState('protein');
  const [customPrompt, setCustomPrompt] = useState('');
  const [maxBudget, setMaxBudget] = useState(80000);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendedSet, setRecommendedSet] = useState(null);

  useEffect(() => {
    if (isOpen && foods.length > 0) {
      generateRecommendation(selectedMood, maxBudget, customPrompt);
    }
  }, [isOpen, selectedMood]);

  if (!isOpen) return null;

  const generateRecommendation = (mood, budget, prompt = '') => {
    setAnalyzing(true);
    setTimeout(() => {
      let mainDish = null;
      let sideDish = null;

      const lowerPrompt = prompt.toLowerCase();

      // Rule-based intelligent matcher
      if (lowerPrompt.includes('bò') || lowerPrompt.includes('bo')) {
        mainDish = foods.find(f => f.name.toLowerCase().includes('bò') && f.is_available) || foods[0];
      } else if (lowerPrompt.includes('xá xíu') || lowerPrompt.includes('xa xiu')) {
        mainDish = foods.find(f => f.name.toLowerCase().includes('xá xíu') && f.is_available) || foods[0];
      } else if (lowerPrompt.includes('hải sản') || lowerPrompt.includes('hai san') || lowerPrompt.includes('cay')) {
        mainDish = foods.find(f => f.spicy_level > 0 && f.is_available) || foods[0];
      } else {
        switch (mood) {
          case 'spicy':
            mainDish = foods.find(f => f.spicy_level > 0 && f.is_available) || foods.find(f => f.name.toLowerCase().includes('hải sản')) || foods[0];
            break;
          case 'protein':
            mainDish = foods.find(f => f.name.toLowerCase().includes('bò') && f.is_available) || foods[0];
            break;
          case 'budget':
            const sortedByPrice = [...foods].filter(f => f.is_available).sort((a, b) => a.price - b.price);
            mainDish = sortedByPrice[0] || foods[0];
            break;
          case 'vip_combo':
            mainDish = foods.find(f => f.is_featured === 1 && f.is_available) || foods[0];
            break;
          case 'late_night':
          default:
            mainDish = foods.find(f => f.name.toLowerCase().includes('xá xíu') && f.is_available) || foods[0];
        }
      }

      // Find beverage or side dish if budget permits
      const remainingBudget = budget - (mainDish?.price || 0);
      const drinksAndSides = foods.filter(f => f.id !== mainDish?.id && f.is_available && f.price <= remainingBudget);

      if (drinksAndSides.length > 0 && (mood === 'vip_combo' || remainingBudget >= 15000)) {
        sideDish = drinksAndSides[Math.floor(Math.random() * drinksAndSides.length)];
      }

      const items = [mainDish, sideDish].filter(Boolean);
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

      let aiReasoning = '';
      if (mood === 'spicy') {
        aiReasoning = 'AI đã chọn cho bạn đĩa mì đậm sốt sa tế cay nồng đánh thức vị giác cùng hương thơm xém cạnh bùng nổ năng lượng!';
      } else if (mood === 'protein') {
        aiReasoning = 'Set ăn giàu đạm với thịt bò/xá xíu tuyển chọn kết hợp trứng lòng đào béo ngậy, nạp đầy đủ dinh dưỡng cho ngày dài!';
      } else if (mood === 'budget') {
        aiReasoning = 'Set ăn tối ưu chi phí cực tốt mà vẫn đảm bảo độ ngon đậm đà, no căng bụng giao hỏa tốc tận cửa!';
      } else if (mood === 'vip_combo') {
        aiReasoning = 'Combo Thượng Hạng đầy đủ món chính chuẩn vị cùng đồ uống giải khát mát lạnh, trải nghiệm ẩm thực trọn vẹn nhất!';
      } else {
        aiReasoning = 'Khẩu phần ăn đêm nhẹ nhàng, không gây nặng bụng, đóng hộp giữ nhiệt vàng bọc bạc đảm bảo nóng giòn!';
      }

      setRecommendedSet({
        title: mood === 'vip_combo' ? '👑 Set Bếp Việt Hoàng Gia' : '✨ Set Gợi Ý Hoàn Hảo Dành Riêng Cho Bạn',
        items,
        totalPrice,
        reasoning: aiReasoning
      });

      setAnalyzing(false);
    }, 350);
  };

  const handleAddSetToCart = () => {
    if (!recommendedSet || recommendedSet.items.length === 0) return;

    recommendedSet.items.forEach(item => {
      addToCart(item, 1);
    });

    confetti({
      particleCount: 70,
      spread: 60,
      origin: { y: 0.6 }
    });

    showToast(`Đã thêm ${recommendedSet.items.length} món trong Set AI vào giỏ hàng!`, 'success', 3500);
    onClose();
    setIsCartOpen(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-fade-in">
      <div className="bg-gradient-to-b from-[#141824] via-[#0F121C] to-[#0A0C13] border-2 border-amber-500/40 rounded-3xl max-w-lg w-full p-6 text-white shadow-2xl relative overflow-hidden flex flex-col max-h-[92vh]">
        {/* Ambient glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-24 -left-24 w-56 h-56 bg-orange-500/15 rounded-full blur-3xl pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-amber-400 via-orange-500 to-amber-600 text-slate-950 flex items-center justify-center font-black shadow-lg shadow-amber-500/25">
            <Bot className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-400">
              <Sparkles className="w-3.5 h-3.5" />
              <span>AI Sommelier Bếp Việt</span>
            </div>
            <h3 className="text-xl font-black text-white leading-tight">Hôm Nay Bạn Muốn Ăn Gì?</h3>
          </div>
        </div>

        {/* Scrollable Body */}
        <div className="overflow-y-auto space-y-4 pr-1 no-scrollbar flex-1">
          {/* Mood Selector Chips */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-300">1. Chọn tâm trạng / nhu cầu hôm nay:</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {MOOD_OPTIONS.map(mood => (
                <button
                  key={mood.id}
                  onClick={() => setSelectedMood(mood.id)}
                  className={`p-3 rounded-2xl text-left border transition text-xs font-bold ${
                    selectedMood === mood.id
                      ? 'bg-amber-500/20 border-amber-400 text-amber-300 shadow-md shadow-amber-500/10'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                  }`}
                >
                  <div className="font-extrabold">{mood.label}</div>
                  <div className="text-[10px] text-slate-400 font-normal mt-0.5">{mood.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Budget Filter */}
          <div className="space-y-1.5 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">2. Ngân sách dự kiến:</span>
              <span className="text-amber-400 font-black">{formatVND(maxBudget)}</span>
            </div>
            <input
              type="range"
              min="35000"
              max="150000"
              step="5000"
              value={maxBudget}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxBudget(val);
                generateRecommendation(selectedMood, val, customPrompt);
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
          </div>

          {/* AI Result Box */}
          {analyzing ? (
            <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-center gap-3 text-amber-300 text-xs font-bold animate-pulse">
              <RefreshCw className="w-4 h-4 animate-spin" />
              <span>AI đang phân tích thực đơn và phối set hoàn hảo...</span>
            </div>
          ) : recommendedSet ? (
            <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-500/10 via-slate-900 to-slate-900 border border-amber-500/30 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-black text-amber-300 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  {recommendedSet.title}
                </span>
                <span className="text-sm font-black text-white bg-slate-900 px-3 py-1 rounded-xl border border-amber-500/30">
                  {formatVND(recommendedSet.totalPrice)}
                </span>
              </div>

              <p className="text-[11px] text-slate-300 italic leading-relaxed">
                "{recommendedSet.reasoning}"
              </p>

              {/* Items List in Set */}
              <div className="space-y-2 pt-1">
                {recommendedSet.items.map((item, idx) => (
                  <div key={item.id || idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-800/80 border border-slate-700/60 text-xs">
                    <div className="flex items-center gap-2.5">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover"
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=150&q=80';
                        }}
                      />
                      <div>
                        <div className="font-extrabold text-white">{item.name}</div>
                        <div className="text-[10px] text-slate-400">{item.category_name || 'Bếp Việt'}</div>
                      </div>
                    </div>
                    <div className="font-black text-amber-400">{formatVND(item.price)}</div>
                  </div>
                ))}
              </div>
            </div>
          ) : null}
        </div>

        {/* Footer CTA */}
        <div className="pt-4 mt-2 border-t border-slate-800 flex items-center justify-between gap-3 shrink-0">
          <button
            type="button"
            onClick={() => generateRecommendation(selectedMood, maxBudget, customPrompt)}
            className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold transition flex items-center gap-1.5"
            title="Đổi món khác"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Đổi Set Khác</span>
          </button>

          <button
            type="button"
            onClick={handleAddSetToCart}
            disabled={!recommendedSet || recommendedSet.items.length === 0}
            className="flex-1 py-3.5 px-5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-orange-500/25 active:scale-95 transition flex items-center justify-center gap-2"
          >
            <ShoppingBag className="w-4 h-4 text-slate-950" />
            <span>Thêm Toàn Bộ Set Vào Giỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
