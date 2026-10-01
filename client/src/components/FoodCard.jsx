import React from 'react';
import { Plus, Star, Clock, Flame } from 'lucide-react';
import { formatVND } from '../utils/vietnamData';
import { useCart } from '../context/CartContext';
import { useToast } from './Toast';

export default function FoodCard({ food, onOpenDetail }) {
  const { addToCart, storeSettings } = useCart();
  const { showToast } = useToast();

  const handleQuickAdd = (e) => {
    e.stopPropagation();
    if (storeSettings && storeSettings.is_currently_open === false) {
      showToast(
        `Quán hiện đang TẠM NGHỈ (${storeSettings.open_time || '08:00'} - ${storeSettings.close_time || '23:00'}), tạm thời chưa nhận đơn mới!`,
        'error',
        5000
      );
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
      className="group relative bg-white rounded-3xl overflow-hidden border border-slate-100 shadow-sm hover:shadow-xl hover:border-orange-200 transition-all duration-300 flex flex-col cursor-pointer"
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
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ease-out"
          loading="lazy"
        />

        {/* Gradient overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Discount Badge */}
        {hasDiscount && (
          <div className="absolute top-3 left-3 bg-red-600 text-white text-[11px] font-black px-2.5 py-1 rounded-xl shadow-md">
            -{discountPercent}%
          </div>
        )}

        {/* Rating Badge */}
        <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2 py-1 rounded-xl flex items-center gap-1 shadow text-xs font-bold text-slate-800">
          <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{food.rating ? food.rating.toFixed(1) : '5.0'}</span>
        </div>

        {/* Out of Stock Overlay */}
        {!food.is_available && (
          <div className="absolute inset-0 bg-black/65 backdrop-blur-xs flex items-center justify-center">
            <span className="bg-rose-600 text-white font-black text-xs uppercase tracking-wider px-3 py-1.5 rounded-xl shadow-lg">
              Tạm hết món
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 sm:p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata chips */}
          <div className="flex items-center gap-2 text-[11px] font-semibold text-slate-400 mb-1.5">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-orange-400" />
              {food.prep_time || 15}p
            </span>
            {food.spicy_level > 0 && (
              <span className="flex items-center gap-0.5 text-rose-500">
                <Flame className="w-3 h-3 fill-rose-500" />
                {food.spicy_level === 1 ? 'Cay nhẹ' : 'Cay nồng'}
              </span>
            )}
            {food.category_name && (
              <span className="bg-slate-100 px-2 py-0.5 rounded-md text-slate-600 truncate max-w-[110px]">
                {food.category_name}
              </span>
            )}
          </div>

          <h3 className="font-bold text-slate-900 text-base sm:text-lg group-hover:text-orange-600 transition-colors line-clamp-1">
            {food.name}
          </h3>

          <p className="text-xs text-slate-500 line-clamp-2 mt-1 leading-relaxed">
            {food.description || 'Món ngon chuẩn vị, nguyên liệu tươi sạch mỗi ngày.'}
          </p>
        </div>

        {/* Price & Action Button */}
        <div className="mt-4 pt-3 border-t border-slate-50 flex items-center justify-between">
          <div>
            <div className="text-base sm:text-lg font-extrabold text-orange-600">
              {formatVND(food.price)}
            </div>
            {hasDiscount && (
              <div className="text-xs text-slate-400 line-through">
                {formatVND(food.original_price)}
              </div>
            )}
          </div>

          <button
            onClick={handleQuickAdd}
            disabled={!food.is_available}
            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-2xl flex items-center justify-center transition-all duration-200 shadow-md ${
              food.is_available
                ? 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/25 active:scale-90 hover:scale-105'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            title="Thêm vào giỏ"
          >
            <Plus className="w-5 h-5 stroke-[2.5]" />
          </button>
        </div>
      </div>
    </div>
  );
}
