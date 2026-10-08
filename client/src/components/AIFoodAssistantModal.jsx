import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  X,
  Bot,
  Plus,
  ArrowRight,
  Check,
  Flame,
  Clock,
  Heart,
  RefreshCw,
  ShoppingBag,
  Coins,
  DollarSign,
  Users,
  Send,
  Zap,
  Info
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';
import { formatVND } from '../utils/vietnamData';
import confetti from 'canvas-confetti';

const MOOD_OPTIONS = [
  {
    id: 'spicy',
    icon: '🌶️',
    label: 'Thèm Cay Sa Tế Bùng Nổ',
    desc: 'Mì cay sa tế đặc biệt, sốt cay ngọt đậm đà đánh thức vị giác',
    targetCategory: 'mì cay, sa tế, đậm vị'
  },
  {
    id: 'protein',
    icon: '🥩',
    label: 'Ngập Tràn Bò & Đùi Gà',
    desc: 'Bò Mỹ mềm thơm, xá xíu mật ong, trứng lòng đào béo ngậy',
    targetCategory: 'thịt, bò, xá xíu'
  },
  {
    id: 'budget',
    icon: '💰',
    label: 'Tiết Kiệm Học Sinh Sinh Viên',
    desc: 'Ngon - Bổ - Rẻ no nê dưới 50k chuẩn vị truyền thống',
    targetCategory: 'tiết kiệm, giá rẻ'
  },
  {
    id: 'snack_party',
    icon: '🍟',
    label: 'Đại Tiệc Ăn Vặt & Trà Sữa',
    desc: 'Nem chua rán, khoai tây lắc phô mai, gà rán giòn rụm & trà tắc',
    targetCategory: 'ăn vặt, trà tắc, giải khát'
  },
  {
    id: 'late_night',
    icon: '🌙',
    label: 'Ăn Đêm Ấm Bụng Nhẹ Nhàng',
    desc: 'Khẩu phần vừa vặn, không đầy bụng, chế biến nóng hổi cấp tốc',
    targetCategory: 'ăn đêm, ấm nóng'
  },
  {
    id: 'vip_combo',
    icon: '👑',
    label: 'Set VIP Trọn Gói Sang Xịn',
    desc: 'Mì Indomie đặc biệt + Nước giải khát + Đồ ăn vặt full topping',
    targetCategory: 'combo vip, full món'
  }
];

const QUICK_PROMPTS = [
  'Gợi ý set 2 người dưới 100k 🍱',
  'Món nào cay & đậm đà nhất? 🌶️',
  'Combo ăn vặt trà sữa chiều nay 🧋',
  'Bữa trưa no nê nhiều năng lượng 🥩'
];

export default function AIFoodAssistantModal({ isOpen, onClose, foods = [] }) {
  const { addToCart, setIsCartOpen } = useCart();
  const { showToast } = useToast();

  const [selectedMood, setSelectedMood] = useState('protein');
  const [customPrompt, setCustomPrompt] = useState('');
  const [partySize, setPartySize] = useState(1); // 1, 2, 4 people
  const [maxBudget, setMaxBudget] = useState(80000);
  const [analyzing, setAnalyzing] = useState(false);
  const [recommendedSet, setRecommendedSet] = useState(null);

  useEffect(() => {
    if (isOpen && foods.length > 0) {
      generateRecommendation(selectedMood, maxBudget, customPrompt, partySize);
    }
  }, [isOpen, selectedMood, partySize]);

  if (!isOpen) return null;

  const generateRecommendation = (mood, budget, prompt = '', people = 1) => {
    setAnalyzing(true);
    setTimeout(() => {
      const availFoods = foods.filter((f) => f.is_available !== 0 && f.is_available !== false);
      if (availFoods.length === 0) {
        setAnalyzing(false);
        return;
      }

      // Classification helpers
      const isDrink = (f) => {
        const n = f.name.toLowerCase();
        return (
          f.category_id === 4 ||
          n.includes('trà') ||
          n.includes('nước') ||
          n.includes('cà phê') ||
          n.includes('soda') ||
          n.includes('chè') ||
          n.includes('pepsi') ||
          n.includes('coca')
        );
      };

      const isSnack = (f) => {
        const n = f.name.toLowerCase();
        return (
          f.category_id === 5 ||
          f.category_id === 6 ||
          n.includes('nem') ||
          n.includes('gỏi') ||
          n.includes('khoai') ||
          n.includes('bánh tráng') ||
          n.includes('trứng') ||
          n.includes('xúc xích') ||
          n.includes('kim chi') ||
          n.includes('topping')
        );
      };

      const isMain = (f) => !isDrink(f) && (!isSnack(f) || f.price >= 35000);

      const mains = availFoods.filter(isMain);
      const drinks = availFoods.filter(isDrink);
      const snacks = availFoods.filter((f) => isSnack(f) || (!isMain(f) && !isDrink(f)));

      const poolMains = mains.length > 0 ? mains : availFoods;
      const poolDrinks = drinks.length > 0 ? drinks : availFoods;
      const poolSnacks = snacks.length > 0 ? snacks : availFoods;

      let candidateMains = [...poolMains];
      const lowerPrompt = prompt.toLowerCase();

      if (lowerPrompt.includes('bò') || lowerPrompt.includes('bo')) {
        const matched = poolMains.filter((f) => f.name.toLowerCase().includes('bò'));
        if (matched.length > 0) candidateMains = matched;
      } else if (lowerPrompt.includes('gà') || lowerPrompt.includes('ga')) {
        const matched = poolMains.filter((f) => f.name.toLowerCase().includes('gà'));
        if (matched.length > 0) candidateMains = matched;
      } else if (lowerPrompt.includes('xá xíu') || lowerPrompt.includes('xa xiu')) {
        const matched = poolMains.filter((f) => f.name.toLowerCase().includes('xá xíu'));
        if (matched.length > 0) candidateMains = matched;
      } else if (lowerPrompt.includes('cay') || lowerPrompt.includes('sa tế')) {
        const matched = poolMains.filter((f) => f.spicy_level > 0);
        if (matched.length > 0) candidateMains = matched;
      } else {
        switch (mood) {
          case 'spicy': {
            const matched = poolMains.filter((f) => f.spicy_level > 0 || f.name.toLowerCase().includes('cay'));
            if (matched.length > 0) candidateMains = matched;
            break;
          }
          case 'protein': {
            const matched = poolMains.filter(
              (f) =>
                f.name.toLowerCase().includes('bò') ||
                f.name.toLowerCase().includes('gà') ||
                f.name.toLowerCase().includes('xá xíu') ||
                f.name.toLowerCase().includes('thịt')
            );
            if (matched.length > 0) candidateMains = matched;
            break;
          }
          case 'budget': {
            const matched = poolMains.filter((f) => f.price <= 45000);
            if (matched.length > 0) candidateMains = matched;
            break;
          }
          case 'snack_party': {
            candidateMains = poolSnacks.length > 0 ? poolSnacks : poolMains;
            break;
          }
          case 'vip_combo': {
            const matched = poolMains.filter((f) => f.is_featured === 1 || f.price >= 45000);
            if (matched.length > 0) candidateMains = matched;
            break;
          }
          default:
            break;
        }
      }

      // Pick main dish
      const selectedMain = candidateMains[Math.floor(Math.random() * candidateMains.length)] || poolMains[0];

      // Pick snack & drink
      const selectedSnack = poolSnacks[Math.floor(Math.random() * poolSnacks.length)] || poolSnacks[0];
      const selectedDrink = poolDrinks[Math.floor(Math.random() * poolDrinks.length)] || poolDrinks[0];

      const comboItems = [];
      if (selectedMain) comboItems.push({ ...selectedMain, quantity: people, role: 'Món Chính' });

      if (mood === 'vip_combo' || mood === 'snack_party' || people > 1) {
        if (selectedSnack && selectedSnack.id !== selectedMain.id) {
          comboItems.push({ ...selectedSnack, quantity: Math.ceil(people / 2), role: 'Món Ăn Kèm' });
        }
      }

      if (selectedDrink && selectedDrink.id !== selectedMain.id) {
        comboItems.push({ ...selectedDrink, quantity: people, role: 'Đồ Uống' });
      }

      const totalOrigPrice = comboItems.reduce((s, i) => s + (i.price * i.quantity), 0);
      const totalCalories = Math.round(totalOrigPrice * 0.0075 + 450 * people);

      // AI Reasoning description
      let aiRationale = '';
      if (mood === 'spicy') {
        aiRationale = `Bếp Việt AI đã chọn "${selectedMain.name}" với độ cay sa tế chuẩn mực kết hợp cùng "${selectedDrink?.name || 'Trà Tắc'}" giúp giải nhiệt thanh mát tức thì!`;
      } else if (mood === 'protein') {
        aiRationale = `Combo giàu đạm nạp năng lượng đỉnh cao với "${selectedMain.name}" ngập thịt, bổ sung thêm món kèm thơm giòn kích thích vị giác!`;
      } else if (mood === 'budget') {
        aiRationale = `Set ăn chuẩn ngon-bổ-rẻ chỉ ${formatVND(totalOrigPrice)}, no nê cả buổi mà cực kỳ tiết kiệm ví tiền!`;
      } else if (mood === 'snack_party') {
        aiRationale = `Bữa tiệc ăn vặt giòn rụm với "${selectedSnack?.name}" và đồ uống mát lạnh, lý tưởng cho bạn bè nhâm nhi!`;
      } else {
        aiRationale = `Set VIP hoàng gia kết hợp tinh hoa ẩm thực Bếp Việt, đầy đủ hương - sắc - vị cho bạn một bữa ăn trọn vẹn nhất!`;
      }

      setRecommendedSet({
        title: `Combo AI: ${selectedMain.name} ${people > 1 ? `(Set ${people} người)` : ''}`,
        rationale: aiRationale,
        items: comboItems,
        totalPrice: totalOrigPrice,
        calories: totalCalories,
        prepTime: Math.max(...comboItems.map((i) => i.prep_time || 15)) + 5
      });

      setAnalyzing(false);
    }, 400);
  };

  const handleApplyComboToCart = () => {
    if (!recommendedSet || !recommendedSet.items) return;

    for (const item of recommendedSet.items) {
      addToCart(item, item.quantity);
    }

    confetti({
      particleCount: 70,
      spread: 80,
      origin: { y: 0.6 }
    });

    showToast(`🎉 Đã thêm trọn bộ combo AI vào giỏ hàng!`, 'success');
    onClose();
    setIsCartOpen(true);
  };

  const handleCustomPromptSubmit = (e) => {
    e.preventDefault();
    if (!customPrompt.trim()) return;
    generateRecommendation(selectedMood, maxBudget, customPrompt, partySize);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-[#0F121C] text-white rounded-3xl overflow-hidden shadow-2xl border border-purple-500/30 flex flex-col max-h-[92vh] animate-scale-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="relative p-5 sm:p-6 bg-gradient-to-r from-purple-900/60 via-indigo-950/80 to-[#0F121C] border-b border-purple-500/20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-purple-500 via-indigo-500 to-amber-400 flex items-center justify-center text-white shadow-lg shadow-purple-500/30 animate-pulse">
              <Bot className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg sm:text-xl font-black text-white">
                  Bếp Việt AI Food Sommelier
                </h3>
                <span className="text-[10px] font-black bg-gradient-to-r from-purple-500 to-amber-400 text-slate-950 px-2 py-0.5 rounded-full uppercase tracking-wider">
                  AI Chef 2.0
                </span>
              </div>
              <p className="text-xs text-purple-200/80 mt-0.5">
                Trợ lý ẩm thực thông minh tư vấn món ngon theo tâm trạng, khẩu phần & calo
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white flex items-center justify-center transition border border-slate-700"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1">
          {/* Mood Selector Grid */}
          <div className="space-y-2.5">
            <label className="text-xs font-black text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
              <Sparkles className="w-4 h-4" /> 1. Hôm nay bạn muốn ăn theo cảm xúc gì?
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {MOOD_OPTIONS.map((mood) => {
                const isSelected = selectedMood === mood.id;
                return (
                  <button
                    key={mood.id}
                    type="button"
                    onClick={() => setSelectedMood(mood.id)}
                    className={`p-3 rounded-2xl text-left transition border ${
                      isSelected
                        ? 'bg-gradient-to-br from-purple-600/30 via-indigo-600/20 to-amber-500/20 border-amber-400 shadow-md shadow-amber-500/10'
                        : 'bg-slate-800/40 border-slate-700/60 hover:border-slate-600'
                    }`}
                  >
                    <div className="text-xl mb-1">{mood.icon}</div>
                    <div className={`text-xs font-black ${isSelected ? 'text-amber-300' : 'text-white'}`}>
                      {mood.label}
                    </div>
                    <div className="text-[10px] text-slate-400 line-clamp-1 mt-0.5">
                      {mood.desc}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Party Size & Quick Question */}
          <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-center">
            {/* Party Size Selector */}
            <div className="sm:col-span-4 p-3 rounded-2xl bg-slate-800/40 border border-slate-700/60 space-y-1.5">
              <span className="text-[11px] font-bold text-slate-300 flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-amber-400" /> Khẩu phần ăn:
              </span>
              <div className="flex items-center gap-1 bg-slate-900/80 p-1 rounded-xl">
                {[
                  { count: 1, label: '1 Người' },
                  { count: 2, label: '2 Người' },
                  { count: 4, label: 'Nhóm 4' }
                ].map((p) => (
                  <button
                    key={p.count}
                    type="button"
                    onClick={() => setPartySize(p.count)}
                    className={`flex-1 py-1 text-[11px] font-black rounded-lg transition ${
                      partySize === p.count
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Natural Query Prompt */}
            <form
              onSubmit={handleCustomPromptSubmit}
              className="sm:col-span-8 flex items-center gap-2"
            >
              <div className="relative flex-1">
                <input
                  type="text"
                  placeholder="Hoặc yêu cầu riêng: 'Ít dầu mỡ, nhiều bò, kèm trà đào'..."
                  value={customPrompt}
                  onChange={(e) => setCustomPrompt(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl bg-slate-800/70 border border-slate-700 text-xs text-white placeholder-slate-400 focus:border-amber-400 focus:ring-2 focus:ring-amber-400/20 outline-none transition"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs transition shrink-0 flex items-center gap-1"
              >
                <span>Gợi Ý</span>
                <Send className="w-3.5 h-3.5" />
              </button>
            </form>
          </div>

          {/* Quick Prompt Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
            <span className="text-[10px] text-slate-400 uppercase font-bold shrink-0">Thử nhanh:</span>
            {QUICK_PROMPTS.map((qp, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setCustomPrompt(qp);
                  generateRecommendation(selectedMood, maxBudget, qp, partySize);
                }}
                className="px-2.5 py-1 rounded-full bg-slate-800/80 hover:bg-slate-700 text-slate-300 text-[11px] font-semibold border border-slate-700 whitespace-nowrap transition"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* AI Recommended Output Card */}
          <div className="p-5 rounded-3xl bg-gradient-to-br from-[#181C2B] to-[#121522] border border-amber-500/30 shadow-xl space-y-4 relative overflow-hidden">
            {analyzing ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-12 h-12 border-4 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-amber-300 animate-pulse">
                  AI Sommelier đang phân tích hương vị & tính toán combo hoàn hảo...
                </p>
              </div>
            ) : recommendedSet ? (
              <>
                {/* Header & Metrics */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-700/60 pb-3">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-400 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" /> Gợi Ý Thực Đơn Hoàn Hảo
                    </span>
                    <h4 className="text-base sm:text-lg font-black text-amber-300 mt-0.5">
                      {recommendedSet.title}
                    </h4>
                  </div>

                  <div className="flex items-center gap-2 text-xs">
                    <span className="flex items-center gap-1 bg-amber-500/15 text-amber-300 px-2.5 py-1 rounded-xl border border-amber-500/30 font-bold">
                      <Clock className="w-3.5 h-3.5" /> ~{recommendedSet.prepTime}p
                    </span>
                    <span className="flex items-center gap-1 bg-rose-500/15 text-rose-300 px-2.5 py-1 rounded-xl border border-rose-500/30 font-bold">
                      <Flame className="w-3.5 h-3.5" /> ~{recommendedSet.calories} kcal
                    </span>
                  </div>
                </div>

                {/* AI Rationale */}
                <p className="text-xs text-slate-300 leading-relaxed bg-purple-950/30 p-3 rounded-2xl border border-purple-800/40">
                  🤖 <span className="font-semibold text-purple-200">{recommendedSet.rationale}</span>
                </p>

                {/* Dish Items in Combo */}
                <div className="space-y-2">
                  {recommendedSet.items.map((item, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-2xl bg-slate-800/60 border border-slate-700 flex items-center justify-between gap-3"
                    >
                      <div className="flex items-center gap-3">
                        <img
                          src={item.image}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          onError={(e) => {
                            e.currentTarget.onerror = null;
                            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80';
                          }}
                          className="w-12 h-12 rounded-xl object-cover border border-slate-700"
                        />
                        <div>
                          <span className="text-[10px] font-bold text-amber-400 uppercase">
                            {item.role} • {item.quantity} phần
                          </span>
                          <h5 className="text-xs font-black text-white">{item.name}</h5>
                          <span className="text-xs font-bold text-amber-300">
                            {formatVND(item.price * item.quantity)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Total Price & 1-Click CTA */}
                <div className="pt-2 flex items-center justify-between gap-4">
                  <div>
                    <span className="text-xs text-slate-400">Tổng tiền combo</span>
                    <div className="text-xl font-black text-amber-400">
                      {formatVND(recommendedSet.totalPrice)}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => generateRecommendation(selectedMood, maxBudget, customPrompt, partySize)}
                      className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition"
                      title="Gợi ý combo khác"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </button>

                    <button
                      type="button"
                      onClick={handleApplyComboToCart}
                      className="px-6 py-3.5 rounded-2xl bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 font-black text-xs sm:text-sm shadow-xl shadow-amber-500/25 active:scale-95 transition flex items-center gap-2"
                    >
                      <ShoppingBag className="w-4 h-4" />
                      <span>Thêm Toàn Bộ Vào Giỏ 🛒</span>
                    </button>
                  </div>
                </div>
              </>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
