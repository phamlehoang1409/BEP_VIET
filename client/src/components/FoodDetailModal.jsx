import React, { useState } from 'react';
import { X, Star, Clock, Flame, Plus, Minus, ShoppingBag, Heart, Sparkles, CheckCircle2, MessageSquare, Utensils } from 'lucide-react';
import { formatVND } from '../utils/vietnamData';
import { useCart } from '../context/CartContext';
import { useFavorites } from '../context/FavoritesContext';
import { useToast } from './Toast';

export default function FoodDetailModal({ food, onClose }) {
  const { addToCart, storeSettings, showStoreClosedModal } = useCart();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { showToast } = useToast();
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [activeTab, setActiveTab] = useState('details'); // 'details' | 'reviews'

  if (!food) return null;

  const isFav = isFavorite(food.id);

  const handleToggleFavorite = (e) => {
    e.stopPropagation();
    const added = toggleFavorite(food);
    if (added) {
      showToast(`Đã thêm "${food.name}" vào danh sách yêu thích! ❤️`, 'success');
    } else {
      showToast(`Đã bỏ "${food.name}" khỏi danh sách yêu thích.`, 'info');
    }
  };

  const handleAddToCart = () => {
    if (storeSettings && storeSettings.is_currently_open === false) {
      showStoreClosedModal();
      return;
    }
    if (!food.is_available) {
      showToast('Món ăn hiện tạm hết!', 'error');
      return;
    }
    addToCart(food, quantity, note);
    showToast(`Đã thêm ${quantity} phần "${food.name}" vào giỏ hàng!`, 'success');
    onClose();
  };

  const hasDiscount = food.original_price && food.original_price > food.price;
  const totalPrice = food.price * quantity;

  // Estimated nutrition
  const estCalories = Math.round(food.price * 0.007 + 320);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-lg bg-white dark:bg-[#141824] text-slate-900 dark:text-white rounded-3xl overflow-hidden shadow-2xl border border-slate-200 dark:border-slate-800 animate-scale-up max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button & Favorite Button */}
        <div className="absolute top-4 right-4 z-20 flex items-center gap-2">
          <button
            onClick={handleToggleFavorite}
            className={`w-9 h-9 rounded-full flex items-center justify-center backdrop-blur-md transition ${
              isFav ? 'bg-rose-500 text-white' : 'bg-black/50 text-white hover:bg-black/70'
            }`}
            title={isFav ? 'Bỏ thích' : 'Yêu thích món này'}
          >
            <Heart className={`w-4 h-4 ${isFav ? 'fill-white stroke-white' : ''}`} />
          </button>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-black/50 hover:bg-black/75 text-white flex items-center justify-center backdrop-blur-sm transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Dish Image */}
        <div className="relative aspect-[16/9] w-full shrink-0 bg-slate-100 dark:bg-slate-800">
          <img
            src={food.image}
            alt={food.name}
            referrerPolicy="no-referrer"
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
            }}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 text-white">
            <span className="text-[11px] font-bold bg-amber-500 text-slate-950 px-2.5 py-0.5 rounded-lg">
              {food.category_name || 'Món đặc biệt'}
            </span>
            <h2 className="text-xl sm:text-2xl font-black mt-1 leading-tight drop-shadow-sm text-white">
              {food.name}
            </h2>
          </div>
        </div>

        {/* Tabs: Details vs Reviews */}
        <div className="flex border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-[#0E111A] px-6">
          <button
            type="button"
            onClick={() => setActiveTab('details')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition ${
              activeTab === 'details'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            Chi Tiết & Tùy Chọn
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('reviews')}
            className={`py-3 px-4 text-xs font-black border-b-2 transition flex items-center gap-1.5 ${
              activeTab === 'reviews'
                ? 'border-amber-500 text-amber-600 dark:text-amber-400'
                : 'border-transparent text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <span>Đánh Giá Khách Hàng</span>
            <span className="bg-amber-500/20 text-amber-600 dark:text-amber-400 px-1.5 py-0.2 rounded-full text-[10px]">
              ⭐ {food.rating ? food.rating.toFixed(1) : '5.0'}
            </span>
          </button>
        </div>

        {/* Scrollable details */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 flex-1">
          {activeTab === 'details' ? (
            <>
              {/* Metadata badges */}
              <div className="grid grid-cols-3 gap-2 text-center text-xs font-bold">
                <div className="p-2.5 rounded-2xl bg-amber-50 dark:bg-amber-500/10 text-amber-800 dark:text-amber-300 border border-amber-200/60 dark:border-amber-500/20">
                  <Star className="w-4 h-4 text-amber-500 fill-amber-500 mx-auto mb-1" />
                  <span>{food.rating ? food.rating.toFixed(1) : '5.0'} / 5.0</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
                  <Clock className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                  <span>~{food.prep_time || 15} phút</span>
                </div>

                <div className="p-2.5 rounded-2xl bg-orange-50 dark:bg-orange-500/10 text-orange-800 dark:text-orange-300 border border-orange-200/60 dark:border-orange-500/20">
                  <Flame className="w-4 h-4 text-orange-500 mx-auto mb-1" />
                  <span>~{estCalories} kcal</span>
                </div>
              </div>

              {/* Description */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Mô tả món ăn
                </h4>
                <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                  {food.description || 'Món ăn đậm đà hương vị truyền thống Việt Nam, chế biến từ nguyên liệu tươi mới trong ngày.'}
                </p>
              </div>

              {/* Special request note */}
              <div>
                <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1.5">
                  Ghi chú cho đầu bếp (tuỳ chọn)
                </h4>
                <input
                  type="text"
                  placeholder="VD: Không lấy hành tây, ít cay, để đá riêng..."
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 focus:bg-white dark:focus:bg-slate-800 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/20 outline-none text-sm transition"
                />
              </div>

              {/* Quantity selector */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800">
                <div>
                  <span className="text-xs text-slate-400 font-bold block">Số lượng</span>
                  <div className="text-lg font-black text-slate-900 dark:text-white">
                    {quantity} phần
                  </div>
                </div>

                <div className="flex items-center gap-3 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-8 h-8 rounded-xl bg-white dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-white flex items-center justify-center font-bold transition shadow-sm"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-6 text-center font-black text-slate-800 dark:text-white text-sm">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-8 h-8 rounded-xl bg-amber-500 hover:bg-amber-600 text-slate-950 flex items-center justify-center font-bold transition shadow-sm"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="space-y-4">
              {/* Overall Score Box */}
              <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-500/10 border border-amber-200/60 dark:border-amber-500/20 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-3xl font-black text-amber-600 dark:text-amber-400">
                    {food.rating ? food.rating.toFixed(1) : '5.0'}
                  </div>
                  <div>
                    <div className="flex items-center gap-0.5 text-amber-500">
                      {[1, 2, 3, 4, 5].map((s) => (
                        <Star key={s} className="w-4 h-4 fill-amber-500 text-amber-500" />
                      ))}
                    </div>
                    <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                      Đánh giá từ khách hàng đã đặt món
                    </div>
                  </div>
                </div>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  98% Khuyên Dùng
                </span>
              </div>

              {/* Sample Reviews */}
              <div className="space-y-3">
                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-900 dark:text-white">Hoàng Nam (0987***321)</span>
                    <div className="flex text-amber-400">⭐⭐⭐⭐⭐</div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Món ăn nóng hổi, sợi mì dai ngon, sốt ngập tràn chuẩn vị. Giao tới vẫn còn bốc khói nghi ngút!
                  </p>
                  <span className="text-[10px] text-slate-400 block">Vừa đặt hôm qua • ⚡ Giao siêu nhanh</span>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-black text-slate-900 dark:text-white">Thu Trang (0912***678)</span>
                    <div className="flex text-amber-400">⭐⭐⭐⭐⭐</div>
                  </div>
                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    Trứng lòng đào béo ngậy, thịt bò xào mềm thơm vừa miệng. Đóng gói hộp giấy rất sạch sẽ!
                  </p>
                  <span className="text-[10px] text-slate-400 block">3 ngày trước • 😋 Vị ngon đậm đà</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Bottom CTA */}
        <div className="p-4 sm:p-5 bg-slate-50 dark:bg-[#0E111A] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-4 shrink-0">
          <div>
            <div className="text-xs text-slate-400">Tổng thanh toán</div>
            <div className="text-xl font-black bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
              {formatVND(totalPrice)}
            </div>
          </div>

          <button
            onClick={handleAddToCart}
            disabled={!food.is_available}
            className={`flex-1 max-w-[240px] py-3.5 px-6 rounded-2xl font-black text-sm flex items-center justify-center gap-2 shadow-lg transition active:scale-95 ${
              food.is_available
                ? 'bg-gradient-to-r from-amber-500 via-orange-500 to-amber-600 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-amber-500/25'
                : 'bg-slate-200 dark:bg-slate-800 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Thêm Vào Giỏ</span>
          </button>
        </div>
      </div>
    </div>
  );
}
