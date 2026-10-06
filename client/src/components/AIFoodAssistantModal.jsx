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
      const availFoods = foods.filter(f => f.is_available !== 0 && f.is_available !== false);
      if (availFoods.length === 0) {
        setAnalyzing(false);
        return;
      }

      // Helper classification
      const isDrink = (f) => {
        const n = f.name.toLowerCase();
        return f.category_id === 4 || n.includes('trà') || n.includes('nước') || n.includes('cà phê') || n.includes('soda') || n.includes('chè') || n.includes('pepsi') || n.includes('coca');
      };

      const isSnack = (f) => {
        const n = f.name.toLowerCase();
        return f.category_id === 5 || f.category_id === 6 || n.includes('nem') || n.includes('gỏi') || n.includes('khoai') || n.includes('bánh tráng') || n.includes('trứng') || n.includes('xúc xích') || n.includes('kim chi') || n.includes('topping');
      };

      const isMain = (f) => !isDrink(f) && (!isSnack(f) || f.price >= 40000 || f.category_id === 1 || f.category_id === 2 || f.category_id === 3);

      const mains = availFoods.filter(isMain);
      const drinks = availFoods.filter(isDrink);
      const snacks = availFoods.filter(f => isSnack(f) || (!isMain(f) && !isDrink(f)));

      const poolMains = mains.length > 0 ? mains : availFoods;
      const poolDrinks = drinks.length > 0 ? drinks : availFoods;
      const poolSnacks = snacks.length > 0 ? snacks : availFoods;

      // Filter candidates for primary main dish based on mood
      let candidateMains = [...poolMains];
      const lowerPrompt = prompt.toLowerCase();

      if (lowerPrompt.includes('bò') || lowerPrompt.includes('bo')) {
        const matched = poolMains.filter(f => f.name.toLowerCase().includes('bò'));
        if (matched.length > 0) candidateMains = matched;
      } else if (lowerPrompt.includes('xá xíu') || lowerPrompt.includes('xa xiu')) {
        const matched = poolMains.filter(f => f.name.toLowerCase().includes('xá xíu'));
        if (matched.length > 0) candidateMains = matched;
      } else if (lowerPrompt.includes('cay') || lowerPrompt.includes('sa tế')) {
        const matched = poolMains.filter(f => f.spicy_level > 0);
        if (matched.length > 0) candidateMains = matched;
      } else {
        switch (mood) {
          case 'spicy': {
            const matched = poolMains.filter(f => f.spicy_level > 0 || f.name.toLowerCase().includes('cay'));
            if (matched.length > 0) candidateMains = matched;
            break;
          }
          case 'protein': {
            const matched = poolMains.filter(f => f.name.toLowerCase().includes('bò') || f.name.toLowerCase().includes('thịt') || f.name.toLowerCase().includes('sườn') || f.name.toLowerCase().includes('chả'));
            if (matched.length > 0) candidateMains = matched;
            break;
          }
          case 'budget': {
            candidateMains.sort((a, b) => a.price - b.price);
            break;
          }
          case 'vip_combo': {
            // Sort by premium / featured first
            candidateMains.sort((a, b) => (b.is_featured || 0) - (a.is_featured || 0) || b.price - a.price);
            break;
          }
          case 'late_night':
          default: {
            const matched = poolMains.filter(f => f.name.toLowerCase().includes('bánh mì') || f.name.toLowerCase().includes('mì') || f.name.toLowerCase().includes('phở'));
            if (matched.length > 0) candidateMains = matched;
            break;
          }
        }
      }

      // Optimal Set Combiner: maximize total value <= budget
      let bestCombination = [];
      let maxScore = -1;

      // Sample a few suitable main dishes
      const topMains = candidateMains.slice(0, 8);

      topMains.forEach(main => {
        if (main.price > budget) return;

        let curItems = [main];
        let currentTotal = main.price;
        let remBudget = budget - currentTotal;

        // 1. Try to add a suitable drink if budget permits
        const affordableDrinks = poolDrinks
          .filter(d => d.id !== main.id && d.price <= remBudget)
          .sort((a, b) => b.price - a.price);

        if (affordableDrinks.length > 0 && (budget >= 60000 || mood === 'vip_combo')) {
          const chosenDrink = affordableDrinks[Math.floor(Math.random() * Math.min(2, affordableDrinks.length))];
          curItems.push(chosenDrink);
          currentTotal += chosenDrink.price;
          remBudget = budget - currentTotal;
        }

        // 2. Try to add 1 or more snacks / sides / desserts with remaining budget
        const affordableSnacks = poolSnacks
          .filter(s => !curItems.some(item => item.id === s.id) && s.price <= remBudget)
          .sort((a, b) => b.price - a.price);

        for (const snack of affordableSnacks) {
          if (snack.price <= remBudget) {
            curItems.push(snack);
            currentTotal += snack.price;
            remBudget -= snack.price;
            if (curItems.length >= 4) break; // Max 4 items in set
          }
        }

        // Score based on how close total is to budget + item count
        const fillRatio = currentTotal / budget; // closer to 1 is better
        const score = fillRatio * 100 + curItems.length * 10;

        if (score > maxScore) {
          maxScore = score;
          bestCombination = curItems;
        }
      });

      // Fallback if no full set found
      if (bestCombination.length === 0) {
        const sorted = [...availFoods].sort((a, b) => a.price - b.price);
        bestCombination = [sorted[0] || availFoods[0]];
      }

      const items = bestCombination;
      const totalPrice = items.reduce((sum, item) => sum + item.price, 0);

      let aiReasoning = '';
      if (mood === 'spicy') {
        aiReasoning = `Set Cay Nồng Bùng Nổ (${items.length} món) đánh thức vị giác với món chính đẫm sốt đậm đà, kết hợp nước mát và đồ ăn kèm xoa dịu vị cay hoàn hảo!`;
      } else if (mood === 'protein') {
        aiReasoning = `Set Nạp Đạm Năng Lượng (${items.length} món) dồi dào thịt & dinh dưỡng, phối hợp đầy đủ món chính chuẩn vị, đồ ăn kèm giòn rụm và đồ uống thanh nhiệt!`;
      } else if (mood === 'budget') {
        aiReasoning = `Set Tiết Kiệm Tối Ưu (${items.length} món) cân đối chi phí chuẩn ngon-bổ-rẻ, vừa vặn ngân sách ${formatVND(budget)} giao hỏa tốc nóng hổi!`;
      } else if (mood === 'vip_combo') {
        aiReasoning = `Combo Hoàng Gia Đại Tiệc VIP (${items.length} món) đầy đủ trọn gói Món chính thượng hạng + Đồ uống + Khai vị / Ăn vặt giòn ngon, tối đa trải nghiệm ẩm thực đỉnh cao!`;
      } else {
        aiReasoning = `Set Ăn Đêm Ấm Bụng (${items.length} món) dịu nhẹ, cân đối năng lượng và đóng hộp giữ nhiệt vàng bọc bạc đảm bảo nóng giòn thơm nức!`;
      }

      setRecommendedSet({
        title: mood === 'vip_combo' || totalPrice >= 100000 ? '👑 Set Đại Tiệc Bếp Việt VIP' : '✨ Set Gợi Ý Hoàn Hảo Cho Bạn',
        items,
        totalPrice,
        reasoning: aiReasoning
      });

      setAnalyzing(false);
    }, 300);
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
          <div className="space-y-2.5 bg-slate-900/70 p-3.5 rounded-2xl border border-slate-800">
            <div className="flex items-center justify-between text-xs font-bold">
              <span className="text-slate-300">2. Ngân sách dự kiến:</span>
              <span className="text-amber-400 font-black text-sm">{formatVND(maxBudget)}</span>
            </div>
            <input
              type="range"
              min="35000"
              max="200000"
              step="5000"
              value={maxBudget}
              onChange={(e) => {
                const val = Number(e.target.value);
                setMaxBudget(val);
                generateRecommendation(selectedMood, val, customPrompt);
              }}
              className="w-full accent-amber-500 cursor-pointer"
            />
            {/* Quick preset chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
              {[50000, 80000, 100000, 150000, 200000].map(val => (
                <button
                  key={val}
                  type="button"
                  onClick={() => {
                    setMaxBudget(val);
                    generateRecommendation(selectedMood, val, customPrompt);
                  }}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono font-bold transition whitespace-nowrap ${
                    maxBudget === val
                      ? 'bg-amber-500 text-slate-950 shadow-sm shadow-amber-500/20'
                      : 'bg-slate-800 hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {val === 200000 ? '200k (Max)' : `${val / 1000}k`}
                </button>
              ))}
            </div>
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
