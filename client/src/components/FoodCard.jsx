import React from 'react';
import { Plus, Star, Clock, Flame, Sparkles } from 'lucide-react';
import { formatVND } from '../utils/vietnamData';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';

export default function FoodCard({ food, onOpenDetail }) {
  const { addToCart, storeSettings, showStoreClosedModal } = useCart();
  const { showToast } = useToast();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (storeSettings && storeSettings.is_currently_open === false) {
      showStoreClosedModal();
      return;
    }
    if (!food.is_available) {
      showToast('Món ăn này hiện đang tạm hết, bạn thông cảm nhé!', 'error');
      return;
    }
    addToCart(food, 1);
    showToast(`Đã thêm "${food.name}" vào giỏ hàng!`, 'success');
  };

  const hasDiscount = food.original_price && food.original_price > food.price;
  const discountPercent = hasDiscount
    ? Math.round(((food.original_price - food.price) / food.original_price) * 100)
    : 0;

  return (
    <div
      onClick={() => onOpenDetail && onOpenDetail(food)}
      className="group relative bg-white rounded-3xl overflow-hidden border border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] hover:shadow-xl hover:shadow-amber-500/10 hover:border-amber-400/60 transition-all duration-300 flex flex-col cursor-pointer transform hover:-translate-y-1"
    >
      {/* Food Image Container */}
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-100">
        <img
          src={food.image}
          alt={food.name}
          referrerPolicy="no-referrer"
          onError={(e) => {
            e.currentTarget.onerror = null;
            e.currentTarget.src = 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=800&q=80';
          }}
          className="w-full h-full object-cover group-hover:scale-108 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent opacity-40 group-hover:opacity-60 transition-opacity duration-300" />

        {/* Top Badges */}
        <div className="absolute top-3 left-3 right-3 flex items-center justify-between gap-1 pointer-events-none">
          <div className="flex items-center gap-1.5 flex-wrap">
            {hasDiscount && (
              <span className="bg-gradient-to-r from-rose-600 to-red-500 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md animate-pulse">
                -{discountPercent}%
              </span>
            )}
            {food.is_featured === 1 && (
              <span className="bg-gradient-to-r from-amber-500 to-orange-500 text-slate-950 text-[10px] font-black px-2 py-0.5 rounded-lg shadow-sm flex items-center gap-0.5">
                <Sparkles className="w-3 h-3" /> BEST SELLER
              </span>
            )}
          </div>

          {/* Rating Badge */}
          <div className="bg-white/95 backdrop-blur-md px-2.5 py-1 rounded-xl flex items-center gap-1 shadow-sm text-xs font-black text-slate-900 border border-slate-100">
            <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
            <span>{food.rating ? food.rating.toFixed(1) : '5.0'}</span>
          </div>
        </div>

        {/* Out of Stock Overlay */}
        {!food.is_available && (
          <div className="absolute inset-0 bg-black/70 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-black text-xs uppercase tracking-wider px-3.5 py-1.5 rounded-xl shadow-lg border border-rose-400">
              Tạm hết món
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between space-y-3">
        <div>
          {/* Metadata chips */}
          <div className="flex items-center gap-2 text-[11px] font-bold text-slate-400 mb-1.5 flex-wrap">
            <span className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-0.5 rounded-md border border-amber-200/50">
              <Clock className="w-3 h-3 text-amber-600" />
              {food.prep_time || 15}p
            </span>
            {food.spicy_level > 0 && (
              <span className="flex items-center gap-0.5 bg-rose-50 text-rose-600 px-2 py-0.5 rounded-md border border-rose-200/50">
                <Flame className="w-3 h-3 fill-rose-500" />
                {food.spicy_level === 1 ? 'Cay nhẹ' : 'Cay nồng'}
              </span>
            )}
            {food.category_name && (
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 truncate max-w-[120px]">
                {food.category_name}
              </span>
            )}
          </div>

          <h3 className="font-extrabold text-slate-900 text-base sm:text-lg group-hover:text-amber-600 transition-colors line-clamp-1">
            {food.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {food.description || 'Món ngon chuẩn vị, nguyên liệu tươi sạch mỗi ngày.'}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
          <div>
            <div className="text-base sm:text-lg font-black bg-gradient-to-r from-orange-600 to-amber-600 bg-clip-text text-transparent">
              {formatVND(food.price)}
            </div>
            {hasDiscount && (
              <div className="text-xs text-slate-400 line-through font-medium">
                {formatVND(food.original_price)}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!food.is_available}
            className={`w-10 h-10 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
              food.is_available
                ? 'bg-gradient-to-tr from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-slate-950 shadow-orange-500/20 active:scale-90 hover:scale-105 font-black'
                : 'bg-slate-100 text-slate-400 cursor-not-allowed'
            }`}
            title="Thêm vào giỏ hàng"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
